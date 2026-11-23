# lfm-astro

Reference components for rendering
[Lossless Flavored Markdown](https://jsr.io/@lossless-group/lfm) in an Astro
site: the renderer, callouts, code blocks, images, sources, heading anchors,
cross-reference embeds, and the reading type scale.

## Copy them, don't depend on them

These are **reference patterns, not a package**. Nothing here is published, and
no site should import from this folder. Copy the files you need into your site
(usually `src/components/markdown/` and `src/styles/`) and make them yours.

That's the advised practice because every site wants its own layout, style and
markup. A shared dependency would leave every site pulling one version in a
different direction through pull requests. With copies, each site adapts freely,
and this folder stays the clean starting point.

What *is* shared at runtime is the processing: `@lossless-group/lfm` parses the
markdown into the tree these components render. Install that one as a real
dependency.

## Staying current

Changes here are logged in [`WHATS-NEW.md`](WHATS-NEW.md): what changed, why,
and how to adopt it. Read it now and then and pick up what your site wants.
Nothing is pushed to sites.

When you improve a copy in a site and the change would help others, bring it
back here and add an entry to `WHATS-NEW.md`.

## Files

| File | What it is |
|---|---|
| `components/AstroMarkdown.astro` | The recursive renderer: walks LFM's tree and renders every node type |
| `components/Callout.astro`, `callout-types.ts`, `callout.css` | Callouts (`> [!type] Title`): structure, type registry, styles. See `Callout.md` |
| `components/CodeBlock.astro` | Fenced code, colored by LFM's highlighter |
| `components/CrossReferenceContentEmbed.astro` | A section of another document shown in this one (`![[Note#Heading]]`) |
| `components/HeadingAnchor.astro` | The share/copy-link affordance beside a heading |
| `components/MarkdownImage.astro` | Image directives |
| `components/Sources.astro` | The citation list at the bottom of a page |
| `components/reader.css` | The reading type scale: one body size and one ratio size everything |
| `scripts/audit-wikilinks.ts`, `wikilink-rules.ts` | A wikilink audit to copy into a site's `scripts/` |

How to wire them into a site is in the astro-knots `CLAUDE.md` ("Implementing
@lossless-group/lfm in a New Site") and the
[relative type scale blueprint](../../context-v/blueprints/Relative-Type-Scale-for-LFM-Reading-Content.md).
