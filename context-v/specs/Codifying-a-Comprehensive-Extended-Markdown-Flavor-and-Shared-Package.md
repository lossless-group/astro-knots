---
title: Codifying a Comprehensive Extended Markdown Flavor and Shared Package
lede: A specification for a named, versioned extended markdown flavor that codifies our existing rendering capabilities, incorporates features from GFM, Obsidian, MDX, and directive-based systems, and defines a wish list for future development — all backed by a shared remark/rehype package.
date_authored_initial_draft: 2025-01-25
date_authored_current_draft: 2026-04-26
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-04-26
at_semantic_version: 0.0.1.1
status: Draft
augmented_with: Claude Code (Opus 4.6)
category: Specification
tags: [Markdown, Extended-Markdown, Remark, Rehype, Unified, Astro, Render-Pipeline, Content-Authoring]
authors:
  - Michael Staton
  - AI Labs Team
image_prompt: A layered blueprint showing standard markdown at the base, GFM and Obsidian features in the middle, and custom directive-based extensions at the top — all flowing through a unified rendering pipeline into polished web pages and PDFs.
date_created: 2026-03-25
date_modified: 2026-03-30
---

# Codifying a Comprehensive Extended Markdown Flavor and Shared Package

**Status**: Draft (v0.0.1.1)
**Date**: 2026-03-25
**Author**: Michael Staton

***
### Workflow Status
#### Done
- [ ] GitHub Flavor Markdown working
- [ ] Citations reordering, including for unique hexCode based citation pairs, is working. 
#### In Review
- [ ] Image component with rich metadata including caption, source, and CSS styles. First iteration done.  Looks good but haven't thoroughly tested it. 

***

## 1. Problem

We have a sprawling collection of markdown content across multiple sites and content repositories — investment memos, blueprints, specs, essays, changelogs, slide decks, infographics — and our rendering capabilities have grown organically through real client work. We now support features well beyond standard CommonMark or Remark: GFM tables, directive-based callouts, hex-code citations, Mermaid diagrams, embedded slide decks, markdown-based slideshows with slide separators, syntax-highlighted code blocks with copy buttons, and more.

But none of this is codified. The "flavor" is implicit — scattered across remark plugins, Astro components, and tribal knowledge. This means:

- **No single reference** for what syntax an author can use and expect to render
- **No versioning** of the flavor itself (which features are stable? which are experimental?)
- **No shared package** — each site copies and diverges its own remark/rehype pipeline
- **No validation** — authors discover unsupported syntax only when it renders wrong
- **No wish list** — features we want but haven't built live only in people's heads

---

## 2. Goal

Define a **named, versioned extended markdown flavor** (working name: **Lossless Flavored Markdown** or **LFM**) that:

1. **Codifies what we already support** across our best rendering pipelines
2. **Borrows explicitly** from GFM, Obsidian, MDX, and remark-directive conventions
3. **Defines tiers** — Stable, Beta, and Wish List — so authors know what to rely on
4. **Backs the spec with a shared package** (`@lossless-group/lfm`) that sites can install or copy
5. **Provides a validation mode** that warns authors about unsupported syntax at build time

---

## 3. Prior Art and Borrowed Features

This flavor is a remix. We're not inventing a new markdown standard — we're selecting from existing ones and adding our own extensions where gaps exist.

That being said, our content preferences and standards are quite high. We want:

- To handle citations more rigorously than existing libraries support — with hex-code identifiers for stability, structured reference definitions with publication dates and URLs, hover popovers with source metadata, and build-time validation that every reference has a definition.  We even want a source catalog and citation index, so readers can easily find and reference all sources... and authors can use more cannonical, valuable sources to assure the credibility and quality of our sources.
- To be able to specify CSS styles within the markdown itself — inline style overrides, scoped style blocks, and class annotations on any element — without dropping into raw HTML
- To embed content from YouTube, SoundCloud, and other media platforms with as little effort as possible — ideally a bare URL on its own line that auto-unfurls, or at most a one-line directive
- Custom components usually reserved for MDX to be automagically rendered using our directive syntax — no JSX, no imports, no build-step coupling — just `:::component-name{props}` and the renderer maps it to the right Astro/Svelte component

### 3.1 CommonMark (Baseline)

Everything in the [CommonMark spec](https://spec.commonmark.org/) is supported without modification. This is the floor.

### 3.2 GitHub Flavored Markdown (GFM)

We adopt the full [GFM spec](https://github.github.com/gfm/) including:

| Feature | Syntax | Status |
|---------|--------|--------|
| Tables | Pipe tables with alignment | **Stable** |
| Task lists | `- [x]` / `- [ ]` | **Stable** |
| Strikethrough | `~~text~~` | **Stable** |
| Autolinks | Bare URLs become links | **Stable** |
| Footnotes | `[^label]` with definitions | **Stable** (extended — see Citations) |

**Implementation**: `remarkGfm` plugin handles all of the above.

### 3.3 Obsidian / Wiki-Style Features

We selectively adopt from [Obsidian's markdown extensions](https://help.obsidian.md/Editing+and+formatting/Obsidian+Flavored+Markdown):

| Feature | Syntax | Status |
|---------|--------|--------|
| Wikilinks | `[[Page Name]]` | **Wish List**, though working on https://lossless.group |
| Wikilink with alias | `[[Page Name\|Display Text]]` | **Wish List** |
| Embeds | `![[filename.md]]` | **Wish List** |
| Image resize | `![[image.png\|300]]` | **Wish List** |
| Callouts | `> [!info] Title` | **Beta** (We support basical callouts and even have a few design mod components to support common tags like QUOTE, WARNING, etc. Yet these could be more full featured.)|
| Highlights | `==highlighted text==` | **Wish List** |
| Comments | `%%hidden comment%%` | **Wish List** |
| Tags in body | `#Tag-Name` inline | **Wish List** |

**Design Decision**: We support Obsidian callout syntax (`> [!type]`) as an **alias** for our directive-based callouts. Authors coming from Obsidian can keep using `> [!warning]` and it renders identically to `:::callout{type="warning"}`. But our canonical documentation recommends the directive syntax because it's more expressive (supports arbitrary attributes).

### 3.4 Core Principle: Polyglot Syntax, Unified Component Model

This is the most important architectural decision in LFM and what sets it apart from every existing markdown extension library.

**The problem with existing libraries**: Every library picks ONE syntax for triggering components and refuses the others. MDX requires JSX. Markdoc requires `{% tag %}`. remark-directive requires `:::name{}`. Obsidian uses code fences. Each library treats its chosen syntax as a *philosophy* rather than a *preference* — and forces that choice on every content author.

**Our position**: There is no good reason for this. A content author writing `:::callout{type="warning"}`, `{% callout type="warning" %}`, and `` ```callout { "type": "warning" } ``` `` is doing the exact same thing — asking the system to render a component with some properties. The syntax is just a trigger. The underlying operation is identical: **resolve a component name, pass it properties, optionally pass it children, render it.**

**LFM therefore supports multiple trigger syntaxes that all normalize to the same intermediate representation before the rendering layer ever sees them.** The rendering layer receives a component node with `name`, `attributes`, and `children` — it never knows or cares which syntax produced it.

```
Author writes ANY of these:          The parser normalizes ALL of them to:

:::callout{type="warning"}     ─┐
Content here.                   │
:::                             │
                                │    {
{% callout type="warning" %}   ─┤      type: "componentNode",
Content here.                   │      name: "callout",
{% endcallout %}                │      attributes: { type: "warning" },
                                ├──▶   children: [ ...parsed markdown... ]
```callout                     ─┤    }
{ "type": "warning" }          │
```                             │
                                │
> [!warning]                   ─┤
> Content here.                 │
                               ─┘
```

**The canonical syntax for documentation is directives** (`:name`, `::name`, `:::name`) because they're the most expressive and compose well with markdown. But we parse and accept ALL of these trigger syntaxes:

### 3.4.1 Supported Trigger Syntaxes

| Syntax Family | Trigger Pattern | Inline | Block | Container | Status |
|--------------|----------------|--------|-------|-----------|--------|
| **Directive** (remark-directive) | `:name[]{}`, `::name{}`, `:::name{} ... :::` | Yes | Yes | Yes | **Stable** |
| **Obsidian code fence** | `` ```identifier `` with JSON/YAML content | No | Yes | No | **Stable** |
| **Obsidian callout** | `> [!type] Title` | No | No | Yes | **Stable** |
| **Markdoc tag** | `{% name attrs %}...{% /name %}` | No | Yes | Yes | **Planned** |
| **MDX-lite** | `<Name prop="val" />`, `<Name>...</Name>` | Yes | Yes | Yes | **Wish List** |
| **Bare URL** (auto-unfurl) | URL on its own line matching a known platform | No | Yes | No | **Stable** |

Each syntax family has its own remark plugin (parser), but ALL of them produce the same normalized node type that the rendering layer consumes. Adding a new trigger syntax is just adding a new parser — the rest of the pipeline is unchanged.

### 3.4.2 Why We Accept Markdoc Syntax

Markdoc (`{% tag %}`) deserves special attention because it's used by Stripe's documentation and has a growing community. The syntax is clean, well-specified, and solves the same problem we solve with directives:

```markdown
{% callout type="warning" %}
Watch out for this.
{% /callout %}

{% youtube id="dQw4w9WgXcQ" /%}
```

Rejecting Markdoc syntax (as we originally planned) would mean an author who has existing Markdoc content — or who simply prefers the `{% %}` syntax — would have to rewrite everything. That's exactly the kind of arbitrary enforcement we're trying to avoid. The Markdoc parser is straightforward: scan for `{% name ... %}` delimiters, extract name and attributes, normalize to a component node.

### 3.4.3 Why We Accept MDX-Lite Syntax (With Restrictions)

Full MDX (JSX with arbitrary JavaScript expressions) is too complex and breaks content portability. But the *component invocation* part of MDX — `<ComponentName prop="value">children</ComponentName>` — is familiar to anyone who's written HTML or React. We accept this syntax with restrictions:

- **No imports** — component routing is handled by the registry, not by authors
- **No JS expressions** — prop values must be string literals (`prop="value"`), not expressions (`prop={value + 1}`)
- **No arbitrary JSX** — only registered component names are recognized; `<div>` or `<span>` are treated as raw HTML, not component invocations

This means an author can write `<Callout type="warning">Content</Callout>` and it works. It normalizes to the same node as `:::callout{type="warning"}`. The author doesn't need to care which syntax they use.

### 3.4.4 Directive Syntax Detail (Canonical Form)

The [generic directive proposal](https://talk.commonmark.org/t/generic-directives-plugins-syntax/444) remains the canonical syntax for LFM documentation and examples:

| Form | Syntax | Use Case |
|------|--------|----------|
| Text directive | `:name[content]{attrs}` | Inline elements (badges, tooltips) |
| Leaf directive | `::name{attrs}` | Self-closing blocks (embeds, separators) |
| Container directive | `:::name{attrs}\ncontent\n:::` | Wrapping blocks (callouts, galleries, details) |

Directives are the most expressive trigger syntax because they support all three forms (inline, block, container), allow arbitrary key-value attributes, and compose naturally with markdown. When we document a feature, we show the directive syntax first. But we never tell an author they *must* use it.

### 3.5 Prop Assignment and Component Routing

Regardless of which trigger syntax an author uses, the component model is the same:

| Concern | How It Works |
|---------|-------------|
| **Prop assignment** | All trigger syntaxes produce string key-value attribute pairs (`key="value"`). No JS expressions — values are always strings. The component is responsible for parsing strings into the types it needs (e.g., parsing `"3"` into the number `3`) |
| **Component routing** | A **component registry** maps names to component file paths at build time (e.g., `'callout' → Callout.astro`). No imports in content. The registry is the single source of truth — one name, one component, regardless of which syntax triggered it |
| **Children** | Container syntaxes (directives, Markdoc tags, MDX-lite tags) pass their body as parsed markdown children. Code fence syntaxes pass their content as a raw string (typically JSON/YAML). The component must declare which input shapes it accepts |
| **Frontmatter as props** | YAML frontmatter can pass page-level props to layout components. This is standard Astro behavior and is orthogonal to the trigger syntax |

### 3.6 Other Technical Influences

| Source | Feature | Our Adoption | Status |
|--------|---------|-------------|--------|
| AsciiDoc | Admonitions, includes | Admonitions via any trigger syntax; includes via embeds | **Partial** |
| Pandoc | Citation syntax `[@key]` | Extended — see hex-code citations below | **Stable** |
| Pandoc | Bracketed attributes `{.class #id key="val"}` | Adopted for CSS-in-markdown (see 4.30) | **Wish List** |
| reveal.js | `---` slide separators | Adopted for slide content | **Stable** |
| Mermaid | Fenced code blocks and Diagrams as Text/Code | `` ```mermaid `` renders as diagrams | **Stable** |
| KaTeX/MathJax | `$inline$` and `$$block$$` | Math rendering | **Wish List** |
| Liquid/Nunjucks | `{{ var }}` / `{% tag %}` | Overlaps with Markdoc syntax — Markdoc parser handles this | **Planned** |

### 3.7 Philosophical Influences and Kindred Projects

LFM didn't emerge in a vacuum. The mainstream markdown ecosystem (CommonMark, GFM, MDX) is maintained by large organizations with enterprise constraints — they move slowly, they prioritize backward compatibility over expressiveness, and they tend to treat "extended markdown" as someone else's problem. The result is a gap between what content authors actually need and what the official specs provide.

That gap has been independently noticed by a number of solo developers and small teams who, like us, felt the need to improvise extended markdown because the existing options were insufficient. LFM is influenced by their work — not always by their specific syntax choices, but by the shared recognition that markdown needs to grow and that the people building the extensions shouldn't be constrained by the conservatism of the spec committees.

#### WikiBonsai / CAML (Colon Attribute Markup Language)

**Project**: [wikibonsai.io](https://wikibonsai.io) by a solo developer building a personal knowledge management system around semantic markdown.

**What they built**: CAML (`:key::value` syntax for inline metadata), wikirefs (`[[links]]` with semantic typing), a knowledge tree indexer, and a VS Code extension — all centered on the idea that markdown files should be nodes in a semantic graph, not isolated documents.

**What resonated with us**:
- The conviction that metadata shouldn't be imprisoned in frontmatter. CAML allows attributes to live *alongside* content, like footnotes. This maps to our wish for inline annotations on claims (`:confidence::verified`, `:source-quality::high`) rather than maintaining a separate metadata structure disconnected from the prose.
- Wikiref values inside attributes (`:competitor::[[Enzymedica]]`) — linking metadata to other documents, not just tagging with strings.
- The Unix philosophy: modularity, plain text as the source of truth, readable by any tool. Their tagline — "readable by anyone, any model, any tool" — could be ours.
- The loneliness of the problem. When one solo developer independently arrives at the same conclusions you did, it validates the problem space even if the solutions diverge.

**What we take**: The *idea* of body-level metadata (not necessarily the `:key::value` syntax). The *idea* that wikilinks should carry semantic relationships, not just be navigation. The validation that extending markdown is a real need shared by real people, not scope creep.

#### Markdoc (Stripe)

**Project**: [markdoc.dev](https://markdoc.dev) by Stripe's documentation team.

**What they built**: A full document authoring system with `{% tag %}` syntax for components, a schema validation layer, and a rendering pipeline that separates parsing from rendering — built because MDX was too complex for their content team.

**What resonated with us**:
- The explicit rejection of MDX as too developer-centric for content authors. They saw the same problem we did: JSX in markdown is powerful but hostile to non-developers.
- Schema validation for content — the idea that you can define what attributes a tag accepts and get build-time errors when content violates the schema. This directly influenced our directive registry and validation mode.
- The clean separation between parsing and rendering. Markdoc's AST is syntax-agnostic, which is the same principle behind our polyglot normalizer.

**Where they stopped short**: Markdoc only supports `{% tag %}` syntax. They built a beautiful system and then locked it to a single trigger syntax, which is the exact trap we're trying to avoid with the polyglot approach.

#### Djot

**Project**: [djot.net](https://djot.net) by John MacFarlane (the creator of Pandoc and a CommonMark spec author).

**What they built**: A new light markup language designed to fix the accumulated warts in CommonMark — cleaner parsing rules, consistent attribute syntax, and better extensibility. MacFarlane was essentially admitting that markdown's syntax has problems that can't be fixed without breaking backward compatibility.

**What resonated with us**:
- The acknowledgment, from *the person who wrote the CommonMark spec*, that markdown has fundamental design issues that the spec process is too conservative to address.
- Djot's attribute syntax (`{.class #id key="value"}` on any element) directly influenced our CSS-in-markdown feature. Pandoc already supports a subset of this, and Djot formalizes it.
- The idea that a markup language should have *one* consistent way to add attributes to any element, rather than the current markdown situation where attributes are possible on some elements, impossible on others, and vary by implementation.

**What we take**: Attribute syntax ideas for CSS-in-markdown. The confidence that even spec authors think markdown needs to evolve. We don't adopt Djot as a syntax (it's a wholly different language), but its design decisions inform our extensions.

#### Astro Content Collections / Zod Schemas

**Project**: Astro's built-in content collections with Zod schema validation.

**What resonated with us**:
- Content as structured data with type-safe schemas, not just blobs of markdown. This gave us the frontmatter validation layer and the confidence that content can be programmatically reasoned about at build time.
- The `render()` pattern that separates content body from metadata and gives the rendering layer full control.
- This isn't a "kindred solo developer" story — it's an acknowledgment that Astro's content model is the best available foundation for what we're building. LFM extends it rather than replacing it.

#### The Broader Pattern

What all these influences share — and what motivated LFM — is the recognition that markdown is simultaneously the best and worst content format:

- **Best** because it's plain text, universally readable, version-controllable, AI-friendly, and simple enough for anyone to learn in 10 minutes.
- **Worst** because the moment you need anything beyond headings and paragraphs — a callout, a citation, an embedded video, a data visualization, a styled component — you fall off a cliff into fragmented, incompatible extension ecosystems where every library has its own opinion about what you're allowed to do.

LFM's response is not to pick a side but to build a normalizer that accepts all sides and renders them the same way. The philosophical debt to these projects is in the shared conviction that the cliff doesn't need to exist.

---

## 4. The Flavor: Feature Catalog

This is the canonical list of what **Lossless Flavored Markdown** or **Astro Knots Markdown** supports, organized by tier.

### Tier 1: Stable (Ship It)

Features that are implemented, tested, and safe for authors to rely on across all sites.

#### 4.1 Standard Markdown (CommonMark + GFM)

Everything you'd expect: headings, paragraphs, bold, italic, links, images, lists, blockquotes, horizontal rules, code spans, fenced code blocks, tables, task lists, strikethrough, autolinks, footnotes.

#### 4.2 YAML Frontmatter

```markdown
---
title: My Document
date_created: 2026-03-25
tags: [Extended-Markdown, Specifications]
authors:
  - Michael Staton
---
```
Parsed by `gray-matter` or Astro's built-in frontmatter handling. Schema validation is per-collection (Zod schemas in `content.config.ts`).

##### 4.2.1 Tag Syntax

Due to our heavy reliance on Obsidian as our content development and management tool, tags cannot have spaces in them.  And due to various search and filter features, it's better to use Train-Case as opposed to snake-case. 


#### 4.3 Fenced Code Blocks with Syntax Highlighting

````markdown
```typescript
const greeting: string = "Hello, world";
console.log(greeting);
```
````

**Rendering**: Shiki with tokyo-night theme (always dark). Wrapped in a container with:
- Language label (uppercase, top-left)
- Copy button (top-right)
- Line wrapping enabled

**Meta string support** (planned stable):

````markdown
```typescript title="greeting.ts" {2-3} showLineNumbers
const greeting: string = "Hello, world";
console.log(greeting);  // highlighted
return greeting;         // highlighted
```
````

#### 4.3.1 Custom Code Blocks Become Custom Components

Due to our use of Obsidian, Obsidian allows "plugins" to specify a codeblock identifier and give it custom rendering as a component. So, even though the `` ```identifier-string `` syntax is typically reserved for a true codeblock, there will be identifier strings that escape the codeblock render pipeline and trigger a custom component render pipeline instead.

Mermaid is the most familiar example of this pattern — `` ```mermaid `` is not a programming language, it's a signal to bypass syntax highlighting entirely and render a diagram component. But we extend this pattern well beyond Mermaid to any component that Obsidian plugins know how to render.

**Known custom code block identifiers** (not syntax-highlighted — routed to components):

| Identifier | Renders As | Obsidian Plugin |
|------------|-----------|-----------------|
| `mermaid` | Diagram (SVG) | Built-in Mermaid support |
| `jsoncanvas` | Interactive node-and-edge canvas | Custom plugin |
| `card-carousel` | Horizontal scrolling card carousel | Custom plugin |
| `card-grid` | Responsive card grid layout | Custom plugin |
| `image-grid` | Image gallery grid | Custom plugin |
| `image-carousel` | Horizontal scrolling image gallery | Custom plugin |
| `slides` | Embedded slide deck preview | Custom plugin |

**Implementation**: The remark pipeline maintains a **component identifier list** — code fence languages that should NOT be passed to Shiki for syntax highlighting. When the pipeline encounters one of these identifiers, the code block node is transformed into a directive-like node and routed to the component registry, just as if it were written as a directive. The fence content (typically JSON or YAML) becomes the component's configuration data.

#### 4.3.2 Custom Code Blocks May Also Be Directives Using the Same Custom Component

If we want a component to render INSIDE Obsidian, natively, it has to use custom identifiers within the codeblock syntax — that's the only extension point Obsidian exposes for custom rendering. But our Astro sites prefer directive syntax (`:::card-grid{columns="3"}`) because it's more expressive, supports nested markdown children, and participates in the directive validation system.

This means content authors will — frequently enough to not be an edge case — switch between using Code Block syntax and Directive syntax when they are referring to the same Custom Component. An author drafting in Obsidian uses the code fence because that's what previews correctly. The same author (or a different one) editing in VS Code for an Astro site uses the directive because it's the canonical LFM syntax. Therefore, in many cases both syntaxes must be supported and must route to the same component.

This has most frequently come up in Card Carousels, Card Grids, Image Grids, Image Carousels, and Slide Embeds.

**Example — the same component, two syntaxes:**

Code block syntax (works in Obsidian):

````markdown
```card-grid
{
  "columns": 3,
  "cards": [
    { "title": "Enzymedica", "subtitle": "Primary Competitor", "url": "/competitors/enzymedica" },
    { "title": "FODZYME", "subtitle": "Direct Competitor", "url": "/competitors/fodzyme" },
    { "title": "Twin Health", "subtitle": "Indirect Competitor", "url": "/competitors/twin-health" }
  ]
}
```
````

Directive syntax (canonical LFM, works in Astro):

```markdown
:::card-grid{columns="3"}
- **Enzymedica** — Primary Competitor [→](/competitors/enzymedica)
- **FODZYME** — Direct Competitor [→](/competitors/fodzyme)
- **Twin Health** — Indirect Competitor [→](/competitors/twin-health)
:::
```

Both render the same `CardGrid.astro` component. The code block version passes structured JSON as config; the directive version passes markdown children that the component parses. The component must handle both input shapes.

**Implementation**: The component registry supports dual registration:

```typescript
const registry = {
  'card-grid': {
    component: () => import('../components/CardGrid.astro'),
    codeBlockIdentifier: 'card-grid',  // also triggers on ```card-grid
    acceptsCodeBlockContent: true,      // fence content passed as `data` prop
    acceptsDirectiveChildren: true,     // directive children passed as slot
  },
};
```

#### 4.4 Mermaid Diagrams

````markdown
```mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Do Thing]
    B -->|No| D[Other Thing]
