# Time to Interactive (TTI) Optimization

## Overview

TTI measures when a page becomes fully interactive. Optimizing TTI involves:
- Reducing main thread blocking
- Deferring non-critical JavaScript
- Code splitting by route

## Target

- Long tasks: < 50ms each
- TTI: < 3.8s on mobile 3G

## Implementation

### 1. Dynamic Imports (`src/lib/dynamic-imports.ts`)

Heavy components are lazy-loaded:

```typescript
// Admin charts (recharts ~40KB)
export const DynamicRevenueChart = dynamic(
  () => import("@/components/admin/analytics/RevenueChart"),
  { ssr: false }
);

// Google Maps (~25KB)
export const DynamicDeliveryMap = dynamic(
  () => import("@/components/tracking/DeliveryMap"),
  { ssr: false }
);

// Heavy modals
export const DynamicItemDetailModal = dynamic(
  () => import("@/components/menu/item-detail-modal"),
  { ssr: false }
);
```

### 2. Route-Based Code Splitting

Next.js automatically splits by route. Structure:
```
src/app/
  (public)/        # Minimal JS - menu browsing
  (customer)/      # Cart, checkout, orders
  (admin)/         # Charts, tables - heavy
  (driver)/        # Maps, tracking - separate bundle
```

### 3. Prefetch on Interaction

```typescript
import { prefetch } from "@/lib/dynamic-imports";

// On menu item hover, prefetch modal
<MenuItemCard
  onMouseEnter={() => prefetch.itemDetailModal()}
/>

// On cart button hover, prefetch drawer
<CartButton
  onMouseEnter={() => prefetch.cartDrawer()}
/>
```

### 4. Package Import Optimization

```typescript
// next.config.ts
experimental: {
  optimizePackageImports: [
    "lucide-react",      // Only used icons
    "framer-motion",     // Only used exports
    "@radix-ui/react-*", // Per-component
  ],
}
```

### 5. Defer Non-Critical Scripts

```typescript
// Analytics loaded after hydration
useEffect(() => {
  if (process.env.NODE_ENV === 'production') {
    import('./analytics').then(m => m.init());
  }
}, []);
```

## Measuring TTI

### Chrome DevTools

1. Open Performance tab
2. Record page load
3. Look for "Long Tasks" (red bars > 50ms)
4. Check "Time to Interactive" in summary

### Lighthouse

TTI is measured as part of the performance audit:
- Good: < 3.8s
- Needs Improvement: 3.8s - 7.3s
- Poor: > 7.3s

## Common Long Tasks

| Task | Typical Duration | Solution |
|------|------------------|----------|
| React hydration | 50-200ms | Server components, streaming |
| Chart rendering | 100-300ms | Dynamic import, SSR: false |
| Map initialization | 200-500ms | Dynamic import, intersection observer |
| Large list render | 50-150ms | Virtualization |

## Verification Checklist

- [ ] No long tasks > 50ms on initial load
- [ ] Charts lazy-loaded (admin only)
- [ ] Maps lazy-loaded (tracking only)
- [ ] Modals lazy-loaded (on interaction)
- [ ] Analytics deferred
- [ ] Route bundles isolated
