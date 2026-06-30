#!/usr/bin/env python3
"""Build the photo galleries for the website.

There are two galleries, each a panel in index.html with its own image folder
and manifest:

  photography  -> assets/img/photography/ , tools/gallery.json , prefix "p"
  life         -> assets/img/life/        , tools/life.json    , prefix "l"

For each gallery the processed images plus its manifest (per-photo capture date
+ dimensions) are the source of truth; the original full-res files are only
needed at import time and can be deleted afterwards.

Images are named by a stable, ever-increasing id (p0001.jpg / l0001.jpg, ...):
a new photo takes max(existing) + 1 and existing files are NEVER renamed, so
browser caches never go stale. Display order is the order of the <figure> list
in index.html (newest capture date first); filenames are unrelated to order.

Usage:
  python3 tools/build_gallery.py add [--gallery NAME] PATH [PATH ...]
      Process originals, de-duplicate (perceptual hash) against that gallery and
      each other, add them, and regenerate. NAME defaults to "photography".
  python3 tools/build_gallery.py rebuild [--gallery NAME|all]
      Regenerate manifest order + figures from existing images.

Pipeline per photo: apply EXIF orientation, convert to RGB, downscale so the
long edge is 1800px, save JPEG q82, and strip all EXIF/XMP metadata. The
<figure> list is injected into the matching <div class="photo-grid"
data-gallery="NAME"> in index.html.

After running: git add assets/img index.html tools && push.
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
INDEX = os.path.join(REPO, "index.html")

GALLERIES = {
    "photography": {"dir": "assets/img/photography", "src": "assets/img/photography",
                    "manifest": "tools/gallery.json", "prefix": "p",
                    "page": "index.html", "order": "desc"},
    "life": {"dir": "assets/img/life", "src": "assets/img/life",
             "manifest": "tools/life.json", "prefix": "l",
             "page": "index.html", "order": "desc"},
    # Van build — its grid lives on the standalone /van/ page (not the homepage)
    "vanlife": {"dir": "assets/img/vanlife", "src": "../assets/img/vanlife",
                "manifest": "tools/vanlife.json", "prefix": "v",
                "page": "van/index.html", "order": "asc"},
}

LONG_EDGE = 1800
QUALITY = 82
DHASH_THRESHOLD = 8  # Hamming distance <= this => treated as the same photo


def dhash(path, size=8):
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
    try:
        exif = Image.open(path)._getexif() or {}
        m = {TAGS.get(k, k): v for k, v in exif.items()}
        s = m.get("DateTimeOriginal") or m.get("DateTimeDigitized") or m.get("DateTime")
        if s:
            return datetime.strptime(s[:19], "%Y:%m:%d %H:%M:%S")
    except Exception:
        pass
    return datetime.fromtimestamp(os.path.getmtime(path))


def camera_info(path):
    """(make, model) from EXIF, e.g. ('SONY','ILCE-7RM3') / ('Apple','iPhone 13 Pro').
    Stored in the manifest so photos can be classified (phone/camera/drone)
    even though the device info is stripped from the published image file."""
    try:
        exif = Image.open(path)._getexif() or {}
        t = {TAGS.get(k, k): v for k, v in exif.items()}
        return str(t.get("Make", "")).strip(), str(t.get("Model", "")).strip()
    except Exception:
        return "", ""


def strip_jpeg_metadata(path):
    """Losslessly remove APP1 (EXIF + XMP) segments from a JPEG in place."""
    data = open(path, "rb").read()
    out = bytearray(data[:2])  # SOI
    i = 2
    while i < len(data) - 1 and data[i] == 0xFF:
        marker = data[i + 1]
        if marker in (0xD9, 0xDA):  # EOI / start of scan -> copy rest verbatim
            out += data[i:]
            break
        seglen = (data[i + 2] << 8) | data[i + 3]
        if marker != 0xE1:  # keep everything except APP1
            out += data[i:i + 2 + seglen]
        i += 2 + seglen
    open(path, "wb").write(out)


def process(src, dst):
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
    strip_jpeg_metadata(dst)
    return w, h


def parse_id(filename):
    m = re.search(r"(\d+)", filename)
    return int(m.group(1)) if m else 0


def out_dir(name):
    return os.path.join(REPO, GALLERIES[name]["dir"])


def manifest_path(name):
    return os.path.join(REPO, GALLERIES[name]["manifest"])


def load_manifest(name):
    p = manifest_path(name)
    return json.load(open(p)) if os.path.exists(p) else []


def finalize(name):
    g = GALLERIES[name]
    out = out_dir(name)
    entries = load_manifest(name)
    entries.sort(key=lambda e: e["date"], reverse=(g.get("order", "desc") == "desc"))

    def keep(e):
        o = {"file": e["file"], "date": e["date"], "w": e["w"], "h": e["h"]}
        if e.get("make"):
            o["make"] = e["make"]
        if e.get("model"):
            o["model"] = e["model"]
        return o

    json.dump([keep(e) for e in entries], open(manifest_path(name), "w"), ensure_ascii=False, indent=2)

    figs = [
        f'            <figure class="photo"><img src="{g["src"]}/{e["file"]}" '
        f'width="{e["w"]}" height="{e["h"]}" loading="lazy" alt=""></figure>'
        for e in entries
    ]
    page = os.path.join(REPO, g["page"])
    html = open(page).read()
    block = f'<div class="photo-grid" data-gallery="{name}">\n' + "\n".join(figs) + "\n          </div>"
    pat = r'<div class="photo-grid" data-gallery="%s">.*?</div>' % name
    html2, n = re.subn(pat, block, html, count=1, flags=re.DOTALL)
    if n != 1:
        raise SystemExit(f'Could not find <div class="photo-grid" data-gallery="{name}"> in {g["page"]}')
    open(page, "w").write(html2)

    keep = {e["file"] for e in entries}
    removed = 0
    for f in glob.glob(os.path.join(out, "*.jpg")):
        if os.path.basename(f) not in keep:
            os.remove(f)
            removed += 1

    total = sum(os.path.getsize(os.path.join(out, e["file"])) for e in entries)
    if entries:
        print(
            f"{name}: {len(entries)} photos, {total / 1e6:.1f} MB"
            + (f" ({removed} orphan removed)" if removed else "")
            + f", {min(e['date'] for e in entries)[:10]} .. {max(e['date'] for e in entries)[:10]}"
        )
    else:
        print(f"{name}: 0 photos")


def add(name, paths):
    g = GALLERIES[name]
    out = out_dir(name)
    os.makedirs(out, exist_ok=True)
    entries = load_manifest(name)
    existing_hashes = [dhash(os.path.join(out, e["file"])) for e in entries]
    new_hashes = []
    n = max((parse_id(e["file"]) for e in entries), default=0) + 1
    added = 0
    for p in paths:
        if not os.path.exists(p):
            print("MISSING  ", p)
            continue
        h = dhash(p)
        dg = min((hamming(h, eh) for eh in existing_hashes), default=99)
        dn = min((hamming(h, nh) for nh in new_hashes), default=99)
        if dg <= DHASH_THRESHOLD or dn <= DHASH_THRESHOLD:
            where = name if dg <= DHASH_THRESHOLD else "this batch"
            print("SKIP dup ", os.path.basename(p), f"(already in {where})")
            continue
        name_jpg = f'{g["prefix"]}{n:04d}.jpg'
        n += 1
        make, model = camera_info(p)  # capture device BEFORE process() strips it
        w, ht = process(p, os.path.join(out, name_jpg))
        entry = {"file": name_jpg, "date": capture_dt(p).isoformat(), "w": w, "h": ht}
        if make:
            entry["make"] = make
        if model:
            entry["model"] = model
        entries.append(entry)
        existing_hashes.append(h)
        new_hashes.append(h)
        added += 1
        print("ADD      ", os.path.basename(p), capture_dt(p).strftime("%Y-%m-%d"), "->", name, name_jpg)
    if not added:
        print("nothing new to add.")
        return
    json.dump(entries, open(manifest_path(name), "w"), ensure_ascii=False, indent=2)
    finalize(name)


def parse_gallery_arg(args):
    name = "photography"
    rest = []
    i = 0
    while i < len(args):
        if args[i] == "--gallery":
            name = args[i + 1]
            i += 2
        else:
            rest.append(args[i])
            i += 1
    return name, rest


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "rebuild"
    name, rest = parse_gallery_arg(sys.argv[2:])
    if cmd == "add":
        if not rest:
            raise SystemExit("usage: build_gallery.py add [--gallery NAME] PATH [PATH ...]")
        add(name, rest)
    elif cmd == "rebuild":
        targets = list(GALLERIES) if (rest and rest[0] == "all") or name == "all" else [name]
        for t in targets:
            finalize(t)
    else:
        print(__doc__)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
