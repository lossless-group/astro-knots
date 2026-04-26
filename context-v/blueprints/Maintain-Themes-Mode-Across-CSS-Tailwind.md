---
title: "Maintain Themes and Modes Across CSS and Tailwind"
lede: "Implementation blueprint for dual-axis theme and mode control using Tailwind CSS v4 custom properties, with runtime utilities and Vitest verification."
date_created: 2025-11-15
date_modified: 2026-04-25
use_index: 2
date_last_updated: 2026-04-25
status: Published
category: Blueprints
tags: [Themes, Dark-Mode, Tailwind, CSS-Variables, Design-Tokens, Named-Tokens, BEM-Conventions, Two-Tier-Tokens]
authors:
  - Michael Staton
---

# Maintain Themes & Modes Across CSS and Tailwind (Hypernova Implementation Blueprint)

This blueprint captures how `astro-knots/sites/hypernova-site` actually implements themes and modes today, so the same patterns can be reused or adapted (for example, when moving toward implementation in **dark-matter**).

The original spec lived at:

- `content/projects/Astro-Knots/Specs/Maintain-Themes-Mode-Across-CSS-Tailwind.md`

This document is the **implementation-grounded** version of that idea.

---

## 1. Goals

- **Dual axis control**
  - **Theme**: brand palettes (`default`, `water`, etc.)
  - **Mode**: `light` / `dark` / `vibrant`
- **Single source of truth for color scales** using Tailwind CSS v4 `@theme` + CSS custom properties.
- **Two-tier token architecture** (full detail in §2.1): raw **named tokens** (`--color__blue-azure`, `--font__lato`) at the top of each theme file act as the brand's palette of "things we have"; **semantic tokens** (`--color-primary`, `--font-heading-1`) are the system layer Tailwind consumes and components reference. Clients iterate at the named-token tier without touching component code.
- **Client-agnostic conventions**:
  - `theme-*` classes on `html` for brand themes.
  - `data-theme` and `data-mode` attributes for state and CSS hooks.
  - Tailwind utilities always read from `--color-*` semantic variables, not hardcoded hex/RGB.
- **Robust runtime utilities** with:
  - LocalStorage persistence.
  - Safe SSR behavior (no crashes when `window` / `document` are absent).
  - Custom events for UI components to respond to changes.
- **Verification** through a dedicated Vitest suite that tests:
  - All theme/mode combinations.
  - Persistence.
  - DOM state and attribute clean-up.
  - SSR compatibility.

---

## 2. Token Architecture (Colors & Typography)

### 2.1 Two-Tier Token System: Named & Semantic Tokens

We use **two tiers** of design tokens, distinguished by naming convention. This is the core motion that lets clients iterate quickly without invasive refactors.

**Tier 1 — Named tokens** (raw values, private to the theme):

- BEM-ish syntax: `--{category}__{name}`
- Examples: `--color__blue-azure`, `--color__rose-quartz`, `--color__graphite-950`, `--font__lato`, `--font__playfair-display`
- Live at the **top of each theme.css file** as the brand's palette of "things we have."
- Components do **not** reference these directly — only the semantic tier does.
- The `__` separator is a deliberate visual cue: this is a raw value, not a semantic role.

**Tier 2 — Semantic tokens** (the system layer Tailwind consumes):

- kebab-case: `--{category}-{role}` and `--{category}-{role}-{scale}`
- Examples: `--color-primary`, `--color-primary-500`, `--color-surface`, `--color-border`, `--font-heading-1`, `--font-body`
- Defined in the **system / theme block** of each theme.css file. Each semantic token references a named token via `var()`.
- Tailwind v4's `@theme` directive only auto-generates utilities (`bg-primary-500`, `text-primary-500`) for kebab-case tokens — that's the practical constraint forcing this tier to stay kebab-case.
- Effect tokens (`--fx-*`, see §9) are also semantic-tier — components consume them as a contract.

**The visual rule:** see `__` → raw named token. See only `-` → semantic token (Tailwind-readable, what components use).

### 2.1.1 Why Two Tiers? — The Client Iteration Motion

Clients iterate by saying "I don't like the primary color" or "the border feels off" or "can we try a different display font?" The two-tier system reduces every such request to a one-line wiring change:

1. Find a new color/font the client likes.
2. Add it to the named tokens list at the top of `theme.css`: `--color__sky-cerulean: #2596be;`
3. Re-point the affected semantic token: `--color-primary: var(--color__sky-cerulean);`

