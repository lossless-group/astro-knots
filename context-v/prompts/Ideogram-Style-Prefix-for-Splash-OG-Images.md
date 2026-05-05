---
title: "Ideogram Style Prefix for Splash OG Images"
lede: "Reusable Ideogram preamble that conditions generated OpenGraph and share images to match the astro-knots splash — knot-and-thread motif, the splash's three-mode palette, and an editorial typographic sensibility. Paste before your subject line."
date_created: 2026-05-05
date_modified: 2026-05-05
status: Active
applies_to: astro-knots splash and any sibling site adopting the knot-thread visual language
tags:
  - Ideogram
  - OpenGraph
  - Style-prefix
  - Astro-Knots
  - Splash
---

# Ideogram Style Prefix for Splash OG Images

> Paste one of these blocks **before** your subject prompt in Ideogram so generated images stay visually coherent with the [splash](https://lossless-group.github.io/astro-knots/). Vary only the subject; keep the prefix stable across the whole OG library.

## How to use

1. Copy the **Base prefix**.
2. Append **one Mode variant** (Dark / Light / Vibrant) — its palette swap.
3. Append your **Subject** line.
4. Set Ideogram aspect to **16:9** (or 1200×630 if a custom aspect is supported by the OG host).
5. Generate. Iterate on the subject only.

---

## Base prefix (always include)

```
Editorial poster.
Confident, asymmetrically-balanced composition with deliberate negative space.

Core motif — the "knot": two thin ribbons or threads woven through each other in a
Solomon's-knot / figure-eight braid, drawn with a hand-pulled feel, gradient-filled
strokes (no flat color), one ribbon clearly passing OVER and one passing UNDER at
the cross. The knot may be the primary subject, an ornamental flourish, or a subtle
border element depending on the subject.

Background: a faint geometric grid masked toward the top, plus one or two soft
radial glows in opposing corners at low opacity. On the bottom right about 4/5ths from right, 1/5th from left, 4/5ths from top, 1/5th from bottom: An astronaut drifting around in space, lost and floating. Subtle film grain is OK.

Typography (when text is rendered): a humanist serif similar to Fraunces for the
headline, set tight with negative letter-spacing; a clean monospace similar to
JetBrains Mono for small caption labels. Pair the two with restraint — serif
anchors, mono labels. No script faces, no all-caps slab serifs, no decorative
display fonts beyond the serif headline.

Aesthetic: editorial / craft-journal / quiet design-systems —
not corporate-tech, not playful-illustrative.

Avoid: AI-generated chrome bevels, glossy 3D plastic surfaces, stock-photo people,
generic neon-circuit / cyberpunk motifs, glowing orbs as the subject, sci-fi
spaceship aesthetics, emoji, watermarks, drop shadows on text, lens flare,
rainbow holographic gradients, generic "tech blue" gradients, isometric
illustrations.

Aspect ratios in main prompt body.
```

## Mode variant — pick one

### Dark (default — matches the splash's default mode)

```
Palette: ink #0c0c14 and charcoal #16161f as the base; electric indigo #5b6fff
and chartreuse #c8ff2e as primary accents; amber #ffb84d and cerise #ec3a8c as
warm accents; bone #f6f1e6 for text and highlights. Use no more than three of
these per composition. Threads/strokes use indigo→chartreuse or cerise→amber
gradients (not flat color).
```

### Light

```
Palette: bone #f6f1e6 and warm cream #ece6d3 as the base; indigo deep #1e1b4b
for text and primary marks; cerise deep #b3196a and amber deep #d4900a as
accents; a touch of electric indigo #5b6fff for highlights. Compositions should
feel sun-lit, not bleached — preserve warmth in the shadows. Threads/strokes
use indigo-deep→cerise-deep or amber-deep→indigo-deep gradients.
```

### Vibrant

```
Palette: midnight #060612 and deep purple-blue #181442 as the base; chartreuse
#c8ff2e and cerise #ec3a8c as primary saturated accents; amber #ffb84d and
electric indigo #5b6fff as supporting accents; soft cream #f7faff for text.
Saturation cranked, near-neon, but composed — not maximalist or chaotic.
Threads/strokes use chartreuse→cerise or cerise→indigo-electric gradients with
a faint outer glow.
```

## Subject line (you write this)

After the prefix and mode swap, append one subject line. A few starters:

**For the splash root OG (replacing/varying `og-knot.svg`):**
```
Subject: an oversized pair of interlocking ribbons forming a figure-eight knot at the left third of the frame; on the right, the wordmark "astro-knots" set in a tight humanist serif, with the caption "12 sites · 3 modes · 1 published package" set in monospace beneath.
```

**For a per-site share card (one card per sibling site):**
```
Subject: a quiet OG card for a single site — the site's name "<SITE-NAME>" set large in humanist serif at left-center, with one ribbon trailing behind it in the site's brand color (no knot, just a single thread). Small mono caption "astro-knots / <SITE-NAME>" in the bottom-left corner.
```

**For a published-package card (LFM):**
```
Subject: an editorial poster for the @lossless-group/lfm package — central motif is two threads weaving through stylized markdown syntax marks (asterisk, square brackets, hash). Caption in monospace: "@lossless-group/lfm — Lossless Flavored Markdown".
```

**For a context-v / blueprint share:**
```
Subject: an unfussy OG card for a written piece — the article title "<TITLE>" set in humanist serif, taking the upper two-thirds; a single thin ribbon underlines it in an accent color. Small mono label "context-v · blueprint" top-left.
```

## Notes & quirks (Ideogram-specific)

- **Wordmark literalism.** Put any word you want rendered exactly inside double quotes in the subject line (e.g. `"astro-knots"`). Constrain its position ("on the right", "centered", "tight beneath the knot"). Ideogram is strong at typography when the word is quoted; weaker when it's free-floating.
- **"Similar to" beats "Fraunces".** Ideogram doesn't actually load fonts — it interprets the *descriptor*. "Humanist serif similar to Fraunces, set tight" gets you closer than naming the font directly.
- **Three-color discipline.** Repeat the constraint in the subject if you see drift — Ideogram tends to add a fourth/fifth color silently unless told to constrain.
- **Gradient strokes, not flat.** Restate "gradient-filled strokes" in the subject when the knot/ribbon is central. The flat-color default is generic; the gradient is what makes it feel astro-knots.
- **Aspect.** 16:9 for general share. If the host supports 1200×630 explicitly, prefer it — slightly wider than 16:9 and leaves more horizontal room for the wordmark.
- **Negative space is the move.** Ideogram tends to fill every pixel; calling out "deliberate negative space" and "asymmetric balance" in the prefix counters that.
- **Iteration discipline.** Hold the prefix constant. Vary only the subject across the OG library. That's how the visual identity stays coherent across 20+ cards.

## Source of truth

The palette and motif specs above are extracted directly from:

- `splash/src/styles/theme.css` — Tier 1 named tokens (`--color__*`) for the exact hex values.
- `splash/src/components/KnotMark.astro` — the canonical interlocking-ribbon mark this prefix asks Ideogram to evoke.
- `splash/public/og-knot.svg` — the existing default OG image; this prefix is meant to extend the family, not replace it.

If `theme.css` adds a new named token (e.g. a fourth accent color), update the palette swaps here in the same change.
