---
title: Exploring GitHub Actions for Package Publishing
lede: A practical walkthrough of what GitHub Actions are, how they work, and how to use them to publish packages to JSR and GitHub Packages with provenance — written for someone who has never set up CI/CD before.
date_authored_initial_draft: "2026-04-23"
date_authored_current_draft: "2026-04-23"
date_created: "2026-04-23"
date_modified: "2026-04-23"
at_semantic_version: "0.0.0.1"
status: Draft
augmented_with: Claude Code (Opus 4.6)
category: Explorations
tags: [GitHub-Actions, CI-CD, Package-Publishing, JSR, GitHub-Packages, DevOps, Automation]
authors:
  - Michael Staton
  - AI Labs Team
---

# Exploring GitHub Actions for Package Publishing

## The Problem This Document Solves

You publish `@lossless-group/lfm` by running `deno publish` from your laptop. It works. But JSR's score page docks you for "no provenance" — meaning there's no cryptographic proof that what you published matches what's in your repository. The fix is GitHub Actions. But what *are* they?

If you've used Vercel, you already understand the core idea. You push code, Vercel sees it, builds your site, deploys it. GitHub Actions is the same concept generalized: you push code (or click a button, or tag a release), and GitHub runs whatever commands you want on a fresh server.

---

## 1. What GitHub Actions Actually Are

GitHub Actions is a built-in CI/CD system. That acronym stands for "Continuous Integration / Continuous Deployment" — but ignore the jargon. In practice it means:

> **A YAML file in your repo that tells GitHub: "when X happens, run these shell commands on a fresh virtual machine."**

That's the whole thing. No external service. No account to create. No infrastructure to manage. GitHub provides the servers. You write a YAML file. It runs.

### Where the YAML lives

```
your-repo/
├── .github/
│   └── workflows/
│       └── publish-lfm.yml    ← this is a "workflow"
├── packages/
│   └── lfm/
└── ...
```

GitHub watches the `.github/workflows/` directory. Any `.yml` file in there is a workflow. You can have as many as you want.

### The three pieces of every workflow

```yaml
# 1. NAME — what you see in the GitHub UI
name: Publish LFM to JSR

# 2. TRIGGER — when does this run?
on:
  workflow_dispatch:    # "only when I click the button"

# 3. JOBS — what commands to run
jobs:
  publish:
    runs-on: ubuntu-latest    # a fresh Linux VM
    steps:
      - run: echo "Hello from GitHub's servers"
```

That's a complete, valid workflow. If you committed this file and pushed it, you'd see a "Publish LFM to JSR" entry in the Actions tab of your repo on GitHub, with a "Run workflow" button.

---

## 2. Triggers: When Does It Run?

The `on:` section controls what kicks off the workflow. Common triggers:

| Trigger | What it does | When to use |
|---------|-------------|-------------|
| `workflow_dispatch` | Manual button in GitHub UI | Publishing — you decide when |
| `push` | Runs on every push | Tests, linting |
| `push: tags: ['v*']` | Runs when you push a version tag | Auto-publish on `git tag v0.2.1` |
| `pull_request` | Runs when a PR is opened/updated | Code review checks |
| `schedule: cron: '0 9 * * 1'` | Runs on a schedule | Weekly dependency updates |

For package publishing, `workflow_dispatch` is the safest starting point. You go to the Actions tab, click "Run workflow," and it publishes. No surprises.

Later, you can graduate to tag-based triggers:

```yaml
on:
  push:
    tags:
      - 'lfm-v*'    # runs when you: git tag lfm-v0.2.1 && git push --tags
```

---

## 3. Runners: Where Does It Run?

```yaml
jobs:
  publish:
    runs-on: ubuntu-latest
```

`runs-on` picks the virtual machine. GitHub spins up a fresh one for every run and destroys it afterward. Nothing persists between runs.

| Runner | What you get |
|--------|-------------|
| `ubuntu-latest` | Linux (most common, fastest to start) |
| `macos-latest` | macOS (needed for Swift/Xcode, otherwise slower and uses more quota) |
| `windows-latest` | Windows |

For publishing a TypeScript package, `ubuntu-latest` is correct. You don't need macOS — Deno and Node run identically on Linux.

**Free tier:** Public repos get unlimited minutes. Private repos get 2,000 minutes/month free (more than enough for manual publishes).

---

## 4. Steps: What Does It Do?

Steps run sequentially inside the runner VM. Two kinds:

### Shell commands (`run:`)

