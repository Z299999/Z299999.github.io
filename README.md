# Personal website for Shuheng Zhang

Personal website for Shuheng Zhang — PhD Student @ UC San Diego.

**Live site:** [https://z299999.github.io](https://z299999.github.io)

A plain, static, single-page site (no Jekyll, no build step), styled after
classic academic homepages. A left sidebar lists the sections in two groups —
**About** (Home / Biography / Contact) and **Work & Life** (Research / Film /
Photography / Writing / Life) — and clicking one swaps the content panel on the
right. Opening **Photography** switches the whole page to a dark "cinema" theme.

---

## File Structure

```
Z299999.github.io/
├── index.html                  # The whole site: sidebar + switchable panels + lightbox
├── .nojekyll                   # Tells GitHub Pages to skip Jekyll, serve as-is
├── assets/
│   ├── css/site.css            # All styles (light theme + body.theme-dark cinema theme)
│   ├── js/site.js              # Panel switching, ordered photo masonry, lightbox
│   └── img/
│       ├── profile/profile.jpg # Profile photo (Home panel)
│       ├── films/              # Film posters
│       └── photography/        # Gallery images pNNNN.jpg (stable ids; order is by date)
├── tools/
│   ├── build_gallery.py        # Add/rebuild the Photography gallery
│   └── gallery.json            # Manifest: per-photo date + dimensions (source of truth)
├── pages/
│   └── research/eco-evo/demo/  # Standalone interactive simulation demo
│       ├── index.html          # Entry point (linked from Research panel)
│       ├── styles.css
│       ├── main.js             # Orchestrator
│       ├── sim/                # Simulation core (graph, step, input)
│       ├── ui/                 # Visual components (graph view, charts, controls)
│       └── README.md           # Demo documentation
└── README.md                   # This file
```

Note: `assets/css/site.css` and `assets/js/site.js` are loaded with a `?v=N`
query in `index.html` — bump `N` when you change either, to bust browser caches.

---

## How to Edit

- **Homepage content** — edit the panels directly in `index.html`. Each section
  is a `<section class="panel" id="…">`; the matching sidebar link uses
  `data-panel="…"`.
- **Styles** — `assets/css/site.css`. The cinema theme is the `body.theme-dark`
  block; `site.js` toggles that class while the Photography panel is open.
- **Photography gallery** — use the script below; don't hand-edit the figures.
- **Eco-evo demo** — see `pages/research/eco-evo/demo/README.md`.

---

## Photography gallery

The processed images in `assets/img/photography/` plus `tools/gallery.json`
(each photo's capture date + dimensions) are the source of truth. The original
full-resolution files are **only needed at import time** — once a photo is added
you can delete the original; the script never touches it again.

Each image gets a stable id filename (`p0001.jpg`, `p0002.jpg`, …): a new photo
takes `max(existing) + 1` and existing files are never renamed, so browser
caches never go stale. Display order is by capture date (the `<figure>` list in
`index.html`), independent of the filename.

Add photos (resizes to long-edge 1800px / JPEG q82, strips EXIF/GPS,
de-duplicates by perceptual hash, assigns the next id, sorts by capture date,
and regenerates the figures in `index.html`):

```bash
python3 tools/build_gallery.py add /path/to/photo1.jpg /path/to/photo2.jpg
git add assets/img/photography index.html tools && git push
# if a push fails with HTTP 400: git config http.postBuffer 524288000
```

`python3 tools/build_gallery.py rebuild` regenerates everything from the
existing images + manifest (e.g. after manually reordering `gallery.json`).

Photos load only when the Photography panel is opened (`loading="lazy"` + the
panel being hidden until clicked), so the gallery costs no bandwidth on Home.

---

## Local Preview

No tooling required — just open `index.html` in a browser. To preview exactly
as served (and to run the eco-evo demo, whose ES modules need a server):

```bash
python3 -m http.server 8000
# Site:  http://localhost:8000/
# Demo:  http://localhost:8000/pages/research/eco-evo/demo/
```

---

## Hosting

GitHub Pages, served straight from the `main` branch as static files
(`.nojekyll` disables the Jekyll build). Just push to deploy.
