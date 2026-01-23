# Phase 2: Overlay Infrastructure - Research

**Researched:** 2026-01-22
**Domain:** Portal-based overlays, animation systems (Framer Motion/GSAP), focus management, route-aware cleanup
**Confidence:** HIGH

## Summary

Phase 2 builds the overlay component system (modals, drawers, sheets, dropdowns, toasts) that prevents click-blocking and resets on route changes. The codebase already has substantial overlay infrastructure from V5 Sprint 5 that provides excellent patterns to follow and extend.

Key findings:
- **Existing Modal component** (`src/components/ui/Modal.tsx`): Production-grade with portal, focus trap, escape key, backdrop click, nested modal support, and swipe-to-close. Uses Framer Motion spring physics. This is the template.
- **Existing drawer** (`src/components/ui/drawer.tsx`): Radix-based Vaul drawer with Tailwind styling. Functional but not animation-rich.
- **Swipe gesture system** (`src/lib/swipe-gestures.ts`): Complete hooks for swipe-to-close, swipe-to-delete with haptic feedback. Ready to use.
- **Route-aware cleanup**: Pattern exists in codebase using `usePathname` but overlays do NOT currently close on route change. This is a gap.
- **Z-index tokens**: Phase 1 established `z-index.ts` with proper layer values. Use `zIndex.modal`, `zIndexVar.modal`, `zClass.modal`.

**Primary recommendation:** Build new overlay primitives using existing Modal.tsx as the reference implementation. Add route-change cleanup hook. Use Framer Motion for overlays (spring physics, AnimatePresence), reserve GSAP for scroll-driven content animations.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-dom` | 19.2.3 | `createPortal` for overlay mounting | Built-in, zero overhead |
| `framer-motion` | 12.26.1 | Spring animations, AnimatePresence exit animations | Already used extensively in codebase |
| `@radix-ui/react-dialog` | ^1.1 | Accessible dialog primitive | Production accessibility out of box |
| `@radix-ui/react-dropdown-menu` | ^2.1 | Accessible dropdown primitive | Keyboard nav, aria, focus management |
| `@radix-ui/react-tooltip` | ^1.1 | Accessible tooltip primitive | Delay, collision detection |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vaul` | ^1.1 | Mobile drawer component | Already installed; use for bottom sheet basis |
| `sonner` | ^2.0 | Toast notification system | Consider for toast infrastructure |
| `focus-trap-react` | ^10.3 | Focus trapping (if Radix insufficient) | Complex nested focus scenarios |

### Already in Use

| Library | Version | Purpose |
|---------|---------|---------|
| `framer-motion` | 12.26.1 | Primary animation library for components |
| `vaul` | (installed) | Drawer component (Radix-based) |
| `@radix-ui/*` | various | UI primitives (dialog, dropdown already present) |
| `lucide-react` | ^0.469 | Icons (X close button, etc.) |

### Animation Strategy

| Use Case | Library | Reason |
|----------|---------|--------|
| Overlay open/close | Framer Motion | Spring physics, AnimatePresence handles exit |
| Backdrop fade | Framer Motion | Simple opacity transitions |
| Swipe gestures | Framer Motion | Built-in drag support via existing hooks |
| Scroll-driven reveals | GSAP ScrollTrigger | Not needed for overlays |

**Installation:**
```bash
# Already installed - verify versions
pnpm list framer-motion @radix-ui/react-dialog vaul

# If missing toast library
pnpm add sonner
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   └── ui-v8/                    # New overlay components (V8 = fresh start)
│       ├── overlay/
│       │   ├── Portal.tsx        # Base portal with route-aware cleanup
│       │   ├── Backdrop.tsx      # Reusable animated backdrop
│       │   ├── FocusTrap.tsx     # Focus management wrapper
│       │   └── index.ts          # Barrel export
│       ├── Modal.tsx             # Full-screen centered dialog
│       ├── BottomSheet.tsx       # Mobile slide-up with swipe
│       ├── Drawer.tsx            # Side-slide panel
│       ├── Dropdown.tsx          # Positioned menu
│       ├── Tooltip.tsx           # Hover info
│       └── Toast.tsx             # Notification stack
├── lib/
│   └── hooks/
│       ├── useOverlayClose.ts    # Route-aware overlay cleanup
│       ├── useBodyScrollLock.ts  # Prevent background scroll
│       └── useFocusTrap.ts       # Focus management
└── design-system/
    └── tokens/
        ├── z-index.ts            # EXISTS: z-index layer constants
        └── motion.ts             # NEW: shared spring/timing tokens
```

