---
title: "Implement Portfolio with Confidential Access in New Site"
lede: "Step-by-step implementation plan for adding portfolio features with confidential access control to the dark-matter site, based on proven patterns from hypernova-site."
date_created: 2025-12-13
date_modified: 2025-12-15
status: Draft
category: Prompts
tags: [Portfolio, Confidential-Access, Dark-Matter, Implementation-Plan]
authors:
  - Michael Staton
---

# Implementation Plan: Portfolio with Confidential Access in Dark-Matter

> **Status:** Ready to Implement
> **Source Site:** hypernova-site (v0.1.0)
> **Target Site:** dark-matter
> **Reference:** [Confidential-Content-Access-Control-Blueprint.md](./Confidential-Content-Access-Control-Blueprint.md)
> **Created:** December 13, 2025

---

## Executive Summary

This document provides a step-by-step implementation plan for adding portfolio features with confidential access control to the dark-matter site, based on the proven patterns from hypernova-site v0.1.0.

**Scope:**
- Public portfolio page with company grid
- Passcode-protected confidential portfolio view
- Optional: GitHub-integrated investment memos
- Authentication UI components

---

## Current State Analysis

### Dark-Matter Site (Target)

| Aspect | Status | Notes |
|--------|--------|-------|
| Astro Config | ✅ Ready | Tailwind v4, Vite configured |
| SSR/Adapter | ❌ Missing | Needs `output: 'server'` + adapter |
| Middleware | ❌ Missing | No `src/middleware.ts` |
| Portfolio Pages | ❌ Missing | No portfolio section |
| API Routes | ❌ Missing | No `/api/` directory |
| Auth Components | ❌ Missing | No auth UI components |
| Layouts | ✅ Ready | `BaseThemeLayout.astro` available |
| Theme System | ✅ Ready | Light/dark/vibrant modes |
| Content Collections | ✅ Ready | Config exists, can add portfolio |

### Hypernova Site (Source)

| Feature | Files to Copy |
|---------|---------------|
| Passcode Gate | `portfolio-gate.astro` |
| API Route | `api/verify-portfolio-passcode.ts` |
| Middleware | `middleware.ts` |
| Confidential Page | `portfolio/confidential/index.astro` |
| Auth Components | `ui/AuthenticationStatus.astro`, `ui/AuthenticationModal.astro` |
| Grid Components | `LogoGrid--ConfidentialAccess.astro`, `LogoCardExpanded--ConfidentialAccess.astro` |
| GitHub Library | `lib/github-content.ts` (optional) |

---

## Implementation Phases

### Phase 1: Infrastructure Setup
**Goal:** Enable SSR and establish authentication foundation

### Phase 2: Public Portfolio
**Goal:** Create public-facing portfolio page with company grid

### Phase 3: Authentication System
**Goal:** Implement passcode gate and route protection

### Phase 4: Confidential Portfolio View
**Goal:** Create protected portfolio page with enhanced content

### Phase 5: GitHub Memo Integration (Optional)
**Goal:** Add confidential memo delivery from private repository

### Phase 6: Improve Components
**Goal:** Enhance UX with logout, skeleton loading, ToC, and error states

---

## Phase 1: Infrastructure Setup

### 1.1 Install Vercel Adapter

```bash
cd sites/dark-matter
pnpm add @astrojs/vercel
```

### 1.2 Update Astro Config

**File:** `astro.config.mjs`

```javascript
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',  // Enable SSR
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
});
```

### 1.3 Add Environment Variables

**File:** `.env`

```bash
# Passcode Authentication
# Option 1: Plaintext (development)
UNIVERSAL_PORTFOLIO_PASSCODE_PLAINTEXT=DARKMATTER2025!

# Option 2: Hashed (production)
# Generate: echo -n "YOUR_PASSCODE${SALT}" | sha256sum
# UNIVERSAL_PORTFOLIO_PASSCODE_SALT=your_random_32char_salt
# UNIVERSAL_PORTFOLIO_PASSCODE_HASH=your_sha256_hash

# GitHub Content (Phase 5, optional)
# GITHUB_CONTENT_PAT=github_pat_xxxxx
# GITHUB_CONTENT_OWNER=lossless-group
# GITHUB_CONTENT_REPO=dark-matter-secure-data
# GITHUB_CONTENT_BRANCH=main
```

