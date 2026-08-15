---
title: "Images in LFM render without intrinsic dimensions"
lede: "Both image paths in the LFM renderer emit an <img> with no width or height, so every image will shift the page as it loads. Latent today because no changelog has images — about to stop being latent."
date_created: 2026-08-15
date_modified: 2026-08-15
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5
semantic_version: 0.0.0.1
status: Open
tags:
  - Issue-Resolution
  - LFM
  - Rendering
  - Images
  - Performance
  - Core-Web-Vitals
---

## Why care?

Nothing is broken right now. **There is not a single image in any changelog
entry across the tree** — which is exactly why this is worth writing down before
that changes rather than after.

The new [[prep-images-for-embed]] skill makes it a one-line operation to drop a
screenshot into a changelog. The friction that kept posts text-only is gone. So
the first image-heavy entry is close, and when it lands, every image on the page
will reflow the text under it as it loads.

## What was found

The LFM renderer handles images by two paths, and neither sets intrinsic size.

**Path 1 — plain markdown `![alt](url)`**
`src/components/markdown/AstroMarkdown.astro:135`

```jsx
{type === "image" && (() => {
  const img = node as Image;
  return <img src={img.url} alt={img.alt ?? ""} title={img.title ?? undefined} loading="lazy" />;
})()}
```

Good: `alt` is passed through, `loading="lazy"` is already set.
Missing: `width` / `height`, and `decoding="async"`.

**Path 2 — the `::image{…}` directive**
`src/components/markdown/MarkdownImage.astro`

Considerably richer — it accepts `src`, `alt`, `float`, `width`, `min-width`,
`max-height`, `caption`, `source`, `source-url`, `caption-width`,
`source-position`, `caption-position`, with sensible auto-layout defaults.

But its `width` is a **CSS width** (`'100%'`, `'40%'`), not the intrinsic pixel
dimensions the browser needs to reserve space. So the directive is better for
*presentation* and no better for *layout stability*.

## Why it matters when it lands

Without `width`/`height` the browser cannot reserve space before the bytes
arrive, so text jumps as each image pops in. That is **Cumulative Layout Shift**,
one of the Core Web Vitals Google actually ranks on, and it is worst on exactly
the surfaces we care about — a long changelog entry read on a phone over a
mediocre connection.

It also compounds with `loading="lazy"`: lazy images load late, so the shift
happens *while the reader is reading*, not before.

## Not fixing it yet, deliberately

No images exist, so there is nothing to measure and nothing to regress. Fixing a
renderer for a case that has never occurred is how you get a fix shaped around
the wrong assumption.

**The trigger to act:** the first changelog entry that carries images. At that
point, look at real numbers rather than this document's theory.

## Options when it does bite

Roughly in order of effort:

1. **Pass dimensions through the directive.** Add `height` alongside the existing
   `width`, and emit both as HTML attributes rather than CSS. The
   `prep-images-for-embed` script already knows the post-resize pixel dimensions
   and emits them in its `html` mode — so the producer side is solved; only the
   renderer needs to accept them.
2. **Derive from the CDN.** Images are on ImageKit, which reports dimensions via
   its metadata API. Fetching at build time avoids hand-maintaining numbers, at
   the cost of a build-time network call per image.
3. **Aspect-ratio box.** Wrap in a container with `aspect-ratio` from the
   dimensions. Reserves space without needing the attributes on `<img>` itself,
   and degrades gracefully.
4. **Do nothing for float/caption layouts.** Where an image is `float`ed at 40%
   width inside prose, the shift is small and the fix may not be worth it.

Also worth folding in whenever this is touched: `decoding="async"` on both paths,
and **not** lazy-loading the first image in an entry — lazy-loading the LCP
element makes that metric worse, which is the opposite of the intent.

## Related

- [[prep-images-for-embed]] — the skill that makes image-heavy entries easy, and
  whose `html` emit mode already carries correct `width`/`height`
- [[lossless-flavored-markdown]] — the directive system `::image` belongs to
- `src/components/markdown/MarkdownImage.astro` — the richer path
- `src/components/markdown/AstroMarkdown.astro:135` — the plain-markdown path
