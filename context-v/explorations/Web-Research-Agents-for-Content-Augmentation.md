---
title: Web Research Agents for Content Augmentation
lede: When a community member adds a tool we haven't authored content for, we want to point an agent at a URL or company name and have it fill out the YAML frontmatter. Here's what shipping that actually looks like in 2026 — and why most of the "agent framework" hype is the wrong tool for the job we have today.
date_authored_initial_draft: "2026-04-28"
date_authored_current_draft: "2026-04-28"
date_created: "2026-04-28"
date_modified: "2026-04-28"
at_semantic_version: "0.0.0.1"
status: Draft
augmented_with: Claude Code (Opus 4.7)
category: Explorations
tags: [Web-Research, Data-Augmentation, AI-Agents, Tool-Use, Structured-Outputs, Vercel-Constraints, Content-Collections, Hosted-APIs, Self-Hosted-Tradeoffs, Anthropic-Web-Search, Jina-Reader, Firecrawl]
authors:
  - Michael Staton
  - AI Labs Team
---

# Web Research Agents for Content Augmentation

## The Problem This Document Solves

The FullStack VC site is a small community space — roughly 800 invited members, of whom 60–100 will ever actually OAuth in and create a profile. One of the things they can do once they're in is "edit their stack" — list the tools and services they use day-to-day. Today the team has authored entries for ~17 tools (`sites/fullstack-vc/src/content/tools/*.md`). Members will add tools we have no content for. When that happens, the tool card on their profile renders with just a name and a broken-favicon-shaped void.

We want to point something at a URL or a company name and have it come back with the rest of the YAML frontmatter — `description`, `zinger`, `og_screenshot_url`, `tags`, `category`, `pricing`, `oss`, `url_aliases`, the works. The schema is already permissive (`.passthrough()` in `src/content.config.ts`), and the `ToolCard.astro` UI already has an OG-prefixed fallback chain (`og_screenshot_url` → `og_image` → `image` → `hero_image_url`), so partial enrichment is fine. We don't need every field — we need *enough* fields that the card stops looking empty.

Nobody on the team has shipped this kind of feature before. We've used Claude / OpenAI / Perplexity APIs. We've installed Ollama locally. We've used Jina Reader as a content extractor. We have not stood up an agent framework, and we don't want to spend a week of YouTube tutorials before deciding what's actually appropriate for a site at this scale.

This document is the tour: what's available in April 2026, what's hyped vs. shippable, and what I'd actually build first.

---

## The Mental Model: Three Shapes of "Research Agent"

The phrase "research agent" is doing a lot of work. Before evaluating tools, it helps to break it into three concrete shapes — because the right answer depends on which shape we actually want.

### 1. Single-shot grounded answer
One LLM call. The model has a built-in `web_search` tool. It searches once or twice, reads the results, and returns text (or a typed JSON object) with citations. **Latency: 3–8 seconds. Cost: $0.005–0.03 per call.** This is what Anthropic's web_search tool, OpenAI's Responses API web_search, and Perplexity Sonar all do.

### 2. Multi-hop research loop
A planning agent. It searches, reads pages, decides it needs more, searches again, follows links, refines, and eventually returns a synthesized answer. **Latency: 15–60 seconds. Cost: $0.05–0.30 per call.** This is what Jina DeepSearch does. It's also what you'd build by hand with the Claude Agent SDK or LangGraph if you wanted a multi-step loop.

### 3. Targeted scrape + extract
You already have the URL. You don't need "research" — you need to coerce one specific page into structured fields. Fetch the page (bypassing JS or anti-bot if necessary), feed the cleaned content to an LLM with a strict schema, get back a typed object. **Latency: 4–10 seconds. Cost: $0.01–0.05 per call.** Firecrawl, Jina Reader + a tiny LLM call, or `fetch` + Claude all do this.

**For our use case, most inputs will be a URL** (a member adds "Linear" with `linear.app`). What we want most of the time is **shape #3**, with **shape #1 as fallback** when only a name is given. Shape #2 — the multi-hop research loop — is overkill for "what does this SaaS company do." Save it for a future feature where someone adds "Hermes Agent" and we want a deep-dive write-up rather than frontmatter fields.

---

## Why Self-Hosting Is the Wrong Side Quest (Right Now)

The team flirted with the idea of shelling into a Vercel server, installing Ollama, running a model, and orchestrating an agent framework on top. This is not a fit for our deployment model and it's not a fit for our scale.

**Ollama on Vercel is not viable.** Vercel's serverless functions are stateless and have no GPU. There is no warm model state between invocations. The only way to run Ollama "underneath the website" would be to spin up a separate VPS (Fly.io, Railway, RunPod) and have the Astro site call it as a remote service. At that point Ollama is no longer "underneath the site" — it's a third-party API you happen to operate, and it's slower and more expensive than calling Claude or OpenAI directly. Ollama is a fantastic local-development tool. It is not infrastructure for this use case.

