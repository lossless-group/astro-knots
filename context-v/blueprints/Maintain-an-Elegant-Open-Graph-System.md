---
date_created: 2025-10-10
date_modified: 2025-12-27
title: Maintain an Elegant Open Graph System
lede: A scalable, consistent architecture for Open Graph metadata optimized for the messaging-first share economy.
date_authored_initial_draft: 2025-10-10
date_authored_current_draft: 2025-12-27
date_authored_final_draft: null
date_first_published: 2025-10-10
date_last_updated: 2025-12-27
at_semantic_version: 0.2.0
status: In-Progress
publish: true
authors:
  - Michael Staton
augmented_with: Claude Code
category: Blueprints
tags: [open-graph, SEO, metadata, social-sharing, messaging]
image_prompt: A robot conducting a symphony.  Each musician is playing a social media branded instrument.  Above them, shares are going to Facebook, LinkedIn, and X
banner_image: https://ik.imagekit.io/xvpgfijuw/uploads/lossless/2025-sept/Maintain-an-Elegant-Open-Graph-System_banner_image_1760114662425_616dxZwfn.webp
portrait_image: https://ik.imagekit.io/xvpgfijuw/uploads/lossless/2025-sept/Maintain-an-Elegant-Open-Graph-System_portrait_image_1760114663984_D3P-Xr_MB.webp
square_image: https://ik.imagekit.io/xvpgfijuw/uploads/lossless/2025-sept/Maintain-an-Elegant-Open-Graph-System_square_image_1760114665324__jTn7ykb9.webp
---

## Why This Matters: The Messaging-First Share Economy

**The world runs on share buttons.** When someone taps "Share" on mobile and sends a link via iMessage, WhatsApp, LinkedIn DM, Slack, or Discord, the link preview that appears IS your brand's first impression.

This is now more important than traditional SEO for many businesses:
- **iMessage/WhatsApp** are how people share interesting content with friends, family, and colleagues
- **LinkedIn** is where B2B relationships form and professional content spreads
- **Slack/Discord** are where teams discover tools and resources
- **Email clients** increasingly render rich link previews

A broken or missing preview means your content looks unprofessional, untrustworthy, or simply gets ignored. A compelling preview drives clicks.

**This blueprint ensures every page on every site produces rich, accurate, platform-optimized previews.**

---

## Objectives

- Implement an elegant, understandable, usable system for codifying and improvising Open Graph metadata at a per-page or per-collection or per-shareable-content level (any level the developers or marketers need).
- Optimize for messaging apps first (WhatsApp, iMessage, LinkedIn), not just traditional social.
- Centralize defaults while allowing clean per-page overrides.
- Keep metadata rendering consistent in one place (layout), not scattered.
- Support dynamic routes, content collections, and multi-brand needs.
- Integrate structured data (JSON-LD) alongside Open Graph.
- Enable optional dynamic OG image generation without complicating most pages.

## Guiding Principles

- One source of truth for defaults and types
- Small, composable helpers that return ready-to-render meta tags
- Pages provide only the minimum context (title/description/image/url); everything else is inferred
- Layout owns actual `<meta>` and canonical rendering for consistency
- **Always use absolute URLs** — messaging apps require them; relative paths break previews
- Respect character limits — platforms truncate aggressively

## Override Hierarchy

The system should be approachable at every level of the organization:

| Level | Who Uses It | What They Do |
|-------|-------------|--------------|
| **Site defaults** | Developer (once) | Set `SITE_SEO` config and forget — 80% of pages are covered automatically |
| **Collection defaults** | Developer | Define defaults per content type (blog posts get `article` type, team pages get `profile` type) |
| **Page overrides** | Developer or Marketer | High-value landing pages get custom titles, descriptions, images via props or frontmatter |
| **Frontmatter fields** | Marketer or Content Author | Specify `shareImage`, `description` directly in markdown — no code changes needed |

**The goal:** A marketer should be able to control share previews by editing frontmatter. A developer should be able to set sensible defaults and walk away. Neither should need to understand the other's domain.

---

## Platform-Specific Considerations

Different platforms render previews differently. Design for the lowest common denominator, then enhance.

### WhatsApp
- **Primary concern:** Aggressive caching. WhatsApp caches previews for extended periods.
- **Image:** Uses `og:image`. Displays at roughly 300x157 (crops to ~1.91:1 ratio)
- **Title:** Uses `og:title`. Truncates around 65 characters
- **Description:** Uses `og:description`. Truncates around 100 characters
- **Cache busting:** Nearly impossible. Change the URL or wait. Adding query params like `?v=2` can help force re-fetch.
- **Requirement:** `og:image` MUST be an absolute URL with HTTPS

