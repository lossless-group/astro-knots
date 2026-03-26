---
title: "Implement Context-V Fetcher for mpstaton-site"
lede: "Step-by-step implementation guide for adding a build-time GitHub content fetcher to mpstaton-site that pulls context-v documents from multiple repos."
date_authored_initial_draft: 2026-03-25
date_authored_current_draft: 2026-03-25
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-03-25
at_semantic_version: 0.0.0.1
status: Draft
augmented_with: Claude Code (Opus 4.6)
category: Prompt
tags: [Context-V, GitHub-API, mpstaton-site, Implementation, Build-Time]
authors:
  - Michael Staton
  - AI Labs Team
date_created: 2026-03-25
date_modified: 2026-03-25
---

# Implement Context-V Fetcher for mpstaton-site

## Prerequisites

Before starting, read these documents for full context:

1. **Spec**: `context-v/specs/Context-V-GitHub-Fetcher-for-Multi-Repo-Content-Aggregation.md` — the full architecture, caching strategy, and design decisions
2. **Context-V categories**: Specs, Blueprints, Prompts, Reminders — four canonical document types, stored in lowercase directory names under `context-v/`
3. **mpstaton-site state**: Astro site at `sites/mpstaton-site/`, already has a `changelog` content collection fetched via GitHub API (proven pattern), Tailwind v4, Vercel deployment

## Target Site

`sites/mpstaton-site/` — Michael Staton's personal site, currently being buffed up. Needs a wide lens on all project documentation across repos.

---

## Step 1: Create the GitHub API Type Definitions

Create type definitions for GitHub API responses and our internal data shapes. These types are referenced by every subsequent step.

**File**: `src/types/context-v.ts`

```typescript
// === GitHub API Response Types ===

/** GitHub Git Tree API response item */
export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

/** GitHub Git Tree API response */
export interface GitHubTreeResponse {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

/** GitHub Contents API response (single file) */
export interface GitHubFileResponse {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file';
  content: string;          // base64 encoded
  encoding: 'base64';
}

/** GitHub Ref API response */
export interface GitHubRefResponse {
  ref: string;
  node_id: string;
  url: string;
  object: {
    sha: string;
    type: string;
    url: string;
  };
}

// === Source Configuration Types ===

export interface SourceRepo {
  repo: string;             // "owner/repo"
  label: string;            // human-readable display name
  description?: string;     // short description of the repo/project
  branch?: string;          // override default branch
  path?: string;            // override context-v dir name
  categories?: string[];    // override which categories to fetch
}

export interface FetcherConfig {
  auth: {
    token_env: string;      // env var name holding the GitHub token
  };
  defaults: {
    branch: string;
    categories: string[];
    include_root_files: boolean;
  };
  sources: SourceRepo[];
}

// === Provenance Types ===

/** Injected into frontmatter of every fetched document */
export interface ContextVProvenance {
  repo: string;
  repo_label: string;
  branch: string;
  commit_sha: string;
  file_path: string;
  fetched_at: string;       // ISO 8601
  github_url: string;
}

// === Cache Types ===

export interface FetcherCache {
  tree_shas: Record<string, string>;   // repo → commit SHA
  etags: Record<string, string>;       // file path → ETag
  last_fetched: string;                // ISO 8601 timestamp
}

// === Category Constants ===

export const CATEGORIES = ['specs', 'blueprints', 'prompts', 'reminders'] as const;
export type Category = typeof CATEGORIES[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  specs: 'Specification',
  blueprints: 'Blueprint',
  prompts: 'Prompt',
  reminders: 'Reminder',
};
```

---

## Step 2: Create the Source Configuration File

**File**: `context-v-sources.yaml` (site root)

Start with repos we know have context-v directories. We can add more later.

```yaml
auth:
  token_env: GITHUB_TOKEN

defaults:
  branch: main
  categories: [specs, blueprints, prompts, reminders]
  include_root_files: true

sources:
  - repo: lossless-group/astro-knots
    label: "Astro Knots"
    description: "Pattern library and development workspace for client websites"

  - repo: lossless-group/investment-memo-orchestrator
    label: "Investment Memo Orchestrator"
    description: "Multi-agent system for generating investment memos"

  - repo: lossless-group/memopop-ai
    label: "Memopop AI"
    description: "AI memo generation tool"
```

---

## Step 3: Set Up Environment Variables

**File**: `.env` (site root, gitignored)

