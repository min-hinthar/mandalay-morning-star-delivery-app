# Phase 5: Menu Browsing - Research

**Researched:** 2026-01-22
**Domain:** Menu browsing UI, scroll animations, search/autocomplete, image loading
**Confidence:** HIGH

## Summary

Phase 5 builds V8 menu browsing components that leverage the existing overlay infrastructure (Phase 2) and cart experience (Phase 4). The codebase already contains robust V6/V7 implementations of menu components that serve as reference patterns. The primary work is creating new V8 versions with enhanced GSAP animations while integrating with the Phase 2 Modal/BottomSheet for item detail and Phase 4 AddToCartButton for cart additions.

Key integration points are well-established: `useActiveCategory` hook provides IntersectionObserver-based scrollspy, `@/lib/gsap` exports registered GSAP plugins, `useFlyToCart` hook triggers cart celebration animations, and the existing `Modal`/`BottomSheet` V8 components handle the item detail overlay.

**Primary recommendation:** Build V8 menu components (CategoryTabsV8, MenuItemCardV8, MenuContentV8) that use GSAP ScrollTrigger for staggered reveals while reusing Phase 2 overlays for item detail and Phase 4 AddToCartButton for cart integration.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| GSAP | 3.x (registered) | ScrollTrigger animations, staggered reveals | Already configured in `@/lib/gsap`, plugins registered |
| Framer Motion | 11.x | Hover effects, layoutId for tab indicator | Used throughout V6/V7/V8 components |
| Next.js Image | 15.x | Lazy loading, blur placeholder | Built-in optimization, already configured |
| React Query | 5.x | Menu/search data fetching | Already used in `useMenu`/`useMenuSearch` hooks |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zustand | 5.x | Favorites state | Already in `useFavoritesStore` |
| Lucide React | - | Icons (Heart, Search, Star) | Standard icon library for project |
| cn utility | - | Conditional classNames | Always for className composition |

### Already Available (No Installation Needed)
| Utility | Location | Purpose |
|---------|----------|---------|
| useActiveCategory | `@/lib/hooks/useActiveCategory` | Scrollspy with IntersectionObserver |
| useDebounce | `@/lib/hooks/useDebounce` | Debounce search input |
| useFavorites | `@/lib/hooks/useFavorites` | Toggle/check favorites |
| useAnimationPreference | `@/lib/hooks/useAnimationPreference` | Check animation enabled |
| getPlaceholderBlur | `@/lib/utils/image-optimization` | Generate blur placeholder SVG |
| IMAGE_SIZES | `@/lib/utils/image-optimization` | Standard image dimensions |

## Architecture Patterns

### Recommended Project Structure
```
src/components/ui-v8/menu/
  CategoryTabsV8.tsx       # MENU-01: Horizontal tabs with scrollspy
  MenuItemCardV8.tsx       # MENU-02: Card with hover effects
  MenuGridV8.tsx           # Container for staggered grid
  MenuSectionV8.tsx        # Category section wrapper
  SearchInputV8.tsx        # MENU-04: Search with autocomplete
  SearchAutocomplete.tsx   # Dropdown suggestions
  MenuSkeletonV8.tsx       # MENU-05: Loading states
  BlurImage.tsx            # MENU-07: Blur-up image wrapper
  FavoriteButton.tsx       # MENU-08: Heart animation
  EmojiPlaceholder.tsx     # MENU-09: Fallback for no image
  ItemDetailSheetV8.tsx    # MENU-03: Uses BottomSheet + Modal
  index.ts                 # Exports

src/components/ui-v8/menu/hooks/
  useScrollspy.ts          # Wraps useActiveCategory for V8
  useSearchAutocomplete.ts # Manages autocomplete state
```

