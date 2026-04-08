# Customer UI/UX Quality Audit

> Deep research across 4 parallel agents exploring customer pages, cart/checkout flow, design system, and data layer. Date: 2026-04-04.

---

## Critical Issues (Blocks Conversion / Broken UX)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| C1 | Cart page mobile white flash — `useEffect` redirect renders null before redirect fires | `src/app/(customer)/cart/page.tsx` | ~100ms blank screen on every mobile cart view |
| C2 | Checkout empty cart race condition — deep-link to `/checkout` with empty cart shows spinner then redirect loop | `src/app/(customer)/checkout/CheckoutClient.tsx` | Broken flow for direct links |
| C3 | Cutoff modal doesn't disable checkout button — order can submit while modal is showing | `CheckoutClient.tsx` | Race condition: order submitted after cutoff |
| C4 | Tracking map 50/50 split on mobile — map gets only 50% viewport height | `src/app/(customer)/orders/[id]/tracking/` | Unusable tracking on phones |
| C5 | Stripe session timeout has no error feedback | `PaymentStepV8.tsx` | Silent payment failure |
| C6 | Cart validation doesn't detect real-time price changes — only validates on hydration | `useCartValidation.ts` | Customer pays wrong price |
| C7 | Checkout form state lost on payment error — must re-enter address + time + contact | `checkout-store.ts` | Major friction after payment failure |
| C8 | Offline cart marked `pendingSync` but never actually syncs | `useCustomerOfflineSync.ts` | Data loss: customers think cart is saved |
| C9 | No retry logic on API failures — transient network error = permanent failure | All hooks | Orders fail on single network hiccup |
| C10 | Audio notification on tracking (vol 0.2) with no mute toggle | Tracking page | Interrupts users on calls |

