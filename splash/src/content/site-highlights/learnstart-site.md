---
title: learnstart-site
lede: The Pre-Seed to Seed arm of Learn Capital, rebuilt from scratch after a Heroku sunset took the original site with it. Reference implementation for share-card generation and Sveltia-published streams.
order: 15
status: Active
repo: https://github.com/lossless-group/learnstart-site
live_url: https://learnstart.vc
icon: 🔥
featured: true
maintained_by: The Lossless Group
tags: [Venture-Capital-Website, Client, LFM, Three-modes, OpenGraph, Sveltia-CMS]
---

A firm that has backed **60+ companies transforming the way the world learns since 2015**
had become a broken link. The rebuild is a self-owned Astro Knots site: the full three-mode
contract (light / dark / a *dark-green-based* vibrant), a portfolio marquee driven by real
trademark assets, and a team surface with self-contained SVG profile chips.

Two things here are worth stealing. **The share cards are pages, not pictures** —
`src/pages/og/[format].astro` composes the site's own `FlameMark` component and its own
theme tokens, then headless Chrome photographs it at each format's exact pixel size. Re-point
`--grad-from` in `theme.css` and the OG image moves with it, because it reads the same custom
property the site does. Only the wordless field underneath is generated, with every locked
Ideogram channel recorded in `DESIGN.md`. **The Thoughts stream** (`/streams`) renders through
`@lossless-group/lfm` and is publishable by a non-technical author via Sveltia.

The brand is a **radial flame** — geometry generated once in Python (seed 15) and emitted to
both the favicon set and the in-page `FlameMark.astro`, so the mark can never drift between
the browser tab and the page.
