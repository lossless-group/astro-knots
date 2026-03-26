---
title: "Slides System for Astro and Markdown"
lede: "A comprehensive specification for building presentation slide systems in Astro-Knots sites with RevealJS, Three.js, and full theme/mode integration."
date_created: 2024-12-01
date_modified: 2024-12-15
status: Published
category: Blueprints
tags: [slides, presentations, RevealJS, Three.js, markdown]
authors:
  - Michael Staton
---

# Slides System Living Specification

A comprehensive specification for building presentation slide systems in Astro-Knots sites, supporting both component-based (Astro/HTML-CSS) and Markdown-based content with full theme/mode integration and Three.js visualization capabilities.

---

## 1. Overview & Goals

### 1.1 Purpose

The Slides System enables **presentation-as-code** functionality within Astro-Knots sites, allowing teams to create, manage, and deliver rich interactive presentations directly from their websites.

### 1.2 Core Goals

- **Dual Content Model**: Support both Astro component-based slides and Markdown-based slides
- **Theme/Mode Integration**: Slides automatically inherit and respect site theme (brand) and mode (light/dark/vibrant)
- **Three.js Visualization Layer**: First-class support for data visualizations, diagrams, and 3D illustrations
- **Independence**: Each site owns its slides implementation (copy-pattern, not dependency)
- **RevealJS Foundation**: Leverage RevealJS 4.5+ for presentation mechanics

### 1.3 Reference Implementation

The primary reference implementation exists in:

- `astro-knots/sites/hypernova-site/src/` (Hypernova site - most current)
- `astro-knots/sites/twf_site/src/` (The Water Foundation site)

This specification captures patterns from these implementations and extends them for broader reuse.

### 1.4 Key Architecture Decisions (Dec 2024)

**OneSlideDeck Composition Pattern:**
- `OneSlideDeck.astro` uses `BoilerPlateHTML.astro` as its foundation (NOT BaseThemeLayout)
- This ensures slides inherit mode-switching logic from the single source of truth
- BoilerPlateHTML provides `bodyClass` prop and `<slot name="head" />` for composability

**Layout Hierarchy:**
```
BoilerPlateHTML.astro (base HTML boilerplate + mode switching)
    └── OneSlideDeck.astro (RevealJS wrapper, passes bodyClass="slide-deck-active")
            └── Standalone presentation pages (.astro files in /pages/slides/)
            └── MarkdownSlideDeck.astro (for markdown content)
```

**Why NOT BaseThemeLayout for slides:**
- BaseThemeLayout includes header/footer which collide with fullscreen presentations
- Slides need isolated, immersive presentation without site chrome
- OneSlideDeck uses BoilerPlateHTML directly to bypass header/footer

---

## 2. Architecture Overview

### 2.1 High-Level Structure

```
src/
├── components/
│   └── slides/
│       ├── controls/              # Control UI components
│       │   ├── SlidesControlButtons.astro
│       │   ├── ShareButton.astro
│       │   └── NavigationHints.astro
│       ├── elements/              # Reusable slide elements
│       │   ├── SlideTitle.astro
│       │   ├── SlideContent.astro
│       │   ├── SlideImage.astro
│       │   └── SlideCode.astro
│       ├── three/                 # Three.js visualization components
│       │   ├── ThreeCanvas.astro
│       │   ├── DiagramRenderer.svelte
│       │   ├── ChartRenderer.svelte
│       │   └── scenes/            # Reusable 3D scenes
│       ├── preview/               # Preview cards for listings
│       │   └── TitleSlidePreviewCard.astro
│       └── astro-decks/           # Component-based presentations
│           └── [deck-name]/
│               ├── SlideShow--[DeckName].astro
│               └── slides/
│                   ├── TitleSlide.astro
│                   ├── Slide01.astro
│                   └── ...
├── content/
│   └── slides/                    # Markdown-based presentations
│       ├── [presentation-slug].md
│       └── ...
├── data/
│   ├── componentDecks.ts          # Registry of component decks
│   └── markdownDecks.ts           # Dynamic markdown deck loader
├── layouts/
│   ├── OneSlideDeck.astro         # RevealJS wrapper layout
│   └── MarkdownSlideDeck.astro    # Markdown presentation layout
├── pages/
│   └── slides/
│       ├── index.astro            # Presentations listing
│       └── [...slug].astro        # Dynamic slide routing
└── utils/
    └── slides/
        ├── revealConfig.ts        # RevealJS configuration
        └── threeHelpers.ts        # Three.js utilities
```

### 2.2 Content Models

#### Component-Based Slides (Astro)

For highly structured, brand-specific presentations with maximum control.

```astro
---
// src/components/slides/astro-decks/variant-1/slides/TitleSlide.astro
interface Props {
  title: string;
  subtitle?: string;
  background?: string;
}

const { title, subtitle, background } = Astro.props;
---

<section
  class="slide slide--title"
  data-background={background}
>
  <h1 class="slide__title text-primary-50">{title}</h1>
  {subtitle && <p class="slide__subtitle text-accent-300">{subtitle}</p>}
</section>

<style>
  .slide--title {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    background: var(--color-primary-950);
  }

  .slide__title {
    font-size: clamp(2rem, 8vw, 5rem);
    font-weight: 700;
    text-align: center;
  }

  .slide__subtitle {
    font-size: clamp(1rem, 3vw, 1.5rem);
    margin-top: var(--spacing-md);
  }
</style>
```

#### Markdown-Based Slides

For simpler presentations authored in Markdown.

```markdown
---
title: Introduction to Water Systems
description: An overview of global water infrastructure
author: The Water Foundation
date: 2025-01-15
theme: water
transition: slide
tags: [water, infrastructure, presentation]
---

## The Global Challenge

Water scarcity affects **2.3 billion people** worldwide.

---

## Key Statistics

- 785 million lack basic drinking water
- 2 billion use contaminated sources
- 4.2 billion lack safely managed sanitation

---

## Our Solution

Building resilient water infrastructure through:

1. Systems thinking
2. Technology innovation
3. Community engagement
```

### 2.3 Content Collection Schema

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const slides = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    author: z.string().optional(),
    date: z.date().optional(),
    theme: z.enum(['default', 'water', 'nova', 'matter']).default('default'),
    mode: z.enum(['light', 'dark', 'vibrant']).optional(),
    transition: z.enum(['none', 'fade', 'slide', 'convex', 'concave', 'zoom']).default('slide'),
    backgroundTransition: z.enum(['none', 'fade', 'slide', 'convex', 'concave', 'zoom']).default('fade'),
    tags: z.array(z.string()).optional(),
    // Three.js specific
    enableThreeJS: z.boolean().default(false),
    threeScenes: z.array(z.string()).optional(),
  }),
});

