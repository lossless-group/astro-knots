---
title: "LFM Bare-Link Provider Catalog"
catalog_version: 0.1.0
catalog_status: Draft
last_updated: 2026-05-03
purpose: >-
  The canonical record of which bare URLs the LFM bare-link plugin classifies,
  what directive each one transforms into, and which Astro component each
  classification maps to in the renderer. The frontmatter IS the record — the
  body explains how the parser reads it and how to extend it.

# Provider catalog. The LFM `remark-bare-link` plugin (when present) walks
# paragraph nodes, finds the bare-URL signal (paragraph whose only child is a
# `link` whose `value` equals its `url`), tries each provider's matchers in
# order, and on first hit replaces the paragraph with a `leafDirective` node.
#
# Each provider entry MUST carry: id, status, kind, component, matchers.
# Providers with `status: planned` are documented for future implementation
# and are skipped at parse time.
providers:

  - id: youtube-video
    status: stable
    label: "YouTube — full video"
    kind: video                 # generic taxonomy: video | short | playlist | audio | tweet | gist | embed
    aspect: "16:9"
    directive: youtube-video    # leafDirective name emitted by the plugin
    component: YouTubeEmbed     # site component the renderer dispatches to
    component_source: "site/src/components/markdown/YouTubeEmbed.astro"
    description: >-
      Standard horizontal YouTube player. Matches the canonical `youtu.be/{id}`
      and `youtube.com/watch?v={id}` shapes. The 11-character ID format is
      stable per YouTube's URL grammar.
    matchers:
      - host: ["youtu.be"]
        path: '^/(?<id>[A-Za-z0-9_-]{11})/?$'
      - host: ["youtube.com", "www.youtube.com", "m.youtube.com"]
        path: '^/watch/?$'
        query:
          v: '^(?<id>[A-Za-z0-9_-]{11})$'

  - id: youtube-short
    status: stable
    label: "YouTube — Short"
    kind: short
    aspect: "9:16"
    directive: youtube-short
    component: YouTubeShortsEmbed
    component_source: "site/src/components/markdown/YouTubeShortsEmbed.astro"
    description: >-
      Vertical short-form YouTube video. Authoring just the bare URL routes to
      the dedicated Shorts component (centered, max-width 320, 9:16 wrapper)
      rather than the hybrid YouTubeEmbed.
    matchers:
      - host: ["youtube.com", "www.youtube.com", "m.youtube.com"]
        path: '^/shorts/(?<id>[A-Za-z0-9_-]+)/?$'

  - id: youtube-playlist
    status: stable
    label: "YouTube — Playlist"
    kind: playlist
    aspect: "16:9"
    directive: youtube-playlist
    component: YouTubePlaylistEmbed
    component_source: "site/src/components/markdown/YouTubePlaylistEmbed.astro"
    description: >-
      Embedded playlist player. The `list` query parameter is the playlist ID;
      individual video IDs in the URL (the `v` parameter) are ignored at
      classification time — the playlist component starts at the playlist's
      first video.
    matchers:
      - host: ["youtube.com", "www.youtube.com"]
        path: '^/playlist/?$'
        query:
          list: '^(?<id>[A-Za-z0-9_-]+)$'

  # Planned providers (status: planned — skipped at parse time, kept here as docs).

  - id: vimeo
    status: planned
    label: "Vimeo"
    kind: video
    aspect: "16:9"
    directive: vimeo
    component: VimeoEmbed
    description: "Vimeo video player. Numeric ID."
    matchers:
      - host: ["vimeo.com", "player.vimeo.com"]
        path: '^/(?:video/)?(?<id>\d+)/?$'

  - id: loom
    status: planned
    label: "Loom"
    kind: video
    aspect: "16:9"
    directive: loom
    component: LoomEmbed
    description: "Loom recording player."
    matchers:
      - host: ["loom.com", "www.loom.com"]
        path: '^/share/(?<id>[a-f0-9]+)/?$'

  - id: spotify
    status: planned
    label: "Spotify"
    kind: audio
    directive: spotify
    component: SpotifyEmbed
    description: "Track, episode, or playlist embed. Capture both type and ID."
    matchers:
      - host: ["open.spotify.com"]
        path: '^/(?<type>track|episode|playlist|album|show)/(?<id>[A-Za-z0-9]+)/?$'

  - id: soundcloud
    status: planned
    label: "SoundCloud"
    kind: audio
    directive: soundcloud
    component: SoundCloudEmbed
    description: "SoundCloud audio. Identifier is the full path; resolution requires the oEmbed endpoint."
    matchers:
      - host: ["soundcloud.com", "www.soundcloud.com"]
        path: '^/(?<id>[^/]+/[^/]+)/?$'
---

# LFM Bare-Link Provider Catalog

This is the source of truth for which bare URLs the **LFM bare-link plugin** (`remark-bare-link`, in `packages/lfm/src/plugins/`) recognizes and what each one transforms into. **The frontmatter above is the record.** This body documents how the record is read and how to extend it.

---

## What "bare URL" means

A bare URL is a URL that occupies an entire paragraph by itself, with blank lines above and below. CommonMark's paragraph rule does the work for us: a paragraph is a contiguous run of inline content delimited by blank lines. After `remark-gfm`'s autolink pass, a bare URL becomes a `paragraph` node whose **single child is a `link` node** whose `value` equals its `url`.

