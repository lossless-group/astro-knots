---
title: "Multi-Site Astro Starter Kit Architecture"
description: "Exploration of building a comprehensive Astro starter kit optimized for rapid deployment of multiple marketing sites with environment-driven customization"
tags: [Astro, Component-Based-Architecture, Tailwind, Svelte, Theming]

status: "Implementation"
date_created: 2025-10-01
date_modified: 2025-10-17
site_uuid: 911f92b4-02f3-44a5-a7f3-6fecb5afd616
hex_code: l8t4re
publish: true
slug: multi-site-astro-starter-kit-architecture
at_semantic_version: 0.0.1.1
image_prompt: "A boy scout has a tent kit, where he puts it down and the tent pops out and up."
banner_image: "https://ik.imagekit.io/xvpgfijuw/uploads/lossless/2025-sept/Multi-Site-Astro-Starter-Kit-Architecture_banner_image_1760733523909_Qhc9_EkP0.webp"
portrait_image: "https://ik.imagekit.io/xvpgfijuw/uploads/lossless/2025-sept/Multi-Site-Astro-Starter-Kit-Architecture_portrait_image_1760733525401_TqcQXtvkh.webp"
square_image: "https://ik.imagekit.io/xvpgfijuw/uploads/lossless/2025-sept/Multi-Site-Astro-Starter-Kit-Architecture_square_image_1760733526454_ZP2T8-fNY.webp"
authors:
  - Michael Staton
type: Explorations
---




# Multi-Site Astro Starter Kit Architecture

## Context & Requirements

Our consulting firm needs to rapidly deploy multiple marketing sites with minimal configuration overhead. The goal is to create a starter kit where changing environment variables automatically updates logos, colors, images, icons, and overall branding.

### Core Requirements
- **Framework**: Astro + Svelte for interactivity
- **Styling**: Tailwind CSS optimized
- **Theming**: Three modes (dark, light, vibrant) - one more than typical
- **Configuration**: Environment variable driven
- **Speed**: Near-instant deployment with minimal customization
- **Standalone Deployments vs True Monorepo**: Decide between deploying each site as a standalone project or maintaining a single true monorepo for all sites.

#### Decisions to Make
- **Standalone Deployments**: Each site is deployed as a separate project, with shared components and utilities not truly shared between sites, more like rapidly cloned from one site to the next with environment-driven configuration.  
  - Example, 
    1. The Water Foundation site and The Lossless Group Site are two separate sites now.  We are tasked with building a Parslee site (client: Parslee) and a Hypernova site (client: Hypernova) in the same week of work.  
    2. The Parslee site likely will be handed off to the Parslee team after the week of work is complete, therefore environment-driven configuration needs to make some sense to the Parslee team, not just in the context of The Lossless Group four-site development.  
    3. While having shared component libraries and utilities is a benefit, it also means that different teams will impact one another on an ongoing basis, which is not desired.
    4. Given some baseline configuration and documentation standards, The Lossless Group or any client should be able to just "port" any change on any site by asking an AI Code Assistant to replicate the functionality from one inspiration to the next.
- **True Monorepo**: All sites are maintained in a single repository, with environment-driven configuration.

### OR, True Monorepo as a `pnpm workspace`:

### Monorepo Approach

- Use pnpm workspaces for package isolation and fast local linking.
- Keep astro-knots as your shared components/design system repo and consume it from site repos (including the submodule case).
- Aim for `semver` (Semantic Versioning) versioning with `Changesets` to avoid tight coupling while enabling controlled upgrades.

### Workspace Layout

