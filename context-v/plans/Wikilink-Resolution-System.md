---
title: "Wikilink Resolution System for LFM"
lede: "A two-layer wikilink rendering system: LFM provides the abstract MDAST plugin that parses [[Obsidian-style]] backlinks; each Astro Knots site provides a config that resolves those wikilinks to local-or-external URLs and gives them visual treatment that signals the destination."
status: Proposed
date_created: 2026-05-08
date_modified: 2026-05-08
category: Plans
tags: [LFM, Wikilinks, Backlinks, Obsidian, Markdown-Rendering, Configuration, Two-Layer-Architecture]
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7 (1M context)
related:
  - "[[Maintain-Extended-Markdown-Render-Pipeline]]"
  - "[[Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package]]"
at_semantic_version: 0.5.0.0
---

# Wikilink Resolution System for LFM

## Problem

Authors write essays in Obsidian, where wikilinks (`[[Page]]`, `[[Page|Display]]`, `[[folder/Page#Section|Display]]`) are first-class citizens. When those essays land in an Astro Knots site through `parseMarkdown()`, nothing in the LFM pipeline transforms the wikilink syntax — it leaks through as plain prose. Real example from `mpstaton-site/src/content/essays/from-engineering-to-managing-large-codebases.md`:

```markdown
[[Vocabulary/Polyrepo|Polyrepo]]
[[Vocabulary/Microservices|Microservices]]
[[concepts/Naming Conventions|Naming Conventions]]
[[projects/Context-Vigilance/Philosophy/Best-Practices|Best-Practices]]
```

These render literally — square brackets, pipes, and all — instead of as hyperlinks. None of those pages live in `mpstaton-site` content; they all live (or are intended to live) at `lossless.group`.

The system is harder than "find-replace into `<a>` tags" for three reasons:

1. **Some wikilinks resolve locally** (an essay referencing another essay or context-v doc in the same site).
2. **Most wikilinks resolve externally** (right now, to `lossless.group`; eventually to other Astro Knots sites — `cilantro-site`, etc.).
3. **The mapping is per-site.** What's local to `mpstaton-site` is external to `cilantro-site` and vice versa. The LFM package has no way to know this.

## Architectural Principle

LFM's stated philosophy: *"Let content creators create content, flexibly handle the markdown."* The wikilink system follows the same two-layer split that already governs callouts, citations, and link previews:

| Layer | Provides | Knows about |
|---|---|---|
| **LFM** (`@lossless-group/lfm`) | A `remarkLosslessWikilinks` plugin that parses Obsidian wikilink syntax into MDAST nodes and resolves them via a site-supplied config | Wikilink syntax. MDAST shape. Resolution algorithm. |
| **Site** (e.g. `mpstaton-site`) | A `wikilinks.ts` config: known-local slug index + external prefix mappings + visual class hints | Its own content collections. Its own external destinations. Its own brand styling. |

LFM never hardcodes a destination URL. The site never reimplements parsing.

## Wikilink Syntax to Support

All Obsidian wikilink shapes:

| Shape | Path | Display | Anchor |
|---|---|---|---|
| `[[Page]]` | `Page` | `Page` | — |
| `[[Page\|Display]]` | `Page` | `Display` | — |
| `[[folder/Page]]` | `folder/Page` | `folder/Page` (or last segment, see Q below) | — |
| `[[folder/Page\|Display]]` | `folder/Page` | `Display` | — |
| `[[Page#Section]]` | `Page` | `Page` (with `#section` appended visually? TBD) | `#section` |
| `[[Page#Section\|Display]]` | `Page` | `Display` | `#section` |
| `[[folder/Page#Section\|Display]]` | `folder/Page` | `Display` | `#section` |

**Open question (UX):** when a wikilink has a path but no display text — `[[folder/Page]]` — should the rendered text be `folder/Page`, just `Page` (last segment), or the deslugified version? *Recommendation:* last segment, deslugified (`Page` → "Page"; `naming-conventions` → "Naming Conventions"). Matches reader expectations; matches Obsidian's own rendering.

## LFM Layer: `remarkLosslessWikilinks` Plugin

Lives in `lfm/src/plugins/remark-lossless-wikilinks.ts`. Wired into `remarkLfm` after `remarkGfm` and before `remarkLosslessCallouts`.