### 1.4 Add TypeScript Path Alias

**File:** `tsconfig.json` (add to paths)

```json
{
  "compilerOptions": {
    "paths": {
      "@lib/*": ["src/lib/*"]
    }
  }
}
```

### 1.5 Verify Setup

```bash
pnpm dev
# Should start without errors
# SSR mode should be active
```

---

## Phase 2: Public Portfolio

### 2.1 Create Portfolio Data

**File:** `src/content/portfolio/portfolio-companies.json`

```json
[
  {
    "conventionalName": "Example Company",
    "officialName": "Example Company, Inc.",
    "logoLightMode": "/portfolio/logos/example-light.svg",
    "logoDarkMode": "/portfolio/logos/example-dark.svg",
    "urlToPortfolioSite": "https://example.com",
    "blurbShortTxt": "Brief description of the company and what they do.",
    "category": "direct",
    "listOfPeopleData": [
      {
        "name": "Jane Doe",
        "role": "CEO",
        "linkedInProfile": "https://linkedin.com/in/janedoe"
      }
    ]
  }
]
```

### 2.2 Create Public Portfolio Page

**File:** `src/pages/portfolio/index.astro`

```astro
---
import BaseThemeLayout from '@layouts/BaseThemeLayout.astro';
import portfolioData from '@content/portfolio/portfolio-companies.json';

// Public page - can be prerendered
export const prerender = true;
---
<BaseThemeLayout title="Portfolio" description="Our portfolio companies">
  <section class="px-6 py-16">
    <div class="max-w-6xl mx-auto">
      <header class="mb-12">
        <h1 class="text-4xl font-bold tracking-tight">Portfolio</h1>
        <p class="mt-4 text-lg text-foreground/70">
          Companies we've backed and believe in.
        </p>
      </header>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {portfolioData.map((company) => (
          <a
            href={company.urlToPortfolioSite}
            target="_blank"
            rel="noopener noreferrer"
            class="group p-6 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
          >
            <img
              src={company.logoDarkMode || company.logoLightMode}
              alt={company.conventionalName}
              class="h-12 w-auto object-contain dark:block hidden"
            />
            <img
              src={company.logoLightMode}
              alt={company.conventionalName}
              class="h-12 w-auto object-contain dark:hidden"
            />
            <p class="mt-4 text-sm font-medium">{company.conventionalName}</p>
          </a>
        ))}
      </div>
    </div>
  </section>
</BaseThemeLayout>
```

### 2.3 Add Portfolio to Navigation

**File:** `src/components/basics/Header.astro` (modify)

Add portfolio link to navigation:

```astro
<a href="/portfolio" class="...">Portfolio</a>
```

### 2.4 Add Portfolio Logo Assets

**Directory:** `public/portfolio/logos/`

Add company logo SVGs in both light and dark variants.

---

## Phase 3: Authentication System

### 3.1 Create Passcode Verification API

**File:** `src/pages/api/verify-portfolio-passcode.ts`

