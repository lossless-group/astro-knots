---
date_created: 2025-12-10
publish: false
title: "Maintain an Extended Markdown Render Pipeline for Astro-Knots"
slug: maintain-extended-markdown-render-pipeline
at_semantic_version: 0.0.0.1
authors:
  - Michael Staton
augmented_with: "Windsurf Cascade on GPT-5.1"
tags: [Astro-Knots, Markdown, Extended-Markdown, Render-Pipeline]
---

# Maintain an Extended Markdown Render Pipeline for Astro-Knots

This document is a **simplified, Astro-Knots–specific** version of the broader
Lossless markdown blueprint. It focuses on what we need to:

- Render **extended markdown** in Astro-Knots sites.
- Start with **Hypernova** and **Dark-Matter** as first adopters.
- Keep the design **opinionated but lightweight**, so we can grow into
  more advanced features later.

---

## 1. Goals and Scope

- **Primary goal**: Have a consistent, shareable pipeline so any Astro-Knots
  site can:
  - Render normal markdown.
  - Support a **small but powerful set of extended markdown features**.
  - Add new extensions safely over time.

- **Initial target sites**:
  - Hypernova.
  - Dark-Matter.

- **Out of scope for v1** (can be added later):
  - Full Lossless feature set (complex galleries, portfolio directories, slides, etc.).
  - Deep Obsidian-style backlink systems.

We copy the **architecture pattern** from Lossless, but only implement the pieces we need right now.

---

## 2. High-Level Architecture

The architecture is intentionally layered:

1. **Content collections** 
   - Some collections get their own config.ts files to prevent an overwhelming Astro `content.config.ts`.  Case by case basis.
   - Provide `body` (markdown) + `data` (frontmatter).

2. **Layout-level markdown processing** (`MarkdownArticle.astro`)
   - Uses `unified` + remark plugins to produce an **MDAST** tree with extended nodes (directives, TOC, etc.).

3. **Page-level layout** (`MarkdownArticleOnPage.astro`)
   - Handles top-level layout (title, metadata, optional TOC).
   - Strips the TOC node out of the MDAST, passes the rest to the renderer.

4. **Core renderer** (`AstroMarkdown.astro`)
   - Recursively walks the MDAST and renders:
     - Standard markdown nodes.
     - A **limited, well-defined set of extended markdown nodes**.

5. **Simple renderer** (optional, later)
   - A utility to render markdown → HTML + plain text without the fullAstro component mapping (for previews, emails, etc.).

This mirrors the Lossless pipeline, but is scoped to Astro-Knots needs.

---

## 3. Content Locations for Astro-Knots

- **Per-site wiring (`src/content.config.ts`)**:
  - Each site (Hypernova, Dark-Matter) defines collections that may point into shared `/content` folders, or may point into site-local folders.
  - Use a helper like `resolveContentPath(relativePath)` that:
    - Reads a `CONTENT_BASE_PATH` env.
    - Joins it with a relative path (e.g. `lost-in-public/blueprints`).
    - Returns a `file://` URL usable by Astro content collections.


We keep this flexible so future sites can mix:

- External shared content (monorepo).
- Site-local content.

---

## 4. Astro Global Markdown Configuration (Per Site)

For each Astro-Knots site (Hypernova, Dark-Matter), we configure
`astro.config.mjs` with a **thin global markdown layer**.

- **Location**: `sites/<site-name>/astro.config.mjs` → `markdown` block.

- **Global remark**
  - For v1, keep this **empty** or minimal:
    - `remarkPlugins: []`
  - All extended behavior lives in the layout-level pipeline.

- **Global rehype**
  - Recommended plugins:
    - `rehypeRaw`:
      - Allows raw HTML inside markdown.
      - Required if authors embed HTML snippets in content.
    - `rehypeAutolinkHeadings`:
      - Appends anchor links to headings.
      - Gives consistent linkable headings across all sites.
    - `rehypeMermaid` (optional):
      - If we want mermaid diagrams in markdown content.

- **Syntax highlighting**
  - `syntaxHighlight: false` (disable Astro-built-in Shiki).
  - We will handle code highlighting through our own `CodeBlock.astro` component in the extended markdown renderer.

**Takeaway:** global config handles **HTML safety**, **heading anchors**, and optional **mermaid**. All semantic markdown/extended-markdown behavior lives in Astro-Knots layout + renderer components.

---

## 5. Layout-Level Markdown Pipeline (Shared in Astro-Knots)

We introduce a small, shared markdown pipeline in the Astro-Knots packages namespace, then import it into each site.

