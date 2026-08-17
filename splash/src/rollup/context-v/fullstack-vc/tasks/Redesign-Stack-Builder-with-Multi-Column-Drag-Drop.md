---
title: Redesign Stack Builder with Toggleable Multi-Column Layout and Cross-Column Drag-Drop
lede: Today's StackBuilder is a single-column 'Current stack' editor — aspirational and abandoned entries are only reachable by scrolling far below and editing the markdown frontmatter by hand. Redesign as a wider three-bucket canvas with pill toggles for which buckets are visible, two-up side-by-side view when two are active, and drag-and-drop to move tools across buckets. Cross-column moves reshape data (notes ↔ intent ↔ reason) with inline prompts so nothing is silently lost. Mobile gracefully degrades to a tap-to-move modal.
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
  - UI
  - UX
  - Drag-Drop
  - Svelte
  - Stack-Builder
  - Participant-Editor
  - Two-Column-Layout
  - Accessibility
  - Cross-Column-Reshape
  - Mobile-Fallback
  - Touch-UX
  - Svelte-DnD-Action
authors:
  - Michael Staton
date_created: 2026-05-21
date_modified: 2026-05-21
publish: true
from: fullstack-vc
from_path: tasks/Redesign-Stack-Builder-with-Multi-Column-Drag-Drop.md
---
<!-- Rolled up from fullstack-vc/context-v/tasks/Redesign-Stack-Builder-with-Multi-Column-Drag-Drop.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

# Redesign Stack Builder with Toggleable Multi-Column Layout and Cross-Column Drag-Drop

**Status:** Planned (post-May-27)
**Site:** `sites/fullstack-vc`
**Sibling task:** [[Migrate-Participant-Stacks-from-Markdown-to-Turso-with-Materialization]] — composes with this one but is independent. The UX redesign can ship against the current markdown storage; the storage migration can ship without UX changes.

---

## 1. Why this matters

The StackBuilder is the surface where members express **how they actually work**. Today the editor only meaningfully surfaces `current_stack`. To add an aspirational tool you have to know that field exists, scroll past the current list, and trust that the form below is wired correctly. To archive a tool you've moved on from, same. The bucket discipline (current / aspirational / abandoned) is in the data model but not in the UX — and so the data is incomplete: most stacks have a fleshed-out Current list, a sparse Aspirational list, and a near-empty Abandoned list. Not because members aren't moving on from tools, but because the editor doesn't make it natural to capture the move.

A redesigned editor that **shows all three buckets, lets you toggle which are visible, and lets you drag a tool from one to another** reflects how members actually think about their stack: "I'm using this. I want to try that. I gave up on this other thing." The data we collect gets richer; the resulting `/people/<handle>` pages get more interesting; the cross-stack analysis ("what are people moving away from this quarter?") becomes possible.

## 2. Current state — what the editor looks like today

`src/components/stack/StackBuilder.svelte` is a single-column Svelte 5 island:

- **Profile section:** name, firm, public/private toggle
- **Current stack:** searchable add-tool input + a vertical list of cards, each with a delete X and a notes textarea
- **Aspirational stack** and **Abandoned stack:** present in the data model but not (or barely) in the editor — to confirm, this task should re-read `StackBuilder.svelte` before designing, the assumption above is based on the visible viewport in the screenshot the user shared

Save fires `POST /api/stack/save` with the full payload; the API commits the markdown via the GitHub App.

## 3. Design

### 3.1 Layout — the three columns

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⟵ View public profile                                              │
│                                                                     │
│  @mpstaton                                                          │
│  ▲ Edit your stack                                                  │
│                                                                     │
│  ┌─ Profile ────────────────────────────────────────────────────┐   │
│  │ NAME             FIRM                                        │   │
│  │ [Michael Staton] [Lossless Group / FullStack VC]             │   │
│  │ ☑ Make my profile public at /people/mpstaton                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─ Your stack ─────────────────────────────────────────────────┐   │
│  │  Show:  [Current ●]  [Aspiring ○]  [Archived ○]    [Two-up◧]│   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │  CURRENT (12)                                          │  │   │
│  │  │  + Search tools to add...                              │  │   │
│  │  │  ┌──────────────────────────────────────────────────┐  │  │   │
│  │  │  │ ⋮⋮ ✦ Claude Code                              ×  │  │  │   │
│  │  │  │    Pair-program with Claude in your terminal.     │  │  │   │
│  │  │  │    [notes textarea]                               │  │  │   │
│  │  │  └──────────────────────────────────────────────────┘  │  │   │
│  │  │  ┌──────────────────────────────────────────────────┐  │  │   │
│  │  │  │ ⋮⋮ W Windsurf                                  ×  │  │  │   │
│  │  │  │    ...                                            │  │  │   │
│  │  │  └──────────────────────────────────────────────────┘  │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

When two pills are active:

