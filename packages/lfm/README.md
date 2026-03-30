# @lossless-group/lfm

**Lossless Flavored Markdown** — a polyglot extended markdown pipeline for remark/rehype.

One package, one import. Bundles everything you need to parse extended markdown: unified, remark-parse, remark-gfm, remark-directive, and custom plugins.

## Install

```bash
pnpm add @lossless-group/lfm
```

**From GitHub Packages** — add to `.npmrc`:
```
@lossless-group:registry=https://npm.pkg.github.com
```

**From JSR** — [jsr.io/@lossless-group/lfm](https://jsr.io/@lossless-group/lfm)

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

The `remarkLfm` preset chains these together. All features enabled by default.

## Options

```ts
import { parseMarkdown } from '@lossless-group/lfm';

const tree = await parseMarkdown(content, {
  gfm: true,        // GFM features (default: true)
  directives: true,  // Directive syntax (default: true)
  callouts: true,    // Obsidian callout normalization (default: true)
});
```

## Types

```ts
import type {
  LfmComponentNode,  // Normalized node from any trigger syntax
  LfmCalloutNode,    // Callout directive node
  RemarkLfmOptions,  // Preset options
} from '@lossless-group/lfm';
```

## Roadmap

This is v0.1 — the foundation. Planned additions:

- **remark-citations** — hex-code citation system with hover popovers
- **remark-backlinks** — `[[wikilink]]` resolution
- **remark-auto-unfurl** — bare YouTube/SoundCloud URLs → embed components
- **remark-toc** — auto-generated table of contents
- **remark-code-components** — code fence identifiers → component routing (mermaid, etc.)
- **Polyglot parsing** — Markdoc `{% tag %}` and MDX-lite `<Component />` normalization

See the full spec: [Codifying a Comprehensive Extended Markdown Flavor and Shared Package](https://github.com/lossless-group/astro-knots/blob/master/context-v/specs/Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md)

## License

MIT
