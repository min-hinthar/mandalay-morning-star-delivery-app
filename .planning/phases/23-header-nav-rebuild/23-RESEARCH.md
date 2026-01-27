# Phase 23: Header & Nav Rebuild - Research

**Researched:** 2026-01-26
**Domain:** Header, Navigation, Command Palette, Gesture-based UI
**Confidence:** HIGH

## Summary

Phase 23 requires a complete rebuild of the header and navigation system with modern design patterns. The codebase already has substantial infrastructure for this phase:

1. **Existing scroll detection** via `useScrollDirection` hook - needs enhancement for velocity awareness
2. **Existing drawer primitives** via `ui-v8/Drawer` and swipe gestures via `useSwipeToClose`
3. **Existing motion tokens** with spring presets matching the playful UI aesthetic
4. **Theme toggle** already implemented with View Transitions API
5. **Cart drawer** and cart store already integrated

The main work involves:
- Enhancing scroll hook for velocity-aware header behavior
- Building new MobileDrawer with left-slide swipe-to-close
- Implementing cmdk-based command palette for menu search
- Creating multi-layered hover states for desktop nav
- Integrating all components into a cohesive AppHeader

**Primary recommendation:** Use `cmdk` library for command palette (already powers Linear/Raycast), enhance existing `useScrollDirection` with `useVelocity`, and extend existing Drawer component for mobile nav.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | ^12.26.1 | Animations, gestures, scroll | Already in project, provides useScroll/useVelocity |
| cmdk | ^1.0.0+ | Command palette | Used by Linear, Raycast; headless, accessible |
| next-themes | ^0.4.6 | Theme switching | Already in project |
| zustand | ^5.0.10 | State management | Already in project for cart drawer |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.562.0 | Icons | Already in project, use for nav icons |
| vaul | ^1.1.2 | Drawer primitives | Already in project, basis for bottom sheet |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| cmdk | react-cmdk | react-cmdk is pre-styled; cmdk is headless (better for custom design) |
| framer-motion gestures | @use-gesture/react | Already have use-gesture installed but framer gestures integrate better with motion |

**Installation:**
```bash
pnpm add cmdk
```

## Architecture Patterns

### Recommended Component Structure
```
src/components/
  layout/
    AppHeader/
      AppHeader.tsx         # Main export, combines all pieces
      DesktopHeader.tsx     # Desktop-specific layout
      MobileHeader.tsx      # Mobile-specific layout
      HeaderNavLink.tsx     # Desktop nav link with multi-layer hover
      HamburgerButton.tsx   # Morphing hamburger (existing MorphingMenu)
      CartIndicator.tsx     # Cart icon + badge with animations
      AccountIndicator.tsx  # Avatar/initials + dropdown
      SearchTrigger.tsx     # Search icon with Cmd+K hint
      index.ts
    MobileDrawer/
      MobileDrawer.tsx      # Drawer sliding from left
      DrawerNavLink.tsx     # Touch-friendly nav item
      DrawerUserSection.tsx # User avatar/name section
      DrawerFooter.tsx      # Social/contact links
      index.ts
    CommandPalette/
      CommandPalette.tsx    # Main cmdk wrapper
      SearchInput.tsx       # Styled input
      SearchResults.tsx     # Results list with thumbnails
      SearchEmptyState.tsx  # Empty/popular suggestions
      index.ts
  hooks/
    useScrollDirection.ts   # Enhance existing with velocity
    useCommandPalette.ts    # Open/close state, keyboard shortcut
    useHeaderVisibility.ts  # Combined scroll + overlay logic
```

### Pattern 1: Velocity-Aware Scroll Hook
**What:** Enhance scroll direction detection with velocity for instant vs gradual animations
**When to use:** Header hide/show behavior
**Example:**
```typescript
// Source: Framer Motion useVelocity documentation
import { useScroll, useVelocity, useMotionValueEvent } from "framer-motion";

export function useScrollDirectionWithVelocity(options = {}) {
  const { threshold = 50, velocityThreshold = 300 } = options;
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);

  const [state, setState] = useState({
    direction: "idle",
    isCollapsed: false,
    isFastScroll: false
  });

  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = scrollY.getPrevious() ?? 0;
    const velocity = scrollVelocity.get();
    const isFast = Math.abs(velocity) > velocityThreshold;

    if (current <= threshold) {
      setState({ direction: "idle", isCollapsed: false, isFastScroll: false });
      return;
    }

    const diff = current - previous;
    const direction = diff > 0 ? "down" : "up";
    const isCollapsed = diff > 0;

    setState({ direction, isCollapsed, isFastScroll: isFast });
  });

  return state;
}
```

