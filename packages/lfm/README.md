# @lossless-group/lfm

**Lossless Flavored Markdown** — a polyglot extended markdown pipeline for remark/rehype.

One package, one import. Bundles everything you need to parse extended markdown: unified, remark-parse, remark-gfm, remark-directive, and custom plugins.

## Install

**Canonical: from JSR** — [jsr.io/@lossless-group/lfm](https://jsr.io/@lossless-group/lfm)

Two equivalent ways to consume from JSR with pnpm:

```jsonc
// package.json — npm-alias form (works on any pnpm version)
{
  "dependencies": {
    "@lossless-group/lfm": "npm:@jsr/lossless-group__lfm@^0.2.2"
  }
}
```

```ini
# .npmrc — required for the npm-alias form to resolve
@jsr:registry=https://npm.jsr.io
```

```jsonc
// package.json — pnpm jsr: protocol form (newer pnpm)
{
  "dependencies": {
    "@lossless-group/lfm": "jsr:^0.2.2"
  }
}
```

**Mirror on GitHub Packages** ([github.com/lossless-group/astro-knots/pkgs/npm/lfm](https://github.com/lossless-group/astro-knots/pkgs/npm/lfm)) is published as parity but isn't the recommended consumption path. If you do want it, add `@lossless-group:registry=https://npm.pkg.github.com` plus a `${GITHUB_TOKEN}` auth line to `.npmrc` and install as `@lossless-group/lfm@^0.2.2`.

## Usage

### Simple (recommended)

```ts
import { parseMarkdown } from '@lossless-group/lfm';

const tree = await parseMarkdown(markdownContent);
// tree is an MDAST — pass to your renderer
```

### As a remark preset

```ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { remarkLfm } from '@lossless-group/lfm';

const processor = unified()
  .use(remarkParse)
  .use(remarkLfm);

const mdast = processor.parse(content);
const tree = await processor.run(mdast);
```

### Cherry-pick plugins

```ts
import { remarkCallouts } from '@lossless-group/lfm';
```

## What's included

| Plugin | What it does |
|--------|-------------|
| remark-gfm | Tables, task lists, strikethrough, autolinks |
| remark-directive | `:::name{}` directive syntax parsing |
| remark-callouts | Obsidian `> [!type] Title` → directive normalization |
| remark-citations | Hex-code footnote renumbering + structured citation extraction |

The `remarkLfm` preset chains these together. All features enabled by default.

## Options

```ts
import { parseMarkdown } from '@lossless-group/lfm';

const tree = await parseMarkdown(content, {
  gfm: true,         // GFM features (default: true)
  directives: true,  // Directive syntax (default: true)
  callouts: true,    // Obsidian callout normalization (default: true)
  citations: true,   // Hex-code footnote renumbering (default: true)
});
```

## Citations

Footnotes with hex-code identifiers get renumbered to display indices and lifted into a structured citation dataset on `tree.data.citations`:

```markdown
Global aging is accelerating.[^a1b2c3]
Healthcare costs are rising.[^d4e5f6]

[^a1b2c3]: 2024. [Population Ageing](https://example.com). Published: 2024-07-11
[^d4e5f6]: 2025. [Cost Drivers](https://example.com). Published: 2024-11-22
```

After `parseMarkdown(content)`:

- `footnoteReference` nodes carry `node.data.citationIndex` (the display number, e.g. `1`, `2`) and `node.data.citationHex` (the original identifier).
- `footnoteDefinition` nodes are removed from the tree.
- The full citation dataset (title, URL, source domain, published / updated dates, raw text, parsed flag) lives at `tree.data.citations.ordered` for a Sources-style component to render at the bottom of the article.

## Bare-link auto-unfurl (catalog ships now, plugin pending)

A URL on its own line — paragraph with a single autolink child — is the LFM signal that the author wants the URL rendered as an embedded player or rich card rather than a clickable link. The classification + dispatch pipeline:

```
bare URL paragraph                            // CommonMark + GFM autolink pass
       │
       ▼
remark-bare-link plugin (forthcoming)
       │  reads src/plugins/Bare-Link-Provider-Catalog.md
       │  matches host + path (+ query) against ordered providers
       ▼
leafDirective { provider, id, url, kind }     // standard MDAST directive node
       │
       ▼
renderer dispatches by directive name         // YouTubeEmbed, VimeoEmbed, etc.
```

**The catalog file** — `src/plugins/Bare-Link-Provider-Catalog.md` — ships with this package starting at 0.2.2. Its YAML frontmatter is the canonical record of supported providers; the body explains the matching rules. v0.2.2 catalog includes four `stable` providers:

| Provider | URL shapes | Directive | Component name |
|---|---|---|---|
| `youtube-video` | `youtu.be/{id}`, `youtube.com/watch?v={id}` | `::youtube-video` | `YouTubeEmbed` |
| `youtube-short` | `youtube.com/shorts/{id}` | `::youtube-short` | `YouTubeShortsEmbed` |
| `youtube-playlist` | `youtube.com/playlist?list={id}` | `::youtube-playlist` | `YouTubePlaylistEmbed` |
| `vimeo` | `vimeo.com/{id}` (incl. channels + unlisted hash), `player.vimeo.com/video/{id}` | `::vimeo` | `VimeoEmbed` |

Plus `planned` entries for Vimeo additions, Loom, Spotify, and SoundCloud — kept in the catalog as documented intent.

**Until `remark-bare-link` lands**, sites can run the same classification at render time. Reference implementation: `sites/mpstaton-site/src/lib/markdown/classify-bare-link.ts` in the [astro-knots monorepo](https://github.com/lossless-group/astro-knots) — a ~100-line pure classifier with `getBareLinkUrl(node)` (MDAST autolink shape detector) and `classifyBareLink(url)` (host/path/query matchers). It mirrors the catalog's matchers in TypeScript so consuming sites have the same dispatch behavior the future plugin will produce.

**Inline links stay autolinks.** The detector requires the paragraph to have *exactly one child* that's a `link` whose visible text equals its URL — so `Check this out https://youtu.be/...` mid-sentence stays a clickable link, not an embed. CommonMark's paragraph rule does the blank-line gating for free.

## Types

```ts
import type {
  LfmComponentNode,    // Normalized node from any trigger syntax
  LfmCalloutNode,      // Callout directive node
  Citation,            // Single citation: index, hex, title, url, source, dates, raw
  CitationDataset,     // tree.data.citations shape: { ordered, byHex, warnings }
  RemarkLfmOptions,    // Preset options
} from '@lossless-group/lfm';
```

## Roadmap

Shipped at 0.2.x — directives, callouts, citations, the bare-link catalog. Next additions:

- **remark-bare-link** — the parse-time plugin that consumes the bundled catalog and emits leaf directives (sites currently classify at render time)
- **remark-backlinks** — `[[wikilink]]` resolution
- **remark-toc** — auto-generated table of contents
- **remark-code-components** — code fence identifiers → component routing (mermaid, etc.)
- **Polyglot parsing** — Markdoc `{% tag %}` and MDX-lite `<Component />` normalization

See the full spec: [Codifying a Comprehensive Extended Markdown Flavor and Shared Package](https://github.com/lossless-group/astro-knots/blob/master/context-v/specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md)

## License

MIT
