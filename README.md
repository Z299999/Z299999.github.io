# Personal website for Shuheng Zhang

Personal website for Shuheng Zhang — PhD Student @ UC San Diego

**Live site:** [https://z299999.github.io](https://z299999.github.io)

---

## File Structure

```
Z299999.github.io/
├── _config.yml                 # Jekyll configuration
├── _data/
│   ├── films.yml               # (optional) film project data
│   └── publications.yml        # (optional) publication data
├── _includes/
│   └── custom-head.html        # Links custom CSS (minima hook)
├── _posts/                     # Blog posts (date-prefixed .md files)
│   ├── 2024-01-15-first-writing-post.md
│   └── 2024-02-01-vanlife-beginnings.md
├── assets/
│   ├── css/custom.css          # Custom styles (override minima)
│   ├── img/
│   │   ├── films/              # Film project images
│   │   ├── profile/            # Profile photos
│   │   └── van/                # Van life photos
│   └── js/main.js              # JavaScript (optional)
├── pages/                      # Subpages (permalinks hide /pages/ in URL)
│   └── research/
│       └── eco-evo/            # Eco-evolutionary Neural Ecosystem project
│           ├── index.md        # → /research/eco-evo/
│           ├── demo.html       # → /research/eco-evo/demo.html
│           ├── style.css       # Demo styles
│           └── viewer.js       # Demo logic
├── index.md                    # Home page
├── about.md                    # → /about/
├── research.md                 # → /research/
├── films.md                    # → /films/
├── writing.md                  # → /writing/
├── life.md                     # → /life/
└── README.md                   # This file
```

---

## Site Categories

| Category | Description | Posts Category |
|----------|-------------|----------------|
| Research | Academic work, notes, publications | `research` |
| Films | Documentary and creative projects | `films` |
| Writing | Essays, reflections, blog posts | `writing` |
| Life | Van life, travel, personal stories | `life` |

---

## How to Add Content

### New Blog Post (optional)
Create a file in `_posts/` with format `YYYY-MM-DD-title.md`:
```yaml
---
layout: post
title: "Your Title"
date: 2024-03-15
categories: [writing]  # or [life], [research], [films]
tags: [optional, tags]
---
Your content here...
```

### Eco-evo Demo Page
The interactive eco-evolutionary neural ecosystem lives under `pages/research/eco-evo/`:

- Edit project text in `pages/research/eco-evo/index.md`
- Edit the interactive demo in `pages/research/eco-evo/demo/`:
  - Structure and UI: `index.html`
  - Styles: `styles.css`
  - Orchestrator / logic: `main.js`
  - Simulation core: `sim/graph.js`, `sim/step.js`, `sim/input.js`
  - Visual components: files under `ui/` (graph view, charts, controls, stats)

All top-level sections (`research.md`, `films.md`, `writing.md`, `life.md`) are kept as simple, mostly static HTML pages; new subpages are only needed if you want additional project-specific sections like the eco-evo demo.

---

## Edit Log

| Date | Changes |
|------|---------|
| 2024-02-02 | Initial Jekyll structure created with 4 categories, sample posts, data files, and custom CSS |

---

## Local Development (Optional)

```bash
# Install dependencies
gem install bundler
bundle install

# Run local server
bundle exec jekyll serve

# View at http://localhost:4000
```

---

## Tech Stack

- **Framework:** Jekyll (GitHub Pages default)
- **Theme:** minima
- **Hosting:** GitHub Pages
- **No build tools required** — just push to main branch