- astro-knots/packages
  - `@knots/tokens : cross‑framework design tokens (CSS vars, JSON, TypeScript types).
  - @knots/icons : shared icon set and utilities.
  - @knots/astro : base Astro components (islands and pages wrappers).
  - @knots/svelte : base Svelte components (pure UI, framework‑agnostic styling).
  - @knots/brand-config : brand theme configs (colors, typography, spacing, logo paths).
- astro-knots/sites (optional for internal demos)
  - water-foundation , hypernova , etc., each consuming the packages.
  
### Variant Strategy

- Prefer composition over inheritance: base components expose variant points (props or slots) and accept a brand config.
- Keep variants as file overrides:
	- @knots/astro/components/Button/variants/<brand>/Button.astro
	- @knots/svelte/components/Button/variants/<brand>/Button.svelte
- Resolve variants via Vite aliases per site:
  - In each site’s astro.config.mjs , set resolve.alias to map brand paths to variant folders.
  - Fallback to default variant when a brand override is missing.
### Astro Config Example

- astro.config.mjs :
  - resolve.alias : { '@knots/brand': '@knots/brand-config/water', '@knots/button': '@knots/astro/components/Button/variants/water' }
  - Keep default alias pointing to base component if brand variant isn’t present.
### Consumption Patterns

- Astro wraps Svelte components with client:only='svelte' or normal islands when interactivity is needed.
- Export base props from Svelte components and mirror them in Astro wrappers for consistent API.
- Sites import @knots/tokens CSS variables globally and pass brand to components where relevant.
### Versioning & Releases

- Use Changesets across astro-knots/packages for release notes and semver.
- Sites depend on published versions (e.g., ^1.3.0 ) to remain loosely coupled.
- During development, sites use pnpm link or workspace references for rapid iteration.
### Workflow for the Web Design Team

- Provide a scaffolder script (e.g., scripts/new-variant.mjs ) that:
  - Copies base component into variants/<brand> and wires alias stubs.
  - Generates a Storybook story for snapshot testing and design review.
- Run Storybook at the package level ( @knots/astro and @knots/svelte ) so designers can iterate without a full site.
- Document token usage, variant naming conventions, and example overrides.
### Storybook Setup

- Add shared Storybook config with framework targets for Astro (stories for wrappers) and Svelte (native stories), using brand decorators to switch themes.
### Cross‑Site Management

- Keep astro-knots self‑contained; site repos pull packages via npm registry or Git tags.
- If a site needs a one‑off override, add a local alias pointing to a site/overrides folder while still defaulting to shared packages.
### Immediate Next Steps

- Create astro-knots/packages and seed @knots/tokens , @knots/astro , @knots/svelte with minimal scaffolds.
- Add pnpm-workspace.yaml entries for packages/* and configure Changesets.
- In hypernova-site (and future sites), add brand aliases in astro.config.mjs and start with one component (Button) to validate the variant flow.
This structure keeps the monorepo loosely coupled, gives designers a clean path to create variants, and ensures each site can adopt or defer updates on its own schedule.

## Current Architecture Analysis

Based on the existing <mcfolder name="site" path="/Users/mpstaton/code/lossless-monorepo/site"></mcfolder> structure, you already have:

### Strengths to Leverage
1. **Robust Environment System**: <mcfile name="envUtils.js" path="/Users/mpstaton/code/lossless-monorepo/site/src/utils/envUtils.js"></mcfile> with deployment environment handling
2. **Component Architecture**: Well-organized component library in <mcfolder name="components" path="/Users/mpstaton/code/lossless-monorepo/site/src/components"></mcfolder>
3. **Theming Foundation**: CSS custom properties in <mcfile name="global.css" path="/Users/mpstaton/code/lossless-monorepo/site/src/styles/global.css"></mcfile>
4. **Content Collections**: Structured content system
5. **Asset Management**: Organized public assets with brand variations

### Existing Patterns to Extend
- Environment-driven content paths
- Modular component structure
- Constant maintenance of `living documentation` for workflow management, and value preservation throughout development.
- Constant maintenance of `design system` visualizations, both in our own code and in Storybook.
- Heavy use of `Git Submodules` and `GitHub Repositories`for both shared resources but also permissioning access and client handoffs.
- CSS custom property theming
- Balancing using Tailwind optimally, customizing it properly, and developing CSS utilities for brand-specific needs.
- Astro + Svelte integration
- Avoid using React patterns, as they tend to be not supported by Astro and Svelte. 

## Proposed Starter Kit Architecture

### 1. Environment-Driven Configuration System

```typescript
// src/config/site.config.ts
export interface SiteConfig {
  brand: {
    name: string;
    zinger: string;
    logo: {
      light: string;
      dark: string;
      vibrant: string;
    };
    favicon: string;
    colors: ThemeColors;
  };
  contact: {
    email: string;
    phone?: string;
    address?: string;
  };
  social: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  features: {
    newsletter: boolean;
    blog: boolean;
    changelog: boolean;
    portfolio: boolean;
    testimonials: boolean;
  };
}
```

### 2. Three-Mode Theme System

#### Theme Structure
```css
/* themes/base.css */
:root {
  /* Semantic color tokens */
  --color-primary: var(--theme-primary);
  --color-secondary: var(--theme-secondary);
  --color-accent: var(--theme-accent);
  --color-background: var(--theme-background);
  --color-surface: var(--theme-surface);
  --color-text: var(--theme-text);
  --color-text-muted: var(--theme-text-muted);
}

/* themes/light.css */
[data-theme="light"] {
  --theme-primary: #2563eb;
  --theme-secondary: #64748b;
  --theme-accent: #06b6d4;
  --theme-background: #ffffff;
  --theme-surface: #f8fafc;
  --theme-text: #1e293b;
  --theme-text-muted: #64748b;
}

/* themes/dark.css */
[data-theme="dark"] {
  --theme-primary: #3b82f6;
  --theme-secondary: #94a3b8;
  --theme-accent: #22d3ee;
  --theme-background: #0f172a;
  --theme-surface: #1e293b;
  --theme-text: #f1f5f9;
  --theme-text-muted: #94a3b8;
}

/* themes/vibrant.css */
[data-theme="vibrant"] {
  --theme-primary: #ec4899;
  --theme-secondary: #8b5cf6;
  --theme-accent: #06b6d4;
  --theme-background: #0c0a09;
  --theme-surface: #1c1917;
  --theme-text: #fafaf9;
  --theme-text-muted: #a8a29e;
}
```

#### Environment Variable Mapping
```bash
# .env.example
SITE_NAME="Your Company"
SITE_TAGLINE="Your tagline here"
SITE_THEME="light" # light | dark | vibrant

