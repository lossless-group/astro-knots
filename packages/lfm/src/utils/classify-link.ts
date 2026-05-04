/**
 * @module
 *
 * Pure URL classifier — turns a raw URL into provider/kind/id metadata
 * by walking the matchers from `Bare-Link-Provider-Catalog.md`.
 *
 * Two consumers:
 *   1. The (forthcoming) `remark-bare-link` plugin, which uses
 *      `getBareLinkUrl(node)` to detect the bare-URL paragraph shape and
 *      then `classifyLink(url)` to pick a provider.
 *   2. The `remark-link-preview` plugin, which doesn't care about
 *      paragraph shape — it gets URLs from a directive's children and
 *      uses `classifyLink(url)` directly to know what type each one is.
 *
 * Lifted from `sites/mpstaton-site/src/lib/markdown/classify-bare-link.ts`
 * so all consuming sites share the same matchers without copy-paste drift.
 */

import type { LinkPreviewData } from '../types/index.js';

/**
 * Catalog `kind` taxonomy — see `Bare-Link-Provider-Catalog.md`.
 */
export type LinkProviderKind =
  | 'video'
  | 'short'
  | 'playlist'
  | 'audio'
  | 'tweet'
  | 'gist'
  | 'embed';

/**
 * Result of a successful classification.
 */
export interface LinkClassification {
  /** Provider id from the catalog (e.g. `'youtube-video'`, `'vimeo'`). */
  provider: string;
  /** Catalog kind — drives renderer behavior (aspect ratio, autoplay, etc.). */
  kind: LinkProviderKind;
  /** Provider-native ID extracted from the URL. */
  id: string;
  /** The original URL, unchanged. Carries any `?si=`/`?utm_*` tracking through to copy buttons. */
  url: string;
  /** LinkPreviewData `type` value for this provider. */
  previewType: LinkPreviewData['type'];
  /** The Astro component name a site renderer can dispatch to. Mirrors the catalog `component` field. */
  component: string;
  /** Provider-specific extras (e.g. `{ hash: 'abc123' }` for unlisted Vimeo). */
  extra?: Record<string, string>;
}

interface Matcher {
  provider: string;
  component: string;
  kind: LinkProviderKind;
  previewType: LinkPreviewData['type'];
  /** Returns the captured ID + extras, or null on miss. */
  match: (u: URL) => { id: string; extra?: Record<string, string> } | null;
}

const YT_HOSTS_FULL = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com']);
const YT_HOSTS_PLAYLIST = new Set(['youtube.com', 'www.youtube.com']);
const VIMEO_CANONICAL_HOSTS = new Set(['vimeo.com', 'www.vimeo.com']);

/**
 * Matcher list — order is authoritative (first match wins). Mirrors the
 * `providers:` order in `Bare-Link-Provider-Catalog.md`. Narrower matchers
 * (e.g. `youtube-short`) come before broader ones (e.g. `youtube-video`).
 */
