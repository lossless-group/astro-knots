---
title: "New Site Quickstart Guide"
lede: "Step-by-step guide for scaffolding a new Astro site in the astro-knots monorepo, from empty directory to working markdown rendering."
date_authored_initial_draft: 2026-04-25
date_authored_current_draft: 2026-04-25
date_authored_final_draft: "[]"
date_first_published: "[]"
date_last_updated: "[]"
at_semantic_version: 0.1.0.0
augmented_with: Claude Code (Claude Opus 4.6)
category: Prompts
date_created: 2026-04-25
date_modified: 2026-04-25
status: Draft
tags: [Astro-Knots, New-Site, Quickstart, Onboarding, LFM]
authors:
  - Michael Staton
image_prompt: "A clean architectural blueprint showing the skeleton of a website being assembled piece by piece"
---

# New Site Quickstart Guide

This guide walks through creating a new Astro SSG website in the astro-knots _pseudomonorepo_ from scratch. It covers workspace setup, minimal configuration, directory structure, and optionally wiring up LFM markdown rendering.

**Reference implementations:**
- **twf_site** — current reference for LFM integration with `parseContent` utility and strategies collection
- **mpstaton-site** — reference for full content rendering (DocCard index pages, OG image generation)
- **hypernova-site** — reference for team pages, responsive design patterns, branded exports, and the canonical Theme + Mode switcher implementation

**Companion blueprints (read before/during the relevant phase):**
- [Maintain Themes & Modes Across CSS and Tailwind](../blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind.md) — required reading for Phase 6
- [Maintain Design System and Brand Kit Motions](../blueprints/Maintain-Design-System-and-Brandkit-Motions.md) — required reading for Phase 7
- [Maintain Extended Markdown Render Pipeline](../blueprints/Maintain-Extended-Markdown-Render-Pipeline.md) — required reading for Phase 8 (LFM)

---

# Phase 1: Workspace Setup

## 1.1 Create the site repository

The site must be its own git repository, added to astro-knots as a submodule. (However, it is not a true "workspace" in the sense that it shares dependencies and packages with other sites in the monorepo. Each site is its own independent repository, but patterns, components, architecture are shared across sites.)

```bash
# 1. Create the repo on GitHub (or GitLab, etc.)
# 2. Add as submodule from the astro-knots root:
cd /path/to/astro-knots
git submodule add https://github.com/org/new-site.git sites/new_site

# 3. Register in pnpm-workspace.yaml:
```

Add the site to `pnpm-workspace.yaml`:
```yaml
packages:
  - packages/*
  - sites/new_site   # <-- add this line
  # ... existing sites
```

## 1.2 Initialize with Astro

```bash
cd sites/new_site
pnpm create astro@latest .
```

