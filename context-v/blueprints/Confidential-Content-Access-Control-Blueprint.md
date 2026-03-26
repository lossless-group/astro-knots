---
title: "Confidential Content Access Control Blueprint"
lede: "A tiered pattern for protecting privileged or confidential content across astro-knots sites, from simple passcodes to full OAuth integration."
date_created: 2024-12-01
date_modified: 2024-12-15
status: Published
category: Blueprints
tags: [authentication, access-control, confidential-content, security, portfolio]
authors:
  - Michael Staton
---

# Confidential Content Access Control Blueprint

> **Status:** Implemented (Tier 1) in hypernova-site | Tier 1.5 in dark-matter
> **Target Sites:** hypernova-site (complete), dark-matter (in progress), all sites (eventual)
> **Author:** AI-assisted
> **Created:** December 2024
> **Last Updated:** December 2024

---

## Implementation Status

### Hypernova-site (Reference Implementation)
- **Tier 1 Passcode Gate:** ✅ Complete
- **Confidential Portfolio View:** ✅ Complete with LP Commits & Direct Investments
- **GitHub Memo Integration:** ✅ Complete with local fallback mode
- **UI Components:** ✅ AuthenticationStatus, AuthenticationModal, Button--AccessConfidentialInfo
- **Grid Components:** ✅ LogoGrid--ConfidentialAccess, LogoCardExpanded--ConfidentialAccess

### Dark-matter (Tier 1.5 with NocoDB)
- **Tier 1 Passcode Gate:** ✅ Complete
- **Tier 1.5 Email + Domain Auth:** ✅ Complete with NocoDB session tracking
- **NocoDB Integration:** ✅ Email access table with session tracking
- **Confidential Portfolio View:** ✅ Complete
- **GitHub Memo Integration:** ✅ Complete

## Executive Summary

This blueprint proposes a pattern for protecting privileged or confidential content across astro-knots sites. The solution must:

1. **Respect site independence** — each site deploys from its own repo without shared auth infrastructure
2. **Be copyable** — patterns extracted to `@knots/auth-patterns` for reuse
3. **Avoid traditional databases** — leverage Astro's static-first architecture
4. **Provide tiered access** — from simple passcodes to full OAuth/Clerk integration
5. **Support domain-based auto-authorization** — e.g., `@hypernova.capital` emails get automatic access
6. Anticipate **User and Organization Interest Metric** such as click through rates, time to click from email send, time on site, links clicked, time in files, etc.  

---

## Glossary