```typescript
import type { APIRoute } from 'astro';
import { createHash, randomBytes } from 'crypto';

export const prerender = false;

const PASSCODE_HASH = import.meta.env.UNIVERSAL_PORTFOLIO_PASSCODE_HASH;
const PASSCODE_SALT = import.meta.env.UNIVERSAL_PORTFOLIO_PASSCODE_SALT;
const PASSCODE_PLAINTEXT = import.meta.env.UNIVERSAL_PORTFOLIO_PASSCODE_PLAINTEXT;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  // Validate environment configuration
  if (!PASSCODE_PLAINTEXT && (!PASSCODE_HASH || !PASSCODE_SALT)) {
    console.error('[auth] Passcode not configured');
    return new Response('Authentication not configured', { status: 500 });
  }

  // Validate content type
  const contentType = request.headers.get('content-type') || '';
  if (
    !contentType.includes('multipart/form-data') &&
    !contentType.includes('application/x-www-form-urlencoded')
  ) {
    return redirect('/portfolio-gate?error=invalid');
  }

  // Parse form data
  const formData = await request.formData();
  const passcode = (formData.get('passcode') as string | null) ?? '';
  const redirectTo = (formData.get('redirect') as string | null) || '/portfolio';

  if (!passcode) {
    return redirect(`/portfolio-gate?error=invalid&redirect=${encodeURIComponent(redirectTo)}`);
  }

  // Validate passcode
  let valid = false;

  if (PASSCODE_PLAINTEXT) {
    // Development mode: plaintext comparison
    valid = passcode === PASSCODE_PLAINTEXT;
  } else {
    // Production mode: hash comparison
    const hash = createHash('sha256')
      .update(passcode + PASSCODE_SALT)
      .digest('hex');
    valid = hash === PASSCODE_HASH;
  }

  if (!valid) {
    return redirect(`/portfolio-gate?error=invalid&redirect=${encodeURIComponent(redirectTo)}`);
  }

  // Generate session token
  const sessionToken = createHash('sha256')
    .update(randomBytes(32).toString('hex') + (PASSCODE_SALT || 'dev-salt'))
    .digest('hex');

  // Set authentication cookie
  cookies.set('universal_portfolio_access', sessionToken, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return redirect(redirectTo);
};
```

### 3.2 Create Middleware

**File:** `src/middleware.ts`

```typescript
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async ({ url, cookies, redirect }, next) => {
  const pathname = url.pathname;

  // Define protected routes
  const protectedPrefixes = [
    '/portfolio/confidential',
    '/memos',
  ];

  const isProtected = protectedPrefixes.some(prefix => pathname.startsWith(prefix));

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

### 3.3 Create Portfolio Gate Page

**File:** `src/pages/portfolio-gate.astro`

```astro
---
import BaseThemeLayout from '@layouts/BaseThemeLayout.astro';

export const prerender = false;

const redirect = Astro.url.searchParams.get('redirect') ?? '/portfolio';
const error = Astro.url.searchParams.get('error');
---
<BaseThemeLayout title="Portfolio Access" description="Enter passcode to access confidential portfolio">
  <section class="min-h-screen flex items-center justify-center px-6">
    <div class="max-w-md w-full space-y-8 text-center">
      <!-- Logo/Brand -->
      <div class="mb-8">
        <img
          src="/trademarks/dark-matter-logo.svg"
          alt="Dark Matter"
          class="h-12 mx-auto"
        />
      </div>

      <div class="space-y-4">
        <h1 class="text-2xl font-semibold tracking-tight">Portfolio Access</h1>
        <p class="text-sm text-foreground/70">
          This content is protected. Enter the passcode to view confidential portfolio information.
        </p>
      </div>

      {error === 'invalid' && (
        <div class="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <p class="text-red-400 text-sm">Invalid passcode. Please try again.</p>
        </div>
      )}

      <form method="POST" action="/api/verify-portfolio-passcode" class="space-y-4">
        <input type="hidden" name="redirect" value={redirect} />

        <div>
          <input
            type="password"
            name="passcode"
            placeholder="Enter passcode"
            autocomplete="off"
            required
            class="w-full px-4 py-3 rounded-lg border border-border bg-surface text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
        </div>

        <button
          type="submit"
          class="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
        >
          Access Portfolio
        </button>
      </form>

      <p class="text-xs text-foreground/50">
        Don't have a passcode?{' '}
        <a href="mailto:contact@darkmatter.vc" class="underline hover:text-foreground/70">
          Contact us
        </a>
      </p>

      <div class="pt-8">
        <a href="/" class="text-sm text-foreground/60 hover:text-foreground/80">
          &larr; Back to home
        </a>
      </div>
    </div>
  </section>
</BaseThemeLayout>
```

---

## Phase 4: Confidential Portfolio View

### 4.1 Create Authentication Status Component

**File:** `src/components/ui/AuthenticationStatus.astro`

```astro
---
export interface Props {
  level: 'unauthenticated' | 'general-passcode';
}

const { level } = Astro.props;

const config = {
  'unauthenticated': {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/40',
    label: 'Unauthenticated',
  },
  'general-passcode': {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/40',
    label: 'Authenticated',
  },
};