When prompted:
- Template: **Empty** (we'll add structure manually)
- TypeScript: **Yes**
- Strictness: **Strict**

## 1.3 Install core dependencies

> **Note:** The versions specified here are the latest stable versions as of the time of writing. You may need to update these versions if newer versions are available, and the human developers have a strong preference to always use the latest releases. 

```bash
pnpm add astro@^6 tailwindcss@^4 @tailwindcss/vite@^4 typescript@^6
pnpm add -D @astrojs/check @types/node
```

**Do NOT use npm or yarn.** Always pnpm.

---

# Phase 2: Minimal Configuration

## 2.1 `astro.config.mjs`

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  site: 'https://your-domain.com',
  base: '/',
  trailingSlash: 'ignore',

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@layouts': path.resolve('./src/layouts'),
        '@components': path.resolve('./src/components'),
      }
    },
    server: {
      fs: {
        // Allow serving files from monorepo root (hoisted pnpm deps)
        allow: ['../..']
      }
    }
  }
});
```

## 2.2 `package.json`

Ensure these fields are present:

```json
{
  "name": "your-site-name",
  "type": "module",
  "version": "1.0.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  }
}
```

**Critical:** The `name` field is what `pnpm --filter` uses. It must NOT match the directory name pattern `sites/*` — use the actual site name (e.g., `"my-client-site"`, not `"sites/my_site"`).

## 2.3 `tsconfig.json`

Astro generates this. Ensure it extends Astro's base config:

```json
{
  "extends": "astro/tsconfigs/strict"
}
```

## 2.4 Tailwind CSS

Create `src/styles/global.css`:

```css
@import "tailwindcss";
```

Import it in your base layout (see Phase 3).

---

# Phase 3: Directory Structure

Create the standard directory layout:

```
new_site/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── public/
│   ├── favicon.svg
│   └── headshots/          # if people/team data
├── src/
│   ├── content/            # Astro content collections
│   │   └── (collections added per Phase 5)
│   ├── content.config.ts   # Collection definitions
│   ├── components/
│   │   ├── basics/         # Header, Footer, etc.
│   │   └── markdown/       # AstroMarkdown + supporting (Phase 6)
│   ├── layouts/
│   │   ├── BoilerPlateHTML.astro   # HTML skeleton
│   │   └── BaseThemeLayout.astro   # Theme wrapper
│   ├── lib/                # Utilities
│   ├── pages/
│   │   └── index.astro
│   └── styles/
│       └── global.css
└── (no .npmrc needed if only using pnpm workspace)
```

## 3.1 Base layouts

**`src/layouts/BoilerPlateHTML.astro`** — the HTML skeleton:

```astro
---
export interface Props {
  title?: string;
  description?: string;
  themeClass?: string;
  favicon?: string;
}

const {
  title = "My Site",
  description = "Site description",
  themeClass = "theme-default",
  favicon = "/favicon.svg",
} = Astro.props;
---

<!DOCTYPE html>
<html lang="en" class={themeClass}>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="icon" href={favicon} />
</head>
<body>
  <slot />
</body>
</html>
```

**`src/layouts/BaseThemeLayout.astro`** — wraps pages with header/footer as well as global CSS:

```astro
---
import BoilerPlateHTML from './BoilerPlateHTML.astro';
import '../styles/global.css';

export interface Props {
  title?: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<BoilerPlateHTML title={title} description={description}>
  <div class="min-h-screen flex flex-col">
    <!-- Add Header component here -->
    <main class="flex-1">
      <slot />
    </main>
    <!-- Add Footer component here -->
  </div>
</BoilerPlateHTML>
```

---

# Phase 4: Content Config

Create `src/content.config.ts`:

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Example collection — adapt to your site's needs
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date().optional(),
  }),
});

export const collections = {
  pages,
};
```

**Key points:**
- Astro 6 requires `loader` with `glob()` for file-based collections
- Use `z.coerce.date()` for date fields (handles string dates in frontmatter)
- Each collection needs a corresponding directory in `src/content/`

---

# Phase 5: Verify the basics work

```bash
pnpm dev
```

Visit `http://localhost:4321` and confirm the index page renders. Fix any errors before proceeding. Common issues:
- Missing `global.css` import in layout
- Tailwind not loading (check `@tailwindcss/vite` in astro.config.mjs)
- Content config errors (check collection paths match actual directories)

---

# Phase 6: Theme & Mode Architecture (Required)

> **Firm-wide policy — not optional.** Every Astro-Knots site ships with **three modes**: `light`, `dark`, and `vibrant`. The toggle is a stakeholder-management feature: nerds pick dark, traditionalists pick light, design-forward stakeholders pick vibrant. We learned the hard way that letting one stakeholder dictate styling wastes weeks. The toggle ends the argument.

For the full implementation — utilities, CSS variable architecture, effect tokens, brand-mark wrapper, test harness — read:

**→ [Maintain Themes & Modes Across CSS and Tailwind](../blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind.md)**

The reference implementation is `sites/hypernova-site`. What follows is the minimum contract every new site must honor.

## 6.1 The Dual-Axis Model

Two orthogonal axes, both controlled on `<html>`:

| Axis | What it picks | DOM hook |
|------|---------------|----------|
| **Theme** | Brand palette (`default`, `water`, `nova`, `matter`, etc.) | `class="theme-water"` + `data-theme="water"` on `<html>` |
| **Mode** | Visual mode (`light` / `dark` / `vibrant`) | `data-mode="vibrant"` (+ Tailwind's `dark` class when in dark mode) |

Theme switches do not touch mode, and vice versa. Both persist to `localStorage` (`theme`, `mode`) and emit `theme-change` / `mode-change` events on `window`.

## 6.2 The CSS Variable Contract — Two-Tier Tokens

Tailwind utilities **must** read from CSS custom properties — never hardcode hex/RGB. Tokens come in two tiers (full detail in Themes blueprint §2.1):

- **Named tokens (Tier 1)** — raw values, BEM-ish syntax, top of `theme.css`:
  - `--color__blue-azure`, `--color__rose-quartz`, `--font__lato`, `--font__playfair-display`
  - `__` separator marks "raw named value, not a semantic role." Components do **not** read these directly.
- **Semantic tokens (Tier 2)** — kebab-case, the system layer Tailwind consumes:
  - `--color-primary`, `--color-primary-500`, `--color-surface`, `--font-heading-1`, `--font-body`
  - Each one references a named token via `var()`. Tailwind v4's `@theme` only auto-generates utilities for kebab-case tokens — that's why this tier stays kebab-case.
- **Effect tokens (`--fx-*`)** — semantic-tier; carry mode-adaptive intensity for glows, shadows, gradients, canvas/Three.js flares. Same names across modes, different values per mode. See blueprint §9.

**Visual rule:** see `__` → raw named token. See only `-` → semantic token (Tailwind-readable, what components use).

**The client-iteration motion:** when a client wants a different primary color or font, you add a new named token to the top of `theme.css` and re-point one semantic token via `var()`. Components don't change.

```css
/* Tier 1 — named tokens at the top */
:root {
  --color__blue-azure: #1f7ae0;
  --font__lato: 'Lato', system-ui, sans-serif;
}
/* Tier 2 — semantic tokens in the theme block */
.theme-default {
  --color-primary: var(--color__blue-azure);
  --font-body: var(--font__lato);
}
```

Layering:

1. `:root` defines named tokens (Tier 1) and base default scales.
2. `.theme-*` blocks wire semantic tokens (Tier 2) per brand.
3. `[data-mode="dark"]` / `[data-mode="vibrant"]` blocks override `--fx-*` and any mode-specific tokens.

## 6.3 Required Files to Copy

From `sites/hypernova-site` (canonical reference):

```bash
mkdir -p sites/new_site/src/utils
cp sites/hypernova-site/src/utils/theme-switcher.js sites/new_site/src/utils/
cp sites/hypernova-site/src/utils/mode-switcher.js  sites/new_site/src/utils/
```

Both utilities are SSR-safe (guard all `window` / `document` access), expose singleton instances, and can be imported from any client-side script.

## 6.4 Wire Into the Base Layout

In `BaseThemeLayout.astro` (or equivalent), accept a `themeClass` prop and apply it to `<html>` via `BoilerPlateHTML`. The mode initializes from `localStorage` on `DOMContentLoaded`:

```astro
<script>
  import '../utils/theme-switcher.js';
  import '../utils/mode-switcher.js';
