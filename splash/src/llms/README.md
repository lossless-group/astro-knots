# Source of truth: human-editable prose for the llms.txt endpoints

These markdown files are read at build time by the endpoints in
`splash/src/pages/llms.txt.ts` and `splash/src/pages/llms-full.txt.ts`. The
endpoints are deliberately dumb — they do token substitution and append the
dynamic corpus content. **All voice, framing, and structural prose lives
here, not in TypeScript.**

If you want to tweak the wording on `/llms.txt` or `/llms-full.txt`, edit
the corresponding `.md` file in this directory and rebuild. No code changes.

## Files

- `llms.md` — template for `/llms.txt` (the link index).
- `llms-full.md` — template for `/llms-full.txt` (the concatenated full content).

## Tokens (substituted at build time)

| Token | Replaced with |
|---|---|
| `{{SITE_NAME}}` | `SITE_NAME` from `splash/src/lib/seo.ts` (currently "astro-knots") |
| `{{SITE_COUNT}}` | Number of entries in the `site-highlights` collection |
| `{{CHANGELOG_COUNT}}` | Number of published `changelog` entries (after the publish/private gate) |
| `{{CONTEXTV_COUNT}}` | Number of published `context-v` entries (after the publish/private gate) |
| `{{REPO_COUNT}}` | Number of distinct `from` provenance values across changelog + context-v |
| `{{LLMS_FULL_URL}}` | Absolute URL to `/llms-full.txt` |
| `{{LLMS_INDEX_URL}}` | Absolute URL to `/llms.txt` |
| `{{SITES_INDEX}}` | Generated link list of every site in `site-highlights`, ordered by `order` then alphabetical, linking to `live_url`/`production_url` if present, else the splash's site page (used in `llms.md`) |
| `{{CHANGELOG_INDEX}}` | Generated link list of changelog entries, grouped by `from`, alphabetical (used in `llms.md`) |
| `{{CONTEXTV_INDEX}}` | Generated link list of context-v entries, grouped by `from`, alphabetical (used in `llms.md`) |
| `{{CORPUS_BODIES}}` | Concatenation of changelog + context-v raw bodies with metadata headers (used in `llms-full.md`) |

Tokens are simple `{{NAME}}` placeholders — no Mustache, no Handlebars, no
templating engine. If a token is missing in the markdown, the endpoint emits
the file without it. If you add a new dynamic value, register it in the
endpoint's substitution map and document it here.

## Why a separate directory and not `src/lib/` or `src/content/`?

`src/lib/` is for code (TypeScript). `src/content/` is for Astro content
collections, which expect specific schemas and Astro-managed loaders. These
files are neither — they're prose templates that the build step reads as raw
strings via Vite's `?raw` import. Giving them their own directory keeps the
purpose obvious and makes the source-of-truth boundary easy to find.

## Provenance: `from`, not `source_repo_slug`

astro-knots is a *pseudomonorepo aggregating ~10 Astro websites*. The rolled
up content collections (`changelog` and `context-v`) carry their origin as
`from` (set by `unionLoader` to the originating member-site slug — e.g.
`mpstaton-site`, `twf_site`, `hypernova-site`). The endpoint groups by `from`.
Local astro-knots-authored notes carry `from: 'astro-knots'`.

## Publish/private gate

Match the page templates exactly:

- `src/pages/changelog/[...slug].astro` does not filter (the union loader
  itself drops `publish: false` entries before the collection is queried).
- `src/pages/context-v/[...slug].astro` filters with `e.data.publish !== false`.

The endpoints apply `e.data.publish !== false && e.data.private !== true` to
both — the looser of the two — to ensure nothing leaks into LLM-facing
output that wouldn't render as HTML.
