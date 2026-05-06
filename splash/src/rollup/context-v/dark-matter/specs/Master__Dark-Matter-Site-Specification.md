---
from: dark-matter
from_path: specs/Master__Dark-Matter-Site-Specification.md
---
<!-- Rolled up from dark-matter/context-v/specs/Master__Dark-Matter-Site-Specification.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

# Dark Matter Site Specification

This document describes the core functionality and architecture of the matter-site (dark-matter) for porting to other Astro-Knots projects.

## Overview

Dark Matter will be a **minimal landing page site** for a venture capital firm. The site is built with:
- **Astro 5.x** (static output mode)
- **Smart use of CSS** to separate custom theme settings from functionality.
- **Tailwind CSS v4** (via @tailwindcss/vite plugin)
- **Dark/Vibrant/Light mode theming** with localStorage persistence. Dark and Light mode are standard, Vibrant mode assumes more color, gradients, animations, etc.
- **Responsive design** with custom breakpoints
- **Dynamic OpenGraph content** per page and even object/section shared.
- **SEO Best Practices** that needs to be planned.
- **Use of Git Modules to bring content from other repositories** for wider collaboration while maintaining the admin and privacy of various repositories.
- **Remark.js** for markdown processing, with some advanced features requiring additional related libraries.
- **Svelte** for more advanced interactivity and server side rendering where necessary.
- **ImageKit** for image processing and delivery where necessary.
- **Reveal.js** for presentation slides viewer.

### Context of Astro-Knots

