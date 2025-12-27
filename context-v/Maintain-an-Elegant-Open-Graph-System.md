---
date_created: 2025-10-10
date_modified: 2025-10-10
title: Maintain an Elegant Open Graph System
lede: A scalable, consistent architecture for Open Graph/Twitter share metadata across multi-site Astro projects.
date_authored_initial_draft: 2025-10-10
date_authored_current_draft: 2025-10-10
date_authored_final_draft: 2025-10-10
date_first_published: 2025-10-10
date_last_updated: 2025-10-10
at_semantic_version: 0.0.0.1
status: Implemented
publish: true
authors:
  - Michael Staton
augmented_with: Trae AI
category: Best-Practices
image_prompt: A robot conducting a symphony.  Each musician is playing a social media branded instrument.  Above them, shares are going to Facebook, LinkedIn, and X
banner_image: https://ik.imagekit.io/xvpgfijuw/uploads/lossless/2025-sept/Maintain-an-Elegant-Open-Graph-System_banner_image_1760114662425_616dxZwfn.webp
portrait_image: https://ik.imagekit.io/xvpgfijuw/uploads/lossless/2025-sept/Maintain-an-Elegant-Open-Graph-System_portrait_image_1760114663984_D3P-Xr_MB.webp
square_image: https://ik.imagekit.io/xvpgfijuw/uploads/lossless/2025-sept/Maintain-an-Elegant-Open-Graph-System_square_image_1760114665324__jTn7ykb9.webp
---


[[lost-in-public/issue-resolution/Optimizing-Share-Functionality-Across-Content|Optimizing-Share-Functionality-Across-Content]]


## Objectives

- Centralize defaults while allowing clean per-page overrides.
- Keep metadata rendering consistent in one place (layout), not scattered.
- Support dynamic routes, content collections, and future multi-brand/multi-locale needs.
- Enable optional dynamic OG image generation without complicating most pages.

## Guiding Principles

- One source of truth for defaults and types.
- Small, composable helpers that return ready-to-render meta tags.
- Pages provide only the minimum context (title/description/image/url); everything else is inferred.
- Layout owns actual `<meta>` and canonical rendering for consistency.
- Prefer absolute URLs in production; allow dev-friendly relative paths in dev.

## Recommended Structure

- Project-level defaults and helpers
  - `src/config/seo.ts` — site defaults, types
  - `src/utils/og.ts` — helper(s) to build OG/Twitter tags
  - `src/layouts/BaseLayout.astro` — renders meta, canonical

- Monorepo shared package (optional, recommended as sites grow)
  - `packages/seo/` — export types, defaults builder, helpers
  - Sites import from `@lossless/seo` (or similar alias) for consistency

## Site Defaults (Config)

Define one config object to drive defaults across pages.

```ts
// src/config/seo.ts
export interface SiteSEO {
  siteName: string;
  site?: string; // set in astro.config.mjs for absolute URL resolution
  twitterHandle?: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultImage: string; // path under /public or absolute URL
}

export type ShareMetaInput = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile' | string;
};

export const SITE_SEO: SiteSEO = {
  siteName: 'Parslee',
  defaultTitle: 'Parslee',
  defaultDescription: 'Enabling better use of AI through contextual understanding of documents.',
  defaultImage: '/shareBanner__Parslee-Zinger.webp',
  twitterHandle: '@parslee_ai',
};
```

## Helper API (Meta Composition)

Keep helpers small and predictable.

```ts
// src/utils/og.ts
import { SITE_SEO } from '../config/seo';
import type { ShareMetaInput } from '../config/seo';

type MetaTag = { name?: string; content: string; property?: string };

export function buildOgMeta(input: ShareMetaInput = {}): MetaTag[] {
  const title = input.title ?? SITE_SEO.defaultTitle;
  const description = input.description ?? SITE_SEO.defaultDescription;
  const image = input.image ?? SITE_SEO.defaultImage;
  const url = input.url; // optional; pass absolute in production
  const type = input.type ?? 'website';

  const meta: MetaTag[] = [
    { name: 'description', content: description },
    { property: 'og:type', content: type },
    { property: 'og:site_name', content: SITE_SEO.siteName },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
  ];

  if (url) meta.push({ property: 'og:url', content: url });

  meta.push({ name: 'twitter:card', content: 'summary_large_image' });
  if (SITE_SEO.twitterHandle) meta.push({ name: 'twitter:site', content: SITE_SEO.twitterHandle });
  meta.push({ name: 'twitter:title', content: title });
  meta.push({ name: 'twitter:description', content: description });
  meta.push({ name: 'twitter:image', content: image });

  return meta;
}
```

Optional additions:
- `og:image:width`, `og:image:height`, `og:image:type` for completeness.
- `twitter:image:alt` to describe the banner.
- A `buildCanonical(url)` helper to emit a `<link rel="canonical">`.

