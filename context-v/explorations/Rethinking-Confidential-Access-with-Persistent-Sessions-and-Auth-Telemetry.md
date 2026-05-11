---
title: "Rethinking Confidential Access with Persistent Sessions and Auth Telemetry"
lede: "The hypernova/dark-matter passcode pattern got us shipping, but the calmstorm-decks lockout — busy client, no telemetry, can't tell whether the cookie failed or the passcode was mistyped — exposes its limits. This exploration scopes the decisions for a v2 confidential-access shape: persistent (FB-style) sessions, durable auth telemetry, and a topology that keeps Astro SSG for content while letting a thin server tier own auth and identity."
date_authored_initial_draft: 2026-05-10
date_authored_current_draft: 2026-05-10
date_authored_final_draft:
date_first_published:
date_last_updated: 2026-05-10
at_semantic_version: 0.0.1.0
status: Draft
augmented_with: Claude Code (Opus 4.7)
category: Exploration
tags: [Authentication, Confidential-Access, Persistent-Sessions, Auth-Telemetry, Observability, Turso, Astro-DB, SSR-Shell, SSG-Content, Calmstorm-Decks, Pseudomonorepo-Blueprint-Candidate]
authors:
  - Michael Staton
date_created: 2026-05-10
date_modified: 2026-05-10
---

# Rethinking Confidential Access with Persistent Sessions and Auth Telemetry

> **Status:** Exploration — decisions to make before writing the v2 blueprint.
> **Driving incident:** calmstorm-decks. Primary client cannot enter the site with the configured passcode; we have no telemetry to know whether it's a typo, a cookie-block, a misrouted env var, or something else. A second tester with the same string got in on the first try.
> **Successor to:** [[Confidential-Content-Access-Control-Blueprint]] (v1, passcode + httpOnly cookie, 24h)
> **Lessons from:** [[Auth-Identity-System-Worked-but-UX-Failed-Silent-Bounces]], [[Troubleshooting-SSG-Authentication-and-Port-to-SSR-w-Database]]

---

## What this exploration is for

Decide the **shape** of v2 confidential access before writing the blueprint. Five constraints from the user, plus one from the post-mortems:

1. Most code is already Astro. **Don't port to Svelte** wholesale; wrap, don't rewrite.
2. **Auth must be bulletproof for the client.** Any failure must leave durable evidence we can read later.
3. Interactive features are imminent. **Session + identity data must persist and be analyzable** (not just an opaque cookie).
4. The client is busy. **Sessions should be long-lived**, FB-style — re-auth should be rare.
5. **Only the landing page and `/changelog` need to be public.** Everything else is gated.
6. (From the post-mortems) **No silent failures.** The fullstack-vc auth system *worked* — but the UX around it failed in three places and we had no log to see it. v2 must make every failure mode visible.

Out of scope here: any UI design beyond "the gate is friendly and the error states say something." That belongs in the blueprint.

---

## What v1 got right (keep)

From [[Confidential-Content-Access-Control-Blueprint]] and the dark-matter implementation prompt:

- **Passcode + httpOnly cookie + middleware route protection** is the right kernel. Don't over-engineer to OAuth-only for a client deck site.
- **Hashed passcode (salt + SHA256) in production**, plaintext in dev — keep.
- **Middleware-driven gating** by route prefix — keep, expand the prefix list to *everything except landing + changelog*.
- **`prerender = false` only on the gated surfaces and the verify endpoint** — keep. Most of the site stays SSG.

## What v1 got wrong (or didn't address)

- **Cookie lifetime is 24 hours.** For a busy client, that's a re-auth every visit. Should be *months*, refreshable on each authenticated request.
- **Opaque cookie value.** The cookie is a random hash with no DB row behind it. We can't tell "did this user ever successfully auth?" or "when did they last hit a page?"
- **Zero telemetry on the verify endpoint.** No record of attempt timestamps, IPs, user-agents, success/failure reasons. The current calmstorm-decks lockout is *unsearchable*.
- **No identity beyond "has cookie."** When we add interactive features, we have no person-level handle to attach votes/clicks/comments to.
- **No surface for us to see "did the client try yet?"** — which is the question we actually need to answer right now.

