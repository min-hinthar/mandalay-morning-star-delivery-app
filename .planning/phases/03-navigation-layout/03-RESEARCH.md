# Phase 3: Navigation & Layout - Research

**Researched:** 2026-01-22
**Domain:** Navigation shell, page transitions, GSAP scroll choreography
**Confidence:** HIGH

## Summary

Phase 3 builds the V8 app shell with sticky header, mobile bottom navigation, and page containers. Research confirms the codebase has extensive existing infrastructure that should be leveraged rather than rebuilt.

**Key findings:**
- Existing hooks (`useScrollDirection`, `useRouteChangeClose`, `useBodyScrollLock`) are production-ready and should be reused
- V7 Header at `src/components/layout/header.tsx` provides scroll effects pattern to follow
- `PageTransition` component at `src/components/layouts/PageTransition.tsx` already has 8 transition variants
- GSAP is configured at `src/lib/gsap/` with ScrollTrigger, SplitText, Flip, Observer plugins
- Z-index tokens in design system prevent layering conflicts

**Primary recommendation:** Create V8 navigation components in `src/components/ui-v8/navigation/` that compose existing hooks and Phase 2 overlay primitives. Extend `PageTransition` rather than replace it.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | 12.26.1 | Page transitions, AnimatePresence | Already used throughout codebase |
| gsap | 3.14.2 | ScrollTrigger choreography | Registered at `@/lib/gsap` |
| @gsap/react | 2.1.2 | useGSAP hook | Proper React cleanup |
| next/navigation | 16.1.2 | usePathname for route detection | Native to Next.js |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.562.0 | Navigation icons | Icon buttons |
| class-variance-authority | 0.7.1 | Variant styling | Component variants |
| tailwind-merge | 3.4.0 | Class merging | cn() utility |

### Existing Hooks to Reuse
| Hook | Location | Purpose |
|------|----------|---------|
| `useScrollDirection` | `@/lib/hooks/useScrollDirection` | Header collapse on scroll |
| `useRouteChangeClose` | `@/lib/hooks/useRouteChangeClose` | Auto-close overlays on nav |
| `useBodyScrollLock` | `@/lib/hooks/useBodyScrollLock` | Prevent background scroll |
| `useReducedMotion` | `@/lib/hooks/useReducedMotion` | Accessibility |
| `useMediaQuery` | `@/lib/hooks/useMediaQuery` | Responsive breakpoints |
| `useAnimationPreference` | `@/lib/hooks/useAnimationPreference` | User animation settings |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom scroll detection | Intersection Observer | useScrollDirection already optimized with throttling |
| New page transition lib | Existing PageTransition | Would lose navigation history tracking |
| CSS-only sticky header | Framer Motion animated | Need dynamic shrink/blur effects |

**Installation:**
```bash
# All dependencies already installed - no new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/components/ui-v8/
├── navigation/
│   ├── index.ts              # Barrel export
│   ├── AppShell.tsx          # Main layout wrapper
│   ├── Header.tsx            # Sticky header with scroll effects
│   ├── BottomNav.tsx         # Mobile bottom navigation
│   ├── MobileMenu.tsx        # Slide-out menu (uses Drawer)
│   └── PageContainer.tsx     # Consistent page wrapper
├── scroll/
│   ├── index.ts              # Barrel export
│   ├── ScrollChoreographer.tsx   # GSAP ScrollTrigger orchestration
│   ├── RevealOnScroll.tsx    # Scroll-triggered reveals
│   └── ParallaxLayer.tsx     # Parallax scroll effects
└── transitions/
    ├── index.ts              # Barrel export
    └── PageTransitionV8.tsx  # Enhanced page transitions
```

### Pattern 1: App Shell Architecture
**What:** Single layout component composing header, content area, and bottom nav
**When to use:** Root layout for customer pages
**Example:**
```typescript
// Source: Derived from existing CustomerLayout pattern
interface AppShellProps {
  children: React.ReactNode;
  headerSlot?: React.ReactNode;
  showBottomNav?: boolean;
  showHeader?: boolean;
}

export function AppShell({ children, headerSlot, showBottomNav = true, showHeader = true }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {showHeader && <Header rightContent={headerSlot} />}
      <main className="flex-1">
        {children}
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  );
}
```