export const collections = {
  slides,
  // ... other collections
};
```

---

## 3. Theme & Mode Integration

### 3.1 Design Principles

Slides must seamlessly inherit the site's theme and mode system:

- **Theme**: Brand identity (water, nova, matter, default)
- **Mode**: Visual appearance (light, dark, vibrant)

Slides should never hardcode colors. All colors must flow through CSS custom properties.

### 3.2 CSS Variable Architecture

```css
/* Slide-specific semantic tokens derived from theme */
:root {
  /* Slide backgrounds */
  --slide-bg-primary: var(--color-primary-950);
  --slide-bg-secondary: var(--color-secondary-900);
  --slide-bg-accent: var(--color-accent-900);

  /* Slide foregrounds */
  --slide-fg-primary: var(--color-primary-50);
  --slide-fg-secondary: var(--color-secondary-100);
  --slide-fg-accent: var(--color-accent-200);

  /* Slide surfaces */
  --slide-surface: var(--color-surface);
  --slide-card: var(--color-card);
  --slide-border: var(--color-border);

  /* Slide-specific scales */
  --slide-radius: var(--radius-lg);
  --slide-transition: var(--transition-default);
}

/* Light mode overrides */
[data-mode="light"] {
  --slide-bg-primary: var(--color-primary-50);
  --slide-bg-secondary: var(--color-secondary-100);
  --slide-fg-primary: var(--color-primary-950);
  --slide-fg-secondary: var(--color-secondary-900);
}

/* Dark mode (default for presentations) */
[data-mode="dark"] {
  --slide-bg-primary: var(--color-primary-950);
  --slide-bg-secondary: var(--color-secondary-900);
  --slide-fg-primary: var(--color-primary-50);
  --slide-fg-secondary: var(--color-secondary-100);
}

/* Vibrant mode enhancements */
[data-mode="vibrant"] {
  --slide-bg-primary: var(--color-void);
  --slide-fg-accent: var(--color-accent-400);
  /* Add gradient backgrounds, glow effects, etc. */
}
```

### 3.3 Theme Application in Layouts

```astro
---
// src/layouts/OneSlideDeck.astro
// IMPORTANT: Uses BoilerPlateHTML, NOT BaseThemeLayout (to avoid header/footer collision)
import BoilerPlateHTML from './BoilerPlateHTML.astro';
import SlidesControlButtons from '../components/slides/SlidesControlButtons.astro';

import '@styles/global.css';
import '@styles/nova-theme.css';

interface Props {
  title?: string;
  description?: string;
}

const { title = "Presentation", description = "" } = Astro.props;
---

<BoilerPlateHTML
  title={title}
  description={description}
  themeClass="theme-hypernova"
  bodyClass="slide-deck-active"
>
  <!-- RevealJS CSS in head slot -->
  <link slot="head" rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/reveal.min.css" />

  <!-- Control buttons outside RevealJS -->
  <SlidesControlButtons />

  <!-- RevealJS container with offset to clear control bar -->
  <div class="reveal-container">
    <div class="reveal">
      <div class="slides">
        <slot />
      </div>
    </div>
  </div>

  <!-- RevealJS scripts -->
  <script is:inline src="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/dist/reveal.min.js"></script>
  <script is:inline src="https://cdn.jsdelivr.net/npm/reveal.js@4.5.0/plugin/notes/notes.min.js"></script>

  <script is:inline>
    document.addEventListener('DOMContentLoaded', function() {
      Reveal.initialize({
        controls: true,
        progress: true,
        slideNumber: true,
        history: true,
        center: true,
        touch: true,
        hideInactiveCursor: true,
        transition: 'slide',
        backgroundTransition: 'fade',

        // Smaller base dimensions for better scaling
        width: 1280,
        height: 720,

        // Improved scaling for all screen sizes
        disableLayout: false,
        margin: 0.08,
        minScale: 0.5,
        maxScale: 2.5,

        navigationMode: 'grid',
        plugins: [RevealNotes]
      });
    });
  </script>
</BoilerPlateHTML>

