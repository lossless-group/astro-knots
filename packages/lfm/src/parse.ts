/**
 * High-level markdown parsing API.
 *
 * Provides a single function that takes markdown content and returns an MDAST tree
 * with all LFM extensions applied. This is the simplest way to use the package.
 *
 * Usage:
 *   import { parseMarkdown } from '@lossless/lfm';
 *   const tree = await parseMarkdown(content);
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { remarkLfm } from './preset.js';
import type { Root } from 'mdast';
import type { RemarkLfmOptions } from './types/index.js';

/**
 * Parse a markdown string into an MDAST tree with all LFM extensions applied.
 * Returns the processed tree ready for rendering.
 */
export async function parseMarkdown(content: string, options?: RemarkLfmOptions): Promise<Root> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkLfm, options);

  const mdast = processor.parse(content) as Root;
  const tree = (await processor.run(mdast)) as Root;
  return tree;
}

/**
 * Create a configured unified processor with the LFM pipeline.
 * Useful when you need more control (e.g., for streaming or custom transforms).
 */
export function createLfmProcessor(options?: RemarkLfmOptions) {
  return unified()
    .use(remarkParse)
    .use(remarkLfm, options);
}
