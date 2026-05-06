---
title: Optimize for Localized OpenGraph Metadata and Banner Image with Overlay
lede: We want WhatsApp / iMessage / Twitter shares of any project page to surface a banner image that's visibly *about that project* — title baked in, not just a generic site-wide image. Today we have project-specific title and description in the OG meta tags but a shared placeholder image. Documents the four paths to a fix and the trigger that should reopen this work.
date_authored_initial_draft: 2026-04-27
date_authored_current_draft: 2026-04-27
date_authored_final_draft: null
date_first_published: null
date_last_updated: 2026-04-27
at_semantic_version: 0.0.1.0
status: Open
augmented_with: Claude Code (Opus 4.7)
category: Issue Resolution
tags:
  - OpenGraph
  - Social-Sharing
  - WhatsApp
  - OG-Image
  - Banner-Generation
  - Image-Overlay
  - BannerWithOverlay
  - Build-Time-Composite
  - Vercel-OG
  - Ideogram-Pipeline
  - Render-Pipeline-Boundary
authors:
  - Michael Staton
date_created: 2026-04-27
date_modified: 2026-04-27
from: fullstack-vc
from_path: issue-resolutions/Optimize-for-Local-OpenGraph-Metadata-and-Image-w-Overlay.md
---
<!-- Rolled up from fullstack-vc/context-v/issue-resolutions/Optimize-for-Local-OpenGraph-Metadata-and-Image-w-Overlay.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

# Optimize for Localized OpenGraph Metadata and Banner Image with Overlay

**Status:** Open · accepted-status-quo for v0.1
**Site:** `sites/fullstack-vc`
**Surface:** `/projects/`, `/projects/[slug]/` — and any future content collection that wants per-entry share previews

***

## The Problem

When a user shares a link to a specific project (e.g. `https://fullstack-vc.com/projects/content-farm/`) into WhatsApp, iMessage, Twitter, or Slack, we want the share preview to be *highly localized* — visibly about that project — not a generic site banner.

Today, after the Projects-surface ship (changelog `2026-04-27_02`):

| Element | Per-project? | Localization quality |
|---|---|---|
| `<title>` (OG title) | ✅ Yes | "Content Farm · FullStack VC" |
| `<meta name="description">` (OG description) | ✅ Yes | Project's `summary` (or `lede`) |
| `<meta property="og:image">` | ❌ No | Falls back to site-wide `/og-default.jpg` for every project |

So the *text* in the share preview is correct, but the *image* — the most visually dominant part of a WhatsApp link card — is the same for every project until we do additional work.

## Why Care

WhatsApp and iMessage shares are how this community actually moves around — members forward project links to peers and prospective members in personal chats more than they tweet them. A share preview that visibly says "Content Farm · FullStack VC" with a unique banner is a different artifact from one with a generic dojo image. The first acts as a recommendation; the second looks like a generic site link.

This is a polish item, not a blocker. The current state is *correct* — text is localized, image falls through cleanly — but it's not yet *optimized*.

***

## What I Almost Got Wrong (Investigation)

In conversation I casually claimed: *"the alternative — overlay title/lede/icon on the site-wide dojo image — already works because we have `BannerWithOverlay.astro`."*

That was half-right and one critical step short.

### What `BannerWithOverlay.astro` actually does

Reading `sites/fullstack-vc/src/components/changelog/BannerWithOverlay.astro` carefully:

```astro
interface Props {
  src: string;        // Path to the layerized base image
  title: string;      // Composited HTML/CSS over the lower-left
  eyebrow?: string;   // Optional small uppercase label
  subtitle?: string;  // Optional secondary line
  alt?: string;
  href?: string;
}
```

It renders an `<img>` with an absolutely-positioned `<figcaption>` carrying real HTML text in our brand fonts (`--font-display`, `--font-code`), plus a mode-aware linear-gradient scrim for legibility. **For the on-page banner, this works perfectly** — pixel-perfect typography, brand-correct fonts, edit-without-regen, indexable, screen-reader friendly.

### Where my claim collapsed

WhatsApp, iMessage, Twitter, Slack, and every other social/chat platform that renders an OG preview fetch the **single static URL** referenced in:

```html
<meta property="og:image" content="https://fullstack-vc.com/og/projects/content-farm.png" />
```

They do **not** load HTML, do not execute CSS, do not composite an overlay. They show the image file as-is. Whatever HTML/CSS overlay the *page* renders is invisible to the share preview.

So `BannerWithOverlay.astro`'s overlay never reaches the WhatsApp share. **The on-page banner and the share image are two separate concerns that look the same but live on opposite sides of the render-pipeline boundary.**

### The render-pipeline boundary