```yaml
steps:
  - run: echo "Hello"
  - run: cd packages/lfm && deno publish
```

Exactly what you'd type in your terminal.

### Reusable actions (`uses:`)

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: denoland/setup-deno@v2
```

These are prebuilt scripts published by other people (or GitHub itself). Think of them as "npm packages for CI steps."

| Action | What it does | Why you need it |
|--------|-------------|-----------------|
| `actions/checkout@v4` | Runs `git clone` of your repo into the VM | The VM starts empty — no code |
| `denoland/setup-deno@v2` | Installs Deno | The VM has Node but not Deno |
| `actions/setup-node@v4` | Installs a specific Node version | For `pnpm publish` to GitHub Packages |
| `pnpm/action-setup@v4` | Installs pnpm | Runner has npm but not pnpm |

The `@v4` is a version tag — same concept as `"unified": "^11.0.0"` in package.json.

---

## 5. Permissions and Secrets

### Permissions

The runner VM gets a temporary `GITHUB_TOKEN` automatically. But you have to declare what it's allowed to do:

```yaml
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read       # can read your repo
      id-token: write      # can generate provenance attestation
```

The `id-token: write` permission is what makes provenance work. It lets GitHub sign a certificate saying "this publish came from commit abc123 in this repo."

### Secrets

For GitHub Packages (npm), you might need a Personal Access Token. Store it in your repo settings:

1. Go to repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `NPM_TOKEN`, Value: your PAT

Then reference it in the workflow:

```yaml
steps:
  - run: pnpm publish
    env:
      NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

The secret is encrypted at rest and masked in logs. Nobody can read it — not even collaborators — they can only use it in workflows.

**JSR doesn't need secrets** when publishing from GitHub Actions. The `id-token` permission handles authentication automatically via OIDC (the same mechanism that creates provenance).

---

## 6. The Actual Workflow for @lossless-group/lfm

Here's what a real publish workflow looks like for our package, which publishes to both JSR and GitHub Packages:

### JSR Only (simplest)

```yaml
# .github/workflows/publish-lfm-jsr.yml
name: Publish LFM to JSR

on:
  workflow_dispatch:

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install Deno
        uses: denoland/setup-deno@v2

      - name: Publish to JSR
        run: cd packages/lfm && deno publish
```

That's it. No token needed — JSR authenticates via GitHub's OIDC token. The `id-token: write` permission is the only requirement. And because it runs on GitHub's infrastructure, JSR can verify provenance.

### Both JSR and GitHub Packages

```yaml
# .github/workflows/publish-lfm.yml
name: Publish LFM

on:
  workflow_dispatch:
    inputs:
      target:
        description: 'Where to publish'
        required: true
        type: choice
        options:
          - jsr
          - github-packages
          - both

jobs:
  publish-jsr:
    if: inputs.target == 'jsr' || inputs.target == 'both'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v2
      - run: cd packages/lfm && deno publish

  publish-npm:
    if: inputs.target == 'github-packages' || inputs.target == 'both'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          registry-url: 'https://npm.pkg.github.com'

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Install dependencies
        run: cd packages/lfm && pnpm install

      - name: Build
        run: cd packages/lfm && pnpm build

      - name: Publish to GitHub Packages
        run: cd packages/lfm && pnpm publish --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

The `inputs:` section adds a dropdown in the GitHub UI when you click "Run workflow" — you pick "jsr", "github-packages", or "both."

Note: `${{ secrets.GITHUB_TOKEN }}` is **automatic** — GitHub provides it to every workflow run. You don't need to create this secret manually. It has permissions to publish to GitHub Packages for the same org.

---

## 7. How Provenance Works

When you publish from your laptop:

```
You → deno publish → JSR
```

JSR receives the package but has no way to verify where it came from. You could have modified files after committing. You could be publishing from a fork. You could be anyone with the token.

When you publish from GitHub Actions with `id-token: write`:

```
GitHub Actions → generates signed OIDC token → deno publish → JSR

The OIDC token contains:
  - Repository: lossless-group/astro-knots
  - Commit: abc123def456
  - Workflow: .github/workflows/publish-lfm-jsr.yml
  - Triggered by: mpstaton