const { bg, text, border, label } = config[level];
---
<div class={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium tracking-wide uppercase ${bg} ${text} ${border}`}>
  <span class="inline-block h-1.5 w-1.5 rounded-full bg-current"></span>
  <span>{label}</span>
</div>
```

### 4.2 Create Confidential Portfolio Page

**File:** `src/pages/portfolio/confidential/index.astro`

```astro
---
import BaseThemeLayout from '@layouts/BaseThemeLayout.astro';
import AuthenticationStatus from '@components/ui/AuthenticationStatus.astro';
import portfolioData from '@content/portfolio/portfolio-companies.json';

export const prerender = false;

const accessCookie = Astro.cookies.get('universal_portfolio_access');
const authLevel = accessCookie?.value ? 'general-passcode' : 'unauthenticated';

// Separate by category if needed
const directInvestments = portfolioData.filter(c => c.category === 'direct');
const lpCommitments = portfolioData.filter(c => c.category === 'lp');
---
<BaseThemeLayout title="Confidential Portfolio" description="Protected portfolio information">
  <section class="px-6 py-16">
    <div class="max-w-6xl mx-auto">
      <header class="mb-12 flex items-start justify-between gap-4">
        <div>
          <h1 class="text-4xl font-bold tracking-tight">Confidential Portfolio</h1>
          <p class="mt-4 text-lg text-foreground/70">
            Detailed portfolio information for authorized viewers.
          </p>
        </div>
        <AuthenticationStatus level={authLevel} />
      </header>

      {directInvestments.length > 0 && (
        <section class="mb-16">
          <h2 class="text-2xl font-semibold mb-8">Direct Investments</h2>
          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {directInvestments.map((company) => (
              <div class="p-6 rounded-xl border border-border/50 bg-surface/50">
                <div class="flex items-start justify-between gap-4 mb-4">
                  <img
                    src={company.logoDarkMode || company.logoLightMode}
                    alt={company.conventionalName}
                    class="h-10 w-auto"
                  />
                  {company.urlToPortfolioSite && (
                    <a
                      href={company.urlToPortfolioSite}
                      target="_blank"
                      rel="noopener"
                      class="text-xs text-foreground/50 hover:text-foreground/70"
                    >
                      Visit &rarr;
                    </a>
                  )}
                </div>

                <h3 class="font-semibold">{company.conventionalName}</h3>
                <p class="mt-2 text-sm text-foreground/70 line-clamp-3">
                  {company.blurbShortTxt}
                </p>

                {company.listOfPeopleData && company.listOfPeopleData.length > 0 && (
                  <div class="mt-4 pt-4 border-t border-border/30">
                    <p class="text-xs text-foreground/50 uppercase tracking-wide mb-2">Team</p>
                    <div class="space-y-1">
                      {company.listOfPeopleData.map((person) => (
                        <div class="flex items-center justify-between text-sm">
                          <span>{person.name}</span>
                          <span class="text-foreground/50">{person.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {company.extendedMemoMD && (
                  <a
                    href={`/memos/${company.extendedMemoMD}`}
                    class="mt-4 inline-flex items-center text-sm text-primary hover:underline"
                  >
                    View Investment Memo &rarr;
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {lpCommitments.length > 0 && (
        <section>
          <h2 class="text-2xl font-semibold mb-8">LP Commitments</h2>
          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lpCommitments.map((company) => (
              <div class="p-6 rounded-xl border border-border/50 bg-surface/50">
                <!-- Same card structure as above -->
                <h3 class="font-semibold">{company.conventionalName}</h3>
                <p class="mt-2 text-sm text-foreground/70">{company.blurbShortTxt}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  </section>
</BaseThemeLayout>
```

### 4.3 Create No-Access Fallback Page (Optional)

**File:** `src/pages/portfolio/confidential/no-access.astro`

```astro
---
import BaseThemeLayout from '@layouts/BaseThemeLayout.astro';
---
<BaseThemeLayout title="Access Denied">
  <section class="min-h-screen flex items-center justify-center px-6">
    <div class="text-center space-y-4">
      <h1 class="text-2xl font-semibold">Access Denied</h1>
      <p class="text-foreground/70">You don't have permission to view this content.</p>
      <a href="/portfolio-gate" class="inline-block text-primary hover:underline">
        Enter passcode
      </a>
    </div>
  </section>
</BaseThemeLayout>
```

---

## Phase 5: GitHub Memo Integration (Optional)

### 5.1 Create GitHub Content Library

**File:** `src/lib/github-content.ts`

Copy from `sites/hypernova-site/src/lib/github-content.ts` and adjust:
- Update `deriveGitHubPathFromSlug()` if your repo structure differs
- Update default environment variable names if needed

### 5.2 Create Memo Page

**File:** `src/pages/memos/[slug].astro`

```astro
---
import BaseThemeLayout from '@layouts/BaseThemeLayout.astro';
import { fetchMemoBySlug, isLocalDemoMode } from '@lib/github-content';
import { marked } from 'marked';

export const prerender = false;

// Auth check (middleware should handle, but double-check)
const accessCookie = Astro.cookies.get('universal_portfolio_access');
if (!accessCookie?.value) {
  const redirectPath = encodeURIComponent(Astro.url.pathname);
  return Astro.redirect(`/portfolio-gate?redirect=${redirectPath}`);
}

const { slug } = Astro.params;

if (!slug) {
  return Astro.redirect('/portfolio/confidential');
}

// Fetch memo
const memo = await fetchMemoBySlug(slug);

if (!memo) {
  return Astro.redirect('/portfolio/confidential?error=memo-not-found');
}

const { content, frontmatter } = memo;
const title = frontmatter.title || slug;
const htmlContent = marked.parse(content.replace(/^---[\s\S]*?---\n/, ''));
const localMode = isLocalDemoMode();
---
<BaseThemeLayout title={title} description={`Investment memo: ${title}`}>
  <article class="px-6 py-16">
    <div class="max-w-4xl mx-auto">
      {localMode && (
        <div class="mb-8 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <p class="text-amber-400 text-sm">
            Local Demo Mode — Content loaded from local files
          </p>
        </div>
      )}

      <header class="mb-12">
        <a
          href="/portfolio/confidential"
          class="text-sm text-foreground/60 hover:text-foreground/80"
        >
          &larr; Back to Portfolio
        </a>
        <h1 class="mt-4 text-4xl font-bold tracking-tight">{title}</h1>
        {frontmatter.date && (
          <p class="mt-2 text-foreground/60">{frontmatter.date}</p>
        )}
      </header>

      <div
        class="prose prose-lg prose-invert max-w-none"
        set:html={htmlContent}
      />

      <footer class="mt-16 pt-8 border-t border-border/30">
        <button
          onclick="window.print()"
          class="text-sm text-primary hover:underline"
        >
          Print / Export PDF
        </button>
      </footer>
    </div>
  </article>
</BaseThemeLayout>
```

### 5.3 Add Marked Dependency

```bash
pnpm add marked
```

### 5.4 Create Local Fallback Memos

**Directory:** `src/content/markdown-memos/`

Add sample `.md` files for local development testing.

---

## Phase 6: Improve Components

### 6.1 Component Improvements Overview

After the core functionality is working, improve the user experience and code quality:

| Component | Improvement | Priority |
|-----------|-------------|----------|
| Portfolio Cards | Add hover animations, skeleton loading | Medium |
| AuthenticationStatus | Add logout functionality | High |
| Portfolio Gate | Add "remember me" option | Low |
| Memo Viewer | Add table of contents, copy code blocks | Medium |
| Navigation | Add confidential section indicator | Medium |

### 6.2 Add Logout Functionality

**File:** `src/pages/api/logout.ts`

```typescript
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete('universal_portfolio_access', { path: '/' });
  return redirect('/portfolio');
};

export const GET: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete('universal_portfolio_access', { path: '/' });
  return redirect('/portfolio');
};
```

### 6.3 Enhanced AuthenticationStatus with Logout

**File:** `src/components/ui/AuthenticationStatus.astro` (update)

```astro
---
export interface Props {
  level: 'unauthenticated' | 'general-passcode';
  showLogout?: boolean;
  class?: string;
}

const { level, showLogout = true, class: className = '' } = Astro.props;

const config = {
  'unauthenticated': {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
    label: 'Unauthenticated',
  },
  'general-passcode': {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
    label: 'Authenticated',
  },
};

const { bg, text, border, dot, label } = config[level];
const isAuthenticated = level === 'general-passcode';
---

<div class={`inline-flex items-center gap-2 ${className}`}>
  <div class={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium tracking-wide uppercase ${bg} ${text} ${border}`}>
    <span class={`inline-block h-1.5 w-1.5 rounded-full ${dot}`}></span>
    <span>{label}</span>
  </div>

  {isAuthenticated && showLogout && (
    <a
      href="/api/logout"
      class="text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
    >
      Logout
    </a>
  )}
