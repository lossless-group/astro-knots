/**
 * @module
 *
 * Build-time dispatcher that wraps an OG backend with the cross-cutting
 * concerns the spec requires: cache hits, retries with exponential backoff,
 * concurrency limit, and rate-limit accounting (per-minute sliding window
 * + per-month soft cap).
 *
 * Consumers create one dispatcher per build via `createOGDispatcher(opts)`,
 * then call `dispatcher.fetch(url)` for each URL. The dispatcher owns the
 * cache lifecycle — call `dispatcher.flush()` at end-of-build to persist.
 */

import type {
  OGFetchOptions,
  OGFetchResult,
  LinkPreviewData,
  OGBackend,
} from '../types/index.js';
import { OGCache, loadOGCache } from './og-cache.js';
import { getBackend } from './og-backends/index.js';

/**
 * Defaults applied when a field is omitted from `OGFetchOptions`.
 *
 * Mirrors the documented defaults in the spec (§4.23.5 / §4.23.6) so the
 * out-of-the-box experience matches what a site author reads.
 */
const DEFAULTS = {
  enabled: false,
  backend: 'direct' as const,
  ttl: 7 * 24 * 60 * 60,
  failCacheTtl: 24 * 60 * 60,
  timeout: 5000,
  maxConcurrent: 4,
  retries: 3,
  backoffMs: 1000,
  cachePath: 'src/data/og-cache.json',
  userAgent: 'LFM-OGBot/1.0',
};

/**
 * The end-of-pipeline result: either a fully-formed LinkPreviewData object
 * or a `failed` cacheStatus marker the renderer can degrade on.
 */
export interface DispatchResult {
  data: LinkPreviewData;
  fromCache: boolean;
}

/**
 * Sleep helper for backoff.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Decide whether an HTTP status code or thrown error is worth retrying.
 *
 * 4xx (other than 408 / 429) is a permanent caller-side failure — retrying
 * will produce the same response. 5xx and timeouts may be transient.
 */
function isRetryable(result: OGFetchResult): boolean {
  if (result.ok) return false;
  if (result.status === undefined) return true; // network error / abort
  if (result.status === 408 || result.status === 429) return true;
  if (result.status >= 500) return true;
  return false;
}

/**
 * Sliding-window per-minute rate limiter. Tracks request timestamps in a
 * fixed-size circular array and waits when the window is full.
 *
 * Per-month accounting is intentionally soft — the dispatcher counts
 * outbound calls and emits a single warning when usage crosses 80% of the
 * configured cap. We don't hard-stop the build because OpenGraph.io's
 * monthly counter is the authoritative source and a build-side estimate
 * could falsely block legitimate work.
 */
class RateLimiter {
  private timestamps: number[] = [];
  private monthlyCount = 0;
  private warnedMonthly = false;

  constructor(
    private readonly perMinute: number | undefined,
    private readonly perMonth: number | undefined,
    private readonly onWarning: (msg: string) => void,
  ) {}

  async acquire(): Promise<void> {
    if (this.perMinute && this.perMinute > 0) {
      const now = Date.now();
      const windowStart = now - 60_000;
      this.timestamps = this.timestamps.filter((t) => t > windowStart);
      if (this.timestamps.length >= this.perMinute) {
        const earliest = this.timestamps[0];
        const wait = 60_000 - (now - earliest) + 50; // tiny cushion
        await sleep(wait);
      }
      this.timestamps.push(Date.now());
    }

    this.monthlyCount += 1;
    if (this.perMonth && !this.warnedMonthly && this.monthlyCount >= this.perMonth * 0.8) {
      this.onWarning(
        `[lfm] OG fetch usage at ${this.monthlyCount}/${this.perMonth} for the month. ` +
        `Consider increasing the cache ttl or upgrading the OpenGraph.io plan.`,
      );
      this.warnedMonthly = true;
    }
  }
}

/**
 * In-process semaphore — caps the number of in-flight backend calls.
 */
class Semaphore {
  private waiting: Array<() => void> = [];
  private available: number;

  constructor(max: number) {
    this.available = max;
  }

  async acquire(): Promise<() => void> {
    if (this.available > 0) {
      this.available -= 1;
      return () => this.release();
    }
    await new Promise<void>((resolve) => this.waiting.push(resolve));
    this.available -= 1;
    return () => this.release();
  }

  private release(): void {
    this.available += 1;
    const next = this.waiting.shift();
    if (next) next();
  }
}

/**
 * Per-build dispatcher. Owns the cache, semaphore, rate limiter, and
 * backend selection.
 */