## Layout Responsibilities

- Render the `<meta>` array and title.
- Render canonical link when absolute URL is available.
- Optionally preload hero/share image if above-the-fold.

```astro
<!-- src/layouts/BaseLayout.astro -->
{meta.map((m) => <meta {...m} />)}
{canonical && <link rel="canonical" href={canonical} />}
<title>{title}</title>
```

## Page Usage Patterns

- Static pages
  - Provide `title`, optionally `description`, `image`, `url`.
  - Use site defaults for anything omitted.

- Dynamic routes (`/posts/[slug]`)
  - Derive metadata from content frontmatter.
  - Compute absolute `url` via `new URL(Astro.url.pathname, Astro.site).toString()`.

- Content collections
  - Standardize frontmatter: `title`, `description`, `shareImage`, `shareType`.
  - Build metadata at render using those fields.

- i18n / multi-brand
  - Parameterize `SITE_SEO` via brand and locale.
  - Provide brand-aware defaults and locale-specific descriptions.

## Absolute URLs and Canonical

- Set `site` in `astro.config.mjs`:

```js
// astro.config.mjs
export default defineConfig({
  site: 'https://parslee.ai',
});
```

- Compute canonical:

```ts
const canonical = new URL(Astro.url.pathname, Astro.site).toString();
```

## Dynamic OG Image Generation (Optional)

When you need runtime banners (e.g., post title + brand):
- Approaches
  - HTML/CSS to image via server route (`/api/og`).
  - Satori/Vercel OG Images in an endpoint.
  - Pre-generate at build-time for known content.
- Requirements
  - Cache aggressively (CDN, short TTL with revalidation).
  - Deterministic templates; avoid heavy client bundles.
  - Fallback to static default image if generation fails.

## Asset Guidance

- Dimensions: `1200x630` (or `1200x628`) preferred.
- Format: `webp` or `jpeg`; ensure social scrapers can fetch it.
- Files under `public/` for stable paths.
- Consider `og:image:width/height/type` for strict parsers.

## Validation & Tooling

- Internal checks
  - Add lint rules/CI checks to ensure pages include minimum metadata.
  - Snapshots for `buildOgMeta()` output for common cases.
- External validators
  - Use social validators (Facebook/LinkedIn/Twitter) during QA.
  - Maintain a small script or doc listing validation endpoints.

## Performance & Caching

- Static images: long `Cache-Control` with fingerprinted filenames.
- Dynamic endpoints: short TTL + revalidation, server-side caching layer.
- Avoid computing metadata on client; keep it server-rendered.

## Governance & Maintenance

- Ownership: one team/component owns `SITE_SEO` and helpers.
- Versioning: changes in shared `packages/seo` must be semver’d.
- Documentation: keep this blueprint updated alongside releases.

## Migration Plan (from current state)

1. Introduce `SITE_SEO` and `buildOgMeta()` in each site.
2. Move shared logic into `packages/seo` and update imports.
3. Expand `BaseLayout.astro` to add canonical and optional width/height meta.
4. Set `site` in `astro.config.mjs` for absolute URL generation.
5. Optionally add `/api/og` for dynamic banners with caching.
6. Add unit tests for helpers and a QA checklist.

## Usage Examples

Page-level wiring (static page):

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { buildOgMeta } from '../utils/og';
import { SITE_SEO } from '../config/seo';

const pageTitle = 'Parslee: Enabling better use of AI through contextual understanding of documents.';
const pageDescription = SITE_SEO.defaultDescription;
const pageImage = SITE_SEO.defaultImage;
const pageUrl = Astro.site ? new URL(Astro.url.pathname, Astro.site).toString() : Astro.url.pathname;
---
<BaseLayout title={pageTitle} meta={buildOgMeta({ title: pageTitle, description: pageDescription, image: pageImage, url: pageUrl })}>
  <!-- page content -->
</BaseLayout>
```

Dynamic route (content collection):

```astro
---
import { getEntry } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { buildOgMeta } from '../../utils/og';

const { slug } = Astro.params;
const post = await getEntry('posts', slug);

const title = post.data.title;
const description = post.data.description;
const image = post.data.shareImage ?? '/default-share.webp';
const url = Astro.site ? new URL(Astro.url.pathname, Astro.site).toString() : Astro.url.pathname;
---
<BaseLayout title={title} meta={buildOgMeta({ title, description, image, url, type: 'article' })}>
  <!-- post content -->
</BaseLayout>
```

## Checklist

- Site-wide defaults defined and documented.
- Layout renders meta + canonical consistently.
- Pages pass minimal overrides only.
- Absolute URLs configured via `astro.config.mjs`.
- OG image dimensions and format validated.
- Optional dynamic OG endpoint designed with caching.
- Tests and QA checklist in place.