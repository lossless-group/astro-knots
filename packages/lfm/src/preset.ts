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
  const opts: Required<RemarkLfmOptions> = {
    gfm: true,
    directives: true,
    callouts: true,
    citations: true,
    ...options,
  };

  // Collect the plugins we need to attach
  const plugins: Plugin[] = [];

  if (opts.gfm) {
    plugins.push(remarkGfm as Plugin);
  }

  if (opts.directives) {
    plugins.push(remarkDirective as Plugin);
  }

  if (opts.callouts) {
    plugins.push(remarkCallouts as Plugin);
  }

  // Citations must come after gfm (which creates footnote nodes)
  if (opts.citations) {
    plugins.push(remarkCitations as Plugin);
  }

  // Attach each plugin to `this` (the unified processor)
  const processor = this;
  for (const plugin of plugins) {
    processor.use(plugin as any);
  }
};
