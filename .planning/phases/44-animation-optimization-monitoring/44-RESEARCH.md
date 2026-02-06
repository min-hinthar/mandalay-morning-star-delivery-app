# Phase 44: Animation Optimization & Monitoring - Research

**Researched:** 2026-02-06
**Domain:** React Compiler, Framer Motion bundle optimization, GSAP modular imports, Lighthouse CI
**Confidence:** HIGH

## Summary

This phase has four workstreams: enabling React Compiler globally, reducing Framer Motion bundle via LazyMotion/m migration, auditing GSAP imports for dead code, and setting up Lighthouse CI as a PR regression gate.

The codebase has 181 files importing from `framer-motion` with ~1400 `motion.*` element usages across 174 files. GSAP usage is minimal (4 consumer files) but registers 3 unused plugins (SplitText, Flip, Observer) that should be removed. React Compiler is now a stable top-level config in Next.js 16 (not experimental). Lighthouse CI has an existing `lighthouserc.js` but `@lhci/cli` is not installed.

**Primary recommendation:** Enable React Compiler first (highest-value, lowest-effort), then migrate Framer Motion to LazyMotion+m (highest bundle impact, highest effort), audit GSAP dead plugins, and add Lighthouse CI as the verification gate.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `babel-plugin-react-compiler` | latest | React Compiler Babel plugin | Required by Next.js 16 `reactCompiler` config |
| `framer-motion` | 12.26.1 (installed) | Animation library | Already in use; LazyMotion/m is built-in |
| `gsap` | 3.14.2 (installed) | Scroll-linked animations | Already in use; modular imports built-in |
| `@lhci/cli` | 0.15.x | Lighthouse CI CLI | Official Google tool for CI performance gates |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `treosh/lighthouse-ci-action` | v12 | GitHub Actions Lighthouse integration | PR-triggered Lighthouse audits with artifact upload |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `framer-motion` | `motion` (renamed pkg) | Same code, but migration changes all import paths; not worth it during optimization phase |
| `@lhci/cli` + GH Action | Vercel Speed Insights | Vercel SI is real-user monitoring, not synthetic CI gate |
| `treosh/lighthouse-ci-action` | Raw `@lhci/cli` in workflow | Action provides better artifact handling + output composition |

**Installation:**
```bash
pnpm add -D babel-plugin-react-compiler @lhci/cli
```

## Architecture Patterns

### React Compiler Configuration

**next.config.ts** -- Top-level option (NOT under `experimental`):
```typescript
const nextConfig: NextConfig = {
  reactCompiler: true,
  // ... existing config
}
```

**Confidence: HIGH** -- Verified via official Next.js 16 docs. The `reactCompiler` option was promoted from experimental to stable following React Compiler's 1.0 release.

**Key facts:**
- Requires `babel-plugin-react-compiler` as devDependency
- Next.js includes a custom SWC optimization that only applies the compiler to relevant files (those with JSX or hooks), minimizing build perf impact
- Opt-out per file/component via `"use no memo"` directive at function top
- Opt-in mode also available via `compilationMode: 'annotation'` + `"use memo"` directive (not recommended for this project since decision is global-all-at-once)

### LazyMotion + m Component Migration

**Provider placement:** Root level in `src/app/providers.tsx`, wrapping `AnimationProvider`:
```typescript
import { LazyMotion, domMax } from "framer-motion";

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <DynamicThemeProvider>
        <QueryProvider>
          <LazyMotion features={domMax} strict>
            <AnimationProvider>
              {children}
            </AnimationProvider>
          </LazyMotion>
        </QueryProvider>
      </DynamicThemeProvider>
    </ThemeProvider>
  );
}
```

**Feature bundle decision: `domMax` (not `domAnimation`)**

Rationale -- the codebase uses features that require `domMax`:
- `drag="x"` + `dragConstraints` in `CartItem.tsx`
- `layoutId` in 10+ components: NavDots, Tabs, BottomNav, AdminLayout, CategoryTabs, TestimonialsCarousel, FeaturedCarousel/CarouselControls, SettingsClient, AccountClient

`domAnimation` (~15kb) only covers animations, variants, exit animations, tap/hover/focus gestures.
`domMax` (~25kb) adds pan/drag gestures and layout animations.

**Confidence: HIGH** -- Verified by grepping codebase for drag/layoutId usage.

**Loading strategy: Synchronous (not async)**

Rationale:
- Animations appear on every customer-facing page (homepage hero, menu, cart, checkout)
- Async loading would cause a flash of unanimated content on first load
- The ~25kb domMax is loaded ONCE at root vs the current ~34kb bundled per `motion` component import
- Net bundle reduction: `m` component is ~4.6kb vs `motion` at ~34kb preloaded per usage site