## High-Priority Issues (Degraded Experience)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| H1 | Cart validation infinite spinner — no timeout if backend stalls | `CartPageContent.tsx` | Frozen UI on slow networks |
| H2 | Cold-start offline shows "Menu Coming Soon" — no cached menu | Menu page | Users think menu doesn't exist |
| H3 | Orders/Account pages have no loading skeletons — just RouteLoading spinner | Orders, Account pages | No content preview while loading |
| H4 | No inline form validation in checkout — errors only on submit | Address/Payment steps | Poor form UX |
| H5 | Tracking subscription drops silently — no reconnection banner | `useTrackingSubscription.ts` | Stale tracking data |
| H6 | Touch targets < 44px on Button sm (36px) and Input sm (36px) | `Button.tsx`, `Input.tsx` | WCAG 2.1 AA failure |
| H7 | Text-muted color (#5c5c5c) fails WCAG AA on secondary surfaces | `tokens.css` | Accessibility violation |
| H8 | No pagination on orders list or menu search | Orders page, search API | Performance on large datasets |
| H9 | Delivery gate doesn't auto-fetch config on initial load | `useDeliveryGate.ts` | Hydration mismatch risk |
| H10 | Polling doesn't stop on page hide (background tabs) | `useTrackingSubscription.ts` | Battery/bandwidth waste |

## Design System Issues

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| D1 | Dark mode coverage incomplete — surface/text colors lack `:dark()` selectors | `tokens.css` | Broken dark mode on some surfaces |
| D2 | Animation system fragmented — FM springs vs CSS transitions vs GSAP produce different feels | Components use mixed systems | Inconsistent interaction feel |
| D3 | Focus indicators vary — ring on Button/Card, shadow on Input, browser outline on Modal | Various components | Inconsistent keyboard navigation |
| D4 | Modal vs Dialog vs Drawer — 3 overlay APIs, no guidance on which to use | `Modal.tsx`, Dialog, `Drawer.tsx` | Developer confusion, inconsistent UX |
| D5 | Button "default" variant duplicates "primary" — ambiguous for developers | `Button.tsx` | Inconsistent usage across codebase |
| D6 | Legacy v6-prefixed color aliases still in Tailwind config | `tailwind.config.ts` lines 169-227 | Config clutter, confusion |
| D7 | Spring physics inconsistent — Button (stiffness 500), Modal (300), Input (none) | Motion tokens | Button clicks snappy, modals floaty, inputs rigid |
| D8 | Stagger delay classes hardcoded (.stagger-1 through .stagger-8) — unlinked to motion tokens | `animations.css` | Inconsistent stagger timing |
| D9 | No animation guidelines doc — when FM vs CSS vs GSAP, spring presets by use case | Missing | Ad-hoc animation decisions |
| D10 | 3+ loading state patterns (Skeleton, BrandedSpinner, LoadingWithTimeout) — no hierarchy | Various | Unclear which to use when |

## Data Layer Gaps

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| L1 | No optimistic updates on cart add/remove — full store recalculation | `cart-store.ts` | Laggy feel on rapid interactions |
| L2 | Menu search has no fuzzy matching — only substring ilike | `src/app/api/menu/search/route.ts` | Missed results on typos |
| L3 | Favorites stored in localStorage only — no cloud sync | Favorites system | Lost on device switch/uninstall |
| L4 | No query key factory — cache invalidation is ad-hoc | Various hooks | Stale data risks |
| L5 | Reconnection uses linear 5s retry — no exponential backoff | `useTrackingSubscription.ts` | Floods server on prolonged outages |
| L6 | No prefetching — checkout steps don't preload next step's data | Checkout flow | Perceptible delays between steps |
| L7 | React Query default: no retry config in provider | `query-provider.tsx` | Zero retries on failure |
| L8 | Search doesn't cache/deduplicate queries | Menu search | Redundant API calls |

## UX Polish Gaps

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| P1 | No undo for cart item deletion — swipe-delete is instant and permanent | `CartItem.tsx` | Accidental deletions |
| P2 | No undo for cart clear | `cart-store.ts` | Permanent action, no recovery |
| P3 | Swipe-delete has no visual preview indicator before drag starts | `CartItem.tsx` | Users don't discover the gesture |
| P4 | Dietary filter chips hidden behind horizontal scroll with no scroll indicator | Menu page | Users don't know they can scroll |
| P5 | Order detail reorder button only at page bottom — requires scroll | Order detail page | Low discoverability |
| P6 | No share preview (Open Graph tags) for shared order links | Order detail | Plain URL when shared |
| P7 | No email confirmation preview shown to customer after order | Confirmation page | Uncertainty about email receipt |
| P8 | COD approval wait has no polling or push notification | COD flow | Customer left wondering |
| P9 | Cancelled order overlay shows order ID but no cancellation reason | Tracking page | No context for cancellation |
| P10 | Price change badge says "Dismiss" but doesn't explain why price changed | Cart attention section | Confusing for customers |

---

## Recommended Milestone Phases

### Phase 1: Critical Fixes & Reliability
Fix conversion-blocking bugs and data reliability issues.
- C1: Cart mobile redirect (SSR detection, not useEffect)
- C2: Checkout empty cart guard (synchronous check)
- C3: Cutoff modal disables checkout button
- C5: Stripe timeout error state
- C9: React Query retry config (3 retries with backoff)
- H1: Cart validation timeout (30s max)
- L7: Configure retry in query-provider

### Phase 2: Checkout & Payment Polish
Improve the conversion funnel.
- C7: Checkout form state recovery on payment error
- H4: Inline form validation (real-time field feedback)
- C6: Periodic menu refetch while cart is non-empty (2-5 min)
- L6: Prefetch next checkout step data
- P10: Price change explanation (not just "Dismiss")

### Phase 3: Order Tracking Overhaul
Fix tracking UX from unusable to delightful.
- C4: Redesign tracking layout (full-height map + collapsible info sheet)
- C10: Add mute toggle for audio notifications
- H5: Reconnection banner ("Reconnecting...")
- H10: Stop polling on page hide (document.visibilitychange)
- L5: Exponential backoff for reconnection (1s, 2s, 4s, 8s, 30s max)

### Phase 4: Accessibility & Design System
Fix WCAG violations and harmonize design tokens.
- H6: Enforce 44px minimum touch targets (Button/Input sm → md on mobile)
- H7: Fix text-muted contrast ratio (bump to #4a4a4a minimum)
- D1: Complete dark mode token coverage
- D3: Harmonize focus indicators (ring + offset everywhere)
- D7: Align spring physics across component types

### Phase 5: Loading States & Skeletons
Replace spinners with content-shaped skeletons.
- H3: Loading skeletons for Orders, Account, Order Detail pages
- D10: Establish loading state hierarchy (skeleton → spinner → timeout)
- H2: Cache menu in IndexedDB for offline cold-start
- C8: Implement actual offline cart sync

### Phase 6: Data Layer & Performance
Optimize hooks, caching, and data fetching.
- L1: Optimistic cart updates
- L4: Query key factory for centralized cache invalidation
- L8: Search query deduplication and caching
- H8: Pagination for orders list and menu search
- L2: Fuzzy search via PostgreSQL similarity()

### Phase 7: Micro-Interactions & Polish
Elevate feel from functional to delightful.
- P1: Undo toast for cart item deletion (5-second window)
- P2: Undo for cart clear
- P3: Swipe-delete preview indicator
- P4: Scroll indicator on dietary filter chips
- P5: Sticky reorder button on order detail
- P6: Open Graph tags for shared order links
- D2: Animation system guidelines doc
- D9: Document when to use FM vs CSS vs GSAP

---

## UX Maturity Scorecard (Current State)

| Area | Score | Key Gap |
|------|-------|---------|
| Menu Browsing | 8/10 | No fuzzy search, no image optimization |
| Cart | 7.5/10 | Mobile flash, no undo, validation timeout |
| Checkout | 7/10 | Form state loss, no inline validation, cutoff race |
| Order Tracking | 5/10 | Map layout broken on mobile, silent subscription drops |
| Post-Order | 6/10 | No real-time updates, no driver info, basic confirmation |
| Design Tokens | 8/10 | Strong foundation, dark mode gaps |
| Animations | 7.5/10 | Rich system, inconsistent implementation |
| Accessibility | 6/10 | Touch targets, contrast, focus indicators |
| Data Layer | 6.5/10 | No retries, no optimistic updates, no offline sync |
| **Overall** | **6.8/10** | Solid foundation, needs reliability + polish pass |

---

## Source Files Reference

**Customer Pages:**
- `src/app/(public)/page.tsx` — Homepage
- `src/app/(public)/menu/page.tsx` — Menu browsing
- `src/app/(customer)/cart/page.tsx` — Cart (desktop) + redirect (mobile)
- `src/app/(customer)/checkout/CheckoutClient.tsx` — Multi-step checkout
- `src/app/(customer)/orders/page.tsx` — Order history
- `src/app/(customer)/orders/[id]/page.tsx` — Order detail
- `src/app/(customer)/orders/[id]/tracking/page.tsx` — Live tracking
- `src/app/(customer)/account/page.tsx` — Account settings

**Key Components:**
- `src/components/ui/Button.tsx` — Touch target issues
- `src/components/ui/Input.tsx` — Focus indicator inconsistency
- `src/components/ui/Modal.tsx` — Overlay system
- `src/components/ui/Card.tsx` — Variant clarity

**Data Layer:**
- `src/lib/stores/cart-store.ts` — Cart state (319 lines)
- `src/lib/stores/checkout-store.ts` — Checkout state (152 lines)
- `src/lib/hooks/useCartValidation.ts` — Validation (220 lines)
- `src/lib/hooks/useTrackingSubscription.ts` — Tracking (328 lines)
- `src/lib/hooks/useDeliveryGate.ts` — Gate logic (225 lines)
- `src/lib/hooks/useCustomerOfflineSync.ts` — Offline (73 lines)
- `src/lib/providers/query-provider.tsx` — Query config (25 lines)

**Design System:**
- `src/styles/tokens.css` — 140+ CSS variables
- `tailwind.config.ts` — Token integration
- `src/lib/motion-tokens/` — Animation presets
