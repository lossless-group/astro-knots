/**
 * Roll-up fetcher: hits the GitHub Content API for every site submodule
 * registered in the parent .gitmodules and returns the merged set of
 * entries with provenance metadata. Used by `pnpm rollup:sync` only —
 * never called at Astro build time.
 */

import { parseFrontmatter } from './frontmatter.ts';
import {
  fetchRawFile,
  isAuthenticated,
  listMarkdownRecursive,
} from './githubContentApi.ts';
import { parseGitmodules, type SubmoduleEntry } from './parseGitmodules.ts';

export interface RollupFetchOptions {
  remotePath: string;
  remoteFallbackPaths?: string[];
  gitmodulesPath: string;
  collectionName: string;
  filter?: (relPath: string) => boolean;
}

export interface FetchedEntry {
  from: string;
  fromPath: string;
  sourcePath: string;
  legacy: boolean;
  data: Record<string, unknown>;
  body: string;
  raw: string;
}

export interface FetchResult {
  authenticated: boolean;
  perSubmodule: Array<{
    submodule: SubmoduleEntry;
    entries: FetchedEntry[];
    error?: string;
  }>;
  entries: FetchedEntry[];
}


/* ─── Visibility gate ────────────────────────────────────────────────────────
 *
 * This splash is public: everything under src/rollup/ is committed to a public
 * repo and rendered to GitHub Pages.
 *
 * A `publish: true` frontmatter flag is NOT authorisation to appear here. That
 * flag is set by whoever authored the entry, for THEIR repo's surface — a
 * private repo can legitimately mark entries `publish: true` meaning "publish
 * on our own gated site". On 2026-08-17 that mismatch put client material on a
 * live public URL from a sibling splash. The publish flag is the wrong control
 * at an aggregation boundary.
 *
 * The submodules here are all intended-public websites, so this is a guard
 * rather than a fix for a known leak. It exists so that adding a private repo
 * to .gitmodules cannot quietly republish it.
 *
 * Detection is an UNAUTHENTICATED GitHub API call: a public repo returns 200, a
 * private one returns 404 because an anonymous caller cannot see it at all.
 * Deliberately unauthenticated — an authenticated call would succeed against
 * private repos and defeat the purpose.
 *
 * FAILS CLOSED. Anything not provably public is skipped and logged.
 */

/** Never rolled up, whatever anything else says. */
const ROLLUP_DENYLIST: readonly string[] = [
  // A VC fund's site. Its changelog documents the access control protecting
  // confidential investment memos, and previously enumerated the memo pipeline
  // by company name. Genericized at the source in Aug 2026, but this is client
  // work and does not belong in a public aggregation regardless.
  'hypernova-site',
];

/** Private REPOS whose SITES are intended to be public.
 *
 * The default below is deny-unless-provably-public, which is the right default.
 * These are the deliberate exceptions: ordinary Astro Knots marketing sites that
 * happen to sit in private repos. Nothing client-confidential lives in them.
 *
 * This is an allowlist rather than a loosened default on purpose — adding a repo
 * here is a decision someone made and can be reviewed, whereas failing open is a
 * decision nobody made. */
const PRIVATE_REPO_PUBLIC_SITE: readonly string[] = [
  'cogs-site',
  'banner-site',
  'arthouse-site',
  'learnstart-site',
];

const visibilityCache = new Map<string, boolean>();

async function isPubliclyVisible(ownerRepo: string): Promise<boolean> {
  const cached = visibilityCache.get(ownerRepo);
  if (cached !== undefined) return cached;
  let ok = false;
  try {
    const res = await fetch(`https://api.github.com/repos/${ownerRepo}`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'lossless-rollup-sync' },
    });
    if (res.status === 200) {
      const body = (await res.json()) as { private?: boolean };
      ok = body.private === false;
    }
  } catch {
    ok = false; // network trouble -> fail closed
  }
  visibilityCache.set(ownerRepo, ok);
  return ok;
}

export async function fetchRolledUp(options: RollupFetchOptions): Promise<FetchResult> {
  const submodules = await parseGitmodules(options.gitmodulesPath);
  const perSubmodule: FetchResult['perSubmodule'] = [];
  const entries: FetchedEntry[] = [];

  for (const sub of submodules) {
    if (ROLLUP_DENYLIST.includes(sub.slug)) {
      console.log(`[rollup-sync]   SKIP ${sub.slug} — denylist`);
      continue;
    }
    if (!PRIVATE_REPO_PUBLIC_SITE.includes(sub.slug) && !(await isPubliclyVisible(sub.ownerRepo))) {
      console.log(`[rollup-sync]   SKIP ${sub.slug} — ${sub.ownerRepo} not publicly visible and not allowlisted`);
      continue;
    }
    try {
      const subEntries = await collectFromSubmodule(sub, options);
      perSubmodule.push({ submodule: sub, entries: subEntries });
      entries.push(...subEntries);
    } catch (err) {
      perSubmodule.push({
        submodule: sub,
        entries: [],
        error: (err as Error).message,
      });
    }
  }

  return {
    authenticated: isAuthenticated(),
    perSubmodule,
    entries,
  };
}

async function collectFromSubmodule(
  sub: SubmoduleEntry,
  options: RollupFetchOptions,
): Promise<FetchedEntry[]> {
  const out: FetchedEntry[] = [];

  const paths: { path: string; legacy: boolean }[] = [
    { path: options.remotePath, legacy: false },
    ...(options.remoteFallbackPaths ?? []).map((p) => ({ path: p, legacy: true })),
  ];

  for (const { path, legacy } of paths) {
    const files = await listMarkdownRecursive(sub.ownerRepo, path, sub.branch);
    for (const file of files) {
      if (!file.download_url) continue;

      const relPath = stripPrefix(file.path, path);
      if (options.filter && !options.filter(relPath)) continue;

      const raw = await fetchRawFile(file.download_url);
      const { data, body } = parseFrontmatter(raw);

      out.push({
        from: sub.slug,
        fromPath: relPath,
        sourcePath: file.path,
        legacy,
        data,
        body,
        raw,
      });
    }
  }
  return out;
}

function stripPrefix(filePath: string, prefix: string): string {
  const norm = prefix.endsWith('/') ? prefix : `${prefix}/`;
  return filePath.startsWith(norm) ? filePath.slice(norm.length) : filePath;
}
