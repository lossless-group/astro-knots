---
name: Astro Knots — Splash
description: The splash for the Astro Knots family of sites.
colors:
  dark-text: "#f1ecdc"
  dark-accent: "#5b6fff"
  light-text: "#0c0c14"
  light-accent: "#1e1b4b"
  vibrant-accent: "#c8ff2e"
typography:
  display:
    fontFamily: Fraunces
  mono:
    fontFamily: JetBrains Mono
---

# Astro Knots — Splash

> **Partial.** Written 2026-11-22 to record the trademark pack. Only the tokens below were verified against `src/styles/theme.css`, which stays the source of truth. Colors beyond text and accent, Typography detail, Layout, Elevation & Depth, Shapes, Components and Do's and Don'ts are not written yet; see the `maintain-design-md` skill.

## Overview

The splash for the Astro Knots family of sites.

## Imagery

### Trademark pack

In `public/`, every piece outlined to paths (an `<img>` cannot load web fonts).

| Piece | File |
|---|---|
| appIcon | `appIcon__Astro-Knots.svg` and `appIcon__Astro-Knots--{Dark,Light,Vibrant}-Mode.svg`, copies of the knot-ring set in `icons/knot-ring*.svg`, which `KnotMarkRing.astro` draws |
| favicon | `favicon.svg` (the knot alone) |
| wordmark | `wordmark__Astro-Knots--{Dark,Light}-Mode.svg`: *astro-knots* in JetBrains Mono 500, as the topbar sets it in `.mono`, with the hyphen in indigo-electric |
| trademark | `trademark__Astro-Knots--{Dark,Light}-Mode.svg`: knot-ring (mode-matched) + wordmark |
