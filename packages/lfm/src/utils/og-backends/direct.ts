/**
 * @module
 *
 * Direct `fetch()` Open Graph backend.
 *
 * Free, no API key required, fails on ~10-20% of real-world URLs that hide
 * behind Cloudflare bot challenges, render OG tags via JavaScript, or block
 * non-browser User-Agent headers. Useful for local dev and as a fallback.
 *
 * Parses `<meta property="og:*">`, `<meta name="twitter:*">`, and a small
 * set of `<link>` / `<title>` tags via tag-aware regex (no full HTML parser
 * — keeping the dependency surface zero for offline-friendly use).
 */

import type { OGBackend, OGFetchResult, LinkPreviewData } from '../../types/index.js';

const META_RE = /<meta\s+([^>]+?)\/?>/gi;
const TITLE_RE = /<title[^>]*>([^<]+)<\/title>/i;

/**
 * Extract the value of an attribute from a meta tag's attribute string.
 * Handles both `attr="value"` and `attr='value'` quoting; returns `undefined`
 * when the attribute is absent.
 */
function attr(metaAttrs: string, name: string): string | undefined {
  const re = new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i');
  const m = metaAttrs.match(re);
  return m ? m[1] : undefined;
}

/**
 * Walk the HTML for `<meta>` tags and collect Open Graph and Twitter Card
 * values (og:title, twitter:image, etc.) into a key→value map keyed by the
 * lowercase property name.
 */
function collectMeta(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const match of html.matchAll(META_RE)) {
    const attrs = match[1];
    const key = attr(attrs, 'property') ?? attr(attrs, 'name');
    const value = attr(attrs, 'content');
    if (!key || !value) continue;
    if (key.startsWith('og:') || key.startsWith('twitter:') || key === 'description' || key === 'author') {
      out[key.toLowerCase()] = value;
    }
  }
  return out;
}

/**
 * Map collected meta tags into the LinkPreviewData surface fields.
 */
function metaToPreview(meta: Record<string, string>, html: string, url: string): Partial<LinkPreviewData> {
  const titleTag = html.match(TITLE_RE)?.[1]?.trim();
  const host = (() => {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return undefined; }
  })();

  return {
    url,
    title: meta['og:title'] ?? meta['twitter:title'] ?? titleTag,
    description: meta['og:description'] ?? meta['twitter:description'] ?? meta['description'],
    image: meta['og:image'] ?? meta['twitter:image'] ?? meta['twitter:image:src'],
    imageAlt: meta['og:image:alt'] ?? meta['twitter:image:alt'],
    source: meta['og:site_name'] ?? host,
    sourceUrl: host ? `https://${host}` : undefined,
    publishedAt: meta['article:published_time'],
    updatedAt: meta['article:modified_time'],
    authors: meta['article:author'] ? [meta['article:author']] : meta['author'] ? [meta['author']] : undefined,
  };
}

export const direct: OGBackend = async (url, opts) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeout);

  // Forward an external abort signal if the dispatcher provided one.
  opts.signal?.addEventListener('abort', () => controller.abort(), { once: true });

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': opts.userAgent ?? 'LFM-OGBot/1.0',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!res.ok) {
      return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    }

    const html = await res.text();
    const meta = collectMeta(html);
    const data = metaToPreview(meta, html, url);

    // If we got nothing useful, treat as a soft failure so the cache records
    // it under failCacheTtl rather than the long success TTL.
    if (!data.title && !data.description && !data.image) {
      return { ok: false, status: res.status, error: 'no-og-tags' };
    }

    return { ok: true, status: res.status, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  } finally {
    clearTimeout(timer);
  }
};
