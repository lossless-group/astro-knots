# Styles Architecture Blueprint for Dark Matter

## 1. Context and Goals

Reference projects:

- `astro-knots/sites/hypernova-site/src/styles`
- `astro-knots/sites/twf_site/src/styles`

These sites already implement:

- Tailwind CSS v4 with `@theme`.
- Theme switching via `ThemeSwitcher` and `ModeSwitcher`.
- Multiple brand themes (default, water, hypernova/nova) with semantic tokens.

**Goals for Dark Matter (`matter-theme`)**

- Reduce duplication between projects while keeping brand-specific theming flexible.
- Make Dark Matter a **clean reference implementation** of:
  - Named brand colors (e.g. `--color-lavender`, `--color-cobalt`, `--color-rose`, `--color-ink`, `--color-void`).
  - Derived color scales (`--color-primary-*`, `--color-secondary-*`, `--color-accent-*`).
  - Semantic tokens (`--color-background`, `--color-foreground`, `--color-surface`, `--color-border`, `--color-primary`, etc.).
- Support **three modes** for Matter:
  - `light`
  - `dark`
  - `vibrant` (a more expressive dark mode with louder gradients and accents).
- Keep Tailwind config light and let CSS custom properties do the heavy lifting.

---

## 2. Existing Patterns (Hypernova + TWF)

### 2.1 Shared structure today

Both Hypernova and TWF use a similar styles layout:

- `global.css`
  - `@import "tailwindcss";`
  - Responsive utilities (`monitor-only`, `tablet-only`, etc.).
  - Font-face declarations.
  - Base typography/layout variables (`--font-family-*`, radii, transitions).
  - Some theme plumbing (e.g. `.theme-default[data-mode="dark"]`, `.theme-water[data-mode="dark"]`).
  - A few global design utilities (water headers, spacing helpers, etc.).

- `default-theme.css`
  - Color scales (`--color-primary-*`, `--color-secondary-*`, `--color-accent-*`).
  - Semantic mapping:
    - `--color-background`, `--color-foreground`, `--color-card`, `--color-primary`, `--color-secondary`, `--color-muted`, etc.
  - Dark-mode overrides:
    - `[data-theme="default"][data-mode="dark"] { … }`
    - `.dark { … }` (Tailwind dark class integration).
  - Base typography, buttons, cards, forms, layout utilities.

- `water-theme.css`
  - Alternate palette for primary/secondary/accent.
  - Water-specific typography and spacing tweaks.
  - `[data-theme="water"] { … }` and `[data-theme="water"].dark { … }` overrides.

### 2.2 Hypernova-specific (`nova-theme.css`)

Hypernova adds an extra layer:

- `nova-theme.css` defines **brand-level named colors** and tokens:
  - Named colors like `--yankee-blue`, `--vulcan-blue`, `--lilly-white`, `--nova-cyan`.
  - Then maps these into:
    - `--color-primary-*`, `--color-secondary-*`, `--color-accent-*`.
    - Semantic `--color-background`, `--color-foreground`, etc.
  - Also defines `.theme-hypernova`-scoped styles (buttons, cards, headings).

This gives a three-layer stack:

1. **Brand tokens** (e.g. `--yankee-blue`).
2. **Scales** (`--color-primary-*`, `--color-secondary-*`, `--color-accent-*`).
3. **Semantic tokens** (`--color-background`, `--color-primary`, etc.).

Dark Matter should emulate this layering but simplify and standardize it.

---

## 3. Proposed Folder Structure for Dark Matter

Target project: `dark-matter/src/styles` (conceptual; exact root can be adjusted later).

Suggested minimal structure:

- `src/styles/global.css`
- `src/styles/themes/matter-theme.css`
- `src/styles/themes/matter-vibrant-overrides.css` (optional, if needed)
- `src/styles/tailwind-v4.css` (optional IDE helper)

### 3.1 `src/styles/global.css`

Responsibilities:

- Import Tailwind v4:
  - `@import "tailwindcss";`
- Define **project-agnostic** layout and typography variables:
  - Breakpoints, base fonts, radii, transitions.
