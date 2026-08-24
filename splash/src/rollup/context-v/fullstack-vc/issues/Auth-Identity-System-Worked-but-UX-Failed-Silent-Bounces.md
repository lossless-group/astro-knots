---
title: Auth + Identity System Worked, but the Post-Login UX Silently Bounces Users
lede: "Of 17 users who completed OAuth on production, only 2 produced any in-app activity. The auth/identity layer (Turso User table, dual-provider linking by email) is correct — the failure is downstream: a back-button-triggered raw 400, a LinkedIn flow with no settings/edit page, a public profile route that 404s for anyone without a participants markdown file, and no error log to see any of it. Captured from a real user report (Marcos Polanco, 2026-05-09) and a Turso audit of all 17 rows."
date_authored_initial_draft: 2026-05-09
date_authored_current_draft: 2026-05-09
date_authored_final_draft: null
date_first_published: null
date_last_updated: 2026-05-09
at_semantic_version: 0.0.1.0
status: Open
augmented_with: Claude Code (Opus 4.7)
category: Issue Resolution
tags:
  - Authentication
  - OAuth
  - GitHub-OAuth
  - LinkedIn-OAuth
  - Identity-Model
  - Turso
  - Astro-DB
  - Session-Cookie
  - OAuth-State-Mismatch
  - Back-Button
  - SSR-Routing
  - Prerender-404
  - Observability
  - Auth-Event-Log
  - Post-Login-UX
authors:
  - Michael Staton
date_created: 2026-05-09
date_modified: 2026-05-09
publish: false
site_uuid: b607624a-c971-4f86-9c07-49d5bfed3910
hex_code: d1w1ly
from: fullstack-vc
from_path: issues/Auth-Identity-System-Worked-but-UX-Failed-Silent-Bounces.md
---
<!-- Rolled up from fullstack-vc/context-v/issues/Auth-Identity-System-Worked-but-UX-Failed-Silent-Bounces.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

# Auth + Identity System Worked, but the Post-Login UX Silently Bounces Users

**Status:** Open
**Site:** `sites/fullstack-vc`
**Surfaces:** `/api/auth/{github,linkedin}/callback`, `/stack/me`, `/people/[handle]`, `/people/[handle]/stack/edit`, `/login`
**Stores affected:** Turso (`User`, `ParticipationInterest`, `Vote`)

***

## TL;DR

The system that we lost the most sleep over — the one-row-per-person identity model, the OAuth state plumbing, the JWT cookie, the DB write path — **is working**. Marcos Polanco's row in Turso has both `github_handle` and `linkedin_sub` populated against a single canonical id (his email). The dual-provider linking trick worked exactly as designed.

What's failing is everything *after* the cookie is set. Three concrete UX bugs combine to produce the pattern we saw at launch: **17 users authenticated; 15 produced zero activity (no participation interest, no vote, no proposal).** Combined with the absence of any error log, "people sign up and nothing happens" looked like a mystery, when it was three small, fixable redirect/UX problems and one observability gap.

***

## What we observed

- **Reporter:** Marcos Polanco (2026-05-09).
- **His report (verbatim):**
  - "Logging back in with LinkedIn worked at first; pressing the back button on the browser showed this error. Then attempting another login I ended up here as well."
  - "A second login with LinkedIn from a different browser worked well; to note, I could not get back to the settings screen though."
  - "Two browsers. Two different profile pictures, so LinkedIn and GitHub logins present differently though they are using the same identifier (`/people/marcospolanco`)."

We had no error log to look at. So the diagnostic was: pull every User row out of Turso, walk the redirect graph, and reconstruct what each click did.

## Turso audit (2026-05-09)

```
User rows:                    17
  Both providers linked:       2  (mpstaton, mjpolanco)
  GitHub-only:                 6
  LinkedIn-only:               9
  Same person, multiple rows:  Ariel Muslera (2 rows), Rodrigo Borges (3 rows)

Engagement after login:
  ParticipationInterest rows:  9   (across 2 users)
  Vote rows:                   2   (1 user — mpstaton, in seed/test polls)
  Proposal rows:               0
  Users with zero engagement: 15 / 17
```

**Marcos's row, fully populated:**

```
id:             mjpolanco@gmail.com
email:          mjpolanco@gmail.com
name:           Marcos Polanco
github_handle:  marcospolanco
linkedin_sub:   x3Dt0CLfrm
last_provider:  github
first_login_at: 2026-05-09T17:44:51Z
last_login_at:  2026-05-09T18:03:43Z   (returned ~19 min later)
```

The dual-provider merge worked because both providers exposed the same email. The canonical id is the lowercased email, so the second login (LinkedIn) found the existing row and filled in `linkedin_sub` instead of inserting a new row. **Identity model: validated in production.**

A throwaway diagnostic script lives at `scripts/_inspect-turso.mjs` (the `_` prefix marks it as one-off; delete or rename when no longer useful).

***

## The three UX bugs that produced "silent bounces"

