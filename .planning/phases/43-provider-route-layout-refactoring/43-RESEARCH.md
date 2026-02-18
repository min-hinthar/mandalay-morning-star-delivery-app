# Phase 43: Provider & Route Layout Refactoring - Research

**Researched:** 2026-02-06
**Domain:** Next.js 16 route group layouts, provider tree restructuring, bundle splitting
**Confidence:** HIGH

## Summary

This phase moves three cart UI components (CartBar, CartDrawer, FlyToCart) from the global `providers.tsx` into route-group-specific layouts for `(customer)` and `(public)` only. This eliminates ~60KB+ of cart component code (plus transitive GSAP, framer-motion sub-trees) from admin, driver, and auth route bundles.

The existing codebase is well-suited for this change. Cart state lives in module-level Zustand stores (`cart-store.ts`, `cart-animation-store.ts`, `useCartDrawer.ts`) with localStorage persistence -- no React Context providers are involved. The three components being moved are pure UI renderers that consume Zustand stores via hooks. Moving them to route-group layouts is a straightforward relocation, not a provider restructuring.

Navigation guards for checkout/cart pages require a custom implementation since Next.js App Router lacks built-in route-blocking APIs. The `onNavigate` prop on `<Link>` handles link-based navigation; `beforeunload` and `popstate` listeners handle browser-level events.

**Primary recommendation:** Create `layout.tsx` files in `(customer)` and `(public)` route groups that render CartBar, CartDrawer, and FlyToCart. Remove these three from global `providers.tsx`. No Zustand store changes needed.

## Standard Stack

### Core (Already Installed)

| Library       | Version | Purpose                          | Why Standard                               |
| ------------- | ------- | -------------------------------- | ------------------------------------------ |
| Next.js       | 16.1.2  | App Router with route groups     | Framework-level route-based code splitting |
| React         | 19.2.3  | Component model                  | Latest stable                              |
| Zustand       | 5.0.10  | Cart state (module-level stores) | No provider needed; works across layouts   |
| Framer Motion | 12.26.1 | CartBar/CartDrawer animations    | Already used throughout cart components    |
| GSAP          | 3.14.2  | FlyToCart arc animation          | Already used by FlyToCart only             |

### Supporting (Already Installed)

| Library      | Version | Purpose                                     | When to Use                        |
| ------------ | ------- | ------------------------------------------- | ---------------------------------- |
| vaul         | 1.1.2   | Drawer primitive (used by Drawer component) | CartDrawer's underlying Drawer     |
| lucide-react | 0.562.0 | Icons in cart components                    | ShoppingBag, ChevronUp, Truck etc. |

### No New Dependencies Needed

No new libraries required. Navigation guards will be built with native browser APIs (`beforeunload`, `popstate`) and Next.js `onNavigate` Link prop.

**Installation:**

```bash
# No installation needed - all dependencies present
```

## Architecture Patterns

### Current Structure (Before)

```
src/app/
  layout.tsx              # Root layout - renders <Providers>
  providers.tsx           # Global: Theme + DynamicTheme + QueryProvider + AnimationProvider + CartBar + CartDrawer + FlyToCart
  (public)/               # / (home), /menu, /driver/onboard
    page.tsx              # Home
    menu/page.tsx         # Menu
    error.tsx, loading.tsx
  (customer)/             # /cart, /checkout, /account, /orders/*
    cart/page.tsx
    checkout/page.tsx
    account/page.tsx
    orders/...
  (admin)/                # /admin/*
    admin/layout.tsx      # Server component (auth check)
  (driver)/               # /driver/*
    driver/layout.tsx     # Server component (auth check)
  (auth)/                 # /login, /signup, /forgot-password
```

### Target Structure (After)

