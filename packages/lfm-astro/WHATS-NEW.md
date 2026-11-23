# What's new in lfm-astro

Changes to the reference components in `components/`, newest first. Sites own
their copies, so nothing here reaches a site on its own: read an entry, decide
whether your site wants it, and copy or adapt the change by hand.

Each entry says what changed, why, and how to adopt it. "Sites with it" lists
the copies known to have picked it up; it isn't a to-do list.

## 2026-11-22: Links in reading content are visible

**Changed:** `reader.css` styles links inside `.reader`: the site's
`--color-primary` with a soft underline that firms up on hover and focus.
Anchors with a class (buttons, chips, cards) keep their own styles, and
citation markers (`[1]`) skip the underline. Without `--color-primary`, links
keep the text color and still get the underline.

**Why:** sites that reset `a { color: inherit }` globally showed links in
write-ups as plain text: on Cathode's NAESCO write-up, none of the links
showed.

**To adopt:** copy the `/* Links in the copy … */` block from `reader.css` into
your site's copy. Skip it if your site already styles links globally and you
like how they look in articles.

**Sites with it:** cathode-site. edviro-blog styles links globally, so it
hasn't needed it.

Also: every component now opens with a note that it's a reference pattern to
copy and adapt, not a dependency, and this file and `README.md` exist.

## 2026-11-17: CrossReferenceContentEmbed, and renderer fixes

**Changed:** a new `CrossReferenceContentEmbed.astro` renders LFM 0.9.0's
cross-reference embeds (`![[Note#Heading]]`) as part of the page: a thin rule,
a "From <title>" line and an "Open original" link; a missing document or
section shows one quiet line. `AstroMarkdown.astro` dispatches to it, and
gained three fixes: unknown inline directives print as written ("re:Invent"
was rendering "re"), table header cells are `<th>` with `|:--:|` alignment
applied, and tight-list items keep their text bare instead of wrapping it in
`<p>`.

**To adopt:** copy `CrossReferenceContentEmbed.astro`, and port the dispatch
and the three fixes into your `AstroMarkdown.astro`. Found while moving
edviro-blog onto LFM (commit `532ac51`).

## 2026-11-09: Code blocks get LFM's highlighter

**Changed:** `CodeBlock.astro` colors code with
`@lossless-group/lfm/highlight` (LFM 0.7.0): Astro's Shiki never sees
LFM-rendered content, so code was one color. The palette follows light, dark
and vibrant and can be branded with `--lfm-code-token-*`. The block sits on the
page's own background, with a header row for the language and a copy button.

**To adopt:** needs `@lossless-group/lfm` 0.7.0 or later; copy the new
`CodeBlock.astro` and keep your site's own wrapper styles if you had them
(commit `faa5acc`).