| Term | Definition |
|------|------------|
| **KV (Key-Value store)** | A simple database type that stores data as key-value pairs (like a dictionary). Used here for lightweight, serverless storage of tokens and session data. Examples: Upstash Redis, Vercel KV, Cloudflare KV. These are NOT traditional databases — they're fast, edge-deployed stores ideal for temporary data like magic link tokens. |
| **Magic Link** | A one-time-use URL sent via email that authenticates a user when clicked. No password required — the link itself proves email ownership. |
| **Middleware** | Code that runs between a request arriving and your page rendering. Used to check authentication before allowing access to protected routes. |
| **Session Cookie** | A browser cookie that stores authentication state. Marked `httpOnly` (JavaScript can't read it) and `secure` (only sent over HTTPS) for security. |
| **Domain Allowlist** | A list of email domains (e.g., `@hypernova.capital`) that are automatically granted access without additional verification. |
| **CSRF** | Cross-Site Request Forgery — an attack where malicious sites trick users into submitting forms. Prevented with tokens and `sameSite` cookies. |
| **OAuth** | Open Authorization — a standard protocol allowing users to log in via third-party providers (Google, GitHub, etc.) without sharing passwords. |
| **Clerk** | A managed authentication service that handles user accounts, sessions, and security. Provides drop-in components for Astro. |

---

## Problem Statement

Currently, all content in astro-knots sites have all content publically accessible, however we are supporting private investment firms that have a need to maintain confidentiality in a large number of edge cases. There is no mechanism to:

- Gate investor decks, financial documents, or strategy content
- Gate a reveal/hide of confidential data such as investment amount, valuation, ownership percentage, etc in components such as a PortfolioCompanyCard
- Verify viewer identity before revealing sensitive information
- Track who accessed confidential content, with anticipation for helpful metrics like time on site, downloads, links etc.
- Allow sanctioned email domains automatic access, thus allowing any number of people to have confidential access from a single organization that has already signed appropriate non-disclosure agreements.
- Provide time-limited access links (like DocSend)

---

## Proposed Solutions (Tiered Approach)

We recommend implementing three tiers, allowing each site to choose the appropriate level:

| Tier | Complexity | Features | Database Required | Best For |
|------|------------|----------|-------------------|----------|
| **Tier 1: Passcode Gate** | Low | Simple passcode, email capture, session storage | No | Quick protection, low-stakes content |
| **Tier 2: Email Verification** | Medium | Magic links, domain allowlists | Optional (can use KV) | Domain-based access, audit trail |
| **Tier 3: Full Auth (Clerk/OAuth)** | High | User accounts, roles, persistent sessions | Yes (Clerk manages) | Multi-role access, full audit, long-term |

---

## Tier 1: Passcode Gate (DocSend-style)

### Overview

A lightweight solution similar to DocSend's passcode feature. No accounts, no database — just a shared secret along with an email request that unlocks content for a browser session.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Astro Site                                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ Public Pages │    │ Gate Page    │    │ Protected Pages  │  │
│  │              │───▶│ (passcode)   │───▶│ (confidential)   │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
│                              │                     ▲            │
│                              ▼                     │            │
│                      ┌──────────────┐              │            │
│                      │ Session      │──────────────┘            │
│                      │ Storage      │                           │
│                      │ (cookie)     │                           │
│                      └──────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Details

#### 1. Environment Configuration

```bash
# .env
PASSCODE_HASH=<bcrypt hash of passcode>
PASSCODE_SALT=<random salt for session tokens>
```

#### 2. Content Collection Schema Extension

```typescript
// src/content/config.ts
const confidentialDocs = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    accessLevel: z.enum(['public', 'passcode', 'verified', 'admin']).default('public'),
    passcodeHint: z.string().optional(), // "Contact hello@hypernova.capital"
    expiresAt: z.date().optional(), // Time-limited access
  }),
});
```

#### 3. Gate Page Component

```astro
---
// src/pages/gate/[...slug].astro
import { getCollection } from 'astro:content';

const { slug } = Astro.params;
const doc = await getCollection('confidential-docs').find(d => d.slug === slug);

// Check if already authenticated via cookie
const authCookie = Astro.cookies.get('conf_access');
const isAuthenticated = authCookie?.value === expectedToken;

if (isAuthenticated) {
  return Astro.redirect(`/confidential/${slug}`);
}
---

<Layout title="Access Required">
  <div class="gate-container">
    <h1>This content requires a passcode</h1>
    <p>{doc?.data.passcodeHint || 'Contact us for access'}</p>

    <form method="POST" action="/api/verify-passcode">
      <input type="hidden" name="redirect" value={`/confidential/${slug}`} />
      <input
        type="password"
        name="passcode"
        placeholder="Enter passcode"
        autocomplete="off"
      />
      <button type="submit">Access Content</button>
    </form>
  </div>
</Layout>
```

#### 4. Verification API Route

```typescript
// src/pages/api/verify-passcode.ts
import type { APIRoute } from 'astro';
import { createHash } from 'crypto';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const passcode = formData.get('passcode') as string;
  const redirectTo = formData.get('redirect') as string;

  // Hash and compare
  const hash = createHash('sha256')
    .update(passcode + import.meta.env.PASSCODE_SALT)
    .digest('hex');

  if (hash === import.meta.env.PASSCODE_HASH) {
    // Set session cookie (httpOnly, secure, sameSite)
    const sessionToken = createHash('sha256')
      .update(Date.now().toString() + import.meta.env.PASSCODE_SALT)
      .digest('hex');

    cookies.set('conf_access', sessionToken, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return redirect(redirectTo || '/confidential');
  }

  return redirect(`/gate${redirectTo}?error=invalid`);
};
```

#### 5. Protected Page Middleware

```typescript
// src/middleware.ts (Astro middleware)
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async ({ url, cookies, redirect }, next) => {
  // Only protect /confidential/* routes
  if (url.pathname.startsWith('/confidential')) {
    const authCookie = cookies.get('conf_access');

    if (!authCookie?.value) {
      const slug = url.pathname.replace('/confidential/', '');
      return redirect(`/gate/${slug}`);
    }
  }

  return next();
});
```

#### 6. Concrete Implementation: Hypernova Portfolio (Universal Passcode + Confidential Page)

The Hypernova site implements Tier 1 as a **universal/general portfolio passcode** that protects a single **confidential portfolio view** while keeping the public portfolio index and company pages fully accessible.

**Key routes and concepts:**

- **Public portfolio index & detail pages**
  - `/portfolio` – LP-friendly index of portfolio companies.
  - `/portfolio/[slug]` – public detail pages for each company.
- **Confidential portfolio view (SSR-only)**
  - `/portfolio/confidential` – server-rendered page with sensitive, LP-only information.
  - `/portfolio/confidential/no-access.astro` – fallback page for unauthorized access attempts.
- **Confidential memos (SSR-only)**
  - `/memos/[slug]` – investment memos fetched from private GitHub repo.
- **Universal/general portfolio passcode gate**
  - `/portfolio-gate` – passcode collection page.
  - `/api/verify-portfolio-passcode` – API route that validates the passcode and sets a session cookie.

**Complete file structure (hypernova-site):**

```
src/
├── pages/
│   ├── api/
│   │   └── verify-portfolio-passcode.ts    # Passcode verification endpoint
│   ├── portfolio/
│   │   ├── index.astro                     # Public portfolio list
│   │   ├── [slug].astro                    # Public company detail pages
│   │   └── confidential/
│   │       ├── index.astro                 # Protected confidential portfolio view
│   │       └── no-access.astro             # Access denied fallback
│   ├── memos/
│   │   └── [slug].astro                    # Protected investment memos
│   └── portfolio-gate.astro                # Passcode entry page
├── middleware.ts                           # Route protection middleware
├── lib/
│   └── github-content.ts                   # GitHub content fetching + caching
├── components/
│   ├── ui/
│   │   ├── AuthenticationStatus.astro      # Auth level indicator chip
│   │   └── AuthenticationModal.astro       # Inline passcode form modal
│   ├── buttons/
│   │   └── Button--AccessConfidentialInfo.astro  # Wrapper for modal
│   └── basics/grids/grid-cards/
│       ├── LogoGrid--ConfidentialAccess.astro    # Grid for confidential portfolio
│       └── LogoCardExpanded--ConfidentialAccess.astro  # Expandable card with memo links
└── content/
    ├── portfolio/
    │   ├── lpcommits-portfolio.json        # LP commitments data
    │   └── directs-portfolio.json          # Direct investments data
    └── markdown-memos/                     # Local fallback memo content
        └── *.md                            # Investment memo markdown files
```

**Environment configuration (Hypernova):**

```bash
# .env (Hypernova)

# Universal / general access passcode for portfolio gate
# Option 1: Plaintext (simpler for development/rotation)
UNIVERSAL_PORTFOLIO_PASSCODE_PLAINTEXT=HYPER2025!

# Option 2: Hashed (production hardening)
UNIVERSAL_PORTFOLIO_PASSCODE_SALT=dffbeec15f938c0659fd11909df6e044
UNIVERSAL_PORTFOLIO_PASSCODE_HASH=194dbb229e5553a8a1a2509dc42bb02bb1c8df09078b090475803211bc723898

# GitHub Content Repository (for confidential memos)
GITHUB_CONTENT_PAT=github_pat_xxxxx  # Fine-grained PAT with Contents: Read-only
GITHUB_CONTENT_OWNER=lossless-group
GITHUB_CONTENT_REPO=hypernova-secure-data
GITHUB_CONTENT_BRANCH=main
```

**Note:** The verification API checks for `PASSCODE_PLAINTEXT` first. If set, plaintext comparison is used. Otherwise, SHA256 hash comparison with salt is used. This allows flexibility between easy rotation (plaintext) and production security (hashed).

**Verification API:**

```ts
// src/pages/api/verify-portfolio-passcode.ts
import type { APIRoute } from 'astro';
import { createHash, randomBytes } from 'crypto';

export const prerender = false;

const PASSCODE_HASH = import.meta.env.UNIVERSAL_PORTFOLIO_PASSCODE_HASH;
const PASSCODE_SALT = import.meta.env.UNIVERSAL_PORTFOLIO_PASSCODE_SALT;
const PASSCODE_PLAINTEXT = import.meta.env.UNIVERSAL_PORTFOLIO_PASSCODE_PLAINTEXT;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  if (!PASSCODE_PLAINTEXT && (!PASSCODE_HASH || !PASSCODE_SALT)) {
    return new Response('Universal portfolio passcode not configured', { status: 500 });
  }

  const contentType = request.headers.get('content-type') || '';
  if (
    !contentType.includes('multipart/form-data') &&
    !contentType.includes('application/x-www-form-urlencoded')
  ) {
    return redirect('/portfolio-gate?error=invalid');
  }

  const formData = await request.formData();
  const passcode = (formData.get('passcode') as string | null) ?? '';
  const redirectTo = (formData.get('redirect') as string | null) || '/portfolio';

  if (!passcode) {
    return redirect(`/portfolio-gate?error=invalid&redirect=${encodeURIComponent(redirectTo)}`);
  }

  let valid = false;

  if (PASSCODE_PLAINTEXT) {
    valid = passcode === PASSCODE_PLAINTEXT;
  } else {
    const hash = createHash('sha256')
      .update(passcode + PASSCODE_SALT)
      .digest('hex');

    valid = hash === PASSCODE_HASH;
  }

  if (!valid) {
    return redirect(`/portfolio-gate?error=invalid&redirect=${encodeURIComponent(redirectTo)}`);
  }

  // Once-per-session cookie for all portfolio routes
  const sessionToken = createHash('sha256')
    .update(randomBytes(32).toString('hex') + (PASSCODE_SALT || ''))
    .digest('hex');

  cookies.set('universal_portfolio_access', sessionToken, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/portfolio',   // applies to /portfolio and /portfolio/*
  });

  return redirect(redirectTo || '/portfolio');
};
```

**Middleware (Hypernova):**

```ts
// src/middleware.ts (Hypernova)
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async ({ url, cookies, redirect }, next) => {
  const pathname = url.pathname;

  // Protect confidential portfolio view AND investment memos
  // Note: Public /portfolio and /portfolio/[slug] remain accessible
  if (pathname.startsWith('/portfolio/confidential') || pathname.startsWith('/memos')) {
    const accessCookie = cookies.get('universal_portfolio_access');

    if (!accessCookie?.value) {
      const redirectPath = encodeURIComponent(pathname + (url.search || ''));
      return redirect(`/portfolio-gate?redirect=${redirectPath}`);
    }
  }

  return next();
});
```

**Portfolio Gate Page:**

```astro
---
// src/pages/portfolio-gate.astro
import BaseThemeLayout from '@layouts/BaseThemeLayout.astro';

export const prerender = false;

const redirect = Astro.url.searchParams.get('redirect') ?? '/portfolio';
const error = Astro.url.searchParams.get('error');
---
<BaseThemeLayout title="Portfolio Access">
  <section class="min-h-screen flex items-center justify-center px-6">
    <div class="max-w-md w-full space-y-6 text-center">
      <h1 class="text-2xl font-semibold">Enter Passcode</h1>
      <p class="text-sm text-foreground/70">
        This content is protected. Enter the passcode to access confidential portfolio information.
      </p>

      {error === 'invalid' && (
        <p class="text-red-500 text-sm">Invalid passcode. Please try again.</p>
      )}

      <form method="POST" action="/api/verify-portfolio-passcode" class="space-y-4">
        <input type="hidden" name="redirect" value={redirect} />
        <input
          type="password"
          name="passcode"
          placeholder="Enter passcode"
          autocomplete="off"
          class="w-full px-4 py-2 border rounded"
          required
        />
        <button
          type="submit"
          class="w-full bg-primary text-primary-foreground py-2 rounded font-medium"
        >
          Access Content
        </button>
      </form>

      <p class="text-xs text-foreground/60">
        Don't have a passcode? <a href="/contact" class="underline">Contact us</a>
      </p>
    </div>
  </section>
</BaseThemeLayout>
```

**Confidential portfolio page (SSR-only):**

```astro
---
// src/pages/portfolio/confidential.astro
import BaseThemeLayout from '@layouts/BaseThemeLayout.astro';
import AuthenticationStatus from '@components/ui/AuthenticationStatus.astro';

// This page is intentionally server-rendered only.
export const prerender = false;

const accessCookie = Astro.cookies.get('universal_portfolio_access');
const authLevel = accessCookie?.value ? 'general-passcode' : 'unauthenticated';
---
<BaseThemeLayout
  title="Confidential Portfolio View"
  description="Confidential portfolio information for authorized viewers."
>
  <section class="px-6 py-12">
    <div class="max-w-4xl mx-auto space-y-6">
      <header>
        <h1 class="text-3xl font-semibold tracking-tight">Confidential Portfolio View</h1>
        <p class="mt-3 text-sm text-foreground/80 max-w-2xl">
          This area contains confidential portfolio information available only to viewers who
          have been granted access via the general portfolio passcode.
        </p>
      </header>

      <AuthenticationStatus level={authLevel} />

      <!-- Confidential content blocks go here -->
    </div>
  </section>
</BaseThemeLayout>
```

**Authentication status chip:**

```astro
---
// src/components/ui/AuthenticationStatus.astro
export interface Props {
  /**
   * Current authentication level for the viewer.
   * - "unauthenticated" – no general portfolio passcode has been validated
   * - "general-passcode" – viewer has passed the universal portfolio passcode gate
   */
  level: 'unauthenticated' | 'general-passcode';
}

const { level } = Astro.props;

const labelMap = {
  'unauthenticated': 'Unauthenticated',
  'general-passcode': 'General passcode',
} as const;
---
<div class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border-emerald-500/40">
  <span class="inline-block h-1.5 w-1.5 rounded-full bg-current"></span>
  <span>Auth: {labelMap[level]}</span>
</div>
```

**Authentication modal and button pattern:**

```astro
---
// src/components/ui/AuthenticationModal.astro
import AuthenticationStatus from './AuthenticationStatus.astro';

export interface Props {
  /** Where to send the user after successful authentication (before redirecting to confidential). */
  redirect?: string;
}

const { redirect } = Astro.props;
const baseRedirect = redirect ?? '/portfolio';
const target = baseRedirect.includes('?')
  ? `${baseRedirect}&auth=success`
  : `${baseRedirect}?auth=success`;
---
<div class="relative inline-flex items-center gap-3">
  <AuthenticationStatus level="unauthenticated" />

  <details class="group">
    <summary class="list-none inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-[11px] font-medium tracking-wide uppercase cursor-pointer hover:bg-background">
      <span class="inline-block h-1.5 w-1.5 rounded-full bg-amber-400"></span>
      <span>Enter general access passcode</span>
    </summary>

    <div class="absolute z-30 mt-2 w-80 rounded-lg border border-border/70 bg-background/95 p-4 shadow-xl backdrop-blur">
      <form method="POST" action="/api/verify-portfolio-passcode" class="space-y-3">
        <!-- On success, API will redirect to baseRedirect?auth=success -->
        <input type="hidden" name="redirect" value={target} />

        <!-- passcode input omitted for brevity -->

        <div class="flex items-center justify-between gap-2">
          <button type="submit" class="inline-flex items-center justify-center rounded bg-primary px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground hover:opacity-90">
            Unlock
          </button>

          <button
            type="button"
            class="text-[11px] text-foreground/70 hover:text-foreground/90"
            on:click={(event) => {
              const details = (event.currentTarget as HTMLElement).closest('details');
              if (details) (details as HTMLDetailsElement).open = false;
            }}
          >
            Cancel
          </button>
        </div>

        <p class="mt-2 text-[11px] text-foreground/70">
          <button
            type="button"
            class="underline hover:text-foreground"
            onclick="window.location.href='/'"
          >
            Oops, I don't have credentials for confidential information. Take me back to the site.
          </button>
        </p>
      </form>
    </div>
  </details>
</div>

<script>
  (function () {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('auth') === 'success') {
        setTimeout(() => {
          window.location.href = '/portfolio/confidential';
        }, 3000);
      }
    } catch (_) {
      // no-op in non-browser environments
    }
  })();
</script>
```

**Button wrapper used in portfolio card detail view:**

```astro
---
// src/components/buttons/Button--AccessConfidentialInfo.astro
import AuthenticationModal from '../ui/AuthenticationModal.astro';

export interface Props {
  redirect?: string;
}

const { redirect } = Astro.props;
---
<AuthenticationModal redirect={redirect ?? '/portfolio'} />
```

**Placement inside expanded portfolio card:**

```astro
// src/components/basics/grids/grid-cards/LogoCardExpanded--Detail-1.astro (excerpt)
<div class="mt-6 flex justify-end">
  <ButtonAccessConfidentialInfo redirect="/portfolio" />
</div>
```

This pattern yields:

- Public `/portfolio` and `/portfolio/[slug]` views for all visitors.
- A single **universal/general portfolio passcode** protecting `/portfolio/confidential`.
- A once-per-session cookie (`universal_portfolio_access`) granting access to all portfolio routes.
- A reusable **AuthenticationStatus** chip and **AuthenticationModal** / **Button--AccessConfidentialInfo** UX that can be copied to other sites.

### Private GitHub Repository as Content Source (Raw API)

For confidential markdown content (memos, investor updates, strategy docs), a **private GitHub repository** can serve as a secure content backend. This approach keeps confidential content entirely out of the deployed site's static assets — content is fetched at runtime via GitHub's Raw Content API only when an authenticated user requests it.

#### Why Private GitHub Repo?

| Advantage | Description |
|-----------|-------------|
| **Zero static exposure** | Content never exists in the deployed bundle or `public/` folder |
| **Version control** | Full git history, branching, PRs for content updates |
| **Access management** | GitHub's fine-grained PATs or GitHub Apps control API access |
| **Free tier** | Generous API limits (5,000 requests/hour with PAT) |
| **Familiar workflow** | Content authors use GitHub or prose.io to edit markdown |
| **Works with SSR** | Fetched server-side, never exposed to client |

#### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Astro Site (SSR)                              │
│  ┌──────────────┐    ┌──────────────┐    ┌────────────────────┐    │
│  │ Auth Gate    │    │ SSR Page     │    │ GitHub Raw API     │    │
│  │ (Tier 1/2)   │───▶│ /memos/[slug]│───▶│ Fetch content      │    │
│  └──────────────┘    └──────────────┘    └────────────────────┘    │
│                              │                      │               │
│                              ▼                      ▼               │
│                      ┌──────────────┐      ┌──────────────────┐    │
│                      │ Render MD    │      │ Private GitHub   │    │
│                      │ to HTML      │      │ Repo (content)   │    │
│                      └──────────────┘      └──────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

#### Implementation

##### 1. Environment Configuration

```bash
# .env
# Fine-grained PAT with read-only access to the private repo
GITHUB_CONTENT_PAT=github_pat_xxxxx

# Repository details
GITHUB_CONTENT_OWNER=hypernova-capital
GITHUB_CONTENT_REPO=confidential-content
GITHUB_CONTENT_BRANCH=main
```

##### 2. GitHub Content Fetcher (Actual Implementation)

The hypernova-site implementation includes a sophisticated GitHub content fetching library with:
- **Caching:** 5-minute in-memory cache to reduce API calls
- **Slug-to-path derivation:** Converts URL-safe slugs to GitHub file paths
- **Local fallback mode:** Works without GitHub PAT for development
- **Frontmatter parsing:** Extracts YAML frontmatter from markdown

```typescript
// src/lib/github-content.ts (simplified reference)
interface GitHubContentOptions {
  owner?: string;
  repo?: string;
  branch?: string;
  path: string;
}

interface GitHubContentResult {
  content: string;
  sha: string;
  lastModified?: string;
}

// In-memory cache with 5-minute TTL
const contentCache = new Map<string, { data: GitHubContentResult; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com';

// Check if running in local demo mode (no PAT configured)
export function isLocalDemoMode(): boolean {
  return !import.meta.env.GITHUB_CONTENT_PAT;
}

export async function fetchGitHubContent(
  options: GitHubContentOptions
): Promise<GitHubContentResult | null> {
  const {
    owner = import.meta.env.GITHUB_CONTENT_OWNER,
    repo = import.meta.env.GITHUB_CONTENT_REPO,
    branch = import.meta.env.GITHUB_CONTENT_BRANCH || 'main',
    path,
  } = options;

  const pat = import.meta.env.GITHUB_CONTENT_PAT;
  if (!pat) {
    console.warn('[github-content] No PAT configured, using local fallback');
    return null;
  }

  // Check cache first
  const cacheKey = `${owner}/${repo}/${branch}/${path}`;
  const cached = contentCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const rawUrl = `${GITHUB_RAW_BASE}/${owner}/${repo}/${branch}/${path}`;

  try {
    const response = await fetch(rawUrl, {
      headers: {
        Authorization: `token ${pat}`,
        Accept: 'application/vnd.github.raw',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`[github-content] Not found: ${path}`);
        return null;
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const content = await response.text();
    const result = {
      content,
      sha: response.headers.get('etag')?.replace(/"/g, '') || '',
      lastModified: response.headers.get('last-modified') || undefined,
    };

    // Cache the result
    contentCache.set(cacheKey, { data: result, expires: Date.now() + CACHE_TTL_MS });

    return result;
  } catch (error) {
    console.error(`[github-content] Failed to fetch ${path}:`, error);
    return null;
  }
}

/**
 * Derive GitHub file path from URL slug
 * Examples:
 *   Aito-v002-draft → deals/Aito/outputs/Aito-v0.0.2/Aito-v0.0.2-draft.md
 *   Class5-Global-v0.0.2-draft → deals/Class5-Global/outputs/Class5-Global-v0.0.2/Class5-Global-v0.0.2-draft.md
 */
export function deriveGitHubPathFromSlug(slug: string): string {
  // Handle URL-safe version format: v002 → v0.0.2
  const normalizedSlug = slug.replace(/v(\d)(\d)(\d)(-|$)/g, 'v$1.$2.$3$4');

  // Extract company name and version from slug
  const match = normalizedSlug.match(/^(.+)-(v\d+\.\d+\.\d+)(-\w+)?$/);
  if (!match) {
    return `memos/${slug}.md`; // Fallback path
  }

  const [, company, version, suffix = ''] = match;
  const fileName = `${company}-${version}${suffix}.md`;

  return `deals/${company}/outputs/${company}-${version}/${fileName}`;
}

/**
 * High-level function to fetch memo by URL slug
 */
export async function fetchMemoBySlug(slug: string): Promise<{
  content: string;
  frontmatter: Record<string, string>;
} | null> {
  // Try GitHub first
  if (!isLocalDemoMode()) {
    const path = deriveGitHubPathFromSlug(slug);
    const result = await fetchGitHubContent({ path });
    if (result) {
      return {
        content: result.content,
        frontmatter: parseFrontmatter(result.content),
      };
    }
  }

  // Fall back to local content
  return fetchLocalMemo(slug);
}

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const fm: Record<string, string> = {};
  match[1].split('\n').forEach(line => {
    const [key, ...values] = line.split(':');
    if (key && values.length) {
      fm[key.trim()] = values.join(':').trim().replace(/^["']|["']$/g, '');
    }
  });
  return fm;
}

async function fetchLocalMemo(slug: string): Promise<{ content: string; frontmatter: Record<string, string> } | null> {
  // Implementation reads from src/content/markdown-memos/
  // See hypernova-site for full implementation
  return null;
}
```

// Option B: Contents API (includes metadata, base64 encoded)
export async function fetchGitHubContentWithMeta(
  options: GitHubContentOptions
): Promise<GitHubContentResult | null> {
  const {
    owner = import.meta.env.GITHUB_CONTENT_OWNER,
    repo = import.meta.env.GITHUB_CONTENT_REPO,
    branch = import.meta.env.GITHUB_CONTENT_BRANCH || 'main',
    path,
  } = options;

  const pat = import.meta.env.GITHUB_CONTENT_PAT;
  if (!pat) return null;

  const apiUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `token ${pat}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    // Content is base64 encoded in the Contents API
    const content = Buffer.from(data.content, 'base64').toString('utf-8');

    return {
      content,
      sha: data.sha,
      lastModified: undefined, // Would need a separate commit API call
    };
  } catch (error) {
    console.error(`[github-content] Failed to fetch ${path}:`, error);
    return null;
  }
}
```

##### 3. List Available Content (Directory Listing)

```typescript
// src/lib/github-content.ts (continued)

interface GitHubFileEntry {
  name: string;
  path: string;
  sha: string;
  type: 'file' | 'dir';
}

export async function listGitHubDirectory(
  dirPath: string
): Promise<GitHubFileEntry[]> {
  const owner = import.meta.env.GITHUB_CONTENT_OWNER;
  const repo = import.meta.env.GITHUB_CONTENT_REPO;
  const branch = import.meta.env.GITHUB_CONTENT_BRANCH || 'main';
  const pat = import.meta.env.GITHUB_CONTENT_PAT;

  if (!pat) return [];

  const apiUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${dirPath}?ref=${branch}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `token ${pat}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!response.ok) return [];

    const data = await response.json();

    if (!Array.isArray(data)) return [];

    return data
      .filter((item: any) => item.type === 'file' && item.name.endsWith('.md'))
      .map((item: any) => ({
        name: item.name,
        path: item.path,
        sha: item.sha,
        type: item.type,
      }));
  } catch (error) {
    console.error(`[github-content] Failed to list ${dirPath}:`, error);
    return [];
  }
}
```

##### 4. SSR Page Using GitHub Content

```astro
---
// src/pages/memos/[slug].astro
import BaseThemeLayout from '@layouts/BaseThemeLayout.astro';
import { fetchGitHubContent } from '@lib/github-content';
import { marked } from 'marked';

