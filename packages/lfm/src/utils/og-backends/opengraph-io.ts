/**
 * @module
 *
 * OpenGraph.io Open Graph backend.
 *
 * Wire-protocol contract:
 *   GET https://opengraph.io/api/1.1/site/{encoded_url}?app_id={apiKey}
 *
 * Note that OpenGraph.io's query parameter is named `app_id` — that is the
 * service's wire-level name. Our internal config field is `apiKey` (it
 * authenticates and is billable), and the translation happens here at the
 * boundary so the rest of the codebase consistently says "key".
 *
 * Response shape (relevant subset):
 *   {
 *     "hybridGraph": { "title", "description", "image", "site_name", "url", ... },
 *     "openGraph":   { "title", "description", "image": { "url" }, ... },
 *     "htmlInferred":{ "title", "description", "image", ... }
 *   }
 *
 * `hybridGraph` is the merged view OpenGraph.io recommends consuming, with
 * fallbacks across openGraph → twitter → htmlInferred. We read from there
 * first and fall back to `openGraph` for fields it omits.
 */

import type { OGBackend, LinkPreviewData } from '../../types/index.js';

const DEFAULT_BASE = 'https://opengraph.io/api/1.1';

interface OpenGraphIoResponse {
  hybridGraph?: {
    title?: string;
    description?: string;
    image?: string;
    site_name?: string;
    url?: string;
    favicon?: string;
    type?: string;
  };
  openGraph?: {
    title?: string;
    description?: string;
    image?: { url?: string; alt?: string };
    site_name?: string;
    article?: {
      published_time?: string;
      modified_time?: string;
      author?: string | string[];
    };
  };
  htmlInferred?: {
    title?: string;
    description?: string;
    image?: string;
  };
  error?: { code: number; message: string };
}

/**
 * Coerce an `author` field that OpenGraph.io may return as either a string
 * or an array into the canonical `string[]` shape.
 */
function normalizeAuthors(author: string | string[] | undefined): string[] | undefined {
  if (!author) return undefined;
  return Array.isArray(author) ? author : [author];
}

export const openGraphIo: OGBackend = async (url, opts) => {
  if (!opts.apiKey) {
    return { ok: false, error: 'opengraph-io: missing apiKey (set OPENGRAPH_IO_API_KEY)' };
  }

  const base = opts.baseUrl ?? DEFAULT_BASE;
  const endpoint = `${base}/site/${encodeURIComponent(url)}?app_id=${encodeURIComponent(opts.apiKey)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeout);
  opts.signal?.addEventListener('abort', () => controller.abort(), { once: true });

  try {
    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        'User-Agent': opts.userAgent ?? 'LFM-OGBot/1.0',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      return { ok: false, status: res.status, error: `opengraph-io HTTP ${res.status}` };
    }

    const json = (await res.json()) as OpenGraphIoResponse;

    if (json.error) {
      return { ok: false, status: json.error.code, error: `opengraph-io: ${json.error.message}` };
    }

    const hg = json.hybridGraph ?? {};
    const og = json.openGraph ?? {};
    const inferred = json.htmlInferred ?? {};

    const host = (() => {
      try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return undefined; }
    })();

    const data: Partial<LinkPreviewData> = {
      url,
      title: hg.title ?? og.title ?? inferred.title,
      description: hg.description ?? og.description ?? inferred.description,
      image: hg.image ?? og.image?.url ?? inferred.image,
      imageAlt: og.image?.alt,
      source: hg.site_name ?? og.site_name ?? host,
      sourceUrl: host ? `https://${host}` : undefined,
      publishedAt: og.article?.published_time,
      updatedAt: og.article?.modified_time,
      authors: normalizeAuthors(og.article?.author),
    };

    if (!data.title && !data.description && !data.image) {
      return { ok: false, status: res.status, error: 'opengraph-io: empty response' };
    }

    return { ok: true, status: res.status, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `opengraph-io: ${message}` };
  } finally {
    clearTimeout(timer);
  }
};
