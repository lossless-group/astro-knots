# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repository Overview

`astro-knots` is an **experimental, loosely-coupled monorepo** serving as a pattern library and development workspace for multiple client websites. This is NOT a traditional monorepo with shared dependencies - it's a pattern development and extraction workspace where sites remain fully independent and deployable from their own repositories.

**Key Concepts:**
- `@knots/*` packages are **copyable pattern references**, not shared dependencies
- Each client site must deploy independently from its own repo (typically via Vercel)
- Patterns are developed in real client sites, then extracted to packages when time permits
- The workspace enables pattern comparison across sites and co-located development
- Sites contain their own copies of patterns, adapted to their specific needs

**The Reality:** This is aspirational and experimental. Patterns are extracted when resources allow. Development happens in client sites first, extraction to `@knots/*` happens later (when remembered). We're underresourced, so this is about making the best patterns reusable when possible.

## Critical Constraint

**Each site MUST be independently deployable from its own repository with zero dependency on the astro-knots monorepo.** Clients deploy their sites directly from their site repos (e.g., `cilantro-site`, `twf_site`) without needing access to this umbrella project.

## Common Commands

### Workspace Operations

```bash
# Build all packages (for development reference)
pnpm -r build

# Build a specific package
pnpm --filter @knots/tokens build
pnpm --filter @knots/astro build

# Watch/develop a specific package
pnpm --filter @knots/tokens dev
pnpm --filter @knots/svelte dev
```

### Site Development

Sites work independently from their own directories:

```bash
# Run a site dev server (sites are workspace members for convenience)
pnpm --filter hypernova-site dev
pnpm --filter cilantro-site dev
pnpm --filter twf_site dev

# Or work directly in the site directory
cd sites/cilantro-site
pnpm dev    # Site runs standalone
pnpm build  # Site builds standalone
```

### Copying Patterns to Sites

The primary workflow is copying patterns from packages into sites:

```bash
# Copy a component pattern
cp packages/astro/src/components/Button.astro sites/my-site/src/components/

# Copy token structure
cp packages/tokens/src/index.ts sites/my-site/src/config/tokens.ts

# Copy icon helper
cp packages/icons/src/index.ts sites/my-site/src/utils/icons.ts

# Copy Tailwind preset/plugin
cp packages/tailwind/preset.mjs sites/my-site/
cp packages/tailwind/plugin.mjs sites/my-site/

# After copying, adapt the patterns to your site's brand
```

### Design System Viewer

```bash
# Run the design system viewer (internal tool, can use workspace deps)
pnpm --filter design-system-viewer dev
```

### Git Submodules

Sites are git submodules with independent version control:

```bash
# Initialize all submodules
git submodule update --init --recursive

# Update all submodules to latest commits
git submodule update --remote

# Update specific submodule
git submodule update --remote sites/cilantro-site

# Check submodule status
git submodule status

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

# Update parent to track new submodule commit
cd ../..
git add sites/cilantro-site
git commit -m "Update cilantro-site submodule reference"
```

### Adding a New Site

```bash
# 1. Create site repo separately (GitHub/etc)

# 2. Add as submodule to astro-knots
git submodule add https://github.com/org/new-site.git sites/new_site

# 3. Add to workspace (optional, for convenience)
# Edit pnpm-workspace.yaml, add: - sites/new_site

# 4. Initialize and install
git submodule update --init sites/new_site
pnpm install

# 5. Copy patterns as needed
cd sites/new_site
cp ../../packages/astro/src/components/Button.astro src/components/
# Adapt to your site's brand
```

## Architecture

### Pattern Library Structure

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

### Pattern Packages (`@knots/*`)

These are reference implementations that you copy from, NOT packages you import as dependencies:

- **@knots/tokens** - Design token patterns with TypeScript types (colors, scales, typography, spacing)
  - **Usage:** Copy token structure into your site's `src/config/tokens.ts`
  - **Build:** `tsc` compiles to `dist/index.js` + `.d.ts`

- **@knots/icons** - SVG icon helper pattern
  - **Usage:** Copy `getIcon()` helper and icon definitions into your site
  - **Build:** `tsc` compiles TypeScript

- **@knots/astro** - Astro component patterns
  - **Usage:** Copy component files into your site's `src/components/`
  - **Peer dependency reference:** `astro ^4.0.0`
  - **Build:** `tsc` for type checking

- **@knots/svelte** - Svelte component patterns
  - **Usage:** Copy component files into your site's `src/components/`
  - **Peer dependency reference:** `svelte ^4.0.0`
  - **Build:** `tsc` for type checking

- **@knots/brand-config** - Brand configuration pattern
  - **Usage:** Copy brand config structure into your site
  - **Build:** `tsc` to compile TypeScript

- **@knots/tailwind** - Tailwind preset/plugin pattern
  - **Usage:** Copy preset and plugin files, adapt to your site's tokens
  - **Files:** `preset.mjs`, `plugin.mjs`

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

