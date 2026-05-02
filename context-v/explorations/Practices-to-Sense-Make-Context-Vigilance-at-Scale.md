---
title: "Practices to Sense-Make Context Vigilance at Scale"
lede: "An exploration of lightweight conventions, indices, templates, and tooling that keep a context-v library legible as it grows from dozens to hundreds of documents — without introducing a new system to maintain."
date_created: 2026-04-29
date_modified: 2026-04-29
status: Draft
category: Explorations
tags: [Context-Vigilance, Documentation, Knowledge-Management, AI-Collaboration, Indices, Templates, Tooling, Folder-Hygiene]
authors:
  - Michael Staton
augmented_with: Claude Code (Opus 4.7)
---

# Practices to Sense-Make Context Vigilance at Scale

## Why this exploration exists

The `context-v/` folder has reached the size where finding the right document is its own task. Across the broader Lossless Group repos, the same folder shape exists at much larger scale — large enough that "just remember where you put it" stops working.

This file collects practical moves we could make to keep the library legible as it grows. None of these are decided; this is the menu. Items are grouped by **effort vs. payoff** so we can pick the cheap wins first and defer the heavier moves until they're justified.

The companion document is the top-level [[context-v/README.md]] — that one indexes the folder; this one indexes the **practices around the folder**.

---

## High-leverage, low-effort

### 1. A `_INDEX.md` per subfolder

Same idea as the top-level README, but scoped: `specs/_INDEX.md` lists every spec with its lede, status, and `date_modified`. The win: the master README stops needing an update for every new file — it only describes the **category**, while each per-folder index lists the **files**.

- **Where to start:** `specs/`, `blueprints/`, `prompts/` — these grow fastest.
- **Format:** one bulleted line per file: `- [[Title]] — *status* — lede`.
- **Maintenance motion:** when you add a file to the folder, add the line to `_INDEX.md` in the same change. Same rule already applies to the master README; this just narrows the surface.

### 2. `superseded_by` and `at_semantic_version` in frontmatter

When a v2 lands (we already have [[context-v/blueprints/Maintain-an-Interactive-Polling-System--v2.md]] superseding [[context-v/blueprints/Maintain-an-Interactive-Polling-System.md]]), add `superseded_by: "[[…--v2.md]]"` to v1's frontmatter. An assistant scanning the folder can then skip superseded files.

Cheap to do, big payoff six months later when nobody remembers which version is current.

### 3. A `related:` array in frontmatter

Spec links to its blueprint, blueprint links to its issue-resolution, exploration links to the spec it eventually became.

```yaml
related:
  - "[[context-v/blueprints/Maintain-Extended-Markdown-Render-Pipeline.md]]"
  - "[[context-v/specs/Remark-Citations-Plugin-for-Hex-Code-Footnote-Management.md]]"
```

Three-line addition per file. Two big payoffs:

1. Obsidian's graph view starts to **mean something** — clusters of related work become visible.
2. Assistants can follow the graph instead of relying on the author to remember which files belong together.

---

## Medium-effort, high-payoff

### 4. A `CHANGELOG.md` at the root of `context-v/`

Append-only. Three bullets per month: what was added, what was superseded, what got merged.

This is the file you hand a returning collaborator — or a fresh Claude Code session — when they ask *"what's the state of things?"* It's also a forcing function: writing the bullet makes you notice when you've been adding without consolidating.

### 5. A `glossary.md` at the root

Twenty terms max. Each entry one sentence.

Candidates:
- **LFM** — Lossless Flavored Markdown, the published `@lossless-group/lfm` package and spec.
- **Flare** — decorative, often animated component (e.g. concentric wobble rings).
- **Knot** — a `@knots/*` workspace-local pattern reference, not a published package.
- **pseudo-monorepo** — this repo's actual shape; not a true monorepo, not a pattern library.
- **pattern reference** — code in `packages/*` meant to be **copied** into sites, not imported at runtime.
- **published package** — a real dependency sites install (currently only `@lossless-group/lfm`).
- **theme vs. mode** — theme = brand palette; mode = light/dark/vibrant.
- **named token vs. semantic token** — Tier 1 (`--color__blue-azure`) vs. Tier 2 (`--color-primary`).
- **brand kit** — the `/brand-kit` page every site ships (stakeholder-facing).
- **design system page** — the `/design-system` page every site ships (developer-facing).
- **Context Vigilance** — the discipline this folder embodies.

This is the single file that prevents the *"wait, what do you mean by X"* loop in every new conversation.

### 6. A `_TEMPLATES/` folder

One file per category: `_TEMPLATES/spec.md`, `_TEMPLATES/blueprint.md`, `_TEMPLATES/prompt.md`, `_TEMPLATES/reminder.md`, `_TEMPLATES/issue-resolution.md`, `_TEMPLATES/exploration.md`.

Each template carries the canonical frontmatter and section skeleton. We already use [[context-v/prompts/Author-a-Specification-Markdown-File-in-Context-V.md]] for specs — this generalizes the pattern to all six doc types.

The benefit: an assistant has a guaranteed-correct starting point, and we stop drifting on frontmatter shape (which causes Obsidian Dataview-style queries to silently miss files).

