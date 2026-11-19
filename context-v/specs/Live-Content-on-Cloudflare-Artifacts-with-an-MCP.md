---
title: "Live Content on Cloudflare Artifacts, Wrapped in an MCP"
lede: "Published memos, decks and other site content live in Cloudflare Artifacts repos, one per deal. An MCP lets people and agents read, iterate on and publish that content, and the site renders whatever is on main."
date_created: 2026-11-17
date_modified: 2026-11-17
authors:
  - Michael Staton
augmented_with:
  - "Claude Code on Opus 5.5"
semantic_version: 0.0.1.0
publish: false
tags:
  - Spec
  - Cloudflare-Artifacts
  - MCP
  - Investment-Memos
  - Content-Pipeline
status: Draft
---

# Live Content on Cloudflare Artifacts, Wrapped in an MCP

## Why Care?

The business goal for humain-web, and for Astro Knots sites generally, is that the people who own the content can **interact with it, iterate on it and publish it** to their website without touching a site repo. Deal memos need this most. Decks come next.

Today a memo crosses two repos to reach the site. memopop writes it into `io/humain` (`lossless-group/humain`), and `humain-web/scripts/pull-memos.sh` copies it into `humain-web/src/content/memos/`. A change means a rerun, a copy, a commit and a deploy. GitHub storage and the GitHub content API both have caps, and the gate plan ([[Gate-Investment-Memos-Behind-LP-Access]]) would add a third dependency: a `GITHUB_CONTENT_TOKEN` that the site uses to read `lossless-group/humain` at request time.

Cloudflare Artifacts is Git hosting built for agents: unlimited repos, each with its own remote, history and short-lived tokens. That makes it a natural store for content that people and agents both write.

## Goals

1. **One live source per deal.** Each deal's published content lives in one Artifacts repo. `main` is what the site shows.
2. **An MCP for people and agents.** Claude (web, desktop, phone) and Claude Code can read, propose edits, compare versions and publish.
3. **Publishing without a rebuild.** Moving a change to `main` makes it live on the site.
4. **The same pattern for every Astro Knots site.** humain-web memos are the first adopter. Decks and other firms' sites reuse the Worker with their own namespace.
5. **Retire the two-repo flow.** `io/humain` and `humain-web/src/content/memos` become legacy once the site reads from Artifacts.

## Non-goals (v1)

- **Moving datarooms or pipeline inputs.** They stay where they are (see *What goes in a repo*).
- **An editing UI on the site.** Editing happens through the MCP. A web editor can come later on the same Worker.
- **Replacing memopop's working directory.** memopop keeps writing locally and publishes into Artifacts.

## Storage: the caps, and what goes in a repo

Artifacts is not uncapped. It allows **1 GB per repo** (repos created on or after 2026-09-29) and **1 TB per account** (raisable). The number of repos is unlimited. So the design is **one repo per deal, holding published content only**, sized by the conventions we already have.

Measured on 2026-11-17:

| What | Size |
|---|---|
| Largest published memo with images (`humain-web/src/content/memos/metabologic`) | 3.4 MB |
| Smallest (`impulse-labs`, `reactosome`) | 92 KB |
| All of `io/humain` | 3.2 GB |
| `io/humain/deals/New-Silicon` alone (dataroom, decks, exports) | 857 MB |
| Files over 5 MB in `io/humain` | 66 PDF, 13 PPTX, 11 ZIP, 5 MP4, 5 HTML |

Published content fits in a repo with room to spare. The inputs don't, and don't need to.

**Goes in the deal repo:**

- The memo's markdown, sanitized as the gate plan describes (no `file://` links, no `<needs-source>` tags, no hand-written table of contents).
- Images, prepared per the **`prep-images-for-embed`** skill: JPEG (never WebP), long edge capped at 1600 px, metadata stripped, orientation baked in, with alt text and Train-Case names. Charts and diagrams that need detail can be raised with `--width`.
- Deck slides as images prepared the same way. A deck PDF only if it is built per the **`setup-new-firm`** convention (`magick -resize 1920x -quality 85 -compress JPEG`), which takes about 150 MB of screenshots down to about 10 MB.
- The DDQ and other short text documents.
- `meta.yaml` per piece of content (see *Repo layout*).

**Stays out:**

- Datarooms, source PDFs, PPTX, ZIP and video. They stay in `io/<firm>` for now and move to R2 later if they need a home off GitHub.
- Self-contained HTML exports with images embedded in base64. The CogSciAI one is 5.1 MB and the site renders from markdown anyway. The PDF export may go in only if it's under 5 MB.
- Pipeline intermediates (research files, section drafts, validation JSON).