```
┌─ Your stack ─────────────────────────────────────────────────────┐
│  Show:  [Current ●]  [Aspiring ●]  [Archived ○]    [Two-up ◧]    │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐  │
│  │  CURRENT (12)            │  │  ASPIRING (8)                │  │
│  │  + add tool...           │  │  + add tool...               │  │
│  │  ┌────────────────────┐  │  │  ┌────────────────────────┐  │  │
│  │  │ ⋮⋮ Claude Code     │  │  │  │ ⋮⋮ Hermes Agent        │  │  │
│  │  │    notes...        │  │  │  │    intent...           │  │  │
│  │  └────────────────────┘  │  │  └────────────────────────┘  │  │
│  │  ┌────────────────────┐  │  │  ┌────────────────────────┐  │  │
│  │  │ ⋮⋮ Windsurf       │  │  │  │ ⋮⋮ Crew AI             │  │  │
│  │  └────────────────────┘  │  │  └────────────────────────┘  │  │
│  └──────────────────────────┘  └──────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Behavior rules:**

- **At least one pill must always be active.** Clicking the last active pill is a no-op.
- **Single-pill active** → single-column layout, max-width 36rem.
- **Two pills active** → side-by-side (the "two-up" mode). Max-width widens to 60rem.
- **Three pills active** → would either need to stack vertically (single column, all three sections) OR scroll horizontally. Recommend: snap to two-up of the most-recently-toggled pair + a "more →" affordance to peek at the third without leaving the current view. Simpler than a true three-column.
- The "Two-up ◧" affordance is a visual hint, not a separate toggle — it activates automatically when two pills are on.
- Pill state persists in `localStorage` so the user's preferred view sticks across sessions.

### 3.2 Drag-and-drop

**Within a column:** reorders the tool's position in that bucket. Affects render order on the public profile.

**Across columns** (only meaningful in two-up mode, since you need a destination column visible):

- Dragging a tool from Current → Aspiring **demotes** it. The current `notes` field becomes an `intent` field on the new bucket (intent ≈ "what I'd want from it if I went back"). Inline prompt: *"You moved Claude Code from Current to Aspiring. The note becomes 'intent.' Edit?"*
- Dragging a tool from Current → Archived **abandons** it. Inline prompt asks for an optional `reason` and confirms today's date as `abandoned`.
- Aspiring → Current **adopts** it. Notes field gets the intent text pre-filled (editable).
- Aspiring → Archived **gives up before starting.** Reason prompt.
- Archived → Current **re-adopts.** Date stamps `added` with today; the `reason` and `abandoned` date are kept in a hidden audit field (see Open Questions §7) or just dropped — TBD per the sibling storage task's schema.
- Archived → Aspiring **regretting the abandon.** Reason gets dropped; intent prompt for the new bucket.

**Library choice:** `svelte-dnd-action` ([github](https://github.com/isaacHagoel/svelte-dnd-action)).

- Svelte-native, ~6KB gzipped
- Keyboard-accessible reordering out of the box (arrow keys, space to grab)
- Handles touch sensibly (long-press to drag, but our mobile UX uses the modal fallback below anyway)
- Maintained, MIT licensed
- Avoids the HTML5 DnD API's many gotchas around drag-image, dropEffect, and Firefox quirks

### 3.3 Mobile fallback

Drag-and-drop on touch is universally bad UX. On viewports under 768px:

- Pills still toggle which bucket is visible (single column only — no two-up on mobile)
- **No drag handles render.** Replace each card's drag handle with a "Move" button (or kebab menu)
- Tap "Move" → modal: *"Move Claude Code to: ○ Current  ● Aspiring  ○ Archived"* + an optional notes/intent/reason field. Save closes the modal and animates the card out of its current column.
- Within-column reordering on mobile: small ↑/↓ buttons on each card. Less elegant than drag, but actually works on touch.

### 3.4 Cross-column data reshape — explicit rather than silent

Every cross-column move shows a small inline form (NOT a blocking modal — annoying) just below the dropped card:

```
┌────────────────────────────────────────────────────────────┐
│ ⋮⋮ ✦ Claude Code                                     ×    │
│    Pair-program with Claude in your terminal.              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Moved to Aspiring · The previous notes became:       │  │
│  │ ┌──────────────────────────────────────────────────┐ │  │
│  │ │ Daily driver for Astro-Knots development...     │ │  │
│  │ └──────────────────────────────────────────────────┘ │  │
│  │   [Keep]  [Edit]  [Clear]                            │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

Auto-dismisses after 5s if untouched (the "Keep" path). User can edit or clear. The reshape data is **carried as a draft** until the user clicks Save on the whole stack — so a misclick can be undone with Ctrl/Cmd+Z OR by dragging the card back.

### 3.5 Optimistic UI + undo

