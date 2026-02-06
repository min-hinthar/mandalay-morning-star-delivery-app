# Phase 42: Dynamic Import Heavy Libraries - Research

**Researched:** 2026-02-06
**Domain:** Next.js code-splitting, dynamic imports, Recharts, Google Maps, skeleton states
**Confidence:** HIGH

## Summary

The codebase already has a partial dynamic import system for Recharts charts via `LazyCharts.tsx` using `next/dynamic` with `ssr: false`. However, the `RevenueChart` on the admin dashboard (`/admin`) is NOT lazy-loaded -- it imports Recharts directly. Google Maps (`@react-google-maps/api` v2.20.8) has zero dynamic imports -- all 4 consumer components eagerly load it. The homepage already uses `React.lazy()` for `HowItWorksSection` (which contains `CoverageRouteMap`) to defer the Maps bundle.

The codebase has rich existing patterns for skeletons (`Skeleton` component with shimmer/pulse/wave/grain variants), error boundaries (`RouteError` component with Sentry integration), framer-motion animations (`motion-tokens.ts` with `variants.fadeIn`, stagger utilities), and IntersectionObserver usage (scroll spy, carousel visibility). These provide strong conventions to follow.

**Primary recommendation:** Extend the existing `LazyCharts.tsx` pattern to cover `RevenueChart`, wrap all 3 map components in `next/dynamic`, create a shared `useViewportTrigger` hook for IntersectionObserver-based loading, build chart/map skeleton components matching the existing `Skeleton` system, and add a `DynamicImportErrorBoundary` wrapping pattern with retry logic and Sentry logging.

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| `next/dynamic` | 16.1.2 | Dynamic import with SSR control | Already used in LazyCharts.tsx |
| `recharts` | 3.6.0 | Chart rendering | Already used, 5 chart files |
| `@react-google-maps/api` | 2.20.8 | Google Maps React wrapper | Already used, 4 files |
| `framer-motion` | 12.26.1 | Animations (fade-in, stagger) | Already used extensively |
| `@sentry/nextjs` | 10.34.0 | Error logging | Already used in RouteError |

### Supporting (already in project)
| Library | Version | Purpose | Used For |
|---------|---------|---------|----------|
| `lucide-react` | 0.562.0 | Icons (MapPin, RefreshCw, AlertTriangle) | Skeleton/error UI |
| `tailwindcss` | 4.x | Styling (animate-pulse, animate-shimmer) | Skeleton animations |

### No New Dependencies Needed
This phase requires NO new npm packages. Everything builds on existing libraries.

## Architecture Patterns

### Current Recharts Import Map

| File | Recharts Components Used | Lazy Status | Consumed By |
|------|-------------------------|-------------|-------------|
| `src/components/ui/admin/RevenueChart.tsx` | LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer | **NOT LAZY** | `/admin` dashboard page (server component direct import) |
| `src/components/ui/admin/analytics/PerformanceChart.tsx` | LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer | Lazy via LazyCharts.tsx | DriverAnalyticsDashboard |
| `src/components/ui/admin/analytics/ExceptionBreakdown.tsx` | PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend | Lazy via LazyCharts.tsx | DeliveryMetricsDashboard |
| `src/components/ui/admin/analytics/PeakHoursChart.tsx` | BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell | Lazy via LazyCharts.tsx | DeliveryMetricsDashboard |
| `src/components/ui/admin/analytics/DeliverySuccessChart.tsx` | AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend | Lazy via LazyCharts.tsx | DeliveryMetricsDashboard |

**Critical finding:** `RevenueChart` is imported directly in `src/app/(admin)/admin/page.tsx` (a server component) without any lazy loading. This is the primary Recharts bundle leak into the admin dashboard initial load.

### Current Google Maps Import Map

| File | Components Used | Consumed By | Eager/Viewport |
|------|----------------|-------------|----------------|
| `src/components/ui/orders/tracking/DeliveryMap.tsx` | GoogleMap, useJsApiLoader, Polyline, Marker | TrackingPageClient (`/orders/[id]/tracking`) | Should be **EAGER** (tracking page) |
| `src/components/ui/admin/routes/RouteMap.tsx` | GoogleMap, useJsApiLoader, Polyline, Marker | RouteDetailClient (`/admin/routes/[id]`) | Should be **VIEWPORT** |
| `src/components/ui/coverage/CoverageRouteMap.tsx` | GoogleMap, useJsApiLoader, Polyline, Circle, Marker | HowItWorksSection (homepage), AddressInput (checkout) | Homepage: **already lazy** via React.lazy; Checkout: **EAGER** |
| `src/lib/hooks/usePlacesAutocomplete.ts` | useJsApiLoader | AddressInput (checkout), HowItWorksSection (homepage) | **EAGER** on checkout (critical path) |

