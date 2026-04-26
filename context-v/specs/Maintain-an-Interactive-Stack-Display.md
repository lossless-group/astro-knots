---
title: "Maintain an Interactive `Stack` Display"
lede: "Professionals have a stack of tools and technologies they use to get their work done. This display should show the tools and technologies in a way that is easy to browse and understand, helping others learn about the tools and technologies used in the industry — built on markdown + JSON, no database, in the spirit of AI-friendliness."
date_authored_initial_draft: 2025-04-26
date_authored_current_draft: 2026-04-26
date_authored_final_draft: null
date_first_published: null
date_last_updated: 2026-04-26
at_semantic_version: 0.0.2.0
publish: false
status: Proposed
augmented_with: "Claude Code with Opus 4.7"
category: Information-Design
date_created: 2025-04-26
date_modified: 2026-04-26
authors:
  - Michael Staton
image_prompt: "A team of young professionals is crossing a stream by jumping from stack to stack. Each stack is topped with a laptop, and below is a pile of logos like Notion, VS Code, GitHub, Python, Marimo, Airtable, Excel, etc."
slug: maintain-an-interactive-stack-display
tags:
  - Information-Design
  - Technology-Stacks
  - App-Adoption
  - Interactive-Application
  - Stack-Tracking
  - GitHub-OAuth
  - Markdown-as-Database
  - JSON-as-Database
  - Kauffman-Fellows
  - Agentic-VC-Dojo
  - FullStack-VC
---

# Context

## Overview

A community-driven, OAuth-gated interactive application on the FullStack VC site that lets Agentic VC Dojo participants track their current stack, capture aspirational tools, and surface aggregate "what's everyone using" views. This is the first interactive application on the site and the first time we'll need a write path — it sets the precedent for how all future participant-driven data flows.

## Inspiration

- https://www.lossless.group/toolkit — our own internal tool listing pattern
- The general "what's in your bag" / "uses page" genre that's been a fixture of dev/maker blogs for years (e.g., [uses.this](https://usesthis.com/), but **community-aggregated** in daation to one-person-per-component (or page).

## Context on the Astro-Knots pseudo-monorepo

