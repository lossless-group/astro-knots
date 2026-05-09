/**
 * wikilink-rules.ts — CANONICAL PATTERN (copy + adapt per site)
 *
 * Live source for this canonical version: `packages/lfm-astro/scripts/wikilink-rules.ts`
 * Reference implementation: `sites/mpstaton-site/scripts/wikilink-rules.ts`
 *
 * **This is a copy-and-adapt pattern, not a runtime dependency.** Each
 * Astro Knots site that uses Obsidian wikilinks should copy this file
 * (plus its sibling `audit-wikilinks.ts`) into its own `scripts/` dir and
 * edit the rule arrays to match THAT site's destinations and authoring
 * conventions. The rules below reflect mpstaton-site's mappings; they are
 * not the right rules for cilantro-site, hypernova-site, etc.
 *
 * The rule shape (`PrefixRule`, `ExactRule`, `DeferredRule`) IS canonical —
 * Phase 2 of `[[Wikilink-Resolution-System]]` (the eventual
 * `src/config/wikilinks.ts` consumed by `remarkLosslessWikilinks` at
 * render time) uses the same interfaces.
 *
 * Resolution rules for the wikilink audit script (and, eventually, the
 * site's `src/config/wikilinks.ts` for the `remarkLosslessWikilinks`
 * resolver — same shape, single source of truth).
 *
 * Two rule types:
 *
 *   - `PREFIX_RULES`: when a wikilink path starts with `prefix`, build the
 *     URL by stripping the prefix, slugifying the tail (lowercase, spaces
 *     to hyphens, slashes preserved), and substituting into `template`.
 *     First match wins — list more specific prefixes BEFORE less specific.
 *
 *   - `EXACT_RULES`: when a wikilink path matches `path` exactly (case-
 *     insensitive), use `url` verbatim. For one-off mappings that don't
 *     fit a prefix pattern.
 *
 * Path comparison is case-insensitive throughout (per the resolved decision
 * in `[[Wikilink-Resolution-System]]`). Both `prefix` and `path` should be
 * authored in lowercase here.
 */

export interface PrefixRule {
  prefix: string;     // lowercase, with trailing `/`
  template: string;   // `{slug}` substituted with the path tail
  destinationLabel?: string;
  /** True for same-site routes (path-only templates like `/essays/{slug}`).
   *  Drives the `wikilink--local` class downstream and skips
   *  `target="_blank"` on the rendered anchor. */
  isLocal?: boolean;
}

export interface ExactRule {
  path: string;       // lowercase, full path
  url: string;
  destinationLabel?: string;
}

/** A prefix whose paths are *known* to have no current public destination —
 *  but we don't want to keep "rediscovering" them on every audit run.
 *  Entries matching get `status: deferred` and surface separately in the
 *  summary, so we know what's intentionally parked vs. what's untouched. */
export interface DeferredRule {
  prefix: string;
  reason: string;
}

/** Slugify the path tail: spaces → hyphens, slashes preserved.
 *  (The path is already lowercased by the audit script.) */
export function slugifyTail(tail: string): string {
  return tail
    .split('/')
    .map((seg) => seg.trim().replace(/\s+/g, '-'))
    .join('/');
}

/**
 * Tooling: the largest prefix in the audit (77 unique paths). Maps to
 * `lossless.group/toolkit/`. Note the prefix is `tooling/` but the URL
 * path segment is `toolkit/` — confirmed by:
 *   `Tooling/6sense` → https://www.lossless.group/toolkit/6sense
 *   `Tooling/AI Toolkit/Agentic AI/Agentic Workspaces/Crew AI`
 *     → https://www.lossless.group/toolkit/ai-toolkit/agentic-ai/agentic-workspaces/crew-ai
 */
