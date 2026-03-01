# Phase 41: Server Component Conversions - Research

**Researched:** 2026-02-05
**Domain:** Next.js 16 Server Components, React 19, Client/Server boundary optimization
**Confidence:** HIGH

## Summary

Server Component conversions for this Next.js 16 / React 19 application focus on reducing client JavaScript bundle size by pushing "use client" boundaries to leaf components. The codebase currently has 275 files with "use client" directives. The primary targets (home page, menu page, analytics page, order tracking page) are already partially optimized - page.tsx files are server components, but they render large client component wrappers (HomePageClient, MenuContent, TrackingPageClient) that bundle significant JavaScript.

The conversion approach requires extracting data fetching to server components while keeping interactive elements (hooks, event handlers, framer-motion animations) in client component leaves. React strict mode is already enabled in next.config.ts. The existing branded spinner component provides the foundation for loading states.

**Primary recommendation:** Convert pages incrementally by extracting server-rendered static content from client wrappers, pushing interactivity to small leaf components, and creating shared loading.tsx/error.tsx files per route segment.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- Convert 4 pages: home page, menu page, analytics page, order tracking page
- Also convert nearby easy wins discovered during the process
- Home page and menu page are highest LCP priority
- Claude decides conversion order (balance safety vs impact)
- Claude discovers nearby wins during audit
- Moderate approach: remove "use client" where possible, refactor small cases (extract tiny client component to keep wrapper server-side)
- If a conversion introduces unexpected issues (client-only library, etc.): revert and skip - don't fight it
- Invest time fixing hydration issues rather than reverting prematurely
- Branded spinner (polish existing spinner component, not create new)
- Generic loading component reused across routes (not content-aware per page)
- Route-specific context text (e.g., "Loading menu...")
- Centered in viewport
- Animated transitions (fade/slide, consistent with existing playful UI from v1.4)
- 200-300ms minimum display time to prevent flicker
- Also create branded error.tsx alongside loading.tsx
- Full audit of all 275 files - no sampling
- Documented audit artifact in `.planning/phases/41-server-component-conversions/`
- Cleanup happens alongside page conversions (not as separate sweep)
- Both build checks AND automated tests for hydration error detection
- Single parameterized test file covering all converted routes
- Enable React strict mode for hydration mismatch detection (ALREADY ENABLED)
- Per-page smoke test checklist documented in the plan
- Final hydration health check pass across whole app after all conversions

### Claude's Discretion

- Conversion order across pages (safety vs impact balance)
- Whether to split components with single hook/event handler (judged per case)
- Audit categorization depth (binary vs reason-tagged)
- Target number of 'use client' files to reduce to
- Whether to track "could split later" files for future work
- Rollout strategy (incremental vs batched)

### Deferred Ideas (OUT OF SCOPE)

None - discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core (Already in Project)

| Library       | Version | Purpose                       | Why Standard                      |
| ------------- | ------- | ----------------------------- | --------------------------------- |
| Next.js       | 16.1.2  | App Router, Server Components | Built-in RSC support              |
| React         | 19.2.3  | Server/Client components      | Native RSC primitives             |
| Framer Motion | 12.26.1 | Animations                    | Requires client-side - leaf nodes |
| React Query   | 5.90.1  | Client data fetching          | Client-only hook patterns         |
| Zustand       | 5.0.10  | Client state                  | Client-only store                 |

### Testing Tools (Already in Project)

| Library         | Version | Purpose         | When to Use                   |
| --------------- | ------- | --------------- | ----------------------------- |
| Vitest          | 4.0.17  | Unit tests      | Hydration test assertions     |
| Playwright      | 1.57.0  | E2E tests       | Browser hydration smoke tests |
| Testing Library | 16.3.1  | Component tests | React rendering tests         |

### Supporting (No New Dependencies Needed)

The existing stack is sufficient. No new libraries required for this phase.

## Architecture Patterns

### Recommended Conversion Structure

```
src/app/(public)/page.tsx           # Server Component (async)
├── Static header/sections          # Server rendered
├── <Suspense fallback={<Skeleton>}>
│   └── <DataFetchingComponent />   # Server async
└── <InteractiveLeaf />             # Client Component (small)

src/components/ui/ComponentName/
├── index.tsx                       # Server Component (barrel)
├── ComponentName.tsx               # Server Component (static)
├── ComponentName.client.tsx        # Client Component (interactive)
└── ComponentNameSkeleton.tsx       # Server Component (loading UI)
```