---

## The five decisions

### Decision 1 — Auth mechanism: a three-tier stack

Revised after user input 2026-05-10. The original framing (passcode vs. magic-link vs. OAuth) collapsed once we recognized that **the deck author already has a high-trust 1:1 channel with the client (WhatsApp)** and that **the client's company has a known email domain (`@calmstorm.vc`)**.

The right shape is a stack where each tier handles a distinct entry mode:

| Tier | Mechanism | Who it serves | Delivery |
|---|---|---|---|
| **1 — Door** | **Pre-authed signed-token link** | Initial onboarding of the primary client | WhatsApp (or any 1:1 channel — Signal, SMS, iMessage). No email infra required. |
| **2 — Self-service** | **Google OAuth + domain allowlist (`@calmstorm.vc`) + explicit guest allowlist** | The client returning on his own; partners at the firm; specific named guests | Standard OAuth flow, per-site Google Cloud project |
| **3 — Fallback** | **Universal passcode — two roles (admin / viewer)** | Device-without-email situations; emergency access; downstream shares the stakeholder chooses to make | Shared string we hand over manually; **different string per role** |

**Tier 3 has two distinct passcodes mapping to two `Session.role` values:**

| Passcode | Role | Can see / do |
|---|---|---|
| `ADMIN_PASSCODE` | `admin` | Everything: deck, `/admin/activity`, `/admin/auth-events`, mint UI if/when we build one |
| `VIEWER_PASSCODE` | `viewer` | Deck only — scroll, slide-play, external links. No `/admin/*`. No awareness those routes exist. |

Why two passcodes instead of role-on-account: Tier 3 has no account. The passcode *is* the credential and the role both. A leaked viewer passcode never exposes admin surface; a leaked admin passcode is the same blast radius as today's single passcode.

#### The shared-label suffix hack

Tier 3 viewer passcode supports an **optional suffix** for soft attribution when the stakeholder shares the deck externally. Format: `<passcode>-<shared_label>`.

Example: if `VIEWER_PASSCODE=calmbalm`, the client can give an LP `calmbalm-anthos`. The verify endpoint:

```
submitted = "calmbalm-anthos"
[left, right] = submitted.split('-', 2)
if left === VIEWER_PASSCODE:
   shared_label = right || null
   admit as viewer
   Session.shared_label = "anthos"   (nullable)
   Identity = upsert by slug "shared:anthos" if right present, else null
```

**What we store:**
- `Session.shared_label` — the raw string after the dash (e.g. `"anthos"`)
- A synthetic `Identity` row, slug `shared:<label>`, label `"Shared: anthos"` — created on first use, reused on subsequent visits with the same suffix
- All `PageView` and `Action` rows for that session inherit `identity_id` via the synthetic row

**Why this matters:**
- Stakeholder gets frictionless sharing — they don't have to ask us for a new link or run anything
- We get attribution-grade data without building a sharing UI: "Anthos came in twice this week, spent 14 minutes on the deck, clicked through to the team page"
- The synthetic Identity is just another row in the Activity dashboard — same timeline view, no special-casing

**Schema additions:**
- `Session.shared_label TEXT NULL`
- `AuthEvent.shared_label TEXT NULL` (so we can see attribution attempts even on failed logins)

**Edge cases:**
- Multiple dashes: split on the *first* dash only. `calmbalm-andreessen-horowitz` → label is `andreessen-horowitz`.
- Empty suffix (`calmbalm-`): treat as no suffix, admit normally.
- Suffix on admin passcode: same mechanic supported, in case we ever want to track "which admin session was this." Low priority.
- Slug collisions: `shared:anthos` is a deterministic slug — two different LPs both labeled "anthos" by the client would collide. Acceptable for now; we can ask the client for unique labels if it becomes a problem.

**We log this from day one; we don't have to build the dashboard view for it now.** The data accumulates and we add the per-label rollup later.

**Tier 1 (signed link) sessions** also carry a role, set at mint time:
```
pnpm mint-link --identity=mp-client-1 --role=viewer --days=30
pnpm mint-link --identity=mp-self    --role=admin  --days=365
```
Default role for mint is `viewer`. Admin links are explicit.