### Bug 1 — Back button after OAuth callback returns a raw 400

**Where:** `src/pages/api/auth/github/callback.ts:31`, `src/pages/api/auth/linkedin/callback.ts:26`

The callback deletes the state cookie immediately on entry. When the user clicks the browser's back button after a successful login, the browser re-navigates to `/api/auth/{provider}/callback?code=…&state=…` — but the cookie is gone, the code has already been exchanged, and the handler returns:

```
HTTP/1.1 400 Bad Request
Content-Type: text/plain

OAuth state mismatch — please try logging in again.
```

A bare text/plain 400 in the middle of a polished site reads as "the app broke." It's the page Marcos was looking at when he wrote his first message. The same page is what he saw on the *next* login attempt, almost certainly because his browser history was still pointing at the stale callback URL rather than at `/login`.

### Bug 2 — LinkedIn login has no path to a settings/edit page

**Where:** `src/pages/stack/me.astro:8-13`

`/stack/me` is the post-callback landing page. It branches on `session.provider`:

- `github` → `/people/{handle}/stack/edit`
- anything else → `/people` (the public index)

Two concrete consequences:

1. **LinkedIn-only users have no surface to fill out.** They land on the public people index and there's no link from there to "edit your profile" or "set up your stack."
2. **Dual-provider users get inconsistent behavior depending on which provider they last used.** Marcos's User row has both `github_handle` and `linkedin_sub`, but `/stack/me` only inspects the cookie's `provider` field. When his current session is LinkedIn, he gets `/people` even though his `github_handle` is right there in the DB. That's exactly the "I could not get back to the settings screen" comment.

This routing also explains his observation that "they are using the same identifier (`/people/marcospolanco`)": he probably typed it after LinkedIn dumped him on `/people` with no link out.

### Bug 3 — `/people/{handle}` 404s for anyone without a participants markdown file

**Where:** `src/pages/people/[handle].astro:1-13`

```ts
export const prerender = true;
export async function getStaticPaths() {
  const participants = await getCollection('participants');
  return participants.map(entry => ({ params: { handle: entry.data.handle }, props: { entry } }));
}
```

The route is statically prerendered from the `participants` content collection. There are 11 markdown files there. Anyone who logs in but doesn't have one — every new user, including Marcos — gets a 404 on `/people/{their-handle}`.

This bites on every path:

- `/people/[handle]/stack/edit.astro:54` has `<a href={`/people/${handle}`}>← View public profile</a>`. New users click "back" and 404.
- A LinkedIn user on `/people` tries to click into themselves — 404.
- Sharing a link to your own profile after signup — 404.

### Net effect

For a brand-new user, the GitHub flow renders an edit form (good) whose only way out is a 404 (bad). The LinkedIn flow renders the public people index (no edit affordance) and the user's own profile is also a 404. Either way, hitting back gives a raw 400. So "I authenticated and nothing happened" is the rational user behavior.

***

## Two more issues surfaced by the audit

### Issue 4 — Duplicate rows when a user's GitHub email and LinkedIn email differ

**Where:** `src/lib/user-record.ts:71` (the existence check uses only `id`).

`recordUserLogin` looks up `User` by `id` (the canonical email-or-fallback). If the second-provider login resolves to a *different* canonical id than the first, we insert a new row instead of finding and merging the existing one.

Concrete in production:

- **Ariel Muslera** — 2 rows: `arielmuslera@gmail.com` (GitHub: `amuslera`) and `amuslera05@gsb.columbia.edu` (LinkedIn: `Vd_bBNeFzf`).
- **Rodrigo Borges** — 3 rows: `rodrigo@domo.vc` (GitHub: `borgesdomo`), `rodrigo@domoinvest.com.br` (LinkedIn: `lFDqlpBtCN`), `rvborges@gmail.com` (GitHub: `rvborges`).

#### Why the canonical-id-only lookup misses

`canonicalUserId(session, rosterEntry)` returns `rosterEntry.email.toLowerCase()` (or `<provider>:<subject>` if no roster email). The roster currently has **one entry** (Michael Staton). For everyone else, `matchesRoster()` returns a *synthetic* roster entry built from the session itself — so `canonicalUserId` reduces to `session.email.toLowerCase()`. GitHub returns the user's primary GitHub email; LinkedIn returns the user's primary LinkedIn email. When those differ, the canonical id differs, and `WHERE id = ?` finds nothing.

#### What my merge-by-handle fallback fixes — and what it doesn't

I added a fallback: if the id lookup misses, also look up by `github_handle` (when logging in via GitHub) or `linkedin_sub` (when logging in via LinkedIn). That **only catches repeat logins**:

| Scenario | Caught by fallback? |
|---|---|
| User logs in second time with same provider, but their roster email changed | ✅ yes — `github_handle` / `linkedin_sub` is already on the row from the previous login |
| User logs in for the **first time** with the **second** provider, different email from the first | ❌ no — the second provider's identifier hasn't been written to any row yet, so the fallback also misses → INSERT → dup row |

