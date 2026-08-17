---
title: Services Section as a Tiered, Categorized Card Catalog
lede: A Sveltia-CMS-driven Services surface where Categories sit in the top nav, service Cards display in overlapping decks, each Card belongs to a Tier (progressive reveal), exposes public + guarded copy, and lets the visitor add optional included_tags that increment the displayed price before sending the whole composed order to WhatsApp.
date_created: 2026-05-20
date_modified: 2026-05-20
authors:
  - Michael Staton
augmented_with: Claude Code (Opus 4.7)
semantic_version: 0.0.0.3
status: Draft
category: Spec
tags:
  - Arthouse-Site
  - Services
  - Sveltia-CMS
  - Card-Catalog
  - Tiered-Pricing
  - WhatsApp-Order
  - Public-vs-Guarded
from: arthouse-site
from_path: specs/Services-Section-as-Tiered-Card-Catalog.md
---
<!-- Rolled up from arthouse-site/context-v/specs/Services-Section-as-Tiered-Card-Catalog.md. Edit at the source, not here. Re-run `pnpm rollup:sync` to refresh. -->

# Services Section as a Tiered, Categorized Card Catalog

**Audience:** the next agent (or human) wiring the Services page on `arthouse-site`. Read this *before* touching `src/pages/services/` or the `pricing` collection in `public/admin/config.yml`.

**TL;DR:** the existing `pricing` collection is a flat list of tiers. The new shape is **Category → Card → Tier**, where Tier is a *progressive reveal* of the same Card's deeper offering (think: free / standard / premium versions of the *same* service idea), Categories are the top-nav swipe axis, and each Card composes its final price + WhatsApp message from a baseline plus the user's tag selections.

Related: [[Sveltia-Constraints-for-CMS]] — what we cannot do in Sveltia (no custom media library plugins, `relation` widget is the load-bearing escape hatch).

---

## 1. Why this document exists

The current `/services` page is a stub. The current `pricing` collection (`src/content/pricing/standard.md`) is a flat single-axis tier list — it can't express:

- **Category** (e.g., *Portrait Sessions*, *Boudoir*, *Events*, *Couples*) — the top-nav axis
- **Tier as progression within a Card** (taste → standard → premium of the *same* service, swiped through one at a time, not a checkbox list of features)
- **Included tags as priced increments** — visitor taps `+` to add an optional included_tag, the displayed price ticks up live, the WhatsApp deeplink sends the full composed order
- **Public vs guarded copy** — public-by-default, with a "reveal" button that exposes more candid copy for visitors who actually want it

Sveltia is the editor. She must be able to add a new Category, a new Card in that Category, new Tiers on a Card, and new optional tags + their price deltas without touching code.

---

## 2. Domain model

Three nested collections; one optional shared vocabulary:

```
Category (top-nav)
  └─ Card (one service idea)
       └─ Tier (taste → standard → premium of THIS card)
       └─ Optional Tags Catalog (per-card, with price deltas)
       └─ Public Copy + Guarded Copy
```

Plus a shared catalog (promoted to first-class collection):

- **`service-items`** — the named atomic offerings she sells (e.g., `10-Edited-Photos`, `Online-Gallery`, `Print-Release`, `Hair-and-Makeup`, `Second-Location`, `Outdoor-Permit`). Each item has a slug (Train-Case), a label, a one-line description, an optional default price (used as a fallback when a Card surfaces it as an add-on without overriding), and a kind (see §6). Cards consume items in two roles:
  - **Included** — baked into a Tier (or into a custom_time Card baseline). Visitor doesn't pay extra; the chip is filled / non-interactive.
  - **Available via `+`** — surfaced as an outline chip with a price-delta. Visitor can opt in.

Same item can play either role on different Cards. That's the whole point — the catalog is the source of truth, the Card composes from it.

### 2.1 Category

- Sits in the top nav of `/services`
- Visitor swipes / arrow-taps between categories — only one Category's deck is on screen at a time
- Has its own ordering (`sort_order`)
- Slug drives the URL fragment: `/services#portrait`, `/services#boudoir`, etc.

