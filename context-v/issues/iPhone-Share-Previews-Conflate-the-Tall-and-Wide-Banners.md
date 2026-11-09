---
site_uuid: dd635b3a-0573-43df-91bf-83b0c0c68149
hex_code: ktiyjt
title: "iPhone Share Previews Conflate the Tall and Wide Banners"
lede: "Offer iMessage two og:image sizes and you get a preview that's neither. Serve each app the one card it shows best."
summary: >-
  Records a share preview on iPhone that mixes FantasyGM's 1200x630 banner
  with its 1200x1600 tall banner, traced to the page emitting two og:image
  blocks. Gives the evidence, a hypothesis for the mechanism (unverified),
  and the proposed fix: every response carries exactly one og:image, and an
  edge layer picks tall or wide by which app's crawler is asking. Static
  hosts fall back to tall. Read before wiring any tall banner into a page,
  or before changing the generate-consistent-og-images or
  open-graph-share-seo-geo skills.
type: Issues
publish: true
date_created: 2026-11-09
date_modified: 2026-11-09
date_authored_initial_draft: 2026-11-09
date_authored_current_draft: 2026-11-09
date_authored_final_draft:
authors:
  - Michael P. Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: Open
tags:
  - Issue
  - OpenGraph
  - Share-Previews
  - iMessage
  - SEO
related:
  - "[[Astro-Knots-MCP-and-Plugins-First-Release]]"
  - "[[Exploring-an-MCP-so-Anyone-can-be-an-Astro-Knot]]"
---

# iPhone Share Previews Conflate the Tall and Wide Banners

> **Status: Open.** Seen 2026-11-09 on FantasyGM. Cause found in the page's
> tags; the exact iMessage behavior is a hypothesis until tested on a phone.

## What happens

Sharing FantasyGM's link from an iPhone produces a preview that looks
confused: the wide banner and the tall banner are mixed into one card rather
than either one showing cleanly.

FantasyGM is forked into the lossless-group org
(`lossless-group/FantasyGM`, parent `scowanlv/FantasyGM`). The fork has no
GitHub Pages site of its own. The live page is the parent's, at
`https://scowanlv.github.io/FantasyGM/`, so a fix has to land upstream to
take effect.

## Evidence

The page emits **two** `og:image` blocks, wide first, then tall, with the
same alt text on both:

```html
<meta property="og:image" content="https://scowanlv.github.io/FantasyGM/ogimage__FantasyGM--Banner.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Fantasy GM: Run your league like a front office. …">
<meta property="og:image" content="https://scowanlv.github.io/FantasyGM/ogimage__FantasyGM--BannerTall.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="1600">
<meta property="og:image:alt" content="Fantasy GM: Run your league like a front office. …">
<meta name="twitter:image" content="https://scowanlv.github.io/FantasyGM/ogimage__FantasyGM--Banner.jpg">
```

The images themselves are fine (checked 2026-11-09):

| File | Served as | Size | Pixels |
|---|---|---|---|
| `ogimage__FantasyGM--Banner.jpg` | `image/jpeg` | 176 KB | 1200 × 630, matches its tags |
| `ogimage__FantasyGM--BannerTall.jpg` | `image/jpeg` | 284 KB | 1200 × 1600, matches its tags |

Both are JPEG, under iMessage's practical size limit, with `Content-Length`
set. The format, the size and the declared dimensions aren't the problem. The
two-image setup is.

## Why it happens (hypothesis, not yet verified)

OpenGraph allows more than one `og:image`. Each `og:image:width` and
`og:image:height` belongs to the `og:image` before it. A client that keeps
the first image URL but lets later width and height tags overwrite earlier
ones ends up with the 1200 × 630 banner declared as 1200 × 1600. It lays out
a tall card and fills it with a wide image. That would look exactly like the
two banners mixed together.

Apple doesn't document how its link previews handle several `og:image`
tags, so this is a likely explanation, not a confirmed one. Whatever the
exact mechanism, the rule below avoids it, because it never gives a client a
choice.

## Why our own guidance let this happen

- `generate-consistent-og-images` says to **always produce `banner_tall`
  alongside `banner`**, since iMessage and WhatsApp come first for us.
- `open-graph-share-seo-geo` describes one image and its six tags. It never
  says what to do with a second image.

An agent following both skills has a tall banner on disk and no instruction
for where it goes, so emitting it as a second `og:image` is a natural guess.
None of our Astro Knots sites, splashes or event-hog do this today: they all
emit a single `og:image`. FantasyGM is the first.

