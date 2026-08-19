---
title: "Astro Knots is not a True Monorepo"
lede: "A reminder that Astro-Knots is organized like a monorepo but functions as a collection of independent Astro projects for convenient pattern porting."
date_created: 2025-11-15
date_modified: 2025-12-15
status: Published
category: Reminders
tags: [Monorepo, Architecture, Astro-Knots, Patterns]
authors:
  - Michael Staton
site_uuid: cb9a6315-c7b8-44bb-9cb3-da2bd4422670
hex_code: diby1f
date_authored_initial_draft: 2025-11-15
date_authored_current_draft: 2025-11-15
publish: true
---

# Reducing Confusion

The `Astro-Knots` is organized as if it is a monorepo, but it is not really.  It is more a collection of Astro projects to make porting functionality between sites easier and more convenient.  

We had ideas of releasing packages that the various sites we manage can consume instead of replicating lots of code, but for now that hasn't been implemented and we can't imagine it working all that well. 

So, for now, all features need to be implemented in each site's codebase.  