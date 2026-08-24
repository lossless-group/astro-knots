---
title: "Dates are UTC at rest, viewer-local at render"
purpose: "Store and emit dates in UTC. Localize in the viewer's browser, never at build time — formatting a date during a static build bakes whichever timezone the build machine happened to be in into the HTML every reader sees."
status: Authoritative
last_verified: 2026-08-21
applies_to: every splash, site, changelog renderer, and content collection under `~/code/lossless-monorepo/`
authors:
  - Michael Staton
augmented_with: Claude Code on Claude Opus 5 (1M context)
site_uuid: fc71171c-3603-4031-991f-bc948b7c8ea7
hex_code: 7a3esr
date_created: 2026-08-21
publish: true
---

## The ruling

**UTC is the default and that is correct.** Frontmatter dates, `datetime`
attributes, database columns, API responses — all UTC. Do not "fix" this by
pinning content to an author's local timezone.

**The viewer is wherever they are.** The person landing on a changelog entry
is not where it was written. A global-nomad author and a reader in Lisbon,
Chicago, or Singapore are three different local times over one authored
instant. Both facts are true; they belong in different layers.

So: **canonical UTC at rest, viewer-local at render.**

## What this rules out

Formatting a date **at build time**. A static build runs on one machine in one
timezone and freezes that choice into HTML for everybody:

```
Same source: datetime="2026-07-06T00:00:00.000Z"

  built on GitHub Actions (UTC)   →  "Jul 6, 2026"   ✅
  built on a laptop in CDT (-5)   →  "Jul 5, 2026"   ❌  same file, wrong day
```

UTC midnight minus five hours is the previous day. Every entry shifts. Nothing
errors, CI stays green, and the site is simply wrong for as long as it was
deployed from that laptop.

Passing `timeZone: 'UTC'` to the build-time formatter makes the output stable
and correct — but it is only half the point. Stable-and-UTC still shows a reader
in Singapore a date computed for nobody.

## The shape that is actually right

1. **Emit UTC in the markup.** `<time datetime="2026-07-06T00:00:00.000Z">` —
   machine-readable, unambiguous, correct for every reader. This part is
   usually already right.
2. **Put a UTC-formatted string inside the element** as the server-rendered
   fallback. It is what a no-JS reader, a crawler, and an unfurl bot see, so it
   must not depend on the builder's locale. Pass `timeZone: 'UTC'` explicitly —
   never rely on the ambient default.
3. **Localize on the client** from the `datetime` attribute. A few lines of
   progressive enhancement rewrites the text content to the viewer's own zone.
   No hydration framework required.

```js
for (const el of document.querySelectorAll('time[datetime]')) {
  const d = new Date(el.getAttribute('datetime'));
  if (!isNaN(d)) el.textContent = d.toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}
```

`undefined` as the locale means "use the viewer's" — do not hard-code `en-US`.

## Where the distinction bites hardest

**Timelines and "how long ago" framing.** A relative timestamp is meaningless
without a viewer anchor. Compute it client-side or not at all.

**Changelog roll-ups.** Entries aggregate across repos into parent splashes
(see the `pseudomonorepos` content-rollup pattern). If each repo baked its own
build-machine timezone, one merged feed carries several inconsistent day
boundaries and sorts wrongly at the edges.

**Editorial vs filesystem dates.** Orthogonal to this, and do not conflate
them: which date to show is `changelog-conventions`' concern
(`date_authored_initial_draft` over `date_modified`). This reminder is only
about *what timezone you render the chosen date in*.

## Checklist when adding a date to any surface

- [ ] Source value is UTC, and the `datetime` attribute carries the full ISO string
- [ ] Any server-rendered date string passes `timeZone: 'UTC'` explicitly
- [ ] Viewer-local formatting happens on the client, from `datetime`
- [ ] Locale is `undefined` (the viewer's), not hard-coded
- [ ] Relative time ("3 days ago") is client-side only

## See also

- `changelog-conventions` skill — which date to display, and the editorial/filesystem split
- `astro-knots` skill — the sites this applies to