Components don't change. Tailwind utilities don't change. Type-safe component contracts don't break. Only the wiring changes.

The alternative — search-and-replacing hex values across the codebase, or renaming semantic tokens — is invasive and error-prone. The two-tier system absorbs all that churn at the wiring layer.

### 2.1.2 Wiring Example

```css
/* Top of theme.css — Tier 1: named tokens */
:root {
  --color__blue-azure: #1f7ae0;
  --color__rose-quartz: #f7cac9;
  --color__graphite-950: #0d1117;
  --color__ivory-warm: #faf6f1;

  --font__lato: 'Lato', system-ui, sans-serif;
  --font__playfair-display: 'Playfair Display', Georgia, serif;
  --font__jetbrains-mono: 'JetBrains Mono', ui-monospace, monospace;
}

/* System / theme section — Tier 2: semantic tokens */
.theme-default {
  --color-primary: var(--color__blue-azure);
  --color-primary-500: var(--color__blue-azure);
  --color-surface: var(--color__graphite-950);
  --color-background: var(--color__ivory-warm);

  --font-heading-1: var(--font__playfair-display);
  --font-body: var(--font__lato);
  --font-code: var(--font__jetbrains-mono);
}
```

Components and Tailwind utilities only ever read from Tier 2. Tier 1 is implementation detail.

### 2.1.3 Notes on Identifier Syntax

CSS allows `[a-zA-Z0-9_-]` (plus escaped Unicode) in identifiers, so `--color__blue-azure` is valid CSS — the underscore is fine. The `--` prefix is the CSS custom property requirement; the `__` after the category is the BEM element separator. Names within the element slot (`blue-azure`, `playfair-display`) may contain hyphens — this is a pragmatic relaxation of strict BEM, since CSS identifiers commonly hyphenate multi-word terms.

### 2.2 Tailwind v4 Color Variables

Hypernova uses Tailwind v4 with `@theme`-style color variables. For IDE support there is a dedicated helper file:

- `src/styles/tailwind-v4.css`

Key ideas:

- `:root` defines base scales for `primary`, `secondary`, and `accent`:
  - `--color-primary-50` … `--color-primary-950`
  - `--color-secondary-50` … `--color-secondary-950`
  - `--color-accent-50` … `--color-accent-950`
- These act as the **default theme** colors.
- Tailwind utilities (e.g. `text-primary-600`) are wired to these variables via the Tailwind v4 `@theme` configuration (see original spec for the conceptual mapping).

### 2.3 Brand Theme Overrides (Water, Nova, Matter)

Hypernova defines a **`theme-nova`** class
The Water foundation defines a **theme-water** class
Dark Matter will have a **theme-matter** class

The theme settings will determine which theme style tokens, which overrides any generic or conflicting tokens in other style files.

- `.theme-water { --color-primary: var(--color__teal-deep); /* etc. */ }`
- Applied to `html` via the theme switcher, e.g. `class="theme-water"`.
- Because Tailwind utilities read from semantic `--color-*` tokens, **all components automatically adopt the active theme**.

This gives a clean layering:

1. **Named palette**: `:root` `--color__*` and `--font__*` values (Tier 1, §2.1).
2. **Theme bindings**: `.theme-default`, `.theme-matter`, etc. — wire semantic tokens (Tier 2) to named tokens.
3. **Tailwind utilities**: semantic classes that are stable across themes.

### 2.4 Typography Tokens

The same two-tier system applies to fonts:

**Named tokens (Tier 1)** — the typefaces the brand actually uses:

