# Phase 40: LCP Element Quick Wins - Research

**Researched:** 2026-02-05
**Domain:** Next.js 16 Image Optimization, LCP Performance, Web Font Loading
**Confidence:** HIGH

## Summary

This phase focuses on reducing LCP from 8.1s to 4-5s through targeted optimizations to image loading priority and font rendering. The codebase analysis reveals several issues that directly impact LCP:

1. **CardImage uses raw `<img>` tags** - The primary menu item card images bypass Next.js Image optimization entirely, using plain `<img>` tags without priority hints or lazy loading control
2. **Priority prop is ignored** - CardImage accepts a `priority` prop but doesn't use it (see comment "priority prop kept for API compatibility but always using eager loading")
3. **Hero section has no above-fold images** - The Hero component uses pure CSS gradients with animated emojis and orbs, no LCP-critical images
4. **Font configuration is correct** - Both Inter and Playfair Display already use `display: "swap"` in layout.tsx

**Primary recommendation:** Convert CardImage from raw `<img>` to Next.js Image component with proper `loading="eager"` and `fetchPriority="high"` for above-fold items, and `loading="lazy"` for below-fold items.

## Standard Stack

The established approach for LCP optimization in Next.js 16:

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Next.js Image | 16.x | Image optimization | Built-in, handles formats, sizing, lazy loading |
| Lighthouse | 12.x | LCP identification | Chrome DevTools integration, identifies LCP element |
| @next/bundle-analyzer | 16.1.3 | Bundle size analysis | Official Next.js tooling |

### Props for LCP Images (Next.js 16)
| Prop | Value | Purpose | Notes |
|------|-------|---------|-------|
| `loading` | `"eager"` | Load immediately | Use for LCP/above-fold |
| `fetchPriority` | `"high"` | Browser resource priority | Recommended over deprecated `priority` |
| `loading` | `"lazy"` | Defer loading | Default, use for below-fold |

### Deprecated (Next.js 16)
| Prop | Status | Use Instead |
|------|--------|-------------|
| `priority` | Deprecated | `loading="eager"` + `fetchPriority="high"` |
| `preload` | New but limited | `loading="eager"` for most cases |

## Architecture Patterns

### Pattern 1: LCP Image Identification

**What:** Use Lighthouse to identify the actual LCP element before optimizing
**When to use:** Before any image priority changes
**How:**
1. Run Lighthouse in Chrome DevTools (Lighthouse panel)
2. Look for "Largest Contentful Paint element" diagnostic
3. Hover to highlight the LCP element in the page
4. Note the four LCP subparts breakdown:
   - Time to First Byte (TTFB)
   - Resource load delay
   - Resource load duration
   - Element render delay

### Pattern 2: Above-Fold Image Priority

**What:** Apply priority loading only to images that could be LCP candidates
**When to use:** First 3-6 visible images on page load

```typescript
// Source: Next.js 16 documentation
// For LCP candidate images
<Image
  src={imageUrl}
  alt={alt}
  loading="eager"
  fetchPriority="high"
  width={640}
  height={480}
/>

// For below-fold images (default behavior)
<Image
  src={imageUrl}
  alt={alt}
  loading="lazy"
  width={640}
  height={480}
/>
```

### Pattern 3: Conditional Priority Based on Index

**What:** Apply priority only to first N items in a list
**When to use:** Menu grids, carousels, featured sections

```typescript
// Source: Current codebase pattern (needs conversion to Image)
items.map((item, index) => (
  <Image
    src={item.imageUrl}
    alt={item.name}
    loading={index < 4 ? "eager" : "lazy"}
    fetchPriority={index < 4 ? "high" : undefined}
    width={640}
    height={480}
  />
))
```

### Anti-Patterns to Avoid

- **Using raw `<img>` tags for menu items:** Bypasses Next.js optimization, no lazy loading, no format conversion
- **Marking all images as priority:** Defeats lazy loading, slows initial load
- **Using `priority` prop in Next.js 16:** Deprecated, use `loading="eager"` instead
- **Setting `loading="lazy"` on LCP images:** Delays rendering of most important content

## Don't Hand-Roll

Problems that have built-in solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image format conversion | Custom image pipeline | Next.js Image | Automatic AVIF/WebP conversion |
| Responsive image sizing | srcset generation | Next.js Image sizes prop | Built-in srcset with deviceSizes |
| Lazy loading | IntersectionObserver | `loading="lazy"` | Native browser support |
| Blur placeholder | Custom shimmer | `placeholder="blur"` + `blurDataURL` | Built into Next.js Image |
| LCP identification | Manual timing | Lighthouse audit | Automated, accurate |

**Key insight:** The codebase uses raw `<img>` tags in CardImage specifically to "avoid issues with external URLs" but this sacrifices all Next.js image benefits. The remotePatterns in next.config.ts already allows Supabase and Google Drive images, so Next.js Image should work.

## Common Pitfalls

### Pitfall 1: Not Identifying the Actual LCP Element
**What goes wrong:** Optimizing the wrong image, no LCP improvement
**Why it happens:** Assumptions about which element is LCP
**How to avoid:** Always run Lighthouse first, identify specific LCP element
**Warning signs:** Changes don't improve LCP score

### Pitfall 2: Converting All Images at Once
**What goes wrong:** Breaking changes, different external URL handling
**Why it happens:** Batch refactoring without testing
**How to avoid:** Convert one component at a time, test each
**Warning signs:** 404s, broken images in production

### Pitfall 3: Ignoring Mobile LCP
**What goes wrong:** Desktop LCP improves, mobile doesn't
**Why it happens:** Different images are LCP on different viewports
**How to avoid:** Test Lighthouse with mobile throttling specifically
**Warning signs:** Different LCP elements on mobile vs desktop

