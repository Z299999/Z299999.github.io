# Prompt: Process photos for the Photography gallery

Use this when I give you a folder of full-resolution photos to add to the
Photography section of the website (`index.html`, panel `#photography`).

## Goal

Turn a folder of large originals into web-ready images, ordered by capture
time, and render them into the existing masonry gallery + lightbox.

## Inputs I will give you

- A source folder of photos (e.g. `~/Desktop/<something>selected`).
- Whether this **replaces** the current gallery or **adds** to it (default: replaces).

## Processing rules (do exactly this)

1. **Order by EXIF capture time, newest first.**
   - Read `DateTimeOriginal` (fall back to `DateTimeDigitized`, then `DateTime`,
     then the file mtime) with Python + Pillow — do **not** trust the file's
     modified date, it reflects export/edit time, not when it was shot.
   - Sort descending: newest → oldest.

2. **Resize + compress each image.**
   - Apply EXIF orientation first (`PIL.ImageOps.exif_transpose`), then convert
     to RGB.
   - Downscale so the **long edge = 1800px** (never upscale).
   - Save JPEG, **quality 82**, `optimize=True`, `progressive=True`.
   - Saving via Pillow drops EXIF/GPS — keep it that way (privacy + size).

3. **Rename in date order:** `p01.jpg` (newest) … `pNN.jpg` (oldest).
   Zero-pad to 2 digits. Write to `assets/img/photography/`.

4. **Generate the gallery markup.** One line per photo, in order:
   ```html
   <figure class="photo"><img src="assets/img/photography/pNN.jpg" width="W" height="H" loading="lazy" alt=""></figure>
   ```
   - `W`/`H` are the **resized** dimensions (needed: the JS masonry uses them to
     predict column heights; `loading="lazy"` keeps the page light).
   - Inject these as the inner HTML of `<div class="photo-grid"> … </div>` in
     `index.html` (replace whatever is there).

5. **Do not touch the layout/lightbox code.** The masonry (ordered,
   shortest-column packing → top-to-bottom is new→old) and the lightbox already
   live in `assets/js/site.js` / `assets/css/site.css`. Only regenerate the
   `<figure>` list and the image files.

6. **Bump the cache version.** Increment `?v=N` on the `site.css` / `site.js`
   tags in `index.html` if you changed CSS/JS (not needed for image-only changes,
   but bump if in doubt).

7. **Commit & push.** Many images can exceed git's default HTTP buffer; if the
   push fails with `HTTP 400` / `unexpected disconnect`, run
   `git config http.postBuffer 524288000` and push again.

## Reference parameters

| Setting          | Value                              |
|------------------|------------------------------------|
| Long edge        | 1800 px                            |
| JPEG quality     | 82 (optimize + progressive)        |
| Metadata         | stripped (no EXIF/GPS)             |
| Naming           | `p01`…`pNN`, newest → oldest       |
| Output dir       | `assets/img/photography/`          |
| Figure markup    | `loading="lazy"`, `width`/`height` set |

Typical result: ~0.3 MB/photo (e.g. 80 photos ≈ 25 MB total, down from ~700 MB).

## Notes

- **Deleting a photo:** remove its `pNN.jpg` and its `<figure>` line. A gap in
  the numbering (e.g. p54 → p56) is fine — it's invisible to users; don't
  renumber everything.
- **A photo with no EXIF date** falls back to file mtime; tell me which one and
  where it landed so I can confirm its position.
- **Reproducible script:** the processing is a short Python (Pillow) script —
  iterate the source `*.jpg`, sort by capture date desc, `exif_transpose` →
  RGB → resize long-edge 1800 → save q82, write `pNN.jpg`, and emit the
  `<figure>` lines.