```css
:root {
  --font__lato: 'Lato', system-ui, sans-serif;
  --font__inter: 'Inter', system-ui, sans-serif;
  --font__playfair-display: 'Playfair Display', Georgia, serif;
  --font__jetbrains-mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

**Semantic tokens (Tier 2)** — the role each font plays:

```css
.theme-default {
  --font-display: var(--font__playfair-display);
  --font-heading-1: var(--font__playfair-display);
  --font-body: var(--font__lato);
  --font-code: var(--font__jetbrains-mono);
}
```

**Naming guidance for semantic font roles:** prefer **descriptive role names** (`--font-display`, `--font-body`, `--font-legible-primary`) over **numeric scale roles** (`--font-heading-1`, `--font-subheading-3`) when the names will surface in client conversations or in the Brand Kit. "heading-1" is meaningless to a non-developer; "display" or "legible-primary" conveys intent. Both forms are acceptable — pick what fits the brand's vocabulary, and use them consistently within a site.

The wiring motion is identical to colors: when a client wants to swap a font, you add the new typeface to the named tokens list and re-point the affected semantic role. No component code changes.

---

## 3. Runtime Theme Switching

The reason we do this theme-switcher is it allows the rapid copying of features, pages, components from one Astro-Knots site to another, without risk of significant theme clashes. 

### 3.1 ThemeSwitcher Utility

File:

- `src/utils/theme-switcher.js`

Responsibilities:

- Manage **brand theme**: `'default'` vs `'water'`.
- Keep state in **localStorage** under the `theme` key.
- Apply and clean up theme-related classes and attributes on `html`.
- Emit a custom `theme-change` event on `window` for subscribers.

Core behavior:

- On construction:
  - `this.currentTheme` starts from `localStorage` if present, else `'default'`.
  - `applyTheme(currentTheme, true)` is called to sync DOM on initial load.

- `applyTheme(theme, initialLoad = false)`:
  - No-op if `document` is undefined (SSR safety).
  - Works against `document.documentElement` (the `<html>` element).
  - **Clean-up**:
    - `classList.remove('theme-default', 'theme-water')`.
    - Remove `data-theme`, `data-theme-default`, `data-theme-water` attributes.
  - **Apply** selected theme:
    - For `'water'`:
      - `html.setAttribute('data-theme', 'water')`.
      - `html.classList.add('theme-water')`.
    - For `'default'`:
      - `html.setAttribute('data-theme', 'default')`.
      - `html.classList.add('theme-default')`.
  - If **not initial load**:
    - Update `this.currentTheme`.
    - Persist via `localStorage`.
  - Dispatch a `theme-change` custom event.

- `toggleTheme()`:
  - Computes `newTheme` from `currentTheme` (`default ↔ water`).
  - Updates internal state, applies theme, persists, and fires a `theme-change` event.

- `getCurrentTheme()`:
  - Reads CSS classes on `html` to derive `'default'` or `'water'`.

- `setTheme(theme)`:
  - Validates theme against the allowed set.
  - Applies, stores, and returns the effective theme.

### 3.2 Initialization Pattern

At the end of `theme-switcher.js`:

- A **singleton** `themeSwitcher` instance is exported.
- On `DOMContentLoaded`:
  - It re-applies the stored theme (`savedTheme || 'default'`).
  - Adds a `theme-transition` class to `<html>` to avoid FOUC during initial paint.

---

## 4. Runtime Mode Switching (Light / Dark)

### 4.1 ModeSwitcher Utility

File:

- `src/utils/mode-switcher.js`

Responsibilities:

- Manage **mode**: `'light'` vs `'dark'` vs `'vibrant'`.
   (`vibrant` is not standard but we have found that some users prefer a more vibrant dark mode that has loud colors, gradients, an more advanced and playful and colorful styles)
- Persist mode in **localStorage** as `mode`.
- Keep Tailwind’s `dark` class and `data-mode` attribute in sync.
- Emit a custom `mode-change` event on `window`.

Core behavior:

- On construction:
  - `this.currentMode` comes from `localStorage` or system preference.
  - `getSystemPreference()` currently **defaults to `'dark'`** when `window` is defined.
  - `applyMode(currentMode, true)` is called.

- `applyMode(mode, initialLoad = false)`:
  - No-op if `document` is undefined.
  - For `'dark'`:
    - `html.setAttribute('data-mode', 'dark')`.
    - `html.classList.add('dark')` (Tailwind dark mode hook).
  - For `'light'`:
    - `html.setAttribute('data-mode', 'light')`.
    - `html.classList.remove('dark')`.
  - On non-initial calls:
    - Update `this.currentMode` and persist via `localStorage`.
  - Dispatch a `mode-change` event.

- `toggleMode()`:
  - Flips `this.currentMode` between `'light'` and `'dark'` and applies it.

- `setMode(mode)` / `getCurrentMode()`:
  - Validate, apply, and expose mode.

### 4.2 Initialization Pattern

At the end of `mode-switcher.js`:

- A global `modeSwitcher` instance is exported.
- On `DOMContentLoaded`:
  - Applies stored mode or defaults to `'dark'`.
- The instance is **also attached to `window`** (when available) for non-ESM access.

---

## 5. UI Integration

### 5.0 Mandatory: Mode Toggle in Site Chrome

> **Firm-wide policy.** Every Astro-Knots site MUST expose the 3-mode toggle in **persistent site chrome** — header or footer, visible on every public page. The `/brand-kit` and `/design-system` toggles are for inspection; the chrome toggle is for end-users.

**Canonical implementation:** [`packages/ui/theme-mode/components/ModeToggle.astro`](../../packages/ui/theme-mode/) — a single 3-mode cycle button (light → dark → vibrant) with inline sun/moon/star SVGs. CSS-driven icon visibility via `html[data-mode="..."]` selectors. Reads `window.modeSwitcher` (booted by `BaseThemeLayout`) so it never duplicates switcher logic.

**Why this is codified now:** several existing sites (banner-site, twf_site, dark-matter, hypernova-site) shipped their own `ModeToggle.astro` with **inline parallel switcher logic** — different localStorage keys, partial mode coverage, drift between toggle state and the rest of the site. Extracting the canonical version forces UI and switcher to stay in sync.

**Required wiring:**

1. Copy `packages/ui/theme-mode/utils/{mode,theme}-switcher.js` into `src/utils/`.
2. Copy `packages/ui/theme-mode/components/ModeToggle.astro` into `src/components/ui/`.
3. Boot the switchers in `BaseThemeLayout.astro`:
   ```astro
   <script>
     import '../utils/theme-switcher.js';
     import '../utils/mode-switcher.js';
   </script>
   ```
4. Render `<ModeToggle />` from a `Header` (or `Footer`) component that `BaseThemeLayout` renders for every page.

**Migration motion:** sites with the legacy inline-switcher `ModeToggle.astro` (banner-site `STORAGE_KEY = 'emblem-mode'`, etc.) should be replaced with copies of the canonical version on next contact. Safe — the canonical version uses the standard `'mode'` localStorage key and the same `data-mode` attribute, so existing CSS keeps working.

### 5.1 Brand Kit Page (Inspection Toggle)

File:

- `src/pages/brand-kit/index.astro`

Key integration points:

- Page is wrapped in `BaseThemeLayout` with `themeClass="theme-water"` (so the brand kit shows the water theme by default).
- Two buttons are rendered:
  - `#theme-toggle` → toggles between `default` and `water`.
  - `#mode-toggle` → toggles between `light` and `dark`.