### Pitfall 4: Font Blocking Despite swap
**What goes wrong:** Text invisible during font load
**Why it happens:** Font files too large, slow network
**How to avoid:** Verify font subsetting (latin only), preload critical fonts
**Warning signs:** FCP delayed, FOIT visible

## Code Examples

### Current CardImage Pattern (Problematic)
```typescript
// Source: src/components/ui/menu/UnifiedMenuItemCard/CardImage.tsx
// This bypasses Next.js Image optimization
<img
  src={imageUrl}
  alt={alt}
  className="w-full h-full object-cover"
  onError={() => setHasError(true)}
/>
```

### Recommended CardImage Pattern
```typescript
// Recommended: Use Next.js Image with proper loading strategy
import Image from "next/image";

// For above-fold (LCP candidates)
<Image
  src={imageUrl}
  alt={alt}
  fill
  className="object-cover"
  loading="eager"
  fetchPriority="high"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  onError={() => setHasError(true)}
/>

// For below-fold (lazy loaded)
<Image
  src={imageUrl}
  alt={alt}
  fill
  className="object-cover"
  loading="lazy"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  onError={() => setHasError(true)}
/>
```

### Priority Index Pattern
```typescript
// Source: Current MenuGrid.tsx pattern
// Already passes priority, just needs CardImage to use it
<UnifiedMenuItemCard
  item={item}
  priority={index < 4}  // First 4 items get priority
/>

// CardImage should implement:
<Image
  loading={priority ? "eager" : "lazy"}
  fetchPriority={priority ? "high" : undefined}
  // ...
/>
```

### Running Lighthouse for LCP Analysis
```bash
# From project scripts
pnpm lighthouse

# Or in Chrome DevTools:
# 1. Open DevTools (F12)
# 2. Go to Lighthouse panel
# 3. Select "Performance" category
# 4. Check "Mobile" device
# 5. Click "Analyze page load"
# 6. Look for "Largest Contentful Paint element" in diagnostics
```

### Running Bundle Analysis
```bash
# Already configured in package.json
pnpm analyze:browser

# Opens interactive treemap at <distDir>/analyze/client.html
# Look for large dependencies affecting initial load
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `priority={true}` | `loading="eager"` + `fetchPriority="high"` | Next.js 16.0.0 | Clearer API, same effect |
| Raw `<img>` tags | Next.js Image | Always recommended | Auto-optimization |
| `font-display: swap` in CSS | `display: "swap"` in next/font | Next.js 13+ | Automatic injection |

**Current in codebase:**
- Font config: Correct (`display: "swap"` already set)
- Image priority: Prop passed but ignored (uses raw `<img>`)
- Bundle analyzer: Already configured and available

## Open Questions

1. **What is the actual LCP element?**
   - What we know: Likely a menu item image or hero text on homepage
   - What's unclear: Need to run Lighthouse to confirm
   - Recommendation: Run Lighthouse audit as first task

2. **Will converting to Next.js Image break Google Drive URLs?**
   - What we know: remotePatterns includes `drive.google.com` and `lh3.googleusercontent.com`
   - What's unclear: Whether all current image URLs match these patterns
   - Recommendation: Test with sample URLs before full conversion

3. **Should ItemDetailSheet images also use Next.js Image?**
   - What we know: Currently uses raw `<img>` for "reliability"
   - What's unclear: What specific issues prompted this
   - Recommendation: Lower priority, focus on CardImage first

## Sources

### Primary (HIGH confidence)
- [Next.js 16 Image Component Documentation](https://nextjs.org/docs/app/api-reference/components/image) - priority deprecation, loading/fetchPriority props
- Codebase analysis: `src/components/ui/menu/UnifiedMenuItemCard/CardImage.tsx` - current implementation
- Codebase analysis: `src/app/layout.tsx` - font configuration verified

### Secondary (MEDIUM confidence)
- [Chrome DevTools Lighthouse](https://developer.chrome.com/docs/devtools/lighthouse) - LCP element identification
- [DebugBear LCP Analysis](https://www.debugbear.com/docs/lcp-by-phase) - LCP subparts breakdown
- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer) - v16.1.3 documentation

### Tertiary (LOW confidence)
- Web search: LCP optimization patterns 2025-2026 (general best practices)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Next.js 16 official documentation verified
- Architecture: HIGH - Codebase analysis shows exact current state
- Pitfalls: MEDIUM - Based on common patterns, not project-specific history

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (30 days - stable domain, Next.js 16 established)

---

## Implementation Notes for Planner

### Key Files to Modify
1. `src/components/ui/menu/UnifiedMenuItemCard/CardImage.tsx` - Main target, convert to Next.js Image
2. `src/components/ui/menu/MenuGrid.tsx` - Already passes priority prop correctly
3. `src/components/ui/homepage/FeaturedSections.tsx` - Already passes priority prop correctly
4. `src/components/ui/menu/FeaturedCarousel/FeaturedCarousel.tsx` - Already passes priority prop correctly

### Verification Steps
1. Run `pnpm lighthouse` before changes (baseline)
2. Identify LCP element in Lighthouse report
3. Run `pnpm analyze:browser` to document bundle sizes
4. Make changes incrementally
5. Run `pnpm lighthouse` after changes
6. Compare LCP metrics (target: 8.1s -> 4-5s)

### Risk Areas
- CardImage uses Framer Motion for parallax - ensure `fill` prop works with motion.div wrapper
- External URLs from Supabase/Google Drive - verify remotePatterns covers all cases
- Error handling - maintain `onError` fallback to emoji placeholder