export const prerender = false; // SSR only

// Check auth (Tier 1 or Tier 2)
const accessCookie = Astro.cookies.get('universal_portfolio_access');
if (!accessCookie?.value) {
  const redirectPath = encodeURIComponent(Astro.url.pathname);
  return Astro.redirect(`/portfolio-gate?redirect=${redirectPath}`);
}

const { slug } = Astro.params;

// Fetch from private GitHub repo
const result = await fetchGitHubContent({
  path: `memos/${slug}.md`,
});

if (!result) {
  return Astro.redirect('/memos?error=not-found');
}

// Parse frontmatter (simple approach)
const frontmatterMatch = result.content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
let frontmatter: Record<string, string> = {};
let body = result.content;

if (frontmatterMatch) {
  const fmLines = frontmatterMatch[1].split('\n');
  fmLines.forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      frontmatter[key.trim()] = valueParts.join(':').trim();
    }
  });
  body = frontmatterMatch[2];
}

const htmlContent = marked.parse(body);
const title = frontmatter.title || slug;
---

<BaseThemeLayout title={title}>
  <article class="max-w-4xl mx-auto px-6 py-12">
    <header class="mb-8">
      <h1 class="text-3xl font-semibold">{title}</h1>
      {frontmatter.date && (
        <p class="text-muted-foreground text-sm mt-2">{frontmatter.date}</p>
      )}
    </header>

    <div class="prose prose-lg" set:html={htmlContent} />
  </article>
