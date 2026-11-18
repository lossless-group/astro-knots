---
title: "A Relative Type Scale for LFM Reading Content"
lede: "One body size and one ratio size every heading on the page, so a long read shows its shape and one change resizes everything."
publish: true
status: Reference
date_created: 2026-11-17
date_modified: 2026-11-17
date_authored_initial_draft: 2026-11-17
date_authored_current_draft: 2026-11-17
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.1.0
category: Blueprints
type: Blueprints
tags:
  - Typography
  - Type-Scale
  - Lossless-Flavored-Markdown
  - Design-System
  - Astro-Knots
site_uuid: 994ea439-26df-4ac9-9f04-bd500ec52bd2
hex_code: pgdb9e
summary: "Implementation blueprint for heading sizes in long-form content that AstroMarkdown renders: a modular scale from two tokens (--reader-size, --reader-ratio) with h5→h2 and the page title as powers of the ratio, headings in a display face and copy in a reader face, applied to a .reader wrapper. Canonical CSS: astro-knots/packages/lfm-astro/components/reader.css. Reference implementations: sites/cathode-site and sites/edviro-blog (2026-11-17). Standard Equipment: every site that renders long-form markdown ships it. Load before styling markdown content, setting heading sizes, or choosing fonts for an article or write-up."
---

# A Relative Type Scale for LFM Reading Content

## Why care?

A long article lives or dies on whether a reader can see its shape. On Cathode
and the Edviro blog, a write-up's section headings were about a fifth bigger
than the text, in the same typeface. Scrolling through, nothing stood out; the
headings read like bold paragraphs.

The sizes were also scattered: `1.35rem` here, `clamp(1.6rem, 3.2vw, 2.1rem)`
there, `1.45rem` for h3, each typed by hand. Making the text a little bigger
meant finding and retuning every one of them, so nobody did.

This blueprint replaces those with two numbers.

## The rule

**One body size and one ratio decide every heading.** Each level up is the
level below times the ratio:

| Level | Size | At 18px, ratio 1.25 | Phones: 17px, ratio 1.2 |
|---|---|---|---|
| Body copy | size | 18px | 17px |
| h5 | size | 18px | 17px |
| h4 | size × r | 22.5px | 20.4px |
| h3 | size × r² | 28.1px | 24.5px |
| h2 | size × r³ | 35.2px | 29.4px |
| Page title | size × r⁴ … r⁵, growing with the viewport | up to 54.9px | about 35px |

h6 is the body size at 0.875, uppercase, letter-spaced and muted: a label, not
a heading. Margins above headings are in `em` of the heading's own size, so a
bigger heading gets proportionally more room.

Change `--reader-size` and everything follows. Change `--reader-ratio` and the
contrast between levels follows. A gentler ratio on phones keeps headings from
wrapping into towers.

**Headings and copy use different faces.** Headings in the site's display face,
reading copy in a face made for long text. Size alone separates levels; the
change of face separates a heading from the paragraph under it.

## How it works

```text
astro-knots/packages/lfm-astro/components/reader.css   canonical; copy into src/styles/reader.css
src/styles/global.css                                  @import './reader.css' at the top
theme tokens (Tier 2)                                  --font-display, --font-reader
page markup                                            <div class="reader"> around AstroMarkdown
                                                       class="reader-title" on the page's h1
```

1. **The scale lives on `:root`.** `--reader-size`, `--reader-ratio`,
   `--reader-leading`, and the powers `--reader-r1` … `--reader-r5`, computed
   from the ratio with chained `calc()`. A media query changes the size and ratio
   on phones; the powers recompute.
2. **Reading content opts in with `.reader`.** Wrap what AstroMarkdown renders:
   `<div class="reader"><AstroMarkdown node={tree} /></div>`, or add `reader` to
   the existing `<article class="prose">`. Only that content gets the reader face
   and the scale, so buttons, cards and call-to-action boxes keep the interface
   font.
3. **Headings size in `em` of the reader.** `.reader h2` is
   `calc(var(--reader-r3) * 1em)`, relative to `.reader`'s own size. A heading
   inside a callout or a cross-reference embed scales from that container.
4. **The page title is outside `.reader`,** so it takes `.reader-title`, sized
   from `--reader-size` directly.
5. **The site's own heading rules can join the scale.** edviro-blog sets its
   global `h1`–`h5` from the same tokens
   (`h2 { font-size: calc(var(--reader-size) * var(--reader-r3)) }`), so one
   change resizes headings across the whole site, not only in articles.

## Fonts

Set two Tier 2 tokens in the site's theme; the components never name a font:

```css
--font-display: var(--font__geist);        /* headings */
--font-reader:  var(--font__newsreader);   /* reading copy */
```

- **Keep the brand face for headings.** Cathode and Edviro both set headings in
  Geist, the face their sites already use.
- **Give reading copy a serif made for text.** Cathode had Newsreader. Edviro's
  brand has only Geist, so its blog uses Source Serif 4, self-hosted next to
  Geist with its OFL license (`src/assets/fonts/`). Choose a different serif per
  brand so sites don't all read the same.
- **Self-host or load it the way the site already loads fonts.** A site that
  self-hosts doesn't start calling Google Fonts for one face.
- The page title goes with the headings (display face). Cathode's write-up title
  had been in the serif, which made it run into the copy.

## Rules that bit us

- **Remove the old per-page heading rules.** Pages carried
  `.prose :global(h2) { font-size: 1.35rem }`. Astro scopes that to
  `.prose[data-astro-cid-…] h2`, which outranks `.reader h2`, so the old size
  silently wins. Delete them when adopting the scale.
- **The title needs at least one step over h2.** With the title's minimum at
  r³ (h2's size), phones showed a 30px title over a 29.4px h2. The minimum is
  r⁴.
- **Don't put the reader face on the whole `.prose` block** when it also holds
  the post's header, share links or a call-to-action box. Wrap only the rendered
  markdown, or those pick up the serif too.
- **Unlayered CSS beats Tailwind's base layer.** On a Tailwind v4 site,
  `reader.css` imported after `theme.css` overrides preflight's heading reset
  without `!important`.

## Checking it

Measure, don't eyeball: in a browser at desktop and phone widths, read the
computed `font-size` and `font-family` of `h1`, `.reader p`, `.reader h2` and
`.reader h3`. h2 should be about twice the body on desktop, and the title
clearly above h2 on both. Then add the specimen to `/design-system`: a
`.reader-title` and h2–h6 with a paragraph between, so the scale can be judged
in every mode.

## Reference implementations

- **`sites/cathode-site`**: Geist over Newsreader; write-ups and event pages.
  `src/styles/reader.css`, `--font-reader` in `src/styles/themes/default.css`.
- **`sites/edviro-blog`**: Geist over Source Serif 4; articles, write-ups and
  event pages, plus the site's own h1–h5 on the same scale in
  `src/styles/global.css`.

Both shipped 2026-11-17 and show the scale in `/design-system` as "Reading type".

## See also

- [[Standard-Table-of-Contents-for-Every-Markdown-Collection]]: the outline
  that rides alongside reading content
- [[Maintain-Themes-Mode-Across-CSS-Tailwind]]: the two-tier tokens
  `--font-display` and `--font-reader` belong to
- The `theme-system` skill
