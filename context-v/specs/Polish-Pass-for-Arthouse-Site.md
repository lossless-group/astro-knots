---
title: Polish Pass for Arthouse Site
lede: A scoped polish initiative that takes arthouse-site from scaffold-complete to a client-presentable landing page — locked on dark-mode-first feminine arthouse mystique, with a private imagery convention and an AI photo-to-illustration pipeline for NSFW-sensitive source material.
date_created: 2026-05-18
date_modified: 2026-05-18
date_authored_initial_draft: 2026-05-18
at_semantic_version: 0.0.0.2
status: Draft
category: Specification
authors:
  - Michael Staton
augmented_with: Claude Code (Opus 4.7)
tags:
  - Arthouse-Site
  - Polish-Pass
  - Portfolio
  - Typography
  - Image-Privacy
  - Astro-Knots
---

# Polish Pass for Arthouse Site

**Status**: Draft (v0.0.0.2 — scope locked, typography pending pick)
**Codename**: `arthouse-site`
**Parent spec**: [[Maintain-an-Image-Heavy-Portfolio-Site]]

---

## 1. Why this spec exists

The original [[Maintain-an-Image-Heavy-Portfolio-Site]] spec defined the full vision. The scaffold has landed (Astro 6 + Svelte 5 + Tailwind 4 + Sveltia CMS, three-mode theme plumbing, content collections, sitemap, Vercel adapter, `MarketingBlock`, `HorizontalSwipe`). What hasn't landed: a landing page the client would actually appreciate.

This pass narrows hard on **the home page** as the unit of client-presentable polish.

---

## 2. Scope (locked 2026-05-18)

### 2.1 In scope

1. **`/` (index.astro) — client-presentable.** Typography, palette, hero treatment, marketing copy rhythm, motion if warranted.
2. **Brand typography proposal** — feminine arthouse mystique, NOT a tech/dev aesthetic.
3. **Brand color palette** — replace the placeholder purple/blue/coral named colors with a feminine arthouse set.
4. **Three-mode theming discipline** — design IN dark mode (canonical for this site), but keep `light` and `vibrant` mode tokens defined and not visibly broken. Astro-Knots discipline: diverging from three-mode is a clean-up tax later.
5. **Private imagery convention** — gitignored directory for client source photos, with documented structure.
6. **AI image transformation pipeline** — separate exploration doc (§5), driver: NSFW-sensitive source photos need an obvious-AI rendering (anime-ish, illustrative) before they can appear publicly.

### 2.2 Out of scope (this pass)

- Portfolio, services, contact page polish
- WhatsApp CTA design
- Pricing tier cards
- SEO landing pages
- OG image system
- `/brand-kit` and `/design-system` build-out
- Gallery format expansion beyond what `HorizontalSwipe` already covers

These remain on the parent spec's roadmap; not blocking client landing-page review.

---

## 3. Aesthetic direction: "Feminine Arthouse Mystique"

### 3.1 The trap to avoid

Most female-artist photography portfolio sites lean on a narrow visual vocabulary that has aged poorly: tight script logos, low-contrast pastels, Squarespace defaults, Instagram-grid layouts. The result reads as "amateur boutique" rather than "atelier." We want the *register* of those sites — intimate, editorial, hand-touched, generous whitespace, body-as-subject — without the execution failures.

### 3.2 The register to hit

- Editorial-magazine typography (thin display serif, generous tracking on eyebrows)
- Asymmetric, off-grid layouts that feel composed rather than templated
- A palette that is dark but warm — not Bauhaus-black, not start-up-graphite
- Restraint on motion: maybe one hover gesture, no scroll-jacking
- Image-as-subject: imagery is the loudest element on the page; type defers

### 3.3 Hard prohibitions

- No Nerd Fonts, no Space Grotesk, no Inter for display, no JetBrains anything
- No "tech startup" gradients or neon
- No emoji
- No purple as a primary (the current placeholder palette)

### 3.4 Typography proposals (pick one — see §6)

**Option A — "Editorial Mistique"** (Vogue / Italian-magazine register)
- Display: **Italiana** (thin, high-contrast didone) — H1 / hero only
- Subhead: **Cormorant Garamond Light Italic** — H2 / pull quotes
- Body: **Cormorant Garamond** Regular — long-form
- Eyebrow / UI: **Marcellus** small-caps, tracked +120
- Accent (sparing): **Italianno** script — signature touches only

**Option B — "Botanical Atelier"** (handmade, garden, atelier-craft)
- Display: **Cormorant Garamond Light** — H1
- Subhead: **Tenor Sans** — H2
- Body: **EB Garamond** — long-form
- Eyebrow / UI: **Marcellus SC**
- Accent: **La Belle Aurore** script