</BaseThemeLayout>
```

##### 5. Index Page Listing Available Memos

```astro
---
// src/pages/memos/index.astro
import BaseThemeLayout from '@layouts/BaseThemeLayout.astro';
import { listGitHubDirectory, fetchGitHubContent } from '@lib/github-content';

export const prerender = false;

// Check auth
const accessCookie = Astro.cookies.get('universal_portfolio_access');
if (!accessCookie?.value) {
  return Astro.redirect('/portfolio-gate?redirect=/memos');
}

// List all memos from GitHub
const memoFiles = await listGitHubDirectory('memos');

// Optionally fetch frontmatter for each (can be slow with many files)
const memos = await Promise.all(
  memoFiles.map(async (file) => {
    const slug = file.name.replace('.md', '');
    // For performance, you might skip fetching full content here
    // and just use the filename as the title
    return {
      slug,
      title: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      path: `/memos/${slug}`,
    };
  })
);
---

<BaseThemeLayout title="Investment Memos">
  <section class="max-w-4xl mx-auto px-6 py-12">
    <h1 class="text-3xl font-semibold mb-8">Investment Memos</h1>

    <ul class="space-y-4">
      {memos.map((memo) => (
        <li>
          <a
            href={memo.path}
            class="block p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
          >
            <span class="text-lg font-medium text-foreground">{memo.title}</span>
          </a>
        </li>
      ))}
    </ul>
  </section>
</BaseThemeLayout>
```

##### 6. Private Repo Structure

```
hypernova-capital/confidential-content/
├── README.md (private repo docs)
├── memos/
│   ├── Class5-Global-v0.0.2-draft.md
│   ├── Ontra-v0.0.2-draft.md
│   └── ...
├── decks/
│   ├── fund-ii-overview.md
│   └── ...
└── updates/
    ├── 2025-q1-update.md
    └── ...
```

##### 7. Caching Strategy (Optional)

For better performance and to reduce API calls, add a simple cache layer:

```typescript
// src/lib/github-content.ts (with caching)
const contentCache = new Map<string, { data: GitHubContentResult; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function fetchGitHubContentCached(
  options: GitHubContentOptions
): Promise<GitHubContentResult | null> {
  const cacheKey = `${options.owner}/${options.repo}/${options.path}`;
  const cached = contentCache.get(cacheKey);

  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const result = await fetchGitHubContent(options);

  if (result) {
    contentCache.set(cacheKey, {
      data: result,
      expires: Date.now() + CACHE_TTL_MS,
    });
  }

  return result;
}
```

#### Security Properties

| Aspect | Behavior |
|--------|----------|
| **Static assets** | Confidential content never in `/public` or build output |
| **API token** | Server-side only, never exposed to browser |
| **Fine-grained PAT** | Scope to single repo with read-only access |
| **Rate limits** | 5,000 req/hour (authenticated), usually sufficient |
| **Audit** | GitHub provides API access logs for the PAT |

#### Pros & Cons

| Pros | Cons |
|------|------|
| Content never in static build | Requires SSR (`output: 'server'`) |
| Git version control | Slightly slower than local content |
| Familiar editing workflow | API rate limits (usually fine) |
| Free (within limits) | PAT rotation required periodically |
| Works with any Tier | Adds network dependency |

#### Fine-Grained PAT Setup

1. Go to **GitHub Settings > Developer settings > Personal access tokens > Fine-grained tokens**
2. Click **Generate new token**
3. Set:
   - **Token name**: `hypernova-site-content-reader`
   - **Expiration**: 90 days (set a calendar reminder to rotate)
   - **Repository access**: Select the private content repo only
   - **Permissions**: `Contents: Read-only`
4. Generate and copy to `.env` as `GITHUB_CONTENT_PAT`

#### When to Use This Pattern

- **Ideal for**: Investment memos, strategy documents, LP updates — content that changes occasionally and needs version history
- **Combine with**: Tier 1 (passcode) or Tier 2 (email verification) for the auth gate
- **Not ideal for**: Binary files (PDFs, images) — use Cloud Storage + Signed URLs instead

---

### Cloud Storage with Signed URLs (Confidential Attachments)

For truly confidential binary assets (e.g., investment memos as PDFs), static hosting via `public/` is not sufficient:

- Files under `public/` are served directly by the host/CDN.
- Middleware and cookies do **not** run before serving them.
- If someone knows or guesses the URL, they can retrieve the file, regardless of passcode/auth state.

To enforce access control on attachments, use **cloud storage + signed URLs**:

#### Pattern Overview

1. **Store attachments outside the app’s static assets**
   - Example: S3, GCS, Azure Blob, or another object store.
   - Files live at opaque, non-guessable keys, e.g.:
     - `s3://hypernova-memos/portfolio/<slug>/memo.pdf`

2. **Gate access via an Astro SSR/API route**
   - Create a route like:
     - `/api/memo-download/[slug]`
   - This route:
     - Checks the same auth conditions as the confidential page (e.g. `universal_portfolio_access` cookie).
     - If **not** authorized → redirects to the gate or returns 403.
     - If authorized → generates a **short-lived signed URL** to the underlying storage and redirects the browser there.

3. **Issue short-lived signed URLs**
   - A signed URL encodes:
     - The object key (`portfolio/<slug>/memo.pdf`)
     - An expiration time (e.g. 1–10 minutes)
     - A signature computed with a server-side secret (cloud provider credentials)
   - Example (conceptual, not exact code):

     ```ts
     // Pseudocode for /api/memo-download/[slug].ts
     import type { APIRoute } from 'astro';
     import { createSignedUrlForObject } from '../lib/storage'; // wraps S3/GCS SDK

     export const GET: APIRoute = async ({ params, cookies, redirect }) => {
       const slug = params.slug;

       // 1. Check cookie-based auth (same as confidential page)
       const accessCookie = cookies.get('universal_portfolio_access');
       if (!accessCookie?.value) {
         return redirect(`/portfolio-gate?redirect=${encodeURIComponent(`/portfolio/confidential`)}&memo=${slug}`);
       }

       // 2. Map slug -> storage key
       const objectKey = `portfolio/${slug}/memo.pdf`;

       // 3. Generate short-lived signed URL (e.g. 5 minutes)
       const signedUrl = await createSignedUrlForObject(objectKey, {
         expiresInSeconds: 300,
       });

       // 4. Redirect user to signed URL
       return redirect(signedUrl);
     };
     ```

   - `createSignedUrlForObject` would wrap:
     - `getSignedUrl` from AWS SDK (S3)
     - or equivalent in GCS/Azure.

4. **Link from confidential UI**

   - On `/portfolio/confidential` or in confidential card detail views:
     - Use the secure download route instead of a direct file URL, e.g.:

       ```astro
       <a
         href={`/api/memo-download/${slug}`}
         class="inline-flex items-center text-sm text-primary underline"
       >
         View investment memo (PDF)
       </a>
       ```

   - Only authenticated users will get a usable signed URL.
   - Signed URLs naturally expire, reducing the risk from link sharing.

#### Security Properties

- **Pros**
  - Attachments are **never** directly exposed under `/public`.
  - Every access goes through server-side logic (middleware or API).
  - Signed URLs:
    - Expire automatically.
    - Can be made one-time or single-session if needed.
  - Works well with existing cookie-based Tier 1/Tier 2 gates.

- **Cons**
  - Requires an external storage provider and credentials management.
  - Slightly more complex than serving from `public/`.
  - If a signed URL is copied and used before expiration, it will still work (within its lifetime).

#### Recommended Use

- Use **Markdown + SSR** for primary memo content (Tier 1 on `/portfolio/confidential`).
- Use **cloud storage + signed URLs** for:
  - High-fidelity PDFs.
  - Large attachments not suitable for in-page rendering.
- Start with a simple S3 bucket + 5-minute signed URLs pattern and iterate if you need stricter guarantees (per-user tokens, audit logs, etc.).

##### Example: Minimal `lib/storage.ts` for S3

For AWS S3, a minimal helper compatible with the pseudocode above can look like this:

```ts
// src/lib/storage.ts (example)
import { S3Client } from '@aws-sdk/client-s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_MEMOS_BUCKET!; // e.g. "hypernova-memos"

interface SignedUrlOptions {
  expiresInSeconds?: number; // default 300 (5 minutes)
}

export async function createSignedUrlForObject(
  key: string,
  options: SignedUrlOptions = {},
): Promise<string> {
  const { expiresInSeconds = 300 } = options;

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}
```

> **Note:** This is an example only. In production, teams should:
>
> - Keep AWS credentials in environment variables or a secret manager.
> - Consider per-environment buckets (dev/stage/prod).
> - Optionally add logging, metrics, and stricter key naming conventions.

##### How to Copy This Pattern to a New Site (Detailed Guide)

To adopt this exact Tier 1 pattern in another astro-knots site (e.g., dark-matter), follow this detailed checklist:

---

###### Step 1: Enable Server Output & Adapter

**File:** `astro.config.mjs`

```typescript
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';  // or your adapter

export default defineConfig({
  output: 'server',  // Required for SSR pages and middleware
  adapter: vercel(), // Configure for your deployment platform
  // ... rest of config
});
```

---

###### Step 2: Define Environment Variables

**File:** `.env`

```bash
# Passcode Authentication (choose one approach)
# Option 1: Plaintext (simpler, good for development)
UNIVERSAL_PORTFOLIO_PASSCODE_PLAINTEXT=YOUR_PASSCODE_HERE

# Option 2: Hashed (production security)
# Generate hash: echo -n "YOUR_PASSCODE${SALT}" | sha256sum
UNIVERSAL_PORTFOLIO_PASSCODE_SALT=your_random_32char_salt_here
UNIVERSAL_PORTFOLIO_PASSCODE_HASH=your_sha256_hash_here

# GitHub Content (optional, for memo integration)
GITHUB_CONTENT_PAT=github_pat_xxxxx
GITHUB_CONTENT_OWNER=your-org
GITHUB_CONTENT_REPO=your-private-content-repo
GITHUB_CONTENT_BRANCH=main
```

---

###### Step 3: Create API Verification Route

**File:** `src/pages/api/verify-portfolio-passcode.ts`

Copy from hypernova-site and adjust redirect defaults:

```typescript
import type { APIRoute } from 'astro';
import { createHash, randomBytes } from 'crypto';

export const prerender = false;

const PASSCODE_HASH = import.meta.env.UNIVERSAL_PORTFOLIO_PASSCODE_HASH;
const PASSCODE_SALT = import.meta.env.UNIVERSAL_PORTFOLIO_PASSCODE_SALT;
const PASSCODE_PLAINTEXT = import.meta.env.UNIVERSAL_PORTFOLIO_PASSCODE_PLAINTEXT;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  // Validation logic (see full implementation above)
  // ...

  // On success, set cookie and redirect
  cookies.set('universal_portfolio_access', sessionToken, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return redirect(redirectTo || '/portfolio');
};
```

---

###### Step 4: Create Middleware

**File:** `src/middleware.ts`

```typescript
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async ({ url, cookies, redirect }, next) => {
  const pathname = url.pathname;

  // Define which routes need protection
  const protectedRoutes = [
    '/portfolio/confidential',
    '/memos',
    // Add more protected prefixes as needed
  ];

  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtected) {
    const accessCookie = cookies.get('universal_portfolio_access');

    if (!accessCookie?.value) {
      const redirectPath = encodeURIComponent(pathname + (url.search || ''));
      return redirect(`/portfolio-gate?redirect=${redirectPath}`);
    }
  }

  return next();
});
```

---

###### Step 5: Create Gate Page

**File:** `src/pages/portfolio-gate.astro`

```astro
---
import BaseThemeLayout from '@layouts/BaseThemeLayout.astro';

export const prerender = false;

const redirect = Astro.url.searchParams.get('redirect') ?? '/portfolio';
const error = Astro.url.searchParams.get('error');
---
<BaseThemeLayout title="Portfolio Access">
  <section class="min-h-screen flex items-center justify-center px-6">
    <div class="max-w-md w-full space-y-6 text-center">
      <h1 class="text-2xl font-semibold">Enter Passcode</h1>

      {error === 'invalid' && (
        <p class="text-red-500 text-sm">Invalid passcode. Please try again.</p>
      )}

      <form method="POST" action="/api/verify-portfolio-passcode" class="space-y-4">
        <input type="hidden" name="redirect" value={redirect} />
        <input
          type="password"
          name="passcode"
          placeholder="Enter passcode"
          autocomplete="off"
          class="w-full px-4 py-2 border rounded"
          required
        />
        <button type="submit" class="w-full bg-primary text-primary-foreground py-2 rounded">
          Access Content
        </button>
      </form>
    </div>
  </section>
</BaseThemeLayout>
```

---

###### Step 6: Create Confidential Page(s)

**File:** `src/pages/portfolio/confidential/index.astro`

```astro
---
import BaseThemeLayout from '@layouts/BaseThemeLayout.astro';
import AuthenticationStatus from '@components/ui/AuthenticationStatus.astro';
// Import your grid components

export const prerender = false;

const accessCookie = Astro.cookies.get('universal_portfolio_access');
const authLevel = accessCookie?.value ? 'general-passcode' : 'unauthenticated';
---
<BaseThemeLayout title="Confidential Portfolio">
  <section class="px-6 py-12">
    <header class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-semibold">Confidential Portfolio</h1>
        <AuthenticationStatus level={authLevel} />
      </div>
    </header>

    <!-- Your confidential content here -->
    <!-- Import and use LogoGrid--ConfidentialAccess, etc. -->
  </section>
</BaseThemeLayout>
```

---

###### Step 7: Copy UI Components

Copy these files from hypernova-site, adjusting import paths:

| Source (hypernova-site) | Target | Purpose |
|------------------------|--------|---------|
| `src/components/ui/AuthenticationStatus.astro` | Same path | Auth level chip indicator |
| `src/components/ui/AuthenticationModal.astro` | Same path | Inline passcode modal |
| `src/components/buttons/Button--AccessConfidentialInfo.astro` | Same path | Modal wrapper button |

**AuthenticationStatus.astro:**
```astro
---
export interface Props {
  level: 'unauthenticated' | 'general-passcode';
}
const { level } = Astro.props;

const config = {
  'unauthenticated': { color: 'amber', label: 'Unauthenticated' },
  'general-passcode': { color: 'emerald', label: 'General passcode' },
};
const { color, label } = config[level];
---
<div class={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide uppercase bg-${color}-500/10 text-${color}-400 border-${color}-500/40`}>
  <span class="inline-block h-1.5 w-1.5 rounded-full bg-current"></span>
  <span>Auth: {label}</span>