- Client-side script:
  - Imports `themeSwitcher` and `modeSwitcher` from their respective utilities.
  - On `DOMContentLoaded`:
    - Grabs both buttons.
    - Sets up click handlers calling `toggleTheme()` / `toggleMode()`.
    - Updates button text based on current theme/mode.
    - Subscribes to `theme-change` and `mode-change` events to keep UI labels in sync.

This page is effectively the **reference UX** for theme/mode behavior: it demonstrates how the utilities are intended to be used from an Astro component.

---

## 6. Test Harness: Theme + Mode Integration

File:

- `src/utils/__tests__/theme-mode-integration.test.js`

Purpose:

- Validate that **ThemeSwitcher** and **ModeSwitcher** work correctly together across all important axes:
  - Combined states.
  - Persistence.
  - Events.
  - DOM state cleanup.
  - SSR behavior.
  - CSS variable and attribute integration.

Highlights:

- Uses a shared `beforeEach` that:
  - Clears Vitest mocks.
  - Calls `global.resetDOMState()` (a helper to reset the DOM mock).
  - Clears `window.localStorage`.
  - Instantiates fresh switcher instances.

Coverage examples:

- **Theme/Mode combinations**:
  - `(default, light)`, `(default, dark)`, `(water, light)`, `(water, dark)`.
  - Asserts `classList.add` and attribute calls on `<html>`.

- **State persistence**:
  - Ensures both `theme` and `mode` are written to localStorage.
  - Reconstructs switchers with mocked `localStorage.getItem` to verify restoration.

- **Events**:
  - Confirms that `theme-change` and `mode-change` events are dispatched separately with correct payloads.

- **Toggle operations**:
  - Validates joint and independent toggling of theme and mode.

- **DOM state validation**:
  - Ensures previous theme classes and `data-mode` are removed as expected.

- **SSR compatibility**:
  - Temporarily deletes `global.document` to simulate server environment.
  - Confirms no errors when calling switcher methods in that context.

- **CSS variable integration**:
  - Asserts that `theme-*` classes and `data-mode` attributes are applied, supporting correct CSS variable inheritance and dark-mode styling.

