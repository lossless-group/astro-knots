---
title: "Maintain Confidential Access with Persistent Sessions and Auth Telemetry"
lede: "A server-gated, DB-backed access pattern for client-content workspaces: signed pre-authed links for direct stakeholders, two-role passcodes for everyone else, durable telemetry on every attempt, and a downstream-sharing attribution hack — designed so a busy client clicks once and stays in, and so every silent failure leaves a row we can investigate."
date_created: 2026-05-11
date_modified: 2026-05-12
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 4.7 (1M context)
semantic_version: 0.0.0.2
status: Implemented (calmstorm-decks)
tags:
  - Blueprint
  - Confidential-Access
  - Authentication
  - Persistent-Sessions
  - Signed-Link-Tokens
  - Astro-DB
  - Turso
  - Auth-Telemetry
  - SSR-Gating
  - Client-Content-Workspaces
  - Cross-Site-Pattern
---

# Maintain Confidential Access with Persistent Sessions and Auth Telemetry

## What this is

A reusable pattern for any astro-knots site that gates content for a specific counterparty — fundraise decks, client review surfaces, portfolio sections, in-progress drafts, sensitive memos. It replaces the v1 [[Confidential-Content-Access-Control-Blueprint]] (localStorage flag + passcode shipped in client bundle) with a **server-gated, DB-backed session model** that leaves durable evidence for every verify attempt, every gated page view, and every interaction event.

The pattern is built on **three auth tiers** (a site adopts only the ones it needs), an **identity-first data model** in Astro DB / Turso, and a **dual-source env-reader convention** that prevents the most common Astro v6 server-side env-loading trap. A small set of CLIs lets an operator pre-seed identities, mint signed links, and revoke sessions without touching the deployed site.

## Why it exists

The v1 blueprint shipped working passcode gates, but three failure modes recurred across sites:

1. **The busy stakeholder couldn't get in.** localStorage failed silently in some browsers (Safari ITP, private mode, third-party cookie blocking, embedded webviews, corporate proxies). No way to debug from our side.
2. **No telemetry.** When auth failed, there was no record. Investigations became forensic exercises pulling rows out of Turso one at a time (see [[Auth-Identity-System-Worked-but-UX-Failed-Silent-Bounces]]).
3. **Downstream sharing was anonymous.** When a stakeholder shared the access code with their LPs / partners / colleagues, we had no way to see "Anthos came in twice and spent 14 minutes on the deck."

All three are symptoms of the same root: the v1 primitive treated gating as binary (in/out) instead of as a session lifecycle that should leave evidence. v2 is that lifecycle.

The full reasoning, decision-by-decision, is in [[Rethinking-Confidential-Access-with-Persistent-Sessions-and-Auth-Telemetry]] (the exploration this blueprint codifies).

---

## How it works

### The three-tier auth stack

Adopt only the tiers a site needs. The tiers compose — they share the same `Session` table, the same role model, the same telemetry surface.

| Tier | Mechanism | Who it serves | Delivery |
|---|---|---|---|
| **1 — Door** | Pre-authed signed-token link (HMAC-SHA256, identity-bound, expires) | Direct named stakeholders | Any 1:1 channel — WhatsApp, Signal, iMessage, email |
| **2 — Self-service** | Per-site Google OAuth + domain allowlist + named-guest allowlist | Returning stakeholders, partners at the firm, recognized guests | Standard OAuth flow |
| **3 — Fallback** | Universal passcode, two roles (admin / viewer), suffix-attribution hack | Devices without email; downstream sharing the stakeholder chooses to do | Hand over the string |

**Minimum useful site adopts Tier 1 + Tier 3.** Tier 2 is for sites that generalize beyond one client. Most current astro-knots sites should start at Tier 1 + Tier 3 and add Tier 2 when the audience widens.

### Identity-first data model

Before minting any link, the operator pre-seeds an **`Identity`** row (slug, label, full_name, email, org, linkedin_url, notes). The mint flow references it. When the link is redeemed, the resulting `Session` is *already* bound to a real `Identity` — no post-hoc reconciliation needed.

