---
title: "Maintain Privacy Gates in Three Modes"
lede: "One gate, three doors: a shared passcode, a verified email on the firm's list, or a link minted for one person. Each opens only what it names."
publish: true
date_created: 2026-10-13
date_modified: 2026-10-14
date_authored_initial_draft: 2026-10-13
date_authored_current_draft: 2026-10-14
date_authored_final_draft:
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5 (1M context)
at_semantic_version: 0.0.2.0
status: Draft
summary: >-
  The consolidated gating blueprint for Astro Knots sites. Reconciles the v1
  (Confidential-Content-Access-Control) and v2 (Persistent-Sessions-and-Auth-Telemetry)
  blueprints with the stateless HMAC gate shipped in client-portals-site, names three
  privacy modes (passcode, verified email against a roster, per-recipient link), and
  defines one session payload, one scope rule, and a roster-provider seam so the
  allowlist can come from YAML, a CRM, or a fund back-office (Decile Hub). Adds a
  "name the reader" layer on top of the shared passcode: a modal, then a persistent
  popover, asking passcode visitors for a name and email, routed to a sink (log,
  Slack, a queue drained into Decile Hub by script or the Decile MCP, or a direct
  Decile write). Load before adding a gate to any site; site-level plans implement it.
site_uuid: e8ea895f-d7f2-43e4-8ad4-eb515788f80b
hex_code: dw2vjx
tags:
  - Blueprint
  - Confidential-Access
  - Privacy-Gates
  - Authentication
  - Signed-Link-Tokens
  - Email-Verification
  - Roster-Providers
  - SSR-Gating
  - Investment-Memos
  - Cross-Site-Pattern
type: Blueprints
---

# Maintain Privacy Gates in Three Modes

## Why Care?

Venture firms want to show more than they can publish. A portfolio page is public;
the investment memo behind each company is not. A deck is for the people in the
room; the deck's appendix is for the people who wired money. Every site in this
family has met that problem, and every site solved it again, a little differently,
with its own cookie, its own passcode hashing, and its own holes.

This blueprint is the map those solutions add up to. A visitor gets through a gate
by one of three doors:

1. **A shared secret.** One passcode, handed out by hand. Cheap, deniable, and
   anonymous: you know *a* holder got in, not *who*.
2. **A verified email on the firm's list.** The visitor proves they own an address,
   and the address (or its domain) is on a roster: a firm's LP list, a client's
   staff, a co-investor's partners.
3. **A link minted for one person.** The link is the credential. It names who it was
   for, what it opens, and when it stops working.

Behind all three sits the same rule: **a session says what it opens, and a page
checks that it names the page.** The rest of this document is how to keep that true.

## Lineage

Three generations are live in the tree. This blueprint keeps what each got right.

| Generation | Where | What it got right | Where it went wrong |
|---|---|---|---|
| v1: passcode + plain cookie | hypernova-site, dark-matter | Request-time memo fetch from a private repo ([[GitHub-Secure-Content-Pattern]]); email capture | Middleware trusts any non-empty cookie; email mode never checks the visitor owns the address |
| v2: server sessions + signed links + telemetry | calmstorm-decks, chroma-decks, eventcut-ai | Per-recipient HMAC links with use limits and revocation; bot-safe link previews; who-saw-what telemetry | Needs a database; fails *open* when the database is down |
| v3: stateless signed cookie | mpstaton-site `/promote`, client-portals-site | No store; HMAC payload; constant-time compares; path-scoped cookies; fail closed | mpstaton never checks the cookie's scope; a dev bypass that works in production |

Docs this reconciles: [[Confidential-Content-Access-Control-Blueprint]] (v1),
[[Maintain-Confidential-Access-with-Persistent-Sessions-and-Auth-Telemetry]] (v2),
[[Build-a-Promotion-Surface-for-Investment-Opportunities]] (the hard gate), and the
"Privacy and gating" section of [[Build-a-Client-Portals-Site]]. Their tier numbers
conflict (v1's Tier 1 is the passcode; v2's Tier 1 is the signed link). This
document drops tier numbers and names **modes** instead, so the order implies nothing
about strength.

