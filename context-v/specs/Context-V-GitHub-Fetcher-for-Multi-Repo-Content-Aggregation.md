---
title: "Context-V GitHub Fetcher for Multi-Repo Content Aggregation"
lede: "A build-time content fetcher that pulls context-v documents (Specs, Blueprints, Prompts, Reminders) from multiple GitHub repositories, enabling lossless.group and mpstaton.com to render current project documentation without manual copying or submodules."
date_authored_initial_draft: 2026-03-25
date_authored_current_draft: 2026-03-25
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-03-25
at_semantic_version: 0.0.0.1
status: Draft
augmented_with: Claude Code (Opus 4.6)
category: Specification
tags: [Context-V, GitHub-API, Content-Fetching, Build-Time, Multi-Repo, Aggregation]
authors:
  - Michael Staton
  - AI Labs Team
image_prompt: A network diagram showing multiple GitHub repository nodes each with a context-v directory, with content flowing through a central fetcher into two website nodes — all connected by clean directional arrows on a dark background.
date_created: 2026-03-25
date_modified: 2026-03-25
---

# Context-V GitHub Fetcher for Multi-Repo Content Aggregation

**Status**: Draft (v0.0.1)
**Date**: 2026-03-25
**Author**: Michael Staton

---

## 1. Problem

We maintain ~20 repositories under the `lossless-group` GitHub org. Many of these have a `context-v/` directory containing project documentation organized into four canonical categories: **Specs**, **Blueprints**, **Prompts**, and **Reminders**. This is our "Context Vigilance" framework — a lightweight system for keeping AI assistants and human collaborators aligned on project intent.