### iMessage (iOS/macOS)
- **Image:** Uses `og:image`. Large preview on iOS 17+
- **Title:** Uses `og:title`
- **Description:** Uses `og:description`
- **Behavior:** Generally respects meta tags well; caches moderately
- **Fallback:** Will attempt to generate preview from page content if OG tags missing

### LinkedIn
- **Primary use case:** B2B content, professional sharing, company pages
- **Image:** Uses `og:image`. Displays at 1200x627 (crops to 1.91:1). Images smaller than 200x200 may not display.
- **Title:** Uses `og:title`. Truncates around 70 characters
- **Description:** Uses `og:description`. Truncates around 100 characters in feed
- **Special tags:** Recognizes `article:author`, `article:published_time`
- **Cache:** Caches aggressively. Use Post Inspector to force refresh.

### Slack
- **Image:** Uses `og:image`. Unfurls with large preview
- **Title:** Uses `og:title`
- **Description:** Uses `og:description`
- **Special:** Recognizes `twitter:label1`/`twitter:data1` for additional metadata display
- **Fallback:** Falls back to page scraping if OG missing

### Discord
- **Image:** Uses `og:image`. Embeds with preview
- **Title:** Uses `og:title`
- **Description:** Uses `og:description`
- **Color:** Recognizes `theme-color` meta tag for embed accent color
- **Special:** Shows site name from `og:site_name`

### Twitter/X
- **Card types:** `summary`, `summary_large_image`, `player`, `app`
- **Image:** Uses `twitter:image` (falls back to `og:image`)
- **Title:** Uses `twitter:title` (falls back to `og:title`). Max 70 chars
- **Description:** Uses `twitter:description` (falls back to `og:description`). Max 200 chars
- **Required:** `twitter:card` to specify card type

### Facebook
- **Image:** Uses `og:image`. Recommended 1200x630. Min 200x200, ideal 600x315+
- **Title:** Uses `og:title`
- **Description:** Uses `og:description`
- **Special:** Full OG protocol support including arrays and structured properties

---

## Character Limits Reference

Design content to look good when truncated:

| Property | Safe Length | Platform Notes |
|----------|-------------|----------------|
| `og:title` | **60 chars** | LinkedIn/Twitter truncate ~70, but 60 is safe everywhere |
| `og:description` | **155 chars** | WhatsApp ~100, LinkedIn ~100 in feed, Twitter ~200 |
| `og:site_name` | **30 chars** | Usually displayed in full |

**Recommendation:** Helper functions should warn or truncate when limits exceeded.

---

## Recommended Structure

### Project-level defaults and helpers

```
src/
├── config/
│   └── seo.ts           # Site defaults, types, character limits
├── utils/
│   ├── og.ts            # OG/Twitter meta tag builder
│   └── structured-data.ts # JSON-LD schema builders
└── layouts/
    └── BaseLayout.astro  # Renders meta, canonical, JSON-LD
```

### Monorepo shared package (optional, as sites grow)

```
packages/seo/
├── types.ts             # Shared interfaces
├── defaults.ts          # Default builder factory
├── og.ts                # OG helper
├── structured-data.ts   # JSON-LD helpers
└── index.ts             # Barrel export
```

Sites import from `@knots/seo` (following the copy-pattern workflow).

---

## Site Defaults (Config)

Define one config object to drive defaults across pages.

```ts
// src/config/seo.ts

export interface SiteSEO {
  siteName: string;
  siteUrl: string; // REQUIRED: absolute URL for production (e.g., 'https://example.com')
  twitterHandle?: string;
  linkedInCompany?: string; // Company page URL for attribution
  defaultTitle: string;
  defaultDescription: string;
  defaultImage: string; // MUST be absolute URL or path under /public
  defaultImageAlt: string;
  themeColor?: string; // For Discord embeds, PWA, etc.
  locale?: string; // e.g., 'en_US'
}

export interface ShareMetaInput {
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile' | 'product' | string;
  // Article-specific (for blog posts, news)
  publishedTime?: string; // ISO 8601
  modifiedTime?: string;  // ISO 8601
  author?: string;
  section?: string; // e.g., 'Technology', 'Business'
  tags?: string[];
}

// Character limits for safety
export const CHAR_LIMITS = {
  title: 60,
  description: 155,
  siteName: 30,
} as const;

export const SITE_SEO: SiteSEO = {
  siteName: 'Your Site Name',
  siteUrl: 'https://example.com', // Set from env in production
  defaultTitle: 'Your Site Name',
  defaultDescription: 'Your compelling site description under 155 characters.',
  defaultImage: '/og-default.jpg', // 1200x630, under /public
  defaultImageAlt: 'Your Site Name logo and tagline',
  twitterHandle: '@yourhandle',
  themeColor: '#1a1a2e',
  locale: 'en_US',
};
```

