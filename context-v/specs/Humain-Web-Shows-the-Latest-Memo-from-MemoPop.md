---
title: "humain-web Shows the Latest Memo from MemoPop"
lede: "Partners edit a memo by chatting with Claude, compile it, refresh the investor-area page, and see their change. The page reads the latest compiled memo from MemoPop's server at request time instead of a copy pulled into the site repo."
date_created: 2026-11-20
date_modified: 2026-11-20
authors:
  - Michael Staton
augmented_with:
  - "Claude Code on Opus 5.5"
semantic_version: 0.0.1.0
publish: false
tags:
  - Spec
  - Investment-Memos
  - Memopop
  - Humain
  - Content-Pipeline
status: Draft
site_uuid: eeed21eb-63f8-4459-86d1-a9ba492c5aab
hex_code: uscir1
---

# humain-web Shows the Latest Memo from MemoPop

## Why

Humain's partners will edit memos by chatting with Claude through MemoPop's connector (`https://memopop.didi.sh/mcp`). They will only trust that it works if they can see the result where the memo lives: the investor area of humain.vc.

Today they can't. A memo reaches the site by hand:

- `humain-web/scripts/pull-memos.sh` copies a hand-picked local version for each company (for example `io/humain/deals/<Company>/outputs/<Company>-v0.0.1/7-<Company>-v0.0.1.md`) into `src/content/memos/<slug>/memo.md`.
- `src/lib/lp-content.ts` loads those files with `import.meta.glob`, so they are bundled at build time.
- `src/pages/lp/memos/[slug].astro` renders them behind the LP gate (`prerender = false`, `hasScope`).

A partner's edit on MemoPop's server never reaches that page. Showing it would take a pull, a commit and a deploy.

This spec is the spike that closes that gap. It replaces the "how humain-web reads published memos" part of [[Live-Content-on-Cloudflare-Artifacts-with-an-MCP]] for now: the site reads straight from MemoPop's server, and storage stays an implementation detail.

## What the partner experiences

1. In Claude, a partner asks for a change to a memo. Claude routes it to the research file or the section ([[MemoPop-Connector-API]], Plan 9).
2. Claude compiles the memo when the changes are done. The connector's reply says the new version is live on the site and gives the page's URL.
3. The partner opens or refreshes `humain.vc/lp/memos/<slug>`. The page shows the new text, and its details strip shows the version number and when it was compiled, so the partner can tell it's the new one.

## Where the memo is on the server

- `compile` writes the assembled memo to `/data/firms/humain-vc/deals/<deal>/compiled/<version>/memo.md` and records the version in the deal's state (`deal.json`).
- Exports (HTML, PDF) go to the firm's bucket under `compiled/<deal>/<version>/`.
- Only `compile` produces a memo the site can show. Edits to research or sections show up after the next compile, which needs no model and runs on the server.

## Design

### 1. A read endpoint on MemoPop's connector

The connector serves only `/mcp` (OAuth) and `/healthz` today. Add one read-only route:

```
GET /site/v1/firms/{firm}/deals/{deal}/memo
  200 → { "deal", "version", "compiled_at", "markdown" }
  404 → no compiled memo yet
GET /site/v1/firms/{firm}/deals/{deal}/memo/images/{file}
  200 → image bytes (if compiled memos reference images; see Open questions)
```

- **Returns the latest compiled version only.** Never research, sections or anything in progress.
- **Auth: a per-firm site key**, sent as `Authorization: Bearer <key>`, set in a new variable `MEMOPOP_SITE_KEYS` (`humain-vc=<key>`). A site key can read that firm's compiled memos and nothing else. It is separate from `MEMOPOP_STATIC_KEYS`, which are full-access keys for Claude Code and the health check.
- **No caching on the server side.** The file is small and read from local disk.
- Lives in `memopop-orchestrator/src/connector/`, mounted beside `/mcp` in `serve.py`, with tests beside the existing connector tests.

### 2. humain-web reads it at request time

