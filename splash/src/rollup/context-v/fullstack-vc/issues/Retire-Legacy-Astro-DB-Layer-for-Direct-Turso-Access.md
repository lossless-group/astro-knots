---
title: Retire the Legacy Astro DB Layer in Favor of Direct Turso Access
lede: Astro is deprecating Astro DB, and Astro 7 already broke `astro db execute` — every seed and sync script in this repo runs through a hand-written shim into @astrojs/db's internals. Turso was always the real store. 41 files still import `astro:db`. This is the plan to cut out the middle layer.
date_authored_initial_draft: 2026-08-15
date_authored_current_draft: 2026-08-15
date_authored_final_draft: null
date_first_published: null
date_last_updated: 2026-08-15
at_semantic_version: 0.0.1.0
status: Open
augmented_with: Claude Code (Opus 5)
category: Issue Resolution
tags:
  - Astro-DB
  - Turso
  - libSQL
  - Deprecation
  - Technical-Debt
  - Migration
  - Database
  - Scripts
  - SSR
  - Stacks
  - Polling
  - Cleanup
authors:
  - Michael Staton
site_uuid: 680b8842-707a-4c3d-b285-a9be588ec89a
hex_code: zir7z3
date_created: 2026-08-15
date_modified: 2026-08-15
publish: false
from: fullstack-vc
from_path: issues/Retire-Legacy-Astro-DB-Layer-for-Direct-Turso-Access.md
---
<!-- Rolled up from fullstack-vc/context-v/issues/Retire-Legacy-Astro-DB-Layer-for-Direct-Turso-Access.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

# Retire the Legacy Astro DB Layer in Favor of Direct Turso Access

**Status:** Open — not started, beachhead landed
**Site:** `sites/fullstack-vc`
**Surfaces:** `db/config.ts`, `db/seed.ts`, `scripts/*` (20 files), `src/pages/api/*`, `src/pages/*.astro`, `src/lib/*`, `astro.config.mjs`

## Why Care?

The database under this site is **Turso**. It always has been. Astro DB was only ever the access layer sitting on top of it — a schema DSL, a `db` object importable as `astro:db`, and a `astro db execute` CLI for running scripts.

That layer is now a liability in three separate ways:

1. **Astro is deprecating Astro DB.** The direction of travel is away from it. Building anything new on `astro:db` is building on a floor that's being removed.
2. **It already broke once, silently.** Astro 7 dropped the CLI delegation that routed `astro db <cmd>` to `@astrojs/db`. Every seed and poll-control script in `package.json` stopped working — and nobody noticed for weeks, because the failure surfaced only when someone tried to run one. The fix was `scripts/db-execute.mjs`, a shim that reaches into `@astrojs/db`'s internal CLI with a synthesized flags/config pair. That shim works, and it is exactly the kind of thing that breaks on the next minor upgrade.
3. **It forces a second set of credentials for one database.** `.env` carries `ASTRO_DB_REMOTE_URL` + `ASTRO_DB_APP_TOKEN` *and* `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`. Same database, two doors, two things to rotate, two things to get wrong.

Meanwhile the alternative is just… good. **Turso's HTTP API is fast and `@libsql/client` is pleasant to use.** The underscore diagnostics in this repo (`scripts/_inspect-turso.mjs`, `scripts/_audit-stack-drift.mjs`, `scripts/_reconcile-user-rows.mjs`) have been talking to Turso directly for months without ceremony. There is no capability we lose by cutting out the middle layer.

**Local development is not a reason to keep it.** libSQL runs locally — either as a file (which is all `.astro/content.db` ever was) or via `turso dev`. We can keep a local instance for development; we just don't need Astro DB to reach it.

## What's actually coupled

**41 files import `astro:db`.** The split matters, because the two halves carry very different risk:

| Area | Files | Risk | Notes |
|---|---|---|---|
| `scripts/` | 20 | **Low** | Operator-run, not user-facing. Failure is visible and immediate. Includes `db-execute.mjs` (the shim itself), all seeds, `sync-session.ts`, `sync-stacks.ts`, `add-to-stack.ts`, `migrate-stacks-to-turso.ts`. |
| `src/pages/api/` | 7 | **High** | Live request path. `me.ts`, `participation-interest.ts`, `polls/[id]/results.json.ts`, `polls/[id]/votes.ts`, `proposals.ts`, `stack/[handle].json.ts`, `stack/save.ts`. |
| `src/pages/*.astro` | 8 | **High** | SSR pages. `me.astro`, `people/[handle].astro`, `people/[handle]/stack/edit.astro`, `polls/checkup.astro`, `projects/propose.astro`, `sessions/[id].astro`, `slides/2026-07-29_monthly-all-hands/index.astro`, `working-groups/propose.astro`. |
| `src/lib/` | 3 | **High** | Shared: `auth-events.ts`, `poll-templates.ts`, `user-record.ts`. Converting these three probably unblocks most of the pages above. |
| `src/components/` | 1 | Medium | `polls/PollEmbed.svelte`. |
| `db/` | 2 | — | `config.ts` (the 10-table schema), `seed.ts` (seeds Sessions + Polls only). |

