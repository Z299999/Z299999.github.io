# Z299999.github.io

Personal website for shz — PhD Student @ UC San Diego

**Live site:** [https://z299999.github.io](https://z299999.github.io)

---

## File Structure

```
Z299999.github.io/
├── _config.yml                 # Jekyll configuration
├── _data/
│   ├── films.yml               # Film project data
│   └── publications.yml        # Publication data
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
│   ├── films/
│   │   └── echoes.md           # → /films/echoes/
│   ├── life/
│   │   └── vanlife.md          # → /life/vanlife/
│   ├── research/
│   │   ├── notes.md            # → /research/notes/
│   │   └── publications.md     # → /research/publications/
│   └── writing/
│       └── medium.md           # → /writing/medium/
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

### New Blog Post
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

### New Subpage
Create a file in `pages/<category>/your-page.md`:
```yaml
---
layout: page
title: "Page Title"
permalink: /category/your-page/
---
Your content here...
```

### Add Publication
Edit `_data/publications.yml`:
```yaml
- title: "Paper Title"
  authors: "Author, A. & Author, B."
  venue: "Conference Name"
  year: 2024
  link: "https://..."
```

### Add Film Project
Edit `_data/films.yml`:
```yaml
- title: "Film Title"
  logline: "One-line description"
  status: "In Development"
  link: "/films/your-film/"
```

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
