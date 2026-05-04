/**
 * @module
 *
 * remark-link-preview — annotates `:::link-preview` and `:::link-rollup`
 * containerDirective nodes with parsed spec metadata so the renderer can
 * dispatch to the right `LinkPreview__*` / `LinkRollup__*` Astro component.
 *
 * What this plugin does NOT do:
 * - Fetch Open Graph metadata. That's `remark-og-fetcher`, which runs after
 *   this plugin and enriches the same `link` children with `data.linkPreview`.
 * - Render anything. Rendering happens in the consuming site's
 *   AstroMarkdown / `LinkPreview__*` Astro components.
 *
 * What this plugin DOES:
 * - Parses the directive's `attributes` into a typed `LinkPreviewSpec`.
 * - Walks the directive's subtree for `link` nodes and classifies each via
 *   the shared catalog matchers (`classifyLink`).
 * - Stamps each link's `data.linkClassification` so the og-fetcher can
 *   skip catalog-known providers (e.g. YouTube — provider info is more
 *   reliable than scraped OG for those) and so the renderer can pick the
 *   right component family.
 * - Stamps the directive's `data.linkPreviewSpec` with the resolved spec
 *   plus the deduplicated list of URLs in document order.
 *
 * Defaults (per spec §4.23.6):
 *   `link-preview`: type=article, format=card
 *   `link-rollup` : type=article, format=gallery
 */

import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import type { LinkPreviewData } from '../types/index.js';
import { classifyLink, collectLinkNodes, type LinkClassification } from '../utils/classify-link.js';

const PREVIEW_NAMES = new Set(['link-preview', 'link-rollup']);

/**
 * Format taxonomy. Mirrors the `--{Format}` segment in the component
 * filename convention (`LinkPreview__Article--Card.astro`, etc.).
 */
export type LinkPreviewFormat =
  | 'row'
  | 'card'
  | 'thumb'
  | 'livesite'
  | 'fullplayer';

export type LinkRollupFormat =
  | 'column'
  | 'gallery'
  | 'carousel'
  | 'thumb-row--horizontal-scroll';

/**
 * The parsed spec the renderer dispatches on. Attached to
 * `containerDirective.data.linkPreviewSpec` after this plugin runs.
 */
export interface LinkPreviewSpec {
  /** Which directive the spec came from. */
  kind: 'link-preview' | 'link-rollup';
  /** Resource type — drives data shape and component family. */
  type: LinkPreviewData['type'];
  /** Visual format — drives component selection. */
  format: LinkPreviewFormat | LinkRollupFormat;
  /** All URLs found in the directive subtree, in document order, deduplicated. */
  urls: string[];
  /** Author-provided columns count for `gallery` rollups. Default 3. */
  columns?: number;
  /** Optional aside positioning (see spec §4.23.6 — Aside positioning). */
  aside?: 'none' | 'left' | 'right' | 'left-escape' | 'right-escape';
  /** Optional explicit width override (CSS length). */
  width?: string;
  /** Optional `kind` from the per-site variant registry (Layer 2 escape hatch). */
  variantKind?: string;
  /** Trust flag for `livesite` format — author opt-in for the iframe path. */
  trusted?: boolean;
  /**
   * Per-URL OG data, copied off each child `link` node's `data.linkPreview`
   * after the og-fetcher has run. Keyed by URL. Empty when og-fetcher is
   * disabled — components fall back to URL + favicon in that case.
   */
  items?: Record<string, Partial<LinkPreviewData>>;
}

/**
 * Default format per directive when the author omits `format=`.
 */
function defaultFormat(name: string): LinkPreviewSpec['format'] {
  return name === 'link-rollup' ? 'gallery' : 'card';
}

/**
 * Coerce the directive's raw attribute value to a known format string.
 * Unknown values pass through — components decide whether to fall back.
 */
function readFormat(raw: string | undefined, name: string): LinkPreviewSpec['format'] {
  if (!raw) return defaultFormat(name);
  return raw.toLowerCase() as LinkPreviewSpec['format'];
}

/**
 * Coerce the directive's `type=` attribute. Defaults to `'article'` when omitted.
 */
function readType(raw: string | undefined): LinkPreviewData['type'] {
  if (!raw) return 'article';
  const v = raw.toLowerCase();
  if (v === 'article' || v === 'video' || v === 'audio' || v === 'code' || v === 'tweet') return v;
  return 'unknown';
}

/**
 * Parse `columns="3"` etc. into a positive integer or undefined.
 */
function readColumns(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function readAside(raw: string | undefined): LinkPreviewSpec['aside'] {
  if (!raw) return undefined;
  const v = raw.toLowerCase();
  if (v === 'none' || v === 'left' || v === 'right' || v === 'left-escape' || v === 'right-escape') return v;
  return undefined;
}

export const remarkLinkPreview: Plugin<[], Root> = function () {
  return (tree: Root) => {
    visit(tree as any);
  };
};

/**
 * Hand-rolled walker — keeps the plugin dependency-free.
 */
function visit(node: any): void {
  if (!node) return;

  if (node.type === 'containerDirective' && PREVIEW_NAMES.has(node.name)) {
    annotate(node);
    // Don't descend further into the directive — the link nodes inside have
    // already had their classification stamped, and the og-fetcher walks the
    // whole tree on its own pass.
    return;
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) visit(child);
  }
}

/**
 * Read the directive's attributes, classify each link in the subtree, and
 * stamp the spec onto `node.data`.
 */
function annotate(node: any): void {
  const attrs: Record<string, string | undefined> = node.attributes ?? {};

  // Collect every link node in the subtree, classify, dedupe URLs, and pull
  // any OG data the og-fetcher has already attached to each link node.
  const linkHits = collectLinkNodes(node);
  const seen = new Set<string>();
  const urls: string[] = [];
  const items: Record<string, Partial<LinkPreviewData>> = {};
  for (const { url, node: linkNode } of linkHits) {
    if (!seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
    const linkData = (linkNode as any).data ?? {};
    const classification = classifyLink(url);
    if (classification) {
      (linkNode as any).data = {
        ...linkData,
        linkClassification: classification as LinkClassification,
      };
    }
    // og-fetcher (when enabled) attaches `linkPreview` to each link node.
    // Copy it onto the spec so the renderer doesn't have to re-walk children.
    const og = linkData.linkPreview as Partial<LinkPreviewData> | undefined;
    if (og && !items[url]) {
      items[url] = og;
    }
  }

  const directiveType = readType(attrs.type);
  // For a rollup, if the author didn't pick a type but every URL classifies
  // as the same provider type, infer it. Mixed-type URLs keep the default.
  let inferredType = directiveType;
  if (node.name === 'link-rollup' && !attrs.type && urls.length > 0) {
    const types = new Set(
      urls.map((u) => classifyLink(u)?.previewType ?? 'article'),
    );
    if (types.size === 1) inferredType = [...types][0] as LinkPreviewData['type'];
  }

  const spec: LinkPreviewSpec = {
    kind: node.name,
    type: inferredType,
    format: readFormat(attrs.format, node.name),
    urls,
    columns: readColumns(attrs.columns),
    aside: readAside(attrs.aside),
    width: attrs.width,
    variantKind: attrs.kind,
    trusted: attrs.trusted === '' || attrs.trusted === 'true',
    items: Object.keys(items).length > 0 ? items : undefined,
  };

  node.data = { ...(node.data ?? {}), linkPreviewSpec: spec };
}
