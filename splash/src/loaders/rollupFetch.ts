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

export async function fetchRolledUp(options: RollupFetchOptions): Promise<FetchResult> {
  const submodules = await parseGitmodules(options.gitmodulesPath);
  const perSubmodule: FetchResult['perSubmodule'] = [];
  const entries: FetchedEntry[] = [];

  for (const sub of submodules) {
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