## Calibrate first: courtesy or contract?

Not every gate needs all three doors. Decide which you are building before writing
code; [[Security-Overkill-for-Avoiding-Brand-Rank]] and the "Polite Gate Posture" in
[[Build-a-Fundraise-Deck-Workspace]] are the calibration docs.

- **Courtesy.** The threat is being *findable*: crawlers, AI indexers, a curious
  click. `noindex`, `X-Robots-Tag`, no sitemap entry, codenames. No gate at all.
- **Passcode.** The threat is casual onward sharing of a URL. Mode 1.
- **Named access.** The content is confidential to a known set of people (LPs, a
  client's team), and you need to know who saw it. Modes 2 and 3.

The investment memo case is **named access**. Memos carry deal terms, valuations,
and diligence findings about companies that did not consent to publication.

## The model

### Scopes

A **scope** is the unit a gate protects. It is a string the content declares, not a
URL prefix:

```
memo:cognitive-scientific      one company's memo
memo:*                         every memo
portal:9peyu4                  one client portal
```

Content declares its scope in its own frontmatter or config (`gate.scope`). Rosters,
passcodes, and links grant scopes. A page renders gated content only when the
session's scopes **match** the content's scope (`memo:*` matches `memo:anything`).

### The session payload

One cookie shape for every mode, signed, never stored:

```ts
interface GateSession {
  sub: string;        // who: an email, a link's recipient label, or "passcode"
  via: 'passcode' | 'email' | 'link';
  scopes: string[];   // what it opens; checked on every gated render
  exp: number;        // unix seconds
  jti?: string;       // link id, for revocation and attribution
  who?: { name: string; email: string }; // self-reported, passcode sessions only (see below)
}
// cookie value: base64url(JSON(payload)) + "." + HMAC-SHA256(payload, GATE_SESSION_SECRET)
```

This is the client-portals `gate.ts` kernel with the payload widened from one
`portal` id to `sub` + `via` + `scopes`. Everything else in that file carries over:
`timingSafeEqual`, `HttpOnly; SameSite=Lax; Secure`, `safeNext()` against open
redirects, the export token for headless PDF rendering.

**Scopes are re-derived, not just trusted, for mode 2.** An email session's scopes
are computed from the roster when the session is minted; when the roster changes
(an LP's access is removed), the next re-check should drop them. Keep email
sessions short (7 days) and re-resolve the roster on mint. Passcode and link
sessions carry their scopes for their lifetime.

### Mode 1: shared passcode

- One env var per passcode, holding the plaintext or a scrypt hash with a
  per-deployment salt (`GATE_PASSCODE_<NAME>`). A config file maps passcode names
  to scopes.
- Compare with `timingSafeEqual` after `trim()`. Case-sensitive unless the config
  says otherwise.
- `sub: "passcode"`, `via: "passcode"`. Anonymous by design. If attribution
  matters, calmstorm's `-<label>` suffix trick (the visitor types `code-acme`)
  sets `sub` to the label without a second secret.

### Mode 2: verified email against a roster

Two halves, and both are required. dark-matter shipped only the second half, which
means anyone who types a listed address gets in.

**Prove ownership.** Pick one:

- **Email one-time code** (recommended for LP audiences). The visitor enters an
  address; the server sends a six-digit code and sets a short-lived signed
  *challenge* cookie `{email, codeHash, exp: 10 min}`; the visitor types the code.
  Stateless, works with any mailbox, no OAuth app per site. Needs a transactional
  email sender (Resend) on a domain with SPF and DKIM.
- **Google or Microsoft sign-in.** Better UX when the whole roster is on Google
  Workspace or Microsoft 365, which LP rosters rarely are (family offices, personal
  addresses). Pattern: fullstack-vc's OAuth callbacks.
- **The shared identity service** (`id.didi.sh`), once it federates to sites outside
  `.didi.sh`. It already does magic links over Resend.

**Check the roster.** Look up the verified email in the roster and mint a session
with the scopes it grants. No match: say so plainly, log the attempt, and offer a
"request access" path. Do **not** fall through to the passcode form silently; the
fullstack-vc post-mortem (UX failed on silent bounces) is the reason.

### Mode 3: per-recipient link

- A link token is a signed payload `{jti, sub, scopes, exp, max_uses?}`, minted by a
  CLI or an admin page and sent by a human. Redeeming it sets the session cookie and
  redirects to the content.
- **Bot-safe previews** (from calmstorm): if the user agent is a link unfurler,
  serve OG tags only and do not redeem.
- **Revocation without a database:** a `GATE_REVOKED_LINKS` env list of `jti`s,
  checked on redeem and on every gated render. Rotate `GATE_SESSION_SECRET` to
  revoke everything.
- **Use limits need state.** If `max_uses` or a per-link audit trail matters, add
  the v2 store (Astro DB + Turso: `MintedToken`, `Session`, `AuthEvent`). Fail
  **closed** when that store is down; this is the one v2 behavior not to copy.

## Naming the passcode reader (a layer on mode 1)

A shared passcode is the door people actually use: it works on the first try, from
any device, with nothing to set up. It is also anonymous, and for named-access
content (the investment memo case) "someone with the passcode read the Chroma memo"
is not good enough. Mode 2 fixes that properly but needs a sending domain and a
roster; until then, and for the readers who will always prefer the passcode, **ask**.

This is **not a fourth door.** It grants nothing, checks nothing, and changes no
scope. It attaches a self-reported name to a passcode session and tells the firm.

### What the visitor sees

1. **The modal**, once, right after a passcode unlock. Title "Who's reading?", two
   fields (name, email), one sentence on where it goes ("Your name and email go to
   Humain Ventures and nowhere else"), and two buttons: **Continue** and **Not now**.
   A native `<dialog>`; Escape means Not now.
2. **The popover**, after "Not now". A small card in the bottom-right corner, same
   two fields, on every page view of the gated area. Its job is to be *mildly*
   annoying, never in the way:
   - no backdrop, no focus trap, never over the reading column;
   - a close button that hides it for the current page only;
   - after three closes it collapses to a slim bar ("Tell us who's reading") that
     stays until submitted.
3. **Nothing,** once submitted. The server re-mints the session with `who` set, so
   the prompt stops on that browser for the life of the session.

Sessions from mode 2 or 3 already know who they are and never see it. Both pieces are
one Svelte island (`IdentifyPrompt.svelte`) mounted by the gated layout when
`session.via === 'passcode' && !session.who`. The snooze count lives in a plain
cookie; it is UX state, not security state.

**Calibrate it like the gate.** `ask` (above) suits a courtesy-to-named spectrum;
`require` makes the modal non-dismissible for content where an anonymous read is
unacceptable. At `require`, consider whether you actually want mode 2.

### The endpoint

`POST /api/<area>/identify` with `name`, `email`, and a hidden honeypot field.

- Requires a valid passcode session; otherwise 401. It can't be used to probe the
  roster, because it never reads one.
- Trims and caps lengths (name ≤ 120, email ≤ 254), checks email shape, rejects a
  filled honeypot silently.
- Re-signs the session with `who: { name, email }` and the same `scopes`/`exp`.
- Hands a record to the configured sink, **after** responding (Vercel `waitUntil`),
  with a short timeout. The visitor's reading never waits on, or fails because of,
  the sink. Sink failures are logged (rule 8 below).

```ts
interface Identification {
  name: string;
  email: string;            // self-reported, NOT verified; label it so downstream
  via: 'passcode';
  passcode: string;         // which passcode name, e.g. "lp"; never its value
  scopes: string[];
  firstPath: string;        // the page they were on when they answered
  at: string;               // ISO timestamp
}
interface IdentifySink { send(r: Identification): Promise<void> }
```

### Where the name goes: sinks

| Sink | Holds a back-office token? | When |
|---|---|---|
| `log` | No | Default; the record lands in the function log / log drain. |
| `slack` | No (a webhook URL) | The partners want a ping in a channel. |
| `queue` | No | Append to a private store (Upstash/Vercel KV, a Blob, a private-repo file); drained into the CRM later. |
| `decile` | **Yes** | Real-time write into Decile Hub from the server function. |

The `queue` sink keeps the [Sync, don't call](#rosters-where-the-list-comes-from)
rule intact: the back-office token stays wherever the drain runs. The `decile` sink
bends it, deliberately and narrowly: one write per *identification*, never per page,
after the response. Choose it only when the partners want the CRM updated as it
happens, and give the site its own low-privilege Decile token (a user token, not an
admin one; `GET /api/v1/whoami` shows which you have), not the token the roster
sync uses.

### Routing into Decile Hub

The same three steps whether a script drains the queue, the server function writes
directly, or an agent works the queue through the Decile MCP. Per the
`decile-hub-connector` skill (raw `Authorization` token, tenant subdomain,
`/api/v1/`):

| Step | REST | Decile MCP tool |
|---|---|---|
| 1. Is this email already a person? | `GET /api/v1/people?email=<email>` | `search_people_orgs` (`q` = the email) |
| 2a. Known person: record the visit | `POST /api/v1/people/{id}/notes` `{ note: { body, context } }` | `add_person_note` (`person_id`, `body`, `context`) |
| 2b. New person: create, tagged | `POST /api/v1/person` (upsert by email) with `first_name`, `last_name`, `email`, `tag_list`, `note` | `create_or_update_person` |
| 3. Optional: ask a partner to follow up | `POST /api/v1/tasks` (`title`, `assignee_id`; needs the account's `hub_tasks` flag) | `create_task` (`subject_type: Person`, `subject_id`, `action_type: follow_up`) |

- **Never upsert over a known person.** `POST /api/v1/person` matches by email and
  *overwrites* the fields you send, so a visitor typing "Bob" would rename the LP
  record "Robert Smith". For a match, only add the note (2a).
- **Say it's self-reported.** Note body: `Investor area: opened with the shared
  passcode ("lp") and gave this name and email (self-reported, not verified). First
  page: /lp/memos/chroma/. 2026-10-14 15:02 UTC.` Context: `Investor portal`.
- **Tag new people** (`Investor-Portal-Visitor`) so the partners can filter them,
  and split the typed name on the last space for `first_name`/`last_name`.
- **The MCP is for agents, not the site.** A website can't call an MCP server; it
  is how Claude Desktop or Claude Code acts on the queue ("file the new portal
  visitors into Decile"). The site's direct path is the REST API.

### Triage against the LP list, and a link back

Two cheap additions that make the answer useful without verifying it (humain-web,
2026-10-14):

- **Match against the roster on submit.** A plain, hand-editable `LP_ROSTER` env
  var (`email, Label` lines or JSON, generated by `sync-roster --plain`) plus the
  hashed `GATE_ROSTER`. The label ("Fund I LP") is saved with the answer, set on the
  analytics profile and written into the CRM note. **Never tell the visitor**, or
  the form becomes a way to test whether an address is an LP. It is triage, not
  identity: anyone can type an LP's email.
- **Email a personal link back.** Mint a mode-3 link with the session's own scopes
  (30 days) and send it to the address given; the thanks message names the sender
  to look for. It costs no confirmation step, rewards an honest answer with a
  passcode-free bookmark, and turns later visits into named link sessions. A wrong
  address only sends the link to whoever owns it, with no more access than the
  passcode already gave. Any verified Resend domain works as the sender; humain-web
  uses didi.sh's (`no-reply@didi.sh`) until humain.vc is set up.

### For humain-web

- Turn it on as `ask` for the `lp` passcode.
- Sink: `queue`, drained by `pnpm sync-visitors` (next to `sync-roster`, same
  `~/.secrets` token, never on Vercel) or by an agent with the Humain Decile MCP.
  Move to `decile` only if the partners decide real-time matters more than keeping
  the Decile token off the site, which today is a stated rule.
- An email address that matches the roster can later be offered the email door
  instead, once it is switched on.

## Rosters: where the list comes from

Mode 2 needs a list of people and the scopes each may open. Treat the source as a
plug-in behind one interface, so the gate never knows whether the list came from a
YAML file or a fund back-office:

```ts
interface RosterEntry {
  email: string;               // lower-cased, exact
  scopes: string[];
  label?: string;              // "Fund I LP", "SPV LP", "GP"
  source: string;              // "yaml" | "decile" | "twenty" | ...
}
interface RosterProvider { load(): Promise<RosterEntry[]> }
```

| Provider | When | Notes |
|---|---|---|
| YAML in a private repo | Small, hand-kept lists | The default. Same private-repo read as the content. |
| Domain rule | "Anyone at @firm.com" | A roster entry with `domain:` instead of `email:`. Never for consumer domains (gmail.com, outlook.com). |
| CRM (Twenty) | Client staff, co-investors | Query people by organization or tag. |
| Fund back-office (Decile Hub) | A firm's LPs | See below. |

**Sync, don't call.** A roster provider runs on a schedule (a script, a GitHub
Action, or a Vercel cron), writes a normalized `roster.json` to a private store,
and the site reads that file at request time with a short cache. The site never
calls the back-office on a visitor's request: back-office APIs are slow, unmetered,
and hold far more than the gate needs. The back-office token lives only where the
sync runs.

### Decile Hub as a roster provider

Decile Hub has no "is this email an LP" call. The authoritative path, per the
`decile-hub-connector` skill:

1. `GET /api/v1/entities` to find the fund and SPV entities.
2. `GET /api/v1/entities/{entity_id}/capital_accounts` for each. This lists accounts
   by name and `partner_type` (`limited_partner` / `general_partner`), with no emails.
3. `GET /api/v1/capital_accounts/{id}` for each account, which carries
   `primary_contact.email` and `contacts[].email`.
4. Map entity to scopes in config (a fund entity grants `memo:*`; an SPV entity
   grants the one company it invested in), union per email, write `roster.json`.

Auth is `Authorization: <raw token>` (no `Bearer`), against the firm's tenant
subdomain. One call per capital account, so this belongs in the sync, never in a
request. Pipeline prospects are *not* LPs; don't build the roster from investor
pipelines unless the gate is meant for prospects.

## Keeping gated content out of the build

A gate in front of a static file is a sign on an unlocked door. Gated content must
not be in `dist/`, the client bundle, the public repo, or a CDN cache.

- **Gated routes are server-rendered** (`export const prerender = false`) on an
  adapter (`@astrojs/vercel`). Public pages stay prerendered.
- **Content lives in a private repo** and is read at request time with a
  fine-grained token ([[GitHub-Secure-Content-Pattern]]; client-portals-site's live
  collections). The site's own repo holds only the public layer.
- **Locked responses never include the content**, not even hidden. Render the
  unlock form in its place (`context.rewrite` to the unlock page keeps the URL).
- **Caching:** gated responses send `Cache-Control: private, no-store` and
  `Vary: Cookie`; on Astro 7's route cache, `Astro.cache.set(false)`.
- **Search:** don't put gated text in a public Pagefind index
  ([[Nuances-of-Search-and-Privacy-Courtesy]]).
- **Sanitize on publish, not on render.** Content generated by tools (memos from
  memopop, for instance) carries local file paths, internal notes, and broken image
  paths. A publish step rewrites it into a clean, reviewable folder; the site
  renders only that folder.

## How to follow it

1. **Calibrate.** Courtesy, passcode, or named access? Write it in the site's plan.
2. **Declare scopes on content.** `gate: { scope: memo:<slug> }` in frontmatter.
3. **Start from client-portals `gate.ts`**, widen the payload to `GateSession`, add
   a `scopeMatches(session, scope)` and use it on every gated render.
4. **Add modes as needed:** passcode first; then email OTP + roster; then links.
5. **Middleware** decides only "is this path gated, and does the cookie verify?"
   The page decides "does the session's scope cover *this* content?" Both run.
6. **Fail closed** everywhere: missing secret, missing roster, store down.
7. **Dev bypass** only behind `import.meta.env.DEV`.
8. **Log every attempt** (mode, outcome, `sub`, scope, reason) somewhere you can
   read: an AuthEvent table, OpenPanel events, or a log drain. Silent failures are
   how gates die in practice
   ([[Delivering-A-Deck-To-A-Client-Who-Will-Not-Log-In]]).
   What readers do *after* the gate (time on page, scroll depth, downloads) is
   [[Maintain-Base-Engagement-Analytics]]; gated reading data stays first-party.
9. **Test the kernel** (client-portals' `tests/gate.test.ts` is the starting suite)
   and drive the locked and unlocked paths in a browser before handing over.

## Environment variables

| Var | Mode | Purpose |
|---|---|---|
| `GATE_SESSION_SECRET` | all | HMAC key for sessions, links, and email challenges (32+ random bytes) |
| `GATE_PASSCODE_<NAME>` | 1 | A passcode (plaintext or scrypt hash) |
| `GATE_ROSTER_URL` or repo path | 2 | Where `roster.json` lives |
| `RESEND_API_KEY`, `GATE_EMAIL_FROM` | 2 | One-time code delivery |
| `GATE_REVOKED_LINKS` | 3 | Comma-separated revoked `jti`s |
| `GATE_EXPORT_TOKEN` | all | Lets headless Chrome render a gated print route |
| `GATE_DEV_BYPASS` | dev | Honored only when `import.meta.env.DEV` |
| `GATE_IDENTIFY` | 1 | `off` (default), `ask`, or `require`: the name-the-reader layer |
| `GATE_IDENTIFY_SINK` | 1 | `log` (default), `slack`, `queue`, or `decile` |
| `GATE_IDENTIFY_SLACK_WEBHOOK` | 1 | For the `slack` sink |
| `DECILE_API_URL`, `DECILE_HUB_API_KEY` | 1 | Only for the `decile` sink; a dedicated low-privilege token |
| `GITHUB_CONTENT_TOKEN` | content | Read-only token for the private content repo |

Existing sites use other prefixes (`PORTAL_`, `PROMOTE_`, `UNIVERSAL_PORTFOLIO_`).
Don't rename them as a side effect; adopt `GATE_` in new sites.

## Anti-patterns

- **Trusting a cookie because it exists.** Verify the signature and the scope.
- **An email box with no ownership check.** That's a guestbook, not a gate.
- **One session that opens everything** when the content has scopes.
- **Calling the back-office per request,** or shipping its token to the browser.
- **A gated page that is also prerendered,** or a memo in `src/content/` of a public repo.
- **Failing open** when a database, secret, or roster is missing.
- **Inventing a fourth door** before the three here are exhausted. (Naming the
  passcode reader is a layer, not a door: it grants nothing.)
- **Treating a self-reported name as identity:** using `who` for scopes, overwriting
  CRM records with it, or calling it verified.
- **Making the reader wait on the CRM.** Sinks run after the response.

## Open questions

- Extract the kernel as a shared package? Three proposals exist
  (`@knots/auth-patterns`, `@lossless-group/access`, `lossless-auth-core`) and no
  site has adopted one. Wait for the second site on this blueprint.
- Should mode 2 federate to `id.didi.sh` instead of each site sending its own codes?
- Naming the reader: does a submitted email that matches the roster upgrade the
  session (no), or prompt the reader to use the email door (probably, once it's on)?
- Env naming drift: humain-web's scripts read `DECILEHUB_API_KEY`; the
  `decile-hub-connector` skill standardizes `DECILE_HUB_API_KEY`.

## Related

- [[Maintain-Base-Engagement-Analytics]]: what readers do once inside, attributed
  to the identity this gate establishes (including the name-the-reader layer)
- Once this blueprint is signed off, the v1 and v2 blueprints get
  `superseded_by: [[Maintain-Privacy-Gates-in-Three-Modes]]` in a deliberate pass.