- Provide **shared utilities**:
  - Responsive visibility classes.
  - `container`, `section`, and spacing helpers.
  - Type utilities like `line-clamp-*`.
- Include minimal theme plumbing that is **not brand-specific**:
  - Smooth transitions for `html`, `body`, and interactive elements.
  - Global `color-scheme` behavior for `[data-mode="dark"]`.

What it **must not** do:

- Hard-code brand colors for Dark Matter.
- Define `matter`-specific gradients or accents.

### 3.2 `src/styles/themes/matter-theme.css`

This is the **heart** of the Dark Matter theme system.

Responsibilities:

1. **Define brand-level named colors**

   Example tokens (final palette to be tuned via design):

   - `--color-void` – deepest background.
   - `--color-abyss` – dark background (one step up from void).
   - `--color-ink` – primary foreground text color.
   - `--color-lavender` – signature accent.
   - `--color-cobalt` – secondary accent.
   - `--color-rose` – warm expressive accent.
   - `--color-graphite-*` – greys for borders/surfaces.

   These are defined **once** and never duplicated elsewhere.

2. **Derive Tailwind-friendly scales**

   From the brand tokens, expose:

   - `--color-primary-50` … `--color-primary-950` (void → ink gradient).
   - `--color-secondary-50` … `--color-secondary-950` (graphite greys).
   - `--color-accent-50` … `--color-accent-950` (lavender / cobalt / rose families as needed).

   All Tailwind utilities will read from these `--color-*` variables.

3. **Define semantic tokens**

   For `data-theme="matter"` in each mode, define:

   - `--color-background`
   - `--color-foreground`
   - `--color-surface` / `--color-card`
   - `--color-primary`, `--color-primary-foreground`
   - `--color-secondary`, `--color-secondary-foreground`
   - `--color-muted`, `--color-muted-foreground`
   - `--color-accent`, `--color-accent-foreground`
   - `--color-border`, `--color-input`, `--color-ring`

4. **Handle modes: light, dark, vibrant**

   Use the existing pattern from Hypernova/TWF:

   - `[data-theme="matter"][data-mode="light"] { … }`
   - `[data-theme="matter"][data-mode="dark"] { … }`
   - `[data-theme="matter"][data-mode="vibrant"] { … }`

   Guidelines:

   - **Light**:
     - Background slightly lifted from void (easier on the eyes than pure black).
     - Foreground uses ink.
     - Accents slightly restrained; gradients subtle.

   - **Dark**:
     - Background near `--color-void` / `--color-abyss`.
     - Foreground is bright but not pure white.
     - Accents use mid-to-bright steps from lavender/cobalt/rose.

   - **Vibrant**:
     - Background same as dark for consistency.
     - Accents use the brightest accent steps.
     - Additional helpers (e.g. `.bg-matter-vibrant-hero`) use gradient combos of brand tokens.

5. **Expose theme-scoped utilities (optional)**

   If desired, mirror the Hypernova pattern where `.theme-hypernova` scopes some utilities. For Dark Matter, we might have:

   - `.theme-matter .card { … }`
   - `.theme-matter .btn-primary { … }`
   - `.theme-matter .container { … }`

   But these should **only** reference semantic tokens like `--color-background`, not raw hex.

### 3.2.1 Initial Color Values for Matter Theme
From the two Dark Matter SVGs:

Dark-mode trademark SVG
All paths use fill: rgb(156,133,223) → #9C85DF
This is your primary accent in dark mode (lavender‑purple).
Light-mode app icon SVG
All paths use fill: rgb(15,9,35) → #0F0923
This is effectively the primary ink / logo color in light mode (very deep purple‑navy).
Given just these assets, the two core brand colors to elevate into tokens are:

Accent / brand highlight: #9C85DF
Core ink / deep brand color: #0F0923
In the styles blueprint terms, these likely become:

--color-lavender: #9C85DF (accent)
--color-ink or --color-void: #0F0923 (deep brand base)

### 3.3 `src/styles/themes/matter-vibrant-overrides.css` (optional)

