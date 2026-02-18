# Phase 36: Image Optimization & LCP - Research

**Researched:** 2026-02-01
**Domain:** Next.js Image Optimization, Core Web Vitals (LCP, CLS)
**Confidence:** HIGH

## Summary

This research covers image optimization techniques for achieving sub-2.5s Largest Contentful Paint (LCP) and zero Cumulative Layout Shift (CLS) in a Next.js 16.1 application. The project already has a solid foundation with `next/image`, `image-optimization.ts` utilities, and responsive image infrastructure.

**Key finding:** Next.js 16 deprecated `priority` in favor of `preload` for clearer semantics. The codebase currently uses `priority={true}` which still works but should migrate to `preload={true}`. Additionally, Next.js 16 requires explicit `qualities` configuration in `next.config.ts`.

**Primary recommendation:** Update image components to use `preload` prop, add `qualities` config to next.config.ts, ensure first 6 menu cards use eager loading, and implement skeleton shimmer placeholders with explicit dimensions for zero CLS.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library    | Version | Purpose            | Why Standard                                     |
| ---------- | ------- | ------------------ | ------------------------------------------------ |
| next/image | 16.1.2  | Image optimization | Built-in, automatic WebP/AVIF, srcset generation |
| @next/font | 16.1.2  | Font optimization  | Zero CLS with size-adjust, preload at build time |

### Supporting

| Library    | Version | Purpose              | When to Use                            |
| ---------- | ------- | -------------------- | -------------------------------------- |
| lighthouse | 13.x    | Performance auditing | CI/CD validation of LCP/CLS thresholds |
| @lhci/cli  | latest  | Lighthouse CI        | Automated regression testing           |

### Already In Use

| Library                   | Purpose                         | Status                          |
| ------------------------- | ------------------------------- | ------------------------------- |
| `image-optimization.ts`   | Size presets, blur placeholders | Existing - needs quality update |
| `BlurImage` component     | Shimmer loading animation       | Existing - needs size fixes     |
| `AnimatedImage` component | Animated reveals                | Existing                        |
| `CardImage` component     | Menu card images                | Existing - uses plain `<img>`   |

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/utils/
│   └── image-optimization.ts    # Size presets, blur data URL helpers
├── components/ui/
│   ├── animated-image.tsx       # Animated reveal wrapper
│   ├── menu/
│   │   ├── BlurImage.tsx        # Shimmer placeholder images
│   │   ├── CardImage.tsx        # Menu card image with parallax
│   │   └── EmojiPlaceholder.tsx # Fallback for missing images
│   └── skeleton/
│       └── ImageSkeleton.tsx    # Reusable shimmer skeleton
└── app/
    └── layout.tsx               # Font optimization already configured
```

### Pattern 1: Priority Loading with Preload (Next.js 16)

**What:** Use `preload={true}` for LCP images to insert preload link in `<head>`
**When to use:** Hero images, above-the-fold content
**Example:**

```typescript
// Source: https://nextjs.org/docs/app/api-reference/components/image
import Image from 'next/image'

// LCP hero image - preload in head
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1920}
  height={1080}
  preload={true}  // Next.js 16+ (replaces priority)
  sizes="100vw"
  quality={85}
/>

// First 6 menu cards - eager loading
<Image
  src={item.image}
  alt={item.name}
  width={400}
  height={225}
  loading="eager"  // Skip lazy loading
  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
  quality={85}
/>

// Below-fold images - lazy (default)
<Image
  src={item.image}
  alt={item.name}
  loading="lazy"  // Default behavior
  sizes="(max-width: 640px) 50vw, 33vw"
/>
```

### Pattern 2: Responsive Sizes Attribute

**What:** Inform browser of expected image display size to select optimal srcset entry
**When to use:** All responsive images
**Example:**

```typescript
// Source: https://nextjs.org/docs/app/api-reference/components/image

