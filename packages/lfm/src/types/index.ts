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
  /** Build-time Open Graph fetch options. Disabled when omitted. */
  ogFetch?: OGFetchOptions;
}

/**
 * Render-surface metadata for a single link.
 *
 * Field names align with the canonical Sources schema in `cite-wide` so that
 * a future "promote to canonical" pipeline is additive rather than a rename.
 * See spec §4.23.6 for the full mapping table.
 */
export interface LinkPreviewData {
  // === Identity ===
  /** Canonical href; aligns with `accessed_at_url` in the canonical schema. */
  url: string;
  /** Resource kind. Drives data-shape and component-family selection. */
  type: 'article' | 'video' | 'audio' | 'code' | 'tweet' | 'unknown';

  // === Surface metadata (extracted at build time from OG / twitter / Schema.org tags) ===
  title?: string;
  /** Aligns with the canonical `lede` field (subtitle is canonical-only for now). */
  description?: string;
  /** Aligns with `piece_og_image`. */
  image?: string;
  /** Local-only — canonical schema doesn't require it. */
  imageAlt?: string;
  /** Aligns with `publisher` — display name when available, host fallback. */
  source?: string;
  /** Aligns with `publisher_url`. */
  sourceUrl?: string;
  /** Aligns with `date_published` — ISO 8601. */
  publishedAt?: string;
  /** Aligns with `date_modified` — ISO 8601. */
  updatedAt?: string;
  /** ISO 8601 duration for video/audio (no canonical equivalent yet). */
  duration?: string;
  /** Aligns with `authors` — array, matches canonical shape. */
  authors?: string[];

  // === Provider-specific (matches the bare-link catalog) ===
  /** Provider-native ID, e.g. YouTube video ID, Vimeo numeric ID. */
  providerId?: string;
  /** Provider-specific extras, e.g. `{ hash: 'abc123' }` for unlisted Vimeo. */
  providerExtra?: Record<string, string>;

  // === Bridge to canonical Sources catalog (set iff promoted) ===
  canonicalSource?: {
    /** `internal_uuid` from the canonical schema. */
    uuid: string;
    /** `reference_hexcode` — already used in our citation system. */
    hexcode?: string;
    /** `default_slug` — for routing to the canonical entry's page. */
    slug?: string;
  };

  // === Provenance ===
  /** When OG was last successfully fetched (ISO 8601). */
  fetchedAt?: string;
  /** Whether the cache served this entry, missed and refetched, or failed. */
  cacheStatus: 'hit' | 'miss' | 'failed';
}

/**
 * Result of a single OG fetch from a backend.
 *
 * Backends return this shape uniformly; the dispatcher normalises into
 * a `LinkPreviewData` after applying provenance fields.
 */
export interface OGFetchResult {
  /** True iff the backend returned usable metadata. */
  ok: boolean;
  /** Raw fields the backend extracted. May be empty even when `ok: true`. */
  data?: Partial<LinkPreviewData>;
  /** Backend-specific error message when `ok: false`. */
  error?: string;
  /** HTTP status code from the upstream call, when applicable. */
  status?: number;
}

/**
 * Identifier for the OG fetch backend.
 *
 * - `direct` — naïve `fetch()` against the target URL. Free, fails on ~10-20%
 *   of real-world URLs (Cloudflare, JS-rendered pages, anti-scrape headers).
 * - `opengraph-io` — managed service. Handles JS rendering, normalises tags.
 *   Recommended production default. Requires `apiKey`.
 * - `proxy` — self-hosted scraping proxy (e.g. Browserless). Future.
 * - `frontmatter-only` — author-supplied metadata only. Skips network.
 */
export type OGBackendName = 'direct' | 'opengraph-io' | 'proxy' | 'frontmatter-only';

/**
 * Backend interface — every backend module exports a function matching this
 * signature. The dispatcher composes them with retries, concurrency, and
 * rate-limit accounting on top.
 */
export type OGBackend = (url: string, opts: OGBackendOptions) => Promise<OGFetchResult>;

/**
 * Options passed to an individual backend on each call.
 */
export interface OGBackendOptions {
  /** Per-request timeout in milliseconds. */
  timeout: number;
  /** Backend-specific API credential. Required by `opengraph-io`, ignored by `direct`. */
  apiKey?: string;
  /** Override base URL (useful for self-hosted proxy or test fixtures). */
  baseUrl?: string;
  /** User-Agent header sent with the request. */
  userAgent?: string;
  /** AbortSignal for cancellation propagation. */
  signal?: AbortSignal;
}

/**
 * Build-time OG fetch configuration.
 *
 * Mirrors the `lfm.config.json` shape so per-site config files can spread
 * directly into the preset options.
 */
export interface OGFetchOptions {
  /** When false, the og-fetcher plugin is a no-op. Default: false. */
  enabled?: boolean;
  /** Which backend to dispatch to. Default: `'direct'`. */
  backend?: OGBackendName;
  /** API credential for the backend. Pass `process.env.OPENGRAPH_IO_API_KEY` for `opengraph-io`. */
  apiKey?: string;
  /** Override the backend's default base URL (e.g. self-hosted proxy). */
  baseUrl?: string;
  /** Cache TTL for successful fetches, in seconds. Default: 7 days. */
  ttl?: number;
  /** Cache TTL for failed fetches, in seconds. Default: 1 day. */
  failCacheTtl?: number;
  /** Per-request timeout in milliseconds. Default: 5000. */
  timeout?: number;
  /** Maximum concurrent fetches during a build. Default: 4. */
  maxConcurrent?: number;
  /** Number of retry attempts for transient failures. Default: 3. */
  retries?: number;
  /** Initial backoff delay (ms) between retries; doubled on each attempt. Default: 1000. */
  backoffMs?: number;
  /** Soft rate-limit accounting. The dispatcher pauses or warns when these caps approach. */
  rateLimit?: {
    /** Client-side throttle ceiling, evaluated as a sliding window. */
    perMinute?: number;
    /** Plan ceiling — dispatcher emits a warning when usage approaches this. */
    perMonth?: number;
  };
  /** Path (relative to the site root) where the JSON cache lives. Default: `src/data/og-cache.json`. */
  cachePath?: string;
  /** User-Agent header sent on backend requests. Default: `'LFM-OGBot/1.0'`. */
  userAgent?: string;
}