---

## Helper API (Meta Composition)

Keep helpers small, predictable, and defensive about character limits.

```ts
// src/utils/og.ts
import { SITE_SEO, CHAR_LIMITS } from '../config/seo';
import type { ShareMetaInput } from '../config/seo';

interface MetaTag {
  name?: string;
  property?: string;
  content: string;
}

/**
 * Truncates string to limit, adding ellipsis if needed
 */
function truncate(str: string, limit: number): string {
  if (str.length <= limit) return str;
  return str.slice(0, limit - 1).trim() + '…';
}

/**
 * Ensures URL is absolute. Prepends siteUrl if relative.
 */
function ensureAbsoluteUrl(url: string, siteUrl: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Handle leading slash
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${siteUrl.replace(/\/$/, '')}${path}`;
}

/**
 * Builds Open Graph and Twitter meta tags from input.
 * Falls back to site defaults for any missing values.
 */
export function buildOgMeta(input: ShareMetaInput = {}): MetaTag[] {
  const siteUrl = SITE_SEO.siteUrl;

  const title = truncate(input.title ?? SITE_SEO.defaultTitle, CHAR_LIMITS.title);
  const description = truncate(input.description ?? SITE_SEO.defaultDescription, CHAR_LIMITS.description);
  const image = ensureAbsoluteUrl(input.image ?? SITE_SEO.defaultImage, siteUrl);
  const imageAlt = input.imageAlt ?? SITE_SEO.defaultImageAlt;
  const url = input.url ? ensureAbsoluteUrl(input.url, siteUrl) : undefined;
  const type = input.type ?? 'website';

  const meta: MetaTag[] = [
    // Basic meta
    { name: 'description', content: description },

    // Open Graph (primary - used by most platforms)
    { property: 'og:type', content: type },
    { property: 'og:site_name', content: SITE_SEO.siteName },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: imageAlt },
  ];

  // URL (required for proper canonical reference)
  if (url) {
    meta.push({ property: 'og:url', content: url });
  }

  // Locale
  if (SITE_SEO.locale) {
    meta.push({ property: 'og:locale', content: SITE_SEO.locale });
  }

  // Article-specific properties (for blog posts, news articles)
  if (type === 'article') {
    if (input.publishedTime) {
      meta.push({ property: 'article:published_time', content: input.publishedTime });
    }
    if (input.modifiedTime) {
      meta.push({ property: 'article:modified_time', content: input.modifiedTime });
    }
    if (input.author) {
      meta.push({ property: 'article:author', content: input.author });
    }
    if (input.section) {
      meta.push({ property: 'article:section', content: input.section });
    }
    if (input.tags?.length) {
      input.tags.forEach(tag => {
        meta.push({ property: 'article:tag', content: tag });
      });
    }
  }

  // Twitter Card (fallback to OG, but explicit is better)
  meta.push({ name: 'twitter:card', content: 'summary_large_image' });
  if (SITE_SEO.twitterHandle) {
    meta.push({ name: 'twitter:site', content: SITE_SEO.twitterHandle });
  }
  meta.push({ name: 'twitter:title', content: title });
  meta.push({ name: 'twitter:description', content: description });
  meta.push({ name: 'twitter:image', content: image });
  meta.push({ name: 'twitter:image:alt', content: imageAlt });

  // Theme color (for Discord embeds, PWA, browser chrome)
  if (SITE_SEO.themeColor) {
    meta.push({ name: 'theme-color', content: SITE_SEO.themeColor });
  }

  return meta;
}

/**
 * Builds canonical URL from pathname
 */
export function buildCanonical(pathname: string): string {
  return ensureAbsoluteUrl(pathname, SITE_SEO.siteUrl);
}
```

---

## JSON-LD Structured Data

**Why JSON-LD matters:** While OG tags control social previews, JSON-LD/Schema.org structured data powers:
- Google rich results (breadcrumbs, FAQ, articles, products)
- Knowledge panels
- Voice assistant answers
- Future AI-powered search (GEO - Generative Engine Optimization)

**Relationship to OG:** They're complementary. OG tags = social sharing. JSON-LD = search engines and AI.

```ts
// src/utils/structured-data.ts
import { SITE_SEO } from '../config/seo';

