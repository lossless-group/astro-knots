# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repository Overview

`astro-knots` is a pnpm workspace providing shared design tokens, icons, and UI components for multiple Astro/Svelte content-driven websites. The repository uses git submodules to include actual site implementations as workspace members for local development.

## Common Commands

### Workspace Operations
```bash
# Build all packages in the workspace
pnpm -r build

# Build a specific package
pnpm --filter @knots/tokens build
pnpm --filter @knots/astro build

# Watch/develop a specific package
pnpm --filter @knots/tokens dev
pnpm --filter @knots/svelte dev
```

### Site Development
```bash
# Run a site locally (from site directory or via filter)
pnpm --filter hypernova-site dev
pnpm --filter cilantro-site dev

# Build a site
pnpm --filter hypernova-site build

# Preview a production build
pnpm --filter hypernova-site preview
```

### Design System Viewer
```bash
# Run the design system viewer to see all components
pnpm --filter design-system-viewer dev
```

### Git Submodules
```bash
# Update all submodules to latest commits
git submodule update --remote

# Initialize submodules after fresh clone
git submodule update --init --recursive

# Check submodule status
git submodule status

# Update specific submodule
git submodule update --remote sites/hypernova-site
```

### Adding Packages to Sites
```bash
# Add knots packages to a site from workspace root
pnpm add @knots/tokens @knots/astro @knots/svelte -F hypernova-site
```

## Architecture

### Package Structure

The workspace contains 6 core packages under `packages/`:

- **@knots/tokens** - Design tokens with TypeScript types (colors, scales)
  - Exports: TypeScript types, CSS variables via `css/modes.css`
  - Build: `tsc` to compile TypeScript
  
- **@knots/icons** - Minimal SVG icons as strings with `getIcon(name)` helper
  - Exports: Icon retrieval function
  - Build: `tsc` to compile TypeScript
  
- **@knots/astro** - Base Astro components (e.g., `Button.astro`)
  - Peer dependency: `astro ^4.0.0`
  - Build: `tsc` for type checking
  
- **@knots/svelte** - Base Svelte components (e.g., `Button.svelte`)
  - Peer dependency: `svelte ^4.0.0`
  - Build: `tsc` for type checking
  
- **@knots/brand-config** - Brand configuration objects (e.g., `water` brand)
  - Exports: Brand config interfaces and CSS variable converter
  - Build: `tsc` to compile TypeScript
  
- **@knots/tailwind** - Shared Tailwind preset and plugin
  - Files: `preset.mjs`, `plugin.mjs`
  - Peer dependency: `tailwindcss >=3.3.0`
  - Depends on: `@knots/tokens` via workspace protocol

### Site Integration

Sites are included as git submodules under `sites/` and referenced in `pnpm-workspace.yaml`:
- `sites/hypernova-site`
- `sites/cilantro-site` 
- `sites/coglet-shuffle`
- `sites/cogs-site`

Sites consume packages via workspace dependencies (e.g., `@knots/tokens: "workspace:*"`), enabling local development without publishing.

### Design System Viewer

The `design-system-viewer` is a standalone Astro site that imports all knots packages to visualize components, tokens, and icons. Use it to test changes across all packages.

## Development Workflow

1. **Make changes to a package** (e.g., `packages/tokens/src/index.ts`)
2. **Build the package**: `pnpm --filter @knots/tokens build`
3. **Test in a site**: Sites will pick up changes automatically if packages are built
4. **Watch mode**: Use `pnpm --filter @knots/tokens dev` for auto-rebuild on file changes
5. **View in design system**: Run `pnpm --filter design-system-viewer dev` to see all components

## TypeScript Configuration

All packages use consistent `tsconfig.json`:
- Target: ES2020
- Module: ESNext
- Strict mode enabled
- Output: `dist/` directory
- Source: `src/` directory

## Important Notes

- **Workspace protocol**: Packages use `workspace:*` to reference each other
- **No root package.json**: This is a pure pnpm workspace; use `pnpm -r` for recursive operations
- **Build dependencies**: Sites depend on pre-built packages; always build packages before testing in sites
- **Git submodules**: Sites are separate repositories; changes to sites should be committed in their respective repos
- **Peer dependencies**: `@knots/astro` requires `astro`, `@knots/svelte` requires `svelte`, `@knots/tailwind` requires `tailwindcss`