### 5.1 `MarkdownArticle.astro` – Layout-Level Processor

- **Location (proposed)**: `packages/astro/src/layouts/MarkdownArticle.astro`.

- **Responsibility**:
  - Take raw markdown + frontmatter and turn it into a transformed **MDAST** tree for a given site.

- **Inputs (props)**:
  - `Component`: a page-level layout component, usually
    `MarkdownArticleOnPage.astro` or something compatible.
  - `data`: frontmatter / metadata for the content.
  - `content`: raw markdown string.
  - `markdownFile?`: optional path for debugging.

- **Unified / remark stack (v1)**:
  - `remarkParse` – parse markdown into MDAST.
  - `remarkGfm` – GitHub-flavored markdown (tables, task lists, etc.).
  - `remarkDirective` – support directive syntax:
    - `:::callout` / `::callout` containers.
    - `:badge[]` text directives, if we want them.
  - `remarkDirectiveToComponent` (Astro-Knots version):
    - Validates directive names we support.
    - Leaves them as directive nodes for render-time handling.
  - `remarkTableOfContents` (if we want TOCs on these pages).

- **Output**:
  - `transformedMdast` – the enriched MDAST.
  - Passes `transformedMdast` and normalized `data` into `Component`.

### 5.2 `MarkdownArticleOnPage.astro` – Page Layout + TOC

- **Location (proposed)**:
  - `packages/astro/src/components/articles/MarkdownArticleOnPage.astro`.

- **Responsibilities**:
  - Provide a basic article layout, including:
    - Main content area (using `AstroMarkdown`).
    - Optional metadata column / info sidebar.
    - Optional table of contents.
  - Derive a main heading from `data.title` or a passed-in `title`.
  - Normalize metadata before passing it down (e.g. authors as an array, formatted dates).

- **TOC handling**:
  - Accepts `content: Root` (MDAST) from `MarkdownArticle.astro`.
  - Extracts the `tableOfContents` node if present.
  - Passes the TOC map to a simple `TableOfContents.astro` component.
  - For the main content, passes a synthetic `root` to `AstroMarkdown` with
    the TOC node filtered out.

This gives us a reusable, opinionated article layout for Astro-Knots sites.

---

## 6. `AstroMarkdown.astro` – Core Extended Markdown Renderer

We implement a shared `AstroMarkdown.astro` for Astro-Knots that mirrors the
Lossless design but with a smaller feature set.

- **Location (proposed)**:
  - `packages/astro/src/components/markdown/AstroMarkdown.astro`.

- **Inputs (props)**:
  - `node`: any MDAST node (`root`, `heading`, `paragraph`, `image`,
    `leafDirective`, etc.).
  - `data`: frontmatter / metadata + helper fields (e.g. `path`, `dirpath`).

- **Core behaviors (v1)**:

  - Maintain an explicit `handledTypes` list, including:
    - Standard nodes:
      - `root`, `paragraph`, `text`, `heading`, `link`, `image`, `list`,
        `listItem`, `code`, `inlineCode`, `blockquote`, `table`, `tableRow`,
        `tableCell`, `thematicBreak`.
    - Directive nodes:
      - `leafDirective`, `containerDirective`, `textDirective`.

  - Use recursive self-calls:
    - `<Astro.self node={child} data={data} />` for walking the tree.

  - Derive `dirpath` from `data.path` to help with image and asset resolution.

- **Standard node rendering**:
  - `root`: render children recursively.
  - `heading`:
    - Extract text content to generate an `id`.
    - Wrap with an anchor link (consistent with `rehypeAutolinkHeadings`).
  - `paragraph`, `text`, `strong`, `emphasis`: map to semantic HTML.
  - `list` / `listItem`: render UL/OL with consistent classes + spacing.
  - `link`: standard `<a>` for v1 (we can add smart embed detection later).
  - `image`: basic `<img>` with optional figure/figcaption pattern for v1.
  - `code` / `inlineCode`:
    - `code` uses `CodeBlock.astro` for syntax highlighting.
    - `inlineCode` uses `<code>` with inline styling.
  - `blockquote`: map to a styled callout component or simple `<blockquote>`.
  - `table*`: render semantic tables with optional scroll wrapper.