```
````

**Rendering**: Extracted before Shiki processing via `rehypeMermaidPre` plugin. Rendered client-side by Mermaid.js with site-specific theme variables.

#### 4.5 Callout / Admonition Blocks

**Directive syntax (canonical)**:

```markdown
:::callout{type="warning" title="Heads Up"}
This is important information that the reader should not miss.
:::
```

**Obsidian syntax (alias, also supported)**:

```markdown
> [!warning] Heads Up
> This is important information that the reader should not miss.
```

Both render identically. Supported types:

| Type | Icon | Color | Use |
|------|------|-------|-----|
| `info` | i | Blue | General information |
| `tip` | Lightbulb | Green | Helpful suggestions |
| `warning` | Triangle | Yellow/Orange | Caution |
| `danger` | X | Red | Critical warnings |
| `note` | Pencil | Gray | Side notes |
| `success` | Check | Green | Positive outcomes |
| `quote` | Quote mark | Gray | Attributed quotes |
| `example` | List | Purple | Examples/demos |

#### 4.6 Inline Badges

```markdown
This is a :badge[New] feature released :badge[2026-03-25]{variant="date"}.
```

**Rendering**: Styled `<span>` with variant-based colors. Variants: `default`, `success`, `warning`, `danger`, `date`, `version`.

#### 4.7 Hex-Code Citations

Our custom citation system that extends standard footnote syntax:

**Inline reference**:
```markdown
Global aging is accelerating toward 2.1B people 60+ by 2050.[^1ucdcd]
```

**Definition**:
```markdown
[^1ucdcd]: 2025, Sep 21. [Population ageing](https://helpage.org/...). Published: 2024-07-11
```

**Rendering**:
- Inline: Superscript number `[1]` with hover popover showing title, source, URL
- Page bottom: Numbered "Sources" section with full references
- Hex codes converted to sequential integers in order of first appearance

See `Citation-System-Architecture.md` for the full design.

#### 4.8 Tables (Enhanced)

Standard GFM pipe tables plus:

- **Scroll wrapper** for wide tables on mobile
- **Sticky header** option (via directive attribute)
- **Sortable** option (client-side JS, via directive attribute)

```markdown
::table{scrollable sortable}

| Company | Funding | Stage |
|---------|---------|-------|
| Acme    | $10M    | Series A |
| Beta    | $5M     | Seed |

::
```

**Note**: The plain GFM table syntax always works. The directive wrapper adds progressive enhancement.

#### 4.9 Slide Separators

For presentation content processed by the slides system:

```markdown
---slide---
# Slide Title

Content for this slide.

---slide---
# Next Slide

More content.
```

The `---slide---` separator is only meaningful in content collections configured for slide rendering. In normal article rendering, it's treated as a thematic break.

#### 4.10 Details / Collapsible Sections

```markdown
:::details{title="Click to expand"}
Hidden content that the reader can reveal.

Supports **full markdown** inside.
:::
```

**Rendering**: `<details><summary>` with styled disclosure triangle.

---

### Tier 2: Beta (Works, Evolving)

Features that are implemented in at least one site but may change in syntax or behavior.

#### 4.11 Image Directives

The `::image` directive renders images as rich `<figure>` elements with optional captions, source attribution, and textbook-style float/wrap layouts. The design philosophy is **write the minimum, get something good** — most attributes are optional with sensible defaults, so authors only add attributes when something doesn't look right.

**Simplest usage** (block figure, full width, caption below):

```markdown
::image{src="/images/chart.png" alt="Market sizing" caption="GLP-1 projection through 2030"}
```

**Floated with source attribution** (image anchors right, caption auto-positions left, text wraps):

```markdown
::image{src="/images/chart.png" alt="Market sizing" float="right" caption="GLP-1 projection" source="Goldman Sachs Research" source-url="https://gs.com/research/glp1"}
```

**Full control** (rarely needed — only when defaults don't look right):

```markdown
::image{src="/images/mobile-app.png" alt="Onboarding flow" float="left" width="50%" min-width="400px" max-height="500px" caption="Onboarding flow v2" caption-width="40%" source="Internal design team"}
```

Standard markdown images (`![alt](src)`) also work but don't support captions, floating, or source attribution.

##### Attribute Reference

| Attribute | Required | Type | Default |
|-----------|----------|------|---------|
| `src` | yes | path or URL | — |
| `alt` | yes | text | — |
| `float` | no | `left`, `right` | none (block figure) |
| `width` | no | percentage | `100%` for block, `40%` for floated |
| `min-width` | no | pixels | component default breakpoint |
| `max-height` | no | pixels | none |
| `caption` | no | plain text | none |
| `caption-position` | no | `bottom`, `top`, `side` | `bottom` for block; auto-side for floated |
| `caption-width` | no | percentage of figure | `33%` (applies only when caption is on the side) |
| `source` | no | text | none |
| `source-url` | no | URL | none (source renders as plain text) |
| `source-position` | no | `top`, `bottom` | `bottom`; auto-flips to `top` if caption is also at bottom |

##### Sizing Model

- **`width`** is always a percentage of the content column, never pixels. The image scales proportionally.
- **`min-width`** is in pixels and acts as a **breakpoint**: when the computed width of the figure falls below this value, floated images automatically unfloat and render as full-width block figures. If omitted, the component uses a sensible default breakpoint. This ensures images with fine detail or embedded text remain legible on smaller viewports.
- **`max-height`** constrains tall/narrow images (mobile screenshots, vertical infographics) from dominating the page. The image scales down to fit within the constraint while maintaining its aspect ratio.

##### Auto-Layout Rules

The image directive uses automatic layout logic so authors don't need to think about positioning unless they want to override:

**Caption positioning:**
- `float="left"` → caption automatically goes to the **right** of the image
- `float="right"` → caption automatically goes to the **left** of the image
- No float (block) → caption goes to the **bottom** (standard figure behavior)
- The `caption-position` attribute overrides any of these defaults when explicitly set.

**Caption sizing:**
- When caption is on the side, it takes **1/3 of the figure container** by default (image takes 2/3). Set `caption-width` to override.
- When caption is on top or bottom, it spans the full figure width.
- Caption font size uses `clamp(8pt, 2cqi, 14pt)` — scales with the figure container, minimum 8pt, maximum 14pt. No author-facing attribute; baked into the component.

**Source attribution positioning:**
- Defaults to **bottom** of the figure.
- Automatically flips to **top** if caption is also at bottom, so they never compete for the same position.
- Renders as "Source: {text}" in small type. If `source-url` is provided, the source name becomes a link.

**Responsive behavior:**
- Floated images automatically unfloat to full-width block layout when the viewport is too narrow for the float to work (controlled by `min-width` or the component's default breakpoint).
- When an image unfloats, side captions move to bottom and the figure behaves like a standard block figure.

##### Layout Examples

**Floated right with side caption (desktop):**

```
Wrapping text continues here on the    ┌─────────────────────────┐
left side of the content column,       │ ┌───────────┬──────────┐│
flowing naturally around the figure.   │ │           │ Caption  ││
The figure anchors to the right edge   │ │  [IMAGE]  │ text on  ││
of the content column.                 │ │           │ the left ││
                                       │ ├───────────┴──────────┤│
                                       │ │ Source: Goldman Sachs ││
                                       │ └──────────────────────┘│
                                       └─────────────────────────┘
```

**Block figure with bottom caption (source flips to top):**

```
┌──────────────────────────────────────────┐
│ Source: Goldman Sachs Research            │
├──────────────────────────────────────────┤
│                                          │
│                [IMAGE]                   │
│                                          │
├──────────────────────────────────────────┤
│ GLP-1 market projection showing $130B    │
│ addressable market by 2030.              │
└──────────────────────────────────────────┘
```

##### Rendering

The `::image` directive renders as a `<figure>` element containing:
- The `<img>` with `alt`, lazy loading, and responsive sizing
- A `<figcaption>` for the caption (when present)
- A source attribution element (when present)
- CSS layout using flexbox for side-caption arrangements and CSS `float` for text wrapping
- Container query-based font sizing for captions

#### 4.12 Zero-Friction Media Embeds

Embedding media should require the absolute minimum effort. We support three tiers of embed syntax, from effortless to precise:

**Tier A — Bare URL auto-unfurl** (preferred for authors):

A recognized media URL on its own line (not inline in a paragraph) is automatically detected and rendered as an embedded player or rich card:

```markdown
Here's the pitch video:

https://www.youtube.com/watch?v=dQw4w9WgXcQ

And here's the podcast episode:

https://soundcloud.com/user/track-name
```

The renderer detects the platform from the URL and renders the appropriate embed component — no directive syntax, no IDs to extract, no ceremony. The author just pastes the URL.

**Supported auto-unfurl platforms**:

| Platform | URL Patterns | Renders As |
|----------|-------------|-----------|
| YouTube | `youtube.com/watch?v=`, `youtu.be/` | Responsive video player with privacy facade |
| SoundCloud | `soundcloud.com/` | Audio player widget |
| Vimeo | `vimeo.com/` | Responsive video player |
| Loom | `loom.com/share/` | Responsive video player |
| Twitter/X | `twitter.com/*/status/`, `x.com/*/status/` | Tweet embed card |
| Figma | `figma.com/file/`, `figma.com/design/` | Interactive Figma embed |
| Spotify | `open.spotify.com/` | Audio player widget |
| CodePen | `codepen.io/` | Interactive code demo |
| GitHub Gist | `gist.github.com/` | Rendered gist with syntax highlighting |

**Tier B — Leaf directive** (when you need control over embed behavior):

```markdown
::youtube{id="dQw4w9WgXcQ" start="42" autoplay}

::soundcloud{url="https://soundcloud.com/user/track" color="#6643e2" visual}

::figma{url="https://www.figma.com/file/abc123" height="450"}
```

Directives give access to platform-specific attributes (start time, color, height, autoplay) that bare URLs don't support.

**Tier C — Generic embed** (for unsupported platforms):

```markdown
::embed{url="https://example.com/widget" height="400" title="Custom widget"}
```

Falls back to a sandboxed `<iframe>` with the URL. Use for platforms not in the auto-unfurl list.

**Auto-unfurl opt-out**: Prefix a URL with `\` to prevent auto-unfurling and render it as a plain link:

```markdown
\https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

**Implementation**: A remark plugin scans for paragraph nodes containing a single URL child (a link node with no siblings). If the URL matches a known platform pattern, the paragraph is replaced with a `leafDirective` node typed to that platform. This happens before the directive-to-component mapping, so the rendering layer sees the same MDAST regardless of whether the author used a bare URL or a directive.

#### 4.13 Image Gallery

```markdown
:::image-gallery{columns="3" gap="1rem"}
![Photo 1](/images/photo1.jpg)
![Photo 2](/images/photo2.jpg)
![Photo 3](/images/photo3.jpg)
![Photo 4](/images/photo4.jpg)
:::
```

**Rendering**: CSS Grid layout with configurable columns. Supports lightbox on click.

#### 4.14 Table of Contents (Auto-Generated)

Not authored in markdown — generated by the remark pipeline from heading structure. Configurable:

- Minimum heading depth (default: `h2`)
- Maximum heading depth (default: `h4`)
- Render position: inline (for documents/PDFs) or sidebar (for web)

#### 4.15 Backlinks

Bidirectional linking within a content collection:

```markdown
See also [[Related Document Title]]
```

**Rendering**: Resolved at build time to actual URLs. Broken links flagged as warnings. Backlink lists generated per-document showing "pages that link here."

**Status**: Implemented in the Lossless site (`remark-backlinks.ts`). Not yet ported to all Astro-Knots sites.

---

### Tier 3: Wish List (Not Yet Implemented)

Features we want but haven't built. Syntax is proposed, not final.

#### 4.16 Math / LaTeX

```markdown
The quadratic formula is $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$.

$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

**Proposed implementation**: `remark-math` + `rehype-katex` or `rehype-mathjax`.

#### 4.17 Highlighted Text

```markdown
This is ==critically important== to understand.
```

**Rendering**: `<mark>` tag with themed styling.

#### 4.18 Obsidian-Style Embeds

```markdown
![[other-document.md]]
![[other-document.md#specific-heading]]
```

**Rendering**: Transclusion — the referenced content is inlined at build time. Heading-specific embeds include only that section.

#### 4.19 Wikilinks with Aliases

```markdown
Read the [[Citation-System-Architecture|citation spec]] for details.
```

**Rendering**: Resolved to the correct URL at build time. Alias text used as link text.

#### 4.20 Definition Lists

```markdown
Term
: Definition of the term

Another Term
: Its definition
: A second definition
```

**Rendering**: `<dl>`, `<dt>`, `<dd>` elements.

#### 4.21 Abbreviations

```markdown
The HTML specification is maintained by the W3C.

*[HTML]: Hyper Text Markup Language
*[W3C]: World Wide Web Consortium
```

**Rendering**: `<abbr>` tags with tooltips on all occurrences of the abbreviated term.

#### 4.22 Custom Containers for Content Types

```markdown
:::investment-thesis
The core thesis is that enzyme-based metabolic interventions represent
a $50B+ market opportunity with regulatory advantages over GLP-1 drugs.
:::

:::key-risk{severity="high"}
Regulatory pathway is unproven for this specific enzyme combination.
:::

:::data-point{source="Goldman Sachs" date="2026-01"}
GLP-1 market projected to reach $100B by 2030.
:::
```

These map to domain-specific Astro components with specialized styling (e.g., investment thesis gets a distinctive border treatment; key risks get severity-colored indicators).

#### 4.23 Smart Popovers and Link Previews

This is a family of hover/focus-activated "more info" surfaces that share a rendering system but are triggered by different content types. The unifying idea: any link or reference in your content can carry rich context that appears on hover without the reader leaving the page.

**4.23.1 — OG-Enriched Link Previews (the flagship feature)**

When a wikilink or standard link points to a page that has Open Graph metadata, hovering over that link shows a rich popover card with the OG image, title, description, and site name:

```markdown
We evaluated [[Enzymedica]] as a primary competitor in the enzyme supplement space.

Our analysis builds on the [Goldman Sachs GLP-1 report](https://www.goldmansachs.com/insights/glp1-market-2030).
```

**Rendering on hover over `[[Enzymedica]]`**:

```
┌─────────────────────────────────────────┐
│ ┌─────────┐                             │
│ │  [OG    │  Enzymedica                 │
│ │  image] │  enzymedica.com             │
│ │         │                             │
│ └─────────┘  Leading enzyme supplement  │
│              brand focusing on digestive │
│              health and metabolic support│
│                                         │
│  Tags: competitor · enzyme · supplement │
│  Last updated: 2026-03-20              │
└─────────────────────────────────────────┘
```

**Rendering on hover over the Goldman Sachs link**:

```
┌─────────────────────────────────────────┐
│ ┌─────────┐                             │
│ │  [OG    │  GLP-1 Market Outlook 2030  │
│ │  image] │  goldmansachs.com           │
│ │         │                             │
│ └─────────┘  Comprehensive analysis of  │
│              the GLP-1 receptor agonist │
│              market trajectory...        │
└─────────────────────────────────────────┘
```

**Data sources for popover content** (resolved in priority order):

| Link Type | Primary Data Source | Fallback |
|-----------|-------------------|----------|
| Wikilink to internal page | Frontmatter of the linked page (`title`, `lede`, `image`, `tags`) | Page's first heading + first paragraph |
| Wikilink to content collection entry | Collection entry's frontmatter | Entry body excerpt |
| External link | OG metadata fetched at build time (`og:title`, `og:description`, `og:image`) | URL domain + page title from `<title>` tag |
| Citation reference `[^hex]` | Citation definition data (title, source, URL, date) | Already handled by citation popovers (4.7) |

**Build-time OG fetching**: External links are crawled at build time (with caching) to extract OG metadata. This data is serialized into a JSON manifest that ships with the page, so popovers are instant (no client-side fetch on hover):

```typescript
// Generated at build time: /src/data/og-cache.json
{
  "https://www.goldmansachs.com/insights/glp1-market-2030": {
    "title": "GLP-1 Market Outlook 2030",
    "description": "Comprehensive analysis of the GLP-1 receptor agonist market trajectory...",
    "image": "https://www.goldmansachs.com/images/og-glp1-2030.jpg",
    "siteName": "Goldman Sachs",
    "fetchedAt": "2026-03-25T10:00:00Z"
  }
}
```

**Cache policy**: OG data is cached per-URL with a configurable TTL (default: 7 days). Stale entries are re-fetched on the next build. Failed fetches (404, timeout, no OG tags) are cached as failures and retried after 24 hours.

**4.23.2 — Wikilink Popover Cards**

Internal wikilinks get especially rich popovers because we have full access to the linked page's content:

```markdown
The [[Citation-System-Architecture|citation system]] uses hex codes for stability.
```

**Rendering on hover**:

```
┌─────────────────────────────────────────┐
│  Citation System Architecture           │
│  ─────────────────────────────────────  │
│  A citation and reference management    │
│  system for Astro sites that need to    │
│  display research-backed infographics,  │
│  data visualizations, and content with  │
│  inline citations.                      │
│                                         │
│  Status: Stable · Updated: 2025-12-17  │
│  Tags: citations, references, markdown  │
│                                  →      │
└─────────────────────────────────────────┘
```

The popover content comes from the linked page's frontmatter:
- `title` → popover heading
- `lede` (or first paragraph) → description
- `status`, `date_modified` → metadata line
- `tags` → tag pills
- Arrow icon → click-through to the full page

**4.23.3 — Inline Tooltips (Author-Defined)**

For terms that need explanation but don't have a linked page, authors define the content inline:

```markdown
The company uses :tooltip[CRISPR]{content="Clustered Regularly Interspaced Short Palindromic Repeats — a gene editing technology that allows precise modification of DNA sequences."} for its core platform.

Their :tooltip[LTV:CAC ratio]{content="Lifetime Value to Customer Acquisition Cost. A healthy SaaS business targets 3:1 or higher. Metabologic projects 8.3:1 at scale."} is projected at 8.3:1.
```

**Rendering**: Dotted underline on the term. On hover, a compact popover with the `content` text. Visually distinct from link popovers (no image, no metadata — just the explanation).

**4.23.4 — Citation Popovers (Already Stable)**

Citation markers `[^hexcode]` already render popovers via the global popover pattern described in `Citation-System-Architecture.md`. These share the same rendering infrastructure as the other popover types.

**4.23.5 — Popover Rendering Architecture (Shared)**

All four popover types use a **single global popover system** (the same pattern proven in the citation system):

```
┌─────────────────────────────────────────────────┐
│  Single global popover element at <body> level  │
│  (escapes all overflow:hidden containers)       │
└─────────────────────┬───────────────────────────┘
                      │
         Event delegation on document
         captures hover/focus on:
                      │
    ┌─────────┬───────┼────────┬──────────────┐
    │         │       │        │              │
  .cite-    .wiki-  .ext-   .tooltip-    .og-link-
  marker    link    link    trigger      preview
    │         │       │        │              │
    ▼         ▼       ▼        ▼              ▼
  Citation  Page    OG card  Inline       OG card
  popover   card    popover  tooltip      popover
```

**Data flow**:
- **Citation popovers**: Data stored in `data-citation-*` attributes on the `<sup>` element
- **Wikilink popovers**: Data stored in `data-preview-*` attributes on the `<a>` element, populated from the linked page's frontmatter at build time
- **External link OG popovers**: Data stored in `data-og-*` attributes on the `<a>` element, populated from the OG cache at build time
- **Inline tooltips**: Data stored in `data-tooltip-content` attribute on the `<span>` element

All popover types use the same positioning logic (`getBoundingClientRect` + viewport boundary detection), the same show/hide animation, and the same keyboard accessibility pattern (`tabindex="0"`, `aria-describedby`).

**Popover opt-out**: Not every link needs a popover. Authors can suppress it:

```markdown
A plain link with no popover: [Goldman Sachs](https://gs.com){.no-preview}

A wikilink with no popover: [[Enzymedica]]{.no-preview}
```

**Configuration** (per-site):

```typescript
remarkLfm({
  popovers: {
    wikilinks: true,          // Popover cards for internal wikilinks
    externalLinks: true,      // OG popovers for external links
    citations: true,          // Citation popovers (default: always on)
    tooltips: true,           // Inline tooltip directives
    ogFetch: {
      enabled: true,          // Fetch OG data at build time
      ttl: 7 * 24 * 60 * 60, // Cache TTL in seconds (7 days)
      timeout: 5000,          // Per-URL fetch timeout (ms)
      maxConcurrent: 10,      // Concurrent fetches during build
      userAgent: 'LFM-OGBot/1.0',
    },
  },
});
```

**Print behavior**: All popovers are hidden in `@media print`. For tooltips, the content is rendered inline in parentheses. For link previews, the URL is shown after the link text. Citations print their superscript number only (the Sources section at the bottom has the full references).

#### 4.24 Timeline / Changelog Blocks

```markdown
:::timeline
- **2024 Q1**: Founded, initial research
- **2024 Q3**: Pre-seed funding ($500K)
- **2025 Q1**: First clinical results
- **2025 Q4**: Series A ($5M target)
:::
```

**Rendering**: Vertical timeline with date markers and styled entries.

#### 4.25 Multi-Column Layout

```markdown
::::columns{count="2"}
:::column
Left column content with full markdown support.
:::

:::column
Right column content.
:::
::::
```

**Rendering**: CSS Grid or Flexbox layout. Collapses to single column on mobile.

#### 4.26 Tabs

```markdown
::::tabs
:::tab{label="JavaScript"}
```js
console.log("hello");
```
:::

:::tab{label="Python"}
```python
print("hello")
```
:::
::::
```

**Rendering**: Tabbed interface with client-side switching. No page reload.

#### 4.27 Steps / Numbered Procedures

```markdown
:::steps
### Install dependencies

```bash
pnpm add @lossless-group/lfm
```

### Configure your pipeline

Add the plugin to your unified pipeline.

### Write content

Start using extended syntax.
:::
```

**Rendering**: Numbered step indicators with connecting lines. Each `###` heading becomes a step.

#### 4.28 Aside / Sidenote

```markdown
Main paragraph content continues here.:sidenote[This is a marginal note that appears in the margin on wide screens and inline on narrow screens.]
```

**Rendering**: Tufte-style sidenotes on desktop, inline expandable on mobile.

#### 4.29 JSON Canvas Visualization

````markdown
```jsoncanvas
{
  "nodes": [...],
  "edges": [...]
}
```
````

**Rendering**: Interactive node-and-edge canvas rendered client-side. Already prototyped in `remark-jsoncanvas-codeblocks.ts`.

#### 4.30 Dialog / Chat UI

Render a back-and-forth conversation between two (or more) participants as a chat interface. This is particularly relevant for documenting AI-assisted workflows, user interviews, design critiques, or any content where the exchange between speakers IS the content.

**Directive syntax:**

```markdown
:::dialog{participants="Michael=human, Claude=ai"}
Michael: So I've been thinking about the citation system. What if we used hex codes instead of sequential numbers?

Claude: That solves the portability problem — a citation keeps its identifier regardless of where it appears. You could copy a paragraph between documents without renumbering.

Michael: Exactly. And it makes grep actually useful across the content corpus.

Claude: The only cost is readability in raw markdown — `[^a1b2c3]` is less meaningful than `[^1]` to a human scanning the source. But that's a worthwhile tradeoff given the stability benefits.

Michael: Agreed. Let's do it.
:::
```

**Rendering**: A chat-style UI with:
- Participant avatars or initials on alternating sides (human left, AI right — or configurable)
- Message bubbles with distinct styling per participant role
- Participant names above or inside each bubble
- Timestamps (optional, if provided)
- Smooth vertical flow, mobile-friendly

**Participant roles and styling:**

| Role | Default Alignment | Default Style |
|------|------------------|---------------|
| `human` | Left | Solid bubble, primary color |
| `ai` | Right | Outlined bubble, accent color |
| `system` | Center | Muted, full-width, no bubble |
| `user` | Left | Alias for `human` |
| `assistant` | Right | Alias for `ai` |

**Extended syntax with metadata per message:**

```markdown
:::dialog{participants="Michael=human, Claude=ai" theme="dark"}
Michael [2026-03-25 14:30]: First message with timestamp.

Claude [2026-03-25 14:31]: Response with timestamp.

> system: Claude is now using the extended thinking model.

Michael: A message without a timestamp is fine too.
:::
```

**Code fence syntax (for Obsidian compatibility):**

````markdown
```dialog
participants: Michael=human, Claude=ai
---
Michael: So I've been thinking about the citation system.

Claude: That solves the portability problem.

Michael: Exactly.
```
````

The code fence version uses a YAML header (above `---`) for config and the rest as the conversation body. Both syntaxes render the same `Dialog.astro` component.

**Multi-participant support:**

```markdown
:::dialog{participants="Michael=human, Sarah=human, Claude=ai"}
Michael: What do you both think about the trigger map approach?

Sarah: I love it. Way simpler than the plugin assembly.

Claude: Agreed — and the YAML config makes it accessible to non-developers.

Michael: Ship it.
:::
```

More than two participants get distinct colors auto-assigned from a palette, or authors can specify colors:

```markdown
:::dialog{participants="Michael=human:#9138E0, Sarah=human:#22A6B5, Claude=ai:#F59C49"}
```

**Print behavior**: Chat bubbles flatten to a simple transcript format — participant name in bold, followed by their message. No bubbles, no alignment, just readable prose.

**Why this matters**: A huge amount of valuable content in our workflow IS the conversation — the back-and-forth with AI where decisions get made, alternatives get explored, and reasoning gets documented. Right now that content either gets lost (context window clears) or gets pasted as raw text with no visual structure. A first-class dialog component makes AI collaboration a publishable content type.

#### 4.31 Obsidian Bases (`.base` Files)

Obsidian introduced [Bases](https://help.obsidian.md/bases) — a YAML-based file format (`.base`) that defines database-like views over your vault's frontmatter properties. Think of it as a lightweight Notion/Airtable that lives as a plain-text file and queries your existing markdown files by their frontmatter.

A `.base` file defines filters, formulas, and views — and Obsidian renders it as a sortable, filterable table UI. We want to support rendering `.base` files (or the equivalent syntax embedded in a code fence) as interactive data tables on our sites.

```markdown
```base
filters:
  and:
    - "category = Specification"
    - "status != Archived"
formulas:
  age: "dateDiff(now(), prop('date_created'), 'days')"
views:
  - type: table
    columns: [title, category, status, age, authors]
    sort: { property: date_modified, direction: desc }
```
```

**Rendering**: A sortable, filterable data table populated from the site's content collection frontmatter at build time. Essentially Obsidian Dataview/Bases for Astro — query your content, render the results as a table.

**Status**: Wish List. The `.base` YAML schema is straightforward; the interesting work is connecting the filter/formula engine to Astro content collections at build time.

#### 4.32 CSS-in-Markdown

One of our strongest differentiators from other markdown flavors: the ability to specify CSS directly in content without dropping into raw HTML. Three levels of control:

**Level 1 — Class annotations on any block** (via directive attributes):

```markdown
:::callout{type="info" .hero-callout .gradient-border}
This callout gets custom CSS classes applied to its wrapper element.
:::

## Section Heading {.accent-underline}

A paragraph with a specific class. {.lead-text}
```

The `{.classname}` syntax (borrowed from Pandoc/kramdown) applies CSS classes to the preceding block element. Multiple classes are space-separated.

**Level 2 — Inline style overrides** (via `style` attribute on directives):

```markdown
::image{src="/hero.jpg" style="border-radius: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.3)"}

:::callout{type="info" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;"}
A callout with a custom gradient background.
:::
```

The `style` attribute is available on ALL directives and passes through to the rendered element's inline styles. This gives authors escape-hatch control without raw HTML.

**Level 3 — Scoped style blocks** (for complex per-document styling):

````markdown
```css scoped
.lead-text {
  font-size: 1.25rem;
  line-height: 1.8;
  color: var(--color-muted-foreground);
}

.hero-callout {
  border-image: linear-gradient(135deg, #667eea, #764ba2) 1;
  border-width: 2px;
}

.accent-underline {
  text-decoration: underline;
  text-decoration-color: var(--color-accent);
  text-underline-offset: 0.3em;
}
```
````

A fenced code block with language `css` and the `scoped` meta flag is NOT rendered as a code block. Instead, its contents are injected as a `<style>` tag scoped to the current document's container. This gives authors full CSS power for per-document customization without affecting other pages.

**Security**: The `style` attribute and `scoped` CSS blocks are sanitized at build time — `url()`, `expression()`, `javascript:`, and `@import` are stripped. This prevents content injection while allowing legitimate styling.

**Implementation**:
- Level 1: A remark plugin that parses `{.class}` annotations on blocks (similar to `remark-attr` or Pandoc's bracketed attributes)
- Level 2: The directive-to-component mapping passes `style` attributes through to rendered elements
- Level 3: A rehype plugin that detects `` ```css scoped `` blocks, extracts the CSS, removes the node from content flow, and injects it as a scoped `<style>` tag in the rendered output

#### 4.31 Auto-Component Rendering (MDX Without MDX)

The most ambitious feature in our flavor: any directive name that matches a registered component is automatically rendered as that component — no imports, no JSX, no `.mdx` file extension required. This gives us the power of MDX with the portability of plain `.md` files.

**How it works — the author's perspective**:

```markdown
:::pricing-table{tiers="3" highlight="pro"}
:::

::team-grid{layout="cards" department="engineering"}

:::feature-comparison{products="metabologic,enzymedica,fodzyme"}
| Feature | Metabologic | Enzymedica | FODZYME |
|---------|------------|------------|---------|
| Enzyme types | Proprietary blend | Generic | Digestive only |
| Clinical data | 3 peer-reviewed | None | 1 pilot study |
| Price/month | $60-120 | $30-50 | $40-60 |
:::
```

The author writes a directive. The rendering layer looks up the directive name in the component registry and renders the corresponding Astro or Svelte component, passing directive attributes as props and directive children as slot content.

**How it works — the system's perspective**:

```
Author writes:        :::pricing-table{tiers="3" highlight="pro"}

remarkDirective       → containerDirective node
parses it as:           name: "pricing-table"
                        attributes: { tiers: "3", highlight: "pro" }

AstroMarkdown.astro   → Looks up "pricing-table" in component registry
renders it as:         → Finds: PricingTable.astro
                       → Renders: <PricingTable tiers="3" highlight="pro" />
```

**Component registration** (per-site):

```typescript
// src/config/markdown-components.ts
export const markdownComponents = {
  'pricing-table': () => import('../components/PricingTable.astro'),
  'team-grid': () => import('../components/TeamGrid.astro'),
  'feature-comparison': () => import('../components/FeatureComparison.astro'),
  'logo-grid': () => import('../components/LogoGrid.astro'),
  'metric-card': () => import('../components/MetricCard.astro'),
  'before-after': () => import('../components/BeforeAfter.astro'),
  // ... any component the site wants to expose to markdown authors
};
```

**Why this is better than MDX**:

| Concern | MDX | Our Approach |
|---------|-----|-------------|
| File extension | Must be `.mdx` | Standard `.md` — no tooling changes |
| Imports | Author writes `import X from '../...'` | Automatic — component registry handles it |
| Syntax | JSX mixed with markdown (confusing for non-developers) | Directive syntax (consistent, learnable) |
| Portability | MDX files are meaningless outside MDX-aware tools | Directives degrade to readable text in any markdown viewer |
| Build coupling | Requires MDX compiler in build chain | Standard remark/rehype — no additional compiler |
| Content/code boundary | Blurred — authors can write arbitrary JS | Clean — authors write content, components are registered by developers |
| AI authoring | AI models struggle with mixed JSX/markdown | AI models handle directive syntax naturally |

**Children as content**: Container directives pass their body as slot content to the component. This is powerful — the component receives parsed markdown that it can render however it wants:

```markdown
:::hero-section{background="/images/hero.jpg" overlay="dark"}
# Welcome to Metabologic

The future of metabolic health is enzyme-based, affordable, and accessible.

:badge[Now Accepting Beta Users]{variant="success"}
:::
```

The `HeroSection.astro` component receives the inner markdown (heading, paragraph, badge) as its default slot, rendered by a nested `AstroMarkdown` call. The component provides the layout, background image, and overlay — the content comes from the markdown.

**Validation**: Unknown directive names (not in the built-in registry AND not in the site's custom registry) produce a build-time warning:

```
WARNING: Unknown directive "pricng-table" at line 42 in market-overview.md
         Did you mean "pricing-table"? (registered in markdown-components.ts)
```

The fuzzy-match suggestion helps catch typos. In production, unknown directives render as a neutral `<div>` with a `data-unknown-directive` attribute for debugging.

---

## 5. Frontmatter Schema

The flavor defines a **recommended frontmatter schema** that content collections can validate against. Not all fields are required — collections define their own Zod schemas — but the flavor recommends these fields:

```yaml
---
# Identity
title: string (required)
lede: string (1-2 sentence summary)
slug: string (URL-safe, auto-generated from title if omitted)

# Dates (ISO 8601)
date_created: YYYY-MM-DD
date_modified: YYYY-MM-DD
date_published: YYYY-MM-DD

# Authorship
authors: string[]
augmented_with: string (AI tool used, if any)

# Classification
tags: string[]
category: string
status: Draft | Review | Published | Archived

# Versioning
at_semantic_version: string (e.g., "0.0.0.1")

# Display
image: string (hero/OG image path)
image_prompt: string (AI image generation prompt, for documentation)
layout: string (override default layout)

# Behavioral
publish: boolean (default true)
toc: boolean (default true for long documents)
---
```

---

## 6. Shared Package Architecture

### 6.1 The Problem With How We Share Code Today

Right now, each of the 5-7 sites we maintain has its own copy of the remark/rehype plugins. When we fix a bug in `remark-directives.ts` in one site, we have to remember to copy it to the others. We usually don't. The result is that Hypernova has one version of the citation parser, Dark-Matter has a slightly different one, mpstaton-site has a third, and the Lossless site (the most mature) has a fourth that's diverged the furthest. Every site is slowly drifting apart.

The astro-knots monorepo was supposed to help with this via the copy-pattern philosophy, but in practice "copy when you remember" means "never copy." We need an actual package.

### 6.2 Architectural Choice: Plugin Assembly vs. Owning the Parser

Before deciding how to distribute the package, we need to decide what's *in* it. There are two fundamentally different approaches:

**Option A — Plugin assembly (the conventional approach)**:

`@lossless-group/lfm` is a preset that installs and configures ~12 remark/rehype plugins from the unified ecosystem. Our package is thin glue code — it pulls in `remark-gfm`, `remark-directive`, `@shikijs/rehype`, `unist-util-visit`, etc., wires them together with opinionated defaults, and adds our custom plugins (citations, auto-unfurl, polyglot parsers) on top.

```
@lossless-group/lfm
├── depends on remark-parse (CommonMark parser)
├── depends on remark-gfm (tables, task lists, strikethrough)
├── depends on remark-directive (:::directive syntax)
├── depends on remark-rehype (MDAST → HAST bridge)
├── depends on rehype-raw (HTML passthrough)
├── depends on @shikijs/rehype (syntax highlighting)
├── depends on unist-util-visit (tree walker)
├── depends on rehype-stringify (HTML output)
└── our code: citations, callouts, auto-unfurl, polyglot parsers, validation
```

*Pros*: Battle-tested parsers, community-maintained, familiar to anyone who's used unified.

*Cons*: Deep dependency tree (~50+ transitive packages), version conflicts between unified ecosystem versions (`unified@10` vs `@11`), debugging through multiple abstraction layers, we inherit every upstream maintainer's opinions and breaking changes.

**Option B — Own the extension parser, minimize dependencies (our preference)**:

`@lossless-group/lfm` depends on a CommonMark parser for the genuinely hard base-level parsing, and then does **everything else ourselves** in a single, readable codebase with no additional dependencies.

```
@lossless-group/lfm
├── peer dependency: remark-parse OR markdown-it (CommonMark + GFM baseline)
├── peer dependency: shiki (syntax highlighting — genuinely complex, worth the dep)
└── our code: EVERYTHING ELSE
    ├── directive parser (~150 lines)
    ├── Markdoc tag parser (~100 lines)
    ├── MDX-lite parser (~120 lines)
    ├── code-fence component router (~80 lines)
    ├── Obsidian callout transformer (~60 lines)
    ├── citation parser (~200 lines)
    ├── auto-unfurl URL detector (~100 lines)
    ├── CSS attribute parser (~80 lines)
    ├── TOC generator (~100 lines)
    ├── wikilink resolver (~80 lines)
    ├── tree walker utility (~50 lines — replaces unist-util-visit)
    ├── validation / linting (~200 lines)
    └── types (~150 lines)
    ≈ 1,500 lines total
```

*Pros*: Near-zero dependency surface (2 peer deps instead of 12+ direct deps), no version conflicts, no transitive dependency bloat, debugging means reading *our* code not someone else's, AI assistants can iterate on any part of the parser in minutes, the parsing code *is* the spec — there's no disconnect between what we document and what runs.

*Cons*: We own the bugs, edge cases accumulate over time, less community leverage for features we haven't thought of yet.

**Why Option B makes sense now in a way it didn't 3 years ago:**

The unified/remark/rehype ecosystem was built in an era when writing parsers was expensive. A developer who needed directive syntax in markdown would spend days writing and debugging a parser, so depending on `remark-directive` (maintained by someone who already did that work) was an obvious win.

But the calculus has changed. With AI-assisted development:
- Writing a directive parser from scratch takes 20 minutes, not 2 days
- Iterating on edge cases takes one conversation, not a deep debugging session
- The "cost" of owning parser code has collapsed while the "cost" of managing dependencies has stayed the same (or gotten worse, as the ecosystem fragments across major versions)

The convenience that justified these plugins no longer outweighs the dependency management overhead they impose. Our extensions — directives, callouts, citations, embeds, auto-unfurl, Markdoc tags — are all fundamentally simple string-parsing tasks. The only genuinely complex parsing problems are CommonMark itself (keep the dependency) and syntax highlighting (keep Shiki). Everything else, we can write and maintain ourselves with less total effort than managing the plugin ecosystem.

**The recommendation**: Start with Option B. Use `remark-parse` + `remark-gfm` for the base CommonMark/GFM layer (that parsing is legitimately hard and well-tested). Use Shiki for syntax highlighting (same reasoning). Write everything else ourselves. If we later discover that some specific unified plugin does something we need that would be painful to replicate, we can add it as a targeted dependency — but the default posture is to own the code rather than depend on a package.

This also means `@lossless-group/lfm` is a *lightweight* package. It doesn't pull in 50 transitive dependencies. It installs fast, builds fast, and has a dependency footprint comparable to `remark-gfm` itself rather than a bloated preset.

### 6.3 The Core Mechanism: A Trigger Map

Strip away all the architecture and the answer to "what is `@lossless-group/lfm`?" is embarrassingly simple:

**It's a config file that maps syntax patterns to behaviors. The developer-user defines the behaviors. Done.**

The entire extension system reduces to a JSON or YAML file like this:

```yaml
# lfm.triggers.yaml — this IS your extended markdown flavor

triggers:

  # Container triggers: match opening/closing delimiters, capture children as markdown
  - name: callout
    syntax:
      - pattern: ':::callout{$attrs}\n$children\n:::'     # directive
      - pattern: '> [!$type] $title\n$children'            # obsidian
      - pattern: '{% callout $attrs %}$children{% /callout %}' # markdoc
    component: Callout
    props:
      type: { required: true, enum: [info, tip, warning, danger, note, success, quote, example] }
      title: { required: false, type: string }

  - name: details
    syntax:
      - pattern: ':::details{$attrs}\n$children\n:::'
    component: Details
    props:
      title: { required: true, type: string }
      open: { required: false, type: boolean, default: false }

  # Leaf triggers: self-closing, no children
  - name: youtube
    syntax:
      - pattern: '::youtube{$attrs}'                         # directive
      - pattern: 'https://www.youtube.com/watch?v=$id'       # bare URL (auto-unfurl)
      - pattern: 'https://youtu.be/$id'                      # short URL
    component: YouTubeEmbed
    props:
      id: { required: true, type: string }
      start: { required: false, type: number }

  - name: soundcloud
    syntax:
      - pattern: '::soundcloud{$attrs}'
      - pattern: 'https://soundcloud.com/$path'
    component: SoundCloudEmbed
    props:
      url: { required: true, type: string }

  # Inline triggers: appear within paragraph text
  - name: badge
    syntax:
      - pattern: ':badge[$content]{$attrs}'
    component: Badge
    inline: true
    props:
      variant: { required: false, enum: [default, success, warning, danger, date, version] }

  - name: tooltip
    syntax:
      - pattern: ':tooltip[$content]{$attrs}'
    component: Tooltip
    inline: true
    props:
      content: { required: true, type: string }

  # Code fence triggers: identifier string escapes syntax highlighting
  - name: card-grid
    syntax:
      - pattern: ':::card-grid{$attrs}\n$children\n:::'     # directive (markdown children)
      - pattern: '```card-grid\n$raw\n```'                   # code fence (JSON/YAML content)
    component: CardGrid
    props:
      columns: { required: false, type: number, default: 3 }

  - name: mermaid
    syntax:
      - pattern: '```mermaid\n$raw\n```'
    component: MermaidDiagram
    skipHighlighting: true

  # Dialog / chat UI: renders conversation as chat bubbles
  - name: dialog
    syntax:
      - pattern: ':::dialog{$attrs}\n$children\n:::'           # directive (markdown children)
      - pattern: '```dialog\n$raw\n```'                         # code fence (YAML header + conversation)
    component: Dialog
    props:
      participants: { required: true, type: string }            # "Name=role, Name=role"
      theme: { required: false, enum: [light, dark, auto] }

  # Citation trigger: special syntax with definition pairs
  - name: citation
    syntax:
      - pattern: '[^$hexcode]'                               # inline reference
    definition:
      - pattern: '[^$hexcode]: $definition'                  # footnote-style definition
    component: InlineCitation
    inline: true
```

That's it. That's the whole extension system. A developer who wants to add a new component to their markdown just adds a trigger entry — a name, one or more syntax patterns, a component reference, and a props schema. The LFM parser reads this file, scans the markdown for matches, and produces component nodes. The rendering layer maps component names to actual component files.

**What the LFM package provides:**
1. A parser that reads this trigger map and knows how to match the syntax patterns against markdown text
2. A handful of built-in triggers (the ones in this spec) shipped as a default `lfm.triggers.yaml`
3. A way for sites to extend or override the trigger map with their own entries
4. The normalized component node type that all triggers produce

**What the developer-user provides:**
1. The actual components (Astro, Svelte, React, whatever)
2. Any custom trigger entries for their domain-specific components
3. The rendering layer that maps component names to component files (or uses the default AstroMarkdown recursive renderer)

The trigger map is the **single source of truth** for what syntax does what. It replaces:
- The directive registry (section 13.4)
- The component mapping table (section 7.2)
- The auto-unfurl platform table (section 4.12)
- The code fence component identifier list (section 4.3.1)
- Half the validation logic (props schema is right there in the trigger)

And because it's a YAML file, not code, a content author or project manager can read it and understand exactly what extended syntax their site supports — without reading a line of TypeScript.

**Configuration layering:**

```
@lossless-group/lfm built-in triggers (the defaults — callouts, embeds, citations, etc.)
        ↓ merged with
Site-level lfm.triggers.yaml (custom components, overrides)
        ↓ merged with
Collection-level overrides (optional — e.g., slide content enables slide triggers)
```

A site that just wants the defaults:

```javascript
import { remarkLfm } from '@lossless-group/lfm';
// Uses built-in triggers. Done. That's the whole setup.
```

A site that adds custom triggers:

```javascript
import { remarkLfm } from '@lossless-group/lfm';

remarkLfm({
  triggers: './lfm.triggers.yaml',  // extends built-in triggers with site-specific ones
});
```

A site that wants to start from scratch:

```javascript
import { remarkLfm } from '@lossless-group/lfm';

remarkLfm({
  triggers: './lfm.triggers.yaml',
  builtins: false,  // don't load default triggers — only use what's in the file
});
```

### 6.4 Distribution Strategy: Published Package, Not Workspace Dependency

> **UPDATE (2026-03-30):** This section has been revised to reflect actual implementation. The workspace-only phase was skipped — the package is published to both GitHub Packages and JSR. Sites install it as a real dependency, not via `workspace:*`.

**Critical constraint**: Each site must be independently deployable from its own repository. Sites are git submodules — they cannot depend on the monorepo's `packages/` directory at deploy time. Therefore, `@lossless-group/lfm` is a **published package** that sites install like any other dependency.

**Why `@lossless-group` and not `@lossless`?** GitHub Packages requires the npm scope to match the GitHub org name. Our org is `lossless-group`, so the scope is `@lossless-group`. This applies to both GitHub Packages and JSR.

**Current state (as of 2026-03-30):**

The package is published to two registries:

| Registry | URL | Auth Required to Install |
|----------|-----|------------------------|
| **GitHub Packages** | `npm.pkg.github.com` | Yes (`GITHUB_TOKEN`) |
| **JSR** | [jsr.io/@lossless-group/lfm](https://jsr.io/@lossless-group/lfm) | No |

**Source code** lives in the astro-knots monorepo at `packages/lfm/`. Development happens there.

**How sites consume the package:**

Each site's `package.json`:

```json
{
  "dependencies": {
    "@lossless-group/lfm": "^0.1.0"
  }
}
```

Each site's `.npmrc` (tells pnpm where to find `@lossless-group` packages):

```
@lossless-group:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

**Publishing workflow** (from `packages/lfm/`):

```bash
# Bump version in package.json and deno.json

# Build and publish to GitHub Packages
pnpm build
pnpm publish

# Publish to JSR (TypeScript source directly, no build step needed)
pnpx jsr publish --allow-dirty
```

**Why two registries?**
- **GitHub Packages** is the primary distribution channel — works with pnpm, ties into our existing GitHub infrastructure, supports private packages if needed.
- **JSR** (jsr.io) is the modern, TypeScript-first registry — publishes source directly (no build step), auto-generates documentation, works with Deno and Bun natively. As JSR matures, it may become the primary channel.

**Future: npm public registry**

When the package is stable enough for external users, we can additionally publish to the public npm registry. Nothing changes for our sites — just an additional publish target.

### 6.2.1 Rendering Layer Distribution: Parser vs. Renderer Boundary

**The architectural split**: `@lossless-group/lfm` is a *parser* — it takes markdown and produces an MDAST tree. Turning that tree into HTML requires a *renderer*, which is framework-specific (Astro components, Svelte components, React components, etc.) and inherently site-customizable (every site wants different styling, layout, and component choices).

This creates a distribution question: how do sites get the rendering layer?

**Current state (as of 2026-04):** Each site owns its own `AstroMarkdown.astro` renderer and directive-specific components (`MarkdownImage.astro`, `Callout.astro`, `CodeBlock.astro`, etc.). These are copied from reference implementations in `packages/astro/` and adapted per-site.

**Three options under consideration:**

#### Option A: CLI Scaffolding

A `pnpx @lossless-group/lfm init` command that copies starter `.astro` files into the site's `src/components/markdown/` directory. The site then owns the files and can customize freely.

```bash
pnpx @lossless-group/lfm init --framework astro
# Creates:
#   src/components/markdown/AstroMarkdown.astro
#   src/components/markdown/MarkdownImage.astro
#   src/components/markdown/Callout.astro
#   src/components/markdown/CodeBlock.astro
```

*Pros*: Aligned with copy-and-adapt philosophy. Site owns the code. No runtime dependency on a component package. Authors can see and modify everything.

*Cons*: No automatic updates when new features are added to LFM. Sites diverge over time (which may be desirable or not). Requires maintaining a CLI tool.

#### Option B: Published Astro Integration Package

A separate `@lossless-group/lfm-astro` package that exports `.astro` components as importable dependencies. Sites import components rather than copying them.

```typescript
import { AstroMarkdown } from '@lossless-group/lfm-astro';
import { MarkdownImage, Callout, CodeBlock } from '@lossless-group/lfm-astro/components';
```

*Pros*: Sites automatically get new features and bug fixes via version bumps. Single source of truth for rendering behavior. Less per-site maintenance.

*Cons*: Harder to customize per-site — every styling override requires the component to support it via props or CSS custom properties. Creates a second published package to maintain. Fights the principle that rendering is inherently site-specific. Astro component packages have some ecosystem friction (not all bundlers handle `.astro` imports from `node_modules` cleanly).

#### Option C: Pattern Package (`@knots/astro`)

Keep rendering components in the existing `packages/astro/` workspace package as reference implementations. Sites copy from there when setting up markdown rendering. This is the current `@knots/*` copy-pattern approach.

```bash
# Copy the reference implementation into your site
cp packages/astro/src/components/markdown/*.astro sites/my-site/src/components/markdown/
# Adapt to your site's needs
```

*Pros*: Already how the project works. No new tooling or packages needed. Reference implementations are always visible in the monorepo for comparison.

*Cons*: "Copy when you remember" tends toward "never copy." No mechanism for notifying sites when reference implementations improve. Only works for developers working within the astro-knots monorepo — external users can't access `packages/astro/`.

#### Which Option When?

These options are not mutually exclusive:

- **For internal sites (astro-knots monorepo)**: Option C works fine — developers can see and copy from `packages/astro/`.
- **For external adopters**: Option A (CLI scaffolding) is the friendliest onboarding experience.
- **For teams that want managed updates**: Option B provides the tightest integration, at the cost of customizability.

The recommendation is to start with **Option C** (which already works) and add **Option A** when external adoption becomes a goal. Option B should only be pursued if demand from external users justifies the maintenance cost of a second published package.

### 6.3 Package Structure

```
packages/lfm/
├── src/
│   ├── index.ts                # Main preset exports: remarkLfm, rehypeLfm
│   ├── remark/
│   │   ├── polyglot.ts         # Polyglot syntax normalizer (directives, Markdoc, MDX-lite, code fences)
│   │   ├── gfm.ts              # remarkGfm configuration
│   │   ├── directives.ts       # remarkDirective + directive validation + registry
│   │   ├── markdoc.ts          # {% tag %} parser → normalized component nodes
│   │   ├── mdx-lite.ts         # <Component /> parser (restricted, no JS expressions)
│   │   ├── code-components.ts  # Code fence identifier → component node transform
│   │   ├── callouts.ts         # Obsidian callout → directive transform
│   │   ├── citations.ts        # Hex-code citation processing
│   │   ├── auto-unfurl.ts      # Bare URL → embed directive transform
│   │   ├── backlinks.ts        # Wikilink / backlink resolution
│   │   ├── toc.ts              # Table of contents generation
│   │   ├── slides.ts           # Slide separator handling
│   │   ├── images.ts           # Image path resolution
│   │   └── css-attrs.ts        # {.class #id style="..."} attribute parsing
│   ├── rehype/
│   │   ├── shiki.ts            # Syntax highlighting config
│   │   ├── mermaid-pre.ts      # Mermaid extraction (before Shiki)
│   │   ├── scoped-css.ts       # ```css scoped → <style> injection
│   │   ├── autolink.ts         # Heading anchor links
│   │   └── raw.ts              # Raw HTML passthrough
│   ├── types.ts                # TypeScript types for all custom MDAST nodes
│   ├── registry.ts             # Built-in directive/component registry
│   └── validate.ts             # Build-time syntax validation + linting
├── test/
│   ├── fixtures/               # Input markdown files for each feature
│   │   ├── callouts.md
│   │   ├── citations.md
│   │   ├── embeds.md
│   │   ├── code-components.md
│   │   └── ...
│   ├── snapshots/              # Expected MDAST output for each fixture
│   └── *.test.ts               # Vitest test files
├── package.json
├── tsconfig.json
├── tsup.config.ts              # Build config (ESM + CJS dual output)
├── CHANGELOG.md
├── LICENSE                     # MIT
└── README.md                   # Usage docs, quick-start, link to full spec
```

### 6.4 package.json

```json
{
  "name": "@lossless-group/lfm",
  "version": "0.1.0",
  "description": "Lossless Flavored Markdown — a polyglot extended markdown pipeline for remark/rehype",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./remark/*": {
      "import": "./dist/remark/*.js",
      "types": "./dist/remark/*.d.ts"
    },
    "./rehype/*": {
      "import": "./dist/rehype/*.js",
      "types": "./dist/rehype/*.d.ts"
    },
    "./validate": {
      "import": "./dist/validate.js",
      "types": "./dist/validate.d.ts"
    },
    "./types": {
      "import": "./dist/types.js",
      "types": "./dist/types.d.ts"
    },
    "./registry": {
      "import": "./dist/registry.js",
      "types": "./dist/registry.d.ts"
    }
  },
  "files": ["dist", "README.md", "LICENSE", "CHANGELOG.md"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc --noEmit",
    "prepublishOnly": "pnpm build && pnpm test"
  },
  "peerDependencies": {
    "unified": ">=10.0.0",
    "remark-parse": ">=10.0.0",
    "remark-gfm": ">=4.0.0",
    "shiki": ">=1.0.0"
  },
  "peerDependenciesMeta": {
    "shiki": { "optional": true }
  },
  "dependencies": {},
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  },
  "keywords": [
    "markdown",
    "remark",
    "rehype",
    "unified",
    "extended-markdown",
    "directives",
    "callouts",
    "citations",
    "astro",
    "obsidian",
    "markdoc"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/lossless-group/lfm"
  },
  "license": "MIT",
  "author": "Michael Staton <michael@lossless.group>"
}
```

### 6.5 Build Configuration

We use `tsup` for building because it handles ESM + CJS dual output, tree-shaking, and declaration files with zero config:

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'validate': 'src/validate.ts',
    'types': 'src/types.ts',
    'registry': 'src/registry.ts',
    'remark/polyglot': 'src/remark/polyglot.ts',
    'remark/directives': 'src/remark/directives.ts',
    'remark/citations': 'src/remark/citations.ts',
    'remark/callouts': 'src/remark/callouts.ts',
    'remark/auto-unfurl': 'src/remark/auto-unfurl.ts',
    'remark/backlinks': 'src/remark/backlinks.ts',
    'remark/toc': 'src/remark/toc.ts',
    'remark/code-components': 'src/remark/code-components.ts',
    'remark/css-attrs': 'src/remark/css-attrs.ts',
    'rehype/shiki': 'src/rehype/shiki.ts',
    'rehype/mermaid-pre': 'src/rehype/mermaid-pre.ts',
    'rehype/scoped-css': 'src/rehype/scoped-css.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: true,
  treeshake: true,
});
```

This gives consumers tree-shakeable imports — if a site only uses citations and callouts, the rest of the package is dead-code-eliminated.

### 6.6 Usage

**As a preset** (recommended — use everything):

```typescript
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { remarkLfm, rehypeLfm } from '@lossless-group/lfm';

const processor = unified()
  .use(remarkParse)
  .use(remarkLfm, {
    citations: true,
    backlinks: true,
    callouts: true,
    autoUnfurl: true,
    polyglot: {
      markdoc: true,          // parse {% tag %} syntax
      mdxLite: false,         // don't parse <Component /> syntax
      codeFenceComponents: ['card-grid', 'card-carousel', 'image-grid'],
    },
    slides: false,            // opt-out per feature
    toc: { minDepth: 2, maxDepth: 4 },
    customDirectives: [
      // site-specific directives
    ],
  })
  .use(remarkRehype)
  .use(rehypeLfm, {
    shiki: { theme: 'tokyo-night' },
    mermaid: true,
    scopedCss: true,
  })
  .use(rehypeStringify);
```

**Cherry-picking** (for sites that want surgical control):

```typescript
import { remarkCitations } from '@lossless-group/lfm/remark/citations';
import { remarkCallouts } from '@lossless-group/lfm/remark/callouts';
import { remarkAutoUnfurl } from '@lossless-group/lfm/remark/auto-unfurl';
import { rehypeMermaidPre } from '@lossless-group/lfm/rehype/mermaid-pre';
```

**In Astro config** (the most common integration point):

```javascript
// astro.config.mjs
import { remarkLfm } from '@lossless-group/lfm';

export default defineConfig({
  markdown: {
    remarkPlugins: [
      [remarkLfm, { citations: true, callouts: true }],
    ],
    // Disable Astro's built-in Shiki — LFM handles it
    syntaxHighlight: false,
  },
});
```

### 6.7 MDAST Node Types

The package exports TypeScript types for all custom nodes so that AstroMarkdown components (or any consumer) can type-check their rendering logic:

```typescript
// Extended MDAST node types
interface CalloutNode extends Parent {
  type: 'containerDirective';
  name: 'callout';
  attributes: {
    type: 'info' | 'tip' | 'warning' | 'danger' | 'note' | 'success' | 'quote' | 'example';
    title?: string;
  };
}

interface CitationRefNode extends Literal {
  type: 'footnoteReference';
  identifier: string;   // hex code, e.g. "1ucdcd"
  resolvedIndex?: number; // sequential integer assigned at render time
}

interface BadgeNode extends Parent {
  type: 'textDirective';
  name: 'badge';
  attributes: {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'date' | 'version';
  };
}

interface ComponentNode extends Parent {
  // The unified node type produced by ALL trigger syntaxes (directive, Markdoc, MDX-lite, code fence)
  type: 'componentNode';
  name: string;                        // e.g. "callout", "youtube", "card-grid"
  attributes: Record<string, string>;  // key-value props (always strings)
  triggerSyntax: 'directive' | 'markdoc' | 'mdx-lite' | 'code-fence' | 'obsidian-callout' | 'auto-unfurl';
  rawContent?: string;                 // for code fence triggers: the fence body as a string
}

// ... more types for each feature
```

The `ComponentNode` type is the key — it's the unified representation that all trigger syntaxes normalize to. The `triggerSyntax` field is metadata for debugging ("which syntax produced this node?") but the rendering layer should never branch on it.

### 6.8 Validation Mode

```typescript
import { validateLfm } from '@lossless-group/lfm/validate';

const warnings = validateLfm(markdownString, {
  strictDirectives: true,   // Warn on unrecognized directive names
  checkCitations: true,     // Warn on [^hex] without definitions
  checkLinks: false,        // Skip link checking
  customDirectives: ['investment-thesis', 'key-risk'],  // site-specific names to allow
});

// warnings: [
//   { line: 42, message: "Unknown directive ':foobar'. Did you mean ':figma'?" },
//   { line: 87, message: "Citation [^abc123] has no definition" },
// ]
```

### 6.9 Versioning Strategy

We use **semantic versioning** with a practical interpretation for a markdown pipeline:

| Change Type | Version Bump | Example |
|-------------|-------------|---------|
| New trigger syntax parser | Minor | Adding Markdoc parser (0.2.0 → 0.3.0) |
| New built-in directive | Minor | Adding `::spotify` embed (0.3.0 → 0.4.0) |
| Bug fix in existing plugin | Patch | Fix citation parser edge case (0.3.0 → 0.3.1) |
| Change to normalized node shape | **Major** | Renaming `attributes` to `props` (0.x → 1.0.0) |
| Change that alters rendered output | **Major** | Callout HTML structure change (0.x → 1.0.0) |
| New optional config flag | Patch | Adding `polyglot.markdoc` option (0.3.0 → 0.3.1) |

**Pre-1.0 reality**: While we're pre-1.0, minor versions may include breaking changes. This is standard npm convention. We'll try to avoid it but won't contort the API to prevent it. Once we hit 1.0 (after stable use across all our sites + at least one external user), semver is strict.

### 6.10 Publishing Workflow

**For internal releases** (GitHub Packages):

```bash
# In packages/lfm/
pnpm version patch        # or minor, or major
pnpm build
pnpm test
pnpm publish --registry https://npm.pkg.github.com
```

**For public releases** (npm):

```bash
pnpm version patch
pnpm build
pnpm test
pnpm publish --access public
```

**Automated** (when we have CI — Phase 3+):

A GitHub Action on the `packages/lfm` path triggers on push to main:
1. Run tests
2. If `package.json` version changed, publish to GitHub Packages
3. If a git tag like `lfm@0.3.0` is pushed, also publish to npm public

### 6.11 Repository Strategy

**Option A — Monorepo package (recommended for now)**:

`@lossless-group/lfm` lives at `astro-knots/packages/lfm/`. This keeps it close to the sites that consume it, makes development trivial (edit package → reload site), and avoids managing another repo.

**Option B — Standalone repo (recommended for public release)**:

When/if we publish to npm public, move the package to its own repo at `github.com/lossless-group/lfm`. This gives it:
- Its own issue tracker (people can file bugs against the package, not the monorepo)
- Its own CI/CD pipeline
- Its own README/docs that aren't buried in a monorepo
- A clean git history focused on the package

The migration from A to B is straightforward: `git subtree split` or just copy the directory, push to the new repo, and update the sites to depend on the published version instead of `workspace:*`.

**We start with Option A and graduate to Option B when external interest justifies it.**

### 6.12 How Sites Consume the Package (Summary)

| Context | How the Site Gets `@lossless-group/lfm` | Version |
|---------|----------------------------------|---------|
| **Local dev in monorepo** | pnpm workspace protocol (`workspace:*`) | Always latest from source |
| **Site deploying from its own repo (Vercel)** | npm install from GitHub Packages or npm | Pinned semver (e.g., `^0.3.0`) |
| **External user** | npm install from public npm registry | Pinned semver |
| **Copy-pattern holdouts** | Copy `packages/lfm/src/` into their site | Whatever they copied, frozen in time |

The copy-pattern option remains available for sites that refuse dependencies or need to diverge. But the recommendation is: **use the package.** That's the whole point.

---

## 7. Rendering Architecture

The flavor defines the pipeline, but rendering is done by Astro components. Each site owns its renderer.

### 7.1 Pipeline Flow

```
                    Content (Markdown + Frontmatter)
                                │
                    ┌───────────┴───────────┐
                    │     remarkParse        │
                    │  (CommonMark → MDAST)  │
                    └───────────┬───────────┘
                                │
                    ┌───────────┴───────────┐
                    │    remarkLfm Preset    │
                    │  ┌─────────────────┐   │
                    │  │ remarkGfm       │   │
                    │  │ remarkDirective │   │
                    │  │ remarkCallouts  │   │
                    │  │ remarkCitations │   │
                    │  │ remarkBacklinks │   │
                    │  │ remarkToc       │   │
                    │  └─────────────────┘   │
                    └───────────┬───────────┘
                                │
                         Extended MDAST
                    (standard + custom nodes)
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                  │
    ┌─────────┴──────┐  ┌──────┴───────┐  ┌──────┴───────┐
    │ AstroMarkdown  │  │ rehypeLfm +  │  │  Validation  │
    │ (component     │  │ stringify    │  │  (build-time │
    │  rendering)    │  │ (HTML output)│  │   warnings)  │
    └────────────────┘  └──────────────┘  └──────────────┘
```

### 7.2 AstroMarkdown Component Mapping

The recursive `AstroMarkdown.astro` component maps MDAST nodes to Astro components:

| MDAST Node Type | Directive Name | Astro Component | Source |
|----------------|---------------|-----------------|--------|
| `heading` | — | `<h1>`..`<h6>` with `id` + anchor | Built-in |
| `code` | — | `CodeBlock.astro` | Built-in |
| `code` (css scoped) | — | `<style>` injection (not rendered as code block) | Built-in |
| `containerDirective` | `callout` | `Callout.astro` | Built-in |
| `containerDirective` | `details` | `Details.astro` | Built-in |
| `containerDirective` | `image-gallery` | `ImageGallery.astro` | Built-in |
| `containerDirective` | `columns` | `Columns.astro` | Built-in |
| `containerDirective` | `tabs` | `Tabs.astro` | Built-in |
| `containerDirective` | `steps` | `Steps.astro` | Built-in |
| `containerDirective` | `timeline` | `Timeline.astro` | Built-in |
| `containerDirective` | *(any registered name)* | *(site's component registry)* | Auto-component |
| `leafDirective` | `image` | `MarkdownImage.astro` | Built-in |
| `leafDirective` | `youtube` | `YouTubeEmbed.astro` | Built-in / auto-unfurl |
| `leafDirective` | `soundcloud` | `SoundCloudEmbed.astro` | Built-in / auto-unfurl |
| `leafDirective` | `figma` | `FigmaEmbed.astro` | Built-in / auto-unfurl |
| `leafDirective` | `loom` | `LoomEmbed.astro` | Built-in / auto-unfurl |
| `leafDirective` | `tweet` | `TweetEmbed.astro` | Built-in / auto-unfurl |
| `leafDirective` | `spotify` | `SpotifyEmbed.astro` | Built-in / auto-unfurl |
| `leafDirective` | `vimeo` | `VimeoEmbed.astro` | Built-in / auto-unfurl |
| `leafDirective` | `codepen` | `CodePenEmbed.astro` | Built-in / auto-unfurl |
| `leafDirective` | `embed` | `GenericEmbed.astro` (sandboxed iframe) | Built-in |
| `leafDirective` | `page-break` | CSS `break-before: page` | Built-in |
| `leafDirective` | *(any registered name)* | *(site's component registry)* | Auto-component |
| `textDirective` | `badge` | `Badge.astro` | Built-in |
| `textDirective` | `tooltip` | `Tooltip.astro` | Built-in |
| `textDirective` | `sidenote` | `Sidenote.astro` | Built-in |
| `footnoteReference` | — | `InlineCitation.astro` | Built-in |
| `paragraph` (single URL) | — | Platform-specific embed (auto-unfurl) | Built-in |
| Block with `{.class}` | — | Adds CSS class to rendered element | Built-in |
| Block with `{style="..."}` | — | Adds inline styles to rendered element | Built-in |

The **Source** column distinguishes between:
- **Built-in**: Ships with `@lossless-group/lfm`, always available
- **Auto-unfurl**: Bare URLs on their own line are automatically converted to the corresponding embed directive
- **Auto-component**: Directive names not in the built-in list are looked up in the site's component registry (see 4.31)

---

## 8. Content Authoring Guide (For Humans and AI)

This section is the "cheat sheet" that content authors (and AI assistants generating markdown) should reference.

### 8.1 Quick Reference Card

```markdown
# Heading 1
## Heading 2

**bold** *italic* ~~strikethrough~~ `inline code`

- Unordered list
1. Ordered list
- [x] Task (done)
- [ ] Task (not done)

[Link text](url)
![Alt text](image-url)

> Blockquote

---

| Col A | Col B |
|-------|-------|
| val   | val   |

:::callout{type="info" title="Note"}
Callout content.
:::

:badge[Label]{variant="success"}

Some claim.[^abc123]

[^abc123]: 2026. [Title](url). Published: 2026-03-25

```language
code block
```

```mermaid
graph TD
  A --> B
```

:::details{title="Expandable"}
Hidden content.
:::

::youtube{id="video-id"}
::figma{url="https://figma.com/..."}

# Or just paste the URL — auto-unfurls:
https://www.youtube.com/watch?v=dQw4w9WgXcQ
https://soundcloud.com/artist/track-name

:::image-gallery{columns="3"}
![](/img/1.jpg)
![](/img/2.jpg)
![](/img/3.jpg)
:::

# CSS: class annotations on blocks
## My Heading {.accent-underline}

A styled paragraph. {.lead-text}

:::callout{type="info" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white;"}
Inline style overrides on any directive.
:::

# Auto-component rendering (any registered component):
:::pricing-table{tiers="3" highlight="pro"}
:::

::team-grid{layout="cards"}
```

### 8.2 Rules for AI-Generated Content

When an AI assistant (Claude, GPT, etc.) generates markdown content for our sites:

1. **Use directive syntax** for all extended features — not raw HTML, not MDX, not JSX
2. **Always include frontmatter** with at minimum `title`, `date_created`, `tags`
3. **Use hex-code citations** — never hardcode sequential numbers. Generate a 6-char hex code for each source and include the full `[^hexcode]: YYYY. [Title](URL). Published: YYYY-MM-DD` definition
4. **Prefer `:::callout` over `> [!type]`** — both work, but directives are canonical
5. **Fenced code blocks must have a language** — no bare triple-backticks
6. **Images should use the `::image` directive** when captions or sizing are needed
7. **For embeds, prefer bare URLs on their own line** — just paste the YouTube/SoundCloud/Vimeo URL on a blank line and the renderer handles it. Only use `::youtube{id="..."}` when you need attributes like `start` time
8. **Use `{.classname}` for styling hints** — prefer class annotations over inline `style` attributes when the site has relevant CSS classes defined
9. **For custom components, use the directive name** — `:::pricing-table{props}` not `<PricingTable props />`. The registry handles the mapping
10. **Do not use MDX syntax** — no JSX, no imports, no expressions, no `.mdx` extension

---

## 9. Compatibility Matrix

How our flavor interacts with common tools:

| Tool | Compatibility | Notes |
|------|-------------|-------|
| **VS Code** | Excellent | Standard markdown preview works; directives show as raw but don't break |
| **Obsidian** | Good | GFM + callouts render; directives show as raw text; wikilinks work natively |
| **GitHub** | Good | GFM features render; directives/citations show as raw text |
| **Notion import** | Partial | Basic markdown imports; extended features lost |
| **Astro (our sites)** | Full | Everything renders via our pipeline |
| **Pandoc** | Good | Most CommonMark/GFM works; directives need a filter |
| **AI assistants** | Good | Claude/GPT understand directive syntax when prompted |

**Graceful degradation**: The flavor is designed so that unsupported features degrade to readable text. A `:::callout{type="warning"}` in GitHub will show as a fenced block with the directive syntax visible — ugly but not broken.

---

## 10. Implementation Phases

### Phase 1: Codify and Extract — DONE (2026-03-26)

- ~~Write this spec~~
- ~~Create `packages/lfm/` in the astro-knots monorepo~~
- ~~Implement first plugin: `remarkCallouts` (Obsidian `> [!type]` → directive normalization)~~
- ~~Create `remarkLfm` preset wrapping remarkGfm + remarkDirective + remarkCallouts~~
- ~~Export `parseMarkdown()` convenience function~~
- ~~Get `pnpm build` passing~~
- Still TODO: Extract remaining plugins from `site/src/utils/markdown/` (citations, backlinks, images, toc, code-components)
- Still TODO: Add tests

### Phase 2: Publish and Wire Into First Site — DONE (2026-03-26)

- ~~Publish `@lossless-group/lfm@0.1.0` to GitHub Packages~~
- ~~Publish `@lossless-group/lfm@0.1.1` to JSR (jsr.io)~~
- ~~Wire into mpstaton-site as a real published dependency (not workspace:*)~~
- ~~Implement context-v detail page rendering using the package~~
- ~~Copy AstroMarkdown renderer into mpstaton-site (site-owned rendering layer)~~
- Still TODO: Wire into remaining sites (hypernova, cilantro, twf, dark-matter, cogs)

**Key decision made:** Skipped the workspace-only phase. Sites install the published package, not `workspace:*`. This preserves independent deployability.

### Phase 3: Wire Into All Sites (Current)

- Add `@lossless-group/lfm` to each site's `package.json`
- Copy the AstroMarkdown renderer (or a site-appropriate variant) into each site
- Replace per-site remark plugin copies with imports from the shared package
- Verify rendering parity — build each site, check for regressions
- Delete the per-site plugin copies once parity is confirmed

### Phase 4: Extract Remaining Plugins

- Port `remark-citations.ts` from `site/src/utils/markdown/` into the package
- Port `remark-backlinks.ts` (wikilink resolution)
- Port `remark-images.ts` (wiki-style image path normalization)
- Port `remark-toc.ts` (table of contents generation)
- Port `remark-code-components.ts` (code fence → component routing)
- Port `remark-directives.ts` (directive → component mapping with registry)
- Each plugin: extract → add to preset → test → bump version → publish

### Phase 5: Wish List Features and Stabilization

- Implement Wish List features based on author demand, one at a time
- Each feature goes through: remark plugin → MDAST type → AstroMarkdown branch → Astro component
- Each new feature starts as Beta, graduates to Stable after use across 2+ sites
- Build out the polyglot parsers (Markdoc, MDX-lite) as authors encounter those syntaxes

### Phase 6: Public npm Release (Optional)

- Additionally publish to the public npm registry if external interest justifies it
- Write a proper README with quick-start guide, feature gallery, and link to this spec
- Consider moving to its own repo (`github.com/lossless-group/lfm`) for independent issue tracking

---

## 11. Open Questions

1. **Naming**: Settled — **Lossless Flavored Markdown (LFM)**. Echoes the "GitHub Flavored Markdown (GFM)" convention. Package: `@lossless-group/lfm` (scoped to the GitHub org `lossless-group`). Published to both GitHub Packages and JSR.

2. **Obsidian callout parity**: Should we support ALL Obsidian callout types (there are ~13) or just our curated set? Obsidian has types like `abstract`, `todo`, `bug`, `failure` that we haven't needed.

3. **Wikilinks scope**: If we support `[[wikilinks]]`, what's the resolution scope? Within a single content collection? Across all collections in a site? Across sites?

4. **Math rendering**: KaTeX (faster, smaller) or MathJax (more complete, heavier)? For our use case (occasional formulas in investment memos), KaTeX is probably sufficient.

5. **Package distribution**: Settled — published to GitHub Packages and JSR from day one. No workspace:* phase — sites install the published package as a real dependency. See Section 6.4 for the full distribution strategy.

6. **Custom directive registration**: Should sites be able to register custom directive names that the shared package doesn't know about? If so, how does validation work?

7. **Frontmatter schema enforcement**: Should the shared package include Zod schemas for frontmatter, or is that purely a per-collection concern?

---

## 12. Related Documents

- `Maintain-Extended-Markdown-Render-Pipeline.md` — The pipeline architecture for Astro-Knots
- `Citation-System-Architecture.md` — Hex-code citation system design
- `Codeblock-Syntax-Highlighting-with-Shiki.md` — Shiki integration pattern
- `Slides-System-for-Astro-and-Markdown.md` — Presentation slides in markdown
- `Managing-Complex-Markdown-Content-at-Build-Time.md` — Content sourcing patterns

---

## 13. Directive System Deep Dive

The directive system is the heart of our extensibility. This section formalizes the grammar, nesting rules, attribute syntax, and registration model.

### 13.1 Formal Grammar

The directive syntax follows the [CommonMark Generic Directive Proposal](https://talk.commonmark.org/t/generic-directives-plugins-syntax/444) with minor conventions added:

```
TextDirective    = ":" name [ "[" content "]" ] [ "{" attributes "}" ]
LeafDirective    = "::" name [ "[" content "]" ] [ "{" attributes "}" ]
ContainerDirective = ":::" name [ "{" attributes "}" ] NEWLINE
                     body
                     ":::"
```

Where:
- `name` is a kebab-case identifier: `[a-z][a-z0-9-]*` (e.g., `callout`, `image-gallery`, `key-risk`)
- `content` is inline markdown (only meaningful for text directives)
- `attributes` is a space-separated list of `key="value"` pairs or bare flags
- `body` is arbitrary markdown (parsed recursively for container directives)

### 13.2 Attribute Syntax

Attributes follow HTML-like conventions:

```markdown
:::callout{type="warning" title="Watch Out" collapsible}
```

| Form | Example | Meaning |
|------|---------|---------|
| Key-value (quoted) | `type="warning"` | String attribute |
| Key-value (unquoted) | `columns=3` | String attribute (no spaces allowed in value) |
| Bare flag | `collapsible` | Boolean true |
| Class shorthand | `.highlight` | Adds CSS class |
| ID shorthand | `#my-section` | Sets element ID |

Multiple classes and mixed forms are allowed:

```markdown
:::callout{type="info" .custom-class #my-callout collapsible}
```

### 13.3 Nesting Rules

Container directives can nest using increasing colon counts:

```markdown
::::columns{count="2"}
:::column
Left side content.

:::callout{type="tip"}
A callout nested inside a column.
:::

:::

:::column
Right side content.
:::
::::
```

**Nesting depth limit**: 4 levels (`:::`, `::::`, `:::::`, `::::::`). Deeper nesting is a sign of overly complex content and will trigger a validation warning.

**Self-nesting**: A directive CAN nest inside itself (e.g., `:::details` inside `:::details`) as long as the colon counts are different.

### 13.4 Directive Registry

The shared package maintains a registry of known directive names. Each entry defines:

```typescript
interface DirectiveRegistryEntry {
  name: string;                      // kebab-case name
  type: 'text' | 'leaf' | 'container'; // which directive form(s) it supports
  description: string;               // human-readable description
  attributes: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'enum';
      required?: boolean;
      default?: any;
      values?: string[];             // for enum type
      description: string;
    };
  };
  tier: 'stable' | 'beta' | 'wishlist';
  since?: string;                    // version when added
  component?: string;                // suggested Astro component name
}
```

**Built-in registry** (ships with `@lossless-group/lfm`):

```typescript
const builtinDirectives: DirectiveRegistryEntry[] = [
  {
    name: 'callout',
    type: 'container',
    description: 'Callout/admonition block with type-based styling',
    attributes: {
      type: { type: 'enum', required: true, values: ['info', 'tip', 'warning', 'danger', 'note', 'success', 'quote', 'example'], description: 'Visual style' },
      title: { type: 'string', required: false, description: 'Override default title' },
      collapsible: { type: 'boolean', required: false, default: false, description: 'Make content toggleable' },
    },
    tier: 'stable',
    component: 'Callout.astro',
  },
  {
    name: 'details',
    type: 'container',
    description: 'Collapsible content section',
    attributes: {
      title: { type: 'string', required: true, description: 'Summary text shown when collapsed' },
      open: { type: 'boolean', required: false, default: false, description: 'Start expanded' },
    },
    tier: 'stable',
    component: 'Details.astro',
  },
  {
    name: 'badge',
    type: 'text',
    description: 'Inline styled label',
    attributes: {
      variant: { type: 'enum', required: false, values: ['default', 'success', 'warning', 'danger', 'date', 'version'], default: 'default', description: 'Color variant' },
    },
    tier: 'stable',
    component: 'Badge.astro',
  },
  {
    name: 'youtube',
    type: 'leaf',
    description: 'Embedded YouTube video',
    attributes: {
      id: { type: 'string', required: true, description: 'YouTube video ID' },
      start: { type: 'number', required: false, description: 'Start time in seconds' },
    },
    tier: 'beta',
    component: 'YouTubeEmbed.astro',
  },
  // ... full registry in package source
];
```

**Custom directive registration** (per-site):

```typescript
import { remarkLfm } from '@lossless-group/lfm';

// Site registers domain-specific directives
const processor = unified()
  .use(remarkParse)
  .use(remarkLfm, {
    customDirectives: [
      {
        name: 'investment-thesis',
        type: 'container',
        description: 'Highlighted investment thesis block',
        attributes: {},
        tier: 'stable',
        component: 'InvestmentThesis.astro',
      },
      {
        name: 'key-risk',
        type: 'container',
        description: 'Risk callout with severity',
        attributes: {
          severity: { type: 'enum', values: ['low', 'medium', 'high', 'critical'], required: false, default: 'medium', description: 'Risk severity' },
        },
        tier: 'stable',
        component: 'KeyRisk.astro',
      },
    ],
  });
```

Validation will accept both built-in and custom-registered directive names. Unknown directives trigger a warning (not an error) to allow gradual adoption.

### 13.5 Directive-to-Component Contract

The remark layer does NOT render directives. It transforms them into well-typed MDAST nodes and passes them downstream. The rendering layer (AstroMarkdown or rehype) is responsible for mapping directive names to actual components.

**The contract**:

1. **Remark layer guarantees**: Every directive node in the MDAST has `name`, `attributes` (validated), and `children` (parsed markdown for containers) or `value` (raw text for leaves)
2. **Rendering layer guarantees**: Every registered directive name maps to exactly one component. Unknown directives render as a visible warning block in development and are silently skipped in production
3. **Neither layer assumes the other**: You can swap rendering layers (e.g., use rehype-stringify instead of AstroMarkdown) without changing the remark pipeline

---

## 14. Print / PDF Behavior

Every feature must degrade gracefully to print. Our sites use `window.print()` + CSS `@page` rules for PDF generation. This means interactive features must have print-friendly fallbacks.

### 14.1 Print Behavior Matrix

| Feature | Print Behavior | Notes |
|---------|---------------|-------|
| **Headings** | Normal | Include anchors as invisible targets for TOC links |
| **Code blocks** | Dark background preserved | Ensure `background-color` is not stripped by `@media print` |
| **Mermaid diagrams** | Rendered as static SVG | Mermaid generates SVG — print captures it as-is |
| **Callouts** | Full rendering with colored left border | Background colors may be stripped by some browsers; border-left is reliable |
| **Badges** | Inline with border instead of background | Background colors unreliable in print; switch to `border` + `color` |
| **Citations** | Superscript numbers, no hover popover | Popover JS is irrelevant in print; Sources section at bottom is critical |
| **Tables** | Full rendering with borders | Ensure `border-collapse` and cell padding are print-explicit |
| **Details/collapsible** | Forced open | All `<details>` elements set to `open` via `@media print` |
| **Embeds (YouTube, etc.)** | Link + thumbnail | Replace iframe with a linked thumbnail image and URL |
| **Image gallery** | Grid layout preserved | May need `break-inside: avoid` on gallery items |
| **TOC** | Inline rendering, no sticky sidebar | Sidebar hidden; inline TOC visible |
| **Tabs** | All tabs visible, stacked | Print shows all tab contents sequentially |
| **Columns** | Single column | Multi-column collapses to single column for narrow print |
| **Timeline** | Linear list with dates | Timeline visual simplified to a styled list |
| **Tooltips** | Content shown inline in parentheses | `The company uses CRISPR (Clustered Regularly... ) for its core platform.` |
| **Sidenotes** | Inline in parentheses | Marginal notes collapse to inline |

### 14.2 Print-Specific CSS Pattern

```css
@media print {
  /* Force all details open */
  details { display: block !important; }
  details > summary { display: none; }
  details > *:not(summary) { display: block !important; }

  /* Hide interactive-only elements */
  .copy-button, .toc-sidebar, .mobile-toc-container { display: none !important; }

  /* Force callout backgrounds (some browsers strip them) */
  .callout { border-left: 4px solid currentColor; padding-left: 1rem; }

  /* Embeds → linked thumbnails */
  .embed-container iframe { display: none; }
  .embed-container .print-fallback { display: block !important; }

  /* Tabs → all visible */
  .tab-panel { display: block !important; }
  .tab-panel::before { content: attr(data-tab-label); font-weight: 700; }

  /* Columns → single column */
  .columns-container { display: block !important; }
  .columns-container > .column { margin-bottom: 1rem; }

  /* Sidenotes → inline */
  .sidenote { display: inline; }
  .sidenote::before { content: " ("; }
  .sidenote::after { content: ") "; }

  /* Tooltips → inline content */
  .tooltip .tooltip-content { display: inline !important; }
  .tooltip .tooltip-content::before { content: " ("; }
  .tooltip .tooltip-content::after { content: ") "; }

  /* Code blocks: preserve dark background */
  pre.shiki {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    background-color: #1a1b26 !important;
  }
}
```

### 14.3 Page Break Hints

Authors can suggest page breaks for print/PDF:

```markdown
::page-break
```

And prevent breaks inside a block:

```markdown
:::no-break
This content should stay together on one page.
Including this table and the paragraph above it.
:::
```

**CSS implementation**:
```css
.page-break { break-before: page; }
.no-break { break-inside: avoid; }
```

---

## 15. Accessibility Requirements

Every rendered feature must meet WCAG 2.1 AA at minimum.

### 15.1 Per-Feature Accessibility

| Feature | Requirement | Implementation |
|---------|------------|----------------|
| **Headings** | Proper hierarchy (no skipping levels) | Validation warning if H2 follows H4 |
| **Code blocks** | Accessible to screen readers | `role="code"`, `aria-label` with language, copy button labeled |
| **Callouts** | Semantic role | `role="note"` or `role="alert"` for danger/warning |
| **Citations** | Keyboard-navigable popovers | `tabindex="0"`, `role="button"`, `aria-describedby` linking to popover |
| **Tables** | Scope and headers | `<th scope="col">`, `<caption>` from directive title attribute |
| **Details** | Native `<details>/<summary>` | Built-in accessibility; ensure summary is descriptive |
| **Embeds** | Title attributes on iframes | `<iframe title="YouTube: Video Title">` |
| **Image gallery** | Alt text required | Validation error if any gallery image lacks alt text |
| **Tabs** | ARIA tabs pattern | `role="tablist"`, `role="tab"`, `role="tabpanel"`, arrow key navigation |
| **Tooltips** | ARIA tooltip pattern | `aria-describedby`, visible on focus (not just hover) |
| **Mermaid** | Alt text fallback | `aria-label` on SVG with diagram description |
| **Badges** | Color not sole indicator | Text content is the primary information; color is supplementary |

### 15.2 Validation Rules (Accessibility)

The linter/validator enforces:

```
WARNING: Image in gallery at line 42 has no alt text
WARNING: Heading skip: H2 at line 10, then H4 at line 25 (missing H3)
WARNING: Table at line 60 has no caption — consider adding {title="..."}
ERROR:   Embed at line 80 has no accessible label
```

### 15.3 Color Contrast

All callout types, badges, and themed elements must meet 4.5:1 contrast ratio in both light and dark modes. The shared package ships a contrast check utility:

```typescript
import { checkCalloutContrast } from '@lossless-group/lfm/a11y';

// Returns warnings for any callout type that fails contrast
const issues = checkCalloutContrast(siteThemeTokens);
```

---

## 16. Dark / Light / Vibrant Mode Behavior

Our sites support three visual modes. Every feature must work in all three.

### 16.1 Mode-Aware Rendering

| Feature | Dark Mode | Light Mode | Vibrant Mode |
|---------|-----------|------------|-------------|
| **Code blocks** | Dark (tokyo-night) | Dark (unchanged) | Dark (unchanged) |
| **Callout backgrounds** | Semi-transparent on dark surface | Semi-transparent on light surface | Semi-transparent on vibrant surface |
| **Callout borders** | Bright accent color | Darker accent color | Neon accent color |
| **Badges** | Light text on dark pill | Dark text on light pill | Light text on saturated pill |
| **Citation markers** | Lilac accent | Primary blue | Neon accent |
| **Tables** | Subtle row striping, light borders | Standard striping, darker borders | High-contrast striping |
| **Mermaid diagrams** | Dark theme variables | Light theme variables | Custom vibrant variables |
| **Blockquotes** | Dim border, muted text | Gray border, standard text | Accent border, bright text |
| **Links** | Underlined, accent color | Underlined, primary color | Underlined, neon color |

### 16.2 Implementation Pattern

Components use CSS custom properties tied to the `data-mode` attribute on `<html>`:

```css
/* Callout component */
.callout {
  border-left: 4px solid var(--callout-border-color);
  background: var(--callout-bg-color);
}

:global([data-mode="dark"]) .callout--warning {
  --callout-border-color: #f59e0b;
  --callout-bg-color: rgba(245, 158, 11, 0.08);
}

:global([data-mode="light"]) .callout--warning {
  --callout-border-color: #d97706;
  --callout-bg-color: rgba(217, 119, 6, 0.06);
}

:global([data-mode="vibrant"]) .callout--warning {
  --callout-border-color: #fbbf24;
  --callout-bg-color: rgba(251, 191, 36, 0.12);
}
```

### 16.3 Mode Detection for Non-CSS Contexts

Mermaid diagrams, JSON Canvas, and other JS-rendered features need to know the current mode:

```typescript
function getCurrentMode(): 'dark' | 'light' | 'vibrant' {
  return document.documentElement.getAttribute('data-mode') as any || 'dark';
}

// Re-render on mode change
const observer = new MutationObserver(() => {
  const mode = getCurrentMode();
  mermaid.initialize({ theme: mode === 'light' ? 'default' : 'dark' });
  mermaid.run();
});
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });
```

---

## 17. Edge Cases and Gotchas

### 17.1 Directive Syntax Conflicts

**Problem**: A line starting with `:::` could be confused with a container directive when the author just wants a visual separator.

**Rule**: `:::` alone on a line (no name following) is treated as a thematic break, not a directive. This matches CommonMark behavior for `---`.

**Problem**: Colon at start of list item looks like a text directive.

```markdown
- :badge[New] This is fine — the `:` is clearly a text directive
- :not-a-directive — this will be parsed as a text directive with name "not-a-directive"
```

**Rule**: Unknown directive names produce a validation warning but are rendered as plain text in production. No silent failures.

### 17.2 Code Blocks Inside Directives

Fenced code blocks inside container directives require careful fence management:

````markdown
:::callout{type="info"}
Here is some example code:

```javascript
const x = 1;
```

And here is more text after the code.
:::
````

This works because the triple-backtick fence is a different delimiter than `:::`. But if you use tildes (`~~~`) for code fences, the same rules apply.

**Gotcha**: Code blocks that contain directive-like syntax are NOT parsed as directives (they're inside a code fence). This is standard CommonMark behavior and is correct.

### 17.3 Frontmatter Edge Cases

**Multiple YAML documents**: Only the first `---`-delimited block is frontmatter. A second `---` in the body is a thematic break.

**YAML type coercion**: YAML `true`, `false`, `null`, and bare numbers are parsed as their respective types, not strings. If you want the string `"true"`, quote it:

```yaml
---
title: "true"        # String "true", not boolean
count: "42"          # String "42", not number
publish: true         # Boolean true
---
```

**Special characters in titles**: YAML special characters (`:`, `#`, `{`, `}`) in values must be quoted:

```yaml
---
title: "Markdown: A Complete Guide"     # Correct
title: Markdown: A Complete Guide        # YAML parse error
---
```

### 17.4 Citation Hex Code Collisions

With 6-character lowercase alphanumeric codes, there are ~2.18 billion possible codes. Collisions are astronomically unlikely in any real corpus. However, the validator checks for duplicates within a collection and warns if found.

**Deterministic generation**: When possible, generate hex codes from a hash of the source URL. This means the same source always gets the same hex code, even if cited in different documents:

```typescript
function generateHexCode(url: string): string {
  const hash = crypto.createHash('md5').update(url).digest('hex');
  return hash.substring(0, 6);
}
```

### 17.5 Image Paths

Images in markdown content can reference:

| Path Type | Example | Resolution |
|-----------|---------|-----------|
| Absolute (public) | `/images/hero.jpg` | Served from site's `public/` directory |
| Relative | `./assets/diagram.png` | Relative to the markdown file's location |
| Remote | `https://example.com/img.jpg` | Fetched at build time (optional) or referenced directly |
| Astro import | Not supported | Use directive or standard syntax instead |

**Gotcha**: Content that lives in a package (`node_modules/@lossless/content/...`) cannot use relative image paths that reference files outside the package. Images should be in `public/` or use absolute URLs.

### 17.6 Nested Blockquotes and Obsidian Callouts

Obsidian callout syntax uses blockquote prefix (`>`). This means you can't easily nest a regular blockquote inside an Obsidian callout:

```markdown
> [!info] Note
> This is the callout content.
> > This is a nested blockquote inside the callout — ambiguous!
```

**Rule**: We recommend using directive syntax for callouts when nesting is needed:

```markdown
:::callout{type="info" title="Note"}
This is the callout content.

> This is a blockquote inside the callout — unambiguous.
:::
```

---

## 18. Domain-Specific Extensions (Investment / VC)

Beyond general-purpose markdown features, we define domain-specific directives for the investment memo and VC use case. These are registered as custom directives per-site, not part of the core shared package.

### 18.1 Investment Content Directives

#### Investment Thesis Block

```markdown
:::investment-thesis
Enzyme-based metabolic interventions represent a $50B+ market opportunity.
The company's proprietary enzyme design platform offers 10x cost advantage
over GLP-1 drugs with no prescription requirement, creating a massive
consumer health opportunity that incumbents cannot easily replicate.
:::
```

**Rendering**: Distinctive visual treatment — colored left border, larger type, optional icon. In memos, this is the "elevator pitch" block. In PDFs, gets page-break avoidance.

#### Key Risk Block

```markdown
:::key-risk{severity="high" category="regulatory"}
The FDA pathway for this specific enzyme combination is unproven.
No directly comparable product has received clearance, which means
regulatory timeline is uncertain and could extend by 12-18 months.
:::
```

**Rendering**: Severity-colored indicator (green/yellow/orange/red for low/medium/high/critical). Category tag shown as a badge. In the one-pager, high/critical risks get flagged automatically.

**Severity levels**:

| Severity | Color | Meaning |
|----------|-------|---------|
| `low` | Green | Manageable, standard for the space |
| `medium` | Yellow | Notable, needs monitoring |
| `high` | Orange | Significant, could affect thesis |
| `critical` | Red | Deal-breaker potential, must be addressed |

**Risk categories**: `regulatory`, `market`, `technology`, `team`, `financial`, `competitive`, `legal`, `operational`

#### Data Point Block

```markdown
:::data-point{source="Goldman Sachs" date="2026-01" confidence="verified"}
The GLP-1 market is projected to reach $100B by 2030, up from $24B in 2025.
:::
```

**Rendering**: Styled attribution block with source, date, and confidence indicator. Useful for key statistics that need clear provenance.

**Confidence levels**: `verified` (human-confirmed), `ai-sourced` (AI found it, not yet verified), `estimated` (rough figure), `projected` (forward-looking)

#### Comparable Company Card

```markdown
::comparable{name="Enzymedica" funding="Private" stage="Growth" relevance="primary"}
```

**Rendering**: Compact card with company name, funding status, stage, and relevance level. Used in competitive landscape sections. Can be grouped in a `:::comparable-grid`.

#### Scorecard Item

```markdown
:::scorecard-item{dimension="Market Size" score="4" max="5"}
The addressable market exceeds $50B and is growing at 15%+ annually.
Strong demographic tailwinds (aging population, metabolic health crisis)
provide durable demand regardless of economic cycles.
:::
```

**Rendering**: Score visualization (filled/empty dots or bar), dimension label, and supporting text. Used for the 12Ps scorecard or similar evaluation frameworks.

### 18.2 Investment Memo Template Sections

These aren't directives — they're frontmatter-driven section types that influence layout:

```yaml
---
title: "Metabologic: Investment Memo"
type: investment-memo
sections:
  - overview
  - why-invest
  - market-overview
  - team
  - business-economics
  - fundraising-round
  - flags
memo_version: "v0.2.5"
firm: "Humain Ventures"
deal: "Metabologic"
---
```

The `type: investment-memo` triggers a memo-specific layout with:
- Firm branding in header/footer
- Section numbering
- One-pager summary generation
- PDF export with branded cover page

---

## 19. Content Portability

A core principle: content written in Lossless Flavored Markdown should be **maximally portable**. You should be able to move a `.md` file between sites, between repos, and between tools with predictable results.

### 19.1 Portability Tiers

| Destination | What Works | What Degrades | What Breaks |
|-------------|-----------|---------------|-------------|
| **Another LFM site** | Everything | Nothing | Nothing |
| **Obsidian** | CommonMark, GFM, callouts (Obsidian syntax), wikilinks | Directives show as raw text | Nothing breaks outright |
| **VS Code preview** | CommonMark, GFM, code blocks | Everything else shows as raw text | Nothing breaks |
| **GitHub rendering** | CommonMark, GFM, Mermaid, math (partial) | Directives, citations, callouts | Nothing breaks |
| **Notion import** | CommonMark basics | Most extended features lost | Complex tables may break |
| **Pandoc conversion** | CommonMark, GFM, math | Directives need custom filter | Nothing breaks with `--from gfm` |
| **Plain text (email, etc.)** | Readable prose | All formatting lost | Nothing breaks |

### 19.2 Export Formats

The shared package should support exporting LFM content to:

| Format | Method | Fidelity |
|--------|--------|----------|
| **HTML** | rehype-stringify (built-in) | Full |
| **PDF** | HTML → window.print() / Puppeteer | Full minus interactivity |
| **DOCX** | HTML → pandoc → docx | High (tables, headings, images, callouts as styled blocks) |
| **Plain Markdown** | Strip directives, flatten citations | Lossy but readable |
| **Obsidian-compatible** | Convert directives to Obsidian callouts, keep wikilinks | High for common features |
| **Slide deck** | Extract slide-separated content → reveal.js | Full for slide content |

### 19.3 Import from Other Formats

Content coming INTO our system:

| Source | Strategy |
|--------|----------|
| **Obsidian vault** | Callouts already compatible; wikilinks need collection-scoped resolution; embeds need path rewriting |
| **Notion export** | Markdown is basic; needs frontmatter addition; links need rewriting |
| **Google Docs** | Export as HTML → Pandoc → Markdown → add frontmatter |
| **Confluence** | Export as HTML → Pandoc → Markdown → significant cleanup needed |
| **Word documents** | Pandoc → Markdown → add frontmatter and directives |

---

## 20. Link Handling Deep Dive

Links are deceptively complex. Different link types need different handling.

### 20.1 Link Types

| Type | Example | Behavior |
|------|---------|----------|
| **External** | `[text](https://example.com)` | Opens in new tab, `rel="noopener noreferrer"`, external icon |
| **Internal (relative)** | `[text](./other-page)` | Standard navigation, same tab |
| **Internal (absolute)** | `[text](/blueprints/my-doc)` | Standard navigation, same tab |
| **Anchor** | `[text](#section-heading)` | Smooth scroll to anchor |
| **Wikilink** | `[[Page Title]]` | Resolved at build time to internal URL |
| **Auto-detected URL** | `https://example.com` | Converted to clickable link (GFM autolink) |
| **Email** | `mailto:user@example.com` | Opens mail client |

### 20.2 Smart Link Embeds (Wish List)

When a URL is on its own line (not inline in a paragraph), the renderer can optionally "unfurl" it into a rich preview card:

```markdown
Here is a relevant article:

https://www.nytimes.com/2026/03/15/health/metabolic-enzymes.html
```

**Rendering**: OpenGraph card with title, description, and thumbnail (fetched at build time). Falls back to a plain link if OG data is unavailable.

**Opt-out**: Prefix with `\` to prevent unfurling:

```markdown
\https://www.nytimes.com/2026/03/15/health/metabolic-enzymes.html
```

### 20.3 Broken Link Detection

At build time, the validator can check:

- **Internal links**: Does the target page exist in any content collection?
- **Anchor links**: Does the target heading ID exist in the current document?
- **Wikilinks**: Does the target title match any document?
- **External links** (optional, slow): Does the URL return a 200 status?

```
WARNING: Broken internal link at line 42: /blueprints/old-page (not found)
WARNING: Broken anchor at line 67: #nonexistent-heading
WARNING: Unresolved wikilink at line 89: [[Page That Does Not Exist]]
INFO:    External link check: 3/47 URLs returned non-200 status
```

---

## 21. Image Handling Deep Dive

### 21.1 Image Sources

| Source | Syntax | Build Behavior |
|--------|--------|---------------|
| `public/` directory | `![alt](/images/hero.jpg)` | Copied as-is to output |
| `src/assets/` | Not supported in markdown (use directive) | Would need Astro import |
| Remote URL | `![alt](https://cdn.example.com/img.jpg)` | Referenced directly (no download) |
| Content-relative | `![alt](./assets/diagram.png)` | Resolved relative to markdown file |

### 21.2 Responsive Images (Wish List)

The image directive should support responsive art direction:

```markdown
::image{
  src="/images/chart.png"
  srcset="/images/chart-400.png 400w, /images/chart-800.png 800w, /images/chart-1200.png 1200w"
  sizes="(max-width: 600px) 400px, (max-width: 1000px) 800px, 1200px"
  alt="Market growth chart"
  caption="Source: Goldman Sachs Research, 2026"
}
```

### 21.3 Image Optimization

When using Astro's image optimization (Sharp), images referenced from `src/assets/` get automatic optimization. But content images in `public/` or from remote URLs do not.

**Proposed solution**: A build-time image optimization pass that:
1. Scans all markdown content for image references
2. Downloads remote images to a local cache
3. Generates responsive variants (WebP, AVIF)
4. Rewrites image references to optimized versions

This is a Phase 4+ feature and should be opt-in per collection.

---

## 22. Performance Considerations

### 22.1 Plugin Cost

Not all remark/rehype plugins are equal in cost:

| Plugin | Cost | Notes |
|--------|------|-------|
| `remarkParse` | Baseline | Always needed |
| `remarkGfm` | Low | Well-optimized |
| `remarkDirective` | Low | Simple syntax extension |
| `remarkCitations` | Medium | Two-pass (collect definitions, then resolve references) |
| `remarkBacklinks` | High | Requires cross-document index; must process all docs first |
| `remarkToc` | Low | Single-pass heading extraction |
| `rehypeShiki` | High | Syntax highlighting is CPU-intensive; cache aggressively |
| `rehypeMermaidPre` | Low | Simple node transformation |
| External link checking | Very High | Network requests; must be opt-in and cached |

### 22.2 Build-Time Optimization Strategies

1. **Shiki caching**: Cache highlighted code block HTML by content hash. If the code + language hasn't changed, reuse the cached output
2. **Parallel processing**: Process independent documents in parallel (Astro does this for content collections)
3. **Lazy backlinks**: Build the cross-document index once, then look up per-document (don't re-scan all docs for each page)
4. **Skip validation in production**: Run full validation in dev/CI, skip in production builds for speed
5. **Mermaid SSR** (future): Render Mermaid diagrams at build time instead of client-side to reduce JS payload

### 22.3 Client-Side Performance

Features that add client-side JavaScript:

| Feature | JS Added | Loading Strategy |
|---------|---------|-----------------|
| Copy button on code blocks | ~1KB | Inline script, no framework |
| Mermaid diagrams | ~800KB | CDN, lazy-loaded when in viewport |
| Citation popovers | ~2KB | Inline script, event delegation |
| Tabs | ~1KB | Inline script, no framework |
| JSON Canvas | ~50KB+ | Lazy-loaded, only when canvas is in viewport |
| Table sorting | ~3KB | Lazy-loaded, only for tables with `sortable` attribute |
| Lightbox | ~15KB | Lazy-loaded, only when gallery images are clicked |

**Budget**: Total JavaScript from markdown features should not exceed 5KB eagerly loaded. Everything else must be lazy.

---

## 23. Content Linting Rules

Beyond syntax validation, the shared package defines content quality rules that can be enforced at build time or in a pre-commit hook.

### 23.1 Structural Rules

```
RULE: frontmatter-required
  Every .md file must have YAML frontmatter with at least `title` and `date_created`

RULE: heading-hierarchy
  Heading levels must not skip (H2 → H4 without H3)

RULE: single-h1
  A document should have at most one H1 heading (the title)

RULE: code-block-language
  Every fenced code block must specify a language (no bare ```)

RULE: image-alt-text
  Every image must have non-empty alt text

RULE: citation-completeness
  Every [^hexcode] reference must have a corresponding definition

RULE: no-bare-urls-in-prose
  URLs in paragraph text should be wrapped in link syntax, not bare
```

### 23.2 Style Rules (Optional)

```
RULE: max-heading-length
  Headings should be under 80 characters

RULE: no-trailing-whitespace
  Lines should not end with trailing spaces

RULE: consistent-list-markers
  Use either `-` or `*` for unordered lists, not both

RULE: blank-line-around-blocks
  Directives, code blocks, and tables should have blank lines before and after

RULE: no-html
  Prefer directives over raw HTML (warning, not error)
```

### 23.3 Domain Rules (Investment Memos)

```
RULE: citation-density
  Each section should have at least 2 citations per 500 words

RULE: risk-coverage
  A memo must include at least one :::key-risk block

RULE: thesis-required
  A memo must include an :::investment-thesis block

RULE: source-freshness
  Citation published dates should be within 2 years of the memo date
```

---

## 24. Migration Guide

For sites currently using ad-hoc remark plugin copies, here's the migration path to the shared package.

### 24.1 Audit Current Plugins

Run this across your site to find all remark/rehype usage:

```bash
# Find all remark/rehype plugin imports
grep -r "from.*remark-\|from.*rehype-\|\.use(remark\|\.use(rehype" src/ --include="*.ts" --include="*.mjs" --include="*.astro"

# Find all custom remark plugins
find src/ -name "remark-*.ts" -o -name "rehype-*.ts"
```

### 24.2 Compare Against Shared Package

For each plugin found:

| Your Plugin | Shared Package Equivalent | Action |
|------------|--------------------------|--------|
| `src/utils/remark-directives.ts` | `@lossless-group/lfm/remark/directives` | Replace, migrate custom directive names to `customDirectives` config |
| `src/utils/remark-citations.ts` | `@lossless-group/lfm/remark/citations` | Replace |
| `src/utils/remark-toc.ts` | `@lossless-group/lfm/remark/toc` | Replace |
| `src/utils/remark-custom-feature.ts` | (none) | Keep as site-specific plugin, load after the preset |

### 24.3 Wire Up the Preset

**Before** (ad-hoc):

```typescript
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import { remarkDirectiveToComponent } from '../utils/remark-directives';
import { remarkCitations } from '../utils/remark-citations';
import { remarkToc } from '../utils/remark-toc';

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkDirective)
  .use(remarkDirectiveToComponent)
  .use(remarkCitations)
  .use(remarkToc);
```

**After** (shared package):

```typescript
import { remarkLfm } from '@lossless-group/lfm';

const processor = unified()
  .use(remarkParse)
  .use(remarkLfm, {
    citations: true,
    toc: { minDepth: 2, maxDepth: 4 },
    customDirectives: [
      // any site-specific directives
    ],
  });
```

### 24.4 Verify Rendering Parity

After migration, compare rendered output:

1. Build the site with the old plugins, save the HTML output
2. Switch to the shared package, rebuild
3. Diff the HTML output — any differences are regressions to investigate

```bash
# Quick smoke test
diff <(curl -s http://localhost:4321/blueprints/test-page) old-output.html
```

---

## 25. VS Code Authoring Support

Authors writing Lossless Flavored Markdown in VS Code should have a good experience even without our rendering pipeline.

### 25.1 Recommended Extensions

| Extension | Purpose |
|-----------|---------|
| **Markdown All in One** | TOC generation, list editing, math preview |
| **markdownlint** | Enforce structural lint rules |
| **Markdown Preview Mermaid** | Mermaid diagrams in VS Code preview |
| **YAML** (Red Hat) | Frontmatter validation and autocomplete |

### 25.2 Snippet Library (Proposed)

A VS Code snippets file (`.vscode/lfm.code-snippets`) shipped with the shared package:

```json
{
  "LFM: Callout": {
    "prefix": "callout",
    "body": [
      ":::callout{type=\"${1|info,tip,warning,danger,note,success,quote,example|}\" title=\"${2:Title}\"}",
      "$0",
      ":::"
    ],
    "description": "Insert a callout/admonition block"
  },
  "LFM: Details": {
    "prefix": "details",
    "body": [
      ":::details{title=\"${1:Click to expand}\"}",
      "$0",
      ":::"
    ],
    "description": "Insert a collapsible details block"
  },
  "LFM: Badge": {
    "prefix": "badge",
    "body": ":badge[${1:Label}]{variant=\"${2|default,success,warning,danger,date,version|}\"}",
    "description": "Insert an inline badge"
  },
  "LFM: Citation": {
    "prefix": "cite",
    "body": [
      "[^${1:hexcode}]",
      "",
      "[^${1:hexcode}]: ${2:YYYY}. [${3:Title}](${4:URL}). Published: ${5:YYYY-MM-DD}"
    ],
    "description": "Insert a hex-code citation with definition"
  },
  "LFM: YouTube Embed": {
    "prefix": "youtube",
    "body": "::youtube{id=\"${1:video-id}\"}",
    "description": "Embed a YouTube video"
  },
  "LFM: Image Gallery": {
    "prefix": "gallery",
    "body": [
      ":::image-gallery{columns=\"${1:3}\"}",
      "![${2:Alt 1}](${3:/images/1.jpg})",
      "![${4:Alt 2}](${5:/images/2.jpg})",
      "![${6:Alt 3}](${7:/images/3.jpg})",
      ":::"
    ],
    "description": "Insert an image gallery"
  },
  "LFM: Columns": {
    "prefix": "columns",
    "body": [
      "::::columns{count=\"${1:2}\"}",
      ":::column",
      "${2:Left content}",
      ":::",
      "",
      ":::column",
      "${3:Right content}",
      ":::",
      "::::"
    ],
    "description": "Insert a multi-column layout"
  },
  "LFM: Frontmatter": {
    "prefix": "front",
    "body": [
      "---",
      "title: ${1:Document Title}",
      "lede: ${2:One-line summary}",
      "date_created: ${CURRENT_YEAR}-${CURRENT_MONTH}-${CURRENT_DATE}",
      "date_modified: ${CURRENT_YEAR}-${CURRENT_MONTH}-${CURRENT_DATE}",
      "status: Draft",
      "authors:",
      "  - ${3:Michael Staton}",
      "tags: [${4:tag1, tag2}]",
      "---",
      "",
      "# ${1:Document Title}",
      "",
      "$0"
    ],
    "description": "Insert LFM frontmatter template"
  },
  "LFM: Investment Thesis": {
    "prefix": "thesis",
    "body": [
      ":::investment-thesis",
      "$0",
      ":::"
    ],
    "description": "Insert an investment thesis block"
  },
  "LFM: Key Risk": {
    "prefix": "risk",
    "body": [
      ":::key-risk{severity=\"${1|low,medium,high,critical|}\" category=\"${2|regulatory,market,technology,team,financial,competitive,legal,operational|}\"}",
      "$0",
      ":::"
    ],
    "description": "Insert a key risk block"
  },
  "LFM: Tabs": {
    "prefix": "tabs",
    "body": [
      "::::tabs",
      ":::tab{label=\"${1:Tab 1}\"}",
      "${2:Content 1}",
      ":::",
      "",
      ":::tab{label=\"${3:Tab 2}\"}",
      "${4:Content 2}",
      ":::",
      "::::"
    ],
    "description": "Insert a tabbed content block"
  },
  "LFM: Steps": {
    "prefix": "steps",
    "body": [
      ":::steps",
      "### ${1:Step 1}",
      "",
      "${2:Instructions}",
      "",
      "### ${3:Step 2}",
      "",
      "${4:Instructions}",
      ":::"
    ],
    "description": "Insert a numbered steps block"
  },
  "LFM: Data Point": {
    "prefix": "datapoint",
    "body": [
      ":::data-point{source=\"${1:Source Name}\" date=\"${2:YYYY-MM}\" confidence=\"${3|verified,ai-sourced,estimated,projected|}\"}",
      "$0",
      ":::"
    ],
    "description": "Insert a sourced data point block"
  }
}
```

### 25.3 markdownlint Configuration

A `.markdownlint.jsonc` that works with our flavor:

```jsonc
{
  // Allow multiple H1s (we use H1 in content, not just title)
  "MD025": false,
  // Allow trailing punctuation in headings (common in specs)
  "MD026": { "punctuation": ".,;:!" },
  // Allow HTML (we use it sparingly)
  "MD033": false,
  // Allow bare URLs (GFM autolinks)
  "MD034": false,
  // Disable line length (content wraps in the renderer)
  "MD013": false,
  // Allow non-blank lines around fences (needed for directive nesting)
  "MD031": false,
  // Allow emphasis as heading (we use it in timelines)
  "MD036": false
}
```

---

## 26. Worked Example: A Complete Investment Memo Section

This shows how multiple features compose in a real document:

````markdown
---
title: "Metabologic: Market Overview"
date_created: 2026-03-25
tags: [market-analysis, metabolic-health, GLP-1]
authors:
  - AI Labs Team
augmented_with: "Claude + Perplexity Sonar Pro"
status: Review
at_semantic_version: 0.2.5
---

# Market Overview

## The Metabolic Health Crisis

Global metabolic disease prevalence is accelerating. Over 2.1 billion people
worldwide will be aged 60 or older by 2050,[^1ucdcd] driving demand for
accessible, affordable metabolic health interventions.

:::callout{type="info" title="Market Size Context"}
The total addressable market for metabolic health interventions exceeds
**$150B annually** when combining pharmaceuticals, supplements, digital
therapeutics, and clinical services.
:::

:::data-point{source="Goldman Sachs" date="2026-01" confidence="verified"}
The GLP-1 receptor agonist market alone is projected to reach $100B by 2030,
up from $24B in 2025 — a 33% CAGR.[^k9m6ww]
:::

## GLP-1 Drugs vs. Enzyme-Based Approaches

The dominant pharmaceutical approach to metabolic health — GLP-1 receptor
agonists like :tooltip[Ozempic]{content="Semaglutide, manufactured by Novo
Nordisk. Approved for Type 2 diabetes and obesity."} and
:tooltip[Mounjaro]{content="Tirzepatide, manufactured by Eli Lilly. Dual
GIP/GLP-1 agonist approved for Type 2 diabetes and obesity."} — faces
critical limitations:

| Factor | GLP-1 Drugs | Enzyme Approach (Metabolic) |
|--------|------------|---------------------------|
| Cost/month | $1,000–$1,300 | $60–$120 |
| Prescription | Required | Not required |
| Delivery | Injection | Oral supplement |
| Side effects | Nausea, gastroparesis, muscle loss | Minimal (digestive) |
| Discontinuation | ~80% within 2 years[^d7f2x3] | TBD (early data promising) |
| Insurance coverage | Inconsistent | N/A (consumer product) |

:::key-risk{severity="medium" category="market"}
GLP-1 drug prices may decrease significantly as patents expire and biosimilars
enter the market (earliest: 2031). This could narrow the cost advantage of
enzyme-based approaches, though the prescription and injection barriers
would remain.
:::

## Competitive Landscape

```mermaid
quadrantChart
    title Competitive Positioning
    x-axis Low Cost --> High Cost
    y-axis Low Efficacy --> High Efficacy
    quadrant-1 Premium Pharma
    quadrant-2 Sweet Spot
    quadrant-3 Commodity
    quadrant-4 Overpriced
    Ozempic/Wegovy: [0.85, 0.80]
    Mounjaro: [0.80, 0.85]
    Metabologic: [0.25, 0.55]
    Enzymedica: [0.20, 0.30]
    FODZYME: [0.30, 0.35]
    Twin Health: [0.50, 0.50]
```

:::details{title="Full Competitor List (19 companies analyzed)"}

The competitive evaluation spans 19 companies across four categories:

- **Primary competitors** (3): Enzymedica, FODZYME, Holozyme
- **Direct competitors** (5): Including biosimilar manufacturers
- **Indirect competitors** (7): Digital therapeutics, coaching platforms
- **Loose comparables** (4): GLP-1 manufacturers (different category, useful for market context)

See the full competitive evaluation in the deal's `competitive-curation.json`.
:::

## Investment Thesis

:::investment-thesis
Metabologic is positioned to capture a significant share of the emerging
"GLP-1 alternative" market by offering an enzyme-based oral supplement at
1/10th the cost of injectable GLP-1 drugs, with no prescription requirement.
The company's proprietary enzyme design platform — validated in 3 peer-reviewed
studies — creates a defensible moat that commodity supplement brands cannot
replicate. With the GLP-1 market projected at $100B by 2030 and
discontinuation rates exceeding 80%, there is a massive underserved population
seeking affordable, sustainable metabolic health solutions.
:::

---

## Sources

[^1ucdcd]: 2025, Sep 21. [Population ageing: Navigating the demographic shift](https://www.helpage.org/news/population-ageing-navigating-the-demographic-shift/). Published: 2024-07-11

[^k9m6ww]: 2026, Jan 15. [GLP-1 Market Outlook 2030](https://www.goldmansachs.com/insights/glp1-market-2030). Published: 2026-01-15

[^d7f2x3]: 2025, Nov 08. [Real-world GLP-1 discontinuation rates](https://www.nejm.org/doi/full/10.1056/NEJMoa2503142). Published: 2025-11-08
````

This example demonstrates: frontmatter, hex-code citations, callouts, data points, tooltips, tables, Mermaid diagrams, key risks, details blocks, investment thesis blocks, and proper source definitions — all composing naturally in a single document.

---

## 27. Glossary

| Term | Definition |
|------|-----------|
| **MDAST** | Markdown Abstract Syntax Tree — the intermediate representation produced by `remarkParse` and transformed by remark plugins |
| **Directive** | An extension syntax (`:::name{}`) that maps to a component at render time |
| **Container directive** | A directive that wraps other markdown content (`:::name ... :::`) |
| **Leaf directive** | A self-closing directive with no children (`::name{}`) |
| **Text directive** | An inline directive within paragraph text (`:name[content]{}`) |
| **Hex code** | A 6-character alphanumeric identifier for citations (e.g., `1ucdcd`) |
| **Unified** | The ecosystem of markdown/HTML processing tools (remark, rehype, etc.) |
| **Remark** | Markdown processor in the Unified ecosystem; operates on MDAST |
| **Rehype** | HTML processor in the Unified ecosystem; operates on HAST |
| **HAST** | HTML Abstract Syntax Tree — the intermediate representation for HTML |
| **Shiki** | Syntax highlighter that uses VS Code's TextMate grammars |
| **GFM** | GitHub Flavored Markdown — CommonMark superset with tables, task lists, etc. |
| **CommonMark** | The standard markdown specification that serves as our baseline |
| **LFM** | Lossless Flavored Markdown — the name for this flavor, echoing GFM (GitHub Flavored Markdown) |
| **Transclusion** | Embedding one document's content inside another at build time |
| **Frontmatter** | YAML metadata at the top of a markdown file, delimited by `---` |
| **Graceful degradation** | The principle that unsupported features should render as readable text, not errors |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-25 | Initial draft — codifying existing capabilities and wish list |
| 2026-03-25 | Major expansion — added directive deep dive, print/PDF behavior, accessibility, dark/light/vibrant mode, edge cases, domain-specific extensions, content portability, link handling, image handling, performance considerations, content linting, migration guide, VS Code support, worked example, and glossary |
