---
title: Image Catalog and ImageKit Hosting for Arthouse
lede: A catalog-and-resolver content model that keeps the arthouse-site code repo public while client photography lives on ImageKit — including a privacy tier that lets NSFW originals exist in the catalog (for lineage) without ever appearing in rendered output.
date_created: 2026-05-18
date_modified: 2026-05-18
date_authored_initial_draft: 2026-05-18
at_semantic_version: 0.0.0.1
status: Draft
category: Specification
authors:
  - Michael Staton
augmented_with: Claude Code (Opus 4.7)
tags:
  - Arthouse-Site
  - Content-Model
  - ImageKit
  - Image-Privacy
  - Astro-Content-Collections
  - Sveltia-CMS
---

# Image Catalog and ImageKit Hosting for Arthouse

**Status**: Draft (v0.0.0.1)
**Codename**: `arthouse-site`
**Parent**: [[Polish-Pass-for-Arthouse-Site]] · [[Maintain-an-Image-Heavy-Portfolio-Site]]
**Related**: [[AI-Photo-to-Illustration-Transform-for-Arthouse]]

---

## 1. Why this spec exists

The arthouse-site code repo is public. The client's photography includes work that is sensitive, sometimes NSFW. Holding image bytes in the repo is therefore not an option — even an old commit on `main` would leak.

ImageKit (already provisioned for the team) becomes the asset host. The repo holds **metadata only**: a catalog of records describing every image, with the resolver layer assembling URLs at render time. Galleries reference records by slug; if a file gets renamed or moved on ImageKit, only the record's `imagekit_path` changes — every gallery pointing at it keeps working.