**m component import pattern:**
```typescript
// Before (every file)
import { motion, AnimatePresence } from "framer-motion";
<motion.div animate={{ opacity: 1 }} />

// After (every file)
import { m, AnimatePresence } from "framer-motion";
<m.div animate={{ opacity: 1 }} />
```

**Confidence: HIGH** -- The `m` component is exported from `"framer-motion"` package directly. No need to migrate to `"motion"` package.

### GSAP Dead Plugin Removal

**Current state** (`src/lib/gsap/index.ts`):
```typescript
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { Observer } from "gsap/Observer";
gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Flip, Observer);
```

**Audit results -- Plugin usage:**

| Plugin | Imported In | Actually Used In Components | Verdict |
|--------|-------------|----------------------------|---------|
| ScrollTrigger | gsap/index.ts | ParallaxLayer, RevealOnScroll, ScrollChoreographer | KEEP |
| SplitText | gsap/index.ts | NOWHERE | REMOVE (dead code) |
| Flip | gsap/index.ts | NOWHERE (ETACountdown FlipDigit is Framer Motion, not GSAP Flip) | REMOVE (dead code) |
| Observer | gsap/index.ts | NOWHERE (all Observer refs are browser IntersectionObserver/ResizeObserver) | REMOVE (dead code) |
| useGSAP | gsap/index.ts | FlyToCart, ParallaxLayer, RevealOnScroll, ScrollChoreographer | KEEP |

**Confidence: HIGH** -- Verified by grepping every file for SplitText, Flip, Observer usage. Zero consumer references outside the registration file.

**GSAP consumer files (only 4):**
1. `src/components/ui/cart/FlyToCart.tsx` -- gsap core + timelines (no ScrollTrigger)
2. `src/components/ui/scroll/ParallaxLayer.tsx` -- gsap + ScrollTrigger
3. `src/components/ui/scroll/RevealOnScroll.tsx` -- gsap + ScrollTrigger
4. `src/components/ui/scroll/ScrollChoreographer.tsx` -- gsap + ScrollTrigger

**Dynamic import recommendation: NO for GSAP components**

Rationale:
- All 3 scroll components are used on below-the-fold content (already deferred by scroll triggers)
- FlyToCart is event-driven (only executes on add-to-cart)
- GSAP core is ~60kb unminified; with only ScrollTrigger plugin, minimal overhead
- Dynamic importing GSAP would add complexity for marginal gains since the components themselves are already client-only and scroll-deferred
- Focus effort on Framer Motion reduction (181 files) for bigger ROI

**ESLint enforcement: Document-only (not ESLint rule)**

Rationale:
- Only 4 GSAP consumer files, all properly importing from `@/lib/gsap`
- Adding an ESLint rule for 4 files is overhead
- The centralized `@/lib/gsap/index.ts` pattern is already well-established and documented
- Comment header in index.ts already says "IMPORTANT: Import from @/lib/gsap, not directly from gsap"

### Lighthouse CI Configuration

**Existing state:**
- `lighthouserc.js` exists with good assertions config
- `pnpm lighthouse` script exists
- `@lhci/cli` is NOT in package.json
- CI workflow (`.github/workflows/ci.yml`) has lint, typecheck, test, build jobs
- Build artifacts already uploaded via `actions/upload-artifact@v4`

**Config updates needed:**
1. Change `staticDistDir: ".next"` to `startServerCommand: "pnpm start"` -- the staticDistDir approach doesn't work for Next.js App Router (needs running server for dynamic routes)
2. Update URLs to match decision: homepage, menu, cart, checkout, tracking
3. Change assertions from `"error"` to `"warn"` per decision (warn-only, not block)
4. Keep `temporary-public-storage` for upload target (simplest, no server needed)

**GitHub Actions workflow pattern:**
```yaml
lighthouse:
  name: Lighthouse CI
  runs-on: ubuntu-latest
  needs: [build]
  if: github.event_name == 'pull_request'
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with:
        version: 10
    - uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: pnpm
    - run: pnpm install --frozen-lockfile
    - run: pnpm build
    - uses: treosh/lighthouse-ci-action@v12
      with:
        configPath: ./lighthouserc.js
        uploadArtifacts: true
        temporaryPublicStorage: true
```

**Run trigger: PR only (not every push)**