**Critical finding:** All 4 files share identical LIBRARIES array: `["places", "geometry", "marker"]`. The `useJsApiLoader` hook internally deduplicates -- only one Google Maps script is loaded regardless of how many components call it. This means dynamic importing the component is sufficient; the Maps JS API itself loads lazily via `useJsApiLoader`'s internal script injection.

**Critical finding:** `usePlacesAutocomplete` hooks into `useJsApiLoader` independently. If Places Autocomplete on checkout must stay eager, the Maps JS API will already be loaded when the map component mounts. This is correct behavior.

### Existing Dynamic Import Pattern (LazyCharts.tsx)

```typescript
// Source: src/components/ui/admin/analytics/LazyCharts.tsx (EXISTING)
"use client";
import dynamic from "next/dynamic";

const ChartSkeleton = () => (
  <div className="h-80 w-full animate-pulse rounded-xl bg-charcoal-100" />
);

export const LazyDeliverySuccessChart = dynamic(
  () => import("./DeliverySuccessChart").then((mod) => mod.DeliverySuccessChart),
  { loading: () => <ChartSkeleton />, ssr: false }
);
```

**Pattern:** `next/dynamic` with named export extraction via `.then(mod => mod.ExportName)`, `ssr: false`, and a loading skeleton.

### Existing React.lazy Pattern (Homepage)

```typescript
// Source: src/app/(public)/page.tsx (EXISTING)
import { Suspense, lazy } from "react";

// Lazy load HowItWorksSection to defer 369KB Google Maps bundle
const HowItWorksSection = lazy(() => import("@/components/ui/homepage/HowItWorksSection"));

// Usage with Suspense:
<Suspense fallback={<HowItWorksSkeleton />}>
  <HowItWorksSection id="how-it-works" />
</Suspense>
```

### Existing IntersectionObserver Pattern

```typescript
// Source: src/components/ui/coverage/CoverageRouteMap.tsx (EXISTING)
useEffect(() => {
  const container = containerRef.current;
  if (!container) return;
  const observer = new IntersectionObserver(
    ([entry]) => { setIsVisible(entry.isIntersecting); },
    { threshold: 0.1 }
  );
  observer.observe(container);
  return () => observer.disconnect();
}, []);
```

### Recommended Project Structure Changes

```
src/
  components/ui/
    admin/
      analytics/
        LazyCharts.tsx            # MODIFY: enhance skeletons, add RevenueChart, add error/timeout
        ChartSkeleton.tsx         # NEW: rich chart skeleton with faux shapes
        ChartErrorCard.tsx        # NEW: error card with retry button
      routes/
        RouteMap.tsx              # EXISTING: no change to internals
    coverage/
      CoverageRouteMap.tsx        # EXISTING: no change to internals
    maps/
      LazyMaps.tsx                # NEW: dynamic map wrappers (like LazyCharts)
      MapSkeleton.tsx             # NEW: map skeleton with pin icon
      MapErrorCard.tsx            # NEW: map error card with retry
    orders/tracking/
      DeliveryMap.tsx             # EXISTING: no change to internals
  lib/hooks/
    useViewportTrigger.ts         # NEW: IntersectionObserver hook for lazy loading
    useDynamicImport.ts           # NEW: hook wrapping dynamic import with retry + timeout + Sentry
```

### Pattern 1: Enhanced Dynamic Import with Error/Retry/Timeout

**What:** Wrap `next/dynamic` loading components with timeout detection, retry logic, and Sentry error logging.
**When to use:** Every dynamically imported heavy component.

```typescript
// Pattern for enhanced lazy loading wrapper
"use client";
import { useState, useEffect, useCallback } from "react";
import * as Sentry from "@sentry/nextjs";

interface DynamicImportState {
  status: "loading" | "timeout" | "error" | "loaded";
  retryCount: number;
}

function useDynamicImportStatus(timeoutMs: number = 10000) {
  const [state, setState] = useState<DynamicImportState>({
    status: "loading",
    retryCount: 0,
  });

  useEffect(() => {
    if (state.status !== "loading") return;
    const timer = setTimeout(() => {
      setState(prev => ({ ...prev, status: "timeout" }));
    }, timeoutMs);
    return () => clearTimeout(timer);
  }, [state.status, timeoutMs]);

  const retry = useCallback(() => {
    setState(prev => ({
      status: "loading",
      retryCount: prev.retryCount + 1,
    }));
  }, []);

  return { ...state, retry };
}
```