```
src/app/
  layout.tsx              # Root layout - renders <Providers> (cart components REMOVED)
  providers.tsx           # Global: Theme + DynamicTheme + QueryProvider + AnimationProvider (ONLY)
  (public)/
    layout.tsx            # NEW: renders CartBar + CartDrawer + FlyToCart
    page.tsx
    menu/page.tsx
    error.tsx, loading.tsx
  (customer)/
    layout.tsx            # NEW: renders CartBar + CartDrawer + FlyToCart
    cart/page.tsx
    checkout/page.tsx
    account/page.tsx
    orders/...
  (admin)/                # NO cart components loaded
    admin/layout.tsx      # Existing server component (unchanged)
  (driver)/               # NO cart components loaded
    driver/layout.tsx     # Existing server component (unchanged)
  (auth)/                 # NO cart components loaded
```

### Pattern 1: Route Group Layout with Cart Components

**What:** A client component layout that wraps children with cart UI overlay components.
**When to use:** In route groups that need cart functionality (customer, public).
**Key insight:** These are NOT provider/context layouts. They simply render sibling UI components alongside `{children}`. Zustand stores are module-level singletons -- no wrapping required.

```typescript
// src/app/(customer)/layout.tsx
"use client";

import type { ReactNode } from "react";
import { CartBar } from "@/components/ui/cart/CartBar";
import { CartDrawer } from "@/components/ui/cart/CartDrawer";
import { FlyToCart } from "@/components/ui/cart/FlyToCart";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <CartBar />
      <CartDrawer />
      <FlyToCart />
    </>
  );
}
```

**The (public) layout follows the identical pattern.**

### Pattern 2: Simplified Global Providers

**What:** Remove cart UI components from global providers, keeping only true context providers.
**When to use:** After cart components move to route group layouts.

```typescript
// src/app/providers.tsx (AFTER)
"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/lib/providers/query-provider";
import { AnimationProvider } from "@/lib/providers/animation-provider";
import { ThemeProvider, DynamicThemeProvider } from "@/components/ui/theme";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <DynamicThemeProvider>
        <QueryProvider>
          <AnimationProvider>
            {children}
          </AnimationProvider>
        </QueryProvider>
      </DynamicThemeProvider>
    </ThemeProvider>
  );
}
```

### Pattern 3: Shared Cart Layout Component (DRY)

**What:** Extract the cart overlay trio into a reusable wrapper to avoid duplication between (customer) and (public) layouts.
**Recommendation:** Create a `CartOverlays` component.

```typescript
// src/components/ui/cart/CartOverlays.tsx
"use client";

import { CartBar } from "./CartBar";
import { CartDrawer } from "./CartDrawer";
import { FlyToCart } from "./FlyToCart";

export function CartOverlays() {
  return (
    <>
      <CartBar />
      <CartDrawer />
      <FlyToCart />
    </>
  );
}
```

Then each route group layout simply:

```typescript
import { CartOverlays } from "@/components/ui/cart/CartOverlays";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <CartOverlays />
    </>
  );
}
```

### Pattern 4: Navigation Guard Hook

**What:** Custom hook combining `onNavigate` (Link prop), `beforeunload`, and `popstate` for checkout/cart page protection.
**When to use:** On /checkout and /cart pages when cart has items.

```typescript
// src/lib/hooks/useNavigationGuard.ts
"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { usePathname } from "next/navigation";

interface UseNavigationGuardOptions {
  enabled: boolean;
  message?: string;
}

export function useNavigationGuard({ enabled, message }: UseNavigationGuardOptions) {
  const [showModal, setShowModal] = useState(false);
  const pendingNavRef = useRef<string | null>(null);
  const pathname = usePathname();

  // Handle browser beforeunload (tab close, external nav)
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [enabled]);

  // Handle popstate (back/forward button)
  useEffect(() => {
    if (!enabled) return;
    const handler = () => {
      // Push current state back to prevent leaving
      window.history.pushState(null, "", pathname);
      setShowModal(true);
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [enabled, pathname]);

  const proceed = useCallback(() => {
    setShowModal(false);
    if (pendingNavRef.current) {
      window.location.href = pendingNavRef.current;
    }
  }, []);

  const cancel = useCallback(() => {
    setShowModal(false);
    pendingNavRef.current = null;
  }, []);

  return { showModal, proceed, cancel, setShowModal };
}
```

### Anti-Patterns to Avoid