</div>
```

### 6.4 Skeleton Loading for Portfolio Cards

**File:** `src/components/ui/PortfolioCardSkeleton.astro`

```astro
---
export interface Props {
  count?: number;
}

const { count = 6 } = Astro.props;
---

<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {Array.from({ length: count }).map(() => (
    <div class="p-6 rounded-xl border border-border/40 bg-surface/30 animate-pulse">
      <div class="flex items-start justify-between gap-4 mb-4">
        <div class="h-10 w-24 bg-foreground/10 rounded"></div>
        <div class="h-4 w-12 bg-foreground/10 rounded"></div>
      </div>
      <div class="h-5 w-32 bg-foreground/10 rounded mb-2"></div>
      <div class="space-y-2">
        <div class="h-3 w-full bg-foreground/10 rounded"></div>
        <div class="h-3 w-4/5 bg-foreground/10 rounded"></div>
        <div class="h-3 w-3/5 bg-foreground/10 rounded"></div>
      </div>
    </div>
  ))}
</div>
```

### 6.5 Improved Navigation with Confidential Indicator

**File:** Update header navigation to show lock icon for confidential sections

```astro
<nav class="flex items-center gap-6">
  <a href="/portfolio" class="text-sm hover:text-foreground/80">
    Portfolio
  </a>
  <a href="/pipeline" class="text-sm hover:text-foreground/80">
    Pipeline
  </a>
  <a href="/portfolio/confidential" class="inline-flex items-center gap-1 text-sm hover:text-foreground/80">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
    </svg>
    Confidential
  </a>