</script>
```

Importing the modules runs their `DOMContentLoaded` handlers, which read `localStorage` and apply the saved theme/mode before first paint. Add a `theme-transition` class on `<html>` to avoid FOUC.

## 6.5 Plan for the Reference Pages

Every site ships two internal reference pages — a `/brand-kit` and a `/design-system`. The Brand Kit doubles as the canonical manual test surface for the three-mode system. Full instructions in **Phase 7**.

## 6.6 Mode-Aware Brand Mark

Logos disappear when their contrast doesn't match the background. Copy `SiteBrandMarkModeWrapper.astro` from `sites/banner-site/src/components/ui/` (the three-mode version) and provide both `lightSrc` and `darkSrc` images. CSS-only swap via `html[data-mode="..."]` selectors — no JS. See blueprint §8.

## 6.7 Verify

- [ ] `<html>` carries a `theme-*` class, `data-theme`, and `data-mode` after page load
- [ ] Toggling mode swaps light ↔ dark ↔ vibrant and persists across reloads
- [ ] Toggling theme swaps brand palettes without touching mode
- [ ] Vibrant mode is visibly louder than dark (gradients, glows, saturated accents)
- [ ] `/brand-kit` page renders all three modes with working toggles
- [ ] Brand mark in the header swaps correctly between modes
- [ ] No hardcoded hex values in component CSS — everything reads semantic tokens (`var(--color-*)` or `var(--fx-*)`), never named tokens (`--color__*`) directly
- [ ] Named tokens (`--color__*`, `--font__*`) live at the top of `theme.css`; semantic tokens reference them via `var()` in the `.theme-*` block

---

# Phase 7: Reference Pages — Brand Kit & Design System (Required)

> **Firm-wide policy — not optional.** Every Astro-Knots site ships two internal reference pages. We do **not** use Storybook or a separate Design System Manager. AI assistants improvise pages just as good (often better) inside the site's own theme/mode/runtime — no drift, no parallel build.

Full conventions, scope split, and maintenance motions: **→ [Maintain Design System and Brand Kit Motions](../blueprints/Maintain-Design-System-and-Brandkit-Motions.md)**

## 7.1 The Two Pages

| | Brand Kit | Design System |
|---|---|---|
| **URL** | `/brand-kit` | `/design-system` |
| **Entry file** | `src/pages/brand-kit/index.astro` | `src/pages/design-system/index.astro` |
| **Audience** | Stakeholders, brand reviewers, client marketing | Developers, AI assistants, future contributors |
| **Scope** | Brand experience essentials | Exhaustive component catalog |

## 7.2 Create both entry points

```bash
mkdir -p sites/new_site/src/pages/brand-kit
mkdir -p sites/new_site/src/pages/design-system
touch sites/new_site/src/pages/brand-kit/index.astro
touch sites/new_site/src/pages/design-system/index.astro
```

Both pages must:

- Use `BaseThemeLayout` (so theme/mode contracts apply automatically).
- Render the **theme + mode toggle** prominently at the top, calling `themeSwitcher.toggleTheme()` and `modeSwitcher.setMode('light' | 'dark' | 'vibrant')`.
- Emit `<meta name="robots" content="noindex, nofollow" />`.
- Not appear in public navigation.

## 7.3 Brand Kit minimum sections

Each as a clearly labeled section:

1. Color tokens (named colors + semantic aliases, all three modes)
2. Typography (every font family, every scale)
3. Brand marks (favicon, app icon, wordmark, trademark — light + dark variants)
4. Illustration / iconography style (if defined)
5. Signature layouts (hero variants — sub-pages OK, e.g. `heros.astro`)

## 7.4 Design System minimum structure

The index is a catalog with theme/mode toggle. For each component:

- Name + one-line purpose
- Live render (in current theme/mode)
- Variants side by side
- Props/data attributes table
- CSS contract (which `--color-*` / `--fx-*` tokens it reads)
- Usage example (import + invocation)

Split across sub-pages once the index gets long. **Canonical reference:** `sites/dark-matter/src/pages/design-system/`.

## 7.5 Maintenance motion

**Every new component lands in `/design-system` in the same PR that introduces it.** Brand evolutions (new token, new mark, new font) update `/brand-kit` first, before propagating to other pages. AI assistants creating components must update the catalog entry in the same change — this discipline is what keeps the pages alive instead of letting them rot.

## 7.6 Verify

- [ ] `/brand-kit` and `/design-system` both render at their canonical URLs
- [ ] Theme + mode toggle visible at top of both pages, all three modes work
- [ ] Both pages emit `noindex, nofollow`
- [ ] Brand Kit contains all five required sections (§7.3)
- [ ] Design System index lists every component currently in the site

---

# Phase 8: Add LFM Markdown Rendering (Optional)

Skip this phase if your site doesn't need extended markdown (citations, callouts, directives). Come back when you need it.

For the full architecture and rationale, see [Maintain Extended Markdown Render Pipeline](../blueprints/Maintain-Extended-Markdown-Render-Pipeline.md).

## 8.1 Install LFM

```bash
pnpm add @lossless-group/lfm mdast-util-to-string
```

**For deployed sites**, the site needs an `.npmrc` to find `@lossless-group` on GitHub Packages:

```
@lossless-group:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Within the monorepo workspace, the root `.npmrc` handles this. But the site's own repo will need its own `.npmrc` for independent deployment.

