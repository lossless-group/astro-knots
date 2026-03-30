# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Astro Knots is a **pseudo-monorepo evolving toward selective package sharing**. It started as a pattern library experiment, and is gradually discovering which shared code genuinely benefits from being a published package vs. which is better copied and adapted per-site.

**The Evolving Philosophy:**
- This is **not a true monorepo** with shared packages everywhere — and it's **not purely a pattern library** either
- `@knots/*` packages are workspace-local pattern references you copy from (not published, not imported at runtime)
- `@lossless-group/*` packages (like `@lossless-group/lfm`) ARE real published packages that sites install as dependencies
- The distinction: publish a package when multiple sites need identical processing logic; copy a pattern when each site customizes it
- Each client site must deploy independently from its own repo (typically via Vercel)
- Development happens in client sites first — extraction to shared packages happens when genuine need is proven

**How we got here:**
- Initially intended as a true monorepo with shared component packages
- Quickly learned that maintaining abstracted, style-free components across sites was impractical with a small team
- Settled into a "pattern library" approach where `@knots/*` are reference implementations you copy from
- As content rendering matured, discovered that markdown processing pipelines genuinely need to be shared (not copied) — leading to `@lossless-group/lfm` as the first real published package
- The design-system-viewer aspiration (shared component explorer per site) remains an initiative waiting for bandwidth

**Do not assume** either "everything is a shared package" or "everything is copy-paste." Ask which approach fits the specific code.

## Critical Constraint

**Each site MUST be independently deployable from its own repository.** Sites install published packages (like `@lossless-group/lfm`) as real dependencies from GitHub Packages or JSR. Sites do NOT use `workspace:*` links — those break independent deployment. Clients deploy their sites directly from their site repos without needing access to this umbrella project.

## Workspace Commands

```bash
# Install all dependencies (MUST use pnpm)
pnpm install

# Build all packages (for development reference)
pnpm -r build

# Build a specific package
pnpm --filter @knots/tokens build

# Watch mode for package development
pnpm --filter @knots/tokens dev

# Run site dev server (sites are workspace members for convenience)
pnpm --filter hypernova-site dev
pnpm --filter cilantro-site dev
pnpm --filter twf_site dev

# Run tests (sites with Vitest configured)
pnpm --filter hypernova-site test
pnpm --filter hypernova-site test:ui
pnpm --filter hypernova-site test:run
```

**Important:** Always use `pnpm` - npm/yarn will cause workspace resolution issues.

## High-Level Architecture

### Workspace Structure

```
astro-knots/
├── packages/
│   ├── lfm/              # @lossless-group/lfm — PUBLISHED package (GitHub Packages + JSR)
│   ├── tokens/           # @knots/tokens — pattern reference (not published)
│   ├── icons/            # @knots/icons — pattern reference (not published)
│   ├── astro/            # @knots/astro — Astro component patterns (AstroMarkdown, CodeBlock, Callout)
│   ├── svelte/           # @knots/svelte — Svelte component patterns
│   ├── brand-config/     # @knots/brand-config — Brand config type + CSS var helper
│   └── tailwind/         # @knots/tailwind — Tailwind 3 preset/plugin (needs TW4 migration)
├── sites/                # Client sites as git submodules
│   ├── mpstaton-site/    # Personal portfolio — actively maintained, first LFM consumer
│   ├── hypernova-site/   # Client site
│   ├── cilantro-site/    # Client site — strong reference implementation
│   ├── twf_site/         # The Water Foundation
│   ├── dark-matter/      # Client site
│   ├── banner-site/      # Client site
│   ├── cogs-site/        # In progress
│   └── coglet-shuffle/   # In progress (nested astro-site)
├── context-v/            # Project documentation (specs, blueprints, prompts, reminders, explorations)
├── design-system-viewer/ # Internal tool — minimal scaffolding (Astro 6 + TW4)
└── pnpm-workspace.yaml   # Workspace config
```

### Pattern Development Workflow

**The Actual Process:**

