/**
 * remark-citations: Transforms footnote identifiers into sequentially-numbered
 * citations with structured metadata parsing.
 *
 * Runs after remark-gfm (which creates footnoteReference and footnoteDefinition
 * nodes). Enriches those nodes with sequential citation indices and parsed
 * metadata, then attaches a full citation map to tree.data.
 *
 * Supports hex-code, numeric, or mixed identifier modes.
 */

import type { Root } from 'mdast';
import type { Plugin } from 'unified';

/**
 * A single parsed citation with sequential index, structured metadata, and raw text.
 * Built by `remarkCitations` from `footnoteReference` and `footnoteDefinition` MDAST nodes.
 */
export interface Citation {
  /** The original identifier from the markdown */
  identifier: string;
  /** Stable hex code (auto-generated if identifier was numeric) */
  hex: string;
  /** Sequential index by order of first appearance */
  index: number;
  /** Parsed from [Title](URL) in the definition */
  title?: string;
  /** Parsed from [Title](URL) in the definition */
  url?: string;
  /** Domain extracted from URL */
  source?: string;
  /** Parsed from "Published: YYYY-MM-DD" */
  publishedDate?: string;
  /** Parsed from "Updated: YYYY-MM-DD" */
  updatedDate?: string;
  /** Year/date prefix if present */
  accessDate?: string;
  /** Raw definition text */
  raw: string;
  /** Whether structured parsing succeeded */
  parsed: boolean;
}

/**
 * A validation warning emitted by `remarkCitations` during processing.
 * Warnings are collected in `CitationsData.warnings` and logged to console.
 */
export interface CitationWarning {
  /** The category of validation issue detected. */
  type: 'orphan-reference' | 'unused-definition' | 'duplicate-url';
  /** The footnote identifier that triggered the warning. */
  identifier: string;
  /** Human-readable description of the issue. */
  message: string;
}

/**
 * The full citation dataset attached to `tree.data.citations` after processing.
 * Contains the citation map, an ordered array for rendering, and any validation warnings.
 */
export interface CitationsData {
  /** Lookup map from identifier to Citation object. */
  map: Map<string, Citation>;
  /** Citations sorted by sequential index, ready for rendering a Sources section. */
  ordered: Citation[];
  /** Validation warnings (orphan references, unused definitions, etc.). */
  warnings: CitationWarning[];
}

/**
 * Configuration options for the `remarkCitations` plugin.
 * All options are optional — sensible defaults are applied.
 */
export interface RemarkCitationsOptions {
  /** 'hex' | 'numeric' | 'mixed' — default: 'mixed' */
  identifiers?: 'hex' | 'numeric' | 'mixed';
  /** Length of auto-generated hex codes for numeric identifiers */
  hexLength?: number;
  /** Parse structured definitions into typed Citation objects */
  structuredDefinitions?: boolean;
  /** Validation options */
  validate?: {
    orphanReferences?: boolean;
    unusedDefinitions?: boolean;
    duplicateUrls?: boolean;
  };
  /** Process source-ref attributes on directive nodes */
  directiveSourceRefs?: boolean;
}

const TITLE_URL_RE = /\[([^\]]+)\]\(([^)]+)\)/;
const YEAR_PREFIX_RE = /^(\d{4}(?:,\s*\w+\s+\d{1,2})?)\.\s*/;
const PUBLISHED_RE = /Published:\s*([\d-]+)/;
const UPDATED_RE = /Updated:\s*([\d-]+)/;

