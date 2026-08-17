---
date_created: 2026-08-08
date_modified: 2026-08-08
title: Extract the Lossless Brand Layer from lossless-site
lede: "The house brand's visual identity is real and worth keeping, but it lives in a legacy token system with duplicated definitions, a syntax error, a font-face that breaks in production, and 14 Google fonts loaded to use none of them. This is the extraction plan: pull the durable brand layer forward into two-tier tokens, dark-only by decision rather than by omission."
publish: true
version: 0.1.0.0
status: draft
authors:
  - Michael P. Staton
augmented_with:
  - Claude Code on Claude Opus 5 (1M context)
tags:
  - Theme-System
  - Two-Tier-Tokens
  - Brand-Extraction
  - Dark-Mode
  - Lossless-Site-Rebuild
  - Design-System
from: lossless-changelog
from_path: specs/Extract-the-Lossless-Brand-Layer-from-lossless-site.md
---
<!-- Rolled up from lossless-changelog/context-v/specs/Extract-the-Lossless-Brand-Layer-from-lossless-site.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

# Extract the Lossless Brand Layer from lossless-site

## Why Care?

`lossless-changelog` currently ships a placeholder palette — generic violet and cyan I invented to get the site standing. It looks fine and it is not Lossless.

This site is the first surface of the full `lossless-site` rebuild, so whatever brand layer lands here becomes the reference every subsequent surface copies. That makes it worth extracting deliberately rather than copying `src/styles/` across and inheriting three years of accumulated drift.

**The brand itself is genuinely good.** The eastern-crimson gradient, the cyan-aqua accent against near-black, the named-color vocabulary — that identity is worth carrying forward verbatim. What is not worth carrying forward is the system it currently lives in.

## Audit — what is actually in `site/src/styles/`

Thirteen files, ~1,850 lines. Findings, in descending order of consequence:

### 1. The base typeface never loads

`global.css` declares the site's two primary families:

```css
--ff-base: 'Poppins', sans-serif;      /* every heading, every <a>, every <p> */
--ff-legible: 'Krub', sans-serif;
```

`fonts--google.css` contains exactly **one** `@import`, fetching 14 families: Bodoni Moda, Chakra Petch, Eczar, Figtree, Gaegu, Indie Flower, Inter, Kanit, Lexend, Noto Serif, Open Sans, Roboto, Space Grotesk, Urbanist.

**Neither Poppins nor Krub is among them, and there is no `@font-face` for either.** The file mentions "Poppins" 36 times and "Krub" 24 times — but only inside utility classes (`.poppins-regular { font-family: "Poppins" }`) that reference fonts nothing ever fetches.

So every heading and body element on the live site resolves to the generic `sans-serif` fallback. The typography you see in production is the browser's default, not a choice. Verify in a browser before acting on this — but the CSS admits no other reading.

### 2. Fourteen font families load; roughly two are used

Whatever the fix to (1), the current import is a large blocking request for fonts the site does not use. `Bodoni Moda` alone spans two axes across 400..900 weights.

### 3. The one self-hosted font breaks in production

```css
@font-face {
  font-family: 'Poor Story Regular';
  src: local('Poor Story Regular'), url('/src/assets/Fonts/PoorStory-Regular.woff') format('woff');
}
```

`/src/...` is not a served path in an Astro production build — it resolves during `dev` and 404s once built. Poor Story is the brand's handwritten-note face (see the `overlay-svg-text` skill, where it is canon), so this matters. Fix: move to `public/fonts/` or import through Vite so it gets hashed and emitted.

### 4. Tokens are defined twice, in two files, with drift

`global.css` and `lossless-theme.css` **both** define `--cyan-aqua--brightest`, `--white-catskill`, `--purple-heart`, `--clr-lossless-primary-light`, `--clr-lossless-primary-glass`, `--clr-lossless-attn-action`, `--clr-lossless-ui-btn-border`, and the four `--clr-lossless-primary-glass-gr--*` gradients.

`global.css` imports `lossless-theme.css` at line 4 and then redefines those names at lines 6–93, so the `global.css` values win. Any edit made in `lossless-theme.css` to a duplicated token is silently discarded. This is the single most expensive property of the current system: **the file named like the theme is not the file that controls the theme.**

### 5. A missing semicolon swallows a token

`lossless-theme.css:39`:

```css
--butterfly-bush-purple: hsla(259, 34%, 45%, 1.00)   /* ← no semicolon */
--ice-blue: hsla(173, 66%, 80%, 1.00);
```

CSS parses this as one malformed declaration. Both `--butterfly-bush-purple` and `--ice-blue` are undefined at runtime.

### 6. The naming convention predates the current one