- **A small mapping file**, `src/content/memo-sources.yaml`, lists each site memo and its MemoPop deal:

  ```yaml
  portfolio-company:  { firm: humain-vc, deal: portfoliocompany-com }
  deal-opportunity:   { firm: humain-vc, deal: dealopportunity-ai }
  ```

  The site's own slugs (`portfolio-company`) stay as they are, so URLs don't change. The MemoPop names match the `memopop_deal` field recorded in each local deal config in `io/humain`.
- **`getMemo(slug)` in `src/lib/lp-content.ts`** fetches from the endpoint when the slug has a MemoPop source, and keeps the rest of its contract: frontmatter-style meta (`memo_version`, `memo_date`) plus the body. `memo_version` becomes the compiled version number and `memo_date` the compile time.
- **Fallback:** if the fetch fails or times out (about 3 s), the page renders the bundled copy from `src/content/memos/` if there is one, and the details strip says it is showing a saved copy. A MemoPop outage never takes the investor area down.
- **No caching on the site side.** The route already runs per request behind the gate. Set `Cache-Control: private, no-store` so a refresh always shows the newest compile.
- **Secrets:** `MEMOPOP_SITE_KEY` and `MEMOPOP_URL` as Vercel environment variables for humain-web, never in the repo.
- The LP index (`src/pages/lp/index.astro`, via `listMemos()`) keeps listing memos from the mapping file. It doesn't need to fetch every memo to draw the list.

### 3. The connector tells partners where to look

When `compile` finishes for a firm that has a site, its reply includes the page URL (`https://www.humain.vc/lp/memos/<slug>`). The URL comes from the same mapping, held on the server as a per-firm setting (for example `site_memo_url` in `firm.json`, with `{slug}` filled in per deal). Claude then tells the partner where to check.

## Phases

1. **Endpoint.** The `/site/v1/...` route, the `MEMOPOP_SITE_KEYS` variable and tests: right key gets the memo, wrong firm or missing key gets 401/404, a deal never compiled gets 404.
2. **One memo end to end.** Add `memo-sources.yaml` with a single deal that is already compiled on the server, make `getMemo` fetch it with the fallback, and deploy a humain-web preview.
3. **Prove the loop.** Edit that memo through the connector in Claude, compile, and refresh the preview page. The click path is: sign in to the LP area → open `/lp/memos/<slug>` → note the version → in Claude, change one sentence and compile → refresh → the sentence and the version number have changed.
4. **The rest.** Add the other memos to the mapping, then the compile reply's page URL.

## Out of scope

- Public pages. Memos stay behind the LP gate.
- A live preview of uncompiled sections. Compile is the publish step.
- Cloudflare Artifacts, a shared `humain-fs` repo, and keeping `io/humain` in sync with the server. Those can come later. They aren't needed for partners to see their edits.
- Retiring `pull-memos.sh`. It stays as the source of the fallback copies until the spike proves out.

## Open questions

- **Images.** Several site memos carry images (the largest is 3.4 MB with them). How do compiled memos on the server reference images: bucket keys, paths in the workspace, or none yet? The image route above depends on the answer. The site's existing gated image route (`/lp/memos/<slug>/images/<file>`) can proxy them either way.
- **Which deals are compiled on the server.** The deals imported on 2026-10-15 came from local runs. Check which have a `compiled/` version before choosing the deal for phase 2.
- **Version drift.** The site's bundled copies were pulled by hand on 2026-10-13. Some may be newer or older than what the server holds. Compare before switching each memo over, so nobody sees an older memo replace a newer one.
- **Deals without a site page.** Several deal opportunities on the server aren't in the investor area yet. Adding a page for a new deal stays a site change, adding a line to the mapping, until the memo list can come from MemoPop too.

## Related

- [[MemoPop-Connector-API]]: the connector, Plan 8 (revisions) and Plan 9 (where an edit goes)
- [[Live-Content-on-Cloudflare-Artifacts-with-an-MCP]]: the earlier design this narrows
- [[Gate-Investment-Memos-Behind-LP-Access]]: the LP gate the memo route sits behind
- `context-v/handoffs/On-the-Way-to-Collaboration-Around-Cloudflare-Artifacts.md` at the anchor root
