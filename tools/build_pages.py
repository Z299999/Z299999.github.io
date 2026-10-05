#!/usr/bin/env python3
"""Give every panel of index.html a real path.

index.html is one page with six panels; site.js shows one at a time. That is
fine in a browser but not in a chat: paste shzhang.com/#writing into WeChat or
iMessage and the preview bot fetches the page WITHOUT the fragment (a "#..."
never leaves the browser), so every shared link previews as the Home page, and
Google indexes one page instead of six.

This writes a copy of index.html per panel -- /research/index.html,
/films/index.html, ... -- in which that panel is already active in the HTML
and the <head> carries that panel's own title, description, canonical URL and
Open Graph tags. Once loaded, site.js keeps switching panels in place and pushes
the matching path, so the site still feels like one page.

index.html stays the only source. Re-run this after editing it:

    python3 tools/build_pages.py

build_gallery.py calls it for you whenever it rewrites index.html.
"""
import os
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(REPO, "index.html")
SITE = "https://shzhang.com"

START, END = "<!-- PAGE META START -->", "<!-- PAGE META END -->"

# One entry per panel that gets its own path. "home" is index.html itself and
# keeps the meta block written there by hand. Descriptions are what a search
# result or a chat preview shows under the title -- keep them under ~160 chars.
# `image` is the Open Graph picture; swap any of them for something better.
PAGES = {
    "research": {
        "title": "Research — Shuheng Zhang",
        "description": "Shuheng Zhang's research: PDE control, machines that learn "
                       "to learn, survival-driven robots, and one architecture for "
                       "intelligent control. Two projects run live.",
        "image": "assets/img/research/hexapod-terrain-og.jpg",  # JPEG copy: preview bots are not all WebP-aware
    },
    "films": {
        "title": "Film — Shuheng Zhang",
        "description": "Documentary and creative films by Shuheng Zhang: Echos, "
                       "Current, and Plant Pears for Your Heirs.",
        "image": "assets/img/profile/profile.jpg",
    },
    "photography": {
        "title": "Photography — Shuheng Zhang",
        "description": "Photographs by Shuheng Zhang.",
        "image": "assets/img/profile/profile.jpg",
    },
    "writing": {
        "title": "Writing — Shuheng Zhang",
        "description": "Essays by Shuheng Zhang on Medium: on knowledge, "
                       "language, learning, and mathematics.",
        "image": "assets/img/profile/profile.jpg",
    },
    "life": {
        "title": "Life — Shuheng Zhang",
        "description": "Van life, travel, and the road: Shuheng Zhang's "
                       "self-built Chevy Express camper and the life around it.",
        "image": "assets/img/profile/profile.jpg",
    },
}


def meta_block(path, title, description, image):
    url = f"{SITE}{path}"
    img = f"{SITE}/{image}"
    return "\n".join([
        START,
        f"    <title>{title}</title>",
        f'    <meta name="description" content="{description}">',
        f'    <link rel="canonical" href="{url}">',
        f'    <meta property="og:type" content="website">',
        f'    <meta property="og:site_name" content="Shuheng Zhang">',
        f'    <meta property="og:title" content="{title}">',
        f'    <meta property="og:description" content="{description}">',
        f'    <meta property="og:url" content="{url}">',
        f'    <meta property="og:image" content="{img}">',
        f'    <meta name="twitter:card" content="summary_large_image">',
        f"    {END}",
    ])


def absolutize(html):
    """Relative hrefs/srcs resolve against /research/ in a sub-page, so make
    them root-absolute. External, absolute, fragment, mailto and empty values
    are left alone. index.html is written root-absolute already (see the note
    in its <head>), so this is a safety net for anything that slips in."""
    return re.sub(r'\b(href|src)="(?!(?:https?:|/|#|mailto:|"))', r'\1="/', html)


def build(quiet=False):
    src = open(INDEX, encoding="utf-8").read()
    if START not in src or END not in src:
        raise SystemExit("index.html has no PAGE META START/END markers")

    written = []
    for pid, cfg in PAGES.items():
        path = f"/{pid}/"
        html = src

        # the <head>: this page's own title, description, canonical, OG
        html = re.sub(re.escape(START) + r".*?" + re.escape(END),
                      lambda _: meta_block(path, cfg["title"], cfg["description"], cfg["image"]),
                      html, count=1, flags=re.DOTALL)

        # the panel is active in the HTML itself, so it shows before JS runs
        # (and with JS off), and the sidebar marks it. Home is the one
        # index.html marks, so un-mark it first.
        html = html.replace('<section class="panel is-active" id="home"', '<section class="panel" id="home"', 1)
        html = html.replace('<a href="/" data-panel="home" class="is-active">', '<a href="/" data-panel="home">', 1)
        html, n = re.subn(rf'<section class="panel" id="{pid}"',
                          f'<section class="panel is-active" id="{pid}"', html, count=1)
        assert n == 1, f"panel {pid} not found"
        html, n = re.subn(rf'(<a href="{path}" data-panel="{pid}")>',
                          r'\1 class="is-active">', html, count=1)
        assert n == 1, f"sidebar link for {pid} not found"

        # the active panel's figures and posters load at once rather than lazily:
        # they are in the viewport from the first paint, and lazy loading only
        # delays them (and in Safari sometimes forgets them). Galleries stay lazy.
        def eager(m):
            return re.sub(r'loading="lazy"', 'loading="eager"', m.group(0))
        html = re.sub(rf'<section class="panel is-active" id="{pid}".*?</section>',
                      lambda m: re.sub(r'<img class="(?:entry__img|film__poster)"[^>]*>', eager, m.group(0)),
                      html, count=1, flags=re.DOTALL)

        # body classes site.js would otherwise add on first paint
        classes = []
        if pid == "photography":
            classes.append("theme-dark")
        panel = re.search(rf'<section class="panel is-active" id="{pid}".*?</section>', html, re.DOTALL).group(0)
        if 'class="photo-grid"' in panel:
            classes.append("gallery-wide")
        if classes:
            html = html.replace("<body>", f'<body class="{" ".join(classes)}">', 1)

        html = absolutize(html)

        out_dir = os.path.join(REPO, pid)
        os.makedirs(out_dir, exist_ok=True)
        out = os.path.join(out_dir, "index.html")
        open(out, "w", encoding="utf-8").write(html)
        written.append(out)

    # a sitemap, so a search engine learns the six pages exist
    urls = ["/"] + [f"/{pid}/" for pid in PAGES] + ["/van/"]
    sitemap = ['<?xml version="1.0" encoding="UTF-8"?>',
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    sitemap += [f"  <url><loc>{SITE}{u}</loc></url>" for u in urls]
    sitemap.append("</urlset>\n")
    open(os.path.join(REPO, "sitemap.xml"), "w", encoding="utf-8").write("\n".join(sitemap))

    if not quiet:
        for w in written:
            print("wrote", os.path.relpath(w, REPO))
        print("wrote sitemap.xml")
    return written


if __name__ == "__main__":
    build()
