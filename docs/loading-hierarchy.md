# Loading State Hierarchy

## Tiers

| Tier               | Component                             | Duration                  | Trigger                              | What User Sees                           |
| ------------------ | ------------------------------------- | ------------------------- | ------------------------------------ | ---------------------------------------- |
| 1. Skeleton        | Content-shaped shimmer bones          | 0-15s (10 shimmer cycles) | Page load via loading.tsx / Suspense | Layout-accurate placeholders             |
| 2. Timeout message | Skeleton + "Taking longer..." + Retry | 15s+                      | LoadingWithTimeout timeoutMs=15000   | Skeleton persists, message appears below |
| 3. Page reload     | Full page reload via Retry button     | User-triggered            | Click "Retry" button                 | Browser reload                           |

## Usage Pattern

Wrap page-level skeletons with `LoadingWithTimeout` in `loading.tsx`:

```tsx
import { LoadingWithTimeout } from "@/components/ui/LoadingWithTimeout";
import { PageSkeleton } from "@/components/ui/feature/PageSkeleton";

export default function Loading() {
  return <LoadingWithTimeout skeleton={<PageSkeleton />} timeoutMs={15000} />;
}
```

## Animation Limits

- **Skeleton shimmer:** 1.5s per cycle x 10 cycles = 15s total (skeleton/base.tsx)
- **BrandedSpinner:** 1.5s per cycle x 20 cycles = 30s total (branded-spinner.tsx)
- After animation cycles exhaust, element renders as static fill

## When to Use What

| Context                   | Component                                    | Example                    |
| ------------------------- | -------------------------------------------- | -------------------------- |
| Page load (RSC streaming) | Skeleton in loading.tsx + LoadingWithTimeout | Orders list, account page  |
| Client data fetch         | SkeletonCrossfade wrapping query             | Admin tables, driver lists |
| Button/form action        | BrandedSpinner or inline spinner             | Submit, save, delete       |
| Infinite scroll           | Skeleton rows at list bottom                 | Paginated lists            |

## File Locations

- Base skeleton: `src/components/ui/skeleton/base.tsx`
- Loading timeout: `src/components/ui/LoadingWithTimeout.tsx`
- Skeleton crossfade: `src/components/ui/SkeletonCrossfade.tsx`
- Branded spinner: `src/components/ui/branded-spinner.tsx`
