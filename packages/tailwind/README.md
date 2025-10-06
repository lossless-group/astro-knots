# @knots/tailwind

Shared Tailwind preset and plugin for Astro/Svelte sites, powered by `@knots/tokens`.

## Install (workspace member)

From the workspace root:

```sh
pnpm add @knots/tailwind -F hypernova-site
# Ensure tailwindcss is installed in the site
pnpm add -D tailwindcss -F hypernova-site
```

## Use in Tailwind config (ESM)

Create `tailwind.config.js` (ESM) in your site:

```js
import preset from "@knots/tailwind/preset.mjs";
import plugin from "@knots/tailwind/plugin.mjs";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "src/**/*.astro",
    "src/**/*.svelte",
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.mdx"
  ],
  presets: [preset],
  plugins: [plugin],
  theme: { extend: {} }
};
```

This exposes token-based colors like `primary`, `secondary`, and `accent`.

## Astro Integration

If you use Astro, add the Tailwind integration and ensure it reads your config:

```sh
pnpm add -F hypernova-site @astrojs/tailwind
```

In `astro.config.mjs`:

```js
import tailwind from "@astrojs/tailwind";

export default {
  integrations: [tailwind({ config: { applyBaseStyles: true } })]
};
```

## Examples

- Button styles via plugin:

```html
<button class="btn">Primary</button>
<button class="btn-secondary">Secondary</button>
<button class="btn-accent">Accent</button>
```

- Token colors in classes:

```html
<div class="bg-primary-500 text-white">Primary 500</div>
```

## Parslee Site

- If Parslee is in the same workspace, install with:

```sh
pnpm add @knots/tailwind -F parslee-site
pnpm add -D tailwindcss -F parslee-site
```

- If Parslee is a separate repo, publish `@knots/tailwind` or consume via `git submodule` + `file:` dependency, then follow the same Tailwind config ESM example.