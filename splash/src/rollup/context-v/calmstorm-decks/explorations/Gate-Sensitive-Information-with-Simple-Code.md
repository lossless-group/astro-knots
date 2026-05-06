---
title: Gate Sensitive Information with a Simple Code
authored_by: Michael Staton & Claude (Opus 4.7, 1M context)
date: 2026-05-02
status: Exploration — recommendation pending sign-off
category: Exploration
tags:
  - Access-Control
  - Static-Site-Constraints
  - Threat-Modeling
  - Cover-Page
  - Astro-Middleware
from: calmstorm-decks
from_path: explorations/Gate-Sensitive-Information-with-Simple-Code.md
---
<!-- Rolled up from calmstorm-decks/context-v/explorations/Gate-Sensitive-Information-with-Simple-Code.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

## The ask, in one line

Keep search engines and casual lurkers out of the deck. No third-party libraries,
no overkill. A code (e.g. `remaincalm`) gates the menu.

## The honest reframing

Before designing anything, the threat model needs to be named — because
"protect from search agents, Google, scrapers" rolls together three audiences
with very different defeat costs:

| Audience            | Defeated by            | Cost to defeat |
|---------------------|------------------------|----------------|
| Google / Bing crawlers   | `robots.txt` + `<meta robots="noindex">` + `X-Robots-Tag` header | They voluntarily comply. A 5-minute change. |
| Casual lurker (someone you sent the URL to who shouldn't share it) | A cover page with a code field | A friendly speed bump. View-source bypasses it. |
| Scraper / determined human (curl, headless browser, anyone with the URL) | **Server-side gate** (cookie / token check) | Real engineering. Requires SSR. |

The site today is `output: "static"` — every page is a static HTML file shipped
to anyone who requests it. **No amount of client-side JavaScript prevents a
`curl https://.../thesis` from returning the entire deck.** This is worth
naming up front because it determines which options are real.

## Options on the menu

### A. Noindex + cover page (theatrical, matches "no overkill")

What it is:

1. Add `public/robots.txt` with `User-agent: *` / `Disallow: /`.
2. Add an `X-Robots-Tag: noindex, nofollow` header in `vercel.json` for
   defense-in-depth (some crawlers parse headers but not HTML).
3. Replace the index page with a brand-aligned cover (Calm/Storm wordmark,
   warm/dark surface, code field, submit). On correct code, reveal the menu
   inline (and set `localStorage` so it stays open on revisit).
4. Code lives in `.env` as `PUBLIC_DECK_CODE=remaincalm` — Astro inlines
   `PUBLIC_*` vars into the build, so this is fine for static.

What it does NOT do:

- Does **not** stop anyone who knows `/thesis` from loading it directly.
- Does **not** stop scrapers that already have the URL list.
- The code `remaincalm` is plaintext in the JS bundle — anyone who opens
  devtools sees it. (Hashing the comparison helps optics, not security.)

What it DOES do:

- Stops Google / Bing / Sifted-style crawlers cold (robots.txt + noindex).
- Stops casual lurkers ("I clicked the link in Slack out of curiosity").
- Costs ~30 minutes. Adds zero dependencies.

**Verdict:** matches the user's "no overkill" framing exactly, but be honest:
this is a *politeness* gate plus a *crawlers-go-away* gate. Not a security
boundary.

### B. Same as A, but with hashed code in the bundle

Instead of comparing strings, ship a SHA-256 hash and hash the user's input.
Marginally less obvious in the bundle. Same actual security (zero — the gate
is still client-side).

**Verdict:** false-precision. If we don't trust the audience to not
view-source, hashing doesn't help. Skip.

### C. Astro middleware + Vercel SSR + cookie (real protection)

What it is:

1. Switch one config line: `output: "static"` → `output: "hybrid"` (or
   `"server"`). Most pages stay statically prerendered (`export const
   prerender = true`); the cover page (`/`) and a tiny POST handler are
   dynamic.
2. Add `src/middleware.ts`. On every request, if path is in a gated set
   (e.g. `/thesis*`, `/drafts/*`, `/{slide}/*`) and the request lacks a valid
   cookie → redirect to `/` (the cover).
3. Cover page POSTs the code to `/api/unlock`. If correct (compared
   server-side against `process.env.DECK_CODE` — note: NOT `PUBLIC_*`, so
   never shipped to client), set an `HttpOnly` cookie like
   `cs_unlock=<long-random-token>` and redirect.
4. Optional: rotate the token on a schedule, or scope cookie to a path /
   max-age.

What it does:

- **Real** protection. `curl /thesis` without cookie → 302 to `/`.
- Code lives in env, never reaches the client bundle.
- Scrapers that don't follow redirects or solve forms get nothing.
- Crawlers (which famously don't fill out forms) get nothing.

What it costs:

- ~1 hour of work.
- Vercel SSR functions (still on the free tier for low traffic).
- Slightly slower TTFB on gated pages (still fast — middleware is edge-runnable
  on Vercel).
- Loss of "every page is a flat file in `/dist`" simplicity. The mental model
  becomes "most pages are static, the cover and unlock endpoint are dynamic."

**Verdict:** this is the only option that meets the stated threat ("scrapers")
honestly. It's not bloat — it's the architectural shape that matches the goal.

### D. Unguessable URL slug (the "Google Doc" model)

What it is:

- Move `/thesis` to `/thesis-7f2k9p3qx` (or any unguessable token) at build
  time. Pair with noindex.
- The URL itself is the secret. You share it directly; you don't share the
  root of the site.
- Bonus: rotate the slug when needed (rebuild with a new env-var-driven
  token).

What it does:

- Effective against scrapers (they can't enumerate what they can't guess).
- Effective against crawlers (noindex + nothing links to the URL).
- No code field needed. No JS gate. No SSR. Pure static.

What it doesn't do:

- Once a URL is in someone's email/Slack/screen-share, it can leak. Same
  property as a Google Doc share link.
- Doesn't satisfy the "code field" UX you described.

**Verdict:** quietly a very good fit for static sites. If the cover-page UX
isn't load-bearing for stakeholder comms, this might be the cleanest option
of all. If the cover IS the point ("LPs see a Calm/Storm cover, type the
code, get in"), then it's not.

## My recommendation

It depends on which of these two the user actually wants:

- **"I want LPs to feel like they're entering something"** → A (cover with
  code, noindex). Acknowledge it's theatrical against scrapers; ship it
  because the *experience* is the point.
- **"I want scrapers genuinely blocked"** → C (middleware + SSR + cookie).
  The honest answer.
- **"I just don't want this in Google and don't care about a cover"** → D
  (unguessable URL + noindex). The lowest-overhead real-world option.

Given the user's stated goal includes scrapers, my lean is **C with the cover
UX of A** — get the brand-aligned cover *and* the real gate. Cost is small,
because you'd build the cover regardless.

If the user pushes back on SSR ("keep it static"), the honest fallback is
**A + D** — cover for the experience, unguessable slug for the actual
protection. The cover then gates a *menu page that contains the secret link*
rather than gating the deck itself.

## Concrete proposal — option C (recommended)

```
sites/calmstorm-decks/
├── astro.config.mjs                        # output: "static" → "hybrid"
├── public/
│   └── robots.txt                          # Disallow: / (defense in depth)
├── vercel.json                             # X-Robots-Tag header on /thesis*
├── .env                                    # DECK_CODE=remaincalm  (NOT PUBLIC_)
├── .env.example                            # documented so collaborators know
└── src/
    ├── middleware.ts                       # cookie check; gate set = ["/thesis", "/drafts/*", ...]
    ├── pages/
    │   ├── index.astro                     # the cover (already exists; restyle)
    │   ├── api/
    │   │   └── unlock.ts                   # POST /api/unlock → set cookie if code matches
    │   ├── thesis/
    │   │   ├── index.astro                 # add `export const prerender = true;`
    │   │   └── version-2.astro             # add `export const prerender = true;`
    │   └── ...                             # other gated pages get prerender = true
    └── lib/
        └── gate.ts                         # constants: COOKIE_NAME, COOKIE_MAX_AGE, gated path patterns
```

Mental model: **the static build is unchanged for 95% of pages. Only the
middleware and the `/api/unlock` endpoint are dynamic.** The deck still
prerenders to flat HTML; it just gets a 302 if the cookie is missing.

Cover UX (the same regardless of A or C):

- Full-bleed `slide-primary` background (the Calm/Storm signature dark blue).
- Centered Calm/Storm wordmark (display weight, lockup with the slash).
- Eyebrow: "Fund III · Restricted Access".
- Single labeled input ("Access code") + submit.
- On submit failure: friendly inline message ("Doesn't look right. Try again.").
- On success: redirect to `/menu` (the existing index TOC + scroll-deck CTA).
- Below the fold (or on a small link): "If you don't have a code, contact
  Stephanie." or similar.

## Things I want explicitly named before implementing

1. **Which threat matters most?** (See "honest reframing".) This decides A vs C
   vs D.
2. **Where does the code live?** `.env` is fine. Confirm.
3. **One code, or per-investor codes?** Per-investor enables revoking access
   for a specific party; one code is simpler. Probably one code for now.
4. **Cookie lifetime.** 24 hours? 30 days? Forever? Affects how often LPs
   re-enter.
5. **Should the cover gate the *menu page* or the *decks themselves*?** With
   option C they can both be gated; with option A only the menu can be
   meaningfully gated.
6. **Do we want a "wrong code three times → cooldown" affordance?** Probably
   no, but flag.

Once those are answered, the implementation is small in either direction.