---

## 7. Conventions to Carry Forward (e.g., into dark-matter)

When porting or extending this system, keep these conventions:

1. **Color variables as the contract**
   - Always drive colors through `--color-*` custom properties.
   - Tailwind utilities point at these variables, not raw hex values.

2. **Theme layer** (brand):
   - Use `theme-*` classes on `<html>` for brand themes.
   - Use `data-theme` as an additional, queryable attribute.

3. **Mode layer** (light/dark):
   - Use `data-mode` and Tailwind’s `.dark` class for mode.
   - Keep theme and mode orthogonal: theme switch does not touch mode, and vice versa.

4. **Persistence & Events**:
   - Persist both theme and mode to localStorage (`theme`, `mode`).
   - Emit `theme-change` and `mode-change` events for reactive UI.

5. **SSR-Safe Utilities**:
   - Guard all `window` / `document` access.
   - Allow creating switchers in non-DOM environments without throwing.

6. **Reference Page**:
   - Maintain a “Brand Kit / Theme Lab” page that:
     - Surfaces all themes and modes.
     - Uses the shared utilities.
     - Acts as the canonical manual test surface.

7. **Testing**:
   - Keep or re-establish an integration test file that:
     - Covers theme+mode combinations.
     - Verifies persistence.
     - Checks DOM attributes and classes.
     - Confirms SSR behavior.

---

## 8. Mode-Aware Brand Mark Component

### 8.1 Why It's Needed

Brand marks (logos, wordmarks, trademarks) are typically designed for a specific background contrast. A white wordmark disappears on a white background; a dark wordmark disappears on a dark background. When a site supports multiple modes (light, dark, vibrant), the brand mark in the header, footer, or hero must swap automatically to remain legible.

This cannot be solved with CSS `filter` or `mix-blend-mode` alone — brand marks often have specific color treatments per mode (e.g., a blue-on-white version for light mode vs. a white-on-transparent version for dark mode). The solution is a wrapper component that renders both image variants and uses CSS to toggle visibility based on the active `data-mode` attribute.

### 8.2 SiteBrandMarkModeWrapper Component

**File (per site):** `src/components/ui/SiteBrandMarkModeWrapper.astro`

**Reference implementations:**
- **Banner VC (emblem theme):** Handles three modes (light, dark, vibrant). Accepts logo paths as props.
- **The Water Foundation (water theme):** Handles two modes (light, dark). Hardcodes logo paths internally.

The Banner VC version is the more portable pattern — it accepts image paths as props so the same component works for any brand mark placement (header, footer, OG images, etc.).

**Props interface:**

```ts
interface Props {
  lightSrc: string;   // Image path shown in light mode
  darkSrc: string;    // Image path shown in dark & vibrant modes
  alt?: string;
  class?: string;
  width?: number | string;
  height?: number | string;
}
```

**Component template:**

```astro
<div class:list={['brand-mark-wrapper relative', className]}>
  <img
    src={lightSrc}
    alt={alt}
    width={width}
    height={height}
    loading="eager"
    decoding="async"
    fetchpriority="high"
    class="brand-mark-light w-full h-full object-contain"
  />
  <img
    src={darkSrc}
    alt={alt}
    width={width}
    height={height}
    loading="eager"
    decoding="async"
    fetchpriority="high"
    class="brand-mark-dark w-full h-full object-contain"
  />
</div>
```

**CSS toggle rules (global scope):**

```css
/* Default (light mode): show light mark */
.brand-mark-wrapper .brand-mark-light { display: block; }
.brand-mark-wrapper .brand-mark-dark  { display: none; }

/* Dark + Vibrant: show dark mark */
html[data-mode="dark"] .brand-mark-wrapper .brand-mark-light,
html[data-mode="vibrant"] .brand-mark-wrapper .brand-mark-light { display: none; }

html[data-mode="dark"] .brand-mark-wrapper .brand-mark-dark,
html[data-mode="vibrant"] .brand-mark-wrapper .brand-mark-dark { display: block; }
```

### 8.3 Usage in Header

```astro
---
import SiteBrandMarkModeWrapper from '../ui/SiteBrandMarkModeWrapper.astro';
---

<a href="/" aria-label="Home">
  <SiteBrandMarkModeWrapper
    lightSrc="/brand/trademarks__MyBrand--Dark.webp"
    darkSrc="/brand/trademarks__MyBrand--Light.webp"
    alt="My Brand"
    height={40}
  />
</a>
```

