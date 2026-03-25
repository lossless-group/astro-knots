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
- **Client-agnostic conventions**:
  - `theme-*` classes on `html` for brand themes.
  - `data-theme` and `data-mode` attributes for state and CSS hooks.
  - Tailwind utilities always read from `--color-*` variables, not hardcoded hex/RGB.
  - Important brand and theme colors will have a single source of truth and be named `--color-lavendar`, `--color-cobalt`, `--color-rose`, etc. rather than `--color-primary`, `--color-secondary`, etc. 
  - Then, `--color-primary`, `--color-secondary`, etc. will reference named colors from the theme specific css file. 
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

## 2. Theme & Color Architecture

### 2.1 Tailwind v4 Color Variables

Hypernova uses Tailwind v4 with `@theme`-style color variables. For IDE support there is a dedicated helper file:

- `src/styles/tailwind-v4.css`

Key ideas:

- `:root` defines base scales for `primary`, `secondary`, and `accent`:
  - `--color-primary-50` … `--color-primary-950`
  - `--color-secondary-50` … `--color-secondary-950`
  - `--color-accent-50` … `--color-accent-950`
- These act as the **default theme** colors.
- Tailwind utilities (e.g. `text-primary-600`) are wired to these variables via the Tailwind v4 `@theme` configuration (see original spec for the conceptual mapping).

### 2.2 Brand Theme Overrides (Water, Nova, Matter)

Hypernova defines a **`theme-nova`** class
The Water foundation defines a **theme-water** class
Dark Matter will have a **theme-matter** class

The theme settings will determine which theme style tokens, which overrides any generic or conflicting tokens in other style files.

- `.theme-water { --color-primary-*; --color-secondary-*; --color-accent-*; }`
- Applied to `html` via the theme switcher, e.g. `class="theme-water"`.
- Because Tailwind utilities read from `--color-*`, **all components automatically adopt the active theme**.

This gives a clean layering:

1. **Base palette**: `:root` `--color-*` values.
2. **Theme overrides**: `.theme-default`, `.theme-matter`, etc.
3. **Tailwind utilities**: semantic classes that are stable across themes.

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

## 5. UI Integration: Brand Kit Page

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

## 8. Next-Step Considerations

For future refinement and for alignment with the original spec’s ambitions:

- Add clearer **system preference detection** for mode (currently hard-coded to dark).
- Consider naming for additional themes beyond `default` and `water` (e.g. client codes or descriptive theme IDs).
- Introduce a small **configuration map** (e.g. JSON/TS object) describing available themes and their roles, while still keeping CSS as the source of truth for actual colors.
- Document how to integrate this system into other Astro-Knots sites, including dark-matter, with minimal friction.
