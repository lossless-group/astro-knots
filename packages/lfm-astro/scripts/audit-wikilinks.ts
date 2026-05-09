/**
 * audit-wikilinks.ts — CANONICAL PATTERN (copy + adapt per site)
 *
 * Live source for this canonical version: `packages/lfm-astro/scripts/audit-wikilinks.ts`
 * Reference implementation: `sites/mpstaton-site/scripts/audit-wikilinks.ts`
 *
 * **This is a copy-and-adapt pattern, not a runtime dependency.** Each
 * site copies this file (plus `wikilink-rules.ts`) into its own
 * `scripts/` dir, then runs `bun scripts/audit-wikilinks.ts` (or wires it
 * into `package.json` as an npm script). The output is a worklist
 * markdown file at `<repo-root>/context-v/plans/Wikilink-Path-Audit__<site>.md`.
 *
 * Two paths in the constants block below assume the standard Astro Knots
 * site layout (`src/content/` for markdown, parent `context-v/plans/` for
 * audit output). Sites with non-standard layouts override
 * `CONTENT_DIR` / `OUTPUT_PATH` in their copy.
 *
 * audit-wikilinks.ts
 *
 * Walks every markdown file under src/content/, extracts every Obsidian-style
 * wikilink (`[[Page]]`, `[[Page|Display]]`, `[[Page#Section|Display]]`,
 * `[[folder/Page#Section|Display]]`), groups them by top-level path prefix,
 * and writes a working audit doc to:
 *
 *   astro-knots/context-v/plans/Wikilink-Path-Audit__mpstaton-site.md
 *
 * The audit is the input to the wikilink resolution work — fill in the
 * `resolved_url` field per entry, flip `path_resolved: true`, and the
 * collected mappings become the `EXTERNAL_DESTINATIONS` config for the site.
 *
 * Usage:
 *   bun scripts/audit-wikilinks.ts
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { resolvePath, isDeferred, PREFIX_RULES, EXACT_RULES, DEFERRED_PREFIXES } from './wikilink-rules';

// --- Configuration ---------------------------------------------------------

const SITE_ROOT = path.resolve(import.meta.dirname, '..');
const CONTENT_DIR = path.join(SITE_ROOT, 'src', 'content');
const OUTPUT_PATH = path.resolve(
  SITE_ROOT,
  '..',
  '..',
  'context-v',
  'plans',
  'Wikilink-Path-Audit__mpstaton-site.md'
);

// Same regex shape we'll use in remarkLosslessWikilinks (see plan §"Parsing").
// Group 1: path. Group 2: optional #anchor. Group 3: optional |display.
const WIKILINK_RE = /\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;

// --- Types -----------------------------------------------------------------

interface ParsedLink {
  raw: string;
  path: string;
  anchor: string | null;
  display: string | null;
  file: string; // path relative to CONTENT_DIR
}

interface AggregatedEntry {
  /** Lowercased path — the canonical key. Resolution will be case-insensitive
   *  per the resolved decision in the Wikilink Resolution plan. */
  path: string;
  /** Every distinct casing seen in the source content. If size > 1, the
   *  authoring is inconsistent — worth flagging in notes when triaging. */
  pathCasings: Set<string>;
  displays: Set<string>;
  anchors: Set<string>;
  fileCounts: Map<string, number>;
  totalOccurrences: number;
}

// --- File walk -------------------------------------------------------------

async function walk(dir: string, acc: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip hidden dirs and node_modules-ish stuff just in case.
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      await walk(full, acc);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      acc.push(full);
    }
  }
  return acc;
}

// --- Extraction ------------------------------------------------------------

async function extractFromFile(absPath: string): Promise<ParsedLink[]> {
  const content = await fs.readFile(absPath, 'utf8');
  const rel = path.relative(CONTENT_DIR, absPath);
  const links: ParsedLink[] = [];

  for (const match of content.matchAll(WIKILINK_RE)) {
    const [raw, rawPath, anchor, display] = match;
    links.push({
      raw,
      path: rawPath.trim(),
      anchor: anchor?.trim() ?? null,
      display: display?.trim() ?? null,
      file: rel,
    });
  }

  return links;
}