# Spectrum Colors (Single color with 50-950 scale)
SITE_PRIMARY_SPECTRUM="#2563eb"     # Generates primary-50 through primary-950
SITE_SECONDARY_SPECTRUM="#06b6d4"   # Generates secondary-50 through secondary-950
SITE_ACCENT_SPECTRUM="#f59e0b"      # Generates accent-50 through accent-950

# Gradient Colors (Two colors with transition steps)
SITE_HERO_GRADIENT_FROM="#2563eb"
SITE_HERO_GRADIENT_TO="#06b6d4"
SITE_CTA_GRADIENT_FROM="#f59e0b"
SITE_CTA_GRADIENT_TO="#ef4444"

# Brand Assets
SITE_LOGO_LIGHT="/logos/logo-light.svg"
SITE_LOGO_DARK="/logos/logo-dark.svg"
SITE_LOGO_VIBRANT="/logos/logo-vibrant.svg"
SITE_FAVICON="/favicon.svg"

# Advanced Color Customization
SITE_NEUTRAL_SPECTRUM="#6b7280"     # For grays, text colors
SITE_SUCCESS_SPECTRUM="#10b981"     # For success states
SITE_WARNING_SPECTRUM="#f59e0b"     # For warning states
SITE_ERROR_SPECTRUM="#ef4444"       # For error states
```

### 3. Component Library Structure

```
src/components/
├── core/                    # Core reusable components
│   ├── Button.astro
│   ├── Card.astro
│   ├── Hero.astro
│   ├── Navigation.astro
│   └── Footer.astro
├── sections/               # Page sections
│   ├── HeroSection.astro
│   ├── FeaturesSection.astro
│   ├── TestimonialsSection.astro
│   ├── CTASection.astro
│   └── ContactSection.astro
├── layout/                 # Layout components
│   ├── BaseLayout.astro
│   ├── PageLayout.astro
│   └── BlogLayout.astro
├── interactive/            # Svelte components
│   ├── ThemeToggle.svelte
│   ├── ContactForm.svelte
│   └── Newsletter.svelte
└── brand/                  # Brand-specific components
    ├── Logo.astro
    ├── BrandColors.astro
    └── Favicon.astro
```

### 4. Asset Organization Strategy

```
public/
├── brands/
│   ├── client-a/
│   │   ├── logos/
│   │   ├── images/
│   │   └── icons/
│   ├── client-b/
│   │   ├── logos/
│   │   ├── images/
│   │   └── icons/
│   └── default/
│       ├── logos/
│       ├── images/
│       └── icons/
└── shared/
    ├── fonts/
    └── icons/
```

### 5. Configuration-Driven Content

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const pagesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    template: z.enum(['landing', 'about', 'services', 'contact']),
    sections: z.array(z.string()).optional(),
    seo: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      image: z.string().optional(),
    }).optional(),
  }),
});

export const collections = {
  pages: pagesCollection,
};
```

## Implementation Strategy

### Phase 1: Foundation Setup
1. **Environment Configuration System**
   - Extend existing envUtils.js for multi-site support
   - Create site.config.ts with TypeScript interfaces
   - Build environment variable validation

2. **Theme System Implementation**
   - Create three-mode CSS custom property system
   - Build theme toggle component (Svelte)
   - Implement automatic theme detection

3. **Asset Management**
   - Create brand-specific asset organization
   - Build dynamic asset loading based on environment
   - Implement fallback asset system

### Phase 2: Component Library
1. **Core Components**
   - Refactor existing components for configurability
   - Create brand-aware Logo component
   - Build responsive navigation system

2. **Section Templates**
   - Create modular page sections
   - Implement configuration-driven section rendering
   - Build section composition system

3. **Interactive Elements**
   - Port key interactive components to Svelte
   - Create theme-aware form components
   - Build newsletter integration

### Phase 3: Content & Page System
1. **Page Templates**
   - Create configurable page layouts
   - Build section-based page composition
   - Implement SEO optimization system

2. **Content Collections**
   - Design flexible content schema
   - Create content management utilities
   - Build content validation system

### Phase 4: Deployment & Automation
1. **Build System**
   - Create multi-site build configuration
   - Implement asset optimization
   - Build deployment automation

2. **Development Tools**
   - Create site configuration CLI
   - Build asset generation tools
   - Implement development preview system

## Color System Architecture

### **Spectrum Colors (50-950 Scale)**
A spectrum takes a single base color and generates a complete scale from very light (50) to very dark (950), following Tailwind's color scale convention:

