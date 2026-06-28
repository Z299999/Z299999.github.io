# Personal website for Shuheng Zhang

Personal website for Shuheng Zhang — PhD Student @ UC San Diego.

**Live site:** [https://z299999.github.io](https://z299999.github.io)

A plain, static, single-page site (no Jekyll, no build step). The homepage
is a hand-written `index.html` with a left sidebar and click-to-switch
content panels (Home / Research / Films / Writing / Life / Contact).

---

## File Structure

```
Z299999.github.io/
├── index.html                  # The whole site: sidebar + switchable panels
├── .nojekyll                   # Tells GitHub Pages to skip Jekyll, serve as-is
├── assets/
│   ├── css/site.css            # All styles
│   ├── js/site.js              # Panel switching (click sidebar → show panel)
│   └── img/
│       ├── profile/profile.jpg # Profile photo (Home panel)
│       ├── films/              # Film posters
│       └── van/                # Van life photos
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

---

## How to Edit

- **Homepage content** — edit the panels directly in `index.html`. Each section
  is a `<section class="panel" id="…">`; the matching sidebar link uses
  `data-panel="…"`.
- **Styles** — `assets/css/site.css`.
- **Eco-evo demo** — see `pages/research/eco-evo/demo/README.md`.

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
