---
title: "Remark-Citations: A Unified Plugin for Hex-Code Footnote Management"
lede: "A standalone remark plugin that transforms footnote identifiers (hex codes, numeric, or mixed) into sequentially-numbered citations with structured metadata parsing, designed for the unified/remark ecosystem and bundled into @lossless-group/lfm."
date_authored_initial_draft: 2026-04-22
date_authored_current_draft: 2026-04-22
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-04-22
at_semantic_version: 0.0.0.1
status: Draft
augmented_with: Claude Code (Opus 4.6)
category: Specification
tags: [Citations, Remark, Unified, Footnotes, Hex-Codes, Markdown, Open-Source]
authors:
  - Michael Staton
  - AI Labs Team
image_prompt: A flow diagram showing scattered hex-code footnote markers in a markdown document being collected, renumbered sequentially, and rendered as clean numbered citations with a Sources section at the bottom — all flowing through a remark plugin pipeline.
date_created: 2026-04-22
date_modified: 2026-04-22
---

# Remark-Citations: A Unified Plugin for Hex-Code Footnote Management

**Status**: Draft (v0.0.1)
**Date**: 2026-04-22
**Author**: Michael Staton

---

## 1. Problem

Footnotes in markdown use sequential integers by default: `[^1]`, `[^2]`, `[^3]`. This works for short documents but breaks down at scale:

| Scenario | What Breaks |
|----------|-------------|
| **Insert a citation mid-document** | Every subsequent number shifts. In a 50-page memo with 40 citations, inserting one at position 12 means manually renumbering 28 references. |
| **Multiple authors on the same doc** | Two people both add `[^7]` — merge conflict, broken references |
| **Reuse content across documents** | Copy a paragraph with `[^3]` into another doc that already has a `[^3]` — collision |
| **AI-assisted authoring** | LLMs generating content with `[^1]` have no way to know what numbers are already taken in the document |
| **Long-lived documents** | A research memo updated over months accumulates citation gaps, duplicates, and misnumbered references |

The GFM footnote spec (`remark-gfm`) parses `[^label]` syntax into `footnoteReference` and `footnoteDefinition` MDAST nodes, but it does **no renumbering, no structured metadata parsing, and no citation-specific semantics**. It treats footnotes as opaque text labels.

---

## 2. Goal

Build **`remark-citations`** — a standalone remark plugin that:

1. **Accepts any footnote identifier** — hex codes, numeric, or mixed
2. **Renumbers sequentially** by order of first appearance in the document
3. **Parses structured definitions** into typed metadata (title, URL, source, date)
4. **Attaches a citation map** to the MDAST for renderers to consume
5. **Validates** that every inline reference has a matching definition (build-time warning)
6. **Optionally auto-assigns hex codes** to numeric footnotes for stability

The plugin sits on top of `remark-gfm`'s footnote parsing (it consumes the existing MDAST nodes) and enriches them.

---

## 3. Why This Doesn't Exist Yet

The unified/remark ecosystem has:

| Package | What It Does | What It Doesn't Do |
|---------|-------------|-------------------|
| `remark-gfm` | Parses `[^label]` into MDAST nodes | No renumbering, no metadata parsing |
| `remark-footnotes` | Deprecated, folded into remark-gfm | — |
| `remark-rehype` | Converts footnotes to HTML `<sup>` + `<section>` | Opaque — no structured citation data |
| `rehype-citation` | Processes CSL-JSON / BibTeX bibliographies | Requires external bibliography files, academic tooling |

The gap: **there's no plugin for content teams that want stable identifiers, sequential rendering, and structured metadata without adopting academic bibliography tooling.** Writers using Obsidian, Notion, or plain markdown have no good answer for managing citations at scale.

---

## 4. Architecture

### 4.1 Pipeline Position

```
                    remark-parse
                        │
                        ▼
                    remark-gfm
                   (parses [^label] into
                    footnoteReference +
                    footnoteDefinition nodes)
                        │
                        ▼
               ┌─────────────────┐
               │ remark-citations │  ◄── THIS PLUGIN
               │                  │
               │ 1. Walk tree     │
               │ 2. Collect refs  │
               │ 3. Renumber      │
               │ 4. Parse defs    │
               │ 5. Attach map    │
               └─────────────────┘
                        │
                        ▼
                  Rendering layer
               (AstroMarkdown, rehype,
                or any MDAST consumer)
```