### Pattern 1: Data Fetching Server Component with Client Leaf

**What:** Server component fetches data, passes props to small client component
**When to use:** Pages that fetch data and need interactive elements
**Example:**

```typescript
// Source: Context7 /vercel/next.js docs
// page.tsx (Server Component)
import { getData } from '@/lib/data'
import { InteractiveButton } from './InteractiveButton.client'

export default async function Page() {
  const data = await getData()

  return (
    <div>
      <h1>{data.title}</h1>
      <InteractiveButton initialState={data.likes} />
    </div>
  )
}

// InteractiveButton.client.tsx
'use client'
export function InteractiveButton({ initialState }: { initialState: number }) {
  const [count, setCount] = useState(initialState)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

### Pattern 2: Suspense Boundary with Loading States

**What:** Wrap async server components in Suspense with skeleton fallback
**When to use:** Any async data fetching that should stream
**Example:**

```typescript
// Source: Context7 /vercel/next.js docs
import { Suspense } from 'react'
import { DataList, DataListSkeleton } from './DataList'

export default function Page() {
  return (
    <div>
      <header>Static content loads immediately</header>
      <Suspense fallback={<DataListSkeleton />}>
        <DataList /> {/* Async - streams in */}
      </Suspense>
    </div>
  )
}
```

### Pattern 3: Route-Segment Loading/Error Files

**What:** loading.tsx and error.tsx at route segment level
**When to use:** Every converted route segment
**Example:**

```typescript
// loading.tsx
import { BrandedSpinner } from '@/components/ui/branded-spinner'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <BrandedSpinner size="lg" />
        <p className="mt-4 text-text-secondary">Loading menu...</p>
      </div>
    </div>
  )
}

// error.tsx
'use client'
import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* Error UI */}
    </div>
  )
}
```

### Anti-Patterns to Avoid

- **Wrapping entire page in "use client":** Defeats the purpose; push boundaries to leaves
- **Data fetching in client components:** Move to server components or React Query
- **Importing server-only modules in client components:** Will fail at build time
- **Dynamic content without Suspense:** Causes waterfall loading, worse UX
- **suppressHydrationWarning as fix-all:** Only use for intentional mismatches like timestamps

## Don't Hand-Roll

| Problem             | Don't Build                 | Use Instead                               | Why                                    |
| ------------------- | --------------------------- | ----------------------------------------- | -------------------------------------- |
| Loading UI          | Custom spinner from scratch | Polish existing BrandedSpinner            | Already exists, just needs enhancement |
| Error boundaries    | Manual try/catch            | Next.js error.tsx convention              | Automatic error boundary wrapping      |
| Hydration detection | Console log parsing         | React strict mode + Playwright assertions | Built-in detection, automated testing  |
| Bundle analysis     | Manual size tracking        | `pnpm analyze` (already configured)       | @next/bundle-analyzer already set up   |

**Key insight:** The project already has most infrastructure (spinner, error handling, testing). This phase is about architecture refactoring, not new feature development.

## Common Pitfalls

### Pitfall 1: Hydration Mismatches

**What goes wrong:** Server renders different HTML than client initial render
**Why it happens:**

- Using `typeof window !== 'undefined'` in render logic
- Using `Date.now()`, `Math.random()` during render
- Browser extensions modifying DOM
- Locale-dependent formatting (dates, numbers)
  **How to avoid:**
- Use `useEffect` for client-only values
- Use two-pass rendering with `isClient` state
- Test with `suppressHydrationWarning` temporarily to isolate issue
- Run builds with React strict mode (already enabled)
  **Warning signs:**
- "Text content does not match server-rendered HTML"
- "Hydration failed because the initial UI does not match"
- Content flashing/shifting on page load

### Pitfall 2: Accidental Client Component Infection

**What goes wrong:** Large subtrees become client components unnecessarily
**Why it happens:** Importing a client component propagates "use client" boundary
**How to avoid:**

- Review import chains
- Split interactive bits into separate .client.tsx files
- Use composition (children prop) instead of direct imports
  **Warning signs:**
- Bundle size doesn't decrease after conversion
- Server component imports showing in client bundle

### Pitfall 3: Missing Suspense Boundaries

**What goes wrong:** Entire page blocked until all async work completes
**Why it happens:** No Suspense wrapper around async server components
**How to avoid:**

- Wrap every async component in Suspense
- Create meaningful skeleton fallbacks
- Use loading.tsx for route-level loading
  **Warning signs:**
- White screen until page fully loads
- No streaming behavior visible

### Pitfall 4: Framer Motion SSR Issues

**What goes wrong:** Animation components fail to render or hydrate incorrectly
**Why it happens:** Framer Motion requires client-side execution
**How to avoid:**

- Keep all motion.\* components in client component leaves
- Use `LazyMotion` for code splitting animations
- Consider `shouldAnimate` guards (already in codebase)
  **Warning signs:**
- "useLayoutEffect does nothing on the server" warnings
- Animations not playing on first load

## Code Examples

### Current Homepage Structure (Before)

```typescript
// src/app/(public)/page.tsx - Server Component
export default async function HomePage() {
  const featuredSections = await getFeaturedSections()
  return (
    <main>
      <HomePageClient menuSection={<HomepageMenuSection />} />
    </main>
  )
}