</nav>
```

### 6.6 Memo Table of Contents

**File:** `src/components/memos/MemoTableOfContents.astro`

```astro
---
export interface TocItem {
  text: string;
  slug: string;
  depth: number;
}

export interface Props {
  items: TocItem[];
}

const { items } = Astro.props;
---

{items.length > 0 && (
  <nav class="sticky top-8 hidden xl:block">
    <p class="text-xs text-foreground/40 uppercase tracking-wide mb-3">On this page</p>
    <ul class="space-y-2 text-sm">
      {items.map((item) => (
        <li style={`padding-left: ${(item.depth - 1) * 0.75}rem`}>
          <a
            href={`#${item.slug}`}
            class="text-foreground/60 hover:text-foreground transition-colors"
          >
            {item.text}
          </a>
        </li>
      ))}
    </ul>
  </nav>
)}
```

### 6.7 Copy Code Block Button

**File:** `src/scripts/copy-code.ts`

```typescript
document.addEventListener('DOMContentLoaded', () => {
  const codeBlocks = document.querySelectorAll('pre code');

  codeBlocks.forEach((block) => {
    const pre = block.parentElement;
    if (!pre) return;

    const button = document.createElement('button');
    button.className = 'copy-code-btn';
    button.textContent = 'Copy';
    button.addEventListener('click', async () => {
      await navigator.clipboard.writeText(block.textContent || '');
      button.textContent = 'Copied!';
      setTimeout(() => {
        button.textContent = 'Copy';
      }, 2000);
    });

    pre.style.position = 'relative';
    pre.appendChild(button);
  });
});
```

**Add to memo page:**

```astro
<script src="@scripts/copy-code.ts"></script>
```

### 6.8 Error Boundary for Memo Loading

**File:** `src/components/memos/MemoErrorState.astro`

```astro
---
export interface Props {
  error?: string;
  slug?: string;
}

const { error = 'memo-not-found', slug } = Astro.props;