```typescript
// Example: SITE_PRIMARY_SPECTRUM="#2563eb" generates:
{
  'primary-50': '#eff6ff',   // Very light
  'primary-100': '#dbeafe',  // Light
  'primary-200': '#bfdbfe',  // Lighter
  'primary-300': '#93c5fd',  // Light medium
  'primary-400': '#60a5fa',  // Medium light
  'primary-500': '#3b82f6',  // Medium (close to base)
  'primary-600': '#2563eb',  // Base color
  'primary-700': '#1d4ed8',  // Medium dark
  'primary-800': '#1e40af',  // Dark
  'primary-900': '#1e3a8a',  // Darker
  'primary-950': '#172554'   // Very dark
}
```

### **Gradient Colors (Two-Color Transitions)**
Gradients define smooth transitions between two colors with configurable steps:

```typescript
// Example: SITE_HERO_GRADIENT_FROM="#2563eb" TO="#06b6d4" generates:
{
  'hero-gradient-0': '#2563eb',   // Start color
  'hero-gradient-25': '#1e5bc7',  // 25% transition
  'hero-gradient-50': '#1653a3',  // 50% transition
  'hero-gradient-75': '#0e4b7f',  // 75% transition
  'hero-gradient-100': '#06b6d4'  // End color
}
```

#### **Usage Examples**

**Spectrum Colors in Components:**
```html
<!-- Button with spectrum variations -->
<button class="bg-primary-600 hover:bg-primary-700 text-primary-50">
  Primary Action
</button>

<!-- Card with subtle background -->
<div class="bg-neutral-50 border border-neutral-200 text-neutral-900">
  <h3 class="text-neutral-800">Card Title</h3>
  <p class="text-neutral-600">Card description</p>
</div>

<!-- Status indicators -->
<span class="bg-success-100 text-success-800 border border-success-200">
  Success
</span>
<span class="bg-warning-100 text-warning-800 border border-warning-200">
  Warning
</span>
```

**Gradient Colors in CSS:**
```css
/* Hero section with gradient background */
.hero-section {
  background: linear-gradient(
    135deg,
    var(--hero-gradient-0) 0%,
    var(--hero-gradient-25) 25%,
    var(--hero-gradient-50) 50%,
    var(--hero-gradient-75) 75%,
    var(--hero-gradient-100) 100%
  );
}

/* CTA button with gradient */
.cta-button {
  background: linear-gradient(
    90deg,
    var(--cta-gradient-0),
    var(--cta-gradient-100)
  );
}
```

## Technical Considerations

### Performance Optimization
- **Asset Bundling**: Environment-specific asset bundles
- **CSS Optimization**: Purge unused styles per theme
- **Image Optimization**: Responsive images with brand variants
- **Code Splitting**: Load only necessary interactive components

### Maintainability
- **Type Safety**: Full TypeScript coverage for configurations
- **Component Documentation**: Storybook or similar for component library
- **Testing Strategy**: Unit tests for configuration logic, visual regression tests for themes
- **Version Management**: Semantic versioning for starter kit releases

### Scalability
- **Plugin Architecture**: Extensible component and feature system
- **Theme Inheritance**: Base themes with brand-specific overrides
- **Content Flexibility**: Support for custom content types
- **Integration Points**: Easy third-party service integration

## Migration Path from Current Setup

### Immediate Steps
1. **Extract Reusable Patterns**: Identify components from current site that can be generalized
2. **Environment Abstraction**: Extend current envUtils for multi-site support
3. **Theme Extraction**: Convert current CSS custom properties to configurable system
4. **Asset Audit**: Catalog current assets and create organization strategy

### Gradual Implementation
1. **Parallel Development**: Build starter kit alongside current site
2. **Component Migration**: Gradually move components to starter kit
3. **Testing Ground**: Use one of the two new sites as testing ground
4. **Refinement**: Iterate based on real-world usage

## Success Metrics

### Development Speed
- **Setup Time**: < 30 minutes from clone to deployed site
- **Customization Time**: < 2 hours for complete brand customization
- **Feature Addition**: < 1 day for new section/component

### Code Quality
- **Reusability**: 80%+ component reuse across sites
- **Maintainability**: Single source of truth for shared functionality
- **Performance**: Lighthouse scores > 90 across all metrics

### Business Impact
- **Client Satisfaction**: Faster delivery times
- **Team Efficiency**: Reduced repetitive work
- **Scalability**: Easy onboarding of new sites

## Next Steps

1. **Validate Approach**: Review this exploration with team
2. **Create Prototype**: Build minimal viable starter kit
3. **Test with Real Project**: Use one of the two new sites as pilot
4. **Iterate and Refine**: Based on real-world usage
5. **Document and Scale**: Create comprehensive documentation and onboarding

This architecture leverages your existing Astro expertise while providing the flexibility and speed needed for rapid multi-site deployment. The three-mode theme system and environment-driven configuration will significantly reduce the time from project start to deployment.

## Technical Appendix: Three-Mode Theme System Implementation

### Theme System Architecture

The three-mode theme system builds on your existing CSS custom property foundation but extends it with:

1. **Semantic Color Tokens**: Abstract color meanings from specific values
2. **Environment Integration**: Theme selection via environment variables
3. **Runtime Switching**: Dynamic theme changes without page reload
4. **Brand Customization**: Per-client color overrides

