# Loops

* [Dependency Upgrade Loop](Dependency-Upgrade-Loop.md) - Fan out across all active Astro Knots sites, upgrade dependencies, fix breaking changes, verify builds, write changelogs, and push — looping until all sites are clean.
* [Propagate an LFM Release Across Sites](Propagate-an-LFM-Release-Across-Sites.md) - A published @lossless-group/lfm version is not shipped until every consuming site is on it and still renders. This is the per-site cadence — bump, build, drive, changelog, commit, push submodule — run one site at a time so a bad release is caught on the first, not the fourth.