```
                    ┌────────────────────────────────────┐
                    │   Browser (renders HTML, runs JS)  │
                    │                                    │
                    │   ✓ BannerWithOverlay.astro works  │
                    │   ✓ Mode-aware scrim works         │
                    │   ✓ HTML title text composites     │
                    └────────────────────────────────────┘
                                     ▲
                                     │ requests page
                                     │
   ─────────────────────  RENDER BOUNDARY  ────────────────
                                     │
                                     │ requests image only
                                     ▼
                    ┌────────────────────────────────────┐
                    │   WhatsApp / iMessage / Twitter    │
                    │                                    │
                    │   ✗ No HTML, no CSS, no JS         │
                    │   Just GET <og:image URL>          │
                    │   Show whatever pixels come back   │
                    └────────────────────────────────────┘
```

The fix has to live below the line — *the image file itself* must contain the localized title.

***

## Four Paths to a Fix

| # | Path | What you get | Cost | Reversibility |
|---|---|---|---|---|
| 1 | Run existing `gen:content-banners` script (already wired, prompts seeded in this commit) | Unique illustrative banner per project, **no title baked in** | ~$0.15 × N projects, one-time | High — delete output, re-run |
| 2 | Buildtime composite script (`canvas` / `satori` → PNG written to `public/og/projects/{slug}.png`) | Title + lede + icon burned into the share image; fully localized | New script, ~1 day work | High — outputs are static files; delete to revert |
| 3 | SSR endpoint with `@vercel/og` (e.g. `/api/og/projects/[slug].png`) | Same as #2 but on-demand at request time | New endpoint, ~½-day work; requires Vercel | Medium — endpoint stays in code, but no static artifacts |
| 4 | Status quo: site default `/og-default.jpg` for every project | Text in share is localized; image is generic | $0 | N/A |

### Path 1 — Ideogram banner generation (text-stripped)

The existing pipeline at `scripts/generate-content-banners-on-dir.ts` reads `image_prompt` from frontmatter, runs Ideogram → Layerize Text → saves to `public/og/{dir}/{slug}__{hash}.png`, and writes the public path back to the file's `og_image:` field.

Critical detail: the Layerize pass **strips text from the generated image**. The pipeline is intentionally text-free so pages can composite their own typography on top.

For our purposes that means each project gets a *unique illustrative banner* but **the banner does not contain the project title**. WhatsApp shows a unique image per project — better than today — but a glance at the share doesn't read "Content Farm." The illustration has to do that work alone.

Cost: ~$0.15 per banner × ~8 projects = ~$1.20. One command:
```bash
INPUT_DIR=src/content/projects \
OUTPUT_DIR=public/og/projects \
pnpm --filter fullstack-vc gen:content-banners
```

### Path 2 — Buildtime composite script

Take a base image (the shared dojo image OR the per-project Ideogram output from Path 1), composite the project title + lede + icon onto it server-side at build time, write the result to `public/og/projects/{slug}.png`, set the `og_image` frontmatter to that path.

Two reasonable implementation choices:

- **`@vercel/og`** (uses `satori` + `resvg`) — render JSX → SVG → PNG. Best brand-fidelity (real CSS, real fonts).
- **`sharp` + a pre-rendered SVG title** — composite an SVG title onto the base PNG. Lighter dependency, less flexible.

This is the *correct* answer for highly-localized WhatsApp shares. The output is a static PNG with title baked in; WhatsApp shows it pixel-perfect every time. No SSR cost, no per-request work.

Sketch:

```ts
// scripts/composite-project-og-images.ts
import { ImageResponse } from '@vercel/og';
import sharp from 'sharp';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parse as parseFrontmatter } from 'gray-matter';

for (const file of projectFiles()) {
  const { data } = parseFrontmatter(readFileSync(file, 'utf8'));
  const base = data.og_image ?? '/imageRep__AgenticVC-Dojo.png';
  const overlay = await renderOverlay({
    title: data.title,
    eyebrow: data.working_group_name ?? data.category,
    subtitle: data.lede,
    icon: data.icon,
  });
  const out = await sharp(base).composite([{ input: overlay }]).toFile(`public/og/projects/${slug}.png`);
  // write `og_image: /og/projects/{slug}.png` back to frontmatter
}
```

### Path 3 — SSR endpoint with `@vercel/og`

Like Path 2 but rendered on demand at `/api/og/projects/[slug].png`. WhatsApp fetches once, Vercel caches. Same visual outcome.

Pros: no buildtime regeneration when content changes, no static artifacts to manage.
Cons: requires the Vercel adapter (already in `package.json`); each project's first share triggers a cold render; cache headers need tuning.

This is what most "modern" sites do (Vercel docs uses this for `og:image`). It's the lowest ongoing maintenance burden.