// Menu cards - responsive grid
sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";
// Mobile: 2 columns (50vw each)
// Tablet: 3 columns (33vw each)
// Desktop: 4 columns (25vw each)

// Hero - full width
sizes = "100vw";

// Thumbnail - fixed small
sizes = "80px";
```

### Pattern 3: Skeleton Shimmer for Zero CLS

**What:** Reserve exact space before image loads using explicit dimensions
**When to use:** All images to prevent layout shift
**Example:**

```typescript
// Skeleton container with explicit aspect ratio
<div
  className="relative overflow-hidden bg-surface-secondary"
  style={{ aspectRatio: '4/3' }}  // Match image aspect ratio
>
  {/* Shimmer animation */}
  {!isLoaded && (
    <div className="absolute inset-0 animate-pulse-subtle bg-surface-tertiary" />
  )}

  {/* Image fades in when loaded */}
  <Image
    className={cn(
      "transition-opacity duration-150",
      isLoaded ? "opacity-100" : "opacity-0"
    )}
    onLoad={() => setIsLoaded(true)}
    fill
    sizes="..."
  />
</div>
```

### Pattern 4: Image Format Strategy (AVIF > WebP > JPEG)

**What:** Serve optimal format based on browser support
**When to use:** Already configured in next.config.ts
**Example:**

```typescript
// next.config.ts - already configured
images: {
  formats: ["image/avif", "image/webp"],  // AVIF first, WebP fallback
  // ...
}
```

### Anti-Patterns to Avoid

- **Missing sizes attribute:** Without sizes, browser assumes 100vw, downloading unnecessarily large images
- **Lazy loading LCP images:** Hero images must use `preload` or `loading="eager"`
- **Missing width/height:** Causes CLS as browser can't reserve space
- **Using CSS blur filter on mobile:** Causes Safari GPU crashes (already handled in codebase)
- **Blur placeholder on remote images without blurDataURL:** Results in no placeholder

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                  | Don't Build          | Use Instead            | Why                                         |
| ------------------------ | -------------------- | ---------------------- | ------------------------------------------- |
| Image srcset generation  | Custom srcset logic  | next/image             | Handles device sizes, formats, optimization |
| Blur placeholder         | Manual tiny image    | getPlaceholderBlur()   | Already in image-optimization.ts            |
| Aspect ratio reservation | Padding hack         | aspectRatio CSS        | Modern CSS, cleaner code                    |
| Format selection         | Accept header logic  | next.config formats    | Automatic content negotiation               |
| Font FOUT prevention     | @font-face hacks     | next/font display:swap | Automatic size-adjust calculation           |
| Lazy loading             | IntersectionObserver | loading="lazy"         | Native browser support                      |

**Key insight:** The codebase already has most infrastructure. Focus on configuration updates and proper prop usage rather than new implementations.

## Common Pitfalls

### Pitfall 1: priority Prop Deprecated in Next.js 16

**What goes wrong:** Using `priority={true}` still works but is deprecated
**Why it happens:** Next.js 16 renamed to `preload` for clearer semantics
**How to avoid:** Update all `priority={true}` to `preload={true}`
**Warning signs:** Console deprecation warning in development

### Pitfall 2: Missing qualities Configuration

**What goes wrong:** Image optimization may fail or use wrong quality
**Why it happens:** Next.js 16 requires explicit `qualities` array in config
**How to avoid:** Add `qualities: [70, 85]` to next.config.ts images config
**Warning signs:** Build warnings or errors about quality configuration

### Pitfall 3: CardImage Uses Plain img Tag

**What goes wrong:** No automatic optimization, manual lazy loading only
**Why it happens:** CardImage was implemented with `<img>` for Google Drive URL compatibility
**How to avoid:** For Google Drive images configured in remotePatterns, next/image works; evaluate if CardImage can use Image component
**Warning signs:** Large image downloads on mobile, no WebP/AVIF

### Pitfall 4: Skeleton Without Fixed Dimensions

**What goes wrong:** Layout shift when image loads
**Why it happens:** Skeleton doesn't reserve same space as final image
**How to avoid:** Use same aspect ratio and explicit container dimensions
**Warning signs:** CLS > 0.1 in Lighthouse

### Pitfall 5: Too Many Priority Images

**What goes wrong:** Priority images compete for bandwidth, slowing all
**Why it happens:** Marking too many images as priority/preload
**How to avoid:** Only preload actual LCP image (1), eager load first 6 visible
**Warning signs:** Lighthouse warning about preloading

### Pitfall 6: Font Flash Despite swap

**What goes wrong:** Visible font swap causes perceived shift
**Why it happens:** System font metrics differ from custom font
**How to avoid:** next/font calculates size-adjust automatically (already configured)
**Warning signs:** Text visibly resizes on load

## Code Examples

Verified patterns from official sources:

### Next.js 16 Quality Configuration

```typescript
// next.config.ts - REQUIRED for Next.js 16
// Source: https://nextjs.org/docs/app/api-reference/components/image
const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 85], // ADD THIS - required in Next.js 16
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // ... existing config
  },
};
```

### Preload for LCP Image

```typescript
// Source: https://nextjs.org/docs/app/api-reference/components/image
// HowItWorksSection.tsx - update from priority to preload
<Image
  src="/images/sunset_ubein.png"
  alt="U Bein Bridge sunset"
  fill
  sizes="100vw"
  preload={true}  // Changed from priority={true}
  quality={85}
