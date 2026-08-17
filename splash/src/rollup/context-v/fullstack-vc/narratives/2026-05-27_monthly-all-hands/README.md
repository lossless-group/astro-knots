---
title: Narratives — 2026-05-27 Monthly All-Hands deck
date_created: 2026-05-27
date_modified: 2026-05-27
publish: true
from: fullstack-vc
from_path: narratives/2026-05-27_monthly-all-hands/README.md
---
<!-- Rolled up from fullstack-vc/context-v/narratives/2026-05-27_monthly-all-hands/README.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

# Narratives — 2026-05-27 Monthly All-Hands deck

One markdown file per slide. Frontmatter for structured fields the section component reads. Body for prose hints to whoever (you, future Claude) composes the layout.

## How to edit

- **Add a slide:** copy any existing file as `{NN}-{slug}.md`, increment the number, edit.
- **Remove a slide:** delete the file. Renumber if you want order to stay consecutive (not required — gaps are fine).
- **Reorder:** rename the files. Sort key is the `NN` prefix.
- **Change wording:** edit `headline` / `subhead` / `eyebrow` in frontmatter, edit prose in body. The section component reads the frontmatter; the body is for the composer.

## Body shape — keep terse

Four sections, one short paragraph or 2-3 bullets each:

- **What this slide is** — what does the audience see
- **Why it's here** — what role in the deck arc
- **What to surface** — the load-bearing content
- **Visual hierarchy suggestion** — opening hint for the layout author

## Frontmatter fields used

- `title` — internal working name (not necessarily what's shown)
- `eyebrow` / `headline` / `subhead` — the three lines almost every slide composes
- `compose` — optional, names an existing `Section__*` component the slide wraps
- `data_source` — optional, points to JSON/TS the slide pulls from
- Free-form fields per slide (presenters, agenda, questions, etc.) — let the slide tell you what it needs

## Source

Outline derived from the live session page:
**https://fullstack-vc.com/sessions/2026-05-27_monthly-all-hands**

Update the source page when content moves; these narrative files are the bridge between the session page and the deck composition.

## What slides exist (deck-overview)

01. Cover
02. What this is (FOMO highlights as teaser)
02a. **Data from previous surveys** — inserted carousel of cross-session signals (6 panels)
04. Format (the 6-step agenda)
05a. **Create your account** — precursor before the polls (unlocks Stacks + Polls + Working Groups & Projects)
05b. **The LPs as Co-Investors Conundrum** — pulse data (was slide 05)
05c. **From Yes to Win** — three breakouts framing (was slide 06)
06a. **Cortado demo · Claude Teams for Firm Impact** — Mike Moradi + Raeed Zainuddin (Cortado Ventures, joint demo)
06b. **Toby demo · OpenClaw + Obsidian for Pipeline** — Toby Rush (Ideem, solo demo)
07. Track 1 · Internal Conviction → IC
08. Track 2 · Syndicate to VCs
09. Track 3 · Offer to LPs
10. How the breakouts run (5 questions + one-pager artifact)
11. Are you willing AND able? (Q5, June 24 cohort)
12. Close (next session, links back)

### Notes on structure

- **No standalone slide 03** — the original "today's presenters" intro card was absorbed into 06a / 06b. Each demo gets its own title slot rather than a shared preview.
- **Demos sit AFTER account creation + interactive surfaces (05a-c)** — by the time the demos start, the audience has accounts and polls open, so they can react in real time rather than passively absorbing.
- **Toby Rush is back** as presenter for Demo 2 after being removed earlier in the day. If this stays, also re-add him to `src/content/sessions/2026-05-27_monthly-all-hands.md` frontmatter (presenters + presenterDetails) so the live session page matches.

### About the `Xa` / `Xb` / `Xc` slot suffixes

Inserted slides use letter suffixes (`02a`, `05a`, `05b`, `05c`) instead of renumbering everything downstream. The letter signals "this slot is part of a sub-family in the deck arc." Underscore separator (`_`) marks the sub-family files, hyphen separator (`-`) marks the base numbered slides. Both work; the convention is just visual scannability.
