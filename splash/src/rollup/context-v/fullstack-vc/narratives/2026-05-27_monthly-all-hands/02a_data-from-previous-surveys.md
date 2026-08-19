---
title: What the room has told us
eyebrow: Pre-session signals · across April 29 + May 27 registrations
headline: 60+ registered. 40 surveyed. 56 firms across two sessions. Here's what they told us.
subhead: Six quick views, ~15 seconds each. Auto-advance or arrow through. ←/→ within this slide.
slug: data-from-previous-surveys
inserted_at: between 02-what-this-is and 03-presenters (no renumber)
data_sources: null
compose_recommendation: One slide with internal carousel — six panels, each composing an existing Section__ component
secondary_option: Split into six files (02a, 02b, 02c, 02d, 02e, 02f) if carousel feels wrong when rendered
carousel_timing: 10-20 sec per panel; full sweep ≈ 90 sec
controls: ← / → cycle panels (within this slide only). ↑ / ↓ leave this slide for prev/next slide per the deck keyboard contract.
panels:
  - "n: 1"
date_created: 2026-05-27
date_modified: 2026-05-27
publish: true
site_uuid: ca123f14-004e-4449-a033-f0d12768f553
hex_code: txuczj
date_authored_initial_draft: 2026-05-27
date_authored_current_draft: 2026-05-27
from: fullstack-vc
from_path: narratives/2026-05-27_monthly-all-hands/02a_data-from-previous-surveys.md
---
<!-- Rolled up from fullstack-vc/context-v/narratives/2026-05-27_monthly-all-hands/02a_data-from-previous-surveys.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

## What this slide GROUP is

One slide that flips through **six panels** of cross-session data — the **April 29 launch survey results** (rich JSON, 40 responses) and the **May 27 registration roll-up** (combined firm list across both sessions).

Each panel composes an existing `Section__*` component the site already ships — the same components rendered on the April 29 session page itself. Total flip time ≈ 90 seconds.

The audience experiences it as one moment ("here's the room across two sessions") with six visual beats inside it — not six separate slides.

Source pages for cross-reference:
- https://fullstack-vc.com/sessions/2026-04-29_agentic-vc-dojo-launch — April 29 session page with the original Section__ rendering.
- https://fullstack-vc.com/sessions/2026-05-27_monthly-all-hands — current session page (today).

## Why it's here

VCs work solo, in tiny teams, or by themselves. They often have **no idea what's going on with peers** — what tools others are using, what workflows others are attempting, what's working, what isn't. This slide answers that quietly and credibly *with the audience's own data*.

It's also the seed for slide 05b (the LP conundrum) and the breakouts framing in slide 05c: by establishing that the room is in motion but not at the destination, the tension that "LPs want it but most firms aren't running the process" lands as a *known shared gap* rather than an abstract claim.

Inserted as 02a so 03 (presenters) onward doesn't need renumbering.

## What to surface

- **Carousel control:** small ‹ N / 6 › indicator at one corner (matching `DeckNav` shape from the deck chrome). ← / → cycle panels *within* this slide. ↑ / ↓ exit to prev/next slide per the deck keyboard contract — vertical keys leave the slide, horizontal keys move within it.
- **Auto-advance with manual override:** default to auto-advance per the `seconds` field in each panel's frontmatter, but pause on hover or on first manual keypress. Don't trap the audience in a carousel they can't escape.
- **Headline overlays per panel:** each panel has a `headline_overlay` field — that's the one-line takeaway the audience should remember even if they don't fully absorb the chart underneath. Put it large at the top of the panel; the chart lives below.
- **All charts render in all three modes (light / dark / vibrant).** The composed `Section__*` components already do this; the carousel container must inherit cleanly without override.
- **Panel 4 (firms) requires data work**: see `data_combine_recipe` in the panel frontmatter. A small build-time script merges April JSON firms with May CSV domains and writes a combined JSON the existing `Section__WebinarFirmsRepresented` can consume.

## Visual hierarchy suggestion

**Top of slide (shared, doesn't change as panels flip):** deck slide eyebrow + headline + subhead — frames "this is the cross-session recap."

**Body of slide (per panel):**
1. Panel label (e.g., "Totals · 1 of 6") — small, top-left of the panel area.
2. `headline_overlay` — large, the load-bearing takeaway. This is what the audience reads.
3. The composed `Section__*` component — the actual chart / list / quotes.
4. `subline` — small caption below the component for any necessary framing.

**Bottom of slide (shared):** carousel indicator ‹ N / 6 › + auto-advance progress dot. Same row, low-opacity until hovered.

## Composition implementation note

The simplest carousel: a small Svelte island that mounts a `<div>` per panel, only one visible at a time (`display: none` on the others), advancing on a setInterval + on ← / → keypress. The contained `Section__*` Astro components render statically into each panel; the Svelte layer just swaps which panel is visible.

Tailwind v4 utility classes drive show/hide; no new CSS tokens needed. Verify in all three modes before merge.

For panel 4, write `scripts/build-combined-firms.ts` to produce `src/data/webinar-survey/2026-05-27_combined-firms.json` per the recipe in the panel frontmatter. Run it at build time (pre-build hook or one-off `pnpm run build:combined-firms`).

## If the carousel doesn't feel right

Split this file into six: `02a_*-totals.md`, `02b_*-experience.md`, `02c_*-tool-stack.md`, `02d_*-firms-combined.md`, `02e_*-wants.md`, `02f_*-building.md`. Each file owns one panel's frontmatter + body. The deck composer drops one slide per file. The deck's existing keyboard nav (↑ / ↓) handles the flip naturally — no new carousel component needed.

Default to the single-slide carousel; fall back to the split-file approach if the carousel control distracts more than it helps.