The plugin runs **after** `remark-gfm` (which creates the footnote nodes) and **before** any rendering step. It modifies the existing MDAST nodes in place and attaches metadata to the tree's `data` property.

### 4.2 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  INPUT: MDAST with footnoteReference + footnoteDefinition   │
│                                                             │
│  paragraph:                                                 │
│    text: "Global aging is accelerating."                    │
│    footnoteReference: { identifier: "1ucdcd" }              │
│                                                             │
│  paragraph:                                                 │
│    text: "Healthcare costs rising."                         │
│    footnoteReference: { identifier: "alyqs4" }              │
│                                                             │
│  footnoteDefinition: { identifier: "alyqs4",               │
│    children: "2025. [Key Drivers](https://...)." }          │
│                                                             │
│  footnoteDefinition: { identifier: "1ucdcd",               │
│    children: "2024. [Population ageing](https://...)." }    │
└─────────────────────────────────────────────────────────────┘
                            │
                     remark-citations
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  OUTPUT: Same MDAST, enriched                               │
│                                                             │
│  footnoteReference nodes gain:                              │
│    data.citationIndex: 1 (or 2, 3...)                       │
│    data.citationHex: "1ucdcd"                               │
│                                                             │
│  footnoteDefinition nodes gain:                             │
│    data.citationIndex: 1                                    │
│    data.citationMeta: {                                     │
│      title: "Population ageing",                            │
│      url: "https://helpage.org/...",                         │
│      source: "helpage.org",                                 │
│      publishedDate: "2024-07-11"                            │
│    }                                                        │
│                                                             │
│  tree.data.citations: Map<string, Citation> (full map)      │
│  tree.data.citationOrder: string[] (hex codes in order)     │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Renumbering Algorithm

```
WALK the MDAST depth-first (same order as document reading order)

FOR each node:
  IF node.type === 'footnoteReference':
    hex = node.identifier
    IF hex NOT in seen:
      seen[hex] = ++counter
    node.data.citationIndex = seen[hex]

  // footnoteDefinitions are collected but not renumbered by position
  // — they get their index from the FIRST reference to them

AFTER walk:
  FOR each footnoteDefinition:
    hex = node.identifier
    IF hex in seen:
      node.data.citationIndex = seen[hex]
    ELSE:
      WARN: "Definition [^{hex}] has no inline reference"

  FOR each hex in seen:
    IF hex NOT in definitions:
      WARN: "Reference [^{hex}] has no definition"
```

Key property: **the definition's position in the document doesn't matter.** All definitions could be at the bottom (common), at the top (rare), or scattered throughout (messy but handled). The sequential number is always determined by where the `[^ref]` first appears in the reading flow.

---

## 5. Identifier Modes

### 5.1 Hex-Code Mode (default)

Authors use hex codes as identifiers. The plugin renumbers to sequential integers at build time.

```markdown
Global aging is accelerating.[^1ucdcd]
Healthcare costs are rising.[^alyqs4]

[^1ucdcd]: 2024. [Population ageing](https://helpage.org/...). Published: 2024-07-11
[^alyqs4]: 2025. [Key Drivers of Cost](https://parrottbenefitgroup.com/...). Published: 2024-11-22
```

Renders as:

```
Global aging is accelerating.[1]
Healthcare costs are rising.[2]

─────────────────────────────
Sources:
[1] Population ageing. helpage.org. Published: 2024-07-11
[2] Key Drivers of Cost. parrottbenefitgroup.com. Published: 2024-11-22
```

### 5.2 Numeric Mode

Authors use traditional numeric identifiers. The plugin auto-assigns hex codes internally for stability and renumbers by appearance order (so `[^3]` appearing before `[^1]` renders as `[1]` and `[2]`).

```markdown
Healthcare costs are rising.[^2]
Global aging is accelerating.[^1]

[^1]: 2024. [Population ageing](https://helpage.org/...).
[^2]: 2025. [Key Drivers of Cost](https://parrottbenefitgroup.com/...).
```

Renders as:

```
Healthcare costs are rising.[1]    ← was [^2], renumbered to [1] (appears first)
Global aging is accelerating.[2]   ← was [^1], renumbered to [2] (appears second)
```

### 5.3 Mixed Mode

Both hex codes and numeric identifiers in the same document. The plugin handles both without conflict.