This structurally avoids the duplicate-row class of bug that bit `fullstack-vc` (see [[Auth-Identity-System-Worked-but-UX-Failed-Silent-Bounces]] Issue 4): when identity is created at redemption time, multi-provider or multi-email users produce duplicate rows that have to be merged manually. When identity is pre-seeded, there is only one row to find.

### Schema (six tables)

```
Identity      — pre-seeded by us. The "person" rolls of activity attach to.
                Columns: id (slug), label, full_name?, email?, org?,
                linkedin_url?, notes?, created_at, first_seen_at?, last_seen_at?

MintedToken   — signed-link issuance ledger. References Identity.
                Columns: id (random), identity_id, role, expires_at,
                max_uses, uses_remaining, minted_at, minted_by, revoked_at?, notes?

Session       — live session, keyed by random id stored in the cookie.
                Columns: id (random), identity_id?, tier (signed_link|passcode),
                role (admin|viewer), shared_label?, enrolled_at, last_seen_at,
                revoked_at?, ua_hash?, ip_hash?, token_id?

AuthEvent     — every verify/redeem attempt, success or failure.
                Columns: id, at, outcome, reason?, tier?, role?, identity_id?,
                session_id?, token_id?, shared_label?, ip_hash?, ua_hash?,
                passcode_hash_prefix?

PageView      — middleware-driven, every gated request.
                Columns: id, at, session_id?, identity_id?, path, referrer?,
                shared_label?

Action        — fine-grained interaction events from a client-side tracker.
                Columns: id, at, session_id?, identity_id?, kind, target?,
                payload_json?, shared_label?
```

Lives in Astro DB (libSQL) — same typed client for the local file DB during dev and Turso in production. Schema is defined in `db/config.ts` and synced to Turso via `pnpm astro db push --remote`.

### Two-role access (admin / viewer)

`Session.role ∈ {admin, viewer}` — orthogonal to tier.

- **Admin** sessions see everything, including `/admin/*` routes (operator dashboards, telemetry, identity management).
- **Viewer** sessions see the content surface only. **Admin routes return 404, not 403**, so viewers don't even learn the routes exist.

Role is granted at sign-in:

- **Tier 1 (signed link):** role is baked into the token payload at mint time. `pnpm mint-link --role=admin` vs `--role=viewer`.
- **Tier 2 (OAuth):** role determined by the allowlist entry the user matched.
- **Tier 3 (passcode):** two distinct passcodes mapping to two roles: `ADMIN_PASSCODE` → admin, `VIEWER_PASSCODE` → viewer. A leaked viewer passcode never exposes the admin surface.

### The shared-label suffix hack (Tier 3 only)

When a stakeholder shares the viewer passcode externally, we want attribution without making them ask us for a new link. Format: `<passcode>-<label>`.

```
VIEWER_PASSCODE=calmbalm
Stakeholder shares: "calmbalm-anthos" with an LP
```

The verify endpoint splits on the first dash, validates the left side as the viewer passcode, stores the right side as `Session.shared_label`, and upserts a synthetic `Identity` row (`id=shared:anthos`, `label="Shared: anthos"`) that all subsequent PageView and Action rows attribute to. Stakeholder shares with zero friction; we get LP-level attribution.

Multiple dashes split on the first only: `calmbalm-andreessen-horowitz` → label is `andreessen-horowitz`. Empty suffix (`calmbalm-`) is treated as no suffix.

### Bot-aware OG previews for shared links

Signed-link share URLs (`/access/link/<token>`) get pasted into WhatsApp / Signal / Slack / iMessage / Twitter / LinkedIn / Discord / etc. Every one of those platforms hits the URL with a link-preview scraper *before* the recipient ever taps. Without intervention, that scrape:

- Runs the full redemption flow → consumes one `uses_remaining` from `MintedToken` (kills `max_uses=1` links before the recipient sees them)
- Sets a session cookie the bot discards
- Returns a redirect the bot may or may not follow → preview card is often empty or shows the redirect target's metadata, not the share's