**Enforced in code, not left to instructions.** The MCP's write tools and memopop's publish step both reject a file that breaks these rules. A JPEG wider than the cap, any WebP or PNG over 500 KB, any file over 5 MB, and any extension outside the allowed list are refused with a message that names the skill to run. An agent can't talk its way past a check in the Worker.

## Account and namespaces

- **Account: Lossless** (decided 2026-11-17). Before anything runs, the Lossless Cloudflare token needs **Artifacts → Read** and **Artifacts → Edit**. As of 2026-10-25 it had neither, which shows up as `{"code":10000,"message":"Authentication error"}` (see `cloudflare-artifacts-interface` § Gotchas). Prefer an account-owned token (`cfat_…`) over a personal one. Confirm the account is on Workers Paid.
- **One namespace per firm or site**: `humain-content` (created 2026-11-17). Later ones follow the pattern `<site>-content`.
- **No jurisdiction for now.** A jurisdiction is permanent per namespace. If a firm needs data residency, it gets a new namespace created explicitly with one.
- Record the account, namespaces and the env var names (never their values) in `cloudflare-artifacts-interface/config/private.json`.

## Repo layout

**Name:** `deal-<slug>`, using the humain-web slug (`deal-cognitive-scientific`, `deal-new-silicon`). Portfolio companies and pipeline deals use the same prefix. Their status lives in `meta.yaml`, not in the name.

```
README.md              ← what this repo is; agents read it first
memo/
  memo.md              ← the published memo (frontmatter as in the gate plan)
  meta.yaml            ← version, memo_date, validation_score, is_finalized, source_path, scope
  images/              ← prepared per prep-images-for-embed
deck/                  ← optional: slides as images, or a compressed PDF
ddq/                   ← optional: due diligence questionnaire
notes/                 ← optional: dated updates, append-only
```

- **`main` is published.** The site renders only `main`.
- **Edits happen on branches** (`edit/<who>-<date>-<topic>`). Publishing fast-forwards `main`.
- **Every memopop version is a commit** tagged `memo-v0.0.3` and so on, so a version is a ref, not a folder.
- **Provenance in git notes:** the memopop run ID, the outline and the validation score are attached to the commit, as `cloudflare-artifacts-interface` § F describes.
- **Scope travels with the content.** `meta.yaml` carries the gate scope (`memo:<slug>`), so the site and the MCP check the same field.

## The MCP

**A new Worker, built for this.** It's not forked from event-hog. It's a Cloudflare Worker serving remote MCP over HTTP. Writes clone into memory with isomorphic-git, commit under the caller's name and push, retrying from a fresh clone on conflict. The in-memory filesystem needs `readlink`, `symlink` and Node-style error codes, which Cloudflare's example lacks (`cloudflare-artifacts-interface` § Gotchas). A Worker binding (`env.ARTIFACTS`, one per namespace) means no Cloudflare token in code.

**Location:** `astro-knots/mcps/artifacts-content-mcp/` (the name is a placeholder). It sits beside `astro-knots-mcp` because it serves every Astro Knots site, not just Humain.

**Tools:**

| Tool | Tier | What it does |
|---|---|---|
| `read_me` | read | The namespace's rules and its list of deals. Agents call it first |
| `list_deals` | read | Repos in the namespace, with status, the latest memo version and the last publish |
| `read_memo` | read | The memo at `main`, or at a branch or tag |
| `history` | read | Commits and tags for a deal, with notes |
| `diff` | read | A branch against `main`, or one version against another |
| `propose_edit` | write | Writes a change to a branch under the caller's name. Never to `main` |
| `add_note` | write | Appends a dated note in `notes/`. Append-only |
| `comment` | write | Leaves a comment on a section, stored as a file on the branch |
| `add_image` | write | Takes an image, refuses it unless it meets the size rules, and commits it |
| `publish` | confirm | Fast-forwards `main` to a branch. Needs `confirm: true` after the caller has seen the diff |
| `unpublish` | confirm | Reverts `main` to the previous tag |
| `get_skill` | read | Serves the bundled skills (`prep-images-for-embed`, `thesis-bleed-cleanup`, `manage-memo-citations`) so any client gets the same rules |

**Rules in code:** no write to `main` except `publish`, no force-push, no deletes through the MCP, the size and format checks above, and a scope check on every read.

**Sign-in:** real sign-in from v1, using Cloudflare's `workers-oauth-provider`, not a secret URL. The home-connector guide says to use OAuth once anyone besides the owner uses a connector. Partners will edit memos, and LP-gated content can't rest on a forwardable link. Each caller maps to an identity with scopes, so commits carry a real author. This is a candidate for `id-didi-sh` ([[Id-Didi-Sh-Identity-Service]]) once it's live.

## Publishing from memopop