interface WebSiteSchema {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  description?: string;
  publisher?: OrganizationSchema;
}

interface OrganizationSchema {
  '@context'?: 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo?: string;
  sameAs?: string[]; // Social profiles
}

interface ArticleSchema {
  '@context': 'https://schema.org';
  '@type': 'Article' | 'BlogPosting' | 'NewsArticle';
  headline: string;
  description?: string;
  image?: string | string[];
  datePublished?: string;
  dateModified?: string;
  author?: PersonSchema | OrganizationSchema;
  publisher?: OrganizationSchema;
  mainEntityOfPage?: string;
}

interface PersonSchema {
  '@type': 'Person';
  name: string;
  url?: string;
}

interface BreadcrumbSchema {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: {
    '@type': 'ListItem';
    position: number;
    name: string;
    item?: string;
  }[];
}

/**
 * Builds WebSite schema (use on homepage)
 */
export function buildWebSiteSchema(): WebSiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_SEO.siteName,
    url: SITE_SEO.siteUrl,
    description: SITE_SEO.defaultDescription,
  };
}

/**
 * Builds Organization schema
 */
export function buildOrganizationSchema(options: {
  logo?: string;
  socialProfiles?: string[];
} = {}): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_SEO.siteName,
    url: SITE_SEO.siteUrl,
    ...(options.logo && { logo: options.logo }),
    ...(options.socialProfiles?.length && { sameAs: options.socialProfiles }),
  };
}

/**
 * Builds Article schema (for blog posts, news)
 */
export function buildArticleSchema(options: {
  type?: 'Article' | 'BlogPosting' | 'NewsArticle';
  headline: string;
  description?: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  authorUrl?: string;
  url: string;
}): ArticleSchema {
  const schema: ArticleSchema = {
    '@context': 'https://schema.org',
    '@type': options.type ?? 'Article',
    headline: options.headline,
    mainEntityOfPage: options.url,
  };

  if (options.description) schema.description = options.description;
  if (options.image) schema.image = options.image;
  if (options.datePublished) schema.datePublished = options.datePublished;
  if (options.dateModified) schema.dateModified = options.dateModified;

  if (options.authorName) {
    schema.author = {
      '@type': 'Person',
      name: options.authorName,
      ...(options.authorUrl && { url: options.authorUrl }),
    };
  }

  schema.publisher = {
    '@type': 'Organization',
    name: SITE_SEO.siteName,
    url: SITE_SEO.siteUrl,
  };

  return schema;
}

/**
 * Builds Breadcrumb schema
 */
export function buildBreadcrumbSchema(items: { name: string; url?: string }[]): BreadcrumbSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url && { item: item.url }),
    })),
  };
}

/**
 * Serializes schema to JSON-LD script tag content
 */
export function serializeSchema(schema: object): string {
  return JSON.stringify(schema);
}
```

---

## Layout Responsibilities

The base layout renders all meta tags, canonical, and JSON-LD consistently.

```astro
---
// src/layouts/BaseLayout.astro
import { buildOgMeta, buildCanonical } from '../utils/og';
import { buildWebSiteSchema, serializeSchema } from '../utils/structured-data';
import type { ShareMetaInput } from '../config/seo';

interface Props {
  title: string;
  meta?: ShareMetaInput;
  jsonLd?: object | object[];
  noIndex?: boolean;
}

const { title, meta = {}, jsonLd, noIndex = false } = Astro.props;

// Build OG meta tags
const ogMeta = buildOgMeta({
  ...meta,
  url: meta.url ?? Astro.url.pathname,
});

// Build canonical URL
const canonical = buildCanonical(Astro.url.pathname);

// Prepare JSON-LD (array support for multiple schemas)
const schemas = jsonLd
  ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd])
  : [];
---

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>{title}</title>

  <!-- Canonical -->
  <link rel="canonical" href={canonical} />

  <!-- Robots -->
  {noIndex && <meta name="robots" content="noindex, nofollow" />}

  <!-- OG and Twitter Meta -->
  {ogMeta.map((m) => (
    m.property
      ? <meta property={m.property} content={m.content} />
      : <meta name={m.name} content={m.content} />
  ))}

  <!-- JSON-LD Structured Data -->
  {schemas.map((schema) => (
    <script type="application/ld+json" set:html={serializeSchema(schema)} />
  ))}

  <slot name="head" />
</head>
<body>
  <slot />