```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Generate a GitHub Personal Access Token at https://github.com/settings/tokens with `repo` scope (needed for private repos). For public repos only, a fine-grained token with "Contents: read" is sufficient.

Also add `GITHUB_TOKEN` to Vercel project settings → Environment Variables for production builds.

---

## Step 4: Create the Fetcher Script

**File**: `scripts/fetch-context-v.ts`

This is the core script. It:
1. Reads `context-v-sources.yaml`
2. For each repo, checks if anything changed (tree SHA comparison)
3. Fetches new/changed markdown files from the `context-v/` directories
4. Injects provenance metadata into frontmatter
5. Writes files to `src/content/context-v/{repo-slug}/{category}/`
6. Maintains a cache to minimize API calls

**Dependencies needed**: `yaml` (YAML parsing), `gray-matter` (frontmatter parsing/serialization). These may already be installed — check first. If not:

```bash
pnpm add yaml gray-matter
pnpm add -D tsx       # if not already present, for running .ts scripts
```

**Implementation approach**:

The script makes direct `fetch()` calls to the GitHub REST API — no Octokit dependency needed. The relevant endpoints are:

| Endpoint | Purpose | Response Shape |
|----------|---------|---------------|
| `GET /repos/{owner}/{repo}/git/ref/heads/{branch}` | Get current commit SHA | `GitHubRefResponse` |
| `GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1` | List all files in the repo | `GitHubTreeResponse` |
| `GET /repos/{owner}/{repo}/contents/{path}?ref={branch}` | Fetch a single file (base64) | `GitHubFileResponse` |

All requests need the header `Authorization: Bearer {token}` and `Accept: application/vnd.github.v3+json`.

**Key logic flow** (pseudocode — the AI assistant implementing this should write the actual code):

```
1. Parse context-v-sources.yaml
2. Load cache from .context-v-cache/cache.json (or create empty)
3. For each source repo:
   a. GET ref → commit SHA
   b. If commit SHA matches cache → skip repo (nothing changed)
   c. GET tree (recursive) → filter to context-v/**/*.md files
   d. For each .md file:
      - Determine category from path (specs/, blueprints/, etc.)
      - Skip if category not in allowed list
      - GET contents → decode base64 → raw markdown string
      - Parse frontmatter with gray-matter
      - Inject _context_v provenance object into frontmatter
      - Write to src/content/context-v/{repo-slug}/{category}/{filename}
   e. Update cache with new commit SHA
4. Save cache
5. Log summary: "Fetched X files from Y repos (Z cached, W new/updated)"
```

**Output directory structure**:

```
src/content/context-v/
├── astro-knots/
│   ├── specs/
│   │   ├── Codifying-a-Comprehensive-Extended-Markdown-Flavor-and-Shared-Package.md
│   │   └── Context-V-GitHub-Fetcher-for-Multi-Repo-Content-Aggregation.md
│   ├── blueprints/
│   │   ├── Citation-System-Architecture.md
│   │   └── Maintain-Extended-Markdown-Render-Pipeline.md
│   ├── prompts/
│   │   └── Implement-Context-V-Fetcher-for-mpstaton-site.md
│   └── reminders/
│       ├── Astro-Knots-is-not-a-True-Monorepo.md
│       └── Preferred-Stack.md
├── investment-memo-orchestrator/
│   ├── specs/
│   │   └── Interactive-Terminal-Application.md
│   └── blueprints/
│       └── Multi-Agent-Orchestration.md
└── memopop-ai/
    └── reminders/
        └── Preferred-Format-for-Changelog.md
```

---

## Step 5: Add to .gitignore

**File**: `.gitignore` (add these lines)

```
# Context-V fetcher
src/content/context-v/
.context-v-cache/
```

The fetched content is regenerated on every build — no need to commit it. The cache is local developer state.

---

## Step 6: Wire Into Build Scripts

**File**: `package.json` (update scripts)

```json
{
  "scripts": {
    "fetch-context": "tsx scripts/fetch-context-v.ts",
    "dev": "pnpm fetch-context && astro dev",
    "build": "pnpm fetch-context && astro build",
    "preview": "astro preview",
    "astro": "astro"
  }
}
```

Both `dev` and `build` now fetch fresh content before starting. On Vercel, the `build` command handles it automatically.

---

## Step 7: Define the Astro Content Collection

**File**: `src/content.config.ts` (update existing file)

Add a `context-v` collection alongside the existing `changelog` collection:

```typescript
import { defineCollection, z } from 'astro:content';

const changelog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
  }),
});

const contextV = defineCollection({
  type: 'content',
  schema: z.object({
    // Core fields
    title: z.string(),
    lede: z.string().optional(),
    category: z.enum(['Specification', 'Blueprint', 'Prompt', 'Reminder']).optional(),
    status: z.string().optional(),

    // Dates
    date_created: z.string().optional(),
    date_modified: z.string().optional(),
    date_authored_initial_draft: z.string().optional(),
    date_authored_current_draft: z.string().optional(),

    // Authorship
    authors: z.array(z.string()).optional(),
    augmented_with: z.string().optional(),

    // Classification
    tags: z.array(z.string()).optional(),
    at_semantic_version: z.string().optional(),

    // Behavioral
    publish: z.boolean().optional(),

    // Provenance (injected by fetcher)
    _context_v: z.object({
      repo: z.string(),
      repo_label: z.string(),
      branch: z.string(),
      commit_sha: z.string(),
      file_path: z.string(),
      fetched_at: z.string(),
      github_url: z.string(),
    }).optional(),
  }).passthrough(),  // Allow additional frontmatter fields we haven't anticipated
});