- Drag-drop is **optimistic** — UI updates instantly, the move is a pending edit in local state
- A subtle "Unsaved changes (1)" banner appears at the top of the editor with a Save Now button
- Cmd/Ctrl+Z undoes the last drag move OR the last reshape edit (LIFO stack, up to 10 operations)
- Save sends the entire stack snapshot (DELETE+INSERT pattern from the sibling storage task) so the server doesn't have to reason about individual deltas
- If save fails, the optimistic state stays — banner turns red, says "Save failed — try again." No rollback (the user's edits should not silently vanish)

## 4. Out of scope (parked)

- **Drag tools FROM the tool catalog into a bucket.** The user said they want to drag *between* buckets. Adding tools from outside the editor stays the existing search-typeahead pattern.
- **Bulk operations.** "Move all of these to Archived" is a power-user feature for someone with a 50-tool stack. Out of scope until anyone hits that scale.
- **Sharing stacks across people.** "Copy mpstaton's current stack as my aspirational." Interesting community-building feature. Not now.
- **Tool recommendations based on similar stacks.** "People with your current stack often add X next." ML-flavored, deserves its own framing.
- **Reordering buckets themselves.** Buckets are fixed: Current, Aspiring, Archived.

## 5. Step-by-step implementation

1. **Re-read the existing `StackBuilder.svelte`** to inventory exactly what's in scope. Catalog every prop, every event, every shape it expects. (~30 min)
2. **Install `svelte-dnd-action`:** `pnpm add svelte-dnd-action`. (~5 min)
3. **Refactor the editor into three column components:** `StackBucket__Current.svelte`, `StackBucket__Aspiring.svelte`, `StackBucket__Archived.svelte`. Each is a self-contained list of cards with its own add-tool input. (~2 hours)
4. **Pill toggle row + layout switching:** localStorage persistence, single-col vs two-up CSS grid. (~1 hour)
5. **Wire drag-and-drop within columns** via `svelte-dnd-action`. (~45 min)
6. **Wire cross-column drops:** the reshape inline-form pattern from §3.4, with the bucket-specific data transforms. (~2 hours)
7. **Mobile fallback:** kebab/Move button per card, modal for bucket selection, ↑/↓ for reorder. (~1.5 hours)
8. **Optimistic UI + dirty state + undo stack:** the banner, the keyboard handler, the save-now flow. (~1.5 hours)
9. **Accessibility audit:** keyboard-only drag (svelte-dnd-action has this out of the box), screen-reader announcements for drag start/end and bucket transitions, focus trap on the reshape inline form. (~1 hour)
10. **Visual polish + design-system page update:** add the redesigned StackBuilder to `/design-system` per the Astro-Knots discipline. (~30 min)

**Total estimate:** 10–12 hours. The largest piece is the cross-column reshape interactions — they have lots of small UX decisions that benefit from real testing on real data.

## 6. Verification

- **Drag within a column reorders** and the order persists on save → reload → public page renders in the new order.
- **Drag across columns** (in two-up mode) moves the card AND surfaces the reshape inline form.
- **Reshape form auto-dismisses** after 5s if untouched.
- **Cmd/Ctrl+Z** undoes the last drag.
- **Keyboard-only flow:** Tab to a card → Space to grab → arrows to move within column → Tab to switch column → Space to drop → reshape form gets keyboard focus.
- **Mobile (viewport < 768px):** drag handles hidden; Move button works; modal correctly transitions the card; ↑/↓ buttons reorder.
- **localStorage persistence:** toggle a pill, refresh page, pill state restored.
- **At-least-one-pill rule:** clicking the last active pill is a no-op (silent — don't show an error toast).
- **Save submits the whole stack snapshot** — open dev tools, observe the POST body has all three buckets.

## 7. Open questions

- **Three-pill-active behavior.** Recommend snap-to-most-recent-two + peek-at-third affordance. Simpler than true three-column. Confirm.
- **Cross-column data preservation.** When Current → Archived → re-promoted to Current, do we restore the original `notes` and `added` date, or are they lost? Recommend: lost, with a hidden `previously_in: 'current'` audit field if the sibling storage task adds a StackEvent log. For now: clean slate on each move.
- **Mobile breakpoint.** 768px is the conventional tablet/phone split. The two-up mode is narrow enough that 640px might also be too tight — confirm with real device testing.
- **Undo depth.** 10 operations feels right for editorial flow. More risks confusing the user about what state they're in.
- **Save-on-drag vs save-on-explicit-button.** Recommend explicit-button-only (current pattern), with the dirty-state banner. Save-on-drag is noisier and harder to undo cleanly.
- **What about Tool-detail enrichment in the cards?** Today each card shows tool name + zinger. Should the redesigned version surface logo, category tags, link to `/tools/<slug>` for the full profile? Recommend: yes for the logo and zinger (improves scannability), no for full enrichment (visual noise in the editor).

## 8. References

- [[Migrate-Participant-Stacks-from-Markdown-to-Turso-with-Materialization]] — sibling task. Composes well — UI feels snappier against Turso saves (sub-second) than against GitHub App commits (30–90s). But the UX redesign can ship against the existing markdown backend.
- [[Maintain-an-Interactive-Polling-System--v2]] §11 (UI component contract) and §12 (GSAP usage rules) — same disciplines apply: theme tokens only, `prefers-reduced-motion` collapses animations, the redesigned StackBuilder gets a slot on the site's `/design-system` page
- `src/components/stack/StackBuilder.svelte` — the current single-column editor this task supersedes
- `commit b42ef4f` — the original "feat(stacks): write path — Svelte editor + GitHub App bot" commit
- [svelte-dnd-action](https://github.com/isaacHagoel/svelte-dnd-action) — the drag-and-drop library
