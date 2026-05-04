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

/** Build-time Open Graph metadata fetcher — enriches external links with preview data. */
export { remarkOgFetcher } from './plugins/og-fetcher.js';

/** `:::link-preview` / `:::link-rollup` directive annotator — stamps `data.linkPreviewSpec`. */
export { remarkLinkPreview } from './plugins/remark-link-preview.js';

/** URL classifier — turns a raw URL into provider/kind metadata via the catalog matchers. */
export { classifyLink, getBareLinkUrl, collectLinkNodes } from './utils/classify-link.js';

export type {
  /** Spec attached to `containerDirective.data.linkPreviewSpec`. */
  LinkPreviewSpec,
  /** Format taxonomy for `LinkPreview__*` components. */
  LinkPreviewFormat,
  /** Format taxonomy for `LinkRollup__*` components. */
  LinkRollupFormat,
} from './plugins/remark-link-preview.js';

export type {
  /** Result of a successful URL classification. */
  LinkClassification,
  /** Catalog `kind` taxonomy. */
  LinkProviderKind,
} from './utils/classify-link.js';

/** Per-build OG dispatcher (cache + retries + concurrency + rate-limit). */
export { OGDispatcher, createOGDispatcher } from './utils/og-dispatcher.js';

/** OG cache loader and class — direct access for sites that want to inspect or invalidate. */
export { OGCache, loadOGCache, hashUrl } from './utils/og-cache.js';

export type {
  /** Normalized component node produced by all trigger syntaxes. */
  LfmComponentNode,
  /** Callout node produced by remarkCallouts. */
  LfmCalloutNode,
  /** Options for the remarkLfm preset. */
  RemarkLfmOptions,
  /** Render-surface metadata for a single link. */
  LinkPreviewData,
  /** Result returned by an OG backend. */
  OGFetchResult,
  /** Backend identifier strings accepted by the dispatcher. */
  OGBackendName,
  /** Backend function signature. */
  OGBackend,
  /** Options passed to a backend on each call. */
  OGBackendOptions,
  /** Per-site OG fetch configuration. */
  OGFetchOptions,
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
