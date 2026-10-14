---
title: "Maintain Base Engagement Analytics"
lede: "Page views say someone arrived. Time on page, scroll depth and downloads say whether they read it. One definition of each, for every site."
publish: true
date_created: 2026-10-14
date_modified: 2026-10-14
date_authored_initial_draft: 2026-10-14
date_authored_current_draft: 2026-10-14
date_authored_final_draft:
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5 (1M context)
at_semantic_version: 0.0.1.0
status: Draft
summary: >-
  Defines the base engagement metrics every Astro Knots site measures (page
  views, engaged time on page, scroll depth, sections reached, read-complete,
  downloads, outbound clicks, time on site) precisely enough that two sites
  produce comparable numbers. One small client tracker emits a fixed event
  taxonomy to sinks: OpenPanel for public pages (per the openpanel-analytics
  skill) and a first-party, session-verified endpoint for gated areas, where
  reading data is named and confidential. Builds on the PageView/Action layer of
  Maintain-Confidential-Access-with-Persistent-Sessions-and-Auth-Telemetry and
  the event names in the anchor's Implement-Deeper-Analytics-Tracking prompt;
  composes with Maintain-Privacy-Gates-in-Three-Modes (identity comes from the
  gate, including the name-the-reader layer). humain-web's investor area is the
  first intended implementation.
site_uuid: ba2bcc90-40d8-4f30-af2f-017089ec6c42
hex_code: b2kobk
tags:
  - Blueprint
  - Analytics
  - Engagement-Metrics
  - OpenPanel
  - Privacy-Gates
  - Reading-Telemetry
  - Cross-Site-Pattern
---

# Maintain Base Engagement Analytics

## Why Care?

A page view tells you someone arrived. It doesn't tell you whether they read the
memo, gave up after the summary, or left the tab open overnight. The questions a
firm actually asks are about attention: *Did the LPs read the Q3 letter? How far
into the Chroma memo did they get? Did anyone download the deck?*

Those questions need a handful of numbers defined carefully. "Time on page" in
most analytics tools is the gap between two page views, which is zero for the last
page of every visit and hours for a tab left open. Scroll depth means nothing
without saying whether the footer counts. This blueprint fixes one definition for
each metric so every site measures the same thing, and splits **where** the data
goes by whether the page is public or gated.

## Start here: any data beats none

This isn't a research instrument. The goal is to stop guessing, and a rough number
that exists beats a precise one that's still being designed. Ship the first column
in an afternoon; adopt the rest only when someone asks a question it would answer.

| | Day one (do this) | Later, if anyone asks |
|---|---|---|
| Page views | OpenPanel on public pages; one log line per gated request in the middleware | A queryable store |
| Time on page | One `page-engaged` event on leave, with visible-tab time | The 30-second activity rule, caps |
| Scroll | `max_scroll_pct` on that same event | 25/50/75/100 milestones, sections reached |
| Downloads | Log the file in the route that serves it | Click tracking for public files |
| Time on site | Whatever OpenPanel shows | Summing engaged time per session |
| Report | Read the log or the OpenPanel dashboard | The script or admin page below |

Day one is: the OpenPanel component, a ~40-line tracker that sends **one event per
page view** (`page-engaged` with time and furthest scroll), a `console.info` per
gated page view and download, and `log` as the sink. Vercel keeps the logs; grep
them. Everything after this section is how to sharpen those numbers when a
decision depends on them, not a prerequisite.

## Where this sits

| Doc | What it covers | This blueprint adds |
|---|---|---|
| `openpanel-analytics` skill | OpenPanel on every site: the component, the client ID, supported domains | Custom events on top of its page views |
| `context-v/prompts/Implement-Deeper-Analytics-Tracking.md` (anchor root) | Event names: `cta-primary`, `outbound-click`, `download`, `read-complete`, … | Precise definitions for the engagement ones, plus `page-engaged`, `scroll-depth`, `section-reached` |
| [[Maintain-Confidential-Access-with-Persistent-Sessions-and-Auth-Telemetry]] | `PageView` (middleware) and `Action` (`TrackerScript`) tables for gated sites | Engaged time and section-level reading, and the stateless-gate version |
| [[Maintain-Privacy-Gates-in-Three-Modes]] | Who the reader is: `sub`, `via`, `who` (the name-the-reader layer) | What they read, and how much |

## The metrics

Every metric is defined so it can be computed from the events below, by any
backend.

### Page view

One per page load that becomes visible. Not fired for prerendered or prefetched
documents (`document.prerendering`) until they're actually shown. OpenPanel's
`trackScreenViews` covers public pages; gated pages also record it server-side
(see *Gated areas*).

### Engaged time on page

**Milliseconds the page was visible and the reader was active.** Active means a
scroll, key, pointer or touch event within the last **30 seconds**. The clock
pauses when the tab is hidden or the reader goes idle, and resumes on the next
input.

- Reported once, when the page is left, as `page-engaged { engaged_ms }`. "Left"
  means `visibilitychange` to `hidden`, the only end-of-page signal that fires
  reliably on mobile; `unload` and `beforeunload` don't. If the tab comes back,
  the clock continues and a second report carries the new total; take the max per
  page view.
