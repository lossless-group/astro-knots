/**
 * @module
 *
 * **Lossless Flavored Markdown** — a polyglot extended markdown pipeline for remark/rehype.
 *
 * One package, one import. Bundles unified, remark-parse, remark-gfm, remark-directive,
 * and custom plugins into a single `parseMarkdown()` call.
 *
 * @example Basic usage
 * ```ts
 * import { parseMarkdown } from '@lossless-group/lfm';
 *
 * const tree = await parseMarkdown('# Hello\n\nSome **markdown** content.');
 * // tree is an MDAST — pass to your renderer
 * ```
 *
 * @example As a remark preset
 * ```ts
 * import { unified } from 'unified';
 * import remarkParse from 'remark-parse';
 * import { remarkLfm } from '@lossless-group/lfm';
 *
 * const processor = unified().use(remarkParse).use(remarkLfm);
 * const tree = await processor.run(processor.parse(content));
 * ```
 */

/** Parse a markdown string into an MDAST tree with all LFM extensions applied. */
export { parseMarkdown, createLfmProcessor } from './parse.js';

/** The remarkLfm preset — chains remarkGfm + remarkDirective + remarkCallouts. */
export { remarkLfm } from './preset.js';

/** Obsidian callout normalizer — transforms `> [!type]` into directive nodes. */
export { remarkCallouts } from './plugins/remark-callouts.js';

/** Citation processor — hex-code renumbering, structured definition parsing. */
export { remarkCitations } from './plugins/remark-citations.js';

export type {
  /** Normalized component node produced by all trigger syntaxes. */
  LfmComponentNode,
  /** Callout node produced by remarkCallouts. */
  LfmCalloutNode,
  /** Options for the remarkLfm preset. */
  RemarkLfmOptions,
} from './types/index.js';

export type {
  /** A single parsed citation with index, metadata, and raw text. */
  Citation,
  /** The full citation dataset attached to tree.data.citations. */
  CitationsData,
  /** A validation warning from the citation processor. */
  CitationWarning,
  /** Options for the remarkCitations plugin. */
  RemarkCitationsOptions,
} from './plugins/remark-citations.js';