const matchers: Matcher[] = [
  {
    provider: 'youtube-short',
    component: 'YouTubeShortsEmbed',
    kind: 'short',
    previewType: 'video',
    match: (u) => {
      if (!YT_HOSTS_FULL.has(u.hostname.toLowerCase())) return null;
      const m = u.pathname.match(/^\/shorts\/([A-Za-z0-9_-]+)\/?$/);
      return m ? { id: m[1] } : null;
    },
  },
  {
    provider: 'youtube-playlist',
    component: 'YouTubePlaylistEmbed',
    kind: 'playlist',
    previewType: 'video',
    match: (u) => {
      if (!YT_HOSTS_PLAYLIST.has(u.hostname.toLowerCase())) return null;
      if (u.pathname !== '/playlist' && u.pathname !== '/playlist/') return null;
      const id = u.searchParams.get('list');
      return id && /^[A-Za-z0-9_-]+$/.test(id) ? { id } : null;
    },
  },
  {
    provider: 'youtube-video',
    component: 'YouTubeEmbed',
    kind: 'video',
    previewType: 'video',
    match: (u) => {
      const host = u.hostname.toLowerCase();
      if (host === 'youtu.be') {
        const m = u.pathname.match(/^\/([A-Za-z0-9_-]{11})\/?$/);
        return m ? { id: m[1] } : null;
      }
      if (YT_HOSTS_FULL.has(host)) {
        if (u.pathname !== '/watch' && u.pathname !== '/watch/') return null;
        const v = u.searchParams.get('v');
        return v && /^[A-Za-z0-9_-]{11}$/.test(v) ? { id: v } : null;
      }
      return null;
    },
  },
  {
    provider: 'vimeo',
    component: 'VimeoEmbed',
    kind: 'video',
    previewType: 'video',
    match: (u) => {
      const host = u.hostname.toLowerCase();
      if (VIMEO_CANONICAL_HOSTS.has(host)) {
        // /{id}, /{id}/{hash}, /channels/{name}/{id}, /album/{x}/video/{id}, etc.
        // The captured group is the trailing numeric ID; an optional alphanumeric
        // suffix is the unlisted-hash that the player URL needs as `?h=…`.
        const m = u.pathname.match(/^\/(?:[^/]+\/)*?(\d+)(?:\/([A-Za-z0-9]+))?\/?$/);
        if (!m) return null;
        return m[2] ? { id: m[1], extra: { hash: m[2] } } : { id: m[1] };
      }
      if (host === 'player.vimeo.com') {
        const m = u.pathname.match(/^\/video\/(\d+)(?:\/([A-Za-z0-9]+))?\/?$/);
        if (!m) return null;
        return m[2] ? { id: m[1], extra: { hash: m[2] } } : { id: m[1] };
      }
      return null;
    },
  },
];

/**
 * Classify a raw URL against the provider catalog.
 *
 * Returns `null` when no matcher hits — callers should treat that as
 * `previewType: 'article'` for the inline-preview flow, or "leave alone"
 * for the bare-link auto-unfurl flow.
 */
export function classifyLink(rawUrl: string): LinkClassification | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }
  for (const m of matchers) {
    const hit = m.match(parsed);
    if (hit) {
      return {
        provider: m.provider,
        component: m.component,
        kind: m.kind,
        previewType: m.previewType,
        id: hit.id,
        extra: hit.extra,
        url: rawUrl,
      };
    }
  }
  return null;
}

/**
 * Detect whether an MDAST paragraph node is a "bare URL" — exactly one child,
 * a `link` node whose visible text equals its URL (the autolink shape).
 *
 * Used by the bare-link auto-unfurl path. Inline links inside prose return
 * `null` here intentionally — they're handled by the inline-link path
 * (popovers, `:::link-preview` directive) rather than full-bleed embedding.
 */
export function getBareLinkUrl(node: unknown): string | null {
  const para = node as { type?: string; children?: unknown[] };
  if (!para || para.type !== 'paragraph') return null;
  const children = Array.isArray(para.children) ? para.children : [];
  if (children.length !== 1) return null;
  const child = children[0] as { type?: string; url?: string; children?: unknown[] };
  if (!child || child.type !== 'link') return null;
  const linkText = (child.children ?? [])
    .map((c) => {
      const v = (c as { value?: unknown }).value;
      return typeof v === 'string' ? v : '';
    })
    .join('')
    .trim();
  const href = (child.url ?? '').trim();
  return linkText === href && href.length > 0 ? href : null;
}

/**
 * Recursively collect every `link` node in a subtree.
 *
 * Used by the directive plugin to find all URLs inside a `:::link-preview`
 * or `:::link-rollup` block regardless of how the author nested them
 * (one URL per paragraph, multiple URLs separated by spaces, list items, etc.).
 */
export function collectLinkNodes(
  root: unknown,
  sink: Array<{ url: string; node: unknown }> = [],
): Array<{ url: string; node: unknown }> {
  const n = root as { type?: string; url?: string; children?: unknown[] };
  if (!n) return sink;
  if (n.type === 'link' && typeof n.url === 'string' && /^https?:\/\//i.test(n.url)) {
    sink.push({ url: n.url, node: n });
  }
  if (Array.isArray(n.children)) {
    for (const child of n.children) collectLinkNodes(child, sink);
  }
  return sink;
}