// --- Aggregation -----------------------------------------------------------

/**
 * Classify a wikilink into one of three buckets:
 *   - 'bare': no slash at all, e.g. `[[Polyrepo]]` (legacy / vault-root stub).
 *   - 'absolute': starts with `/`, e.g. `[[/Users/.../foo.md]]` (Obsidian
 *     artifact from a non-Obsidian move of the vault file).
 *   - prefix string (lowercased, with trailing `/`): e.g. `vocabulary/`.
 *
 * The bucket determines which top-level section the entry appears under in
 * the rendered audit doc.
 */
function classify(linkPath: string): { bucket: string; isBare: boolean; isAbsolute: boolean } {
  if (linkPath.startsWith('/')) {
    return { bucket: '(absolute filesystem paths)', isBare: false, isAbsolute: true };
  }
  const slash = linkPath.indexOf('/');
  if (slash === -1) {
    return { bucket: '(bare — no prefix)', isBare: true, isAbsolute: false };
  }
  // Lowercase the prefix for case-insensitive grouping per the resolved
  // decision: `Vocabulary/` and `vocabulary/` collapse into one bucket.
  return { bucket: linkPath.slice(0, slash + 1).toLowerCase(), isBare: false, isAbsolute: false };
}

function aggregate(links: ParsedLink[]): Map<string, Map<string, AggregatedEntry>> {
  // bucket → lowercased-path → entry
  const byBucket = new Map<string, Map<string, AggregatedEntry>>();

  for (const link of links) {
    const { bucket } = classify(link.path);
    // Case-insensitive dedupe: lowercased path is the canonical key.
    const key = link.path.toLowerCase();

    let group = byBucket.get(bucket);
    if (!group) {
      group = new Map();
      byBucket.set(bucket, group);
    }

    let entry = group.get(key);
    if (!entry) {
      entry = {
        path: key,
        pathCasings: new Set(),
        displays: new Set(),
        anchors: new Set(),
        fileCounts: new Map(),
        totalOccurrences: 0,
      };
      group.set(key, entry);
    }

    entry.pathCasings.add(link.path);
    if (link.display) entry.displays.add(link.display);
    if (link.anchor) entry.anchors.add(link.anchor);
    entry.fileCounts.set(link.file, (entry.fileCounts.get(link.file) ?? 0) + 1);
    entry.totalOccurrences += 1;
  }

  return byBucket;
}

// --- YAML rendering --------------------------------------------------------

