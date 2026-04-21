---
title: "Flare: Concentric Wobble Rings"
lede: "Creative brief and technical spec for an interactive concentric-rings animation — imperfect circles radiating from an off-center origin with mouse hover repulsion and click ripple effects. Inspired by greenoaks.com."
date_authored_initial_draft: 2026-04-20
date_authored_current_draft: 2026-04-20
date_authored_final_draft: "[]"
date_first_published: "[]"
date_last_updated: "[]"
at_semantic_version: 0.0.1.0
generated_with: Claude Opus 4.6
category: Prompts
date_created: 2026-04-20
date_modified: 2026-04-20
status: Draft
tags: [Flare, Canvas, Animation, Interactive, Concentric-Circles, Noise, Creative-Brief]
authors:
  - Michael Staton
image_prompt: Topographic map lines radiating from an off-center point, with a cursor hovering between two lines pushing them apart like a magnetic field.
---

# Creative Brief

An interactive full-viewport animation of **concentric rings radiating from an off-center origin**. The rings are imperfect — they wobble organically like hand-drawn circles or topographic contour lines. The mouse interacts with the rings: hovering between two rings pushes them apart, and clicking sends ripples outward through the ring field.

**Inspiration:** greenoaks.com homepage (as of April 2026).

**Mood:** Calm, sophisticated, slightly organic. Reads like a topographic map, a fingerprint, or ripples in still water.

---

# Technical Specification

## Geometry

### Origin Point
- Positioned at roughly the **rule-of-thirds intersection**, not dead center.
- Default: approximately `(33% viewport width, 33% viewport height)` — the "golden crop" point common in portrait photography.
- Should be configurable via props.

### Ring Generation
- A series of **concentric circles** all sharing the same center (origin) point.
- Each ring's radius increases by a **fixed increment** (the "gap"):
  ```
  radius[n] = baseRadius + n * gap
  ```
- Gap is approximately **20-25px** (configurable).
- The outermost rings extend well beyond the viewport, clipped by `overflow: hidden`, ensuring the entire viewport is covered with rings regardless of where the origin sits.
- With a ~20px gap and a ~2000px diagonal, expect roughly **80-100 rings**.

### Wobble / Imperfection
- Each ring is **not a perfect circle**. The radius is perturbed per-angle using **low-frequency noise** (Perlin noise, simplex noise, or a sum of sine waves at different frequencies).
- Each ring gets its own noise seed or phase offset so they don't wobble in unison.
- Perturbation amplitude: subtle, approximately **3-8px** deviation from the ideal radius.
- The noise is **animated over time** — the phase shifts slowly, giving an organic "breathing" wobble. Very slow, almost meditative.

## Visual Style

### Stroke
- **No fill** on any ring (`fill: none` / `strokeStyle` only).
- **Thin stroke**: 1px or sub-pixel (e.g., 0.75px).
- **Color**: derived from the background at reduced opacity. For a dark background, strokes are a lighter tone at ~15-25% opacity. For a light background, strokes are a darker tone at similar opacity.
- The result is a subtle, topographic-map aesthetic — lines that are clearly visible but not harsh.

### Background
- Configurable solid color. Default: a deep, muted tone (dark navy, deep green, etc.).
- The animation should also support `transparent` for overlay use.

## Interaction

### Mouse Hover — Magnetic Repulsion
- When the cursor sits between two rings, the nearby rings **push apart**.
- The inner ring's radius decreases slightly and the outer ring's radius increases slightly **in the angular region near the cursor**.
- Implementation: for each point on each ring, measure distance from that point to the cursor position. Apply a **gaussian falloff force** that displaces the ring radius outward (for outer ring) or inward (for inner ring) within a ~50-100px influence zone.
- The effect is **smooth and spring-like** — displacement lerps toward the target (not instant snap), and relaxes back when the cursor moves away.

### Click — Radial Ripple
- On click, a **shockwave** propagates outward from the click point.
- Rings near the click origin receive a sudden radial displacement that travels outward ring-by-ring over approximately **500-800ms**.
- Amplitude decays as the ripple spreads — like dropping a stone in water.
- The displacement pulse moves through the ring field at a consistent speed, creating a visible wavefront.

## Rendering

### Recommended: HTML5 Canvas 2D
- Drawing 80-100 stroked paths per frame with noise perturbation is a natural Canvas workload.
- Use `requestAnimationFrame` for the render loop.
- Redraw all rings each frame (clear + stroke loop).

### Alternative: SVG
- Could use SVG with animated `d` attributes on `<path>` elements, but Canvas is more performant at this ring count and update frequency.

## Layout

- The animation fills **100% of viewport width and height**, minus any header/footer the site uses.
- Use `100dvh` or calculate available height to respect existing site chrome.
- Clip overflow so rings extending beyond the viewport are hidden.

## Props (Astro Component)

| Prop | Type | Default | Description |
|---|---|---|---|
| `bgColor` | string | `'#0a1628'` | Background color |
| `ringColor` | string | `'#ffffff'` | Ring stroke color (opacity applied automatically) |
| `ringOpacity` | number | `0.18` | Ring stroke opacity |
| `ringGap` | number | `22` | Pixel distance between rings |
| `ringStrokeWidth` | number | `1` | Stroke width in pixels |
| `originX` | number | `0.33` | Origin X as fraction of viewport width |
| `originY` | number | `0.33` | Origin Y as fraction of viewport height |
| `wobbleAmount` | number | `5` | Max radius perturbation in pixels |
| `wobbleSpeed` | number | `0.3` | How fast the wobble animates |
| `hoverForce` | number | `1` | Hover repulsion strength multiplier |
| `clickRipple` | boolean | `true` | Enable click ripple effect |
| `height` | string | `'100vh'` | Container height |

---

# Usage

```astro
---
import WobbleRings from '@components/flare/WobbleRings.astro';
---

<WobbleRings
  bgColor="#0a1628"
  ringColor="#ffffff"
  ringOpacity={0.18}
  ringGap={22}
  originX={0.33}
  originY={0.33}
  height="calc(100vh - 80px)"
/>
```

# Variations to Explore

- **Light background**: white/cream background with dark rings at low opacity.
- **Warm tone**: deep burgundy or forest green background.
- **Tighter rings**: gap of 12-15px for denser topographic look.
- **Wider rings**: gap of 35-40px for a more minimal, zen feel.
- **Centered origin**: origin at (0.5, 0.5) for symmetrical radiance.
- **Multiple origins**: two or more origin points whose ring fields overlap and interfere.