- Capped at **2 hours** per page view, and reports under **1 second** are
  dropped.
- This is the number to quote. The tool's own "time on page" (gap between page
  views) stays in the dashboard but isn't used for decisions.

### Scroll depth

**The furthest point of the content the reader has seen, as a percentage of the
content's height.** Measured against the content container (`[data-track-content]`,
the article or memo body), not the document, so a long footer or comments block
doesn't make every reader look like a quitter.

- `scroll-depth { pct }` fires once each at **25, 50, 75 and 100**.
- `page-engaged` also carries `max_scroll_pct`, so one event per page view is
  enough for the summary.
- Content shorter than the viewport counts as 100 on load.

### Sections reached (long-form)

For documents with headings (memos, essays, updates): `section-reached { id, text }`
the first time a heading enters the top 30% of the viewport. The heading ids come
from LFM (`tree.data.headings`), the same ids the table of contents uses, so the
report can say "read through *Market Timing*, stopped at *Financials*".
`page-engaged` carries `sections_reached` (a count).

### Read-complete

`read-complete` fires once when the **end of the content** (a sentinel after the
last paragraph and before Sources or the footer) enters the viewport **and**
engaged time on the page is at least **30 seconds** per 1,000 words, or 60 seconds,
whichever is less. Without the time floor, a fast scroll to the bottom would count
as a read.

### Downloads

`download { file, ext, scope? }` for:

- any link with a `download` attribute, or whose path ends in `.pdf`, `.docx`,
  `.xlsx`, `.pptx`, `.csv`, `.zip`, `.key`;
- **gated files: logged by the server route that serves them,** not by the click.
  Right-click "Save link as", a pasted URL and a link opened in a new tab all skip
  the click handler; the server sees every one.

### Outbound clicks

OpenPanel's `trackOutgoingLinks` handles public pages. Gated pages emit
`outbound-click { host }` through the tracker so it reaches the first-party sink.

### Time on site

**The sum of engaged time across a session's page views.** A session ends after
**30 minutes** without an event. Computed by the backend from `page-engaged`
events; OpenPanel does this for public traffic. The client only supplies a
`session_id` (random, kept in `sessionStorage`) on first-party events.

### Return visits

Gated areas: distinct days a known reader (`sub` or `who`) opened the area.
Public sites: OpenPanel's returning-visitor count. No cross-site identifiers.

## The tracker

One small script, `src/lib/engagement.client.ts`, mounted once in the layout and
progressive in every sense: the page works without it, and it does nothing in
development.

```ts
type EngagementEvent =
  | { name: 'page-engaged'; engaged_ms: number; max_scroll_pct: number; sections_reached: number }
  | { name: 'scroll-depth'; pct: 25 | 50 | 75 | 100 }
  | { name: 'section-reached'; id: string; text: string }
  | { name: 'read-complete' }
  | { name: 'download'; file: string; ext: string; scope?: string }
  | { name: 'outbound-click'; host: string };

interface Sink { send(e: EngagementEvent & { path: string; page_type: string; scope?: string }): void }
```

- **Page context** comes from attributes on the layout, not from guessing:
  `<main data-page-type="memo" data-scope="memo:chroma">` and
  `<article data-track-content>`. The tracker reads them.
- **Sinks** are picked by the page: public pages get the OpenPanel sink
  (`window.op('track', name, props)`); gated pages get the first-party sink only
  (below). A page never sends to both.
- **Delivery:** `navigator.sendBeacon` with a JSON `Blob`, falling back to
  `fetch(..., { keepalive: true })`. Fire and forget; a failed event is lost, not
  retried.
- **Production only,** same rule as the OpenPanel component.
- **Honour Global Privacy Control** (`navigator.globalPrivacyControl`) on public
  pages: send page views only, no custom events.
- **One listener each,** delegated at the document level: one `scroll` (passive,
  read in `requestAnimationFrame`), one `IntersectionObserver` for headings and
  the end sentinel, one `click` for downloads and outbound links, one
  `visibilitychange`.
- **Svelte isn't needed here.** This is a vanilla module like the ToC's client
  script; there's no UI.

## Gated areas: first-party, named, and private

Inside a gate, reading data is confidential in itself. "This LP read the
Metabologic memo twice" names a relationship and a deal. The default is that it
doesn't go to a third-party analytics service.

**The day-one exception, as humain-web does it:** when the firm owns the OpenPanel
account and wants per-person data now, send gated pages to OpenPanel too and call
`op('identify', { profileId, firstName, email })` with the identity from the
signed session. That's a decision for the firm, not a default; write it in the
site's plan. What OpenPanel can attribute depends on the door:

| Door | OpenPanel shows |
|---|---|
| Shared passcode | Anonymous devices, tagged `door: passcode`. A shared secret names nobody. |
| Minted link | The recipient label, as profile `link:<jti>` |
| Email | The email |
| Name-the-reader | The self-reported name and email (mark it self-reported) |

Never identify by the passcode, and never put deal terms or memo text in event
properties: the path (`/lp/memos/chroma/`) is as specific as an event gets.