**LangChain / LangGraph on Vercel is officially "not recommended for serverless."** Vercel's function timeouts are the issue: Hobby caps at 10 seconds, Pro is 15 seconds default (configurable to 300, or 800 with Fluid Compute). Multi-hop agent loops blow past these defaults regularly. It's *workable* with Fluid Compute and a single-pass design, but at that point you're fighting the runtime to do something the hosted APIs already do natively.

**Hermes Agent (Nous Research, launched Feb 2026)** is real, hyped, MIT-licensed, and exploding — ~95k stars by April. It runs on a $5 VPS with persistent memory, a cron scheduler, and 118 built-in skills. It's the right tool for "I want a personal/team agent that lives somewhere and remembers things across days." **It is the wrong tool for "I want a stateless request → response endpoint that returns structured YAML."** Two completely different shapes. Worth keeping in your peripheral vision; not the answer to this problem.

**The verdict for now:** every minute spent on self-hosted agent infrastructure is a minute not spent shipping the feature. We have ~17 tool entries. We are not solving a scale problem. We are solving an "embarrassing empty card" problem. Hosted APIs solve that today, in an afternoon.

---

## Hosted Research APIs — The Useful Survey

| Service | Pricing | Fit for "URL → YAML" | Tradeoff |
|---|---|---|---|
| **Anthropic `web_search` tool** | $10 / 1k searches + token costs (Sonnet 4.6: $3 in / $15 out per M tok). Native citations. Pairs with Claude Agent SDK structured outputs. | **Top pick.** One API call: search → reason → structured JSON. Schema-typed return. Team already uses Claude. | Search results count as input tokens — multi-hop balloons cost. Single-hop is cheap. |
| **OpenAI Responses API + `web_search`** | Token rates + per-tool-call fees. Native Structured Outputs (`response_format: json_schema`, strict). | Equivalent to Anthropic. Strict schema adherence is best-in-class. | Per-call billing is fiddly to predict. |
| **Perplexity Sonar / Sonar Pro** | Sonar $1 / $1, Sonar Pro $3 / $15 per M tok. Citations no longer billed in 2026. No per-search fee. | Cheapest grounded-answer API. Great when you want a paragraph with sources. | Output isn't strict-JSON-guaranteed. You'd run a second tiny call to coerce to schema. |
| **Tavily** | Free 1k/mo. ~$0.003/search at $30/mo Researcher tier. Acquired by Nebius Feb 2026. | Raw search results to feed your own LLM. | Just search — you bring the reasoning step. |
| **Exa.ai** | $10 free credits, then $49/mo for 8k credits. | **Has dedicated company / people search endpoints.** Strong fit for entity lookup specifically. | Smaller index than Google-backed APIs. |
| **Jina DeepSearch / Reader** | Reader is free + stable. DeepSearch via paid tiers (Free 100 RPM → Premium 5k RPM). | Reader (`r.jina.ai/{url}`) is the cleanest URL → markdown extractor in the industry. DeepSearch is a multi-hop loop in one call. | DeepSearch latency is high. Reader is a one-trick pony but the trick is excellent. |
| **Brave Search API** | $5 / 1k requests. Free tier killed in 2025. | Independent index, no tracking. Solid raw search. | No synthesis layer. |
| **SerpAPI** | $75/mo for 5k searches (~$0.015 each). | Google SERP fidelity. | Expensive for what it is. |
| **Serper** | $50/mo for 50k searches (~$0.001 each). 2.5k free / mo. | **Cheapest Google SERPs by an order of magnitude.** | Raw SERPs only. |

**What this table looks like once you squint:** for our use case there are two real categories. Either you want a model that does the searching for you (Anthropic, OpenAI, Perplexity), or you want raw search results to combine with your own LLM call (Tavily, Exa, Serper). Jina sits weirdly in the middle — Reader is for when you already have the URL and want clean markdown out of it, which is *most* of our cases.

The team's existing Anthropic API key + the fact that the `claude-sonnet-4-6` model in the Agent SDK natively supports both `web_search` and structured outputs in the same call makes this a one-vendor path. That's the recommendation.

---

## Browserless / Scraping — The Fallback Tier

About 80% of the time, calling `fetch(url)` and pulling OpenGraph tags + the `<title>` is enough to seed an LLM call. About 15% of the time, the site is JS-rendered, behind Cloudflare, or otherwise hostile to plain fetches. About 5% of the time you need a logged-in browser to even get to the content. The right tool depends on which bucket you hit.

