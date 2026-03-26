---
title: "Astro Knots is not a True Monorepo"
lede: "A reminder that Astro-Knots is organized like a monorepo but functions as a collection of independent Astro projects for convenient pattern porting."
date_created: 2025-11-15
date_modified: 2025-12-15
status: Published
category: Reminders
tags: [monorepo, architecture, astro-knots, patterns]
authors:
  - Michael Staton
---

# Reducing Confusion

The `Astro-Knots` is organized as if it is a monorepo, but it is not really.  It is more a collection of Astro projects to make porting functionality between sites easier and more convenient.  

We had ideas of releasing packages that the various sites we manage can consume instead of replicating lots of code, but for now that hasn't been implemented and we can't imagine it working all that well. 

So, for now, all features need to be implemented in each site's codebase.  