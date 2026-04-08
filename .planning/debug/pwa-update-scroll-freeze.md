---
status: awaiting_human_verify
trigger: "PWA has three related issues: (1) PWA not working properly, (2) always pauses/freezes on scroll, (3) not updating even after countdown timer completes."
created: 2026-03-26T00:00:00Z
updated: 2026-03-26T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — build-sw.mjs does not define process.env.NODE_ENV, causing Serwist to compile in dev mode (96 `if(true)` dev branches, NetworkOnly defaultCache, verbose logging on every fetch)
test: Add `"process.env.NODE_ENV": '"production"'` to esbuild define, rebuild, verify `if(true)` count drops to 0 and defaultCache has proper strategies
expecting: All three symptoms resolved
next_action: Apply fix to build-sw.mjs, add Cache-Control header for sw.js, rebuild and verify

## Symptoms

expected: PWA should update when new version is available, countdown should trigger reload, scrolling should be smooth
actual: PWA freezes/pauses on scroll, update countdown completes but doesn't actually update the app, PWA generally not functioning correctly
errors: Unknown
reproduction: Happens across multiple environments (installed PWA, mobile browser, desktop browser)
started: Broke recently — was working before recent changes

## Eliminated

## Evidence

- timestamp: 2026-03-26T00:01:00Z
  checked: public/sw.js built output
  found: `var defaultCache = true ? [{ matcher: /.*/i, handler: new NetworkOnly() }] : [... proper strategies ...]` — dev branch taken
  implication: defaultCache resolves to NetworkOnly catch-all instead of proper caching strategies

- timestamp: 2026-03-26T00:02:00Z
  checked: public/sw.js for `if (true)` count
  found: 96 instances of `if (true)` — ALL dev-mode branches active
  implication: Every fetch triggers verbose console logging (groupCollapsed, log, groupEnd), causing scroll jank on mobile

- timestamp: 2026-03-26T00:03:00Z
  checked: @serwist/next/dist/index.worker.js line 8
  found: `const defaultCache = process.env.NODE_ENV !== "production" ? [NetworkOnly] : [proper strategies]`
  implication: Source of truth confirmed — NODE_ENV must be "production" for proper caching

- timestamp: 2026-03-26T00:04:00Z
  checked: scripts/build-sw.mjs esbuild define section
  found: Only `self.__SW_MANIFEST` is defined, NO `process.env.NODE_ENV`
  implication: esbuild doesn't replace process.env.NODE_ENV, so it evaluates to undefined at build time

- timestamp: 2026-03-26T00:05:00Z
  checked: next.config.ts headers
  found: No Cache-Control header for sw.js
  implication: SW file relies on default hosting headers, secondary issue

## Resolution

root_cause: build-sw.mjs does not define `process.env.NODE_ENV` in esbuild config, causing @serwist/next's defaultCache to use the development branch (NetworkOnly catch-all + 96 dev-mode logging branches). This causes (1) no proper asset caching = broken PWA, (2) verbose console logging on every fetch during scroll = freeze/jank, (3) potential interference with update flow from dev-mode code paths.
fix: Add `"process.env.NODE_ENV": '"production"'` to esbuild define in build-sw.mjs. Also add Cache-Control no-cache header for sw.js in next.config.ts.
verification: Rebuild SW, verify `if (true)` count = 0, verify defaultCache has proper strategies, run full verification suite.
files_changed: [scripts/build-sw.mjs, next.config.ts]
