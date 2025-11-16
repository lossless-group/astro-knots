# Project Rules

## Monorepo command usage (MANDATORY)

ALWAYS `cd` into the proper site directory before running any `pnpm` command. NEVER use `pnpm -C`.

Commands MUST be run as follows:

- `cd sites/twf_site`
  - `pnpm dev`
  - `pnpm build`
  - `pnpm preview`

- `cd sites/hypernova-site`
  - `pnpm dev`
  - `pnpm build`
  - `pnpm preview`

This is mandatory. Root-level `pnpm` or `pnpm -C` usage is forbidden.

## Submodule Progress (Nov 2025)

- Hypernova (`sites/hypernova-site`)
  - Portfolio grid accepts `portfolio` data; fixed asset paths (Class5, Kearny Jackson).
  - Brand mark uses public SVGs: `/trademarks/trademark__Hypernova--Dark-Mode.svg` (and light variant). Header background around logo removed.
  - Astro config type mismatch resolved via JSDoc cast; removed `// @ts-check`.
  - Removed missing `facts` content collection to fix build.

- The Water Foundation (`sites/twf_site`)
  - Brand mark wrapper supports light/dark assets from `public/trademarks` referenced by absolute paths.
  - Continues copy-pattern workflow; zero runtime deps on `@knots/*`.

## Assets and SVG Imports

- Files in `public/` must be referenced by absolute paths (e.g., `/trademarks/…`). Do not import `public/` assets with `?url`.
- To import or inline assets, place them under `src/assets` and use `?url` (URL) or `?raw` (inline SVG).
- Prefer `<img src>` for logos; inline SVG only when a component needs markup control.

## Astro Config & Content Collections

- Avoid `// @ts-check` in `astro.config.mjs`; use `/** @type {import('vite').PluginOption[]} */` for plugin arrays.
- Register only existing collections in `src/content/config.ts`; remove missing ones to prevent `GenerateContentTypesError`.

## Component Patterns Updated

- `src/components/basics/grids/LogoGrid--LogoOnly.astro` accepts `partners` or `portfolio` and normalizes to `items`.
- `src/components/ui/SiteBrandMarkModeWrapper.astro` renders `<img>` with a `mode` prop; no background wrapper.

## Troubleshooting Quick Checks

- Build error referencing `public/…svg?url`: switch to absolute path string.
- Missing logo: verify asset exists in `sites/<site>/public/trademarks/…` and JSON paths match.
- Portfolio blank: ensure page passes `portfolio` data or `partners` and grid props are set.