### Pattern 2: Header with Scroll Effects
**What:** Header that shrinks and blurs on scroll, hides on scroll down
**When to use:** All pages needing persistent header
**Example:**
```typescript
// Source: Existing header.tsx pattern
const { isCollapsed, scrollY, isAtTop } = useScrollDirection({ threshold: 50 });

return (
  <motion.header
    animate={{ y: isCollapsed ? -72 : 0 }}
    transition={spring.snappy}
    style={{
      backgroundColor: `rgba(255, 255, 255, ${isAtTop ? 0.6 : 0.95})`,
      backdropFilter: `blur(${isAtTop ? 8 : 16}px)`,
    }}
    className="fixed top-0 left-0 right-0 z-fixed"
  >
    {/* Header content */}
  </motion.header>
);
```

### Pattern 3: Bottom Navigation with Active Indicator
**What:** Mobile bottom nav with animated active state
**When to use:** Mobile viewports below md breakpoint
**Example:**
```typescript
// Source: Derived from MobileNavItem pattern
function BottomNavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1">
      <motion.span
        animate={{ scale: isActive ? 1.1 : 1 }}
        className={cn(isActive ? "text-primary" : "text-muted-foreground")}
      >
        {icon}
      </motion.span>
      <span className="text-xs">{label}</span>
      {isActive && (
        <motion.span
          layoutId="bottomNavIndicator"
          className="absolute -bottom-0.5 h-0.5 w-6 rounded-full bg-primary"
        />
      )}
    </Link>
  );
}
```

### Pattern 4: Page Transitions with AnimatePresence
**What:** Route-aware page transitions with direction detection
**When to use:** Page-level transitions
**Example:**
```typescript
// Source: Existing PageTransition.tsx
<AnimatePresence mode="wait" initial={false}>
  <motion.div
    key={pathname}
    variants={slideVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="min-h-screen"
  >
    {children}
  </motion.div>
</AnimatePresence>
```

### Pattern 5: GSAP ScrollTrigger Integration
**What:** Scroll-choreographed animations using GSAP
**When to use:** Reveal effects, parallax, pinned sections
**Example:**
```typescript
// Source: @/lib/gsap pattern
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";

function ScrollRevealSection({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const elements = gsap.utils.toArray<HTMLElement>(".reveal-item");

    elements.forEach((el) => {
      gsap.from(el, {
        y: 40,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      });
    });
  }, { scope: containerRef });

  return <div ref={containerRef}>{children}</div>;
}
```

### Anti-Patterns to Avoid
- **Mixing z-index approaches:** Use ONLY `z-sticky`, `z-fixed`, etc. from design tokens
- **Manual body scroll lock:** Use `useBodyScrollLock` hook, not direct DOM manipulation
- **Ignoring route changes for overlays:** Always use `useRouteChangeClose` for menus
- **Hardcoded breakpoints:** Use `useMediaQuery` or Tailwind responsive classes
- **Synchronous GSAP in useEffect:** Always use `useGSAP` hook for proper cleanup

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll direction detection | Manual scroll listeners | `useScrollDirection` | Has throttling, threshold, RAF optimization |
| Body scroll locking | `document.body.style.overflow = 'hidden'` | `useBodyScrollLock` | Handles iOS, preserves scroll position, accounts for scrollbar width |
| Route change detection | Custom pathname tracking | `useRouteChangeClose` | Handles edge cases, ref management |
| Reduced motion check | `matchMedia` query | `useReducedMotion` | Combines system + user preference |
| Animation spring configs | Inline spring values | `spring` from motion-tokens | Consistent feel across app |
| Page exit animations | Custom exit tracking | `AnimatePresence mode="wait"` | Framer Motion handles lifecycle |
| GSAP cleanup | Manual `kill()` calls | `useGSAP` hook | Automatic cleanup on unmount |

**Key insight:** The codebase has battle-tested solutions for every common navigation challenge. Building custom alternatives risks regressions in edge cases (iOS Safari scroll, scrollbar width compensation, animation cleanup).

## Common Pitfalls

### Pitfall 1: AnimatePresence Key Mismatch
**What goes wrong:** Page transitions don't animate because key doesn't change
**Why it happens:** Using static key or component identity instead of pathname
**How to avoid:** Always use `usePathname()` as AnimatePresence child key
**Warning signs:** Exit animations never fire, pages snap instead of transition