- **Directive handling (v1)**:

  We start with a **very small directive set** designed to be robust and easy
  to extend later:

  - `callout` (container or leaf directive):
    - Syntax examples:
      - Container:
        ```markdown
        :::callout{type="info"}
        This is an informational callout.
        :::
        ```
      - Leaf (short form):
        ```markdown
        ::callout{type="warning" text="Short warning"}
        ```
    - `AstroMarkdown` branch:
      - Inspect `node.name === 'callout'`.
      - Read `node.attributes` (e.g. `type`, `title`).
      - Render a `Callout.astro` component, passing children as slotted content.

  - `badge` (text directive):
    - Syntax example:
      ```markdown
      This is a :badge[New] feature.
      ```
    - Render as an inline `<span>` or `Badge.astro` component.

Later, we can add more directive types (galleries, portfolios, embeds) using the
same pattern.

---

## 7. Code Highlighting: `CodeBlock.astro`

For `code` nodes, we route through a dedicated Astro component.

- **Location (proposed)**:
  - `packages/astro/src/components/markdown/CodeBlock.astro`.

- **Responsibilities**:
  - Accept `language`, `code`, and optional `meta`.
  - Use Shiki, Prism, or another highlighter to render HTML.
  - Provide a consistent code block UI across all Astro-Knots sites
    (copy button, line numbers, dark/light support, etc.).

This keeps syntax highlighting concerns localized.

---

## 8. Simple Markdown Renderer (Optional, Later)

When we need markdown in:

- Previews.
- Email bodies.
- Background tooling.

We can add a simple renderer utility.

- **Location (proposed)**:
  - `packages/astro/src/utils/simpleMarkdownRenderer.ts`.

- **Pipeline**:
  - Reuse the same remark stack as `MarkdownArticle.astro`:
    - `remarkParse`, `remarkGfm`, `remarkDirective`, `remarkDirectiveToComponent`,
      `remarkTableOfContents`.
  - Then:
    - `remarkRehype` → `rehypeStringify`.
  - Return both:
    - `html`: full HTML string.
    - `plainText`: text with tags stripped.

For full extended markdown behavior using Astro components, we always prefer
`MarkdownArticle.astro` + `AstroMarkdown.astro`.

---

## 9. Extending the Pipeline Safely (Astro-Knots Version)

When adding new extended markdown features for Astro-Knots:

1. **Choose a syntax**
   - Prefer **directives** over special code-block languages:
     - Example: `:::image-gallery` instead of a custom `imageGallery` code fence.
   - Decide whether you need:
     - `leafDirective` (self-contained block, no nested markdown), or
     - `containerDirective` (wraps other markdown children).

2. **Expose it in the AST**
   - Ensure `remarkDirective` sees your syntax.
   - Update the Astro-Knots `remarkDirectiveToComponent` helper to:
     - Recognize the new directive `name`.
     - Validate attributes where helpful.
     - Preserve the node as `leafDirective` / `containerDirective`.

3. **Render-time mapping in `AstroMarkdown`**
   - Extend the directive handling branch in `AstroMarkdown.astro`:
     - Check `node.name` (e.g. `image-gallery`, `portfolio-gallery`).
     - Parse attributes and children.
     - Render an Astro component (e.g. `ImageGallery.astro`).

4. **Keep layout responsibilities separate**
   - `MarkdownArticle.astro` defines the **remark pipeline** order.
   - `MarkdownArticleOnPage.astro`:
     - Manages TOC extraction.
     - Passes a clean `root` node to `AstroMarkdown`.

5. **Respect shared content locations**
   - Add new collections in each site’s `src/content.config.ts` using
     `resolveContentPath` or equivalent.
   - Prefer the shared `/content` monorepo for cross-site documents
     (blueprints, specs, essays).

6. **Document new patterns**
   - For any substantial new extended markdown feature:
     - Add a short section to this blueprint **or** a new blueprint in
       `content/lost-in-public/blueprints`.
     - Include directive syntax examples and a note on how it’s rendered.

---

## 10. Phased Rollout Plan (Hypernova & Dark-Matter)

### Phase 1 – Shared Core + Simple Extended Markdown

- Implement shared components in Astro-Knots:
  - `MarkdownArticle.astro`.
  - `MarkdownArticleOnPage.astro`.
  - `AstroMarkdown.astro` (with standard nodes + `callout`/`badge` directives).
  - `CodeBlock.astro`.
  - `Callout.astro` (and `Badge.astro` if needed).

- Wire into **Hypernova**:
  - Define one or more collections for blueprints/essays/memos.
  - Add a route like `src/pages/blueprints/[slug].astro` that:
    - Loads content via Astro content collections.
    - Uses `MarkdownArticle.astro` → `AstroMarkdown.astro` for rendering.

- Wire into **Dark-Matter**:
  - Repeat the pattern with its own collections and routes.