```markdown
content line content line

https://youtube.com/shorts/ZyOqkTFSiCI?si=BBffUVzrAMOwnMyZ

content line content line
```

The middle paragraph is bare. The plugin matches it against the catalog and replaces the paragraph with a leaf directive node.

If the URL appears inline with surrounding text — `Check this out https://youtu.be/...` — the paragraph has multiple inline children, so the bare-URL signal does not fire and the URL stays as a clickable autolink. **This is intentional.** Inline link previews (the `LinkPreview__*--Row/Card/Thumb` family) are a separate concern handled by a different transform.

---

## How classification works

For each bare-URL candidate, the plugin walks the providers in catalog order and stops at the first match. A match requires:

1. **Host match.** The URL's hostname is in the matcher's `host` list. Hosts are compared case-insensitively. Subdomain prefixes like `m.` are listed explicitly when supported.
2. **Path match.** The URL's pathname matches the matcher's `path` regex. The regex SHOULD use a `(?<id>...)` named capture group when the ID lives in the path.
3. **Query match (if specified).** Each entry in `query` maps a query-parameter name to a regex the parameter's value must satisfy. Named capture groups in query patterns (typically `(?<id>...)`) are also accepted into the result.

The first match yields:

- `provider` — the matched provider's `id` (e.g. `youtube-short`)
- `id` — the captured ID (named group, path or query)
- `url` — the original URL, unchanged
- `kind` — the provider's `kind` (carried into the directive for renderer convenience)

If no provider matches, the paragraph is left alone — it stays an autolink.

---

## What the plugin emits

The classified paragraph is replaced with a `leafDirective` MDAST node:

```js
{
  type: 'leafDirective',
  name: provider.directive,           // e.g. 'youtube-short'
  attributes: {
    provider: provider.id,            // e.g. 'youtube-short'
    id: capturedId,                   // e.g. 'ZyOqkTFSiCI'
    url: originalUrl,                 // pristine URL for round-tripping / copy buttons
    kind: provider.kind,              // 'video' | 'short' | 'playlist' | ...
  },
  children: [],
}
```

The renderer's directive dispatch handles the rest. For example, in `AstroMarkdown.astro`:

```astro
{type === 'leafDirective' && node.name === 'youtube-short' && (
  <YouTubeShortsEmbed url={node.attributes.url} />
)}
```

Sites that don't yet have a given provider's component simply omit the dispatch arm — the directive node falls through to the default-handler / debug rendering. Adding the component later is purely additive.

---

## How to add a new provider

1. **Identify the URL shapes.** Visit the platform, copy a few real share URLs, identify host(s), path pattern, and where the ID lives.
2. **Add an entry to the `providers:` list above.** Status begins as `planned`. Pick a stable `id` (kebab-case, prefixed with the platform name). Pick a `kind` from the existing taxonomy; only invent a new `kind` if no existing one fits.
3. **Write the matchers.** Use named capture groups (`(?<id>...)`). Include all subdomain variants you want to support in `host`. Anchor regexes with `^` and `$` to avoid loose matches.
4. **Build the renderer component.** Lives in the consuming site at `src/components/markdown/{ComponentName}.astro`. Once committed alongside a dispatch arm in `AstroMarkdown.astro`, flip `status: planned` to `status: stable`.
5. **Test with a sample bare URL** in the site's local test content (see `sites/mpstaton-site/src/content/promote/_demo/memo/v1.md` for the established pattern).

---

## Edge cases & decisions

- **Backslash opt-out.** A URL prefixed with `\` (`\https://youtu.be/...`) is rendered as a plain link. The plugin checks for the leading backslash on the link's source position and skips classification when present. Documented in spec §4.12.
- **Tier-B explicit directives.** Authors who write `::youtube-video{id="..."}` directly bypass classification entirely — they get the same component dispatch but with full attribute control (start time, autoplay, etc.). The catalog's `directive` field for stable providers is the canonical name for both Tier-A (bare) and Tier-B (explicit) emissions, so renderers register one dispatch arm per provider, not two.
- **Multiple matches.** Catalog order is authoritative; first match wins. List narrower providers (e.g. `youtube-short`) before broader ones (e.g. a hypothetical `youtube-any`) — but currently no provider's matchers overlap.
- **ID format drift.** YouTube's 11-char video ID format is stable but not contractual. Matchers use `[A-Za-z0-9_-]{11}` for video IDs and `[A-Za-z0-9_-]+` (no length cap) for shorts and playlist IDs because those have fewer guarantees.
- **Tracking parameters.** `?si=…`, `?t=…`, `?utm_*` are preserved on the original `url` attribute (which the renderer can pass through to a copy-URL button). They are NOT used in matching. Components receive both the raw `url` (with tracking) and the extracted `id` (without).

---

## Why this lives in markdown, not TS or JSON

The catalog is read by humans more often than by machines. Two specific points where humans need it:

1. **Adding a provider.** Someone editing this file wants to see the prior decisions in plain prose — not a TS file with adjacent types and imports.
2. **Auditing during a deploy.** When a YouTube share URL doesn't render, the first place to look is "is this URL shape in the catalog?" — and the answer should be readable in five seconds, not require navigating types.

The plugin reads this file at build time: the `tsup` build step extracts the YAML frontmatter and emits a typed JSON module the runtime imports. Source-of-truth stays human-editable; runtime stays fast.