### Detailed Theme Implementation

#### 1. Theme Configuration Interface

```typescript
// src/types/theme.ts
export interface ThemeColors {
  primary: {
    50: string;
    100: string;
    500: string;
    600: string;
    900: string;
  };
  secondary: {
    50: string;
    500: string;
    900: string;
  };
  accent: {
    50: string;
    500: string;
    900: string;
  };
  neutral: {
    50: string;
    100: string;
    200: string;
    500: string;
    800: string;
    900: string;
  };
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

export interface ThemeConfig {
  name: 'light' | 'dark' | 'vibrant';
  colors: ThemeColors;
  typography: {
    fontFamily: {
      sans: string[];
      serif: string[];
      mono: string[];
    };
    fontSize: Record<string, [string, string]>;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
}
```

#### 2. Environment-Driven Theme Loading

```typescript
// src/utils/themeUtils.ts
import { SITE_THEME, SITE_PRIMARY_COLOR, SITE_ACCENT_COLOR } from './envUtils.js';

export function getThemeConfig(): ThemeConfig {
  const theme = SITE_THEME || 'light';
  
  // Spectrum Colors
  const primarySpectrum = import.meta.env.SITE_PRIMARY_SPECTRUM || '#2563eb';
  const secondarySpectrum = import.meta.env.SITE_SECONDARY_SPECTRUM || '#06b6d4';
  const accentSpectrum = import.meta.env.SITE_ACCENT_SPECTRUM || '#f59e0b';
  const neutralSpectrum = import.meta.env.SITE_NEUTRAL_SPECTRUM || '#6b7280';
  
  // Gradient Colors
  const heroGradientFrom = import.meta.env.SITE_HERO_GRADIENT_FROM || '#2563eb';
  const heroGradientTo = import.meta.env.SITE_HERO_GRADIENT_TO || '#06b6d4';
  const ctaGradientFrom = import.meta.env.SITE_CTA_GRADIENT_FROM || '#f59e0b';
  const ctaGradientTo = import.meta.env.SITE_CTA_GRADIENT_TO || '#ef4444';

  const baseTheme = getBaseTheme(theme);
  
  // Override with environment-specific spectrum colors
  baseTheme.colors.primary = generateColorSpectrum(primarySpectrum);
  baseTheme.colors.secondary = generateColorSpectrum(secondarySpectrum);
  baseTheme.colors.accent = generateColorSpectrum(accentSpectrum);
  baseTheme.colors.neutral = generateColorSpectrum(neutralSpectrum);
  
  // Add semantic colors
  baseTheme.colors.semantic = {
    success: generateColorSpectrum(import.meta.env.SITE_SUCCESS_SPECTRUM || '#10b981'),
    warning: generateColorSpectrum(import.meta.env.SITE_WARNING_SPECTRUM || '#f59e0b'),
    error: generateColorSpectrum(import.meta.env.SITE_ERROR_SPECTRUM || '#ef4444'),
    info: generateColorSpectrum(import.meta.env.SITE_INFO_SPECTRUM || '#06b6d4')
  };
  
  // Add gradient colors
  baseTheme.colors.gradients = {
    hero: generateColorGradient(heroGradientFrom, heroGradientTo),
    cta: generateColorGradient(ctaGradientFrom, ctaGradientTo)
  };
  
  return baseTheme;
}

function generateColorScale(baseColor: string): ThemeColors['primary'] {
  // Generate color scale from single base color
  // Using color manipulation library like chroma-js or custom logic
  return {
    50: lighten(baseColor, 0.4),
    100: lighten(baseColor, 0.3),
    500: baseColor,
    600: darken(baseColor, 0.1),
    900: darken(baseColor, 0.4),
  };
}

export function generateColorSpectrum(baseColor: string): Record<string, string> {
  // Generate full 50-950 color spectrum from single base color
  const spectrum = {
    50: lighten(baseColor, 0.45),
    100: lighten(baseColor, 0.35),
    200: lighten(baseColor, 0.25),
    300: lighten(baseColor, 0.15),
    400: lighten(baseColor, 0.05),
    500: baseColor,
    600: darken(baseColor, 0.1),
    700: darken(baseColor, 0.2),
    800: darken(baseColor, 0.3),
    900: darken(baseColor, 0.4),
    950: darken(baseColor, 0.5),
  };
  return spectrum;
}

export function generateColorGradient(fromColor: string, toColor: string, steps: number = 5): Record<string, string> {
  // Generate gradient steps between two colors
  const gradient: Record<string, string> = {};
  
  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);
    const stepKey = Math.round(ratio * 100);
    gradient[stepKey.toString()] = interpolateColor(fromColor, toColor, ratio);
  }
  
  return gradient;
}

function lighten(color: string, amount: number): string {
  // Color lightening utility - implement with color manipulation library
  // This is a placeholder implementation
  return color;
}

function darken(color: string, amount: number): string {
  // Color darkening utility - implement with color manipulation library
  // This is a placeholder implementation
  return color;
}

function interpolateColor(color1: string, color2: string, ratio: number): string {
  // Color interpolation utility - implement with color manipulation library
  // This is a placeholder implementation
  return ratio < 0.5 ? color1 : color2;
}
```