### Pattern 1: Route-Aware Overlay Cleanup

**What:** Close all overlays when pathname changes
**When to use:** Every overlay component
**Why needed:** Current overlays do NOT close on route change (identified gap)

```typescript
// src/lib/hooks/useOverlayClose.ts
"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Close overlay when route changes.
 * Call onClose when pathname differs from when overlay opened.
 */
export function useRouteChangeClose(
  isOpen: boolean,
  onClose: () => void
): void {
  const pathname = usePathname();
  const openedPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store pathname when overlay opens
      openedPathnameRef.current = pathname;
    }
  }, [isOpen, pathname]);

  useEffect(() => {
    // Close if pathname changed after opening
    if (
      isOpen &&
      openedPathnameRef.current !== null &&
      pathname !== openedPathnameRef.current
    ) {
      onClose();
      openedPathnameRef.current = null;
    }
  }, [isOpen, pathname, onClose]);
}
```

### Pattern 2: Portal with Automatic Cleanup

**What:** Portal wrapper that handles SSR and cleanup
**When to use:** Base for all overlays

```typescript
// src/components/ui-v8/overlay/Portal.tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: ReactNode;
  /** Portal mount target (default: document.body) */
  container?: Element | null;
}

export function Portal({ children, container }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const target = container ?? document.body;
  return createPortal(children, target);
}
```

### Pattern 3: Shared Motion Tokens

**What:** Consistent spring physics across all overlays
**When to use:** Every overlay animation

```typescript
// src/design-system/tokens/motion.ts
// Overlay-specific motion tokens

export const overlayMotion = {
  /** Modal/dialog open spring */
  modalOpen: {
    type: "spring" as const,
    damping: 25,
    stiffness: 300,
  },
  /** Modal close (faster, no bounce) */
  modalClose: {
    duration: 0.2,
    ease: "easeIn" as const,
  },
  /** Bottom sheet slide up */
  sheetOpen: {
    type: "spring" as const,
    damping: 30,
    stiffness: 300,
  },
  /** Drawer slide in */
  drawerOpen: {
    type: "spring" as const,
    damping: 25,
    stiffness: 300,
  },
  /** Backdrop fade */
  backdrop: {
    duration: 0.2,
    ease: "easeOut" as const,
  },
  /** Dropdown scale+fade */
  dropdown: {
    type: "spring" as const,
    damping: 20,
    stiffness: 400,
  },
  /** Tooltip fast appear */
  tooltip: {
    duration: 0.15,
    ease: "easeOut" as const,
  },
  /** Toast slide in */
  toast: {
    type: "spring" as const,
    damping: 20,
    stiffness: 300,
  },
} as const;

// CSS variable equivalents for backdrop blur etc.
export const overlayCSSVars = {
  backdropBlur: "var(--blur-md, 8px)",
  backdropColor: "rgba(26, 26, 26, 0.5)",
  backdropColorDark: "rgba(0, 0, 0, 0.6)",
} as const;
```

### Pattern 4: Backdrop Without Click Blocking

**What:** Backdrop that dismisses on click but doesn't block content when closed
**When to use:** Modal, drawer, bottom sheet
**Critical:** No `pointer-events: none` on entire overlay; backdrop only visible when open