<style is:global>
  /* Ensure full viewport coverage when slide deck is active */
  body.slide-deck-active {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: var(--slide-bg-primary) !important;
    transition: background-color 0.3s ease;
  }

  /* Container offset to clear control bar at top */
  .reveal-container {
    position: fixed;
    top: 4rem;
    left: 0;
    width: 100%;
    height: calc(100% - 4rem);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--slide-bg-primary);
    transition: background-color 0.3s ease;
  }

  /* RevealJS theme integration */
  .reveal {
    font-family: var(--slide-font-family);
    width: 100%;
    height: 100%;
    background: var(--slide-bg-primary);
    transition: background-color 0.3s ease;
  }

  /* ========================================
     Adaptive Typography - scales with viewport
     ======================================== */
  .reveal h1 {
    font-size: clamp(1.75rem, 5vw + 1rem, 4rem);
    line-height: 1.1;
  }

  .reveal h2 {
    font-size: clamp(1.5rem, 3.5vw + 0.75rem, 3rem);
    line-height: 1.2;
  }

  .reveal h3 {
    font-size: clamp(1.25rem, 2.5vw + 0.5rem, 2.25rem);
    line-height: 1.3;
  }

  .reveal p {
    font-size: clamp(1rem, 1.5vw + 0.5rem, 1.5rem);
    line-height: 1.6;
  }

  .reveal li {
    font-size: clamp(0.95rem, 1.4vw + 0.45rem, 1.4rem);
    line-height: 1.5;
  }

  /* Mode-responsive heading shadows */
  html[data-mode="dark"] .reveal h1,
  html[data-mode="dark"] .reveal h2,
  html.dark .reveal h1,
  html.dark .reveal h2 {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  html[data-mode="light"]:not(.dark) .reveal h1,
  html[data-mode="light"]:not(.dark) .reveal h2 {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  /* Mode-responsive RevealJS controls */
  html[data-mode="dark"] .reveal .controls button,
  html.dark .reveal .controls button {
    color: rgba(255, 255, 255, 0.7);
  }

  html[data-mode="light"]:not(.dark) .reveal .controls button {
    color: rgba(0, 0, 0, 0.6);
  }
</style>
```

### 3.4 Mode Switching in Presentations

```astro
---
// src/components/slides/controls/SlidesControlButtons.astro
---

<div class="slides-controls">
  <button id="exit-btn" title="Exit presentation" aria-label="Exit">
    <svg><!-- exit icon --></svg>
    <span class="btn-text">Exit</span>
  </button>

  <button id="restart-btn" title="Restart presentation" aria-label="Restart">
    <svg><!-- restart icon --></svg>
    <span class="btn-text">Restart</span>
  </button>

  <button id="fullscreen-btn" title="Toggle fullscreen" aria-label="Fullscreen">
    <svg id="expand-icon"><!-- expand icon --></svg>
    <svg id="collapse-icon" class="hidden"><!-- collapse icon --></svg>
    <span class="btn-text">Fullscreen</span>
  </button>

  <button id="mode-btn" title="Toggle light/dark mode" aria-label="Toggle mode">
    <svg id="sun-icon"><!-- sun icon --></svg>
    <svg id="moon-icon" class="hidden"><!-- moon icon --></svg>
    <span class="btn-text">Mode</span>
  </button>
</div>

<script>
  // Mode toggle logic
  function initModeToggle() {
    const modeBtn = document.getElementById('mode-btn');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');

    // Load persisted mode or default to dark
    const savedMode = localStorage.getItem('slides-mode') || 'dark';
    applyMode(savedMode);

    modeBtn?.addEventListener('click', () => {
      const currentMode = document.documentElement.getAttribute('data-mode');
      const newMode = currentMode === 'dark' ? 'light' : 'dark';
      applyMode(newMode);
      localStorage.setItem('slides-mode', newMode);
    });

    function applyMode(mode: string) {
      document.documentElement.setAttribute('data-mode', mode);

      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
        sunIcon?.classList.add('hidden');
        moonIcon?.classList.remove('hidden');
      } else {
        document.documentElement.classList.remove('dark');
        sunIcon?.classList.remove('hidden');
        moonIcon?.classList.add('hidden');
      }

      // Dispatch event for Three.js scenes to react
      window.dispatchEvent(new CustomEvent('slides-mode-change', {
        detail: { mode }
      }));
    }
  }

  document.addEventListener('DOMContentLoaded', initModeToggle);
</script>

<style>
  /* Centered control bar at top */
  .control-buttons {
    position: fixed;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    display: flex;
    gap: 0.75rem;
    padding: 0.5rem;
    border-radius: var(--radius-lg);
    backdrop-filter: blur(12px);
    transition: all 0.3s ease;
    /* Dark mode defaults - solid backgrounds */
    background: rgba(var(--color-primary-900), 0.85);
    border: 1px solid rgba(var(--color-primary-50), 0.15);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
  }

  .control-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.875rem;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    /* Solid backgrounds for visibility - NOT transparent */
    background: rgb(var(--color-primary-800));
    color: rgb(var(--color-primary-50));
    border: 1px solid rgba(var(--color-primary-600), 0.5);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .control-button:hover {
    transform: translateY(-1px);
    background: rgb(var(--color-primary-700));
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  /* Light mode overrides - solid white backgrounds */
  html[data-mode="light"]:not(.dark) .control-buttons {
    background: rgb(var(--color-primary-100));
    border: 1px solid rgb(var(--color-primary-200));
  }

  html[data-mode="light"]:not(.dark) .control-button {
    background: white;
    color: rgb(var(--color-primary-900));
    border: 1px solid rgb(var(--color-primary-200));
  }

  /* Hide text on mobile, show only icons */
  @media (max-width: 768px) {
    .control-button {
      padding: 0.5rem;
      font-size: 0;
    }
  }
</style>
```

---

## 4. Three.js Integration

### 4.1 Philosophy

Three.js enables rich data visualizations, diagrams, and 3D illustrations that would be difficult or impossible with CSS alone. The integration should:

- Be **optional** per slide deck (not loaded if unused)
- **React to theme/mode changes** dynamically
- Support **declarative scene definitions** where possible
- Allow **Svelte islands** for complex interactive visualizations

### 4.2 Three.js Canvas Component

```astro
---
// src/components/slides/three/ThreeCanvas.astro
interface Props {
  id: string;
  scene?: string;
  width?: string;
  height?: string;
  class?: string;
}

const {
  id,
  scene,
  width = '100%',
  height = '100%',
  class: className = ''
} = Astro.props;
---

<div
  class:list={['three-canvas-container', className]}
  style={`width: ${width}; height: ${height};`}
>
  <canvas
    id={id}
    data-scene={scene}
    class="three-canvas"
  ></canvas>
  <slot />
</div>

<style>
  .three-canvas-container {
    position: relative;
    overflow: hidden;
    border-radius: var(--slide-radius);
  }

  .three-canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
```

### 4.3 Theme-Aware Three.js Scene Base

```typescript
// src/utils/slides/threeHelpers.ts
import * as THREE from 'three';

export interface ThemeColors {
  background: number;
  primary: number;
  secondary: number;
  accent: number;
  foreground: number;
}

export function getThemeColors(mode: 'light' | 'dark' | 'vibrant'): ThemeColors {
  // Read CSS variables and convert to hex
  const style = getComputedStyle(document.documentElement);

  const cssToHex = (varName: string): number => {
    const value = style.getPropertyValue(varName).trim();
    // Handle various color formats (hex, rgb, hsl)
    return parseColorToHex(value);
  };

  return {
    background: cssToHex('--slide-bg-primary'),
    primary: cssToHex('--color-primary-500'),
    secondary: cssToHex('--color-secondary-500'),
    accent: cssToHex('--color-accent-500'),
    foreground: cssToHex('--slide-fg-primary'),
  };
}

function parseColorToHex(color: string): number {
  // If already hex
  if (color.startsWith('#')) {
    return parseInt(color.slice(1), 16);
  }

  // If rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch.map(Number);
    return (r << 16) | (g << 8) | b;
  }

  // Default fallback
  return 0x000000;
}

export abstract class ThemeAwareScene {
  protected scene: THREE.Scene;
  protected camera: THREE.PerspectiveCamera;
  protected renderer: THREE.WebGLRenderer;
  protected colors: ThemeColors;
  protected animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });

    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Get initial colors
    const mode = document.documentElement.getAttribute('data-mode') as 'light' | 'dark' | 'vibrant';
    this.colors = getThemeColors(mode || 'dark');
    this.updateSceneColors();

    // Listen for mode changes
    window.addEventListener('slides-mode-change', (e: CustomEvent) => {
      this.colors = getThemeColors(e.detail.mode);
      this.updateSceneColors();
    });

    // Handle resize
    window.addEventListener('resize', () => this.onResize());

    this.init();
    this.animate();
  }

  protected abstract init(): void;
  protected abstract updateSceneColors(): void;

  protected onResize(): void {
    const canvas = this.renderer.domElement;
    this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  }

  protected animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    this.render();
  }

  protected render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.renderer.dispose();
    this.scene.clear();
  }
}
```

### 4.4 Example: Data Visualization Scene

```typescript
// src/components/slides/three/scenes/BarChartScene.ts
import * as THREE from 'three';
import { ThemeAwareScene, ThemeColors } from '@/utils/slides/threeHelpers';

