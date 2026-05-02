# Astro Knots

A workspace for developing and maintaining multiple Astro/Svelte content-driven websites. Started as a pattern library, evolving toward selective package sharing where it genuinely makes sense. We call this a "pseudo-monorepo" because it's not a true monorepo but it does have some monorepo-like characteristics.

Developed and maintained by [The Lossless Group](https://lossless.group)

Built with love using Astro & dashes of Svelte, Reveal.js, and Tailwind CSS.

## What This Actually Is

Astro Knots allows for shared patterns and context documents to be shared across related projects. We sometimes attempt to create "psued-packages" (packages that exist only to be copied from) in a monorepo with `@knots/*` co-location. Developers actively working on a site copy from these packages, as well as pull from components and context documents from projects under the same umbrella that is openable in an IDE and referenceable by AI Code Assistants. 

Do our packeages work? For most, "sort of." The pseudo-monorepo is useful for co-locating sites and seeing patterns side by side, but maintaining abstracted, style-free component packages that every site copies from proved impractical with a small team. We gave up on `@knots/*` as true importable packages early on. 

> [!ALERT] We have one true package: `@lossless-group/lfm` (Lossless Flavored Markdown)
>
> This is the only package that is actually published and used across sites. It's a markdown processor framework that both extends standard markdown with custom syntax and processing, and makes it easy for developers and clients to implement their own custom syntax and processing.

**What survived and works:**
- Co-located development — all sites visible in one workspace for pattern comparison
- Git submodules — each site is its own repo, independently deployable
- Shared context — `context-v/` documents (specs, blueprints, prompts, reminders) that guide development across all sites
- Context files can and do live in individual sites when they're specific to that site. When they become applicable to another site, we can cross-reference and load into context windows with `@context-v/*`. If it will become a pattern across multiple sites, we can move it to the shared "pseudo-monorepo" location with the same directory, file, and frontmatter conventions.
- Selective package publishing — when something genuinely needs to be shared as a dependency (not just a pattern), we publish it. The first real example: `@lossless-group/lfm` (Lossless Flavored Markdown)

**What didn't work as planned:**
- `@knots/*` as imported dependencies — too much abstraction overhead for the value
- "Copy when you remember" — we usually didn't remember
- Style-free component patterns, or "structure components" — sites diverge too much in design for generic components to be useful

**The current stance:** This is a **pseudo-monorepo evolving toward more sharing, but only where it's justified**. Don't assume everything is a shared package. Don't hard-code the workspace. Yet, don't assume everything is copy-paste. The right answer depends on the specific code: markdown processing pipelines genuinely benefit from a shared package; UI components don't.

## Sites

_Listted in the order of their recency and likely relevance to future projects_

| Site | Repo | Status | Notes |
|------|------|--------|-------|
| fullstack-vc | [lossless-group/fullstack-vc](https://github.com/lossless-group/fullstack-vc) | Active | Team initiative  |
| mpstaton-site | [lossless-group/mpstaton-site](https://github.com/lossless-group/mpstaton-site) | Active | Personal portfolio/CV, actively maintained without client constraints |
| banner-site | [lossless-group/emblem-site](https://github.com/lossless-group/emblem-site) | Active | Client site |
| hypernova-site | [hypernova-labs/hypernova-site](https://github.com/hypernova-labs/hypernova-site) | Active | Client site |
| dark-matter | [lossless-group/matter-site](https://github.com/lossless-group/matter-site) | Active | Client site |
| twf_site | [lossless-group/the-water-foundation-site](https://github.com/lossless-group/the-water-foundation-site) | Active | The Water Foundation |
| cilantro-site | [lossless-group/cilantro-site](https://github.com/lossless-group/cilantro-site) | Active | Client site, strong reference implementation |
| cogs-site | | In progress | |
| coglet-shuffle | | In progress | Nested astro-site |

All sites deploy independently via Vercel from their own repos.

## Published Packages

These are real packages that sites install as dependencies:

### @lossless-group/lfm

**Lossless Flavored Markdown** — a shared remark/rehype pipeline for extended markdown processing.

- **GitHub Packages:** `pnpm add @lossless-group/lfm` (requires `.npmrc` with GitHub Packages registry)
- **JSR:** [jsr.io/@lossless-group/lfm](https://jsr.io/@lossless-group/lfm)
- **Source:** `packages/lfm/`
- **Spec:** `context-v/specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md`

Bundles unified, remark-parse, remark-gfm, remark-directive, and custom plugins into a single import:

- **remark-callouts** — Normalizes Obsidian `> [!type] Title` callouts into directive nodes
- **remark-citations** — Transforms hex-code/numeric footnote identifiers (`[^a1b2c3]`) into sequentially-numbered citations with structured metadata parsing (title, URL, source, dates)

```ts
import { parseMarkdown } from '@lossless-group/lfm';
const tree = await parseMarkdown(markdownContent);

// Citations are attached to the tree after parsing
const citations = tree.data?.citations?.ordered ?? [];
// Each citation has: index, title, url, source, publishedDate, raw
```

**What the citations plugin does:** Authors write stable hex-code footnotes that never need renumbering when inserting/reordering. The plugin assigns sequential display numbers by order of first appearance, parses structured definitions into typed metadata, and attaches the full citation dataset to `tree.data.citations` for renderers to consume.

Currently used by mpstaton-site for content rendering. Being adopted by other sites (twf_site next).

## Pattern Packages (`@knots/*`)

These are **not published packages**. They're workspace-local pattern references — source code you look at, copy from, and adapt. They exist for co-located development convenience and as a "cookbook" of patterns.

| Package | Purpose |
|---------|---------|
| `@knots/tokens` | Design token structure (colors, scales) |
| `@knots/icons` | SVG icon helper pattern |
| `@knots/astro` | Astro component patterns (Button, AstroMarkdown, CodeBlock, Callout) |
| `@knots/svelte` | Svelte component patterns |
| `@knots/brand-config` | Brand configuration type and CSS var helper |
| `@knots/tailwind` | Tailwind 3 preset/plugin (needs TW4 migration) |

The `@knots/astro` markdown components (AstroMarkdown, CodeBlock, Callout) are particularly useful as a starting point — mpstaton-site copied and adapted these for its content rendering.

## Portfolio-Wide Job Aggregator

A reusable pattern for VC client sites to aggregate and display job openings across their portfolio companies. Scrapes careers pages daily via free public JSON APIs, then renders them as a filterable jobs board.

- **Spec:** `context-v/specs/Portfolio-Wide-Job-Aggregator.md`
- **First implementation:** banner-site (Banner.vc) — 3 portfolio companies, 194 live jobs
- **Supported providers:** Greenhouse, Ashby, Pinpoint (all free, unauthenticated JSON APIs)
- **Runtime:** Node 22 native TypeScript (`--experimental-strip-types`), zero extra dependencies
- **Pipeline:** `pnpm validate:careers` (build-time URL validation + provider detection) → `pnpm scrape:jobs` (daily fetch from provider APIs) → static Astro pages
- **Features:** Smart boilerplate skipping, HTML-rich snippets with `set:html` rendering, structured salary data (Pinpoint), mode-aware logo switching, configurable card variants
- **Future:** "Put Your Name in the Arena" — candidates connect via LinkedIn, VC curates and forwards warm intros to portfolio hiring managers

Designed as a copy-and-adapt pattern per site. If 3+ clients adopt it, the scraping logic becomes a candidate for `@lossless-group/portfolio-jobs`.

## Context-V

The `context-v/` directory contains project documentation organized by type:

- **specs/** — Formal specifications (LFM, Context-V fetcher, etc.)
- **blueprints/** — Architecture and design patterns
- **prompts/** — Step-by-step implementation guides
- **reminders/** — Conventions and constraints
- **explorations/** — Pre-spec research and understanding documents
- **strategy/** — Business and project strategy

Sites can fetch context-v documents from multiple repos using the Context-V fetcher system. mpstaton-site displays these as browsable "Rabbit Holes."

## In-Site Reference Pages: `/brand-kit` & `/design-system`

Every Astro-Knots site ships with **two internal reference pages** that together replace what most teams use Storybook (or a separate Design System Manager) for. We tried those tools and found that AI assistants working inside the site's own codebase produce pages that are just as useful — often better — because components render in their real theme, mode, layout, and tokens. No drift, no parallel build.

| | Brand Kit (`/brand-kit`) | Design System (`/design-system`) |
|---|---|---|
| **Audience** | Stakeholders, brand reviewers, marketing | Developers, AI assistants, contributors |
| **Scope** | Brand experience essentials — colors, type, marks, signature layouts | Exhaustive component catalog with variants, props, CSS contracts |
| **Update cadence** | Rarely — only when brand evolves | Continuously — every new component lands here |

Both pages use the standard `BaseThemeLayout` and surface the theme + mode toggle so reviewers can verify all three modes (light / dark / vibrant) without leaving the page. Both emit `noindex, nofollow`.

**Maintenance motion:** every new component is added to `/design-system` in the same PR that introduces it. Brand evolutions update `/brand-kit` first, before propagating elsewhere.

**Full conventions:** [`context-v/blueprints/Maintain-Design-System-and-Brandkit-Motions.md`](context-v/blueprints/Maintain-Design-System-and-Brandkit-Motions.md).

**Canonical references:**
- Brand Kit: `sites/hypernova-site/src/pages/brand-kit/`, `sites/twf_site/src/pages/brand-kit/`
- Design System: `sites/dark-matter/src/pages/design-system/`

## Design System Viewer

`design-system-viewer/` — An older internal tool (not deployed) for visualizing tokens, icons, and components across the workspace. Currently minimal scaffolding on Astro 6 + Tailwind 4. The aspiration was a shared micro-frontend that each site could embed, but the in-site `/design-system` pattern (above) has largely superseded it. Kept around as a sandbox.

## Starting a New Site

See the full guide: **`context-v/prompts/New-Site-Quickstart-Guide.md`**

The short version:
1. Create a separate git repo for the site
2. Add it as a submodule: `git submodule add <url> sites/new_site`
3. Register in `pnpm-workspace.yaml`
4. Install: `pnpm add astro@^6 tailwindcss@^4 @tailwindcss/vite@^4 typescript@^6`
5. Wire up the **three-mode theme system** (light / dark / vibrant) — copy `theme-switcher.js` + `mode-switcher.js` from `sites/hypernova-site/src/utils/`. Use the **two-tier token convention**: BEM-ish named tokens (`--color__blue-azure`, `--font__lato`) at the top of `theme.css`, kebab-case semantic tokens (`--color-primary`, `--font-heading-1`) referencing them — Tailwind v4 only generates utilities for the kebab-case tier. See [Themes blueprint](context-v/blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind.md).
6. Ship the **two reference pages**: `/brand-kit/index.astro` and `/design-system/index.astro`. See [Design System & Brand Kit blueprint](context-v/blueprints/Maintain-Design-System-and-Brandkit-Motions.md).
7. (Optional) Copy markdown rendering components from `packages/lfm-astro/components/` and `parse-content.ts` from `sites/twf_site/` if the site needs LFM rendering.

**Reference implementations by concern:**
- **LFM + markdown rendering:** twf_site (cleanest, includes `parseContent` utility)
- **Content rendering + DocCards:** mpstaton-site
- **SEO/OG + environment config:** cilantro-site

## Markdown Rendering Components (`packages/lfm-astro/`)

The `packages/lfm-astro/components/` directory is the **canonical copy source** for markdown rendering components. It contains five Astro components designed to render MDAST trees produced by `@lossless-group/lfm`:

| Component | Purpose |
|-----------|---------|
| `AstroMarkdown.astro` | Recursive MDAST renderer (20+ node types, scoped list styles for Tailwind) |
| `Sources.astro` | Citation list with anchor links |
| `Callout.astro` | Styled callout boxes (tip, warning, danger, etc.) |
| `CodeBlock.astro` | Fenced code blocks with language label |
| `MarkdownImage.astro` | Image directives with float/caption/source attribution |

Copy these into your site's `src/components/markdown/` and adapt to your design. They are pattern references, not runtime imports.

## Quick Start

```bash
# Always use pnpm — npm/yarn will break workspace resolution
pnpm install

# Run a site
pnpm --filter mpstaton-site dev
pnpm --filter hypernova-site dev
pnpm --filter cilantro-site dev

# Build a site
pnpm --filter mpstaton-site build

# Run the design system viewer
pnpm --filter design-system-viewer dev
```

Note: `@lossless-group/lfm` is installed from GitHub Packages. If pnpm complains about auth, set `GITHUB_TOKEN`:

```bash
GITHUB_TOKEN=$(gh auth token) pnpm install
```

## Submodule Management

Sites are git submodules with independent version control:

```bash
# Initialize all submodules
git submodule update --init --recursive

# Update a submodule to latest
git submodule update --remote sites/cilantro-site

# Work inside a submodule (normal git workflow)
cd sites/cilantro-site
git checkout main
git pull
# ... make changes ...
git add .
git commit -m "Update site"
git push origin main

# Update parent to track submodule change
cd ../..
git add sites/cilantro-site
git commit -m "Update cilantro-site submodule reference"
```

## For AI Assistants and Collaborators

See `CLAUDE.md` for detailed guidance. The key thing to understand: **this project is in between states**. It's not a true monorepo with shared packages everywhere, and it's not purely a pattern library. The answer to "should I import this or copy it?" depends:

- **Import from a published package** if it's a processing pipeline or utility that multiple sites need identically (e.g., `@lossless-group/lfm`)
- **Copy and adapt** if it's a component, layout, or style that each site customizes (e.g., AstroMarkdown.astro, prose styles)
- **Don't create workspace:* dependencies** — sites must deploy independently from their own repos