Rationale:
- Lighthouse runs are slow (~60-90s per URL x 3 runs x 5 URLs = ~15-25 min)
- Running on every push to main doubles CI time for no value (main is already committed)
- PR-only aligns with the decision: "PR comment only when a metric drops"

**PR comment strategy:**
- `treosh/lighthouse-ci-action@v12` with `temporaryPublicStorage: true` generates report links
- Use outputs to compose a PR comment when scores drop below threshold
- The Lighthouse CI GitHub App (installed from `https://github.com/apps/lighthouse-ci`) enables automatic status checks
- Alternative: `LHCI_GITHUB_APP_TOKEN` secret for automatic PR status without custom comment logic

**Confidence: HIGH** -- Verified via official lighthouse-ci docs and treosh/lighthouse-ci-action README.

### Recommended Project Structure (Changes Only)

```
src/
  app/
    providers.tsx          # ADD: LazyMotion wrapper
  lib/
    gsap/
      index.ts             # MODIFY: Remove SplitText, Flip, Observer
      conflict-detector.ts # KEEP as-is
      presets.ts            # KEEP as-is
  components/
    ui/
      **/*.tsx              # MODIFY: motion.* -> m.* (174 files)
next.config.ts             # MODIFY: Add reactCompiler: true
lighthouserc.js            # MODIFY: Update collect/assert config
.github/
  workflows/
    ci.yml                 # MODIFY: Add lighthouse job
```

### Anti-Patterns to Avoid

- **Mixing `motion.*` and `m.*` under LazyMotion strict**: Any remaining `motion.div` inside LazyMotion strict will throw. Must convert ALL before enabling strict.
- **Async LazyMotion features with above-the-fold animations**: Homepage hero animations need features immediately; async loading would delay them.
- **Adding `"use no memo"` preemptively to animation files**: Only add it to files that actually break under the compiler. The compiler handles most patterns correctly.
- **Dynamic importing GSAP for already-scroll-triggered content**: ScrollTrigger components are already lazy by nature of being scroll-triggered.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Memoization optimization | Manual useMemo/useCallback audit | React Compiler (`reactCompiler: true`) | Compiler handles this automatically for 282 client files |
| Performance regression detection | Custom bundle size tracking | Lighthouse CI + treosh action | Standard tool, tracks all Core Web Vitals, generates reports |
| Animation feature code splitting | Custom dynamic import per animation feature | LazyMotion + domMax | Built into framer-motion, handles feature loading automatically |
| PR performance comments | Custom GitHub API integration | Lighthouse CI GitHub App + `LHCI_GITHUB_APP_TOKEN` | Automatic status checks and report links |

## Common Pitfalls

### Pitfall 1: React Compiler Breaks Animation Refs/Effects
**What goes wrong:** Framer Motion uses interior mutability (motionValue) and GSAP does direct DOM manipulation. React Compiler may over-memoize these patterns.
**Why it happens:** Compiler assumes referential equality means value equality; animation libraries violate this assumption.
**How to avoid:** Enable compiler globally, run full test suite, add `"use no memo"` only to components that actually fail.
**Warning signs:** Animations freeze, motion values don't update, GSAP timelines don't fire callbacks.

### Pitfall 2: Incomplete motion.* to m.* Migration
**What goes wrong:** A single remaining `motion.div` inside a LazyMotion strict tree throws a runtime error.
**Why it happens:** 174 files with 1400 occurrences is a large migration. Easy to miss one.
**How to avoid:**
1. Use global search-replace (`motion.div` -> `m.div`, etc.) across all element types
2. Update imports: `import { motion }` -> `import { m }`
3. Enable `strict` mode on LazyMotion to catch any misses at runtime
4. Run `pnpm build` and `pnpm test` to catch type/runtime errors
**Warning signs:** Runtime throw: "motion component rendered within LazyMotion strict"

### Pitfall 3: LazyMotion Provider Placement Below AnimatePresence
**What goes wrong:** AnimatePresence exit animations fail because `m` components lose feature context during exit.
**Why it happens:** When a component exits the tree, it may lose access to LazyMotion context if provider is below it.
**How to avoid:** Place LazyMotion at the ROOT level (in providers.tsx), ABOVE all AnimatePresence usage.

### Pitfall 4: lighthouserc.js Using staticDistDir for Next.js
**What goes wrong:** Lighthouse audits against raw .next output, missing dynamic routes, API routes, middleware.
**Why it happens:** Current config uses `staticDistDir: ".next"` which doesn't start a server.
**How to avoid:** Switch to `startServerCommand: "pnpm start"` with `startServerReadyPattern` and URL collection.

