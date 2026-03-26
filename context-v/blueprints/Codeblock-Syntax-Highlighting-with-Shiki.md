---
title: "Codeblock Syntax Highlighting with Shiki"
lede: "Blueprint for implementing syntax-highlighted code blocks across astro-knots sites using Shiki with the tokyo-night theme and reusable wrapper components."
date_created: 2025-11-15
date_modified: 2025-12-15
status: Published
category: Blueprints
tags: [Shiki, Syntax-Highlighting, Code-Blocks, Astro, Tokyo-Night]
authors:
  - Michael Staton
---

# Codeblock Syntax Highlighting with Shiki (Astro-Knots Pattern)

This blueprint captures how to implement syntax-highlighted code blocks across astro-knots sites using Shiki with the tokyo-night theme and reusable wrapper components.

Reference implementation: `astro-knots/sites/dark-matter`

---

## 1. Goals

- **Syntax highlighting** for all code blocks using Shiki
- **Always-dark code blocks**: Dark background in ALL modes (dark, vibrant, light) for consistent contrast
- **Consistent UX**: Compact header with language label and copy button
- **Flexible integration**: Works with both Astro's built-in markdown and custom unified/remark pipelines
- **Mode-independent**: Code blocks look the same regardless of page theme mode

---

## 2. Architecture Overview

The system has three layers:

```
┌─────────────────────────────────────────────────────────────┐
│  1. Shiki Configuration (astro.config.mjs or rehypeShiki)   │
│     - Theme: tokyo-night (dark theme used in all modes)     │
│     - Language class output for detection                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  2. CSS Configuration (global.css)                          │
│     - Forces dark theme colors (--shiki-dark)               │
│     - Dark background (#1a1b26) in all modes                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Component Layer                                         │
│     - BaseCodeblock.astro: Direct use with <Code />         │
│     - CodeblockWrapper.astro: Enhances pre-rendered HTML    │
│     - Both maintain dark styling across all modes           │
└─────────────────────────────────────────────────────────────┘
```

### Mode Behavior

| Page Mode | Code Block Background | Syntax Colors | Result |
|-----------|----------------------|---------------|--------|
| `dark` | `#1a1b26` (tokyo-night) | tokyo-night | Dark on dark - seamless |
| `vibrant` | `#1a1b26` (tokyo-night) | tokyo-night | Dark on vibrant - contrast |
| `light` | `#1a1b26` (tokyo-night) | tokyo-night | Dark on light - strong contrast |

Code blocks remain dark in ALL modes, providing consistent developer experience and good contrast regardless of the page's theme mode.

---

## 3. Shiki Configuration

### 3.1 For Astro's Built-in Markdown

Add to `astro.config.mjs`:

```javascript
export default defineConfig({
  // ... other config
  markdown: {
    shikiConfig: {
      // Dual themes for light/dark mode
      themes: {
        light: 'github-light',
        dark: 'tokyo-night',
      },
      // Wrap long lines instead of horizontal scroll
      wrap: true,
    },
  },
});
```

This applies to:
- Content collections rendered with `entry.render()`
- MDX files
- Standard `.md` files processed by Astro

### 3.2 For Custom Unified/Remark Pipelines

When using a custom unified pipeline (e.g., for changelog entries), add `@shikijs/rehype`:

```bash
pnpm add @shikijs/rehype
```

Then integrate into your pipeline:

```typescript
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeShiki from '@shikijs/rehype';
import rehypeStringify from 'rehype-stringify';

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeShiki, {
    themes: {
      light: 'github-light',
      dark: 'tokyo-night',
    },
    // Add language class for wrapper detection
    addLanguageClass: true,
  })
  .use(rehypeStringify, { allowDangerousHtml: true });

const htmlContent = String(await processor.process(markdownContent));
```

### 3.3 Theme Selection

Recommended themes that work well with common site palettes:

| Site Aesthetic | Light Theme | Dark Theme |
|----------------|-------------|------------|
| Purple/cosmic (matter) | `github-light` | `tokyo-night` |
| Blue/professional | `github-light` | `night-owl` |
| Green/nature | `min-light` | `vitesse-dark` |
| High contrast | `github-light` | `dracula` |

See all themes: https://shiki.style/themes

---

## 4. CSS Configuration

Add to `src/styles/global.css` (or equivalent):

