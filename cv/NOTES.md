# CV maintenance notes

Working record behind `resume.tex`. **`resume.tex` is the curated, public subset;
this file is the complete master list** — including things still in formulation,
under review, or deliberately held off the official CV.

When an item's status changes (e.g. a paper goes from *under review* → *accepted*),
update it here first, then decide whether to promote it into `resume.tex`.

Build the PDF: `cd cv && python3 build.py` (runs pdflatex twice, cleans aux files).
Needs `pdflatex` on PATH (`export PATH="/Library/TeX/texbin:$PATH"`).

**Status legend:** `idea` → `formulating` → `writing` → `under review` (a.k.a.
*waiting for approval*) → `accepted` → `published / presented`.
`On CV?` = whether it currently appears in `resume.tex`.

---

## Publications & manuscripts

| Work | Authors | Venue | Status | On CV? | Link | Notes |
|---|---|---|---|---|---|---|
| Predictor Feedback for an Age-Structured Population Model with Input Delay | S. Zhang, M. Diagne, M. Krstic | 2026 IEEE CDC, Honolulu, HI (Dec 15–18, 2026) | **accepted** (2026-07-15) | yes | [CDC 2026](https://cdc2026.ieeecss.org) | Was *under review / waiting for approval* until 2026-07-15. |
| Random Vortex Method for 2D Viscous Incompressible Flows | S. Zhang | M.Sc. thesis, University of Oxford, 2025 | published | yes | — | — |

<!-- Template row for a new manuscript:
| <title> | <authors> | <target venue> | under review | no | <submission/venue url> | submitted <date> -->

---

## Conference participation

| Event | When / where | Status | On CV? | Link | Notes |
|---|---|---|---|---|---|
| 2026 IEEE Conference on Decision and Control (CDC) | Dec 2026, Honolulu, HI, USA | presenting | yes | [site](https://cdc2026.ieeecss.org) | Presenting the accepted paper above. |
| African Control Systems Symposium (AFCoNS), inaugural | Jul 14–16, 2026, AIMS Mbour, Senegal | attended | yes | [site](https://www.insync-lab.org/afcons) | Program Chair: M. Diagne (UCSD). |

---

## Projects in formulation / not (yet) on the CV

These are hidden in `resume.tex` under `\iffalse … \fi` (the "Relevant Projects"
block) or not written up at all. Promote to the CV when they mature into a
manuscript or a presentable result.

| Project | Context | Status | On CV? | Notes |
|---|---|---|---|---|
| Complex-Valued Framework for Nonlinear Opinion Dynamics | with Prof. Mamadou Diagne (UCSD) | formulating | no (hidden) | Complex Schrödinger-type opinion model; embeds NOD / Kuramoto / DeGroot. |
| Neural Tangent Kernel Graphs for Training Curricula | independent | formulating | no (hidden) | NTK as a weighted graph; curricula as optimal control of training dynamics. |
| Hierarchical Feature-Based Synthesis of a Brain Module | Oxford network-science project, 2025 | done | no (hidden) | Drosophila connectome; synthetic brains from modularity / Hodge-flow / centrality. |
| Lifted-Time Stable Inversion in Control Systems | supervised by Prof. Xiaoqiang Ji, 2024 | done | no (hidden) | Lifted-time formulation improving stable-inversion efficiency. |

To show the block: flip `\iffalse` → `\iftrue` above the `Relevant Projects`
`rSection` in `resume.tex`.

---

## Film festivals & awards

Fairly stable — mirrored from `resume.tex`. Add new selections here as they come in.

**Film festival participation** (newest first):
- *Current* — Fisheye International Film Festival — 2025, High Wycombe, UK
- *Guitar* — London International & British International Film Festivals — 2024, UK
- *Plant Pears for Your Heirs* — Luminar Film Festival — 2022, Shenzhen, China
  - ⚠️ Verify year: old CV listed the Luminar prize as 2020; film was produced 2021–22. Currently on CV as 2022.

**Awards** (newest first): see `resume.tex`. Held-back / minor items can be parked here
instead of cluttering the CV.
