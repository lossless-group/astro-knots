---
date_created: 2025-07-28
date_modified: 2025-08-21
date_authored_initial_draft: 2025-07-28
date_authored_current_draft: 2025-08-18
date_authored_final_draft:
date_first_published: 2025-03-18
site_uuid: 39273105-c5e3-4c4a-8bb9-6272d88764e0
publish: true
title: "Maintain Embeddable Slides"
slug: maintain-embeddable-slides
at_semantic_version: 0.0.0.1
authors:
  - Michael Staton
augmented_with: "Claude Code on Claude Sonnet 4"
tags: [Slides-as-Code, Slide-Decks, Deck-Generators]
image_prompt: "A small robot stands with a small projector on top of a computer desk, behind the monitor.  He is projecting like old movies were projected, but on the computer monitor is a Keynote slide deck."
banner_image: "https://ik.imagekit.io/xvpgfijuw/uploads/lossless/july/Maintain-Embeddable-Slides_banner_image_1755815513881_vG9H27ZKx.webp"
portrait_image: "https://ik.imagekit.io/xvpgfijuw/uploads/lossless/july/Maintain-Embeddable-Slides_portrait_image_1755815520946_NlMeL6qdl.webp"
square_image: "https://ik.imagekit.io/xvpgfijuw/uploads/lossless/july/Maintain-Embeddable-Slides_square_image_1755815527652_HEYKVBKOm.webp"
---



# Blueprint for Embedding Reveal.js Presentations in Markdown

## This Run of the Blueprint

