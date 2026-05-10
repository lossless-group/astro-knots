/**
 * /llms-full.txt — concatenated raw markdown of every published changelog
 * and context-v entry rolled up by the astro-knots splash.
 *
 * Spec: https://llmstxt.org/
 *
 * The human-editable prose template lives at `src/llms/llms-full.md` (with
 * token documentation in `src/llms/README.md`). This file is the dumb
 * assembler: load template, gather corpus bodies with metadata headers,
 * substitute tokens. Edit prose in the markdown — not here.
 */

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_NAME } from '@lib/seo';
import template from '../llms/llms-full.md?raw';

type AnyData = Record<string, any>;

function isPublished(data: AnyData): boolean {
  return data.publish !== false && data.private !== true;
}

export const GET: APIRoute = async () => {
  const site = import.meta.env.SITE ?? 'https://lossless-group.github.io';
  const base = import.meta.env.BASE_URL ?? '/';
  const root = new URL(base, site).toString().replace(/\/$/, '');

  let changelogAll: Awaited<ReturnType<typeof getCollection<'changelog'>>> = [];
  try { changelogAll = await getCollection('changelog'); } catch { changelogAll = []; }
  const changelog = changelogAll.filter((e) => isPublished(e.data as AnyData));

  let contextVAll: Awaited<ReturnType<typeof getCollection<'context-v'>>> = [];
  try { contextVAll = await getCollection('context-v'); } catch { contextVAll = []; }
  const contextV = contextVAll.filter((e) => isPublished(e.data as AnyData));

  // Combine into a single ordered stream tagged by kind. Group by `from`
  // alphabetically, then by kind (changelog before context-v), then by
  // title alpha — keeps the file deterministic across builds.
  type Kind = 'changelog' | 'context-v';
  type Tagged = { kind: Kind; entry: (typeof changelog)[number] | (typeof contextV)[number] };

  const stream: Tagged[] = [
    ...changelog.map((entry) => ({ kind: 'changelog' as Kind, entry })),
    ...contextV.map((entry) => ({ kind: 'context-v' as Kind, entry })),
  ];

  stream.sort((a, b) => {
    const fa = (((a.entry.data as AnyData).from as string | undefined) ?? 'astro-knots').toLowerCase();
    const fb = (((b.entry.data as AnyData).from as string | undefined) ?? 'astro-knots').toLowerCase();
    if (fa !== fb) return fa.localeCompare(fb);
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
    const ta = ((a.entry.data as AnyData).title ?? a.entry.id).toLowerCase();
    const tb = ((b.entry.data as AnyData).title ?? b.entry.id).toLowerCase();
    return ta.localeCompare(tb);
  });

  const bodyParts: string[] = [];
  for (const { kind, entry } of stream) {
    const data = entry.data as AnyData;
    const title = data.title ?? entry.id.split('/').pop() ?? entry.id;
    const from = (data.from as string | undefined) ?? 'astro-knots';
    const sourcePath = (data.from_path as string | undefined) ?? entry.id;
    const url = `${root}/${kind}/${entry.id}/`;

    bodyParts.push('---');
    bodyParts.push('');
    bodyParts.push(`## ${title}`);
    bodyParts.push('');
    bodyParts.push(`- Kind: \`${kind}\``);
    bodyParts.push(`- From: \`${from}\``);
    bodyParts.push(`- Source path: \`${sourcePath}\``);
    bodyParts.push(`- Canonical URL: ${url}`);
    const dm = data.date_modified ?? data.date_updated ?? data.date_created ?? data.date;
    if (dm) {
      const d = dm instanceof Date ? dm : new Date(dm);
      if (!Number.isNaN(d.getTime())) bodyParts.push(`- Last modified: ${d.toISOString().slice(0, 10)}`);
    }
    bodyParts.push('');
    bodyParts.push(entry.body ?? '');
    bodyParts.push('');
  }

  const repoSet = new Set<string>();
  for (const e of changelog) repoSet.add(((e.data as AnyData).from as string | undefined) ?? 'astro-knots');
  for (const e of contextV) repoSet.add(((e.data as AnyData).from as string | undefined) ?? 'astro-knots');

  const tokens: Record<string, string> = {
    SITE_NAME,
    CHANGELOG_COUNT: String(changelog.length),
    CONTEXTV_COUNT: String(contextV.length),
    REPO_COUNT: String(repoSet.size),
    LLMS_INDEX_URL: `${root}/llms.txt`,
    CORPUS_BODIES: bodyParts.join('\n').trimEnd(),
  };

  const body = template.replace(/\{\{(\w+)\}\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(tokens, name) ? tokens[name] : match,
  );

  return new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