### Pattern 2: cmdk Command Palette
**What:** Headless command palette with filtering and keyboard nav
**When to use:** Menu item search
**Example:**
```typescript
// Source: cmdk GitHub README
import { Command } from "cmdk";

export function CommandPalette({ open, onOpenChange, menuItems }) {
  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Search menu items"
    >
      <Command.Input placeholder="Search menu..." />
      <Command.List>
        <Command.Empty>No items found</Command.Empty>
        <Command.Group heading="Menu Items">
          {menuItems.map((item) => (
            <Command.Item
              key={item.id}
              value={item.name}
              onSelect={() => navigate(`/menu/${item.slug}`)}
            >
              <img src={item.imageUrl} className="w-8 h-8 rounded" />
              <span>{item.name}</span>
              <span className="text-muted">{formatPrice(item.price)}</span>
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
```

### Pattern 3: Left-Slide Drawer with Swipe
**What:** Mobile nav drawer that slides from left and closes via swipe gesture
**When to use:** Mobile navigation
**Example:**
```typescript
// Source: Existing useSwipeToClose in codebase + Framer Motion drag
import { useSwipeToClose } from "@/lib/swipe-gestures";

export function MobileDrawer({ isOpen, onClose, children }) {
  const {
    motionProps,
    isDragging,
    dragOffset
  } = useSwipeToClose({
    onClose,
    direction: "left", // Swipe left to close
    threshold: 100,
  });

  return (
    <motion.div
      initial={{ x: "-100%" }}
      animate={{ x: isOpen ? 0 : "-100%" }}
      exit={{ x: "-100%" }}
      transition={spring.default}
      {...motionProps}
      style={{ x: isDragging ? dragOffset : undefined }}
      className="fixed left-0 top-0 bottom-0 w-[85%] max-w-sm"
    >
      {children}
    </motion.div>
  );
}
```

### Anti-Patterns to Avoid
- **Don't use CSS transitions for scroll-linked animations:** Use Framer Motion's spring physics for natural feel
- **Don't debounce scroll events excessively:** The existing useScrollDirection already uses RAF and throttling
- **Don't couple header visibility to route changes:** Keep scroll state separate from navigation
- **Don't use native Drawer for left-slide:** Build custom with Framer Motion for swipe gesture support

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Command palette filtering | Custom fuzzy search | cmdk's built-in filtering | Uses command-score, handles edge cases |
| Keyboard navigation | Manual focus management | cmdk's built-in nav | Accessible, handles wrap-around |
| Scroll velocity | Manual velocity calc | useVelocity from framer-motion | Already optimized, integrates with springs |
| Body scroll lock | Manual overflow toggle | useBodyScrollLock hook | Already exists in codebase, handles iOS |
| Focus trap | Manual Tab handling | Existing Drawer focus trap | Already implemented correctly |
| Hamburger animation | Custom SVG animation | MorphingMenu component | Already exists with variants |
| Theme transition | Custom transition | useThemeTransition | View Transitions API already integrated |

**Key insight:** The codebase already has ~80% of the primitives needed. The work is primarily composition and enhancement, not new invention.

## Common Pitfalls

### Pitfall 1: iOS Safari Bounce Conflicts
**What goes wrong:** Body scroll lock doesn't prevent iOS Safari rubber-band bounce, causing visual glitches when drawer is open
**Why it happens:** iOS Safari has special overscroll behavior not handled by overflow:hidden
**How to avoid:** Use existing `useBodyScrollLock` which handles iOS specifically with position:fixed
**Warning signs:** Drawer content bounces unexpectedly, background scrolls behind drawer

### Pitfall 2: Header Z-Index Wars
**What goes wrong:** Header, drawer, command palette, and cart drawer fight for z-index priority
**Why it happens:** Multiple fixed/modal elements without coordinated layering
**How to avoid:** Use existing `zIndex` tokens from design-system: fixed(30), modalBackdrop(40), modal(50)
**Warning signs:** Elements appearing behind or above when shouldn't

### Pitfall 3: Scroll Position Reset on Route Change
**What goes wrong:** Header state (collapsed/expanded) resets unexpectedly on navigation
**Why it happens:** Component remounts or scroll position resets
**How to avoid:** Store scroll state in ref/state that persists across route changes; use `scroll: false` in Link when needed
**Warning signs:** Header jumps visible on every navigation