#### 3. CSS Custom Property Generation

```typescript
// src/utils/cssGenerator.ts
export function generateThemeCSS(theme: ThemeConfig): string {
  const cssVars = Object.entries(theme.colors).flatMap(([category, colors]) => {
    if (typeof colors === 'object' && colors !== null) {
      return Object.entries(colors).map(([shade, value]) => 
        `--color-${category}-${shade}: ${value};`
      );
    }
    return [`--color-${category}: ${colors};`];
  });

  return `
    [data-theme="${theme.name}"] {
      ${cssVars.join('\n      ')}
      
      /* Semantic mappings */
      --color-background: var(--color-neutral-50);
      --color-surface: var(--color-neutral-100);
      --color-text: var(--color-neutral-900);
      --color-text-muted: var(--color-neutral-500);
      --color-border: var(--color-neutral-200);
      
      /* Component-specific mappings */
      --button-primary-bg: var(--color-primary-500);
      --button-primary-text: var(--color-neutral-50);
      --button-primary-hover: var(--color-primary-600);
      
      --card-bg: var(--color-surface);
      --card-border: var(--color-border);
      --card-shadow: var(--shadow-md);
    }
  `;
}
```

#### 4. Tailwind Integration

```javascript
// tailwind.config.mjs
import { getThemeConfig } from './src/utils/themeUtils.js';

const themeConfig = getThemeConfig();

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          900: 'var(--color-primary-900)',
        },
        secondary: {
          50: 'var(--color-secondary-50)',
          500: 'var(--color-secondary-500)',
          900: 'var(--color-secondary-900)',
        },
        accent: {
          50: 'var(--color-accent-50)',
          500: 'var(--color-accent-500)',
          900: 'var(--color-accent-900)',
        },
        // Semantic colors
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'text-primary': 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
      },
      fontFamily: themeConfig.typography.fontFamily,
      fontSize: themeConfig.typography.fontSize,
    },
  },
  plugins: [],
};
```

#### 5. Theme Toggle Component (Svelte)

```svelte
<!-- src/components/interactive/ThemeToggle.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  
  type Theme = 'light' | 'dark' | 'vibrant';
  
  let currentTheme: Theme = 'light';
  let mounted = false;
  
  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'vibrant', label: 'Vibrant', icon: '✨' },
  ];
  
  onMount(() => {
    // Get initial theme from localStorage or environment default
    const stored = localStorage.getItem('theme') as Theme;
    const envDefault = import.meta.env.SITE_THEME as Theme || 'light';
    currentTheme = stored || envDefault;
    
    applyTheme(currentTheme);
    mounted = true;
  });
  
  function applyTheme(theme: Theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    currentTheme = theme;
  }
  
  function cycleTheme() {
    const currentIndex = themes.findIndex(t => t.value === currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    applyTheme(themes[nextIndex].value);
  }
</script>

{#if mounted}
  <button
    on:click={cycleTheme}
    class="theme-toggle"
    aria-label="Toggle theme"
    title={`Current: ${themes.find(t => t.value === currentTheme)?.label}`}
  >
    <span class="theme-icon">
      {themes.find(t => t.value === currentTheme)?.icon}
    </span>
    <span class="theme-label sr-only">
      {themes.find(t => t.value === currentTheme)?.label}
    </span>
  </button>
{/if}

<style>
  .theme-toggle {
    @apply p-2 rounded-lg bg-surface border border-neutral-200 hover:bg-neutral-100 transition-colors;
  }
  
  .theme-icon {
    @apply text-lg;
  }
  
  .sr-only {
    @apply absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0;
    clip: rect(0, 0, 0, 0);
  }
</style>
```

#### 6. Brand-Aware Logo Component

```astro
---
// src/components/brand/Logo.astro
import { SITE_LOGO_LIGHT, SITE_LOGO_DARK, SITE_LOGO_VIBRANT, SITE_NAME } from '../../utils/envUtils.js';

export interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'vibrant' | 'auto';
  class?: string;
}

const { size = 'md', variant = 'auto', class: className = '' } = Astro.props;

const sizeClasses = {
  sm: 'h-6',
  md: 'h-8',
  lg: 'h-12',
  xl: 'h-16',
};

const logos = {
  light: SITE_LOGO_LIGHT,
  dark: SITE_LOGO_DARK,
  vibrant: SITE_LOGO_VIBRANT,
};
---

<div class={`logo-container ${sizeClasses[size]} ${className}`}>
  {variant === 'auto' ? (
    <>
      <img 
        src={logos.light} 
        alt={SITE_NAME}
        class="logo logo-light"
        loading="eager"
      />
      <img 
        src={logos.dark} 
        alt={SITE_NAME}
        class="logo logo-dark"
        loading="eager"
      />
      <img 
        src={logos.vibrant} 
        alt={SITE_NAME}
        class="logo logo-vibrant"
        loading="eager"
      />
    </>
  ) : (
    <img 
      src={logos[variant]} 
      alt={SITE_NAME}
      class="logo"
      loading="eager"
    />
  )}
</div>

<style>
  .logo-container {
    @apply relative inline-block;
  }
  
  .logo {
    @apply h-full w-auto object-contain;
  }
  
  /* Auto variant theme switching */
  [data-theme="light"] .logo-light,
  [data-theme="dark"] .logo-dark,
  [data-theme="vibrant"] .logo-vibrant {
    @apply block;
  }
  
  [data-theme="light"] .logo-dark,
  [data-theme="light"] .logo-vibrant,
  [data-theme="dark"] .logo-light,
  [data-theme="dark"] .logo-vibrant,
  [data-theme="vibrant"] .logo-light,
  [data-theme="vibrant"] .logo-dark {
    @apply hidden;
  }
</style>
```

