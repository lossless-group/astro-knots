// @lossless/lfm — Lossless Flavored Markdown
// A polyglot extended markdown pipeline for remark/rehype
//
// One package, one import. Everything you need to parse extended markdown.

// High-level API (recommended)
export { parseMarkdown, createLfmProcessor } from './parse.js';

// Preset (for manual unified pipeline assembly)
export { remarkLfm } from './preset.js';

// Individual plugins (for cherry-picking)
export { remarkCallouts } from './plugins/remark-callouts.js';

// Types
export type {
  LfmComponentNode,
  LfmCalloutNode,
  RemarkLfmOptions,
} from './types/index.js';