The documentation is valuable beyond the repo it lives in. Our two "wide lens" sites — [lossless.group](https://lossless.group) and [mpstaton.com](https://mpstaton.com) — need to surface this documentation across all projects. Currently, the lossless.group site has a "Context Vigilance" page that only sources from its own `context-v/` directory. That's one repo out of twenty.

The ways we've tried to solve this:

| Approach | Problem |
|----------|---------|
| **Manual copy** | We never remember. Content drifts immediately. |
| **Git submodules** | Fragile on Vercel, confusing for contributors, stale unless manually updated. |
| **Monorepo co-location** | Only works for repos in the monorepo. External repos are invisible. |
| **"I'll update it later"** | We won't. |

What we want: **At build time, the site fetches the latest `context-v/` files directly from GitHub, for every repo we specify.** The content appears on the site as if it were local. When someone pushes a spec update to `investment-memo-orchestrator`, the next build of lossless.group picks it up automatically.

---

## 2. Goal

A build-time fetcher — packaged as a utility that any Astro site can use — that:

1. Reads a config listing GitHub repos and their `context-v/` paths
2. Uses the GitHub API to fetch the current file tree and markdown content from each repo's default branch
3. Writes the fetched files to a local directory that Astro content collections can consume
4. Preserves the category structure (specs/, blueprints/, prompts/, reminders/) and frontmatter
5. Adds provenance metadata (which repo, which commit, when fetched) so the rendering site knows where each doc came from
6. Runs as a pre-build step — `pnpm fetch-context` then `pnpm build`
7. Caches aggressively so builds aren't slow and we don't hammer the GitHub API

---

## 3. The Context-V Convention

Every repo that participates follows the same directory structure:

```
any-repo/
└── context-v/
    ├── specs/              # Design docs for features, agents, systems, fixes
    │   ├── Some-Spec.md
    │   └── Another-Spec.md
    ├── blueprints/         # System-level architecture spanning multiple features
    │   └── Architecture-Overview.md
    ├── prompts/            # Step-by-step implementation guides
    │   └── How-to-Deploy.md
    └── reminders/          # Short convention/preference docs for context feeding
        └── Frontmatter-Standards.md
```

### 3.1 The Four Categories

| Category | Purpose | Typical Length | Example |
|----------|---------|---------------|---------|
| **Specification** | Design doc for a single feature, agent, system, or fix | 2-50 pages | "Interactive Terminal Application" |
| **Blueprint** | System-level architecture spanning multiple features | 5-100 pages | "Multi-Agent Orchestration" |
| **Prompt** | Step-by-step implementation guide for a human or AI | 1-10 pages | "Improving Memo Output" |
| **Reminder** | Short convention doc for feeding into context windows | 0.5-2 pages | "Frontmatter Standards" |

### 3.2 Frontmatter Convention

Every context-v document should have at minimum:

```yaml
---
title: "Document Title"
category: Specification  # or Blueprint, Prompt, Reminder
date_created: 2026-03-25
date_modified: 2026-03-25
tags: [relevant, tags]
authors:
  - Author Name
---
```

The fetcher will read `category` from frontmatter to sort documents. If `category` is missing, the fetcher infers it from the directory name (`specs/ → Specification`, etc.).

### 3.3 Files That Live at the context-v Root

Some repos have markdown files at the `context-v/` root level (not inside a category subdirectory). These are typically older files that predate the category convention. The fetcher handles these by:

1. Reading the `category` field from frontmatter if present
2. If no `category`, classifying as "Uncategorized" and including them in a catch-all section
3. Optionally, the site can choose to exclude uncategorized files

---

## 4. Architecture

### 4.1 High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Config: context-v-sources.yaml                             │
│  Lists repos + optional path overrides + auth token ref     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Fetcher: fetch-context-v                                   │
│                                                             │
│  For each repo:                                             │
│    1. GET /repos/{owner}/{repo}/git/trees/{branch}?recursive│
│       → discover all files under context-v/                 │
│    2. For each .md file:                                    │
│       GET /repos/{owner}/{repo}/contents/{path}             │
│       → fetch raw content (base64 decoded)                  │
│    3. Parse frontmatter, add provenance fields              │
│    4. Write to local output directory                       │
│                                                             │
│  Cache: ETag/Last-Modified headers → skip unchanged files   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Output: src/content/context-v/{repo-name}/{category}/      │
│                                                             │
│  context-v/                                                 │
│  ├── astro-knots/                                           │
│  │   ├── specs/                                             │
│  │   │   └── Codifying-LFM.md         (with provenance)    │
│  │   └── blueprints/                                        │
│  │       └── Maintain-Render-Pipeline.md                    │
│  ├── investment-memo-orchestrator/                           │
│  │   ├── specs/                                             │
│  │   │   └── Interactive-Terminal.md                         │
│  │   └── blueprints/                                        │
│  │       └── Multi-Agent-Orchestration.md                   │
│  └── memopop-ai/                                            │
│      └── reminders/                                         │
│          └── Preferred-Changelog-Format.md                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Astro Content Collection: src/content/config.ts            │
│                                                             │
│  Collections defined per category or per repo — site's      │
│  choice. Frontmatter schema validated with Zod.             │
│  Rendering handled by site's existing markdown pipeline.    │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 What This Is NOT

- **Not a CMS** — no editing, no drafts, no preview. It's a one-way pull from GitHub.
- **Not a sync tool** — it doesn't push changes back to repos.
- **Not real-time** — content updates on the next build, not on push. (Webhook-triggered rebuilds can make this near-real-time if needed.)
- **Not a submodule replacement for development** — submodules are still useful for co-located development. This is for *publishing* context-v content to sites.

---

## 5. Configuration

### 5.1 Source Config File

```yaml
# context-v-sources.yaml — lives in the consuming site's root

# GitHub auth token — reads from environment variable
auth:
  token_env: GITHUB_TOKEN   # or CONTEXT_V_GITHUB_TOKEN, whatever the site uses

# Default settings (can be overridden per-repo)
defaults:
  branch: main
  categories: [specs, blueprints, prompts, reminders]
  include_root_files: true         # fetch .md files at context-v/ root level
  include_uncategorized: false     # include files with no category in frontmatter

# Repositories to fetch from
sources:
  - repo: lossless-group/astro-knots
    label: "Astro Knots"           # human-readable name for the site to display
    description: "Pattern library and development workspace for client websites"

  - repo: lossless-group/investment-memo-orchestrator
    label: "Investment Memo Orchestrator"
    description: "Multi-agent system for generating investment memos"

  - repo: lossless-group/lossless-content
    label: "Lossless Content"
    description: "Shared content repository"
    path: context-v                 # default, but can override if a repo uses a different dir name

  - repo: lossless-group/memopop-ai
    label: "Memopop AI"
    description: "AI memo generation tool"

  - repo: lossless-group/lossless-site
    label: "Lossless Site"
    description: "The lossless.group website"

  - repo: lossless-group/lossless-ai-labs
    label: "AI Labs"
    description: "Experimental AI tools and agents"

  - repo: lossless-group/helium
    label: "Helium"
    description: "Helium project"
    categories: [specs, blueprints]  # only fetch specs and blueprints from this repo
```

### 5.2 Environment Variables

```bash
# .env (site-level, NOT committed)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

The token needs `repo` scope for private repos, or no scope at all for public repos. The fetcher reads the token from the env var named in `auth.token_env`.

### 5.3 Per-Repo Overrides

Any default can be overridden per-repo:

```yaml
sources:
  - repo: lossless-group/some-repo
    branch: develop                    # override default branch
    path: docs/context-v               # override default path
    categories: [specs]                # only fetch specs
    include_root_files: false          # skip root-level files
```

---

## 6. Provenance Metadata

Every fetched file gets provenance fields injected into its frontmatter so the rendering site knows where it came from:

```yaml
---
title: "Interactive Terminal Application"
category: Specification
# ... original frontmatter preserved ...

# --- Provenance (injected by fetcher) ---
_context_v:
  repo: lossless-group/investment-memo-orchestrator
  repo_label: "Investment Memo Orchestrator"
  branch: main
  commit_sha: "a1b2c3d4e5f6..."
  file_path: "context-v/specs/Interactive-Terminal-Application.md"
  fetched_at: "2026-03-25T16:00:00Z"
  github_url: "https://github.com/lossless-group/investment-memo-orchestrator/blob/main/context-v/specs/Interactive-Terminal-Application.md"
---
```

The `_context_v` field (prefixed with `_` to signal it's system-generated, not author-written) enables:

- **Source attribution** — the site can show "From: Investment Memo Orchestrator" with a link to the file on GitHub
- **Freshness** — the site can show "Last fetched: 2 hours ago" or "Commit: a1b2c3d"
- **Edit link** — "Edit this document on GitHub" links directly to the file
- **Deduplication** — if the same file somehow appears in two repos, the fetcher can detect it via content hash

---

## 7. Caching Strategy

The GitHub API has rate limits (5,000 requests/hour for authenticated users). A naive implementation that fetches every file on every build would burn through this quickly with 20 repos.

### 7.1 ETag-Based Caching

The GitHub Contents API supports `ETag` and `If-None-Match` headers. The fetcher:

1. On first fetch: stores the `ETag` header alongside the cached file
2. On subsequent fetches: sends `If-None-Match: {etag}` — GitHub returns `304 Not Modified` if the file hasn't changed (costs 1 API request but transfers no data)
3. Only re-downloads files that have actually changed

### 7.2 Tree-Level Short-Circuit

Before fetching individual files, the fetcher checks the repo's tree SHA:

1. `GET /repos/{owner}/{repo}/git/trees/{branch}` → returns a tree SHA
2. If the tree SHA matches the cached tree SHA for this repo, skip the entire repo — nothing has changed
3. This costs 1 API request per repo per build, regardless of how many files are in `context-v/`

### 7.3 Local Cache Structure

```
.context-v-cache/
├── tree-shas.json              # { "lossless-group/astro-knots": "abc123..." }
├── etags.json                  # { "path/to/file.md": "W/\"abc123...\"" }
└── files/                      # cached raw content, by content hash
    ├── a1b2c3d4.md
    └── e5f6g7h8.md
```

The cache lives in the site's `.context-v-cache/` directory (gitignored). On a clean build (no cache), the fetcher does a full fetch. On subsequent builds, it typically makes 1 API call per repo (tree SHA check) and 0 file downloads if nothing changed.

### 7.4 API Budget

| Scenario | API Calls | Notes |
|----------|----------|-------|
| 7 repos, nothing changed | 7 | One tree SHA check per repo |
| 7 repos, 1 file changed in 1 repo | 8 | 7 tree checks + 1 file download |
| 7 repos, full initial fetch (50 total files) | 57 | 7 tree checks + 50 file downloads |
| 20 repos, nothing changed | 20 | Comfortable within rate limits |
| Clean build, 20 repos, 200 files | 220 | Still well under 5,000/hour |

---

## 8. The Fetcher Implementation

### 8.1 CLI Interface

```bash
# Fetch all context-v content from configured sources
pnpm fetch-context

# Fetch from a specific repo only
pnpm fetch-context --repo lossless-group/astro-knots

# Force re-fetch (ignore cache)
pnpm fetch-context --fresh

# Dry run (show what would be fetched without writing files)
pnpm fetch-context --dry-run

# Verbose output (show API calls, cache hits/misses)
pnpm fetch-context --verbose
```

### 8.2 Script Location

The fetcher is a standalone TypeScript script that runs with `tsx` (no build step needed):

```
site-root/
├── scripts/
│   └── fetch-context-v.ts      # The fetcher script
├── context-v-sources.yaml      # Source configuration
├── .context-v-cache/           # Cache directory (gitignored)
├── src/
│   └── content/
│       └── context-v/          # Output directory (gitignored — regenerated on each build)
│           ├── astro-knots/
│           ├── investment-memo-orchestrator/
│           └── ...
└── package.json
```

### 8.3 Integration with Site Build

```json
{
  "scripts": {
    "fetch-context": "tsx scripts/fetch-context-v.ts",
    "prebuild": "pnpm fetch-context",
    "build": "astro build",
    "dev": "pnpm fetch-context && astro dev"
  }
}
```

The `prebuild` hook means `pnpm build` (and Vercel's build command) automatically fetches fresh content before building. In dev mode, `pnpm dev` fetches once then starts the dev server.

### 8.4 Vercel Deployment

For Vercel to fetch from private repos, the `GITHUB_TOKEN` environment variable must be set in the Vercel project settings. The fetcher reads it via `process.env[config.auth.token_env]`.

Build command: `pnpm build` (which triggers `prebuild` → `fetch-context` → `astro build`).

### 8.5 Core Implementation Sketch

The fetcher is straightforward — ~200-300 lines of TypeScript:

```typescript
// scripts/fetch-context-v.ts — simplified sketch

import { Octokit } from '@octokit/rest';
import * as yaml from 'yaml';
import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';

interface SourceConfig {
  repo: string;
  label: string;
  description?: string;
  branch?: string;
  path?: string;
  categories?: string[];
  include_root_files?: boolean;
}

interface Config {
  auth: { token_env: string };
  defaults: { branch: string; categories: string[]; include_root_files: boolean };
  sources: SourceConfig[];
}

async function main() {
  // 1. Read config
  const configRaw = await fs.readFile('context-v-sources.yaml', 'utf-8');
  const config: Config = yaml.parse(configRaw);

  // 2. Initialize GitHub client
  const token = process.env[config.auth.token_env];
  if (!token) throw new Error(`Missing env var: ${config.auth.token_env}`);
  const octokit = new Octokit({ auth: token });

  // 3. Load cache
  const cache = await loadCache();

  // 4. For each source repo
  for (const source of config.sources) {
    const [owner, repo] = source.repo.split('/');
    const branch = source.branch || config.defaults.branch;
    const contextPath = source.path || 'context-v';
    const categories = source.categories || config.defaults.categories;

    console.log(`Fetching ${source.repo}...`);

    // 5. Check tree SHA — skip if unchanged
    const { data: refData } = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
    const commitSha = refData.object.sha;
    if (cache.treeShas[source.repo] === commitSha) {
      console.log(`  ↳ No changes (commit ${commitSha.slice(0, 7)})`);
      continue;
    }

    // 6. Get file tree
    const { data: tree } = await octokit.git.getTree({
      owner, repo, tree_sha: commitSha, recursive: 'true',
    });

    // 7. Filter to context-v markdown files
    const contextFiles = tree.tree.filter(item =>
      item.type === 'blob' &&
      item.path?.startsWith(contextPath + '/') &&
      item.path?.endsWith('.md')
    );

    // 8. Fetch each file
    for (const file of contextFiles) {
      const filePath = file.path!;
      const relativePath = filePath.replace(contextPath + '/', '');

      // Determine category from path or frontmatter
      const category = inferCategory(relativePath, categories);
      if (!category && !config.defaults.include_root_files) continue;

      // Fetch content (with ETag caching)
      const content = await fetchFileWithCache(octokit, owner, repo, branch, filePath, cache);
      if (!content) continue; // 304 Not Modified

      // Parse frontmatter, inject provenance
      const parsed = matter(content);
      parsed.data._context_v = {
        repo: source.repo,
        repo_label: source.label,
        branch,
        commit_sha: commitSha,
        file_path: filePath,
        fetched_at: new Date().toISOString(),
        github_url: `https://github.com/${source.repo}/blob/${branch}/${filePath}`,
      };

      // Write to output directory
      const outputPath = path.join('src/content/context-v', repo, relativePath);
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, matter.stringify(parsed.content, parsed.data));
    }

    // 9. Update tree SHA cache
    cache.treeShas[source.repo] = commitSha;
  }

  // 10. Save cache
  await saveCache(cache);
  console.log('Done.');
}

