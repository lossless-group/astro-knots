---
title: "A Standard Table of Contents for Every Markdown Collection"
lede: >-
  One reading-position ToC everywhere, built on LFM's heading outline — the only source that tells a heading from a `#` inside a code fence.
site_uuid: b64ab0c4-53c7-4e8f-ab59-f2fd55cd03fb
hex_code: dt9uc8
date_created: 2026-08-17
date_modified: 2026-08-17
status: Proposed
category: Blueprints
tags:
  - Table-Of-Contents
  - LFM
  - Markdown-Rendering
  - Content-Collections
  - Information-Design
  - Accessibility
  - Mermaid
  - Code-Blocks
authors:
  - Michael Staton
augmented_with: Claude Code (Opus 5, 1M context)
date_authored_initial_draft: 2026-08-17
date_authored_current_draft: 2026-08-17
publish: true
---

# A Standard Table of Contents for Every Markdown Collection

## Why Care?

Our long-form content has outgrown the scrollbar. A recipe with five job sections, a context-v spec with a dozen headings, a changelog entry with a diff table and four sub-sections — all of it is read by scanning first and reading second, and none of it currently offers a map.

The pieces to fix it already exist. `remarkHeadingIds` (LFM ≥0.4.0) assigns every heading a stable, deduped anchor and attaches an ordered outline at `tree.data.headings`, described in its own source as *"ready to render a table of contents."* Nothing renders it.

**The rule this blueprint sets: every collection that renders markdown through `AstroMarkdown` gets a ToC with the same behaviour. The look is the site's business. The behaviour is not.**

## The standard: what every site must implement

These are non-negotiable across astro-knots. A reader moving between `fullstack-vc`, a client deck, and a splash page should not have to relearn the control.

| # | Requirement | Why it's standard, not cosmetic |
|---|---|---|
| 1 | **Rendered from `tree.data.headings`** | Any other source is wrong — see the code-fence trap below |
| 2 | **Three viewport states**: persistent rail, collapsed trigger, top bar | The reader's device shouldn't remove the capability |
| 3 | **Reading-position tracking in all three** | "Where am I" is the half that makes it more than a link list |
| 4 | **The collapsed trigger names the current heading** | Answers the question without being opened |
| 5 | **Selecting a heading collapses the panel** | Leaving an outline over the destination defeats the jump |
| 6 | **Works with JavaScript disabled** | It's a list of anchors; tracking is enhancement |
| 7 | **`Esc` and click-outside dismiss; focus returns to trigger** | Baseline dialog behaviour |
| 8 | **Renders nothing below ~3 entries** | A two-item outline is noise |
| 9 | **Offset measured from the site's pinned header, never hardcoded** | Header heights differ per site *and* per breakpoint |
| 10 | **Anchors come from `data.id`, never recomputed locally** | Recomputing is what made anchors diverge in the first place |

**Explicitly not standard:** placement side, colours, glow, typography, whether the rail is bordered, the collapsed trigger's iconography. Sites should look like themselves.

## Which collections

**All of them**, but in this order:

1. **`context-v` documents and `changelog` entries** — the highest-value targets and the reason this is a blueprint rather than a per-site ticket. These are the longest, most heading-dense, least linearly-read content we publish. A changelog roll-up page or a 4,000-line spec without a ToC is barely navigable.
2. **Guides / use-cases / recipes** — long-form editorial.
3. **Tools, projects, working groups** — usually short; the ≥3-entry guard will hide it on most, which is correct.
4. **Long-form / book-style readers** — these often have their own chapter nav; the ToC is *within-chapter* and should not compete with it.

Any collection rendering through `AstroMarkdown` is in scope by default. Opting *out* should be a deliberate frontmatter flag, not an omission.

## The code-fence trap — why the AST is the only valid source

This is the load-bearing technical argument, and it's the reason to reject two tempting shortcuts.

Markdown that documents markdown, shell, Python, or YAML is full of lines that *look* like headings and are not:

````markdown
```bash
# Install the package
pnpm add @lossless-group/lfm
```

```python
### Section 2: load the corpus
df = pd.read_csv(path)
```
````

Neither `#` line is a heading. Both are comments inside a fence.

- **A regex/line-scanning ToC** sees two headings that don't exist.
- **A DOM-scraping ToC** (`querySelectorAll('h1[id], h2[id], …')` — the approach on `lossless-monorepo/site`) avoids that, but can only see what the renderer emitted, so it cannot distinguish a `synthetic` id from a real one, cannot see `duplicateOf` collisions, and must run client-side after paint.
- **`tree.data.headings`** is built by walking the MDAST. A fenced code block is a `code` node, not a `heading` node. The problem cannot occur.

The same reasoning covers **YAML frontmatter** (`# comment` lines), **ASCII diagrams** containing `#`, and **tree outlines** using `#` as a marker.

**Rule: never derive an outline from text or from the DOM. Only from the parsed tree.**

## Wide content: mermaid, ASCII, trees, code

These node types share one property — they are the widest things on any page — and that makes them the ToC blueprint's problem in three ways.

### 1. They must never be in the outline

None of them produce `heading` nodes, so `tree.data.headings` already excludes them. This is stated only so nobody "improves" the ToC by scanning rendered content for large text.

### 2. They must scroll inside their own box, never widen the page

A ToC that tracks reading position is worthless on a page that also scrolls sideways. Every wide block gets its own scroll container:

| Content | Container | Wrapping |
|---|---|---|
| **Code snippets** | `pre { overflow-x: auto }` | **Never wrap.** Wrapped code is misread code |
| **ASCII diagrams** | same as code | **Never wrap.** Wrapping destroys the drawing |
| **Tree outlines** (`├── src/`) | same as code | **Never wrap.** Same reason |
| **Mermaid** | wrapper with `overflow-x: auto`; SVG `max-width: 100%` where it degrades gracefully | n/a |
| **Tables** | `.ak-table-wrap { overflow-x: auto }` + a `min-width` on the table | Cells wrap; the table does not shrink past legibility |

The full mechanics, and the flex trap that defeats all of the above, are in [[Guarantee-Text-Wrapping-and-No-Horizontal-Bleed-at-Any-Width]]. **Implement that blueprint first** — a ToC layered onto a page that bleeds horizontally will look broken and the ToC will get the blame.

### 3. They set the rail's width budget

A persistent rail steals horizontal space from the prose column at exactly the widths where code blocks and mermaid diagrams are already tight. Hence the standard: the rail exists only where there is room for it, and collapses to a trigger otherwise — it does not shrink the article to stay visible.

## Data contract

```ts
interface LfmHeading {
  id: string;           // deduped anchor; matches the heading node's data.id
  text: string;         // plain text, markup stripped
  depth: 1 | 2 | 3 | 4 | 5 | 6;
  duplicateOf?: string; // slug collided with an earlier heading — diagnostics
  synthetic?: boolean;  // text slugified to nothing; positional id used
}
```

Three consequences every implementation owns:

1. **The outline is flat.** Nesting from `depth` is the renderer's job — until LFM ships `nestHeadings`.
2. **Skip `synthetic` entries** in the ToC while keeping their anchors. No usable label.
3. **`duplicateOf` is diagnostics.** Render the text; the id already disambiguates.

**Default depth band is `h2`–`h3`.** Deeper is available and usually noise.

### Known blocker

A heading inside a callout or `:::details` block lands in the outline indistinguishably from a document-level section. It deserves an anchor; it rarely deserves a ToC entry. Tracked package-side as `lfm/context-v/issues/Heading-Outline-Cannot-Distinguish-Container-Headings.md` (proposed `inContainer` flag). Until it lands, sites with callout-nested headings will over-collect. Check your corpus — `fullstack-vc` had zero, so it shipped anyway.

## Reference implementation

`fullstack-vc`, shipped 2026-08-17:

```
TableOfContents.astro          three states in one render
TableOfContents__List.astro    recursive <ul> (an element, so `__` not `--`)
toc-types.ts                   nestHeadings / filterHeadings / flattenIds
table-of-contents.css          block, elements, three states
table-of-contents.client.ts    scrollspy, collapse, header measurement
```

**Not split into `--` modifier siblings**, deliberately: the three states are viewport-driven, not author-chosen. All three render simultaneously and CSS decides. `--` is for variants an author picks (`ImageCarousel--Peek`).

Two implementation notes that cost real time:

- **The scrollspy's tie-break is "topmost visible heading wins,"** with a fallback to the last heading scrolled past. Without the fallback the highlight goes blank between sections.
- **The header offset is measured, not declared.** JS publishes the pinned header's real bottom edge as a CSS custom property on `:root`; CSS adds a per-breakpoint gap on top. Do not declare that property on the component element — an element's own declaration shadows the inherited one and the measurement silently does nothing.

## Rollout

1. **Upgrade the site to LFM ≥0.4.1.** On 0.3.x `data.id` is `undefined` and headings lose ids entirely.
2. **Delete the site's local slugify**; read `node.data.id`.
3. **Diff the anchors before shipping.** Parse every document, compare LFM's slug to the site's old one, count the moves. `fullstack-vc` moved zero of 53. A site with published share links deserves more care than one without.
4. **Fix horizontal bleed** — the sibling blueprint.
5. **Add the component**, and its entry in that site's `/design-system` in the same change.
6. **`lossless-monorepo/site` last.** It has the only published share links in the wild and the only DOM-scraping ToC to retire.

## Anti-patterns

- **Scraping the DOM for headings.** Cannot see `synthetic` or `duplicateOf`, runs after paint, and re-creates the divergence LFM exists to end.
- **Regex over raw markdown.** Sees `#` comments inside fences as headings.
- **Recomputing slugs locally.** The exact bug `remarkHeadingIds` was written to fix.
- **Hardcoding the header offset.** Correct on the site it was tuned on and wrong everywhere else.
- **Shrinking the article so the rail always fits.** The rail is the thing that yields.
- **Wrapping code or ASCII to avoid a scrollbar.** Destroys the content to protect the layout.

## See also

- [[Guarantee-Text-Wrapping-and-No-Horizontal-Bleed-at-Any-Width]] — prerequisite
- `context-v/specs/Reading-Position-Table-of-Contents-for-LFM-Articles.md` — the behavioural spec this generalises
- `lfm/context-v/Maintain-Table-of-Contents-from-the-Heading-Outline.md` — the package-side contract
- `lfm/context-v/Maintain-Heading-Anchors-and-Share-Links.md` — where the outline came from
- [[Codeblock-Syntax-Highlighting-with-Shiki]] — the code-block renderer whose fences must never be scanned for headings