Ariel and Rodrigo are the second case. Both alternated providers within minutes — the second provider had nothing to fall back to yet, so we created fresh rows. The merge-by-handle fix is necessary but not sufficient.

#### The structural fix: a populated roster

When a roster entry has both `github` and `email` (and `email_aliases` for known secondary emails), `matchesRoster()` resolves *both* providers' sessions to the **same** `RosterEntry`, which means `canonicalUserId` returns the **same** primary email for both providers. The id lookup hits on the first try, no fallback needed, no dup possible.

Today's roster has one entry. To prevent the next batch of dups we need to populate the roster for known users — at minimum the github handle plus all emails the user is likely to authenticate with. The 14 reconciled users from the audit are the obvious starting set; we have their verified emails and (for the 6 who logged in with GitHub) their handles.

#### Cleanup for existing dups

Two artifacts in `private/` (gitignored):

- `private/reconcile-users.sql` — atomic SQL transaction that performs the 4 merges (2 deletes for Ariel + 2 deletes + 2 updates for Rodrigo). Paste into Turso's web SQL console.
- `private/User-reconciled.csv` — same end-state as a CSV, for reference / re-import.

Neither table needs `ParticipationInterest` / `Vote` / `Proposal` repointing — none of those rows reference any of the dup-row ids in the current dataset.

### Issue 5 — No auth-event log; OAuth + DB failures are invisible

The reason this whole investigation was possible only by luck is that we have nothing logging:

- OAuth state-mismatch rejections
- token-exchange failures (`return new Response('GitHub token exchange failed (…)', …)`)
- `recordUserLogin`'s swallowed DB errors (`user-record.ts:115`)
- "user landed on `/people` and never came back"

Vercel function logs exist but are not retained long enough to support "we got a complaint last week — what happened?" investigations. A single `AuthEvent` table (`provider`, `outcome`, `subject`, `at`, `note`) writing on every callback path — success and failure — would have made every part of this analysis a 30-second DB query.

***

## Backlog (in order of pain-relief per unit of work)

| # | Fix | File(s) | Effort |
|---|---|---|---|
| 1 | Replace raw 400 on state-mismatch with a redirect to `/login?error=stale_link`, and have `/login.astro` show a friendly notice. | `src/pages/api/auth/{github,linkedin}/callback.ts`, `src/pages/login.astro` | XS |
| 2 | `/stack/me` should look up the `User` row by `github_handle` or `linkedin_sub` and route based on what's *linked*, not the current cookie's provider. LinkedIn-only users get a real settings surface. | `src/pages/stack/me.astro`, possibly a new `src/pages/me.astro` | S |
| 3 | Stop 404ing `/people/{handle}` for logged-in users. Either (a) convert the route to SSR with a fallback rendering for users who have a `User` row but no participants markdown file, or (b) make `/people/[handle]/stack/edit` not link to a profile that doesn't exist. | `src/pages/people/[handle].astro`, `src/pages/people/[handle]/stack/edit.astro` | M |
| 4a | (DONE) In `recordUserLogin`, before falling back to insert, also `SELECT WHERE github_handle = ? OR linkedin_sub = ?`. Catches repeat logins. | `src/lib/user-record.ts` | S |
| 4b | Populate `kauffman_roster.json` with `github` + `email` + `email_aliases` for known users so first-time alternating logins resolve to the same canonical id structurally (the only fix that prevents new dups). | `src/content/kauffman_roster.json` | S |
| 4c | (DONE) Reconcile existing dups for Ariel + Rodrigo — see `private/reconcile-users.sql`. | (one-off) | XS |
| 5 | Add an `AuthEvent` table + write to it from every callback branch (success, state-mismatch, token-exchange-fail, user-fetch-fail, recordUserLogin-error). | `db/config.ts`, `src/lib/auth-events.ts` (new), both callbacks, `user-record.ts` | S |

**Suggested first PR:** items 1 + 2 + 5 — the minimum to stop bleeding and get visibility into the next regression. Item 3 follows once the routing model is decided. Item 4 needs a reconciliation script so we don't break links to existing duplicate rows.

## Trigger to reopen

- Any new user complaint that smells like "I logged in and nothing happened."
- Any login completion rate drop visible in OpenPanel.
- Anyone working on a settings/profile surface for LinkedIn-only users.
- Any change to `/stack/me`, the OAuth callbacks, or `recordUserLogin`.

## Related

- `context-v/issue-resolutions/Troubleshooting-SSG-Authentication-and-Port-to-SSR-w-Database.md` — the predecessor to this one (April 28). Production-callback URL fix that got auth working in the first place.
- `db/config.ts` — `User` table comment block describes the one-row-per-person identity model.
- `src/lib/user-record.ts` — `recordUserLogin` and the canonical-id rules.
- `context-v/blueprints/Maintain-an-Interactive-Polling-System--v2.md` — the original spec that drove the SSR + DB move.