interface BarData {
  label: string;
  value: number;
  color?: string;
}

export class BarChartScene extends ThemeAwareScene {
  private bars: THREE.Mesh[] = [];
  private data: BarData[];

  constructor(canvas: HTMLCanvasElement, data: BarData[]) {
    super(canvas);
    this.data = data;
  }

  protected init(): void {
    // Position camera
    this.camera.position.set(0, 2, 8);
    this.camera.lookAt(0, 0, 0);

    // Add ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    // Add directional light
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 5, 5);
    this.scene.add(directional);

    // Create bars
    this.createBars();

    // Add floor grid
    const grid = new THREE.GridHelper(10, 10);
    this.scene.add(grid);
  }

  private createBars(): void {
    const maxValue = Math.max(...this.data.map(d => d.value));
    const barWidth = 0.8;
    const spacing = 1.5;
    const startX = -(this.data.length * spacing) / 2 + spacing / 2;

    this.data.forEach((item, index) => {
      const height = (item.value / maxValue) * 4;
      const geometry = new THREE.BoxGeometry(barWidth, height, barWidth);
      const material = new THREE.MeshStandardMaterial({
        color: this.colors.accent,
        metalness: 0.3,
        roughness: 0.7,
      });

      const bar = new THREE.Mesh(geometry, material);
      bar.position.set(startX + index * spacing, height / 2, 0);

      this.bars.push(bar);
      this.scene.add(bar);
    });
  }

  protected updateSceneColors(): void {
    // Update background
    this.scene.background = new THREE.Color(this.colors.background);

    // Update bar colors with theme
    this.bars.forEach((bar, index) => {
      const material = bar.material as THREE.MeshStandardMaterial;
      // Alternate between primary and accent
      material.color.setHex(index % 2 === 0 ? this.colors.primary : this.colors.accent);
    });
  }

  protected render(): void {
    // Add subtle animation
    this.bars.forEach((bar, index) => {
      bar.rotation.y = Math.sin(Date.now() * 0.001 + index * 0.5) * 0.1;
    });

    super.render();
  }
}
```

### 4.5 Svelte Interactive Diagram Component

```svelte
<!-- src/components/slides/three/DiagramRenderer.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import { getThemeColors, type ThemeColors } from '@/utils/slides/threeHelpers';

  export let nodes: Array<{
    id: string;
    label: string;
    position: [number, number, number];
    connections?: string[];
  }> = [];

  export let interactive = true;

  let canvas: HTMLCanvasElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls | null = null;
  let animationId: number;
  let colors: ThemeColors;

  const nodeObjects = new Map<string, THREE.Mesh>();
  const lines: THREE.Line[] = [];

  onMount(() => {
    initScene();
    createDiagram();
    animate();

    // Listen for mode changes
    window.addEventListener('slides-mode-change', handleModeChange);
    window.addEventListener('resize', handleResize);

    return () => {
      cleanup();
    };
  });

  onDestroy(() => {
    cleanup();
  });

  function initScene() {
    const mode = document.documentElement.getAttribute('data-mode') as 'light' | 'dark' | 'vibrant' || 'dark';
    colors = getThemeColors(mode);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(colors.background);

    camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.z = 10;

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (interactive) {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
    }

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 5, 5);
    scene.add(directional);
  }

  function createDiagram() {
    // Create nodes
    nodes.forEach(node => {
      const geometry = new THREE.SphereGeometry(0.4, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: colors.accent,
        metalness: 0.4,
        roughness: 0.6,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...node.position);
      mesh.userData = { id: node.id, label: node.label };

      scene.add(mesh);
      nodeObjects.set(node.id, mesh);
    });

    // Create connections
    nodes.forEach(node => {
      if (node.connections) {
        node.connections.forEach(targetId => {
          const sourceNode = nodeObjects.get(node.id);
          const targetNode = nodeObjects.get(targetId);

          if (sourceNode && targetNode) {
            const points = [sourceNode.position, targetNode.position];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
              color: colors.secondary,
              opacity: 0.6,
              transparent: true
            });
            const line = new THREE.Line(geometry, material);
            scene.add(line);
            lines.push(line);
          }
        });
      }
    });
  }

  function handleModeChange(e: CustomEvent) {
    colors = getThemeColors(e.detail.mode);

    scene.background = new THREE.Color(colors.background);

    nodeObjects.forEach(mesh => {
      (mesh.material as THREE.MeshStandardMaterial).color.setHex(colors.accent);
    });

    lines.forEach(line => {
      (line.material as THREE.LineBasicMaterial).color.setHex(colors.secondary);
    });
  }

  function handleResize() {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  }

  function animate() {
    animationId = requestAnimationFrame(animate);

    if (controls) {
      controls.update();
    }

    // Subtle node animation
    nodeObjects.forEach((mesh, id) => {
      mesh.rotation.y += 0.01;
    });

    renderer.render(scene, camera);
  }

  function cleanup() {
    cancelAnimationFrame(animationId);
    window.removeEventListener('slides-mode-change', handleModeChange);
    window.removeEventListener('resize', handleResize);

    if (controls) controls.dispose();
    renderer.dispose();
    scene.clear();
  }
</script>

<canvas bind:this={canvas} class="diagram-canvas"></canvas>

<style>
  .diagram-canvas {
    width: 100%;
    height: 100%;
    display: block;
    border-radius: var(--slide-radius);
  }
</style>
```

### 4.6 Using Three.js in Slides

```astro
---
// Example slide with Three.js visualization
// src/components/slides/astro-decks/data-presentation/slides/DataVisualization.astro
import DiagramRenderer from '@/components/slides/three/DiagramRenderer.svelte';