### Pitfall 4: Mobile Tap-Through Issues
**What goes wrong:** Taps on drawer backdrop trigger elements behind it
**Why it happens:** Backdrop click handler doesn't stop propagation correctly
**How to avoid:** Use stopPropagation on drawer content, ensure backdrop has pointer-events
**Warning signs:** Clicking backdrop closes drawer AND triggers something behind

### Pitfall 5: Cmd+K Conflicts
**What goes wrong:** Browser or OS intercepts Cmd+K before app
**Why it happens:** Some browsers use Cmd+K for search bar focus
**How to avoid:** Use `e.preventDefault()` immediately; provide alternative trigger (click icon)
**Warning signs:** Keyboard shortcut works inconsistently across browsers

### Pitfall 6: Swipe Gesture Conflicts with Scroll
**What goes wrong:** Horizontal swipe to close drawer conflicts with vertical content scroll
**Why it happens:** Both gestures active simultaneously
**How to avoid:** Use `touchAction: "pan-y"` on drawer content; existing swipe hooks handle this
**Warning signs:** Scrolling content accidentally triggers drawer close

## Code Examples

Verified patterns from existing codebase and official sources:

### Multi-Layer Hover State (Desktop Nav)
```typescript
// Pattern: Combine icon animation + underline + background
// Source: Motion tokens + existing NavItem patterns
function DesktopNavLink({ href, label, icon }: NavLinkProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <Link href={href} className="relative group px-3 py-2 rounded-lg">
      {/* Background highlight */}
      <motion.span
        className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-hover:opacity-100"
        transition={{ duration: 0.15 }}
      />

      {/* Icon + label with lift */}
      <motion.span
        className="relative flex items-center gap-2"
        whileHover={shouldAnimate ? { y: -2 } : undefined}
        transition={getSpring(spring.snappy)}
      >
        <motion.span
          whileHover={shouldAnimate ? { rotate: [-5, 5, 0] } : undefined}
          transition={{ duration: 0.3 }}
        >
          {icon}
        </motion.span>
        {label}
      </motion.span>

      {/* Animated underline */}
      <motion.span
        className="absolute bottom-0 left-1/2 h-0.5 bg-primary rounded-full"
        initial={{ width: 0, x: "-50%" }}
        whileHover={{ width: "60%", x: "-50%" }}
        transition={getSpring(spring.ultraBouncy)}
      />
    </Link>
  );
}
```

### Cart Badge Animation
```typescript
// Pattern: Bounce badge + shake icon on add
// Source: cart-animation-store + motion tokens
const cartBadgeVariants = {
  initial: { scale: 0 },
  animate: { scale: 1 },
  bump: {
    scale: [1, 1.4, 1],
    transition: spring.rubbery
  }
};

const cartIconVariants = {
  shake: {
    rotate: [0, -8, 8, -8, 0],
    transition: { duration: 0.4 }
  }
};

function CartIndicator() {
  const { itemCount } = useCart();
  const { wasItemJustAdded } = useCartAnimationStore();

  return (
    <motion.button
      animate={wasItemJustAdded ? "shake" : undefined}
      variants={cartIconVariants}
    >
      <ShoppingBag className="w-5 h-5" />
      {itemCount > 0 && (
        <motion.span
          key={itemCount}
          variants={cartBadgeVariants}
          initial="initial"
          animate={wasItemJustAdded ? "bump" : "animate"}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-xs"
        >
          {itemCount}
        </motion.span>
      )}
    </motion.button>
  );
}
```

### Glassmorphism Header Background
```typescript
// Pattern: Consistent glass treatment with gradient accents
// Source: CONTEXT.md decisions + existing glass-menu-card pattern
const headerStyles = {
  // Glassmorphism base
  backgroundColor: "rgba(255, 255, 255, 0.75)",
  backdropFilter: "blur(30px)",
  WebkitBackdropFilter: "blur(30px)",

  // Border for depth
  borderBottom: "1px solid rgba(255, 255, 255, 0.2)",

  // Gradient shadow (top accent)
  boxShadow: `
    0 1px 0 rgba(164, 16, 52, 0.1),
    0 4px 20px -4px rgba(0, 0, 0, 0.1)
  `,
};

// Dark mode variant
const headerStylesDark = {
  backgroundColor: "rgba(24, 24, 27, 0.75)",
  backdropFilter: "blur(30px)",
  borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
  boxShadow: `
    0 1px 0 rgba(164, 16, 52, 0.2),
    0 4px 20px -4px rgba(0, 0, 0, 0.3)
  `,
};
```

