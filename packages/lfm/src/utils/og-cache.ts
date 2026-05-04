/**
 * @module
 *
 * On-disk JSON cache for Open Graph fetches.
 *
 * The cache is keyed by a SHA-256 hash of the canonical URL so that long
 * URLs and special characters don't bloat keys or break JSON. Successful
 * fetches expire after `ttl` seconds; failed fetches expire after the
 * shorter `failCacheTtl` so transient upstream issues don't poison the
 * cache for a full week.
 *
 * Reads are eager (load the entire cache once per build), writes are
 * coalesced (one atomic write at the end of the build via `flush()`).
 */

import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import type { LinkPreviewData } from '../types/index.js';

/**
 * One cache entry. Stored on disk inside `OGCacheFile.entries`.
 */
export interface OGCacheEntry {
  /** Iff `true`, the fetch produced usable metadata. */
  ok: boolean;
  /** The fetched preview data. Always present on `ok: true` entries; may be a partial on failures. */
  data?: Partial<LinkPreviewData>;
  /** When the entry was written, as ISO 8601. */
  cachedAt: string;
  /** When the entry expires, as ISO 8601. */
  expiresAt: string;
  /** Backend identifier that produced the entry — useful for debugging. */
  backend?: string;
  /** Failure reason when `ok: false`. */
  error?: string;
}

/**
 * On-disk cache file shape. The wrapper carries a version field so future
 * format migrations can be detected without ambiguity.
 */
export interface OGCacheFile {
  version: 1;
  entries: Record<string, OGCacheEntry>;
}

const CACHE_VERSION = 1 as const;

/**
 * Hash a URL into a 16-char prefix of its SHA-256 digest.
 *
 * Short enough to keep the JSON readable, long enough to make collisions
 * astronomically unlikely for any realistic site (~10^19 keyspace).
 */
export function hashUrl(url: string): string {
  return createHash('sha256').update(url).digest('hex').slice(0, 16);
}

/**
 * In-memory wrapper around the on-disk cache file. One instance per build.
 *
 * Construct via `loadOGCache(path)` rather than `new OGCache()` directly so
 * that the disk read is isolated and an empty cache file is created on miss.
 */
export class OGCache {
  private entries: Record<string, OGCacheEntry>;
  private dirty = false;

  constructor(
    private readonly cachePath: string,
    initial: OGCacheFile,
  ) {
    this.entries = initial.entries;
  }

  /**
   * Look up a URL.
   *
   * Returns `undefined` when there is no entry, or when the entry has expired.
   * Expired entries are NOT removed from disk here — `flush()` rewrites the
   * full cache and stale entries are simply overwritten on the next miss.
   */
  get(url: string): OGCacheEntry | undefined {
    const entry = this.entries[hashUrl(url)];
    if (!entry) return undefined;
    if (Date.parse(entry.expiresAt) <= Date.now()) return undefined;
    return entry;
  }

  /**
   * Record a successful fetch. The entry expires `ttlSeconds` from now.
   */
  setOk(url: string, data: Partial<LinkPreviewData>, ttlSeconds: number, backend?: string): void {
    const now = Date.now();
    this.entries[hashUrl(url)] = {
      ok: true,
      data,
      cachedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + ttlSeconds * 1000).toISOString(),
      backend,
    };
    this.dirty = true;
  }

  /**
   * Record a failed fetch. The entry expires `failTtlSeconds` from now so
   * transient upstream issues retry sooner than successful entries refresh.
   */
  setFail(url: string, error: string, failTtlSeconds: number, backend?: string): void {
    const now = Date.now();
    this.entries[hashUrl(url)] = {
      ok: false,
      cachedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + failTtlSeconds * 1000).toISOString(),
      backend,
      error,
    };
    this.dirty = true;
  }

  /**
   * Atomically rewrite the cache file when there are pending changes.
   *
   * Uses a `.tmp` sibling + `rename()` so a crash mid-write can never leave
   * a partial JSON document on disk.
   */
  async flush(): Promise<void> {
    if (!this.dirty) return;
    const payload: OGCacheFile = { version: CACHE_VERSION, entries: this.entries };
    await fs.mkdir(dirname(this.cachePath), { recursive: true });
    const tmp = `${this.cachePath}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(payload, null, 2), 'utf8');
    await fs.rename(tmp, this.cachePath);
    this.dirty = false;
  }
}

/**
 * Load the cache from disk, or return an empty cache when the file is missing
 * or unparseable. A corrupt cache is never fatal — we treat it as a cold start.
 */
export async function loadOGCache(cachePath: string): Promise<OGCache> {
  try {
    const raw = await fs.readFile(cachePath, 'utf8');
    const parsed = JSON.parse(raw) as OGCacheFile;
    if (parsed.version !== CACHE_VERSION || typeof parsed.entries !== 'object' || parsed.entries === null) {
      return new OGCache(cachePath, { version: CACHE_VERSION, entries: {} });
    }
    return new OGCache(cachePath, parsed);
  } catch {
    return new OGCache(cachePath, { version: CACHE_VERSION, entries: {} });
  }
}