Plus `astro.config.mjs`, which imports `@astrojs/db` rather than `astro:db` (so it's outside the 41) to register the `db()` integration.

Ten tables in `db/config.ts`: `Session`, `Poll`, `Vote`, `PollResult`, `PollEvent`, `User`, `Proposal`, `ParticipationInterest`, `AuthEvent`, `Stack`.

## The beachhead (already landed, 2026-08-15)

Two scripts now talk to Turso directly, as the proof-of-shape for everything else:

- `scripts/add-to-stack-turso.mjs` → `pnpm add:stack:turso`
- `scripts/sync-stacks-turso.mjs` → `pnpm sync:stacks:turso`

Both read `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` from `.env`, support `DRY_RUN=true`, and were used to write the `aside` and `comet` Stack rows and materialize them into `participants/mpstaton.md`. The sync script's YAML serialization helpers are **ported verbatim** from `scripts/sync-stacks.ts` so output stays byte-identical to the old materializer.

**This is the pattern to replicate.** It also establishes the tell: a direct script needs no `db-execute.mjs`, no `--remote` flag, and no `export default async function ()` wrapper — it's just a Node script you run.

## Proposed sequence

Ordered by risk, lowest first. Each phase is independently shippable; nothing here needs to be one big-bang migration.

**Phase 1 — Scripts (low risk, high relief).**
Port the 20 `scripts/*` files to `@libsql/client`, following the two beachhead scripts. Retire `db-execute.mjs` and the `--env-file=.env` + `--remote` dance along with them. Prioritize the ones actually run on a cadence (`sync-stacks`, `sync-session`, `sync-people-from-db`, `set-poll-status`) over the one-shot historical seeds (`seed-production-may27`, `seed-production-jul29`), which may be better deleted than ported — **decide per script whether it's still live or archaeology.**

**Phase 2 — `src/lib/` (unblocks the rest).**
Convert `auth-events.ts`, `poll-templates.ts`, `user-record.ts` to a shared Turso client module. This likely wants one `src/lib/db.ts` exporting a configured `createClient()` — the single seam every runtime caller goes through. Note the env difference: runtime reads `import.meta.env`, scripts read `.env` by hand.

**Phase 3 — API routes and SSR pages (high risk, do last, verify hardest).**
The 16 remaining runtime files (7 API routes, 8 SSR pages, and `PollEmbed.svelte`). These are on the live request path for polls, auth, stacks, and proposals — the surfaces a session depends on. **Do not attempt during a live-event week.**

**Phase 4 — Teardown.**
Drop the `db()` integration from `astro.config.mjs`, remove `@astrojs/db` from `package.json`, retire `ASTRO_DB_REMOTE_URL` / `ASTRO_DB_APP_TOKEN` from `.env` and from Vercel's env panel. Decide what `db/config.ts` becomes — see open questions.

## Open questions

- **What replaces `db/config.ts` as the schema record?** The Drizzle-style `defineTable` blocks are genuinely useful documentation — the column comments in there explain the Stack bucket model better than anything else in the repo. Options: keep the file as inert documentation with a header saying so; convert to plain SQL DDL; or move to a migrations tool. **Losing the commentary would be a real loss.**
- **Do we want a migrations story at all?** Astro DB handled schema push. Without it, schema changes are hand-run DDL against Turso. That's fine at this size and becomes not-fine at some point.
- **Local dev shape.** File-based libSQL (what `.astro/content.db` already is) or `turso dev`? Worth noting the local DB is currently near-useless for stack work: `db/seed.ts` seeds only Sessions and Polls, so `User` and `Stack` are empty locally — which is why "test locally first" doesn't work for stack scripts today. A migration is the moment to fix that or to explicitly decide local-dev-against-a-branch-DB is the model.
- **Types.** `astro:db` gave `typeof Stack.$inferSelect`. Direct libSQL returns untyped rows. Do we hand-write row types, generate them, or accept `any` at the boundary?

## Risks / what not to break

- **The polling system is event-critical.** Sessions run live off these tables, and config-in-the-database is what made the July 29 all-hands operable mid-session. Phase 3 must not land near an event.
- **Turso is authoritative for Stack rows; markdown is a materialized view.** Any ported sync script must preserve that direction. Never hand-edit stack arrays in `participants/<handle>.md`.
- **Byte-identical materialization.** The YAML emitters produce markdown that gets committed. A port that "cleans up" the formatting produces a giant meaningless diff across every participant file.
- **Two credential paths during transition.** Until Phase 4, both sets of env vars must stay valid — in `.env` *and* in Vercel.

## Related drift (surfaced, not fixed)

Noticed while landing the beachhead, recorded here so it isn't lost. **Not auto-fixed** per the drift policy:

- **`n8n` stack row.** Markdown had it in `aspirational` carrying `added:` and `notes:` — fields belonging to the `current` shape. Turso holds it as aspirational with `intent` only. The 2026-08-15 materialization wrote Turso's version, dropping `added: 2025-06-01`. If n8n is genuinely a current tool, the fix is a Turso correction, not a markdown edit. `scripts/_audit-stack-drift.mjs` exists to catch exactly this class of thing — worth running before Phase 1.
- **`src/content/tools/mcpmarket.md`** has six wikilinks in bare form (`[[firecrawl]]`, `[[claude-code]]`, `[[cursor]]`, `[[browserbase]]`, `[[jina-ai]]`, `[[composio]]`) that resolve to `/people/<handle>` instead of `/tools/<handle>`, because `src/lib/docs/wikilink-resolver.ts` treats any token without a `/` as a participant handle. Unrelated to this migration; logged so it gets fixed on some pass.

## References

- `scripts/add-to-stack-turso.mjs` and `scripts/sync-stacks-turso.mjs` — the shape to replicate
- `scripts/db-execute.mjs` — the shim being retired; its header comment documents exactly what Astro 7 broke
- `scripts/_inspect-turso.mjs` — the pre-existing direct-libSQL diagnostic pattern
- [[Migrate-Participant-Stacks-from-Markdown-to-Turso-with-Materialization]] — establishes Turso as authoritative for Stack and the materialization motion, and records the decision that the **tool registry stays markdown-canonical and out of Turso** (in its Deferred-decisions section: *"We don't move tools to Turso — they're editorial"*)
- [[Troubleshooting-SSG-Authentication-and-Port-to-SSR-w-Database]] — how this site got a database in the first place
- [[Auth-Identity-System-Worked-but-UX-Failed-Silent-Bounces]] — the `User` / `AuthEvent` tables in anger