function inferCategory(relativePath: string, allowedCategories: string[]): string | null {
  const firstDir = relativePath.split('/')[0];
  if (allowedCategories.includes(firstDir)) return firstDir;
  return null; // root-level file
}
```

This is the whole thing. No framework, no plugin architecture, no dependencies beyond `@octokit/rest`, `yaml`, and `gray-matter` (which the site already has). An AI assistant could write the production version of this in one session.

---

## 9. Content Collection Integration

### 9.1 Astro Content Collection

The fetched files land in `src/content/context-v/`. Define a collection:

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const contextV = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    category: z.enum(['Specification', 'Blueprint', 'Prompt', 'Reminder']).optional(),
    date_created: z.string().optional(),
    date_modified: z.string().optional(),
    tags: z.array(z.string()).optional(),
    authors: z.array(z.string()).optional(),
    status: z.string().optional(),
    _context_v: z.object({
      repo: z.string(),
      repo_label: z.string(),
      branch: z.string(),
      commit_sha: z.string(),
      file_path: z.string(),
      fetched_at: z.string(),
      github_url: z.string(),
    }).optional(),
  }),
});

export const collections = { 'context-v': contextV };
```

### 9.2 Querying Content

```astro
---
// Get all specs across all repos
const allSpecs = await getCollection('context-v', (entry) =>
  entry.id.includes('/specs/')
);

// Get all docs from a specific repo
const memoOrcDocs = await getCollection('context-v', (entry) =>
  entry.id.startsWith('investment-memo-orchestrator/')
);

// Get all blueprints, sorted by date
const blueprints = (await getCollection('context-v', (entry) =>
  entry.id.includes('/blueprints/')
)).sort((a, b) =>
  (b.data.date_modified || '').localeCompare(a.data.date_modified || '')
);

// Group by repo
const byRepo = Object.groupBy(allDocs, (doc) => doc.data._context_v?.repo_label);
---
```