### Pattern 1: GSAP Staggered Reveal with ScrollTrigger
**What:** Animate menu items as they scroll into view
**When to use:** Menu sections, grid items
**Example:**
```typescript
// Source: @/lib/gsap + gsap/presets.ts
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { gsapDuration, gsapEase, gsapPresets } from "@/lib/gsap/presets";

function MenuGridV8({ items }: { items: MenuItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { shouldAnimate } = useAnimationPreference();

  useGSAP(
    () => {
      if (!shouldAnimate || !containerRef.current) return;

      const cards = containerRef.current.querySelectorAll("[data-menu-card]");

      gsap.from(cards, {
        y: 40,
        opacity: 0,
        duration: gsapDuration.slow,
        ease: gsapEase.default,
        stagger: gsapPresets.stagger.normal, // 0.06s between items
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      });
    },
    { scope: containerRef, dependencies: [shouldAnimate, items] }
  );

  return (
    <div ref={containerRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <MenuItemCardV8 key={item.id} item={item} data-menu-card />
      ))}
    </div>
  );
}
```

### Pattern 2: Scrollspy Category Tabs
**What:** Highlight category tab based on scroll position
**When to use:** Sticky category navigation
**Example:**
```typescript
// Source: @/lib/hooks/useActiveCategory.ts
import { useActiveCategory } from "@/lib/hooks/useActiveCategory";

function CategoryTabsV8({ categories }: Props) {
  const sectionIds = categories.map((cat) => `category-${cat.slug}`);

  const { activeCategory, scrollToCategory } = useActiveCategory(sectionIds, {
    rootMargin: "-56px 0px -80% 0px", // Account for header
    headerHeight: 56,
  });

  return (
    <nav className="sticky top-14 z-sticky">
      {categories.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => scrollToCategory(cat.slug)}
          aria-pressed={activeCategory === cat.slug}
        >
          {/* Active indicator with layoutId */}
          {activeCategory === cat.slug && (
            <motion.div layoutId="v8ActiveTab" className="absolute inset-0" />
          )}
          {cat.name}
        </button>
      ))}
    </nav>
  );
}
```

### Pattern 3: Blur-Up Image Loading
**What:** Show blurred placeholder while image loads
**When to use:** All menu item images
**Example:**
```typescript
// Source: @/lib/utils/image-optimization + Next.js Image
import Image from "next/image";
import { getPlaceholderBlur, IMAGE_SIZES } from "@/lib/utils/image-optimization";

function BlurImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={IMAGE_SIZES.menuCard.sizes}
      placeholder="blur"
      blurDataURL={getPlaceholderBlur("#f5f5f0")} // Cream color placeholder
      className="object-cover transition-opacity duration-300"
    />
  );
}
```

### Pattern 4: Heart Favorite Animation
**What:** Bouncy heart toggle with scale animation
**When to use:** Favorite button on menu cards
**Example:**
```typescript
// Source: @/lib/motion-tokens.ts spring.ultraBouncy
import { motion, AnimatePresence } from "framer-motion";
import { spring } from "@/lib/motion-tokens";

function FavoriteButton({ isFavorite, onToggle }: Props) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10); // Haptic feedback
    }
    onToggle();
  };

  return (
    <motion.button
      onClick={handleClick}
      whileTap={shouldAnimate ? { scale: 0.85 } : undefined}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isFavorite ? "filled" : "outline"}
          initial={shouldAnimate ? { scale: 0 } : undefined}
          animate={{ scale: 1 }}
          exit={shouldAnimate ? { scale: 0 } : undefined}
          transition={shouldAnimate ? getSpring(spring.ultraBouncy) : { duration: 0 }}
        >
          <Heart className={isFavorite ? "fill-primary text-primary" : "text-muted"} />
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
```