const networkData = [
  { id: 'hub', label: 'Central Hub', position: [0, 0, 0], connections: ['node1', 'node2', 'node3'] },
  { id: 'node1', label: 'Water Source', position: [-3, 2, 0], connections: ['node4'] },
  { id: 'node2', label: 'Treatment', position: [3, 2, 0], connections: ['node5'] },
  { id: 'node3', label: 'Distribution', position: [0, -3, 0] },
  { id: 'node4', label: 'Reservoir', position: [-5, 4, 0] },
  { id: 'node5', label: 'Quality Control', position: [5, 4, 0] },
];
---

<section class="slide slide--visualization">
  <h2 class="slide__heading">Water Infrastructure Network</h2>

  <div class="visualization-container">
    <DiagramRenderer
      client:load
      nodes={networkData}
      interactive={true}
    />
  </div>

  <p class="slide__caption">
    Interactive 3D diagram showing the water distribution network topology.
    <br>
    <small>Use mouse to rotate and zoom</small>
  </p>
</section>

<style>
  .slide--visualization {
    display: grid;
    grid-template-rows: auto 1fr auto;
    height: 100%;
    padding: 2rem;
    gap: 1rem;
  }

  .visualization-container {
    width: 100%;
    height: 100%;
    min-height: 400px;
  }

  .slide__caption {
    text-align: center;
    color: var(--slide-fg-secondary);
    font-size: 0.9rem;
  }
</style>
```

---

## 5. Routing & Navigation

### 5.1 Dynamic Slide Routing

```astro
---
// src/pages/slides/[...slug].astro
import OneSlideDeck from '@/layouts/OneSlideDeck.astro';
import MarkdownSlideDeck from '@/layouts/MarkdownSlideDeck.astro';
import { getCollection } from 'astro:content';
import { componentDecks, type ComponentDeck } from '@/data/componentDecks';
import { loadMarkdownDecks, getMarkdownDeckBySlug } from '@/data/markdownDecks';

// Dynamic component imports
import SlideShowVariant1 from '@/components/slides/astro-decks/variant-1/SlideShow--Variant-1.astro';
// Add other component deck imports as needed

const componentMap: Record<string, any> = {
  'SlideShowVariant1': SlideShowVariant1,
  // Add other mappings
};

export async function getStaticPaths() {
  const paths: Array<{ params: { slug: string }; props: any }> = [];

  // Add component-based deck paths
  for (const [slug, deck] of Object.entries(componentDecks)) {
    paths.push({
      params: { slug },
      props: { type: 'component', deck }
    });
  }

  // Add markdown-based deck paths
  const markdownSlides = await getCollection('slides');
  for (const slide of markdownSlides) {
    paths.push({
      params: { slug: slide.slug },
      props: { type: 'markdown', entry: slide }
    });
  }

  return paths;
}

const { slug } = Astro.params;
const { type, deck, entry } = Astro.props;
---

{type === 'component' && deck ? (
  <OneSlideDeck
    title={deck.title}
    description={deck.description}
    theme={deck.theme || 'default'}
    mode={deck.mode || 'dark'}
    transition={deck.transition || 'slide'}
  >
    {componentMap[deck.component] && <Fragment set:html={componentMap[deck.component]} />}
  </OneSlideDeck>
) : type === 'markdown' && entry ? (
  <MarkdownSlideDeck
    title={entry.data.title}
    description={entry.data.description}
    theme={entry.data.theme || 'default'}
    mode={entry.data.mode || 'dark'}
    transition={entry.data.transition || 'slide'}
    content={entry}
  />
) : (
  <OneSlideDeck title="Not Found">
    <section>
      <h1>Presentation Not Found</h1>
      <p>The requested presentation "{slug}" could not be found.</p>
      <a href="/slides/">Return to presentations</a>
    </section>
  </OneSlideDeck>
)}
```

### 5.2 Presentations Index Page

```astro
---
// src/pages/slides/index.astro
import BaseThemeLayout from '@/layouts/BaseThemeLayout.astro';
import TitleSlidePreviewCard from '@/components/slides/preview/TitleSlidePreviewCard.astro';
import { componentDecks } from '@/data/componentDecks';
import { getCollection } from 'astro:content';

const markdownDecks = await getCollection('slides');

const allPresentations = [
  // Component decks
  ...Object.entries(componentDecks).map(([slug, deck]) => ({
    slug,
    title: deck.title,
    description: deck.description,
    type: 'component' as const,
    date: deck.date,
    theme: deck.theme,
  })),
  // Markdown decks
  ...markdownDecks.map(entry => ({
    slug: entry.slug,
    title: entry.data.title,
    description: entry.data.description || '',
    type: 'markdown' as const,
    date: entry.data.date,
    theme: entry.data.theme,
  })),
].sort((a, b) => {
  // Sort by date descending, then by title
  if (a.date && b.date) return b.date.getTime() - a.date.getTime();
  return a.title.localeCompare(b.title);
});
---

<BaseThemeLayout
  title="Presentations"
  description="Browse all available presentations"
>
  <main class="presentations-page">
    <header class="page-header">
      <h1>Presentations</h1>
      <p class="page-description">
        Interactive slide decks and presentations
      </p>
    </header>

    <section class="presentations-grid">
      {allPresentations.map(presentation => (
        <TitleSlidePreviewCard
          title={presentation.title}
          description={presentation.description}
          href={`/slides/${presentation.slug}`}
          badge={presentation.type === 'markdown' ? 'MD' : 'Deck'}
          date={presentation.date}
        />
      ))}
    </section>

    <footer class="keyboard-hints">
      <h3>Keyboard Shortcuts</h3>
      <ul>
        <li><kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> Navigate slides</li>
        <li><kbd>F</kbd> Fullscreen</li>
        <li><kbd>S</kbd> Speaker notes</li>
        <li><kbd>ESC</kbd> Slide overview</li>
        <li><kbd>B</kbd> Pause (blank screen)</li>
      </ul>
    </footer>
  </main>
</BaseThemeLayout>

