# GitHub Secure Content Pattern

> **Status:** Implemented
> **Target Sites:** hypernova-site (initial), any site needing confidential content
> **Author:** AI-assisted
> **Created:** December 2024
> **Implementation:** `src/lib/github-content.ts`

---

## Executive Summary

This pattern enables Astro sites to fetch confidential content from a **private GitHub repository** at runtime, keeping sensitive documents out of deployed static assets while allowing authorized users to view them through the web application.

**Key Benefits:**
- Confidential content never enters the public site's git history or build artifacts
- Content editors can use GitHub's familiar interface to manage documents
- Fine-grained access control via GitHub's PAT permissions
- Server-side only — secrets never exposed to clients
- Works with Astro's SSR mode for runtime fetching

---

## Problem Statement

Investment firms and other organizations need to:
- Share confidential documents (memos, decks, financials) with authorized viewers
- Allow non-technical team members to edit content without deploying code
- Keep sensitive content out of public git repositories and static builds
- Maintain audit trails of who accessed what content

**Traditional solutions** (databases, CMS platforms) add complexity and cost. **This pattern** uses GitHub as a "headless CMS" for confidential content, leveraging existing infrastructure.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              User Request Flow                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Browser                    Astro SSR                  GitHub Private Repo  │
│   ───────                    ────────                   ───────────────────  │
│                                                                              │
│   /memos/Aito-v002-draft                                                     │
│          │                                                                   │
│          ▼                                                                   │
│   ┌─────────────┐                                                           │
│   │ Auth Check  │ ◄── Cookie: universal_portfolio_access                    │
│   │ (middleware)│                                                           │
│   └──────┬──────┘                                                           │
│          │ ✓ Authenticated                                                  │
│          ▼                                                                   │
│   ┌─────────────────┐                                                       │
│   │ [slug].astro    │                                                       │
│   │ (SSR page)      │                                                       │
│   └────────┬────────┘                                                       │
│            │                                                                 │
│            ▼                                                                 │
│   ┌─────────────────────┐                                                   │
│   │ fetchMemoBySlug()   │                                                   │
│   │                     │                                                   │
│   │ 1. Check PAT config │                                                   │
│   │ 2. Derive path      │                                                   │
│   │ 3. Check cache      │                                                   │
│   └──────────┬──────────┘                                                   │
│              │                                                               │
│              ▼                                                               │
│   ┌─────────────────────┐         ┌────────────────────────────────┐       │
│   │ deriveGitHubPath()  │         │  lossless-group/               │       │
│   │                     │         │  hypernova-secure-data         │       │
│   │ Aito-v002-draft     │         │                                │       │
│   │        ↓            │         │  deals/                        │       │
│   │ deals/Aito/outputs/ │ ──────► │    └── Aito/                   │       │
│   │ Aito-v0.0.2/        │  HTTPS  │        └── outputs/            │       │
│   │ Aito-v0.0.2-draft.md│  + PAT  │            └── Aito-v0.0.2/    │       │
│   └─────────────────────┘         │                └── *.md        │       │
│              │                     └────────────────────────────────┘       │
│              ▼                                                               │
│   ┌─────────────────────┐                                                   │
│   │ parseFrontmatter()  │                                                   │
│   │ Cache result (5min) │                                                   │
│   └──────────┬──────────┘                                                   │
│              │                                                               │
│              ▼                                                               │
│   ┌─────────────────────┐                                                   │
│   │ Render markdown     │                                                   │
│   │ Return HTML         │                                                   │
│   └─────────────────────┘                                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Guide

### 1. Create the GitHub Content Library

Create `src/lib/github-content.ts`:

```typescript
/**
 * GitHub Content Fetcher
 *
 * Fetches markdown content from a private GitHub repository at runtime.
 * Keeps confidential content out of deployed static assets.
 */

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com';

export interface GitHubContentResult {
  content: string;
  sha: string;
  lastModified?: string;
}

// In-memory cache (5 minutes)
const contentCache = new Map<string, { data: GitHubContentResult; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getConfig() {
  const pat = import.meta.env.GITHUB_CONTENT_PAT;
  return {
    pat,
    owner: import.meta.env.GITHUB_CONTENT_OWNER || 'your-org',
    repo: import.meta.env.GITHUB_CONTENT_REPO || 'your-secure-repo',
    branch: import.meta.env.GITHUB_CONTENT_BRANCH || 'main',
    useLocalFallback: !pat || pat === '',
  };
}

export function isLocalDemoMode(): boolean {
  return getConfig().useLocalFallback;
}

export async function fetchGitHubContent(path: string): Promise<GitHubContentResult | null> {
  const config = getConfig();

  if (config.useLocalFallback) {
    // Fall back to local files for development
    return fetchLocalContent(path);
  }

  // Check cache
  const cacheKey = `${config.owner}/${config.repo}/${config.branch}/${path}`;
  const cached = contentCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const rawUrl = `${GITHUB_RAW_BASE}/${config.owner}/${config.repo}/${config.branch}/${path}`;

  const response = await fetch(rawUrl, {
    headers: {
      Authorization: `token ${config.pat}`,
      Accept: 'application/vnd.github.raw',
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const content = await response.text();
  const result = { content, sha: '', lastModified: response.headers.get('last-modified') || undefined };

  // Cache the result
  contentCache.set(cacheKey, { data: result, expires: Date.now() + CACHE_TTL_MS });

  return result;
}
```

### 2. URL Slug to GitHub Path Conversion

The key insight: **URL slugs can't contain dots** (they break routing), but GitHub files use semantic versioning with dots.

```typescript
/**
 * Convert URL-safe version (v002) to dotted version (v0.0.2)
 */
function urlVersionToDotted(urlVersion: string): string {
  const digits = urlVersion.slice(1); // "002" → "0.0.2"
  if (digits.length === 3) {
    return `v${digits[0]}.${digits[1]}.${digits[2]}`;
  }
  return urlVersion;
}

/**
 * Derive GitHub path from URL slug
 *
 * URL: /memos/Aito-v002-draft
 * GitHub: deals/Aito/outputs/Aito-v0.0.2/Aito-v0.0.2-draft.md
 */
export function deriveGitHubPathFromSlug(slug: string, baseDir = 'deals'): string {
  // Pattern: {Company}-v{3digits}-{suffix}
  const match = slug.match(/^(.+?)-(v\d{3})(-.*)?$/);

  if (match) {
    const company = match[1];           // "Aito"
    const urlVersion = match[2];        // "v002"
    const suffix = match[3] || '';      // "-draft"

    const dottedVersion = urlVersionToDotted(urlVersion);  // "v0.0.2"
    const githubSlug = `${company}-${dottedVersion}${suffix}`;
    const versionDir = `${company}-${dottedVersion}`;

    return `${baseDir}/${company}/outputs/${versionDir}/${githubSlug}.md`;
  }

  return `${baseDir}/${slug}.md`;
}
```

### 3. Configure Environment Variables

```bash
# .env (local development)
GITHUB_CONTENT_PAT=github_pat_xxxxxxxxxxxx
GITHUB_CONTENT_OWNER=lossless-group
GITHUB_CONTENT_REPO=hypernova-secure-data
GITHUB_CONTENT_BRANCH=main
```

**For production (Vercel):**
- Settings → Environment Variables
- Add all four variables
- Redeploy

### 4. Create the SSR Page

```astro
---
// src/pages/memos/[slug].astro
import { fetchMemoBySlug, isLocalDemoMode } from '@lib/github-content';

export const prerender = false;  // REQUIRED for runtime fetching

// Auth check
const accessCookie = Astro.cookies.get('universal_portfolio_access');
if (!accessCookie?.value) {
  return Astro.redirect(`/portfolio-gate?redirect=${Astro.url.pathname}`);
}

const { slug } = Astro.params;
const memo = await fetchMemoBySlug(slug);

if (!memo) {
  return Astro.redirect('/portfolio?error=memo-not-found');
}

const { frontmatter, body } = memo;
---

<Layout title={frontmatter?.title ?? 'Memo'}>
  {isLocalDemoMode() && (
    <div class="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-center text-amber-600">
      <strong>Local Demo Mode</strong> — Content loaded from local files.
    </div>
  )}

  <article set:html={body} />
</Layout>
```

