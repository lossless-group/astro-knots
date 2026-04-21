---
title: "Dynamic OpenGraph Images"
lede: "As website content grows more numerous, across different audiences and different contexts, dynamically generated OpenGraph images can amplify shares and referral marketing while not bogging down the team with the need to create and maintain a separate image for each piece of content."
date_authored_initial_draft: 2025-10-13
date_authored_current_draft: 2025-10-13
date_authored_final_draft: 2025-10-13
date_first_published: null
date_last_updated: 2025-10-13
at_semantic_version: 0.0.1.1
publish: false
status: Attempted
augmented_with: "Claude Sonnet 4 on Claude Code"
category: Marketing-Site
date_created: 2025-10-13
date_modified: 2025-10-13
authors:
  - Michael Staton
image_prompt: "A view of inside a bus, where riders are looking down at their phones. Each rider is sharing websites and content on social media, and OpenGraph images are popping up above their head as if they are thought bubbles"
slug: dynamic-opengraph-images
tags: [Marketing-Site, Digital-Marketing]
---
# A System for Generating Dynamic OpenGraph Images based on Content and Variables

**Status:** Work in Progress - Core functionality implemented, Vercel deployment pending resolution

**Last Updated:** 2025-10-13

---

## Table of Contents

1. [Overview](#overview)
2. [Goals & Requirements](#goals--requirements)
3. [System Architecture](#system-architecture)
4. [Implementation Details](#implementation-details)
5. [Challenges Encountered](#challenges-encountered)
6. [Current Status](#current-status)
7. [Next Steps](#next-steps)
8. [References](#references)

---

## Overview

This specification documents the design and implementation of a dynamic Open Graph (OG) image generation system for the Cilantro Site. The system allows marketing and content teams to generate custom social share images on-the-fly by passing URL parameters, eliminating the need to manually create images for each piece of content.

### Problem Statement

Traditional OG image workflows require:
- Manually designing images in tools like Figma or Photoshop
- Exporting and optimizing each variation
- Managing dozens/hundreds of static image files
- Updating images whenever copy changes

This approach is slow, error-prone, and doesn't scale.

### Proposed Solution

Generate OG images dynamically at request time:
1. Create HTML/CSS templates for image layouts (1200×630px)
2. Accept URL parameters to customize text, colors, and content
3. Use Playwright to render templates in a headless browser
4. Screenshot the rendered page and return as WebP/PNG
5. Cache aggressively at CDN edge for performance

---

## Goals & Requirements

### Functional Requirements

- **FR1:** Generate 1200×630px images (standard OG dimensions)
- **FR2:** Support dynamic text via URL parameters (title, subtitle, highlight)
- **FR3:** Render within 3 seconds for good UX
- **FR4:** Support multiple template variants (default, article, product, etc.)
- **FR5:** Work with Astro SSR on Vercel serverless functions

### Non-Functional Requirements

- **NFR1:** Images should be visually high-quality (2x resolution for retina)
- **NFR2:** System should be maintainable by non-engineers (HTML/CSS templates)
- **NFR3:** Must fit within Vercel's serverless function constraints (50MB limit, 10s timeout on Hobby, 30s on Pro)
- **NFR4:** CDN cacheable for fast repeated access

---

## System Architecture

### High-Level Flow

```
┌─────────────┐
│   Browser   │
│  (Twitter,  │
│  LinkedIn)  │
└──────┬──────┘
       │ 1. Fetch OG image
       │ GET /api/og-image?title=Hello&subtitle=World
       ▼
┌──────────────────┐
│  Vercel Edge     │
│  CDN Cache       │ ◄── 5. Cache for 1 year
└────┬─────────────┘
     │ 2. Cache miss
     ▼
┌──────────────────┐
│  API Endpoint    │
│  /api/og-image   │
│  (Serverless)    │
└────┬─────────────┘
     │ 3. Render template
     │ GET /share-images/social-share-banner?title=Hello&subtitle=World
     ▼
┌──────────────────┐
│  Astro Template  │
│  (SSR)           │
│  1200×630 HTML   │
└────┬─────────────┘
     │ 4. Screenshot
     ▼
┌──────────────────┐
│  Playwright      │
│  Chromium        │
│  Screenshot      │
└────┬─────────────┘
     │ Convert to WebP
     ▼
┌──────────────────┐
│  Return Image    │
│  image/webp      │
└──────────────────┘
```

### File Structure

```
cilantro-site/
├── src/
│   ├── pages/
│   │   ├── api/
│   │   │   └── og-image.ts              # API endpoint - orchestrates generation
│   │   └── share-images/
│   │       └── social-share-banner.astro # Template - renders to 1200×630 HTML
│   └── utils/
│       └── og-image.ts                   # Utility functions (optional)
├── public/
│   ├── appIcon__Parslee.svg             # Branding assets referenced in template
│   └── trademark__Parslee--Lightest.svg
├── astro.config.mjs                      # Vercel adapter + SSR config
├── vercel.json                           # Deployment config
├── package.json                          # Dependencies: @astrojs/vercel, playwright-core, @sparticuz/chromium
└── SPEC__Dynamic-OG-Images.md           # This document
```

---

## Implementation Details

### 1. Template Page (Astro Component)

**File:** `src/pages/share-images/social-share-banner.astro`

This is a standalone Astro page that renders as a complete HTML document designed to be screenshotted at exactly 1200×630 pixels.

**Key Implementation Details:**

```astro
---
// CRITICAL: Disable pre-rendering so this page is server-rendered on each request
// This allows URL parameters to be read dynamically from Astro.url
export const prerender = false;

// Get URL parameters from the request
const { url } = Astro;
const title = url.searchParams.get('title') || null;
const highlightText = url.searchParams.get('highlight') || null;
const subtitle = url.searchParams.get('subtitle') || 'Document AI Platform';

// Default tagline
const defaultTagline = 'The <span class="highlight">missing Context Layer</span> for effective AI workloads and agentic workforces.';

// Build the tagline HTML server-side
let taglineHTML = defaultTagline;
if (title) {
  if (highlightText && title.includes(highlightText)) {
    // Wrap the highlight text in a span with gradient styling
    taglineHTML = title.replace(
      highlightText,
      `<span class="highlight">${highlightText}</span>`
    );
  } else {
    taglineHTML = title;
  }
}
---
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Parslee Social Share Banner - 1200x630</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #1a1a1a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .banner {
      position: relative;
      width: 1200px;
      height: 630px;
      background: linear-gradient(135deg, #0f1419 0%, #1a2332 50%, #0f1419 100%);
      overflow: hidden;
    }

    /* Glassmorphic effects, gradient orbs, etc. */
    .highlight {
      color: #3FE0DE;
      background: linear-gradient(135deg, #3FE0DE 0%, #00A991 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .tagline {
      font-size: 56px;
      font-weight: 700;
      line-height: 1.2;
      color: #ffffff;
      text-align: left;
      max-width: 900px;
      letter-spacing: -0.02em;
    }
  </style>
</head>
<body>
  <div class="banner">
    <!-- Content -->
    <div class="content">
      <!-- Header with Logo -->
      <div class="header">
        <img src="/appIcon__Parslee.svg" alt="Parslee App Icon" class="app-icon" />
        <img src="/trademark__Parslee--Lightest.svg" alt="Parslee" class="wordmark" />
      </div>

      <!-- Main Tagline - Uses server-rendered HTML -->
      <div class="tagline-section">
        <h1 class="tagline" id="tagline" set:html={taglineHTML}></h1>
      </div>

      <!-- Footer Card -->
      <div class="footer">
        <div class="glass-card">
          <div class="glass-card-dot"></div>
          <span class="glass-card-text" id="subtitle">{subtitle}</span>
        </div>
      </div>
    </div>
  </div>

  <script is:inline>
    // Signal that content is ready for Playwright
    document.body.setAttribute('data-og-ready', 'true');
  </script>
</body>
</html>
```

**Key Design Decisions:**

1. **Server-Side Rendering:** URL parameters are processed in Astro frontmatter and rendered directly into HTML. No client-side JavaScript needed for dynamic content.

2. **`export const prerender = false`:** Critical for SSR. Without this, Astro pre-renders the page at build time with default values.

3. **Inline Styles:** All CSS is inline to ensure the page is self-contained and renders identically in headless browsers.

4. **`data-og-ready` flag:** Signals to Playwright that rendering is complete and the screenshot can be taken.

5. **Exact Dimensions:** The `.banner` element is exactly 1200×630px to match OG image requirements.

### 2. API Endpoint (Serverless Function)

**File:** `src/pages/api/og-image.ts`

This endpoint orchestrates the image generation process.

**Key Implementation:**

```typescript
import type { APIRoute } from 'astro';
import { chromium as playwrightChromium } from 'playwright-core';
import chromium from '@sparticuz/chromium';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import os from 'os';

// CRITICAL: Disable pre-rendering so this endpoint is server-rendered on each request
export const prerender = false;

export const GET: APIRoute = async ({ url, request }) => {
  try {
    const params = url.searchParams;
    const template = params.get('template') || 'social-share-banner';
    const debug = params.get('debug') === 'true';

    // Generate cache key from all parameters
    const cacheKey = crypto
      .createHash('md5')
      .update(url.search)
      .digest('hex');

    // Determine cache directory based on environment
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
    const cacheDir = isServerless
      ? join(os.tmpdir(), 'og-cache')
      : './public/generated-og';
    const cachePath = join(cacheDir, `${cacheKey}.webp`);

    // Return cached image if it exists (mainly useful in dev)
    if (!isServerless && existsSync(cachePath)) {
      const imageBuffer = readFileSync(cachePath);
      return new Response(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // Ensure cache directory exists
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true });
    }

    // Build template URL with parameters
    const origin = url.origin || `${url.protocol}//${url.host}`;
    const templatePath = `/share-images/${template}`;
    let templateUrl = new URL(templatePath, origin);

    // Pass all query params except 'template' to the HTML template
    params.forEach((value, key) => {
      if (key !== 'template' && key !== 'debug') {
        templateUrl.searchParams.set(key, value);
      }
    });

    const templateUrlString = templateUrl.toString();

    console.log('📸 OG IMAGE GENERATION REQUEST');
    console.log('Template URL:', templateUrlString);

    // Debug mode: return info without generating image
    if (debug) {
      return new Response(JSON.stringify({
        message: 'Debug mode - no image generated',
        templateUrl: templateUrlString,
        params: Object.fromEntries(params.entries()),
      }, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Launch headless browser using @sparticuz/chromium for Vercel compatibility
    const browser = await playwrightChromium.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage({
      viewport: { width: 1200, height: 630 },
      deviceScaleFactor: 2, // 2x for retina displays
    });

    // Navigate to template with error handling
    const isDev = process.env.NODE_ENV === 'development';
    const response = await page.goto(templateUrlString, {
      waitUntil: isDev ? 'domcontentloaded' : 'networkidle',
      timeout: 15000,
    });

    if (!response || response.status() !== 200) {
      throw new Error(`Template returned status ${response?.status()}`);
    }

    // Wait for the dynamic content to be ready
    await page.waitForSelector('[data-og-ready="true"]', { timeout: 5000 });

    // Wait a bit for any animations to settle
    await page.waitForTimeout(500);

    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
    });

    await browser.close();

    // Convert PNG to WebP using sharp
    const sharp = await import('sharp');
    const finalImage = await sharp.default(screenshot)
      .webp({ quality: 90 })
      .toBuffer();

    // Save to cache (only in dev, serverless is ephemeral)
    if (!isServerless) {
      try {
        writeFileSync(cachePath, finalImage);
      } catch (err) {
        console.warn('Failed to write cache:', err);
      }
    }

    // Cache headers: CDN will cache for us in production
    const cacheControl = isServerless
      ? 'public, max-age=31536000, s-maxage=31536000, immutable'
      : 'public, max-age=31536000, immutable';

    return new Response(finalImage, {
      status: 200,
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': cacheControl,
      },
    });

  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate image',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
```

**Key Design Decisions:**

1. **Caching Strategy:**
   - Dev: Write to `./public/generated-og/` for persistence
   - Production: Rely on CDN edge caching (Vercel handles this)
   - Cache key: MD5 hash of query string

2. **Error Handling:** Comprehensive try/catch with informative error messages

3. **Debug Mode:** `?debug=true` returns JSON with template URL and parameters for troubleshooting

4. **Device Scale Factor:** 2x for retina displays (2400×1260 rendered, downscaled to 1200×630)

5. **Wait Strategy:**
   - Wait for `[data-og-ready="true"]` attribute
   - Additional 500ms for animations to settle

### 3. Astro Configuration

**File:** `astro.config.mjs`

```javascript
import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel'
import tailwind from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

// ... monorepo detection logic ...

export default defineConfig({
  // Adapter enables SSR for pages with `export const prerender = false`
  adapter: vercel({
    maxDuration: 30,  // OG image generation needs extra time for Playwright
    imageService: true,
  }),
  vite: {
    plugins: [tailwind()],
    resolve: {
      alias: aliases
    }
  }
})
```

**Key Configuration:**

- `adapter: vercel()` enables SSR capabilities
- `maxDuration: 30` increases timeout for Playwright operations
- Individual routes opt-in to SSR with `export const prerender = false`
- All other routes remain static (default behavior)

### 4. Deployment Configuration

**File:** `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "astro",
  "regions": ["iad1"]
}
```

**Simplified Configuration:**
- Vercel adapter handles all serverless function configuration automatically
- No manual build/install commands needed
- Environment variables set via Vercel dashboard (not in code)

### 5. Package Dependencies

**File:** `package.json` (relevant sections)

```json
{
  "packageManager": "pnpm@10.15.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "postinstall": "pnpm run approve-builds",
    "approve-builds": "pnpm approve-builds || true"
  },
  "dependencies": {
    "@astrojs/vercel": "^8.2.9",
    "@sparticuz/chromium": "^141.0.0",
    "astro": "^5.14.1",
    "playwright-core": "^1.56.0",
    "sharp": "^0.34.4"
  }
}
```

**Key Dependencies:**

- `@astrojs/vercel`: SSR adapter for Vercel deployment
- `playwright-core`: Lightweight Playwright without bundled browsers (~5MB)
- `@sparticuz/chromium`: Serverless-optimized Chromium binary (~50MB, designed for Lambda/Vercel)
- `sharp`: Fast image processing for PNG→WebP conversion

**Why NOT regular `playwright`?**
Regular Playwright bundles a 280MB+ Chromium binary, exceeding Vercel's 50MB serverless function size limit.

---

## Challenges Encountered

### Challenge 1: Astro Routing and Static File Serving

**Issue:** Initial implementation placed templates in `public/share-images/social-share-banner.html`, assuming Astro would serve HTML files from the public directory.

**Reality:** Astro's `public/` directory is only for static assets (images, fonts, etc.), not routes. Accessing `http://localhost:4321/share-images/social-share-banner.html` returned 404.

**Solution:** Moved template to `src/pages/share-images/social-share-banner.astro`. Astro's file-based routing automatically creates the route `/share-images/social-share-banner`.

**Lesson Learned:** Understand framework conventions. Astro has a clear separation between static assets (`public/`) and routes (`src/pages/`).

---

### Challenge 2: Client-Side JavaScript Timing with Playwright

**Initial Approach:** Used client-side JavaScript to read URL parameters and update DOM:

```javascript
// ❌ This approach failed
const params = new URLSearchParams(window.location.search);
const title = params.get('title');
document.getElementById('tagline').textContent = title;
document.body.setAttribute('data-og-ready', 'true');
```

**Issue:** Playwright was taking screenshots before JavaScript executed, resulting in images showing default content instead of dynamic parameters.

**Evidence from logs:**
```
📝 Tagline text Playwright sees: The missing Context Layer for...
📝 Subtitle text Playwright sees: Document AI Platform
```
(Default content, not the dynamic values passed in URL)

**Attempted Fixes:**
1. Changed `waitUntil` from `'networkidle'` to `'domcontentloaded'` (Vite's HMR keeps connections open)
2. Added `data-og-ready` flag and waited for it with `page.waitForSelector('[data-og-ready="true"]')`
3. Changed `<script>` to `<script is:inline>` to prevent Astro processing

**None of these worked.** JavaScript timing in headless browsers is unpredictable.

**Solution:** Switched to server-side rendering in Astro frontmatter:

```astro
---
export const prerender = false; // Critical!

const { url } = Astro;
const title = url.searchParams.get('title') || null;
const subtitle = url.searchParams.get('subtitle') || 'Document AI Platform';

let taglineHTML = defaultTagline;
if (title && highlightText) {
  taglineHTML = title.replace(highlightText, `<span class="highlight">${highlightText}</span>`);
}
---
<h1 class="tagline" set:html={taglineHTML}></h1>
<span>{subtitle}</span>
```

**After Fix - Logs:**
```
📝 Tagline text Playwright sees: VICTORY
📝 Subtitle text Playwright sees: It Finally Works
```
✅ Dynamic content now present immediately in HTML

**Lesson Learned:** For headless browser automation, prefer server-side rendering over client-side JavaScript whenever possible. SSR guarantees content is in the HTML immediately.

---

### Challenge 3: Astro SSR Configuration

**Issue:** Even with server-side rendering in frontmatter, URL parameters were still returning empty/null.

**Root Cause:** Astro defaults to static site generation (SSG). Without an adapter, `Astro.url.searchParams` are not accessible because pages are pre-rendered at build time, not request time.

**Evidence:** Template worked perfectly in browser with parameters, but API endpoint wasn't reading them.

**Solution - Part 1:** Install and configure Vercel adapter:

```bash
pnpm add @astrojs/vercel
```

```javascript
// astro.config.mjs
import vercel from '@astrojs/vercel'

export default defineConfig({
  adapter: vercel({
    maxDuration: 30,
  }),
})
```

**Solution - Part 2:** Add `export const prerender = false` to BOTH:
- Template: `src/pages/share-images/social-share-banner.astro`
- API endpoint: `src/pages/api/og-image.ts`

Without the adapter, `prerender = false` has no effect. Without `prerender = false`, routes are still pre-rendered even with an adapter.

**Lesson Learned:** Astro's SSR requires:
1. An adapter (Vercel, Netlify, Node, etc.)
2. Explicit opt-in per route with `export const prerender = false`
3. Understanding that default behavior is static, SSR is opt-in

---

### Challenge 4: Vercel Deployment - Package Manager Mismatch

**Issue:** Deployment logs showed:

```
WARN  Moving @tailwindcss/vite that was installed by a different package manager to "node_modules/.ignored
WARN  Moving playwright that was installed by a different package manager to "node_modules/.ignored
ERR_PNPM_META_FETCH_FAIL  GET https://registry.npmjs.org/@playwright%2Ftest: Value of "this" must be of type URLSearchParams
Error: Command "pnpm install" exited with 1
```

**Root Cause:** Vercel was not using pnpm by default, despite the `installCommand: "pnpm install"` in vercel.json.

**Solution:** Add explicit package manager field:

**package.json:**
```json
{
  "packageManager": "pnpm@10.15.0"
}
```

**vercel.json:**
```json
{
  "framework": "astro",
  "packageManager": "pnpm"
}
```

**Lesson Learned:** Monorepo projects using pnpm need to explicitly declare the package manager in both locations.

---

### Challenge 5: Vercel Function Size Limit (CRITICAL - UNRESOLVED)

**Issue:** Regular Playwright installation includes a ~280MB Chromium binary. Vercel serverless functions have a 50MB size limit.

**Error During Deployment:**
Build succeeds but function deployment fails due to size constraints.

**Attempted Solution:** Replace with serverless-compatible packages:

```bash
pnpm remove playwright @playwright/test
pnpm add playwright-core @sparticuz/chromium
```

**Code Changes:**
```typescript
import { chromium as playwrightChromium } from 'playwright-core';
import chromium from '@sparticuz/chromium';

const browser = await playwrightChromium.launch({
  args: chromium.args,
  executablePath: await chromium.executablePath(),
  headless: true,
});
```

**What is @sparticuz/chromium?**
- Optimized Chromium build for AWS Lambda and Vercel (~50MB)
- Strips out unnecessary components
- Designed specifically for serverless environments
- Based on the community-maintained successor to `chrome-aws-lambda`

**Local Development Issue:**
`@sparticuz/chromium` only works in serverless environments (Lambda, Vercel). Running locally produces:

```
Error: browserType.launch: spawn ENOEXEC
```

This is expected behavior - the package is compiled for Linux serverless runtimes, not macOS/Windows.

**Current Status:**
- ✅ Code updated to use `playwright-core` + `@sparticuz/chromium`
- ✅ Committed and pushed to repository
- ⏳ Vercel deployment not yet tested
- ⚠️ Local development requires keeping regular `playwright` for testing, or testing directly on Vercel

**Lesson Learned:** Serverless environments have strict constraints. Third-party services (Browserless, Puppeteer.io) or alternative approaches may be more practical than bundling browsers in functions.

---

## Current Status

### What Works ✅

1. **Template Rendering:** Astro template renders beautifully at 1200×630px with glassmorphic design
2. **Server-Side Parameters:** URL parameters are processed server-side and rendered into HTML
3. **SSR Configuration:** Vercel adapter configured, `prerender = false` set on both routes
4. **Local Dev (Partial):** Works with regular Playwright locally (before switching to @sparticuz/chromium)
5. **Debug Mode:** `?debug=true` returns JSON with template URL for troubleshooting
6. **Caching Strategy:** Filesystem cache in dev, CDN cache headers for production

### What's Pending ⏳

1. **Vercel Deployment:** Code is committed but not yet deployed to Vercel with @sparticuz/chromium
2. **Production Testing:** Need to verify serverless function works end-to-end on Vercel
3. **Performance Optimization:** Haven't measured cold start times or memory usage
4. **Template Variants:** Only one template implemented (social-share-banner)
5. **Error Monitoring:** No Sentry/logging integration for production errors

### Known Issues ⚠️

1. **Local Dev Broken:** `@sparticuz/chromium` doesn't work on macOS/Windows, only Linux serverless
2. **Build Time Increased:** Playwright-core still adds ~30s to build time
3. **No Fallback Images:** If generation fails, no graceful degradation to static fallback

---

## Next Steps

### Short Term (To Complete This Feature)

1. **Deploy to Vercel and Test**
   - Push current code to Vercel
   - Test image generation in production: `/api/og-image?title=Test&subtitle=Works`
   - Measure cold start time, warm invocation time
   - Check function size in Vercel dashboard

2. **Fix Local Development**
   - Option A: Keep regular `playwright` as devDependency, use conditional imports
   - Option B: Use Docker for local dev to match Linux serverless environment
   - Option C: Accept that local dev uses mock/static images, test on Vercel

3. **Add Error Handling**
   - Return static fallback image on generation failure
   - Add Sentry integration for error tracking
   - Implement retry logic for transient failures

4. **Performance Optimization**
   - Add warmup requests to keep function hot
   - Optimize template HTML/CSS for faster rendering
   - Consider pre-generating common variations at build time

### Medium Term (Production Readiness)

1. **Multiple Templates**
   - Article template with author info
   - Product template with pricing
   - Event template with date/time
   - Allow template selection via `?template=` parameter

2. **Enhanced Customization**
   - Support custom colors: `?bg=0f1419&accent=3FE0DE`
   - Upload custom logos
   - Font selection

3. **Monitoring & Analytics**
   - Log usage patterns (which templates, which parameters)
   - Track generation success/failure rates
   - Monitor function performance metrics

4. **Documentation**
   - API documentation for marketing team
   - Template design guide
   - Troubleshooting guide

### Long Term (Scale & Optimize)

1. **Alternative Architectures**
   - Consider Cloudflare Workers + Puppeteer
   - Consider dedicated OG image service (Cloudinary, imgix)
   - Consider using Next.js `@vercel/og` library approach (uses Satori, no browser needed)

2. **Advanced Features**
   - Animated OG images (GIF/MP4)
   - A/B testing different designs
   - Automatic image optimization based on platform (Twitter card vs LinkedIn)

3. **Cost Optimization**
   - Measure costs per 1000 images
   - Implement intelligent caching strategy
   - Consider pre-generation for high-traffic pages

---

## References

### Documentation

- [Astro Server-Side Rendering (SSR)](https://docs.astro.build/en/guides/on-demand-rendering/)
- [Astro Vercel Adapter](https://docs.astro.build/en/guides/integrations-guide/vercel/)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [@sparticuz/chromium on GitHub](https://github.com/Sparticuz/chromium)
- [Open Graph Protocol Specification](https://ogp.me/)

### Community Examples

- [Generate OG images with Playwright on Vercel](https://playwright.tech/blog/generate-opengraph-images-using-playwright)
- [Next.js OG Image Generation](https://vercel.com/docs/functions/edge-functions/og-image-generation)
- [Satori - SVG-based OG image generation](https://github.com/vercel/satori)

### Related Tools

- [Browserless.io](https://www.browserless.io/) - Hosted browser automation
- [Puppeteer.io](https://puppeteer.io/) - Similar to Playwright
- [Cloudinary Dynamic Images](https://cloudinary.com/documentation/image_transformations)
- [@vercel/og](https://vercel.com/docs/functions/edge-functions/og-image-generation) - Next.js built-in solution

---

## Appendix: Usage Examples

### Basic Usage

```html
<!-- In your page's <head> -->
<meta property="og:image" content="https://yoursite.com/api/og-image?title=My+Article&subtitle=Learn+Something+New" />
```

### With Highlight Text

```html
<meta property="og:image" content="https://yoursite.com/api/og-image?title=The+missing+Context+Layer&highlight=missing+Context+Layer&subtitle=Document+AI+Platform" />
```

### Debug Mode

```
https://yoursite.com/api/og-image?template=social-share-banner&title=Test&debug=true
```

Returns JSON:
```json
{
  "message": "Debug mode - no image generated",
  "templateUrl": "https://yoursite.com/share-images/social-share-banner?title=Test",
  "params": {
    "template": "social-share-banner",
    "title": "Test",
    "debug": "true"
  }
}
```

### Testing Template Directly

```
https://yoursite.com/share-images/social-share-banner?title=Direct+Test&subtitle=View+in+Browser
```

View the template in your browser to see exactly what Playwright will screenshot.

---

## Conclusion

This specification documents a sophisticated system for generating dynamic Open Graph images using Astro SSR and Playwright. While the core functionality is implemented and works locally, deployment to Vercel serverless functions remains pending due to browser binary size constraints.

The system demonstrates the power of server-side rendering for headless browser automation and highlights the unique challenges of serverless deployments. Whether this specific implementation is deployed or an alternative approach is chosen (third-party service, Satori/SVG-based, pre-generation), the learnings documented here provide valuable context for future decisions.

**Status:** Paused - Core implementation complete, awaiting Vercel deployment validation or architectural pivot.

**Last Updated:** 2025-10-13 by Claude Code