### Pattern 2: Viewport-Triggered Loading

**What:** Load component only when its container enters the viewport via IntersectionObserver.
**When to use:** Map components on admin pages, homepage maps.

```typescript
// Pattern for viewport-triggered loading
"use client";
import { useState, useEffect, useRef, type ReactNode } from "react";

interface UseViewportTriggerOptions {
  fallbackToEager?: boolean; // true = load immediately if IO not supported
  threshold?: number;
}

function useViewportTrigger(options: UseViewportTriggerOptions = {}) {
  const { fallbackToEager = true, threshold = 0 } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      if (fallbackToEager) setTriggered(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTriggered(true);
          observer.disconnect(); // Once triggered, never unload
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fallbackToEager, threshold]);

  return { ref, triggered };
}
```

### Pattern 3: Staggered Fade-In for Charts

**What:** Charts appear with cascading fade-in using existing framer-motion stagger utilities.
**When to use:** Admin analytics dashboards with multiple charts.

```typescript
// Using existing motion-tokens.ts stagger utilities
import { motion } from "framer-motion";
import { staggerContainer80, staggerItem } from "@/lib/motion-tokens";

// Container wrapping chart area
<motion.div
  variants={staggerContainer80()}
  initial="hidden"
  animate="visible"
>
  {charts.map((chart, i) => (
    <motion.div key={i} variants={staggerItem}>
      {chart}
    </motion.div>
  ))}
</motion.div>
```

### Anti-Patterns to Avoid

- **Re-importing recharts in wrapper:** LazyCharts.tsx must NOT import recharts itself; it only dynamically imports the chart component files which internally import recharts.
- **Multiple useJsApiLoader calls with different libraries arrays:** All must use identical `["places", "geometry", "marker"]` array. Mismatched arrays cause "google maps api loaded multiple times" console errors.
- **Unmounting loaded maps:** Per CONTEXT.md, once loaded, maps stay in memory. Do not conditionally unmount the Google Maps component based on viewport exit.
- **Using React.lazy for client components needing loading prop:** Use `next/dynamic` instead -- it supports the `loading` prop directly without needing an explicit `Suspense` wrapper.
- **Creating new error boundary components from scratch:** Match existing `RouteError` styling patterns (AlertTriangle icon, brand-red accent, RefreshCw retry button).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dynamic imports | Custom `import()` wrappers | `next/dynamic` with `ssr: false` | Next.js handles chunk naming, preloading, and webpack integration |
| Skeleton animations | Custom CSS keyframes | Existing `Skeleton` component (shimmer variant) + `animate-pulse` | Already has motion preference support, grain overlay, theme support |
| Stagger animations | Custom delay timers | `staggerContainer80()` + `staggerItem` from `motion-tokens.ts` | Already calibrated for 80ms gaps, has exit animations |
| Error logging | Custom error reporters | `logger.exception()` from `src/lib/utils/logger.ts` | Already integrates with Sentry tags, user context, breadcrumbs |
| Fade-in transitions | CSS transitions | `variants.fadeIn` from `motion-tokens.ts` | Already has enter/exit with proper durations |
| Google Maps script loading | Manual script injection | `useJsApiLoader` from `@react-google-maps/api` | Handles deduplication, callback management, error states |
| Viewport detection | Custom scroll listeners | `IntersectionObserver` (existing pattern in codebase) | Already used in 5 components, known-good pattern |

## Common Pitfalls

### Pitfall 1: RevenueChart Server Component Import Chain
**What goes wrong:** `RevenueChart` is imported directly in `src/app/(admin)/admin/page.tsx` which is a **server component**. You cannot use `next/dynamic` with `ssr: false` in a server component.
**Why it happens:** Server components don't support `"use client"` dynamic imports directly.
**How to avoid:** Create a client component wrapper (`LazyRevenueChart`) that uses `next/dynamic`, then import that wrapper in the server component page. OR convert the chart section of the admin page into a client component.
**Warning signs:** Build error: "ssr: false is not allowed with Server Components."