### 5. Add TypeScript Path Alias

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@lib/*": ["src/lib/*"]
    }
  }
}
```

---

## GitHub Repository Structure

The private repository should follow this structure:

```
hypernova-secure-data/
├── deals/
│   ├── Aito/
│   │   └── outputs/
│   │       ├── Aito-v0.0.1/
│   │       │   └── Aito-v0.0.1-draft.md
│   │       └── Aito-v0.0.2/
│   │           └── Aito-v0.0.2-draft.md
│   ├── Harmonic/
│   │   └── outputs/
│   │       └── Harmonic-v0.0.3/
│   │           └── Harmonic-v0.0.3-draft.md
│   └── [CompanyName]/
│       └── outputs/
│           └── [CompanyName]-v[X.Y.Z]/
│               └── [CompanyName]-v[X.Y.Z]-[suffix].md
```

**Naming Convention:**
- Company folders: `PascalCase` or `kebab-case`
- Version folders: `{Company}-v{major}.{minor}.{patch}`
- Files: `{Company}-v{major}.{minor}.{patch}-{suffix}.md`

---

## Generating a Fine-Grained PAT

1. Go to: https://github.com/settings/tokens?type=beta
2. Click "Generate new token"
3. Configure:
   - **Name:** `hypernova-content-read`
   - **Expiration:** 90 days (set calendar reminder!)
   - **Resource owner:** Select your organization
   - **Repository access:** "Only select repositories" → choose your secure repo
   - **Permissions:** Contents → Read-only
4. Generate and copy the token

**Security Notes:**
- PAT only needs `Contents: Read-only` on ONE repository
- Never commit the PAT to git
- Rotate before expiration
- For organizations, admin may need to enable fine-grained PATs

---

## Local Development Mode

When `GITHUB_CONTENT_PAT` is empty or not set, the system falls back to local files:

```
src/content/markdown-memos/
├── Aito-v0.0.2-draft.md
├── Harmonic-v0.0.3-draft.md
└── ...
```

**Indicators:**
- Yellow banner: "Local Demo Mode — Content loaded from local files"
- Server logs: `[memos] LOCAL DEMO MODE - fetching from src/content/markdown-memos/`

**Note:** Add local test files to `.gitignore` to prevent accidental commits:
```
src/content/markdown-memos/
```

---

## Caching Strategy

The library implements a simple in-memory cache:

| Setting | Value | Rationale |
|---------|-------|-----------|
| TTL | 5 minutes | Balance between freshness and API rate limits |
| Storage | In-memory Map | Simple, no external dependencies |
| Key | `owner/repo/branch/path` | Unique per file |

**Limitations:**
- Cache is per-server-instance (not shared across Vercel functions)
- Cache clears on server restart

**Future improvements:**
- Consider Vercel KV for shared cache
- Add cache-busting endpoint for immediate updates

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| PAT exposure | Server-side only; never sent to client |
| Token scope | Read-only access to single repository |
| Auth bypass | SSR page checks cookie before fetching |
| Content leakage | Content never in static build artifacts |
| Token rotation | Set expiration reminders; easy to update env var |

---

## Comparison with Alternatives

| Approach | Pros | Cons |
|----------|------|------|
| **GitHub Raw API (this pattern)** | Simple, no infra, familiar editing | Rate limits, PAT management |
| **CMS (Contentful, Sanity)** | Rich editing, webhooks | Cost, complexity, another system |
| **Database (Supabase, Postgres)** | Full control, real-time | Requires backend, migrations |
| **S3 + Signed URLs** | Scalable, time-limited access | AWS complexity, cold storage |

**This pattern is ideal when:**
- Content editors are comfortable with GitHub
- Document volume is moderate (< 1000 files)
- You want minimal infrastructure
- Markdown is the primary format

---

## Troubleshooting

### "Memo not found" error

1. Check server logs for the derived path
2. Verify file exists in GitHub at that exact path
3. Check PAT has access to the repository
4. Verify branch name matches `GITHUB_CONTENT_BRANCH`

### "Local Demo Mode" showing in production

1. Verify `GITHUB_CONTENT_PAT` is set in Vercel env vars
2. Redeploy after adding env vars
3. Check for typos in variable names

### 401/403 errors

1. PAT may have expired — generate a new one
2. Organization may have revoked PAT access
3. Repository permissions may have changed

### Rate limiting

1. GitHub allows 5000 requests/hour with PAT
2. If hitting limits, increase cache TTL
3. Consider implementing request queuing

---

## Related Patterns

- **Confidential-Content-Access-Control-Blueprint.md** — Authentication layer (passcode gate)
- **Dynamic-Webpage-to-Display-Portfolio-w-Authentication.md** — Portfolio page implementation

---

## Changelog

| Date | Change |
|------|--------|
| 2024-12-12 | Initial implementation in hypernova-site |
| 2024-12-12 | Added URL version conversion (v002 → v0.0.2) |
| 2024-12-12 | Added local demo mode fallback |
