---
title: Wire portfolio trademarks into the logo surfaces (carousel + wall)
date_created: 2026-08-03
date_modified: 2026-08-04
authors:
  - Michael Staton
augmented_with: Claude Opus 4.8 on Claude Code
semantic_version: 0.0.1.0
status: Implementing
lede: Turn the text-scroller into a real, mode-aware logo marquee — one company at a time, picking the best trademark from the 71-company .logo-scrape staging and wiring trademark_light / trademark_dark into logos.json.
tags:
  - Portfolio
  - Logos
  - Trademarks
  - Mode-Aware
  - LearnStart
from: learnstart-site
from_path: plans/Wire-Portfolio-Trademarks-Into-Logo-Surfaces.md
---
<!-- Rolled up from learnstart-site/context-v/plans/Wire-Portfolio-Trademarks-Into-Logo-Surfaces.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

## Why care

The homepage marquee and the portfolio wall should show **real company logos that
match the theme mode** (dark-ink logo in light mode, light/white logo in dark +
vibrant) — not text, and not a favicon. We scraped every portfolio company's
brand assets into `.logo-scrape/` (gitignored staging, 71 companies, ~780 files);
this doc tracks turning those into shipped trademarks, company by company.

Perfect is not the bar — get real logos in front of the user, see what reads
well per mode, iterate. Synthetic/recolored variants are flagged for eyeballing.

## The contract (how a trademark gets wired)

**One folder per company, and a filename that still names its company and mode.**
The folder makes the portfolio assessable — `ls` on it answers "what art do we have
for Prenda?", which a flat 123-file directory never could. The filename stays
self-describing so a path quoted in a changelog, a review comment, or a `logos.json`
diff is traceable with no folder context around it. Both properties matter, so the
redundancy is deliberate.

**Pattern: `{role}__{Folder}[--{Mode}].{ext}`**

- **Staging:** `.logo-scrape/{Folder}/` — every asset an agent found (append-only,
  never delete). Ranked most→least robust in the session tier list (S→D).
- **Placed files:** `public/portco-assets/{Folder}/`
  - `trademark__{Folder}--Light.svg` = **dark-ink** art → shown in **light** mode
  - `trademark__{Folder}--Dark.svg` = **light/white** art → shown in **dark + vibrant**
  - `trademark__{Folder}.{svg|png}` = **single** logo (colorful, legible on both) → all modes
  - `appIcon__{Folder}.{svg|png}` = 90–300px square (grid tile)
  - `favicon__{Folder}.{png|jpg|svg}` = 16–96px square (table chip)
  - The mode suffix names the **mode it is shown in**, not the ink color of the art.
  - **Case split, on purpose:** JSON fields are lowercase (`trademark_light`), filenames
    use Train-Case modes (`--Light`). Fields follow the data convention, files the asset one.
- **Folder naming** — `scripts/lib/portco-slug.ts` is the single source of truth,
  shared by both scripts. Train-Case by default (`AI-Camp`, `Major-League-Hacking`),
  brand-native compounds preserved (`CreatorUP`, `SchoolAI`, `StayQrious`). The base
  rule derives ~all of them; `FOLDER_OVERRIDES` carries the judgment calls, each with
  its reason inline. Staging folders use the same resolver, so a company's raw haul
  and its placed art line up 1:1.
- **`src/data/portfolio/logos.json`** — keyed by the exact `companies.json` display
  name. Fields: `trademark_light` + `trademark_dark` (dual), or `trademark` (single).
  Record shape + the `hasTrademark` / `iconFor` helpers live in `src/lib/portco-assets.ts`
  — both surfaces import them rather than redeclaring the type.
- **Render:** `CompanyLogo.astro` picks trademark (mode-aware) → single → wordmark →
  styled text. Mode-swap CSS (`.tm--light` / `.tm--dark`) lives in `global.css`.
- **Carousel:** `index.astro` filters to companies **with a trademark** — grows as
  we approve more; the rest stay off the marquee (no text next to real logos).

## Done — wired into logos.json + carousel (13)