---

## Higher-effort, eventually worth it

### 7. A build step that renders the README from frontmatter

Walk `context-v/`, read each file's `title`, `lede`, `status`, `category`, emit the index. The README becomes a generated artifact and never goes stale.

Most of the parsing infrastructure already exists — see the spec at [[context-v/specs/Context-V-GitHub-Fetcher-for-Multi-Repo-Content-Aggregation.md]]. The fetcher and the README-renderer share a parser; building one builds most of the other.

### 8. A `context-v doctor` script

Lints the folder. Failures break the pre-commit hook.

Checks worth running:
- Every file has `title`, `lede`, `status`, `tags`.
- Tags are Train-Case (per [[context-v/reminders/Tags-Must-Use-Train-Case.md]]).
- No orphan files — every file appears in at least one `_INDEX.md` or is linked from another file.
- No broken wikilinks (the path target actually exists).
- No `superseded_by` pointing to a missing file.
- No file at the root of `context-v/` for more than 30 days (forces categorization).

When it lands, the folder starts policing itself.

### 9. An `entry-points/` folder

Task-shaped bundles. Each file is a tiny manifest listing, in order, the README + reminders + spec + blueprint + prompt to read for that task.

Candidates:
- `entry-points/start-a-new-site.md`
- `entry-points/add-a-component.md`
- `entry-points/render-markdown.md`
- `entry-points/add-auth-to-a-portfolio.md`
- `entry-points/publish-a-package.md`

You hand the assistant **one** path and it picks up the right context bundle. This is probably the single biggest accelerator if file count keeps growing — it converts "knowledge of the library" into "knowledge of one file."

---

## Suggestions specifically for the "we have SO MANY files" problem

These are postures, not tasks — habits that keep the entropy in check.

### Use `status` as a noise filter

If we commit to keeping `status` accurate (`Draft` / `Published` / `Superseded`), we can tell an assistant *"only consult `Published` files unless I say otherwise"* and the noise drops dramatically. Status is already in the convention; this is just **enforcing what we already wrote down**.

### Resist new top-level categories

Nine subfolders is already at the upper edge of legible (`specs/`, `blueprints/`, `prompts/`, `reminders/`, `issue-resolution/`, `explorations/`, `strategy/`, `sitemap/`, `extra/`). A new shape of document should first try to fit into the existing nine. If it really doesn't, a new category earns its slot only with a paragraph in the master README explaining why.

### Move root files into categories aggressively

The README already calls this out for [[context-v/Papermark-Self-Hosted-Dataroom-Deployment.md]]. A routine "tidy the root" sweep every month or two prevents the root from becoming a junk drawer.

### Wikilink density beats folder depth

Twenty files in one folder with rich `related:` links is more navigable than the same twenty files split across four folders with no cross-references. Folders are buckets; wikilinks are a graph. The graph wins for retrieval.

### Per-folder size threshold

When any subfolder crosses **~25 files**, that's the signal to either (a) introduce a `_INDEX.md` if it doesn't have one, (b) extract a sub-category, or (c) sweep for `Superseded` files that can be archived. Pick one; don't let the folder cross 40 without one of those moves.

---

## What would I do first?

If we did this in one afternoon:

1. **`_TEMPLATES/`** — five files, ~30 minutes. Removes a class of drift permanently.
2. **`glossary.md`** — twenty bullets, ~30 minutes. Single biggest impact on first-conversation context.
3. **`_INDEX.md` for `specs/`, `blueprints/`, `prompts/`** — generated by hand once, then maintained on each addition.
4. **Add `superseded_by:` to the v1 polling blueprint** — one-line change, immediate clarity.

The bigger items (`doctor`, README generator, `entry-points/`) wait until the cheap moves stop being enough.

---

## Open questions

- **Is the master README itself sustainable as hand-maintained?** It already feels long. Splitting into per-subfolder indices is the cheap fix; auto-generation is the real fix.
- **Where do `entry-points/` live — under `prompts/` or as a sibling category?** Probably sibling, because the audience is *the assistant about to start a task*, not *the human authoring a prompt*.
- **What does archival look like?** Do `Superseded` files move to `_archive/`, or just stay in place with the frontmatter flag? Leaning toward: stay in place, let `doctor` flag them as exempt from "orphan" checks.
- **Do per-folder indices duplicate Obsidian Dataview?** Yes. We're choosing duplication on purpose — Dataview only works inside Obsidian, but Claude Code reads markdown directly. The `_INDEX.md` is for the assistant; Dataview is for the human.

---

## Companion reading

- The master index: [[context-v/README.md]].
- The discipline this is all in service of: <https://www.lossless.group/projects/gallery/context-vigilance>.
- The conventions referenced throughout: [[context-v/reminders/Quirks-of-Obsidian-Flavored-Markdown.md]], [[context-v/reminders/Tags-Must-Use-Train-Case.md]].
- The spec whose parser would power the auto-generated index: [[context-v/specs/Context-V-GitHub-Fetcher-for-Multi-Repo-Content-Aggregation.md]].
