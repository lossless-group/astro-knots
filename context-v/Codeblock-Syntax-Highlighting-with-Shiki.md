# Codeblock Syntax Highlighting with Shiki (Astro-Knots Pattern)

This blueprint captures how to implement syntax-highlighted code blocks across astro-knots sites using Shiki with dual-theme support (light/dark modes) and reusable wrapper components.

Reference implementation: `astro-knots/sites/dark-matter`

---

## 1. Goals

- **Syntax highlighting** for all code blocks using Shiki
- **Dual-theme support**: Different color schemes for light and dark modes
- **Consistent UX**: Compact header with language label and copy button
- **Flexible integration**: Works with both Astro's built-in markdown and custom unified/remark pipelines
- **Theme-aware**: Colors adapt to the site's theme system via CSS variables

---

## 2. Architecture Overview

The system has three layers:

```
┌─────────────────────────────────────────────────────────────┐
│  1. Shiki Configuration (astro.config.mjs or rehypeShiki)   │
│     - Theme selection (tokyo-night, github-light, etc.)     │
│     - Language class output                                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  2. CSS Theme Switching (global.css)                        │
│     - Maps data-mode to Shiki CSS variables                 │
│     - Base styling for pre.shiki elements                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Component Layer                                         │
│     - BaseCodeblock.astro: Direct use with <Code />         │
│     - CodeblockWrapper.astro: Enhances pre-rendered HTML    │
└─────────────────────────────────────────────────────────────┘
```

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
│   └── codeblocks/
│       ├── BaseCodeblock.astro      # Direct use with <Code />
│       └── CodeblockWrapper.astro   # Wraps pre-rendered HTML
├── styles/
│   └── global.css                   # Shiki theme switching CSS
└── pages/
    └── changelog/
        └── [id].astro               # Example using CodeblockWrapper
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

### Colors wrong for current mode

Check that the CSS selectors match your theme attribute structure:
```css
/* Adjust selector to match your theme system */
[data-theme="your-theme"][data-mode="dark"] .shiki { ... }
```

### Copy button doesn't work

Ensure the script runs after DOM is ready and that `navigator.clipboard` is available (requires HTTPS or localhost).

---

## 11. Reference Implementation

See `astro-knots/sites/dark-matter` for the complete implementation:

- `astro.config.mjs` - Shiki config
- `src/styles/global.css` - Theme switching CSS
- `src/components/codeblocks/` - Both components
- `src/pages/changelog/[id].astro` - Usage with unified pipeline
- `changelog/2025-12-31_02.md` - Detailed changelog

---

## 12. Dependencies

```json
{
  "dependencies": {
    "@shikijs/rehype": "^3.20.0"
  }
}
```

Astro's `<Code />` component uses Shiki internally, so no additional dependency needed for `BaseCodeblock.astro`.