const messages = {
  'memo-not-found': 'The requested memo could not be found.',
  'fetch-failed': 'Failed to load memo content. Please try again.',
  'unauthorized': 'You do not have permission to view this memo.',
};

const message = messages[error as keyof typeof messages] || messages['memo-not-found'];
---

<div class="text-center py-16">
  <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-6">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-400" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
    </svg>
  </div>
  <h2 class="text-xl font-semibold mb-2">Memo Not Available</h2>
  <p class="text-foreground/60 mb-6">{message}</p>
  {slug && (
    <p class="text-xs text-foreground/40 mb-6">Requested: {slug}</p>
  )}
  <a
    href="/portfolio/confidential"
    class="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
    </svg>
    Back to Portfolio
  </a>
</div>
```

### 6.9 Session Expiry Warning

**File:** `src/components/ui/SessionExpiryWarning.astro`

```astro
---
// Show warning when session is close to expiring
// This component checks cookie age client-side
---

<div id="session-warning" class="hidden fixed bottom-4 right-4 p-4 rounded-lg bg-amber-500/20 border border-amber-500/40 max-w-sm">
  <p class="text-sm text-amber-400 mb-2">Your session will expire soon.</p>
  <div class="flex gap-2">
    <a href="/portfolio-gate" class="text-xs text-amber-400 hover:underline">Refresh Session</a>
    <button id="dismiss-warning" class="text-xs text-foreground/50 hover:text-foreground/70">Dismiss</button>
  </div>
</div>

<script>
  // Check session age and show warning if < 1 hour remaining
  // Implementation depends on how you store session timestamp
  const warning = document.getElementById('session-warning');
  const dismiss = document.getElementById('dismiss-warning');

  dismiss?.addEventListener('click', () => {
    warning?.classList.add('hidden');
  });