### Pattern 5: Item Detail with V8 Overlays
**What:** Use Phase 2 Modal/BottomSheet for item detail
**When to use:** When clicking menu item
**Example:**
```typescript
// Source: Phase 2 Modal/BottomSheet + Phase 4 AddToCartButton
import { Modal } from "@/components/ui-v8/Modal";
import { BottomSheet } from "@/components/ui-v8/BottomSheet";
import { AddToCartButton } from "@/components/ui-v8/cart/AddToCartButton";
import { useMediaQuery } from "@/lib/hooks";

function ItemDetailSheetV8({ item, isOpen, onClose }: Props) {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const Overlay = isMobile ? BottomSheet : Modal;

  return (
    <Overlay isOpen={isOpen} onClose={onClose} title={item?.nameEn ?? "Item Detail"}>
      {item && (
        <>
          <BlurImage src={item.imageUrl} alt={item.nameEn} />
          <h2>{item.nameEn}</h2>
          <p>{item.descriptionEn}</p>
          {/* Modifiers, quantity selector */}
          <AddToCartButton
            item={{
              menuItemId: item.id,
              menuItemSlug: item.slug,
              nameEn: item.nameEn,
              nameMy: item.nameMy,
              imageUrl: item.imageUrl,
              basePriceCents: item.basePriceCents,
            }}
            onAdd={onClose}
          />
        </>
      )}
    </Overlay>
  );
}
```

### Anti-Patterns to Avoid
- **Hand-rolling IntersectionObserver for scrollspy:** Use existing `useActiveCategory` hook
- **Importing gsap directly:** Always import from `@/lib/gsap` to ensure plugin registration
- **Creating custom overlay components:** Use Phase 2 Modal/BottomSheet
- **Inline animation configs:** Use presets from `@/lib/motion-tokens` or `@/lib/gsap/presets`
- **Skipping animation preference check:** Always use `useAnimationPreference().shouldAnimate`
- **Fixed z-index values:** Use `zIndex` tokens from `@/design-system/tokens/z-index`

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scrollspy | Custom IntersectionObserver | `useActiveCategory` hook | Handles edge cases, header offset, smooth scroll |
| Debounced search | setTimeout wrapper | `useDebounce` hook | Proper cleanup, type-safe |
| Modal/sheet overlay | Custom portal/backdrop | `Modal`/`BottomSheet` V8 | Focus trap, body scroll lock, route close |
| Fly-to-cart animation | Custom GSAP timeline | `useFlyToCart` + `FlyToCart` | Badge integration, proper z-index |
| Blur placeholder | Inline data URL | `getPlaceholderBlur()` | Consistent color, SSR-safe |
| Animation toggle | Manual localStorage | `useAnimationPreference` | Persisted, data attribute for CSS |
| Favorites persistence | Custom localStorage | `useFavorites` hook | Zustand persisted store |

**Key insight:** Most complex behaviors already exist as hooks. The V8 work is composing them with new GSAP animations, not reimplementing logic.

## Common Pitfalls

### Pitfall 1: GSAP Plugin Not Registered
**What goes wrong:** "ScrollTrigger is not defined" or animation doesn't work
**Why it happens:** Importing from 'gsap' directly instead of '@/lib/gsap'
**How to avoid:** Always use `import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap"`
**Warning signs:** Any direct gsap import in code review

### Pitfall 2: Staggered Animation Reruns on Data Change
**What goes wrong:** Cards re-animate every time React Query refetches
**Why it happens:** useGSAP dependency includes the items array
**How to avoid:** Use `toggleActions: "play none none none"` (animate once)
**Warning signs:** Animations replaying when switching tabs back

### Pitfall 3: Scrollspy Jumpy on Fast Scroll
**What goes wrong:** Active tab flickers between categories
**Why it happens:** IntersectionObserver fires for multiple sections at once
**How to avoid:** Use visibility ratio comparison in `useActiveCategory` (already implemented)
**Warning signs:** Multiple sections showing as "active" briefly

### Pitfall 4: Image Layout Shift (CLS)
**What goes wrong:** Cards jump when images load
**Why it happens:** No explicit aspect ratio on image container
**How to avoid:** Always use `aspect-video` or explicit height on image container
**Warning signs:** CLS score > 0.1 in Lighthouse

### Pitfall 5: Search Autocomplete Click Not Registering
**What goes wrong:** Clicking suggestion doesn't select it
**Why it happens:** Input blur fires before suggestion click
**How to avoid:** Use `onMouseDown` with `preventDefault()` on suggestions
**Warning signs:** Need to click suggestions twice