</body>
</html>
```

---

## Image Fallback Chain

When determining which image to use for OG tags, follow this cascade:

1. **Page-specific `shareImage`** — Explicitly set in frontmatter or page props
2. **Content hero/banner image** — The main visual of the content
3. **Collection default** — A default image for all posts in a collection (e.g., blog default)
4. **Site default** — `SITE_SEO.defaultImage`

```ts
// Example: resolving image in a content page
const shareImage =
  post.data.shareImage ??      // Explicit share image
  post.data.heroImage ??       // Hero image as fallback
  collectionDefaults.image ??  // Collection default
  SITE_SEO.defaultImage;       // Site default
```

**Tip:** Create collection-specific defaults in your config:

```ts
// src/config/seo.ts
export const COLLECTION_DEFAULTS = {
  blog: {
    image: '/og-blog-default.jpg',
    type: 'article' as const,
  },
  team: {
    image: '/og-team-default.jpg',
    type: 'profile' as const,
  },
  // ...
};
```

---

## Asset Guidance

### Dimensions
- **Primary:** 1200x630 (1.91:1 ratio) — Works everywhere
- **Minimum:** 600x315 — Below this, some platforms won't show image
- **Square fallback:** 1200x1200 for platforms that crop to square (rare)

### Format
- **Preferred:** JPEG or WebP
- **Avoid:** PNG with transparency (some platforms render black background)
- **File size:** Keep under 5MB; ideally under 1MB for fast unfurling

### Location
- Store in `public/` for stable, predictable URLs
- Use fingerprinted filenames for cache busting: `og-homepage-v2.jpg`

### Naming Convention
```
public/
├── og-default.jpg           # Site-wide fallback
├── og-blog-default.jpg      # Blog collection default
├── og-[page-name].jpg       # Page-specific
└── og/
    └── posts/
        └── [slug].jpg       # Per-post images (if generated)
```

---

## Page Usage Patterns

### Static Page

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { SITE_SEO } from '../config/seo';
import { buildWebSiteSchema } from '../utils/structured-data';

const title = 'About Us | Your Company';
const description = 'Learn about our mission, team, and values.';
---

<BaseLayout
  title={title}
  meta={{
    title,
    description,
    image: '/og-about.jpg',
  }}
  jsonLd={buildWebSiteSchema()}
>
  <!-- page content -->
</BaseLayout>
```

### Dynamic Route (Blog Post)

```astro
---
import { getEntry } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { buildArticleSchema } from '../../utils/structured-data';
import { SITE_SEO, COLLECTION_DEFAULTS } from '../../config/seo';

const { slug } = Astro.params;
const post = await getEntry('blog', slug);

const title = post.data.title;
const description = post.data.description ?? post.data.excerpt;
const image = post.data.shareImage ?? post.data.heroImage ?? COLLECTION_DEFAULTS.blog.image;
const url = new URL(`/blog/${slug}`, SITE_SEO.siteUrl).toString();

const articleSchema = buildArticleSchema({
  type: 'BlogPosting',
  headline: title,
  description,
  image,
  datePublished: post.data.publishedDate?.toISOString(),
  dateModified: post.data.updatedDate?.toISOString(),
  authorName: post.data.author,
  url,
});
---

<BaseLayout
  title={`${title} | ${SITE_SEO.siteName}`}
  meta={{
    title,
    description,
    image,
    url,
    type: 'article',
    publishedTime: post.data.publishedDate?.toISOString(),
    modifiedTime: post.data.updatedDate?.toISOString(),
    author: post.data.author,
    tags: post.data.tags,
  }}
  jsonLd={articleSchema}
>
  <!-- post content -->
</BaseLayout>
```

### Content Collection Frontmatter Standard

Standardize frontmatter across collections for predictable metadata:

```yaml
---
title: "Your Post Title"
description: "A compelling description under 155 characters."
publishedDate: 2025-01-15
updatedDate: 2025-01-20
author: "Author Name"
heroImage: "/images/posts/my-post-hero.jpg"
shareImage: "/og/posts/my-post.jpg"  # Optional: explicit OG image
tags:
  - technology
  - web development
---
```

---

## Absolute URLs and Canonical

### Configuration

```js
// astro.config.mjs
export default defineConfig({
  site: 'https://your-domain.com',
});
```

### Usage

```ts
// Always compute absolute URLs for OG tags
const canonical = new URL(Astro.url.pathname, Astro.site).toString();
const ogImage = new URL('/og-image.jpg', Astro.site).toString();
```

