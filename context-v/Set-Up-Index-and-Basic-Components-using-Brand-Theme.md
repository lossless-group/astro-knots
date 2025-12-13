## Blueprint: Set Up Index and Basic Components Using Brand Theme

This document is a **prompt plan** for working on Astro-Knots sites that follow the Hypernova patterns.

Context:

- Reference implementation: `astro-knots/sites/hypernova-site`.
- Current home page: `src/pages/index.astro` uses:
  - `BaseThemeLayout` for page chrome, SEO, and theme wiring.
  - `SiteBrandMarkModeWrapper` for the logo/brand mark.
  - A simple tagline block with hard-coded colors.

Goal:

- Safely evolve or recreate an index page that:
  - Uses the **brand theme system** instead of hard-coded colors.
  - Sets up basic components (brand mark, tagline, hero container) in a way that can be reused across Astro-Knots sites.
  - Keeps work split into small, low-risk prompt steps.

Each section below is a **copy-pasteable prompt** you can use with Cascade / Windsurf. Work through them in order; do not try to do everything at once.

---

### Step 1 — Inspect the Current Index and BaseThemeLayout

**Intent:** Establish shared understanding of how the current index page and layout are structured before changing anything.

**Prompt:**

> Please inspect the following files and give me a concise summary of how the index page is currently wired to the layout and brand theme:
>
> - `astro-knots/sites/hypernova-site/src/pages/index.astro`
> - `astro-knots/sites/hypernova-site/src/layouts/BaseThemeLayout.astro`
>
> For each file, describe:
> - What props it expects and how they’re used.
> - How theme / mode / brand-related classes or attributes are applied.
> - Any hard-coded colors or styles that should eventually migrate to the theme system.

**Exit criteria:** You have a short written summary of layout + index wiring and a list of theme-related concerns and written to this file in the `Output` section below.

#### **Output:**

##### What we have actually done so far (Dark Matter)

- **Created standalone repo:** `https://github.com/lossless-group/matter-site`.
  - Initialized a new Astro site in `astro-knots/sites/dark-matter/site`.
  - Ran `git init`, renamed the default branch to `main`, and added the remote `origin` pointing to `lossless-group/matter-site.git`.
  - Committed the initial Astro files (`astro.config.mjs`, `tsconfig.json`, `package.json`, `public/favicon.svg`, `src/pages/index.astro`) plus context and brand assets.
  - Pushed `main` to GitHub.
- **Assets + branding:**
  - Moved Dark Matter SVG trademarks and app icons into `public/trademarks/` in the site repo.
  - Tracked the Affinity Designer source file `public/trademarks/trademark__Dark-Matter.afdesign` as **binary** and configured **Git LFS** for `*.afdesign`.
- **Monorepo wiring (current state):**
  - `astro-knots/sites/dark-matter/site` is now the canonical Dark Matter Astro site repo (`matter-site`).
  - `astro-knots/sites/dark-matter/README.md` documents the site, stack, and common `pnpm` commands.
  - We have **not yet** converted `sites/dark-matter` into a git submodule of `astro-knots`—that remains a follow-up step.

These steps complete the “project setup + repo extraction” part of the plan. The theming and index refactors below are still to-be-done and should treat `matter-site` as the reference Dark Matter implementation.

**File: `src/pages/index.astro`**

##### Theme Tokens for `Matter Theme` -- `matter-theme`

Reference the CSS of our recent projects and come up with a refactored, simpler but effective way to set up the styles folder for `dark-matter/src/styles`

- `/Users/mpstaton/code/lossless-monorepo/astro-knots/sites/hypernova-site/src/styles`
- `/Users/mpstaton/code/lossless-monorepo/astro-knots/sites/twf_site/src/styles`


##### Layout and Wrapper Component

**Reminder:** We just implemented our `matter-theme.css` and `global.css` files.

**Reference Files**:

- `astro-knots/sites/hypernova-site/src/pages/index.astro`
- `astro-knots/sites/hypernova-site/src/layouts/BaseThemeLayout.astro`

- `astro-knots/sites/twf_site/src/pages/index.astro`
- `astro-knots/sites/twf_site/src/layouts/BaseThemeLayout.astro`

- **Imports**:
  - `BaseThemeLayout` from `../layouts/BaseThemeLayout.astro`.
  - `SiteBrandMarkModeWrapper` from `../components/ui/SiteBrandMarkModeWrapper.astro`.
- **Usage**:
  - Wraps the whole page in `BaseThemeLayout` with:
    - `title="Hypernova"`
    - `description="REALIZE OUTSIZED VALUE WITH VENTURE"`
  - Inside the layout, renders a single full-screen flex container:
    - `class="min-h-screen flex flex-col items-center justify-center bg-[#071321] relative"`.
  - Brand mark:
    - `<SiteBrandMarkModeWrapper className="w-80 h-20" />` used as a logo block.
  - Tagline:
    - `<p class="text-[#EBEBEB] text-2xl font-medium tracking-widest uppercase">REALIZE OUTSIZED VALUE WITH VENTURE</p>`.
