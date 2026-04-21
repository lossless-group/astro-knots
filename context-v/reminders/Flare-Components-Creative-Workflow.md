---
title: "Flare Components — Creative Workflow"
lede: "Flare is our naming convention for design-oriented components — images, illustrations, and animations as code. This reminder covers naming, preferred tech, and the creative brief workflow."
date_created: 2026-04-20
date_modified: 2026-04-20
status: Published
category: Reminders
tags: [Flare, Design-System, Creative-Brief, SVG, D3, GSAP, Lottie, Three-JS, Workflow]
authors:
  - Michael Staton
---

## What "Flare" Means

"Flare" is our naming convention across all maintained sites for **design-oriented components that are coded rather than exported as static images**. These are illustrations, animations, decorative visuals, and brand-forward graphics — implemented as code so they stay sharp, performant, and customizable.

Flare components live at:
```
src/components/flare/
```

## Preferred Technologies

We have working experience with and prefer these formats for flare:

- **SVG** — for illustrations, icons, and vector graphics rendered inline or as components
- **D3.js** — for data-driven or generative visuals
- **GSAP** — for advanced timeline animations (though prefer CSS animations/transitions when they suffice)
- **Lottie** — for designer-exported animations (After Effects workflow)
- **Three.js** — has been used successfully for particle systems, flag simulations, and sphere visuals (see banner-site flare components as examples)

We are open to other technologies when a Code Assistant suggests them and they fit the use case. The key criteria: the output should be code, not a raster image export.

## Creative Brief Workflow

When developing flare, the workflow is:

1. **Receive or write a Creative Brief** — a short prompt describing the visual intent, mood, brand context, and any constraints (colors, dimensions, placement on page).

2. **Create several design iterations** — the Code Assistant should treat the brief as a starting point and bring its own creativity. Produce multiple alternatives that meet the spec but explore different aesthetic directions. Typically 3-5 variations.

3. **Display iterations in the design system** — all flare options get mounted as viewable pages under the site's `design-system/flare/` route so the team can compare them side-by-side in the browser.

4. **Select and refine** — the user picks a direction (or combines elements from multiple iterations), and the chosen version gets placed into the actual page layout.

## File Naming

Flare component files should use PascalCase descriptive names that convey the visual concept:
```
FlagCloth.astro
PlanetRising.astro
EclipseEnding.astro
```

Not generic names like `Hero1.astro` or `Animation3.astro`.

## Props Convention

Flare components should accept props for customization — at minimum:
- Background color (often `transparent` when overlaid)
- Primary color (often tied to `var(--color-primary)` or similar CSS variables)
- Height / dimensions
- Any interaction toggles (parallax, autoplay, etc.)

This lets the same flare component adapt to different brand contexts across sites.