**Critical:** Messaging apps (especially WhatsApp) REQUIRE absolute HTTPS URLs. Relative paths will break previews.

---

## Dynamic OG Image Generation

### The Problem with Custom Images

**Custom image overrides exist** — marketers can always specify a `shareImage` in frontmatter to use a bespoke graphic. But this approach doesn't scale:

- Creating custom OG images for every blog post, team member, or product page is time-consuming
- Designers become bottlenecks
- Quality becomes inconsistent
- Many pages simply go without proper images

### The GitHub Approach: Branded Templates + Dynamic Text

GitHub solved this elegantly. Every repository has a recognizable OG image:
- **Consistent branded layout** — same border, colors, typography
- **Dynamic text** — repo name, description, stats pulled in automatically
- **Instantly recognizable** — you know it's a GitHub link before reading

**This is the model to follow.** Design 2-3 branded templates, then generate images dynamically by injecting page-specific text. The result:
- Every page gets a proper OG image automatically
- Brand consistency across hundreds of pages
- Zero designer involvement for routine content
- Custom overrides still available for hero campaigns

### Implementation Approaches

| Approach | When to Use | Tools |
|----------|-------------|-------|
| **Build-time** | Finite, known content (blog, docs) | `satori`, `@vercel/og`, `puppeteer` |
| **Runtime API** | Dynamic/user-generated content | `/api/og?title=...` endpoint |
| **Hybrid** | Pre-generate key pages, runtime for long-tail | Combination |

### Template Philosophy

Design templates that work with just a title. Everything else is optional enhancement:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   [LOGO]                                        [SITE NAME]    │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                         │  │
│   │   {{TITLE}}                                             │  │
│   │   A Dynamic Title That Can Span Multiple Lines          │  │
│   │                                                         │  │
│   │   {{DESCRIPTION}} (optional, truncated)                 │  │
│   │                                                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   {{AUTHOR}} · {{DATE}} · {{CATEGORY}}          [BRAND MARK]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Practical Template: Branded Card (Satori/Vercel OG)

```ts
// src/pages/api/og.ts
import { ImageResponse } from '@vercel/og';
import type { APIRoute } from 'astro';

// Load fonts (do this once, cache the result)
const interBold = fetch(
  new URL('../../assets/fonts/Inter-Bold.ttf', import.meta.url)
).then((res) => res.arrayBuffer());

const interRegular = fetch(
  new URL('../../assets/fonts/Inter-Regular.ttf', import.meta.url)
).then((res) => res.arrayBuffer());

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);

  // Extract params with sensible defaults
  const title = url.searchParams.get('title') ?? 'Untitled';
  const description = url.searchParams.get('description') ?? '';
  const author = url.searchParams.get('author') ?? '';
  const date = url.searchParams.get('date') ?? '';
  const category = url.searchParams.get('category') ?? '';
  const type = url.searchParams.get('type') ?? 'default'; // 'default' | 'article' | 'profile'

  // Truncate for safety
  const truncatedTitle = title.length > 80 ? title.slice(0, 77) + '...' : title;
  const truncatedDesc = description.length > 120 ? description.slice(0, 117) + '...' : description;

  // Load fonts
  const [boldFont, regularFont] = await Promise.all([interBold, interRegular]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '60px',
          backgroundColor: '#0f172a', // slate-900
          color: '#f8fafc', // slate-50
          fontFamily: 'Inter',
        }}
      >
        {/* Header: Logo + Site Name */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          {/* Replace with your logo - use base64 encoded SVG or hosted URL */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              backgroundColor: '#3b82f6', // blue-500
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 700,
            }}
          >
            L
          </div>
          <div
            style={{
              fontSize: '20px',
              color: '#94a3b8', // slate-400
            }}
          >
            yoursite.com
          </div>
        </div>

        {/* Main Content Card */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '40px',
            backgroundColor: '#1e293b', // slate-800
            borderRadius: '16px',
            border: '1px solid #334155', // slate-700
          }}
        >
          {/* Category Badge (optional) */}
          {category && (
            <div
              style={{
                display: 'flex',
                marginBottom: '20px',
              }}
            >
              <span
                style={{
                  padding: '6px 16px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '9999px',
                  fontSize: '14px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {category}
              </span>
            </div>
          )}

          {/* Title */}
          <h1
            style={{
              fontSize: truncatedTitle.length > 50 ? '42px' : '56px',
              fontWeight: 700,
              lineHeight: 1.2,
              margin: 0,
              marginBottom: description ? '20px' : '0',
            }}
          >
            {truncatedTitle}
          </h1>

          {/* Description (optional) */}
          {truncatedDesc && (
            <p
              style={{
                fontSize: '24px',
                color: '#94a3b8',
                lineHeight: 1.4,
                margin: 0,
              }}
            >
              {truncatedDesc}
            </p>
          )}
        </div>

        {/* Footer: Author, Date, Brand Mark */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '30px',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '16px',
              fontSize: '18px',
              color: '#64748b', // slate-500
            }}
          >
            {author && <span>{author}</span>}
            {author && date && <span>·</span>}
            {date && <span>{date}</span>}
          </div>

          {/* Brand mark or tagline */}
          <div
            style={{
              fontSize: '16px',
              color: '#475569', // slate-600
            }}
          >
            Your Brand Tagline
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Inter', data: boldFont, weight: 700 },
        { name: 'Inter', data: regularFont, weight: 400 },
      ],
    }
  );
};
```