## 8.2 Copy markdown components

From the astro-knots root:

```bash
# Create the target directory
mkdir -p sites/new_site/src/components/markdown

# Copy all five components from the pattern reference
cp packages/lfm-astro/components/AstroMarkdown.astro sites/new_site/src/components/markdown/
cp packages/lfm-astro/components/Callout.astro sites/new_site/src/components/markdown/
cp packages/lfm-astro/components/CodeBlock.astro sites/new_site/src/components/markdown/
cp packages/lfm-astro/components/MarkdownImage.astro sites/new_site/src/components/markdown/
cp packages/lfm-astro/components/Sources.astro sites/new_site/src/components/markdown/
```

**The canonical copy source is `packages/lfm-astro/components/`.** These components are pattern references — you own them once copied and can adapt them to your site's design.

**What each component does:**

| Component | Renders | Key behavior |
|-----------|---------|--------------|
| `AstroMarkdown.astro` | Full MDAST tree recursively | Handles 20+ node types. Includes scoped list styles to counter Tailwind preflight. |
| `Sources.astro` | Citation list at bottom of page | Receives `citations` array, renders numbered list with links and dates |
| `Callout.astro` | `> [!type] Title` callout boxes | Supports: info, tip, warning, danger, note, success, quote, example |
| `CodeBlock.astro` | Fenced code blocks | Language label badge, dark background |
| `MarkdownImage.astro` | `:::image` directives | Float, captions, source attribution, responsive unfloating |

## 8.3 Copy the parseContent utility

```bash
# Copy from twf_site (current reference for this utility)
cp sites/twf_site/src/lib/parse-content.ts sites/new_site/src/lib/
```