| Service | Pricing | Use when |
|---|---|---|
| **Firecrawl** | Hobby $19/mo (3k credits). 1 credit / page basic, up to 9 with JSON+enhanced extraction. | **Default fallback.** Per-page billing is predictable. Bundles JS rendering + LLM-friendly markdown + JSON extraction in one call. Pairs cleanly with our Claude path. |
| **Browserbase** | Per browser-hour. | Need full Playwright control (logged-in scraping, complex flows). Costlier than per-page tools. |
| **Browserless.io** | Per browser-hour. | Same niche as Browserbase; mature API. |
| **ScrapingBee** | Per-request, ~$49/mo entry. | Anti-bot-heavy sites specifically. |
| **Apify** | Platform of pre-built "actors." | Long-tail scraping when somebody's already published the actor for that site. Overkill for SaaS landing pages. |

**The fetch ladder** for our use case:

1. **Plain `fetch(url)`** — try first. Free, fast, works on most marketing pages.
2. **Jina Reader** (`https://r.jina.ai/{url}`) — fall through if `fetch` returns garbage or JS-only. Free for low volume, no API key required for the basic endpoint. Returns clean markdown.
3. **Firecrawl `/scrape` with `formats: ['extract']`** — fall through if Jina Reader fails (paywall, anti-bot). Pay $19/mo, get JS rendering, optionally hand it the schema and skip the separate LLM call.

Three tiers, escalating cost. Most calls land at tier 1 or 2.

---

## Structured Output Is the Real Unlock

The piece most agent tutorials skip — and the piece that actually makes this feature work — is structured outputs. We don't want a paragraph about Linear. We want an object that matches the tools content collection schema, that we can `js-yaml` stringify and write to disk.

Both Anthropic and OpenAI natively support this:

- **Anthropic Agent SDK:** pass a Zod (or JSON Schema) shape to the call's structured output config. The model is constrained to return that exact shape. Malformed output is rejected by the SDK before you see it.
- **OpenAI Responses API:** `response_format: { type: "json_schema", json_schema: {...}, strict: true }`. Same idea. OpenAI's strict mode is best-in-class — the model will refuse to deviate from the schema.

A sketched (not implementation-ready) shape for the tools collection looks roughly like:

```ts
const ToolEnrichmentSchema = z.object({
  site_uuid: z.string().optional(),
  slug: z.string(),
  site_name: z.string().optional(),
  title: z.string().optional(),
  zinger: z.string().optional(),
  url: z.string().url(),
  url_aliases: z.array(z.string()).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(), // Train-Case
  oss: z.boolean().optional(),
  pricing: z.string().optional(),
  product_of: z.string().optional(),
  og_screenshot_url: z.string().url().optional(),
  og_image: z.string().url().optional(),
  og_favicon: z.string().url().optional(),
  docs_url: z.string().url().optional(),
  github_repo_url: z.string().url().optional(),
});
```

The schema mirrors `src/content.config.ts` — **mostly optional**, because the content collection is permissive (`.passthrough()`) and the team's stated preference is "no hard validation, document the shape, don't gatekeep." Partial fills are fine. The card UI handles missing fields gracefully.

A dedicated note: tags must be **Train-Case** (`AI-Coding`, `Multi-Agent-Automation`) per project convention. The prompt to the model needs to make this explicit, and an optional `.refine()` rule can normalize on the way back if the model slips.

---

## The Two Realistic Paths

There are two reasonable shapes for this feature. Path A ships in an afternoon. Path B is the eventual goal. **Build A first.**

### Path A — Developer-facing CLI script

A script in `sites/fullstack-vc/scripts/` that mirrors the existing pattern of `generate-changelog-banners.ts` and `generate-content-banners-on-dir.ts`. Invocation:

```bash
pnpm --filter fullstack-vc run gen:tool-enrichment linear.app
# or
pnpm --filter fullstack-vc run gen:tool-enrichment "Linear"
```

The script:
1. Resolves input → URL (if just a name, do a quick search first)
2. Calls Claude Agent SDK with `web_search` tool + the Zod schema
  3. v2: fallback to Jina Reader → Firecrawl ladder if the initial fetch fails
4. Writes the result to `src/content/tools/{slug}.md` with body markdown if any

The output is a draft markdown file. The developer reviews it, hand-edits as needed, commits, pushes — Vercel redeploys. **This is the right starting point** because:

- No new auth surface to debug — the OAuth flow stays untouched
- No Vercel timeout concerns — runs on a developer's machine
- Output is a PR you can review before it ships
- Pattern matches the team's existing `scripts/` conventions
- Idempotent — re-running with the same input is safe
- Backfills the existing 17 entries cheaply (every tool with a missing `og_screenshot_url`, etc.)

Cost to enrich the entire current catalog: roughly $0.50 if everything is single-shot, $5 if a few need multi-hop fallbacks. Stop optimizing.

