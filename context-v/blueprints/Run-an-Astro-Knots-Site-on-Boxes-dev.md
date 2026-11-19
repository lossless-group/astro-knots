---
site_uuid: c8ab84e9-49d9-4bd2-8707-1b46aec5c3da
hex_code: vyvrok
title: "Run an Astro Knots Site on boxes.dev"
lede: "Give each coding agent its own cloud computer with the site already running, so work keeps going after the laptop closes."
publish: false
date_created: 2026-11-12
date_modified: 2026-11-16
date_authored_initial_draft: 2026-11-12
date_authored_current_draft: 2026-11-12
date_authored_final_draft:
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: Draft
summary: "How to put one Astro Knots site onto boxes.dev (cloud devboxes for Claude Code and Codex): which setup path to take, what a site must look like first, what the setup manifest should and shouldn't upload, startup and maintenance scripts, preview, and cost. Written before the first run, with sites/cathode-site as the pilot. Load when setting up any site on boxes.dev, or when filling in the pilot log after a run. Claims marked Verify are from the boxes.dev docs and still need checking against a real run."
tags:
  - Blueprint
  - Boxes-Dev
  - Cloud-Development-Environments
  - Coding-Agents
  - Astro-Knots
  - Developer-Workflow
type: Blueprints
---

# Run an Astro Knots Site on boxes.dev

## Why Care?

