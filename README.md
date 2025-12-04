# Astro Knots

Shared packages for Astro/Svelte content-driven websites. This workspace provides design tokens, icons, and base UI components that can be consumed by multiple websites with minimal coupling.

## A Pattern Library, not a Shared Dependency Approach
The monorepo is a "pattern library" approach, NOT a "shared dependency" approach:

  1. During Development Here:
    - Sites CAN use workspace protocol to iterate on patterns quickly
    - @knots/* packages serve as a pattern development/extraction/quick start tool
      - sites should have zero @knots/* dependencies, not even as dev dependencies. 
      > The @knots/* packages are essentially a "pattern cookbook" that you copy from, not import from.
    - Multiple sites co-located for easy pattern comparison.
    - Workflow: Develop a component or pattern directly for one site (e.g., cilantro-site), then extract to
   @knots/astro as a reference, then copy into other sites where relevant.  
      - Maintain various documentation and a design system and component library for both each site and also at the parent monorepo. 
      - Refactor to streamline the process of developing and updating patterns and components, functions, etc across multiple sites.
  2. For Deployment:
    - Each site must be 100% self-contained and deployable independently
      - [The Lossless Group](https://lossless.group) by default deploys to Vercel as of 2025-11-15.
    - Clients can deploy from their site repo alone, no astro-knots dependency
      - Sophisticated clients may have access to the Astro-Knots project, so we are setting up a way for them to navigate, utilize, and even contribute to this uncoupled monorepo.
    - Patterns are copied/adapted into each site, not imported at runtime
  3. The Workflow:
    - Develop patterns in packages or extract from sites
    - Copy/adapt patterns into sites as needed
    - Sites may bundle the pattern code during their build
    - Updates are manual copy/adapt, not automatic version bumps
    - Continuous refactor and maintenance of documentation at all levels. 

## Current Sites:
- [The Lossless Group](https://github.com/lossless-group/lossless-site)
- [Water Themed Site](https://github.com/lossless-group/the-water-foundation-site)
- [Hypernova Site](https://github.com/hypernova-labs/hypernova-site)
- [Cilantro Site](https://github.com/lossless-group/cilantro-site)
- [Steampunk Site](https://github.com/lossless-group/steampunk-site)
- [Dark Matter Site](https://github.com/lossless-group/matter-site)

We are trying to maintain these as elegant design systems, in addition to robust, state-of-the-art websites.

## Submodule Progress

- Hypernova (`sites/hypernova-site`)
  - Portfolio page renders via `LogoGrid--LogoOnly.astro` accepting `portfolio` data; Class5 and Kearny Jackson logos fixed.
  - Brand mark uses public SVGs: `/trademarks/trademark__Hypernova--Dark-Mode.svg` and light variant; header background around logo removed.
  - Astro config type mismatch resolved using a JSDoc cast for Vite plugins; removed `// @ts-check`.
  - Content collections build error fixed by removing the missing `facts` collection.

- The Water Foundation (`sites/twf_site`)
  - Brand mark wrapper supports light/dark assets placed in `public/trademarks` and referenced by absolute paths.
  - Follows the copy-pattern workflow; keeps zero runtime deps on `@knots/*`.

Quick dev:

- `pnpm --filter hypernova-site dev`
- `pnpm --filter twf_site dev` 

## Workspace

This folder is a standalone `pnpm` workspace. Packages live in `packages/*` and sites can be included as workspace members for local linking.

- Workspace file: `pnpm-workspace.yaml`
- Build all packages: `pnpm -r build`
- Watch a package: `pnpm --filter <pkg-name> dev`

## Packages

- `@knots/tokens`: Design tokens with TypeScript types (colors, scales, future typography/spacings)
- `@knots/icons`: Minimal SVG icons as strings with a `getIcon(name)` helper
- `@knots/astro`: Base Astro components (e.g., `Button.astro`) and re-exports
- `@knots/svelte`: Base Svelte components (e.g., `Button.svelte`) and re-exports
- `@knots/brand-config`: Brand configuration objects (e.g., `water` brand)

### Pattern Examples (Copy into Your Site)

**Astro component pattern:**

```bash
# Copy the pattern file into your site
cp packages/astro/src/components/Button.astro sites/my-site/src/components/
```

Then use in your site:

```astro
---
import Button from "../components/Button.astro";
---
<Button label="Click me" />
```

**Svelte component pattern:**

```bash
# Copy the pattern file
cp packages/svelte/src/components/Button.svelte sites/my-site/src/components/
```

Then use:

```svelte
<script>
  import Button from "../components/Button.svelte";
</script>

<Button label="Click me" />
```

**Design tokens pattern:**

```bash
# Copy token structure into your site
cp packages/tokens/src/index.ts sites/my-site/src/config/tokens.ts
# Edit to match your brand
```

Then use in Astro with CSS variables:

```astro
---
import tokens from "../config/tokens";
const primary = tokens.colors.primary[500];
---
<style define:vars={{ primary }}>
  .cta { background: var(--primary); }
</style>
```

**Icons pattern:**

```bash
# Copy icon helper into your site
cp packages/icons/src/index.ts sites/my-site/src/utils/icons.ts
```

Use as inline SVG:

```ts
import getIcon from "../utils/icons";
const arrowSvg = getIcon("arrowRight");
```

**Brand config pattern:**

```bash
# Copy brand config structure
cp packages/brand-config/src/index.ts sites/my-site/src/config/brand.ts
# Adapt to your brand
```

Use in your site:

```ts
import { myBrand } from "../config/brand";
console.log(myBrand.colors.primary);
```

## Working with Sites

Sites are git submodules that develop independently. They're included in the workspace for development convenience, but they copy patterns rather than depending on packages.

### Adding a New Site

```bash
# 1. Create site repo separately (GitHub/etc)

# 2. Add as submodule to astro-knots
git submodule add https://github.com/org/new-site.git sites/new_site

# 3. Add to workspace (for convenience)
# Edit pnpm-workspace.yaml, add: - sites/new_site

# 4. Initialize and install
git submodule update --init sites/new_site
pnpm install

# 5. Copy patterns as needed
cd sites/new_site
cp ../../packages/astro/src/components/Button.astro src/components/
# Adapt to your site's brand
```

### Developing in a Site

Sites work independently:

```bash
cd sites/cilantro-site
pnpm install  # Site has its own dependencies
pnpm dev      # Site runs standalone
pnpm build    # Site builds standalone

# Deploy: Vercel watches the site's own repo
# No dependency on astro-knots for deployment
```

### Copying Patterns to Sites

When a site needs a pattern from the library:

```bash
# 1. Find the pattern you need
ls packages/astro/src/components/

# 2. Copy into your site
cp packages/astro/src/components/Button.astro sites/my-site/src/components/

# 3. Adapt to your site's brand and needs
# Edit the copied file to match your design

# 4. Commit in your site's repo
cd sites/my-site
git add src/components/Button.astro
git commit -m "Add button component (from knots pattern)"
```

### Future: Package Publishing

We may eventually publish `@knots/*` to npm, allowing sites to optionally use standard npm dependencies instead of copying. For now, copy/paste keeps sites independent and works for our scale.

## Versioning & Compatibility

**Current approach (copy/paste):**
- Each site owns its copied code - updates are manual
- When a pattern improves, copy the new version into sites that need it
- Sites can adapt or freeze patterns as needed

**Future with published packages:**
- Would use semver with Changesets for controlled upgrades
- `@knots/astro` would have `peerDependencies` on `astro`; `@knots/svelte` on `svelte`
- Sites could choose: import packages OR copy patterns

## Development Notes

- Build all packages: `pnpm -r build`
- Rebuild a single package: `pnpm --filter @knots/tokens build`
- Watch during development: `pnpm --filter @knots/tokens dev`
- Run a site dev server: `pnpm --filter cilantro-site dev`
- Future: add Storybook, tests, and CI to validate components and tokens across sites

## Submodule Management

Sites are git submodules with independent version control:

```bash
# Initialize all submodules
git submodule update --init --recursive

# Update a submodule to latest
git submodule update --remote sites/cilantro-site

# Sync submodule config
git submodule sync

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

## For More Details

See `CLAUDE.md` for comprehensive guidance including:
- Detailed pattern development workflow
- Site independence requirements
- Common patterns and anti-patterns
- Troubleshooting guides
- Notes for AI assistants
