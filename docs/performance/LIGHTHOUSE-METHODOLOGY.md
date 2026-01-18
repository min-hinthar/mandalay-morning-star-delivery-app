# Lighthouse Audit Methodology

## Overview

This document outlines the process for measuring and improving Core Web Vitals.

## Target Metrics

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP (Largest Contentful Paint) | < 2.5s | 2.5s - 4s | > 4s |
| FID (First Input Delay) | < 100ms | 100ms - 300ms | > 300ms |
| INP (Interaction to Next Paint) | < 200ms | 200ms - 500ms | > 500ms |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.1 - 0.25 | > 0.25 |

## Running Lighthouse Audits

### Local Development

```bash
# 1. Build production version
pnpm build

# 2. Start production server
pnpm start

# 3. Open Chrome DevTools > Lighthouse tab
# 4. Select "Performance" category
# 5. Choose "Mobile" for primary metrics
# 6. Run audit
```

### CLI Audit

```bash
# Install Lighthouse globally
npm install -g lighthouse

# Run audit against production build
pnpm build && pnpm start &
lighthouse http://localhost:3000 --output=html --output-path=./lighthouse-report.html
```

### PageSpeed Insights (Production)

1. Visit https://pagespeed.web.dev/
2. Enter production URL
3. Run analysis for both Mobile and Desktop
4. Export results for comparison

## Bundle Analysis

```bash
# Generate bundle analysis report
pnpm analyze

# Opens interactive treemap showing:
# - Chunk sizes
# - Module composition
# - Opportunities for code splitting
```

## Key Optimizations Implemented

### 1. Font Loading

```typescript
// next/font/google with swap display
const inter = Inter({
  display: "swap",     // Show fallback immediately
  preload: true,       // Preload in head
  subsets: ["latin"],  // Only required subsets
});
```

### 2. Image Optimization

```tsx
// Priority loading for LCP images
<Image
  src="/hero.jpg"
  priority          // Preload, no lazy loading
  sizes="100vw"     // Proper responsive hints
  quality={85}      // Balance quality/size
/>

// Lazy loading for below-fold
<Image
  src="/item.jpg"
  loading="lazy"
  sizes="(max-width: 640px) 50vw, 25vw"
/>
```

### 3. Preconnect Hints

```html
<!-- In layout.tsx head -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preconnect" href="https://your-supabase-url.supabase.co" />
```

### 4. Package Import Optimization

```typescript
// next.config.ts
experimental: {
  optimizePackageImports: [
    "lucide-react",      // Tree-shake unused icons
    "framer-motion",     // Only import used exports
    "@radix-ui/react-*", // Radix components
  ],
}
```

### 5. Static Asset Caching

```typescript
// Long-term cache for immutable assets
headers: [
  {
    source: "/fonts/:path*",
    headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
  },
]
```

## Monitoring in Production

### Web Vitals Tracking

Web vitals are automatically tracked via `src/lib/web-vitals.ts`:

- Metrics logged to console in development
- Reported to Sentry in production
- Can be sent to custom analytics endpoint

### Sentry Performance

1. Navigate to Sentry dashboard
2. Go to Performance > Web Vitals
3. View LCP, FID, CLS trends over time
4. Set alerts for regression thresholds

## Before/After Template

```markdown
## Audit Date: YYYY-MM-DD

### Homepage (Mobile)

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Performance Score | XX | XX | +XX |
| LCP | X.Xs | X.Xs | -X.Xs |
| FID | XXms | XXms | -XXms |
| CLS | X.XX | X.XX | -X.XX |
| FCP | X.Xs | X.Xs | -X.Xs |
| TTFB | XXms | XXms | -XXms |

### Changes Made
- [ ] Change 1
- [ ] Change 2

### Screenshots
[Before] [After]
```

## Common Issues & Solutions

### High LCP

1. Check largest element (usually hero image or heading)
2. Add `priority` to above-fold images
3. Preload critical fonts
4. Reduce server response time (TTFB)

### High CLS

1. Set explicit width/height on images
2. Reserve space for dynamic content (skeletons)
3. Avoid inserting content above existing content
4. Use `aspect-ratio` CSS for responsive images

### High FID/INP

1. Reduce JavaScript bundle size
2. Break up long tasks (< 50ms ideal)
3. Use `React.lazy()` for route components
4. Defer non-critical scripts

## Resources

- [web.dev/vitals](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Lighthouse Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring)