export class OGDispatcher {
  private readonly opts: Required<Omit<OGFetchOptions, 'apiKey' | 'baseUrl' | 'rateLimit'>> &
    Pick<OGFetchOptions, 'apiKey' | 'baseUrl' | 'rateLimit'>;
  private readonly backend: OGBackend;
  private readonly semaphore: Semaphore;
  private readonly limiter: RateLimiter;
  private readonly cache: OGCache;

  constructor(opts: OGFetchOptions, cache: OGCache) {
    this.opts = {
      ...DEFAULTS,
      ...opts,
    } as typeof this.opts;
    this.backend = getBackend(this.opts.backend);
    this.semaphore = new Semaphore(this.opts.maxConcurrent);
    this.limiter = new RateLimiter(
      opts.rateLimit?.perMinute,
      opts.rateLimit?.perMonth,
      // eslint-disable-next-line no-console
      (msg) => console.warn(msg),
    );
    this.cache = cache;
  }

  /**
   * Fetch a URL with cache + retries + concurrency + rate-limit applied.
   *
   * Always returns a `DispatchResult` — failures produce a sentinel
   * `LinkPreviewData` with `cacheStatus: 'failed'` so the renderer's
   * fallback path is deterministic.
   */
  async fetch(url: string): Promise<DispatchResult> {
    const cached = this.cache.get(url);
    if (cached) {
      if (cached.ok && cached.data) {
        return {
          data: this.materialize(url, cached.data, 'hit'),
          fromCache: true,
        };
      }
      return {
        data: this.failedSentinel(url),
        fromCache: true,
      };
    }

    if (!this.opts.enabled) {
      return {
        data: this.failedSentinel(url),
        fromCache: false,
      };
    }

    const release = await this.semaphore.acquire();
    try {
      const result = await this.fetchWithRetries(url);
      if (result.ok && result.data) {
        this.cache.setOk(url, result.data, this.opts.ttl, this.opts.backend);
        return {
          data: this.materialize(url, result.data, 'miss'),
          fromCache: false,
        };
      }
      this.cache.setFail(url, result.error ?? 'unknown', this.opts.failCacheTtl, this.opts.backend);
      return {
        data: this.failedSentinel(url),
        fromCache: false,
      };
    } finally {
      release();
    }
  }

  /**
   * Persist any pending cache writes. Idempotent — safe to call multiple times.
   */
  async flush(): Promise<void> {
    await this.cache.flush();
  }

  /**
   * Run one or more backend calls, sleeping `backoffMs * 2^n` between attempts.
   * Stops early on a non-retryable failure.
   */
  private async fetchWithRetries(url: string): Promise<OGFetchResult> {
    let lastResult: OGFetchResult = { ok: false, error: 'no attempts made' };
    for (let attempt = 0; attempt <= this.opts.retries; attempt += 1) {
      await this.limiter.acquire();
      lastResult = await this.backend(url, {
        timeout: this.opts.timeout,
        apiKey: this.opts.apiKey,
        baseUrl: this.opts.baseUrl,
        userAgent: this.opts.userAgent,
      });
      if (lastResult.ok || !isRetryable(lastResult)) return lastResult;
      if (attempt < this.opts.retries) {
        await sleep(this.opts.backoffMs * Math.pow(2, attempt));
      }
    }
    return lastResult;
  }

  /**
   * Stitch a partial backend response together with provenance fields into
   * the full LinkPreviewData shape components consume.
   */
  private materialize(
    url: string,
    data: Partial<LinkPreviewData>,
    cacheStatus: 'hit' | 'miss',
  ): LinkPreviewData {
    return {
      type: 'unknown',
      ...data,
      url,
      fetchedAt: data.fetchedAt ?? new Date().toISOString(),
      cacheStatus,
    } as LinkPreviewData;
  }

  /**
   * The sentinel returned for any failure path — guarantees components see
   * a `LinkPreviewData` they can degrade on rather than `undefined`.
   */
  private failedSentinel(url: string): LinkPreviewData {
    return {
      url,
      type: 'unknown',
      cacheStatus: 'failed',
    };
  }
}

/**
 * Convenience constructor. Loads the cache from disk and returns a ready
 * dispatcher.
 */
export async function createOGDispatcher(opts: OGFetchOptions): Promise<OGDispatcher> {
  const cachePath = opts.cachePath ?? DEFAULTS.cachePath;
  const cache = await loadOGCache(cachePath);
  return new OGDispatcher(opts, cache);
}