### Path 4 — Status quo (current state)

Every project's OG image is `/og-default.jpg`. Text in the share preview is project-specific (title + description); image is generic.

Honest: this is fine for v0.1. Most reads of a project link will land on the page itself, where the on-page banner CAN be localized via `BannerWithOverlay`-style composition (separate work, not blocked by this issue). The share preview being generic is a polish miss, not a correctness bug.

***

## Decision: Status Quo for v0.1

We're keeping Path 4 for now. Reasoning:

1. The bigger correctness goal — *project-specific OG title and description* — is already done.
2. Path 1 is cheap and unblocks at least illustrative localization, but **without baked-in title it doesn't fully solve the WhatsApp legibility goal**, so the work-to-payoff ratio is poor.
3. Path 2 / Path 3 are the right answers but cost a half-day to a day of focused work, and there isn't yet a real need (FullStack VC isn't yet sharing project links into chats at volume).
4. Two related decisions stay open: whether the *on-page* banner should also use `BannerWithOverlay`-over-shared-image (cheap) vs. per-project Ideogram (richer), and whether to first-fix `BannerWithOverlay`'s Tier-1 token leakage.

***

## Reopen Triggers

Reopen this issue when **any one** of the following becomes true:

- [ ] A FullStack VC member reports that a shared link previewed badly in WhatsApp / iMessage / a chat group.
- [ ] We see external traffic to `/projects/[slug]/` from chat referrers (Twitter / Discord / Slack are detectable; WhatsApp is dark traffic but a spike in direct-typed visits with a project URL is a signal).
- [ ] We add a 10th+ project and "every share looks the same" becomes visibly bad in proximate-share scenarios (multiple projects forwarded in the same chat).
- [ ] We need to share another *kind* of artifact (events, case studies, client engagements) where the same WhatsApp-localization concern applies — at that point the buildtime composite script is reusable infrastructure across collections.
- [ ] The Vercel adapter / SSR cost no longer feels like overkill for a small site.

## When We Reopen — Acceptance Criteria

A resolution should:

- [ ] Produce a per-project share image with the project title legibly burned in (font-correct, contrast-correct, brand-correct).
- [ ] Use a single shared base image as backdrop **OR** a per-project Ideogram output — the choice is design, not engineering.
- [ ] Survive WhatsApp's preview cache (initial share previews can be wrong; verify via WhatsApp Web's "share with self" or `https://opengraph.xyz/`).
- [ ] Not require manual frontmatter edits per project beyond what's already there (`title`, `lede`, `icon`).
- [ ] Apply uniformly to the gallery page (`/projects/`), each detail page (`/projects/[slug]/`), and any future collection that adopts the same pattern.
- [ ] Pass the two-tier token discipline — no `--color__*` token reads in any new image-rendering code.

## Pre-Reopen Cleanup (Independent)

Two adjacent issues worth resolving before this reopens, regardless of which path we take:

- [ ] **`BannerWithOverlay.astro` reads Tier-1 named tokens directly** (`--color__obsidian`, `--color__ink`, `--color__bone`, `--color__lime-terminal`). Pre-existing technical debt; should be refactored to read only Tier-2 semantic tokens before being reused beyond the changelog.
- [ ] **`BoilerPlateHTML.astro` MIME-type detector is naive** — `ogImage.endsWith('.png') ? 'image/png' : 'image/jpeg'` mislabels `.webp` as JPEG. Easy fix; affects social platforms that strict-check the MIME.

## Related Documents

- `astro-knots/CLAUDE.md` — two-tier token discipline (relevant to any new banner-rendering code).
- `sites/fullstack-vc/context-v/sitemap/pages/Page__projects-index.astro.md` — the page spec; SEO & Meta section refers to this concern (out-of-scope for v0.0.1.0).
- `sites/fullstack-vc/changelog/2026-04-27_02.md` — the Projects-surface ship that established the current OG plumbing and seeded `image_prompt:` on every project.
- `sites/fullstack-vc/scripts/generate-content-banners-on-dir.ts` — the existing Ideogram banner generator (Path 1).
- `sites/fullstack-vc/src/components/changelog/BannerWithOverlay.astro` — the on-page overlay pattern; informative but does NOT solve the OG share use case.
- `sites/fullstack-vc/src/layouts/BoilerPlateHTML.astro` — where all OG / Twitter meta tags emit; the page-level override surface.

## Changelog

- **0.0.1.0** (2026-04-27) — Initial parking-lot entry: problem statement, the BannerWithOverlay misconception, the render-pipeline boundary diagram, four resolution paths with cost/reversibility, status-quo decision, reopen triggers, acceptance criteria.