### 8.4 How It Works with the Mode System

The component relies entirely on the `data-mode` attribute that the **ModeToggle** (§4) sets on `<html>`. The flow:

1. User clicks mode toggle → `document.documentElement.dataset.mode` updates (e.g., `"vibrant"`).
2. CSS selector `html[data-mode="vibrant"] .brand-mark-wrapper .brand-mark-light` matches → hides light image.
3. CSS selector `html[data-mode="vibrant"] .brand-mark-wrapper .brand-mark-dark` matches → shows dark image.
4. The `transition-theme` timing (75ms) from `global.css` applies, so the swap feels instant.

No JavaScript is needed inside the component — it's pure CSS driven by the same `data-mode` contract that powers all theme tokens.

### 8.5 Design Decisions & Conventions

- **Props over hardcoding:** Accept `lightSrc` / `darkSrc` as props so the component is reusable across header, footer, and any other brand placement.
- **No `!important`:** The `html[data-mode="..."]` ancestor selector provides sufficient specificity without needing `!important` overrides.
- **No `.dark` class fallback:** Sites using the `data-mode` system (§4) should rely on `data-mode` exclusively. The Tailwind `.dark` class is a separate concern for Tailwind utility dark variants, not for component-level toggling.
- **Vibrant groups with dark:** Both dark and vibrant modes typically use dark backgrounds, so they share the same brand mark variant. If a future mode needs a third variant, add a `vibrantSrc` prop and a third CSS rule.
- **`loading="eager"` + `fetchpriority="high"`:** Brand marks are above the fold and should not be lazy-loaded. Both images are loaded eagerly; only one is visible at a time via `display: none/block`.
- **`is:global` styles:** Required because the CSS selectors reference `html[data-mode]`, which is outside the component's scoped style boundary.

### 8.6 Porting Checklist

When adding this component to a new Astro-Knots site:

1. Copy `SiteBrandMarkModeWrapper.astro` into `src/components/ui/`.
2. Ensure your site's layout sets `data-mode` on `<html>` (via `BaseThemeLayout` or equivalent).
3. Prepare two brand mark images — one for light backgrounds, one for dark.
4. Place images in `public/brand/` following the naming convention: `trademarks__BrandName--Variant.webp`.
5. Update your Header (or other consumer) to import and use the component with the correct paths.
6. If your site only has two modes (light/dark), remove the `html[data-mode="vibrant"]` selectors.

---

## 9. Effect Tokens (`--fx-*`) and Mode-Adaptive Visual Intensity

### 9.1 The Problem

Semantic color tokens (`--color-primary`, `--color-surface`, etc.) handle text, backgrounds, and borders well. But visual effects — glows, shadows, gradients, animated elements — need their own tokens because their intensity should **scale with the mode**:

- **Light mode**: Minimal effects. Subtle shadows, no glows, clean surfaces.
- **Dark mode**: Moderate effects. Soft glows, gradient backgrounds, gentle text shadows.
- **Vibrant mode**: Maximum impact. Dramatic glows, multi-layer gradients, animated elements in high-contrast colors.

Without dedicated effect tokens, developers hardcode `box-shadow: 0 0 40px rgba(0, 82, 230, 0.3)` in one mode and it looks wrong in the other two.

### 9.2 The `--fx-*` Token Convention

Effect tokens use the `--fx-` prefix to distinguish them from semantic color tokens (`--color-*`). They are defined per mode alongside the color tokens:

```css
/* Each mode sets these — same names, different intensities */
/* `--fx-*` tokens are semantic (Tier 2). Their values reference named tokens (Tier 1) like --color__brand-blue-deep. */
[data-theme="emblem"][data-mode="light"] {
  --fx-glow-opacity: 0.08;
  --fx-glow-spread: 10px;
  --fx-card-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  --fx-flare-color: var(--color__brand-blue-deep);
}

[data-theme="emblem"][data-mode="dark"] {
  --fx-glow-opacity: 0.25;
  --fx-glow-spread: 25px;
  --fx-card-shadow: 0 0 0 1px color-mix(in srgb, var(--color-background) 60%, black);
  --fx-flare-color: var(--color__brand-blue-bright);
}

[data-theme="emblem"][data-mode="vibrant"] {
  --fx-glow-opacity: 0.5;
  --fx-glow-spread: 50px;
  --fx-card-shadow: 0 2px 12px color-mix(in srgb, var(--color__graphite-950) 30%, transparent);
  --fx-flare-color: var(--color__electric);
}
```