```markdown
Some claim.[^1]
Another claim.[^a1b2c3]
A third claim.[^2]

[^1]: First source.
[^a1b2c3]: Second source.
[^2]: Third source.
```

All renumbered `[1]`, `[2]`, `[3]` by order of first appearance.

---

## 6. Structured Definition Parsing

### 6.1 Definition Format

The plugin parses a structured citation format from footnote definition text:

```
[^hexcode]: YYYY. [Title](URL). Published: YYYY-MM-DD
[^hexcode]: YYYY, Mon DD. [Title](URL). Published: YYYY-MM-DD | Updated: YYYY-MM-DD
[^hexcode]: [Title](URL). Published: YYYY-MM-DD
[^hexcode]: Plain text definition (no structured parsing — treated as raw text)
```

### 6.2 Parsed Citation Object

```typescript
interface Citation {
  /** The original identifier from the markdown (hex code or number) */
  identifier: string;
  
  /** Auto-assigned hex code (if identifier was numeric) */
  hex: string;
  
  /** Sequential index assigned by order of first appearance */
  index: number;
  
  /** Parsed from [Title](URL) in the definition */
  title?: string;
  
  /** Parsed from [Title](URL) in the definition */
  url?: string;
  
  /** Domain extracted from URL, or explicit source name */
  source?: string;
  
  /** Parsed from "Published: YYYY-MM-DD" */
  publishedDate?: string;
  
  /** Parsed from "Updated: YYYY-MM-DD" */
  updatedDate?: string;
  
  /** The year prefix if present (e.g., "2024" or "2025, Nov 25") */
  accessDate?: string;
  
  /** Raw definition text (always available, even if structured parsing fails) */
  raw: string;
  
  /** Whether structured parsing succeeded */
  parsed: boolean;
}
```

### 6.3 Parsing Strategy

```
INPUT: "2025, Nov 25. [Key Drivers of 2025 Health Care Cost Increases](https://parrottbenefitgroup.com/key-drivers/). Published: 2024-11-22 | Updated: 2025-11-25"

STEP 1 — Extract year/date prefix:
  Match: /^(\d{4}(?:,\s*\w+\s+\d{1,2})?)\.\s*/
  Result: accessDate = "2025, Nov 25"
  Remaining: "[Key Drivers of 2025 Health Care Cost Increases](https://parrottbenefitgroup.com/key-drivers/). Published: 2024-11-22 | Updated: 2025-11-25"

STEP 2 — Extract [Title](URL):
  Match: /\[([^\]]+)\]\(([^)]+)\)/
  Result: title = "Key Drivers of 2025 Health Care Cost Increases"
          url = "https://parrottbenefitgroup.com/key-drivers/"
          source = "parrottbenefitgroup.com" (derived from URL hostname)

STEP 3 — Extract metadata suffixes:
  Match: /Published:\s*([\d-]+)/
  Result: publishedDate = "2024-11-22"
  
  Match: /Updated:\s*([\d-]+)/
  Result: updatedDate = "2025-11-25"

OUTPUT: Citation {
  title: "Key Drivers of 2025 Health Care Cost Increases",
  url: "https://parrottbenefitgroup.com/key-drivers/",
  source: "parrottbenefitgroup.com",
  publishedDate: "2024-11-22",
  updatedDate: "2025-11-25",
  accessDate: "2025, Nov 25",
  raw: "2025, Nov 25. [Key Drivers...](https://...). Published: 2024-11-22 | Updated: 2025-11-25",
  parsed: true,
}
```

If any step fails, the plugin falls back gracefully: `parsed: false`, `raw` contains the full definition text, and the renderer can display it as-is.

---

## 7. Integration with Image Directives

### 7.1 The Problem

The `::image` directive's `source` and `caption` attributes are opaque strings — the remark pipeline never sees them as markdown. Footnote references inside attributes (`caption="Market data[^abc123]"`) won't participate in the document-wide numbering pass.

### 7.2 Solution: Container Directive for Rich Captions

Use the container directive form (`:::image`) when captions need inline citations:

```markdown
:::image{src="/images/chart.png" float="right" source="Goldman Sachs" source-ref="def456"}
GLP-1 market projection showing $130B addressable market by 2030.[^abc123]
:::
```