### 9.3 Rendering

The fetched markdown is standard markdown (potentially with LFM extensions). It renders through whatever pipeline the site already has — `AstroMarkdown.astro`, `remarkLfm`, or Astro's built-in `entry.render()`.

The site adds provenance UI:

```astro
---
const { entry } = Astro.props;
const prov = entry.data._context_v;
---

<article>
  <header>
    <h1>{entry.data.title}</h1>
    {prov && (
      <div class="provenance">
        <span>From: {prov.repo_label}</span>
        <a href={prov.github_url}>View on GitHub</a>
        <span>Fetched: {new Date(prov.fetched_at).toLocaleDateString()}</span>
      </div>
    )}
  </header>

  {/* Render markdown body */}
  <Content />
</article>
```

---

## 10. Page Structure on the Consuming Site

### 10.1 Context Vigilance Index Page

A single page that shows all context-v content across all repos, grouped and filterable:

```
/context-vigilance/
├── All documents, grouped by repo
├── Filter by: category (Spec / Blueprint / Prompt / Reminder)
├── Filter by: repo
├── Filter by: tags
├── Sort by: date modified, title, repo
└── Search (title + tags + lede)
```

### 10.2 Category Pages

```
/context-vigilance/specs/           → All specs across all repos
/context-vigilance/blueprints/      → All blueprints across all repos
/context-vigilance/prompts/         → All prompts across all repos
/context-vigilance/reminders/       → All reminders across all repos
```