### 9.3 Canonical Effect Token Names

These token names are the contract between the theme and components. A component author uses these tokens; a theme author sets their values per mode. When porting to a new site, you only change the values — the component code stays the same.

**Glow & shadow intensity:**
| Token | Purpose |
|-------|---------|
| `--fx-glow-opacity` | Base glow opacity (0–1) |
| `--fx-glow-spread` | Glow spread radius |
| `--fx-glow-color` | Glow color (use `color-mix()` with named colors) |
| `--fx-text-shadow` | Text shadow for headlines |
| `--fx-text-glow` | Text glow (multi-layer for vibrant) |

**Card effects:**
| Token | Purpose |
|-------|---------|
| `--fx-card-bg` | Card background (translucent surface) |
| `--fx-card-border` | Card border color |
| `--fx-card-border-hover` | Card border on hover |
| `--fx-card-shadow` | Card shadow at rest |
| `--fx-card-shadow-hover` | Card shadow on hover |

**Hero & gradient backgrounds:**
| Token | Purpose |
|-------|---------|
| `--fx-hero-gradient` | Gradient overlay for hero sections |
| `--fx-hero-bg` | Hero background color |
| `--fx-headline-gradient` | Text gradient for headlines |

**Decorative elements:**
| Token | Purpose |
|-------|---------|
| `--fx-orb-color` | Decorative orb/blob color |
| `--fx-flare-color` | Color for animated flare components (Three.js flags, etc.) |

### 9.4 Why `--fx-flare-color` Exists

Interactive canvas elements (Three.js, WebGL, Canvas 2D) resolve CSS variables once at construction time and bake the value into their rendering pipeline. Unlike CSS-styled elements, they don't automatically re-read variables when the mode changes.

`--fx-flare-color` solves the contrast problem: each mode picks a color that's guaranteed to be visible against that mode's background. The flare component resolves this token via `getComputedStyle()` and observes `data-mode` changes via `MutationObserver` to update the rendered color live.

**Per-mode contrast mapping:**

| Mode | Background | `--fx-flare-color` | Why |
|------|-----------|-------------------|-----|
| Light | Light/ivory | Deep brand color | Dark on light |
| Dark | Dark navy | Bright brand color | Bright on dark |
| Vibrant | Saturated brand color | Lighter accent | Must differ from bg hue/lightness |

### 9.5 How Components Use Effect Tokens

**CSS components** reference `--fx-*` tokens directly:

```css
.card {
  background: var(--fx-card-bg, var(--color-surface));
  border: 1px solid var(--fx-card-border, var(--color-border));
  box-shadow: var(--fx-card-shadow);
}

.card:hover {
  border-color: var(--fx-card-border-hover, var(--color-border));
  box-shadow: var(--fx-card-shadow-hover);
}
```

**Canvas/Three.js components** resolve tokens at init and watch for mode changes:

```ts
// Resolve CSS variable at construction
const raw = container.dataset.pixelColor || '#ffffff'; // e.g. "var(--fx-flare-color)"
const resolved = resolveColor(raw);

// Watch for mode changes
new MutationObserver(() => {
  const newColor = resolveColor(raw);
  material.color.set(newColor);
}).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-mode'],
});
```

### 9.6 Porting to a New Site

The beauty of canonical token names: when setting up a new site's theme, you copy the token names and set new values. Components that reference `--fx-flare-color` or `--fx-card-shadow` work immediately — no component code changes needed.

1. Copy the `--fx-*` token block from a reference site's theme CSS.
2. Update the values to match the new brand's named colors.
3. Ensure each mode provides sufficient contrast for its background.
4. Components that use `--fx-*` tokens work out of the box.

The same principle applies across all Astro-Knots sites: the token names are the stable API, the values are brand-specific configuration.

---

## 10. Next-Step Considerations

For future refinement and for alignment with the original spec’s ambitions:

- Add clearer **system preference detection** for mode (currently hard-coded to dark).
- Consider naming for additional themes beyond `default` and `water` (e.g. client codes or descriptive theme IDs).
- Introduce a small **configuration map** (e.g. JSON/TS object) describing available themes and their roles, while still keeping CSS as the source of truth for actual colors.
- Document how to integrate this system into other Astro-Knots sites, including dark-matter, with minimal friction.
