---
title: Pre-create Turso User Rows from External Rosters and Fuzzy-Bind to Public Participant Profiles
lede: Build the Turso-side ingest + fuzzy-match layer that lets us pre-create User rows from external sources (Zoom exports, Luma RSVPs, conference registrations) with full email PII safely sequestered in the private database, then auto-bind those rows to OAuth sign-ins by email and offer high-confidence manual claims against public participants/*.md profiles. Closes the loop between 'we know they registered' and 'they have a face on the site.'
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
  - Identity-Model
  - Turso
  - User-Table
  - Pre-Creation
  - Zoom-Ingest
  - Fuzzy-Matching
  - OAuth-Binding
  - Participant-Profiles
  - Privacy-Boundary
  - Build-in-Public
  - Public-Private-Split
authors:
  - Michael Staton
date_created: 2026-05-21
date_modified: 2026-05-21
publish: false
from: fullstack-vc
from_path: tasks/Pre-create-and-Fuzzy-Bind-Users-from-External-Rosters.md
---
<!-- Rolled up from fullstack-vc/context-v/tasks/Pre-create-and-Fuzzy-Bind-Users-from-External-Rosters.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

# Pre-create Turso User Rows from External Rosters and Fuzzy-Bind to Public Participant Profiles

**Status:** Planned
**Site:** `sites/fullstack-vc`
**Sibling task:** [[Wire-Google-Workspace-OAuth-Provider]] — Google OAuth lowers the friction for the dominant pre-creation source (Workspace-registered Zoom attendees), making this task's payoff much larger.
**Predecessors:** [[Auth-Identity-System-Worked-but-UX-Failed-Silent-Bounces]]
**Related blueprints:** [[Maintain-an-Interactive-Polling-System--v2]] §3 (identity as hard dependency for vote integrity), §3.1 (user-profile upgrade — flat-file profiles as enrichment, DB as source of truth)

---

## 1. The privacy boundary, and why this task exists

This is a **build-in-public** repo. Anything in `src/content/participants/*.md` is on the public internet the moment it's committed. Today the participant markdown shape captures **handle, name, firm, role, kauffman_class, headshot, github, linkedin, directory_profile_kauffman, joined_dojo, stacks** — all things the person would happily show on a credibility card. It does not capture email, Zoom registration ID, or anything that came off a privately-shared roster.

That asymmetry is correct and we want to keep it. But it leaves us with a real workflow gap:

- We frequently receive Zoom registration exports, Luma RSVPs, and similar external rosters that contain emails for people we know are attending an upcoming Dojo session.
- Many of those people have an existing public profile in `participants/*.md` (we pre-curated it for presenters, advisors, or prior attendees). Many don't yet.
- When such a person finally signs in via OAuth, the system today has no way to recognize "this is the same person we knew about" — it just creates a fresh `User` row, and the public profile (if it exists) stays disconnected.

The fix splits along the privacy boundary the repo already enforces. PII lives in Turso. Public profiles stay in markdown. A single non-sensitive `handle` column on the `User` row bridges the two. External-roster ingest writes only to Turso. OAuth binds against Turso. Claim-against-public-profile is a separate, lower-confidence, human-confirmed action.

## 2. Current state

### What works today

- `User` table (Turso, `db/config.ts`) already has the right shape for multi-email PII:
  - `email: text` — primary
  - `emails: json` — `string[]` of every email we've ever seen across providers
  - `github_handle`, `linkedin_sub` — provider-specific stable IDs
  - `name`, `avatar`, `kauffman_class`, `firm`, `first_login_at`, `last_login_at`
- `lib/oauth-roster.ts` handles `email` + `email_aliases[]` matching against `kauffman_roster.json` for the Kauffman Fellows roster.
- `resolveCanonicalUserId` (commit `c8b9597`) makes vote attribution stable across providers.

### What's missing

1. **No `handle` column on `User`.** Today `User.id` is the lowercased roster email and is fine for vote attribution. There's no field that says *"this User corresponds to `participants/tobyrush.md`."*
2. **No ingest path for external rosters.** Zoom exports get processed by hand or by ad-hoc scripts (see `scripts/_reconcile-user-rows.mjs` for a reconciliation hint, but no first-class ingest).
3. **No email-based pre-binding in the OAuth callback.** A new sign-in always creates a fresh `User` row if no `github_handle` or `linkedin_sub` match exists, even if the session's email matches a pre-created `User.email` / `User.emails[]`.
4. **No fuzzy matcher.** When the email doesn't match anything pre-existing, we don't surface "We think you might be Toby Rush — claim this profile?" candidates against the public markdown set.
5. **No admin triage surface.** When the fuzzy match comes up empty or ambiguous, there's nowhere for a host to manually bind a User row to a participant handle.

## 3. Design

### 3.1 The bridge: `User.handle`

Add one column to `User`:

```ts
// db/config.ts
handle: column.text({ optional: true }),  // FK-by-convention to participants/<handle>.md
```

This is the **only** piece of information that traverses the private↔public boundary. It's already a public string (it's the URL slug for the participant page), so no privacy cost. Nullable because not every `User` will ever claim a public profile, and that's fine — voting and identity work without it.

### 3.2 The external-roster ingest path

A new directory `scripts/ingest/` with one script per source format:

- `ingest-zoom-csv.ts` — read a Zoom registration CSV, normalize to `{ name, email, firm?, registered_at }`, write/merge `User` rows.
- `ingest-luma-export.ts` — same shape, different source CSV layout.
- `ingest-rsvp-form.ts` — for whatever future form ingest we use.

Each script:

1. Parses the source file (header-aware; no positional column assumptions).
2. For each row, lowercases the email and checks if a `User` row exists with that email in `email` or `emails[]`.
3. If yes: merge — add the row's email to `emails[]` if missing, fill in `name` / `firm` if blank, append a `pre_creation_event` audit row (see §3.5).
4. If no: insert a new `User` row with `id: <lowercased-email>`, `email`, `emails: [email]`, `name`, `firm`, **no provider subs**, **no `handle`**, `last_provider: 'pre-created'` (sentinel for "not yet OAuth'd"), `first_login_at: null`, `created_at: now`.
5. Print a per-row summary: `created` / `merged` / `skipped-duplicate`.

Idempotent by design — safe to re-run on the same export file.

### 3.3 OAuth callback enhancement: email-based pre-bind

Today's flow (paraphrased):

```
session arrives → lookup User by github_handle OR linkedin_sub
  → if found, update last_login_at and return
  → if not found, INSERT new User
```

New flow:

```
session arrives → lookup User by github_handle OR linkedin_sub
  → if found: same as today
  → if not found AND session.email is present:
       lookup User by email = session.email
                  OR email in emails (JSON contains)
       → if found: this is a pre-created row. UPDATE it to attach the OAuth sub,
                   add session.email to emails[] (dedup), bump last_login_at.
                   Emit an AuthEvent { kind: 'pre_bind_email_match', from: 'pre-created' }.
       → if not found: INSERT new User as today.
```

This is the cheapest single change with the biggest payoff. A Zoom-imported user signs in once via *any* email-bearing provider (Google, LinkedIn) and the pre-creation immediately becomes a real, OAuth-linked identity — no duplicate row, no manual triage.

### 3.4 Fuzzy match service

New file `src/lib/participant-match.ts`:

```ts
export interface MatchCandidate {
  handle: string;       // points at participants/<handle>.md
  confidence: number;   // 0..1
  reasons: string[];    // ['github_handle_exact', 'name_jw_0.94', 'firm_match']
}

export async function findCandidates(user: User): Promise<MatchCandidate[]>;
```

Confidence tiers (auto-bind threshold is `>= 0.95`, suggestion threshold is `>= 0.70`):

| Signal | Weight | Notes |
|---|---|---|
| `user.github_handle === participant.github` | 0.50 | exact, lowercased |
| LinkedIn URL exact match | 0.45 | `user.linkedin_sub` resolved against `participant.linkedin` |
| Full name exact match (lowercased, trimmed, accents-normalized) | 0.35 | |
| Full name Jaro-Winkler ≥ 0.92 | 0.20 | typo / nickname tolerance |
| Same `kauffman_class` | 0.15 | required if name fuzzes — prevents random "Mike" matches |
| Firm name exact (lowercased) | 0.15 | |
| Email domain matches a known firm domain on the participant | 0.10 | |
| First-initial-last-name match in display name | 0.08 | catches "M. Staton" → Michael Staton |

These add (capped at 1.0). The `reasons[]` array is what gets shown to the user in the claim UI so they understand *why* the system thinks they might be that person.

Implementation note: load all `participants/*.md` frontmatter once per request via Astro Content Collections, build an in-memory index keyed by lowercased github + name + firm. The collection is small (<100 files) — full scan is fine.

### 3.5 Audit trail

A new table `UserBindingEvent` (or extend the existing `AuthEvent` if it already has the right shape — verify) records:

```ts
{
  user_id: string;
  kind: 'pre_created' | 'pre_bind_email_match' | 'fuzzy_claim_offered'
      | 'fuzzy_claim_accepted' | 'manual_bind' | 'unbind' | 'merge';
  evidence: json;   // { match_reasons: string[], confidence: number, source_file?: string }
  actor: string;    // 'system:zoom-ingest' | 'system:oauth-callback' | 'user:<id>' | 'host:<id>'
  at: date;
}
```

Without this, any incident ("why did Lylan get bound to Marcos's profile?") is unrecoverable.

### 3.6 `/me` page enhancement: the claim card

When `User.handle` is null AND `findCandidates(user)` returns at least one candidate with `confidence >= 0.70`:

Render a claim card above the existing /me content:

> **We may have a profile that's you.**
>
> [headshot] **Toby Rush** — Founder, Ideem · Class 23
> Why we think so: matching GitHub handle, name match, same Kauffman class.
>
> [ Claim this profile ]   [ That's not me ]
> [ Show me other matches ]

- "Claim this profile" → POST `/api/me/claim-participant` with `{ handle }` → server verifies the candidate is still in the user's `findCandidates` list (re-runs the match), writes `User.handle`, emits `fuzzy_claim_accepted` event, redirects to the now-bound profile.
- "That's not me" → POST `/api/me/reject-participant` with `{ handle }` → records a `UserBindingEvent { kind: 'fuzzy_claim_offered', evidence: { rejected: true, handle } }` so the same suggestion doesn't keep reappearing.
- "Show me other matches" → expand to show the candidate list ordered by confidence.

### 3.7 Admin triage at `/admin/unbound-users`

For hosts to manually bind when fuzzy fails. List view:

| User | Email | Provider | Top candidate (confidence) | Action |
|---|---|---|---|---|
| Marcos Polanco | m@... | github | marcospolanco (0.97 — github_handle) | [ Bind ] |
| (unknown name) | foo@workspace.com | google | — | [ Create participant ] |

Admin can: (a) accept the top candidate, (b) pick a different candidate from the dropdown, (c) create a new participant markdown stub (triggers a GitHub App commit, see existing `lib/github-commit.ts`), (d) leave unbound.

This view is **gated to host-role users only** — wire via an existing role check or a hardcoded allowlist of github_handles in v0.0.1.

## 4. Out of scope (parked)

- **Automatic public-profile creation from pre-created `User` rows.** Even with high confidence, we don't want to silently `git commit` a public file on someone's behalf. Profile creation stays a host-mediated action via the admin triage view.
- **Privacy-preserving zero-knowledge matching.** A fancier system could hash emails client-side and match by hash so the server never sees the email. Out of scope — we already have the email in Turso for legitimate reasons (vote integrity, comms).
- **Cross-session global identity.** A future "Lossless ID" could span fullstack-vc, mpstaton-site, and other Astro-Knots sites. Out of scope here; the `handle` field is per-site for now.
- **GDPR-shaped deletion / export endpoints.** Important and on the long-term roadmap. Not blocking this task.

## 5. Step-by-step implementation

1. **Schema:** add `handle: column.text({ optional: true })` to `User` in `db/config.ts`. `astro db push --remote`. (~5 min.)
2. **`UserBindingEvent` table:** add to `db/config.ts`. Push. (~10 min.)
3. **Ingest script:** `scripts/ingest/ingest-zoom-csv.ts`. Take CSV path + dry-run flag. Idempotent merge logic per §3.2. (~45 min including a real Zoom export end-to-end test.)
4. **OAuth callback enhancement:** modify `src/pages/api/auth/{github,linkedin,google}/callback.ts` (Google handler arrives via the sibling task). Add the email-based pre-bind lookup before falling through to "insert new User." Emit `pre_bind_email_match` events. (~30 min.)
5. **Fuzzy match service:** `src/lib/participant-match.ts` per §3.4. Unit tests for the weight math + Jaro-Winkler edges. (~1 hour.)
6. **Claim API routes:** `POST /api/me/claim-participant`, `POST /api/me/reject-participant`. (~30 min.)
7. **`/me` claim card UI:** Svelte island for the candidate carousel (handles "show other matches"). (~1 hour.)
8. **Admin triage view:** `src/pages/admin/unbound-users.astro` + host-role gate. (~1 hour.)
9. **Smoke test:** Run a real Zoom export through the ingest, sign in as one of the included emails via Google, confirm the pre-created row gets bound rather than duplicated, confirm the claim card surfaces the correct participant.

**Total cost estimate:** ~5 hours of focused work. The fuzzy-match weight math is the only piece that benefits from real data calibration — first cohort of bind/reject events will tell us whether the thresholds need tuning.

## 6. Verification

- **Ingest idempotency:** run the same Zoom CSV twice → second run reports all rows as `merged` or `skipped-duplicate`, no duplicate `User` rows.
- **Pre-bind on OAuth:** pre-create a row for `<some-email>`, sign in via Google with that email, confirm the OAuth sub binds to the existing row (not a new one).
- **Fuzzy-match thresholds:** manually construct ten edge cases (typo, nickname, same name different class, same firm different person) and assert each lands in the right bucket (auto-bind / suggest / no-match).
- **Claim flow:** unbound user with a high-confidence candidate sees the claim card; clicking claim sets `User.handle` and emits the audit event; refreshing /me no longer shows the card.
- **No-PII leak:** grep `src/content/participants/*.md` for `email`, `phone`, `zoom`, etc. and confirm nothing private got written to the public side as a side effect.

## 7. Open questions

- **Should pre-created `User.id` use the email, or a synthetic ID?** Today existing `User.id` is the lowercased roster email. For pre-created users with no roster match, we either reuse the email or mint a UUID. Reusing the email keeps the existing convention but couples row identity to a (potentially changeable) email; UUIDs decouple at the cost of breaking the "id = email" invariant. **Recommend: keep `id = lowercased primary email` for consistency.** If a user later changes their primary email, the `emails[]` array captures the historical one and lookup still works.
- **Where does `participant_match.ts` get its data — Astro Content Collections at request time, or a built index?** Content Collections feel right; small dataset. If it gets slow (>50ms per call), switch to a built-time `participants-index.json` regenerated on each deploy.
- **What's the policy when fuzzy match offers a candidate and the user clicks "That's not me" — do we ever re-offer that pair?** No, unless an admin manually re-opens. Adds an `excluded_handles: string[]` consideration to the matcher.
- **GitHub App commit on "create new participant from admin triage."** The infrastructure exists (`lib/github-commit.ts`); the policy question is what minimal frontmatter we write. Recommend: `handle`, `name`, `publish: false` as a draft so the host can fill in the rest before promoting. Stays out of the public site until publish flips.

## 8. References

- [[Wire-Google-Workspace-OAuth-Provider]] — sibling task; together they unlock the full "Zoom registers Workspace user → Google OAuth → pre-bind → claim public profile" loop.
- [[Auth-Identity-System-Worked-but-UX-Failed-Silent-Bounces]] — prior UX failure analysis; the claim card is exactly the kind of intentional post-login affordance that was missing.
- [[Maintain-an-Interactive-Polling-System--v2]] §3.1 — the "flat-file profiles as enrichment, DB as source of truth" framing this task operationalizes.
- `commit c8b9597` — the canonical-id resolver. The email-based pre-bind logic in §3.3 is a small extension of the patterns this commit established.
- `scripts/_reconcile-user-rows.mjs` — the existing ad-hoc reconciliation hint; useful as a sketch of the kinds of inconsistencies the ingest script will encounter on real data.