### Phase 2 – Add More Directives (When Needed)

- Add directive support for:
  - `image-gallery`.
  - Simple portfolio/gallery components, if helpful.
- Implement corresponding Astro components.
- Extend `AstroMarkdown` directive handling.

### Phase 3 – Simple Renderer and Advanced Features

- Add `simpleMarkdownRenderer.ts` for previews/emails.
- Consider more advanced directives:
  - Embeds (slides, videos, Figma, etc.).
- Always follow the extension steps in section 9.

---

This blueprint should be treated as a **living document** for how
Astro-Knots sites implement and evolve their extended markdown render
pipeline. It is intentionally simpler than the full Lossless blueprint,
while preserving the same architectural separation of concerns:

- Content locations.
- Global markdown config.
- Layout-level markdown processing.
- Core Astro renderer for MDAST + directives.
- Clear extension points for future work.

---

## 11. Lossless Sticky TOC vs. PDF TOC for Astro-Knots

This section documents how the **Lossless** site implements its sticky Table of
Contents (TOC), and how we should adapt that pattern for **Astro-Knots memos**,
especially for **PDF export**.

### 11.1 How Lossless Builds and Renders the Sticky TOC

Relevant components:

- `site/src/components/markdown/AstroMarkdown.astro`
- `site/src/components/markdown/TableOfContents.astro`
- `site/src/components/markdown/MobileTableOfContents.astro`

**Heading → slug contract**

- Lossless `AstroMarkdown.astro` handles `heading` nodes by:
  - Extracting heading text via `extractAllText(node.children)`.
  - Slugifying it with `slugify(...)`.
  - Rendering an `h1..h6` with `id={slug}`.
- The TOC components independently generate **the same slug** using the same
  `slugify` + `extractAllText` helpers, so:
  - TOC items link to `#slug`.
  - Scroll tracking can map document headings back to TOC items.

**Desktop TOC (`TableOfContents.astro`)**

- **Input**: a pre-built MDAST `list` node that encodes the hierarchy of
  sections (Lossless builds this up earlier in the markdown pipeline).
- `buildTocTree(listNode)` walks that list and constructs a tree of:
  - `{ text, slug, depth, children[] }`.
  - Uses `extractAllText` and `slugify` to derive `slug` from text.
- Rendered as a sidebar:
  - `<aside class="toc-sidebar">` with a header, scrollable list, and progress bar.
  - `.toc-sidebar` is `position: sticky; top: 6rem; align-self: flex-start;` and
    constrained to `max-height: calc(100vh - 7rem);`.
- Interaction logic lives in an inline `<script>` (class
  `TableOfContentsManager`):
  - Collects all headings in the article (`h1[id]..h6[id]`).
  - Tracks scroll position (using either `.collection-reader-pane` or window).
  - Computes which heading is "active" and:
    - Adds inline active styles to the corresponding `.toc-link`.
    - Scrolls the TOC’s internal scroll area so the active item stays in view.
  - Handles expanding/collapsing nested sections and the sidebar itself.

Key properties of this implementation:

- **TOC data** is a tree of `{ text, slug, depth, children }` built from MDAST.
- **Sticky behavior** is entirely CSS + DOM/scroll JS around that data.
- The TOC is visibly **off to the right** of the main content and is hidden on
  narrower layouts.

**Mobile TOC (`MobileTableOfContents.astro`)**

- Independent component for small screens.
- Re-computes headings by traversing the full `content` MDAST and extracting
  headings (primarily H1/H2) into `{ text, slug, depth }`.
- Renders a fixed, top dropdown (`.mobile-toc-container`) that:
  - Shows "On this page".
  - Expands into a list of links.
- JS manager mirrors the desktop behavior:
  - Collects `h1[id], h2[id]` from the DOM.
  - Tracks scroll position via window.
  - Updates the active link and label.

**Implications for Astro-Knots**

- The **core abstraction we care about** is the TOC tree:

  ```ts
  interface TocItem {
    text: string;
    slug: string;
    depth: number;
    children?: TocItem[];
  }
  ```

- Sticky sidebar and mobile dropdown are **two different views** over that
  logical structure.
- For memos, we want a **third view**: a simple, non-sticky TOC block that can
  be placed beneath the memo header and works cleanly in print/PDF.

### 11.2 Requirements for a Memo/PDF TOC

For Hypernova/Dark-Matter investment memos we want:

- **On web** (desktop):
  - TOC can be inline or sidebar, but should not break layout.