**Option C — "Modern Boudoir"** (contemporary, sharper, less period-piece)
- Display: **Playfair Display Italic Light** — H1
- Subhead: **DM Serif Display** — H2
- Body: **DM Serif Text** or **Source Serif Pro Light** — long-form
- Eyebrow / UI: **DM Sans** tracked +200 uppercase
- Accent: **Petit Formal Script**

All three are Google Fonts — no licensing friction.

### 3.5 Color palette direction (to refine after typography pick)

Replace current placeholder named tokens with something in this register:

- A deep, warm dark ground (not pure black) — e.g., aubergine-black, ink-plum, midnight-mauve
- A cream/bone neutral for text on dark
- A muted rose or terracotta accent
- A single sharp metallic (champagne, antique brass) for fine rules / emphasis

Final hexes locked after the type pick so the pairing reads coherently.

### 3.6 Two-tier token note (drift surfaced)

`global.css` currently names colors with single-dash kebab-case (`--color-deep-night`) rather than the `__` BEM-ish convention from [[Maintain-Themes-Mode-Across-CSS-Tailwind]]. Not fixing silently — folding into the palette rewrite when it happens so the rename is atomic.

---

## 4. Private imagery convention

### 4.1 Problem

The client supplies real photographs, some of which are racy/NSFW. We need them locally for development and AI-transformation source material, but they must never be committed to git, never appear in `dist/`, and never be served publicly.

### 4.2 Directory structure

```
sites/arthouse-site/
  private/                    # gitignored — source-of-truth client photos
    raw/                      # original client files, untouched
    redacted/                 # cropped / blurred versions for internal review
    transform-source/         # photos staged for AI transformation
  public/
    images/
      portfolio/              # public, shipped imagery (safe-for-web)
      ai-rendered/            # AI-transformed outputs, safe for public
  src/content/
    images/                   # markdown frontmatter referencing public/images/*
```

### 4.3 .gitignore additions

```
# Private imagery — NEVER commit
/private/
```

### 4.4 Discipline rules

- `private/` is the only place raw client photos live in this working tree.
- Outputs of the AI transformation pipeline land in `public/images/ai-rendered/` after explicit human review.
- Nothing in `src/content/images/` references a `private/` path. Build-time fetch would expose them.
- A `private/README.md` (gitignored content but trackable filename if desired) documents the convention so a fresh clone makes sense.

### 4.5 Backup

Because `private/` is gitignored, the canonical recoverable copy of client photography lives outside this repo (per the universal pseudomonorepos rule). Likely: a password-managed cloud folder. The user maintains this; it is not Claude's job to back up.

---

## 5. AI image transformation (forked to exploration)

The mechanic — "real photo in, clearly-AI-generated anime/illustrative version out" — is not a one-call decision. Models, costs, fidelity, prompt structure, and consistency-across-a-shoot are all open questions.

Forked to: [[AI-Photo-to-Illustration-Transform-for-Arthouse]] (exploration). Polish pass on the home page does not block on it — the home page can ship with non-sensitive source imagery or a single transformed hero.

---

## 6. Open decisions (need user input)

1. **Typography pick** — A, B, or C from §3.4? (Or mix-and-match — common move is "display from A, body from C.")
2. **Hero image source for first cut** — Do we have a non-sensitive photo we can use unmodified for the first home-page polish iteration, or do we wait for the AI-transform pipeline?
3. **Marketing copy** — Current home page has placeholder copy ("Art That Moves You"). Is the client supplying real copy, or do we draft proposals?

---

## 7. Execution plan (once §6 is answered)

To be turned into prompts under `context-v/prompts/`:

1. **Lock palette + type** — rewrite `global.css` named tier with feminine arthouse palette, wire chosen Google Fonts via Astro asset pipeline, update Tailwind `@theme` block.
2. **Hero rebuild** — replace current split-grid with the chosen composition. Asymmetric, image-led, type-deferent.
3. **MarketingBlock typographic refit** — re-skin `basics/MarketingBlock.astro` with the locked type scale.
4. **Single motion gesture** — pick one (image reveal on load, eyebrow text fade-in on scroll, hover state on the WhatsApp CTA). Not all.
5. **Three-mode sanity** — verify `light` and `vibrant` don't visibly explode even if no design effort goes there.
6. **Pre-share walkthrough** — read the page on mobile (iOS Safari + Android Chrome), check load on cold cache, confirm no `private/` paths leaked.

---

## 8. References

- [[Maintain-an-Image-Heavy-Portfolio-Site]] — parent spec
- [[Maintain-Themes-Mode-Across-CSS-Tailwind]] — three-mode blueprint
- [[Styles-Architecture-Blueprint]] — two-tier token system
- [[AI-Photo-to-Illustration-Transform-for-Arthouse]] — forked exploration