This utility wraps `parseMarkdown()` and polyfills two features missing from `@lossless-group/lfm@0.1.3`:
- **Citation processing** — sequential numbering of footnote references, structured parsing of definitions
- **Callout fix** — handles multiline text node bug in remarkCallouts regex

Both polyfills auto-detect when native LFM support exists and skip themselves. Safe to leave in place.

**When LFM 0.2.x is published**, you can simplify `parseContent` or remove it entirely.

## 8.4 Wire it into a page

Example: a blog/article detail page.

```astro
---
import type { GetStaticPaths } from 'astro';
import BaseThemeLayout from '../../layouts/BaseThemeLayout.astro';
import AstroMarkdown from '../../components/markdown/AstroMarkdown.astro';
import Sources from '../../components/markdown/Sources.astro';
import { getCollection } from 'astro:content';
import { parseContent } from '../../lib/parse-content';

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection('your-collection');
  return posts.map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
};

const { entry } = Astro.props;
const { tree, citations } = await parseContent(entry.body!);
---

<BaseThemeLayout title={entry.data.title}>
  <article>
    <h1>{entry.data.title}</h1>
    <AstroMarkdown node={tree} />
    {citations.length > 0 && <Sources citations={citations} />}
  </article>
</BaseThemeLayout>
```

## 8.5 Verify markdown rendering

Create a test markdown file in your collection directory with:
- Headings (h1-h4)
- Bold, italic, inline code
- Bullet lists and numbered lists
- A link
- A fenced code block
- An Obsidian callout: `> [!tip] Test Title\n> Body text`
- A hex-code citation: `Some claim.[^a1b2c3]\n\n[^a1b2c3]: 2024. [Title](https://example.com). Published: 2024-01-01`

Run `pnpm dev` and verify:
- [ ] Lists render with bullets/numbers (not flat text)
- [ ] Callout renders as a styled box with title, not raw `[!tip]` text
- [ ] Citation renders as `[1]` (not `[a1b2c3]`)
- [ ] Sources section appears at bottom with linked title and date
- [ ] Code block has dark background and language label
- [ ] Headings have anchor IDs

---

# Phase 9: Deployment Preparation

Before deploying independently (outside the monorepo):

- [ ] Ensure `package.json` has **no** `workspace:*` dependencies
- [ ] All `@lossless-group/*` packages use version ranges (e.g., `"^0.1.3"`)
- [ ] Site has its own `.npmrc` with GitHub Packages auth for `@lossless-group`
- [ ] `pnpm install && pnpm build` succeeds inside the site directory alone
- [ ] Vercel (or deploy target) is watching the site's own repo, not astro-knots

---

# Checklist Summary

| Phase | What | Status |
|-------|------|--------|
| 1 | Workspace setup (submodule + pnpm) | |
| 2 | astro.config.mjs + package.json + tsconfig | |
| 3 | Directory structure + base layouts | |
| 4 | Content config with at least one collection | |
| 5 | Dev server runs, index page renders | |
| 6 | Theme & mode architecture — Light / Dark / Vibrant all toggle and persist (**required**) | |
| 7 | Reference pages — `/brand-kit` + `/design-system` ship with the site (**required**) | |
| 8 | LFM markdown rendering (optional) | |
| 9 | Deployment readiness | |

---

# Troubleshooting

**`pnpm --filter` can't find the site:**  
The filter matches the `name` field in `package.json`, not the directory name. Check that `name` is correct and the site is listed in `pnpm-workspace.yaml`.

**Lists render without bullets/numbers:**  
Check that `AstroMarkdown.astro` has scoped `<style>` rules for `ul`, `ol`, `li`. Tailwind's preflight strips these. The `packages/lfm-astro` version includes these styles.

**Callouts render as plain blockquotes with `[!tip]` text:**  
This is a known bug in `@lossless-group/lfm@0.1.3`. The `parseContent` utility from twf_site polyfills this. Make sure you copied `src/lib/parse-content.ts` and are calling `parseContent()` instead of `parseMarkdown()` directly.

**Citations show hex codes `[a1b2c3]` instead of `[1]`:**  
Same cause — `remark-citations` doesn't exist in LFM 0.1.3. Use `parseContent()` which polyfills citation numbering.

**`@lossless-group/lfm` fails to install (404 or auth error):**  
The package is on GitHub Packages, not npmjs. You need an `.npmrc` with the `@lossless-group` registry configured and a valid `GITHUB_TOKEN`. Within the monorepo, the root `.npmrc` handles this.

**Build fails with `workspace:^` dependency:**  
This means a dependency is using a workspace link that only works inside the monorepo. Change it to a version range (e.g., `"^0.1.3"`) for independent deployment.