### Pitfall 2: Z-Index Wars
**What goes wrong:** Header appears behind modals, or dropdowns appear above everything
**Why it happens:** Mixing arbitrary z-index values with token system
**How to avoid:**
- Use ONLY `z-sticky` (20), `z-fixed` (30), `z-modal` (50) etc.
- Never use raw numbers like `z-50` or `z-[999]`
**Warning signs:** Elements randomly appearing above/below each other

### Pitfall 3: iOS Safe Area Ignored
**What goes wrong:** Bottom nav hidden behind iPhone home indicator, content under notch
**Why it happens:** Not using safe area insets
**How to avoid:**
- Header: `className="pt-safe"` or `padding-top: env(safe-area-inset-top)`
- Bottom nav: `padding-bottom: env(safe-area-inset-bottom)`
**Warning signs:** Works on Android/desktop, broken on iPhone

### Pitfall 4: Scroll Position Lost on Navigation
**What goes wrong:** User scrolls down, navigates away, comes back to top of page
**Why it happens:** Not preserving scroll position
**How to avoid:** Use `preserveScroll` prop on PageTransition, or implement scroll restoration
**Warning signs:** Users complain about losing their place

### Pitfall 5: GSAP ScrollTrigger Memory Leaks
**What goes wrong:** Animations continue after component unmounts, performance degrades
**Why it happens:** Not cleaning up ScrollTrigger instances
**How to avoid:**
- Always use `useGSAP` hook, never raw `useEffect`
- Use `{ scope: containerRef }` for automatic cleanup
**Warning signs:** Console warnings about dead animations, growing memory usage

### Pitfall 6: Header Flicker on Fast Scroll
**What goes wrong:** Header rapidly shows/hides during scroll
**Why it happens:** Threshold too low, no scroll debouncing
**How to avoid:**
- Use `threshold: 50` or higher in `useScrollDirection`
- Don't collapse header while mobile menu is open
**Warning signs:** Header feels "jittery" on scroll

## Code Examples

Verified patterns from official sources:

### Mobile Menu with Route Close
```typescript
// Source: Existing MobileNav.tsx pattern
export function MobileMenu({ isOpen, onClose, navItems }: MobileMenuProps) {
  // Auto-close on route change
  useRouteChangeClose(isOpen, onClose);

  // Lock body scroll when open
  useBodyScrollLock(isOpen);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <Backdrop isVisible={isOpen} onClick={onClose} />
          <motion.nav
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={spring.default}
            className="fixed left-0 top-0 bottom-0 w-[85%] max-w-sm z-modal"
          >
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} onClick={onClose} />
            ))}
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
```

### Header Shrink on Scroll
```typescript
// Source: Existing header.tsx
export function Header({ navItems, cartCount, onCartClick }: HeaderProps) {
  const { isCollapsed, scrollY, isAtTop } = useScrollDirection({ threshold: 50 });
  const { shouldAnimate, getSpring } = useAnimationPreference();

  // Derive visual states from scroll position
  const headerHeight = isAtTop ? 72 : 56;
  const logoScale = isAtTop ? 1 : 0.9;
  const bgOpacity = isAtTop ? 0.6 : 0.95;
  const blurAmount = isAtTop ? 8 : 16;

  return (
    <motion.header
      animate={{
        y: isCollapsed ? -headerHeight : 0,
        height: headerHeight,
      }}
      transition={shouldAnimate ? getSpring(spring.snappy) : { duration: 0 }}
      style={{
        backgroundColor: `rgba(255, 255, 255, ${bgOpacity})`,
        backdropFilter: `blur(${blurAmount}px)`,
      }}
      className="fixed top-0 left-0 right-0 z-fixed border-b border-border/50"
    >
      <div className="flex items-center justify-between h-full px-4 max-w-7xl mx-auto">
        <motion.div animate={{ scale: logoScale }}>
          <Logo />
        </motion.div>
        <nav className="hidden md:flex gap-1">
          {navItems.map((item) => <NavItem key={item.href} {...item} />)}
        </nav>
        <CartButton count={cartCount} onClick={onCartClick} />
      </div>
    </motion.header>
  );
}
```