**Naming rationale.** Per the convention we adopted when discussing the existing `remarkCallouts` / `remarkCitations` / `remarkLinkPreview` plugins: any LFM plugin that deviates from or extends standard remark behavior is namespaced `remarkLossless*`. Three reasons:

1. **Avoids npm collision.** Community packages already exist at `remark-callouts`, `remark-wiki-link`, etc. The `@lossless-group/lfm` package namespace half-protects us at the import path, but the bare export name appears in code (`import { remarkLosslessWikilinks }`) and a contributor scanning a file should see "this is the LFM flavor" at a glance.
2. **Signals divergence to collaborators.** LFM wikilinks have site-specific resolution semantics that no community plugin has — making the name distinct flags that this isn't a drop-in replacement for `remark-wiki-link`.
3. **Future-proofs the spec.** When LFM eventually gets reviewed against other extended-markdown flavors (Markdoc, MDX, etc.), the namespaced name keeps the comparisons clean.

Wikilinks land in this convention from the start. The existing plugins (`remarkCallouts`, `remarkCitations`, `remarkLinkPreview`) get renamed in the same release that introduces wikilinks — see Phase 1 below.

### Plugin signature

```ts
export interface WikilinkResolverInput {
  /** The path part of the wikilink, e.g. "Vocabulary/Polyrepo". Never null. */
  path: string;
  /** Section anchor without the leading #, or null. */
  anchor: string | null;
  /** Author-supplied display text, or null (caller should derive a default). */
  display: string | null;
  /** The raw [[...]] string, for debugging / broken-link warnings. */
  raw: string;
}

export interface WikilinkResolution {
  /** Where the link points. */
  url: string;
  /** True if the resolution targets the same site; controls target/rel + class. */
  isLocal: boolean;
  /** Final display text. The plugin uses this verbatim. */
  display: string;
  /** Optional CSS class hints. Composed onto a base `wikilink` class. */
  classes?: string[];
}

export interface WikilinkOptions {
  /**
   * Site-supplied resolver. Returns a resolution, or `null` to mark the
   * wikilink as unresolved (renders as plain display text — no anchor,
   * no styling, no surfaced error to the reader).
   */
  resolver: (input: WikilinkResolverInput) => WikilinkResolution | null;
  /**
   * Optional. If set, broken wikilinks emit warnings via this callback.
   * mpstaton-site's content layer can pipe these to the build log.
   */
  onBroken?: (input: WikilinkResolverInput) => void;
}

export const remarkLosslessWikilinks: Plugin<[WikilinkOptions], Root>;
```

### MDAST shape produced

For resolved wikilinks, the plugin emits a standard `link` MDAST node with `data.hProperties.class` carrying the wikilink classes. Two reasons to use plain `link` instead of a custom directive node:

1. Downstream renderers (AstroMarkdown) already have a `link` branch — no special-case routing needed.
2. Citations, link previews, and other LFM features that operate on `link` nodes (e.g., the OG fetcher's link-preview pipeline) automatically apply.

For unresolved wikilinks, the plugin emits a plain `text` node containing only the display text (or the path's last segment if no display was supplied) — **no `<a>`, no class, no markup hint that anything was ever a wikilink**. The reader sees a normal sentence. The unresolved path is logged to a report we work through over time.

**Rationale (operating principle):** *Supporting 40% of the intended wikilinks is better than supporting none.* Calling attention to broken links via styling would punish readers for our incomplete config; rendering them invisibly lets the prose work today and the resolution work continue asynchronously. Authors find broken links via the audit report, not via reader-visible UI noise.

### Parsing

Hand-rolled regex over text nodes (no `unist-util-visit` dependency, matching the convention in `remark-callouts`). Pattern:

```
\[\[
  ([^\]|#]+)      # group 1: path (no ], |, # — terminates at first delimiter)
  (?:#([^\]|]+))? # group 2: optional anchor
  (?:\|([^\]]+))? # group 3: optional display text
\]\]
```

Walk the tree, find `text` nodes whose value matches, split each text node into `text + link/span + text + link/span + ...` segments, replace in place.

## Site Layer: `src/config/wikilinks.ts`

Per Q5: the config lives in a dedicated `src/config/wikilinks.ts` module, not bolted into `content.config.ts`. Reasons:
- `content.config.ts` is already opinionated about Zod schemas; adding wikilink resolution there muddies the file's purpose.
- A standalone config is reusable across multiple `parseMarkdown()` call sites (essay pages, context-v pages, notes pages, etc.) without circular-import risk.

### Config shape

```ts
// src/config/wikilinks.ts
import type { WikilinkOptions, WikilinkResolution, WikilinkResolverInput } from '@lossless-group/lfm';

interface ExternalDestination {
  /** Path prefix that triggers this destination. Case-sensitive match against
   *  the input path. First match in the array wins. */
  prefix: string;
  /** URL template. `{slug}` is substituted with the path after the prefix,
   *  slugified (lowercase, spaces → hyphens, forward slashes preserved). */
  template: string;
  /** Optional human-readable destination name, used for tooltips and
   *  potentially for the visual badge. */
  destinationLabel?: string;
}

const EXTERNAL_DESTINATIONS: ExternalDestination[] = [
  { prefix: 'Vocabulary/',                 template: 'https://lossless.group/vocabulary/{slug}',                 destinationLabel: 'Lossless Vocabulary' },
  { prefix: 'concepts/',                   template: 'https://lossless.group/concepts/{slug}',                   destinationLabel: 'Lossless' },
  { prefix: 'projects/Context-Vigilance/', template: 'https://lossless.group/projects/context-vigilance/{slug}', destinationLabel: 'Lossless' },
  { prefix: 'projects/',                   template: 'https://lossless.group/projects/{slug}',                   destinationLabel: 'Lossless' },
  // … fall-through prefix order: most specific first.
];

/** Slugs of all locally-resolvable content, derived at build time from
 *  Astro content collections. Compared case-insensitively. */
async function buildLocalSlugIndex(): Promise<Set<string>> {
  // Pseudocode:
  // const essays = await getCollection('essays');
  // const notes = await getCollection('notes');
  // const ctx = await getCollection('context-v');
  // return new Set([...essays, ...notes, ...ctx].map(e => e.id.toLowerCase()));
  // Real implementation: see Phase 2 below.
}

function slugify(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, '-');
}

export async function createWikilinkResolver(): Promise<WikilinkOptions> {
  const localSlugs = await buildLocalSlugIndex();

  const resolver = (input: WikilinkResolverInput): WikilinkResolution | null => {
    const lowerPath = input.path.toLowerCase();
    const anchor = input.anchor ? '#' + slugify(input.anchor) : '';

    // 1. Local match — case-insensitive against the slug index.
    if (localSlugs.has(lowerPath)) {
      // Find the matching collection; map to the right route.
      // (Implementation detail: store a map slug → URL, not just a Set.)
      return {
        url: deriveLocalUrl(lowerPath) + anchor,
        isLocal: true,
        display: input.display ?? lastSegment(input.path),
        classes: ['wikilink--local'],
      };
    }

    // 2. External prefix match — first in declared order wins.
    for (const dest of EXTERNAL_DESTINATIONS) {
      if (input.path.startsWith(dest.prefix)) {
        const tail = input.path.slice(dest.prefix.length);
        const slug = tail.split('/').map(slugify).join('/');
        return {
          url: dest.template.replace('{slug}', slug) + anchor,
          isLocal: false,
          display: input.display ?? lastSegment(input.path),
          classes: ['wikilink--external'],
        };
      }
    }

    // 3. Unresolved — return null so the plugin renders plain display text.
    //    The audit report (see scripts/audit-wikilinks.ts) is where unresolved
    //    paths surface for triage, not the rendered page.
    return null;
  };

  return {
    resolver,
    onBroken: (input) => {
      console.warn(`[wikilinks] Unresolved: [[${input.raw}]] in essay/note/etc.`);
    },
  };
}
```

### Wiring into page templates

```astro
---
// e.g. src/pages/essays/[...slug].astro
import { parseMarkdown } from '@lossless-group/lfm';
import { createWikilinkResolver } from '../../config/wikilinks';

const wikilinkOptions = await createWikilinkResolver();
const tree = await parseMarkdown(entry.body, { wikilinks: wikilinkOptions });
---
```

The resolver is async because the local-slug index is derived from `getCollection()` which is async. Built once per page render at SSR time. (Cheap — it's just collection lookups; Astro caches collections.)

## Visual Differentiation

Per Q3: every wikilink renders with a base `wikilink` class plus a state-specific modifier. Sites style as desired.

| State | Class | Default rendering |
|---|---|---|
| Local — page exists | `wikilink wikilink--local` | Underlined like a normal link, color matches `--color-primary`. No icon. |
| External — known destination | `wikilink wikilink--external` | Underlined, color matches link default, `target="_blank" rel="noopener noreferrer"`, ↗ icon via `::after`. |
| Unresolved — no match anywhere | (no class) | Plain text. The display string (or path's last segment) renders as ordinary prose with zero markup. Logged to the wikilink audit report for offline triage. |

The ↗ icon is a CSS pseudo-element (`content: " ↗"; font-size: 0.75em;`), not an inline SVG, so adding it doesn't bloat HTML or require an icon library. Sites that want the brand-favicon-in-margin treatment (analogous to the `llm-response` brand badges) can extend the visual layer in their own `wikilink.css`.

## Resolution Precedence

Strict order, first match wins:

```
input wikilink
    │
    ▼
1. Local slug index match (case-insensitive)?
    │ yes → return local URL, isLocal=true
    ▼ no
2. External prefix match (declared order, first match wins)?
    │ yes → return templated URL, isLocal=false
    ▼ no
3. Unresolved — render plain display text (no anchor, no styling). Log to audit report via `onUnresolved` callback.
```

This means **prefix order matters** in the site config: more specific prefixes go first. `projects/Context-Vigilance/` must precede `projects/` or every Context-Vigilance link routes through the generic projects mapping.

## Concrete Resolution: mpstaton-site Examples

Using the four real wikilinks from the essay:

| Input | Match step | Resolved URL | isLocal | Display |
|---|---|---|---|---|
| `[[Vocabulary/Polyrepo\|Polyrepo]]` | External prefix `Vocabulary/` | `https://lossless.group/vocabulary/polyrepo` | false | "Polyrepo" |
| `[[Vocabulary/Microservices\|Microservices]]` | External prefix `Vocabulary/` | `https://lossless.group/vocabulary/microservices` | false | "Microservices" |
| `[[concepts/Naming Conventions\|Naming Conventions]]` | External prefix `concepts/` | `https://lossless.group/concepts/naming-conventions` | false | "Naming Conventions" |
| `[[projects/Context-Vigilance/Philosophy/Best-Practices\|Best-Practices]]` | External prefix `projects/Context-Vigilance/` | `https://lossless.group/projects/context-vigilance/philosophy/best-practices` | false | "Best-Practices" |

All four render as `<a class="wikilink wikilink--external" target="_blank" rel="noopener noreferrer" href="…">{Display}</a>` with the trailing ↗ pseudo-element.

## Implementation Phases

### Phase 1 — LFM `remarkLosslessWikilinks` plugin + companion plugin renames (`lfm/`)

This is the natural moment for the 0.3.0 minor bump we discussed earlier. Adding a new plugin AND renaming the four existing ones to the `Lossless` namespace in one coordinated release keeps the breaking-change blast radius bounded to a single version, instead of spreading the rename pain across multiple consumer updates.

**New work — `remarkLosslessWikilinks`:**

- [ ] Create `src/plugins/remark-lossless-wikilinks.ts` with the regex parser and the resolver-driven transform.
- [ ] Export `remarkLosslessWikilinks` from `src/index.ts` and add to `remarkLfm` in `src/preset.ts` (wire AFTER `remarkGfm`, BEFORE `remarkLosslessCallouts` — so wikilinks inside callout bodies still resolve).
- [ ] Add the `WikilinkOptions` / `WikilinkResolution` / `WikilinkResolverInput` shapes to `src/types/index.ts`.
- [ ] Tests: unit-test the regex against all seven syntax shapes from §"Wikilink Syntax to Support". Snapshot-test the MDAST output for resolved/external/broken cases.

**Companion renames — bundle into the same release:**

| Old name | New name | New file |
|---|---|---|
| `remarkCallouts` | `remarkLosslessCallouts` | `src/plugins/remark-lossless-callouts.ts` |
| `remarkCitations` | `remarkLosslessCitations` | `src/plugins/remark-lossless-citations.ts` |
| `remarkLinkPreview` | `remarkLosslessLinkPreview` | `src/plugins/remark-lossless-link-preview.ts` |
| `remarkOgFetcher` | `remarkLosslessOgFetcher` | `src/plugins/remark-lossless-og-fetcher.ts` |

- [ ] Rename source files via `git mv` (preserves blame history) and update all internal imports.
- [ ] Update `src/index.ts` to export the new names. **Do not** ship deprecated aliases for the old names — this is a clean 0.3.0 minor and consumers update via the changelog.
- [ ] Update `src/preset.ts` (`remarkLfm`) to reference the renamed plugins.
- [ ] Update `context-v/Maintain-Lossless-Markdown-and-Extended-Markdown-Render-Pipeline.md` to use the new names throughout, plus add a new section codifying the wikilink contract — same structural rigor as the recent §7 callout nesting policy.
- [ ] Update `README.md` examples to reference the new names.

**Release:**

- [ ] Minor bump to 0.3.0. The renames are breaking for any consumer importing the named plugins directly. Consumers using only `parseMarkdown()` / `remarkLfm` are unaffected — `remarkLfm` keeps composing the renamed plugins internally.
- [ ] Publish to JSR + GitHub Packages mirror.
- [ ] Coordinate with `mpstaton-site` Phase 2 — the site upgrades to 0.3.0 and adds `remarkLosslessWikilinks` config in the same change.

### Phase 2 — mpstaton-site site integration

- [ ] Create `src/config/wikilinks.ts` per the shape in §"Site Layer".
- [ ] Implement `buildLocalSlugIndex()` to walk all collections (`essays`, `notes`, `context-v`, `changelog`) and return a `Map<string, string>` of `lower(id) → URL`.
- [ ] Wire `createWikilinkResolver()` into every page template that calls `parseMarkdown()`:
  - `src/pages/essays/[...slug].astro`
  - `src/pages/notes/from-the-rabbit-hole/[...slug].astro`
  - `src/pages/context-v/[...slug].astro`
  - any others that surface markdown content.
- [ ] Add base `.wikilink`, `.wikilink--local`, `.wikilink--external` styles to either `src/styles/globals.css` or a new `src/styles/wikilinks.css`. Match the brand palette via existing `--color-*` semantic tokens. (No `--broken` style — unresolved wikilinks render as plain prose.)
- [ ] Verify the four real wikilinks in `from-engineering-to-managing-large-codebases.md` resolve as expected.

### Phase 3 — Cross-site spread

- [ ] Once Phase 1+2 are stable, document the pattern in `astro-knots/CLAUDE.md` ("Implementing wikilinks in a new site") with a step-by-step matching the existing LFM markdown integration steps.
- [ ] Roll out to the other markdown-heavy sites (`fullstack-vc`, `cilantro-site`, etc.) — each with its own external destination map.
- [ ] Consider extracting the local-slug-index helper into a shared utility (`@knots/wikilinks-config`?) only if/when three+ sites have implemented their own and the duplication hurts. Don't extract preemptively.

## Future Considerations

- **Multiple-destination intelligence.** A wikilink like `[[Vocabulary/Polyrepo]]` could potentially exist on `lossless.group` AND on `cilantro-site/glossary/`. Phase 1's first-match-wins is the right scope for v1. A future version could let the resolver return *multiple* candidate destinations and surface a chooser UI on hover.
- **Cross-site local detection.** When `cilantro-site` and `mpstaton-site` are both Astro Knots sites built in the same monorepo, a shared build step could exchange slug indexes so wikilinks pointing across sites resolve as `isLocal: true` (well, `isLocal: 'sibling'`) with a different visual treatment than the lossless.group external. Defer until two Astro Knots sites actually need to cross-reference.
- **Hover previews.** Once the OG fetcher / link-preview system is integrated more broadly, external wikilinks could pick up hover-card previews for free. The `link` MDAST shape this plugin produces is the same one the link-preview pipeline already operates on — should be a free integration once both are wired.
- **Backlinks-as-aside.** Obsidian's "linked mentions" / backlinks panel is a different feature — the inverse of this one (other pages linking *to* the current page). Out of scope here, tracked separately.

## Resolved Decisions (post-audit review)

The first audit run (354 unique paths across 16 prefixes — see `[[Wikilink-Path-Audit__mpstaton-site]]`) surfaced enough real-world data to firm up several decisions that were tentative in the original plan.

3. **Case sensitivity — case-INsensitive everywhere.**

   The audit showed both `Vocabulary/` (40 paths) and `vocabulary/` (1 path) coexisting in legacy content. The Lossless Group convention — "lowercase for code/machine-facing dirs, Train-Case for human-facing" — has not been applied uniformly to the Obsidian vault over time, both intentionally (refactoring) and accidentally (typos, IDE renames Obsidian didn't see).

   **Decision:** match prefixes case-insensitively, normalize the slug to lowercase before substituting into the URL template, and dedupe entries in the audit by lowercased path. There are no realistic scenarios where two distinct destinations differ only by case, and "fail gracefully toward the most likely intent" is the right discipline for a flexible authoring system.

   Implementation note: the resolver lowercases `input.path` before prefix scanning AND lowercases the prefix it compares against. The slugifier already lowercases.

4. **Unresolved-wikilink behavior — render as plain text, log to audit report.**

   *Operating principle: supporting 40% of the intended wikilinks is better than supporting none.*

   When the resolver returns `null`, the plugin emits a plain `text` MDAST node containing the display string (or path's last segment if no display was supplied). No `<a>`, no class, no `title` attribute. The reader sees ordinary prose and isn't punished for our incomplete config.

   The path is logged via the `onUnresolved` callback. Sites pipe this into the audit-report file (`Wikilink-Path-Audit__<site>.md`), which gets refreshed by `scripts/audit-wikilinks.ts`. Resolution work happens offline against that report — not in reader-facing UI.

   This replaces the earlier proposal of a styled `wikilink--broken` span with dotted underline. Visual error states make sense in authoring tools (Obsidian shows broken wikilinks with red text); they don't make sense on a published web page where the reader has no context for "broken."

5. **Bare wikilinks — special category, never auto-resolved.**

   The audit found 91 bare wikilinks (e.g., `[[Polyrepo]]`, `[[Microservices]]`) — wikilinks with no path prefix at all. These are a known legacy artifact: an Obsidian setting that wasn't enabled when older essays were authored, plus ongoing creation of "stub files" at the vault root before they're moved to a proper folder.

   **Decision:** the resolver does not attempt to resolve bare wikilinks at all (returns `null` immediately for any path with no `/`). They render as plain text per (4). The audit report surfaces them in a dedicated section so the author can either:
   - Open the file in Obsidian and let Obsidian auto-update the wikilink when the stub is moved into a folder.
   - Run a future `scripts/fix-bare-wikilinks.ts` script (not yet implemented) that takes a content folder and a target prefix and rewrites bare wikilinks in source content.
   - Accept that the wikilink will continue to render as plain prose until the underlying stub gets organized.

   This is intentional non-magic. Trying to guess the destination of `[[Polyrepo]]` without a path would mask real authoring debt.

## Still-Open Questions

1. **Display text default for `[[folder/Page]]` (no pipe):** last segment deslugified, OR full path? *Tentative answer: last segment deslugified.* Confirm in implementation review.
2. **Anchor slugify rule:** `Section Heading` → `section-heading` (kebab-case, lowercase) is the LFM/Astro default for heading IDs already. Confirm consistency with how AstroMarkdown generates heading `id`s.
3. **Failure mode for the local-slug-index build:** if `getCollection()` throws, do we fail the page or fall back to "everything is external"? *Tentative: log the error, fall back to external-only resolution, surface in build output.*
4. **Absolute filesystem paths in wikilinks** (e.g., `[[/Users/mpstaton/content-md/...]]`): the audit found 1. Treat as unresolved (render plain text, log) — same as bare wikilinks. They're authoring artifacts from non-Obsidian moves of vault files. No resolver special case; they fall through naturally.

---

**Status (v0.5.0):** Audit + rules system landed. 208 of 354 wikilink paths in mpstaton-site resolved (59%) via 7 prefix rules; 44 deferred (organizations, vertical-toolkits) tracked separately; 102 remaining for future triage.

The rule shape in `scripts/wikilink-rules.ts` is the canonical shape Phase 2's `src/config/wikilinks.ts` will adopt verbatim — same interfaces, same `resolvePath()` signature. This means the rules file we maintain today carries directly into the resolver tomorrow.

**What v0.5.0 does NOT yet include:** the actual `remarkLosslessWikilinks` plugin in lfm (Phase 1) and the AstroMarkdown integration (Phase 2). Wikilinks in published essays still render as raw `[[...]]` syntax. v1.0.0 ships when both phases land + a real essay round-trips with resolved hyperlinks. Calling this v0.5.0 instead of v1.0 is deliberate: the system is delicate given how much of our content depends on it, and we want to validate the rules pattern across multiple sites before locking it in as v1.
