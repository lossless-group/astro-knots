---
title: "Maintain a Rigorous Test Suite"
lede: "With AI Code Assistants on the rise, maintaining a rigorous test suite is more important than ever. Maintaining a test suite that catches regressions and ensures the website is performing as expected is a must."
date_authored_initial_draft: 2025-10-14
date_authored_current_draft: 2025-10-14
date_authored_final_draft: 2025-10-14
date_first_published: null
date_last_updated: 2025-10-14
at_semantic_version: 0.0.1.1
publish: false
status: Idea
augmented_with: "Claude Sonnet 4 on Claude Code"
category: Marketing-Site
date_created: 2025-10-14
date_modified: 2025-10-14
authors:
  - Michael Staton
image_prompt: "A busy intersection has convertibles coming from all sides, many in the wrong lanes. Each convertible has their backseat filled with software code, stacked on top of each other, often flying off the back of the car. There is a traffic policeman in the middle of the insersection, trying to direct traffic to assure there is not a wreck."
slug: maintain-a-rigorous-test-suite
tags: [Acceptance-Testing, Test-Driven-Development]
---
Recommended Test Strategy

  1. E2E/Acceptance Tests with Playwright (Priority 1)

  This would have caught our production issues immediately.

```ts
  // tests/acceptance/sections-render.spec.ts
  test('all homepage sections are visible', async ({ page }) => {
    await page.goto('/');

    // Verify sections actually render (not just exist in DOM)
    await expect(page.locator('#hero')).toBeVisible();
    await expect(page.locator('#problem')).toBeVisible();
    await expect(page.locator('#solution')).toBeVisible();
    await expect(page.locator('#narrative')).toBeVisible();
    await expect(page.locator('#benefits')).toBeVisible();
    await expect(page.locator('#waitlist')).toBeVisible();

    // Verify no console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('reveal animations trigger on scroll', async ({ page }) => {
    await page.goto('/');

    // Initially hidden
    const section = page.locator('#benefits .reveal-on-scroll').first();
    await expect(section).toHaveCSS('opacity', '0');

    // Scroll into view
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(700); // wait for animation

    // Should be visible
    await expect(section).toHaveClass(/in-view/);
    await expect(section).toHaveCSS('opacity', '1');
  });
```

  Why Playwright?
  - Tests against actual built site (catches production issues)
  - Visual regression testing built-in
  - Can test multiple browsers
  - Excellent debugging tools
  - Works with your static builds

  2. Build Validation Tests (Priority 2)

  Ensure builds produce expected output:
```ts
  // tests/build/validation.spec.ts
  import { test, expect } from '@playwright/test';
  import fs from 'fs';
  import path from 'path';

  test('production build contains all expected pages', () => {
    const distPath = './dist';

    const requiredPages = [
      'index.html',
      'jam-with/neo/index.html',
      'formalities/privacy/index.html',
      'formalities/terms-of-service/index.html',
    ];

    requiredPages.forEach(page => {
      const filePath = path.join(distPath, page);
      expect(fs.existsSync(filePath), `${page} should exist`).toBeTruthy();
    });
  });

  test('all referenced assets exist', () => {
    // Parse HTML and check that all src/href assets exist
    const indexHtml = fs.readFileSync('./dist/index.html', 'utf-8');
    const assetMatches = [
      ...indexHtml.matchAll(/src="([^"]+)"/g),
      ...indexHtml.matchAll(/href="([^"]+)"/g),
    ];

    assetMatches.forEach(match => {
      const assetPath = match[1];
      if (assetPath.startsWith('/')) {
        const fullPath = path.join('./dist', assetPath);
        expect(fs.existsSync(fullPath), `Asset ${assetPath} should exist`).toBeTruthy();
      }
    });
  });
```

  3. Component Tests with Vitest (Priority 3)

  For your Svelte components and utilities:

```ts
  // tests/unit/revealObserver.test.ts
  import { describe, it, expect, vi } from 'vitest';

  describe('IntersectionObserver setup', () => {
    it('adds in-view class when element intersects', () => {
      // Mock IntersectionObserver
      const observe = vi.fn();
      global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
        observe,
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      }));

      // Test your observer logic
    });
  });
```
  4. Accessibility Tests (Priority 4)

```ts
  // tests/a11y/homepage.spec.ts
  import { test, expect } from '@playwright/test';
  import AxeBuilder from '@axe-core/playwright';

  test('homepage has no accessibility violations', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .analyze();

    expect(results.violations).toEqual([]);
  });
```

  Recommended Setup
```json
  // package.json
  {
    "scripts": {
      "test": "playwright test",
      "test:unit": "vitest",
      "test:build": "pnpm build && playwright test tests/build",
      "test:e2e": "playwright test tests/acceptance",
      "test:e2e:ui": "playwright test --ui",
      "test:visual": "playwright test --update-snapshots"
    },
    "devDependencies": {
      "@playwright/test": "^1.40.0",
      "@axe-core/playwright": "^4.8.0",
      "vitest": "^1.0.0"
    }
  }
```
```ts
  // playwright.config.ts
  import { defineConfig, devices } from '@playwright/test';

  export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,

    // Test against built site
    webServer: {
      command: 'pnpm preview',
      port: 4321,
      reuseExistingServer: !process.env.CI,
    },

    use: {
      baseURL: 'http://localhost:4321',
      trace: 'on-first-retry',
      screenshot: 'only-on-failure',
    },

    projects: [
      { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
      { name: 'mobile', use: { ...devices['iPhone 13'] } },
    ],
  });
```
  Acceptance Criteria Template

  For each new feature/section:

  ## Acceptance Criteria

  - [ ] Section renders in both dev and production builds
  - [ ] Section is visible (opacity: 1) after animations complete
  - [ ] All referenced assets exist and load
  - [ ] No console errors
  - [ ] Animations respect prefers-reduced-motion
  - [ ] Passes accessibility audit (axe-core)
  - [ ] Works on mobile and desktop viewports
  - [ ] Internal links navigate correctly
  - [ ] Forms submit without errors

  CI/CD Integration
```yaml
  # .github/workflows/test.yml
  name: Tests
  on: [push, pull_request]

  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v2
        - uses: actions/setup-node@v4
          with:
            node-version: 18
            cache: 'pnpm'

        - run: pnpm install
        - run: pnpm build
        - run: pnpm test

        - uses: actions/upload-artifact@v4
          if: failure()
          with:
            name: playwright-report
            path: playwright-report/
```
  This approach would have caught:
  - ✅ Sections not visible in production (E2E tests)
  - ✅ Broken imports (build validation)
  - ✅ Missing assets (asset validation)
  - ✅ Console errors (E2E tests)