export const PREFIX_RULES: PrefixRule[] = [
  {
    prefix: 'tooling/',
    template: 'https://www.lossless.group/toolkit/{slug}',
    destinationLabel: 'Lossless Toolkit',
  },
  // Both `vocabulary/` and `concepts/` route to the same destination
  // (`/more-about/`). The two prefixes are authoring-convention twins:
  // `vocabulary/` is term-shaped (single nouns), `concepts/` is article-
  // shaped (longer phrases) — but they live in one editorial bucket on
  // lossless.group.
  //   `[[vocabulary/Agentic-Employees]]` → /more-about/agentic-employees
  //   `[[concepts/Naming Conventions]]` → /more-about/naming-conventions
  {
    prefix: 'vocabulary/',
    template: 'https://www.lossless.group/more-about/{slug}',
    destinationLabel: 'Lossless More-About',
  },
  {
    prefix: 'concepts/',
    template: 'https://www.lossless.group/more-about/{slug}',
    destinationLabel: 'Lossless More-About',
  },
  // Projects map to a `gallery/` segment under projects/ on lossless.group.
  //   `[[projects/Astro-Knots]]` → /projects/gallery/astro-knots
  {
    prefix: 'projects/',
    template: 'https://www.lossless.group/projects/gallery/{slug}',
    destinationLabel: 'Lossless Project Gallery',
  },
  // Essays resolve LOCALLY — mpstaton-site imports the same source-of-truth
  // essay repository, so a wikilink like `[[essays/Back to the Future]]`
  // points to the local /essays/ route, not to lossless.group. Phase 2 will
  // tighten this further by validating the slugified tail against the local
  // `essays` content collection (broken locals fall through to plain text
  // per the unresolved-rendering principle).
  {
    prefix: 'essays/',
    template: '/essays/{slug}',
    destinationLabel: 'mpstaton-site (local)',
    isLocal: true,
  },
  // Sources: book/media/people index on lossless.group.
  //   `[[sources/books/Originals]]` → /sources/books/originals
  {
    prefix: 'sources/',
    template: 'https://www.lossless.group/sources/{slug}',
    destinationLabel: 'Lossless Sources',
  },
  // Lost-in-public is the lossless authoring archive (issue-resolutions,
  // experiments, working notes), surfaced under `learn-with/` on the public
  // site. Editorial framing ("lost-in-public" → "learn-with") shifts the
  // tone from Twain's "writing in public" to "this is what we figured out."
  //   `[[lost-in-public/issue-resolution]]` → /learn-with/issue-resolution
  {
    prefix: 'lost-in-public/',
    template: 'https://www.lossless.group/learn-with/{slug}',
    destinationLabel: 'Lossless Learn-With',
  },
  // … additional prefix rules added as the audit gets resolved.
];

export const EXACT_RULES: ExactRule[] = [
  // … additional exact-path overrides added as needed.
];

/**
 * Prefixes we've deliberately decided NOT to resolve right now. Listing them
 * here keeps them out of the "untouched" backlog: each audit run shows them
 * as `deferred` with the reason, so future review knows they were considered
 * and parked, not skipped.
 */
export const DEFERRED_PREFIXES: DeferredRule[] = [
  {
    prefix: 'organizations/',
    reason:
      'No current public destination. Organization profiles aren\'t published on lossless.group yet; revisit when org pages launch (or when we decide which sibling Astro Knots site hosts them).',
  },
  {
    prefix: 'vertical-toolkits/',
    reason:
      'No current public destination. Vertical toolkit pages don\'t exist yet; revisit when they\'re published.',
  },
];

/** True if the lowercased path falls under a deferred prefix. */
export function isDeferred(lowercasedPath: string): { reason: string } | null {
  for (const d of DEFERRED_PREFIXES) {
    if (lowercasedPath.startsWith(d.prefix)) return { reason: d.reason };
  }
  return null;
}

/**
 * Resolve a single wikilink path against the rule set. Returns the URL
 * string if a rule matches, or `null` if no rule applies (the path stays
 * `path_resolved: false` in the audit).
 */
export function resolvePath(lowercasedPath: string): { url: string; rule: PrefixRule | ExactRule } | null {
  // Exact rules first — they always trump prefix rules.
  for (const rule of EXACT_RULES) {
    if (rule.path === lowercasedPath) {
      return { url: rule.url, rule };
    }
  }

  // Then prefix rules in declared order.
  for (const rule of PREFIX_RULES) {
    if (lowercasedPath.startsWith(rule.prefix)) {
      const tail = lowercasedPath.slice(rule.prefix.length);
      const slug = slugifyTail(tail);
      return { url: rule.template.replace('{slug}', slug), rule };
    }
  }

  return null;
}