### 10.3 Per-Repo Pages

```
/context-vigilance/repo/astro-knots/                    → All docs from astro-knots
/context-vigilance/repo/investment-memo-orchestrator/    → All docs from IMO
```

### 10.4 Individual Document Pages

```
/context-vigilance/repo/astro-knots/specs/codifying-lfm  → One document
```

Each document page shows:
- Full rendered markdown content
- Provenance bar (repo name, GitHub link, commit SHA, fetch date)
- Category badge
- Tags
- Prev/next navigation within the same repo or category

---

## 11. Changelog Integration Possibility

We've already proven that fetching content from the GitHub API works — we did it with changelog documents. The context-v fetcher uses the same underlying mechanism (GitHub Contents API) with a different directory target. The fetcher could optionally also pull `changelog/` directories using the same config format, unifying all build-time content fetching into one tool.

```yaml
# Future: unified content fetcher config
sources:
  - repo: lossless-group/astro-knots
    fetch:
      - path: context-v
        output: src/content/context-v/astro-knots
      - path: changelog
        output: src/content/changelogs/astro-knots
```

---

## 12. Implementation Estimate

This is a small, focused project:

| Task | Estimate | Notes |
|------|----------|-------|
| Fetcher script (`fetch-context-v.ts`) | 2-4 hours | ~300 lines, straightforward GitHub API usage |
| Config file + parsing | 30 min | YAML schema is simple |
| Caching layer | 1-2 hours | ETag + tree SHA logic |
| Provenance injection | 30 min | Frontmatter manipulation with gray-matter |
| Content collection schema | 30 min | Zod schema, already familiar pattern |
| Index page + filtering UI | 2-4 hours | Depends on desired polish |
| Category/repo pages | 1-2 hours | Standard Astro dynamic routes |
| Document page + provenance bar | 1 hour | Already have markdown rendering |
| **Total** | **8-15 hours** | Could be faster with AI assistance |