## Development Workflow

### Pattern Development Flow

**The Actual Process:**

1. **Build features in client sites** (that's where paid work happens)
2. **Extract patterns to `@knots/*`** when you notice reusable components or approaches (aspirational, happens when remembered)
3. **Copy patterns into other sites** that need similar functionality
4. **Adapt patterns** to each site's specific brand/requirements
5. **Refactor in packages** to improve pattern quality across sites (when time permits)

**Key Insight:** Patterns flow FROM sites TO packages (extraction), then FROM packages TO sites (copying). There's no runtime dependency.

### Working on a Client Site

```bash
# 1. Navigate to site
cd sites/cilantro-site

# 2. Develop normally
pnpm dev

# 3. Build for deployment
pnpm build

# 4. Deploy from site repo
# Vercel watches the cilantro-site repo directly
# No dependency on astro-knots needed
```

### Extracting Patterns to Packages

When you build something reusable in a client site:

```bash
# 1. Identify the pattern
# "This Button component would be useful in other sites"

# 2. Extract to package
cp sites/cilantro-site/src/components/Button.astro packages/astro/src/components/

# 3. Generalize if needed
# Edit the copied file to remove site-specific hardcoding

# 4. Document the pattern
# Add usage examples to package README

# 5. Other sites can now copy from packages when they need it
```

### Copying Patterns Between Sites

```bash
# 1. Find pattern in packages
ls packages/astro/src/components/

# 2. Copy to your site
cp packages/astro/src/components/Button.astro sites/twf_site/src/components/

# 3. Adapt to site's brand
cd sites/twf_site
# Edit src/components/Button.astro to match your design

# 4. Commit in your site's repo
git add src/components/Button.astro
git commit -m "Add button component (from knots pattern)"
```

## Pattern Usage Examples

### Tokens Pattern

```bash
# Copy token structure
cp packages/tokens/src/index.ts sites/my-site/src/config/tokens.ts
# Edit to match your brand
```

Then use in your site:

```astro
---
import tokens from "../config/tokens";
const primary = tokens.colors.primary[500];
---
<style define:vars={{ primary }}>
  .cta { background: var(--primary); }
</style>
```

### Component Pattern

```bash
# Copy component
cp packages/astro/src/components/Button.astro sites/my-site/src/components/
```

Then use:

```astro
---
import Button from "../components/Button.astro";
---
<Button label="Click me" />
```

### Tailwind Pattern

```bash
# Copy Tailwind config patterns
cp packages/tailwind/preset.mjs sites/my-site/
cp packages/tailwind/plugin.mjs sites/my-site/
# Edit to reference your site's tokens
```

Use in `tailwind.config.js`:

```js
import preset from "./preset.mjs";
import plugin from "./plugin.mjs";

export default {
  content: ["src/**/*.{astro,svelte,ts,tsx,mdx}"],
  presets: [preset],
  plugins: [plugin]
};
```

## TypeScript Configuration

All packages use consistent `tsconfig.json`:
- Target: ES2020
- Module: ESNext
- Strict mode enabled
- Output: `dist/` directory
- Source: `src/` directory

Sites have their own TypeScript configurations adapted to their needs.

## Important Notes

- **Sites are independent** - They must deploy from their own repos
- **Copy, don't import** - Patterns are copied into sites, not imported as dependencies
- **Workspace is dev tool** - Convenience for seeing all sites together, not a deployment requirement
- **Git submodules** - Sites are separate repositories; changes should be committed in their respective repos
- **No runtime dependencies** - Sites should have zero `@knots/*` in their package.json (or only as dev convenience during active pattern development)
- **Patterns over dependencies** - Copy and adapt rather than import and constrain
- **Build packages first** - If using packages as reference during development, build them first
- **Future: npm publishing** - We may publish `@knots/*` to npm eventually, but for now copy/paste works

## Troubleshooting

### Site Won't Deploy

**Check:**
1. Does site have all code it needs in its own repo?
2. Are there any `@knots/*` imports that should be copied code?
3. Can you `pnpm install && pnpm build` inside the site directory alone?
4. Is Vercel watching the correct repository?

### Submodule Issues

```bash
# Submodule not initialized
git submodule update --init sites/client_site

# Submodule shows as modified
cd sites/client_site
git status  # Check for uncommitted changes
cd ../..

# Submodule detached HEAD
cd sites/client_site
git checkout main
```

### Pattern Questions

**"Should I extract this to a package?"**
- Will another site likely need this pattern?
- Is it generic enough to reuse?
- Do you have time to extract and document it?
- If yes to all: extract it. If not: leave it in the site for now.

## For More Details

See `CLAUDE.md` for comprehensive guidance including:
- Detailed pattern development workflow
- Site independence requirements
- Common patterns and anti-patterns
- Extended troubleshooting guides
- Notes for AI assistants working in this repo