function generateHex(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function extractTextFromChildren(children: any[]): string {
  if (!children) return '';
  return children
    .map((child: any) => {
      if (child.type === 'text') return child.value;
      if (child.type === 'link') {
        const text = extractTextFromChildren(child.children);
        return `[${text}](${child.url})`;
      }
      if (child.children) return extractTextFromChildren(child.children);
      return '';
    })
    .join('');
}

function parseDefinition(raw: string): Partial<Citation> {
  const result: Partial<Citation> = { raw, parsed: false };

  let remaining = raw;

  // Step 1: Extract year/date prefix
  const yearMatch = remaining.match(YEAR_PREFIX_RE);
  if (yearMatch) {
    result.accessDate = yearMatch[1];
    remaining = remaining.slice(yearMatch[0].length);
  }

  // Step 2: Extract [Title](URL)
  const titleMatch = remaining.match(TITLE_URL_RE);
  if (titleMatch) {
    result.title = titleMatch[1];
    result.url = titleMatch[2];
    result.parsed = true;

    // Derive source from URL hostname
    try {
      const hostname = new URL(titleMatch[2]).hostname.replace(/^www\./, '');
      result.source = hostname;
    } catch {
      // URL parsing failed — leave source undefined
    }
  }

  // Step 3: Extract Published/Updated dates
  const publishedMatch = remaining.match(PUBLISHED_RE);
  if (publishedMatch) {
    result.publishedDate = publishedMatch[1];
  }

  const updatedMatch = remaining.match(UPDATED_RE);
  if (updatedMatch) {
    result.updatedDate = updatedMatch[1];
  }

  return result;
}

/**
 * Walk the MDAST depth-first and collect footnote references in document order.
 */
function collectReferences(node: any, refs: string[]): void {
  if (node.type === 'footnoteReference') {
    const id = node.identifier;
    if (!refs.includes(id)) {
      refs.push(id);
    }
  }

  // Also check directive nodes for source-ref attributes
  if (
    (node.type === 'leafDirective' || node.type === 'containerDirective') &&
    node.attributes?.['source-ref']
  ) {
    const id = node.attributes['source-ref'];
    if (!refs.includes(id)) {
      refs.push(id);
    }
  }

  if (node.children) {
    for (const child of node.children) {
      collectReferences(child, refs);
    }
  }
}

/**
 * Walk the tree and enrich footnoteReference nodes with citation data.
 */
function enrichReferences(node: any, indexMap: Map<string, number>): void {
  if (node.type === 'footnoteReference') {
    const id = node.identifier;
    const index = indexMap.get(id);
    if (index !== undefined) {
      if (!node.data) node.data = {};
      node.data.citationIndex = index;
      node.data.citationHex = id;
    }
  }

  // Enrich directive source-ref nodes
  if (
    (node.type === 'leafDirective' || node.type === 'containerDirective') &&
    node.attributes?.['source-ref']
  ) {
    const id = node.attributes['source-ref'];
    const index = indexMap.get(id);
    if (index !== undefined) {
      if (!node.data) node.data = {};
      node.data.citationIndex = index;
      node.data.citationHex = id;
    }
  }

  if (node.children) {
    for (const child of node.children) {
      enrichReferences(child, indexMap);
    }
  }
}

/**
 * Remark plugin that transforms footnote identifiers into sequentially-numbered
 * citations with structured metadata. Runs after `remark-gfm`.
 *
 * Enriches `footnoteReference` nodes with `data.citationIndex`, removes
 * `footnoteDefinition` nodes, and attaches a `CitationsData` object to `tree.data.citations`.
 *
 * @example
 * ```ts
 * import { unified } from 'unified';
 * import remarkParse from 'remark-parse';
 * import remarkGfm from 'remark-gfm';
 * import { remarkCitations } from '@lossless-group/lfm';
 *
 * const processor = unified().use(remarkParse).use(remarkGfm).use(remarkCitations);
 * const tree = await processor.run(processor.parse(markdown));
 * // tree.data.citations.ordered contains sequentially-numbered Citation objects
 * ```
 */
export const remarkCitations: Plugin<[RemarkCitationsOptions?], Root> = function (
  options?: RemarkCitationsOptions
) {
  const defaultValidate = {
    orphanReferences: true,
    unusedDefinitions: true,
    duplicateUrls: false,
  };

  const opts = {
    identifiers: 'mixed' as const,
    hexLength: 6,
    structuredDefinitions: true,
    directiveSourceRefs: true,
    ...options,
    validate: { ...defaultValidate, ...options?.validate },
  };

  return (tree: Root) => {
    const warnings: CitationWarning[] = [];

    // Step 1: Collect all footnote references in document order
    const refOrder: string[] = [];
    collectReferences(tree, refOrder);

    // Step 2: Build index map (identifier → sequential number)
    const indexMap = new Map<string, number>();
    let counter = 0;
    for (const id of refOrder) {
      if (!indexMap.has(id)) {
        indexMap.set(id, ++counter);
      }
    }

    // Step 3: Collect and parse definitions
    const definitions = new Map<string, any>();
    const definitionNodes: any[] = [];

    function collectDefinitions(node: any): void {
      if (node.type === 'footnoteDefinition') {
        definitions.set(node.identifier, node);
        definitionNodes.push(node);
      }
      if (node.children) {
        for (const child of node.children) {
          collectDefinitions(child);
        }
      }
    }
    collectDefinitions(tree);

    // Step 4: Build Citation objects
    const citationMap = new Map<string, Citation>();

    for (const [id, index] of indexMap) {
      const defNode = definitions.get(id);
      const raw = defNode
        ? extractTextFromChildren(defNode.children)
        : '';

      let hex = id;
      if (opts.identifiers === 'numeric' && /^\d+$/.test(id)) {
        hex = generateHex(opts.hexLength);
      }

      let citation: Citation = {
        identifier: id,
        hex,
        index,
        raw,
        parsed: false,
      };

      if (opts.structuredDefinitions && raw) {
        const parsed = parseDefinition(raw);
        citation = { ...citation, ...parsed };
      }

      if (!defNode) {
        citation.raw = '';
      }

      citationMap.set(id, citation);

      // Enrich the definition node
      if (defNode) {
        if (!defNode.data) defNode.data = {};
        defNode.data.citationIndex = index;
        defNode.data.citationHex = hex;
        defNode.data.citationMeta = citation;
      }
    }

    // Step 5: Enrich reference nodes
    enrichReferences(tree, indexMap);

    // Step 6: Validation
    if (opts.validate.orphanReferences) {
      for (const id of refOrder) {
        if (!definitions.has(id)) {
          warnings.push({
            type: 'orphan-reference',
            identifier: id,
            message: `Reference [^${id}] has no matching definition`,
          });
        }
      }
    }

    if (opts.validate.unusedDefinitions) {
      for (const [id] of definitions) {
        if (!indexMap.has(id)) {
          warnings.push({
            type: 'unused-definition',
            identifier: id,
            message: `Definition [^${id}] has no matching inline reference`,
          });
        }
      }
    }

    // Step 7: Remove footnoteDefinition nodes from the tree
    // (they'll be rendered via the citations data, not inline)
    function removeDefinitions(node: any): void {
      if (node.children) {
        node.children = node.children.filter(
          (child: any) => child.type !== 'footnoteDefinition'
        );
        for (const child of node.children) {
          removeDefinitions(child);
        }
      }
    }
    removeDefinitions(tree);

    // Step 8: Build ordered list and attach to tree
    const ordered = Array.from(citationMap.values()).sort(
      (a, b) => a.index - b.index
    );

    if (!tree.data) (tree as any).data = {};
    (tree as any).data.citations = {
      map: citationMap,
      ordered,
      warnings,
    } satisfies CitationsData;

    // Log warnings
    for (const w of warnings) {
      console.warn(`[remark-citations] ${w.message}`);
    }
  };
};