# Alternative Testing Suites:
Here's a comprehensive comparison of testing tools for your Astro
  static site:

  E2E/Acceptance Testing Alternatives

  1. Cypress

  Most popular Playwright alternative.

  ```js
  // cypress/e2e/sections.cy.js
  describe('Homepage sections', () => {
    it('all sections are visible', () => {
      cy.visit('/');
      cy.get('#hero').should('be.visible');
      cy.get('#problem').should('be.visible');
      cy.get('#solution').should('be.visible');

      // Check no console errors
      cy.window().then((win) => {
        cy.spy(win.console, 'error').should('not.be.called');
      });
    });

    it('animations trigger on scroll', () => {
      cy.visit('/');
      cy.get('#benefits .reveal-on-scroll')
        .should('have.css', 'opacity', '0')
        .scrollIntoView()
        .should('have.class', 'in-view')
        .should('have.css', 'opacity', '1');
    });
  });
  ```

  Pros:
  - ✅ Best developer experience (excellent UI, time-travel debugging)
  - ✅ Great documentation and community
  - ✅ Built-in component testing
  - ✅ Automatic waiting and retry logic
  - ✅ Visual regression testing via plugins

  Cons:
  - ❌ Only runs in real browsers (can be slower)
  - ❌ Chrome/Firefox/Edge only (no WebKit/Safari)
  - ❌ More complex for multi-browser testing
  - ❌ Steeper learning curve than Playwright

  Best for: Developer-focused testing with amazing debugging

  ---
  2. Puppeteer

  Chrome-only automation from Google (what Playwright was based on).

  ```js
  // tests/sections.test.js
  const puppeteer = require('puppeteer');

  test('sections render', async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:4321');

    const hero = await page.$('#hero');
    const isVisible = await hero.isIntersectingViewport();
    expect(isVisible).toBe(true);

    await browser.close();
  });
  ```

  Pros:
  - ✅ Faster than Playwright (Chrome-only)
  - ✅ Simpler API for basic use cases
  - ✅ Official Google support
  - ✅ Good for generating PDFs, screenshots

  Cons:
  - ❌ Chrome/Chromium only (no Firefox/Safari)
  - ❌ No built-in test runner (need Jest/Mocha)
  - ❌ Less features than Playwright
  - ❌ No automatic waiting

  Best for: Chrome-only testing or PDF generation

  ---
  3. TestCafe

  No WebDriver needed, runs in any browser.

  ```js
  // tests/sections.test.js
  import { Selector } from 'testcafe';

  fixture('Homepage')
    .page('http://localhost:4321');

  test('all sections visible', async t => {
    await t
      .expect(Selector('#hero').visible).ok()
      .expect(Selector('#problem').visible).ok()
      .expect(Selector('#solution').visible).ok();
  });

  test('animations work', async t => {
    const section = Selector('#benefits .reveal-on-scroll');

    await t
      .expect(section.getStyleProperty('opacity')).eql('0')
      .scroll(section)
      .expect(section.hasClass('in-view')).ok()
      .expect(section.getStyleProperty('opacity')).eql('1');
  });
  ```

  Pros:
  - ✅ No WebDriver setup needed
  - ✅ Automatic waiting out of the box
  - ✅ Run in ANY browser (including mobile)
  - ✅ Good TypeScript support
  - ✅ Built-in parallelization

  Cons:
  - ❌ Smaller community than Cypress/Playwright
  - ❌ Debugging not as good as Cypress
  - ❌ Slower than Playwright
  - ❌ Limited ecosystem

  Best for: Cross-browser testing without WebDriver hassles

  ---
  4. Vitest Browser Mode (NEW!)

  Run tests directly in browser with Vitest.

  ```ts
  // tests/sections.test.ts
  import { test, expect } from 'vitest';
  import { page } from '@vitest/browser/context';

  test('sections are visible', async () => {
    await page.goto('/');

    const hero = page.getByRole('banner', { name: /hero/i });
    await expect(hero).toBeVisible();

    const problem = page.getByText(/problem/i);
    await expect(problem).toBeVisible();
  });
  ```

  Pros:
  - ✅ Same tool as unit tests (consistency)
  - ✅ Super fast (uses Vite's dev server)
  - ✅ Modern API similar to Playwright
  - ✅ Great TypeScript support
  - ✅ Component testing + E2E in one tool

  Cons:
  - ❌ Still experimental (launched 2024)
  - ❌ Limited documentation
  - ❌ Smaller ecosystem
  - ❌ May have edge cases

  Best for: Teams already using Vitest wanting one tool

  ---
  5. WebdriverIO

  Modern Selenium wrapper with better API.

  ```js
  // wdio.conf.js
  describe('Homepage', () => {
    it('sections are visible', async () => {
      await browser.url('/');

      await expect($('#hero')).toBeDisplayed();
      await expect($('#problem')).toBeDisplayed();
      await expect($('#solution')).toBeDisplayed();
    });
  });
  ```

  Pros:
  - ✅ Works with any browser/mobile device
  - ✅ Huge ecosystem (Selenium-based)
  - ✅ Good for testing real devices (Appium integration)
  - ✅ Enterprise-friendly

  Cons:
  - ❌ Complex setup
  - ❌ Slower than modern tools
  - ❌ Steeper learning curve
  - ❌ More verbose API

  Best for: Enterprise testing across many platforms

  ---
  Lightweight Alternatives (Not Full E2E)

  6. @web/test-runner (Modern Web)

  Fast tests in real browsers without Selenium.

  ```js
  import { expect } from '@esm-bundle/chai';
  import { fixture, html } from '@open-wc/testing';

  it('sections render', async () => {
    const el = await fixture(html`<hero-section></hero-section>`);
    expect(el.shadowRoot.querySelector('.hero')).to.exist;
  });
  ```

  Pros:
  - ✅ Very fast (no browser automation overhead)
  - ✅ Modern ES modules
  - ✅ Great for web components
  - ✅ Minimal setup

  Cons:
  - ❌ Not true E2E (component-focused)
  - ❌ Limited page interaction testing
  - ❌ Smaller community

  ---
  7. Storybook + Test Runner

  Visual component testing.

  ```js
  // Hero.stories.js
  export default {
    title: 'Sections/Hero',
    component: Hero,
  };

  export const Default = {
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(canvas.getByRole('heading')).toBeInTheDocument();
    },
  };
  ```

  Pros:
  - ✅ Visual component library + tests
  - ✅ Great for design systems
  - ✅ Catch visual regressions
  - ✅ Good developer experience

  Cons:
  - ❌ Not for full page E2E
  - ❌ Requires Storybook setup
  - ❌ More tooling overhead

  ---
  My Recommendation for Your Use Case

  Given your situation (Astro static site, production rendering issues, "vibe coded"
  nature):

  Option 1: Playwright (What I originally suggested)

  Score: 9/10
  - ✅ Would have caught all your issues
  - ✅ Tests production builds
  - ✅ Multi-browser (Safari too!)
  - ✅ Best tooling and debugging
  - ✅ Growing community

  Option 2: Cypress

  Score: 8/10
  - ✅ Best developer experience
  - ✅ Easiest to write tests
  - ❌ No Safari testing
  - ❌ Slightly slower

  Option 3: Vitest Browser Mode

  Score: 7/10 (if you want one tool)
  - ✅ Fast and modern
  - ✅ Same tool for unit + E2E
  - ❌ Still experimental
  - ❌ May need Playwright as backup

  Quick Comparison Table

  | Tool           | Speed | Browsers       | Setup | DX    | Production Testing |
  |----------------|-------|----------------|-------|-------|--------------------|
  | Playwright     | ⚡⚡⚡   | All            | Easy  | Great | ✅ Best             |
  | Cypress        | ⚡⚡    | Chrome/FF/Edge | Easy  | Best  | ✅ Great            |
  | Puppeteer      | ⚡⚡⚡   | Chrome only    | Easy  | Good  | ✅ Good             |
  | TestCafe       | ⚡⚡    | All            | Easy  | Good  | ✅ Great            |
  | Vitest Browser | ⚡⚡⚡⚡  | Chrome/FF/Edge | Easy  | Great | ✅ Good*            |
  | WebdriverIO    | ⚡     | All            | Hard  | OK    | ✅ Great            |

  *Still maturing

  My Strong Recommendation

  Go with Playwright because:
  1. Would have caught your production issues immediately
  2. Tests the actual built site (not dev server)
  3. Cross-browser (including Safari via WebKit)
  4. Best tooling (trace viewer, codegen, UI mode)
  5. Growing fast (Microsoft backing)

  But if developer experience matters more: Consider Cypress - it has the best debugging
  experience and is easier to learn, just no Safari testing.

  Would you like me to set up either Playwright or Cypress with a few critical tests for
  your current pages?