- The body between `:::` fences is the caption — parsed as regular markdown, including footnotes
- `source-ref="def456"` links the source attribution to a footnote definition, participating in the numbering system
- The leaf directive form (`::image{caption="plain text"}`) still works for captions without citations

### 7.3 Source-Ref Processing

When `remark-citations` encounters a directive node with a `source-ref` attribute:

1. Treat it as an implicit footnote reference at that position in the document
2. Include it in the sequential numbering
3. Attach `data.citationIndex` to the directive node
4. The renderer displays the source name with a superscript citation number

```
┌──────────────────────────────────┐
│ [2] Source: Goldman Sachs        │  ← source-ref="def456" became [2]
├──────────────────────────────────┤
│                                  │
│            [IMAGE]               │
│                                  │
├──────────────────────────────────┤
│ GLP-1 projection showing $130B  │
│ addressable market.[1]           │  ← [^abc123] in caption became [1]
└──────────────────────────────────┘
```

---

## 8. Configuration

```typescript
import remarkCitations from 'remark-citations';

// Default — hex-code mode, structured parsing, validation warnings
remarkCitations()

// Full options
remarkCitations({
  // Identifier handling
  // 'hex'     — expect hex codes, warn on numeric (default)
  // 'numeric' — accept numeric, auto-assign hex internally
  // 'mixed'   — accept both without warnings
  identifiers: 'mixed',
  
  // Length of auto-generated hex codes (for numeric → hex conversion)
  hexLength: 6,
  
  // Parse structured definitions into typed Citation objects
  structuredDefinitions: true,
  
  // Build-time validation
  validate: {
    // Warn when a [^ref] has no matching definition
    orphanReferences: true,
    
    // Warn when a definition has no matching [^ref]
    unusedDefinitions: true,
    
    // Warn when the same URL appears in multiple definitions
    duplicateUrls: false,
  },
  
  // Process source-ref attributes on directive nodes
  directiveSourceRefs: true,
})
```

---

## 9. MDAST Output

### 9.1 Enriched footnoteReference Node

```typescript
// Before remark-citations:
{
  type: 'footnoteReference',
  identifier: 'a1b2c3',
  label: 'a1b2c3',
}

// After remark-citations:
{
  type: 'footnoteReference',
  identifier: 'a1b2c3',
  label: 'a1b2c3',
  data: {
    citationIndex: 3,
    citationHex: 'a1b2c3',
  },
}
```

### 9.2 Enriched footnoteDefinition Node

```typescript
// Before remark-citations:
{
  type: 'footnoteDefinition',
  identifier: 'a1b2c3',
  children: [{ type: 'paragraph', children: [{ type: 'text', value: '2024. [Title](https://...). Published: 2024-07-11' }] }],
}

// After remark-citations:
{
  type: 'footnoteDefinition',
  identifier: 'a1b2c3',
  children: [...],  // unchanged
  data: {
    citationIndex: 3,
    citationHex: 'a1b2c3',
    citationMeta: {
      identifier: 'a1b2c3',
      hex: 'a1b2c3',
      index: 3,
      title: 'Title',
      url: 'https://...',
      source: 'example.com',
      publishedDate: '2024-07-11',
      raw: '2024. [Title](https://...). Published: 2024-07-11',
      parsed: true,
    },
  },
}
```

### 9.3 Tree-Level Citation Map

```typescript
// Attached to tree.data after the plugin runs:
tree.data.citations = {
  // Full map: hex → Citation
  map: new Map([
    ['1ucdcd', { identifier: '1ucdcd', hex: '1ucdcd', index: 1, title: '...', ... }],
    ['alyqs4', { identifier: 'alyqs4', hex: 'alyqs4', index: 2, title: '...', ... }],
  ]),
  
  // Ordered list (by index) for rendering the Sources section
  ordered: [
    { identifier: '1ucdcd', hex: '1ucdcd', index: 1, title: '...', ... },
    { identifier: 'alyqs4', hex: 'alyqs4', index: 2, title: '...', ... },
  ],
  
  // Validation results
  warnings: [
    // { type: 'orphan-reference', identifier: 'xyz789', message: '...' },
  ],
}
```

---

## 10. Rendering Contract

The plugin enriches the MDAST but does **not** produce HTML. Rendering is the consumer's responsibility. The contract:

### 10.1 For Inline Citations

The renderer should look for `footnoteReference` nodes and read `node.data.citationIndex` to get the display number.