1. **Build features in client sites** (that's where paid work happens)
2. **Extract patterns to `@knots/*`** when you notice reusable components or approaches (aspirational, happens when remembered)
3. **Copy patterns into other sites** that need similar functionality
4. **Adapt patterns** to each site's specific brand/requirements
5. **Refactor in packages** to improve pattern quality across sites (when time permits)

**Key Insight:** Patterns flow FROM sites TO packages (extraction), then FROM packages TO sites (copying). There's no runtime dependency.

### Site Independence Model

Each site in `sites/*`:
- Lives as a separate git repository
- Added here as a git submodule for co-located development
- Added to `pnpm-workspace.yaml` for development convenience only
- Must have all necessary code in its own repo to deploy independently
- Deploys via Vercel (or similar) by watching its own repo

**What the workspace provides:**
- See all sites together for pattern comparison
- Quickly test pattern changes across multiple sites
- Extract common patterns to `@knots/*` packages
- Development convenience (not deployment requirement)

## Published Packages (`@lossless-group/*`)

These are real packages published to registries that sites install as dependencies.

### @lossless-group/lfm
- **What it is:** Lossless Flavored Markdown — shared remark/rehype pipeline for extended markdown
- **Registries:** GitHub Packages (`npm.pkg.github.com`) and JSR (`jsr.io/@lossless-group/lfm`)
- **Source:** `packages/lfm/`
- **Spec:** `context-v/specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md`
- **Usage:** Sites install with `pnpm add @lossless-group/lfm` and import `parseMarkdown()` or `remarkLfm`
- **Includes:** unified, remark-parse, remark-gfm, remark-directive, remark-callouts (Obsidian callout normalization)
- **Currently used by:** mpstaton-site for context-v document rendering

**Example usage in a site:**
```ts
import { parseMarkdown } from '@lossless-group/lfm';
const tree = await parseMarkdown(markdownContent);
// tree is an MDAST — pass to your site's AstroMarkdown renderer
```

Sites need an `.npmrc` to find `@lossless-group` packages:
```
@lossless-group:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

## Pattern Packages (`@knots/*`)

These are workspace-local reference implementations that you copy from and adapt. They are NOT published and NOT imported as runtime dependencies.

### @knots/tokens
- **Purpose:** Design token pattern examples (colors, scales, typography, spacing)
- **Usage:** Copy token structure and values into your site's `src/` directory
- **Pattern:** TypeScript types for tokens with runtime objects

**Example - Copy this pattern:**
```ts
// Copy into your site: src/config/tokens.ts
export type ColorScale = { [step: number]: string };
export interface Tokens {
  brandName?: string;
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    accent: ColorScale;
  };
}

export const tokens: Tokens = {
  colors: {
    primary: { 500: "#2563eb" },
    secondary: { 500: "#06b6d4" },
    accent: { 500: "#f59e0b" }
  }
};
```

### @knots/icons
- **Purpose:** SVG icon helper pattern
- **Usage:** Copy `getIcon()` helper and icon definitions into your site
- **Pattern:** Minimal inline SVG strings with name lookup

**Example - Copy this pattern:**
```ts
// Copy into your site: src/utils/icons.ts
const icons: Record<string, string> = {
  arrowRight: '<svg>...</svg>',
  // ... more icons
};

export default function getIcon(name: string): string {
  return icons[name] || '';
}
```

### @knots/astro & @knots/svelte
- **Purpose:** Component pattern examples
- **Usage:** Copy component files into your site's `src/components/`
- **Pattern:** Simple, composable UI components

**Example - Copy component files:**
```bash
# Don't import these! Copy them:
cp packages/astro/src/components/Button.astro sites/my-site/src/components/
cp packages/svelte/src/components/Button.svelte sites/my-site/src/components/
# Then adapt to your site's needs
```

### @knots/brand-config
- **Purpose:** Brand configuration pattern
- **Usage:** Copy brand config structure into your site
- **Pattern:** Named brand objects with colors/assets

**Example - Copy this pattern:**
```ts
// Copy into your site: src/config/brand.ts
export interface BrandConfig {
  name: string;
  colors: { primary: string; secondary: string; accent: string; };
  assets?: { logoLight?: string; logoDark?: string; };
}

export const myBrand: BrandConfig = {
  name: "My Brand",
  colors: { primary: "#...", secondary: "#...", accent: "#..." }
};
```

### @knots/tailwind
- **Purpose:** Tailwind preset/plugin pattern consuming tokens
- **Usage:** Copy preset and plugin files, adapt to your site's tokens
- **Pattern:** Token-based Tailwind configuration

**Example - Copy and adapt:**
```bash
# Copy the pattern
cp packages/tailwind/preset.mjs sites/my-site/
cp packages/tailwind/plugin.mjs sites/my-site/
# Edit to reference your site's tokens
# Use in tailwind.config.js
```

## Development Workflow

### Working on a Client Site

1. **Navigate to site:** `cd sites/cilantro-site`
2. **Develop normally:** `pnpm dev`
3. **Deploy from site repo:** Vercel watches the cilantro-site repo
4. **Site is self-contained:** All code needed for deployment is in the site repo

### Extracting Patterns to Packages

When you build something reusable in a client site:

1. **Identify the pattern:** "This Button component would be useful in other sites"
2. **Extract to package:** Copy to `packages/astro/src/components/Button.astro`
3. **Generalize if needed:** Remove site-specific hardcoding
4. **Document the pattern:** Add usage examples
5. **Copy to other sites:** Other sites copy from packages when they need it

### Copying Patterns Between Sites

When a site needs a pattern from packages:

1. **Find pattern:** Browse `packages/astro/src/components/`
2. **Copy file:** `cp packages/astro/src/components/Button.astro sites/twf_site/src/components/`
3. **Adapt to site:** Adjust colors, sizes, styles for the site's brand
4. **Site owns the code:** The copied file belongs to the site now

### Adding a New Client Site

```bash
# 1. Create separate repo for the site
# (done in GitHub/GitLab/etc.)

# 2. Add as submodule to astro-knots (for co-located development)
git submodule add https://github.com/org/client-site.git sites/client_site

# 3. Add to workspace (for development convenience)
# Edit pnpm-workspace.yaml and add:
#   - sites/client_site

# 4. Initialize submodule
git submodule update --init sites/client_site

# 5. Install dependencies
pnpm install

# 6. Site develops independently
cd sites/client_site
pnpm dev  # Site works on its own

# 7. Copy patterns as needed
cp ../../packages/astro/src/components/Button.astro src/components/
```

## Submodule Management

Sites are git submodules with fully independent version control:

```bash
# Initialize all submodules
git submodule update --init --recursive

# Update submodule to latest remote
git submodule update --remote sites/cilantro-site

# Sync submodule config
git submodule sync

# Work inside a submodule (standard git workflow)
cd sites/cilantro-site
git checkout main
git pull
# ... make changes ...
git add .
git commit -m "Update"
git push origin main

# Update parent repo to track new submodule commit
cd ../..
git add sites/cilantro-site
git commit -m "Update cilantro-site submodule reference"
```

## Common Patterns & Anti-Patterns

### ✅ Do

- **Import from `@lossless-group/*` published packages** when sites need identical processing logic (e.g., `@lossless-group/lfm` for markdown)
- **Copy and adapt from `@knots/*` pattern packages** for components, styles, and layouts that each site customizes
- **Keep sites independently deployable** - They install published packages from registries, not from the workspace
- **Use pnpm exclusively** - Never npm, npx, or yarn. Use pnpx instead of npx.
- **Commit submodule changes separately** - Each site has its own git history
- **Adapt copied patterns to each site** - Don't force one-size-fits-all

### ❌ Avoid

- **Don't use `workspace:*` in site package.json** - Sites must deploy from their own repos without the monorepo
- **Don't import from `@knots/*` at runtime** - Those are pattern references, not published packages
- **Don't use npm or yarn** - Breaks workspace protocol. Always pnpm/pnpx.
- **Don't assume everything should be a shared package** - Most things are better copied and adapted
- **Don't assume everything should be copied** - Processing pipelines (like LFM) genuinely benefit from a shared package
- **Don't commit inside submodule from parent** - Work in submodule's own git context

## Environment-Driven Configuration Pattern

Sites typically implement environment-based theming (copy this pattern):

**Environment Variables (`.env`):**
```bash
SITE_BRAND=cilantro          # Brand key
SITE_MODE=dark               # Theme mode
FEATURE_FLAGS=search,blog    # Feature toggles
```

**Configuration Files (`src/config/`):**
- `brand.ts` - Brand selection and configuration
- `theme.ts` - Theme token application
- `features.ts` - Feature flag evaluation
- `seo.ts` - SEO defaults

## Package Publishing Status

**Already published:**
- `@lossless-group/lfm` — published to GitHub Packages and JSR. The first real shared package.
- Publishing workflow: edit in `packages/lfm/`, bump version, `pnpm build && pnpm publish` for GitHub Packages, `pnpx jsr publish --allow-dirty` for JSR.

**Not published (pattern references only):**
- `@knots/*` packages remain workspace-local. Publishing them is theoretically possible but not currently justified — the copy-pattern approach works for UI components.

**Future candidates for publishing:**
- The design-system-viewer could become a shared micro-frontend
- Additional remark/rehype plugins will be added to `@lossless-group/lfm` as the LFM spec matures (citations, backlinks, auto-unfurl, etc.)

## Testing

Currently implemented in select sites:

**Vitest Configuration (example from hypernova-site):**
```bash
pnpm --filter hypernova-site test      # Watch mode
pnpm --filter hypernova-site test:ui   # UI mode
pnpm --filter hypernova-site test:run  # Single run
```

**Testing Strategy:**
- Tests live in each site's repo (not in packages)
- Package code is reference/example quality (not production library)
- Focus testing on deployed site code

## Troubleshooting

### Submodule Issues

```bash
# Submodule not initialized
git submodule update --init sites/client_site

# Submodule shows as modified (check if you need to commit inside it)
cd sites/client_site
git status  # Check for uncommitted changes
cd ../..

# Submodule detached HEAD
cd sites/client_site
git checkout main
```

### Site Won't Deploy

**Check:**
1. Does site have all code it needs in its own repo?
2. Are there any `@knots/*` imports that should be copied code?
3. Can you `pnpm install && pnpm build` inside the site directory alone?
4. Is Vercel watching the correct repository?

### Pattern Extraction Questions

**"Should I extract this to a package?"**
- Will another site likely need this pattern?
- Is it generic enough to reuse?
- Do you have time to extract and document it?
- If yes to all: extract it. If not: leave it in the site for now.

## Design System Philosophy

- **Patterns over dependencies:** Copy and adapt rather than import and constrain
- **Site autonomy:** Each site owns its destiny and deployment
- **Extract when ready:** Don't force premature abstraction
- **Minimal coupling:** Sites share ideas, not runtime code
- **Client independence:** Clients can deploy without knowing about astro-knots

## Project-Specific Context

### Why This Approach?

**Client Requirements:**
- Clients need to own and deploy their sites independently
- No vendor lock-in to our monorepo infrastructure
- Sites must work from their own repos (Vercel auto-deploy)

### Recent Progress (Mar 2026)

- **@lossless-group/lfm** — First published package. Shared markdown pipeline with remarkGfm, remarkDirective, remarkCallouts. Published to GitHub Packages and JSR.

- **mpstaton-site** (`sites/mpstaton-site`)
  - Context-V document rendering — DocCard index + detail pages with full markdown rendering via `@lossless-group/lfm`
  - AstroMarkdown renderer copied from `@knots/astro` and extended (tables, strikethrough, HTML nodes)
  - Portfolio, CV, OG image generation complete
  - First site consuming `@lossless-group/lfm` as a published dependency

- **design-system-viewer** — Migrated from Astro 4 + Tailwind 3 to Astro 6 + Tailwind 4 to clear Dependabot vulnerabilities

### Previous Progress (Nov 2025)

- Hypernova — portfolio page, brand mark, TypeScript fixes, content collection cleanup
- TWF — brand mark light/dark support, copy-pattern workflow

### Sites as Reference

**mpstaton-site** is the current primary reference for content rendering — it's the first site using `@lossless-group/lfm` and has the most complete AstroMarkdown renderer.

**Cilantro-site** remains a strong reference for environment-driven configuration, SEO/OG meta utilities, and content collections architecture.

## Notes for AI Assistants

1. **This project is in between states** - It's not a true monorepo and not purely a pattern library. The right approach depends on the specific code.
2. **Published packages (`@lossless-group/*`) are real dependencies** - Sites install them from GitHub Packages or JSR. Import them normally.
3. **Pattern packages (`@knots/*`) are references** - Copy the code into the site, adapt it. Never import at runtime.
4. **Sites are independently deployable** - No `workspace:*` links. Published packages only.
5. **Respect submodules** - Each site has separate git history. Commit inside the submodule, not from the parent.
6. **Use pnpm/pnpx exclusively** - Never npm, npx, yarn, or node directly.
7. **Check `context-v/`** - Specs, blueprints, and prompts contain valuable context about design decisions.

**When deciding import vs. copy:**
1. Is this processing logic that should be identical across sites? → **Published package** (like `@lossless-group/lfm`)
2. Is this a component/layout/style that each site customizes? → **Copy and adapt** (like AstroMarkdown.astro)
3. Is this something new that only one site needs right now? → **Build in the site**. Extract later if other sites need it.

**When troubleshooting:**
1. Can the site build/run from its own directory alone?
2. Are there any `workspace:*` dependencies that would break deployment?
3. Is the submodule initialized and on the right branch?
4. Does `.npmrc` have the `@lossless-group` registry configured?
