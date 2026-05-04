/**
 * remarkLfm — The Lossless Flavored Markdown preset for unified/remark.
 *
 * Chains together the core LFM plugins: GFM, directives, and custom extensions.
 * Use as a single `.use(remarkLfm)` call instead of wiring up individual plugins.
 *
 * Usage:
 *   import { unified } from 'unified';
 *   import remarkParse from 'remark-parse';
 *   import { remarkLfm } from '@lossless/lfm';
 *
 *   const processor = unified()
 *     .use(remarkParse)
 *     .use(remarkLfm);
 */

import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import { remarkCallouts } from './plugins/remark-callouts.js';
import { remarkCitations } from './plugins/remark-citations.js';
import { remarkOgFetcher } from './plugins/og-fetcher.js';
import { remarkLinkPreview } from './plugins/remark-link-preview.js';
import type { RemarkLfmOptions } from './types/index.js';
import type { Root } from 'mdast';
import type { Plugin } from 'unified';

/**
 * The Lossless Flavored Markdown preset for unified/remark.
 *
 * Chains together GFM, directives, callouts, and citations into a single
 * `.use(remarkLfm)` call. Each sub-plugin can be toggled via options.
 *
 * @example
 * ```ts
 * import { unified } from 'unified';
 * import remarkParse from 'remark-parse';
 * import { remarkLfm } from '@lossless-group/lfm';
 *
 * const processor = unified().use(remarkParse).use(remarkLfm);
 * const tree = await processor.run(processor.parse(markdown));
 * ```
 */
export const remarkLfm: Plugin<[RemarkLfmOptions?], Root> = function (options?: RemarkLfmOptions) {
  const opts = {
    gfm: true,
    directives: true,
    callouts: true,
    citations: true,
    ...options,
  } satisfies RemarkLfmOptions;

  const processor = this;

  if (opts.gfm) {
    processor.use(remarkGfm as Plugin);
  }

  if (opts.directives) {
    processor.use(remarkDirective as Plugin);
  }

  if (opts.callouts) {
    processor.use(remarkCallouts as Plugin);
  }

  // Citations must come after gfm (which creates footnote nodes).
  if (opts.citations) {
    processor.use(remarkCitations as Plugin);
  }

  // OG fetcher runs before the link-preview annotator so the per-URL
  // `linkPreview` data is attached to each `link` node before link-preview
  // walks them. Disabled by default; the plugin itself short-circuits when
  // `enabled !== true`.
  if (opts.ogFetch) {
    processor.use(remarkOgFetcher, opts.ogFetch);
  }

  // Link-preview directive annotation runs whenever directives are enabled.
  // It stamps `data.linkPreviewSpec` on `:::link-preview` / `:::link-rollup`
  // containerDirective nodes (including any per-URL `items` data the
  // og-fetcher just attached) so the renderer can dispatch and pass props
  // to LinkPreviewCard / LinkRollup without re-walking children.
  if (opts.directives) {
    processor.use(remarkLinkPreview);
  }
};
