#!/usr/bin/env python3
"""Build the Photography gallery for the website.

The processed images in assets/img/photography/ ARE the gallery; they are the
source of truth. tools/gallery.json is a sidecar manifest recording, for each
image, its capture date and dimensions (so the original full-res files can be
deleted after they're added — they are never needed again).

Images are named by a stable, ever-increasing id assigned when they are added
(p0001.jpg, p0002.jpg, ...): a new photo takes max(existing) + 1 and existing
files are NEVER renamed. A filename's content therefore never changes, so
browser caches never serve a stale image. Display order is the order of the
<figure> list in index.html (newest capture date first); filenames are
unrelated to display order.

Usage:
  python3 tools/build_gallery.py add PATH [PATH ...]
      Process the given originals, de-duplicate them (perceptual hash) against
      the current gallery and each other, add them, and regenerate everything.
  python3 tools/build_gallery.py rebuild
      Regenerate the manifest order + figures from the existing images
      (use after manually editing/reordering gallery.json).

Pipeline per photo: apply EXIF orientation, convert to RGB, downscale so the
long edge is 1800px, save JPEG q82 (EXIF/XMP/GPS metadata stripped). Sorted newest->oldest
by capture date (EXIF DateTimeOriginal, falling back to file mtime). The
<figure> list is injected into the .photo-grid in index.html.

After running: git add assets/img/photography index.html tools && push.
If a push fails with HTTP 400, run: git config http.postBuffer 524288000
"""
import os
import re
import sys
import glob
import json
from datetime import datetime

from PIL import Image, ImageOps
from PIL.ExifTags import TAGS

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(REPO, "tools", "gallery.json")
OUT = os.path.join(REPO, "assets", "img", "photography")
INDEX = os.path.join(REPO, "index.html")

LONG_EDGE = 1800
QUALITY = 82
DHASH_THRESHOLD = 8  # Hamming distance <= this => treated as the same photo


def dhash(path, size=8):
    """64-bit difference hash; robust to resizing and re-compression."""
    img = Image.open(path).convert("L").resize((size + 1, size), Image.LANCZOS)
    px = list(img.getdata())
    bits = 0
    for r in range(size):
        row = px[r * (size + 1):(r + 1) * (size + 1)]
        for c in range(size):
            bits = (bits << 1) | (1 if row[c] > row[c + 1] else 0)
    return bits


def hamming(a, b):
    return bin(a ^ b).count("1")


def capture_dt(path):
    """EXIF capture time, falling back to the file's modified time."""
    try:
        exif = Image.open(path)._getexif() or {}
        m = {TAGS.get(k, k): v for k, v in exif.items()}
        s = m.get("DateTimeOriginal") or m.get("DateTimeDigitized") or m.get("DateTime")
        if s:
            return datetime.strptime(s[:19], "%Y:%m:%d %H:%M:%S")
    except Exception:
        pass
    return datetime.fromtimestamp(os.path.getmtime(path))


def strip_jpeg_metadata(path):
    """Losslessly remove APP1 (EXIF + XMP) segments from a JPEG in place.
    Only metadata segments are dropped; pixel data is not re-encoded."""
    data = open(path, "rb").read()
    out = bytearray(data[:2])  # SOI (FFD8)
    i = 2
    while i < len(data) - 1 and data[i] == 0xFF:
        marker = data[i + 1]
        if marker in (0xD9, 0xDA):  # EOI / start of scan -> copy the rest verbatim
            out += data[i:]
            break
        seglen = (data[i + 2] << 8) | data[i + 3]
        if marker != 0xE1:  # keep everything except APP1 (EXIF/XMP)
            out += data[i:i + 2 + seglen]
        i += 2 + seglen
    open(path, "wb").write(out)