- **Theme/mode wiring at this level**:
  - Relies on `BaseThemeLayout` (and ultimately `BoilerPlateHTML`) for theme/mode plumbing.
  - The index itself does **not** apply any `theme-*` or `data-mode` attributes.
  - Background and text colors are currently **hard-coded hex values** instead of semantic theme tokens.

**File: `src/layouts/BaseThemeLayout.astro`**

- **Props interface**:
  - `title?: string`
  - `description?: string`
  - `themeClass?: string` (controls which `.theme-*` class is applied by `BoilerPlateHTML`)
  - `containerClass?: string`
  - `favicon?: string`
  - `ogImage?: string`
  - `ogImagePortrait?: string`
  - `ogType?: 'website' | 'article'`
- **Prop defaults**:
  - `title` / `description`: Hypernova marketing copy.
  - `themeClass = "theme-hypernova"` (this is the primary theme hook for the site).
  - `containerClass = "max-w-4xl mx-auto"` (not currently overridden by index).
  - `favicon = "trademarks/appIcon__Hypernova.png"`.
- **Layout composition**:
  - Imports global Tailwind v4 CSS: `../styles/global.css`.
  - Wraps children in `BoilerPlateHTML`, passing through SEO + theme props.
  - Inline `<style>` block defines **font + shape behavior** for:
    - `.theme-default`: sets font-family based on CSS custom properties.
    - `.theme-water`: sets brand font/weights/spacing and globally rounds corners with `.theme-water * { border-radius: var(--border-radius-sm); }`.
  - Main shell:
    - `<div class="bg-background text-foreground min-h-screen flex flex-col">`.
    - Renders `Header` and `Footer` from `components/basics`, with `className="w-full"`.
    - `<main class="flex-1"><slot /></main>` for page content.
  - Injects a script: `<script type="module" src="/src/utils/bio-modal.js"></script>`.
- **Theme/mode wiring at this level**:
  - `themeClass` flows into `BoilerPlateHTML`, which is responsible for attaching `.theme-*` to the HTML root.
  - The inline CSS assumes theme-specific classes (`.theme-default`, `.theme-water`, and, by convention, `.theme-hypernova` via `themeClass`).
  - Color usage inside the layout itself is **semantic** (`bg-background`, `text-foreground`) and should already be resolved through the Tailwind/theme system.

**Key theme/mode concerns identified**

1. **Hard-coded colors on index**:
   - `bg-[#071321]` and `text-[#EBEBEB]` bypass the shared color system.
   - These should be routed through semantic utilities mapped to `--color-*` variables (and eventually Dark Matter theme tokens).
2. **Theme-class consistency**:
   - `BaseThemeLayout` defaults to `theme-hypernova`, but the broader theme blueprint references `.theme-default`, `.theme-water`, `.theme-nova`, `.theme-matter`.
   - Dark Matter work will need a clear mapping (e.g. `theme-matter` or `theme-dark-matter`) and consistent use in layouts + utilities.
3. **Index not explicitly theme-aware**:
   - Index relies entirely on the layout/BoilerPlate for theme application and does not use semantic theme classes on its own container.
   - As we move to Dark Matter, the index should prefer semantic background/text classes rather than raw hex, and align with whatever `themeClass` the layout passes to the root.
4. **Mode integration is indirect here**:
   - Mode is controlled elsewhere (`ModeSwitcher`, `ThemeSwitcher`), not referenced in `index.astro`.
   - That’s fine for now, but any Dark Matter index work should assume mode comes from global utilities and avoid baking light/dark assumptions into page-level hex colors.

---

### Step 2 — Map Hard-Coded Styles to Theme Tokens

**Intent:** Identify where the index page uses raw colors or styles so they can be routed through the shared theme system.

**Prompt:**

> Based on the current `index.astro` implementation, list every **hard-coded color or style** (for example `bg-[#071321]`, inline styles on the brand mark wrapper, etc.).
>
> For each one:
> - Propose a semantic Tailwind / CSS variable mapping that would make sense in the Dark Matter theme (e.g. `bg-surface-900`, `text-brand-accent`, etc.).
> - Indicate whether that mapping should live in:
>   - The global `@theme` layer (color scales), or
>   - A theme-specific override class (e.g. `.theme-nova`, `.theme-water`, `.theme-matter`).
>
> Do **not** make any edits yet—just return a mapping table.

**Exit criteria:** You have a proposed mapping table from hard-coded styles → semantic theme tokens written to this file in the `Output` section below.

#### **Output:**

---

### Step 3 — Design the Brand-Themed Index Layout (On Paper)

**Intent:** Agree on the desired structure of the index page before touching code.

**Prompt:**