### Path B — User-facing OAuth-gated endpoint

Eventually, when a member adds a tool we don't have, an Astro API route fires the same enrichment call and writes a draft to `src/content/tools/_drafts/`. A maintainer reviews and promotes the draft to a real entry.

Same SDK, same schema, same external services. The differences:
- Runs on Vercel (use Fluid Compute for the 300s window — single-shot calls are well under this)
- Triggered by an authenticated request (existing OAuth flow already gates `/people/{handle}/stack/edit`)
- Writes to a `_drafts/` folder so unreviewed content doesn't ship to production
- Needs rate limiting and a cost cap

**Defer Path B** until Path A has been used enough to know whether the schema, prompt, and fallback ladder produce reliably useful output. The 60–100 active users won't all add unknown tools in week one.

---

## Cost & Latency Reality Check

| Shape | Per-request cost | Latency | Vercel viable? |
|---|---|---|---|
| Single-shot grounded (Anthropic web_search, OpenAI web_search, Perplexity) | $0.005–0.03 | 3–8s | Yes, under default 60s window |
| Multi-hop research loop (Agent SDK loop, Jina DeepSearch, OpenAI agentic) | $0.05–0.30 | 15–60s | Needs Fluid Compute or async job |
| Pure scrape + extract (Firecrawl, Jina Reader + LLM) | $0.01–0.05 | 4–10s | Yes |

**For 17 tools backfilled today, even worst-case is under $5.** For the projected workload — say 100 unknown-tool additions over six months — expect $5–30 total. This is not a number worth optimizing. Pick the cleanest path and ship.

---

## What I'd Actually Build First

Concretely, the recommendation is a Path A CLI script with this stack:

- **Anthropic Agent SDK** with the `web_search` tool, model `claude-sonnet-4-6`
- **Zod schema** mirroring the tools content collection (mostly optional fields)
- **Jina Reader** prepended for URL inputs — call `https://r.jina.ai/{url}` first to seed the LLM with cleaned page content, reducing the model's search burden and improving grounding
- **Firecrawl** as the third-tier fallback when Jina Reader fails (paywall, anti-bot, JS-only)
- **Train-Case tag normalization** in a `.refine()` post-processor on the schema
- **Existing schema fields for tracking** — stamp `jina_last_request` and `og_last_fetch` so we know when an entry was augmented
- **Output as draft** — write to disk, open in editor, hand-review, commit. Matches the team's commit-and-push-frequently workflow; Vercel redeploys on push

Total dependency surface: `@anthropic-ai/sdk`, `zod`, `js-yaml`, `gray-matter`. Three of these are likely already in the workspace; the fourth is a single `pnpm add`. No agent framework. No LangChain. No self-hosted infra.

---

## What This Doc Doesn't Decide

A handful of questions are out of scope here and belong in the spec that comes next:

- **Whether Path B (user-facing) is even desired.** With 60–100 active users, a maintainer-driven Path A may be enough indefinitely.
- **Schema strictness.** The team's "no hard validation on frontmatter" preference applies. The Zod schema in the script should normalize, not gatekeep — never throw, always write *something*.
- **Disambiguation.** Two companies named "Anthropic"? "Linear" the tool vs. "Linear" the algebra? Prompt the user for a url, fail loudly, ask user to select between found options. Open question.
- **Rate limits, cost caps, observability.** Defer until a real user trigger exists (Path B).

---

## Sources

- [Anthropic Web Search Tool Documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool)
- [Claude Agent SDK Structured Outputs](https://platform.claude.com/docs/en/agent-sdk/structured-outputs)
- [OpenAI Web Search Tool — Responses API](https://platform.openai.com/docs/guides/tools-web-search)
- [Perplexity Sonar API Pricing 2026](https://www.aipricing.guru/perplexity-pricing/)
- [Exa vs Tavily 2026 Comparison](https://exa.ai/versus/tavily)
- [Firecrawl vs Browserbase 2026](https://knowledgesdk.com/blog/firecrawl-vs-browserbase)
- [Best Web Search APIs for AI Applications in 2026 — Firecrawl blog](https://www.firecrawl.dev/blog/best-web-search-apis)
- [Jina Reader API](https://jina.ai/reader/)
- [Jina DeepSearch](https://jina.ai/deepsearch/)
- [Vercel Function Duration Limits](https://vercel.com/docs/functions/configuring-functions/duration)
- [LangGraph in Serverless — community discussion](https://community.latenode.com/t/what-are-the-issues-with-running-langgraph-in-serverless-environments/31491)
- [Hermes Agent — Nous Research](https://hermes-agent.nousresearch.com/)
- [Brave Drops Free Search API Tier](https://www.implicator.ai/brave-drops-free-search-api-tier-puts-all-developers-on-metered-billing/)