</div>
```

---

###### Step 8: Copy Grid Components (Optional)

If you need the confidential portfolio grid display:

| Source | Purpose |
|--------|---------|
| `src/components/basics/grids/grid-cards/LogoGrid--ConfidentialAccess.astro` | Grid wrapper with toggle view |
| `src/components/basics/grids/grid-cards/LogoCardExpanded--ConfidentialAccess.astro` | Expandable card with memo links |

---

###### Step 9: Add GitHub Content Library (Optional, for Memos)

**File:** `src/lib/github-content.ts`

Copy the full implementation from hypernova-site. Key functions:
- `fetchGitHubContent()` - Fetch raw content via GitHub API
- `fetchMemoBySlug()` - High-level memo fetcher with path derivation
- `isLocalDemoMode()` - Check if PAT is configured
- 5-minute in-memory cache for performance

**Local Fallback:** Create `src/content/markdown-memos/` directory with sample `.md` files for development without GitHub PAT.

---

###### Step 10: Test the Flow

1. **Start dev server:** `pnpm dev`

2. **Test public routes:**
   - Visit `/portfolio` – should be accessible
   - Visit `/portfolio/[slug]` – should be accessible

3. **Test protected routes:**
   - Visit `/portfolio/confidential` – should redirect to `/portfolio-gate`
   - Visit `/memos/test` – should redirect to `/portfolio-gate`

4. **Test authentication:**
   - Enter correct passcode – should redirect to requested page
   - Enter wrong passcode – should show error and stay on gate
   - Cookie should persist for 24 hours

5. **Test memo fetching (if enabled):**
   - With PAT: Should fetch from GitHub
   - Without PAT: Should show local demo mode banner

---

This gives each site a self-contained, database-free confidential content gate that matches the Hypernova implementation.

### Pros & Cons

| Pros | Cons |
|------|------|
| Zero database required | Single shared passcode |
| Fast to implement | No audit trail |
| Familiar UX (DocSend-like) | No granular permissions |
| Works with static hosting | Session-only (no persistence) |

---

## Tier 1.5: Email + Domain Auth with NocoDB Session Tracking

### Overview

A hybrid approach that combines passcode authentication with email-based access and session tracking. Users can authenticate via passcode OR email. Approved email domains get instant access, while all sessions are logged to NocoDB for analytics and audit purposes.

**Key differentiator from Tier 1:** Email capture with domain-based auto-authorization and session tracking in NocoDB.

**Key differentiator from Tier 2:** No magic links or email delivery required — instant access for approved domains.

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Astro Site                                      │
│  ┌──────────────┐    ┌──────────────────┐    ┌────────────────────┐    │
│  │ Gate Page    │    │ API: Verify      │    │ Protected Pages    │    │
│  │ (tabs:       │───▶│ Passcode OR      │───▶│ (confidential)     │    │
│  │  passcode/   │    │ Email            │    │                    │    │
│  │  email)      │    └──────────────────┘    └────────────────────┘    │
│  └──────────────┘             │                       ▲                 │
│                               ▼                       │                 │
│                    ┌─────────────────────┐            │                 │
│                    │ NocoDB              │────────────┘                 │
│                    │ (session tracking)  │                              │
│                    └─────────────────────┘                              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Implementation (Dark-Matter Reference)

#### 1. NocoDB Table Structure

Table: `emailAccess` (ID: `ms0dzr6telg2cxu`)

| Column | Type | Purpose |
|--------|------|---------|
| `emailOfAccessor` | Text | User's email address |
| `sessionStartTime` | DateTime | When access session began |
| `sessionEndTime` | DateTime | When session ended (optional) |

#### 2. Environment Configuration

```bash
# .env
# Passcode (same as Tier 1)
UNIVERSAL_PORTFOLIO_PASSCODE_PLAINTEXT=YOUR_PASSCODE_HERE

# NocoDB Integration
NOCODB_API_KEY=your_nocodb_api_key_here
NOCODB_BASE_ID=pvop0ydhmtugzvv

# Allowed email domains (comma-separated)
# Users with these domains get instant access
ALLOWED_EMAIL_DOMAINS=darkmatter.vc,darkmatterlongevity.com,lossless.group
```

#### 3. NocoDB Library Extension

```typescript
// src/lib/nocodb.ts (additions)
export const NOCODB_TABLES = {
  // ... existing tables
  emailAccess: 'ms0dzr6telg2cxu',
} as const;

export interface EmailAccessFields {
  emailOfAccessor: string;
  sessionStartTime: string;
  sessionEndTime?: string | null;
}

export type EmailAccessStatus = 'domain_allowed' | 'approved' | 'pending' | 'new';

/**
 * Check if an email is allowed access (domain check + previous session lookup)
 */
export async function checkEmailAccess(email: string): Promise<{
  allowed: boolean;
  status: EmailAccessStatus;
}> {
  // 1. Check domain allowlist first
  if (isAllowedDomain(email)) {
    return { allowed: true, status: 'domain_allowed' };
  }

  // 2. Check for previous approved sessions in NocoDB
  const response = await fetchRecords(NOCODB_TABLES.emailAccess, {
    where: `(emailOfAccessor,eq,${email.toLowerCase()})`,
    limit: 1,
  });

  if (response.records.length > 0) {
    return { allowed: true, status: 'approved' };
  }

  return { allowed: false, status: 'new' };
}

/**
 * Create a new email access session in NocoDB
 */
export async function createEmailAccessSession(email: string): Promise<void> {
  await fetch(nocodbUrl, {
    method: 'POST',
    body: JSON.stringify({
      emailOfAccessor: email.toLowerCase(),
      sessionStartTime: new Date().toISOString(),
    }),
  });
}
```

#### 4. Email Verification API

```typescript
// src/pages/api/verify-email.ts
import { checkEmailAccess, createEmailAccessSession } from '@lib/nocodb';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const redirectTo = formData.get('redirect') as string;

  const accessResult = await checkEmailAccess(email);

  if (accessResult.allowed) {
    // Create session record in NocoDB
    await createEmailAccessSession(email);

    // Set auth cookie
    cookies.set('universal_portfolio_access', sessionToken, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return redirect(redirectTo);
  }

  // Not allowed - log request and show pending message
  await createEmailAccessSession(email);
  return redirect('/portfolio-gate?error=pending&email=' + email);
};
```

#### 5. Gate Page with Tab Switcher

The gate page provides a tab interface for switching between passcode and email authentication:

```astro
<!-- src/pages/portfolio-gate.astro -->
<!-- Tab Switcher -->
<div class="flex rounded-xl bg-surface/30 p-1" role="tablist">
  <button data-tab="passcode" class="tab-button">Passcode</button>
  <button data-tab="email" class="tab-button">Email</button>
