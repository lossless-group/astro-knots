/**
 * @module
 *
 * LFM custom MDAST node types and configuration options.
 *
 * These are standalone type definitions that describe the shape of nodes
 * produced by LFM plugins. They don't extend mdast types directly to
 * maintain compatibility with JSR and other TypeScript-first registries.
 *
 * @example Importing types
 * ```ts
 * import type { LfmComponentNode, RemarkLfmOptions } from '@lossless-group/lfm/types';
 * ```
 */

/**
 * The normalized component node that ALL trigger syntaxes produce.
 * Directive syntax, Markdoc tags, MDX-lite tags, code fence identifiers,
 * and Obsidian callouts all normalize to this shape before the rendering
 * layer sees them.
 */
export interface LfmComponentNode {
  /** MDAST node type identifier. Always `'componentNode'`. */
  type: 'componentNode';
  /** The component name (e.g., `'callout'`, `'card-grid'`, `'image'`). */
  name: string;
  /** Key-value attributes parsed from the trigger syntax. */
  attributes: Record<string, string>;
  /** Which syntax was used to trigger this component in the source markdown. */
  triggerSyntax: 'directive' | 'markdoc' | 'mdx-lite' | 'code-fence' | 'obsidian-callout' | 'auto-unfurl';
  /** Raw inner content before child parsing, if applicable. */
  rawContent?: string;
  /** Parsed child nodes. */
  children?: unknown[];
}

/**
 * Callout node produced by the remarkCallouts plugin.
 * Both Obsidian `> [!type] Title` and directive `:::callout{type="warning"}`
 * produce this same node shape.
 */
export interface LfmCalloutNode {
  /** MDAST node type. Always `'containerDirective'`. */
  type: 'containerDirective';
  /** Directive name. Always `'callout'`. */
  name: 'callout';
  /** Callout attributes parsed from the source syntax. */
  attributes: {
    /** The callout type (e.g., `'warning'`, `'tip'`, `'note'`). */
    type: string;
    /** Optional title displayed in the callout header. */
    title?: string;
  };
  /** Parsed child nodes forming the callout body. */
  children?: unknown[];
}

/**
 * Options for the remarkLfm preset.
 */
export interface RemarkLfmOptions {
  /** Enable Obsidian callout → directive normalization. Default: true */
  callouts?: boolean;
  /** Enable GFM features (tables, task lists, strikethrough, autolinks). Default: true */
  gfm?: boolean;
  /** Enable directive syntax parsing. Default: true */
  directives?: boolean;
  /** Enable citation processing (hex-code renumbering, structured definitions). Default: true */
  citations?: boolean;
}
