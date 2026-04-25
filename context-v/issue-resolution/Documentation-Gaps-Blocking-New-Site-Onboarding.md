# Documentation Gaps Blocking New Site Onboarding

**Date:** 2026-04-25  
**Project/System:** Astro-Knots monorepo — cross-site documentation and patterns  
**Components/Files Affected:**
- `CLAUDE.md` (root)
- `README.md` (root)
- `packages/lfm-astro/` (missing package.json)
- `context-v/blueprints/Maintain-Extended-Markdown-Render-Pipeline.md`
- `sites/mpstaton-site/package.json` (workspace:^ dependency)

## The Problem

When attempting to start a new Astro site in the astro-knots monorepo, a developer or AI assistant reading the documentation encounters multiple contradictions, dead ends, and missing instructions that make it impossible to scaffold a site confidently without prior tribal knowledge.

This was discovered during the TWF site's LFM integration (April 2025). After successfully implementing the strategies collection with full markdown rendering, a fresh-eyes review of the docs revealed that replicating the same work on another site would require guesswork at multiple steps.

## What Specifically Doesn't Work

### 1. `packages/lfm-astro/` is a ghost package

The `packages/lfm-astro/` directory contains five Astro components (AstroMarkdown, Callout, CodeBlock, MarkdownImage, Sources) but has **no `package.json`**. It is not registered in `pnpm-workspace.yaml`. The blueprint (`Maintain-Extended-Markdown-Render-Pipeline.md`) calls it the "canonical source" for markdown components, but CLAUDE.md tells you to copy from `mpstaton-site` instead.

A newcomer finds:
- CLAUDE.md Step 3 (line ~186): "Copy the recursive MDAST-to-JSX renderer from `mpstaton-site`"
- Blueprint (line ~227): "The canonical source is `packages/lfm-astro/components/AstroMarkdown.astro`"
- Reality: both locations have the components, but neither is clearly authoritative

### 2. Reference site violates the critical constraint

`mpstaton-site/package.json` uses `"@lossless-group/lfm": "workspace:^"` — but CLAUDE.md's Critical Constraint section states: "Sites do NOT use `workspace:*` links — those break independent deployment."

Since mpstaton-site is documented as the primary reference implementation for LFM rendering, anyone copying its package.json gets an undeployable site.

### 3. No "start a new site" scaffolding guide

CLAUDE.md section "Adding a New Client Site" (lines ~476-502) covers adding a git submodule to the workspace. It does not cover:
- What dependencies to install
- What `astro.config.mjs` should contain
- What directory structure to create
- What to copy first and in what order
- How to set up the content pipeline

### 4. Blueprint describes structures that don't exist

`Maintain-Extended-Markdown-Render-Pipeline.md` references:
- `packages/astro/src/layouts/MarkdownArticle.astro` — does not exist
- `packages/astro/src/components/articles/MarkdownArticleOnPage.astro` — does not exist
- A layout-level unified pipeline — not implemented in any site

The blueprint is aspirational design from Dec 2025 that was never built. It reads as current documentation.

### 5. Environment-driven config pattern is fictional

CLAUDE.md lines ~553-568 show a `SITE_BRAND=cilantro` / `SITE_MODE=dark` / `FEATURE_FLAGS=search,blog` pattern. No site actually uses this pattern. Each site has its own ad-hoc `.env` structure.

### 6. `@knots/astro` README is misleading

The README shows `import { Button } from "@knots/astro"` — but `@knots/*` packages are never imported at runtime. The README contradicts the core philosophy of the project.

## The Solution

### Immediate fixes applied (April 2026)

1. **Created `context-v/prompts/New-Site-Quickstart-Guide.md`** — a concrete, step-by-step guide for scaffolding a new Astro site in the monorepo, covering dependencies, configuration, directory structure, content collections, and LFM integration.

2. **Updated `CLAUDE.md`** — added a "New Site Quickstart" section pointing to the guide and clarifying the copy-from source for markdown components.

3. **Updated `README.md`** — added quickstart reference and clarified the documentation landscape.

### Fixes still needed

| Issue | Fix | Owner | Priority |
|-------|-----|-------|----------|
| `packages/lfm-astro/` has no package.json | Add a minimal package.json with name `@knots/lfm-astro`, mark as private, or document it explicitly as a pattern-only directory | TBD | High |
| mpstaton-site uses `workspace:^` | Change to `"^0.2.1"` (or current published version) before next deploy, or document it as dev-only | TBD | High |
| Blueprint references nonexistent structures | Add a status banner at the top: "Draft — proposed architecture, not yet implemented. For current implementation, see the New Site Quickstart Guide." | TBD | Medium |
| `@knots/astro` README shows runtime imports | Rewrite to show copy-pattern workflow, not `import` syntax | TBD | Medium |
| Environment-driven config pattern | Remove from CLAUDE.md or rewrite to document what sites actually do | TBD | Low |
| No version published for LFM 0.2.x | Publish `@lossless-group/lfm@0.2.1` so sites can use native `remark-citations` and fixed `remark-callouts` without polyfills | TBD | High |

## Lessons Learned

1. **Documentation written during design diverges from documentation needed during implementation.** The blueprint was written when the project was exploring shared component packages. The actual pattern evolved to copy-and-adapt. The docs never caught up.

2. **Reference implementations must follow their own rules.** If CLAUDE.md says "no workspace:* in site package.json," the reference site can't use workspace:*. Developers copy what they see, not what they read.

3. **"Copy and adapt" needs a canonical source and a clear copy path.** Having components in both `packages/lfm-astro/` and `sites/mpstaton-site/src/components/markdown/` without clarity on which is authoritative creates confusion. The answer should be `packages/lfm-astro/` — but it needs to be a proper pattern package.

4. **Polyfills in site code indicate unpublished package features.** The `parseContent` utility in twf_site exists because LFM 0.2.x isn't published. Publishing it would eliminate the need for per-site polyfills for citations and callout fixes.
