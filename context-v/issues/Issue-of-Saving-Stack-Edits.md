---
site_uuid: 821c6de1-a738-4718-98f1-c513ab714316
hex_code: gbn3jy
title: Issue of Saving Stack Edits
date_created: 2026-05-02
date_authored_initial_draft: 2026-05-02
date_authored_current_draft: 2026-08-15
authors:
  - Michael Staton
at_semantic_version: 0.0.1.0
tags:
  - Issue
lede: "Saving stack edits as an authenticated user throws `error:1E08010C:DECODER routines::unsupported` — parked to finish polls first."
summary: "Verbatim capture of a bug report raised mid-session and deliberately deferred: saving stack edits on fullstack-vc fails with an OpenSSL decoder error, which points at key or PEM handling in the commit path. No investigation was done. Treat it as an open lead to pick up once the polls work it interrupted is finished."
---


❯ Okay, so that issue-resolution file is now resolved but the context and background is the same

  Let me point you to the spec we have been working in, and the branch we are on so you can check
  the commit history.  We seem "very close" but no idea how much debugging or small fixes we need.

  By the way, as an "authenticated" user when I tried to "Save" by stack changes at
  `https://fullstack-vc.com/people/mpstaton/stack/edit` I got the following error.

  Error: commit failed: error:1E08010C:DECODER routines::unsupported

  Instead of sending you down the "Save" rabbit hole, let's refocus back on the spec we were
  working in to get polls working.