```css
/* Shiki syntax highlighting - always use dark theme for better contrast */
.shiki,
.shiki span {
  color: var(--shiki-dark) !important;
  background-color: transparent !important;
}

/* Code block base styling - dark background in all modes */
pre.shiki {
  padding: 1rem;
  border-radius: var(--border-radius-lg, 0.5rem);
  overflow-x: auto;
  font-family: var(--font-family-mono, monospace);
  font-size: 0.875rem;
  line-height: 1.7;
  background-color: #1a1b26 !important; /* tokyo-night background */
}
```

**Design Decision: Always Dark Code Blocks**

We keep code blocks dark in ALL modes (including light mode) because:
- Provides consistent visual contrast and separation from content
- Dark backgrounds are easier on the eyes for reading code
- Most developers are used to dark editor themes
- Eliminates the need for maintaining two color schemes
- Follows the pattern used by GitHub, VS Code docs, and many documentation sites

**How it works:**
- Shiki outputs inline styles using CSS variables: `--shiki-light`, `--shiki-dark`
- We force `--shiki-dark` in all modes via CSS
- Background is hardcoded to tokyo-night's `#1a1b26`
- In light mode, the dark code block provides nice contrast against the light page

---

## 5. Component Layer

### 5.1 BaseCodeblock.astro

For direct use in Astro templates when you have code as a string:

**File:** `src/components/codeblocks/BaseCodeblock.astro`

```astro
---
import { Code } from 'astro/components';

interface Props {
  code: string;
  lang?: string;
}

const { code, lang = 'text' } = Astro.props;
---

<div class="codeblock-container">
  <div class="codeblock-header">
    <span class="codeblock-language">{lang}</span>
    <button class="copy-button" aria-label="Copy code to clipboard">
      <svg><!-- copy icon --></svg>
      <span class="copy-label">Copy</span>
    </button>
  </div>
  <div class="codeblock-content">
    <Code code={code} lang={lang as any} theme="tokyo-night" />
  </div>
</div>

<script>
  // Copy button functionality
</script>

<style>
  /* Compact header styling */
</style>
```

**Usage:**
```astro
---
import BaseCodeblock from '@components/codeblocks/BaseCodeblock.astro';
---

<BaseCodeblock code="const x = 1;" lang="typescript" />
```

### 5.2 CodeblockWrapper.astro

For enhancing pre-rendered HTML that already contains Shiki output:

**File:** `src/components/codeblocks/CodeblockWrapper.astro`

```astro
---
/**
 * Wraps HTML content and enhances any Shiki-rendered code blocks
 * with a compact header (language label + copy button).
 */
---

<div class="codeblock-enhanced-content">
  <slot />
</div>

<script>
  function enhanceCodeblocks() {
    const containers = document.querySelectorAll('.codeblock-enhanced-content');

    containers.forEach(container => {
      const preElements = container.querySelectorAll('pre');

      preElements.forEach(pre => {
        // Skip if already enhanced
        if (pre.closest('.codeblock-container')) return;

        // Detect language from class or data attribute
        const code = pre.querySelector('code');
        let lang = 'text';

        if (code?.dataset?.language) {
          lang = code.dataset.language;
        } else if (pre.dataset.language) {
          lang = pre.dataset.language;
        } else {
          const langClass = Array.from(code?.classList || [])
            .find(c => c.startsWith('language-'));
          if (langClass) lang = langClass.replace('language-', '');
        }

        // Create wrapper with header
        const wrapper = document.createElement('div');
        wrapper.className = 'codeblock-container';
        wrapper.innerHTML = `
          <div class="codeblock-header">
            <span class="codeblock-language">${lang}</span>
            <button class="copy-button">Copy</button>
          </div>
          <div class="codeblock-content"></div>
        `;

        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.querySelector('.codeblock-content').appendChild(pre);

        // Add copy functionality
        // ...
      });
    });
  }

  document.addEventListener('DOMContentLoaded', enhanceCodeblocks);
</script>

<style is:global>
  /* Scoped styles for enhanced codeblocks */
</style>
```

**Usage:**
```astro
---
import CodeblockWrapper from '@components/codeblocks/CodeblockWrapper.astro';

// Process markdown with rehypeShiki
const htmlContent = await processMarkdown(entry.body);
---

<CodeblockWrapper>
  <div class="prose" set:html={htmlContent} />
</CodeblockWrapper>
```

---

## 6. Header Design Guidelines

The codeblock header should be compact and unobtrusive:

```css
.codeblock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0.75rem;        /* Slim vertical padding */
  background: rgba(0, 0, 0, 0.4);
  font-family: var(--font-family-mono);
  font-size: 0.65rem;              /* Small but readable */
  min-height: 1.5rem;              /* Consistent height */
}

.codeblock-language {
  text-transform: uppercase;
  font-weight: 500;
  color: var(--color-accent, #9C85DF);
  letter-spacing: 0.08em;
  opacity: 0.8;
}

.copy-button {
  opacity: 0.4;
  font-size: 0.6rem;
  padding: 0.125rem 0.375rem;
}

.copy-button:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}

.copy-button.copied {
  color: var(--color-accent);
  opacity: 1;
}
```

**Key dimensions:**
- Header height: ~24px (vs typical 32-40px)
- Language font: 0.65rem uppercase
- Copy button: 12x12px icon, label hidden on mobile

### Light Mode Component Styling

Even in light mode, code blocks stay dark. Add these styles to maintain proper contrast:

```css
/* Light mode - keep code blocks dark for contrast */
:global([data-mode="light"]) .codeblock-container {
  border-color: rgba(0, 0, 0, 0.15);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
}

:global([data-mode="light"]) .codeblock-header {
  background: rgba(0, 0, 0, 0.6);
}

:global([data-mode="light"]) .codeblock-content {
  background: #1a1b26; /* tokyo-night background */
}

:global([data-mode="light"]) .copy-button {
  color: #F9FAFB; /* Light text on dark background */
}
```

This ensures:
- Slightly stronger shadow in light mode (code block "pops" more)
- Header stays dark to match content area
- Copy button text remains visible

---

## 7. Copy Button Behavior

```javascript
button.addEventListener('click', async () => {
  const codeText = pre.textContent || '';

  try {
    await navigator.clipboard.writeText(codeText);

    // Visual feedback
    button.classList.add('copied');
    const label = button.querySelector('.copy-label');
    if (label) label.textContent = 'Copied!';

    // Reset after 2 seconds
    setTimeout(() => {
      button.classList.remove('copied');
      if (label) label.textContent = 'Copy';
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
});
```

---

## 8. File Structure

```
src/
├── components/
│   ├── codeblocks/
│   │   ├── BaseCodeblock.astro      # Direct use with <Code />
│   │   └── CodeblockWrapper.astro   # Wraps pre-rendered HTML
│   ├── content/
│   │   └── ContentEnhancer.astro    # Combined code + mermaid wrapper
│   └── diagrams/
│       ├── MermaidDiagram.astro     # Direct mermaid component
│       └── MermaidWrapper.astro     # Mermaid wrapper for HTML
├── styles/
│   └── global.css                   # Shiki theme switching CSS
└── pages/
    └── changelog/
        └── [id].astro               # Example using ContentEnhancer
```

---

## 9. Integration Checklist

When adding codeblock support to an astro-knots site:

### Required

- [ ] Install `@shikijs/rehype` if using custom unified pipeline
- [ ] Add `shikiConfig` to `astro.config.mjs`
- [ ] Add Shiki theme-switching CSS to `global.css`
- [ ] Copy `BaseCodeblock.astro` and/or `CodeblockWrapper.astro`

### Optional

- [ ] Customize theme selection for site's color palette
- [ ] Adjust header height/styling to match site design
- [ ] Add language-specific icons or styling

---

## 10. Troubleshooting

### Code blocks have no colors

1. Check that Shiki is configured in `astro.config.mjs` or pipeline
2. Verify CSS theme-switching rules are loaded
3. Ensure `data-mode` attribute is set on a parent element

### Language not detected

The wrapper checks in order:
1. `code.dataset.language`
2. `pre.dataset.language`
3. `code.classList` for `language-*`

Ensure `addLanguageClass: true` is set in `rehypeShiki` options.

### Code blocks look wrong in light mode

Ensure you have the light mode overrides that keep code blocks dark:
```css
:global([data-mode="light"]) .codeblock-content {
  background: #1a1b26; /* Must stay dark */
}
```

If the background is white/light, the CSS isn't being applied correctly.

### Copy button doesn't work

Ensure the script runs after DOM is ready and that `navigator.clipboard` is available (requires HTTPS or localhost).

---

## 11. Reference Implementation

See `astro-knots/sites/dark-matter` for the complete implementation:

- `astro.config.mjs` - Shiki config
- `src/styles/global.css` - Theme switching CSS
- `src/components/codeblocks/` - Codeblock components
- `src/components/content/ContentEnhancer.astro` - Combined wrapper
- `src/components/diagrams/` - Mermaid components
- `src/pages/changelog/[id].astro` - Usage with unified pipeline + mermaid
- `changelog/2025-12-31_02.md` - Shiki implementation changelog
- `changelog/2025-12-31_03.md` - Mermaid integration changelog

