# SSH Key Passphrase Prompts - macOS Keychain Integration

**Date:** 2025-12-25
**System:** macOS SSH Configuration
**Affected File:** `~/.ssh/config`

## The Problem

Starting around March 30, 2025, git operations began prompting for the SSH key passphrase on every push/pull:

```
Enter passphrase for key '/Users/mpstaton/.ssh/id_ed25519':
```

This was annoying because it interrupted the workflow constantly, even though macOS Keychain should cache the passphrase.

## Investigation

### Check When the SSH Key Was Created

```bash
ls -la ~/.ssh/id_ed25519*
```

Output:
```
.rw-------@ 464 mpstaton 30 Mar 06:00 /Users/mpstaton/.ssh/id_ed25519
.rw-r--r--@ 104 mpstaton 30 Mar 06:00 /Users/mpstaton/.ssh/id_ed25519.pub
```

The key was created on **March 30, 2025** with a passphrase (good security practice), but the keychain wasn't being used to cache it.

### Check the SSH Config

```bash
cat ~/.ssh/config
```

Original contents:
```
Host gitlab.com
  HostName gitlab.com
  User git
  IdentityFile ~/.ssh/gitlab_ed25519
  IdentitiesOnly yes
  AddKeysToAgent yes
  UseKeychain yes
```

**Root Cause:** The config only had keychain integration for GitLab. The general `id_ed25519` key (used for GitHub and other hosts) had no `AddKeysToAgent` or `UseKeychain` directive.

## The Solution

### Step 1: Update SSH Config

Added a `Host *` wildcard block at the top of `~/.ssh/config` to enable keychain caching for all hosts:

```
Host *
  AddKeysToAgent yes
  UseKeychain yes

Host gitlab.com
  HostName gitlab.com
  User git
  IdentityFile ~/.ssh/gitlab_ed25519
  IdentitiesOnly yes
```

**Note:** Removed the duplicate `AddKeysToAgent` and `UseKeychain` from the GitLab block since they now inherit from `Host *`.

### Step 2: Add Key to Keychain

Run this command once and enter your passphrase:

```bash
ssh-add --apple-use-keychain ~/.ssh/id_ed25519
```

This adds the key to the macOS Keychain. The passphrase will be remembered even across reboots.

## Config Options Explained

| Option | Purpose |
|--------|---------|
| `AddKeysToAgent yes` | Automatically adds keys to the running ssh-agent when first used |
| `UseKeychain yes` | macOS-specific: stores passphrases in the macOS Keychain and retrieves them automatically |

## Verification

After setup, git operations should work without passphrase prompts:

```bash
git fetch origin
git push origin main
```

No passphrase prompt should appear.

## Summary

| Issue | Cause | Fix |
|-------|-------|-----|
| Repeated passphrase prompts | Missing `Host *` block with keychain directives | Add `Host *` with `AddKeysToAgent yes` and `UseKeychain yes` |
| Passphrase not persisted across sessions | Key not added to macOS Keychain | Run `ssh-add --apple-use-keychain ~/.ssh/id_ed25519` |
