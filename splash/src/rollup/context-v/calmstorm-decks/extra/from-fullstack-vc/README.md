---
from: calmstorm-decks
from_path: extra/from-fullstack-vc/README.md
---
<!-- Rolled up from calmstorm-decks/context-v/extra/from-fullstack-vc/README.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

# Migrated from `sites/fullstack-vc/` (2026-05-03)

These files were drafted inside `fullstack-vc` on **2026-04-29** as a pitch-deck demo for Calm/Storm Ventures, then promoted to **`sites/calmstorm-decks/`** as its own site shortly after. The originals never made it into a `fullstack-vc` git commit — they sat as untracked working-tree files until this archive was made.

Kept here as a **point-in-time snapshot** so the original styling decisions, brand-token derivation, and reverse-engineered Calm/Storm look-and-feel remain referenceable. **Not wired into the running site** — `calmstorm-decks` has since moved to a different layout philosophy (`PageAsDeckWrapper.astro` + `SlideLayout.astro` + scroll-snap) that supersedes the single-file `CalmstormSlideDeck.astro` approach below.

## Files

- **`CalmstormSlideDeck.astro`** — the original single-file slide deck layout. Owns its own `--cs-*` token namespace and inline styling.
- **`calmstorm-deck.css`** — companion stylesheet, scoped to `.cs-deck`.
- **`calmstorm-page.astro`** — the page that consumed the layout, originally at `src/pages/slides/secure/calmstorm.astro` in fullstack-vc. Includes the reverse-engineering provenance comment block (brand colors lifted from Calm/Storm's embedded Shopify config, fonts: Montserrat + Oswald, etc.).
- **`slides-assets/calmstorm/`** — `brush.avif` and `logo.svg` lifted from www.calmstorm.vc.

## Why this lives here

- **Source-of-truth fence**: `fullstack-vc` is a portfolio/community site, not a deck workshop. Every Calm/Storm-shaped artifact belongs in its own dedicated repo (`calmstorm-decks`).
- **Hygiene before the LFM publish**: when preparing to push `@lossless-group/lfm@0.2.2` to JSR, we cleaned mismatched cruft across astro-knots submodules so the publish surfaces a tidy graph. Calm/Storm content sitting untracked in fullstack-vc was the most visible mismatch.

## Re-using anything in here

If a future deck-site rebuild wants the original styling tokens or the brand-asset stripe, lift directly from these files. Do **not** re-import the layout into `calmstorm-decks/src/layouts/` — adopt the values into the current `SlideLayout.astro` system instead.