# Maintaining Global and Local Storybook Instances:

Recommend optimal Storybook placement for global and per-site usage

### Recommended Placement

- Global instance: place a dedicated Storybook app under astro-knots/design-system-storybook to showcase @knots/* packages (tokens, icons, brand themes, Svelte components) independent of any site.
- Per-site instances: install Storybook inside each site repo (e.g., hypernova-site and parslee-site ) for brand-specific components, pages, and decorators.
- Optional package-level: if you want tighter component dev loops, add Storybook under packages/svelte for @knots/svelte . Keep Astro components demoed in the Astro “design-system-viewer” app.
### Global Instance

- Purpose: centralized documentation of shared `@knots/tokens` , `@knots/icons` , `@knots/brand-config` , and `@knots/svelte components`.
- Location: `astro-knots/design-system-storybook` .
- Framework: `@storybook/svelte-vite` for components; include MDX docs for tokens/icons and brand switches.
- Consumption: import workspace packages via pnpm workspaces; wire Tailwind via `@knots/tailwind` `preset/plugin`.
### Per-Site Instances

- Purpose: preview site-specific variants, decorators (brand/theme), and integration with actual site CSS and aliases.
- Location: site root (e.g., `hypernova-site/.storybook` and `parslee-site/.storybook` ).
- Framework: match the site’s component framework (`@storybook/svelte-vite` for Svelte).
### Setup Commands

- Global app:
  - mkdir `astro-knots/design-system-storybook` && cd `astro-knots/design-system-storybook`
  - pnpm init -y
  - pnpm dlx storybook@latest init --type svelte
  - Add deps: pnpm add -D @storybook/addon-docs and runtime deps: pnpm add `@knots/svelte` `@knots/tokens` `@knots/icons` `@knots/brand-config` `@knots/tailwind`
- Hypernova site:
  - cd hypernova-site
  - pnpm dlx storybook@latest init --type svelte
- Parslee site:
  - cd parslee-site
  - pnpm dlx storybook@latest init --type svelte
### Config Tips

- main.ts (global):
  - framework: { name: '@storybook/svelte-vite', options: {} }
  - stories: ['../src/**/*.stories.@(svelte|mdx)']
  - addons: ['@storybook/addon-essentials']
  - viteFinal: (config) => ({ ...config, resolve: { alias: { '@knots/tokens': require.resolve('@knots/tokens'), '@knots/icons': require.resolve('@knots/icons'), '@knots/svelte': require.resolve('@knots/svelte'), '@knots/brand-config': require.resolve('@knots/brand-config') }}})
- preview.ts :
  - Import Tailwind: import '../src/styles/tailwind.css'
  - Brand switching: load brand tokens from @knots/brand-config and expose a global decorator to toggle brands.
### Story Files

- Tokens MDX: show color scales, spacing, typography using @knots/tokens and Tailwind classes from @knots/tailwind plugin.
- Icons: list/render SVG from @knots/icons with size/color controls.
- Components: write Svelte stories for @knots/svelte (e.g., Button.stories.svelte ).
- Astro components: prefer showcasing in the Astro design-system viewer app; link from global Storybook docs.
### Why this split works

- Global instance documents shared design system and enables brand decorators without site coupling.
- Per-site instances validate real integration (aliases, theme composition, content pipelines) per brand/site.
- Keeps build and versioning clean: sites pin versions; global viewer/storybook works off workspace references.
### Next Steps

- I can scaffold the global Storybook app and wire @knots/tailwind and brand decorators.
- Then set up per-site Storybook for Hypernova and Parslee, using each site’s Tailwind and aliases.
- Once ready, we’ll add initial stories for tokens, icons, and the Button component from @knots/svelte .

Shared Packages

- @knots/tokens : Exposes token objects ( colors , etc.). Add a CSS output ( css/variables.css ) that defines :root and theme scopes with custom properties.
- @knots/tailwind : Use the preset to map token scales to Tailwind theme.colors ( primary , secondary , accent ), and optional plugin utilities.
- @knots/brand-config : Holds brand palettes and metadata; load based on env and use for token selection.