The redeem route splits on `User-Agent` at the top of its frontmatter:

```ts
function isLinkPreviewBot(ua: string): boolean {
  if (!ua) return true; // no UA at all → treat as bot
  return [
    /facebookexternalhit/i, /whatsapp/i, /telegrambot/i, /twitterbot/i,
    /slackbot/i, /linkedinbot/i, /discordbot/i, /applebot/i, /embedly/i,
    /redditbot/i, /pinterest/i, /mastodon/i, /skypeuripreview/i,
    /\bbot\b/i, /\bcrawler\b/i, /\bpreview\b/i, /\bscraper\b/i, /\bspider\b/i,
  ].some((p) => p.test(ua));
}
```

Bot path renders a brand-friendly HTML page with full `<head>` metadata (OG, Twitter Cards) and the cover-pane visual. **Zero DB writes. Token not consumed.** Real-user path runs the unchanged redemption flow.

Detection is intentionally aggressive: false-positives (a real user with a weird UA sees a preview page and has to click again) are recoverable; false-negatives (a scraper consumes a token use) aren't.

#### Distinct OG description for signed-link shares

The share URL is a different speech-act than the public landing. The landing says "here's our deck, restricted access"; the signed share says "you specifically have been invited in with these privileges." That difference belongs in the preview metadata.

**Convention:** sites adopting this blueprint should keep their public landing's `og:description` generic (deck framing, who they are, restricted-access notice) and define a **separate `STATIC_SEO.accessLink` entry** with copy specific to what a click on the signed URL actually grants. The bot path on `/access/link/[token]` references that entry; the rest of the site doesn't.

```ts
// src/lib/seo.ts
export const STATIC_SEO = {
  root: {
    title: "Fund III · Teaser Deck",
    description: "Restricted access. Calm/Storm Ventures — ...",
  },
  accessLink: {
    title: "Fund III · Restricted Access",
    description:
      "An invitation to restricted admin views and abilities for ...'s " +
      "Fund III deck and materials iteration workspace. Alternate passcodes " +
      "are for viewers only, who can only browse authorized slide deck " +
      "experiences.",
  },
};
```

```astro
<!-- src/pages/access/link/[token].astro -->
<MetaTags
  title={STATIC_SEO.accessLink.title}
  description={STATIC_SEO.accessLink.description}
/>
```

Calibrate the `accessLink` copy to the **highest privilege the link could grant** (admin, in most mints), because the recipient often reads the preview card before deciding whether to click. They should be able to tell from the description alone that this is a trust-graded invitation, not a generic gated landing.

The `og:image` itself can stay the same as the public landing — same brand surface, same cover art. It's only the title/description that should change between landing and signed-share.

### File layout (canonical paths per site)

```
sites/<site-name>/
├── astro.config.mjs          # output: "server", @astrojs/db integration, env aliases
├── vercel.json               # buildCommand: "pnpm astro build --remote"
├── db/
│   ├── config.ts             # the six tables
│   └── seed.ts               # local dev seed only
├── src/
│   ├── middleware.ts         # session check, refresh, PageView insert, role gate
│   ├── lib/auth/
│   │   ├── types.ts          # Role | Tier | AuthOutcome unions
│   │   ├── passcode.ts       # dual-source env reader, suffix parser
│   │   ├── token.ts          # HMAC-SHA256 sign / verify / newRandomId
│   │   └── session.ts        # cookie helpers, UA/IP hashing
│   ├── components/auth/
│   │   └── TrackerScript.astro   # vanilla JS interaction tracker (opt-in)
│   └── pages/
│       ├── access/
│       │   ├── index.astro       # server-rendered gate page
│       │   └── link/[token].astro # signed-link redeem
│       ├── api/
│       │   ├── access/
│       │   │   ├── verify.ts     # passcode submission
│       │   │   └── logout.ts     # revoke session, clear cookie
│       │   └── track.ts          # Action sink
│       └── admin/
│           └── activity.astro    # ops dashboard
└── scripts/
    ├── identity-create.ts    # seed an Identity row
    ├── mint-link.ts          # sign + insert a MintedToken, print URL
    ├── seed-clients.ts       # idempotent roster seed
    ├── db-push.ts            # wraps `astro db push --remote` with .env loading
    └── wipe-sessions.ts      # mark all live sessions revoked (testing aid)
```