Our agents run on the laptop. That means the laptop stays open for long tasks, parallel agents fight over one `localhost:4321` and one disk, and nothing can be started from a phone. [boxes.dev](https://boxes.dev) gives each agent thread its own Linux machine, cloned from a prepared **Template box** where the site already installs, builds and runs. It uses the Claude Code or Codex subscription we already pay for. It does not resell tokens.

Astro Knots sites suit this well. Each site must already deploy alone from its own repo, so it should also set up alone on a fresh Linux box. If a site can't, that is a deployability bug worth finding anyway.

This blueprint is written **before** the first run. `sites/cathode-site` is the pilot. The steps below come from the boxes.dev help center as of 2026-11-12. Anything marked **Verify** needs checking during the pilot, and the [Pilot log](#pilot-log-sitescathode-site) at the bottom is where we record what actually happened.

## How boxes.dev works (the five nouns)

| Term | What it is |
|---|---|
| **Project** | One codebase on boxes.dev: its machines, threads, settings and integrations. |
| **Template box** | The cloud machine where the environment gets prepared once. Think of it as the dev laptop in the cloud. |
| **Snapshot** | A saved copy of the Template box's disk **and memory**. Every new devbox starts from the latest one. |
| **Devbox** | A per-thread machine forked from a snapshot. It has its own filesystem, ports and processes, so five agents can each run `astro dev` on 4321 without colliding. |
| **Thread** | A conversation with Claude Code or Codex running on a devbox. You can reach it from the desktop app, the iOS/Android app, the `dvb` CLI, Slack or Linear. |

Devboxes sleep when idle. Files and memory are kept, but processes stop. Destroying a devbox deletes its filesystem, so **work leaves a devbox through `git push`**, never by assuming the box is permanent.

Sources: [How boxes.dev works](https://boxes.dev/help/how-boxes-works), [Template box snapshots](https://boxes.dev/help/template-box-snapshots).

## Choosing a setup path

boxes.dev has three ways in. For our sites the choice is nearly always the same.

| Path | What it brings | When to use it |
|---|---|---|
| **Local agent** (`dvb agent-init`) | Repo with full Git history and local branches, uncommitted and untracked files you pick, env files, agent config and skills. An agent on the laptop writes a setup manifest for you to review. | **Default for Astro Knots.** We already run Claude Code in every site folder. |
| **From GitHub** | Committed code only. No env files, no dependencies installed. | A site with no local checkout, or setting up from a phone. |
| **Team Template** | A shared environment a team admin prepared. | Later, if several people work the same site. |

Run the local-agent path **from inside the site folder** (`astro-knots/sites/<site>/`), not from `astro-knots/` or the anchor monorepo. The setup agent offers to include sibling repos it thinks you develop together. Our pseudomonorepo has dozens of them, and a site is supposed to stand alone. Say no.

Source: [Set up a project with your local agent](https://boxes.dev/help/local-agent-setup), [Create a project from GitHub](https://boxes.dev/help/github-project-setup).

## Before setup: what a site needs first

Do these on the laptop before pasting the setup prompt.

1. **The repo has commits and a GitHub remote.** New devboxes fetch their starting branch fresh from the remote. A repo with no commits has nothing to fetch, and a local-only branch makes every devbox start from the frozen snapshot copy.
2. **The site installs alone.** `pnpm install && pnpm build` inside the site folder, with no help from the astro-knots workspace. No `workspace:*` dependencies, and the site isn't listed in the parent `pnpm-workspace.yaml`.
3. **Packages come from JSR, not GitHub Packages.** A JSR `.npmrc` (`@jsr:registry=https://npm.jsr.io`) needs no token. A GitHub Packages `.npmrc` needs `GITHUB_TOKEN` on every box, which is one more secret to manage.
4. **pnpm build approvals are in place.** pnpm 11+ fails the install on any build script not listed under `allowBuilds` in the site's `pnpm-workspace.yaml`. Missing approvals are the first thing a fresh box will hit.
5. **The site carries its own agent instructions.** Only the site folder goes up. `astro-knots/CLAUDE.md` and the anchor `AGENTS.md` stay behind, so a box agent knows nothing about pnpm-only, no-React, two-tier tokens or the `/design-system` rule. Add a short site-level `CLAUDE.md` (or `AGENTS.md` plus a symlink) covering the rules that matter for that site, or decide to upload the relevant skills instead (step 4 of setup).
6. **Know which env vars the source reads.** Run the grep from the anchor `AGENTS.md`:
   ```bash
   grep -rhoE '(process\.env|import\.meta\.env)\.[A-Z_][A-Z_0-9]*' src scripts astro.config.* 2>/dev/null | sort -u
   ```
   Each one becomes an [Environment file](#secrets-and-environment-files) entry or is deliberately left out.

## Setup, step by step

### 1. Install the CLI and sign in

```bash
pnpm add -g @boxes-dev/cli     # or: curl -fsSL https://deploy.boxes.dev/cli/install.sh | sh
dvb setup
```

The boxes.dev docs say `npm i -g`. We use pnpm. Install `dvb` on the laptop only, never on a box.

### 2. Start setup from the site folder

Sign in at [boxes.dev/app](https://boxes.dev/app), copy the setup prompt from **Get started** (or **New project**), then open Claude Code in `sites/<site>/` and paste it. The prompt has a one-time `--login-code` that expires within 30 minutes. It asks the local agent to run `dvb agent-init --login-code <code>` and follow its instructions.

### 3. Connect accounts

The agent opens **Connect your accounts** in the browser. Connect **Claude Code** with "Log in with Claude". The laptop's own sign-in does not carry over. GitHub is optional at this step but needed later for push and for maintenance watches. Click **Done**, or the local agent keeps waiting.

A claude.ai login also gives box agents the claude.ai connectors (Gmail and others). For client sites, clear **Allow claude.ai connectors** in **Configure agents** unless the work needs them.

### 4. Review the setup manifest

The local agent writes a commented YAML **setup manifest** outside the repo (ask it for the path). Review it with these defaults for an Astro Knots site:

| Manifest choice | Default for our sites |
|---|---|
| Repositories | The site repo only. |
| Starting branch | The tier branch work actually lands on, usually `development` (see the branch tier model in the anchor `AGENTS.md`). The agent will suggest `main`. |
| Untracked files | Only what the build needs. Never `context-v/extra/`, `dist/`, `.astro/` or `node_modules/`. |
| Env files | Only dev or narrowly scoped values, or none. Never upload `~/.secrets`. |
| Agent settings | Import settings. Leave Claude permission rules out unless asked for. Import no conversation history. |
| Skills | A short, chosen subset: `astro-knots`, `theme-system`, `context-vigilance`, `changelog-conventions`, `git-conventions`, `maintain-design-md`, plus `lossless-flavored-markdown` if the site renders LFM. Not the whole `~/.claude/skills` folder. |
| Devbox size | **4 vCPU / 8 GiB**: one agent, one `astro dev`, one headless Chromium. It can't be changed after creation. |
| Git access | Automatic GitHub App access. Use SSH only if the App can't be granted. |

**Verify:** our skills are symlinks from `~/.claude/skills/<name>` into the monorepo. The docs say a selected skill's size "includes linked tools", which suggests the bundler follows links, but check that the uploaded skill folders contain real files.

### 5. Startup and maintenance scripts

Keep the **startup script** (runs on every new devbox) fast. Everything slow belongs on the Template box, before the snapshot.

```bash
# startup: after boxes.dev's generated branch-preparation block
pnpm install --frozen-lockfile
```

Ask for a **maintenance script** that pulls the starting branch and runs the same install, **watching only `pnpm-lock.yaml`**. When the lockfile changes on GitHub, maintenance refreshes the Template box and takes a new snapshot, so devboxes don't start behind. Maintenance watches need GitHub App access even when push uses SSH.

Don't start the dev server in the startup script. Threads start it when they need it, and an idle `astro dev` on every box wastes box-hours.

### 6. Approve, then follow the remote setup thread

The local agent runs `dvb agent-init run`, which encrypts and uploads the bundle, creates the Template box and starts a setup thread there using the connected Claude account. Follow it in the desktop app or with `dvb agents`. If it asks for a secret, enter it under **Project settings → Environment files**, not in the chat.

The remote agent should finish with `pnpm build` and `pnpm test` passing **from a new terminal session**. That proves the setup doesn't depend on a shell change that won't survive the snapshot. Then it saves the first snapshot.

If setup stalls, `dvb agent-init status` reports the stage and the next action.

### 7. Check a fresh devbox

Start a new thread and ask it to run `pnpm dev`. Open **Ports** in the desktop app. Astro's `4321` should appear at `http://localhost:4321` on the laptop. Use **Local URLs** (`http://<name>.localhost:4321`) to compare two devboxes side by side, and a **public app link** only for a short client review.

**Verify:** `astro dev` binds `localhost` by default. The docs describe forwarding from the box's own ports, so `--host` shouldn't be needed. Confirm during the pilot.

## Secrets and environment files

Values saved in **Project settings → Environment files** are written into the named file (`.env`, `.env.local`, and so on) on the Template box and every devbox, above a `# >>> BOXES_MANAGED_ENV_v1 <<<` marker. Edit them centrally, not on a machine.

- Check **Load into agent and terminal environments** for any key a box agent's MCP server or script needs. Claude Code expands `${NAME}` in `.mcp.json`.
- The encryption is not end-to-end. Delivered files are plain text that any process on the box can read. Old snapshots keep old values.
- Our API keys (Firecrawl, Ideogram, ImageKit and the rest) live in `~/.secrets` on the laptop. Add only the ones a site needs, preferably scoped or development keys. Revoke at the provider if a key reaches a box by mistake. Cleaning one box doesn't clean the others or old snapshots.

Source: [Environment files and secrets](https://boxes.dev/help/environment-files), [Your data and credentials](https://boxes.dev/help/data-and-credentials).

## What doesn't come along

| Laptop resource | On the box |
|---|---|
| `~/.claude/CLAUDE.md`, `astro-knots/CLAUDE.md`, anchor `AGENTS.md` | Gone, unless copied into the site or rebuilt from skills. |
| Chroma MCP (local corpus RAG) | Not available. The corpus lives on the laptop. |
| Playwright MCP | Can be added per project ([Add MCP servers](https://boxes.dev/help/mcp-servers)). Headless Chromium runs fine on a box. |
| `~/.secrets` | Not uploaded. Use Environment files. |
| Sibling sites and `packages/lfm-astro/` patterns | Not on the box. Copy-from-pattern work still happens on the laptop. |
| The parent's submodule pointer | Unchanged. Bump it on the laptop after pulling the box's pushed commits, as usual. |

## Cost

One 4 vCPU / 8 GiB box awake for an hour is **one box-hour**. The Template box costs box-hours while awake too. Sleeping boxes cost nothing.

| Plan | Price | Included | Awake devboxes | Projects |
|---|---|---|---|---|
| Trial | Free | 20 box-hours | 3 + Template | 2 |
| Starter | $19/seat/mo | 50 | 5 + Template | 5 |
| Pro | $99/seat/mo | 300 | 12 + Template | 10 |

Past the allowance it's $0.40 per box-hour. The **project** limit matters most for us: every site is its own project, so the Trial covers the pilot plus one more site. Source: [Plans, seats, and box-hours](https://boxes.dev/help/plans-and-box-hours).

## How to follow it

For each new site:

1. Meet the six preconditions under [Before setup](#before-setup-what-a-site-needs-first).
2. Run local-agent setup from the site folder with the manifest defaults above.
3. Prove `pnpm build` and `pnpm test` from a new terminal on the Template box, then snapshot.
4. Prove `pnpm dev` and port forwarding on a fresh devbox.
5. Add a line to the site's `changelog/` that it now runs on boxes.dev.

When the Template box changes (new global tool, new Node), change it on the Template box, test, and run `dvb-onbox snapshot`. Changes made on a devbox stay on that devbox.

## Anti-patterns

- **Setting up from `astro-knots/` or the anchor root.** It uploads the whole pseudomonorepo and breaks the one-site-one-project model.
- **Treating a devbox as the canonical copy.** It's a fork. Push, or the work is lost when the box is destroyed.
- **Pasting secrets into a thread.** They persist in the thread history. Use Environment files.
- **A heavy startup script.** Installing global tools or running a full build on every devbox start belongs on the Template box, before the snapshot.
- **Oversizing the box.** The size is fixed at creation and multiplies box-hours while awake, even when idle. A static Astro site does not need 8 vCPU.
- **Uploading every skill and all conversation history.** It's slow, it's large, and it puts other clients' context on a client's box.
- **Pinning `packageManager` to fix a pnpm mismatch on the box.** Vercel builds break when we pin. Install the right pnpm on the Template box instead.

## Pilot log: `sites/cathode-site`

Why cathode-site first: it's a fresh standalone site (Astro 7, Tailwind 4, Vitest, LFM from JSR) with its own `pnpm-workspace.yaml` and `allowBuilds`. It isn't in the parent workspace, and its source reads no env vars. That makes it the cleanest possible case: no secrets, no token-gated registry, no sibling dependencies.

State on 2026-11-12, before the run:

| Precondition | Status |
|---|---|
| Commits and GitHub remote | **Blocked.** On `development`, no commits yet, no remote. Needs an initial commit and a GitHub repo before setup. |
| Installs alone | Yes. Standalone workspace file, not in the parent `pnpm-workspace.yaml`. |
| JSR, no token | Yes. `.npmrc` is `@jsr:registry=https://npm.jsr.io`. |
| `allowBuilds` | Yes: `@tailwindcss/oxide`, `esbuild`, `sharp`. |
| Site-level agent instructions | **Missing.** No `CLAUDE.md` or `AGENTS.md` in the site. |
| Env vars read by source | None. `SITE_URL` in `astro.config.mjs` is optional and defaults to the production domain. |
| Local toolchain | Node 26.13.1, pnpm 12.18.0. The Template box should match. **Verify** which Node the box image ships. |

Expected shape: 4 vCPU / 8 GiB, starting branch `development`, startup `pnpm install --frozen-lockfile`, maintenance watching `pnpm-lock.yaml`, no environment files.

### Run notes

**2026-11-12, setup (local-agent path, `dvb` 1.0.1128):**

- **CLI install.** `pnpm add -g` failed because pnpm's global bin directory wasn't on PATH. We used the standalone installer instead (`curl … | sh`, read before running). It installs to `~/.devbox/standalone/current/dvb` and leaves shell rc files alone unless you pass `--add-to-path`.
- **Remote blocker, resolved.** We made an initial commit and created the private repo `lossless-group/cathode` (renamed `lossless-group/cathode-site` on 2026-11-16) with `gh repo create --source . --push`. `start` still reported "remote default branch unknown" until `git remote set-head origin -a` recorded `origin/HEAD` locally. After that, `start --reseed` generated the branch block.
- **GitHub App access** is per repo. A brand-new org repo needs `dvb agent-init github connect`, which waits while you grant access on GitHub.
- **Seeded defaults to override.** `claude:skills` (all skills) came to **617.9 MB**. We picked 8 skills instead, about 400 KB. The default `agents.runtime` is `[claude, codex]`, and we kept both.
- **Skill symlinks are followed.** `check` warns that each link points outside `~/.claude/skills` and copies the target, which settles the earlier Verify. It also showed `astro-knots` resolving to the `ai-labs/dididecks-ai` copy rather than the canonical one. That's a sync-script drift to look into separately.
- **Manifest limits not in the help docs:** `startupTimeoutSeconds` is 1 to 120, and `templateMaintenance.timeoutSeconds` is 1 to 480.
- **Final plan:** 4vcpu8gb, branch `development`, startup appends `pnpm install --frozen-lockfile` to the generated branch reset, maintenance watches `pnpm-lock.yaml`, `package.json` and `pnpm-workspace.yaml`, and no env files.

- **Timing.** From approving `run` to a completed setup took about 5 minutes (00:48:34 to 00:53:36 UTC). The upload took about 2 s, provisioning about 40 s, decrypt/download/extract about 8 s, and the remote setup agent about 3 min. Setup then validated the box and saved the first snapshot.
- **Where to follow it.** `run` prints a `[handoff]` line that points to the Mac app (https://boxes.dev/mac). From a terminal, `dvb agents cathode` opens the same thread (the box was named `cathode` before the site was renamed `cathode-site`).

_Still to fill in: devbox cold-start time from the first snapshot, whether 4321 forwarded without `--host`, the Node and pnpm versions the setup agent installed (read its summary in the setup thread), and box-hours used._

## References

- boxes.dev help: [How it works](https://boxes.dev/help/how-boxes-works) · [Local agent setup](https://boxes.dev/help/local-agent-setup) · [GitHub setup](https://boxes.dev/help/github-project-setup) · [Environment files](https://boxes.dev/help/environment-files) · [Snapshots](https://boxes.dev/help/template-box-snapshots) · [Preview your app](https://boxes.dev/help/preview-your-app) · [Plans](https://boxes.dev/help/plans-and-box-hours) · [Data and credentials](https://boxes.dev/help/data-and-credentials) · [CLI](https://boxes.dev/help/use-cli)
- [[Continuous-Integration-for-Astro-Knots-Sites]]: the same "does it build alone?" question, asked by CI.
- [[Browser-Drive-Verification-For-Agent-Sessions]]: Playwright drives that a devbox can run unattended.
