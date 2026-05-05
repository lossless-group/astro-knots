---
title: "Set up a Splash Page with Changelog and Context-V Rendering"
lede: "Brief prompt for scaffolding a small standalone repo (its own GitHub project, deployed to GitHub Pages) that renders its own changelog and context-v markdown through @lossless-group/lfm."
date_authored_initial_draft: 2026-05-03
date_authored_current_draft: 2026-05-03
date_authored_final_draft: "[]"
date_first_published: "[]"
date_last_updated: "[]"
at_semantic_version: 0.1.0.0
augmented_with: Claude Code (Claude Opus 4.7)
category: Prompts
date_created: 2026-05-03
date_modified: 2026-05-03
status: Draft
tags: [LFM, JSR, GitHub-Pages, Splash-Page, Changelog, Standalone-Site, Onboarding]
authors:
  - Michael Staton
image_prompt: "A small lighthouse with a single beam, sitting on its own island, lit by a beacon labeled LFM."
---

# Set up a Splash Page with Changelog and Context-V Rendering

## Why this prompt exists

Many of our smaller projects live in their own GitHub repos (not the astro-knots monorepo) and deploy as **GitHub Pages** sites. They each need a minimal landing surface that:

- Shows what the project is (splash / hero).
- Renders the project's own `changelog/` directory through LFM.
- Optionally renders a `context-v/` directory the same way.

This is **not** the same as the astro-knots `New-Site-Quickstart-Guide.md` (which scaffolds a workspace member). This prompt is for **standalone projects** that consume LFM as a published JSR dependency.

## Source of truth

**Always read first:** [`packages/lfm/README.md`](../../packages/lfm/README.md) — also published at **[jsr.io/@lossless-group/lfm](https://jsr.io/@lossless-group/lfm)**.

The README is canonical for install + usage. This prompt only adds the splash-page-specific glue.

## Steps

### 1. Scaffold a minimal Astro site

```bash
pnpm create astro@latest my-project-splash -- --template minimal --typescript strict
cd my-project-splash
```

(Astro Static is fine — splash + changelog renders to a static export, deploys cleanly to GitHub Pages.)

### 2. Install LFM from JSR

Follow the README — preferred form is the **npm-alias** in `package.json`:

```jsonc
{
  "dependencies": {
    "@lossless-group/lfm": "npm:@jsr/lossless-group__lfm@^0.2.2"
  }
}
```

Plus the `.npmrc`:

```ini
@jsr:registry=https://npm.jsr.io
```

Then `pnpm install`.

### 3. Copy the renderer pattern

Lift the canonical Astro renderer from `packages/lfm-astro/components/` into `src/components/markdown/`:

- `AstroMarkdown.astro` — recursive MDAST → JSX renderer.
- `Sources.astro` — citation list at the bottom of a page.
- `Callout.astro`, `CodeBlock.astro` — only if the changelog uses them.

The render-time behavior is identical to the monorepo sites; nothing about being standalone changes how it walks the tree.

### 4. Wire the changelog route

A typical layout:

```
src/
  pages/
    index.astro              # splash
    changelog/
      index.astro            # list of all changelog entries
      [slug].astro           # one entry, rendered through LFM
  content/
    changelog/               # the project's own *.md files
```

Inside `[slug].astro`:

```ts
import { parseMarkdown } from '@lossless-group/lfm';
import AstroMarkdown from '../../components/markdown/AstroMarkdown.astro';
import Sources from '../../components/markdown/Sources.astro';

const source = await readFile(`src/content/changelog/${slug}.md`, 'utf-8');
const tree = await parseMarkdown(source);
const citations = (tree as any).data?.citations?.ordered ?? [];
```

```astro
<article class="prose">
  <AstroMarkdown node={tree} />
</article>
<Sources citations={citations} />
```

### 5. (Optional) Add context-v

If the project keeps a `context-v/` directory (specs, blueprints, prompts), mirror the changelog pattern at `/context-v/[slug]`. Same `parseMarkdown` + `AstroMarkdown` flow — no per-category special-casing needed for a basic render.

### 6. Deploy to GitHub Pages

Astro's official guide: [docs.astro.build/en/guides/deploy/github/](https://docs.astro.build/en/guides/deploy/github/).

Two checks specific to this setup:

- Set `site` and `base` in `astro.config.mjs` to the GitHub Pages URL.
- Ensure the GitHub Action workflow can read JSR — JSR is public, no auth needed for `@jsr:registry=https://npm.jsr.io`. (No `GITHUB_TOKEN` required for the LFM install itself.)

## What you get

- Identical changelog rendering to the rest of the lossless-group ecosystem.
- One LFM upgrade upgrades the rendering everywhere; the splash project just bumps the JSR version.
- The project's own changelog directory becomes its rendered "changelog" surface, with no per-project markdown pipeline divergence.

## What's NOT in scope here

- The OG link-preview substitutions (`:::link-preview` / `:::link-rollup`) — only needed if the changelog actually uses them. The renderer arm in `AstroMarkdown.astro` is additive; copy it from `sites/mpstaton-site/src/components/markdown/AstroMarkdown.astro` if you want it.
- Hover popovers / OG fetch — same. The cache + dispatcher land in the LFM package; the splash project enables them by passing `ogFetch: { enabled: true, ... }` to `parseMarkdown`.
- Theme / brand chrome — splash projects pick their own. LFM is renderer-agnostic.
