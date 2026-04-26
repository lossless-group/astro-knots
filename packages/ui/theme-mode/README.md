# `packages/ui/theme-mode/`

Pattern reference for the firm-wide **theme + mode subsystem**: dual-axis switcher utilities and the canonical 3-mode site-chrome toggle button.

> **Pattern reference, not a published package.** Copy these files into your site's `src/` and adapt. Do not import from `packages/ui/theme-mode/` at runtime — sites must remain independently deployable.

## What's here

```
packages/ui/theme-mode/
├── components/
│   └── ModeToggle.astro       # 3-mode toggle button (light → dark → vibrant)
└── utils/
    ├── mode-switcher.js        # canonical 3-mode utility (firm-wide policy)
    └── theme-switcher.js       # brand-theme axis utility (configurable)
```

## Why this exists

- Multiple sites had drifted **parallel inline switcher logic** inside their own `ModeToggle.astro` (different localStorage keys, partial mode coverage). This package is the canonical reconciliation.
- The 3-mode contract (`light` / `dark` / `vibrant`) is firm-wide policy — see [`Maintain-Themes-Mode-Across-CSS-Tailwind.md`](../../../context-v/blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind.md).
- A **mode toggle in persistent site chrome** (header or footer) is mandatory for every site — not just the inspection toggle on `/brand-kit` and `/design-system`.

## Adoption: copy these files into your site

```bash
# From the astro-knots root:
SITE=sites/your_site

mkdir -p $SITE/src/utils $SITE/src/components/ui

cp packages/ui/theme-mode/utils/mode-switcher.js   $SITE/src/utils/
cp packages/ui/theme-mode/utils/theme-switcher.js  $SITE/src/utils/
cp packages/ui/theme-mode/components/ModeToggle.astro $SITE/src/components/ui/
```

## Wiring

### 1. Boot the switchers in `BaseThemeLayout.astro`

Importing the modules registers the singletons on `window` and runs the initial mode application on `DOMContentLoaded`.

```astro
<script>
  import '../utils/theme-switcher.js';
  import '../utils/mode-switcher.js';
</script>
```

### 2. Drop `ModeToggle.astro` into your site chrome

A header / nav / footer component — anywhere visible on every page.

```astro
---
import ModeToggle from '../components/ui/ModeToggle.astro';
---

<header class="...">
  <a href="/" aria-label="Home">…</a>
  <nav>…</nav>
  <ModeToggle />
</header>
```

The toggle reads `window.modeSwitcher` (booted by `BaseThemeLayout`). It does **not** import the switcher utility itself — that avoids relative-path breakage when the file moves between directory depths.

### 3. (Optional) Customize available themes

`utils/theme-switcher.js` ships with `VALID_THEMES = ['default']` (single-theme, toggle is a no-op). Edit the constant at the top to add brand themes:

```js
const VALID_THEMES = ['default', 'water', 'matter'];
```

Then add corresponding `.theme-water { … }` / `.theme-matter { … }` blocks to your `theme.css`.

## What you do NOT do

- Do **not** import `packages/ui/theme-mode/...` at runtime — sites must deploy from their own repo without the monorepo.
- Do **not** rewrite the switcher logic inline inside `ModeToggle.astro`. If you find yourself wanting to, the right move is to extend `mode-switcher.js` and keep the toggle as a thin UI consumer.
- Do **not** introduce a parallel localStorage key. The shared keys are `'mode'` and `'theme'`.

## Migration from existing site implementations

Several existing sites have parallel inline switcher logic in their `ModeToggle.astro` (e.g., `STORAGE_KEY = 'emblem-mode'` in banner-site). When next touched, replace those files with copies of the canonical version above. The migration is safe — the canonical version uses the standard `'mode'` localStorage key and the same `data-mode` attribute on `<html>`, so existing CSS keeps working.

## Reference implementation

`sites/fullstack-vc/` was scaffolded with this package as the source of truth for the theme + mode subsystem.