### Bottom Navigation
```typescript
// Pattern for mobile bottom nav
const bottomNavItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/menu", icon: UtensilsCrossed, label: "Menu" },
  { href: "/orders", icon: Package, label: "Orders" },
  { href: "/account", icon: User, label: "Account" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { shouldAnimate } = useAnimationPreference();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-fixed bg-background/95 backdrop-blur-lg border-t md:hidden"
         style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex justify-around items-center h-16">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 px-3 py-2">
              <motion.span
                animate={shouldAnimate ? { scale: isActive ? 1.1 : 1 } : {}}
                className={isActive ? "text-primary" : "text-muted-foreground"}
              >
                <Icon className="w-5 h-5" />
              </motion.span>
              <span className={cn("text-[10px]", isActive ? "text-primary font-medium" : "text-muted-foreground")}>
                {item.label}
              </span>
              {isActive && (
                <motion.span
                  layoutId="bottomNavIndicator"
                  className="absolute bottom-1 h-0.5 w-6 rounded-full bg-primary"
                  transition={spring.snappy}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

### GSAP Scroll Choreography
```typescript
// Source: @/lib/gsap pattern + presets
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { gsapPresets, scrollTriggerPresets } from "@/lib/gsap/presets";

export function ScrollChoreographer({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Staggered reveal for sections
    const sections = gsap.utils.toArray<HTMLElement>(".scroll-section");

    sections.forEach((section, i) => {
      const items = section.querySelectorAll(".scroll-item");

      gsap.from(items, {
        ...gsapPresets.slideUp,
        stagger: gsapPresets.stagger.normal,
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      });
    });

    // Parallax background
    gsap.to(".parallax-bg", {
      yPercent: -30,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });
  }, { scope: containerRef });

  return <div ref={containerRef}>{children}</div>;
}
```

### Page Container with Consistent Spacing
```typescript
// Consistent page wrapper
export function PageContainer({
  children,
  className,
  padTop = true,
  padBottom = true,
}: PageContainerProps) {
  return (
    <div className={cn(
      "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
      padTop && "pt-6 sm:pt-8",
      padBottom && "pb-20 sm:pb-8", // Extra bottom padding for mobile bottom nav
      className
    )}>
      {children}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS transitions for page changes | Framer Motion AnimatePresence | 2023 | Proper exit animations, shared layout |
| Manual scroll listener | useScrollDirection hook | V7 | Performance optimized, throttled |
| document.body.overflow | useBodyScrollLock hook | V7 | iOS compatibility, scroll restoration |
| GSAP in useEffect | useGSAP hook | GSAP 3.12 | Automatic cleanup, scope isolation |
| Separate mobile/desktop headers | Single responsive header | V7 | Less code, consistent behavior |

**Deprecated/outdated:**
- `next/router`: Replaced by `next/navigation` in App Router
- Manual scroll restoration: Use Next.js built-in or PageTransition preserveScroll
- CSS @keyframes for complex sequences: Use Framer Motion or GSAP for orchestration

## Open Questions

Things that couldn't be fully resolved:

1. **View Transitions API Integration**
   - What we know: Next.js 14+ has experimental support
   - What's unclear: Interaction with AnimatePresence, browser support status
   - Recommendation: Stick with AnimatePresence for now, plan migration path

2. **GSAP Club Plugins License**
   - What we know: SplitText requires Club membership
   - What's unclear: License status for this project
   - Recommendation: Verify license before using SplitText in production

3. **Scroll-Linked Animations Performance**
   - What we know: Heavy scroll animations can cause jank
   - What's unclear: Optimal number of concurrent ScrollTriggers
   - Recommendation: Profile during implementation, batch animations

## Sources

### Primary (HIGH confidence)
- Codebase: `src/lib/gsap/index.ts` - GSAP plugin registration
- Codebase: `src/lib/hooks/useScrollDirection.ts` - Scroll detection implementation
- Codebase: `src/components/layouts/PageTransition.tsx` - Existing transition system
- Codebase: `src/components/layout/header.tsx` - V7 header scroll effects
- Codebase: `src/design-system/tokens/z-index.ts` - Z-index layer system

### Secondary (MEDIUM confidence)
- Codebase patterns: MobileNav.tsx swipe gestures, route change handling
- Codebase patterns: CustomerLayout.tsx app shell structure

### Tertiary (LOW confidence)
- Training data: Next.js 15 View Transitions API (needs verification)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in package.json and working
- Architecture: HIGH - Following existing codebase patterns
- Pitfalls: HIGH - Documented from existing code and common issues

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - stable patterns)
