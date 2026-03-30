# Astro Knots

A workspace for developing and maintaining multiple Astro/Svelte content-driven websites. Started as a pattern library, evolving toward selective package sharing where it genuinely makes sense.

## What This Actually Is

Astro Knots began as an experiment: could we codify shared patterns into a monorepo with `@knots/*` packages that sites copy from? The answer turned out to be "sort of." The monorepo is useful for co-locating sites and seeing patterns side by side, but maintaining abstracted, style-free component packages that every site copies from proved impractical with a small team. We gave up on `@knots/*` as true importable packages early on.

**What survived and works:**
- Co-located development — all sites visible in one workspace for pattern comparison
- Git submodules — each site is its own repo, independently deployable
- Shared context — `context-v/` documents (specs, blueprints, prompts, reminders) that guide development across all sites
- Selective package publishing — when something genuinely needs to be shared as a dependency (not just a pattern), we publish it. The first real example: `@lossless-group/lfm` (Lossless Flavored Markdown)

**What didn't work as planned:**
- `@knots/*` as imported dependencies — too much abstraction overhead for the value
- "Copy when you remember" — we usually didn't remember
- Style-free component patterns — sites diverge too much in design for generic components to be useful

**The current stance:** This is a **pseudo-monorepo evolving toward real package sharing where it's justified**. Don't assume everything is a shared package. Don't assume everything is copy-paste. The right answer depends on the specific code: markdown processing pipelines genuinely benefit from a shared package; UI components don't.

## Sites

| Site | Repo | Status | Notes |
|------|------|--------|-------|
| mpstaton-site | [lossless-group/mpstaton-site](https://github.com/lossless-group/mpstaton-site) | Active | Personal portfolio/CV, actively maintained without client constraints |
| hypernova-site | [hypernova-labs/hypernova-site](https://github.com/hypernova-labs/hypernova-site) | Active | Client site |
| cilantro-site | [lossless-group/cilantro-site](https://github.com/lossless-group/cilantro-site) | Active | Client site, strong reference implementation |
| twf_site | [lossless-group/the-water-foundation-site](https://github.com/lossless-group/the-water-foundation-site) | Active | The Water Foundation |
| dark-matter | [lossless-group/matter-site](https://github.com/lossless-group/matter-site) | Active | Client site |
| banner-site | [lossless-group/emblem-site](https://github.com/lossless-group/emblem-site) | Active | Client site |
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

Bundles unified, remark-parse, remark-gfm, remark-directive, and custom plugins (remark-callouts). One import:

```ts
import { parseMarkdown } from '@lossless-group/lfm';
const tree = await parseMarkdown(markdownContent);
```

Currently used by mpstaton-site for context-v document rendering. Will be adopted by other sites as the content rendering pipeline matures.

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

## Context-V

The `context-v/` directory contains project documentation organized by type:

- **specs/** — Formal specifications (LFM, Context-V fetcher, etc.)
- **blueprints/** — Architecture and design patterns
- **prompts/** — Step-by-step implementation guides
- **reminders/** — Conventions and constraints
- **explorations/** — Pre-spec research and understanding documents
- **strategy/** — Business and project strategy

Sites can fetch context-v documents from multiple repos using the Context-V fetcher system. mpstaton-site displays these as browsable "Rabbit Holes."

## Design System Viewer

`design-system-viewer/` — An internal tool (not deployed) for visualizing tokens, icons, and components across the workspace. Currently minimal scaffolding on Astro 6 + Tailwind 4. The aspiration is a shared micro-frontend that each site can embed, but this is an initiative waiting for bandwidth.

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