/>
```

### Menu Card Priority Loading

```typescript
// Source: Phase context decisions
// First 6 cards get eager loading
<UnifiedMenuItemCard
  item={item}
  priority={index < 6}  // Maps to loading="eager" internally
/>

// CardImage internal implementation
<img
  src={imageUrl}
  loading={priority ? "eager" : "lazy"}
  // Consider upgrading to next/image if possible
/>
```

### Skeleton Shimmer Component

```typescript
// Source: CSS-Tricks, verified pattern
// Pulse opacity shimmer (not gradient wave per CONTEXT.md)
const shimmerClass = "animate-pulse bg-surface-tertiary";

// In Tailwind config
animation: {
  'pulse-subtle': 'pulse-subtle 1.5s ease-in-out infinite',
},
keyframes: {
  'pulse-subtle': {
    '0%, 100%': { opacity: '0.6' },
    '50%': { opacity: '0.8' },
  },
}
```

### Staggered Card Reveal

```typescript
// Source: Phase context decisions
// Cards reveal one-by-one with cascade
{items.map((item, index) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: index * 0.05 }}  // 50ms stagger
  >
    <MenuCard item={item} priority={index < 6} />
  </motion.div>
))}
```

### Emoji Fallback for Missing Images

```typescript
// Source: Existing EmojiPlaceholder.tsx
// Already implemented with getCategoryEmoji()
{imageUrl ? (
  <img src={imageUrl} ... />
) : (
  <div className="bg-surface-secondary flex items-center justify-center">
    <span className="text-5xl">
      {getCategoryEmoji(categorySlug)}
    </span>
  </div>
)}
```

## State of the Art

| Old Approach         | Current Approach            | When Changed   | Impact                               |
| -------------------- | --------------------------- | -------------- | ------------------------------------ |
| `priority={true}`    | `preload={true}`            | Next.js 16.0.0 | Clearer semantics, same behavior     |
| Unrestricted quality | `qualities` config required | Next.js 16.0.0 | Security improvement                 |
| CSS padding hack     | `aspectRatio` CSS property  | 2022+          | Cleaner code, better browser support |
| JPEG-only            | AVIF > WebP > JPEG          | 2024+          | 50% smaller files with AVIF          |
| FID metric           | INP metric                  | March 2024     | Stricter interaction measurement     |

**Deprecated/outdated:**

- `priority` prop: Use `preload` instead (Next.js 16+)
- Manual srcset: Let next/image generate automatically
- Intersection Observer for lazy: Use native `loading="lazy"`

## Open Questions

Things that couldn't be fully resolved:

1. **CardImage using plain `<img>` vs next/image**
   - What we know: Currently uses `<img>` for "reliable" loading, especially with Google Drive URLs
   - What's unclear: Whether next/image works reliably with all current image sources
   - Recommendation: Test next/image with current Google Drive URLs; if works, migrate

2. **Hero image on HowItWorksSection**
   - What we know: Uses `priority={true}` for `/images/sunset_ubein.png`
   - What's unclear: Whether this is the actual LCP element or if homepage has different LCP
   - Recommendation: Run Lighthouse to identify actual LCP element, may need preload on homepage hero instead

3. **Google Maps deferred loading (369KB)**
   - What we know: CoverageRouteMap uses useJsApiLoader which loads on component mount
   - What's unclear: Whether it's already deferred or if IntersectionObserver loading is needed
   - Recommendation: Verify with Network tab; if loads immediately on homepage, add intersection observer

## Sources

### Primary (HIGH confidence)

- [Next.js Image Component Docs](https://nextjs.org/docs/app/api-reference/components/image) - priority/preload, sizes, quality
- [Next.js Font Docs](https://nextjs.org/docs/pages/api-reference/components/font) - display: swap, preload
- [web.dev Core Web Vitals](https://web.dev/articles/top-cwv) - LCP/CLS best practices

### Secondary (MEDIUM confidence)

- [Elementor AVIF vs WebP](https://elementor.com/blog/webp-vs-avif/) - Format comparison 2026
- [NitroPack CWV 2026](https://nitropack.io/blog/core-web-vitals-strategy/) - Current thresholds and strategies
- [CSS-Tricks Skeleton Screens](https://css-tricks.com/building-skeleton-screens-css-custom-properties/) - Shimmer patterns

### Tertiary (LOW confidence)

- [Medium Next.js 16 Overview](https://medium.com/@reactjsbd/next-js-16-the-game-changing-release-that-will-revolutionize-how-you-build-web-application-341af28a7881) - Version changes

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Next.js official docs verified
- Architecture: HIGH - Based on existing codebase patterns + official docs
- Pitfalls: HIGH - Verified deprecation notices and config requirements

**Research date:** 2026-02-01
**Valid until:** 30 days (Next.js stable, patterns well-established)

---

## Codebase-Specific Findings

### Current State Analysis

**Already Implemented:**

- Font optimization with `display: swap` in layout.tsx
- IMAGE_SIZES presets in image-optimization.ts
- BlurImage with shimmer animation
- EmojiPlaceholder for missing images
- Priority loading for first 6 cards in FeaturedSections
- Google Drive and Supabase in remotePatterns

**Needs Update:**

1. `next.config.ts`: Add `qualities: [70, 85]` to images config
2. `priority` to `preload`: Update all Image components using priority
3. `CardImage.tsx`: Consider migrating from `<img>` to `next/image`
4. `image-optimization.ts`: Update default quality from 85 to 70 for non-hero images
5. Skeleton dimensions: Ensure all skeletons match final image aspect ratios

**Files to Modify:**

- `next.config.ts` - Add qualities config
- `src/lib/utils/image-optimization.ts` - Update quality defaults
- `src/components/ui/homepage/HowItWorksSection.tsx` - priority -> preload
- `src/components/ui/homepage/FeaturedSections.tsx` - Verify priority usage
- `src/components/ui/menu/UnifiedMenuItemCard/CardImage.tsx` - Evaluate next/image migration
- `src/components/ui/layout/AppHeader/*.tsx` - priority -> preload

**Measurement Setup Needed:**

- Lighthouse CI configuration for automated LCP/CLS checks
- Performance budget: LCP < 2.5s, CLS < 0.1
