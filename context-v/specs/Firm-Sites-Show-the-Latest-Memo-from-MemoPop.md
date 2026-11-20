---
title: "Firm Sites Show the Latest Memo from MemoPop"
lede: "A VC firm's partners edit a memo by chatting with Claude, compile it, refresh the memo's page in the firm's investor area, and see their change. The page reads the latest compiled memo from MemoPop's server at request time instead of a copy pulled into the site repo."
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
  - Content-Pipeline
status: Draft
site_uuid: eeed21eb-63f8-4459-86d1-a9ba492c5aab
hex_code: uscir1
---

# Firm Sites Show the Latest Memo from MemoPop

> The general pattern for any Astro Knots site that shows a VC firm's investment memos. The first site to build it keeps a specific spec in its own private repo.

## Why

A VC firm's partners edit memos by chatting with Claude through MemoPop's connector (`https://memopop.didi.sh/mcp`). They will only trust that it works if they can see the result where the memo lives: the firm's gated investor area.

The usual starting point doesn't allow that. Memos reach the site by hand:

- A script copies a hand-picked local memo version for each portfolio company or deal opportunity into the site's `src/content/memos/<slug>/memo.md`.
- The site bundles those files at build time and renders them on a gated, server-rendered route such as `/lp/memos/[slug]`.

A partner's edit on MemoPop's server never reaches that page. Showing it would take a pull, a commit and a deploy.

This pattern closes that gap. The site reads straight from MemoPop's server, and storage stays an implementation detail. It narrows the "how the site reads published memos" part of [[Live-Content-on-Cloudflare-Artifacts-with-an-MCP]].

## What a partner experiences

1. In Claude, a partner asks for a change to a memo. Claude routes it to the research file or the section ([[MemoPop-Connector-API]], Plan 9).
2. Claude compiles the memo when the changes are done. The connector's reply says the new version is live and gives the page's URL.
3. The partner refreshes the page. The new text is there, and the page shows the version number and when it was compiled.

## Where the memo is on the server

- Each firm on MemoPop is named by its didi.sh entity slug and lives at `/data/firms/<firm>/`.
- `compile` writes the assembled memo to `/data/firms/<firm>/deals/<deal>/compiled/<version>/memo.md` and records the version in the deal's `deal.json`.
- Exports (HTML, PDF) go to the firm's bucket under `compiled/<deal>/<version>/`.
- Only `compile` produces a memo a site can show. Edits to research or sections show up after the next compile, which needs no model and runs on the server.

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
- **Auth: a per-firm site key**, sent as `Authorization: Bearer <key>` and configured in a new variable `MEMOPOP_SITE_KEYS` (`<firm>=<key>`, comma-separated). A site key can read that firm's compiled memos and nothing else. It is separate from `MEMOPOP_STATIC_KEYS`, which are full-access keys for Claude Code and the health check.
- **No server-side caching.** The file is small and read from local disk.
- Lives in `memopop-orchestrator/src/connector/`, mounted beside `/mcp` in `serve.py`, with tests beside the existing connector tests.

### 2. The site reads it at request time

- **A mapping file**, `src/content/memo-sources.yaml`, lists each site memo and its MemoPop deal. The site keeps its own slugs, so URLs don't change:

  ```yaml
  portfolio-company:  { firm: <firm>, deal: portfoliocompany-com }
  deal-opportunity:   { firm: <firm>, deal: dealopportunity-ai }
  ```

  MemoPop names a deal by the company's domain (`portfoliocompany.com` becomes `portfoliocompany-com`). The firm's local deal configs should record that name in a `memopop_deal` field, so the two never have to be guessed.
- **The memo loader** fetches from the endpoint when the slug is in the mapping and keeps its existing return shape: the version becomes the compiled version, and the date becomes the compile time.
- **Fallback.** If the fetch fails or takes more than about 3 seconds, the page renders the bundled copy, if one exists, and says it's a saved copy. A MemoPop outage never takes the investor area down.
- **No caching.** The memo route sets `Cache-Control: private, no-store`, so a refresh always shows the newest compile.
- **Secrets.** `MEMOPOP_SITE_KEY` and `MEMOPOP_URL` are environment variables on the site's host, never in the repo.
- **The index page** keeps listing memos from the mapping. It doesn't fetch every memo to draw the list.

### 3. The compile reply links to the page

When `compile` finishes for a firm with a site, its reply includes the page URL. The firm's `firm.json` holds a `site_memo_url` template (with `{slug}`) and the deal-to-slug map, and Claude passes the link to the partner.

## Phases

1. **Endpoint**, with tests: the right key gets the memo, a wrong firm or a missing key gets 401 or 404, and a deal never compiled gets 404.
2. **One memo end to end** on a preview deploy, using a deal that already has a compiled version.
3. **Prove the loop in a browser:** open the gated memo page → note the version → in Claude, change one sentence and compile → refresh → the sentence and the version have changed.
4. **The rest of the firm's memos**, each checked against its bundled copy for version drift, then the link in the compile reply.

## Out of scope

- Public pages. Memos stay behind the investor-area gate.
- A live preview of uncompiled sections. Compile is the publish step.
- Cloudflare Artifacts, a shared content repo per firm, and keeping a firm's local folder in sync with the server.
- Retiring the pull script. It keeps supplying fallback copies until a site has proven the pattern.

## Open questions

- **Images.** Do compiled memos on the server reference images, and how: bucket keys, workspace paths, or not yet? The image part of the endpoint depends on this.
- **Version drift.** A site's bundled copies may be newer or older than the server's compiled memo. Compare before switching each memo over.
- **Deals without a page.** Adding a deal to the investor area stays a site change (a listing plus a line in the mapping) until the memo list can come from MemoPop too.

## Related

- [[MemoPop-Connector-API]]: the connector, Plan 8 (revisions) and Plan 9 (where an edit goes)
- [[Live-Content-on-Cloudflare-Artifacts-with-an-MCP]]: the earlier design this narrows