# The Knots of CSS and Tailwind

Scanned `globals.css` and `tokens.css` in `astro-knots/sites/cilantro-site/src/styles` and clarified their roles and where overlap is expected.

### Roles

- `tokens.css`: Site-scoped design tokens only. Defines CSS variables for fonts, typography scale, weights, colors, radii, sidebar, and optional `500` color aliases. Includes dark-mode overrides under `[data-theme="dark"]`, `.dark`.
- `globals.css`: Global styling and Tailwind mapping. Imports base tokens (`@knots/tokens/css/variables.css`), mode overrides (`@knots/tokens/css/modes.css`), then your site tokens (`./tokens.css`). Maps your token vars into Tailwind v4’s `@theme inline` names (e.g., `--color-background: var(--background)`), and sets resets/base element styles (body, headings, inputs).

### Overlap Points

- Fonts: `tokens.css` defines `--font-sans` and `--font-size`; `globals.css` sets `font-family` directly to `Inter` for body/headings and `html` font size from `--font-size`. This is acceptable but can be tightened by referencing `var(--font-sans)` everywhere in `globals.css`.
- Colors: You have base colors in `tokens.css` and also inline brand variables on `<html>` via `BaseLayout.astro`. Inline styles on `<html>` will override any token defaults, which is intentional if brand config drives runtime palette.
- Modes: `@knots/tokens/css/modes.css` provides mode-level overrides; your `tokens.css` also includes `[data-theme="dark"]` overrides. Both can coexist; the import order and selector specificity determine the final values.

### Import Order & Overrides

- Current order in `globals.css`: `variables.css` → `modes.css` → `tokens.css`. Since your `tokens.css` contains selectors like `[data-theme="dark"]`, those will still apply based on specificity. Inline styles from `BaseLayout.astro` override everything.
- Alternative order: If you want shared `modes.css` to beat site defaults, import `tokens.css` before `modes.css`. Keep inline brand overrides as the final authority.

### Recommended Separation

- Keep `tokens.css` focused on variables only (no element selectors other than scoping like `:root` or `[data-theme]`). Put all font families, sizes, and color values there.
- Use `globals.css` for:
- Importing token sources (base, modes, site) in the desired precedence.
- Mapping to Tailwind `@theme inline` variables.
- Resets and base element styles that read from tokens, e.g., `font-family: var(--font-sans)` instead of hardcoding `Inter`.
- Drive brand at runtime through `BaseLayout` when you need per-brand overrides; treat `tokens.css` as defaults.

### Actionable Tweaks

- In `globals.css`, replace hardcoded `Inter` with `var(--font-sans)` for body/headings/labels to remove duplication and rely purely on tokens.
- Decide the desired precedence between shared `modes.css` and site `tokens.css`; adjust import order accordingly.
- If you prefer not to set colors in `BaseLayout`, you can remove the inline style on `<html>` and rely on tokens + modes; otherwise keep it to guarantee brand values.

This structure keeps tokens declarative (portable and brandable), globals expressive (styling and mapping), and brand runtime overrides explicit. Let me know if you want me to apply the font-family cleanups in `globals.css` now.

# Mode Implementation
(as of October 10, 2024)

- `src/styles/tokens.css`: Added a `[data-theme="vibrant"]` block that keeps a light base but increases accent and focus visibility. Kept all colors computed from brand scales so branding remains the source of truth.
- `src/styles/globals.css`: Extended Tailwind variants so `dark:` works with either `.dark` or `[data-theme='dark']`, and added a `vibrant:` variant via `@custom-variant vibrant` (`&:is([data-theme='vibrant'] *)`).
- `src/components/ThemeToggle.astro`: Updated to cycle `light → dark → vibrant`, set `data-theme` on `documentElement`, keep `.dark` for Tailwind dark classes, and persist to `localStorage`.

### How it works now

- `BaseLayout.astro` sets the initial mode from `SITE_MODE` and injects brand scales (`--color-primary-500`, `--color-secondary-500`, `--color-accent-500`).
- `tokens.css` computes high-level tokens (`--primary`, `--secondary`, `--accent`) from those brand scales, with overrides for dark and vibrant.
- `ThemeToggle` cycles modes at runtime, keeping Tailwind dark classes compatible and ensuring tokens respond via `data-theme`.

### How to proceed

- Pick a default: set `SITE_MODE` to `light`, `dark`, `vibrant`, or consider `system` (we can implement auto-detect on first load when not set).
- Expand brand palettes (optional): if you want different hues in dark or vibrant, add a brand config extension (e.g., `brand.modes.dark` and `brand.modes.vibrant`) and inject those scales in `BaseLayout` when the mode changes.
- Use variants in styles: you can now target mode-specific styles via Tailwind variants.
  - Example: `dark:bg-card` or `vibrant:ring-accent`.
- Verify contrast: adjust `--accent-foreground` and other foreground tokens per mode to meet accessibility.