// HomePageClient.tsx - "use client" (519 lines, entire page interactive)
```

### Target Homepage Structure (After)

```typescript
// src/app/(public)/page.tsx - Server Component
export default async function HomePage() {
  const featuredSections = await getFeaturedSections()
  return (
    <main>
      <HeroStatic /> {/* Server - static content */}
      <Suspense fallback={<HowItWorksSkeleton />}>
        <HowItWorksSection /> {/* Server - static */}
      </Suspense>
      <Suspense fallback={<MenuSkeleton />}>
        <HomepageMenuSection sections={featuredSections} />
      </Suspense>
      <TestimonialsStatic /> {/* Server - static */}
      <CTABannerStatic /> {/* Server - static */}
      <SectionNavDots.client sections={sections} /> {/* Client - scroll spy */}
    </main>
  )
}
```

### Hydration Test Pattern

```typescript
// e2e/hydration-smoke.spec.ts
import { test, expect } from "@playwright/test";

const CONVERTED_ROUTES = ["/", "/menu", "/admin/analytics", "/orders/[id]/tracking"];

test.describe("Server Component Hydration", () => {
  for (const route of CONVERTED_ROUTES) {
    test(`${route} hydrates without errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error" && msg.text().includes("hydrat")) {
          errors.push(msg.text());
        }
      });

      await page.goto(route.replace("[id]", "test-id"));
      await page.waitForLoadState("networkidle");

      expect(errors).toHaveLength(0);
    });
  }
});
```

### Loading Component Pattern

```typescript
// src/components/ui/RouteLoading.tsx
'use client' // Needs client for animation

import { motion } from 'framer-motion'
import { BrandedSpinner } from './branded-spinner'

interface RouteLoadingProps {
  message?: string
}

export function RouteLoading({ message = 'Loading...' }: RouteLoadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, delay: 0.2 }} // 200ms minimum display
      className="min-h-screen flex flex-col items-center justify-center"
    >
      <BrandedSpinner size="lg" />
      <p className="mt-4 text-text-secondary font-body">{message}</p>
    </motion.div>
  )
}
```

## State of the Art

| Old Approach               | Current Approach                | When Changed       | Impact                            |
| -------------------------- | ------------------------------- | ------------------ | --------------------------------- |
| "use client" at page level | Push to leaf components         | Next.js 13+ (2023) | 50-70% bundle reduction possible  |
| getServerSideProps         | Server Components + async       | Next.js 13+ (2023) | Simpler data flow, auto-streaming |
| loading.js (Pages Router)  | loading.tsx (App Router)        | Next.js 13+ (2023) | Route-segment loading states      |
| Manual Suspense everywhere | React 19 + Next.js 16 streaming | 2024-2025          | Better default streaming          |

**Deprecated/outdated:**

- `getServerSideProps`/`getStaticProps`: Replaced by async server components
- `use client` at wrapper level: Anti-pattern now; push to leaves
- Manual hydration error handling: React 19/Next.js 15+ have better error messages

## Target Page Analysis

### Home Page (Highest Priority)

**Current:** `src/app/(public)/page.tsx` → `HomePageClient` (519 lines)
**Client dependencies:** framer-motion (animations), scroll hooks, mouse tracking
**Conversion potential:** HIGH

- Static sections: Hero headline/tagline, stats bar, testimonials text, CTA text
- Client leaves: Animated headline, scroll spy dots, floating emojis
  **Estimated reduction:** ~200KB (animations stay, static content moves to server)

### Menu Page (Highest Priority)

**Current:** `src/app/(public)/menu/page.tsx` → `MenuContent` (365 lines)
**Client dependencies:** useMenu hook, useSearchParams, framer-motion, favorites
**Conversion potential:** MEDIUM-HIGH

- Static sections: Category structure, item cards (without interaction)
- Client leaves: CategoryTabs (scroll spy), ItemDetailSheet, FavoriteButton
  **Estimated reduction:** ~100KB

### Analytics Page

**Current:** Already mostly server component! Uses async data fetching
**Client dependencies:** Links only (client-side navigation)
**Conversion potential:** LOW (already optimized)
**Estimated reduction:** ~10KB (cleanup only)

### Order Tracking Page

**Current:** `src/app/(customer)/orders/[id]/tracking/page.tsx` → `TrackingPageClient`
**Client dependencies:** Realtime subscription, framer-motion, map
**Conversion potential:** MEDIUM

- Static sections: Header, order summary, delivery address
- Client leaves: StatusTimeline, ETACountdown, DeliveryMap, SupportActions
  **Estimated reduction:** ~80KB

## Audit Strategy

### Full 275-File Audit Approach

1. **Generate file list:** `find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "use client"`
2. **Categorize each file:**
   - `KEEP`: Requires client (hooks, events, animations)
   - `CONVERT`: Can be server component
   - `SPLIT`: Mixed - needs refactoring
   - `LEAF`: Already correct (small interactive component)
3. **Document in CSV/markdown table** with file, category, reason, action
4. **Track during conversion:** Update status as files are converted

### Conversion Order Recommendation

1. **Analytics page** (lowest risk, verify infrastructure)
2. **Menu page** (high LCP priority, medium complexity)
3. **Home page** (highest impact, highest complexity)
4. **Order tracking** (medium priority, real-time complexity)

This order balances:

- Starting with low-risk to validate approach
- Hitting high-LCP-priority pages early
- Saving complex real-time features for last

## Open Questions

1. **How much bundle reduction is realistic?**
   - What we know: 275 files, ~150KB target reduction mentioned
   - What's unclear: Actual distribution of JS between server-convertible and client-required
   - Recommendation: Run `pnpm analyze` before/after each page conversion

2. **Framer Motion lazy loading?**
   - What we know: Can use `LazyMotion` to code-split animation features
   - What's unclear: Whether worth the complexity for this app
   - Recommendation: Defer to Phase 42+ if needed; focus on RSC conversions first

3. **React Query vs Server Components for menu data?**
   - What we know: Menu uses useMenu hook with React Query
   - What's unclear: Whether to migrate to server-only fetching
   - Recommendation: Keep React Query for now (handles caching, refetching); focus on UI layer

## Sources

### Primary (HIGH confidence)

- Context7 `/vercel/next.js` - Server/Client component patterns, loading.tsx, error.tsx
- Context7 `/websites/react_dev` - Hydration mismatch handling, useEffect for client-only
- Project codebase analysis - Current architecture review

### Secondary (MEDIUM confidence)

- [Next.js Hydration Errors 2026](https://medium.com/@blogs-world/next-js-hydration-errors-in-2026-the-real-causes-fixes-and-prevention-checklist-4a8304d53702) - Common causes and fixes
- [React Hydration Overlay](https://www.builder.io/blog/announcing-react-hydration-overlay) - Debugging tool option

### Tertiary (LOW confidence)

- General web search results on hydration testing patterns

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - All tools already in project, patterns verified via Context7
- Architecture: HIGH - Well-documented Next.js patterns, project structure understood
- Pitfalls: HIGH - Documented in official sources, verified against project code

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (30 days - stable patterns)