### 2.2 Card

- Belongs to exactly one Category
- Has a title, a hero image (ImageKit path — same catalog pattern as `images` collection), public copy, guarded copy
- Owns 1+ Tiers (a Card with one Tier is fine — it just doesn't progress)
- Owns 0+ Optional Tags (per-card, because what's optional for "Portrait" isn't optional for "Event")
- Owns 1 WhatsApp template (the message scaffold; price + selections substituted at click time)

### 2.3 Tier

- A child of a Card. Ordered.
- Has a label (`Taste`, `Standard`, `Premium` — or whatever she names them)
- Has a base price (number, in EUR — display formatting handled at render)
- Has its own `included_tags` (the things baked in at this Tier; visitor doesn't pay extra for these)
- Has its own copy fragment (what makes *this* Tier different from the prior one)
- The Card flips between Tiers — see §4.2

### 2.4 Billing Mode (per-Card)

Not every service is sold as a fixed-price package. Two billing modes coexist on the same `/services` page:

- **`package`** (default) — the model already described: Tiers with `base_price_eur`, optional add-ons increment a fixed total.
- **`custom_time`** — used when a proprietor books her by the hour / day / multi-day at a posted rate. Examples: studio residencies, art-direction days, multi-day shoots on location. No "Tiers" in the progressive sense; instead the Card exposes one or more **rate units** (e.g., per-hour, per-day, per-3-day-block) and a *duration picker* the visitor sets before requesting on WhatsApp.

A Card declares its mode via a `billing_mode` field. The two modes share the rest of the Card model (title, hero image, public/guarded copy, optional add-ons, WhatsApp template) — only the price-and-flip surface differs.

### 2.5 Optional Tags (per-Card add-ons)

- Each entry: `tag` (must exist in the shared vocabulary), `price_delta` (number, EUR), optional `note` (one-line description)
- Surfaced as `+` chips on the active Tier's card
- Tapping a `+` chip increments the displayed price by `price_delta` and adds the tag to the composed order
- Tapping again removes it

---

## 3. Sveltia collection design

Two new collections replace the current single `pricing` collection. The current `pricing` collection should be **kept temporarily** until the new shape is populated, then removed (don't migrate data automatically — she'll re-enter through the new UX since the new model is richer).

### 3.1 `service-items` (the catalog)

```yaml
- name: service-items
  label: "Service Items (Catalog)"
  label_singular: "Item"
  folder: src/content/service-items
  extension: md
  create: true
  delete: true
  identifier_field: slug
  fields:
    - { name: label, label: "Display Label", widget: string,
        hint: "What the chip says. Example: 10 Edited Photos, Hair & Makeup" }
    - { name: slug, label: "Slug (Train-Case)", widget: string,
        hint: "Stable id. Train-Case per project convention. Example: 10-Edited-Photos, Hair-and-Makeup" }
    - { name: description, label: "One-line description", widget: string, required: false,
        hint: "Hover / accessibility text. Keep it short." }
    - name: kind
      label: "Kind"
      widget: select
      options: ["deliverable", "production", "logistic", "post-production"]
      default: "deliverable"
      required: false
      hint: "Loose grouping. Deliverable = something she hands to the client. Production = something done during the shoot. Logistic = travel/permits. Post-production = editing/retouching."
    - { name: default_price_eur, label: "Default Price (EUR, optional)", widget: number, required: false, min: 0,
        hint: "If set, Cards offering this item as an add-on default to this price. They can override per Card." }
    - { name: public, label: "Visible to public?", widget: boolean, default: true,
        hint: "Uncheck to draft an item before exposing it." }
```

### 3.2 `service-categories`

```yaml
- name: service-categories
  label: "Service Categories"
  label_singular: "Category"
  folder: src/content/service-categories
  extension: md
  create: true
  delete: true
  identifier_field: slug
  fields:
    - { name: title, label: "Category Name", widget: string,
        hint: "Shown in the top nav. Example: Portrait, Boudoir, Couples, Events" }
    - { name: slug, label: "Slug", widget: string,
        hint: "Lowercase, dash-separated. Drives /services#slug" }
    - { name: sort_order, label: "Display Order", widget: number, default: 100 }
    - { name: subhead, label: "One-line Subhead", widget: string, required: false,
        hint: "Sits under the category title in the swipe nav." }
    - { name: public, label: "Visible in nav?", widget: boolean, default: true,
        hint: "Uncheck to draft a category without exposing it yet." }
```

### 3.3 `service-cards`

```yaml
- name: service-cards
  label: "Service Cards"
  label_singular: "Card"
  folder: src/content/service-cards
  extension: md
  create: true
  delete: true
  identifier_field: slug
  fields:
    - { name: title, label: "Card Title", widget: string }
    - { name: slug, label: "Slug", widget: string }
    - name: category
      label: "Category"
      widget: relation
      collection: service-categories
      search_fields: [title, slug]
      value_field: slug
      display_fields: [title]
    - { name: sort_order, label: "Order within Category", widget: number, default: 100 }
    - name: hero_image
      label: "Hero Image"
      widget: relation
      collection: images
      search_fields: [title, slug, tags]
      value_field: slug
      display_fields: [title]
      hint: "Pick from the image catalog. Card uses this as its face."
    - { name: public_copy, label: "Public Copy (SEO-visible)", widget: markdown,
        hint: "Shown by default. Search engines + LLMs see this." }
    - { name: guarded_copy, label: "Guarded Copy (reveal button)", widget: markdown,
        required: false,
        hint: "Hidden until the visitor taps Reveal. Not in SSR HTML — rendered client-side after consent click." }
    - { name: whatsapp_template, label: "WhatsApp Message Template", widget: text,
        hint: "Use {{tier}}, {{price}}, {{tags}}, {{card}}, {{duration}}, {{rate_unit}}. Example for package mode: 'Hi! I'm interested in {{card}} — {{tier}} ({{price}}) with {{tags}}.' Example for custom_time: 'Hi! Booking inquiry for {{card}}: {{duration}} × {{rate_unit}} = {{price}}. Add-ons: {{tags}}.'" }
    - name: billing_mode
      label: "Billing Mode"
      widget: select
      options: ["package", "custom_time"]
      default: "package"
      hint: "package = fixed-price Tiers (e.g., portrait packages). custom_time = booked by hour/day/multi-day at a rate."
    - name: rate_units
      label: "Rate Units (only used when Billing Mode = custom_time)"
      widget: list
      required: false
      hint: "One entry per rate the visitor can pick. Example: per_hour at €250, per_day at €1500, per_3_days at €4000."
      fields:
        - { name: label, label: "Display Label", widget: string,
            hint: "Example: Hourly, Day Rate, 3-Day Booking" }
        - { name: unit, label: "Unit", widget: select,
            options: ["hour", "half_day", "day", "multi_day"], default: "hour" }
        - { name: multi_day_block, label: "If multi_day, block size (days)", widget: number, required: false, min: 2,
            hint: "Only meaningful when unit = multi_day. Example: 3 means a 3-day block." }
        - { name: rate_eur, label: "Rate (EUR, number)", widget: number, min: 0 }
        - { name: min_quantity, label: "Minimum bookable quantity", widget: number, default: 1, min: 1,
            hint: "Example: 4 means visitor must book at least 4 hours / days / blocks." }
        - { name: max_quantity, label: "Maximum bookable quantity (optional)", widget: number, required: false, min: 1 }
    - name: tiers
      label: "Tiers (progressive reveal)"
      widget: list
      hint: "Order them from entry-level to premium. Visitor flips through one at a time."
      fields:
        - { name: label, label: "Tier Label", widget: string,
            hint: "Example: Taste, Standard, Premium, Signature" }
        - { name: base_price_eur, label: "Base Price (EUR, number)", widget: number, min: 0 }
        - name: included_items
          label: "What's Included (baked in, picked from the catalog)"
          widget: list
          hint: "Picked from service-items. Filled, non-interactive chips on this tier."
          field:
            name: item
            label: "Item"
            widget: relation
            collection: service-items
            search_fields: [label, slug]
            value_field: slug
            display_fields: [label]
        - { name: tier_copy, label: "What makes THIS tier different", widget: markdown, required: false }
        - name: hero_image
          label: "Tier Hero Image (optional)"
          widget: relation
          collection: images
          search_fields: [title, slug, tags]
          value_field: slug
          display_fields: [title]
          required: false
          hint: "Lets a more premium tier show a more enticing image. If empty, falls back to the Card's hero." 
    - name: optional_addons
      label: "Optional Add-ons (the + chips, picked from catalog)"
      widget: list
      required: false
      hint: "Picked from service-items. Renders as outline + chips on the active tier. Tap = add to order + increment price."
      fields:
        - name: item
          label: "Item"
          widget: relation
          collection: service-items
          search_fields: [label, slug]
          value_field: slug
          display_fields: [label]
        - { name: price_delta_eur, label: "Price Delta (EUR) — overrides item's default_price_eur if set",
            widget: number, required: false, min: 0,
            hint: "Leave empty to use the item's default_price_eur from the catalog. Set a value to override per Card." }
        - { name: note, label: "Per-Card note (optional)", widget: string, required: false,
            hint: "Overrides the item's description if you want a Card-specific framing." }
```

### 3.4 Why three collections, not one nested

Sveltia's `relation` widget is the join. Items listed once in the catalog, Categories listed once in the nav, Cards reference both by slug. Keeps each surface lightweight and lets each evolve independently: she can rename a Category, retire an item, or restructure a Card without touching the others.

---

## 4. Page UX

### 4.1 Top nav — categories

- Horizontal strip at the top of `/services`
- Swipe left/right on touch, ←/→ arrow keys on desktop, click directly to jump
- Active Category's slug becomes the URL fragment (`/services#portrait`) so deep-links work and back-button history feels right
- Categories with `public: false` don't render

### 4.2 Card deck — the overlap + tap-to-reveal motion

Within the active Category:

- Cards render as a *stack*, slightly fanned (the 2nd and 3rd peek behind the front one)
- The front card is interactive; tap it to "open" — animates to a focused state, others slide aside
- Inside an open Card, **Tiers are a horizontal carousel** — left/right arrows on the card flip between `Taste`, `Standard`, `Premium`
- Tier flip animates content (price + included chips + copy) but keeps the Card frame stable so the visitor knows they're on the same service

**Stacked preview face (decided):** behind the front card, each rear card shows roughly its top **2/3 image + bottom 1/3 preview strip**. The preview strip contains:

- Card title
- Baked-in `included_tags` for the *default* Tier (Tier 1 by convention — the entry-level offering)
- A `Reveal` affordance (chevron / arrow / "Open")

Rationale: the image is the seduction, the tags are the substance, the reveal is the invitation. No price on the stacked face — price lives in the opened state where it can be composed dynamically. The 2/3-image / 1/3-text ratio means the visual still leads.

**Per-tier images (decided):** each Tier may carry its *own* hero image, not just the Card. This lets a premium Tier present a more enticing / suggestive frame than the entry Tier — same service, more aspirational visual. If a Tier omits `hero_image`, it falls back to the Card-level hero. The stacked-card face uses the Card-level (default) hero; opened Tier carousel swaps the image as the visitor flips. See §3.2 for the field addition.

### 4.3 Included chips + optional add-ons

On the active Tier face:

- **Baked-in tags** render as filled chips (already paid for at this tier — visual only, not interactive)
- **Optional tags** render as outline chips with a `+`
- Tap an optional chip: it fills in, the `+` flips to `−`, the displayed price increments by its delta with a tick animation
- Tap again: it reverts
- Selections persist while the visitor flips Tiers — but each Tier may have a different baked-in set, so on Tier change, any selected optional that's *baked in at the new tier* should auto-collapse into the baked set (no double-charging)

### 4.4 Custom-time billing — duration picker

When a Card's `billing_mode` is `custom_time`, the opened-card surface looks different:

- **No Tier carousel.** Instead, a *rate unit selector* (segmented control or pill row): `Hourly | Day | 3-Day Booking` — whatever the Card declares
- **A quantity stepper** next to it: `−  4  +` (defaulting to `min_quantity`, capped at `max_quantity` if set)
- **Live price** = `selected rate × quantity + sum of selected add-ons`
- The same `+ chips` optional add-ons system works unchanged (they're modeled at the Card level, billing-mode-agnostic)
- The stacked-card preview face for a `custom_time` Card shows: title + a "from €X / unit" line (using the cheapest declared rate) + reveal — no included_tags on the preview, since there are no Tiers to bake them into

WhatsApp template gains two substitutions for this mode:

- `{{duration}}` → e.g., `"4 hours"`, `"2 days"`, `"two 3-day blocks (6 days)"`
- `{{rate_unit}}` → display label of the selected rate unit
- `{{price}}` → composed total
- `{{tags}}` → selected add-ons (still works)

### 4.5 Public vs guarded copy

- `public_copy` renders in SSR HTML — search engines, LLMs, scrapers see it
- `guarded_copy` does **not** render in initial HTML. There's a `Reveal more` button (or similar — see §9.2 for naming) that, when clicked, fetches/reveals the guarded markdown client-side
- "Guarded" here means *not in the initial DOM*. It is not security. If she wants real access control, that's a separate layer (passcode gate, GitHub OAuth, etc.) — out of scope for this spec.
- Implementation: ship `guarded_copy` as a `data-*` attribute (base64 or as a hidden `<template>`), reveal on click. Keeps it out of the SSR-rendered HTML stream that bots typically scrape — but anyone viewing source can find it. Document that limitation explicitly in the CMS hint copy.

### 4.6 WhatsApp deeplink — the composed order

On the active Tier, a primary CTA `Request on WhatsApp`:

- Compiles the `whatsapp_template` substituting:
  - `{{card}}` → Card title
  - `{{tier}}` → Tier label
  - `{{price}}` → composed total (base + sum of selected add-ons), formatted as `€X`
  - `{{tags}}` → comma-joined list of *all* tags in the order (baked + selected optional)
- Opens `https://wa.me/<PHONE>?text=<encoded>` in a new tab
- Phone number comes from a site-wide setting — propose adding it to `src/content/theme/` or a new `src/content/contact.md` single-file collection. Don't hardcode.

---

## 5. Routing + rendering

- `/services` renders all Categories + their Cards in one page (SPA-feel within the section)
- URL fragment reflects active Category: `/services#portrait`
- We do **not** create per-card or per-category routes. Cards aren't standalone destinations.
- The page is server-rendered with the *public* copy fully inlined for SEO. Tier flip, chip toggle, price math, guarded reveal — all client-side (Svelte component, per the Arthouse stack).

---

## 6. The `service-items` catalog — first-class, not a tag dictionary

Decision (was an open question, now resolved): **the shared vocabulary is promoted to a real collection** (`service-items`, §3.1). Reasons:

- The same atomic offering (`Hair-and-Makeup`, `Print-Release`, `Second-Location`) genuinely repeats across Cards — sometimes baked in, sometimes optional, sometimes priced differently. A flat tag string can't carry that.
- Sveltia's `relation` widget makes picking from the catalog as fast as typing a tag, with the bonus of typeahead and zero drift.
- A central `default_price_eur` per item gives her one place to update an across-the-board rate (e.g., raising the H&M fee everywhere) — Cards that override stay overridden; Cards that didn't auto-pick up the new default.

### Item `kind` — loose grouping, not enforcement

The `kind` select (`deliverable | production | logistic | post-production`) is for her benefit when scanning the catalog. The renderer may or may not use it for visual grouping of chips. **Open question §9.3.**

### Migration

When seeding the first Card, she creates the items first (one short Sveltia entry each), then composes the Card by picking from them. The friction is one-time per item; afterwards the catalog grows additively.

---

## 7. SEO + LLM-visibility implications

- `public_copy` per Card lands in the SSR HTML → indexable
- Each Category becomes an anchor (`#portrait`, etc.) — link to those from internal nav + sitemap entries
- Per the open-graph-share-seo-geo skill: if we want Services as a notable surface in `/llms.txt`, add a line per Category linking to `/services#<slug>`
- `guarded_copy` is intentionally *not* SEO-visible. That's the point. Document this so future-her doesn't put load-bearing keywords inside the guarded block expecting them to rank.

---

## 8. Migration of existing `pricing` collection

The existing `src/content/pricing/standard.md` should be:

1. Translated by hand into ONE Card in ONE new Category during the first dogfood pass — confirms the model holds
2. Old `pricing` collection left in `config.yml` but its folder eventually emptied and the collection removed in a follow-up commit
3. Any references in `src/pages/` to `pricing` content updated to point at the new collections

Do not write a programmatic migration. Volume is tiny; manual re-entry through the new Sveltia UX validates the editor flow.

---

## 9. Open questions (decide before build)

### 9.1 Stacked-card preview face — RESOLVED

See §4.2: title + included_tags + reveal affordance on bottom 1/3, image dominates the top 2/3. Per-Tier images supported with fallback to Card hero.

### 9.2 What do we call the reveal button?

`Reveal more` is generic. Options aligned to Arthouse's voice:
- `Tell me more`
- `The full story`
- `Behind the curtain`
- `Read on`

Pick one with her. The CMS hint should warn that this text is the same across all Cards (site-level, not per-Card) — or, if she wants per-Card variation, we add a `reveal_label` field on the Card.

### 9.3 Group chips visually by `kind`?

The `service-items` catalog gives every item a `kind` (`deliverable | production | logistic | post-production`). On the opened Card, should the chips group/sort by kind (so all "deliverables" cluster together, then "production", etc.)? Or just render in the order she listed them on the Card? Default proposal: **respect her ordering** — kind is for catalog organization, not render grouping. Revisit if chip walls get cluttered.

### 9.4 Currency + locale

All prices in EUR. Display format: `€150` (no decimals for whole-euro prices, `€150.50` if a delta produces one). Confirm that's the desired format.

### 9.5 Hero image required?

Should a Card without `hero_image` fail to render, or fall back to a Category default? Default proposal: render a styled placeholder using the Category's color so missing images don't break the deck.

### 9.6 Tier label set — free or constrained?

She types Tier labels freely (`Taste`, `Signature`, etc.). Should we constrain to a fixed select (`Taste / Standard / Premium`) for visual consistency across Categories? Default proposal: **free-text** — each Category may have a different progression metaphor, that's expressive, not chaotic.

### 9.7 What goes in `whatsapp_template` by default

Suggest a default template string she can copy when creating a new Card:

> `Hi! I'm interested in {{card}} — {{tier}} ({{price}}). Included: {{tags}}.`

She edits to taste per Card.

---

## 10. Build order (when we move to implementation)

1. Add `service-categories` and `service-cards` collections to `public/admin/config.yml`
2. Add Astro content collection definitions in `src/content/config.ts` (or wherever schemas live)
3. Seed one Category + one Card + one Tier via hand-written markdown so the page can render before Sveltia commits exist
4. Build the Svelte component for the deck (one component, accepts Categories array) — server-renders public copy, hydrates for interactivity
5. Wire WhatsApp deeplink composition
6. Wire guarded reveal
7. Style pass — chip animation, price tick, card overlap
8. Dogfood: she enters a second Category through Sveltia end-to-end. Iterate on field hints based on what confuses her.

Component placement follows the Arthouse stack — Svelte component (this is a UI surface, not markdown processing), styled with site tokens, no React. Per [[astro-knots-philosophy]] and the Arthouse-site CLAUDE.md.

---

## 11. References

- [[Sveltia-Constraints-for-CMS]] — what Sveltia can and can't do; why `relation` is load-bearing
- `public/admin/config.yml` — current Sveltia collections
- `src/pages/services/index.astro` — current stub
- `src/content/pricing/standard.md` — current flat tier (to be migrated by hand)
- WhatsApp deeplink format: `https://wa.me/<E.164 phone>?text=<URL-encoded message>`
