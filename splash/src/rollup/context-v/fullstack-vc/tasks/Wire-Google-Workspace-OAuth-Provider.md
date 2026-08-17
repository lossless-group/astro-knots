---
title: Wire Google Workspace OAuth as a Third Identity Provider
lede: Env scaffolding for Google OAuth was added (uncommitted .env.example diff + real credentials in .env), but the code wiring was never written. This task implements the routes, session-payload union widening, header tooltip row, login button, and roster matching to bring Google to parity with the GitHub + LinkedIn providers — highest-leverage move before the May 27 All-Hands since most VC attendees convert better on Workspace than on either existing provider.
date_authored_initial_draft: 2026-05-21
date_authored_current_draft: 2026-05-21
date_authored_final_draft: null
date_first_published: null
date_last_updated: 2026-05-21
at_semantic_version: 0.0.0.1
status: Planned
augmented_with: Claude Code (Opus 4.7)
category: Task
tags:
  - Authentication
  - OAuth
  - Google-OAuth
  - Google-Workspace
  - Identity-Model
  - Provider-Parity
  - Session-Cookie
  - Roster-Matching
  - Header-Auth-Indicator
  - May-27-Prep
authors:
  - Michael Staton
date_created: 2026-05-21
date_modified: 2026-05-21
publish: true
from: fullstack-vc
from_path: tasks/Wire-Google-Workspace-OAuth-Provider.md
---
<!-- Rolled up from fullstack-vc/context-v/tasks/Wire-Google-Workspace-OAuth-Provider.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

# Wire Google Workspace OAuth as a Third Identity Provider

**Status:** Planned
**Site:** `sites/fullstack-vc`
**Deadline (soft):** before the 2026-05-27 Monthly All-Hands so VC attendees can log in with the provider they actually use day-to-day.
**Predecessors:** [[Auth-Identity-System-Worked-but-UX-Failed-Silent-Bounces]]
**Related blueprints:** [[Maintain-an-Interactive-Polling-System--v2]] §3 (OAuth identity as hard dependency for vote integrity)

---

## 1. Why this matters

The poll system at `/sessions/2026-05-27_monthly-all-hands` has three open polls and a server-side hard gate at `POST /api/polls/[id]/votes` (401 if no session). Today the only ways through that gate are GitHub OAuth and LinkedIn OAuth. We want **three peer providers** — sign in with any one, then a soft nudge toward connecting the others.

### Posture: accept any, nudge toward all three

A single sign-in (any provider) is enough to vote, edit a stack, RSVP, do anything authenticated. **No provider is privileged over another at the gate.** This avoids the friction trap of "I have to remember which account I used."

The encouragement to connect more comes *after* a successful first interaction — gentle, contextual, not gating. Header tooltip stays soft ("connect more, we love you more"). Mid-flow nudges (post-vote, post-stack-edit) become opportunities to add the next provider.

### Why all three — each yields valuable, different info

The strategic point is that the three providers don't overlap. They give us three different signals about the same person:

| Provider | What it tells us |
|---|---|
| **GitHub** | Building behavior — repos, languages, stars, commit cadence. Whether this VC is a builder vs. a watcher. Stable handle = portable identity across hacker tooling. Required for any stack-write flow that uses the GitHub App bot. |
| **LinkedIn** | Professional identity — firm, role, work history, network. The legible-to-LPs view of the person. Highest fidelity for cross-referencing roster + people pages. |
| **Google Workspace** | Domain affiliation (`hd` claim → which Workspace org they're in), verified org email, lowest-friction sign-in for fund operators who don't think of themselves as having "a developer account." Future: calendar/availability scopes for session RSVPs, drive scopes for shared dataroom integrations. |

Connecting all three turns a row in `User` from "one identity vector" into a triangulated person — useful for the Dojo's own intelligence (who's actually shipping AI workflows at their firm), useful for member-to-member discovery, and useful for the future Workspace-aware features that aren't on this task's hook but become trivial once the provider exists.

### Why the May 27 deadline

The April 29 launch session captured **zero participant votes** despite seven polls being prepped (`_inspect-turso.mjs` audit). The most likely root cause we can ship a fix for this week is provider friction — specifically, the friction that fund operators don't habitually sign in with GitHub. Adding Google gives that demographic a one-click path through the gate. Combined with the post-vote nudge (separate task), the conversion path becomes: see active poll → click Google → vote → get gentle "connect GitHub + LinkedIn for the full picture" follow-up.

## 2. Current state — half-done

Discovered 2026-05-21 by grepping `.env`/`.env.example` for `google`:

**✅ Done (env-side):**

- `.env.example` has an **uncommitted** modified hunk adding `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` with a comment block pointing at `console.cloud.google.com/apis/credentials` and authorized redirect URIs at `http://localhost:4321/api/auth/google/callback` and `https://fullstack.vc/api/auth/google/callback`.
- `.env` (gitignored) has real Workspace OAuth credentials populated. Google Cloud project is registered.

