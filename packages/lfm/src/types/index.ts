import type { Parent, Literal, PhrasingContent } from 'mdast';

/**
 * The normalized component node that ALL trigger syntaxes produce.
 * Directive syntax, Markdoc tags, MDX-lite tags, code fence identifiers,
 * and Obsidian callouts all normalize to this shape before the rendering
 * layer sees them.
 */
export interface LfmComponentNode extends Parent {
  type: 'componentNode';
  name: string;
  attributes: Record<string, string>;
  triggerSyntax: 'directive' | 'markdoc' | 'mdx-lite' | 'code-fence' | 'obsidian-callout' | 'auto-unfurl';
  rawContent?: string;
}

/**
 * Callout node produced by the remarkCallouts plugin.
 * Both Obsidian `> [!type] Title` and directive `:::callout{type="warning"}`
 * produce this same node shape.
 */
export interface LfmCalloutNode extends Parent {
  type: 'containerDirective';
  name: 'callout';
  attributes: {
    type: string;
    title?: string;
  };
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
}

// Re-export commonly used mdast types for convenience
export type { Root, Content, Parent, Literal, PhrasingContent } from 'mdast';