| Current in `lossless-site` | Astro Knots convention |
|---|---|
| `--cyan-aqua--brightest` (double dash) | `--color__cyan-aqua-brightest` (Tier 1, `__`) |
| `--clr-lossless-primary-light` | `--color-text` / `--color-primary` (Tier 2, kebab) |
| `--ff-base`, `--fs-400`, `--fw-bold` | `--font-body`, `--text-lg`, `--font-weight-bold` |

Tier 2 must be kebab-case because **Tailwind v4 only generates utilities from kebab-case tokens**. The `--clr-` and `--ff-`/`--fs-`/`--fw-` prefixes generate nothing.

### 7. No modes exist at all

There is no `.theme-*` or `[data-mode]` block anywhere. `--clr-primary-bg` is hardcoded to `#0d1117` — literally named `--clr-stolen--github--dark`. The site is dark not by decision but by never having considered the alternative.

## The dark-only decision

The `theme-system` skill states a **three-mode contract** — light, dark, vibrant — and calls it non-negotiable. This spec deliberately diverges, and the divergence should be explicit rather than accidental.

**The skill's rationale is stakeholder management on client sites:** "nerds pick dark, traditionalists pick light, design-forward stakeholders pick vibrant. The toggle ends the 'which mode' argument before it starts."

**Lossless Group is the house brand.** There is no client to manage and no argument to end. The identity is a dark identity — near-black grounds, a cyan-aqua accent that only reads against dark, and a four-stop gradient tuned for luminous-on-dark. Rendering it on white would not be a light mode; it would be a different brand.

So: **ship dark only, but build the architecture mode-ready.**

Concretely, this means semantic tokens live in a mode block rather than in `:root`:

```css
:root { /* Tier 1 named tokens only — mode-independent raw values */ }

:root, [data-mode="dark"] {
  /* Tier 2 semantic tokens. The selector already exists, so adding a light
     or vibrant mode later is authoring one more block — not a refactor. */
}
```

Cost today: one extra selector. Benefit: if a light mode is ever wanted (a print stylesheet, an embed on a partner site, an accessibility requirement), it is additive. The failure this avoids is the current one — semantics hardcoded into `:root` such that introducing a mode means touching every token.

**Not doing:** a mode switcher UI, a `light` block, or a `vibrant` block. A half-authored mode is worse than an absent one. When a second mode is genuinely wanted, it gets its own spec and its own design pass.

## What to extract

### Tier 1 — named tokens (carry forward verbatim)

The brand vocabulary is the valuable part. Values are unchanged; only the naming convention updates.

**Brand gradient** — the single most identity-carrying asset:

```css
--color__eastern-blue:      hsla(186, 68%, 42%, 1);
--color__blue-purple:       hsla(272, 73%, 55%, 1);
--color__alazarin-crimson:  hsla(352, 72%, 49%, 1);
--color__sundshade-yellow:  hsla( 29, 90%, 62%, 1);
--gradient__eastern-crimson:
  linear-gradient(112deg, #22A6B5 6%, #9138E0 24%, #D9233B 48%, #F59C49 72%);
```

Note the two variants in the source disagree — `lossless-theme.css` uses `112deg` at `6% 24% 48% 72%`, `global.css` uses `107deg` at `5.36% 23.14% 47.56% 72.33%`. Pick one. Recommend the `global.css` values, since that file currently wins at runtime and is therefore what has actually been shipping.

**Grounds and accent:**

```css
--color__jaguar-black:   hsla(288, 100%,  2%, 1);
--color__bastille-black: hsla(273,  18%, 10%, 1);
--color__bunker-black:   hsla(218,  22%,  7%, 1);
--color__github-dark:    #0d1117;                    /* rename from --clr-stolen--* */
--color__cyan-aqua-brightest: rgb(4, 229, 229);
--color__white-catskill: hsla(184, 35%, 92%, 1);
--color__purple-heart:   hsla(272, 73%, 55%, 1);
```

**Spectrum** (8 stops, used by `.shade-*` helpers): mystic-turquoise, pelorous-ocean, purple-heart, slate-blue, purpureus, dingy-dungeon, jelly-bean, porsche-orange.

**Attention** (4): robins-egg-blue, bright-lime, algae-green, pizzaz-pink.

Restore `--color__butterfly-bush-purple` and `--color__ice-blue`, both currently lost to the missing semicolon.

### Tier 2 — semantic tokens (new; this is the actual work)

```css
:root, [data-mode="dark"] {
  --color-bg:           var(--color__github-dark);
  --color-surface:      var(--color__bastille-black);
  --color-surface-alt:  var(--color__bunker-black);
  --color-text:         var(--color__white-catskill);
  --color-heading:      var(--color__cyan-aqua-brightest);
  --color-link:         var(--color__cyan-aqua-brightest);
  --color-primary:      var(--color__purple-heart);
  --gradient-primary:   var(--gradient__eastern-crimson);
}
```