> Using the current `index.astro` as a baseline and the theme/mode blueprint in:
>
> - `astro-knots/context-v/Maintain-Themes-Mode-Across-CSS-Tailwind.md`
>
> Design a **target structure** for the index page that:
> - Keeps `BaseThemeLayout` as the outer shell.
> - Uses `SiteBrandMarkModeWrapper` (or a small wrapper) for the logo.
> - Uses semantic theme classes instead of inline hex colors.
> - Leaves room for a future hero copy block and CTA row.
>
> Please return a short outline (not code) describing sections, containers, and where theme classes should be applied (e.g. on `<html>`, on the main wrapper, on key text elements).

**Exit criteria:** You have a clear textual outline of the future index layout written to this file in the `Output` section below.

#### **Output:**

---

### Step 4 — Refactor Index to Use Theme Tokens (Minimal Edit)

**Intent:** Make the smallest possible code change to route existing visuals through the theme system.

**Prompt:**

> Using the mapping from Step 2 and the layout outline from Step 3, propose a **minimal diff** to `src/pages/index.astro` that:
> - Replaces hard-coded hex colors with semantic classes or theme-aware utilities.
> - Does **not** introduce new components yet.
> - Does not change copy or layout structure.
>
> Show the diff only (no prose), and ensure it respects existing Astro syntax and conventions in this repo.

**Exit criteria:** You have a small, reviewable diff for index theming only.


**Prompt**:
Import Dark Matter trademarks into header using Astro's preferred SVG feature.

[Astro Documentation on using SVGs](https://docs.astro.build/en/reference/experimental-flags/svg-optimization/)

Directory to find the SVG files: `astro-knots/sites/dark-matter/public/trademarks`

**Exit criteria:** The user can see the logos live in the header, and they toggle correctly between modes.

---

### Step 5 — Introduce a Reusable Branded Hero Container

**Intent:** Extract the brand-mark + tagline block into a re-usable, theme-aware component.

**Prompt:**

> Please design a small, reusable "BrandedHero--Default"-style component for Dark Matter that:
> - Wraps `SiteBrandMarkModeWrapper` and the tagline block currently in `index.astro`.
> - Accepts props for:
>   - Main tagline text.
>   - Optional subheading.
>   - Optional `themeClass` override.
> - Uses semantic theme utilities instead of inline hex colors.
>
> First, just return the **component interface** (props and responsibility list) and a short description of where it should live (e.g. `src/components/basics/heros/DarkMatterIndexHero--Default.astro`). Do not write the component yet.

**Exit criteria:** You have a clear API and file-path decision for the hero component.

---

### Step 6 — Implement the Hero Component (Single File Change)

**Intent:** Implement the hero component in isolation with minimal surface area.

**Prompt:**

> Based on the agreed API from Step 5, implement the hero component in the chosen path.
>
> Constraints:
> - Use Astro component syntax only (no JSX/TSX).
> - Use **existing** theme utilities and patterns (no new Tailwind config here).
> - Keep all styles in class attributes; no inline style attributes.
> - Do not modify any other files yet.
>
> Return only the component source for that single file.

**Exit criteria:** You have the hero component implemented, ready to be wired into `index.astro`.

---

### Step 7 — Wire Hero Component into Index

**Intent:** Replace the ad-hoc index markup with the hero component, without altering behavior.

**Prompt:**

> Now update `src/pages/index.astro` to:
> - Import the new hero component.
> - Replace the existing inline brand-mark + tagline block with the hero component.
> - Pass the same tagline copy and any necessary theme-related props.
>
> Provide a focused diff that only touches `index.astro`.

**Exit criteria:** Index now uses the hero component while looking and behaving the same.

---

### Step 8 — Add Mode/Theme Awareness Hooks (Optional, Later)

**Intent:** Plan, but not yet implement, more advanced interactions like theme/mode toggles on the index.

**Prompt:**

> Using:
> - `ThemeSwitcher` and `ModeSwitcher` utilities from `src/utils/`.
> - The theme/mode integration tests.
>
> Propose **one small, concrete enhancement** to the index page that surfaces theme/mode state (for example, showing the current theme/mode in a subtle label, or adding a tiny, non-invasive toggle).
>
> The enhancement should:
> - Be optional.
> - Not introduce new global behavior.
> - Be implementable in a single diff without touching Tailwind config.
>
> Return the idea and a suggested implementation plan; do not modify code yet.

**Exit criteria:** You have a backlog item for future theme/mode-aware UX on the index.

---

### Step 9 — Review and Portability Check

**Intent:** Ensure the index + basic components can be moved to other Astro-Knots sites with minimal friction.

**Prompt:**

> Given the updated index and hero component, evaluate how portable this setup is to another Astro-Knots site (e.g. Dark Matter):
> - List any assumptions baked into the components (asset paths, theme names, brand-specific copy).
> - Suggest small refactors (props, configuration, or layout changes) that would make the hero/index pattern reusable across sites with different brand themes.
>
> Do not make those refactors yet—just return a portability checklist.

**Exit criteria:** You have a checklist for making the index + hero pattern portable to other branded sites.