### Using the Template in Pages

```ts
// In your buildOgMeta helper or page
const ogImageUrl = new URL('/api/og', SITE_SEO.siteUrl);
ogImageUrl.searchParams.set('title', post.data.title);
ogImageUrl.searchParams.set('description', post.data.description ?? '');
ogImageUrl.searchParams.set('author', post.data.author ?? '');
ogImageUrl.searchParams.set('date', formatDate(post.data.publishedDate));
ogImageUrl.searchParams.set('category', post.data.category ?? '');

// Use ogImageUrl.toString() as the og:image value
```

### Template Variants

Create multiple templates for different content types:

| Template | Use Case | Key Elements |
|----------|----------|--------------|
| **Default** | Homepage, landing pages | Logo, tagline, brand colors |
| **Article** | Blog posts, news | Title, author, date, category badge |
| **Profile** | Team pages, author pages | Photo placeholder, name, role |
| **Product** | Product pages | Product name, price, key feature |

### Font Loading Best Practices

```ts
// Option 1: Bundle fonts (recommended for Vercel/Edge)
const font = fetch(new URL('./fonts/Inter-Bold.ttf', import.meta.url))
  .then((res) => res.arrayBuffer());

// Option 2: Use system fonts (no loading required)
// 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial'

// Option 3: Google Fonts via URL (slower, may have CORS issues)
const font = fetch('https://fonts.gstatic.com/s/inter/v13/...')
  .then((res) => res.arrayBuffer());
```

### Dependencies

For dynamic OG image generation, you'll need:

| Package | Purpose | Install |
|---------|---------|---------|
| `satori` | Converts HTML/CSS-like structures to SVG | `pnpm add satori` |
| `sharp` or `@resvg/resvg-js` | Converts SVG to PNG/JPEG | `pnpm add sharp` or `pnpm add @resvg/resvg-js` |
| `@vercel/og` (optional) | All-in-one wrapper (includes satori + resvg) | `pnpm add @vercel/og` |

**For Astro SSG (build-time generation):**

```bash
pnpm add satori @resvg/resvg-js
```

**Note on JSX vs Plain Objects:** The code examples in this blueprint use JSX syntax (common in documentation) for readability. Satori accepts either:
- JSX (requires React/Preact or a JSX transform)
- Plain JavaScript objects (no dependencies beyond satori itself)

For Astro without React, use the plain object form:

```ts
// Plain object — no JSX compiler needed
const element = {
  type: 'div',
  props: {
    style: { display: 'flex', background: '#0f172a', width: '100%', height: '100%' },
    children: {
      type: 'h1',
      props: {
        style: { color: 'white', fontSize: '48px' },
        children: title
      }
    }
  }
};

const svg = await satori(element, { width: 1200, height: 630, fonts });
const png = await sharp(Buffer.from(svg)).png().toBuffer();
```

### Requirements & Best Practices

- **Cache aggressively** — CDN with 24hr+ TTL; same inputs = same output
- **Fallback gracefully** — If generation fails, fall back to static default image
- **Keep it fast** — Edge runtime preferred; avoid heavy computation
- **Test across platforms** — Validate with Facebook, LinkedIn, Twitter before launch
- **Deterministic output** — Same params must produce identical image (for caching)

### Custom Override Escape Hatch

The dynamic system handles 95% of cases, but sometimes you need bespoke:

```yaml
---
title: "Product Launch Announcement"
description: "Introducing our revolutionary new feature"
shareImage: "/og/campaigns/product-launch-2025.jpg"  # Custom override
---
```

When `shareImage` is present in frontmatter, use it directly instead of the dynamic endpoint. This gives marketers the escape hatch they need for hero campaigns without requiring it for every page.