def process(src, dst):
    """Resize + compress one original into dst. Returns (w, h)."""
    im = ImageOps.exif_transpose(Image.open(src))
    if im.mode != "RGB":
        im = im.convert("RGB")
    w, h = im.size
    scale = min(1.0, LONG_EDGE / max(w, h))
    if scale < 1.0:
        w, h = round(w * scale), round(h * scale)
        im = im.resize((w, h), Image.LANCZOS)
    im.info.pop("xmp", None)
    im.save(dst, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    strip_jpeg_metadata(dst)  # belt-and-suspenders: ensure no EXIF/XMP remains
    return w, h


def parse_id(filename):
    m = re.match(r"p(\d+)\.jpg$", filename)
    return int(m.group(1)) if m else 0


def next_id(entries):
    return max((parse_id(e["file"]) for e in entries), default=0) + 1


def load_manifest():
    if os.path.exists(MANIFEST):
        return json.load(open(MANIFEST))
    return []


def finalize(entries):
    """entries: list of {file, date, w, h}; files already live in OUT.
    Sorts newest first, writes the manifest + figures, removes orphan files."""
    entries.sort(key=lambda e: e["date"], reverse=True)

    json.dump(
        [{"file": e["file"], "date": e["date"], "w": e["w"], "h": e["h"]} for e in entries],
        open(MANIFEST, "w"), ensure_ascii=False, indent=2,
    )

    figs = [
        f'            <figure class="photo"><img src="assets/img/photography/{e["file"]}" '
        f'width="{e["w"]}" height="{e["h"]}" loading="lazy" alt=""></figure>'
        for e in entries
    ]
    html = open(INDEX).read()
    grid = '<div class="photo-grid">\n' + "\n".join(figs) + "\n          </div>"
    html2, n = re.subn(r'<div class="photo-grid">.*?</div>', grid, html, count=1, flags=re.DOTALL)
    if n != 1:
        raise SystemExit('Could not find <div class="photo-grid"> ... </div> in index.html')
    open(INDEX, "w").write(html2)

    keep = {e["file"] for e in entries}
    removed = 0
    for f in glob.glob(os.path.join(OUT, "*.jpg")):
        if os.path.basename(f) not in keep:
            os.remove(f)
            removed += 1

    total = sum(os.path.getsize(os.path.join(OUT, e["file"])) for e in entries)
    if entries:
        print(
            f"gallery: {len(entries)} photos, {total / 1e6:.1f} MB"
            + (f" ({removed} orphan file(s) removed)" if removed else "")
            + f", {entries[0]['date'][:10]} (newest) .. {entries[-1]['date'][:10]} (oldest)"
        )


def add(paths):
    entries = load_manifest()
    existing_hashes = [dhash(os.path.join(OUT, e["file"])) for e in entries]
    new_hashes = []
    n = next_id(entries)
    added = 0
    for p in paths:
        if not os.path.exists(p):
            print("MISSING  ", p)
            continue
        h = dhash(p)
        dg = min((hamming(h, eh) for eh in existing_hashes), default=99)
        dn = min((hamming(h, nh) for nh in new_hashes), default=99)
        if dg <= DHASH_THRESHOLD or dn <= DHASH_THRESHOLD:
            where = "gallery" if dg <= DHASH_THRESHOLD else "this batch"
            print("SKIP dup ", os.path.basename(p), f"(already in {where})")
            continue
        name = f"p{n:04d}.jpg"
        n += 1
        w, ht = process(p, os.path.join(OUT, name))
        entries.append({"file": name, "date": capture_dt(p).isoformat(), "w": w, "h": ht})
        existing_hashes.append(h)
        new_hashes.append(h)
        added += 1
        print("ADD      ", os.path.basename(p), capture_dt(p).strftime("%Y-%m-%d"), "->", name)
    if not added:
        print("nothing new to add.")
        return
    finalize(entries)


def rebuild():
    finalize(load_manifest())


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "rebuild"
    if cmd == "add":
        if len(sys.argv) < 3:
            raise SystemExit("usage: build_gallery.py add PATH [PATH ...]")
        add(sys.argv[2:])
    elif cmd == "rebuild":
        rebuild()
    else:
        print(__doc__)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