**Why this stack:**

- **Tier 1 is the bullseye for the current calmstorm-decks problem.** The client is busy and inattentive; a pre-authed link is a one-click experience and removes "did the passcode work" as a failure mode entirely. We control delivery via WhatsApp, so spam folders / email forwarding don't apply.
- **Tier 2 is the persistence story.** Once the client OAuths once with Google, his session lasts 90+ days (Decision 4). His partners with `@calmstorm.vc` emails get the same auto-admit. We never have to send him another link.
- **Tier 3 is the belt-and-suspenders.** Keep the existing v1 passcode for "I lost the link and I'm not signed in on this device."

#### The primitive behind Tier 1: signed-token magic link

The "pre-authed link" is conceptually identical to an email magic-link — a URL with a signed token that, on click, validates the signature, mints a `Session` row, and sets the session cookie. The only difference from email-based magic-links is the **delivery channel is whatever 1:1 channel makes sense for the recipient**. For calmstorm-decks: WhatsApp. For a future client: maybe email. The server doesn't care.

Implementation sketch (Identity-first):

```
Step 0 — seed Identity (us, before minting):
  CLI:  pnpm identity:create --slug=mp-client-1 --label="Primary Client" --email=...
  → INSERT INTO Identity (...)

Step 1 — mint token (us, references existing Identity):
POST /api/access/mint-link            (admin-only)
  body: { identity_slug, expires_in_days, max_uses }
  → SELECT Identity WHERE slug = ?
  → sign JWT carrying { token_id, identity_id, expires_at }
  → INSERT INTO MintedToken (...)
  → returns: https://calmstorm-decks.vercel.app/access/link/<signed-jwt>

Step 2 — redeem (client clicks from WhatsApp):
GET /access/link/<token>
  → verify signature + expiry
  → SELECT MintedToken WHERE id = ? — check uses_remaining, revoked_at
  → INSERT Session (identity_id = token.identity_id, tier='signed_link')
  → DECREMENT MintedToken.uses_remaining
  → INSERT AuthEvent (outcome='success', identity_id, token_id, session_id)
  → set session cookie (90 days, rolling)
  → 302 to /
```

The JWT carries: `token_id`, `identity_id`, `expires_at`. Signed with a server-side secret. The DB lookup on redemption catches revocation and use-count exhaustion — the signature alone isn't sufficient authorization.

**Why Identity-first instead of redemption-creates-Identity:**

- We know who we're sending the link to *before* we send it. No reason to defer creating the row.
- The `MintedToken` row gives us "did the link ever get clicked?" as a direct query — `SELECT * FROM MintedToken WHERE identity_id = X` — without waiting for a redemption to create the lineage.
- Future Tier 2 (Google OAuth) can match on the seeded `Identity.email` and merge sessions onto the same Identity row instead of creating duplicates. This is the lesson from [[Auth-Identity-System-Worked-but-UX-Failed-Silent-Bounces]] Issue 4 — populate identity ahead of time, don't reconcile after.

**This eliminates email-magic-link as a separate feature to build.** It's the same code path with a different delivery channel.

#### Tier 2 details: Google OAuth + domain allowlist

- **Per-site Google Cloud project** — every Astro Knots site that uses Google OAuth gets its own OAuth credentials and callback URL. No cross-site coupling like the fullstack-vc/LinkedIn bind. This becomes a blueprint convention.
- **Callback logic:**
  ```
  email = google_profile.email
  if email.endsWith('@calmstorm.vc'):  admit, identity_id = email
  elif email in explicit_allowlist:    admit, identity_id = email
  else:                                deny, log AuthEvent(outcome='not_in_allowlist')
  ```
- The `explicit_allowlist` is a YAML file in the site repo (per [[feedback_yaml_data_files]]) — easy to add a guest, easy to audit.
- **Calmstorm-decks specifically:** allowlist `@calmstorm.vc` domain + any specific guests the client names.

#### Tier 3 remains as v1 — no changes.

**Recommendation:** ship Tier 1 first for the calmstorm-decks unlock (highest pain-relief, no OAuth setup needed). Add Tier 2 as the second move. Keep Tier 3 as-is.