```typescript
// Correct: Backdrop only exists when modal is open
<AnimatePresence>
  {isOpen && (
    <>
      {/* Backdrop: click dismisses, no blocking when closed */}
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        style={{ zIndex: zIndex.modalBackdrop }}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      {/* Content: stop propagation to prevent backdrop click */}
      <motion.div
        onClick={(e) => e.stopPropagation()}
        style={{ zIndex: zIndex.modal }}
        {...contentAnimationProps}
      >
        {children}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

### Pattern 5: Dropdown Without Event Swallowing

**What:** Dropdown that doesn't intercept form submissions or parent clicks
**When to use:** Any dropdown in interactive context
**Critical issue:** V7 dropdowns swallow clicks, breaking forms

```typescript
// src/components/ui-v8/Dropdown.tsx
// Key: Use Radix's asChild pattern and proper event handling

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export function Dropdown({ trigger, children }: DropdownProps) {
  return (
    <DropdownMenu.Root>
      {/* asChild: trigger is YOUR button, not wrapper */}
      <DropdownMenu.Trigger asChild>
        {trigger}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-popover"
          sideOffset={4}
          // CRITICAL: Don't capture events outside menu
          onPointerDownOutside={(e) => {
            // Allow form submissions etc.
          }}
          // CRITICAL: Don't prevent scroll
          onInteractOutside={(e) => {
            // Let parent handle interaction
          }}
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
```

### Anti-Patterns to Avoid

| Anti-Pattern | Why Bad | Instead |
|--------------|---------|---------|
| `pointer-events: none` on closed modal wrapper | Invisible overlay still blocks clicks | Remove from DOM with `AnimatePresence` |
| Global event listeners without cleanup | Memory leaks, double-firing | Use useEffect cleanup, useCallback stable refs |
| Hardcoded z-index in overlay | Layer conflicts | Use `zIndex.modal`, `zIndexVar.modal` tokens |
| `overflow: hidden` on body without restoration | Scroll position lost, stuck state | Use body scroll lock hook with cleanup |
| Focus trap without initial focus | Focus jumps unexpectedly | Explicit `initialFocusRef` or first focusable |
| Dropdown stopPropagation on all clicks | Breaks form submissions in menus | Only stop on menu item selection |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trapping | Manual tab key handler | Radix dialog / focus-trap-react | Edge cases: shadow DOM, dynamic content |
| Accessible dialog | DIY aria attributes | Radix Dialog | Keyboard nav, screen reader announcements |
| Click outside detection | Manual event listener | Radix primitives / Floating UI | Portal-aware, handles nested dialogs |
| Body scroll lock | `overflow: hidden` only | Proper scroll lock hook | Preserves scroll position, handles iOS quirks |
| Spring physics | Manual JS spring | Framer Motion spring | GPU-accelerated, handles interrupts |
| Dropdown positioning | Manual positioning | Radix / Floating UI | Collision detection, viewport awareness |

**Key insight:** Focus management and accessibility in overlays have massive edge case surface area (nested dialogs, shadow DOM, dynamic content, screen readers). Radix primitives handle these.

## Common Pitfalls

### Pitfall 1: Click Blocking When Overlay Closed

**What goes wrong:** Invisible overlay div still captures click events
**Why it happens:** Overlay markup in DOM with `opacity: 0` but `pointer-events: auto`
**How to avoid:** Use `AnimatePresence` to fully remove from DOM after exit animation
```tsx
<AnimatePresence>
  {isOpen && <OverlayContent />}  {/* Removed from DOM when closed */}
</AnimatePresence>
```
**Warning signs:** Clicks on page don't work after closing modal

### Pitfall 2: Form Submission Swallowed by Dropdown

**What goes wrong:** Clicking submit button inside dropdown form does nothing
**Why it happens:** Dropdown captures click, calls `e.stopPropagation()` or `e.preventDefault()`
**How to avoid:** Only stop propagation on menu item selection, not all interactions
**Warning signs:** Forms inside dropdowns don't submit

### Pitfall 3: Overlay Persists After Navigation

**What goes wrong:** Modal still visible after clicking link inside it
**Why it happens:** No route change listener; state persists across navigation
**How to avoid:** Use `useRouteChangeClose` hook in all overlays
```tsx
useRouteChangeClose(isOpen, onClose);
```
**Warning signs:** User sees modal + new page content

### Pitfall 4: Scroll Position Jump on Modal Open

**What goes wrong:** Page scrolls to top when modal opens/closes
**Why it happens:** Body scroll lock removes scroll position without storing it
**How to avoid:** Store `window.scrollY` before lock, restore after unlock
```tsx
// From existing Modal.tsx - correct pattern
const scrollY = window.scrollY;
document.body.style.position = "fixed";
document.body.style.top = `-${scrollY}px`;
// ... on cleanup
window.scrollTo(0, scrollY);
```
**Warning signs:** Page jumps to top when modal opens

### Pitfall 5: Toast Stack Z-Index Collision

**What goes wrong:** Toasts appear behind modal
**Why it happens:** Toast z-index lower than modal
**How to avoid:** Toasts at highest layer: `zIndex.toast` (80) > `zIndex.modal` (50)
**Warning signs:** Toast notifications hidden behind modals

### Pitfall 6: Backdrop Blur Performance

**What goes wrong:** Janky animation with backdrop-blur
**Why it happens:** Blur is expensive; animating blur property causes repaints
**How to avoid:** Never animate blur value. Apply blur at start, only animate opacity
```tsx
// WRONG: animate blur
<motion.div animate={{ backdropFilter: `blur(${isOpen ? 8 : 0}px)` }} />

// RIGHT: constant blur, animate opacity
<motion.div
  className="backdrop-blur-sm"
  animate={{ opacity: isOpen ? 1 : 0 }}
/>
```
**Warning signs:** Choppy backdrop animation on mid-range devices

## Code Examples

### Bottom Sheet with Swipe-to-Dismiss

```typescript
// Using existing useSwipeToClose hook
"use client";

import { type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Portal } from "./overlay/Portal";
import { useSwipeToClose, triggerHaptic } from "@/lib/swipe-gestures";
import { useRouteChangeClose } from "@/lib/hooks/useOverlayClose";
import { zIndex } from "@/design-system/tokens/z-index";
import { overlayMotion } from "@/design-system/tokens/motion";
import { cn } from "@/lib/utils/cn";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Height: 'auto' fits content, 'full' is 90vh */
  height?: "auto" | "full";
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  height = "auto",
}: BottomSheetProps) {
  // Close on route change
  useRouteChangeClose(isOpen, onClose);

  // Swipe down to dismiss
  const {
    motionProps: swipeProps,
    isDragging,
    dragOffset,
    backdropOpacity,
  } = useSwipeToClose({
    onClose: () => {
      triggerHaptic("light");
      onClose();
    },
    direction: "down",
    threshold: 150, // Higher threshold for sheets
  });

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              style={{
                zIndex: zIndex.modalBackdrop,
                opacity: isDragging ? backdropOpacity : 1,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={overlayMotion.backdrop}
              onClick={onClose}
            />

            {/* Sheet */}
            <motion.div
              className={cn(
                "fixed inset-x-0 bottom-0",
                "bg-white dark:bg-zinc-900",
                "rounded-t-3xl shadow-xl",
                "overflow-hidden",
                height === "full" && "h-[90vh]",
              )}
              style={{
                zIndex: zIndex.modal,
                y: isDragging ? dragOffset : 0,
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={overlayMotion.sheetOpen}
              onClick={(e) => e.stopPropagation()}
              {...swipeProps}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div
                  className={cn(
                    "w-12 h-1.5 rounded-full",
                    "bg-zinc-300 dark:bg-zinc-600",
                    isDragging && "bg-zinc-400 dark:bg-zinc-500",
                  )}
                />
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-3rem)] pb-safe">
                {children}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  );
}
```

### Toast Notification System

```typescript
// Toast using sonner or custom implementation
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Portal } from "./overlay/Portal";
import { zIndex } from "@/design-system/tokens/z-index";
import { overlayMotion } from "@/design-system/tokens/motion";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <Portal>
      <div
        className="fixed bottom-4 right-4 flex flex-col gap-2 pointer-events-none"
        style={{ zIndex: zIndex.toast }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={overlayMotion.toast}
              className="pointer-events-auto"
            >
              <ToastItem toast={toast} onDismiss={onDismiss} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Portal>
  );
}
```

### Side Drawer with Focus Trap

```typescript
"use client";

