---
site_uuid: 5bf38765-c8ae-4522-9e6e-387d6f656ecd
hex_code: sziwct
title: "Share Cards Hid Their Photos and Shrank Their Type"
lede: "Cathode's first share cards worked in every test and looked wrong in iMessage: a stray streak of photo, small type, an empty top half."
summary: >-
  Records what went wrong with cathode-site's generated share cards once they
  were seen in a real iMessage thread, and the fixes: anchor banner photos to
  the side their subject is on instead of center-cropping, size type for a
  phone thumbnail, center cards that have no photo, keep wide-card text off
  the photo, and give the site one big-type universal card (after lfg-hub's).
  Resolved 2026-11-17. Read before building or restyling share cards on any
  site; the rules are folded into
  Share-Every-Page-and-Section-With-Its-Own-Image.md.
type: Issues
publish: true
date_created: 2026-11-17
date_modified: 2026-11-17
date_authored_initial_draft: 2026-11-17
date_authored_current_draft: 2026-11-17
date_authored_final_draft:
authors:
  - Michael P. Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: Resolved
tags:
  - Open-Graph
  - Share-Images
  - Social-Sharing
  - Issue-Resolution
---

# Share Cards Hid Their Photos and Shrank Their Type

## What we saw

cathode-site shipped a generated card for every page (see
[[Share-Every-Page-and-Section-With-Its-Own-Image]]). Every check passed: the
tags were right, the images returned `200 image/jpeg`, and the cards looked
fine as full-size JPEGs on a laptop. Then the links went into an iMessage
thread, and three cards in a row looked broken:

1. **The photos were gone.** The 7x24 Exchange card showed a dark rectangle
   with one red streak at its left edge. The event's banner is a globe on the
   left of a wide image; the card cropped the middle, which is empty.
2. **The type was small.** Titles that looked large at 1080px wide were small
   at iMessage's preview width, and the subtitle and footer were barely legible.
3. **Cards without a photo had an empty top half.** "Where operators gather."
   sat at the bottom of a blank card, because the layout left room for a photo
   that wasn't there.

The home card had the same problems, which mattered most: it's the card every
bare `cathode.co` link gets.

## Why the checks missed it

Every check looked at the card at full size, on its own. Chat apps show it
small, next to other cards, and WhatsApp center-crops the tall card into a
square thumbnail. Nobody looked at it that way before shipping.

## What fixed it

- **Anchor photos where their subject is.** Event banners are composed with
  the subject on the left, so the card uses `objectPosition: 'left center'`
  and never center-crops. On tall cards the photo is a band across the top
  56%, fading into the card; on wide cards it fills the right 58%.
- **Size type for a phone.** Tall titles now run 132 → 104 → 80 → 68px by
  length (were 104 → 84 → 68 → 56), with subtitles at 42px. Long titles step
  down sooner, so they fit under the photo band instead of climbing into it.
- **Center cards that have no photo.** The text only sits low when there's a
  photo above it.
- **Keep wide text off the photo.** On wide cards with a photo, the text block
  is capped at about half the width.
- **One universal card for the site,** after lfg-hub's default
  (`ai-labs/dididecks-ai/client-sites/lfg-hub/public/ogimage__LFG-Hub--Default.jpg`):
  mark top left, a bracketed kicker, the headline as big as the frame allows
  with its last word in the accent color, one line under it, and a ruled
  footer. Its content sits in the middle third, so WhatsApp's square crop
  still shows the headline.

## How to check next time

Look at every card the way it will be seen, not full-size:

```bash
# Tall card at chat-preview size, and WhatsApp's center square
magick card-tall.jpg -resize x480 preview.png
magick card-tall.jpg -gravity center -crop 1080x1080+0+0 +repage -resize 200x square.png
```

If the headline isn't readable in both, the card isn't done. Better still,
send the link to yourself in iMessage before calling it shipped.
