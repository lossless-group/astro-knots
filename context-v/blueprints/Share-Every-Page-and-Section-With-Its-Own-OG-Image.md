---
title: "Share Every Page and Every Section With Its Own OG Image"
lede: "Every page unfurls as its own card, and every heading in a write-up shares as its own card too. Built at build time, no server needed."
publish: true
status: Reference
date_created: 2026-11-17
date_modified: 2026-11-18
date_authored_initial_draft: 2026-11-17
date_authored_current_draft: 2026-11-18
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.4.0
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
summary: "Implementation blueprint for share images on every Astro Knots site: a tall 3:4 og:image and a wide twitter:image for every page, generated at build time with satori, resvg and sharp, plus a share button on every h2/h3 of long-form content that shares a /s/ page carrying that section's own card. Reference implementations: sites/cathode-site (dark brand, LFM) and sites/edviro-blog (light brand, Astro MDX), both 2026-11-17; sites/fullstack-vc (2026-11-18) adds the content-hashed render cache, so a build only renders cards whose inputs changed. Build-time cards rendered in the site itself are the default for any site with more than a handful of pages; Ideogram art and hero screenshots are for the one-off site card only. Extends Maintain-an-Elegant-Open-Graph-System.md (page-level metadata) and lfm's Maintain-Heading-Anchors-and-Share-Links.md (heading ids). Load when scaffolding any site, or when a site has pages or sections that unfurl as a generic card."
---

# Share Every Page and Every Section With Its Own OG Image

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

## Proven in a real thread

This is the tall card for one Cathode write-up, as iMessage showed it on
2026-11-17: the event's photo anchored on its subject, the type readable at
thumbnail size, and the page's own title instead of a generic site card.

