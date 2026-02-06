# Architecture Patterns

**Domain:** UI component library with strict layering and motion-first design
**Researched:** 2026-01-21 (Updated 2026-01-23 with 3D integration, 2026-01-27 with theme audit, 2026-01-30 with mobile optimization, 2026-02-05 with code splitting)
**Confidence:** HIGH (verified against existing codebase + authoritative sources)

---

## v1.5: Code Splitting & Bundle Optimization Architecture (2026-02-05)

### Overview

This section documents code splitting architecture for Next.js 16 App Router with route groups, addressing bundle optimization for an app with heavy animation libraries (GSAP 3.14.2, Framer Motion 12.26.1, Recharts 3.6.0, Google Maps 2.20.8).

**Current State:**
- 275 files marked "use client" (100% client-side components)
- 127 total files in src/app
- Route groups: (auth), (public), (customer), (admin), (driver)
- Estimated initial JS: ~800KB+ across routes

**Target State:**
- ~60 files with "use client" (~22% client-side)
- LCP < 2.5s through reduced initial JS
- Route-specific bundle optimization

---

### Code Splitting Strategy Matrix

| Library | Size (gzipped) | Usage Pattern | Strategy | Rationale |
|---------|----------------|---------------|----------|-----------|
| **GSAP** | ~30KB | 5 files, centralized | Keep eager-loaded | Centralized config prevents leaks, small size |
| **Framer Motion** | ~150KB → ~40KB | 174 files | optimizePackageImports | Already tree-shaken, global components |
| **Recharts** | ~180KB | 1 file (admin only) | Dynamic import | Admin-only, <5% traffic |
| **Google Maps** | ~120KB | 2 files | Partial dynamic import | Map is secondary, autocomplete is critical |

**Sources:**
- [Next.js optimizePackageImports](https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports)
- [Vercel Package Optimization](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js)

---

### Layer 1: Server Components (Zero Client JS)

**Pattern:** Default to Server Components, add "use client" only where required.

```
Current: 275/275 components = "use client" (100%)
Target: ~60/275 components = "use client" (22%)
Impact: ~400KB reduction through Server Component conversion
```

#### High-Impact Conversion Candidates

| File | Current | After | Savings | Complexity |
|------|---------|-------|---------|------------|
| `app/(admin)/admin/analytics/page.tsx` | Client fetch | Server fetch | ~40KB | Low |
| `app/(customer)/orders/[id]/tracking/page.tsx` | Client fetch | Server wrapper | ~60KB | Medium |
| `app/(public)/menu/page.tsx` | Client wrapper | Server wrapper | ~15KB | Low |
| Admin analytics dashboards | Client fetch | Server fetch | ~80KB | Low |

#### Server Component Pattern

```typescript
// BEFORE (Client Component - 100% JS sent to browser)
"use client";
export default function Page() {
  const { data } = useQuery({ queryKey: ['analytics'], queryFn: fetchAnalytics });
  return <DashboardClient data={data} />;
}

// AFTER (Server Component - zero JS for data fetching)
export default async function Page() {
  const supabase = await createClient();
  const data = await supabase.from('analytics').select();
  return <DashboardClient data={data} />;
}

// ClientComponent.tsx (only interactive parts)
"use client";
export function DashboardClient({ data }) {
  // Client-side state, interactions
}
```

**Key principles from research:**
- Server Components send zero bytes of JavaScript
- Once "use client" added, all imports become part of client bundle
- Push "use client" boundary down to leaf components