### Pitfall 5: motion.* Used in Type-Only Contexts
**What goes wrong:** Renaming `motion.div` breaks TypeScript types that reference `React.ComponentProps<typeof motion.div>`.
**Why it happens:** Some files may use `motion` in type annotations, not just JSX.
**How to avoid:** Search for `typeof motion.` in addition to JSX usage. Update type references to use `typeof m.div` etc.

### Pitfall 6: Framer Motion Imports Beyond motion/m
**What goes wrong:** Other framer-motion imports (AnimatePresence, useAnimation, useScroll, etc.) don't need changing but import lines that destructure `motion` alongside them do.
**Why it happens:** Import lines like `import { motion, AnimatePresence, useScroll } from "framer-motion"` need `motion` changed to `m` while keeping the rest.
**How to avoid:** Careful import-line refactoring. Only change `motion` -> `m` in the destructured imports, leave other named exports unchanged.

## Code Examples

### React Compiler Enable (next.config.ts)
```typescript
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/reactCompiler
const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  // ... rest of existing config
}
```

### React Compiler Opt-Out (per-component)
```typescript
// Source: https://react.dev/reference/react-compiler/directives/use-no-memo
export default function ProblematicComponent() {
  "use no memo";
  // Component code that breaks under compiler
}
```

### LazyMotion Provider Setup (providers.tsx)
```typescript
// Source: framer-motion docs (LazyMotion)
import { LazyMotion, domMax } from "framer-motion";

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <DynamicThemeProvider>
        <QueryProvider>
          <LazyMotion features={domMax} strict>
            <AnimationProvider>
              {children}
            </AnimationProvider>
          </LazyMotion>
        </QueryProvider>
      </DynamicThemeProvider>
    </ThemeProvider>
  );
}
```

### motion.* to m.* Migration (typical component)
```typescript
// BEFORE
import { motion, AnimatePresence } from "framer-motion";

function MyComponent() {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        Content
      </motion.div>
    </AnimatePresence>
  );
}

// AFTER
import { m, AnimatePresence } from "framer-motion";

function MyComponent() {
  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        Content
      </m.div>
    </AnimatePresence>
  );
}
```

### Cleaned GSAP Registration (lib/gsap/index.ts)
```typescript
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initConflictDetector } from "./conflict-detector";

// Register ONLY used plugins
gsap.registerPlugin(useGSAP, ScrollTrigger);

initConflictDetector(gsap);

gsap.config({
  autoSleep: 60,
  force3D: true,
  nullTargetWarn: false,
});

gsap.defaults({
  duration: 0.6,
  ease: "power2.out",
});

export { gsap, useGSAP, ScrollTrigger };
```

### Updated lighthouserc.js
```javascript
module.exports = {
  ci: {
    collect: {
      startServerCommand: "pnpm start",
      startServerReadyPattern: "started server",
      startServerReadyTimeout: 30000,
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/menu",
        "http://localhost:3000/cart",
        "http://localhost:3000/checkout",
        // Note: /tracking requires order ID, use generic route
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: "--no-sandbox --headless --disable-gpu",
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
        },
        emulatedFormFactor: "mobile",
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 667,
          deviceScaleFactor: 2,
        },
      },
    },
    assert: {
      assertions: {
        // All WARN per decision (not block)
        "first-contentful-paint": ["warn", { maxNumericValue: 1500 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["warn", { maxNumericValue: 200 }],
        "categories:performance": ["warn", { minScore: 0.9 }],
        "categories:accessibility": ["warn", { minScore: 0.95 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
```

