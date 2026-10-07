# AGENTS.md — shzhang.com, for whichever agent picks this up

Written 2026-10-06 at the end of a long Claude Code session, for Codex or
anyone else. The repo's own files are the source of truth; this is the map.
The owner's house rules for everything under `~/Documents` are in
`~/Documents/AGENTS.md` (Chinese); the ones that bite here are repeated below.

## 30 seconds

1. `git status --short` and `git log --oneline | head`. Last session ended at
   `7fec413`; local and `origin/main` were equal and the tree clean.
2. `TODO.md` — everything that is waiting on a date, a publication or a fact.
3. **Pushing to `main` publishes the site** (GitHub Pages, custom domain
   `shzhang.com`, ~1 min). The owner wants to say "push" before anything visible
   changes. Commit locally freely; push on their word. Something on this
   machine (probably the IDE's git sync) pushed once without anyone asking —
   check `origin/main` before assuming the live site matches your head.
4. After a push, verify live with `curl` and a cache-buster (`?cb=$RANDOM`);
   GitHub Pages caches for 10 min (`max-age=600`).

## How the site is built

- **One page, six paths.** `index.html` holds every panel (Home, Research,
  Film, Photography, Writing, Life). `tools/build_pages.py` copies it to
  `/research/`, `/films/`, `/photography/`, `/writing/`, `/life/` with that
  panel active and its own `<head>` (title, description, canonical, Open
  Graph). **Edit `index.html`, never the copies, then run
  `python3 tools/build_pages.py`** and commit the copies with it.
  `assets/js/site.js` switches panels in place (pushState to the real path;
  old `/#research` links still work). `<base href="/">` in `index.html` is
  load-bearing: without it, lazy images break after an in-page switch.
- **Galleries** (Photography, Life, Van): `tools/build_gallery.py add --gallery
  {photography|life|vanlife} <originals…>` then it rebuilds the markup. Stable
  ids (`p0170.jpg`, `l0058.jpg`, `v0129.jpg`) are never renamed; order comes
  from the manifest (`tools/*.json`), newest first. Give it **originals** — it
  resizes to 1800 px / JPEG q82 and strips EXIF; never pre-compress. The van
  gallery has de-duplication **off** and is sectioned (`tools/van_sections.json`;
  each photo's `section` is set by hand in `tools/vanlife.json`, then
  `rebuild --gallery vanlife`). `prompt/photo-gallery-processing.md` predates
  this tool and is superseded by it.
- **Research figures**: one banner per project, 2400 px wide, WebP q90, never
  upscaled; every entry paragraph under 90 words, every `<figcaption>` under
  40. The rules are an HTML comment above the Research entries in
  `index.html`; where each figure's master lives and how it was cut is
  `tools/FIGURES.md`. A figure is a sample of the real thing — a real render,
  capture or plot — never an illustration.
- **News on Home**: rules in the HTML comment above the table. A row earns its
  place if it would still be true with no website; confirmed future events are
  allowed with an `Upcoming:` prefix; the newest essay replaces the essay row;
  a row's link goes where the reader who clicked it wants to go (two consoles
  are behind a Cloudflare Access login, so they link inward to Research).
- **Styles/JS cache**: `site.css?v=N` and `site.js?v=N` in `index.html` (and
  `van/index.html` for the CSS) — bump `N` when you change either.
- `cv/` is gitignored except `resume.pdf`; `cv/NOTES.md` is the owner's
  private master record and lives only on this machine. Don't publish it.

## What is deliberately hidden or pending

- The Research entry *Obtaining High-quality Panorama from Videos* (EIE4512,
  CUHK-Shenzhen 2022, with Songlin Zhao) is written, banner and all, inside an
  HTML comment marked `HIDDEN` in `index.html`. Its code lives in the private
  repo `Z299999/eie4512-panorama-from-video` (local clone
  `~/Documents/Github/eie4512-panorama-from-video`, tidied from the co-author's
  `thiefCat/EIE4512_pano_proj`; the OneDrive copy of that original is untouched
  on purpose). Unhide only when the owner says so; `TODO.md` has the steps.
- Everything else pending is in `TODO.md`, each with its trigger.

## Working with the owner

- Converse in Chinese; write code, commits and repo docs in English.
- For anything that is a design or content decision, discuss first with
  concrete options and a recommendation; implement on a clear go. Show
  previews (a PNG on the Desktop works) before publishing visual changes.
- Never invent facts for the site — dates, venues, titles come from the
  owner, their CV notes, or a source you fetched and can cite. When
  something cannot be verified, say so and leave it out.
- Report outcomes plainly; if a step failed or was skipped, say which.

## Red lines from `~/Documents/AGENTS.md` that apply here

- Deletions go to `~/Documents/_ToDelete_<date>/` for the owner to confirm;
  never `rm` their files. (Files the build tools own, like orphaned gallery
  images, are the tools' business.)
- Git projects live under `~/Documents/Github/`; never work on a repo inside
  OneDrive/iCloud, clone it out instead.
- Hand-offs to other repos go through that repo's inbox with a same-named
  `.md` explaining origin, never straight into its structure.
- Renewable artifacts may be deleted only with the rebuild method written
  down (this is why `tools/FIGURES.md` exists).

## This machine

- No `gh`, `timeout`, `pngquant`, `cwebp`, ImageMagick or `pdftoppm`.
  Python 3.12 with Pillow (WebP ok), numpy, OpenCV 4.11 (SIFT), MuJoCo 3.11.
  `git-filter-repo` is installed. PDFs/SVGs rasterise with
  `qlmanage -t -s <px> -o <dir> file.pdf`.
- `git push` to GitHub works through the macOS keychain
  (`credential.helper = osxkeychain`, account Z299999, scope `repo`); it was
  enough to create a private repo through the API from a script. Never print
  or persist that token.
- Headless Chrome (`/Applications/Google Chrome.app/…`): screenshots work but
  the process **does not exit** — start it in its own process group, wait for
  the file to appear and stop growing, then `killpg`. `--dump-dom` over
  `http://` hangs; `file://` is fine. Window width is clamped to 500 CSS px.
  To test `site.js` logic, a small fake DOM in Node is more reliable than a
  browser.
- Sister repos: Hexapod lives in `~/Documents/Github/memory_lm/experiments/
  exp0815_embodiedRobot` (finished; successor `exp0922`), Longview in
  `~/Documents/Github/financeCode` (branch `ui/graph-multi-select` carries the
  cmd-click multi-select used for the Research figure), both fronted by
  `~/Documents/Github/shzhang_web`. The newest code for both is on the Mac
  mini; the laptop copies are enough to read.
