# Astro Knots

Shared packages for Astro/Svelte content-driven websites. This workspace provides design tokens, icons, and base UI components that can be consumed by multiple websites with minimal coupling.

## Current Sites:
- [The Lossless Group](https://github.com/lossless-group/lossless-site)
- [Water Themed Site](https://github.com/lossless-group/the-water-foundation-site)
- [Hypernova Site](https://github.com/hypernova-labs/hypernova-site)
- [Cilantro Site](https://github.com/lossless-group/cilantro-site)
- [Steampunk Site](https://github.com/lossless-group/steampunk-site)

We are trying to maintain these as elegant design systems, in addition to robust, state-of-the-art websites. 

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

### Quick Examples

Astro component usage:

```astro
---
import { Button } from "@knots/astro";
---
<Button label="Click me" />
```

Svelte component usage:

```svelte
<script>
  import { Button } from "@knots/svelte";
</script>

<Button label="Click me" />
```

Tokens in Astro with CSS variables:

```astro
---
import tokens from "@knots/tokens";
const primary = tokens.colors.primary[500];
---
<style define:vars={{ primary }}>
  .cta { background: var(--primary); }
</style>
```

Icons as inline SVG:

```ts
import getIcon from "@knots/icons";
const arrowSvg = getIcon("arrowRight");
```

Brand config:

```ts
import { water } from "@knots/brand-config";
console.log(water.colors.primary);
```

## Hypernova Site

The `hypernova-site` is included in this workspace, so it can consume packages locally without publishing.

1) From `astro-knots` root, install packages to the site:

```sh
pnpm add @knots/tokens @knots/astro @knots/svelte @knots/icons @knots/brand-config -F hypernova-site
```

2) Use the components/tokens directly in the site:

- Astro components: `import { Button } from "@knots/astro"`
- Svelte components: `import { Button } from "@knots/svelte"`
- Tokens: `import tokens from "@knots/tokens"`
- Icons: `import getIcon from "@knots/icons"`
- Brand config: `import { water } from "@knots/brand-config"`

3) Build and iterate:

```sh
pnpm -r build
pnpm --filter @knots/astro dev
pnpm --filter @knots/svelte dev
```

## Parslee Site

There are two typical ways for Parslee to consume these packages:

1) Same workspace (recommended for local development)

- Add Parslee to this `pnpm-workspace.yaml` so it becomes a workspace member.
- Then install packages to Parslee from the workspace root:

```sh
pnpm add @knots/tokens @knots/astro @knots/svelte @knots/icons @knots/brand-config -F parslee-site
```

2) Separate repository

- Option A: Publish packages and install via registry:

```sh
pnpm add @knots/tokens @knots/astro @knots/svelte @knots/icons @knots/brand-config
```

- Option B: Add `astro-knots` as a git submodule and reference packages via `file:` dependencies from Parslee’s `package.json`:

```json
{
  "dependencies": {
    "@knots/tokens": "file:./path/to/astro-knots/packages/tokens",
    "@knots/astro": "file:./path/to/astro-knots/packages/astro",
    "@knots/svelte": "file:./path/to/astro-knots/packages/svelte",
    "@knots/icons": "file:./path/to/astro-knots/packages/icons",
    "@knots/brand-config": "file:./path/to/astro-knots/packages/brand-config"
  }
}
```

Once linked, usage in Parslee mirrors Hypernova: import components/tokens/configs exactly the same way.

## Versioning & Compatibility

- Prefer `semver` with Changesets for controlled upgrades across sites.
- `@knots/astro` has `peerDependencies` on `astro`; `@knots/svelte` on `svelte`.
- Use caret ranges (e.g., `^0.1.0`) for non-breaking updates; pin or use `~` if you need tighter control.

## Development Notes

- Build all: `pnpm -r build`
- Rebuild a single package: `pnpm --filter @knots/tokens build`
- Watch during development: `pnpm --filter @knots/tokens dev`
- Future: add Storybook, tests, and CI to validate components and tokens across sites.