Privacy is a property of the **record**, not of a directory. A record can describe an NSFW original (for the artist's own catalog completeness and for tracking which images have been transformed by [[AI-Photo-to-Illustration-Transform-for-Arthouse]]) while being unreachable from any public route.

---

## 2. The three layers

### 2.1 Image records

Path: `src/content/images/<slug>.md`

One markdown file per image. Body is optional (long-form caption / story).

```yaml
---
title: "Kiara · Audrey Hepburn"
slug: studio-kiara-audrey-hepburn      # explicit; matches filename
kind: photograph                        # photograph | artwork | ai-rendered
privacy: public                         # public | gated | private
nsfw: false
imagekit_path: /portfolio/studio/kiara-audrey-hepburn.jpg
aspect_ratio: "2:3"                     # for layout without CLS
alt: "Portrait styled as Audrey Hepburn — black gown, pearl strand, soft studio light"
caption: "Studio session. Paris, October 2025."
palette_hint: gothic                    # dark | bright | gothic | girly
tags:
  - Portraits
  - Studio
  - Styled
series: studio-sessions
shoot_location: Paris
date_taken: 2025-10-15
pricing_tier: standard
source_image: ~                         # for ai-rendered only
ai_model: ~                             # for ai-rendered only
---
```

For AI-rendered safe outputs, `kind: ai-rendered` and `source_image:` points to the slug of the private source record — preserving lineage without exposing the source.

For private NSFW originals (catalog presence only, never rendered):

```yaml
---
title: "Private · 2025-10-15 frame 007"
slug: private-2025-10-15-frame-007
kind: photograph
privacy: private
nsfw: true
imagekit_path: /private/2025-10-15/frame-007.jpg
alt: "(private)"
date_taken: 2025-10-15
---
```

### 2.2 Galleries reference by slug

`src/content/galleries/portrait/studio-sessions.md`:

```yaml
---
title: Studio Sessions
description: Portrait photography — styled sessions with creative direction
cover_image: studio-kiara-audrey-hepburn
images:
  - studio-kiara-audrey-hepburn
  - studio-kiara-steampunk
  - studio-kiara-glitterbug
featured: true
sort_order: 1
tags: [Portraits, Studio, Styled]
date_created: 2026-04-21
---
```

No paths. Rename an ImageKit asset → update the record's `imagekit_path` → every gallery follows.

### 2.3 Resolver library + component

**`src/lib/imagekit.ts`** — pure functions:

- `getImageRecord(slug)` — fetches the content collection entry
- `imagekitUrl(record, transformations)` — builds `${IMAGEKIT_URL_ENDPOINT}${imagekit_path}?tr=w-800,q-80,f-webp`
- `imageSrcSet(record, widths)` — produces a srcset string for responsive `<img>`
- `filterPublic(records)` — strips `privacy !== "public"` (the load-bearing privacy gate)

**`src/components/basics/CatalogImage.astro`** — takes a `slug` prop, resolves the record, renders a responsive `<img>` with srcset, sized via `aspect_ratio` to prevent layout shift. If the record's privacy doesn't match the render context, renders nothing (silently in production, with a comment in dev).

---

## 3. Privacy rules (the single load-bearing contract)

| `privacy` value | Renders in public routes? | Renders in gated routes? | Use case |
|---|---|---|---|
| `public` | ✅ | ✅ | Default for everything safe-for-web |
| `gated` | ❌ | ✅ | Behind a `PUBLIC_DECK_CODE`-style gate; future phase |
| `private` | ❌ | ❌ | Originals that exist only for catalog/lineage |

`nsfw` is orthogonal — a marker for the CMS UI to warn before showing a thumbnail. It does not change render behavior. A `public + nsfw: false` AI-rendered output is rendered freely; the `private + nsfw: true` source it descended from is not.

**Build-time enforcement:** every component that pulls images must go through `filterPublic()` (or the future `filterForContext(ctx)`). Direct reads of `getCollection('images')` without filtering are an anti-pattern — surface in code review.

---

## 4. ImageKit folder convention

```
ik.imagekit.io/<account>/
  portfolio/
    studio/             # public
    landscape/
    portrait/
  ai-rendered/          # public — outputs from the AI-transform pipeline
  private/              # signed-URL-only, never linked from public site
    2025-10-15/
    2025-11-02/
```

Records under `privacy: private` MUST have `imagekit_path` starting `/private/`. A build-time invariant check is cheap to add and prevents misclassification.

Signing for the `private/` folder is **out of scope for Phase 1**. We'll implement signed-URL access if/when we build a gated review surface for the artist herself.

---

## 5. Sveltia CMS integration

`public/admin/config.yml` collection update:

- `images` collection fields swap `src` (path) for `imagekit_path` (relative path under ImageKit endpoint)
- Add: `kind` (select), `privacy` (select, default `public`), `nsfw` (boolean), `aspect_ratio` (string), `palette_hint` (select), `series` (string), `source_image` (relation widget pointing back at `images` collection)
- The CMS no longer uploads image bytes to `public/images/` — uploads go directly to ImageKit through their dashboard or via a future custom widget. Phase 1: she uploads to ImageKit, copies the path, pastes into the CMS form.

The galleries collection field for `images` becomes a **relation** to image-record slugs rather than a free-form file picker.

---

## 6. Environment variables

`.env.example` adds:

```
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-account-id
# Server-side only, for future signed-URL work on the /private/ folder:
# IMAGEKIT_PRIVATE_KEY=...
```

The endpoint URL is non-secret (it ends up in client-side `<img>` src attributes anyway). The private key is server-only and Phase 2.

---

## 7. Migration of existing content

One gallery exists today: `src/content/galleries/portrait/studio-sessions.md`. It references three local JPEG paths. Phase 1 deliverable:

1. Create three image records in `src/content/images/` for the existing assets (uses placeholder ImageKit paths — client uploads later)
2. Rewrite the gallery's `images:` list to reference slugs
3. Keep the local `public/images/portfolio/*.jpeg` files in place during transition (so the dev server still has something to render until the ImageKit account holds the real assets)
4. The `CatalogImage` component supports a `local_src` fallback for the transition period — flag emitted in console when the fallback fires

---

## 8. What this spec does NOT do

- Signed URLs for `/private/` (Phase 2)
- Per-image color extraction (the `palette_hint` is a manual hint, not derived)
- AI-transform automation (separate exploration)
- Image upload UI (uses ImageKit dashboard for now)

---

## 9. References

- [[Polish-Pass-for-Arthouse-Site]] — parent
- [[Maintain-an-Image-Heavy-Portfolio-Site]] — grandparent (original site spec)
- [[AI-Photo-to-Illustration-Transform-for-Arthouse]] — produces the `kind: ai-rendered` records this catalog tracks