Use this file only if `vibrant` needs significantly more expressive visuals than `dark`:

- Additional gradient backgrounds:
  - `.bg-matter-vibrant-hero`
  - `.border-matter-vibrant-highlight`
- Animated accent underlines or outline glows.

Constraints:

- Must **only** reference brand tokens and `--color-*` variables from `matter-theme.css`.
- No new hard-coded hex or duplicated scales.

### 3.4 `src/styles/tailwind-v4.css` (IDE helper)

Similar to what you have today:

- A small file that defines `:root { --color-primary-*; --color-secondary-*; --color-accent-*; }` purely for IDE and linting.
- Not imported by Astro; its purpose is to keep Tailwind/IDE aware of the variables.

---

## 4. Integration with Layouts and Utilities

### 4.1 Layout wiring

Layouts like `BaseThemeLayout.astro` in Dark Matter should:

- Import `../styles/global.css` (which in turn relies on the Matter theme being active).
- Pass a `themeClass` like `"theme-matter"` into the HTML shell component (equivalent to `theme-hypernova` today).
- Ensure that `ThemeSwitcher` sets `data-theme="matter"` on `<html>` and attaches `.theme-matter`.

Pages should:

- Prefer semantic classes like `bg-background`, `text-foreground`, `bg-primary-800`, `text-accent-400` (wired through Tailwind to `--color-*`), **not** raw hex.
- Avoid adding new theme-specific global styles; instead, rely on the theme tokens.

### 4.2 Mode utilities

The existing `ModeSwitcher` can be reused:

- It already manages `data-mode="light" | "dark"` and `.dark` class.
- For `vibrant`, we extend its allowed values and CSS handling:
  - `data-mode="vibrant"`.
  - Tailwind’s `.dark` can still be used for base dark semantics; `vibrant` is an overlay on top of dark in CSS.

Matter CSS will then:

- Treat `[data-theme="matter"][data-mode="vibrant"]` as a variant of the dark palette with different accent mappings.

---

## 5. Benefits of This Architecture

- **Single source of truth** for brand colors and behaviors (Matter lives in `matter-theme.css`).
- **Reduced duplication** compared to Hypernova/TWF where global, default, and water themes each carry overlapping logic.
- **Portability**:
  - New Astro-Knots sites can adopt the same structure: `global.css` + `themes/<brand>-theme.css`.
  - Moving a component between sites requires only:
    - Matching semantic tokens.
    - Ensuring `themeClass` and `data-theme` are set correctly.
- **Mode extensibility**:
  - Clear pattern for `light`, `dark`, `vibrant`, and any future modes.
- **Alignment with your naming preference**:
  - Important brand colors get names like `--color-lavender`, `--color-cobalt`, `--color-rose`.
  - `--color-primary`, `--color-secondary`, etc. become references into those named colors for each theme file, not the other way around.

---

## 6. Next Steps (Implementation-Oriented)

1. **Finalize Matter brand tokens**:
   - Decide actual hex values for `--color-void`, `--color-abyss`, `--color-ink`, `--color-lavender`, `--color-cobalt`, `--color-rose`, and greys.

2. **Create `global.css` for Dark Matter** using the simplified pattern:
   - Import Tailwind v4.
   - Add shared utilities and typography.
   - Do not embed brand-specific color decisions.

3. **Create `themes/matter-theme.css`**:
   - Add named brand colors.
   - Derive scales and semantic tokens.
   - Implement `light`, `dark`, and `vibrant` blocks.

4. **Wire layout + switchers**:
   - Ensure Dark Matter’s `BaseThemeLayout` uses `themeClass="theme-matter"`.
   - Ensure `ThemeSwitcher`/`ModeSwitcher` set `data-theme="matter"` and `data-mode` correctly.

5. **Audit components**:
   - Replace any new hard-coded hex on Dark Matter pages with semantic utilities powered by Matter tokens.

This blueprint can now serve as the canonical reference when we start building out `dark-matter/src/styles` and aligning the index page + components with the Matter theme system.