**❌ Not done (code-side):**

- No `src/pages/api/auth/google/` route directory.
- `SessionPayload.provider` in `src/lib/session.ts` is still typed as `'github' | 'linkedin'` only.
- `lib/oauth-roster.ts` has no Google branch.
- `lib/user-record.ts` `resolveCanonicalUserId` has no Google handling.
- `/api/me` doesn't include `google` in the `providers` object.
- `/login` page has only GitHub + LinkedIn buttons.
- Header tooltip ("If you connect both, we love you more!") has only two provider rows.

The shape mirrors what was done for LinkedIn in commit `db77206` — reasonable template to copy from since LinkedIn (like Google) is email-keyed rather than handle-keyed.

## 3. Step-by-step implementation

Each step is small enough that the next one can build on it without a major refactor. Numbered for sequencing, not estimates.

### Step 1 — Widen the session-payload provider union

`src/lib/session.ts` — change:

```ts
provider: 'github' | 'linkedin';
```

to:

```ts
provider: 'github' | 'linkedin' | 'google';
```

Audit every `if (session.provider === ...)` site in the codebase (`/me.astro`, `/api/me.ts`, `oauth-roster.ts`, `user-record.ts`, callbacks) and confirm fallthrough behavior is sane when provider is `'google'`. The TypeScript compiler will surface every site that needs updating.

### Step 2 — `src/pages/api/auth/google/login.ts`

Mirror `src/pages/api/auth/github/login.ts`. Differences:

- State cookie name: `fsvc_oauth_state_google`.
- Authorize URL: `https://accounts.google.com/o/oauth2/v2/auth`.
- Scopes: `openid email profile` (Workspace returns the `hd` claim for org-domain).
- Optional: `prompt=select_account` so users on shared machines don't get auto-signed-in to a wrong identity.
- **Decide:** restrict to Workspace domains only (`hd=*` parameter + verify `hd` claim on callback), or accept personal gmail too. Personal-gmail-permissive is the right default for v0.0.1 — Dojo members may register from personal accounts.

### Step 3 — `src/pages/api/auth/google/callback.ts`