</div>

<!-- Passcode Form -->
<form id="passcode-form" action="/api/verify-portfolio-passcode">
  <input type="password" name="passcode" placeholder="Enter passcode" />
  <button type="submit">Access with Passcode</button>
</form>

<!-- Email Form -->
<form id="email-form" action="/api/verify-email" class="hidden">
  <input type="email" name="email" placeholder="you@company.com" />
  <button type="submit">Access with Email</button>
  <p class="text-xs">Team members and approved partners get instant access.</p>
</form>
```

### Authentication Flow

```
User visits /portfolio/confidential
         │
         ▼
    Has cookie? ────Yes───▶ Show confidential content
         │
         No
         │
         ▼
    Redirect to /portfolio-gate
         │
         ▼
    User chooses: Passcode OR Email
         │
    ┌────┴────┐
    │         │
Passcode    Email
    │         │
    ▼         ▼
  Valid?    Domain in
    │       allowlist?
    │         │
  ┌─┴─┐    ┌──┴──┐
  │   │    │     │
 Yes  No  Yes    No
  │   │    │     │
  │   │    ▼     ▼
  │   │  Log to  Log to NocoDB
  │   │  NocoDB  Show "pending"
  │   │    │     message
  │   │    │
  │   │    ▼
  ▼   ▼   Set cookie
Set cookie  Redirect
Redirect    to content
to content
```

### Pros & Cons

| Pros | Cons |
|------|------|
| Dual auth methods (passcode + email) | Requires NocoDB setup |
| Domain-based instant access | Session tracking adds complexity |
| Session tracking for analytics | Non-approved domains need manual review |
| No email delivery needed | Slightly more complex than Tier 1 |
| NocoDB as lightweight backend | |

### When to Use Tier 1.5

- You want to track who accesses confidential content
- You have known partner/investor domains that should get automatic access
- You don't want to set up email delivery (no magic links)
- You already use NocoDB for other data management
- You need both passcode sharing AND email-based access

---

## Tier 2: Email Verification with Domain Allowlist

### Overview

Users enter their email to receive a magic link. Sanctioned domains (e.g., `@hypernova.capital`, `@investor-firm.com`) get automatic access. Others require manual approval or are denied.

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Astro Site                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌────────────────────┐    │
│  │ Gate Page    │    │ API: Send    │    │ API: Verify        │    │
│  │ (email form) │───▶│ Magic Link   │───▶│ Token + Set Cookie │    │
│  └──────────────┘    └──────────────┘    └────────────────────┘    │
│                              │                      │               │
│                              ▼                      ▼               │
│                      ┌──────────────┐      ┌──────────────┐        │
│                      │ Email        │      │ KV Store     │        │
│                      │ Service      │      │ (Vercel/     │        │
│                      │ (Resend/     │      │  Cloudflare) │        │
│                      │  Plunk)      │      └──────────────┘        │
│                      └──────────────┘                               │
└─────────────────────────────────────────────────────────────────────┘
```

### Implementation Details

#### 1. Environment Configuration

```bash
# .env
RESEND_API_KEY=re_xxxxx
MAGIC_LINK_SECRET=<random 32+ char secret>

# Domain allowlist (comma-separated)
ALLOWED_DOMAINS=hypernova.capital,trustedpartner.com

# Optional: KV store for token storage
KV_REST_API_URL=https://xxx.upstash.io
KV_REST_API_TOKEN=xxx
```

#### 2. Email Gate Component

```astro
---
// src/pages/access/[...slug].astro
const { slug } = Astro.params;
const error = Astro.url.searchParams.get('error');
---

<Layout title="Request Access">
  <div class="access-container">
    <h1>Enter your email to access this content</h1>

    {error === 'domain' && (
      <p class="error">Your email domain is not authorized. Contact us for access.</p>
    )}

    <form method="POST" action="/api/request-access">
      <input type="hidden" name="content" value={slug} />
      <input
        type="email"
        name="email"
        placeholder="you@company.com"
        required
      />
      <button type="submit">Send Access Link</button>
    </form>

    <p class="hint">
      Authorized domains receive instant access. Others may require approval.
    </p>
  </div>
</Layout>
```

#### 3. Magic Link Generation

```typescript
// src/pages/api/request-access.ts
import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { createHash, randomBytes } from 'crypto';

const resend = new Resend(import.meta.env.RESEND_API_KEY);
const ALLOWED_DOMAINS = (import.meta.env.ALLOWED_DOMAINS || '').split(',');

export const POST: APIRoute = async ({ request, url }) => {
  const formData = await request.formData();
  const email = (formData.get('email') as string).toLowerCase().trim();
  const content = formData.get('content') as string;

  // Extract domain
  const domain = email.split('@')[1];

  // Check if domain is allowed
  if (!ALLOWED_DOMAINS.includes(domain)) {
    // Option A: Reject immediately
    return Response.redirect(`${url.origin}/access/${content}?error=domain`);

    // Option B: Queue for manual approval (requires notification system)
    // await notifyAdminForApproval(email, content);
    // return Response.redirect(`${url.origin}/access/pending`);
  }

  // Generate token
  const token = randomBytes(32).toString('hex');
  const expires = Date.now() + (60 * 60 * 1000); // 1 hour

  // Store token (KV, or in-memory for simple cases)
  await storeToken(token, { email, content, expires });

  // Build magic link
  const magicLink = `${url.origin}/api/verify-access?token=${token}`;

  // Send email
  await resend.emails.send({
    from: 'access@hypernova.capital',
    to: email,
    subject: 'Your access link',
    html: `
      <p>Click below to access the confidential content:</p>
      <a href="${magicLink}">Access Content</a>
      <p>This link expires in 1 hour.</p>
    `,
  });

  return Response.redirect(`${url.origin}/access/check-email`);
};

// Simple KV storage abstraction
async function storeToken(token: string, data: object) {
  // Option 1: Upstash Redis
  if (import.meta.env.KV_REST_API_URL) {
    await fetch(`${import.meta.env.KV_REST_API_URL}/set/${token}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${import.meta.env.KV_REST_API_TOKEN}` },
      body: JSON.stringify(data),
    });
    return;
  }

  // Option 2: In-memory (development only, lost on restart)
  globalThis.__tokens = globalThis.__tokens || new Map();
  globalThis.__tokens.set(token, data);
}
```

#### 4. Token Verification

```typescript
// src/pages/api/verify-access.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const token = url.searchParams.get('token');

  if (!token) {
    return redirect('/access?error=missing-token');
  }

  const data = await getToken(token);

  if (!data || data.expires < Date.now()) {
    return redirect('/access?error=expired');
  }

  // Set authenticated cookie
  cookies.set('verified_email', data.email, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  // Invalidate token (one-time use)
  await deleteToken(token);

  // Log access (audit trail)
  console.log(`[ACCESS] ${data.email} accessed ${data.content} at ${new Date().toISOString()}`);

  return redirect(`/confidential/${data.content}`);
};
```

### Domain Allowlist Pattern

```typescript
// src/lib/access-control.ts

interface AccessConfig {
  // Domains that get automatic access
  allowedDomains: string[];

  // Specific emails always allowed (VIPs, advisors)
  allowedEmails: string[];

  // Domains that are explicitly blocked
  blockedDomains: string[];
}

export const accessConfig: AccessConfig = {
  allowedDomains: [
    'hypernova.capital',
    'investor-firm.com',
    'trustedpartner.org',
  ],
  allowedEmails: [
    'specific.advisor@gmail.com',
    'board.member@personal.com',
  ],
  blockedDomains: [
    'tempmail.com',
    'guerrillamail.com',
  ],
};

export function checkEmailAccess(email: string): 'allowed' | 'blocked' | 'pending' {
  const normalized = email.toLowerCase().trim();
  const domain = normalized.split('@')[1];

  if (accessConfig.blockedDomains.includes(domain)) {
    return 'blocked';
  }

  if (accessConfig.allowedEmails.includes(normalized)) {
    return 'allowed';
  }

  if (accessConfig.allowedDomains.includes(domain)) {
    return 'allowed';
  }

  return 'pending'; // Requires manual approval
}
```

### Pros & Cons

| Pros | Cons |
|------|------|
| Email verification (identity) | Requires email service |
| Domain-based auto-access | Needs KV store for tokens |
| Basic audit trail | More complex than passcode |
| Time-limited tokens | Email deliverability concerns |

---

## Tier 3: Full Authentication (Clerk)

### Overview

For sites needing persistent user accounts, role-based access, and comprehensive audit trails, Clerk provides a managed authentication solution that integrates well with Astro.

### Why Clerk?

| Feature | Clerk | Auth.js | Custom |
|---------|-------|---------|--------|
| Setup time | Minutes | Hours | Days |
| Managed infrastructure | Yes | Partial | No |
| Social logins | Built-in | Config | Build |
| MFA/2FA | Built-in | Plugin | Build |
| Astro integration | Official | Community | Manual |
| Database required | No (Clerk manages) | Yes | Yes |
| Pricing | Free tier, then paid | Free | Infra costs |

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Astro Site                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌────────────────────┐    │
│  │ Clerk        │    │ Middleware   │    │ Protected Pages    │    │
│  │ Components   │───▶│ (auth check) │───▶│ (role-gated)       │    │
│  └──────────────┘    └──────────────┘    └────────────────────┘    │
│         │                   │                      │                │
│         ▼                   ▼                      ▼                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Clerk Backend                             │   │
│  │  • User management  • Sessions  • Roles  • Audit logs       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Implementation Details

#### 1. Installation & Configuration

```bash
pnpm add @clerk/astro
```

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import clerk from '@clerk/astro';

export default defineConfig({
  integrations: [clerk()],
  output: 'server', // Required for Clerk
});
```

```bash
# .env
PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx
```

#### 2. Middleware for Route Protection

```typescript
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';

const isProtectedRoute = createRouteMatcher([
  '/confidential(.*)',
  '/investor-portal(.*)',
  '/admin(.*)',
]);

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export const onRequest = clerkMiddleware((auth, context) => {
  const { userId, sessionClaims } = auth();

  // Protect confidential routes
  if (isProtectedRoute(context.request) && !userId) {
    return auth().redirectToSignIn();
  }

  // Admin routes require admin role
  if (isAdminRoute(context.request)) {
    const role = sessionClaims?.metadata?.role;
    if (role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }
  }
});
```

#### 3. Sign-In/Sign-Up Components

```astro
---
// src/pages/sign-in/[[...sign-in]].astro
import { SignIn } from '@clerk/astro/components';
import Layout from '@layouts/BaseLayout.astro';
---