### Velocity-Based Animation Duration
```typescript
// Pattern: Fast scroll = instant, slow scroll = gradual
// Source: Framer Motion useVelocity + motion tokens
function getHeaderTransition(isFastScroll: boolean) {
  if (isFastScroll) {
    return { duration: 0.1 }; // Near-instant
  }
  return spring.snappy; // Gradual spring
}

// Usage in header
<motion.header
  animate={{ y: isCollapsed ? -72 : 0 }}
  transition={getHeaderTransition(isFastScroll)}
/>
```

### Staggered Drawer Link Reveal
```typescript
// Pattern: 80ms stagger for link reveal
// Source: motion-tokens staggerContainer80
const drawerLinksVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08, // STAGGER_GAP
      delayChildren: 0.1,
    }
  }
};

const drawerLinkVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: spring.default
  }
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS scroll-behavior | Framer Motion useScroll | 2024 | Better spring physics, velocity access |
| Custom fuzzy search | cmdk with command-score | 2023 | Accessible, keyboard-friendly, tested |
| Fixed header always | Hide-on-scroll iOS pattern | 2024 | More screen real estate on mobile |
| Hamburger CSS transition | MorphingMenu spring | Already done | Playful, consistent with UI |

**Deprecated/outdated:**
- **react-headroom:** Replaced by native scroll hooks; adds unnecessary dependency
- **position: sticky + IntersectionObserver:** More complex than useScroll, less precise

## Open Questions

Things that couldn't be fully resolved:

1. **Header pinning during overlays**
   - What we know: Header should stay visible when cart drawer/command palette open
   - What's unclear: Should it pin at full height or shrunk height? Reset scroll state?
   - Recommendation: Pin at current height, reset `isCollapsed` to false while overlay open

2. **Theme toggle position in mobile drawer**
   - What we know: Needs to be accessible, not conflict with main nav
   - What's unclear: Top with user section? Bottom with social links? Inline?
   - Recommendation: Place in drawer header area near close button (matches Settings app pattern)

3. **Safe area handling specifics**
   - What we know: `pt-safe` class exists, iOS notch/Dynamic Island needs clearance
   - What's unclear: Exact padding values for all device variants
   - Recommendation: Use `env(safe-area-inset-top)` via Tailwind `pt-safe`, test on real devices

## Sources

### Primary (HIGH confidence)
- Framer Motion useScroll/useVelocity: https://motion.dev/docs/react-use-scroll
- cmdk GitHub: https://github.com/dip/cmdk - API, installation, patterns
- Existing codebase components: header.tsx, MobileNav.tsx, Drawer.tsx, useScrollDirection.ts

### Secondary (MEDIUM confidence)
- Frontend.fyi auto-hiding nav tutorial: https://www.frontend.fyi/tutorials/making-a-disappearing-sticky-navigation
- John Choura Medium article on hide/show header: https://johnchourajr.medium.com/show-hide-on-scroll-with-framer-motion-b6f937c2d662

### Tertiary (LOW confidence)
- iOS Safari swipe gesture behavior (needs device testing)
- Exact velocity thresholds for "fast" vs "slow" (needs user testing)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project or well-documented
- Architecture: HIGH - Clear patterns from existing codebase
- Hide-on-scroll: HIGH - Framer Motion docs explicit about useScroll/useVelocity
- Command palette: HIGH - cmdk is well-documented, used by major products
- Swipe gestures: HIGH - useSwipeToClose already implemented for "left" direction
- Pitfalls: MEDIUM - Some based on general experience, need validation

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (30 days - stable domain)

---

## Integration Points Summary

| Existing Component | How Phase 23 Uses It |
|--------------------|----------------------|
| `useScrollDirection` | Enhance with velocity via `useVelocity` |
| `MorphingMenu` | Use directly for hamburger button |
| `ui-v8/Drawer` | Reference for MobileDrawer patterns |
| `useSwipeToClose` | Use directly with `direction: "left"` |
| `ThemeToggle` | Use directly in header/drawer |
| `useCartDrawer` | Keep as-is for cart button behavior |
| `CartButtonV8` | Use directly or enhance with animation |
| `useAuth` | Use for account indicator state |
| `zIndex` tokens | Use for layering header/drawer/palette |
| `spring` tokens | Use snappy, ultraBouncy, rubbery presets |
| `staggerContainer80` | Use for drawer link reveal |