export const collections = {
  changelog,
  'context-v': contextV,
};
```

The `.passthrough()` is important — different repos will have different frontmatter fields, and we don't want the schema to reject documents just because they have a field we didn't list.

---

## Step 8: Create the Context Vigilance Index Page

**File**: `src/pages/context-vigilance/index.astro`

This is the main landing page that shows all context-v content grouped by repo. Implementation details are up to the site's design, but the data fetching pattern is:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

// Get all context-v documents
const allDocs = await getCollection('context-v');

// Group by repo
const byRepo = new Map<string, typeof allDocs>();
for (const doc of allDocs) {
  const repoLabel = doc.data._context_v?.repo_label || 'Unknown';
  if (!byRepo.has(repoLabel)) byRepo.set(repoLabel, []);
  byRepo.get(repoLabel)!.push(doc);
}

// Group by category
const byCategory = new Map<string, typeof allDocs>();
for (const doc of allDocs) {
  const category = doc.data.category || 'Uncategorized';
  if (!byCategory.has(category)) byCategory.set(category, []);
  byCategory.get(category)!.push(doc);
}
---

<BaseLayout title="Context Vigilance">
  <h1>Context Vigilance</h1>
  <p>Project documentation across {byRepo.size} repositories, {allDocs.length} documents.</p>

  {/* Render grouped by repo, or by category, or both — site design decision */}
</BaseLayout>
```

---

## Step 9: Create Dynamic Document Pages

**File**: `src/pages/context-vigilance/[...slug].astro`

Each document gets its own page with full rendered markdown + provenance bar:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const docs = await getCollection('context-v');
  return docs.map(doc => ({
    params: { slug: doc.id },
    props: { doc },
  }));
}

const { doc } = Astro.props;
const { Content } = await doc.render();
const prov = doc.data._context_v;
---

<BaseLayout title={doc.data.title}>
  <article>
    <header>
      <h1>{doc.data.title}</h1>
      {doc.data.lede && <p class="lede">{doc.data.lede}</p>}

      {prov && (
        <div class="provenance">
          <span>From: {prov.repo_label}</span>
          <a href={prov.github_url} target="_blank" rel="noopener">View on GitHub</a>
          <span>Commit: {prov.commit_sha.slice(0, 7)}</span>
        </div>
      )}

      {doc.data.tags && (
        <div class="tags">
          {doc.data.tags.map(tag => <span class="tag">{tag}</span>)}
        </div>
      )}
    </header>

    <Content />
  </article>
</BaseLayout>
```

---

## Step 10: Test Locally

```bash
cd sites/mpstaton-site

# Run the fetcher manually first to verify
pnpm fetch-context --verbose

# Check that files landed correctly
ls -R src/content/context-v/

# Start dev server
pnpm dev

# Visit http://localhost:4321/context-vigilance/
```

**Expected result**: The index page shows documents grouped by repo, each clickable to a full rendered page with provenance information.

---

## Step 11: Deploy to Vercel

1. Ensure `GITHUB_TOKEN` is set in Vercel project settings → Environment Variables
2. Push to the site's repo
3. Vercel runs `pnpm build` → triggers `pnpm fetch-context` → fetches from GitHub → builds Astro → deploys

Every subsequent push (or webhook-triggered rebuild) picks up the latest context-v content from all configured repos.

---

## Step 12: Add More Repos

To add a new repo's context-v content to the site, just add an entry to `context-v-sources.yaml`:

```yaml
sources:
  # ... existing sources ...
  - repo: lossless-group/helium
    label: "Helium"
    description: "Helium project"
```

Next build picks it up automatically. No code changes needed.

---

## Summary of Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `src/types/context-v.ts` | Create | GitHub API + internal type definitions |
| `context-v-sources.yaml` | Create | Source repo configuration |
| `.env` | Create/update | GitHub token |
| `scripts/fetch-context-v.ts` | Create | The fetcher script (~200-300 lines) |
| `.gitignore` | Update | Ignore fetched content + cache |
| `package.json` | Update | Wire fetch-context into dev/build scripts |
| `src/content.config.ts` | Update | Add context-v content collection |
| `src/pages/context-vigilance/index.astro` | Create | Index page |
| `src/pages/context-vigilance/[...slug].astro` | Create | Document pages |

## Dependencies Added

| Package | Purpose |
|---------|---------|
| `yaml` | Parse context-v-sources.yaml |
| `gray-matter` | Parse/serialize frontmatter in fetched markdown |
| `tsx` (dev) | Run TypeScript scripts without build step |
