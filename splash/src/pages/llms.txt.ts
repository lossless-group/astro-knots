/**
 * /llms.txt — corpus link index for LLM consumers.
 *
 * Spec: https://llmstxt.org/
 *
 * The human-editable prose template lives at `src/llms/llms.md` (with token
 * documentation in `src/llms/README.md`). This file is the dumb assembler:
 * load template, compute dynamic values, substitute tokens. Edit prose in
 * the markdown — not here.
 *
 * Conformance note: the splash deploys under a path
 * (https://lossless-group.github.io/astro-knots/), so the file lives at
 * /astro-knots/llms.txt rather than the host root. Tools pointed explicitly
 * at the URL still work; convention-based discovery starts working once
 * `astro.config.mjs` flips `base` to '/' on a custom domain.
 */

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_NAME } from '@lib/seo';
import template from '../llms/llms.md?raw';

type AnyData = Record<string, any>;

function isPublished(data: AnyData): boolean {
  return data.publish !== false && data.private !== true;
}

function entryDateMs(data: AnyData): number {
  const d = data.date_modified ?? data.date_updated ?? data.date_created ?? data.date;
  if (!d) return 0;
  const t = d instanceof Date ? d.getTime() : new Date(d).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export const GET: APIRoute = async () => {
  const site = import.meta.env.SITE ?? 'https://lossless-group.github.io';
  const base = import.meta.env.BASE_URL ?? '/';
  const root = new URL(base, site).toString().replace(/\/$/, '');

  // ── Site highlights ──────────────────────────────────────────────────
  let sites: Awaited<ReturnType<typeof getCollection<'site-highlights'>>> = [];
  try { sites = await getCollection('site-highlights'); } catch { sites = []; }

  const sortedSites = [...sites].sort((a, b) => {
    const oa = (a.data as AnyData).order ?? 999;
    const ob = (b.data as AnyData).order ?? 999;
    if (oa !== ob) return oa - ob;
    const ta = ((a.data as AnyData).title ?? a.id).toLowerCase();
    const tb = ((b.data as AnyData).title ?? b.id).toLowerCase();
    return ta.localeCompare(tb);
  });

  const siteLines: string[] = [];
  for (const entry of sortedSites) {
    const data = entry.data as AnyData;
    const title = data.title ?? entry.id;
    // Prefer schema-declared `live_url`, fall back to `production_url` (the
    // field actually used in current site-highlights frontmatter), then to
    // the splash's own listing.
    const target =
      (typeof data.live_url === 'string' && data.live_url) ||
      (typeof data.production_url === 'string' && data.production_url) ||
      `${root}/#sites`;
    const lede = data.lede ?? data.description ?? data.summary;
    siteLines.push(lede ? `- [${title}](${target}): ${lede}` : `- [${title}](${target})`);
  }

  // ── Changelog (rolled-up) ────────────────────────────────────────────
  let changelogAll: Awaited<ReturnType<typeof getCollection<'changelog'>>> = [];
  try { changelogAll = await getCollection('changelog'); } catch { changelogAll = []; }
  const changelog = changelogAll.filter((e) => isPublished(e.data as AnyData));

  // ── Context-V (rolled-up) ────────────────────────────────────────────
  let contextVAll: Awaited<ReturnType<typeof getCollection<'context-v'>>> = [];
  try { contextVAll = await getCollection('context-v'); } catch { contextVAll = []; }
  const contextV = contextVAll.filter((e) => isPublished(e.data as AnyData));

  // Group helper — by `from`, alphabetical groups, entries sorted by
  // date_modified desc, with title alpha as the tiebreaker.
  type Entry = (typeof changelog)[number] | (typeof contextV)[number];
  function groupByFrom(entries: Entry[]): { from: string; items: Entry[] }[] {
    const map = new Map<string, Entry[]>();
    for (const e of entries) {
      const from = ((e.data as AnyData).from as string | undefined) ?? 'astro-knots';
      if (!map.has(from)) map.set(from, []);
      map.get(from)!.push(e);
    }
    const groups = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    for (const [, items] of groups) {
      items.sort((a, b) => {
        const da = entryDateMs(a.data as AnyData);
        const db = entryDateMs(b.data as AnyData);
        if (da !== db) return db - da;
        const ta = ((a.data as AnyData).title ?? a.id).toLowerCase();
        const tb = ((b.data as AnyData).title ?? b.id).toLowerCase();
        return ta.localeCompare(tb);
      });
    }
    return groups.map(([from, items]) => ({ from, items }));
  }

  function renderGroupedLines(
    grouped: { from: string; items: Entry[] }[],
    pathPrefix: 'changelog' | 'context-v',
  ): string[] {
    const lines: string[] = [];
    for (const { from, items } of grouped) {
      lines.push(`### ${from}`);
      lines.push('');
      for (const entry of items) {
        const data = entry.data as AnyData;
        const title = data.title ?? entry.id.split('/').pop() ?? entry.id;
        const url = `${root}/${pathPrefix}/${entry.id}/`;
        const lede = data.lede ?? data.summary ?? data.description ?? data.purpose;
        lines.push(lede ? `- [${title}](${url}): ${lede}` : `- [${title}](${url})`);
      }
      lines.push('');
    }
    return lines;
  }

  const changelogGrouped = groupByFrom(changelog);
  const contextVGrouped = groupByFrom(contextV);

  const changelogLines = renderGroupedLines(changelogGrouped, 'changelog');
  const contextVLines = renderGroupedLines(contextVGrouped, 'context-v');

  // Distinct `from` values across the two collections.
  const repoSet = new Set<string>();
  for (const e of changelog) repoSet.add(((e.data as AnyData).from as string | undefined) ?? 'astro-knots');
  for (const e of contextV) repoSet.add(((e.data as AnyData).from as string | undefined) ?? 'astro-knots');

  const tokens: Record<string, string> = {
    SITE_NAME,
    SITE_COUNT: String(sortedSites.length),
    CHANGELOG_COUNT: String(changelog.length),
    CONTEXTV_COUNT: String(contextV.length),
    REPO_COUNT: String(repoSet.size),
    LLMS_FULL_URL: `${root}/llms-full.txt`,
    LLMS_INDEX_URL: `${root}/llms.txt`,
    SITES_INDEX: siteLines.join('\n').trimEnd(),
    CHANGELOG_INDEX: changelogLines.join('\n').trimEnd(),
    CONTEXTV_INDEX: contextVLines.join('\n').trimEnd(),
  };

  const body = template.replace(/\{\{(\w+)\}\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(tokens, name) ? tokens[name] : match,
  );

  return new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
