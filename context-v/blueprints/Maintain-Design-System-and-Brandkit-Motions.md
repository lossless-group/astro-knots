---
title: "Maintain Design System and Brand Kit Motions"
lede: "Conventions for the two reference pages every Astro-Knots site ships — Brand Kit (brand experience essentials) and Design System (component catalog) — including scope split, URL standardization, theme/mode integration contract, and maintenance motions."
date_created: 2026-04-25
date_modified: 2026-04-25
date_last_updated: 2026-04-25
use_index: 3
status: Draft
category: Blueprints
tags: [Design-System, Brand-Kit, Reference-Pages, Pattern-Library, Theme-Modes, Documentation-Motions]
authors:
  - Michael Staton
augmented_with: Claude Code on Opus 4.7
---

# Maintain Design System & Brand Kit Motions

Every Astro-Knots site ships with **two internal reference pages** that together replace what most teams rely on Storybook or a separate Design System Manager (DSM) tool to provide. We tried those tools. They work, but they sit outside the site's actual theme/mode/runtime and require their own maintenance discipline that small teams don't have. We've found that an AI code assistant working inside the site's own codebase can improvise pages that are **just as useful, often better** — because the components render in their real theme, real mode, real layout, with real fonts and tokens applied. No drift between the catalog and production.

This blueprint codifies the contract for those two pages so they remain useful across sites and don't decay into stale snapshots.

---

## 1. The Two Pages, Two Scopes

| | Brand Kit | Design System |
|---|---|---|
| **URL** | `/brand-kit` | `/design-system` |
| **Entry file** | `src/pages/brand-kit/index.astro` | `src/pages/design-system/index.astro` |
| **Audience** | Stakeholders, designers, brand reviewers, the client's marketing team | Developers, AI assistants, future contributors |
| **Scope** | Brand experience essentials | Exhaustive component catalog |
| **Question it answers** | "What does this brand look and feel like?" | "What component do I use, and how do I use it?" |
| **Update cadence** | Rarely — only when brand evolves | Continuously — every new component lands here |

The split is not arbitrary. **Brand Kit** is a curated showcase aimed at non-developers. **Design System** is a working developer catalog. Mixing them produces a page that's too dense for stakeholders and too shallow for developers.

---

## 2. URL & File Standardization

### 2.1 Canonical paths

- **Brand Kit:** `src/pages/brand-kit/index.astro` → `/brand-kit`
- **Design System:** `src/pages/design-system/index.astro` → `/design-system`

### 2.2 Sub-pages

Both pages may have sub-pages for variants or component families. Sub-pages are kebab-case Astro files in the same directory:

```
src/pages/brand-kit/
├── index.astro              # Required entry point
├── heros.astro              # Hero variants
├── heros-splitscreen.astro  # Specific layout
├── typography.astro         # Typography examples
├── trademarks.astro         # Trademark, Logo, Favicon, App Icon, Wordmark examples
└── illustrations.astro      # Brand illustration treatment

src/pages/design-system/
├── index.astro              # Required entry point — links to all sub-pages
├── citations.astro
├── page-headers.astro
├── people.astro
├── messages.astro
└── flare/                   # Nested directories OK for grouped families
    └── index.astro
```

### 2.3 Naming corrections

Some sites currently use `component-library.astro` as the design-system entry. **The standard is `index.astro`.** Migrate older sites to `index.astro` when next touched (no bulk rename needed — fix on contact).

---

## 3. Brand Kit — Required Sections

The Brand Kit `index.astro` must include all of the following, each as a clearly labeled section:

1. **Color tokens** — every named brand color (`--color-lavendar`, `--color-cobalt`, etc.) rendered as a swatch with the token name and resolved value. Show all three modes side by side or behind the mode toggle.
2. **Semantic color aliases** — `--color-primary` / `--color-secondary` / `--color-accent` (and the 50–950 scales) shown as swatches with their per-theme mappings.
3. **Typography** — every font family in use, with sample text at each scale (display, h1–h6, body, small, code).
4. **Brand marks** — favicon, app icon, wordmark, trademark. All variants (light/dark) shown side by side. Use the `SiteBrandMarkModeWrapper` component when applicable.
5. **Illustration style** — sample illustrations, icon style, photography treatment, if the brand has a defined visual language.
6. **Signature layouts** — hero variants, key marketing sections, anything that conveys "this is what the brand looks like in motion." Sub-pages OK (e.g., `heros.astro`).
7. **Theme + Mode toggle** — both controls visible at the top of the page, calling `themeSwitcher.toggleTheme()` and `modeSwitcher.setMode(...)`. The Brand Kit is the **canonical manual test surface** for the three-mode system (see [Maintain Themes & Modes Across CSS and Tailwind](./Maintain-Themes-Mode-Across-CSS-Tailwind.md)).

Keep it elegant. The Brand Kit is shown to clients.

---

## 4. Design System — Required Sections

The Design System `index.astro` is a **catalog index**. It does not have to render every component on the index itself — it links to sub-pages or anchors. Required structure:

1. **Page header + nav** — clearly labeled, with links to every sub-page or in-page section.
2. **Theme + Mode toggle** — same as Brand Kit. Components must be inspectable in all three modes.
3. **One entry per component or component family**, each containing:
   - **Component name** and one-line purpose.
   - **Live render** in the current theme/mode.
   - **Variants** — every meaningful prop combination shown side by side (e.g., button: primary / secondary / ghost / disabled).
   - **Props/data attributes** — table of accepted props with types and defaults.
   - **CSS contract** — the CSS variables the component reads (`--color-*`, `--fx-*`) and any required ancestor selectors (`html[data-mode="..."]`, `.theme-*`).
   - **Usage example** — a small Astro/code block showing import + invocation.
   - **Accessibility notes** — keyboard behavior, ARIA, focus management — only when non-trivial.
4. **Effect tokens (`--fx-*`) reference** — list active effect tokens with their per-mode values, so developers can see the available glow/shadow/gradient palette. See blueprint §9 of the Themes blueprint.

The catalog can be split across sub-pages once the index gets long. Keep the index navigable.

### 4.1 Canonical reference: `dark-matter`

`sites/dark-matter/src/pages/design-system/` is the most expansive current implementation, with sub-pages for `citations`, `deals`, `flare`, `glows`, `messages`, `page-headers`, `people`, and `vibrant`. Use it as the reference for sub-page granularity.

---

## 5. Theme & Mode Integration Contract

Both pages **must**:

- Apply the standard `theme-*` class and `data-theme` / `data-mode` attributes on `<html>` (handled automatically by `BaseThemeLayout` + `ThemeSwitcher` + `ModeSwitcher`).
- Render every component the same way it renders in production — no special "preview" wrappers that bypass real layout, prose styles, or tokens.
- Expose the theme + mode toggle prominently at the top of the page so a reviewer can verify all combinations without leaving the page.

If a component looks wrong in a mode, the bug is in the component, not the catalog. The catalog's job is to make those bugs visible.

---

## 6. Visibility & SEO

These are **internal tools**, not marketing surfaces.

- Add `<meta name="robots" content="noindex, nofollow" />` to both `index.astro` files.
- Do not link to them from the public navigation. Authorized stakeholders get the URL directly.
- They may appear in `sitemap.xml` if generation is automatic; that's fine, the `noindex` is authoritative.
- Do not put confidential client information on these pages — assume they may be linked publicly by accident at any time.

---

## 7. Maintenance Motions

The pages decay if no one tends to them. The motions that keep them alive:

1. **New component → Design System update in the same PR.** Don't merge a component without adding it to `/design-system` (even if just a stub linking to the source file).
2. **Brand evolution → Brand Kit update first.** New token, new font, new mark — Brand Kit is updated before the change ships to other pages, so there's a single page proving the new brand reads correctly across modes.
3. **Theme/mode bug surfaced → reproduce in Brand Kit or Design System first.** If a component breaks in vibrant mode, the catalog is where the regression lives until fixed.
4. **AI assistant creating components.** The assistant should be instructed (via `CLAUDE.md` or prompt) to update the relevant catalog entry whenever it introduces a new component or variant. This is the motion that replaces Storybook discipline.

---

## 8. Why Not Storybook (or a Separate DSM)?

We tried. The honest tradeoff:

- **What Storybook gives you:** isolation, controlled props, story-level documentation, snapshot/visual regression infra, established conventions.
- **What it costs:** parallel build pipeline, parallel theming setup, drift between stories and production, mocked data that doesn't match real content shape, ongoing maintenance discipline that small teams skip.
- **What in-site catalog pages give you:** components render in real theme/mode/layout/fonts; AI assistants can update the catalog and the component in a single change; no separate build; no drift; one URL to share with stakeholders.
- **What you give up:** isolated story controls, snapshot tests, the polish of a dedicated tool.

For our scale and team size, the in-site catalog wins. If the project ever grows past the inflection point where snapshot regression becomes non-negotiable, revisit. Until then, the two pages above are the system.

---

## 9. Porting Checklist

When adding these pages to a new site:

- [ ] Create `src/pages/brand-kit/index.astro` with the required Brand Kit sections (§3).
- [ ] Create `src/pages/design-system/index.astro` with the required Design System structure (§4).
- [ ] Both pages render with `BaseThemeLayout` so theme/mode contracts apply automatically.
- [ ] Theme + mode toggles are visible at the top of both pages.
- [ ] All three modes (light, dark, vibrant) render correctly on both pages.
- [ ] Both pages emit `noindex, nofollow` (§6).
- [ ] Add a short note to the site's own `README.md` linking to both URLs.
- [ ] If migrating from `component-library.astro`, rename to `index.astro`.

---

## 10. References

- [Maintain Themes & Modes Across CSS and Tailwind](./Maintain-Themes-Mode-Across-CSS-Tailwind.md) — the theme/mode architecture both pages depend on.
- **Brand Kit reference implementations:** `sites/hypernova-site/src/pages/brand-kit/`, `sites/twf_site/src/pages/brand-kit/`.
- **Design System reference implementation:** `sites/dark-matter/src/pages/design-system/` (most expansive sub-page structure).
- [New Site Quickstart Guide](../prompts/New-Site-Quickstart-Guide.md) — barebones onboarding instructions for both pages.
