# Rolled-up content (synced)

This directory contains markdown files **synced from each site submodule's
`changelog/` and `context-v/`** via the GitHub Content API. Do not edit
files here directly — edits will be wiped on the next sync.

To refresh:

```bash
pnpm rollup:sync
git add src/rollup
git commit -m "sync(rollup): refresh from <reason>"
```

Last sync: 2026-08-17 — 74 changelog files, 41 context-v files.
