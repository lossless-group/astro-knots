---
site_uuid: 7d7d1ff2-d0c6-4c8a-b774-12f14c7473d7
hex_code: eqk3ea
title: "Propagate an LFM Release Across Sites"
lede: "A published @lossless-group/lfm version is not shipped until every consuming site is on it and still renders. This is the per-site cadence — bump, build, drive, changelog, commit, push submodule — run one site at a time so a bad release is caught on the first, not the fourth."
date_created: 2026-09-08
date_modified: 2026-09-08
date_authored_initial_draft: 2026-09-08
date_authored_current_draft: 2026-09-08
publish: true
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Opus 5 (1M context)
semantic_version: 0.0.1.0
status: Unproven
proven_on: "Not yet run end to end. Authored immediately after publishing 0.6.0 to JSR, with lossless-toolkit-site as the intended first subject."
tags:
  - Loop
  - Astro-Knots
  - LFM
  - Dependency-Management
  - Browser-Drive
  - Site-Maintenance
---

# Propagate an LFM Release Across Sites

> `context-v/loops/` is **experimental** per the context-vigilance skill. This
> one is `Unproven` — it has not been run end to end. Treat the cadence as a
> proposal and correct it in place on the first real run.

Publishing to JSR is the *start* of a release, not the end. A version nothing
installs has shipped nothing, and the consuming sites are where a regression
actually shows up — LFM has no site of its own to break.

Sibling loop: [[Dependency-Upgrade-Loop]] sweeps *all* dependencies across all
sites. This one is narrower and different in kind — a single package whose
output is **rendered HTML**, so the verification rung is a browser drive rather
than a green build.

## The standing state

Where the fleet is, as of 2026-09-08 (LFM latest on JSR: **0.6.0**):

| Site | Pinned at | Notes |
|---|---|---|
| `lossless-toolkit-site` | `file:` local path | **Must move to a registry range before it can deploy at all** |
| `mpstaton-site` | `0.5.1` | Carries a 136-line hand-rolled wikilink resolver + `scripts/wikilink-rules.ts` that 0.6.0's `createPathResolver` is meant to replace |
| `lossless-changelog` | `0.5.1` | |
| `fullstack-vc` | `^0.5.0` | |
| `twf_site` | `^0.3.0` | Furthest behind; expect the most drift |

Re-derive this table rather than trusting it:

```bash
cd astro-knots
for f in sites/*/package.json; do
  v=$(grep -o '"@lossless-group/lfm": *"[^"]*"' "$f" | sed 's/.*: *//')
  [ -n "$v" ] && printf "%-24s %s\n" "$(basename $(dirname $f))" "$v"
done
```

## Order, and why it matters

**One site at a time, and the riskiest first.** A release that breaks rendering
should be found on site one. Do not fan out — parallel bumps across submodules
produce four dirty repos and no clear culprit.

1. `lossless-toolkit-site` — the release's first real consumer and the reason
   0.6.0 exists. It also has the newest drives, so it fails loudest.
2. `mpstaton-site` — the migration with actual code to delete.
3. `lossless-changelog`, then `fullstack-vc`, then `twf_site`.

## Per-site cadence

Run all seven steps for one site before starting the next.

### 1. Bump

```bash
cd sites/<site>
pnpm add @lossless-group/lfm@npm:@jsr/lossless-group__lfm@<version>
```

Sites install from **JSR via the npm compatibility specifier**, which is why the
value looks like `npm:@jsr/lossless-group__lfm@0.6.0`. A bare
`@lossless-group/lfm@0.6.0` resolves against GitHub Packages and needs a
`read:packages` token most machines do not have.

**Never `workspace:*`, never `file:`.** Both break independent deployment, which
is the one hard constraint in this tree. If a site is on a `file:` path, moving
it to a range is the whole point of its turn in this loop.

### 2. Build

```bash
pnpm build
```

Necessary, nowhere near sufficient. See step 4.

### 3. Diff the rendered output

The failure mode for a markdown pipeline is silent: the build succeeds and the
HTML is subtly different. Capture before and after.

```bash
# before bumping
find dist -name '*.html' | sort | xargs cat | md5sum > /tmp/<site>-before.md5
# after
find dist -name '*.html' | sort | xargs cat | md5sum > /tmp/<site>-after.md5
```

A changed hash is not a failure — 0.6.0 *should* change output where wikilinks
now resolve. It is a prompt to look at what changed and confirm you meant it.
Useful greps: literal `[[` surviving into output, `href=""`, and anchors whose
target has no page.

### 4. Drive a browser

**This is the rung that matters.** Every defect in the toolkit spike session —
a component that never hydrated, an effect loop that blanked a component, a
chip that was a `<span>` inside an `<a>` — passed `pnpm build` and passed
`curl`, and was one page load from obvious.

```bash
pnpm preview --port 4322 &
node tests/browser-drive.mjs http://localhost:4322 "<site>"
```

NixOS: Playwright's bundled Chromium will not start. Point `executablePath` at
`/run/current-system/sw/bin/brave`. (Same class of problem as the `jsr` CLI's
bundled deno — assume any vendored binary needs this treatment here.)

If a site has **no drive**, write the minimal one before bumping it. A site
whose markdown rendering nobody has looked at is not verified by its build.

### 5. Delete what the release replaced

A version bump that leaves the superseded code in place has not migrated
anything. For 0.6.0 specifically: `mpstaton-site`'s
`src/lib/remark-lossless-wikilinks-local.ts` and `scripts/wikilink-rules.ts`
exist to do what `createPathResolver` now does, and the file's own header calls
itself "a v0.5.x stopgap" that "goes away" when the package ships it.

### 6. Changelog

One entry per site, in that site's own `changelog/`, per
[[changelog-conventions]]. What rendered differently is the story — "bumped a
dependency" is not.

### 7. Commit and push the submodule

Commit **inside** the submodule, never from the parent. Then update the parent's
pointer:

```bash
cd sites/<site> && git add -A && git commit && git push origin <branch>
cd ../.. && git add sites/<site> && git commit -m "Update <site> submodule reference"
```

## Exit conditions

Done when every site in the table installs the same registry range, builds,
passes its drive, and has a changelog entry. Explicitly *not* done when the
builds pass but no browser has loaded a page.

## Known traps

- **`file:` and `workspace:*` deps** break independent deployment. They are the
  reason a site builds locally and fails on Vercel.
- **A site with no drive** gives you false confidence. Write one first.
- **Parallel submodule work** produces four dirty repos and no clear culprit.
- **The `route`-tier gap in 0.6.0:** a site publishing a *subset* of the vault
  can emit confident links to pages that do not exist, because the `route` tier
  fires even when omitted from `cascade`. `lossless-toolkit-site` works around
  it by rejecting `via === 'route'` when an index was supplied. Any site
  adopting `paths` needs the same guard until the package grows a config field
  for it.

## Related

- [[Dependency-Upgrade-Loop]] — the broad all-dependencies sweep
- [[changelog-conventions]], [[git-conventions]], [[pseudomonorepos]]
- `lfm/context-v/Maintain-Path-Resolution-for-Wikilinks.md` — the 0.6.0 design record