**Sources:**
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Server vs Client bundle size](https://dev.to/oskarinmix/server-components-vs-client-components-in-nextjs-differences-pros-and-cons-389f)
- [Package Bundling Guide](https://nextjs.org/docs/app/guides/package-bundling)

---

### Layer 2: Dynamic Imports for Heavy Libraries

#### Recharts (Admin Analytics - 180KB)

**Current usage:** `src/components/ui/admin/analytics/ExceptionBreakdown.tsx` (1 file)

**Strategy:** Dynamic import via LazyCharts wrapper (already exists)

```typescript
// src/components/ui/admin/analytics/LazyCharts.tsx (ALREADY EXISTS)
import dynamic from 'next/dynamic';

export const PerformanceChart = dynamic(
  () => import('./PerformanceChart').then(mod => ({ default: mod.PerformanceChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false  // Charts use browser-only APIs (window, document)
  }
);

export const PeakHoursChart = dynamic(
  () => import('./PeakHoursChart'),
  { loading: () => <ChartSkeleton /> }
);
```

**Impact:**
- Removes 180KB from non-admin routes
- Admin routes represent <5% of total traffic
- Loading skeleton prevents layout shift

**Sources:**
- [Recharts in Next.js](https://app-generator.dev/docs/technologies/nextjs/integrate-recharts.html)
- [Dynamic Imports Guide](https://daily.dev/blog/code-splitting-with-dynamic-imports-in-nextjs)

#### Google Maps (Tracking Page - 120KB)

**Current usage:**
- `DeliveryMap.tsx` - tracking page visualization (secondary)
- `usePlacesAutocomplete.ts` - checkout address autocomplete (critical)

**Strategy:** Partial dynamic import (map only, keep autocomplete eager)

```typescript
// src/components/ui/orders/tracking/TrackingPageClient.tsx
import dynamic from 'next/dynamic';

const DeliveryMap = dynamic(
  () => import('./DeliveryMap').then(mod => ({ default: mod.DeliveryMap })),
  {
    loading: () => <DeliveryMapSkeleton />,
    ssr: false  // Maps require window object
  }
);

// usePlacesAutocomplete stays eager-loaded (checkout critical path)
```

**Rationale:**
- Checkout address autocomplete is customer-facing (high priority)
- Tracking map is supplementary visualization (lower priority)
- Only loads when driver location available

**Impact:**
- Removes 120KB from initial checkout load
- Tracking page defers map until needed

#### Framer Motion (174 files - Already Optimized)

**Current:** `optimizePackageImports: ["framer-motion"]` in next.config.ts

**Strategy:** DO NOT dynamic import

**Why:**
- Used in global components (CartBar, Drawer, Modal, Header)
- Already tree-shaken: 150KB → 40KB via optimizePackageImports
- Dynamic import would cause layout shift on interactive elements
- AnimationProvider already respects reduced motion preference

**Exception:** Route-specific heavy animations

```typescript
// Admin optimization modal (complex GSAP + Framer combo)
const OptimizationModal = dynamic(
  () => import('./OptimizationModal'),
  { ssr: false }
);
```

**Sources:**
- [optimizePackageImports performance](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js)

#### GSAP (5 files - Centralized Pattern)

**Current:** Centralized in `lib/gsap/index.ts` (CORRECT)

**Strategy:** Keep centralized, NO dynamic imports

```typescript
// lib/gsap/index.ts (KEEP AS-IS)
"use client";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register plugins ONCE at module load
gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Flip, Observer);
```

**Why centralized is REQUIRED:**
- Prevents ScrollTrigger memory leaks on route changes
- Avoids plugin re-registration overhead
- 2026 GSAP community best practice
- Core library only ~30KB (acceptable eager load)

**Anti-pattern (verified via research):**

```typescript
// DON'T DO THIS - causes memory leaks
const gsap = dynamic(() => import('@/lib/gsap'));
```

**Impact if dynamically imported:**
- ScrollTriggers leak memory between navigations
- Animations lag on first load
- Re-registration causes instability

**Sources:**
- [GSAP Next.js Best Practices 2025](https://medium.com/@thomasaugot/optimizing-gsap-animations-in-next-js-15-best-practices-for-initialization-and-cleanup-2ebaba7d0232)
- [GSAP Community: Centralized Config](https://gsap.com/community/forums/topic/40128-using-scrolltriggers-in-nextjs-with-usegsap/)
- [GSAP ScrollTrigger Next.js Guide](https://medium.com/@ccjayanti/guide-to-using-gsap-scrolltrigger-in-next-js-with-usegsap-c48d6011f04a)

---

### Layer 3: Route-Based Splitting (Automatic)

Next.js 16 App Router automatically code-splits by route segments.

**Route Group Bundle Targets:**

| Route Group | Files | Target Bundle | Strategy |
|-------------|-------|---------------|----------|
| **(auth)** | 4 pages | <100KB | Minimal JS, form validation only |
| **(public)** | 3 pages | <150KB | Server Components for menu, GSAP for homepage |
| **(customer)** | 8 pages | <200KB | Dynamic import maps, optimize checkout |
| **(admin)** | 14 pages | <250KB | Dynamic import Recharts, lazy analytics |
| **(driver)** | 3 pages | <180KB | Maps eager (critical for navigation) |

**Key insight:** Route groups provide natural bundle isolation - no config needed. Focus on reducing individual route bundles.

**Sources:**
- [Mastering Code Splitting in App Router](https://dev.to/ahr_dev/mastering-code-splitting-in-nextjs-app-router-2608)
- [Bundle Optimization Techniques 2025](https://medium.com/better-dev-nextjs-react/the-10kb-next-js-app-extreme-bundle-optimization-techniques-d8047c482aea)

---

### Layer 4: Provider Refactoring (CRITICAL)

**Current Anti-Pattern:** Global providers load cart on all routes

```typescript
// src/app/providers.tsx (PROBLEM)
"use client";
export function Providers({ children }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AnimationProvider>
          {children}
          <CartBar />        // Loads on /admin, /driver (unnecessary)
          <CartDrawer />     // Loads on /login (unnecessary)
          <FlyToCart />      // Loads on analytics (unnecessary)
        </AnimationProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
```

**Recommended Refactor:**

```typescript
// src/app/providers.tsx (REFACTORED)
export function Providers({ children }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AnimationProvider>
          {children}
        </AnimationProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

// src/app/(customer)/layout.tsx (NEW)
export default function CustomerLayout({ children }) {
  return (
    <>
      {children}
      <CartBar />
      <CartDrawer />
      <FlyToCart />
    </>
  );
}

// src/app/(public)/layout.tsx (NEW)
export default function PublicLayout({ children }) {
  return (
    <>
      {children}
      <CartBar />     // Menu page needs cart
      <CartDrawer />
      <FlyToCart />
    </>
  );
}
```

**Impact:**
- Removes ~60KB from /admin routes (no cart needed)
- Removes ~60KB from /driver routes (no cart needed)
- Removes ~60KB from /auth routes (no cart needed)
- Only loads cart on (customer) and (public) groups

**Complexity:** Medium (requires testing across all route groups)

---

### Implementation Order (Phase Structure)

#### Phase 1: Server Component Conversions (1 week, Low risk)

**Impact:** ~150KB reduction

1. Convert analytics page wrappers to Server Components
2. Convert menu page wrapper (keep MenuContent client)
3. Convert order tracking wrapper
4. Add loading.tsx for route segments

**Files:** ~8 files

**Verification:**
```bash
pnpm analyze:browser  # Check bundle reduction
```

#### Phase 2: Dynamic Import Recharts (1 week, Low risk)

**Impact:** ~180KB reduction on non-admin routes

1. Verify LazyCharts exports exist
2. Replace direct Recharts imports in analytics pages
3. Add ChartSkeleton loading states
4. Test on slow 3G

**Files:** ~5 files

**Verification:**
```bash
pnpm lighthouse       # Check LCP improvement
pnpm test:e2e -- admin-analytics
```

#### Phase 3: Provider Refactoring (1.5 weeks, Medium risk)

**Impact:** ~60KB reduction on admin/driver/auth routes

1. Create (customer)/layout.tsx with cart components
2. Create (public)/layout.tsx with cart components
3. Remove cart from global providers.tsx
4. Test all route groups

**Files:** ~4 files

**Verification:**
```bash
pnpm test:e2e -- cart     # Full cart flow
pnpm test:e2e -- admin    # No cart interference
pnpm test:e2e -- driver   # No cart interference
```

#### Phase 4: Dynamic Import Maps (1 week, Low risk)

**Impact:** ~120KB conditional reduction

1. Dynamic import DeliveryMap in TrackingPageClient
2. Add DeliveryMapSkeleton
3. Keep usePlacesAutocomplete eager
4. Test with/without driver location

**Files:** ~2 files

**Verification:**
```bash
pnpm test:e2e -- tracking
pnpm lighthouse
```

#### Phase 5: Bundle Analysis (3 days, Low risk)

1. Run `pnpm analyze:browser`
2. Check duplicate dependencies
3. Verify tree-shaking
4. Document baseline
5. Set up bundle size CI checks

---

### Anti-Patterns to Avoid

#### Anti-Pattern 1: Dynamic Import GSAP (VERIFIED)

```typescript
// DON'T DO THIS
const gsap = dynamic(() => import('@/lib/gsap'));
```

**Why bad:**
- ScrollTriggers leak memory between routes
- Plugins re-register on every import
- Animations lag on first interaction

**Correct:** Keep centralized lib/gsap/index.ts with "use client"

**Source:** [GSAP Next.js Optimization](https://medium.com/@thomasaugot/optimizing-gsap-animations-in-next-js-15-best-practices-for-initialization-and-cleanup-2ebaba7d0232)

#### Anti-Pattern 2: Over-Splitting Critical Path

```typescript
// DON'T DO THIS (for above-fold content)
const Hero = dynamic(() => import('./Hero'));
```

**Why bad:**
- Delays LCP (Largest Contentful Paint)
- Layout shift during load
- Waterfall: HTML → JS → component

**Correct:** Eager load above-fold, dynamic import below-fold

**Source:** [Smart Code Splitting](https://dev.to/boopykiki/optimize-nextjs-performance-with-smart-code-splitting-what-to-load-when-and-why-9l1)

#### Anti-Pattern 3: Client Component Cascade

```typescript
// DON'T DO THIS
"use client";
export default function Page() {
  return (
    <>
      <ServerSafeComponent />  // Now in client bundle unnecessarily
      <InteractiveComponent /> // Actually needs "use client"
    </>
  );
}
```

**Why bad:**
- Increases bundle unnecessarily
- Loses Server Component benefits (zero JS, streaming)

**Correct:** Push "use client" down to leaf components

**Source:** [Next.js Server Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)

---

### Verification Protocol

#### Bundle Size Checks

```bash
# Baseline before each phase
pnpm analyze:browser > .planning/baseline-phase-X.txt

# After implementation
pnpm analyze:browser > .planning/results-phase-X.txt

# Compare
diff .planning/baseline-phase-X.txt .planning/results-phase-X.txt
```

#### Performance Checks

```bash
# Lighthouse CI (all routes)
pnpm lighthouse:ci

# Target metrics:
# - LCP < 2.5s
# - FCP < 1.5s
# - TBT < 200ms
```

#### E2E Verification

```bash
pnpm test:e2e -- auth      # Login flow
pnpm test:e2e -- menu      # Browse + add to cart
pnpm test:e2e -- checkout  # Address autocomplete (maps eager)
pnpm test:e2e -- tracking  # Map loads (dynamic import)
pnpm test:e2e -- admin     # Charts load (dynamic import)
```

---

### Integration with Existing Optimizations

| Optimization | Config | Impact | Keep/Change |
|--------------|--------|--------|-------------|
| optimizePackageImports | next.config.ts | Framer Motion 150KB → 40KB | KEEP |
| modularizeImports | next.config.ts | Lucide icons tree-shaken | KEEP |
| Image optimization | next.config.ts | AVIF/WebP, lazy load | KEEP |
| Font optimization | layout.tsx | Preload Inter, Playfair | KEEP |
| Service Worker | Serwist | Pre-cache route bundles | COMPLEMENTARY |
| React Query | query-provider.tsx | 5min staleTime | COMPLEMENTARY |
| Zustand | Cart store | localStorage persist | MOVE TO ROUTE LAYOUT |

**No conflicts identified.** Code splitting creates smaller chunks → faster Service Worker updates.

---

### Scalability Projections

| Metric | Current | After Phases 1-4 | At 10x Traffic | Notes |
|--------|---------|------------------|----------------|-------|
| Initial JS (public) | ~800KB | ~200KB | ~200KB | No refactor needed |
| Initial JS (admin) | ~900KB | ~250KB | ~250KB | Charts lazy-loaded |
| LCP (menu page) | ~3.2s | <2.5s | <2.5s | CDN caching helps |
| Bundle count | ~15 chunks | ~25 chunks | ~25 chunks | Route-based isolation |

**Future considerations:**
- Menu items 100+ → Virtual scrolling (react-window)
- Feature set 2x → Continue Server Component pattern
- Video/PDF features → Dynamic import media libraries

---

## v1.4: Mobile Optimization & Homepage Architecture (2026-01-30)

[Previous content preserved...]

---

## v1.3: Theme Audit & Hero Redesign Architecture

[Previous content preserved...]

---

## v1.2: Three.js/React Three Fiber Integration

[Previous content preserved...]

---

## v1.1: Portal-First Overlay System

[Previous content preserved...]

---

## Sources

**Code Splitting & Bundle Optimization (v1.5):**
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js optimizePackageImports](https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports)
- [Next.js Package Bundling](https://nextjs.org/docs/app/guides/package-bundling)
- [Vercel Package Optimization](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js)
- [Mastering Code Splitting App Router](https://dev.to/ahr_dev/mastering-code-splitting-in-nextjs-app-router-2608)
- [Smart Code Splitting 2026](https://dev.to/boopykiki/optimize-nextjs-performance-with-smart-code-splitting-what-to-load-when-and-why-9l1)
- [Server vs Client Components](https://dev.to/oskarinmix/server-components-vs-client-components-in-nextjs-differences-pros-and-cons-389f)
- [GSAP Next.js Best Practices](https://medium.com/@thomasaugot/optimizing-gsap-animations-in-next-js-15-best-practices-for-initialization-and-cleanup-2ebaba7d0232)
- [GSAP ScrollTrigger Next.js](https://gsap.com/community/forums/topic/40128-using-scrolltriggers-in-nextjs-with-usegsap/)
- [Recharts in Next.js](https://app-generator.dev/docs/technologies/nextjs/integrate-recharts.html)
- [Bundle Optimization Techniques 2025](https://medium.com/better-dev-nextjs-react/the-10kb-next-js-app-extreme-bundle-optimization-techniques-d8047c482aea)

**Mobile Optimization (v1.4):**
- Codebase examination (HIGH confidence)
- next.config.ts configuration
- motion-tokens.ts animation system

**Theme & Hero (v1.3):**
- Framer Motion Parallax patterns
- Create 3D Animations with Framer Motion

**Three.js Integration (v1.2):**
- React Three Fiber documentation
- Drei components
- GSAP/R3F integration patterns

**Overlay Architecture (v1.1):**
- Josh Comeau - Stacking Contexts
- MDN - Stacking Context
- Radix UI - Portal Primitives

**Existing Codebase (verified):**
- src/styles/tokens.css
- src/lib/motion-tokens.ts
- src/lib/gsap/index.ts
- src/components/ui/overlay-base.tsx
- src/components/homepage/Hero.tsx
- src/app/providers.tsx
- next.config.ts