### Pitfall 2: Google Maps Loader Conflict
**What goes wrong:** `useJsApiLoader` throws "Google Maps JavaScript API has been loaded directly without @react-google-maps/api" or "You have included the Google Maps JavaScript API multiple times."
**Why it happens:** Multiple components calling `useJsApiLoader` with different `libraries` arrays, or Google Maps script loaded via both `useJsApiLoader` and a manual `<script>` tag.
**How to avoid:** Ensure ALL components use identical LIBRARIES array `["places", "geometry", "marker"]`. The existing codebase already does this correctly -- do not change it.
**Warning signs:** Console warning about multiple API loads.

### Pitfall 3: Skeleton Height Mismatch Causing Layout Shift
**What goes wrong:** Skeleton placeholder is different height than the loaded component, causing CLS (Cumulative Layout Shift).
**Why it happens:** Chart/map heights vary; skeleton uses fixed height that doesn't match.
**How to avoid:** Use the same height values as the real components. RevenueChart: h-[300px]. PerformanceChart: default h-[300px]. PeakHoursChart: h-[250px]. ExceptionBreakdown: h-[250px]. Maps: min-h-[300px] inline, full height in containers.
**Warning signs:** Visual "jump" when skeleton is replaced by loaded component.

### Pitfall 4: Dynamic Import Breaking Module Caching
**What goes wrong:** Recharts modules re-download on every page navigation instead of being cached after first load.
**Why it happens:** Using unique chunk names or different import paths for the same module.
**How to avoid:** All Recharts dynamic imports should go through the same entry point files. `next/dynamic` handles webpack chunk caching automatically -- the same chunk URL is reused after first load. Browser caching handles the rest.
**Warning signs:** Network tab shows repeated chunk downloads on page navigation.

### Pitfall 5: Timeout Logic Racing with Component Mount
**What goes wrong:** Timeout fires after component has already loaded, showing "taking longer" message briefly.
**Why it happens:** Timeout timer not cancelled when component loads successfully.
**How to avoid:** Clear timeout timer in the loading component's effect cleanup. Track mount state with a ref.
**Warning signs:** Brief flash of timeout message even on fast loads.

### Pitfall 6: Retry Without Exponential Backoff Hammering Server
**What goes wrong:** Rapid retries overload CDN or network when chunk fails to load.
**Why it happens:** Immediate retry without delay.
**How to avoid:** Implement exponential backoff: 1s, 2s, 4s delays. After 3 retries, show permanent error with "Please refresh the page." per CONTEXT.md.
**Warning signs:** Multiple rapid 404/network errors in Sentry for the same chunk.

## Code Examples

### Example 1: Enhanced LazyCharts.tsx with Rich Skeletons

```typescript
// Pattern for chart skeleton with faux shapes
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface ChartSkeletonProps {
  label: string;
  height?: number;
  className?: string;
}

export function ChartSkeleton({ label, height = 320, className }: ChartSkeletonProps) {
  return (
    <div
      className={cn("rounded-xl bg-surface-primary p-6 shadow-sm", className)}
      role="status"
      aria-label={label}
    >
      {/* Faux chart bars */}
      <div className="flex items-end gap-2 h-[calc(100%-3rem)]" style={{ height: height - 48 }}>
        {[40, 65, 50, 80, 55, 70, 45, 75, 60, 85, 50, 70].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-surface-tertiary animate-pulse"
            style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
      {/* Label */}
      <p className="mt-3 text-xs text-text-muted text-center">{label}</p>
    </div>
  );
}
```

### Example 2: Map Skeleton with Pin Icon

```typescript
// Pattern for map skeleton
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface MapSkeletonProps {
  addressText?: string;
  className?: string;
  height?: number;
}

export function MapSkeleton({ addressText, className, height = 300 }: MapSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-surface-muted animate-pulse relative",
        className
      )}
      style={{ minHeight: height }}
      role="status"
      aria-label="Loading map"
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <MapPin className="h-8 w-8 text-text-muted" />
        <span className="text-sm text-text-muted">Loading map...</span>
      </div>
      {addressText && (
        <p className="absolute bottom-3 left-3 right-3 text-xs text-text-muted text-center">
          {addressText}
        </p>
      )}
    </div>
  );
}
```

### Example 3: Error Card with Retry (matching RouteError pattern)