```

JSR receives this signed token, verifies it with GitHub's certificate authority, and records it in a public **transparency log** (Sigstore/Rekor). Anyone can look up your package and verify:

1. It was published from `lossless-group/astro-knots`
2. At a specific commit
3. By a specific workflow
4. Not modified in transit

This is why JSR rewards it in the score — it's a supply chain security measure.

---

## 8. How to Set This Up (Step by Step)

### Step 1: Create the workflow file

Create `.github/workflows/publish-lfm-jsr.yml` in the `astro-knots` repo with the JSR workflow from Section 6.

### Step 2: Push it

```bash
git add .github/workflows/publish-lfm-jsr.yml
git commit -m "new(ci): GitHub Actions workflow for JSR publishing with provenance"
git push
```

### Step 3: Link JSR to GitHub

JSR needs to know which GitHub repo is authorized to publish `@lossless-group/lfm`. On the JSR package settings page (`jsr.io/@lossless-group/lfm/settings`), link it to the `lossless-group/astro-knots` repository.

### Step 4: Run it

1. Go to `github.com/lossless-group/astro-knots/actions`
2. Click "Publish LFM to JSR" in the left sidebar
3. Click "Run workflow"
4. Select the branch (usually `master`)
5. Click the green "Run workflow" button

### Step 5: Watch it go

The run takes about 30-60 seconds. You'll see each step execute with live logs. If anything fails, the logs tell you exactly which step and why.

---

## 9. Common Gotchas

### "Permission denied" or "Forbidden"

Usually means the `permissions:` block is missing or wrong. Double-check `id-token: write` for JSR, `packages: write` for GitHub Packages.

### "Version already exists"

You tried to publish a version that's already on the registry. Bump the version in `deno.json` and `package.json` first.

### The workflow doesn't appear in the Actions tab

The workflow file must be on the **default branch** (usually `main` or `master`) for `workflow_dispatch` to show up. Push it to master first.

### JSR still says "no provenance" after publishing from CI

Make sure `id-token: write` is in the permissions. Without it, the OIDC token isn't generated and JSR can't create provenance.

Also check that the package is linked to the GitHub repo in JSR's package settings.

---

## 10. Beyond Publishing: What Else Can Actions Do?

Once you understand the pattern (trigger → runner → steps), you can automate anything:

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| **Run tests** | `pull_request` | Runs `pnpm test` on every PR |
| **Type check** | `push` | Runs `tsc --noEmit` to catch type errors |
| **Lint** | `pull_request` | Runs eslint, flags issues in the PR |
| **Deploy docs** | `push` to main | Builds and deploys documentation |
| **Dependency updates** | `schedule` (weekly) | Runs `pnpm update` and opens a PR |
| **Release notes** | Tag push | Generates changelog from commits |

Each of these is just another YAML file in `.github/workflows/`. They run independently and in parallel.

---

## 11. Terminology Reference

| Term | What it means |
|------|--------------|
| **Workflow** | A YAML file in `.github/workflows/`. One workflow = one automation. |
| **Job** | A group of steps that run on the same runner VM. A workflow can have multiple jobs. |
| **Step** | A single command or reusable action within a job. |
| **Runner** | The virtual machine that executes the job. |
| **Action** | A reusable step published by someone else (like an npm package for CI). |
| **Trigger / Event** | What causes the workflow to run (`push`, `workflow_dispatch`, etc.). |
| **Secret** | An encrypted value stored in repo settings, available to workflows as environment variables. |
| **Artifact** | A file produced by a workflow (logs, build output) that you can download later. |
| **OIDC** | OpenID Connect — the protocol GitHub uses to prove to JSR "this really came from this repo." |
| **Provenance** | Cryptographic proof linking a published package to a specific commit and workflow run. |
| **CI/CD** | Continuous Integration / Continuous Deployment — the practice of automating builds, tests, and deploys. |

---

## 12. Our Current Publishing Setup vs. Target State

### Current (manual from laptop)

```
local machine
  ├── bump version in deno.json + package.json
  ├── deno publish --allow-dirty          → JSR (no provenance)
  └── pnpm build && pnpm publish          → GitHub Packages (requires GITHUB_TOKEN)
```

**Downsides:** No provenance. Requires tokens on your machine. Easy to publish uncommitted changes. No audit trail.

### Target (GitHub Actions)

```
local machine
  ├── bump version in deno.json + package.json
  ├── git commit && git push
  └── go to GitHub → Actions → click "Run workflow"

GitHub Actions VM
  ├── checkout code at exact commit
  ├── deno publish                        → JSR (with provenance ✅)
  └── pnpm build && pnpm publish          → GitHub Packages (automatic token)
```

**Advantages:** Provenance. No tokens on your machine. Publishes exactly what's in the repo. Audit trail in the Actions tab. JSR score goes up.