```
footnoteReference node
  ├── node.identifier        → original hex/label (for linking to definition)
  ├── node.data.citationIndex → sequential display number (1, 2, 3...)
  └── node.data.citationHex   → stable hex identifier
```

Render as: superscript `[n]` with hover behavior, linking to `#source-{hex}`.

### 10.2 For the Sources Section

The renderer should read `tree.data.citations.ordered` and render a numbered list at the bottom of the document.

```
tree.data.citations.ordered
  └── Citation[]
        ├── .index         → display number
        ├── .title         → linked text
        ├── .url           → link href
        ├── .source        → publication/domain name
        ├── .publishedDate → formatted date
        └── .raw           → fallback if parsing failed
```

### 10.3 For Image Source-Refs

Directive nodes with `source-ref` will have `node.data.citationIndex` attached. The renderer should display the source name with the superscript citation number.

---

## 11. Package Distribution

### 11.1 Standalone Package: `remark-citations`

Published to npm as a community remark plugin. No scope — available to anyone.

```bash
pnpm add remark-citations
```

```typescript
import remarkCitations from 'remark-citations';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { unified } from 'unified';

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)       // must come before remark-citations
  .use(remarkCitations, { identifiers: 'mixed' });

const tree = processor.parse(markdown);
const result = await processor.run(tree);
// result.data.citations has the full citation map
```

### 11.2 Bundled in `@lossless-group/lfm`

The LFM preset includes `remark-citations` as part of its pipeline:

```typescript
import { parseMarkdown } from '@lossless-group/lfm';

const tree = await parseMarkdown(content);
// tree.data.citations is automatically populated
```

### 11.3 Listing in the Unified Ecosystem

