---
title: Migrate Participant Stacks from Markdown to Turso with DB→Markdown Materialization
lede: Stacks (current / aspirational / abandoned) live today in src/content/participants/<handle>.md and persist via GitHub App commits on every save — the same pattern the polling blueprint v2 §8.1 explicitly retired for time-sensitive data because of commit-history pollution, PEM brittleness, and concurrent-edit fragility. This task moves stacks to Astro DB on Turso as the authoritative store, with a periodic snapshot back to markdown so the build-in-public visibility stays intact. Generalizes the same materialization motion polling already uses (v2 §9), bringing two surfaces under one principled pattern.
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
  - Storage
  - Identity-Model
  - Astro-DB
  - Turso
  - Materialization
  - GitHub-App-Retirement
  - Participants
  - Stacks
  - Build-In-Public
  - SSR-vs-SSG
  - Schema-Migration
  - Content-Materialization
authors:
  - Michael Staton
date_created: 2026-05-21
date_modified: 2026-05-21
publish: true
site_uuid: 9c938628-ccbd-4a6a-9f3d-1cb9aa9399d4
hex_code: z6wp77
from: fullstack-vc
from_path: tasks/Migrate-Participant-Stacks-from-Markdown-to-Turso-with-Materialization.md
---
<!-- Rolled up from fullstack-vc/context-v/tasks/Migrate-Participant-Stacks-from-Markdown-to-Turso-with-Materialization.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

# Migrate Participant Stacks from Markdown to Turso with DB→Markdown Materialization

**Status:** Planned (post-May-27)
**Site:** `sites/fullstack-vc`
**Sibling task:** [[Redesign-Stack-Builder-with-Multi-Column-Drag-Drop]] — the UX redesign that composes with this storage change. Either task can ship first; they're independent.
**Related blueprints:** [[Maintain-an-Interactive-Polling-System--v2]] §8 (Astro DB / Turso decision), §9 (the DB→markdown materialization motion this task generalizes)
**Predecessors:** [[Auth-Identity-System-Worked-but-UX-Failed-Silent-Bounces]] (for the identity model this layers on top of)

---

## 1. Why this matters

Stacks are the *primary editorial artifact* of the Agentic VC Dojo. They're how members say "this is the tool I use, this is the tool I want to use, this is the tool I gave up on." They surface on `/people/<handle>`, on `/stacks/`, in the changelog narrative, in the design system catalog. Every member has one. Most edit it more than once.

Today every stack save flows:

```
User clicks Save in StackBuilder.svelte
  → POST /api/stack/save  (Astro API route)
  → lib/github-commit.ts uses the GitHub App to commit the new frontmatter
    to participants/<handle>.md on `main`
  → Vercel rebuild fires (commit triggers deploy)
  → Page rebuilds, user sees the change ~30–90 seconds later
```

**The costs we're paying right now:**

- **Commit-history pollution.** Every save = a commit. The `git log` for `sites/fullstack-vc` has dozens of `update(stack): mpstaton edit` entries, indistinguishable from real work, drowning the signal in the changelog noise.
- **GitHub App PEM brittleness.** The App private key lives on Vercel as an env var. It's expired once, rotated awkwardly, and broken silently for hours before anyone noticed. The polling blueprint flagged this with "the GitHub App PEM has been brittle on Vercel."
- **Latency.** A save → visible-result loop takes a full Vercel deploy (30–90s). Acceptable for editorial cadence, irritating during the rapid-iteration moments the StackBuilder is meant to support.
- **Concurrent edits fragile.** Two people editing two different stacks simultaneously: race conditions on the App's commit, one stomps the other if their lock window overlaps.
- **No undo.** A bad save is a real commit. To roll back you write a new commit. Editorial flow but not a real audit trail.

**What the polling blueprint already chose** (v2 §8.1, verbatim): *"The recent attempt to keep 'everything-as-SSG' via GitHub-App-driven commits on every data change confirmed that the hack works but is slow, fragile around concurrent edits, and produces commit-history pollution that's painful to live with. Polling is the cleanest 'no, you actually need a database' forcing function we'll meet. Rather than relitigate this per feature, this blueprint locks in the architectural split: SSG remains the default for editorial-cadence content; SSR + database for any surface that needs sub-build-cycle freshness."*