The mapping is recoverable from the existing `--clr-heading` / `--clr-body` / `--clr-link` / `--clr-primary-bg` assignments in `global.css:54–67`. Those are already semantic in intent — they are just misnamed and in the wrong file.

### Assets to bring

| Asset | From | Note |
|---|---|---|
| `wordmark__The-Lossless-Group.svg` | `public/visuals/` | primary wordmark |
| `appIcon__Lossless_Record--Rounded-Rectangle.svg` | `public/` | app icon / avatar mark |
| `favicon.svg` | `public/` | |
| `PoorStory-Regular.woff` | `src/assets/Fonts/` | **relocate to `public/fonts/`** — see finding 3 |

**Leave behind:** every `.afdesign` file (Affinity Designer sources, not web assets — they belong in a design-source location, not a site repo), `public/visuals/` third-party trademarks (Laerdal, Hypernova, GitHub, Param-Tech, Tonguc — client and vendor marks with no place in the changelog site), `images/favicon-placeholder.png`, and `test-scroll.html`.

### Fonts to resolve

The current state is unusable, so this is a decision rather than an extraction. Options:

1. **Self-host the two real families** (Poppins + Krub) via `@fontsource-variable/*`, matching `learnstart-site` and `hypernova-site`. No blocking third-party request, no layout shift, works offline. **Recommended.**
2. Keep a Google `@import` but reduce it to the two families actually used.
3. Pick different families outright — defensible, since the current ones have never actually rendered, so there is no visual regression to fear.

Whichever, Poor Story stays, self-hosted, for the handwritten-note role the `overlay-svg-text` skill assigns it.

### What not to extract

- **`animations.css`** (469 lines) — audit against actual use before bringing any of it. Most of it belongs to marketing surfaces that do not exist here.
- **`starwind.css`** (175) — Starwind component library; this site does not use it.
- **`tag-filter.css`** (214) — tied to the old tag-filtering UI.
- **`shiki-github-dark.css`** — the current site uses Shiki; `lossless-changelog` is configured for Prism. Reconcile the highlighter choice before porting either.
- **`avatars.css`**, **`layers.css`** — not needed yet; revisit if the feed grows author avatars.
- **`markdown.css`**, **`callouts.css`**, **`codeblocks.css`** — these overlap heavily with the scoped `.prose` styles already written in `[entry].astro` and with the canonical `packages/lfm-astro` components. Reconcile rather than layer; the LFM components are the newer, maintained source.

## Migration phases

**Phase 1 — tokens.** Author `src/styles/theme.css` with both tiers per above. Replace the placeholder palette. No visual regression risk: this site's current colors are invented, so anything is an improvement toward correctness.

**Phase 2 — typography.** Resolve the font decision, install, wire `--font-body` / `--font-heading` / `--font-hand`. Relocate Poor Story to `public/fonts/`.

**Phase 3 — assets.** Bring the four assets. Wire the wordmark into `BaseLayout`'s header in place of the current text wordmark, and the favicon into `<head>`.

**Phase 4 — reconcile prose styles.** Diff the scoped `.prose` rules in `[entry].astro` against `markdown.css` + `callouts.css` + `codeblocks.css`. Keep what the LFM output actually needs; drop the rest.

**Phase 5 — write it down.** `DESIGN.md` at the repo root per the `maintain-design-md` skill, so the next surface reads the contract instead of re-deriving it from CSS. This is what makes the extraction reusable for the rest of the rebuild rather than a one-off.

**Not in scope:** Tailwind. This site is currently vanilla CSS with scoped component styles and does not need a utility framework to render a feed. If the broader rebuild adopts Tailwind 4, the two-tier tokens are already shaped for it — kebab-case Tier 2 generates utilities automatically. That is a reason to get the tokens right now, not a reason to add Tailwind now.

## Open questions

1. **Do the findings reproduce in a browser?** The CSS is unambiguous, but confirm the live site really is rendering fallback `sans-serif` before treating font selection as a free choice. If Poppins somehow loads via a path not in `src/styles/`, option 3 above becomes a regression rather than a fresh start.

2. **Which gradient angle is canonical** — `112deg` or `107deg`? Recommend `107deg` on the evidence of what currently ships, but this is a brand call.

3. **Shiki or Prism?** `lossless-site` uses Shiki with a GitHub-dark theme; this site is configured for Prism. Whichever wins should win for the whole rebuild.

4. **Where do `.afdesign` sources belong?** They are in `public/` today, meaning they are publicly served. Probably wants a design-sources location outside any site repo.

## References

- `theme-system` skill — three-mode contract, two-tier tokens, file organization
- `astro-knots/context-v/blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind.md` — §2.1 token convention
- `maintain-design-md` skill — the `DESIGN.md` contract for Phase 5
- `overlay-svg-text` skill — where Poor Story and the brand gradient are canon
- `site/src/styles/` — the source being extracted from