[Astro-Knots](https://github.com/lossless-group/astro-knots.git) is a collection of sites that are built with Astro, yet each site needs to be managed, collaborated on, and deployed independently. The parent-level monorepo is NOT a functional monorepo, but rather a common repository for sharing code, patterns, and making grabbing components and utilities easier.

### Constraints
1. No use of React, Preact, JSX or TSX as an absolute rule.
2. Consistent use of and updating of documentation for context engineering to enable advanced use of AI Code Assistants such as Claude Code, Windsurf, and others.

## Core Dependencies

```json
{
  "dependencies": {
    "@astrojs/check": "latest",
    "@tailwindcss/typography": "latest",
    "@tailwindcss/vite": "latest",
    "astro": "latest",
    "tailwindcss": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

Optional:
- `masonry-layout` - for portfolio grid layouts
- `vitest` + `@vitest/ui` - for testing

---

## Directory Structure

```
src/
├── components/
│   ├── basics/           # Core UI components
│   │   ├── Header.astro  # Main header with nav, CTA, mode toggle
│   │   ├── Footer.astro  # Footer with logo, social links
│   │   ├── buttons/      # Button variants (Primary, Secondary, Accent)
│   │   ├── chips/        # Tag/chip components
│   │   ├── grids/        # Logo grids, banner rows
│   │   ├── heros/        # Hero section variants
│   │   └── links/        # Link wrappers with animations
│   ├── ui/               # Utility UI components
│   │   ├── ModeToggle.astro           # Dark/light toggle button
│   │   ├── SiteBrandMarkModeWrapper.astro  # Logo with mode switching
│   │   ├── InternalLinkWrapper.astro  # Links with hover animations
│   │   └── SocialIcons.astro          # Social media icons
│   ├── seo/
│   │   └── OpenGraph.astro  # OG meta tags component
│   └── [feature-specific]/  # Events, facts, slides, etc.
├── layouts/
│   ├── BoilerPlateHTML.astro   # Base HTML structure
│   ├── BaseThemeLayout.astro   # Theme wrapper with Header/Footer
│   └── ResponsiveContainer.astro
│   └── sections/             # Reusable sections, generally refactored pages to make them more reusable.
├── pages/
│   ├── index.astro       # Homepage (minimal centered logo + tagline)
│   ├── about/            # About pages
│   ├── portfolio/        # Portfolio with [slug].astro dynamic routes
│   ├── team/             # Team with [slug].astro dynamic routes
│   ├── contact/          # Contact page
│   ├── thoughts/         # Blog with [slug].astro dynamic routes
│   ├── events/           # Events with [slug].astro dynamic routes
│   ├── slides/           # Slides with [slug].astro dynamic routes
│   ├── dataroom/         # Dataroom page with two options:
│   │   ├── index.astro   # Dataroom index page
│   │   └── [slug].astro  # Dataroom item page
│   │   ├── active-pipeline/   
│   │   │   ├── index.astro   # Active Pipeline index page
│   │   │   └── [slug].astro  # Active Pipeline item page
│   │   ├── diligence-materials/   
│   │   │   ├── index.astro   # Diligence Materials index page
│   │   │   └── [slug].astro  # Diligence Materials item page
├── styles/
│   ├── global.css        # Main entry: imports Tailwind + theme
│   └── nova-theme.css    # Theme variables (colors, typography)
├── utils/
│   └── mode-switcher.js  # Dark/light mode handling
└── content/              # Content collections (JSON/MD)
    ├── people/           # Team data
    ├── portfolio/        # Portfolio items
    └── events/           # Event content
```

---

## Theming System

### Theme Class
The site uses `theme-matter` class on `<html>` element combined with `data-mode="dark|light"`.

### CSS Variables (matter-theme.css)

Core color palette:
```css
:root {
  /* Brand Colors */
  --yankee-blue: #1d2340;      /* Primary dark */
  --vulcan-blue: #0d1724;      /* Darker background */
  --madison-blue: #2d3a57;     /* Secondary dark */
  --lilly-white: #EBEBEB;      /* Primary light */
  --nova-cyan: #69e2e3;        /* Accent */
  --hippie-blue: #509cb5;      /* Secondary accent */
}
```

Light/Dark mode switching via CSS variables:
```css
:root {
  --color-background: rgb(235 235 235);  /* lilly-white */
  --color-foreground: rgb(29 35 64);     /* yankee-blue */
  --color-primary: rgb(70 110 200);
  --color-accent: rgb(20 184 166);
  /* ... etc */
}

html[data-mode="light"] {
  --color-background: rgb(29 35 64);     /* yankee-blue */
  --color-foreground: rgb(235 235 235);  /* lilly-white */
  /* ... inverted values */
}

html[data-mode="dark"] {
  --color-background: rgb(29 35 64);     /* yankee-blue */
  --color-foreground: rgb(235 235 235);  /* lilly-white */
  /* ... inverted values */
}

html[data-mode="vibrant"] {
  --color-background: rgb(29 35 64);     /* yankee-blue */
  --color-foreground: rgb(235 235 235);  /* lilly-white */
  /* ... inverted values */
}
```

### Typography

```css
--font-family-primary: 'Inter', -apple-system, system-ui, sans-serif;
--font-family-secondary: 'Arboria', 'ITC Avant Garde Gothic', sans-serif;
--font-family-display: 'Arboria', 'ITC Avant Garde Gothic', 'Montserrat', sans-serif;
--font-family-mono: 'Fira Code', monospace;
```

Custom fonts loaded via `@font-face` in `global.css`:
- ITC Avant Garde Gothic (TTF)
- Arboria (WOFF2)

---

## Mode Switching Implementation

### 1. Early initialization (BoilerPlateHTML.astro)
Prevents FOUC by setting `data-mode` attribute immediately:
```html
<script is:inline>
  (function() {
    const savedMode = localStorage.getItem('mode');
    const mode = savedMode || 'dark';  // Default to dark
    document.documentElement.setAttribute('data-mode', mode);
    if (mode === 'dark') document.documentElement.classList.add('dark');
  })();
</script>
```

### 2. Mode Switcher Utility (src/utils/mode-switcher.js)
```javascript
export class ModeSwitcher {
  getStoredMode()     // Get from localStorage
  getSystemPreference() // Always returns 'dark' (default)
  applyMode(mode)     // Sets data-mode attribute + .dark class
  toggleMode()        // Switches between light/dark
  storeMode(mode)     // Saves to localStorage
}
```

Global instance: `window.modeSwitcher`

### 3. Toggle Button (ModeToggle.astro)
- Sun icon (visible in dark mode) -> click switches to light
- Star icon (visible in light mode) -> click switches to vibrant
- Moon icon (visible in vibrant mode) -> click switches to dark
- Uses `[data-theme-toggle]` selector

### 4. Logo Switching (SiteBrandMarkModeWrapper.astro)
Renders both logo variants, CSS hides one based on mode:
```html
<img src="/trademarks/trademark__Brand--Light-Mode.svg" class="light-logo" />
<img src="/trademarks/trademark__Brand--Dark-Mode.svg" class="dark-logo" />
```

---

## Layout Hierarchy

```
BoilerPlateHTML.astro
  └── OpenGraph meta tags
  └── Font loading (Google Fonts + custom @font-face)
  └── Early mode initialization script
  └── <slot /> (page content)
  └── Mode switcher module import

BaseThemeLayout.astro
  └── Imports BoilerPlateHTML
  └── Imports global.css (Tailwind + theme)
  └── Header component
  └── <main> with <slot />
  └── Footer component
```

---

## Header Component

Props:
```typescript
interface Props {
  siteTitle?: string;
  navItems?: Array<{ text: string; href: string; isActive?: boolean }>;
  cta?: { text: string; href: string; variant?: 'primary' | 'secondary' | 'outline' };
}
```

Features:
- Sticky positioning
- Desktop nav with animated link underlines
- CTA button with variants
- Mode toggle button
- Mobile hamburger menu with slide animation
- **Special behavior**: On homepage, logo animates from center of page to header on scroll

---

## Footer Component

Props:
```typescript
interface Props {
  siteTitle?: string;
  logo?: { src: string; alt: string; width?: number; height?: number };
  description?: string;
  links?: Array<{ title: string; items: Array<{ text: string; href: string }> }>;
  socialLinks?: SocialLink[];
  copyright?: string;
}
```

---

## Responsive Breakpoints

Custom breakpoints defined in global.css:
```css
--breakpoint-monitor: 1536px;
--breakpoint-laptop: 1024px;
--breakpoint-tablet: 768px;
--breakpoint-mobile-xl: 640px;
--breakpoint-mobile-base: 480px;
--breakpoint-mobile-sm: 360px;
```

Utility classes:
- `.monitor-only` - visible >= 1536px
- `.laptop-only` - visible 1024-1535px
- `.tablet-only` - visible 768-1023px
- `.mobile-only` - visible < 768px

---

## Public Assets

```
public/
├── fonts/
│   ├── arboria/           # Arboria font family (WOFF2)
│   └── itc-avant-garde-gothic/  # ITC Avant Garde (TTF)
├── trademarks/
│   ├── trademark__Brand--Dark-Mode.svg
│   ├── trademark__Brand--Light-Mode.svg
│   └── appIcon__Brand.png
├── share-banners/         # OG/social share images
├── headshots/             # Team photos
├── icons/                 # SVG icons
└── images/                # General images
```

---

## Astro Configuration

```javascript
// astro.config.mjs
export default defineConfig({
  site: 'https://example.com',
  base: '/',
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@layouts': './src/layouts',
        '@components': './src/components',
        '@content': './src/content',
        '@sections': './src/layouts/sections'
      }
    }
  }
});
```

---

## Pages to Implement (Minimal Core)

For porting, the essential pages are:

1. **`/` (index.astro)** - Homepage with centered logo + tagline
2. **`/about/`** - About page with company information
3. **`/portfolio/`** - Portfolio listing
4. **`/portfolio/[slug].astro`** - Individual portfolio items

Optional sections from this site:
- `/team/` - Team page
- `/events/` - Events listing
- `/slides/` - Presentation slides viewer
- `/design-system/` - Component library showcase

---

## Porting Checklist

### Required Files to Copy/Adapt:

1. **Layout System**
   - [ ] `src/layouts/BoilerPlateHTML.astro`
   - [ ] `src/layouts/BaseThemeLayout.astro`
   - [ ] `src/layouts/ResponsiveContainer.astro`

2. **Core Components**
   - [ ] `src/components/basics/Header.astro`
   - [ ] `src/components/basics/Footer.astro`
   - [ ] `src/components/ui/ModeToggle.astro`
   - [ ] `src/components/ui/SiteBrandMarkModeWrapper.astro`
   - [ ] `src/components/ui/InternalLinkWrapper.astro`
   - [ ] `src/components/seo/OpenGraph.astro`

3. **Styles**
   - [ ] `src/styles/global.css`
   - [ ] `src/styles/matter-theme.css` (rename and customize colors)

4. **Utilities**
   - [ ] `src/utils/mode-switcher.js`

5. **Configuration**
   - [ ] `astro.config.mjs`
   - [ ] `package.json` dependencies

6. **Assets**
   - [ ] Create brand logos (light + dark variants)
   - [ ] Create app icon
   - [ ] Create OG share banner

### Customization Points:

1. **Theme Colors**: Edit `src/styles/matter-theme.css` to change:
   - Primary colors (background/foreground)
   - Accent colors
   - Custom gradients
   - Typography

2. **Navigation**: Edit Header.astro defaults:
   - `navItems` array
   - `cta` button text/link

3. **Footer**: Edit Footer.astro defaults:
   - `links` array
   - `socialLinks` array
   - Copyright text

4. **Branding**: Update SiteBrandMarkModeWrapper.astro:
   - Logo paths
   - Alt text

5. **Meta/SEO**: Update BoilerPlateHTML.astro and page layouts:
   - Default titles
   - Descriptions
   - Site URL
   - OG images

---

## Key Patterns

### Tailwind v4 Integration
Uses `@tailwindcss/vite` plugin instead of PostCSS:
```javascript
import tailwindcss from '@tailwindcss/vite';
// In vite.plugins: [tailwindcss()]
```

Global CSS imports Tailwind:
```css
@import "tailwindcss";
@import "./matter-theme.css";
```

### Dark Mode CSS Pattern
Always use both selectors for compatibility:
```css
html[data-mode="dark"] .element,
html.dark .element {
  /* dark styles */
}
```

### Component Props Pattern
All components use TypeScript interfaces for props with sensible defaults:
```typescript
interface Props {
  variant?: 'primary' | 'secondary';
  class?: string;
  className?: string; // Backward compatibility
}

const { variant = 'primary', class: className = '' } = Astro.props;
```