### Pitfall 6: Heart Animation Flashes on Rerender
**What goes wrong:** Heart scales down and up when unrelated state changes
**Why it happens:** AnimatePresence key changes or component remounts
**How to avoid:** Stable key based only on favorite state, memoize if needed
**Warning signs:** Heart pulses when typing in search

## Code Examples

Verified patterns from official sources:

### GSAP ScrollTrigger Setup
```typescript
// Source: @/lib/gsap + @/components/ui-v8/scroll/RevealOnScroll.tsx
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { gsapDuration, gsapEase } from "@/lib/gsap/presets";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

function RevealSection({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { shouldAnimate } = useAnimationPreference();

  useGSAP(
    () => {
      if (!shouldAnimate || !ref.current) return;

      gsap.from(ref.current.children, {
        y: 40,
        opacity: 0,
        duration: gsapDuration.slow, // 0.28s
        ease: gsapEase.default, // "power2.out"
        stagger: 0.08,
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });
    },
    { scope: ref, dependencies: [shouldAnimate] }
  );

  return <div ref={ref}>{children}</div>;
}
```

### Framer Motion Hover Card
```typescript
// Source: @/lib/motion-tokens.ts + existing MenuItemCard patterns
import { motion } from "framer-motion";
import { spring, hover } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

function MenuItemCardV8({ item, onSelect }: Props) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <motion.article
      onClick={() => onSelect(item)}
      whileHover={shouldAnimate ? { y: -6, scale: 1.02 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.97 } : undefined}
      transition={shouldAnimate ? getSpring(spring.snappy) : { duration: 0 }}
      className="group cursor-pointer rounded-card bg-surface-primary shadow-card hover:shadow-card-hover"
    >
      {/* Image with zoom on group hover */}
      <div className="relative aspect-video overflow-hidden rounded-t-card">
        <BlurImage
          src={item.imageUrl}
          alt={item.nameEn}
          className="transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      {/* Content */}
    </motion.article>
  );
}
```

### Search with Autocomplete
```typescript
// Source: @/lib/hooks/useDebounce + @/lib/hooks/useMenu
import { useState, useCallback } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useMenuSearch } from "@/lib/hooks/useMenu";

function SearchInputV8({ onSelectItem }: Props) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query.trim(), 300);
  const { data, isFetching } = useMenuSearch(debouncedQuery);

  const handleSuggestionClick = useCallback(
    (e: React.MouseEvent, item: MenuItem) => {
      e.preventDefault(); // Prevent input blur before click registers
      setQuery("");
      onSelectItem(item);
    },
    [onSelectItem]
  );

  return (
    <div className="relative">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search menu..."
      />
      {debouncedQuery && data?.data.items && (
        <div className="absolute top-full left-0 right-0 z-dropdown">
          {data.data.items.map((item) => (
            <button
              key={item.id}
              onMouseDown={(e) => handleSuggestionClick(e, item)}
              className="block w-full text-left p-3 hover:bg-surface-secondary"
            >
              {item.nameEn}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Emoji Placeholder for Missing Images
```typescript
// Source: Business requirement MENU-09
const CATEGORY_EMOJI_MAP: Record<string, string> = {
  salads: "🥗",
  soups: "🍜",
  curries: "🍛",
  noodles: "🍝",
  rice: "🍚",
  appetizers: "🥟",
  desserts: "🍮",
  beverages: "🧋",
  default: "🍽️",
};

