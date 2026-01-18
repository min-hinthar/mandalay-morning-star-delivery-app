# Bundle Size Analysis

## Overview

This document tracks bundle size analysis and optimization efforts.

## Running Bundle Analysis

```bash
# Generate interactive treemap
pnpm analyze

# Analyze server bundles only
pnpm analyze:server

# Analyze browser bundles only
pnpm analyze:browser
```

This opens an interactive visualization showing:
- Chunk sizes (parsed and gzipped)
- Module composition
- Opportunities for code splitting
- Duplicate dependencies

## Target Bundle Sizes

| Bundle | Target | Current |
|--------|--------|---------|
| First Load JS | < 100KB | TBD |
| Main Chunk | < 50KB | TBD |
| Shared Chunks | < 30KB each | TBD |
| Page-specific JS | < 20KB | TBD |

## Key Dependencies Size Impact

| Package | Approx Size | Notes |
|---------|-------------|-------|
| framer-motion | ~45KB gzip | Animation library |
| recharts | ~40KB gzip | Charts (admin only) |
| @react-google-maps/api | ~25KB gzip | Maps (tracking only) |
| @supabase/supabase-js | ~15KB gzip | Database client |
| lucide-react | Tree-shakeable | Icons |
| date-fns | Tree-shakeable | Date utils |

## Optimization Strategies

### 1. Tree Shaking (Configured)

```typescript
// next.config.ts
experimental: {
  optimizePackageImports: [
    "lucide-react",
    "framer-motion",
    "@radix-ui/react-dialog",
    // ... more packages
  ],
}
```

### 2. Dynamic Imports (Recommended)

```typescript
// Heavy components should be lazy loaded
import dynamic from 'next/dynamic';

// Charts - admin only
const RevenueChart = dynamic(
  () => import('@/components/admin/RevenueChart'),
  { ssr: false }
);

// Maps - tracking only
const DeliveryMap = dynamic(
  () => import('@/components/tracking/DeliveryMap'),
  { ssr: false }
);
```

### 3. Route-based Code Splitting

Next.js automatically code-splits by route. Ensure:
- Admin pages don't import customer components
- Driver pages don't import admin components
- Public pages are minimal

### 4. Conditional Imports

```typescript
// Load analytics only in production
if (process.env.NODE_ENV === 'production') {
  import('./analytics').then(module => module.init());
}
```

## Analysis Checklist

After running `pnpm analyze`:

- [ ] Identify largest chunks (> 50KB gzip)
- [ ] Look for duplicate dependencies
- [ ] Check for accidentally bundled dev dependencies
- [ ] Verify route-based splitting is working
- [ ] Identify code that could be lazy loaded

## Common Issues

### Large First Load

**Symptoms**: First Load JS > 100KB
**Solutions**:
- Move heavy libraries to dynamic imports
- Check for accidental server code in client bundles
- Verify tree shaking is working

### Duplicate Dependencies

**Symptoms**: Same library appears multiple times in bundle
**Solutions**:
- Check for mismatched versions in package.json
- Use pnpm's built-in deduplication
- Add to webpack optimization.splitChunks

### Unintended Bundling

**Symptoms**: Admin/driver code in customer bundles
**Solutions**:
- Use proper route grouping `(admin)`, `(driver)`, `(customer)`
- Check imports are not crossing boundaries
- Use dynamic imports for cross-boundary components

## History

### 2026-01-18: Initial Analysis

**Setup completed**:
- Installed @next/bundle-analyzer
- Added analyze scripts to package.json
- Configured optimizePackageImports in next.config.ts
- Added image optimization config
- Set up long-term caching headers

**Next steps**:
- Run full analysis after build
- Document baseline metrics
- Identify top optimization opportunities