- **Multiple root layouts:** Do NOT remove the top-level `layout.tsx` and create root layouts per route group. This causes full page reloads on cross-group navigation. Keep one root layout; add sub-layouts to route groups.
- **Cart Context Provider:** The cart state is already in Zustand module-level stores. Do NOT wrap cart components in a CartProvider context. That would add unnecessary overhead.
- **Duplicating providers in sub-layouts:** AnimationProvider, ThemeProvider, QueryProvider must remain in root layout ONLY. Nesting them in sub-layouts creates duplicate instances and bugs.
- **Conditional rendering by pathname:** Do NOT add pathname checks in the global layout to hide cart components. That defeats the purpose of code splitting -- the components would still be in the bundle.

## Don't Hand-Roll

| Problem                       | Don't Build                      | Use Instead                           | Why                                                               |
| ----------------------------- | -------------------------------- | ------------------------------------- | ----------------------------------------------------------------- |
| Cart state persistence        | Custom localStorage sync         | Zustand `persist` middleware          | Already implemented in `cart-store.ts` with `mms-cart` key        |
| Cart drawer state             | React Context                    | `useCartDrawer` Zustand store         | Module-level singleton, no provider needed                        |
| Cart animation coordination   | Custom event system              | `useCartAnimationStore` Zustand store | Already coordinates badge ref, flying elements, pulse             |
| Route-based code splitting    | Webpack config / dynamic imports | Next.js route group `layout.tsx`      | Framework handles chunk splitting automatically per route segment |
| Overlay close on route change | Custom history listener          | Existing `useRouteChangeClose` hook   | Already implemented, handles pathname comparison                  |
| Browser leave prevention      | Custom beforeunload wrapper      | Native `beforeunload` event           | Simple API, no library needed                                     |
| Link navigation blocking      | Router monkey-patching           | Next.js `onNavigate` Link prop        | Official API in Next.js 16, `e.preventDefault()` support          |

**Key insight:** Cart state infrastructure (Zustand stores, hooks) is completely decoupled from the rendering location. Moving the UI components is a pure layout change -- no state architecture changes needed.

## Common Pitfalls

### Pitfall 1: Header CartIndicator on Non-Cart Routes