### Middleware contract

`src/middleware.ts` is the gate. On every request:

1. If the path is in the public allowlist (`/`, `/changelog`, `/access`, `/access/link/*`, `/api/access/*`, static assets) → pass through. (Public pages that want session-aware rendering must read the cookie themselves.)
2. If there's no `cs_session` cookie → redirect to `/access?redirect=<encoded original path>`.
3. Look up `Session` by id. If missing or `revoked_at` is set → redirect to `/access?redirect=<…>&error=expired`.
4. Bump `Session.last_seen_at`. Re-issue the cookie with a fresh 90-day max-age (rolling).
5. Insert one `PageView` row (best-effort, errors don't block the request).
6. If path starts with `/admin` and `session.role !== 'admin'` → return **404** (not 403).
7. Stash session on `context.locals.session` and continue.

### The dual-source env-reader pattern

**The single most important convention in this blueprint.**

In Astro v6 server-side code, env vars come from two places:

- **`import.meta.env`** — what Astro/Vite populates from `.env` files during dev and build.
- **`process.env`** — what Vercel (and other runtime hosts) injects at runtime.

Code that reads only one of those works in exactly one environment. Code that reads **both** — `import.meta.env` first, `process.env` fallback — works identically in dev and prod with no special-casing:

```ts
function readEnv(name: string): string | undefined {
  const fromMeta = (import.meta.env as Record<string, string | undefined>)[name];
  if (fromMeta) return fromMeta;
  return process.env[name];
}
```

Every server-side env read in the auth surface uses this pattern: `ADMIN_PASSCODE`, `VIEWER_PASSCODE`, `SESSION_SECRET`, Turso credentials. If you find yourself writing `process.env.FOO` directly in an auth code path, replace it with `readEnv("FOO")`.

This is what closed the [[Auth-Identity-System-Worked-but-UX-Failed-Silent-Bounces]] follow-on bug where v2 worked on Vercel but `config_missing` errors in local dev.

### Cookie discipline

The session cookie (`cs_session`) is **httpOnly**. JavaScript cannot read it via `document.cookie`. Implication: **any page-level "am I authed?" check must happen server-side** in the page's frontmatter. Do not write an inline `<script>` that tries to detect the session via `document.cookie` — it will silently fail to see the cookie that is right there in the request.

If a page needs to conditionally render based on auth state, read the cookie server-side:

```astro
---
import { readSessionCookie } from "../lib/auth/session";
import { db, Session, eq } from "astro:db";

const sessionId = readSessionCookie(Astro.cookies);
let isAuthed = false;
if (sessionId) {
  const rows = await db.select({ id: Session.id, revoked_at: Session.revoked_at })
    .from(Session).where(eq(Session.id, sessionId)).limit(1);
  if (rows[0] && !rows[0].revoked_at) isAuthed = true;
}
---
```

### Trim + lowercase passcode comparison

Match v1 cover-pane semantics: `.trim()` both sides, `.toLowerCase()` the base of the submitted passcode (everything before the first dash) and the env-stored value. The shared-label suffix preserves user casing because it becomes attribution data.

Without these, a copy-pasted passcode with a trailing space or auto-capitalized first letter silently fails — exactly the class of user error that produced the original calmstorm-decks lockout.

### Env wiring (Vercel)

Vercel build needs `--remote` for Astro DB to talk to Turso:

```json
// vercel.json
{
  "buildCommand": "pnpm astro build --remote"
}
```

Astro DB reads `ASTRO_DB_REMOTE_URL` and `ASTRO_DB_APP_TOKEN`. If a project has historic Turso env names (`TURSO_DB_URL`, `TURSO_AUTH_TOKEN`, `<PROJECT>_TURSO_*`, `<PROJECT>_ASTRO_DB_*`), alias them in `astro.config.mjs`:

```js
if (process.env.ASTRO_DATABASE_FILE) {
  // local dev/build → force local file mode
  delete process.env.ASTRO_DB_REMOTE_URL;
  delete process.env.ASTRO_DB_APP_TOKEN;
} else {
  // Vercel / --remote → alias whatever name is set
  if (!process.env.ASTRO_DB_REMOTE_URL) {
    process.env.ASTRO_DB_REMOTE_URL =
      process.env.<PROJECT>_ASTRO_DB_URL ?? process.env.TURSO_DB_URL ?? ...;
  }
  if (!process.env.ASTRO_DB_APP_TOKEN) {
    process.env.ASTRO_DB_APP_TOKEN =
      process.env.<PROJECT>_ASTRO_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN ?? ...;
  }
}
```

The conditional matters: when `ASTRO_DATABASE_FILE` is set (npm scripts pin it for local), forcibly clear remote-URL env so a stale `.env` entry doesn't trigger remote mode during prerender (which crashes with `TypeError: Invalid URL` from `createRemoteDatabaseClient`).

### NPM script map (recommended)

```jsonc
{
  "scripts": {
    "dev":              "ASTRO_DATABASE_FILE=./astro.db astro dev",
    "build":            "ASTRO_DATABASE_FILE=./astro.db astro build",
    "build:remote":     "astro build --remote",
    "preview":          "ASTRO_DATABASE_FILE=./astro.db astro preview",
    "astro":            "astro",
    "db:push:remote":   "tsx scripts/db-push.ts",
    "identity:create":  "tsx scripts/identity-create.ts",
    "mint-link":        "tsx scripts/mint-link.ts",
    "seed:clients":     "tsx scripts/seed-clients.ts",
    "wipe-sessions":    "tsx scripts/wipe-sessions.ts"
  }
}
```

Local dev/build pin `ASTRO_DATABASE_FILE` so Astro DB uses the local file. Vercel's `buildCommand` overrides via `--remote`. The CLIs accept `--remote` to target Turso explicitly.

### Telemetry surface

**`AuthEvent`** writes a row on every verify or redeem attempt. Outcomes:
`success`, `bad_passcode`, `config_missing`, `token_invalid`, `token_expired`, `token_exhausted`, `token_revoked`, `rate_limited`, `unknown_error`.

The `passcode_hash_prefix` column stores the first 4 hex chars of `sha256(submitted)` — enough to spot a typo pattern across multiple failed attempts without retaining the secret. **Never log the raw passcode**, even in development.

**`PageView`** is middleware-driven. One row per gated request. Cheap (one INSERT). Carries `path`, `referrer`, `identity_id` (if known), `shared_label` (if set).

**`Action`** is the optional fine-grained layer. `TrackerScript.astro` is a drop-in `<script is:inline>` component that, when mounted on a page, emits a small standard set:

| kind | Triggered when |
|---|---|
| `deck-mounted` | Once per page load |
| `tab-focus` / `tab-blur` | Visibility change |
| `scroll-to-bottom` | First time within 100px of bottom |
| `external-link-clicked` | Anchor whose origin differs from `location.origin` |
| `slide-viewed` | Any element with `data-track-slide="<slot>"` enters 50% viewport |

Uses `navigator.sendBeacon` when available, falls back to `fetch` with `keepalive`. Drops events silently if the session has been revoked.

**`/admin/activity`** is the server-rendered ops dashboard. Renders Identities, MintedTokens, recent Sessions, AuthEvents, PageViews, and Actions as filterable tables, newest first. Refresh to update. This is the page that turns "did the client try yet?" into a one-glance answer.

---

## How to follow it

### Adopting on a new site (checklist)

1. **Decide which tiers** the site needs. Most start with Tier 1 + Tier 3.
2. **Add `@astrojs/db`** to dependencies. Set `output: "server"` in `astro.config.mjs`, add `db()` to integrations.
3. **Copy `db/config.ts`** from the reference implementation. Adjust the `Identity` table if you want extra fields (org-specific, etc.); the others stay as-is.
4. **Copy `src/lib/auth/*`** verbatim. These have zero site-specific assumptions.
5. **Copy `src/middleware.ts`**. Adjust `PUBLIC_PREFIXES` and `PUBLIC_EXACT` for the site's public surface.
6. **Copy the routes** under `src/pages/access/`, `src/pages/api/access/`, and `src/pages/admin/`. The `/access` gate page should be restyled to match the site's brand vocabulary — keep the form fields, change the visual.
7. **Copy the CLIs** under `scripts/`. Add the corresponding `pnpm` scripts to `package.json`.
8. **Set the env vars**: `ADMIN_PASSCODE`, `VIEWER_PASSCODE`, `SESSION_SECRET` (≥16 chars, `openssl rand -base64 32`), plus Turso credentials (whatever name convention the site uses).
9. **Provision a Turso DB** scoped to the site (don't share across sites). Add the URL + auth token to Vercel.
10. **Set Vercel `buildCommand`** to `pnpm astro build --remote` in `vercel.json`.
11. **Push the schema:** `pnpm db:push:remote` once locally (or run from CI before first deploy).
12. **Seed the roster:** `pnpm identity:create --slug=<id> --label="…"` for each direct stakeholder, or write a `seed-clients.ts` if there are several.
13. **Mint and send.** `pnpm mint-link --identity=<id> --role=admin --days=365 --max-uses=10 --base-url=https://… --remote`. Send via WhatsApp / Signal / iMessage / email.
14. **Add `<TrackerScript />`** to whichever layouts you want to instrument with the Action sink. Opt-in per page; PageView + AuthEvent are already firing without it.
15. **Define `STATIC_SEO.accessLink`** with copy that describes what a signed-share URL grants (vs. the generic public landing). Wire it into the bot path on `/access/link/[token]`. Test with `curl -A "WhatsApp/2.0" https://<site>/access/link/<token> | grep "og:description"` to confirm the platform-scraper sees the right metadata.

### Maintaining an existing site

- **Every new component or page on the gated surface:** confirm middleware allow-list is correct. If the page should be public, add its path to `PUBLIC_PREFIXES`. If gated, do nothing — middleware catches it by default.
- **When a passcode rotates:** update env on Vercel + local `.env`, then `pnpm wipe-sessions --remote` to force everyone to re-auth with the new code.
- **When a client leaves an organization:** revoke their identity's MintedTokens (`UPDATE MintedToken SET revoked_at = NOW() WHERE identity_id = ?`). Their existing sessions die on next page load when middleware sees the revoked flag.
- **Schema changes:** edit `db/config.ts`, then `pnpm db:push:remote`. Astro DB diffs and applies non-destructive migrations. Destructive changes (column rename, drop) need a manual SQL pass first.

### Migrating from v1 ([[Confidential-Content-Access-Control-Blueprint]])

The two patterns can coexist. Recommended sequence:

1. **Land v2 alongside v1** — middleware, gate page, verify endpoint, schema push, identity seed. v1's localStorage gate keeps working in parallel.
2. **Update the existing gate UI** to POST to `/api/access/verify` instead of validating client-side. Keep the visual.
3. **Server-render the unlock state** on any page that uses a `cs-unlocked` class trick — read the session cookie server-side, stamp the class in HTML. The httpOnly cookie is invisible to JS.
4. **Verify telemetry** is flowing: hit `/admin/activity`, see your test sessions.
5. **Remove v1**: delete `src/lib/gate.ts`, `GateScript.astro`, the localStorage script blocks, and `PUBLIC_DECK_CODE` from envs.

The reference implementation in `calmstorm-decks` shows this migration mid-flight: v1 cover-pane visual retained, v2 server-side validation behind it.

---

## Anti-patterns

**Don't read env vars with `process.env` only in server-side code.** Use the dual-source `readEnv` helper. Anything else breaks dev/prod parity silently.

**Don't try to detect the session cookie via `document.cookie`.** It's httpOnly. JS cannot see it. The `client → server → set httpOnly cookie → client reload → JS check` flow always fails. Do auth state checks server-side.

**Don't post the raw passcode to telemetry.** `passcode_hash_prefix` is the only safe surface. Logging the full input (even in dev) creates a leak vector when logs sync somewhere unexpected.

**Don't admit unknown roles.** If a route or component branches on `session.role`, make `viewer` the default for unrecognized values. Fail closed.

**Don't return 403 for admin-only routes.** Return 404. Viewers should not learn that an admin surface exists.

**Don't share a Turso DB across sites.** Each site gets its own. Cross-site queries are a smell — if you need them, it's a signal to extract this whole pattern into a published package and host its own DB.

**Don't reuse the public landing's `og:description` for signed-share previews.** They're different speech-acts (generic landing vs. specific invitation). Let the access-link preview tell the recipient what their tap actually grants — that's part of the trust they extend by clicking. Reuse the same `og:image` (same brand surface), differentiate only title + description.

**Don't let scrapers run the redemption flow.** Bot-detect at the top of `/access/link/[token]` before touching the DB. Every preview fetch that consumes a `uses_remaining` is a footgun pointed at the recipient.

**Don't skip the Identity pre-seed.** Letting redemption auto-create identities reintroduces the [[Auth-Identity-System-Worked-but-UX-Failed-Silent-Bounces]] dup-row class of bug. The whole point of v2 is that there's exactly one Identity per person, decided in advance.

**Don't make `/access` prerendered.** It needs `prerender = false` so it can render error messages from query params at request time. Same for the verify endpoint, redeem page, and admin pages.

**Don't omit `wipe-sessions` from the scripts.** Operators will want it during testing, after env var rotation, and during incident response. Cheap to write, very expensive to wish for.

**Don't auto-mount `TrackerScript`** in a shared layout without thinking. It's opt-in per page. The default telemetry (AuthEvent + PageView) is already enough for most observability needs. Action tracking is for pages where you genuinely want interaction-level data.

---

## Reference implementation

**`sites/calmstorm-decks/`** at versions 0.0.6.0 and 0.0.7.0 is the canonical reference. Every file path in this blueprint corresponds to a file in that site's tree. The three site-level changelogs walk through it:

- `sites/calmstorm-decks/context-v/changelogs/2026-05-10_07.md` — v2 kernel landing
- `sites/calmstorm-decks/context-v/changelogs/2026-05-10_08.md` — operator surface (CLIs, admin, tracker, logout)
- `sites/calmstorm-decks/context-v/changelogs/2026-05-11_01.md` — production unblock (import.meta.env fix, schema push, identity seed)
- `sites/calmstorm-decks/context-v/specs/Confidential-Access-v2-Persistent-Sessions-and-Telemetry.md` — the site-level spec this blueprint generalizes

---

## Related

- **Parent exploration:** [[Rethinking-Confidential-Access-with-Persistent-Sessions-and-Auth-Telemetry]] — the decision-by-decision reasoning that produced this pattern
- **Predecessor:** [[Confidential-Content-Access-Control-Blueprint]] — v1 (still valid for sites that don't need persistence or telemetry)
- **Lessons captured:**
  - [[Auth-Identity-System-Worked-but-UX-Failed-Silent-Bounces]] — the fullstack-vc post-mortem that motivated Identity-first, two-cookie sessions, and AuthEvent
  - [[Troubleshooting-SSG-Authentication-and-Port-to-SSR-w-Database]] — the SSG → SSR pivot and the callback-URL landmines
- **Cross-cutting changelog:** `changelog/2026-05-11_01.md` — family-level announcement
- **Future:** when a second site adopts this pattern cleanly, candidate for extraction as `@lossless-group/access` published package