Mirror `src/pages/api/auth/linkedin/callback.ts` (closer template than GitHub since it's also email-keyed):

1. Validate state cookie vs. query param (CSRF guard).
2. Token exchange at `https://oauth2.googleapis.com/token`.
3. Fetch userinfo from `https://openidconnect.googleapis.com/v1/userinfo` (or decode the ID token directly — userinfo is simpler).
4. Resolve canonical user: prefer matching an existing `User` row by `email` (since Google emails are verified) or by the `sub` claim if a Google-linked row already exists.
5. Upsert the `User` row — add a `google_sub` column to the `User` table to store the Google `sub` claim as the stable provider key. (Astro DB schema migration.)
6. Mint the session JWT with `provider: 'google'`, `subject: <google sub>`, `email`, `name`, `avatar`.
7. Emit `AuthEvent` row (matching what github/linkedin do for the observability layer per [[Auth-Identity-System-Worked-but-UX-Failed-Silent-Bounces]] resolution).
8. Redirect to `/me`.

### Step 4 — Astro DB schema: add `User.google_sub`

`db/config.ts` — add a nullable column to the `User` table:

```ts
google_sub: column.text({ optional: true, unique: true }),
```

Push to local + Turso: `astro db push --remote`.

This makes Google a peer of `github_handle` and `linkedin_sub` as a provider-stable identifier on the User row.

### Step 5 — `oauth-roster.ts` — add Google branch

In `matchesRoster`, add a third branch:

```ts
} else if (session.provider === 'google' && session.email) {
  const email = session.email.toLowerCase();
  const byEmail = ROSTER.find(r => emailsForEntry(r).includes(email));
  if (byEmail) return byEmail;
}
```

Same fall-through synthesized-entry behavior as the other two providers — Google sign-in is not gated by roster membership, just enriched by it.

### Step 6 — `/api/me.ts` — report Google in the providers object

Change:

```ts
let providers = { github: false, linkedin: false };
```

to:

```ts
let providers = { github: false, linkedin: false, google: false };
```

And add the lookup branch + `providers.google = !!row.google_sub` assignment. Adjust `linkedCount` and `allLinked` logic (it currently expects 2; with three providers `allLinked` may want to become `>= 2` rather than `=== 3`, depending on whether "linked all three" is the goal or "linked at least two").

### Step 7 — `/login` page — add Google button

`src/pages/login.astro` — add a third `<a class="login-btn login-btn--google" href="/api/auth/google/login">` row above the GitHub button. Google's brand asks for a specific multi-color "G" mark when used in product UX — fetch the official SVG from Google's identity branding guidelines rather than improvising.

### Step 8 — Header tooltip — add a third provider row

`src/components/basics/Header.astro` — duplicate the GitHub + LinkedIn `<a class="site-header__login-tooltip-provider">` blocks for Google, with the Google "G" SVG and `data-auth-provider="google"`. The client-side script already iterates over `data.providers` keys generically, so once `/api/me` returns `providers.google`, the tooltip updates without further script changes.

### Step 9 — Commit the `.env.example` diff alongside the code

The uncommitted `.env.example` hunk gets bundled into the same commit so other developers (and Vercel env-checks) see the new variables documented.

### Step 10 — Vercel production env

Add `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` to the production deployment's environment in the Vercel UI. **Manual step — not in this codebase.**

## 4. Out of scope (parked for later)

- **Workspace-domain allowlist (`hd` enforcement).** Could be a future feature where the host configures which Workspace domains are accepted for a given Session. For v0.0.1, accept any verified Google email.
- **Google Drive / Calendar scopes.** This task is identity-only. Any future integration (e.g., "let Claude Team read the Dojo's shared drive") is a separate scope-expansion story.
- **Automatic provider linking across emails.** If a user signs in with GitHub and the GitHub-verified email matches their later Google sign-in email, they should resolve to the same `User` row. The `resolveCanonicalUserId` logic from commit `c8b9597` already handles this pattern for GitHub ↔ LinkedIn; just verify Google falls through the same code path.

## 5. Verification

Before announcing the May 27 session link:

1. **Local round-trip.** In a fresh incognito window: hit `/login` → click "Continue with Google" → land back on `/me` with the green-dot indicator and avatar. Confirm `/api/me` returns `providers.google: true`.
2. **Cross-provider linking.** Sign out, sign in with GitHub using the same email as the Google account → confirm the User row links both, header shows fully-linked state.
3. **Vote round-trip.** Hit `/sessions/2026-05-27_monthly-all-hands`, vote on a poll, confirm the row lands in Turso under the canonical user_id.
4. **Production smoke.** Same flow at `https://fullstack.vc` using a real Workspace account (a friend's, ideally).

## 6. Estimated cost

~1–2 hours for the wiring proper. The bulk of the time is verification and the Astro DB schema push (which requires deploy choreography if any other schema changes are queued). The pattern is mature — LinkedIn was added in a single commit (`db77206`).

## 7. Open questions

- **Header indicator states with three providers.** Current tri-state model is `out` / `partial` / `in` where `in = 2/2 linked`. With three providers the cleanest extension is a four-state model: `out` (0/3) / `partial-1` (1/3) / `partial-2` (2/3) / `in` (3/3). Visually that's overkill — humans struggle to distinguish two yellow shades. Recommend: keep three states, where `in` means `3/3` (the green dot represents "fully triangulated"), `partial` covers both `1/3` and `2/3` (yellow with a count like "2/3 connected" in the tooltip), and `out` is `0/3`. Reaching green requires real effort and signals genuine engagement.
- **Tooltip copy for the soft nudge.** "If you connect both, we love you more!" is two-provider-flavored. Per the "each provider tells us something different" framing, the new copy should hint at *why* a user might connect more — not just "more is better" but "more is more useful to you and to us." Draft: "We get different signal from each — connect more for richer Dojo discovery." Iterate after the first cohort of three-provider users lands.
- **Post-action nudges (separate task).** The header tooltip is the passive channel. The active channel is contextual nudges *after* a successful first action — vote, stack edit, RSVP — when the user is engaged and a "while you're here, connect the other two" prompt has its highest conversion. This is a sibling task, not in scope here.
- **What scopes do we ask for from each provider to harvest the differentiated info?** Current GitHub scopes are `read:user user:email`, LinkedIn is OIDC-default. For the value-differentiation framing to be real, we should audit whether the data we actually want (firm, role, repo activity, Workspace domain) is being requested and stored. Likely a follow-up task once Google is live, since changing scopes after-the-fact requires user re-consent.
- **Email-as-canonical-key when Google's `email_verified: false`.** Unusual but possible. The callback should refuse to mint a session if Google returns `email_verified: false` — same defensive posture as the existing providers.

## 8. References

- [[Pre-create-and-Fuzzy-Bind-Users-from-External-Rosters]] — sibling task; Google OAuth dramatically increases the payoff of the pre-creation layer (most Zoom-registered Dojo attendees use Workspace emails), and the pre-bind logic there hooks into the callback this task wires up.
- [[Auth-Identity-System-Worked-but-UX-Failed-Silent-Bounces]] — the prior UX-failure analysis; helpful for the post-login routing decisions in this task.
- [[Maintain-an-Interactive-Polling-System--v2]] §3 — OAuth identity is a hard dependency for the vote-integrity contract.
- `commit db77206` — the LinkedIn provider was added in a single commit; closest reference for shape and surface area.
- `commit c8b9597` — the canonical-id resolver; ensure Google falls through this code path so cross-provider linking works.