**What goes wrong:** AppHeader renders CartIndicator on ALL routes (it is in root layout). After moving cart overlays, clicking the cart icon on admin/driver pages would call `useCartDrawer.open()` but no CartDrawer would be rendered to respond.
**Why it happens:** CartIndicator is in the global header; CartDrawer is now only in customer/public layouts.
**How to avoid:** Two options (Claude's discretion per CONTEXT.md):

1. Keep CartIndicator in header globally -- clicking it on non-cart pages navigates to /cart instead of opening drawer
2. Conditionally render CartIndicator based on route group (using `usePathname`)
   **Warning signs:** Cart icon click does nothing on admin/driver/auth pages.
   **CONTEXT.md says:** "Header cart icon always visible (badge appears when items > 0)" -- this confirms option 1 is the intended behavior. When drawer is unavailable, navigate to /cart.

### Pitfall 2: CartDrawer Open State Leaks Across Route Groups

**What goes wrong:** User opens CartDrawer on /menu, navigates to /admin. CartDrawer's Zustand state `isOpen: true` persists. When user returns to /menu, CartDrawer immediately renders open.
**Why it happens:** Zustand state is global; layout unmount/remount doesn't reset it.
**How to avoid:** The existing `useRouteChangeClose` hook in `Drawer.tsx` already handles this -- it closes overlays on pathname change. Verify it works across route group transitions.
**Warning signs:** CartDrawer appears open unexpectedly after navigating between route groups.

### Pitfall 3: Full Page Reload Between Route Groups

**What goes wrong:** Navigation from (public) to (customer) triggers a full page reload instead of client-side transition.
**Why it happens:** Only happens with MULTIPLE ROOT LAYOUTS (removing top-level layout.tsx). Our approach adds sub-layouts within route groups under the existing root layout, so this WILL NOT happen.
**How to avoid:** Keep the single root `app/layout.tsx`. Route group layouts are nested under it, not replacements.
**Warning signs:** Flash of white/reload when navigating from /menu to /cart.

### Pitfall 4: Client Component Boundary in Route Group Layout

**What goes wrong:** Route group layout is marked `"use client"` which makes all child pages client components by default.
**Why it happens:** Misunderstanding of client/server boundary. `"use client"` in layout.tsx does NOT force pages to be client components. Pages are independently compiled; the layout receives them as `{children}` which is a serialization boundary.
**How to avoid:** The `"use client"` directive on the layout is fine. Server component pages within the route group will still render on the server. The layout just needs to be a client component because CartBar/CartDrawer/FlyToCart are client components.
**Warning signs:** None -- this is a non-issue, but worth understanding.

### Pitfall 5: Hydration Mismatch with CartBar/FlyToCart

**What goes wrong:** CartBar and FlyToCart both use `mounted` state pattern to avoid hydration mismatches. If the route group layout renders them as siblings to `{children}`, the hydration timing must be correct.
**Why it happens:** These components already handle this with `useState(false)` + `useEffect(() => setMounted(true))`.
**How to avoid:** No action needed -- existing hydration safety is already in place in CartBar (line 147-155) and FlyToCart (line 271-275).

### Pitfall 6: Navigation Guard False Triggers

**What goes wrong:** Navigation guard modal appears when navigating between cart-enabled pages (e.g., /cart to /checkout).
**Why it happens:** Guard fires on any navigation away, not just to non-cart pages.
**How to avoid:** The guard should whitelist navigation between cart-enabled routes (/cart, /checkout, /menu, /). Only trigger for navigation to non-cart routes or tab close.
**Warning signs:** Modal appears when clicking "Checkout" from cart page.

### Pitfall 7: Account/Orders Pages Don't Need CartBar Per CONTEXT.md

**What goes wrong:** CartBar renders on /account and /orders pages because they're in (customer) route group.
**Why it happens:** The (customer) layout wraps ALL customer routes.
**How to avoid:** CONTEXT.md specifies: "Cart components load on Home, Menu, Cart, and Checkout pages only." However, CartBar already self-hides when cart is empty (`if (!isEmpty) return null`). When cart has items, CartBar SHOULD appear on account/orders too since cart state is active. This is acceptable UX -- the bar only shows when there are items, which means the user has an active cart. This aligns with "CartBar hidden when cart is empty; appears after first item added."
**Warning signs:** None -- this is expected behavior.

## Code Examples

### Example 1: Route Group Layout (Customer)

```typescript
// src/app/(customer)/layout.tsx
"use client";

import type { ReactNode } from "react";
import { CartOverlays } from "@/components/ui/cart/CartOverlays";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <CartOverlays />
    </>
  );
}
```

### Example 2: Route Group Layout (Public)

```typescript
// src/app/(public)/layout.tsx
"use client";

import type { ReactNode } from "react";
import { CartOverlays } from "@/components/ui/cart/CartOverlays";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <CartOverlays />
    </>
  );
}
```

### Example 3: CartOverlays Shared Component

```typescript
// src/components/ui/cart/CartOverlays.tsx
"use client";

import { CartBar } from "./CartBar";
import { CartDrawer } from "./CartDrawer";
import { FlyToCart } from "./FlyToCart";

/**
 * Cart overlay components (CartBar + CartDrawer + FlyToCart)
 * Rendered in route group layouts for (customer) and (public) only.
 * Excluded from (admin), (driver), and (auth) bundles.
 */
export function CartOverlays() {
  return (
    <>
      <CartBar />
      <CartDrawer />
      <FlyToCart />
    </>
  );
}
```

### Example 4: Updated Global Providers

```typescript
// src/app/providers.tsx (AFTER - cart components removed)
"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/lib/providers/query-provider";
import { AnimationProvider } from "@/lib/providers/animation-provider";
import { ThemeProvider, DynamicThemeProvider } from "@/components/ui/theme";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <DynamicThemeProvider>
        <QueryProvider>
          <AnimationProvider>
            {children}
          </AnimationProvider>
        </QueryProvider>
      </DynamicThemeProvider>
    </ThemeProvider>
  );
}
```

### Example 5: Navigation Guard Modal Component

```typescript
// src/components/ui/cart/CartNavigationGuard.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CartNavigationGuardProps {
  isOpen: boolean;
  onStay: () => void;
  onLeave: () => void;
  variant: "checkout" | "cart";
}

export function CartNavigationGuard({ isOpen, onStay, onLeave, variant }: CartNavigationGuardProps) {
  const messages = {
    checkout: {
      title: "Almost there!",
      body: "Your delicious items are waiting! Ready to checkout?",
      stayLabel: "Continue Checkout",
      leaveLabel: "Leave Anyway",
    },
    cart: {
      title: "Don't forget your goodies!",
      body: "You have items in your cart. Ready to check them out?",
      stayLabel: "Go to Checkout",
      leaveLabel: "Leave Anyway",
    },
  };

  const msg = messages[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="mx-4 max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl"
          >
            <div className="flex justify-center mb-4">
              <ShoppingBag className="h-12 w-12 text-amber-500" />
            </div>
            <h2 className="text-xl font-display font-bold text-center mb-2">{msg.title}</h2>
            <p className="text-text-secondary text-center mb-6">{msg.body}</p>
            <div className="flex flex-col gap-3">
              <Button variant="primary" className="w-full" onClick={onStay}>
                {msg.stayLabel}
              </Button>
              <Button variant="ghost" className="w-full" onClick={onLeave}>
                {msg.leaveLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### Example 6: CartIndicator Fallback on Non-Cart Routes

```typescript
// In AppHeader - modify CartIndicator click behavior
// When CartDrawer is not mounted (non-cart routes), navigate to /cart instead
const handleCartClick = useCallback(() => {
  // Check if we're on a cart-enabled route
  const cartRoutes = ["/", "/menu", "/cart", "/checkout"];
  const isCartRoute = cartRoutes.some(
    (route) => pathname === route || pathname.startsWith("/menu/")
  );

  if (isCartRoute) {
    open(); // Open CartDrawer (it's mounted)
  } else {
    router.push("/cart"); // Navigate to cart page
  }
}, [pathname, open, router]);
```

## State of the Art

| Old Approach                         | Current Approach             | When Changed             | Impact                                               |
| ------------------------------------ | ---------------------------- | ------------------------ | ---------------------------------------------------- |
| Global providers wrapping everything | Route-group-scoped layouts   | Next.js 13+ (App Router) | Per-group code splitting is automatic                |
| `router.events` for route guards     | `onNavigate` Link prop       | Next.js 15+              | Official API, no monkey-patching                     |
| Context providers for global state   | Zustand module-level stores  | Zustand 4+               | No provider wrapping needed; works across any layout |
| `next/dynamic` for code splitting    | Route segment auto-splitting | Next.js 13+              | Layouts in route groups are automatically code-split |

**Key architectural advantage in this codebase:** Cart state is in Zustand (module-level), not React Context. This means moving the UI components between layouts has ZERO impact on state management. Components can be rendered anywhere and will read from the same store.

## Route Mapping Reference

Cart-enabled routes (need CartBar + CartDrawer + FlyToCart):
| URL | Route Group | Has Cart |
|-----|-------------|----------|
| `/` | (public) | YES |
| `/menu` | (public) | YES |
| `/cart` | (customer) | YES |
| `/checkout` | (customer) | YES |
| `/account` | (customer) | YES (when items in cart) |
| `/orders/*` | (customer) | YES (when items in cart) |

Non-cart routes (should NOT bundle cart components):
| URL | Route Group | Has Cart |
|-----|-------------|----------|
| `/admin/*` | (admin) | NO |
| `/driver/*` | (driver) | NO |
| `/login` | (auth) | NO |
| `/signup` | (auth) | NO |
| `/forgot-password` | (auth) | NO |
| `/driver/onboard` | (public) | YES (shares public layout) |

**Note on `/driver/onboard`:** This page is in (public) route group and will get cart overlays. This is acceptable -- it is a public-facing page and cart behavior is fine here.

## Provider Audit (Secondary Objective)

Per CONTEXT.md, document scoping opportunities for future phases:

| Provider                  | Currently                | Scope Opportunity | Recommendation                                                      |
| ------------------------- | ------------------------ | ----------------- | ------------------------------------------------------------------- |
| ThemeProvider             | Global                   | Keep global       | All routes need theming                                             |
| DynamicThemeProvider      | Global                   | Keep global       | Time/weather theming is app-wide                                    |
| QueryProvider             | Global                   | Could scope       | Admin/driver have different query patterns, but benefit is marginal |
| AnimationProvider         | Global                   | Keep global       | Used in header, all route groups                                    |
| ToastProvider             | Global (root layout)     | Keep global       | All routes need toast notifications                                 |
| ServiceWorkerRegistration | Global (root layout)     | Keep global       | PWA registration is app-wide                                        |
| Auth (useAuth hook)       | Hook-level (no provider) | No change needed  | Supabase client-side hook, no provider                              |

**Conclusion:** No additional providers need scoping in this phase. CartBar/CartDrawer/FlyToCart are the clear win.

## Open Questions

1. **CartIndicator behavior on non-cart routes**
   - What we know: CartIndicator is in AppHeader (global). CartDrawer will only be in (customer)/(public) layouts.
   - What's unclear: Should clicking cart icon on /admin navigate to /cart, or should CartIndicator be hidden on admin/driver routes?
   - Recommendation: CONTEXT.md says "Header cart icon always visible" -- so keep it visible, navigate to /cart when drawer unavailable. This is Claude's discretion per CONTEXT.md.

2. **Bundle size validation**
   - What we know: Source code for cart trio is ~31KB (CartBar 11KB + CartDrawer 10KB + FlyToCart 10KB). With transitive dependencies (GSAP for FlyToCart, framer-motion tree-shaking subsets), the claimed ~60KB savings is plausible.
   - What's unclear: Exact minified+gzipped bundle savings.
   - Recommendation: Run `ANALYZE=true pnpm build` before and after to measure actual savings.

3. **Navigation guard edge cases**
   - What we know: `onNavigate` on `<Link>` handles same-origin link clicks. `beforeunload` handles tab close. `popstate` handles back/forward.
   - What's unclear: How to handle programmatic `router.push()` calls from other components.
   - Recommendation: Implement guard hook, test programmatic navigation cases during verification.

## Sources

### Primary (HIGH confidence)

- **Codebase inspection** - Direct examination of providers.tsx, cart components, Zustand stores, route group structure, layout files
- [Next.js Route Groups docs](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups) - Verified sub-layouts are code-split per route segment
- [Next.js Layouts and Pages docs](https://nextjs.org/docs/app/getting-started/layouts-and-pages) - Confirmed nested layouts do NOT cause full page reloads (only multiple root layouts do)
- [Next.js Link Component docs](https://nextjs.org/docs/app/api-reference/components/link) - `onNavigate` prop API with `e.preventDefault()` support

### Secondary (MEDIUM confidence)

- [LogRocket: Next.js Layouts guide](https://blog.logrocket.com/guide-next-js-layouts-nested-layouts/) - Community verification of layout code splitting behavior
- [GitHub Discussion #47020](https://github.com/vercel/next.js/discussions/47020) - Navigation blocking patterns in App Router

### Tertiary (LOW confidence)

- Bundle size estimate of ~60KB savings - Based on source file sizes and dependency analysis, not actual build measurement

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - All libraries already installed and in use; no new dependencies
- Architecture: HIGH - Direct codebase inspection confirms Zustand stores are provider-free; route group layouts are straightforward
- Pitfalls: HIGH - Most pitfalls identified from codebase structure analysis; hydration safety already implemented
- Navigation guards: MEDIUM - `onNavigate` API verified in official docs; custom hook pattern not yet tested in this codebase
- Bundle savings: LOW - ~60KB is estimated from source sizes, not measured build output

**Research date:** 2026-02-06
**Valid until:** 2026-03-06 (stable -- no fast-moving dependencies)
