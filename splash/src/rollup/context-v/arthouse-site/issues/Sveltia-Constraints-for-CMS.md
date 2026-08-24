---
title: Sveltia CMS — Constraints That Shape Architecture
lede: "Sveltia is not Decap: the extension points it dropped — above all the custom media library API — become silent no-ops, not errors."
date_created: 2026-05-18
date_modified: 2026-05-18
authors:
  - Michael Staton
augmented_with: Claude Code (Opus 4.7)
semantic_version: 0.0.0.2
status: Draft
category: Issue
tags:
  - Sveltia-CMS
  - Decap-CMS
  - CMS-Constraints
  - Media-Library
  - ImageKit
  - Arthouse-Site
site_uuid: f9a275b4-eaed-440a-ba2f-f42353b71e4a
hex_code: nwg1qx
date_authored_initial_draft: 2026-05-18
date_authored_current_draft: 2026-05-18
publish: true
from: arthouse-site
from_path: issues/Sveltia-Constraints-for-CMS.md
---
<!-- Rolled up from arthouse-site/context-v/issues/Sveltia-Constraints-for-CMS.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

# Sveltia CMS — Constraints That Shape Architecture

**Audience:** future humans + agents proposing CMS-shaped features in any
Astro-Knots site (especially `arthouse-site`) where Sveltia is the editor surface.

**TL;DR:** Sveltia is *not* Decap. It rewrote the editor with much better UX and
i18n, but pruned several extension points Decap supported. If a plan assumes
"plug it in like Decap," it will fail at runtime — silently for the most painful
ones, because the relevant Decap API calls become no-ops rather than errors.

---

## 1. Why this document exists

The arthouse-site spec [[Image-Catalog-and-ImageKit-Hosting-for-Arthouse]] was
drafted assuming Sveltia could be wired to ImageKit through a custom media
library plugin (Decap's pattern). It cannot. Verifying this against Sveltia's
own docs cost a real cycle of discussion and almost shipped code against the
wrong premise.

This doc captures the constraint up front so the next agent (or the next person)
who reaches for "just plug Sveltia into X" knows the actual surface area before
designing on top of it.

---

## 2. The hard constraints

### 2.1 No custom media library plugins

Sveltia's docs are explicit:

> Sveltia CMS does not support the undocumented custom media storage provider
> API. The `CMS.registerMediaLibrary` method is a noop in Sveltia CMS.

**What this means:**
- Existing Decap CMS plugins for media providers (anything via
  `CMS.registerMediaLibrary`) **do not work** in Sveltia.
- You cannot write JS that adds a new media backend.
- The set of supported media providers is closed and only Sveltia maintainers
  can extend it.

**Currently supported native media providers (2026-05):**
- Internal (Git repo storage — files commit alongside content)
- Amazon S3
- Cloudflare R2
- Cloudinary
- DigitalOcean Spaces
- Uploadcare

**Notably NOT supported:**
- ImageKit
- Bunny
- imgix
- Any custom HTTP API

### 2.2 Decap-compatible config syntax is preserved (but not all behavior)

Sveltia keeps the `media_library` block for backward compatibility but the
preferred key is `media_libraries` (plural). Don't assume "valid Decap config
loads identically in Sveltia" — config keys overlap, runtime behavior may not.

> Compatibility with existing Netlify/Decap CMS custom media libraries is not
> guaranteed.

### 2.3 What IS extensible

- Field widgets (the input types in collection fields) — standard set, plus
  Sveltia-specific additions
- Editor preview templates (write Svelte components that render alongside the
  editor)
- The `relation` widget — pulls choices from another collection by field value.
  This is the load-bearing escape hatch for our catalog model: galleries
  reference image-record slugs via `relation`, not via media picker.

---

## 3. Architectural implications for arthouse-site (and any sibling site)

### 3.1 ImageKit cannot live "inside" Sveltia

If ImageKit is the asset host, the upload UI must live **outside** Sveltia.
Three viable shapes:

1. **ImageKit's own dashboard** — she uploads there, copies path, pastes into
   Sveltia. Zero engineering. Friction proportional to upload volume.
2. **Standalone `/uploader` page in the site** — built into the Astro app,
   gated by passcode or GitHub OAuth, calls ImageKit's auth-token endpoint or
   embeds [ImageKit's Embeddable Media Library widget](https://imagekit.io/docs/dam/embeddable-media-library-widget).
   She opens it in another tab from Sveltia, uploads, copies path back.
3. **Switch providers** — use one of the natively-supported list (Cloudinary
   is the closest analog to ImageKit). Sveltia handles uploads end-to-end at
   the cost of changing CDN providers.

For arthouse-site the current decision is: keep ImageKit, build option 2
when upload friction becomes the binding constraint. Until then, option 1
is the documented Phase-1 path.

### 3.2 The catalog-and-slug pattern is the right shape regardless

Because we cannot make Sveltia's image picker call ImageKit directly, our
content model already separates the **catalog** (image records with
`imagekit_path` strings) from the **rendering** (galleries pointing at
catalog slugs). This separation is forced by the constraint but also the
right shape: an asset rename on ImageKit only needs the catalog record
updated; every gallery follows.

The `relation` widget is what makes this UX-livable in Sveltia: gallery
fields say "pick from the images collection," which renders a typeahead of
existing records rather than a file picker. See
[[Image-Catalog-and-ImageKit-Hosting-for-Arthouse]] §5 for the concrete
Sveltia field config.

### 3.3 Whatever the upload UI is, do not plan to embed it as a Sveltia widget

There is no extension point. The upload UI must be a sibling page in the
Astro app, not a Sveltia custom widget. Anyone proposing "let's write a
Sveltia plugin that…" should be redirected to this document.

---

## 4. Other Sveltia gotchas worth knowing

These are smaller but show up in real builds:

- **GitHub OAuth is the realistic auth.** Sveltia commits content as git
  commits via the GitHub API. The editor identity must be a GitHub account
  with push access to the repo. Plan auth flows around that.
- **The `identifier_field` config matters** — if not set, Sveltia uses `title`
  to label collection entries. For an image catalog where `title` may
  duplicate across records, set `identifier_field: slug` explicitly.
- **`relation` widget search is client-side** — it loads the target collection
  into memory. Fine for hundreds of records, painful at thousands. If a
  catalog ever gets very large, server-paginated picking is not built in.
- **Sveltia is younger than Decap.** Bugs get fixed faster but the surface
  area in active production is smaller. If a feature feels under-documented,
  it may be partially implemented.

---

## 5. When to revisit this document

Update when any of:
- Sveltia ships native support for a new media provider relevant to us
  (especially ImageKit, S3-compatible, or Bunny)
- Sveltia adds a custom-media-library extension API (would unlock real plugins)
- We learn a new gotcha the hard way during a build
- Sveltia and Decap diverge further or merge in unexpected ways

---

## 6. References

- [Sveltia CMS — Media Storage docs](https://sveltiacms.app/en/docs/media)
- [Sveltia CMS GitHub](https://github.com/sveltia/sveltia-cms)
- [Issue #586 — S3-Compatible Storage Integration for Media Library](https://github.com/sveltia/sveltia-cms/issues/586)
- [Issue #683 — Image optimization for remote media libraries](https://github.com/sveltia/sveltia-cms/issues/683)
- [ImageKit — Embeddable Media Library widget](https://imagekit.io/docs/dam/embeddable-media-library-widget)
- [[Image-Catalog-and-ImageKit-Hosting-for-Arthouse]] — sibling spec; this constraint shaped its Phase 1 plan