function EmojiPlaceholder({ categorySlug }: { categorySlug?: string }) {
  const emoji = CATEGORY_EMOJI_MAP[categorySlug ?? "default"] ?? CATEGORY_EMOJI_MAP.default;

  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-br from-surface-secondary to-surface-tertiary">
      <span className="text-5xl" role="img" aria-label="Food placeholder">
        {emoji}
      </span>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| V6 category-tabs.tsx | V8 with GSAP stagger | Phase 5 | More dramatic entrance animations |
| V7 CategoryCarousel | Keep for reference | - | V8 uses similar patterns with enhanced GSAP |
| V3 ItemDetailModal | Use V8 Modal/BottomSheet | Phase 2 | Consistent overlay behavior |
| Custom add-to-cart | Phase 4 AddToCartButton | Phase 4 | FlyToCart integration |
| Manual IntersectionObserver | useActiveCategory hook | Already exists | Tested scrollspy behavior |

**Deprecated/outdated:**
- V3 `ItemDetailModal`: Replace with V8 `Modal` or `BottomSheet` from Phase 2
- V6 springs (`v6Spring`, `v6SpringBouncy`): Use V7 `spring` tokens from `@/lib/motion-tokens`
- Direct gsap imports: Always use `@/lib/gsap`

## Integration Points

### Phase 2 (Overlay Infrastructure)
| V8 Component | Usage in Phase 5 |
|--------------|------------------|
| `Modal` | Item detail on desktop (centered dialog) |
| `BottomSheet` | Item detail on mobile (swipe to close) |
| `useMediaQuery` | Switch between Modal/BottomSheet |
| `Portal` | If building custom dropdown for autocomplete |
| `Backdrop` | Already included in Modal/BottomSheet |

### Phase 4 (Cart Experience)
| V8 Component | Usage in Phase 5 |
|--------------|------------------|
| `AddToCartButton` | Primary CTA in item detail sheet |
| `useFlyToCart` | If building custom add button |
| `CartDrawerV8` | Opens after add-to-cart (already wired) |
| `CartButtonV8` | Badge target for FlyToCart (already wired) |

### Existing Hooks to Reuse
| Hook | Usage |
|------|-------|
| `useActiveCategory` | Scrollspy for category tabs |
| `useMenu` | Fetch menu categories |
| `useMenuSearch` | Search with React Query |
| `useDebounce` | Debounce search input |
| `useFavorites` | Toggle/check favorites |
| `useAnimationPreference` | Check animation enabled |
| `useCart` | Direct cart manipulation (if needed) |

## Open Questions

Things that couldn't be fully resolved:

1. **Search autocomplete dropdown positioning**
   - What we know: Dropdown component exists from Phase 2
   - What's unclear: Should search use same Dropdown or simpler custom list?
   - Recommendation: Use simple positioned div with z-dropdown class; Dropdown is for menus not search

2. **Category tabs: pills vs underline indicator**
   - What we know: V6 uses pill background with layoutId, V7 has similar
   - What's unclear: User preference for V8 style
   - Recommendation: Keep pill style with layoutId for smooth animation

3. **Skeleton animation variant preference**
   - What we know: Skeleton supports shimmer, pulse, wave, grain
   - What's unclear: Which variant for menu cards
   - Recommendation: Use shimmer (consistent with existing menu-skeleton.tsx)

## Sources

### Primary (HIGH confidence)
- `@/lib/gsap/index.ts` - GSAP plugin registration pattern
- `@/lib/gsap/presets.ts` - Duration, easing, stagger presets
- `@/lib/hooks/useActiveCategory.ts` - Scrollspy implementation
- `@/components/ui-v8/Modal.tsx` - V8 Modal from Phase 2
- `@/components/ui-v8/BottomSheet.tsx` - V8 BottomSheet from Phase 2
- `@/components/ui-v8/cart/AddToCartButton.tsx` - Cart integration from Phase 4
- `@/components/ui-v8/cart/FlyToCart.tsx` - Fly animation from Phase 4
- `@/lib/motion-tokens.ts` - V7 spring/animation presets
- `@/lib/utils/image-optimization.ts` - Blur placeholder generator

### Secondary (MEDIUM confidence)
- Existing V6/V7 components (`menu-item-card.tsx`, `CategoryCarousel.tsx`) - Reference patterns
- `@/components/ui/skeleton.tsx` - Skeleton implementation reference

### Tertiary (LOW confidence)
- None - all patterns verified in codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already configured in codebase
- Architecture: HIGH - Patterns verified in existing V6/V7/V8 components
- Pitfalls: HIGH - Documented from existing implementations
- Integration: HIGH - Phase 2/4 components already built and tested

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (stable patterns, low change risk)