#### Scope decision (2026-05-10)

For calmstorm-decks in its current shape, **build Tier 1 + Tier 3 only. Defer Tier 2 (Google OAuth).** Reasoning from the user:

- The site is still a deck-redesign workspace, not a productized app. OAuth-with-domain-allowlist is the right pattern but premature for current scope.
- Tier 1 covers the two stakeholders we're actually in direct contact with (signed link each).
- Tier 3 (universal passcode) covers everyone else those stakeholders choose to share access with — and the act of sharing the secret is itself a deliberate trust delegation by the stakeholder, which is fine.

**Future-refactor flag:** when this path continues — a dedicated domain, the UI generalizes beyond one client — there will be a refactor to **separate the UI/auth surface from the client-specific content**. Tier 2 lands at that refactor, not before. Logged here so future readers (including future-us) see the lineage.

### Decision 2 — Datastore: Turso (libSQL) vs. Astro DB

Both are libSQL under the hood. We already use Turso on fullstack-vc and the AstroDB-mirrors-Turso pattern is documented in [[Troubleshooting-SSG-Authentication-and-Port-to-SSR-w-Database]].

| | Turso (direct, via `@libsql/client`) | Astro DB |
|---|---|---|
| Schema location | `db/config.ts` + manual migrations | Astro DB schema in `db/config.ts`, typed client |
| Local dev | Separate local libSQL file | Built-in dev DB |
| Production write path | Direct HTTPS calls — works in any runtime | Works fine on Vercel; ergonomic |
| Cross-site reuse | Drop a `db/` folder + `.env` into any site | Tied to Astro |
| Observability tooling | Turso web SQL console (we already use it for ad-hoc audits) | Same — it's the same DB |

**Recommendation:** **Astro DB as the dev/typed surface, Turso as the production DB.** Same pattern fullstack-vc settled on. We get the ergonomic typed client without giving up the SQL console for incident response.

**Tables (minimal):**

```
Identity      — id (slug, e.g. "mp-client-1"), label, email?, org?, notes?,
                created_at, first_seen_at?, last_seen_at?
MintedToken   — id (random), identity_id (FK), signed_jwt, expires_at,
                role ('admin' | 'viewer'),
                max_uses, uses_remaining, minted_at, minted_by, revoked_at?
Session       — id (random), identity_id (FK, nullable for passcode-tier),
                tier ('signed_link' | 'passcode'),
                role ('admin' | 'viewer'),
                shared_label TEXT NULL,   -- from Tier 3 suffix hack
                enrolled_at, last_seen_at, revoked_at?, ua_hash, ip_hash
AuthEvent     — at, outcome, reason, tier, identity_id?, session_id?,
                token_id?, shared_label?, ip_hash, ua_hash,
                passcode_hash_prefix?
PageView      — session_id (FK), identity_id?, path, at, referrer, dwell_ms?
Action        — session_id (FK), identity_id?, at, kind, target, payload_json
                (kind examples: "slide-viewed", "section-expanded",
                "external-link-clicked", "scroll-to-bottom")
```

**`Identity` is created first.** We seed it manually (CLI or admin page) *before* minting a token. The mint flow looks up an Identity by slug/id and writes the `MintedToken` row referencing it. When the token is redeemed, the resulting `Session` is already bound to a real Identity — no post-hoc enrichment needed.

**Passcode-tier sessions** (Tier 3) have `identity_id = null` and `tier = 'passcode'`. They still get `PageView` + `Action` rows; the timeline just isn't attributable to a specific person. That's the intentional trade-off when the stakeholder forwards the secret.

**`AuthEvent` is the lockout-debugging table.** Every verify/redeem attempt writes a row regardless of outcome. The current calmstorm-decks mystery becomes a 30-second `SELECT * FROM AuthEvent WHERE token_id = ? ORDER BY at` query.

**`PageView` + `Action` are the "is he clicking around right now?" tables.** PageView is a route-level INSERT in middleware. Action is for finer-grained interactions (slide viewed, link clicked, expand/collapse) — emitted by a small client-side helper that POSTs to `/api/track`. The `payload_json` column keeps the schema open without churn.

