
❯ Let's make the dojo/index.astro page

  Remember we are using system tokens only, all modes.

  On the left side, 2/3 of container (should have some kind of default width for the main content).  This will contain the hero content "Core Message" component.

  On the right side, 1/3 of container.  This will contain a smaller "Alternate CTA" component with some text.  It will be an invitation to read our content.  

```astro
---
/* -----------
  User Settings and Configuration
  These values will be used throughout the page
-----------*/
/* 
  Page Metadata
*/
const pageTitle = "The nerdiest Agentic VC Dojo for venture professionals | hosted by FullStack VC."
const pageSubtitle = "Practice, build, and level up your AI agent skills with the Kauffman Fellow network."

// Hero Image 
const heroImage = "/images/dojo-hero.jpg"
const ogImage = heroImage

/*

  Messages:
  contextSetter - a phrase that sets the context to anticipate the primary proposition, usually h4
  headerTxt - the main heading text, usually h1
  subheaderTxt - the subheading text, usually p or span, sometimes modified to fit the space. 
  supportingTxt - additional supporting text, usually p or span, sometimes modified to fit the space. 

  NOTE: html tags may or may not be modified inline, but consistent patterns should be componentized for easy maintenance.
*/

const HeroContentCoreMessage = import HeroContentCoreMessage from "@components/hero-content--core-message.astro"

const contextSetter = "The nerdiest Agentic VC Dojo for venture professionals"
const headerTxt = "Hone your skills, build your projects"
const subheaderTxt = "Gain AI Agent superpowers applicable to your real work and needs. We will follow up to assure your hopes and dreams with AI are closer to reality."
const supportingTxt = "Join us, we're getting our hands dirty.  Elbow grease is encouraged. 
const trailingTxt = "A content series by the <a href=\"https://kauffmanfellows.org\">Kauffman Fellows</a> network."

/*
  User Interface
*/

// Call to Action
const ctaText = "Join the Dojo"

// something like this: api/o-auth/dojo/join
const ctaLink = "api/o-auth/dojo/join"
---

<main>
<HeroContentCoreMessage>
<article class="hero-content">
    <h3 class="message-content">{ contextSetter}</h3>
    <h1 class="message-content">{ headerTxt}</h1>
    <h2 id="subheaderTxt" class="message-content">{ subheaderTxt}</h2>
    <p id="supportingTxt" class="message-content--concise">{ supportingTxt}</p>
</article>

<aside class="alternate-cta">
    <p>{ trailingTxt}</p>
</aside>
</main>