---

## Validation & Debugging

### Debugging Checklist

1. **View page source** — Confirm meta tags are in `<head>`
2. **Check absolute URLs** — All `og:image`, `og:url` must be absolute HTTPS
3. **Verify image accessibility** — Can you open the OG image URL directly?
4. **Test with validators** — Use platform-specific tools below

### Platform Validators

| Platform | Validator URL | Notes |
|----------|---------------|-------|
| **Facebook** | https://developers.facebook.com/tools/debug/ | Also clears Facebook cache |
| **LinkedIn** | https://www.linkedin.com/post-inspector/ | Forces re-scrape |
| **Twitter/X** | https://cards-dev.twitter.com/validator | Preview card appearance |
| **Generic** | https://metatags.io | Preview across platforms |
| **Schema.org** | https://validator.schema.org | Validate JSON-LD |
| **Google Rich Results** | https://search.google.com/test/rich-results | Test structured data |

### Cache Busting

When previews show stale data:

1. **Facebook:** Use Sharing Debugger "Scrape Again" button
2. **LinkedIn:** Post Inspector "Refresh" button
3. **Twitter:** Validator automatically re-fetches
4. **WhatsApp:** Hardest to bust. Options:
   - Wait (caches for hours/days)
   - Change URL (add `?v=2` query param)
   - Change `og:image` URL

### CI/Automated Checks

Consider adding checks to catch missing metadata:

```ts
// Example: Playwright test for OG tags
test('homepage has required OG tags', async ({ page }) => {
  await page.goto('/');

  const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
  const ogImage = await page.getAttribute('meta[property="og:image"]', 'content');
  const ogDesc = await page.getAttribute('meta[property="og:description"]', 'content');

  expect(ogTitle).toBeTruthy();
  expect(ogImage).toMatch(/^https:\/\//);
  expect(ogDesc?.length).toBeLessThanOrEqual(155);
});
```

---

## Performance & Caching

- **Static images:** Long `Cache-Control` (1 year) with fingerprinted filenames
- **Dynamic endpoints:** Short TTL (5min-1hr) with `stale-while-revalidate`
- **CDN:** Ensure OG images are served via CDN for fast unfurling
- **Server-side only:** Never compute OG meta on client; it must be in initial HTML

---

## Governance & Maintenance

- **Ownership:** One team/component owns `SITE_SEO` config and helpers
- **Review:** OG metadata should be part of PR review for new pages
- **Testing:** Include preview testing in QA checklist
- **Documentation:** Keep this blueprint updated as platforms evolve

---

## Migration Plan

1. **Audit current state** — Check existing pages for OG coverage
2. **Introduce `SITE_SEO` config** — Centralize defaults
3. **Add `buildOgMeta()` helper** — Replace scattered meta tag logic
4. **Add `structured-data.ts`** — Implement JSON-LD for key pages
5. **Update `BaseLayout.astro`** — Centralize rendering
6. **Set `site` in `astro.config.mjs`** — Enable absolute URLs
7. **Add validation tests** — CI checks for OG presence
8. **Test with validators** — Verify all platforms render correctly
9. **Document per-collection defaults** — Ensure consistent fallbacks

---

## Checklist

### Setup
- [ ] `SITE_SEO` config defined with all required fields
- [ ] `siteUrl` set correctly for production environment
- [ ] `buildOgMeta()` helper implemented with truncation
- [ ] `structured-data.ts` helpers for JSON-LD
- [ ] `BaseLayout.astro` renders meta, canonical, and JSON-LD

### Per-Page
- [ ] Title under 60 characters
- [ ] Description under 155 characters
- [ ] OG image exists and is 1200x630
- [ ] OG image URL is absolute HTTPS
- [ ] `og:url` set to canonical URL
- [ ] JSON-LD schema appropriate for content type

### Content Collections
- [ ] Frontmatter schema includes `title`, `description`, `shareImage`
- [ ] Collection defaults defined for fallback images
- [ ] Article metadata (dates, author) mapped to OG and JSON-LD

### Validation
- [ ] Tested with Facebook Sharing Debugger
- [ ] Tested with LinkedIn Post Inspector
- [ ] Tested with Twitter Card Validator
- [ ] JSON-LD validated with Schema.org validator
- [ ] WhatsApp preview manually checked

### Production
- [ ] `site` configured in `astro.config.mjs`
- [ ] OG images served via CDN with proper caching
- [ ] CI checks for OG tag presence (optional but recommended)
