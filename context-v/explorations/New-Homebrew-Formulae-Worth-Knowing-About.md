---
title: New Homebrew Formulae Worth Knowing About
lede: A quick-hit survey of six new Homebrew formulae — dispenso, jsongrep, opentimestamps-client, proxelar, qtcanvaspainter, and qttasktree — with an honest assessment of what each does and whether our dev team should care.
date_authored_initial_draft: "2026-03-30"
date_authored_current_draft: "2026-03-30"
date_created: "2026-03-30"
date_modified: "2026-03-30"
at_semantic_version: "0.0.0.1"
status: Draft
augmented_with: Claude Code (Opus 4.6)
category: Explorations
tags: [Homebrew, Developer-Tools, CLI, JSON, Proxy, Cryptography, Timestamps, Qt]
authors:
  - Michael Staton
  - AI Labs Team
---

# New Homebrew Formulae Worth Knowing About

Six new formulae showed up in Homebrew's latest batch. Here is what each one actually does, whether it matters, and how our team might put it to work.

---

## jsongrep

**Repo:** [github.com/micahkepe/jsongrep](https://github.com/micahkepe/jsongrep)

jsongrep (invoked as `jg`) is a Rust-based CLI tool for querying structured data files — JSON, YAML, TOML, JSONL, CBOR, and MessagePack — using regex-like path expressions. Where `jq` is a full transformation language you have to learn from scratch, jsongrep focuses on the more common task of *finding* values at arbitrary depths in a document tree. Paths like `**.name` match the key `name` at any nesting level, and queries compile to DFAs so performance is excellent — benchmarked faster than jq, jmespath, and jsonpath-rust. For our team, this is immediately useful for querying frontmatter across hundreds of content collection files (e.g., "which documents are missing a `date_modified` field?"), inspecting `package.json` dependency trees across the monorepo (e.g., `jg "**.dependencies.@lossless-group/lfm" sites/*/package.json`), and quickly pulling values out of API responses or config files during debugging. It is lighter and more intuitive than jq for the kinds of lookups we actually do day-to-day.

**Verdict:** Install it. Replaces awkward `jq` one-liners for path-based lookups across the monorepo.

---

## proxelar

**Repo:** [github.com/emanuele-em/proxelar](https://github.com/emanuele-em/proxelar)

Proxelar is a man-in-the-middle (MITM) proxy written in Rust for intercepting and inspecting HTTP and HTTPS traffic. It auto-generates per-host TLS certificates so you can see inside encrypted connections, and it ships with three interfaces: raw terminal output, an interactive TUI built on ratatui, and a web GUI powered by axum and WebSockets. The real power comes from its Lua scripting hooks — `on_request` and `on_response` callbacks let you modify, block, or mock traffic programmatically without touching your application code. For our workflow, this is valuable for debugging SSR data fetching in Astro builds, inspecting what GitHub API calls the content pipeline makes, mocking external service responses during local development, and diagnosing package registry issues when `pnpm install` behaves unexpectedly. Think of it as a lighter, open-source alternative to Charles Proxy or mitmproxy that runs entirely in the terminal.

**Verdict:** Worth having in the toolbox for network debugging. Not an everyday tool, but invaluable when you need it.

---

## opentimestamps-client

**Homepage:** [opentimestamps.org](https://opentimestamps.org)
**Repo:** [github.com/opentimestamps/opentimestamps-client](https://github.com/opentimestamps/opentimestamps-client)

OpenTimestamps is a protocol for creating cryptographic timestamps anchored to the Bitcoin blockchain. The client hashes a file locally (so the content itself is never sent anywhere), submits the hash to free public calendar servers, and those servers batch the hashes into a Merkle tree that gets committed to a Bitcoin transaction. The result is a `.ots` proof file that anyone can independently verify to confirm the file existed at or before a specific point in time — no trusted third party, no registration, no API keys, completely free. For our team, the interesting use case is timestamping published content, specs, and contracts to establish provable authorship dates. The `context-v` document system, LFM spec drafts, or any original written content could be timestamped as part of a publishing pipeline to create an immutable record of when it was authored. This is niche — you would not use it daily — but for intellectual property protection or legal provenance of original content, it is a lightweight and elegant solution.

**Verdict:** Niche but compelling. Worth experimenting with for timestamping published specs and original content.

---

## dispenso

**Repo:** [github.com/facebookincubator/dispenso](https://github.com/facebookincubator/dispenso)

Dispenso is a high-performance C++ library from Meta for parallel programming. It provides work-stealing thread pools, parallel for-each loops, futures, task graphs, and concurrent data structures, all designed to handle nested parallelism without thread oversubscription — a common problem with OpenMP and Intel TBB. It requires C++14 minimum with optional C++20 enhancements, and it is sanitizer-clean (ASAN/TSAN). For our team, this has essentially zero relevance. We are a web development shop working in TypeScript, Astro, and Svelte. Unless someone is writing native C++ extensions for Node or building custom high-performance tooling at the systems level, dispenso solves problems we do not have. It is a well-engineered library in a domain that does not intersect with ours.

**Verdict:** Skip. Impressive engineering, wrong domain.

---

## qtcanvaspainter

**Homepage:** [doc.qt.io/qt-6/qtcanvaspainter-index.html](https://doc.qt.io/qt-6/qtcanvaspainter-index.html)

Qt Canvas Painter is a new module in Qt 6.11 (currently Technology Preview) that provides hardware-accelerated 2D painting for Qt Quick, Qt Widgets, or raw QRhi render targets. Its API deliberately mirrors the HTML Canvas 2D context specification, making it familiar to web developers, but it targets GPU-only rendering with no CPU fallback — the opposite tradeoff from QPainter. For our team, this has no practical application. We build for the web, not for native desktop or embedded UIs. The fact that its API resembles HTML Canvas is a nice design choice for Qt developers, but it does not create a bridge to our stack. It showed up in Homebrew because it is part of the Qt framework distribution.

**Verdict:** Skip. Qt desktop graphics module — not relevant to web development.

---

## qttasktree

**Homepage:** [doc.qt.io/qt-6/qttasktree-index.html](https://doc.qt.io/qt-6/qttasktree-index.html)

Qt Task Tree is another Qt 6.11 module that provides a declarative framework for composing and executing asynchronous task workflows in C++ applications. You define task "recipes" organized into groups with execution policies — stop on first error, continue on error, stop on first success, finish all — and the framework handles orchestration. It includes built-in adapters for QProcess, networking, threads, timers, and barriers, plus thread-local storage for data sharing between tasks. The conceptual model is interesting (declarative async orchestration is a pattern that shows up everywhere), but the implementation is deeply tied to the Qt C++ ecosystem. For our team, the ideas are worth being aware of — similar patterns exist in JavaScript with Promise.allSettled, p-limit, and task runner libraries — but the library itself has no application in our stack.

**Verdict:** Skip. Interesting async patterns, but it is a Qt C++ module with no web relevance.

---

## Summary

| Formula | Domain | Relevance | Action |
|---------|--------|-----------|--------|
| **jsongrep** | CLI / data querying | High | Install and use for monorepo-wide queries |
| **proxelar** | Network debugging | Moderate | Install for API and SSR debugging |
| **opentimestamps-client** | Cryptographic provenance | Niche | Experiment with for content timestamping |
| **dispenso** | C++ parallelism | None | Skip |
| **qtcanvaspainter** | Qt desktop graphics | None | Skip |
| **qttasktree** | Qt async orchestration | None | Skip |

The two immediately actionable tools are **jsongrep** for querying structured data across the monorepo and **proxelar** for network-level debugging. **opentimestamps-client** is worth a weekend experiment if content provenance becomes a priority.