- **On PDF/print**:
  - TOC should appear **below the memo header** and above the first section.
  - It should be **non-sticky** and paginate like normal content.
  - It should be compact and readable in a portrait letter page.
  - TOC links should still point to `#slug` IDs so clicking in the PDF viewer
    still navigates between sections where supported.

We also have additional constraints:

- We are using **window.print + CSS `@page`** to generate PDFs, not a
  headless-PDF engine yet.
- The memo layout (`MarkdownArticleOnPage.astro` + `.memo-document`) already
  assumes a **single-column, document-like** experience.

### 11.3 Strategy: Shared TOC Data, Multiple Render Targets

We want to follow the Lossless pattern (TOC data as a tree), but simplify the
views:

1. **TOC extraction in the pipeline**
   - In `MarkdownArticle.astro` (Astro-Knots package), when we add TOC support
     for memos:
     - Use a `remarkTableOfContents`-style pass or a custom walker to build a
       **TOC tree** of `{ text, slug, depth, children }`.
     - Remove the `tableOfContents` node from the main MDAST (same as the
       Lossless pattern).
     - Pass this TOC tree into `MarkdownArticleOnPage.astro` via props, e.g.
       `tocItems`.

2. **Page-level placement for memos**
   - Extend the memo `MarkdownArticleOnPage.astro` to:
     - Render a **memo header** (title, company, date, etc.).
     - If `tocItems.length > 0`, render a **`MemoTableOfContents.astro`**
       component **inside the main column**, below the header.
   - This means the TOC is part of the **normal flow** of the document rather
     than a sidebar.

3. **TOC view for memo pages**
   - Implement a very simple `MemoTableOfContents.astro` in Astro-Knots:

     - Props:
       - `items: TocItem[]` (same shape as Lossless).
     - Render as a nested `<ol>` or `<ul>`:

       ```tsx
       <nav class="memo-toc" aria-label="Table of contents">
         <ol>
           {items.map(renderItem)}
         </ol>
       </nav>
       ```

     - `renderItem` maps depth to indentation via CSS classes.
     - Anchor hrefs use `#${slug}` (compatible with the heading `id` rules we
       already defined in the Astro-Knots `AstroMarkdown.astro`).

   - Styling:
     - Keep it simple and print-friendly:
       - No sticky positioning.
       - No custom scroll area.
       - Possibly smaller font size than body text.
       - Optional dotted leaders / page numbers **later** if we add page-break
         awareness.

4. **Print/PDF behavior**
   - Because the memo TOC is in the main column, our existing `@page` and
     `@media print` rules in `hypernova-memo-styles.css` will treat it like any
     other content.
   - We can add **print-specific refinements**:
     - Ensure `.memo-toc` avoids page breaks inside individual list items.
     - Slightly reduce spacing so the TOC fits elegantly on the first page.

5. **Sidebar TOC (optional, later)**
   - If we ever want a Lossless-style sticky sidebar for memos:
     - Reuse the same `tocItems` data and implement a different view (similar
       to `TableOfContents.astro`) that only renders on large screens.
     - Gate it with CSS (`display: none` in `@media print` and on small viewports).
   - This keeps **PDF behavior unchanged** because the print rules will hide the
     sidebar and the inline memo TOC will remain under the header.

### 11.4 Implementation Notes for Astro-Knots

When we actually implement this for Hypernova/Dark-Matter memos, we should:

- **Heading ID contract**
  - Ensure Astro-Knots `AstroMarkdown.astro` uses the same slug logic for
    headings that the TOC builder uses (Lossless already centralizes this via
    `slugify` + `extractAllText`).

- **TOC extraction**
  - Keep all TOC building code in the **layout-level pipeline**
    (`MarkdownArticle.astro` or a helper), not in the renderer.
  - The renderer should just receive `tocItems` as a prop on the page layout.

- **Component boundaries**
  - `MarkdownArticle.astro` (pipeline): builds `transformedMdast` + `tocItems`.
  - `MarkdownArticleOnPage.astro` (memo layout): places
    `MemoTableOfContents.astro` under the header when `tocItems` exist.
  - `AstroMarkdown.astro`: only cares about headings getting `id`s and normal
    markdown rendering.

- **Print vs. web**
  - Use CSS to hide any **interactive** TOC views (e.g. sidebars, dropdowns)
    in `@media print`.
  - Ensure `.memo-toc` is visible in both screen and print, but tuned for
    print-first readability.

This keeps Astro-Knots aligned with Lossless’ architecture while giving memos a
document-style TOC that naturally exports to clean PDFs.