![Cathode's tall share card for "Energy management is a data discipline, says Uptime": a globe photo across the top, a green kicker naming the 7x24 Exchange Fall 2026 Conference, the title in large white type, and a one-line summary](https://cathode.co/og/tall/log/energy-management-is-a-data-discipline-7x24-fall-2026.jpg)

## Build the cards in the site, at build time

This is the default way to make share images on an Astro Knots site. Generate
every card from the site's own content, in the site's own repo, during
`astro build`:

- **One card per page costs nothing extra.** An illustrated or screenshotted
  card has to be made by hand for each page, so in practice every page shares the
  same one. A card built from content exists for every page, event and section
  the moment the content does.
- **No runtime.** The endpoint is static (`getStaticPaths`), so the JPEGs are
  plain files in `dist/`. There is no server to keep warm and no host-specific
  API. The same code deployed on Netlify (cathode-site, edviro-blog) and would
  on Vercel. This replaces the request-time Playwright screenshots in
  `specs/Dynamic-OpenGraph-Images.md`.
- **Tall by default.** Each page gets one `og:image`, the tall 1080×1440 card,
  and the wide card goes in `twitter:image` only. iMessage and WhatsApp show the
  tall card large; X uses the wide one. See
  [[iPhone-Share-Previews-Conflate-the-Tall-and-Wide-Banners]] for why there is
  never a second `og:image`.
- **The brand comes along.** The renderer restates the site's Tier 1 color
  values and uses its fonts and logo, so the cards match the site. On a site
  with a hand-made brand card, keep it as the site card's wide image and
  generate the tall one to match (edviro-blog does this).

Use Ideogram (the `generate-consistent-og-images` skill) for artwork a page
deserves on its own, such as a splash page or a deck. Even then, emit it as the
page's tall `og:image` and the wide variant as `twitter:image`.

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
4. **Sites without LFM read Astro's headings instead.** edviro-blog renders
   Edviro's own MDX, so its registry takes `headings` from Astro's
   `render(entry)` (the same slugs as the DOM ids), and a small component places
   a button after each matching heading inside the article. One approach then
   covers `.md` write-ups and `.mdx` articles, which can't share a component
   override. Which headings get a button is still decided at build time.
5. **Images are built, not served.** The `.jpg.ts` endpoint uses `getStaticPaths`,
   so a static build writes every card to `dist/og/`. No runtime, no cold starts,
   no Vercel-only APIs.
6. **A card renders once, not once per build.** The endpoint still runs for every
   card on every build, but `renderCard()` checks a cache first and only renders
   cards whose inputs changed. See [Cache renders between builds](#cache-renders-between-builds).

## Cache renders between builds

There is no reason to regenerate share images for pages that haven't changed. A
card's JPEG is a pure function of its inputs, so hash the inputs and keep the
JPEG:

```ts
// og-render.ts: renderCard() wraps the real renderer
const key = sha256(rendererAssetsHash(), variant, JSON.stringify(card), photoInput(card.image));
const file = join(process.cwd(), 'node_modules/.astro/og-cache', `${key}.jpg`);
if (existsSync(file)) return readFileSync(file);   // hit: no satori, resvg, sharp or download
const jpg = await renderCardUncached(card, variant);
writeFileSync(file, jpg);                            // miss: render once, keep it
```

- **What goes in the key:** the whole `ShareCard` (title, kicker, subtitle, image
  source, layout), the variant, and a `RENDER_VERSION` constant. Edit a title and
  that card's two images re-render; nothing else does.
- **The renderer's own assets are inputs.** Hash the font files and the mark
  once per build and fold that into every key, so swapping a font re-renders
  everything without anyone remembering to.
- **Bump `RENDER_VERSION` when the design changes** (layout, colors, type sizes).
  Code changes aren't detected automatically; the constant is the switch.
- **Hash by content, never by mtime.** CI clones fresh, so every file has a new
  mtime on every deploy. A local photo is hashed by its bytes (replacing a banner
  at the same path re-renders its card). A remote photo is hashed by its URL
  alone: downloading it to see whether it changed is the cost the cache avoids.
  If a remote image changes behind the same URL, bump the version.
- **Keep the cache in Astro's cache dir, `node_modules/.astro/`.** Vercel and
  Netlify carry `node_modules` between builds, so deploys reuse it. A cleared
  build cache only costs one slow build.
- **A failed cache write is not an error.** Catch it and return the rendered
  JPEG; a read-only disk costs speed, never correctness.
- **Stale entries are harmless.** Old keys are never read again. Delete
  `node_modules/.astro/og-cache` whenever you like.

## Designing the cards

The cards are seen small: in a chat thread, beside other cards, and on
WhatsApp as a square cropped from the middle of the tall card. Design for that,
not for the JPEG on your laptop. These rules came from Cathode's first cards in
a real iMessage thread ([[Share-Cards-Hid-Their-Photos-and-Shrank-Their-Type]]).

- **Keep the card tall (3:4) and balance the space.** Mark at the top, footer
  at the bottom. With a photo, the photo is a band across the top 56% and the
  text sits just under it. Without one, the text is centered. A card that
  leaves room for a photo it doesn't have looks empty.
- **Anchor a photo where its subject is.** Event banners are wide and usually
  composed with the subject on one side. Use `objectPosition: 'left center'`
  (or the side that fits), never the default center crop, which can leave
  nothing but background.
- **Size type for a phone.** On a 1080px tall card, titles run about 132px
  (short) down to 68px (long), subtitles 42px, kicker and footer 30px or more.
  Step long titles down early so they fit under the photo band.
- **Keep wide-card text off the photo.** Photo on the right 58%, text capped at
  about half the width.
- **One universal card for the site.** The home page, and any page without its
  own card, gets a big-type card after lfg-hub's default
  (`ai-labs/dididecks-ai/client-sites/lfg-hub/public/ogimage__LFG-Hub--Default.jpg`):
  mark top left, a bracketed kicker, the headline as large as the frame allows
  with its last word in the accent color, one line under it, and a ruled footer
  (site name left, tagline and domain right). Put its content in the middle
  third, so WhatsApp's square crop still shows the headline. In Cathode it's
  `layout: 'universal'` on the card, with `accent` naming the highlighted words.
- **On a light brand, keep the photo off the logo.** A dark logo over a photo
  disappears. edviro-blog puts the logo on white at the top, the photo as a
  rounded inset under it, and the text below; the footer is the grey band from
  Edviro's brand card. Dark brands (Cathode) can run the photo behind the mark.
- **Check at preview size before shipping.** Resize the tall card to 480px high
  and crop its center square to 200px; if the headline doesn't read in both,
  it isn't done. Then send yourself the link.

## Share buttons people find

- **A share icon beside the page title.** It's the most-used share on the page,
  so it sits inline in the h1, sized from the title, in the accent color.
- **Section share buttons are always visible.** A button that only appears on
  hover is one nobody finds, and phones don't hover. Use a share icon (arrow
  out of a tray), not a link icon, when the button shares rather than copies.
- **Confirm every copy with a toast.** On desktop a copy is silent, so it
  looks like nothing happened. Show "Link copied", the heading (for a section)
  or page title, and the copied link, for about three seconds, as
  `role="status"`. Skip it when the native share sheet opened. Cathode:
  `showShareToast()` in `src/utils/share.ts`.

## Rules that bit us

- **Satori reads TTF, OTF and WOFF. Not WOFF2, not EOT.** Google Fonts serves EOT
  to old user agents and WOFF2 to new ones. Get WOFF from fontsource
  (`cdn.jsdelivr.net/fontsource/fonts/<family>@latest/latin-<weight>-normal.woff`)
  and commit it with the font's license.
- **Give every text block an explicit width.** Satori only wraps text inside a
  sized container; without one, long titles run off the edge.
- **Position with top/left and an explicit inner size, not padding.** Padding on
  an absolutely positioned full-size box pushed the footer off the bottom.
- **Clamp by lines, not characters.** Cutting a subtitle at N characters
  stops mid-word ("A school b…") and still overflows when the words are long.
  Give the text block `display: 'block'` and `lineClamp: 2` (titles 3 to 4);
  satori ends the last line with an ellipsis.
- **A full-width box with padding is wider than the card.** A footer of
  `width: cardWidth` plus horizontal padding ran its right-hand text off the
  edge ("Backed by Y Comb"). Put an inner box at `left: pad`,
  `width: cardWidth - 2 * pad` instead.
- **Size inline share icons from the heading.** A `<button>` doesn't inherit the
  heading's font size, so an icon sized in `em` comes out tiny. Set
  `font-size: inherit` on the button.
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

Rendering is the slow part of a cold build: on cathode-site, 65 cards (130 images)
added about 45 seconds, mostly fetching and resizing background photos; on
fullstack-vc, 371 cards (742 images) took the build from about 45 seconds to
about 217. With the render cache, the next build took 10 seconds, every image a
cache hit, and a normal deploy only renders the handful of cards that changed.
Within one build, photos are also cached in memory, so a photo shared by many
cards is fetched once. If a site grows to thousands of sections, render section
cards without photos, or only for h2.

## Reference implementations

- **`astro-knots/sites/cathode-site`** (repo `lossless-group/cathode-site`),
  shipped 2026-11-17. Dark brand, LFM-rendered write-ups, photo behind the mark.
  The universal card is `universal()` in `src/lib/og-render.ts`; the title share
  icon is `<ShareButton icon />` in `src/components/ui/ShareButton.astro`.
- **`astro-knots/sites/edviro-blog`** (repo `lossless-group/edviro-blog`, merged
  into `Edviro-YC/edviro-blog` as PR #4), shipped the same day. Light brand,
  Astro MDX articles and `.md` write-ups, sections from `render().headings` via
  `src/components/share/SectionShareButtons.astro`. Satori plus sharp only, no
  resvg. Its `scripts/check-seo.mjs` asserts the tall `og:image`, a matching
  `og:image:type` and the wide `twitter:image` on every page; copy that check.
- **`astro-knots/sites/fullstack-vc`** (repo `lossless-group/fullstack-vc`),
  2026-11-18. Dark brand, LFM, Vercel. The reference for the **render cache**
  (`renderCard()` in `src/lib/og-render.ts`), and for keying cards by URL path
  (`shareKeyForPath()` in `src/lib/share-cards.ts`), so the layout finds every
  page's card without the page passing a key. Tool cards show their banner as a
  rounded inset (`imageFit: 'inset'`), because banners carry their own text and a
  full-bleed crop cuts it.

Start from whichever matches your site's renderer and brand, and copy and adapt
the files listed above.

## See also

- [[Maintain-an-Elegant-Open-Graph-System]]: the page-level metadata architecture this extends
- [[Share-Cards-Hid-Their-Photos-and-Shrank-Their-Type]]: what the first cards got wrong in iMessage
- `lfm/context-v/specs/Maintain-Heading-Anchors-and-Share-Links.md`: heading ids as data
- The `open-graph-share-seo-geo` skill: unfurl rules, JPEG over WebP, tall-first
