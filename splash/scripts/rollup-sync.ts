#!/usr/bin/env node
/**
 * pnpm rollup:sync
 *
 * Pulls each site submodule's changelog/ and context-v/ via the GitHub
 * Content API and writes the results to splash/src/rollup/. Subsequent
 * `pnpm build` and `pnpm dev` runs read from those files — no API calls,
 * no auth, no rate limits at build time.
 *
 * Run this when:
 * - You bumped a submodule pointer and want the splash to reflect the new content.
 * - A site shipped a new changelog entry and you want it surfaced.
 * - Periodically (e.g. weekly) to catch upstream drift.
 *
 * Auth:
 * - Set GITHUB_API_TOKEN (or GITHUB_TOKEN) in your shell or splash/.env.
 * - Anonymous works at 60 req/hr; one full sync uses ~60–80 calls.
 */

import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchRolledUp, type FetchedEntry } from '../src/loaders/rollupFetch.ts';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const SPLASH_DIR = resolve(SCRIPT_DIR, '..');
const PARENT_DIR = resolve(SPLASH_DIR, '..');
const GITMODULES = resolve(PARENT_DIR, '.gitmodules');
const ROLLUP_ROOT = resolve(SPLASH_DIR, 'src', 'rollup');
const CHANGELOG_OUT = resolve(ROLLUP_ROOT, 'changelog');
const CONTEXT_V_OUT = resolve(ROLLUP_ROOT, 'context-v');

async function loadDotEnv(): Promise<void> {
  try {
    const envText = await readFile(resolve(SPLASH_DIR, '.env'), 'utf8');
    for (const line of envText.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!m) continue;
      const [, k, vRaw] = m;
      const v = vRaw.replace(/^["']|["']$/g, '');
      if (process.env[k] === undefined && v !== '') {
        process.env[k] = v;
      }
    }
  } catch {
    // No .env — fall back to existing env or anonymous mode.
  }
}

async function main(): Promise<void> {
  await loadDotEnv();

  console.log(`[rollup-sync] root: ${ROLLUP_ROOT}`);
  console.log(`[rollup-sync] auth: ${authState()}`);

  await rm(ROLLUP_ROOT, { recursive: true, force: true });
  await mkdir(CHANGELOG_OUT, { recursive: true });
  await mkdir(CONTEXT_V_OUT, { recursive: true });

  // ─── changelog ────────────────────────────────────────────────────────────
  console.log('[rollup-sync] fetching changelog…');
  const changelog = await fetchRolledUp({
    collectionName: 'changelog',
    remotePath: 'changelog',
    remoteFallbackPaths: ['context-v/changelogs'],
    gitmodulesPath: GITMODULES,
  });
  reportFetch('changelog', changelog);

  let changelogWritten = 0;
  for (const entry of changelog.entries) {
    const out = resolve(CHANGELOG_OUT, entry.from, entry.fromPath);
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, materialize(entry), 'utf8');
    changelogWritten++;
  }
  console.log(`[rollup-sync] changelog: wrote ${changelogWritten} files`);

  // ─── context-v ────────────────────────────────────────────────────────────
  console.log('[rollup-sync] fetching context-v…');
  const contextV = await fetchRolledUp({
    collectionName: 'context-v',
    remotePath: 'context-v',
    gitmodulesPath: GITMODULES,
    filter: (relPath) => !relPath.startsWith('changelogs/'),
  });
  reportFetch('context-v', contextV);

  let contextVWritten = 0;
  for (const entry of contextV.entries) {
    const out = resolve(CONTEXT_V_OUT, entry.from, entry.fromPath);
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, materialize(entry), 'utf8');
    contextVWritten++;
  }
  console.log(`[rollup-sync] context-v: wrote ${contextVWritten} files`);

  await writeFile(
    resolve(ROLLUP_ROOT, 'README.md'),
    rollupReadme({ changelog: changelogWritten, contextV: contextVWritten }),
    'utf8',
  );

  console.log(
    `[rollup-sync] done — ${changelogWritten} changelog + ${contextVWritten} context-v files written. Commit src/rollup/ to publish.`,
  );
}

function authState(): string {
  if (process.env.GITHUB_TOKEN) return 'GITHUB_TOKEN';
  if (process.env.GITHUB_API_TOKEN) return 'GITHUB_API_TOKEN';
  return 'anonymous (60 req/hr)';
}

function reportFetch(label: string, result: { perSubmodule: Array<{ submodule: { slug: string; ownerRepo: string }; entries: unknown[]; error?: string }> }): void {
  for (const r of result.perSubmodule) {
    if (r.error) {
      console.warn(`[rollup-sync]   ${label}/${r.submodule.slug}: ${r.error}`);
    } else if (r.entries.length > 0) {
      console.log(`[rollup-sync]   ${label}/${r.submodule.slug}: ${r.entries.length} from ${r.submodule.ownerRepo}`);
    }
  }
}

function materialize(entry: FetchedEntry): string {
  const fmObject = {
    ...entry.data,
    from: entry.from,
    from_path: entry.fromPath,
    ...(entry.legacy ? { legacy: true } : {}),
  };

  const fmBlock = serializeFrontmatter(fmObject);
  const marker = `<!-- Rolled up from ${entry.from}/${entry.sourcePath}. Edit at the source, not here. Re-run \`pnpm rollup:sync\` to refresh. -->\n`;
  return `---\n${fmBlock}---\n${marker}\n${entry.body}`;
}

function serializeFrontmatter(obj: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    lines.push(...serializeKeyValue(key, value));
  }
  return lines.join('\n') + (lines.length > 0 ? '\n' : '');
}

function serializeKeyValue(key: string, value: unknown): string[] {
  if (Array.isArray(value)) {
    if (value.length === 0) return [`${key}: []`];
    const lines = [`${key}:`];
    for (const item of value) {
      lines.push(`  - ${formatScalar(item)}`);
    }
    return lines;
  }
  if (value === null) return [`${key}: null`];
  if (typeof value === 'object') {
    return [`${key}: ${JSON.stringify(value)}`];
  }
  return [`${key}: ${formatScalar(value)}`];
}

function formatScalar(v: unknown): string {
  if (typeof v === 'string') {
    if (
      v.length === 0 ||
      /^[-?:&*!,\[\]{}#|>%@`]/.test(v) ||
      /^(true|false|yes|no|null|~)$/i.test(v) ||
      /^-?\d+(\.\d+)?$/.test(v) ||
      /^\s|\s$/.test(v) ||
      v.includes(': ') ||
      v.includes('\n')
    ) {
      return `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
    }
    return v;
  }
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}

function rollupReadme(counts: { changelog: number; contextV: number }): string {
  const now = new Date().toISOString().slice(0, 10);
  return `# Rolled-up content (synced)

This directory contains markdown files **synced from each site submodule's
\`changelog/\` and \`context-v/\`** via the GitHub Content API. Do not edit
files here directly — edits will be wiped on the next sync.

To refresh:

\`\`\`bash
pnpm rollup:sync
git add src/rollup
git commit -m "sync(rollup): refresh from <reason>"
\`\`\`

Last sync: ${now} — ${counts.changelog} changelog files, ${counts.contextV} context-v files.
`;
}

main().catch((err) => {
  console.error('[rollup-sync] failed:', err);
  process.exit(1);
});