import { useRef, useEffect, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Portal } from "./overlay/Portal";
import { useRouteChangeClose } from "@/lib/hooks/useOverlayClose";
import { zIndex } from "@/design-system/tokens/z-index";
import { overlayMotion } from "@/design-system/tokens/motion";
import { cn } from "@/lib/utils/cn";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Which side drawer slides from */
  side?: "left" | "right";
  /** Width of drawer */
  width?: "sm" | "md" | "lg";
}

const widthClasses = {
  sm: "w-64",
  md: "w-80",
  lg: "w-96",
};

export function Drawer({
  isOpen,
  onClose,
  children,
  side = "right",
  width = "md",
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

  // Close on route change
  useRouteChangeClose(isOpen, onClose);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      lastActiveRef.current = document.activeElement as HTMLElement;
      // Focus first focusable in drawer
      const timer = setTimeout(() => {
        const first = drawerRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        first?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else if (lastActiveRef.current) {
      lastActiveRef.current.focus();
      lastActiveRef.current = null;
    }
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;

    const focusables = drawerRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables?.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  const slideFrom = side === "left" ? { x: "-100%" } : { x: "100%" };

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              style={{ zIndex: zIndex.modalBackdrop }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={overlayMotion.backdrop}
              onClick={onClose}
            />

            {/* Drawer */}
            <motion.div
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              onKeyDown={handleKeyDown}
              className={cn(
                "fixed inset-y-0 bg-white dark:bg-zinc-900 shadow-xl",
                side === "left" ? "left-0" : "right-0",
                widthClasses[width],
              )}
              style={{ zIndex: zIndex.modal }}
              initial={slideFrom}
              animate={{ x: 0 }}
              exit={slideFrom}
              transition={overlayMotion.drawerOpen}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS transitions for overlays | Framer Motion spring physics | 2023+ | Natural feel, interrupt handling |
| Manual focus trap | Radix primitives | Standard | Accessibility guaranteed |
| `display: none` toggle | AnimatePresence exit animations | Framer Motion standard | Smooth exit transitions |
| `document.body.style.overflow` | Proper scroll lock with position fixed | Best practice | No scroll jump, iOS support |
| React Portals only | Portal + Radix compound components | Modern | Accessibility + animation combined |

**Deprecated/outdated:**
- react-modal (now use Radix or Framer Motion based)
- react-overlays (low-level, Radix is better DX)
- body-scroll-lock package (has iOS bugs; use custom hook)

## Open Questions

1. **Toast Library Choice**
   - What we know: sonner is modern and popular; codebase has custom toast setup
   - What's unclear: Whether to use sonner or extend existing
   - Recommendation: Evaluate sonner; if similar to existing, keep custom for consistency

2. **Nested Modal Stacking**
   - What we know: Existing Modal.tsx has ModalStackContext for z-index stacking
   - What's unclear: Whether V8 overlays need cross-type stacking (modal in drawer)
   - Recommendation: Keep stack context pattern; extend for all overlay types

3. **Animation Preference Integration**
   - What we know: `useReducedMotion` hook exists, Modal uses it
   - What's unclear: How to apply consistently across all new overlays
   - Recommendation: Create shared `overlayVariants` that respect reduced motion

## Sources

### Primary (HIGH confidence)
- `src/components/ui/Modal.tsx` - Production reference implementation (734 lines)
- `src/lib/swipe-gestures.ts` - Complete swipe gesture system with hooks
- `src/lib/hooks/useReducedMotion.ts` - Motion preference system
- `src/design-system/tokens/z-index.ts` - Z-index token system from Phase 1
- Framer Motion documentation - AnimatePresence, spring physics
- Radix UI documentation - Dialog, Dropdown primitives

### Secondary (MEDIUM confidence)
- `src/components/ui/drawer.tsx` - Vaul-based drawer (simpler reference)
- `src/components/ui/dropdown-menu.tsx` - Radix dropdown patterns
- `src/components/ui/tooltip.tsx` - Radix tooltip patterns
- `src/components/ui/toast.tsx` - Existing toast implementation

### Codebase Verified (HIGH confidence)
- Route change pattern: `usePathname` in `src/app/providers.tsx`
- Portal usage: `createPortal` in Modal.tsx
- Spring values: damping 25, stiffness 300 used consistently
- Z-index values: modal=50, modalBackdrop=40, popover=60, tooltip=70, toast=80

## Metadata

**Confidence breakdown:**
- Portal infrastructure: HIGH - createPortal is React standard, verified in codebase
- Animation patterns: HIGH - Framer Motion extensively used, patterns proven
- Focus management: HIGH - Radix primitives well-documented
- Route cleanup: MEDIUM - Pattern identified but needs implementation
- Toast system: MEDIUM - Multiple options, decision needed
- Event handling: HIGH - Radix handles edge cases

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - stable patterns)