The fetcher itself is a half-day project. The site pages are the other half-day to two days, depending on how much filtering/search polish we want.

---

## 13. Open Questions

1. **Gitignore the output?** The fetched files in `src/content/context-v/` should probably be gitignored since they're regenerated on each build. But this means local dev requires running `pnpm fetch-context` before `pnpm dev`. Acceptable?

2. **Webhook-triggered rebuilds?** Vercel supports deploy hooks — a URL that triggers a rebuild. We could add a GitHub webhook on each source repo that hits the Vercel deploy hook on push to main. This would make content updates near-real-time (rebuild takes ~2 minutes).

3. **Private repo access?** Some repos (e.g., `motley-fool-private`, `hypernova-secure-data`) are private. The GitHub token needs `repo` scope to access them. Should we fetch from private repos, or only public/org-visible ones?

4. **Conflict resolution?** If two repos have a file with the same name in the same category, the repo-namespaced output directory prevents collisions. But should we detect and warn about duplicate titles?

5. **Should this be a package too?** The fetcher is useful for any site that wants to aggregate context-v content. Should it be published as `@lossless/context-v-fetcher` alongside `@lossless/lfm`? Or is a copy-paste script sufficient?

6. **Images and assets?** Context-v documents may reference images. Should the fetcher also pull images from the repo, or should documents use absolute GitHub URLs for images?

---

## 14. Related Documents

- `Reorganize-Context-V-Into-Canonical-Categories.md` — The canonical category system
- `Managing-Complex-Markdown-Content-at-Build-Time.md` — Content sourcing patterns (local, package, remote)
- `Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md` — The rendering pipeline for fetched content

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-25 | Initial draft — context-v fetcher spec |
