# LCP Performance Results

**Measured:** 2026-02-06
**Environment:** Production build (localhost:3000)
**Tool:** Lighthouse 13.0.1 (mobile throttling)
**Runs:** 3 per page (averaged for consistency)

## Summary

| Page | Before | After | Change | Improvement |
|------|--------|-------|--------|-------------|
| Homepage (mobile) | 19.9s | 11.4s | -8.5s | **43%** |
| Menu (mobile) | 18.2s | 9.8s | -8.4s | **46%** |

## Detailed Results

### Homepage

| Run | LCP | Performance Score |
|-----|-----|-------------------|
| 1 | 12.72s | 39 |
| 2 | 9.85s | 40 |
| 3 | 11.69s | 41 |
| **Average** | **11.42s** | **40** |

**Baseline:** 19.9s (Score: 30)
**Improvement:** 8.5s faster (43% reduction)

### Menu Page

| Run | LCP | Performance Score |
|-----|-----|-------------------|
| 1 | 9.48s | 38 |
| 2 | 9.76s | 42 |
| 3 | 10.04s | 42 |
| **Average** | **9.76s** | **41** |

**Baseline:** 18.2s (Score: 35)
**Improvement:** 8.4s faster (46% reduction)

## Additional Metrics Comparison

| Metric | Homepage Before | Homepage After | Menu Before | Menu After |
|--------|-----------------|----------------|-------------|------------|
| LCP | 19.9s | 11.4s | 18.2s | 9.8s |
| FCP | 3.2s | ~3.0s | 1.9s | ~3.2s |
| TBT | 5.5s | ~3.5s | 5.6s | ~2.3s |
| CLS | 0 | 0 | 0 | 0 |
| Score | 30 | 40 | 35 | 41 |

## What Changed

**Optimization applied:** CardImage component converted from raw `<img>` to Next.js `<Image>`

Key changes:
- Priority loading for above-fold images (first 4-6 items)
- Lazy loading for below-fold images
- Automatic format optimization (WebP/AVIF)
- Explicit width/height for layout stability
- fetchPriority="high" for priority images

## Target Assessment

| Target | Status | Notes |
|--------|--------|-------|
| LCP < 2.5s (Core Web Vitals) | NOT MET | Still 9-11s |
| LCP 4-5s (Plan target) | NOT MET | Best: 9.5s |
| Meaningful improvement | **MET** | 43-46% reduction |

## Analysis

The CardImage optimization alone achieved significant improvement (~45% LCP reduction) but did not reach the 4-5s target. This confirms the BASELINE.md finding that:

1. **JS bundle size is the primary bottleneck** - TBT remains high (2-3s), indicating main thread blocking
2. **Resource load delay reduced** - Images now load faster with Next.js optimization
3. **Further optimization needed** - Server Component conversion (Phase 41) and code splitting required

## Next Steps

1. **Phase 41-44:** Server Component conversions to reduce JS bundle
2. **Code splitting:** Lazy load non-critical components
3. **Font optimization:** Already using display:swap (REQ-40.4)

## Raw Data Files

- `lighthouse-homepage-mobile.json` - Baseline
- `lighthouse-homepage-mobile-after.json` - Run 1
- `lighthouse-homepage-mobile-after-2.json` - Run 2
- `lighthouse-homepage-mobile-after-3.json` - Run 3
- `lighthouse-menu-mobile.json` - Baseline
- `lighthouse-menu-mobile-after.json` - Run 1
- `lighthouse-menu-mobile-after-2.json` - Run 2
- `lighthouse-menu-mobile-after-3.json` - Run 3