| Company | Kind | Source picked | Flag to eyeball |
|---|---|---|---|
| Wonderschool | dual | nav-colored (light) + logo-white (dark) | — |
| Major League Hacking | dual | mlh color + mlh white | — |
| Alto Claro | dual | newlogogrey + newlogowhite | grey may read soft on white |
| Prenda | dual | press navy `#004976`; white **baked** from it | baked white |
| Giide | dual | inline-0 (black+colored dots); white **baked** | baked white loses dots |
| Copper/Fiat | dual | nav mint `#76ffba` (dark); dark-green `#0b3d2e` **baked** (light) | synthetic dark-green |
| Millie | dual | navbar blackfill; white **baked** | baked white |
| Sana Labs | dual | wordmark `currentColor` **baked** to `#0a0a0a` + `#fff` | baked both |
| Opya | single | official butterfly logo (multicolor) | dark-mode legibility |
| Ritual | single | OurRitual footer logo (brand = "OurRitual") | maroon text on dark |
| Mindstone | single | `//mindstone` purple navlogo PNG | the folder's SVG was a misfiled **Cambridge crest** — not used |
| Shikho | single | multicolor bird wordmark | blue text on dark |
| Vessel/Bloom | single | **VesselHealth** horizontal PNG (Bloom SVG wouldn't render) | current rebrand, not "Vessel" |

## Figure out — user flagged for a closer look (6)

Avela · CreatorUP · Vinco · Skillprint · Kubrio · Podium Education
— all Tier B (transparent PNG, no SVG). Need: confirm the raster is the real full
logo (not a favicon/press image), decide single vs. mode-pair, possibly hunt an SVG.

## Pending selection (~52)

Everyone else, ranked in the session tier list (S→D). Next natural batch = the
remaining Tier S/A companies with clean SVGs (e.g. Once, Concourse, Deversify,
Ender, Kenzie-Academy, Framework, Betaworks, Differ, Qualified-io, Prendea,
StayQrious, NovaKids, Copper done…).

## Rebrands applied (name + folder + data)

- **GalileoXP → Kubrio** (galileoxp.com 301s to kubrio.com)
- **College Consortium → Acadeum** (acadeum.com; SVG light+dark text variants pulled)

Both carry a durable entry in `scripts/build-portfolio.ts` `RENAME` so regenerating
`companies.json` from the source spreadsheets keeps the current name.

## Update — 2026-08-03 (carousel render pass)

- **Uniform sizing:** each logo now sits in a fixed 150×44 box (`object-fit:contain`).
  The old height cap silently failed — Astro scopes `.marquee__item .clogo` to the
  page hash, but `.clogo` lives in `CompanyLogo` (different hash); fixed with `:global()`.
- **Per-logo optical scale:** `--logo-scale` var via an `OPTICAL` map in `index.astro`
  (viewport has vertical headroom so scaled-up logos don't clip). Set so far:
  Sana Labs `0.8` (was too big), Prenda `1.25` (was too small).
- **Dark-mode variants baked** (these four went single → dual): **Opya** (whiten `.h`
  navy wordmark + drop `mix-blend:multiply` so the butterfly shows on dark), **Ritual**
  (`#8c2c38`/`#1e131f` → white, keep coral heart), **Shikho** (`#355dab` blue → white,
  keep magenta bird), **Vessel** (white silhouette from the PNG alpha).
- Wonderschool + Shikho(light) confirmed good out of the box.

## Update — 2026-08-04 (organize by folder)

Flat `public/portfolio-logos/{role}__{Slug}.{ext}` →
**`public/portco-assets/{Folder}/{role}__{Folder}[--{Mode}].{ext}`**.
123 files moved with `git mv` (history follows) into **62 company folders**; no
collisions, no orphans, and every `logos.json` path re-resolved from the exact move
map rather than guessed. Refactored end-to-end: both generator scripts write the new
layout, both surfaces read a shared record type, and the flat directory is gone.

Landed in two passes — folders first with bare role filenames, then the company +
mode restored into the filename, because **stripping it cost traceability**: a path
in a diff or a changelog no longer said which company it belonged to. Verified
idempotent: the generator now computes exactly the paths already on disk, so a
re-run overwrites in place instead of laying down a parallel set.

Two real bugs surfaced by the move — the flat layout had been hiding both:

- **`Kubrio` had two dead image refs.** The GalileoXP→Kubrio rename updated
  `logos.json` to `appIcon__Kubrio.png` / `favicon__Kubrio.png`, but the files were
  never renamed — so the record pointed at art that did not exist, and the table chip
  silently fell back to the letter placeholder. The `GalileoXP`-slugged files carried
  the real art and now sit at `Kubrio/`. **Eyeball:** kubrio.com is a live rebrand, so
  re-running the generator against it may pull fresher art than the redirected favicon.
- **Alto Claro's trademarks were filed under `AltaClaro`** while its icons were under
  `Alto-Claro` — same company, two slugs, adjacent in the flat listing and easy to miss.
  Now one folder. The domain is **altaclaro.com** and the brand's own SVGs read
  "AltaClaro", so `companies.json`'s **"Alto Claro" is very likely a transcription slip
  in the source spreadsheet** — flagged, not silently corrected, since it's spreadsheet
  data. The folder uses the brand spelling via `FOLDER_OVERRIDES`.

Also folded in:

- **`companies.json` carries both "Brave Care" and "BraveCare"** as separate rows — one
  company, two entries. Both now resolve to the single `BraveCare` folder; the duplicate
  row itself is left for a data pass.
- **Mindstone's single trademark was squatting in `trademark_light`**, so its all-modes
  logo was declared as light-mode-only. `trademark` is now a real field that
  `CompanyLogo` resolves, and the file is honestly named `Mindstone/trademark.png`.
- Staging dirs `Alto-Claro` → `AltaClaro` and `Brave-Care` → `BraveCare` renamed to match.
- **Shikho dark variant — missed wordmark.** The 08-03 bake recolored `#355DAB` (bird
  accents) but left the letterform path at `#2D4797`, so the wordmark stayed navy on a
  dark ground. Now `#ffffff`; magenta bird, coral, and amber preserved. *Lesson for the
  remaining bakes: a wordmark's letterforms are usually one large compound path with its
  own hex — check every distinct fill in the file, not just the dominant brand blue.*
- **Carousel is now user-scrollable.** The CSS `@keyframes` transform marquee became a
  real scroll container driven by `scrollLeft`: native touch swipe and trackpad, mouse
  drag with a short inertial glide, arrow keys when focused, hover/focus pause, and
  seamless wrap at the halfway mark (the set is rendered twice). Under reduced motion the
  auto-advance is skipped but the strip stays manually scrollable — previously it
  reflowed into static rows.

## Open questions

- Single-trademark multicolor logos (Opya, Ritual, Shikho, Mindstone, Vessel) show
  in **all** modes. If any reads poorly in dark/vibrant, bake a light variant.
  *(Of these only **Mindstone** is still a true single — the other four went dual on 08-03.)*
- Wall (`/portfolio` Table/Wall toggle) uses the same `CompanyLogo` + `logos.json`,
  so it lights up with the same trademarks automatically.
- ~~Stale `appIcon__GalileoXP` / `favicon__GalileoXP` files~~ — **resolved:** they were
  not stale, they were Kubrio's only art. Moved to `Kubrio/` (see 08-04 update).
- **Coverage, now that it's countable:** 62 folders for 72 company rows —
  **13 have a trademark**, 49 have only square icons, and **9 have no art at all**:
  Acadeum · Bold Health · BraveCare · Co-Learn Club · Empath/Virdis · Fluence ·
  Foundry College · Kidato · KidztoPros. (Acadeum's SVGs were pulled during the rebrand
  pass but never placed — closest to a quick win.) Worth a targeted scraper pass.
- **Opya has trademarks but no `appIcon`/`favicon`**, so it renders on the marquee and
  the wall but falls back to a letter chip in the portfolio table. It's on the
  `BAD_SITE_ICON` deny-list, which is why the generator skips its icons.
