---
status: resolved
trigger: "ALL dynamic pages on Vercel return 0 bytes (never respond). Static/prerendered pages work. API routes work."
created: 2026-03-03T00:00:00Z
updated: 2026-03-04T00:00:00Z
resolved: 2026-03-04T00:00:00Z
---

## Current Focus

RESOLVED — Route slug conflict. See Resolution section below.

## Symptoms

expected: Dynamic pages should render and return HTML responses
actual: Dynamic pages return 0 bytes after 15+ second timeout. No HTTP headers sent at all.
errors: No error messages - just 0 bytes. Request hangs indefinitely until timeout.
reproduction: curl to /test-dynamic, /login returns 000 after 15s. Prerendered / returns 200. API routes work.
started: After deploying v2.0 milestone + database reset

## Eliminated

- hypothesis: Supabase createClient/auth blocking
  evidence: API routes using createClient + auth.getUser complete in 4ms
  timestamp: prior investigation

- hypothesis: DomMaxProvider blocking
  evidence: Removed from auth layout, still hangs
  timestamp: prior investigation

- hypothesis: LazyMotion/AnimationProvider blocking
  evidence: Removed from Providers, still hangs
  timestamp: prior investigation

- hypothesis: HeaderWrapper/ServiceWorkerRegistration/Analytics/SpeedInsights/OfflineIndicator/UpdatePrompt/WebVitalsReporter
  evidence: All removed from root layout, still hangs
  timestamp: prior investigation

- hypothesis: Sentry withSentryConfig
  evidence: Removed from next.config.ts, still hangs
  timestamp: prior investigation

- hypothesis: instrumentation.ts (Sentry.captureRequestError)
  evidence: Renamed to .disabled, still hangs
  timestamp: prior investigation

## Evidence

- timestamp: prior
  checked: /test-dynamic minimal page with force-dynamic
  found: Even a bare <div>Hello</div> page hangs when force-dynamic
  implication: Issue is in root layout rendering chain, not page-specific code

- timestamp: prior
  checked: Prerendered pages vs dynamic pages
  found: Static pages work, only SSR pages hang
  implication: Build pipeline is fine, runtime SSR rendering is broken

- timestamp: prior
  checked: API routes
  found: API routes work fine including ones using Supabase
  implication: Serverless functions execute, Node runtime works, Supabase client works

- timestamp: investigation
  checked: All provider implementations (ThemeProvider, DynamicThemeProvider, QueryProvider, ToastProvider)
  found: All have proper SSR guards (typeof window === "undefined" checks), no blocking operations, no async code in render path
  implication: Providers are NOT the direct cause of the hang

- timestamp: investigation
  checked: next.config.ts for Turbopack compatibility
  found: Three webpack-era configs present — (1) reactCompiler: true (Babel-based, known to cause infinite loops), (2) compiler.removeConsole (confirmed unsupported by Turbopack per GitHub discussions), (3) modularizeImports for lucide-react (conflicts with optimizePackageImports which also lists lucide-react)
  implication: These configs are silently incompatible with Turbopack (default bundler in Next.js 16)

- timestamp: investigation
  checked: Next.js 16 Turbopack default behavior
  found: Next.js 16 uses Turbopack for BOTH dev and production builds by default (no --webpack flag used in build script)
  implication: All webpack-specific configs may silently malfunction

- timestamp: investigation
  checked: Web search for React Compiler SSR issues
  found: Known infinite loop bugs with babel-plugin-react-compiler during SSR rendering, especially when memoization differs from expected behavior
  implication: reactCompiler: true is a high-probability cause of the SSR hang

- timestamp: investigation
  checked: modularizeImports + optimizePackageImports conflict
  found: lucide-react listed in BOTH modularizeImports (webpack-era transform) and optimizePackageImports (modern Turbopack-compatible). The modularizeImports transform path "lucide-react/dist/esm/icons/{{ kebabCase member }}" could conflict with Turbopack's handling
  implication: Duplicate optimization configs could cause module resolution failures during SSR

## Resolution

root_cause: Route slug conflict — `(customer)/orders/[id]` and `(public)/orders/[shareToken]` used different dynamic segment names at the same URL path level. Next.js threw `Error: You cannot use different slug names for the same dynamic path ('id' !== 'shareToken')` at runtime, crashing the route resolver for ALL dynamic pages. This was added in Phase 93 (share feature).
fix: Renamed `[shareToken]` → `[id]` in `src/app/(public)/orders/[id]/share/page.tsx`. Destructured as `{ id: shareToken }` to preserve semantic naming.
verification: `pnpm build && pnpm start` locally — all dynamic pages return 200. Deployed to Vercel — /login 200 in 0.4s, /menu 200 in 0.2s, / 200 in 0.6s.
files_changed: [src/app/(public)/orders/[id]/share/page.tsx (renamed from [shareToken])]
lessons_learned: |
  1. ALWAYS run `pnpm build && pnpm start` locally before remote debugging — the error was visible in terminal output
  2. Previous debug commits broke the build (stripped providers), so changes never deployed to Vercel — wasted 12+ iterations against a stale deployment
  3. The initial hypothesis (reactCompiler) was wrong because we never saw the actual error message
  4. 0-byte responses on Vercel can mean runtime crash, not just "hang" — local reproduction reveals the actual error