### Lighthouse CI GitHub Actions Job
```yaml
lighthouse:
  name: Lighthouse CI
  runs-on: ubuntu-latest
  needs: [build]
  if: github.event_name == 'pull_request'
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with:
        version: 10
    - uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: pnpm
    - run: pnpm install --frozen-lockfile
    - run: pnpm build
    - name: Run Lighthouse CI
      uses: treosh/lighthouse-ci-action@v12
      with:
        configPath: ./lighthouserc.js
        uploadArtifacts: true
        temporaryPublicStorage: true
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `experimental.reactCompiler` | Top-level `reactCompiler` | Next.js 16 stable | Config key moved out of experimental |
| Manual useMemo/useCallback | React Compiler auto-memo | React Compiler 1.0 | No manual memoization needed |
| `import { motion } from "framer-motion"` (~34kb/import) | `import { m } from "framer-motion"` + LazyMotion (~4.6kb) | framer-motion v4+ | ~85% reduction in per-component animation cost |
| `"framer-motion"` package | `"motion"` package | 2024 rebrand | Same API, new name; both packages work, migration not required |

**Deprecated/outdated:**
- `motion/react-m` subpath export: Has a known bug with LazyMotion (issue #3091); import `m` from `"framer-motion"` directly instead
- `optimizePackageImports: ["framer-motion"]` in next.config.ts: Can be removed after LazyMotion migration since m+domMax handles feature loading explicitly

## Open Questions

1. **Tracking page in Lighthouse audit**
   - What we know: `/orders/[id]/tracking` requires a valid order ID to render
   - What's unclear: How to audit a dynamic route that requires auth + data
   - Recommendation: Skip tracking page in initial LHCI config; audit the other 4 routes. Add tracking later with a seeded test order if needed.

2. **React Compiler impact on build time**
   - What we know: Next.js uses SWC optimization to only compile relevant files
   - What's unclear: Exact build time impact for 282 client files
   - Recommendation: Measure build time before/after enabling compiler. If >30% slower, consider `compilationMode: 'annotation'` for critical paths only.

3. **LazyMotion strict mode + third-party components**
   - What we know: Any `motion.*` component inside LazyMotion strict will throw
   - What's unclear: Whether any third-party dependencies (vaul, cmdk, radix) internally use `motion.*` from framer-motion
   - Recommendation: Enable strict after migration, run full test suite. If third-party components throw, either wrap them outside LazyMotion or remove strict (pragmatic approach per decision).

4. **Framer Motion `optimizePackageImports` interaction with LazyMotion**
   - What we know: `"framer-motion"` is in `optimizePackageImports` in next.config.ts
   - What's unclear: Whether this conflicts with or duplicates LazyMotion's feature splitting
   - Recommendation: Keep `optimizePackageImports` during migration, remove it after verifying LazyMotion works correctly. It should not conflict but may be redundant.

## Sources

### Primary (HIGH confidence)
- [Next.js 16 reactCompiler docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/reactCompiler) -- Config syntax, opt-out directive
- [Next.js 16 blog post](https://nextjs.org/blog/next-16) -- React Compiler promotion to stable
- [Motion reduce bundle size docs](https://motion.dev/docs/react-reduce-bundle-size) -- LazyMotion, m, domAnimation, domMax, strict mode
- [GSAP Installation docs](https://gsap.com/docs/v3/Installation/) -- Modular imports, tree shaking, registerPlugin
- [GoogleChrome/lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci) -- LHCI setup, configuration, GitHub integration
- [treosh/lighthouse-ci-action](https://github.com/treosh/lighthouse-ci-action) -- GitHub Actions v12 configuration, inputs/outputs

### Secondary (MEDIUM confidence)
- [React Compiler in Next.js 16 (Medium)](https://medium.com/better-dev-nextjs-react/react-compiler-in-next-js-16-what-it-fixes-what-it-breaks-and-how-to-ship-it-safely-62881c4c0b74) -- Practical adoption patterns
- [Motion/Framer Motion upgrade guide](https://motion.dev/docs/react-upgrade-guide) -- Package rename, import path changes
- ["use no memo" directive (React docs)](https://react.dev/reference/react-compiler/directives/use-no-memo) -- Opt-out semantics

### Tertiary (LOW confidence)
- [LazyMotion bug #3091](https://github.com/motiondivision/motion/issues/3091) -- Known issue with `motion/react-m` import path (avoid that path, use `"framer-motion"` directly)
- [GSAP tree shaking forum](https://gsap.com/community/forums/topic/28599-gsap-imports-tree-shaking-reduce-bundle-size/) -- Community patterns for modular GSAP

## Metadata

**Confidence breakdown:**
- React Compiler setup: HIGH -- Official docs verified, stable feature in Next.js 16
- Framer Motion LazyMotion/m migration: HIGH -- API verified, import paths confirmed, feature requirements audited
- GSAP dead plugin audit: HIGH -- Full codebase grep confirms SplitText/Flip/Observer unused
- Lighthouse CI setup: HIGH -- Official docs + existing lighthouserc.js provides foundation

**Codebase metrics (relevant to effort estimation):**
- Files importing framer-motion: 181
- Files with `motion.*` elements: 174
- Total `motion.*` occurrences: ~1400
- Files using GSAP: 4 (+ 1 registration file)
- Unused GSAP plugins to remove: 3 (SplitText, Flip, Observer)
- Files using `layoutId`: ~10
- Files using `drag`: 1 (CartItem.tsx)
- Files using `useScroll`/`useTransform`/`useMotionValue`: 16

**Research date:** 2026-02-06
**Valid until:** 2026-03-08 (30 days -- stable libraries, unlikely to change)
