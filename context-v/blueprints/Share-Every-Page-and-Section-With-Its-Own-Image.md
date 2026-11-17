---
title: "Share Every Page and Every Section With Its Own Image"
lede: "Every page unfurls as its own card, and every heading in a write-up shares as its own card too. Built at build time, no server needed."
publish: true
status: Reference
date_created: 2026-11-17
date_modified: 2026-11-17
date_authored_initial_draft: 2026-11-17
date_authored_current_draft: 2026-11-17
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.1.0
category: Blueprints
type: Blueprints
tags:
  - Open-Graph
  - Social-Sharing
  - Share-Images
  - Heading-Anchors
  - Astro-Knots
site_uuid: b5382bd4-e3a8-4737-9639-ed0c48a6a215
hex_code: h0y0h2
summary: "Implementation blueprint for share images on every Astro Knots site: a tall 3:4 og:image and a wide twitter:image for every page, generated at build time with satori, resvg and sharp, plus a share button on every h2/h3 of long-form content that shares a /s/ page carrying that section's own card. Reference implementation: sites/cathode-site (2026-11-17). Extends Maintain-an-Elegant-Open-Graph-System.md (page-level metadata) and lfm's Maintain-Heading-Anchors-and-Share-Links.md (heading ids). Load when scaffolding any site, or when a site has pages or sections that unfurl as a generic card."
---

# Share Every Page and Every Section With Its Own Image

## Why care?

Most of our links travel by phone: iMessage, WhatsApp, Slack, LinkedIn DMs. The
card that unfurls is the first impression. A site where every link shows the same
logo, or no image at all, looks unfinished.

Long-form pages have a second problem. A reader wants to send one section, not
the whole piece, so they copy `page#heading`. **Every chat app ignores the
fragment.** The friend gets the page's card, not the section they were pointed at.

This blueprint gives every page its own card and every section its own card,
on a static site, with no server.

## What a site gets

- **A card for every page.** One `og:image` per page: the tall 3:4 card (1080×1440)
  that chat apps show. The wide card (1200×630) goes in `twitter:image` only.
  Never two `og:image` tags.
- **A card for every section.** Each h2 and h3 of a write-up gets a card with the
  heading as its title, and a share page at `/s/<collection>/<slug>/<heading-id>/`
  that carries it, then redirects to `page#heading`.
- **Share buttons.** A page-level Share button, and the heading anchor beside each
  h2/h3 shares the section's page. On a phone they open the native share sheet; on
  desktop they copy the link.

## How it works

```text
src/lib/share-cards.ts      every shareable thing → a ShareCard {key, kicker, title, subtitle, image}
src/lib/og-render.ts        ShareCard → JPEG (satori → resvg → sharp)
src/pages/og/[variant]/[...key].jpg.ts   static endpoint: /og/tall/{key}.jpg, /og/wide/{key}.jpg
src/pages/s/log/[logId]/[headingId].astro   section share pages (own og:image, canonical page#id, redirect)
src/lib/seo.ts + MetaTags.astro          shareKey → og:image (tall) + twitter:image (wide)
src/components/ui/ShareButton.astro      page share: share sheet or copy
src/components/markdown/HeadingAnchor.astro   shareUrl prop → shares the section page
src/utils/share.ts                       shareOrCopy(): one helper for both buttons
```

1. **The registry is the source of truth.** `getShareCards()` lists a card for each
   static page, each content entry, and each section of each long-form entry.
   Pages pass their card's key to the layout (`<BaseThemeLayout shareKey="events">`).
2. **Section ids come from LFM, never the render layer.** `parseMarkdown()` stamps
   `node.data.id` on every heading and attaches `tree.data.headings`. The registry
   reads that outline to make the section cards and share pages, and the renderer
   reads the same ids for the buttons, so a share page and its heading can never
   disagree. See `lfm/context-v/specs/Maintain-Heading-Anchors-and-Share-Links.md`.
3. **The renderer passes the share address down.** The long-form page renders
   `<AstroMarkdown node={tree} data={{ shareBase, shareDepths: [2, 3], shareTitle }} />`.
   `AstroMarkdown` already threads `data` through every recursive render; the
   heading branch hands `shareUrl={shareBase + id + '/'}` to `HeadingAnchor`.
4. **Images are built, not served.** The `.jpg.ts` endpoint uses `getStaticPaths`,
   so a static build writes every card to `dist/og/`. No runtime, no cold starts,
   no Vercel-only APIs.

## Rules that bit us

- **Satori reads TTF, OTF and WOFF. Not WOFF2, not EOT.** Google Fonts serves EOT
  to old user agents and WOFF2 to new ones. Get WOFF from fontsource
  (`cdn.jsdelivr.net/fontsource/fonts/<family>@latest/latin-<weight>-normal.woff`)
  and commit it with the font's license.
- **Give every text block an explicit width.** Satori only wraps text inside a
  sized container; without one, long titles run off the edge.
- **Position with top/left and an explicit inner size, not padding.** Padding on
  an absolutely positioned full-size box pushed the footer off the bottom.
- **Ship JPEG.** resvg writes PNG; convert with sharp. JPEG is what every unfurler
  handles and the smallest for photo-backed cards (see the JPEG-over-WebP rule in
  the `open-graph-share-seo-geo` skill).
- **Images can't read CSS custom properties.** The renderer uses the raw Tier 1
  values from `theme.css`. That's the one place a raw value is right.
- **Absolute URLs.** `og:image` must be absolute, built from `Astro.site`. If the
  production domain isn't live yet, set `SITE_URL` so the tags point somewhere real.
- **Keep `/s/` out of the sitemap** and mark those pages `noindex`. They are share
  redirects; the canonical is the page with its fragment.
- **Section titles are just the heading.** Appending the page title truncates
  badly in previews; put the page title in the description instead.

## Cost

Rendering is the slow part of the build: on cathode-site, 65 cards (130 images)
added about 45 seconds, mostly fetching and resizing background photos. Images
are cached per build. If a site grows to thousands of sections, render section
cards without photos, or only for h2.

## Reference implementation

`astro-knots/sites/cathode-site` (repo `lossless-group/cathode-site`), shipped
2026-11-17. Start there; copy and adapt the files listed above.

## See also

- [[Maintain-an-Elegant-Open-Graph-System]]: the page-level metadata architecture this extends
- `lfm/context-v/specs/Maintain-Heading-Anchors-and-Share-Links.md`: heading ids as data
- The `open-graph-share-seo-geo` skill: unfurl rules, JPEG over WebP, tall-first