We have developed a new website called [FullStack VC](https://fullstack-vc.com) and we want to introduce the ability to feature, embed, and use slides.

In at least three sites, we reliably have both markdown-based and Astro-based presentations. So, Reaveal.js is processing markdown content and HTML content.  However, before we proceed with applying this blueprint to FullStack VC, we should discuss whether we want to maintain this approach.  

We have seen video demonstrations on YouTube of making interactive, dynamic presentations with Svelte and GSAP.  We should explore if this is a better approach than using Reveal.js, or if Reveal.js is flexible enough to accommodated SSR and animations.

Working slides functionality across our built and maintained sites include:

- https://www.lossless.group/slides (find code in `/Users/mpstaton/code/lossless-monorepo/site`)
- https://hypernova-site.vercel.app/slides (find code in `/Users/mpstaton/code/lossless-monorepo/astro-knots/sites/hypernova-site`)
- https://the-water-foundation.com/slides (find code in `/Users/mpstaton/code/lossless-monorepo/astro-knots/sites/twf_site`)


### Overview
This specification defines how we embed Reveal.js presentations within rendered markdown files using a consistent syntax that aligns with the existing backlink convention.

> [!NOTE] We aim to use GSAP & Svelte for animations and interactivity in presentations.
> 
> We have had success with Reveal.js as a framework for presentations, but we want to explore how that might be limiting the elegance of a more dynamic, animated, interactive presentation. It's worth discussing before proceeding with this blueprint for another project.

### Context:
We have markdown-based presentations working, and they are embeddable.

We have Astro-based presentations working, but they are not embeddable yet. They only work directly from the `src/pages/slides/` directory and the page that renders.

#### Render Pipeline Architecture:

**Content Organization:**
- Content Team works separately from Web Dev using Obsidian from monorepo root submodule (`/content`)
- Environment Variables allow anyone working in the code to set content repository that is being rendered at either `/site/src/content` or `/content`
- Markdown-based presentations are located in `/content/slides/`
- Astro-based presentations don't have a default location yet - considering `/site/src/content/slides` or `/site/src/pages/slides`

**Directive Processing (`/site/src/utils/markdown/remark-directives.ts`):**
- `directiveComponentMap` maps directive names to components: `"slides": "SlidesEmbed"`, `"slideshow": "SlidesEmbed"`
- `remarkDirectiveTransform` plugin processes `:::slides` directives in markdown
- Extracts slide paths from container content (markdown list items with backlinks)
- Converts directive to `<SlidesEmbed>` component with slides array and config

**Slide Layout (`/site/src/layouts/OneSlideDeck.astro`):**
- RevealJS-based presentation layout with CDN resources
- Provides PDF export functionality and navigation controls
- Configures RevealJS with 16:9 aspect ratio and responsive design
- Includes plugins: Markdown, Highlight, Notes, Zoom

**Markdown Processing (`/site/src/components/markdown/AstroMarkdown.astro`):**
- Lines 1830-1890: Handles `slides`/`slideshow` directives
- `slides`/`slideshow` variants could potentially untangle Astro and Markdown based render piplelines.
- Parses container content for list items with slide backlinks
- Extracts `path` and `title` from link nodes
- Returns `<SlidesEmbed>` component or debug info if no slides found

**Embedding Component (`/site/src/components/SlidesEmbed.astro`):**
- Creates iframe embedding slides via `/slides/embed/[...slug]` route
- Sanitizes paths and builds embed URL with config query parameters
- Supports configuration: theme, transition, controls, progress, autoSlide, loop

**Embed Route (`/site/src/pages/slides/embed/[...slug].astro`):**
- Reads markdown slides from `src/generated-content/slides/` directory
- Uses `MarkdownSlideDeck` layout for consistency
- Processes query parameters for RevealJS configuration

**Astro/HTML presentations (`site/src/pages/slides`) render independently**:
- Direct Astro components using `<OneSlideDeck>` layout with RevealJS
- Each presentation is a standalone `.astro` file (e.g., `Data-Augmentation-Workflow-2.astro`)
- Uses `<Layout>` wrapper with `<OneSlideDeck>` for RevealJS integration
- Contains HTML `<section>` elements for slides with RevealJS classes/attributes
- Accessible directly via `/slides/{filename}` routes
- **NOT currently embeddable** - 
  - embed route only handles markdown from `src/generated-content/slides/`
  - **embedding doesn't work with any route.**

**Current Embedding Limitation**:
- `/slides/embed/[...slug].astro` only reads `.md` files from `src/generated-content/slides/`
- No logic to detect or render Astro component presentations
- Astro presentations exist in `src/pages/slides/` but embed system doesn't check this location
- Need to extend embed route to handle both markdown and Astro presentation types

#### Task at Hand:

Enable Astro presentations to be embeddable in Markdown files that are rendered through our Markdown render pipeline. 

The current system works for markdown-based slides but needs extension to support Astro component slides with a clear path for our team to put the files. It could be in any of:
 - `src/pages/slides/`
 - `src/content/slides/`
 - `/content/slides/`

### Syntax

#### Basic Usage
```markdown
:::slides
- [[essays/my-presentation.md|Introduction to AI]]
- [[essays/deep-learning.md|Deep Learning Fundamentals]]
- [[essays/neural-networks.md|Neural Network Architecture]]
:::
```

#### With Configuration Options
```markdown
:::slides
theme: dark
transition: slide
controls: true
progress: true
autoSlide: 0
loop: false

- [[essays/intro.md|Introduction]]
- [[essays/chapter1.md|Chapter 1: Getting Started]]
- [[essays/chapter2.md|Chapter 2: Advanced Topics]]
:::
```

#### Compact Configuration
```markdown
:::slides theme=dark transition=slide
- [[essays/intro.md|Introduction]]
- [[essays/chapter1.md|Chapter 2]]
:::
```

### Implementation Details

#### 1. Parser Location
Add parsing logic in `/src/components/markdown/AstroMarkdown.astro` around line 982 in the code block switch statement.

#### 2. Parsing Logic
- Extract backlink references using regex pattern: `\[\[(.*?)\|(.*?)\]\]`
- Parse YAML-style configuration options at the beginning
- Support both `key: value` and `key=value` syntax for configuration
- Maintain slide order as specified in the markdown

#### 3. Component Structure
Create a new component `SlidesEmbed.astro` that:
- Accepts parsed slides array with paths and titles
- Accepts configuration object
- Renders an iframe pointing to the reveal.js presentation route
- Handles responsive sizing and aspect ratio

#### 4. URL Construction
The embed component should construct URLs like:
```
/slides/embed?slides=essays/intro.md,essays/chapter1.md&theme=dark&transition=slide
```

Or use a POST request / session storage for complex configurations.

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| theme | string | 'black' | Reveal.js theme name |
| transition | string | 'slide' | Transition style (none/fade/slide/convex/concave/zoom) |
| controls | boolean | true | Show control arrows |
| progress | boolean | true | Show progress bar |
| autoSlide | number | 0 | Auto-advance slides (milliseconds, 0 = disabled) |
| loop | boolean | false | Loop presentation |
| width | string | '100%' | Embed width |
| height | string | '600px' | Embed height |

### Example Rendered Output
The parsed content should render as:
```html
<div class="presentation-embed">
  <iframe 
    src="/slides/embed?slides=..." 
    width="100%" 
    height="600px"
    frameborder="0"
    allowfullscreen
  />
</div>
```

### Error Handling
- If a linked markdown file doesn't exist, show a warning in development
- Gracefully skip missing files in production
- Validate configuration options and use defaults for invalid values

### Security Considerations
- Sanitize all paths to prevent directory traversal
- Validate that linked files are within allowed content directories
- Escape all user-provided configuration values

### Future Enhancements
- Support for speaker notes syntax
- Ability to specify individual slide transitions
- Support for slide-specific themes
- Export to PDF functionality from embedded view