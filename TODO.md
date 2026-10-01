# TODO

Things this site is waiting on. Each one says what triggers it, so it can be
done without reconstructing the conversation it came from.

## Waiting on a date

- **After CDC (Dec 15–18, 2026) — drop the `Upcoming:` prefix.** The first
  News row on Home reads `Upcoming: presenting at the IEEE Conference on
  Decision and Control`. Once the talk has happened, rewrite it in the past
  tense and remove the prefix. The rule is in the House-rules comment above
  the News table in `index.html`.

## Waiting on something being published

- **arXiv link for the CDC paper.** When the preprint is posted, append the
  `Read paper →` link to the Research entry's `<h3>` — there is a TODO
  comment at the exact spot in `index.html` with the markup to use. Then
  reconsider the News row for `2026-07`: it currently points inward to
  `#research` *because* there is no public paper. Once there is one, the
  Research entry carries the arXiv link, so News can keep pointing inward
  (the entry then has the description, the figure **and** the paper) — but
  the reason will have changed, so check it rather than assume.

## Waiting on a fact only Shuheng has

- **AFCoNS talk title.** The `2026-07` News row says he presented at the
  inaugural African Control Systems Symposium but not what the talk was.
  With the title, the row can match the density of the CDC row.
  `cv/NOTES.md` has the same gap marked.

## Not this repo

- **CV: AFCoNS was a talk, not attendance.** `cv/resume.tex` lists it under
  *Conference Participation*, which shows the event and the date but not
  whether he spoke. A presentation usually warrants either a *Talks* section
  or a note on the entry. `cv/NOTES.md` has been corrected to `presented`
  already. Note `cv/` is gitignored except `resume.pdf`, so this lives only
  on the machine it is edited on.

## Open, no trigger

- **Preview images per page.** `tools/build_pages.py` sets the Open Graph image
  that WeChat / iMessage / LinkedIn show next to a shared link. Research uses
  the hexapod banner; Film, Photography, Writing and Life all fall back to the
  profile photo. Each could carry something of its own (a poster, a photograph,
  a van shot) — one line each in the `PAGES` dict at the top of that script.

- **Home News, 2026-08 is empty by design.** The old placeholder row was
  removed rather than filled; News does not need a row per month. Nothing to
  do unless something from that month turns out to be worth a row.