<style>
  .presentations-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .page-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .page-header h1 {
    font-size: clamp(2rem, 5vw, 3.5rem);
    color: var(--color-foreground);
    margin-bottom: 0.5rem;
  }

  .page-description {
    color: var(--color-muted-foreground);
    font-size: 1.125rem;
  }

  .presentations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 2rem;
    margin-bottom: 4rem;
  }

  .keyboard-hints {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    max-width: 600px;
    margin: 0 auto;
  }

  .keyboard-hints h3 {
    margin-bottom: 1rem;
    color: var(--color-foreground);
  }

  .keyboard-hints ul {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .keyboard-hints li {
    color: var(--color-muted-foreground);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  kbd {
    background: var(--color-secondary-800);
    color: var(--color-foreground);
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-sm);
    font-family: var(--font-family-mono);
    font-size: 0.875rem;
  }
</style>
```

---

## 6. Deck Registries

### 6.1 Component Deck Registry

```typescript
// src/data/componentDecks.ts
export interface ComponentDeck {
  title: string;
  description: string;
  component: string;  // Component key for dynamic import
  theme?: 'default' | 'water' | 'nova' | 'matter';
  mode?: 'light' | 'dark' | 'vibrant';
  transition?: string;
  date?: Date;
  tags?: string[];
  enableThreeJS?: boolean;
}

export const componentDecks: Record<string, ComponentDeck> = {
  'water-fund-variant-1': {
    title: 'The Water Foundation',
    description: 'Investment thesis and organizational overview',
    component: 'SlideShowVariant1',
    theme: 'water',
    mode: 'dark',
    transition: 'slide',
    date: new Date('2025-01-15'),
    tags: ['investment', 'overview', 'foundation'],
    enableThreeJS: false,
  },

  'meet-at-the-drop': {
    title: 'Meet The Water Foundation at The Drop',
    description: 'Conference presentation deck',
    component: 'SlideShowMeetAt',
    theme: 'water',
    mode: 'dark',
    date: new Date('2025-02-01'),
    tags: ['conference', 'networking'],
    enableThreeJS: false,
  },

  'data-infrastructure': {
    title: 'Water Data Infrastructure',
    description: 'Technical deep-dive with 3D visualizations',
    component: 'SlideShowDataInfra',
    theme: 'water',
    mode: 'dark',
    enableThreeJS: true,
    tags: ['technical', 'data', 'infrastructure'],
  },
};

export function getDeckBySlug(slug: string): ComponentDeck | undefined {
  return componentDecks[slug.toLowerCase()];
}

export function getDecksWithThreeJS(): Array<[string, ComponentDeck]> {
  return Object.entries(componentDecks).filter(([_, deck]) => deck.enableThreeJS);
}
```

### 6.2 Markdown Deck Loader

```typescript
// src/data/markdownDecks.ts
import { getCollection, type CollectionEntry } from 'astro:content';

export type MarkdownDeck = CollectionEntry<'slides'>;

let cachedDecks: MarkdownDeck[] | null = null;

export async function loadMarkdownDecks(): Promise<MarkdownDeck[]> {
  if (cachedDecks) return cachedDecks;

  try {
    cachedDecks = await getCollection('slides');
    return cachedDecks;
  } catch (error) {
    console.warn('Failed to load markdown slide decks:', error);
    return [];
  }
}

export async function getMarkdownDeckBySlug(slug: string): Promise<MarkdownDeck | undefined> {
  const decks = await loadMarkdownDecks();
  return decks.find(deck =>
    deck.slug.toLowerCase() === slug.toLowerCase()
  );
}

export async function getMarkdownDecksByTag(tag: string): Promise<MarkdownDeck[]> {
  const decks = await loadMarkdownDecks();
  return decks.filter(deck =>
    deck.data.tags?.includes(tag.toLowerCase())
  );
}

export function clearCache(): void {
  cachedDecks = null;
}
```

---

## 7. Markdown-to-Slides Conversion

### 7.1 Conversion Strategy

Markdown slides use `---` (horizontal rules) as slide separators, with support for:

- Level 2 headings (`##`) as slide titles
- All standard markdown formatting
- Fenced code blocks with syntax highlighting
- Images with captions
- Speaker notes via `Note:` blocks

### 7.2 Markdown Slide Layout

```astro
---
// src/layouts/MarkdownSlideDeck.astro
import OneSlideDeck from '@/layouts/OneSlideDeck.astro';
import type { CollectionEntry } from 'astro:content';

interface Props {
  title: string;
  description?: string;
  theme?: string;
  mode?: string;
  transition?: string;
  content: CollectionEntry<'slides'>;
}

const { title, description, theme, mode, transition, content } = Astro.props;

// Render markdown content
const { Content } = await content.render();
---

<OneSlideDeck
  title={title}
  description={description}
  theme={theme}
  mode={mode}
  transition={transition}
>
  <div class="markdown-slides-container">
    <Content />
  </div>
</OneSlideDeck>

<script>
  // Convert markdown structure to RevealJS slides
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.markdown-slides-container');
    if (!container) return;

    const slidesDiv = document.querySelector('.reveal .slides');
    if (!slidesDiv) return;

    // Get all child elements
    const elements = Array.from(container.children);

    let currentSlide: HTMLElement | null = null;
    let currentNotes: string[] = [];

    function createSlide(): HTMLElement {
      const section = document.createElement('section');
      section.className = 'slide slide--markdown';
      return section;
    }

    function finalizeSlide() {
      if (currentSlide && currentSlide.children.length > 0) {
        // Add speaker notes if any
        if (currentNotes.length > 0) {
          const aside = document.createElement('aside');
          aside.className = 'notes';
          aside.innerHTML = currentNotes.join('<br>');
          currentSlide.appendChild(aside);
        }
        slidesDiv.appendChild(currentSlide);
      }
      currentSlide = createSlide();
      currentNotes = [];
    }

    // Initialize first slide
    currentSlide = createSlide();

    elements.forEach(el => {
      // Check for slide separator (hr)
      if (el.tagName === 'HR') {
        finalizeSlide();
        return;
      }

      // Check for speaker notes
      if (el.tagName === 'P' && el.textContent?.startsWith('Note:')) {
        currentNotes.push(el.textContent.replace('Note:', '').trim());
        return;
      }

      // Add element to current slide
      if (currentSlide) {
        currentSlide.appendChild(el.cloneNode(true));
      }
    });

    // Finalize last slide
    finalizeSlide();

    // Remove original container
    container.remove();

    // Reinitialize Reveal to pick up new structure
    if (window.Reveal) {
      window.Reveal.sync();
    }
  });
</script>

<style is:global>
  .slide--markdown {
    padding: 2rem;
    text-align: left;
  }

  .slide--markdown h2 {
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
    color: var(--slide-fg-primary);
  }

  .slide--markdown p {
    font-size: 1.25rem;
    line-height: 1.75;
    margin-bottom: 1rem;
  }

  .slide--markdown ul,
  .slide--markdown ol {
    font-size: 1.25rem;
    margin-left: 2rem;
    margin-bottom: 1rem;
  }

  .slide--markdown li {
    margin-bottom: 0.5rem;
  }

  .slide--markdown pre {
    background: var(--color-secondary-900);
    padding: 1rem;
    border-radius: var(--radius-md);
    border-left: 4px solid var(--slide-fg-accent);
    overflow-x: auto;
  }

  .slide--markdown code {
    font-family: var(--font-family-mono);
    font-size: 0.9em;
  }

  .slide--markdown img {
    max-width: 100%;
    height: auto;
    border-radius: var(--radius-md);
    margin: 1rem 0;
  }

  .slide--markdown blockquote {
    border-left: 4px solid var(--slide-fg-accent);
    padding-left: 1rem;
    margin: 1rem 0;
    font-style: italic;
    color: var(--slide-fg-secondary);
  }

  .slide--markdown strong {
    color: var(--slide-fg-accent);
  }
</style>
```

---

## 8. RevealJS Configuration

### 8.1 Configuration Options

```typescript
// src/utils/slides/revealConfig.ts
export interface RevealConfig {
  // Display controls
  controls: boolean;
  progress: boolean;
  slideNumber: boolean | string;

  // Navigation
  history: boolean;
  keyboard: boolean;
  touch: boolean;
  navigationMode: 'default' | 'linear' | 'grid';

  // Presentation
  center: boolean;
  loop: boolean;
  rtl: boolean;
  shuffle: boolean;

  // Transitions
  transition: 'none' | 'fade' | 'slide' | 'convex' | 'concave' | 'zoom';
  backgroundTransition: 'none' | 'fade' | 'slide' | 'convex' | 'concave' | 'zoom';
  transitionSpeed: 'default' | 'fast' | 'slow';

  // Sizing
  width: number;
  height: number;
  margin: number;
  minScale: number;
  maxScale: number;

  // Behavior
  hideInactiveCursor: boolean;
  hideCursorTime: number;
  autoSlide: number;  // 0 = disabled
  autoSlideStoppable: boolean;

  // Plugins
  plugins: any[];
}

export const defaultConfig: RevealConfig = {
  // Display
  controls: true,
  progress: true,
  slideNumber: true,

  // Navigation
  history: true,
  keyboard: true,
  touch: true,
  navigationMode: 'grid',

  // Presentation
  center: true,
  loop: false,
  rtl: false,
  shuffle: false,

  // Transitions
  transition: 'slide',
  backgroundTransition: 'fade',
  transitionSpeed: 'default',

  // Sizing (16:9) - smaller base for better scaling on all screens
  width: 1280,
  height: 720,
  margin: 0.08,
  minScale: 0.5,
  maxScale: 2.5,

  // Behavior
  hideInactiveCursor: true,
  hideCursorTime: 3000,
  autoSlide: 0,
  autoSlideStoppable: true,

  // Plugins
  plugins: [],
};

export function createConfig(overrides: Partial<RevealConfig> = {}): RevealConfig {
  return { ...defaultConfig, ...overrides };
}

export function getAspectRatioConfig(ratio: '16:9' | '4:3' | '1:1'): Pick<RevealConfig, 'width' | 'height'> {
  const configs = {
    '16:9': { width: 1600, height: 900 },
    '4:3': { width: 1024, height: 768 },
    '1:1': { width: 1024, height: 1024 },
  };
  return configs[ratio];
}
```

---

## 9. Best Practices

### 9.1 Component Slide Design

- **One concept per slide**: Keep slides focused
- **Use semantic CSS variables**: Never hardcode colors
- **Responsive typography**: Use `clamp()` for font sizes
- **Consistent spacing**: Use the spacing scale from theme

```astro
---
// Good: Semantic colors, responsive sizing
---
<section class="slide">
  <h1 class="text-slide-fg-primary" style="font-size: clamp(2rem, 6vw, 4rem);">
    Title Here
  </h1>
  <p class="text-slide-fg-secondary mt-md">
    Supporting text
  </p>
</section>
```

### 9.2 Three.js Performance

- **Lazy load** Three.js only for decks that need it
- **Dispose resources** when slides are navigated away
- **Limit particle counts** and geometry complexity
- **Use `requestAnimationFrame`** properly with cleanup
- **Test on lower-end devices**

### 9.3 Accessibility

- **Alt text** for all meaningful images
- **Keyboard navigation** must work
- **Color contrast** ratios must meet WCAG 2.1 AA
- **Speaker notes** for screen readers
- **Reduced motion** support for animations

```css
@media (prefers-reduced-motion: reduce) {
  .slide *,
  .three-canvas-container * {
    animation: none !important;
    transition: none !important;
  }
}
```

### 9.4 Content Organization

- **Group related slides** in folders
- **Use descriptive file names**: `01-introduction.astro`, not `slide1.astro`
- **Separate data from presentation**: Keep chart data in data files
- **Version control** deck content

### 9.5 Standalone Presentation Pages

For `.astro` presentation files in `/pages/slides/`, use OneSlideDeck directly:

```astro
---
// src/pages/slides/My-Presentation.astro
// CORRECT: Use OneSlideDeck directly (no Layout wrapper)
import OneSlideDeck from '@layouts/OneSlideDeck.astro';

export const presentation = {
  title: "My Presentation",
  description: "A standalone presentation",
  author: "Author Name",
  date: "2025-01-01",
  tags: ["topic"],
  shareImage: "/share-banners/my-presentation.jpeg",
  type: "standalone" as const,
};

const title = presentation.title;
const description = presentation.description;
---

<OneSlideDeck title={title} description={description}>
  <section>
    <h1>Slide Title</h1>
    <p>Content here</p>
  </section>
  <!-- More sections... -->
</OneSlideDeck>
```

**Important:** Do NOT wrap OneSlideDeck in BaseThemeLayout - this causes header/footer collision.

```astro
---
// WRONG - DO NOT DO THIS
import Layout from '@layouts/BaseThemeLayout.astro';
import OneSlideDeck from '@layouts/OneSlideDeck.astro';
---
<Layout>
  <OneSlideDeck>
    <!-- This causes header/footer to appear on slides! -->
  </OneSlideDeck>
</Layout>
```

---

## 10. Presentation Image Assets

This section defines the consistent naming convention for presentation images used across:
- Component deck exports (`.astro` files)
- Markdown frontmatter
- Auto-discovery system
- Preview cards and OpenGraph metadata

### 10.1 Image Property Naming Convention

| Property | Purpose | Recommended Aspect Ratio | Usage |
|----------|---------|--------------------------|-------|
| `coverImage` | Card preview on `/slides/` index page | 16:9 (1600x900) | `TitleSlidePreviewCard` display |
| `shareImage` | OpenGraph/social sharing banner | 16:9 (1200x630 or 1600x900) | `<meta property="og:image">` |

**Rationale:**
- `coverImage` is distinct from `shareImage` because they serve different purposes
- Card previews may want stylized/cropped versions vs. full share banners
- Both properties are optional - fallbacks provide sensible defaults

### 10.2 Fallback Behavior

When only one image is provided, the system uses intelligent fallbacks:

```
If coverImage missing → use shareImage
If shareImage missing → use coverImage
If both missing → use site-level default or rendered title slide
```

### 10.3 Component Deck Implementation

Update `ComponentDeck` interface in `src/data/componentDecks.ts`:

```typescript
export interface ComponentDeck {
  title: string;
  description: string;
  component: string;
  author?: string;
  date?: string;
  tags?: string[];
  type: 'component';

  // Image assets
  coverImage?: string;   // Card preview on index page
  shareImage?: string;   // OpenGraph/social sharing
}
```

### 10.4 Markdown Frontmatter Schema

Update the slides content collection schema in `src/content/config.ts` (or `content.config.ts`):

```typescript
const slides = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    author: z.string().optional(),
    date: z.date().optional(),
    theme: z.enum(['default', 'water', 'nova', 'matter']).default('default'),
    mode: z.enum(['light', 'dark', 'vibrant']).optional(),
    transition: z.enum(['none', 'fade', 'slide', 'convex', 'concave', 'zoom']).default('slide'),
    tags: z.array(z.string()).optional(),

    // Image assets
    coverImage: z.string().optional(),  // Card preview on index page
    shareImage: z.string().optional(),  // OpenGraph/social sharing
  }),
});
```

### 10.5 Unified Presentation Interface

The auto-discovery system in `src/pages/slides/index.astro` normalizes all sources to this interface:

```typescript
interface Presentation {
  title: string;
  slug: string;
  description: string;
  date?: string;
  author?: string;
  tags?: string[];
  icon?: string;

  // Normalized image assets
  coverImage?: string;  // For card display
  shareImage?: string;  // For OpenGraph

  type: 'component' | 'standalone' | 'markdown';
}
```

### 10.6 TitleSlidePreviewCard Props

Update `TitleSlidePreviewCard.astro` to use both properties with fallback:

```typescript
interface Props {
  title: string;
  description: string;
  slug: string;
  date?: string;
  icon?: string;
  coverImage?: string;  // Primary: card display image
  shareImage?: string;  // Fallback if coverImage missing
  class?: string;
}

// In component logic:
const displayImage = coverImage || shareImage || undefined;
```

### 10.7 OpenGraph Integration

When rendering the slide page, pass `shareImage` (or `coverImage` as fallback) to OpenGraph:

```astro
<OpenGraph
  title={presentation.title}
  description={presentation.description}
  imageLandscape={presentation.shareImage || presentation.coverImage}
/>
```

### 10.8 Site-Level Defaults

Each site can define fallback images in their configuration:

```typescript
// src/config/slides.ts (optional)
export const slideDefaults = {
  coverImage: '/images/slides/default-cover.jpg',
  shareImage: '/images/slides/default-share.jpg',
};
```

### 10.9 Image Asset Best Practices

**File Naming:**
```
public/images/slides/
├── [deck-slug]-cover.jpg    # 1600x900 card preview
├── [deck-slug]-share.jpg    # 1200x630 OG image
└── default-cover.jpg        # Site fallback
```

**Image Requirements:**
- **coverImage**: 16:9 aspect ratio, optimized for card display (800-1600px wide)
- **shareImage**: 16:9 aspect ratio, suitable for social platforms (1200x630 recommended)
- Both should work in light and dark contexts (avoid pure white backgrounds)
- Include brand mark or deck title for shareImage

### 10.10 Migration Path

For existing implementations using only `shareImage`:

1. **No breaking changes**: `shareImage` continues to work as-is
2. **Gradual adoption**: Add `coverImage` when distinct card preview is desired
3. **Fallback cascade**: System automatically uses `shareImage` when `coverImage` absent

---

## 11. Future Enhancements

### 11.1 Planned Features

- **Export to PDF/PPTX**: Server-side rendering pipeline
- **Collaborative editing**: Real-time slide collaboration
- **Analytics**: Track slide engagement and viewing patterns
- **Custom themes**: Per-deck theme overrides
- **Slide templates**: Reusable slide layouts

### 11.2 Three.js Expansions

- **Chart library integration**: D3.js to Three.js bridges
- **Animated data transitions**: Smooth data updates
- **VR/AR support**: WebXR for immersive presentations
- **Physics-based animations**: Matter.js integration

### 11.3 Content Pipeline

- **Notion sync**: Import slides from Notion
- **Google Slides import**: Convert from Google Slides
- **AI-assisted authoring**: Generate slide content from outlines

---

## 12. Quick Reference

### File Locations

| Purpose | Path |
|---------|------|
| Slide components | `src/components/slides/` |
| Three.js components | `src/components/slides/three/` |
| Astro decks | `src/components/slides/astro-decks/` |
| Markdown decks | `src/content/slides/` |
| Layouts | `src/layouts/OneSlideDeck.astro` |
| Routes | `src/pages/slides/` |
| Utilities | `src/utils/slides/` |
| Configuration | `src/data/componentDecks.ts` |

### Key CSS Variables

```css
/* Slide-specific */
--slide-bg-primary
--slide-bg-secondary
--slide-fg-primary
--slide-fg-secondary
--slide-fg-accent
--slide-surface
--slide-border
--slide-radius
--slide-transition

/* From theme system */
--color-primary-*
--color-secondary-*
--color-accent-*
--color-background
--color-foreground
```

### RevealJS Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` `→` `↑` `↓` | Navigate |
| `F` | Fullscreen |
| `S` | Speaker notes |
| `ESC` | Overview |
| `B` | Blank/pause |
| `O` | Overlay view |
| `Space` | Next slide |

---

*This is a living specification. Update as the implementation evolves.*