## Proposed resolution: serve the card that fits where it's shared

Tall wins wherever it can be used: iMessage and WhatsApp can show taller
proportions, and the tall card looks much better there. Feeds like LinkedIn
and Facebook crop a tall image. So the page shouldn't pick one card for
everyone. It should give each app the card that app shows best, **and only
that one**.

This works because every app fetches the preview with its own crawler, and
the crawler names itself in its user agent. An edge layer in front of the
site reads that and rewrites the share tags before the page goes out.

### Which app gets which card

| Shared in | Crawler user agent contains | Card |
|---|---|---|
| iMessage | `facebookexternalhit` **and** `Twitterbot` (it sends both: `facebookexternalhit/1.1 Facebot Twitterbot/1.0`) | Tall |
| WhatsApp | `WhatsApp` | Tall |
| Telegram | `TelegramBot` | Tall (to test) |
| X | `Twitterbot` (alone) | Wide |
| LinkedIn | `LinkedInBot` | Wide |
| Facebook, Messenger | `facebookexternalhit` (alone) | Wide |
| Slack | `Slackbot-LinkExpanding` | Wide (to test) |
| Discord | `Discordbot` | Wide (to test) |
| Anything else: browsers, search engines, unknown apps | — | The page's static default: tall |

**Order matters.** iMessage carries both Facebook's and X's names, so it has
to be matched first. Matching `Twitterbot` first would send iMessage the wide
card. Sources for the iMessage string: reports from 2016 to 2025 on Stack
Overflow, Webmasters Stack Exchange and Medium all show the same string. The
others come from Slack's robots page and published crawler lists. All of them
can change without notice, so the table lives in one place, and a test
re-checks it.

### How it's served

1. **The built page carries one `og:image`, the tall banner**, with its six
   tags, and the wide banner in `twitter:image`. That's the default for any
   crawler the table doesn't name, and what a static host serves to
   everyone.
2. **On Cloudflare, a Worker runs before the static files**
   (`run_worker_first`) and uses `HTMLRewriter` to replace the six `og:image`
   tags with the wide set when the crawler wants wide. Each response still
   carries exactly one `og:image`.
3. **The swapped response is marked `Vary: User-Agent`**, so a cache never
   hands LinkedIn's version to iMessage.
4. **Search engines get the default page.** Only the share tags ever change,
   never the content, so this isn't cloaking.

### Where it can run

| Host | Smart serving | Notes |
|---|---|---|
| Cloudflare Workers with static assets | Yes | Confirmed in Cloudflare's docs. The default for new Astro Knots starters |
| Vercel | Probably, through Routing Middleware | // TBD verify it works with a static Astro build |
| GitHub Pages | No | Static default only: tall `og:image`, wide `twitter:image`. FantasyGM is here |

### Where the logic lives

The crawler table and the tag swap are the same on every site, so this is
shared processing logic, the kind we publish as a package (like
`@lossless-group/lfm`) rather than copy. // TBD: a package, or a pattern in
the starter first and extracted later.

### FantasyGM, now

It's on GitHub Pages, so smart serving needs a move to Cloudflare first. The
immediate fix works on Pages: remove the wide `og:image` block, keep the tall
one and `twitter:image`, then re-share with `?v=2` (iMessage caches per URL
for days). It goes upstream, since the live site is the parent repo's.

## Done when

- [ ] Reproduced on an iPhone, and the cause confirmed: a single tall
      `og:image` (with the wide `twitter:image`) gives a clean tall card, two
      `og:image` tags give the mixed one. Also confirm iMessage ignores
      `twitter:image`; if it doesn't, the static default drops it.
- [ ] FantasyGM's head fixed upstream, and a fresh share looks right.
- [ ] The edge layer built and running on one Cloudflare-hosted site, with
      a test that requests the page as each crawler in the table and checks
      it gets exactly one `og:image` of the right shape.
- [ ] Real shares checked in iMessage, WhatsApp, LinkedIn and Slack.
- [ ] `open-graph-share-seo-geo` states the rule: one `og:image` per
      response, tall by default, chosen per crawler where the host allows.
      Edit it in `lossless-agent-skills`, not a copy.
- [ ] `generate-consistent-og-images` says where the tall banner is wired,
      next to its instruction to always make one.
- [ ] `knot-check` fails a page with more than one `og:image`, so Astro Knots
      sites can't repeat this (see [[Astro-Knots-MCP-and-Plugins-First-Release]]).
