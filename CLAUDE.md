# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Astro Knots is an **experimental, loosely-coupled monorepo** serving as a pattern library and development workspace for multiple client websites. This is NOT a traditional monorepo with shared dependencies - it's a pattern development and extraction workspace where sites remain fully independent and deployable from their own repositories.

**Core Philosophy:**
- `@knots/*` packages are **copyable pattern references**, not shared dependencies
- Each client site must deploy independently from its own repo (typically via Vercel)
- Patterns are developed in real client sites, then extracted to packages when time permits
- The workspace enables pattern comparison across sites and co-located development
- Sites contain their own copies of patterns, adapted to their specific needs

**The Reality:**
- This is aspirational and experimental - patterns are extracted when resources allow
- Development happens in client sites first, extraction to `@knots/*` happens later (when remembered)
- The monorepo is a "pattern museum" and "shared sketchbook" for cross-site learning
- We're underresourced, so this is about making the best patterns reusable when possible

## Critical Constraint

**Each site MUST be independently deployable from its own repository with zero dependency on the astro-knots monorepo.** Clients deploy their sites directly from their site repos (e.g., `cilantro-site`, `twf_site`) without needing access to this umbrella project.

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
├── packages/              # Pattern reference library (copyable, not dependencies)
│   ├── tokens/           # Design token patterns and examples
│   ├── icons/            # SVG icon patterns
│   ├── astro/            # Astro component patterns (Button.astro, etc.)
│   ├── svelte/           # Svelte component patterns (Button.svelte, etc.)
│   ├── brand-config/     # Brand configuration pattern examples
│   └── tailwind/         # Tailwind preset/plugin pattern
├── sites/                # Client sites as git submodules
│   ├── hypernova-site/   # Independent deployable site
│   ├── cilantro-site/    # Independent deployable site
│   ├── coglet-shuffle/   # Independent deployable site
│   ├── cogs-site/        # Independent deployable site
│   └── twf_site/         # Independent deployable site (The Water Foundation)
├── design-system-viewer/ # Internal tool (can use workspace deps)
└── pnpm-workspace.yaml   # Workspace config for dev convenience
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

## Pattern Packages (`@knots/*`)

These are reference implementations that you copy from, NOT packages you import as dependencies.

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

- **Copy patterns from packages into sites** - This is the primary workflow
- **Keep sites fully self-contained** - They must deploy independently
- **Extract reusable patterns to packages** - When you remember/have time
- **Adapt copied patterns to each site** - Don't force one-size-fits-all
- **Use workspace for development convenience** - See all sites together
- **Use pnpm** - Required for workspace functionality
- **Commit submodule changes separately** - Each site has its own git history

### ❌ Avoid

- **Don't make sites depend on `@knots/*` packages at runtime** - Sites must be independent
- **Don't expect packages to auto-update in sites** - Patterns are copied, not linked
- **Don't use npm or yarn** - Breaks workspace protocol
- **Don't make packages that sites must import** - They're copyable patterns, not dependencies
- **Don't expect perfect consistency across sites** - Patterns are adapted per site
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

## Future Possibilities

**Package Publishing (Not Implemented Yet):**
- We could publish `@knots/*` to npm/private registry
- Sites could then use standard npm dependencies: `pnpm add @knots/tokens`
- This would require maintaining published versions and semver
- For now: copy/paste is simpler and works for our scale

**When/if we publish:**
- Sites could choose: import from npm OR copy code
- We'd need versioning, changelog, breaking change management
- Build/deploy process stays the same (sites still independent)

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

### Recent Progress (Nov 2025)

- Hypernova (`sites/hypernova-site`)
  - Fixed portfolio page blank render by normalizing grid props (`LogoGrid--LogoOnly.astro`).
  - Corrected Class5 logo asset paths and extensions in `src/content/page-content/portfolio.json`.
  - Replaced inline brand mark with public SVG asset; removed header background block.
  - Resolved TypeScript plugin mismatch in `astro.config.mjs` with a JSDoc cast.
  - Removed missing `facts` content collection to fix build.

- The Water Foundation (`sites/twf_site`)
  - Ensured brand mark wrapper supports light/dark assets from `public/trademarks` referenced by absolute paths.
  - Continues to follow copy-pattern workflow; site remains fully independent.

Guidance:
- Use public assets via absolute paths for logos when they live in `public/`.
- Only import assets (e.g., `?url`, `?raw`) from `src/` when you need bundling or inlining.

**Development Benefits:**
- See all sites together for pattern inspiration
- Extract common solutions to avoid reinventing
- Cross-pollinate ideas between projects
- Maintain pattern quality in central reference

**Resource Reality:**
- Underfunded pattern extraction work
- Client work drives development, not package development
- Extract patterns when time/budget allows
- Aspirational system that improves incrementally

### Sites as Reference

**Cilantro-site** serves as a strong reference implementation:
- Environment-driven configuration pattern
- SEO/OG meta utilities
- Content collections architecture
- Shows the full pattern in context

## Notes for AI Assistants

1. **Sites are independent** - Never create dependencies on `@knots/*` in site code
2. **Copy, don't import** - When asked to use a pattern, copy the code into the site
3. **Check deployability** - Can this site deploy from its own repo alone?
4. **Respect submodules** - Each site has separate git history
5. **Packages are references** - Think "cookbook" not "library"
6. **Workspace is dev tool** - Not a deployment requirement
7. **Be realistic** - This is experimental and evolving

**When troubleshooting:**
1. Can the site build/run from its own directory alone?
2. Are there any cross-repo dependencies that would break deployment?
3. Is the submodule initialized and on the right branch?
4. Does the pattern need to be copied into the site?

**When adding features:**
1. Build it in the site first (where it's needed)
2. Ask: "Would other sites benefit from this pattern?"
3. If yes and time permits: extract to packages
4. Document the pattern for future copying