Stacks technically fall on the "editorial cadence" side of that split — they update once a week, not in real time. **But the rest of the costs (pollution, brittleness, no undo) apply regardless of write frequency.** Generalizing the materialization pattern across both polls and stacks is the principled answer: one storage pattern, one motion, one mental model.

## 2. Current state — exhaustive audit

What touches stacks today:

| Surface | Role | File(s) |
|---|---|---|
| **Source of truth** | The frontmatter on `participants/<handle>.md` | `src/content/participants/*.md` |
| **Schema** | Astro Content Collection validates the shape | `src/content.config.ts` (the `participants` collection — `current_stack`, `aspirational_stack`, `abandoned_stack` array shapes) |
| **Render — public** | Reads collection, renders rows | `src/pages/people/[handle].astro`, `src/pages/stacks/index.astro`, `src/components/stack/ParticipantStackView.astro` |
| **Render — header CTA** | Stack counts | `src/pages/api/me.ts` (loads collection, counts arrays) |
| **Editor** | Svelte island | `src/components/stack/StackBuilder.svelte` |
| **Save API** | Validates + commits | `src/pages/api/stack/save.ts` |
| **Commit infra** | GitHub App writes | `src/lib/github-commit.ts` |

Anything that writes (effectively: only `/api/stack/save`) goes through `github-commit.ts`. Everything else reads from the collection. The collection is what Astro builds against on `pnpm build`.

## 3. Design

### 3.1 Schema

New `Stack` table in `db/config.ts`:

```ts
const Stack = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    user_id: column.text({ references: () => User.columns.id }),
    handle: column.text(),               // mirror of User.github_handle for fast joins to participants/*.md
    bucket: column.text(),               // 'current' | 'aspirational' | 'abandoned'
    tool: column.text(),                 // tool slug — refs src/content/tools/<tool>.md
    position: column.number(),           // ordering within bucket; gaps OK
    notes: column.text({ optional: true }),     // current-only
    intent: column.text({ optional: true }),    // aspirational-only
    reason: column.text({ optional: true }),    // abandoned-only
    added: column.date({ optional: true }),     // current-only
    abandoned: column.date({ optional: true }), // abandoned-only
    created_at: column.date(),
    updated_at: column.date(),
  },
  indexes: {
    by_user: { on: ['user_id'] },
    by_handle: { on: ['handle'] },
    unique_per_bucket: { on: ['user_id', 'bucket', 'tool'], unique: true },
  },
});
```

**Why one flat table with `bucket` instead of three tables:**
- Moving a row between buckets (the drag-drop case) is a single UPDATE, not a DELETE + INSERT.
- The bucket-specific fields (`notes` vs `intent` vs `reason`) are nullable on the rows that don't need them. The data shape is permissive on purpose so cross-bucket moves don't lose info that *could* still be meaningful.
- Aggregation queries (count by bucket, find tools used most across all stacks) are one GROUP BY instead of three UNIONs.

The unique index on `(user_id, bucket, tool)` enforces "you can't have OpenClaw in your Current stack twice" without preventing it from also being in Archived (different bucket).

### 3.2 Read path

**Public pages stay SSG by default** by reading from materialized markdown. SSR is opt-in for surfaces that genuinely need sub-build-cycle freshness:

- `/people/<handle>` → SSG, reads markdown (unchanged).
- `/stacks/` index → SSG, reads markdown (unchanged).
- `/people/<handle>/stack/edit` → **SSR**, reads from Turso (live, reflects in-progress edits).
- `/api/me` → already SSR, reads from Turso for counts.

This means **the editor sees Turso truth instantly**; the public sees the snapshot. Same shape as the polling system's live-vs-archive surfaces.

### 3.3 Write path

`/api/stack/save` flow becomes:

```
POST /api/stack/save with the full stack payload
  → Verify session, resolve canonical user_id (existing logic)
  → BEGIN transaction
    → DELETE FROM Stack WHERE user_id = ?
    → INSERT all rows from the payload (current + aspirational + abandoned)
  → COMMIT
  → Return { ok: true, total: N }
```

Idempotent. Atomic. No GitHub App. No commit. No deploy trigger.

### 3.4 Materialization (DB → markdown)

A periodic job snapshots Turso stacks into `participants/<handle>.md` frontmatter so the public SSG pages stay accurate. Three trigger options, increasing cadence:

| Trigger | Cadence | Mechanism |
|---|---|---|
| **Manual CLI** | Whenever the editor wants to publish | `pnpm sync:stacks <handle>` or `pnpm sync:stacks --all` |
| **Scheduled cron** | Hourly / daily | GitHub Action or Vercel Cron hitting the sync endpoint |
| **Save-triggered** | Per save | The save endpoint kicks off a debounced sync (15-min window) |

**For v0.0.1 of this migration, ship just the manual CLI.** It mirrors the polling sync pattern (`pnpm sync:session`). Add the cron in v0.0.2 once the manual flow is proven on real edits.

The sync script (`scripts/sync-stacks.ts`):

1. For each user in Turso with at least one Stack row:
   - Fetch all their Stack rows
   - Group by bucket
   - Look up `participants/<handle>.md` (where handle = the user's github_handle)
   - Rewrite the three stack arrays in frontmatter, **preserving everything else** (name, firm, role, headshot, body)
   - Write the file
2. After all files written, the operator commits the result manually OR the script offers `--commit` to git-commit with a structured message (`materialize(stacks): snapshot from Turso 2026-MM-DD HH:MM`).

The commit message convention makes the materialization commits *visually distinct* from editorial work in `git log` — solving the pollution problem we have today, where save commits look identical to feature commits.

### 3.5 Migration motion (one-time)

To move from the current markdown-authoritative state to Turso-authoritative:

1. **Backfill script** (`scripts/migrate-stacks-to-turso.ts`):
   - Read every `participants/*.md`
   - For each, find or create the corresponding `User` row (matching by `handle = github_handle`)
   - Insert one `Stack` row per current/aspirational/abandoned entry
   - Idempotent — re-runnable
2. **Schema push:** `astro db push --remote`
3. **Switch the editor** to write to Turso (commit the new `/api/stack/save`)
4. **First sync:** `pnpm sync:stacks --all` to confirm the round-trip produces the same markdown (or close enough — order may shift)
5. **Retire `github-commit.ts`** for stacks. Keep the file around — `auth-events` and any other future single-row commit paths might still want it. Just don't call it from `/api/stack/save`.

## 4. Out of scope (parked)

- **Tool-collection canonicalization.** Today `tool: 'claude-code'` in a stack entry refs `src/content/tools/claude-code.md`. Stays the same. We don't move tools to Turso — they're editorial and the canonical registry pattern works well there.
- **Stack history / audit log.** Useful long-term (when did mpstaton drop Cursor? when did he adopt Windsurf?). Out of scope here; the existing date fields (`added`, `abandoned`) already capture the headline transitions. Full per-edit history is a `StackEvent` table for a future task.
- **Real-time collaborative editing.** If two people edit the same stack at the same time, last-write-wins. Pessimistic locking is over-engineering at our scale.
- **Public stack-diff visualization.** "Here's what changed in mpstaton's stack in the last month." Interesting. Not now.

## 5. Step-by-step implementation

1. **Schema:** add `Stack` table to `db/config.ts` (per §3.1). `astro db push --remote`. (~15 min)
2. **Backfill script** (`scripts/migrate-stacks-to-turso.ts`): read every participant markdown, insert Stack rows. Idempotent. Run once against local, verify, then against remote. (~1 hour incl. dry-run safety)
3. **Read API:** new `GET /api/stack/[handle]` returns the user's full stack from Turso, grouped by bucket. Used by the editor and the header CTA. (~30 min)
4. **Save API:** rewrite `/api/stack/save` to write to Turso (DELETE+INSERT in a transaction) instead of via GitHub App. (~45 min)
5. **Editor wiring:** `StackBuilder.svelte` `onSave` calls the new endpoint shape. (~30 min)
6. **/me + /api/me:** switch stack-counts source from `getCollection` to a Turso COUNT query. (~15 min)
7. **Sync script** (`scripts/sync-stacks.ts`): read Turso, rewrite participant markdown frontmatter, preserve body. (~1.5 hours incl. order-preservation edge cases)
8. **`pnpm sync:stacks` script** wired in `package.json`. (~5 min)
9. **First end-to-end test:** edit one stack via the live editor, run sync, confirm the markdown updates correctly and the public page renders identically. (~30 min)
10. **Retire the GitHub App write path for stacks** — remove the call from `/api/stack/save`. (~5 min, plus follow-up scrub of unused code if it ends up entirely unused)

**Total estimate:** 4–6 hours.

## 6. Verification

- **Backfill idempotency:** re-run the backfill script → reports all rows as already-present, no duplicates inserted.
- **Save round-trip:** edit a stack in the live editor → reload `/people/<handle>/stack/edit` → see the edit reflected (Turso source). Reload `/people/<handle>` → still shows the pre-sync version (markdown source).
- **Sync produces identical markdown:** run sync against a freshly-backfilled DB → diff the output markdown against the source markdown → should be byte-identical (modulo array order if not preserved; address explicitly).
- **No commit on save:** edit a stack → confirm `git log` has no new commits.
- **Concurrent saves don't race:** open two browsers, edit two different stacks at the same time, save both → both writes land cleanly.
- **The /api/me stack counts come from Turso:** edit, then refresh the tooltip — counts update without a Vercel deploy.

## 7. Open questions

- **Where does the sync script run?** Three options: (a) local laptop on-demand (operator-driven), (b) GitHub Action on a schedule (free, slow), (c) Vercel Cron (paid tier, fast). Recommend (a) for v0.0.1, (b) once cadence proves stable.
- **Do we still write to markdown on save for "draft" visibility?** If a member edits their stack but the sync hasn't run, the public page is stale. Two options: (i) accept the staleness — call it "the published version" vs the "live working copy" — and surface that in the editor ("you have unpublished changes — sync to publish"); (ii) make the public page itself read from Turso (SSR) and abandon SSG for stack rendering. Recommend (i) for simplicity; (ii) is a meaningful architectural shift that deserves its own decision.
- **Order preservation in the sync.** Turso has `Stack.position` for explicit order. The markdown arrays today are unordered (alphabetical by tool slug in some files, chronological in others). The sync should write them by `position` so the markdown reflects the user's chosen order — which means the backfill needs to *assign* positions during initial migration. Recommend: assign by array order from the source markdown, then position becomes user-controlled going forward.
- **Tool slug FK enforcement.** Today `tool: 'claude-code'` is a string in markdown — nothing checks the referenced `src/content/tools/claude-code.md` actually exists. Turso could enforce this with a foreign key… but `tools/` is markdown, not a DB table. Recommend: don't enforce at the DB layer; add a validation step in the save endpoint that warns (but doesn't reject) when the referenced tool file doesn't exist. Same posture as the rest of the no-hard-validation principle.

## 8. References

- [[Maintain-an-Interactive-Polling-System--v2]] §8 (Astro DB / Turso decision), §9 (the materialization motion this task generalizes)
- [[Redesign-Stack-Builder-with-Multi-Column-Drag-Drop]] — sibling task; composes with this one but doesn't depend on it
- [[Wire-Google-Workspace-OAuth-Provider]] — landed; the identity layer this storage sits on top of
- [[Pre-create-and-Fuzzy-Bind-Users-from-External-Rosters]] — the User-row pre-creation pattern. Pre-created users via Zoom ingest get a `User` row first; they'll have empty `Stack` rows that's perfectly natural until they edit
- `src/lib/github-commit.ts` — the write-path infrastructure this task retires (for stacks specifically)
- `commit b42ef4f` — "feat(stacks): write path — Svelte editor + GitHub App bot + auto-publishing commits" — the original implementation this task supersedes