We develop and maintain multiple sites for multiple clients. Each site needs to be independently deployed with no dependencies on the Astro-Knots pseudo-monorepo. However, we have developed patterns and boilerplate code that the FullStack VC site adopts wholesale. See [`sites/fullstack-vc/README.md`](https://github.com/lossless-group/fullstack-vc/README.md) for the conventions already in place: three-mode toggle, two-tier CSS tokens, Brand Kit + Design System reference pages, content collections, AI-generated changelog banners.

## Preferred Stack

1. [[Tooling/Software Development/Frameworks/Web Frameworks/Astro|Astro]] for [[Vocabulary/Static Site Generators|Static Site Generation]] — most pages stay static; **server endpoints only where genuinely needed** (the write path).
2. [[Tooling/Software Development/Frameworks/Web Frameworks/Svelte|Svelte]] for the dynamic UI islands — the interactive stack-builder grid, autocomplete, drag-to-reorder, instant filter.
3. [[Tooling/Software Development/Lego-Kit Engineering Tools/ImageKit|ImageKit]] for tool logos — many brand marks live there already from sibling sites.
4. [[Tooling/Software Development/Frameworks/Frontend/UI Frameworks/Tailwind|Tailwind]] v4+ with the FullStack VC brand tokens. All component CSS reads from semantic tokens; **no hardcoded hex anywhere** per the [[context-v/blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind|two-tier token convention]]. 
    > [!NOTE] 
    > We sometimes develop using hardcoded tokens in a new layout or component but only for expendiency of getting to something worth shipping. Once we know it will go live, we refactor to use the semantic tokens, and update the semantic and named tokens if needed.
5. **Markdown + JSON in the repository over any database use.** Reasons in "The 'AI Handles Markdown' Thesis" below.
6. Avoidance of anything React or React patterns. HTML, CSS, Astro, and Svelte only.

## Audience & Scale

- **~60 active participants** in any given monthly Agentic VC Dojo webinar.
- **Up to 200 realistic active users** across the year (people who actually log in and submit data).
- **~800 possible participants** drawn from the [[Kauffman Fellows]] network roster.
- **~1500 tools** at the upper bound of the tools registry — covering AI, agents, data, observability, productivity, communication, design, finance, and "operator" tooling.

This is **community-scale, not consumer-scale**. The data set fits comfortably in markdown files. There is no concurrency story to engineer for. Latency expectations are "feels instant," not "globally distributed."

## The "AI Handles Markdown and JSON" Thesis

The Lossless Group's consulting practice helps firms get savvy with AI. Our core belief — and the operating thesis for this application — is that **AI assistants work best with markdown and JSON**. They reason fluently about both, edit them surgically, validate against schemas, and produce well-formed output reliably. Not to mention, Token costs are reduced when working in straight text.

By contrast, AI assistants struggle with custom tools and SaaS platforms unless those platforms ship dedicated AI integrations (most don't, or do incompletely). Putting community data into Airtable / Notion / a custom database means:

- Participants can't easily ask Claude/ChatGPT to summarize "what's the most-adopted chart generation tool among 2018 Fellows?"
- Maintainers can't easily ask an AI to lint, deduplicate, or migrate the data
- Building tooling on top requires API keys, rate limits, sync logic, and a perpetual maintenance tax

Markdown and JSON files in a git repository solve all of those problems. They're trivially queryable by any AI, version-controlled by default, exportable in every direction, and require zero ongoing platform maintenance. The cost is having to engineer the **write path** ourselves (covered below) — but this is a tractable engineering problem at our scale, not a product problem.

## Responsive Design

Most participants will check this on mobile during or after a webinar. Power users (analysts, internal community ops at Kauffman, hosts curating the tools registry) will dive deep on desktop. Mobile-first, but the desktop experience must justify the dive — filters, large heatmaps, side-by-side comparisons.

---

# Current Task & Prompt

Author the v0.1 of the Interactive Stack Display. Focus this draft on the data model, the read path, the auth boundary, and the **shape** of the write path. Implementation details for the write path may move into a follow-up spec once the data model is settled.

Companion docs:

- [[context-v/blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind]] — color/typography conventions
- [[context-v/blueprints/Maintain-Design-System-and-Brandkit-Motions]] — every component lands in `/design-system` in the same change
- [[context-v/specs/Dynamic-Webpage-to-Display-Portfolio-w-Authentication]] — the precedent for OAuth-gated views on a portfolio page; we're echoing its phasing pattern

---

# Requirements

- [ ] Interactive Svelte island integrated into the Astro site at `/stack/me` (authed) and `/stack` (public).
- [ ] Login with **GitHub OAuth**. (We may need alternates, with LinkedIn being the most desirable.)
- [ ] Displays photo, handle, and name (all available from the GitHub OAuth profile).
    - [ ] May need to capture name and email separately if the GitHub profile leaves them blank.
- [ ] Build a tool/stack tracker while avoiding unnecessary technical complexity and vendor lock-in.
- [ ] Exploration of data-store options with simplicity in mind, **preferred in just markdown files with YAML frontmatter**.

## User Experience

- [ ] Users can browse the tools and technologies **by Person** as the primary mode — look up `Michael Staton` and see the tools used, plus tools used by other professionals.
- [ ] Users can filter by tags, including multi-tag selectors.
- [ ] Users can see the tools and technologies in a way that is easy to browse and understand.
- [ ] Defaults to autocomplete from the current "stack" options to preserve data integrity and improve input speed.
    - [ ] Accepts both raw text ("Airtable", case-insensitive) and URL formats ("https://airtable.com", any URL form for the same tool) for consistency. Both resolve to the same canonical tool slug at submit time.

***

# Imagined Features / Approach

## Data Model

Three small content collections in `sites/fullstack-vc/src/data/`. One file per entity for AI-friendly diffs and surgical edits.

### `tools` — the canonical registry

`src/content/tools/{slug}.md` — one file per tool. Markdown body for narrative, frontmatter for structured fields. ~1500 entries at the upper bound; per-file files keep AI editing surgical.

```yaml
---
slug: claude-code
conventional_name: "Claude Code"
official_name: "Claude Code"
product_of: "Anthropic"
category: AI-Coding-Assistant
subcategories: [CLI-Tools, Agentic-IDE]
official_url: https://claude.com/code
logo_light: https://ik.imagekit.io/.../logos/claude-code--light.svg
logo_dark:  https://ik.imagekit.io/.../logos/claude-code--dark.svg
oss: false
pricing: subscription
description_short: "Anthropic's CLI-native AI coding agent."
url_aliases:
  - https://www.claude.com/code
  - https://claude.ai/code
tags: [Anthropic, CLI, Agent]
---

Optional longer narrative, citations, history, etc.
```

The `url_aliases` array is what powers the "URL or text both work" requirement — submitting any of the listed URLs or the slug or the conventional name resolves to this entry.

### `participants` — community member profiles

`src/content/participants/{handle}.md` — handle is the GitHub username (always available, always unique on GitHub, stable).

```yaml
---
handle: mpstaton
name: "Michael Staton"
firm: "Lossless Group"
role: "Founder"
kauffman_class: 2018
github: https://github.com/mpstaton
github_avatar: https://avatars.githubusercontent.com/u/...
linkedin: https://www.linkedin.com/in/...
public_profile: true              # if true, /stack/[handle] is publicly visible
joined_dojo: 2026-05-15
current_stack:
  - { tool: claude-code,  added: 2026-04-01, notes: "Daily driver." }
  - { tool: cursor,       added: 2025-09-15 }
  - { tool: linear,       added: 2024-01-01 }
aspirational_stack:
  - { tool: factory-ai,   intent: "Want to evaluate for diligence workflows." }
  - { tool: devin,        intent: "Curious." }
abandoned_stack:
  - { tool: copilot, abandoned: 2025-12-01, reason: "Switched to Claude Code." }
---

Optional bio, working notes, public-facing description of how this person uses their stack.
```

### `kauffman_roster` — the allowlist

`src/content/kauffman_roster.json` — flat array of authorized identities for OAuth. **Private** (in repo, but never rendered as a page). Used by the OAuth callback to verify whether a logged-in GitHub user maps to a Kauffman Fellow.

```json
[
  { "github": "mpstaton",        "kauffman_class": 2018, "name": "Michael Staton", "email_domain": "lossless.group" },
  { "github": "another-handle",  "kauffman_class": 2019, "name": "..." }
]
```

The match is by GitHub handle (preferred) or by email domain as a fallback.

### Why one file per participant / tool

- AI assistants edit a single file at a time without merge headaches
- Diffs in PRs show exactly what changed about that participant's stack
- A participant deleting their data is `rm` of one file
- Per-file frontmatter is more legible than monolithic JSON for humans

---

## Authentication Model

OAuth-gated, **hand-rolled** — no Auth0, Clerk, or Supabase Auth. No password management of our own.

### Why Hand-Rolled, Not Auth0 / Clerk

Auth0, Clerk, Supabase Auth, and similar identity-as-a-service products are correct choices when you need: many providers, password reset flows, MFA, SSO/SAML, multi-tenant isolation, identity-as-billing-key, or audit logging at compliance scale. **None of those apply to us.** The community is ~200 users, the providers we want are at most two (GitHub, eventually LinkedIn), and the allowlist is a JSON file.

What we need to write ourselves to replace those services:

| Concern | Hand-rolled solution | Lines of code |
|---|---|---|
| OAuth handshake | One Astro server endpoint per provider | ~30 LOC × providers |
| Token exchange | Single `fetch` call to provider's token endpoint | ~10 LOC |
| Session storage | Signed JWT in HttpOnly cookie (no server-side session store) | ~20 LOC, uses `jose` |
| Allowlist check | Array filter against the roster JSON | ~5 LOC |
| Logout | Clear the cookie | ~5 LOC |

Total for GitHub-only Phase 1: ~100 LOC across three endpoint files plus one helper. For two providers: ~160 LOC.

By contrast, Auth0's free tier maxes at 7,500 users and the first paid tier is $35/month at the time of writing. Clerk is comparable. The dollar cost is small but the **architectural cost is real**: those services become a hard dependency, and the code that uses them is full of vendor-specific abstractions that future AI assistants and contributors have to learn instead of reading plain HTTP and JWT logic.

The hand-rolled approach also aligns with the firm thesis: **AI assistants read plain TypeScript fluently**. They struggle with vendor SDKs that are coded against proprietary types and runtime behavior.

### Provider Strategy

| Provider | Phase | Rationale |
|---|---|---|
| **GitHub** | v0.2 (Phase 1) | Most Kauffman Fellows in tech VC have GitHub accounts already. Free, no privacy policy required, instant approval. |
| **LinkedIn** | v0.3 (Phase 2) | Lower-common-denominator identity for the broader Kauffman network including non-engineering partners. Requires published privacy policy and slower app review. |
| **Microsoft / Google** | deferred | Mostly redundant with the above. Add only if multiple Fellows ask. |

**Recommendation:** ship GitHub-only for v0.2 to validate the entire write path, then add LinkedIn for v0.3 alongside the survey hookup.

### Phase 1: GitHub OAuth

- Login via the **"Login with GitHub"** button (single provider for v0.2, fits the technical-VC audience).
- After OAuth callback, the GitHub handle is matched against `kauffman_roster.json`:
  - Match → session cookie set; user is now authed and can edit `/stack/me` (which loads `participants/{their-handle}.md`).
  - No match → friendly "you don't seem to be in the Kauffman roster — drop us a line if this is wrong" page.
- Session: signed JWT in an HttpOnly cookie. No server-side session store.
- The participant's profile is created **on first successful login** if they have a roster match — pre-populated with their GitHub avatar, name, and `kauffman_class` from the roster.

#### OAuth App vs GitHub App (don't confuse these)

| | OAuth App | GitHub App |
|---|---|---|
| Used for | "Log in with GitHub" — user identity flow | Bot integrations that act on a repo |
| What we use it for | Phase 1 participant login | The bot that opens PRs on submit (write path; separate concern) |
| Where to create | github.com/organizations/lossless-group/settings/applications | github.com/organizations/lossless-group/settings/apps |
| Setup time | ~5 minutes | ~10 minutes |

For Phase 1 user login, we only need the **OAuth App**. The GitHub App is a separate artifact for the write-path bot, registered later.

#### Setting Up the GitHub OAuth App (~5 minutes, do once)

Create on the **`lossless-group` org**, not a personal account, so it survives team changes.

1. Go to **https://github.com/organizations/lossless-group/settings/applications** → "New OAuth App"
2. Fill in:
   - **Application name:** `FullStack VC`
   - **Homepage URL:** `https://fullstack-vc.com`
   - **Authorization callback URL:** `https://fullstack-vc.com/api/auth/github/callback`
   - Description (optional): "OAuth for the Agentic VC Dojo participant stack tracker."
3. GitHub returns:
   - **Client ID** (public — fine to commit if desired)
   - **Client Secret** (one-time view, store in 1Password)

**Local dev note:** GitHub OAuth Apps allow multiple callback URLs. Add `http://localhost:4321/api/auth/github/callback` alongside production so testing doesn't require a tunnel.

#### GitHub OAuth Flow

```
User clicks "Log in with GitHub"
   ↓
GET /api/auth/github/login   ← redirects to github.com/login/oauth/authorize?...
   ↓
GitHub asks user to approve scopes (read:user user:email)
   ↓
GitHub redirects to /api/auth/github/callback?code=XXX
   ↓
Server exchanges code for access_token (POST github.com/login/oauth/access_token)
Server fetches https://api.github.com/user (gets handle, name, avatar, email)
Server checks handle against kauffman_roster.json
   ↓ (match)                         ↓ (no match)
Server sets HttpOnly JWT cookie      Server renders friendly bounce page
Server redirects to /stack/me
```

**Scopes:** `read:user user:email`. Identity only — no repo access from the user. The bot token (separate artifact) handles repo writes.

#### Code Structure (Phase 1, GitHub only)

Three Astro server endpoints plus one helper, ~100 LOC total:

```
sites/fullstack-vc/src/pages/api/auth/
├── github/
│   ├── login.ts        ← redirects to GitHub authorize URL
│   └── callback.ts     ← code exchange + roster check + session cookie
└── logout.ts           ← clears the cookie

sites/fullstack-vc/src/lib/
└── session.ts          ← jose-based JWT sign/verify helper
```

**Library choice:** use **`jose`** (~30 KB, MIT, zero deps) for JWT signing and verification. Don't reinvent crypto. Skip `auth-astro` / `lucia-auth` for Phase 1 — they bring abstraction we don't need at one provider.

#### Tasks

  1. Create the OAuth App on the `lossless-group` org per the steps above
  2. Save Client ID + Client Secret somewhere safe (1Password)
  3. Drop them into `sites/fullstack-vc/.env` (gitignored):

  ```
  GITHUB_OAUTH_CLIENT_ID=Ov23li...
  GITHUB_OAUTH_CLIENT_SECRET=...
  JWT_SIGNING_SECRET=  # run `openssl rand -base64 32` and paste the output
  ```

  4. Implement the three endpoints + the session helper
  5. Test the login flow end-to-end (login → roster match → /stack/me → logout)

### Phase 2: LinkedIn OAuth (v0.3)

LinkedIn is structurally identical to GitHub — same hand-rolled approach, OIDC instead of GitHub's custom OAuth response shape. Two real differences: a published privacy policy is a hard prerequisite, and LinkedIn's dev portal bureaucracy is heavier.

#### Prerequisite: Published Privacy Policy

LinkedIn won't approve the app without a `/privacy` URL that loads. GitHub doesn't ask for this; LinkedIn does. **This is a v0.3 blocker.**

What the page must cover (minimum): what data the site collects (name, email, profile photo, GitHub/LinkedIn handle, the stack data the participant submits), how it's used (membership-only display in the dojo community), retention (kept until participant deletes their profile), contact email for data requests.

For our scale this is a 1-page markdown file at `src/pages/privacy.astro` — not a 12-page legalese epic. Tally and similar tools have community-friendly templates worth borrowing structure from. Worth shipping anyway before collecting user data, so good time to write it.

#### Setting Up the LinkedIn App (~10–15 minutes, do once)

1. Go to **https://www.linkedin.com/developers/apps** → "Create app"
2. Fill in:
   - **App name:** `FullStack VC`
   - **LinkedIn Page:** must associate with a Company Page. Use the Lossless Group page if it exists; otherwise associate with any page you admin and re-associate later.
   - **App logo:** required, 100×100+ pixels
   - **Privacy policy URL:** required, validated. Must point to a real page.
   - Terms of use URL: usually required for production
3. **Auth tab:**
   - Add Authorized Redirect URLs:
     - `http://localhost:4321/api/auth/linkedin/callback` (dev)
     - `https://fullstack-vc.com/api/auth/linkedin/callback` (prod)
   - Copy the **Client ID** (public) and **Client Secret** (one-time view)
4. **Products tab:**
   - Request **"Sign In with LinkedIn using OpenID Connect"** — usually instant approval
   - Don't request anything else. Other products (Marketing API, Talent Solutions, Share on LinkedIn) require partner-program approval, take days/weeks, and we don't need them for identity verification.

#### LinkedIn OIDC Endpoints

| Purpose | URL |
|---|---|
| Authorize | `https://www.linkedin.com/oauth/v2/authorization` |
| Token exchange | `https://www.linkedin.com/oauth/v2/accessToken` |
| Userinfo (OIDC) | `https://api.linkedin.com/v2/userinfo` |

**Scopes:** `openid profile email`.

The OIDC userinfo response gives back: `sub` (LinkedIn user ID), `name`, `given_name`, `family_name`, `picture`, `email`, `email_verified`, `locale`. **No employer or current-position fields** — those require additional LinkedIn products with approval. For our case (matching against the Kauffman roster), email + name are enough.

#### Multi-Provider Session Payload

The session JWT carries the provider name plus the provider-specific subject:

```ts
interface SessionPayload {
  provider: 'github' | 'linkedin';
  subject: string;        // GitHub handle OR LinkedIn `sub`
  email?: string;
  name?: string;
  iat: number;
  exp: number;
}
```

#### Provider-Aware Allowlist Match

```ts
function matchesRoster(session: SessionPayload, roster: RosterEntry[]): RosterEntry | null {
  if (session.provider === 'github') {
    return roster.find(r => r.github === session.subject) ?? null;
  }
  if (session.provider === 'linkedin' && session.email) {
    return roster.find(r => r.email?.toLowerCase() === session.email!.toLowerCase()) ?? null;
  }
  return null;
}
```

The roster JSON gains optional fields to support multi-provider matching:

```json
[
  {
    "github": "mpstaton",
    "email": "michael@lossless.group",
    "email_aliases": ["mp@lossless.group", "mpstaton@gmail.com"],
    "kauffman_class": 2018,
    "name": "Michael Staton"
  }
]
```

The `email_aliases` array supports the common case where a Fellow's primary LinkedIn email differs from the address Kauffman has on file.

#### LinkedIn-Specific Gotchas

1. **Rate limits are stricter than GitHub's.** Daily token limits per app. Won't bite us at 200 users; will bite us if we ever leave the OAuth callback in a redirect loop.
2. **HTTPS required in production for redirect URIs.** Localhost is fine; anything else has to be `https://`.
3. **Two products, similar names.** "Sign In with LinkedIn" (legacy, OAuth 2.0 with custom userinfo) vs "Sign In with LinkedIn using OpenID Connect" (newer, standards-based). **Use the OpenID Connect one** — standards-compliant, simpler, what `jose` and most libraries expect.
4. **App ↔ Company Page association is sticky.** Hard to change later. Use the right Company Page from the start.
5. **Multiple-emails edge case.** A LinkedIn user can have several verified emails. The `email` returned in the userinfo response is the user's primary. If the roster entry uses a different email of theirs, they fail the allowlist check unless we support `email_aliases` (above).

#### LinkedIn Tasks (when ready for v0.3)

1. Confirm the Lossless Group LinkedIn Company Page exists (create if not)
2. Write and ship `src/pages/privacy.astro`
3. Register the LinkedIn App per the steps above
4. Request the "Sign In with LinkedIn using OpenID Connect" product
5. Save Client ID + Client Secret to `.env`:

  ```
  LINKEDIN_OAUTH_CLIENT_ID=...
  LINKEDIN_OAUTH_CLIENT_SECRET=...
  ```

6. Implement parallel `/api/auth/linkedin/{login,callback}.ts` endpoints
7. Update `matchesRoster()` to handle the LinkedIn provider branch
8. Test end-to-end alongside the GitHub flow

### Phase 3: Federated identity for non-Fellows (deferred)

Some webinar attendees may not be Fellows but are invited guests. Add a separate "guest" allowlist or use a magic-link email flow gated by a Lossless-Group-issued invite. Out of scope for v0.1.

### Bot Token (Write Path, Phase 1 of write path)

Separate from user OAuth — the GitHub App that opens PRs on the user's behalf. Detailed in the **Write Path** section below; flagged here only to disambiguate from the OAuth App.

---

## Read Path (Display)

All read paths are **static** at build time. Content collections feed Astro pages.

### Routes

| Route | Audience | Static? | Purpose |
|---|---|---|---|
| `/stack` | public | yes | Aggregate "what's everyone using" — heatmap + leaderboards |
| `/stack/people/[handle]` | public if `public_profile: true` | yes | Per-participant view — current/aspirational/abandoned stacks |
| `/stack/people` | public | yes | Index of public participant profiles |
| `/stack/tools/[slug]` | public | yes | Per-tool detail page — who's using it, who wants it |
| `/stack/tools` | public | yes | Tools registry (logo cloud + filters) |
| `/stack/me` | authed only | server | Edit own profile (interactive) |
| `/stack/cohorts/kauffman-[year]` | public, gated cells | yes | Cohort views — your class's collective stack |

### Levels of Detail (mirror the portfolio spec's pattern)

- **Level 1 — Logo cloud** of all tools, sized by adoption count. Click → tool detail.
- **Level 2 — Card grid:** logo + name + adoption count + sample participants. Filter by category. Click → tool detail.
- **Level 3 — Tool detail:** description, current users list (links to public profiles), aspirational users count, "first added" timeline, related tools.
- **Level 4 — Participant profile:** their stacks across the three tiers (current/aspirational/abandoned), with hover-state context for each tool.
- **Level 5 — Personal stack builder (`/stack/me`, authed):** the only interactive Svelte island; drag-to-add, search, mark current vs aspirational vs abandoned, add notes. Autocomplete drives off the live `tools/` collection.

### Aggregate Views

- **Heatmap:** rows = categories, columns = tools, cell intensity = adoption count
- **Leaderboards:** "Most-adopted in last 30 days," "Most-aspirational," "Biggest jumpers" (largest deltas)
- **Sparklines (Phase 2):** time-series of adoption per tool, simple SVG paths from frontmatter `added:` dates

### Sensitive-Field Strategy (inheriting from the portfolio spec)

Some fields (`notes` on a stack entry, `firm`, `role`) may be sensitive. Default them to private; render only if the participant has set `public_profile: true` AND opted in per-field. Render a `[private]` chip in the public view where data exists but isn't shared.

---

## Write Path (The No-DB Challenge)

The philosophically interesting part. Three approaches in increasing autonomy.

### Phase 1: PR-Based Submissions (manual review)

When a logged-in user edits their stack at `/stack/me`:

1. The Svelte UI builds a candidate `participants/{handle}.md` content (frontmatter + body).
2. On submit, the client posts to a Lossless-managed Astro server endpoint (`POST /api/stack/save`).
3. The endpoint authenticates the request (verifies the JWT), confirms the `handle` matches the user's GitHub login, and uses the **GitHub REST API** with a bot token to:
   - Create a branch `stack-update/{handle}-{timestamp}`
   - Commit the new/updated `.md` file
   - Open a PR titled `stack: {handle} updated their stack`
4. A maintainer reviews and merges (or auto-merge in Phase 2).

**Pros:** auditable, no auto-write surface, every submission has a diff.
**Cons:** publication delayed by review.

### Phase 2: Bot-Approved Auto-Merge

Same flow as Phase 1, but a GitHub Action (or the same server endpoint) auto-merges if:

- The PR touches **only** `src/content/participants/{handle}.md`, AND
- The `handle` matches the authenticated GitHub user, AND
- The frontmatter still validates against the Zod schema, AND
- No new tool slugs are introduced (tools must be added via a separate, reviewed PR).

This is the right end state.

### Phase 3: Append-Only Event Log + Nightly Snapshot

If write volume scales beyond what PR-per-edit can handle (unlikely at 200 users), shift to:

- Each submit appends a JSON line to `src/content/events/{YYYY-MM-DD}.jsonl`
- A nightly GitHub Action collapses events into per-participant `.md` files
- Past `.jsonl` files become an audit trail

Probably overkill for our scale; mentioned for completeness.

### What Lives Server-Side

- `POST /api/stack/save` — authenticated write endpoint (Astro server route, deployed via Vercel adapter)
- `GET /api/auth/github/callback` — OAuth handshake
- `POST /api/auth/logout` — clears the session cookie

No other server endpoints. Everything else stays static.

### Secrets & Tokens

- `GITHUB_BOT_TOKEN` — fine-grained PAT scoped to the `fullstack-vc` repo only, with `Contents: write` and `Pull requests: write`. Stored as a Vercel env var.
- `GITHUB_OAUTH_CLIENT_ID` / `GITHUB_OAUTH_CLIENT_SECRET`
- `JWT_SIGNING_SECRET` — for signing session cookies

---

## Survey Tool (Phase 2)

Webinar-specific surveys (e.g., "what did you think of the May session?", "which tool from today's demo did you find most compelling?") are a separate concern from stack tracking. Time-bounded, sometimes pseudonymous.

### Approach

- **External tool:** [Tally](https://tally.so) (free tier handles our scale; supports webhooks; markdown-friendly export)
- **Webhook → markdown:** Tally fires on submission → Astro server endpoint at `/api/survey/{survey-id}` receives it → commits a markdown file to `src/content/surveys/{survey-id}/{response-id}.md`
- **Aggregation page:** `/surveys/[id]` reads all responses for that survey at build time and renders a summary

Same write-path pattern as the stack data: external tool collects, our endpoint converts to markdown-in-repo, our pages render from there.

---

## Components & Layouts

| Component | Purpose | Astro / Svelte |
|---|---|---|
| `ToolCard.astro` | Logo + name + category chip | Astro |
| `ToolGrid.astro` | Responsive grid of `ToolCard`s with optional filters | Astro |
| `StackHeatmap.astro` | Aggregate adoption matrix (categories × tools) | Astro (data) + Svelte (interactive hover) |
| `StackBuilder.svelte` | Personal stack-editing interface (the only full interactive island) | Svelte |
| `StackAutocomplete.svelte` | Type-ahead search backed by the tools registry | Svelte |
| `ParticipantCard.astro` | Profile thumbnail (avatar + name + firm + tool count) | Astro |
| `ParticipantStackView.astro` | Render a participant's three stack tiers | Astro |
| `AuthGate.astro` | Wraps `/stack/me` — shows GitHub login if unauthed | Astro |
| `OAuthButton.astro` | Branded "Log in with GitHub" button | Astro |
| `LeaderboardList.astro` | Top-N tool list with deltas | Astro |

Per the [[context-v/blueprints/Maintain-Design-System-and-Brandkit-Motions|Design System maintenance motion]], every component lands in `/design-system` in the same PR.

### Layout Toggles

- Logo cloud ↔ card grid (per the portfolio spec's pattern)
- Filter chips: category, OSS-only, pricing tier
- Cohort filter: Kauffman year, firm size, geography (when those fields are populated)

---

## AI-Assisted Tool Metadata Enrichment (Phase 2 / Phase 3)

A common pain point: a participant types in a tool that isn't in the registry yet. Curating the registry by hand is the bottleneck. AI can carry most of this load.

### Approach

- A maintainer-only `/admin/tool-suggestions` page lists tools that have appeared in submissions but are missing from the registry.
- For each candidate, a build-time job uses a **Browserless headless browser** + **OpenGraph scrape** to fetch the tool's homepage, then runs the result through Claude/an LLM with a prompt template that produces the canonical frontmatter (slug, conventionalName, category, description_short, logo URLs, etc.).
- Maintainer reviews the AI-proposed entry and merges via PR.

Why: OpenGraph descriptions in the wild are typically marketing fluff. An AI bot can summarize a homepage into a consistent, useful 1-sentence description for our format. This is the kind of work AI does better than humans at scale, and aligns with the firm's thesis.

---

## Branded Exports & Downloads (Phase 2)

Same approach as the portfolio spec:

- **CSV:** generate client-side from the visible grid (current set of filters applied)
- **PDF:** templated Astro page rendered via serverless headless browser. A common request will be "give me my own stack as a one-pager I can paste into a memo." A `/stack/me/print` route addresses this.

---

## Deployment Considerations

The site already lives at `sites/fullstack-vc/` as a submodule under astro-knots. Conversion to a Vercel deployment with auth requires:

1. **Vercel adapter** in `astro.config.mjs` — currently the site is pure SSG; this introduces hybrid mode for `/api/*` routes only.
2. Env vars on the Vercel project (the OAuth secrets + `GITHUB_BOT_TOKEN` + `JWT_SIGNING_SECRET`).
3. The bot account on GitHub with write access scoped to `lossless-group/fullstack-vc` only.
4. (Phase 2) GitHub Actions workflow for auto-merge of self-scoped PRs.

---

# Acceptance Criteria

## v0.1 — Read-only, public

- [ ] `/stack` renders an aggregate heatmap from real `participants/*.md` data (seed with 5–10 hand-authored profiles)
- [ ] `/stack/people/[handle]` renders for every participant with `public_profile: true`
- [ ] `/stack/tools/[slug]` renders for every tool entry
- [ ] All routes pass build with `pnpm --filter fullstack-vc build`
- [ ] Mobile + desktop layouts both legible; theme + 3-mode toggle works on every page
- [ ] Components cataloged in `/design-system`

## v0.2 — Authenticated edit

- [ ] GitHub OAuth flow lands a logged-in user back at `/stack/me`
- [ ] Allowlist match against `kauffman_roster.json` works; non-matched users see the friendly bounce page
- [ ] `StackBuilder.svelte` lets a user add/remove tools across current/aspirational/abandoned tiers
- [ ] Autocomplete accepts both tool name and URL forms; URL aliases resolve to the canonical slug
- [ ] Submit creates a real GitHub PR via the bot token; user sees a confirmation linking to the PR
- [ ] Manual merge of the PR updates the static site on next build

## v0.3 — Auto-merge + survey hookup

- [ ] Self-scoped PRs auto-merge (Phase 2 of write path)
- [ ] Tally webhook integration ships at least one live survey
- [ ] AI-assisted tool metadata enrichment scaffolded (admin-only flow)

---

# Exploration Summary

The thing this spec is really arguing for: **OAuth is fine, write paths are tractable, markdown-as-database scales for community-sized data, and AI can carry the curation load.** None of this requires vendor lock-in or platform thinking. The whole stack is replaceable file-by-file if any single piece (Astro, Svelte, Vercel, GitHub) becomes a poor fit.

The single biggest open design question is **how aggressively to involve AI in the registry curation loop** — too aggressive and the registry sprawls with near-duplicates; too cautious and the bottleneck is a human reviewer. The Phase 2/3 enrichment approach above (AI proposes, human merges) is the right starting balance.

---

# Yak Shaving

- [ ] Create a Bases parser and API to extract data from the Obsidian "Base" file. Useful if the Lossless Group's internal vault already maintains a Base of tools we'd like to seed the registry with.
- [ ] OpenGraph + Browserless AI task to generate logos, OG image, description, use cases, "good for whom," feature list, etc. The OpenGraph API returns lame descriptions on its own — an AI bot needs to read the actual page copy and summarize in a consistent format.
- [ ] Logo asset pipeline — most tools have light/dark variants; some only have one. Detect missing variants and (optionally) AI-generate the inverse. This is the boring-but-real work that keeps the visual layer honest.

---

# Open Questions

- [ ] **Tool registry curation:** who maintains it? If anyone with a logged-in session can add a new tool entry, the registry will sprawl. Likely answer: tool additions require a separate, manually-reviewed PR (no auto-merge), encouraging high signal. Confirm.
- [ ] **Privacy default:** should new participants default to `public_profile: true` or `false`? Lean toward `false` — opt-in is the kinder default for a community of senior investors.
- [ ] **Cohort views and PII:** Kauffman year + firm name are basically identifying. Cohort views must respect `public_profile` per row.
- [ ] **OSS-only filter:** worth it for the philosophical slice ("show me only tools my firm could self-host"), or feature creep?
- [ ] **Lapsed members:** what happens when someone leaves the Kauffman network? Do their profile pages stay up? Probably yes (community continuity), but with a "no longer active" flag.
- [ ] **At what point do we migrate to NocoDB or AstroDB / Turso?** This is the original open question from the v0.0 stub. **Tentative answer: never.** The thesis of this spec is that markdown + JSON scales to community size, and the engineering complexity of a database is not justified at 200 users / 1500 tools. Revisit if (a) the registry tops 5,000 tools, (b) sub-second autocomplete becomes a felt problem, or (c) we need true concurrent-edit semantics that PR-flow can't provide.
- [ ] **How do we handle authentication and authorization for an upstream Obsidian "Base" file?** If we ever do consume a Base as a seed source, the Base file lives in someone's local vault — not on the network. The pattern is "export the Base to JSON, commit the JSON to this repo, treat the export as the authoritative seed." No live auth required.

---

# Future Plans

- [ ] AI-assisted tool deduplication — a build-time job that reads the registry, identifies near-duplicates (same homepage URL with different slugs, same tool with different conventionalName casings, etc.) and proposes merges via PR.
- [ ] OpenGraph + Browserless AI task to generate open graph data — see Yak Shaving.
- [ ] Cross-pollination with sibling sites — if hypernova, banner-site, or twf adopt the same tool registry, extract `packages/community/tool-registry/` as a shared pattern reference.
- [ ] **Backend migration to NocoDB / AstroDB / Turso — explicitly deprioritized** per the open-question answer above. Listed here so future contributors know it was considered and rejected at this scale.