</script>
```

---

## Verification Checklist

After implementation, verify each feature:

### Phase 1: Infrastructure
- [ ] `pnpm dev` starts without errors
- [ ] SSR mode is active (check console output)
- [ ] Environment variables are loaded

### Phase 2: Public Portfolio
- [ ] `/portfolio` page renders
- [ ] Company logos display correctly
- [ ] Light/dark mode works
- [ ] External links work

### Phase 3: Authentication
- [ ] `/portfolio/confidential` redirects to gate (no cookie)
- [ ] `/portfolio-gate` shows passcode form
- [ ] Wrong passcode shows error message
- [ ] Correct passcode sets cookie and redirects
- [ ] Cookie persists for 24 hours
- [ ] Direct URL access to gate works

### Phase 4: Confidential View
- [ ] `/portfolio/confidential` accessible with cookie
- [ ] AuthenticationStatus shows correct level
- [ ] Company cards display correctly
- [ ] Team information shows
- [ ] Memo links work (if Phase 5 implemented)

### Phase 5: Memos (Optional)
- [ ] `/memos/[slug]` redirects to gate without cookie
- [ ] Memo content renders with cookie
- [ ] Local demo mode works without PAT
- [ ] GitHub mode works with PAT
- [ ] Print/PDF button works

### Phase 6: Component Improvements
- [ ] Add Memo Icon to the Pipeline Company Cards on confidential/index.astro, find the reference at `sites/hypernova-site/src/components/basics/grids/grid-cards/LogoCardExpanded--ConfidentialAccess.astro` 
- [ ] Logout endpoint works (`/api/logout`)
- [ ] AuthenticationStatus shows logout link when authenticated
- [ ] Skeleton loading displays while content loads
- [ ] Navigation shows lock icon for confidential sections
- [ ] Memo table of contents renders correctly
- [ ] Copy code button works on code blocks
- [ ] Error states display properly for missing memos
- [ ] Session expiry warning appears when appropriate

---

## Files Summary

### New Files to Create

| Phase | File | Purpose |
|-------|------|---------|
| 1 | `.env` | Environment configuration |
| 2 | `src/content/portfolio/portfolio-companies.json` | Portfolio data |
| 2 | `src/pages/portfolio/index.astro` | Public portfolio page |
| 3 | `src/pages/api/verify-portfolio-passcode.ts` | Auth API endpoint |
| 3 | `src/middleware.ts` | Route protection |
| 3 | `src/pages/portfolio-gate.astro` | Passcode entry page |
| 4 | `src/components/ui/AuthenticationStatus.astro` | Auth indicator |
| 4 | `src/pages/portfolio/confidential/index.astro` | Protected portfolio |
| 5 | `src/lib/github-content.ts` | GitHub integration |
| 5 | `src/pages/memos/[slug].astro` | Memo viewer |
| 6 | `src/pages/api/logout.ts` | Logout endpoint |
| 6 | `src/components/ui/PortfolioCardSkeleton.astro` | Loading skeleton |
| 6 | `src/components/memos/MemoTableOfContents.astro` | ToC navigation |
| 6 | `src/components/memos/MemoErrorState.astro` | Error display |
| 6 | `src/components/ui/SessionExpiryWarning.astro` | Session warning |
| 6 | `src/scripts/copy-code.ts` | Copy code button |

### Files to Modify

| File | Change |
|------|--------|
| `astro.config.mjs` | Add `output: 'server'` and adapter |
| `tsconfig.json` | Add `@lib/*` path alias |
| `src/components/basics/Header.astro` | Add portfolio nav link, confidential indicator |
| `package.json` | Add dependencies |
| `src/components/ui/AuthenticationStatus.astro` | Add logout link (Phase 6) |
| `src/pages/memos/[slug].astro` | Add ToC, copy code script (Phase 6) |

### Dependencies to Add

```bash
pnpm add @astrojs/vercel marked
```

---

## Environment Variables Reference

| Variable | Required | Phase | Description |
|----------|----------|-------|-------------|
| `UNIVERSAL_PORTFOLIO_PASSCODE_PLAINTEXT` | Dev | 3 | Plaintext passcode |
| `UNIVERSAL_PORTFOLIO_PASSCODE_SALT` | Prod | 3 | Salt for hash |
| `UNIVERSAL_PORTFOLIO_PASSCODE_HASH` | Prod | 3 | SHA256 hash |
| `GITHUB_CONTENT_PAT` | Optional | 5 | GitHub token |
| `GITHUB_CONTENT_OWNER` | Optional | 5 | Repo owner |
| `GITHUB_CONTENT_REPO` | Optional | 5 | Repo name |
| `GITHUB_CONTENT_BRANCH` | Optional | 5 | Branch name |

---

## Differences from Hypernova

| Aspect | Hypernova | Dark-Matter |
|--------|-----------|-------------|
| Theme system | Custom themes | Matter theme (light/dark/vibrant) |
| Layout component | `BaseThemeLayout` | `BaseThemeLayout` |
| Brand assets | Hypernova branding | Dark Matter branding |
| Color tokens | Custom | Uses `--color-*` CSS variables |
| Portfolio categories | LP Commits, Directs | Customize as needed |

---

## Security Reminders

1. **Never commit `.env`** — Add to `.gitignore`
2. **Use hashed passcode in production** — Plaintext only for development
3. **Rotate GitHub PAT** — Set 90-day expiration reminder
4. **SSR required** — Protected pages must use `prerender = false`
5. **httpOnly cookies** — Prevents XSS attacks

---

## Troubleshooting

### "Middleware not running"
- Ensure `output: 'server'` in astro.config.mjs
- Ensure adapter is configured
- Check for syntax errors in middleware.ts

### "Cookie not persisting"
- Check `secure: true` is only set in production
- Verify `sameSite: 'strict'` is set
- Check cookie path is correct

### "GitHub content not loading"
- Verify PAT has `Contents: Read-only` permission
- Check repository name and owner
- Verify branch name
- Check network connectivity

### "Form submission fails"
- Ensure form method is POST
- Check content-type header handling
- Verify API route has `prerender = false`

---

## Next Steps After Implementation

1. **Add real portfolio data** — Replace placeholder companies
2. **Upload logo assets** — Add company logos to `public/portfolio/logos/`
3. **Configure Vercel** — Add environment variables in Vercel dashboard
4. **Test production build** — `pnpm build && pnpm preview`
5. **Deploy** — Push to main branch for Vercel deployment
6. **Set up GitHub repo** (Phase 5) — Create private content repository

---

*Document created: December 13, 2025*
*Reference implementation: hypernova-site v0.1.0*