```typescript
// Pattern matching RouteError styling
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface ImportErrorCardProps {
  message: string;
  onRetry?: () => void;
  isFinal?: boolean;
}

export function ImportErrorCard({ message, onRetry, isFinal }: ImportErrorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-xl bg-surface-primary p-6 shadow-sm"
      style={{ minHeight: 200 }}
    >
      <div className="mx-auto w-12 h-12 rounded-full bg-brand-red/10 flex items-center justify-center mb-4">
        <AlertTriangle className="h-6 w-6 text-brand-red" />
      </div>
      <p className="text-sm text-text-secondary mb-4 text-center">{message}</p>
      {onRetry && !isFinal && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
      {isFinal && (
        <p className="text-xs text-text-muted">Unable to load. Please refresh the page.</p>
      )}
    </motion.div>
  );
}
```

### Example 4: Viewport-Triggered Map Loading

```typescript
// Usage pattern for viewport-triggered map
"use client";
import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MapSkeleton } from "./MapSkeleton";

const LazyRouteMap = dynamic(
  () => import("@/components/ui/admin/routes/RouteMap").then(mod => mod.RouteMap),
  { ssr: false, loading: () => <MapSkeleton /> }
);

export function ViewportRouteMap(props: RouteMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setTriggered(true); // Fallback to eager
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTriggered(true);
          observer.disconnect();
        }
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {triggered ? <LazyRouteMap {...props} /> : <MapSkeleton />}
    </div>
  );
}
```

### Example 5: Sentry Error Logging for Dynamic Import Failures

