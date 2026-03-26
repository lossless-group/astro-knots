/**
 * remark-callouts: Transforms Obsidian-style callouts into directive nodes.
 *
 * Converts:
 *   > [!warning] Watch out
 *   > This is important.
 *
 * Into a containerDirective node with name "callout" and attributes { type: "warning", title: "Watch out" }
 * so the downstream renderer (AstroMarkdown) handles them identically to :::callout{type="warning"}.
 */

import type { Root, Blockquote, Paragraph, Text } from 'mdast';
import type { Plugin } from 'unified';

const CALLOUT_REGEX = /^\[!(\w+)\]\s*(.*)?$/;

export const remarkCallouts: Plugin<[], Root> = function () {
  return (tree: Root) => {
    visitBlockquotes(tree);
  };
};

function visitBlockquotes(node: any): void {
  if (!node.children) return;

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];

    if (child.type === 'blockquote') {
      const transformed = tryTransformCallout(child);
      if (transformed) {
        node.children[i] = transformed;
        continue;
      }
    }

    // Recurse into children
    visitBlockquotes(child);
  }
}

function tryTransformCallout(blockquote: Blockquote): any | null {
  const firstChild = blockquote.children[0];
  if (!firstChild || firstChild.type !== 'paragraph') return null;

  const paragraph = firstChild as Paragraph;
  const firstInline = paragraph.children[0];
  if (!firstInline || firstInline.type !== 'text') return null;

  const text = firstInline as Text;
  const match = text.value.match(CALLOUT_REGEX);
  if (!match) return null;

  const calloutType = match[1].toLowerCase();
  const title = match[2]?.trim() || undefined;

  // Build the children for the callout: everything after the [!type] line
  const remainingInline = paragraph.children.slice(1);
  const remainingBlocks = blockquote.children.slice(1);

  // If there's text remaining in the first paragraph after the callout marker,
  // strip the leading newline and include it
  const calloutChildren: any[] = [];

  if (remainingInline.length > 0) {
    // Strip leading newline from first remaining inline
    const first = remainingInline[0];
    if (first.type === 'text' && first.value.startsWith('\n')) {
      remainingInline[0] = { ...first, value: first.value.slice(1) };
    }
    calloutChildren.push({
      type: 'paragraph',
      children: remainingInline,
    });
  }

  calloutChildren.push(...remainingBlocks);

  return {
    type: 'containerDirective',
    name: 'callout',
    attributes: {
      type: calloutType,
      ...(title ? { title } : {}),
    },
    children: calloutChildren,
    data: {
      hName: 'div',
      hProperties: { class: `callout callout-${calloutType}` },
    },
  };
}