<Layout title="Sign In">
  <SignIn
    routing="path"
    path="/sign-in"
    signUpUrl="/sign-up"
    afterSignInUrl="/confidential"
  />
</Layout>
```

#### 4. Domain-Based Auto-Authorization with Clerk

Clerk supports "Verified Domains" which can auto-add users from specific email domains to your organization:

```typescript
// In Clerk Dashboard or via API:
// Organizations > Your Org > Verified Domains > Add domain

// Programmatically via Clerk Backend API:
import { clerkClient } from '@clerk/astro/server';

// In an API route or server action:
const org = await clerkClient.organizations.getOrganization({
  organizationId: 'org_xxx',
});

// Users signing up with @hypernova.capital automatically join
```

#### 5. Role-Based Content Access

```typescript
// src/lib/access-control.ts
import type { User } from '@clerk/astro/server';

export type ContentRole = 'public' | 'authenticated' | 'investor' | 'admin';

export function canAccessContent(user: User | null, requiredRole: ContentRole): boolean {
  if (requiredRole === 'public') return true;
  if (!user) return false;
  if (requiredRole === 'authenticated') return true;

  const userRole = user.publicMetadata?.role as string;

  const roleHierarchy: Record<string, number> = {
    admin: 100,
    investor: 50,
    authenticated: 10,
    public: 0,
  };

  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
}
```

#### 6. Content Collection with Roles

```typescript
// src/content/config.ts
const confidentialDocs = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    requiredRole: z.enum(['public', 'authenticated', 'investor', 'admin']).default('authenticated'),
    allowedEmails: z.array(z.string()).optional(), // Override for specific users
  }),
});
```

### Pros & Cons

| Pros | Cons |
|------|------|
| Full user management | Requires `output: 'server'` |
| Role-based access control | Vendor dependency |
| Audit logs built-in | Paid at scale |
| Social logins, MFA | More complex setup |
| Domain auto-authorization | Requires Clerk account |

---

## Comparison Matrix

| Feature | Tier 1 (Passcode) | Tier 1.5 (Email+NocoDB) | Tier 2 (Magic Link) | Tier 3 (Clerk) |
|---------|-------------------|-------------------------|---------------------|----------------|
| Implementation time | 2-4 hours | 4-6 hours | 1-2 days | 4-8 hours |
| Database required | No | NocoDB | KV (optional) | No (Clerk manages) |
| Identity verification | None | Email (domain-based) | Email (verified) | Full (email, social, phone) |
| Domain allowlist | No | Yes | Yes (custom) | Yes (built-in) |
| Audit trail | No | Session tracking | Basic | Comprehensive |
| Role-based access | No | No | No | Yes |
| User persistence | Session only | Session + NocoDB log | Email-based | Full accounts |
| Email delivery needed | No | No | Yes (Resend/Plunk) | No (Clerk handles) |
| Static hosting | Yes | No (needs server) | No (needs server) | No (needs server) |
| Cost | Free | Free (NocoDB free tier) | Email service cost | Free tier, then $25+/mo |

---

## Recommended Implementation Path

### Phase 1: Passcode Gate ✅ COMPLETE (Hypernova)

Tier 1 is fully implemented in hypernova-site:

1. ✅ Created gate page component (`portfolio-gate.astro`)
2. ✅ Implemented passcode verification API (`verify-portfolio-passcode.ts`)
3. ✅ Added middleware for route protection (`middleware.ts`)
4. ✅ Created confidential portfolio view (`portfolio/confidential/index.astro`)
5. ✅ Integrated GitHub memo fetching (`lib/github-content.ts`)
6. ✅ Built UI components (AuthenticationStatus, AuthenticationModal, etc.)

**Delivered Files:**
- `src/pages/portfolio-gate.astro`
- `src/pages/api/verify-portfolio-passcode.ts`
- `src/middleware.ts`
- `src/pages/portfolio/confidential/index.astro`
- `src/pages/memos/[slug].astro`
- `src/lib/github-content.ts`
- `src/components/ui/AuthenticationStatus.astro`
- `src/components/ui/AuthenticationModal.astro`
- `src/components/buttons/Button--AccessConfidentialInfo.astro`
- `src/components/basics/grids/grid-cards/LogoGrid--ConfidentialAccess.astro`
- `src/components/basics/grids/grid-cards/LogoCardExpanded--ConfidentialAccess.astro`

**Next:** Copy pattern to dark-matter (see Dark-Matter Implementation Checklist section)

### Phase 2: Email Verification (Future)

Upgrade to Tier 2 for better security when needed:

1. Set up Resend (or Plunk, already in some sites)
2. Implement magic link flow
3. Add domain allowlist configuration
4. Set up Upstash KV for token storage
5. Add basic audit logging

**Deliverables:**
- `src/pages/access/[...slug].astro`
- `src/pages/api/request-access.ts`
- `src/pages/api/verify-access.ts`
- `src/lib/access-control.ts`
- KV integration

### Phase 3: Full Auth (Future, Optional)

If requirements grow, upgrade to Tier 3:

1. Sign up for Clerk
2. Install `@clerk/astro`
3. Migrate to server-rendered mode
4. Set up organizations and roles
5. Migrate existing access patterns

---

## Pattern Package Structure

Extract patterns to `@knots/auth-patterns` for cross-site reuse:

```
packages/auth-patterns/
├── README.md
├── tier-1-passcode/
│   ├── gate-page.astro
│   ├── verify-api.ts
│   ├── middleware.ts
│   └── schema-extension.ts
├── tier-2-email/
│   ├── access-page.astro
│   ├── request-api.ts
│   ├── verify-api.ts
│   ├── access-control.ts
│   └── kv-helpers.ts
├── tier-3-clerk/
│   ├── middleware.ts
│   ├── sign-in-page.astro
│   ├── role-helpers.ts
│   └── README.md
└── shared/
    ├── content-schema.ts
    └── types.ts
```

Sites copy the tier they need and adapt to their requirements.

---

## Security Considerations

### All Tiers

- Use `httpOnly`, `secure`, and `sameSite: strict` for all cookies
- Implement CSRF protection for form submissions
- Rate limit authentication endpoints
- Log all access attempts (success and failure)

### Passcode Tier

- Hash passcodes, never store plaintext
- Rotate passcodes periodically
- Consider IP-based rate limiting

### Email Tier

- Use cryptographically secure random tokens
- Implement token expiration (1 hour recommended)
- One-time use tokens (invalidate after verification)
- Monitor for email enumeration attacks

### Clerk Tier

- Enable MFA for admin accounts
- Review Clerk's security audit logs
- Configure session lifetime appropriately
- Use Clerk's built-in brute force protection

---

## Storage Options (No Traditional Database)

| Option | Best For | Limitations | Cost |
|--------|----------|-------------|------|
| Session cookies | Passcode tier | No persistence | Free |
| Upstash Redis | Token storage | Size limits | Free tier |
| Vercel KV | Vercel-hosted sites | Vendor lock-in | Free tier |
| Cloudflare KV | CF-hosted sites | CF ecosystem | Free tier |
| Turso/AstroDB | Complex queries | More setup | Free tier |
| Clerk | Full auth | Vendor dependency | Free tier |

**Recommendation:** Start with session cookies (Tier 1), add Upstash for token storage (Tier 2), or let Clerk handle everything (Tier 3).

---

## Open Questions

1. **Which sites need what tier?**
   - Hypernova: Likely Tier 2 or 3 (investor materials)
   - Dark Matter: Likely Tier 1 (simpler content)

2. **Shared domain allowlist?**
   - Should sites share a common allowlist (e.g., `@hypernova.capital` works on all sites)?
   - Or per-site configuration?

3. **Audit trail requirements?**
   - Simple logging sufficient?
   - Need queryable audit database?
   - Compliance requirements (SOC2, etc.)?

4. **Content expiration?**
   - Time-limited content access (like DocSend)?
   - View count limits?

5. **Mobile experience?**
   - Magic links work well on mobile
   - Passcodes may be awkward
   - Clerk has native mobile SDKs

---

---

## Dark-Matter Implementation Checklist

This section provides a specific implementation plan for the dark-matter site, based on the patterns proven in hypernova-site.

### Prerequisites

Before starting, ensure:
- [ ] dark-matter site is in `sites/dark-matter` as a git submodule
- [ ] Site has Astro configured with server output capability
- [ ] Vercel adapter (or equivalent) is installed

### Phase 1: Core Authentication (Tier 1)

**Goal:** Protect `/portfolio/confidential` and `/memos` routes with a universal passcode.

#### Files to Create

| Priority | File | Source Reference | Notes |
|----------|------|------------------|-------|
| 1 | `src/pages/api/verify-portfolio-passcode.ts` | hypernova-site | Copy and adjust redirects |
| 2 | `src/middleware.ts` | hypernova-site | Adjust protected routes as needed |
| 3 | `src/pages/portfolio-gate.astro` | hypernova-site | Customize branding/styling |
| 4 | `src/pages/portfolio/confidential/index.astro` | hypernova-site | SSR-only, protected |
| 5 | `src/pages/portfolio/confidential/no-access.astro` | hypernova-site | Optional fallback page |

#### Environment Variables

```bash
# .env for dark-matter
UNIVERSAL_PORTFOLIO_PASSCODE_PLAINTEXT=DM2025!  # Change this

