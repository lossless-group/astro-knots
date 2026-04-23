/**
 * LFM custom MDAST node types.
 *
 * These are standalone type definitions that describe the shape of nodes
 * produced by LFM plugins. They don't extend mdast types directly to
 * maintain compatibility with JSR and other TypeScript-first registries.
 */

/**
 * The normalized component node that ALL trigger syntaxes produce.
 * Directive syntax, Markdoc tags, MDX-lite tags, code fence identifiers,
 * and Obsidian callouts all normalize to this shape before the rendering
 * layer sees them.
 */
export interface LfmComponentNode {
  type: 'componentNode';
  name: string;
  attributes: Record<string, string>;
  triggerSyntax: 'directive' | 'markdoc' | 'mdx-lite' | 'code-fence' | 'obsidian-callout' | 'auto-unfurl';
  rawContent?: string;
  children?: unknown[];
}

/**
 * Callout node produced by the remarkCallouts plugin.
 * Both Obsidian `> [!type] Title` and directive `:::callout{type="warning"}`
 * produce this same node shape.
 */
export interface LfmCalloutNode {
  type: 'containerDirective';
  name: 'callout';
  attributes: {
    type: string;
    title?: string;
  };
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