---

## 12. Mermaid Diagram Integration

When using `rehypeShiki`, mermaid code blocks get syntax-highlighted as code, preventing Mermaid.js from rendering them as diagrams. The solution is a custom rehype plugin that extracts mermaid blocks BEFORE Shiki processes them.

### 12.1 The Problem

```markdown
```mermaid
graph TD
    A --> B
```
```

With just `rehypeShiki`, this becomes syntax-highlighted text instead of a diagram because Shiki converts it to colored HTML tokens.

### 12.2 Solution: rehypeMermaidPre Plugin

Create a custom rehype plugin that runs BEFORE `rehypeShiki`:

```typescript
import { visit } from 'unist-util-visit';

/**
 * Converts mermaid code blocks from:
 *   <pre><code class="language-mermaid">...</code></pre>
 * To:
 *   <pre class="mermaid">...</pre>
 *
 * This format won't match rehypeShiki's selector.
 */
function rehypeMermaidPre() {
  return (tree: any) => {
    visit(tree, 'element', (node: any) => {
      if (
        node.tagName === 'pre' &&
        node.children?.[0]?.tagName === 'code'
      ) {
        const codeNode = node.children[0];
        const classList = codeNode.properties?.className || [];

        const isMermaid = classList.some((c: string) =>
          c === 'language-mermaid' || c === 'mermaid'
        );

        if (isMermaid) {
          const mermaidCode = codeNode.children?.[0]?.value || '';
          node.properties = { className: ['mermaid'] };
          node.children = [{ type: 'text', value: mermaidCode }];
        }
      }
    });
  };
}
```

### 12.3 Updated Pipeline Order

The plugin order is CRITICAL:

```typescript
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeMermaidPre)  // BEFORE rehypeShiki!
  .use(rehypeShiki, { ... })
  .use(rehypeStringify, { allowDangerousHtml: true });
```

### 12.4 ContentEnhancer Component

The `ContentEnhancer` component handles BOTH code blocks AND mermaid diagrams:

```astro
<ContentEnhancer>
  <div set:html={htmlContent} />
</ContentEnhancer>
```

It loads Mermaid.js from CDN and renders diagrams client-side:

```javascript
import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs')
  .then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: { /* matter-theme colors */ },
    });
    mermaid.run({
      querySelector: '.content-enhanced pre.mermaid',
    });
  });
```

### 12.5 Mermaid Theme Variables

For matter-theme integration:

```javascript
themeVariables: {
  primaryColor: '#6643e2',
  primaryTextColor: '#F9FAFB',
  primaryBorderColor: '#9C85DF',
  lineColor: '#9C85DF',
  secondaryColor: '#1a1b26',
  tertiaryColor: '#0F0923',
  background: '#0F0923',
  mainBkg: '#1a1b26',
  nodeBorder: '#9C85DF',
  clusterBkg: '#1a1b26',
  clusterBorder: '#6643e2',
  titleColor: '#F9FAFB',
  edgeLabelBackground: '#1a1b26',
  textColor: '#F9FAFB',
}
```

### 12.6 Mermaid CSS

```css
.content-enhanced pre.mermaid {
  margin: 1.5rem 0;
  padding: 1.5rem;
  background: var(--color-surface, #111827);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg, 0.5rem);
  text-align: center;
}

/* Hide raw code while rendering */
.content-enhanced pre.mermaid:not([data-processed="true"]) {
  color: transparent;
  min-height: 100px;
}
```

### 12.7 Common Pitfall: Variable Naming Collision

Avoid naming functions the same as prop variables in Astro scripts:

**Bad:**
```javascript
<script define:vars={{ enhanceCodeblocks }}>
function enhanceCodeblocks() {
  if (!enhanceCodeblocks) return; // Always truthy (function ref)!
```

**Good:**
```javascript
<script define:vars={{ enhanceCodeblocks }}>
const shouldEnhance = enhanceCodeblocks;
function processCodeblocks() {
  if (!shouldEnhance) return; // Correct boolean check
```

---

## 13. Dependencies

```json
{
  "dependencies": {
    "@shikijs/rehype": "^3.20.0",
    "unist-util-visit": "^5.0.0"
  }
}
```

Astro's `<Code />` component uses Shiki internally, so no additional dependency needed for `BaseCodeblock.astro`.

Mermaid.js is loaded from CDN at runtime (no npm dependency).