The first-party path below is where to move when the partners want the data off a
vendor, or need more than OpenPanel's dashboard.

- **`POST /api/<area>/events`** accepts the tracker's beacons. It verifies the
  session cookie (the same `verify()` the middleware uses), drops the event if
  there isn't one, and **attaches identity server-side**: `sub`, `via`, and
  `who` (from the name-the-reader layer) come from the signed session, never
  from the request body.
- **The middleware records the page view** for every gated request, as in the v2
  blueprint's `PageView`, so a reader with JavaScript off or a blocker on is still
  counted.
- **Gated downloads** are logged in the route that streams the file.
- **Storage** uses the same sink choice as the privacy gate's identification
  layer: `log` (the function log or a log drain) to start, `queue` or a small
  database (Turso / Astro DB, the v2 blueprint's tables) when someone needs to
  query it. Don't use cookies or `localStorage` for it.
- **Validate everything.** Cap string lengths, accept only the event names above,
  ignore events more than 5 minutes old or from the future, and rate-limit per
  session.
- **Tell readers.** One line on the sign-in page: "We record which pages you open
  and how far you read, to understand what's useful. It stays with the partners."

### The report the partners want

The point of collecting it. Per document, per period:

| Memo | Readers | Median engaged time | Read-complete | Downloads |
|---|---|---|---|---|
| Chroma | 9 | 11 min | 6 | 2 |

and per reader: what they opened, how far they got, when. Two ways to get it,
cheapest first:

1. **A script** (`pnpm reading-report --since 2026-10-01`) that reads the store
   and prints Markdown or an `.xlsx`, like the LP update export.
2. **An admin page** in the gated area (`/lp/admin/activity`, the v2 blueprint's
   `/admin/activity`), scoped to a GP-only session.

**Into the CRM:** a digest, never per event. A weekly job adds one note per
identified reader to their CRM record ("Read Chroma (11 min, finished), opened
the Q3 letter"). For Decile Hub that's `POST /api/v1/people/{id}/notes` or the MCP
`add_person_note`, following the routing rules in
[[Maintain-Privacy-Gates-in-Three-Modes]] (match by email, never overwrite).

## How to follow it

0. **Do the day-one column above and stop** until a question needs more.
1. **OpenPanel first** on public pages, per the `openpanel-analytics` skill.
2. **Mark the layout:** `data-page-type`, `data-scope` on gated pages,
   `data-track-content` on the reading column, and an end sentinel after the
   last paragraph.
3. **Add the tracker** and the sink the page needs.
4. **Gated areas:** the events endpoint, middleware page views, server-logged
   downloads, a storage sink, and the disclosure line.
5. **Verify** with a real browser (Playwright or `claude --chrome`): open a page,
   scroll halfway, wait 40 seconds, switch tabs. Expect `scroll-depth` 25 and 50,
   and one `page-engaged` with `engaged_ms` near 40,000 and `max_scroll_pct` near
   50. Then scroll to the end slowly and expect `read-complete`.
6. **Write the report** before collecting for months. If nobody looks at a number,
   stop collecting it.

## Environment variables

| Var | Where | Purpose |
|---|---|---|
| `OPENPANEL_CLIENT_ID` | public pages | Per the `openpanel-analytics` skill |
| `ANALYTICS_SINK` | gated areas | `log` (default), `queue`, or `db` |
| `ANALYTICS_DB_URL`, `ANALYTICS_DB_TOKEN` | gated areas | Only for the `db` sink (Turso / libSQL) |

## Anti-patterns

- **Quoting the tool's default "time on page".** It's the gap between page views;
  use engaged time.
- **Scroll depth against the whole document.** Long footers turn every reader into
  a 60% reader. Measure the content container.
- **Heartbeat events every few seconds.** Hundreds of rows per read, and a
  heartbeat only shows a tab is open, not that anyone is reading. Send one
  `page-engaged` on leave.
- **Relying on `unload`.** It doesn't fire on mobile; use `visibilitychange`.
- **Gated reading data in a third-party tool,** or identity taken from the
  request body instead of the signed session.
- **Counting downloads only on click.** Log gated files where they're served.
- **A CRM note per event.** Digest weekly.

## Open questions

- Does OpenPanel's own session duration match the engaged-time definition closely
  enough to skip `page-engaged` on public pages? Compare on one site for a month.
- Extract the tracker as part of a shared package once a second site uses it,
  alongside the gate kernel ([[Maintain-Privacy-Gates-in-Three-Modes]], *Open
  questions*).
- For humain-web: start the gated sink at `log` (zero setup), and move to `db`
  when the partners ask for the first report.

## References

- [[Maintain-Privacy-Gates-in-Three-Modes]]: who the reader is
- [[Maintain-Confidential-Access-with-Persistent-Sessions-and-Auth-Telemetry]]: `PageView`, `Action`, `/admin/activity`
- `context-v/agent-skills/openpanel-analytics/SKILL.md` (anchor root): public-page analytics
- `context-v/prompts/Implement-Deeper-Analytics-Tracking.md` (anchor root): event taxonomy
- `sites/humain-web`: first intended implementation (investor area)