Submit to the [remark plugin list](https://github.com/remarkjs/remark/blob/main/doc/plugins.md) after initial release. The plugin follows unified conventions:

- Pure ESM
- Returns a transformer function
- Attaches data to `tree.data` (standard unified pattern)
- Works with any MDAST consumer (rehype, Astro, custom renderers)

---

## 12. Implementation Plan

### Phase 1: Core Plugin + mpstaton-site Integration

1. **Build `remark-citations` in `packages/lfm/src/plugins/`**
   - Tree walker that collects `footnoteReference` nodes in document order
   - Sequential index assignment by first-appearance
   - Structured definition parser (title, URL, source, dates)
   - Attach citation data to nodes and `tree.data`
   - Validation warnings for orphan refs and unused definitions

2. **Wire into the LFM preset** (`packages/lfm/src/preset.ts`)
   - Add `remarkCitations` after `remarkGfm` and `remarkCallouts`
   - Expose configuration via `RemarkLfmOptions`

3. **Add rendering to mpstaton-site's `AstroMarkdown.astro`**
   - Handle `footnoteReference` → superscript `[n]` with hover popover
   - Suppress `footnoteDefinition` from inline rendering
   - Build `Sources.astro` component consuming `tree.data.citations.ordered`
   - Wire Sources into the `[...slug].astro` page template

4. **Test with real content** on mpstaton-site
   - Add citations to the test markdown files in `from-the-rabbit-hole/`
   - Verify renumbering, structured parsing, and Sources rendering

### Phase 2: Image Citation Integration

5. **Add `source-ref` processing** to `remark-citations`
   - Scan directive nodes for `source-ref` attributes
   - Include them in the document-wide numbering pass
   - Attach `citationIndex` to directive nodes

6. **Update `MarkdownImage.astro`** to render source-ref citations
   - Display superscript number next to source name
   - Link to the Sources section

7. **Support container directive `:::image`** for rich captions
   - Caption body parsed as markdown (footnotes work naturally)
   - Update `AstroMarkdown.astro` to handle `containerDirective` with `name === "image"`

### Phase 3: Standalone Package Extraction

8. **Extract `remark-citations` to its own repo**
   - Own package.json, README, test suite
   - Publish to npm (no scope)
   - Submit to unified plugin list

9. **Re-export from `@lossless-group/lfm`**
   - Add as a dependency, re-export for convenience
   - Bump LFM version

---

## 13. Test Cases

### 13.1 Basic Renumbering

```markdown
INPUT:
First claim.[^xyz789]
Second claim.[^abc123]

[^abc123]: Source A.
[^xyz789]: Source B.

EXPECTED:
- [^xyz789] renders as [1] (appears first)
- [^abc123] renders as [2] (appears second)
- Sources section: [1] Source B. [2] Source A.
```

### 13.2 Duplicate References

```markdown
INPUT:
Claim A.[^abc123]
Claim B.[^xyz789]
Claim C references A again.[^abc123]

EXPECTED:
- First [^abc123] renders as [1]
- [^xyz789] renders as [2]
- Second [^abc123] renders as [1] (same source, same number)
```

### 13.3 Structured Definition Parsing

```markdown
INPUT:
[^a1b2c3]: 2025, Nov 25. [Key Drivers of Cost](https://example.com/article). Published: 2024-11-22 | Updated: 2025-11-25

EXPECTED Citation object:
  title: "Key Drivers of Cost"
  url: "https://example.com/article"
  source: "example.com"
  accessDate: "2025, Nov 25"
  publishedDate: "2024-11-22"
  updatedDate: "2025-11-25"
  parsed: true
```

### 13.4 Plain Text Definition Fallback

```markdown
INPUT:
[^simple]: Just a plain text note without any structured format.

EXPECTED Citation object:
  title: undefined
  url: undefined
  raw: "Just a plain text note without any structured format."
  parsed: false
```

### 13.5 Orphan Reference Warning

```markdown
INPUT:
Some claim.[^nonexistent]

EXPECTED:
- Warning: "Reference [^nonexistent] has no matching definition"
- Still renders as [1] (graceful degradation)
```

### 13.6 Mixed Identifiers

```markdown
INPUT:
Claim.[^1]
Another.[^a1b2c3]
Third.[^2]

[^1]: Source one.
[^a1b2c3]: Source two.
[^2]: Source three.

EXPECTED (identifiers: 'mixed'):
- [^1] → [1], [^a1b2c3] → [2], [^2] → [3]
- No warnings about mixing styles
```

### 13.7 Image Source-Ref Integration

```markdown
INPUT:
Some text.[^abc123]

:::image{src="/img/chart.png" source="Goldman Sachs" source-ref="def456"}
Market projection data.[^ghi789]
:::

More text.[^jkl012]

[^abc123]: Source A.
[^def456]: Goldman Sachs Research, 2025.
[^ghi789]: Chart methodology.
[^jkl012]: Source D.

EXPECTED:
- [^abc123] → [1]
- source-ref="def456" → [2] (on the source attribution line)
- [^ghi789] → [3] (inside the caption)
- [^jkl012] → [4]
```

---

## 14. Prior Art and Differentiation

| Tool | Approach | Limitation |
|------|----------|------------|
| `remark-gfm` | Parses `[^label]` to MDAST nodes | No renumbering, no metadata |
| `rehype-citation` | CSL-JSON / BibTeX bibliographies | Requires academic tooling, external files |
| Pandoc | `[@citekey]` with `.bib` files | Different syntax, requires Pandoc ecosystem |
| Obsidian | Inline footnotes with auto-numbering | Editor-only — no build-time API, no metadata parsing |
| Zettlr | Pandoc-style citations | Tied to Zettlr editor |

**`remark-citations` fills the gap**: stable identifiers + sequential rendering + structured metadata + build-time validation, all within the standard remark pipeline. No external bibliography files, no academic tooling, no editor lock-in.

---

## 15. Open Questions

1. **Should the plugin strip `footnoteDefinition` nodes from the tree after processing?** If the renderer is expected to build a Sources section from `tree.data.citations`, leaving the definition nodes in the tree risks double-rendering. Current lean: yes, remove them — the structured data in `tree.data` is the canonical source.

2. **Should the citation map be serializable?** If sites want to build a cross-document citation index (the "site-wide reference library" aspiration), the citation map needs to be JSON-serializable so it can be aggregated across pages at build time.

3. **Hover popover architecture**: The Citation-System-Architecture blueprint specifies a global popover pattern (single DOM element at body level, event delegation). Should `remark-citations` include a recommended popover implementation, or is that purely the renderer's concern? Current lean: renderer's concern — the plugin only provides the data.

4. **Container directive body as caption**: When `:::image` has a body, should `remark-citations` automatically treat footnotes in that body as caption-scoped, or should they participate in the full document numbering? Current lean: full document numbering — captions are part of the document's citation flow, same as body text.