```typescript
// Pattern for logging import failures
import { logger } from "@/lib/utils/logger";

async function importWithRetry(
  importFn: () => Promise<unknown>,
  componentName: string,
  maxRetries: number = 3
) {
  const delays = [1000, 2000, 4000]; // Exponential backoff
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await importFn();
    } catch (error) {
      logger.exception(error, {
        flowId: "dynamic-import",
        api: componentName,
      });
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, delays[attempt]));
      } else {
        throw error; // Final failure
      }
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `React.lazy` + `Suspense` | `next/dynamic` with `ssr: false` | Next.js 13+ (App Router) | `next/dynamic` integrates with Next.js chunk optimization, prefetching, and provides `loading` prop |
| Manual `import()` with state | `next/dynamic` | Next.js 13+ | Automatic code-splitting, webpack chunk naming, preload hints |
| Manual skeleton divs | Framer Motion `Skeleton` component | Already in codebase | Shimmer/pulse/wave variants, reduced-motion support, grain texture |

**Note:** The codebase uses BOTH patterns -- `React.lazy` on the homepage (server component) and `next/dynamic` in LazyCharts.tsx (client component). For this phase, use `next/dynamic` for all new lazy wrappers since they'll be in client components.

## Specific File Change Map

### Files to MODIFY
| File | Change |
|------|--------|
| `src/components/ui/admin/analytics/LazyCharts.tsx` | Replace basic pulse skeletons with rich ChartSkeleton, add error/timeout handling |
| `src/app/(admin)/admin/page.tsx` | Replace direct `RevenueChart` import with lazy variant |
| `src/components/ui/admin/index.ts` | Export LazyRevenueChart |

### Files to CREATE
| File | Purpose |
|------|---------|
| `src/components/ui/admin/analytics/ChartSkeleton.tsx` | Faux chart shapes skeleton with labels, aria, pulse |
| `src/components/ui/admin/analytics/ChartErrorCard.tsx` | Error card with retry for chart failures |
| `src/components/ui/maps/LazyMaps.tsx` | Dynamic map wrappers (LazyRouteMap, LazyDeliveryMap, LazyCoverageRouteMap) |
| `src/components/ui/maps/MapSkeleton.tsx` | Map skeleton with pin icon, address text |
| `src/components/ui/maps/MapErrorCard.tsx` | Map error card with retry |
| `src/lib/hooks/useViewportTrigger.ts` | IntersectionObserver hook for viewport-based loading |
| `src/lib/hooks/useDynamicImportWithRetry.ts` | Retry + timeout + Sentry wrapper for dynamic imports |

### Files with IMPORT CHANGES ONLY
| File | From | To |
|------|------|----|
| `src/components/ui/admin/routes/RouteDetailClient.tsx` | `import { RouteMap } from "./RouteMap"` | Import LazyRouteMap with viewport trigger |
| `src/components/ui/orders/tracking/TrackingPageClient.tsx` | `import { DeliveryMap } from "./DeliveryMap"` | Import LazyDeliveryMap (EAGER, no viewport trigger) |
| `src/components/ui/checkout/AddressInput.tsx` | `import { CoverageRouteMap }` | EAGER import -- keep as-is since checkout loads Maps for Places anyway |
| `src/components/ui/homepage/HowItWorksSection.tsx` | `import { CoverageRouteMap }` | Already deferred via React.lazy on page level -- consider also wrapping with viewport trigger |

### Files to NOT CHANGE
| File | Reason |
|------|--------|
| `src/lib/hooks/usePlacesAutocomplete.ts` | Must stay eager -- checkout critical path |
| All chart component internals (PerformanceChart, etc.) | No changes to chart rendering logic |
| All map component internals (DeliveryMap, RouteMap, etc.) | No changes to map rendering logic |

## Component Heights Reference (for skeleton sizing)

| Component | Height | Container Notes |
|-----------|--------|-----------------|
| RevenueChart | 300px (ResponsiveContainer) | In card with p-6 |
| PerformanceChart | 300px default (configurable) | In motion.div with p-6 |
| PeakHoursChart | 250px default | In motion.div with p-6 + legend footer |
| ExceptionBreakdown | 250px default | In motion.div with p-6 + header |
| DeliverySuccessChart | 300px default | In motion.div with p-6 + header |
| ETAAccuracyGauge | SVG 200x120 | In motion.div with p-6 |
| DeliveryMap | min-h-[300px] | Rounded-xl, shadow-md |
| RouteMap | h-full (parent controls) | Rounded-card-sm |
| CoverageRouteMap | min-h-[200px] | Rounded-2xl, ring-1 |

## Page-by-Page Loading Strategy

| Page | Charts | Maps | Loading Strategy |
|------|--------|------|-----------------|
| `/admin` | RevenueChart | None | Lazy chart, KPI cards render first |
| `/admin/analytics/delivery` | 5 charts (already lazy) | None | Already lazy, enhance skeletons |
| `/admin/analytics/drivers` | PerformanceChart (already lazy) | None | Already lazy, enhance skeleton |
| `/admin/routes/[id]` | None | RouteMap | Viewport-triggered map |
| `/orders/[id]/tracking` | None | DeliveryMap | **EAGER** map (primary content) |
| `/` (homepage) | None | CoverageRouteMap | Already React.lazy'd at section level |
| `/checkout` | None | CoverageRouteMap | **EAGER** map (alongside Places) |

## Open Questions

1. **Timeout threshold for maps**
   - What we know: Charts = 10 seconds per CONTEXT.md. Maps need longer for mobile.
   - Recommendation: 15 seconds for maps (1.5x chart timeout). Mobile networks commonly have 3-5s latency spikes.

2. **`next.config.ts` `optimizePackageImports` interaction**
   - What we know: Both `recharts` and `@react-google-maps/api` are in `optimizePackageImports`. This performs tree-shaking optimization.
   - What's unclear: Whether `optimizePackageImports` interferes with `next/dynamic` code-splitting.
   - Recommendation: Test build output with `pnpm analyze` to verify chunks are actually split. `optimizePackageImports` should be complementary (better tree-shaking within the split chunk).

3. **Exact bundle size savings**
   - What we know: Phase description says ~300KB (Recharts 180KB + Maps 120KB).
   - Recommendation: Run `pnpm analyze` before and after to measure actual savings. The 5 analytics chart files are already lazy -- the main savings come from RevenueChart and the map components.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: All source files read directly
- `src/components/ui/admin/analytics/LazyCharts.tsx` - existing dynamic import pattern
- `src/components/ui/skeleton.tsx` - existing skeleton system (shimmer/pulse/wave/grain)
- `src/components/ui/RouteError.tsx` - existing error boundary pattern
- `src/lib/motion-tokens.ts` - existing animation system (fadeIn, stagger, spring)
- `src/lib/utils/logger.ts` - existing Sentry logging utility
- `next.config.ts` - existing bundle optimization config

### Secondary (MEDIUM confidence)
- Next.js 16 `next/dynamic` API - based on training knowledge + codebase usage confirmation
- `@react-google-maps/api` `useJsApiLoader` deduplication behavior - confirmed by identical LIBRARIES arrays across 4 files
- IntersectionObserver browser support - well-established, fallback pattern already exists in codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in project, versions confirmed from package.json
- Architecture: HIGH - existing patterns thoroughly analyzed from source code
- Pitfalls: HIGH - identified from real import chains and component relationships in codebase
- Code examples: HIGH - based on actual existing patterns, not hypothetical

**Research date:** 2026-02-06
**Valid until:** 2026-03-06 (stable -- no library upgrades expected)
