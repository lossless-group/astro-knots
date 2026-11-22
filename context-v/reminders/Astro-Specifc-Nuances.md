---
title: 'Respect the framework nuances, read the docs'
date_authored_initial_draft: 2025-03-12
date_authored_final_draft: null
date_first_published: null
date_last_updated: null
at_semantic_version: 0.0.0.1
status: To-Do
augmented_with: 'Windsurf Cascade on Claude 3.5 Sonnet'
category: Reminders
date_created: 2025-03-12
date_modified: 2025-04-21
lede: 'Brief description of the reminder functionality and purpose'
date_authored_current_draft: 2025-04-21
site_uuid: 03842d81-d318-4483-833e-9292b26c9c8c
portrait_image: https://ik.imagekit.io/xvpgfijuw/uploads/lossless/reminders/2025-05-05_portrait_image_Astro-Specifc-Nuances_037b7475-5fe6-4be2-8585-0c2f8f09711c_EywmY5ozr.webp
image_prompt: ''
tags: [Astro, Web-Frameworks, Code-Generators]
authors: 
  - Michael Staton
banner_image: https://ik.imagekit.io/xvpgfijuw/uploads/lossless/reminders/2025-05-05_banner_image_Astro-Specifc-Nuances_45431b20-c669-4f25-ae39-925d80aa2f0b_CZZHD_Rfz.webp
---
This project is in Astro. We are avoiding implementing an additional framework until we absolutely must. 

The list of documentation we have referenced before is in:
[[lost-in-public/reminders/Read-Relevant-Documentation-before-major-edits.md|Read Relevant Documentation before major edits]]

# Astro does not Use JSX or React by default

Do not use JSX or React syntax when writing components.  They break the build and render.

DO NOT USE JSX STYLE COMMENTING in components, particulary in the HTML of the component. IT CAUSES ERRORS THAT ARE HARD TO DEBUG, ONLY BECAUSE WHY WOULD THERE BE JSX STYLE COMMENTS IN AN HTML COMPONENT?

TRY TO KEEP JAVASCRIPT IN FRONTMATTER as a matter of convention. 
