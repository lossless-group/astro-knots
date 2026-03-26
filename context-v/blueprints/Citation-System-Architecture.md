---
title: "Citation System Architecture"
lede: "A citation and reference management system for Astro sites using hex codes as stable identifiers that convert to sequential integers at render time."
date_created: 2025-11-15
date_modified: 2025-12-15
status: Draft
category: Blueprints
tags: [citations, markdown, content-rendering, hex-codes]
authors:
  - Michael Staton
---

# Citation System Architecture

## Overview

This document describes a citation and reference management system for Astro sites that need to display research-backed infographics, data visualizations, and content with inline citations. The system uses **hex codes** as stable citation identifiers that get converted to sequential integers at render time.

## Problem Statement

### Why Hex Codes Instead of Integers?

Traditional citation systems use sequential integers (`[1]`, `[2]`, `[3]`), but this approach breaks down when:

1. **Content is modular** - The same research content may appear across multiple pages or sites
2. **Citations are reused** - A single source may be cited in many different articles
3. **Content is updated** - Adding/removing citations shifts all subsequent numbers
4. **Multiple authors** - Different people working on content will create numbering conflicts

**Hex codes** (e.g., `[^alyqs4]`, `[^k9m6ww]`) provide:
- **Stability** - A citation keeps its identifier regardless of where it appears
- **Uniqueness** - No collision between citations across documents
- **Portability** - Copy/paste content between articles without renumbering
- **Traceability** - Easy to grep/search for a specific citation across the codebase

### The Conversion Challenge

While hex codes are ideal for content management, readers expect sequential integers (`[1]`, `[2]`, `[3]`) on a rendered page. The system must:

1. Parse all hex-code citations on a page
2. Assign sequential integers in order of first appearance
3. Render inline citations with the integer
4. Build a "Sources" section with full reference definitions

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CONTENT LAYER                                   │
├─────────────────────────────────────────────────────────────────────────-┤
│  Markdown/MDX files with hex-code citations:                             │
│                                                                          │
│  "Global aging is accelerating toward 2.1B people 60+ by 2050. [^1ucdcd]"│
│                                                                          │
│  [^1ucdcd]: 2025, Sep 21. [Population ageing](https://helpage.org/...)   │
└─────────────────────────────────────────────────────────────────────────-┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BUILD/RENDER LAYER                               │
├─────────────────────────────────────────────────────────────────────────┤
│  Astro component or remark plugin:                                       │
│  1. Extract all [^hexcode] references from page content                 │
│  2. Build citation map: { hexcode → { index, definition } }             │
│  3. Replace inline [^hexcode] with <Citation index={n} def={...} />     │
│  4. Generate <Sources citations={map} /> at page bottom                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          RENDER OUTPUT                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  "Global aging is accelerating toward 2.1B people 60+ by 2050.[1]"      │
│                                              ▲                           │
│                                              │ hover                     │
│                                    ┌─────────┴─────────┐                │
│                                    │ Population ageing │                │
│                                    │ HelpAge Int'l     │                │
│                                    │ [Visit Source →]  │                │
│                                    └───────────────────┘                │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│  Sources:                                                                │
│  [1] HelpAge International. "Population ageing: Navigating..."          │
│      Published: 2024-07-11 | https://helpage.org/news/...               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Citation Format Specification

### Inline Citation Syntax (in content)

```markdown
Some claim that needs backing.[^hexcode]
```

The hex code should be:
- 6 alphanumeric characters (lowercase)
- Generated deterministically from source URL or randomly assigned
- Unique within the content corpus

### Reference Definition Syntax (in content)

```markdown
[^hexcode]: YYYY, Mon DD. [Title](URL). Published: YYYY-MM-DD | Updated: YYYY-MM-DD
```

Example:
```markdown
[^alyqs4]: 2025, Nov 25. [Key Drivers of 2025 Health Care Cost Increases](https://parrottbenefitgroup.com/key-drivers-of-2025-health-care-cost-increases/). Published: 2024-11-22 | Updated: 2025-11-25
```

### Parsed Reference Object

```typescript
interface CitationReference {
  hexCode: string;           // e.g., "alyqs4"
  index?: number;            // Assigned at render time, e.g., 1
  title: string;             // "Key Drivers of 2025 Health Care Cost Increases"
  url: string;               // Full URL to source
  publishedDate?: string;    // ISO date string
  updatedDate?: string;      // ISO date string
  accessDate?: string;       // When the citation was captured
  source?: string;           // Domain or publication name (derived or explicit)
}
```

---

## Implementation Approaches

### Approach A: Remark/Rehype Plugin (Build Time)

Transform citations during markdown processing.

**Pros:**
- Works with standard markdown content collections
- No runtime JavaScript needed for basic functionality
- Integrates with existing Astro markdown pipeline

**Cons:**
- Less flexibility for dynamic content
- Popover interactivity requires additional client-side JS

```typescript
// remark-citations.ts
import { visit } from 'unist-util-visit';

export function remarkCitations() {
  return (tree: any, file: any) => {
    const citations = new Map<string, { index: number; definition: string }>();
    let citationIndex = 0;

    // First pass: collect all citation definitions
    visit(tree, 'footnoteDefinition', (node) => {
      const hexCode = node.identifier;
      if (!citations.has(hexCode)) {
        citations.set(hexCode, {
          index: ++citationIndex,
          definition: extractDefinitionText(node),
        });
      }
    });

    // Second pass: replace footnote references with citation components
    visit(tree, 'footnoteReference', (node, index, parent) => {
      const hexCode = node.identifier;
      const citation = citations.get(hexCode);
      if (citation) {
        // Replace with custom component or styled span
        parent.children[index] = {
          type: 'html',
          value: `<span class="citation" data-index="${citation.index}" data-hex="${hexCode}">[${citation.index}]</span>`,
        };
      }
    });

    // Attach citations to file data for Sources component
    file.data.citations = citations;
  };
}
```

### Approach B: Astro Component (Render Time)

Process citations in an Astro component that wraps content.

**Pros:**
- Full control over rendering
- Easy to add interactive features
- Works with any content source (not just markdown)

**Cons:**
- Requires passing content through component
- More complex setup

```astro
---
// CitedContent.astro
interface Props {
  content: string;
  citations: Record<string, CitationReference>;
}

const { content, citations } = Astro.props;

// Build index map from hex codes in order of appearance
const hexPattern = /\[\^([a-z0-9]{6})\]/g;
const matches = [...content.matchAll(hexPattern)];
const indexMap = new Map<string, number>();
let index = 0;

matches.forEach(match => {
  const hex = match[1];
  if (!indexMap.has(hex)) {
    indexMap.set(hex, ++index);
  }
});

// Replace hex codes with indexed citations
let processedContent = content;
indexMap.forEach((idx, hex) => {
  const regex = new RegExp(`\\[\\^${hex}\\]`, 'g');
  processedContent = processedContent.replace(
    regex,
    `<cite-inline data-index="${idx}" data-hex="${hex}">[${idx}]</cite-inline>`
  );
});
---

<div class="cited-content" set:html={processedContent} />

<script>
  // Client-side: Add hover popover functionality
  document.querySelectorAll('cite-inline').forEach(el => {
    el.addEventListener('mouseenter', showPopover);
    el.addEventListener('mouseleave', hidePopover);
  });
</script>
```

### Approach C: Content Collection Schema + Component

Define citations as structured data in content collections.

```typescript
// src/content/config.ts
import { z, defineCollection } from 'astro:content';

const citationSchema = z.object({
  hexCode: z.string().length(6),
  title: z.string(),
  url: z.string().url(),
  publishedDate: z.string().optional(),
  updatedDate: z.string().optional(),
  source: z.string().optional(),
});

const narratives = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    citations: z.array(citationSchema).optional(),
  }),
});
```

---

## UI Components

### InlineCitation Component

**IMPORTANT: Global Popover Pattern Required**

After extensive testing, we discovered that CSS-only popovers and per-instance popovers do NOT work reliably in Astro for the following reasons:

1. **`overflow: hidden` on parent containers** - Infographic sections often use `overflow: hidden` for visual effects, which clips absolutely-positioned popovers
2. **Astro's SSG model** - Component scripts are deduplicated and hoisted, causing scoping issues when multiple citations exist
3. **DOM structure in paragraphs** - `<div>` elements inside `<p>` tags cause browsers to auto-close the paragraph, breaking sibling relationships

**The solution: Global Popover Pattern**

- Store citation data in `data-*` attributes on the marker element
- Create ONE global popover element appended to `<body>`
- Use event delegation to detect hover on any `.citation-marker`
- Populate and position the global popover dynamically

```astro
---
// InlineCitation.astro
// Uses data attributes + global popover pattern for reliable cross-browser behavior

interface Props {
  index: number;
  hexCode: string;
  title: string;
  url: string;
  source?: string;
  publishedDate?: string;
}

const { index, hexCode, title, url, source, publishedDate } = Astro.props;
const displaySource = source || new URL(url).hostname.replace('www.', '');
---

<sup
  class="citation-marker"
  tabindex="0"
  role="button"
  data-citation-title={title}
  data-citation-source={displaySource}
  data-citation-url={url}
  data-citation-date={publishedDate || ''}
>
  [{index}]
</sup>

<style>
  .citation-marker {
    cursor: help;
    font-weight: 600;
    font-size: 0.75em;
    padding: 0 0.1em;
    border-radius: 2px;
    transition: all 0.2s ease;
    text-decoration: none;
  }

  .citation-marker:focus {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  /* Theme-aware styling via data-mode attribute on html/body */
  :global([data-mode="light"]) .citation-marker {
    color: var(--color-primary);
    background: rgba(108, 99, 255, 0.1);
  }
  :global([data-mode="dark"]) .citation-marker {
    color: var(--color-lilac);
    background: rgba(156, 133, 223, 0.15);
  }
</style>

<script>
  // Global citation popover system
  // Creates a single popover element that gets positioned and populated on hover

  function initCitationPopover() {
    // Only create the popover once
    if (document.getElementById('citation-popover-global')) return;

    // Create the global popover element (appended to body, escapes all overflow:hidden)
    const popover = document.createElement('div');
    popover.id = 'citation-popover-global';
    popover.className = 'citation-popover-global';
    popover.innerHTML = `
      <div class="popover-arrow"></div>
      <div class="popover-content">
        <div class="popover-title"></div>
        <div class="popover-source"></div>
        <div class="popover-date"></div>
        <a class="popover-link" target="_blank" rel="noopener noreferrer">
          <span>View Source</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      </div>
    `;

    // Inject styles for the global popover (see full implementation for theme support)
    const style = document.createElement('style');
    style.textContent = `
      .citation-popover-global {
        position: fixed;
        z-index: 99999;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity 0.15s ease, visibility 0.15s ease;
      }
      .citation-popover-global.is-visible {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
      }
      /* ... theme-specific styles ... */
    `;
    document.head.appendChild(style);
    document.body.appendChild(popover);

    // Get popover child elements for population
    const titleEl = popover.querySelector('.popover-title');
    const sourceEl = popover.querySelector('.popover-source');
    const dateEl = popover.querySelector('.popover-date');
    const linkEl = popover.querySelector('.popover-link');

    let hideTimeout = null;

    function showPopover(marker) {
      if (hideTimeout) clearTimeout(hideTimeout);

      // Populate from data attributes on the hovered marker
      titleEl.textContent = marker.dataset.citationTitle || '';
      sourceEl.textContent = marker.dataset.citationSource || '';
      dateEl.textContent = marker.dataset.citationDate || '';
      linkEl.href = marker.dataset.citationUrl || '#';

      // Position relative to marker using getBoundingClientRect()
      const rect = marker.getBoundingClientRect();
      popover.style.left = `${rect.left + rect.width / 2 - 150}px`; // Centered
      popover.style.top = `${rect.bottom + 8}px`; // Below marker
      popover.classList.add('is-visible');
    }

    function hidePopover() {
      hideTimeout = setTimeout(() => {
        popover.classList.remove('is-visible');
      }, 150);
    }

    // Event delegation - works for ALL citation markers on the page
    document.addEventListener('mouseenter', (e) => {
      const marker = e.target.closest('.citation-marker');
      if (marker) showPopover(marker);
    }, true);

    document.addEventListener('mouseleave', (e) => {
      const marker = e.target.closest('.citation-marker');
      if (marker) hidePopover();
    }, true);

    // Keep popover open when hovering over it
    popover.addEventListener('mouseenter', () => clearTimeout(hideTimeout));
    popover.addEventListener('mouseleave', hidePopover);
  }

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCitationPopover);
  } else {
    initCitationPopover();
  }
  document.addEventListener('astro:page-load', initCitationPopover);
</script>
```

### Why This Pattern Works

| Approach | Problem |
|----------|---------|
| CSS-only with `:hover` | Clipped by `overflow: hidden` on parent containers |
| Per-instance `<div>` popover | `<div>` inside `<p>` breaks DOM; Astro deduplicates scripts causing scope issues |
| `position: fixed` per-instance | Still requires JS for positioning; scoping issues persist |
| **Global popover (winner)** | Single element at body level; event delegation; data attributes carry citation info |

### Key Implementation Details

1. **Data attributes on markers** - Each `<sup>` carries its own citation data
2. **Single global popover** - Appended to `<body>`, completely outside any layout containers
3. **Event delegation** - `document.addEventListener` with `capture: true` catches all markers
4. **Dynamic population** - `showPopover()` reads data attributes and fills the popover content
5. **`position: fixed`** - Positioned relative to viewport using `getBoundingClientRect()`

### Sources Component

```astro
---
// Sources.astro
interface Citation {
  index: number;
  hexCode: string;
  title: string;
  url: string;
  publishedDate?: string;
  source?: string;
}

interface Props {
  citations: Citation[];
  title?: string;
}

const { citations, title = 'Sources' } = Astro.props;

// Sort by index
const sortedCitations = [...citations].sort((a, b) => a.index - b.index);
---

<section class="sources-section">
  <h2 class="sources-title">{title}</h2>
  <ol class="sources-list">
    {sortedCitations.map(citation => (
      <li class="source-item" id={`source-${citation.hexCode}`}>
        <span class="source-index">[{citation.index}]</span>
        <div class="source-content">
          <a href={citation.url} target="_blank" rel="noopener noreferrer" class="source-title">
            {citation.title}
          </a>
          {citation.source && (
            <span class="source-publication">— {citation.source}</span>
          )}
          {citation.publishedDate && (
            <span class="source-date">Published: {citation.publishedDate}</span>
          )}
        </div>
      </li>
    ))}
  </ol>
</section>

<style>
  .sources-section {
    margin-top: 4rem;
    padding-top: 2rem;
    border-top: 1px solid var(--color-border);
  }

  .sources-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    color: var(--color-foreground);
  }

  .sources-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .source-item {
    display: flex;
    gap: 0.75rem;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .source-index {
    flex-shrink: 0;
    font-weight: 600;
    color: var(--color-primary);
    min-width: 2rem;
  }

  .source-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .source-title {
    color: var(--color-foreground);
    text-decoration: none;
  }

  .source-title:hover {
    text-decoration: underline;
    color: var(--color-primary);
  }

  .source-publication {
    color: var(--color-muted-foreground);
    font-style: italic;
  }

  .source-date {
    color: var(--color-muted-foreground);
    font-size: 0.75rem;
  }
</style>
```

---

## Integration with Infographic Sections

For Astro components like `AgingPopulation.astro` or `TheAgingCrisis.astro`, citations can be embedded directly in the data:

```astro
---
// Example: data with citations
const demographicStats = [
  {
    stat: '2.1B',
    label: 'People 60+ by 2050',
    description: 'The UN projects the global population aged 60+ will roughly double.',
    citation: {
      hexCode: '1ucdcd',
      title: 'Population ageing: Navigating the demographic shift',
      url: 'https://www.helpage.org/news/population-ageing-navigating-the-demographic-shift/',
      source: 'HelpAge International',
      publishedDate: '2024-07-11',
    },
  },
  // ... more stats
];

// Build citation index map
const allCitations = demographicStats
  .filter(s => s.citation)
  .map(s => s.citation);

const citationMap = new Map();
allCitations.forEach((c, i) => {
  if (!citationMap.has(c.hexCode)) {
    citationMap.set(c.hexCode, { ...c, index: citationMap.size + 1 });
  }
});
---

<!-- In the template -->
{demographicStats.map(item => (
  <div class="stat-card">
    <span class="stat-number">{item.stat}</span>
    <p class="stat-description">
      {item.description}
      {item.citation && (
        <InlineCitation {...citationMap.get(item.citation.hexCode)} />
      )}
    </p>
  </div>
))}

<!-- At page bottom -->
<Sources citations={[...citationMap.values()]} />
```

---

## File Organization

```
src/
├── components/
│   └── citations/
│       ├── InlineCitation.astro
│       ├── Sources.astro
│       └── CitedContent.astro      # Wrapper for markdown with citations
├── lib/
│   └── citations/
│       ├── types.ts                # CitationReference interface
│       ├── parser.ts               # Parse [^hexcode] from content
│       └── indexer.ts              # Build sequential index map
├── plugins/
│   └── remark-citations.ts         # Optional remark plugin
└── content/
    └── citations/                  # Optional: shared citation definitions
        └── longevity-research.json # Reusable citation library
```

---

## Shared Citation Library (Optional)

For citations that appear across multiple pages/sites, maintain a central library:

```json
// src/content/citations/longevity-research.json
{
  "1ucdcd": {
    "title": "Population ageing: Navigating the demographic shift",
    "url": "https://www.helpage.org/news/population-ageing-navigating-the-demographic-shift/",
    "source": "HelpAge International",
    "publishedDate": "2024-07-11"
  },
  "alyqs4": {
    "title": "Key Drivers of 2025 Health Care Cost Increases",
    "url": "https://parrottbenefitgroup.com/key-drivers-of-2025-health-care-cost-increases/",
    "source": "Parrott Benefit Group",
    "publishedDate": "2024-11-22"
  }
}
```

Usage:
```astro
---
import citationLibrary from '@content/citations/longevity-research.json';

const getCitation = (hexCode: string) => citationLibrary[hexCode];
---
```

---

## Future Enhancements

1. **Citation Validation** - Build-time check that all `[^hexcode]` references have definitions
2. **Duplicate Detection** - Warn when same URL appears with different hex codes
3. **Auto-generation** - Generate hex codes from URL hash automatically
4. **Cross-page Deduplication** - Same source gets same index when used on same page
5. **Export Formats** - Generate BibTeX, RIS, or other citation formats
6. **Link Checking** - Verify source URLs are still accessible at build time

---

## Related Documents

- `Maintain-Extended-Markdown-Render-Pipeline.md` - General markdown processing
- `Managing-Complex-Markdown-Content-at-Build-Time.md` - Content collection patterns
- `Slides-System-for-Astro-and-Markdown.md` - Slide deck integration

---

## Changelog

| Date | Change |
|------|--------|
| 2025-12-17 | Initial architecture document |
| 2025-12-17 | **Major update**: Documented Global Popover Pattern after extensive debugging. CSS-only and per-instance approaches fail due to: (1) `overflow: hidden` clipping, (2) Astro SSG script deduplication, (3) `<div>` inside `<p>` DOM issues. Solution: single global popover at body level with data attributes and event delegation. |