### Decision 3 — Topology: do we actually need SSR, or just SSR-on-some-routes?

The user framed this as "wrap the UX/UI in a Svelte SSR thingy." On re-reading, I think that's slightly stronger than what we need:

- The **content** of the deck is Astro SSG today and should stay that way — fast, indexable for *us* internally, easy to author.
- The **gate, the verify endpoint, the session-refresh ping, and any future interactive feature** are server-rendered or API routes — `prerender = false`, hosted by the same Vercel deployment.
- **Svelte islands** can mount inside Astro pages for any client-side reactivity (vote, comment, react). No need to make Svelte the *shell*.

In other words: Astro's hybrid output (`output: 'server'` with per-route `prerender = true`) does the job. We don't need a separate Svelte SSR app wrapping the site — we need a small set of SSR routes inside the Astro app, plus middleware. That's what dark-matter is already configured to do.

**Recommendation:** **Hybrid Astro (server output, prerender:true on content, prerender:false on auth + gated dynamic routes).** Svelte stays available as the island framework for interactive features. We do *not* introduce a separate Svelte app or a reverse-proxy topology.

#### Clarification: SSR ≠ client-side framework

Worth nailing down because it almost shaped the design wrong. Two orthogonal axes:

| Axis | Meaning | What it enables |
|---|---|---|
| **SSR** (Astro `output: 'server'`, `prerender: false`, API routes) | Code runs on the server per request. | DB reads/writes (Turso), session checks, redirects, dynamic HTML. |
| **Client framework** (Svelte/React/Vue island in Astro) | JS shipped to the browser, reactive. | UI state that changes without a page reload (live charts, optimistic UI, etc.). |

The v2 auth + telemetry surface needs SSR (to talk to Turso) but **does not need a client framework**:

| Surface | What it actually needs |
|---|---|
| Gate page (passcode form) | Plain `<form method="POST">`. Zero JS. |
| Verify / redeem endpoints | Astro API routes (server-only). |
| Middleware (session check, PageView insert) | Astro middleware (server-only). |
| `/admin/activity` dashboard | Astro page, `prerender = false`, reads Turso, renders HTML. Refresh to update. |
| Action tracker (slide-viewed, scroll, etc.) | ~30 lines of vanilla JS calling `fetch('/api/track', …)`. No framework. |

**Conclusion:** no Svelte islands required for v2. Svelte stays available as the escape hatch for future interactive features (live admin updates, reactive polling widget, etc.), but it is not on the v2 critical path. The original "Svelte SSR wrapper" framing was the wrong mental model — what was wanted was server-side *execution*, which Astro does natively.

#### Foreseeable Svelte entry point

The current `/admin/*` surface (Activity dashboard, variant/version review, etc.) was built for *us* as the design-iteration operators. Once we expose any of that to the client — letting them browse variants, compare versions, react to options — **that's when Svelte islands become the right call.** Specific UI shapes that will push us across the line:

- **Side-by-side variant comparison** with toggle/swap interactions
- **Reactions or comments on a variant** with optimistic write + live confirm
- **Presence indicator** ("MP is reviewing this deck right now") in the admin view
- **Live-updating Activity timeline** when a client is actively clicking around

When that work begins, add Svelte as an Astro integration and ship the first island. Don't pre-build the integration now — adding it later costs nothing, carrying it unused costs review attention.

**Rough trigger:** the first time someone says "this admin view should auto-refresh" or "I want the client to click between options without page reloads." Until then, plain Astro + page refresh.

### Decision 4 — Session persistence model

This is the heart of the "FB-style login" requirement.

**Today (v1):** one cookie, 24h, opaque value, no server-side record.

**Proposed (v2):** a **two-cookie model** modeled on what most consumer apps do.

| Cookie | Lifetime | Purpose | Server-side record |
|---|---|---|---|
| `session` | 90 days, rolling — extends on every authenticated request | The thing that keeps the client logged in across visits | Row in `Session` table; can be revoked server-side |
| `csrf` | session-bound | Form/POST protection | Derived; no DB row |

**Enrollment flow:**