# Optional: hashed for production
# UNIVERSAL_PORTFOLIO_PASSCODE_SALT=...
# UNIVERSAL_PORTFOLIO_PASSCODE_HASH=...
```

#### Configuration Changes

**astro.config.mjs:**
```typescript
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  // ...
});
```

### Phase 2: UI Components

#### Files to Copy

| File | Purpose |
|------|---------|
| `src/components/ui/AuthenticationStatus.astro` | Auth level indicator chip |
| `src/components/ui/AuthenticationModal.astro` | Inline passcode form modal |
| `src/components/buttons/Button--AccessConfidentialInfo.astro` | Modal wrapper for cards |

### Phase 3: Portfolio Grid (Optional)

If dark-matter needs the same expandable portfolio grid:

| File | Purpose |
|------|---------|
| `src/components/basics/grids/grid-cards/LogoGrid--ConfidentialAccess.astro` | Grid with toggle view |
| `src/components/basics/grids/grid-cards/LogoCardExpanded--ConfidentialAccess.astro` | Expandable card |

### Phase 4: GitHub Memo Integration (Optional)

If dark-matter needs confidential memos from a private repo:

1. **Create private repo:** `lossless-group/dark-matter-secure-data` (or reuse existing)

2. **Generate fine-grained PAT:**
   - GitHub Settings → Developer settings → Fine-grained tokens
   - Token name: `dark-matter-content-reader`
   - Repository access: Select the private content repo
   - Permissions: `Contents: Read-only`
   - Expiration: 90 days (set reminder to rotate)

3. **Environment variables:**
   ```bash
   GITHUB_CONTENT_PAT=github_pat_xxxxx
   GITHUB_CONTENT_OWNER=lossless-group
   GITHUB_CONTENT_REPO=dark-matter-secure-data
   GITHUB_CONTENT_BRANCH=main
   ```

4. **Copy library:**
   - `src/lib/github-content.ts` from hypernova-site
   - Adjust `deriveGitHubPathFromSlug()` if folder structure differs

5. **Create memo page:**
   - `src/pages/memos/[slug].astro` from hypernova-site

6. **Local fallback (optional):**
   - Create `src/content/markdown-memos/` with sample `.md` files

### Verification Checklist

After implementation, verify:

- [ ] `/portfolio` is publicly accessible
- [ ] `/portfolio/confidential` redirects to `/portfolio-gate` without cookie
- [ ] `/portfolio-gate` shows passcode form
- [ ] Correct passcode sets cookie and redirects
- [ ] Incorrect passcode shows error
- [ ] Cookie persists for 24 hours
- [ ] `/memos/test` redirects to gate (if implemented)
- [ ] Auth status chip shows correct level
- [ ] Modal works from portfolio cards

### Differences from Hypernova

Consider these site-specific adjustments for dark-matter:

| Aspect | Hypernova | Dark-Matter Consideration |
|--------|-----------|---------------------------|
| Branding | Hypernova theme | Dark-Matter theme/colors |
| Portfolio data | LP commits + Directs | Adjust categories as needed |
| Memo structure | `deals/{Company}/outputs/...` | May differ based on repo structure |
| Protected routes | `/portfolio/confidential`, `/memos` | Add/remove routes as needed |
| Layout component | `BaseThemeLayout` | Use dark-matter's equivalent |

### Timeline Estimate

| Phase | Effort |
|-------|--------|
| Phase 1: Core Auth | Primary work |
| Phase 2: UI Components | Copying and adjusting |
| Phase 3: Portfolio Grid | Optional, more complex |
| Phase 4: GitHub Memos | Optional, requires repo setup |

---

## Next Steps

1. **Review this proposal** — Identify which tier fits each site
2. **Decide on storage** — KV provider for token storage
3. **Start with Tier 1** — Quick win for immediate protection
4. **Iterate based on needs** — Upgrade tiers as requirements grow
5. **Extract to `@knots/auth-patterns`** — Once patterns stabilize

---

## References

- [Astro Middleware Documentation](https://docs.astro.build/en/guides/middleware/)
- [Clerk + Astro Integration](https://clerk.com/docs/references/astro/overview)
- [Resend Email API](https://resend.com/docs)
- [Upstash Redis](https://upstash.com/docs/redis/overall/getstarted)
- [Vercel KV](https://vercel.com/docs/storage/vercel-kv)
- [DocSend Security Model](https://www.docsend.com/features/security/) (inspiration)

---

## Operational Pattern: Google Sheets as Access Console (Non-Technical Workflow)

Many clients and partners are busy, non-technical, and resistant to adopting new tools. To keep the implementation aligned with the tiers above while minimizing friction for them, we can use a **single shared Google Sheet as the “Access Console”** per site (or per fund/vehicle). Our infrastructure periodically syncs this sheet into config/KV, and the tiers simply *read* from that configuration.

The client experience becomes: “If you edit this spreadsheet, that’s who can see what.” No dashboards or new logins required.

### Sheet Structure Overview

Each client gets a Google Sheet with a small number of tabs:

- **Settings** – simple, global toggles (passcode, link expiry, default tier)
- **Authorized Emails & Domains** – who is allowed or blocked
- **Content Access Rules** – which documents are public, passcode-gated, investor-only, etc.
- **Requests (optional)** – new access requests, typically fed from a form or email, read-only for the system

Our systems read from this sheet and map values onto the Tier 1–3 mechanisms.

### Tab 1: Settings (Maps to Tier 1 & 2)

Purpose: Give non-technical operators a small set of global knobs.

Example columns:

- `Setting`
- `Value`
- `Notes`

Example rows:

- `default_access_tier` → `passcode` or `email`  
  Controls whether new confidential content defaults to simple passcode or email verification.

- `passcode` → e.g. `NDA2025`  
  Human-friendly secret the client shares with trusted investors. Our infra hashes this value and updates `PASSCODE_HASH`.

- `passcode_hint` → e.g. `Contact hello@hypernova.capital`  
  Displayed on the Tier 1 gate page.

- `link_expiration_hours` → e.g. `24` or `72`  
  Used by Tier 2 to set token expiry instead of a hardcoded 1 hour.

- `auto_approve_new_domains` → `yes/no`  
  Drives how we treat new, previously unseen corporate domains in Tier 2 (auto-allow vs. require review).

**Client workflow:**

- To rotate the passcode, they simply edit the `passcode` cell and notify investors of the new code.
- To tighten or relax magic link expiry, they change `link_expiration_hours`.
- To move towards stronger authentication, they switch `default_access_tier` from `passcode` to `email`.

### Tab 2: Authorized Emails & Domains (Maps to Domain Allowlist / Blocklist)

Purpose: Represent allow/deny lists in a way that feels like a contact roster.

Example columns:

- `Type` → `domain`, `email`, or `blocked_domain`
- `Value` → e.g. `hypernova.capital`, `lp@familyoffice.com`
- `Label` → e.g. `Internal`, `Anchor LP`, `VIP Individual`
- `Notes` → optional context

Examples:

- `domain` / `hypernova.capital` / `Internal team`  
- `domain` / `investor-firm.com` / `Anchor LP`  
- `email` / `vip@pefirm.com` / `VIP Individual`  
- `blocked_domain` / `guerrillamail.com` / `Temp email (blocked)`

**Client workflow:**

- To grant access to an entire firm, they add a `domain` row.
- To grant access to a specific individual, they add an `email` row.
- To block throwaway or risky providers, they add `blocked_domain` rows.

**System behavior:**

- On a schedule (or deploy), we read this tab and map it into the `accessConfig` structure used in Tier 2 and Tier 3:
  - `allowedDomains` ← all `domain` rows
  - `allowedEmails` ← all `email` rows
  - `blockedDomains` ← all `blocked_domain` rows
- The `checkEmailAccess(email)` helper becomes a thin layer over this synced config.

### Tab 3: Content Access Rules (Per-Document Policy)

Purpose: Let clients control access requirements for specific decks, memos, and pages without editing frontmatter or code.

Example columns:

- `Content ID` or `Slug` → e.g. `fund-ii-overview`, `xyz-company-deck`
- `Title` → human-readable name
- `Access Tier` → `public`, `passcode`, `email`, `investor`, `admin`
- `Allowed Emails` (optional) → comma-separated overrides for this content only
- `Allowed Domains` (optional) → comma-separated overrides
- `Expires At` (optional) → date for content expiration
- `Notes`

Example rows:

- `fund-ii-overview` / `Fund II Overview Deck` / `email` / (blank) / `investor-firm.com` / (blank)  
- `xyz-company-deck` / `Company XYZ Confidential` / `investor` / `vip@pefirm.com` / `hypernova.capital` / `2025-12-31`  
- `pipeline-summary` / `Quarterly Pipeline Summary` / `passcode` / (blank) / (blank) / (blank)

**Client workflow:**

- To switch a doc from public to gated, they change `Access Tier` from `public` to `passcode` or `email`.
- To give a specific LP access to a single deck, they add that LP’s email in `Allowed Emails` for that row.
- To enforce time-limited access, they set `Expires At` to a date; after that, the content is treated as expired.

**System behavior:**

- At build-time or via a sync job, we:
  - Map `Access Tier` onto `accessLevel` / `requiredRole` in the relevant content schema.
  - Store per-content `allowedEmails`, `allowedDomains`, and `expiresAt` values in KV or content metadata.
- Middleware and API routes consult these values when deciding whether to:
  - Show a passcode gate (Tier 1)
  - Trigger an email verification flow (Tier 2)
  - Require an authenticated Clerk user with a certain role (Tier 3)
  - Respect per-document overrides and expiration.

### Tab 4: Requests & Approvals (Optional, for "Pending" Cases)

Purpose: Handle emails/domains that are not yet recognized without forcing the client into a new tool.

Two main integration options:

1. **Google Form → Sheet**  
   - A short Form collects: `Name`, `Email`, `Company`, `Requested content`.  
   - Responses land in Tab 4 as new rows.  
   - When Tier 2 encounters a `pending` domain, the gate page points to this Form.  
   - The client reviews Tab 4 periodically; to approve, they simply add the firm domain or email to Tab 2.

2. **Email-based Approvals**  
   - When an unknown domain requests access, the system emails the GP/IR team:  
     “`john@newfirm.com` requested access to `fund-ii-overview`.”  
   - They reply with simple commands like `APPROVE DOMAIN` or `APPROVE EMAIL`.  
   - A backend process or operator updates Tab 2 accordingly.

In both cases, the Sheet remains the single source of truth for who is allowed or blocked.

### Mapping to Tiers (Client-Friendly Summary)

- **Tier 1 – Passcode Gate:**
  - Reads `passcode` and `passcode_hint` from *Settings*.
  - Optionally uses *Content Access Rules* to decide which pages are passcode-gated vs. public.

- **Tier 2 – Email Verification:**
  - Uses *Authorized Emails & Domains* for allow/block decisions.
  - Uses `link_expiration_hours` and related settings from *Settings*.
  - Integrates with *Requests & Approvals* to upgrade `pending` domains into approved entries.

- **Tier 3 – Full Auth (Clerk):**
  - Treats the Sheet as a policy layer: domains in Tab 2 inform Clerk org/verified domain setup; content rules in Tab 3 inform `requiredRole` and per-doc access metadata.
  - Clients continue to operate entirely inside Google Sheets, while the underlying implementation shifts from simple passcodes to full account-based access as needed.

This pattern keeps all configuration in a tool clients already understand, while allowing astro-knots sites to progressively adopt more sophisticated access control under the hood.