A new step, `cli/publish_to_artifacts.py`, replaces `pull-memos.sh` and step 1 of the gate plan:

1. Choose the version: latest finalized, else latest, by semver. Record which rule applied.
2. Sanitize per the gate plan.
3. Prepare images with `prep-images-for-embed`'s pipeline (resize, JPEG, strip metadata), but write them into the repo rather than uploading them to ImageKit.
4. Check against the size rules. Refuse and list what failed.
5. Clone the deal repo (create it if it's missing; that's tier 1), write to `edit/memopop-<version>`, commit, tag and push with a short-lived write token.
6. Print the diff against `main`. **A person publishes** through the MCP's `publish` or a `--publish` flag after review. memopop never publishes on its own.

Token handling follows the skill: header-form auth, never a token in `.git/config`, and TTLs of hours, not days.

## The site

humain-web's memo route (`/portfolio/<slug>/memo`, server-rendered and gated per the gate plan) reads `memo/memo.md` from `main` at request time:

- **On Vercel (today):** the REST file route (`GET …/repos/deal-<slug>/file?ref=main&path=memo/memo.md`) with a read-only Cloudflare API token held as a Vercel env var. Cache a few minutes. This replaces `GITHUB_CONTENT_TOKEN`.
- **On Cloudflare (if humain-web moves):** the Worker binding. No token at all.
- **Images:** served through a site route that proxies the repo's `raw` route, with long cache headers since filenames are versioned. A sharper option is to let ImageKit fetch from that route as an origin, so readers get WebP with a JPEG fallback without another upload. Decide on the first build.
- **Public pages** (portfolio cards, decks without a gate) can keep syncing at build time, as the team-bios spec's V2 proposes, if request-time reads turn out to cost too many operations.

**Cost check:** a read is one billed operation. With 10,000 included a month and $0.15 per 1,000 after that, a few minutes of caching keeps an LP-gated memo site well inside the free tier.

## Migration

1. **Account:** add Artifacts permissions to the Lossless token and verify on `/accounts/$ACCOUNT_ID/tokens/verify`. List namespaces.
2. **Pilot one deal:** `deal-cognitive-scientific`. Publish CogSciAI v0.0.3.1 through the new step. Check the repo size against the limits.
3. **Build the MCP** with the read tools first, then `propose_edit` and `publish`.
4. **Switch the memo route** to Artifacts for the pilot deal behind a flag, then for all deals.
5. **Backfill** the other seven memos in `humain-web/src/content/memos/`, plus New Silicon.
6. **Retire** `pull-memos.sh` and `src/content/memos/`. `io/humain` stays as memopop's working directory and the home for datarooms until they move to R2.
7. **Second adopter:** decks (`dididecks-ai`, `humain-vc-decks`) on the same Worker, with a `deck/` folder or their own repos.

## Open questions

- [ ] **One repo per deal, or per deal per content type?** Per deal keeps the memo, deck and DDQ together and is the default here. Split only if a deck grows past a few hundred MB.
- [ ] **Where do datarooms go?** R2 (cheap, no history) or leave them in GitHub with LFS? Out of scope for v1, but it decides when `io/humain` can retire.
- [ ] **Branch-per-edit vs fork-per-session** for partner edits. Branches are simpler, and forks isolate better. Start with branches.
- [ ] **Comments:** files on the branch, or a D1 table beside the repo? Files first.
- [ ] **Decile Hub link:** should `publish` also attach the memo PDF to the deal memo in Decile Hub, as was done by hand for New Silicon and CogSciAI? That would make the MCP the one place to publish.
- [ ] **Untested operations:** fork, import, delete and token revocation were untested as of 2026-10-25. Test them on the pilot repo before relying on them.

## Related

- `context-v/agent-skills/cloudflare-artifacts-interface/` (anchor root): credentials, tiers, tokens, limits
- `context-v/agent-skills/prep-images-for-embed/` (anchor root): the image size and format rules this spec enforces
- `ai-labs/memopop-ai/apps/memopop-orchestrator/context-v/agent-skills/setup-new-firm/` § deck capture: the deck PDF compression recipe
- `fullstack-vc` guide `home-connector-on-cloudflare-artifacts`: the minimal version of the pattern
- [[Gate-Investment-Memos-Behind-LP-Access]] (humain-web): sanitizing, scopes and the gated route
- [[Team-Bios-CVs-Q&As]] § V2 (humain-web): the same move for partner profiles
- [[Astro-Knots-MCP-and-Plugins-First-Release]] (astro-knots-mcp): Artifacts as the recommended store for agent-written content
- [[Exploring-an-MCP-so-Anyone-can-be-an-Astro-Knot]] (astro-knots-mcp): the longer-range version, where the MCP also builds and deploys