function quoteIfNeeded(s: string): string {
  // Conservative: quote anything containing characters that would confuse a
  // bare YAML scalar. Keep simple strings unquoted for readability.
  if (/^[A-Za-z0-9_\-./# ]+$/.test(s) && !/^\s|\s$/.test(s)) {
    return s.includes(' ') || s.includes('#') ? `"${s.replace(/"/g, '\\"')}"` : s;
  }
  return `"${s.replace(/"/g, '\\"')}"`;
}

function renderEntry(entry: AggregatedEntry): string {
  const lines: string[] = [];
  lines.push(`- path: ${quoteIfNeeded(entry.path)}`);

  // Surface casing variants only when the source content was inconsistent.
  // If every occurrence used the same casing, no need to draw attention.
  const casings = [...entry.pathCasings].sort();
  if (casings.length > 1) {
    lines.push(`  casing_variants: [${casings.map(quoteIfNeeded).join(', ')}]  # inconsistent — audit-only flag, resolution is case-insensitive`);
  }

  const displays = [...entry.displays].sort();
  if (displays.length > 0) {
    lines.push(`  display_examples: [${displays.map(quoteIfNeeded).join(', ')}]`);
  } else {
    lines.push(`  display_examples: []`);
  }

  if (entry.anchors.size > 0) {
    const anchors = [...entry.anchors].sort();
    lines.push(`  anchors: [${anchors.map(quoteIfNeeded).join(', ')}]`);
  }

  lines.push(`  occurrences: ${entry.totalOccurrences}`);

  if (entry.fileCounts.size > 0) {
    lines.push(`  files:`);
    const sorted = [...entry.fileCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    for (const [file, count] of sorted) {
      lines.push(`    - ${quoteIfNeeded(file)}  # ${count}×`);
    }
  }

  // Apply resolution rules (see scripts/wikilink-rules.ts). Three terminal
  // states: resolved (rule matched), deferred (deliberately parked), or
  // unresolved (no rule, no defer — the worklist proper).
  const resolved = resolvePath(entry.path);
  const deferred = resolved ? null : isDeferred(entry.path);
  if (resolved) {
    const isLocalRule = 'isLocal' in resolved.rule && resolved.rule.isLocal === true;
    lines.push(`  status: resolved`);
    lines.push(`  path_resolved: true`);
    lines.push(`  resolved_url: ${quoteIfNeeded(resolved.url)}`);
    lines.push(`  is_local: ${isLocalRule}`);
    if (resolved.rule.destinationLabel) {
      lines.push(`  destination: ${quoteIfNeeded(resolved.rule.destinationLabel)}`);
    }
    lines.push(`  notes: ~`);
  } else if (deferred) {
    lines.push(`  status: deferred`);
    lines.push(`  path_resolved: false`);
    lines.push(`  resolved_url: ~`);
    lines.push(`  deferred_reason: ${quoteIfNeeded(deferred.reason)}`);
    lines.push(`  notes: ~`);
  } else {
    lines.push(`  status: unresolved`);
    lines.push(`  path_resolved: false`);
    lines.push(`  resolved_url: ~`);
    lines.push(`  notes: ~`);
  }

  return lines.join('\n');
}

/**
 * Heading + per-bucket explanatory note. Bare and absolute buckets get
 * special-case framing because they're not destined for the
 * `EXTERNAL_DESTINATIONS` config — they're worklist items for the author.
 */
function renderGroup(bucket: string, entries: AggregatedEntry[]): string {
  const lines: string[] = [];
  let heading: string;
  let preamble: string | null = null;

  if (bucket === '(bare — no prefix)') {
    heading = 'Bare wikilinks (no prefix)';
    preamble =
      'These are legacy artifacts from before an Obsidian setting that requires path-prefixed wikilinks was enabled. Many point to "stub files" at the vault root that haven\'t been moved into a folder yet. **The resolver will not attempt to resolve these** — they render as plain text in essays. Three triage options:\n\n' +
      '1. Open the source file in Obsidian and let Obsidian auto-update the wikilink when you move the stub into a proper folder (`Vocabulary/`, `concepts/`, etc.).\n' +
      '2. Run a future `scripts/fix-bare-wikilinks.ts` (not yet built) that takes a content folder + target prefix and rewrites bare wikilinks in source.\n' +
      '3. Accept that the wikilink renders as plain text until the underlying stub is organized.\n\n' +
      'You can leave `path_resolved: false` on every entry in this section — they\'re intentionally non-resolvable. Use `notes:` to flag any specific stub that\'s a priority to organize.';
  } else if (bucket === '(absolute filesystem paths)') {
    heading = 'Absolute filesystem paths (Obsidian artifacts)';
    preamble =
      'Wikilinks containing absolute Unix paths, almost certainly from a non-Obsidian move/rename of a vault file (an IDE rename, a `git mv`, etc.). Obsidian only auto-updates wikilinks when it observes the move itself; these were stranded. **The resolver treats them as unresolved** (renders as plain text). Fix in source by editing the offending file; Obsidian won\'t help here.';
  } else {
    heading = `\`${bucket}\` — ${entries.length} unique path${entries.length === 1 ? '' : 's'}`;
  }

  lines.push(`## ${heading}`);
  lines.push('');
  if (preamble) {
    lines.push(preamble);
    lines.push('');
  }
  lines.push('```yaml');
  for (const entry of entries) {
    lines.push(renderEntry(entry));
    lines.push('');
  }
  // strip the trailing blank
  while (lines[lines.length - 1] === '') lines.pop();
  lines.push('```');
  return lines.join('\n');
}

// --- Output ----------------------------------------------------------------

function renderDoc(byPrefix: Map<string, Map<string, AggregatedEntry>>): string {
  const today = new Date().toISOString().slice(0, 10);

  const allEntries = [...byPrefix.values()].flatMap((m) => [...m.values()]);
  const totalUnique = allEntries.length;
  const totalOccurrences = allEntries.reduce((sum, e) => sum + e.totalOccurrences, 0);

  // Bare and absolute buckets float to the TOP (they're triage-worklist items
  // that don't feed into the EXTERNAL_DESTINATIONS config — surface them
  // first so they don't get lost mid-document). Real prefixes follow
  // alphabetically.
  const sortedPrefixes = [...byPrefix.keys()].sort((a, b) => {
    const rank = (k: string) =>
      k === '(bare — no prefix)' ? 0 : k === '(absolute filesystem paths)' ? 1 : 2;
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });

  // Track resolution progress per bucket so the summary surfaces what's left.
  let totalResolved = 0;
  let totalDeferred = 0;
  const summaryRows = sortedPrefixes.map((p) => {
    const group = byPrefix.get(p)!;
    const unique = group.size;
    const occ = [...group.values()].reduce((s, e) => s + e.totalOccurrences, 0);
    const resolved = [...group.values()].filter((e) => resolvePath(e.path) !== null).length;
    const deferred = [...group.values()].filter((e) => resolvePath(e.path) === null && isDeferred(e.path) !== null).length;
    totalResolved += resolved;
    totalDeferred += deferred;
    const pct = unique === 0 ? '—' : `${Math.round((resolved / unique) * 100)}%`;
    return `| \`${p}\` | ${unique} | ${occ} | ${resolved} | ${deferred} | ${pct} |`;
  });

  const out: string[] = [];
  out.push('---');
  out.push('title: "Wikilink Path Audit — mpstaton-site"');
  out.push(
    'lede: "Every Obsidian-style wikilink in mpstaton-site\'s content, grouped by top-level prefix. Edit each entry to set `path_resolved: true` and fill in `resolved_url`; the collected mappings become the EXTERNAL_DESTINATIONS config for the site\'s wikilink resolver."'
  );
  out.push(`date_generated: ${today}`);
  out.push(`date_modified: ${today}`);
  out.push('status: Generated');
  out.push('category: Audits');
  out.push('tags: [LFM, Wikilinks, Audit, Generated, mpstaton-site]');
  out.push('related:');
  out.push('  - "[[Wikilink-Resolution-System]]"');
  out.push(`total_unique_paths: ${totalUnique}`);
  out.push(`total_occurrences: ${totalOccurrences}`);
  out.push('generated_by: scripts/audit-wikilinks.ts');
  out.push('---');
  out.push('');
  out.push('# Wikilink Path Audit — mpstaton-site');
  out.push('');
  out.push(
    'Generated automatically by `sites/mpstaton-site/scripts/audit-wikilinks.ts`. Re-run to refresh: `pnpm --filter mpstaton-site audit-wikilinks` (or `bun scripts/audit-wikilinks.ts` from the site root).'
  );
  out.push('');
  out.push(
    'This file is the worklist for the wikilink resolution effort described in `[[Wikilink-Resolution-System]]`. Each unique wikilink path appears exactly once (case-insensitive — variant casings collapse into one entry), even if it shows up in multiple essays.'
  );
  out.push('');
  out.push('**For prefix-grouped entries** (the bulk of this doc):');
  out.push('');
  out.push('1. Decide whether the path resolves locally (a content collection on this site) or externally (lossless.group, sibling Astro Knots site, etc.).');
  out.push('2. Set `resolved_url:` to the destination URL or local route.');
  out.push('3. Flip `path_resolved: true`.');
  out.push('4. Use the `notes:` field to capture decision rationale, ambiguities, or follow-ups.');
  out.push('');
  out.push('Once enough entries within a prefix group resolve consistently, the prefix-level pattern is obvious — that\'s when the site\'s `EXTERNAL_DESTINATIONS` config gets written from this audit.');
  out.push('');
  out.push('**For bare wikilinks and absolute-path wikilinks** (the two sections at the top): these are not destined for the config — they\'re triage-worklist items the author addresses in source content (or accepts as unresolvable). Per the operating principle codified in `[[Wikilink-Resolution-System]]`, **unresolved wikilinks render as plain text** in essays. Supporting 40% of the intended wikilinks is better than supporting none.');
  out.push('');
  out.push('## Summary');
  out.push('');
  const overallPct = totalUnique === 0 ? '—' : `${Math.round((totalResolved / totalUnique) * 100)}%`;
  const remaining = totalUnique - totalResolved - totalDeferred;
  out.push(`- **Unique wikilink paths:** ${totalUnique}`);
  out.push(`- **Total occurrences across content:** ${totalOccurrences}`);
  out.push(`- **Distinct top-level prefixes:** ${sortedPrefixes.length}`);
  out.push(`- **Resolved (rules in \`scripts/wikilink-rules.ts\`):** ${totalResolved} / ${totalUnique} (${overallPct})`);
  out.push(`- **Deferred (deliberately parked):** ${totalDeferred}`);
  out.push(`- **Remaining to triage:** ${remaining}`);
  out.push(`- **Active rules:** ${PREFIX_RULES.length} prefix rule${PREFIX_RULES.length === 1 ? '' : 's'}, ${EXACT_RULES.length} exact rule${EXACT_RULES.length === 1 ? '' : 's'}, ${DEFERRED_PREFIXES.length} deferred prefix${DEFERRED_PREFIXES.length === 1 ? '' : 'es'}`);
  out.push('');
  out.push('| Prefix | Unique | Occurrences | Resolved | Deferred | % |');
  out.push('|---|---|---|---|---|---|');
  for (const row of summaryRows) out.push(row);
  out.push('');

  // Render each group.
  for (const prefix of sortedPrefixes) {
    const group = byPrefix.get(prefix)!;
    const entries = [...group.values()].sort((a, b) => a.path.localeCompare(b.path));
    out.push(renderGroup(prefix, entries));
    out.push('');
  }

  out.push('---');
  out.push('');
  out.push(`*Last regenerated: ${today}. To refresh, re-run \`bun scripts/audit-wikilinks.ts\` from the site root. Edits to \`resolved_url\` / \`path_resolved\` / \`notes\` are preserved as long as the script merges with the existing file (TODO: not yet implemented; first regeneration overwrites).*`);

  return out.join('\n') + '\n';
}

// --- Main ------------------------------------------------------------------

async function main() {
  const start = Date.now();
  console.log(`Walking ${path.relative(SITE_ROOT, CONTENT_DIR)}/ …`);

  const files = await walk(CONTENT_DIR);
  console.log(`  found ${files.length} markdown files`);

  let allLinks: ParsedLink[] = [];
  for (const file of files) {
    const links = await extractFromFile(file);
    allLinks = allLinks.concat(links);
  }
  console.log(`  extracted ${allLinks.length} wikilink occurrences`);

  const byPrefix = aggregate(allLinks);
  const totalUnique = [...byPrefix.values()].reduce((sum, m) => sum + m.size, 0);
  console.log(`  ${totalUnique} unique paths across ${byPrefix.size} prefixes`);

  const doc = renderDoc(byPrefix);

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, doc, 'utf8');

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`✓ Wrote ${path.relative(SITE_ROOT, OUTPUT_PATH)} in ${elapsed}s`);
}

main().catch((err) => {
  console.error('audit-wikilinks failed:', err);
  process.exit(1);
});