1. Client hits a gated URL → middleware sees no `session` cookie → redirect to `/access` (the gate).
2. Client enters passcode → POST `/api/access/verify` → on success, **insert `Session` row, set `session` cookie with 90-day max-age**, redirect to original URL.
3. Optional uplift: gate page also shows "stay logged in on this device" with an email field — POST to `/api/access/enroll-device` triggers a magic-link email, which on click marks the `Session` as device-bound and bumps lifetime to 180 days. Identity gets attached at this step.

**Refresh:** middleware on every gated request bumps `Session.last_seen_at` and re-issues the cookie with a fresh 90-day max-age. As long as the client returns within 90 days, they stay logged in indefinitely.

**Revocation:** we can kill a session by setting `Session.revoked_at`. Middleware checks this on every request. Useful for "client left their laptop at a coffee shop" but more importantly useful for *us* — we can revoke a session and watch the AuthEvent log to confirm.

**Why this beats v1:** the cookie is a *handle to a row*, not an opaque secret. We can answer "did the client ever log in?" by looking at `Session` where `last_seen_at` is non-null. We can answer "is the client looking at the deck right now?" by sorting `PageView` by `at` desc.

### Decision 5 — Telemetry surface

This is the "leave evidence" requirement, and it's the one that would have solved calmstorm-decks in 30 seconds.

**Three layers:**

1. **`AuthEvent` table — server-side, durable.** Every verify attempt writes a row with outcome (`success`, `bad_passcode`, `rate_limited`, `config_missing`, `cookie_blocked`, `unknown_error`), a hashed IP and UA, the first 4 chars of the submitted passcode hash (enough to spot a typo pattern without storing the passcode), and the resulting session id if any. **Never log the passcode itself**, even hashed in full — first 4 chars is a fingerprint, not a recovery vector.

2. **`PageView` table — middleware-driven, durable.** Every request to a gated path writes one row. Cheap (one INSERT) and gives us "is the client looking at the deck right now."

3. **Friendly error states — client-facing.** The verify endpoint always redirects back to `/access?error=<code>` and the gate page renders a specific message per code. No raw 400s — that was [[Auth-Identity-System-Worked-but-UX-Failed-Silent-Bounces]] Bug 1. The error codes are the same enum as `AuthEvent.outcome` so we can correlate.

**Internal surface — the "is he clicking around?" dashboard.** A `/admin/activity` page (gated by a separate admin passcode for now) renders, per Identity:

- Identity card: label, email, created_at, last_seen_at
- MintedToken status: clicked yet? uses remaining? expires when?
- Session list: each session with enrolled_at, last_seen_at, UA hash, page count
- Timeline: last 100 PageView + Action rows, interleaved, newest first

Plus a raw `/admin/auth-events` table for incident response.

This is the thing that ends the current "did he even open it?" anxiety. Refresh the page; you see his last click was 4 minutes ago, on slide 7. Or you see the token has zero uses and he hasn't clicked yet.

**OpenPanel/analytics:** keep as-is for marketing funnel. AuthEvent is for *us debugging*, not for product analytics.

---

## What we'd port from fullstack-vc

Fullstack-vc already implemented most of the libSQL/Turso plumbing. The pieces worth lifting:

- `db/config.ts` shape (Astro DB tables → Turso prod)
- `src/lib/user-record.ts` pattern for upserts with merge-by-handle fallback (will need adaptation — fullstack-vc has a roster, we don't need one for calmstorm-decks initially)
- Vercel adapter config + env var loading
- The audit script pattern (`scripts/_inspect-turso.mjs`) — keep as a one-shot for every site we deploy

What we'd **not** port:

- The participants markdown collection and the prerendered `/people/[handle]` route. That's fullstack-vc's specific shape, not generally applicable.
- The dual-provider OAuth identity merging. Not needed yet.

---

## What this means for calmstorm-decks specifically

To unblock the *current* client lockout, the immediate fix is smaller than the full v2:

1. **Add `AuthEvent` logging** to the existing verify endpoint. Even just `console.log` to Vercel function logs is better than nothing — we'd at least see whether the client is *hitting* the endpoint. A real `AuthEvent` table is better but the immediate need is "see attempts."
2. **Render a friendly error page** on bad passcode with a "contact us" mailto. Currently the redirect-with-querystring works, but the error copy should explicitly tell the client what to do.
3. **Verify the Vercel env var actually loaded** by adding a startup check that logs whether the passcode hash is present (without logging its value).
4. **Send the client the URL plus a one-line "type this exactly" note**, and watch the logs.

These four moves are an afternoon, not a refactor. The full v2 blueprint is the *next* deck site, not retrofitting calmstorm-decks all at once.

---

## Open questions for the user

1. ~~**Topology (Decision 3):** confirm the "Astro hybrid + Svelte islands" reading vs. literal Svelte SSR shell.~~ **Resolved 2026-05-10:** Astro hybrid only. No Svelte islands needed for v2 (SSR ≠ client framework — see Decision 3 clarification).
2. **Datastore (Decision 2):** Astro DB → Turso prod is my recommendation, but if you already had a different leaning (raw Turso, no Astro DB), say so before the blueprint commits.
3. **Admin surface:** is `/admin/auth-events` gated by Tier-2 Google OAuth (limited to `@lossless.group` or named emails) acceptable? That's the cleanest re-use of Tier 2 for our own admin surface.
4. **Scope of "fix calmstorm-decks now":** Tier 1 (signed-token WhatsApp link) is the recommended immediate move. Confirm that's the unblocker, with Tier 2 (Google OAuth) as the follow-on after the client is in.
5. **Link minting UX:** Identity-first flow needs two CLIs (or one with subcommands): `pnpm identity:create --slug=... --label=...` then `pnpm mint-link --identity=<slug> --days=30 --max-uses=5`. Confirm CLI is right (vs. an admin web form, which is more work but reusable across sites).
6. **Action tracking taxonomy:** what `Action.kind` values do you want from day one? My starter list: `slide-viewed`, `section-expanded`, `external-link-clicked`, `scroll-to-bottom`, `tab-focus`, `tab-blur`. Easy to add more later since `payload_json` is open.

**Resolved (2026-05-10):**

- ~~Auth mechanism~~: three-tier stack defined. **For calmstorm-decks current scope: Tier 1 (signed-token link, WhatsApp delivery) + Tier 3 (universal passcode) only. Tier 2 (Google OAuth) deferred** to the future refactor when the UI separates from client-specific content.
- ~~Per-user identity~~: signed-token links carry `recipient_label`, which populates `Session.identity_id`. Passcode-tier sessions have a null `identity_id` (we know it's *someone the stakeholder shared with*, but not who specifically — that's the deliberate trade).
- ~~Email magic-link as separate feature~~: not needed — Tier 1 covers the magic-link primitive with delivery-channel flexibility.
- ~~Calmstorm-decks unblock sequence~~: ship Tier 1 + AuthEvent telemetry first; that ends the current lockout. Tier 3 stays as the existing passcode mechanism, augmented with the new AuthEvent logging.

---

## Next step

Once 1–5 above are settled, the v2 blueprint can be written as a direct evolution of [[Confidential-Content-Access-Control-Blueprint]], with:

- The new tables and middleware shape
- The two-cookie session model
- The AuthEvent telemetry contract
- The `/admin/auth-events` surface
- A migration note for v1 sites (hypernova, dark-matter) that explains how to evolve without breaking existing cookies

Working title: **`Maintain-Confidential-Access-with-Persistent-Sessions-and-Auth-Telemetry.md`** in `context-v/blueprints/`.

---

## Related

- [[Confidential-Content-Access-Control-Blueprint]] — v1, this exploration supersedes (will link forward when blueprint lands)
- [[Auth-Identity-System-Worked-but-UX-Failed-Silent-Bounces]] — the source of the telemetry requirements
- [[Troubleshooting-SSG-Authentication-and-Port-to-SSR-w-Database]] — the original SSG→SSR pivot, callback-URL lesson
- [[Implement-Portfolio-with-Confidential-Access-in-new-Site]] — the dark-matter implementation prompt; what v1 looks like in practice
- [[Maintain-an-Interactive-Polling-System--v2]] — the interactive-features-imminent context that motivates persistent sessions
- [[Choosing-the-Right-DataStores]] — sibling exploration on the broader datastore decision
