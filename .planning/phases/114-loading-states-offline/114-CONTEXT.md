# Phase 114: Loading States & Offline - Context

**Gathered:** 2026-04-09 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Customers see content-shaped previews while pages load and can browse the menu offline. Replace generic RouteLoading spinners with content-shaped skeletons on customer pages. Enable IDB-first menu access on cold start. Wire real cart sync on reconnect.

**In scope (6 requirements):**
- LOAD-01: Orders list page content-shaped skeleton (replace loading.tsx)
- LOAD-02: Order detail page content-shaped skeleton (replace loading.tsx)
- LOAD-03: Account page tab-shaped skeleton (loading.tsx + AccountClient Suspense fallback)
- LOAD-04: Menu IDB-first cold-start (modify useMenuCache to load IDB before network)
- LOAD-05: Loading hierarchy pattern documented and enforced (skeleton > spinner > timeout)
- CFIX-08: Real cart sync on reconnect (price/availability validation via /api/menu)

**Explicitly NOT in scope:**
- Admin/driver loading states (already have PageSkeletons + SkeletonCrossfade)
- Service worker caching strategy changes (already caches /api/menu NetworkFirst 5s/15min)
- Menu data model changes
- Full offline-first architecture
- Push notifications for offline state

</domain>

<decisions>
## Implementation Decisions

### Skeleton Visual Fidelity (LOAD-01, LOAD-02, LOAD-03)
- **D-01:** Skeletons must be exact content-shaped — DOM structure mirrors real page layout (sections, grid, heights, aspect ratios). Not abstract placeholder shapes.
- **D-02:** Orders list skeleton: wraps 3-4 OrderCardSkeleton instances (reuse existing `src/components/ui/account/OrdersTab/OrderCardSkeleton.tsx`) with gradient background + OrdersHeader
- **D-03:** Order detail skeleton: new OrderDetailSkeleton matching all 7 layout sections (back/share buttons, header, timeline card, 2-col delivery info, items list, totals, action buttons)
- **D-04:** Account skeleton: tab bar + tab content area skeleton. Reuse existing ProfileSkeleton, OrderCardSkeleton, AddressCardSkeleton for per-tab fallbacks
- **D-05:** All three loading.tsx files swap from `RouteLoading` (generic spinner) to content-shaped skeleton components. Pure RSC streaming boundary swap — no Suspense refactoring needed for orders pages
- **D-06:** Account page: fix BOTH `loading.tsx` (RSC streaming) AND `AccountClient.tsx` Suspense fallback (replace raw `animate-pulse` divs with proper skeleton components)
- **D-07:** Use `loading="eager"` for images inside skeleton-to-content transitions — `loading="lazy"` + animated containers (opacity: 0) prevents images from loading (gotcha C-1)
- **D-08:** Use stable wrapper div for IntersectionObserver targets, conditionally render children inside — `useRef` on conditional renders breaks observers (gotcha C-3)

### SkeletonCrossfade Promotion
- **D-09:** Move `SkeletonCrossfade` from `src/components/ui/admin/SkeletonCrossfade.tsx` to `src/components/ui/SkeletonCrossfade.tsx` — zero admin-specific imports, fully generic. Update all admin imports.

### Loading Hierarchy Enforcement (LOAD-05)
- **D-10:** Wrap new page-level skeletons with `LoadingWithTimeout` for timeout enforcement — skeleton (15s = 10 shimmer cycles) > spinner fallback (30s = 20 cycles) > timeout error
- **D-11:** Document the pattern as a loading hierarchy guide for future development
- **D-12:** Keep existing animation cycle limits: 10 cycles for skeletons (15s), 20 for spinners (30s) — intentional design

### IDB-First Menu UX (LOAD-04)
- **D-13:** Modify `useMenuCache.ts` to load IndexedDB cache immediately on mount before network fetch — not only on error
- **D-14:** Show `StaleBadge` with cache age when displaying IDB data; fade transition when fresh data arrives
- **D-15:** SW (15min TTL) primary cache, IDB (24h) fallback — complementary, not conflicting
- **D-16:** Use direct Zustand selector for IDB state, never `useMemo + getState()` — getState() not reactive after hydration (gotcha C-2)

### Cart Reconnect Sync (CFIX-08)
- **D-17:** Replace stub `setupOnlineListener()` (currently just clears pendingSync flag + toast) with real sync: fetch `/api/menu`, compare prices/availability against cart items, notify user of changes
- **D-18:** Reuse `CheckoutErrorBanner` pattern from Phase 111 (CHKP-02) for post-reconnect price delta display
- **D-19:** Add `let listenerSetup = false` guard or move to useEffect hook — prevent event listener accumulation (gotcha H-2)
- **D-20:** Add sync-on-checkout or 24h purge for pendingSync flag — prevents flag persisting in IDB forever if user never reconnects (gotcha H-3)
- **D-21:** Use `await` or `after()` for background sync — `void asyncFn()` killed on Vercel (gotcha C-5)
- **D-22:** Hydration guard: `useEffect` + mounted check before `navigator.onLine` render (gotcha M-5)

### Implementation Order
- **D-23:** Phase 1: Skeleton components (build OrdersListSkeleton, OrderDetailSkeleton, AccountSkeleton; promote SkeletonCrossfade; swap loading.tsx files — LOAD-01, LOAD-02, LOAD-03)
- **D-24:** Phase 2: Loading hierarchy (wrap with LoadingWithTimeout; fix AccountClient Suspense fallback; document pattern — LOAD-05)
- **D-25:** Phase 3: Offline menu (flip useMenuCache to IDB-first on cold start — LOAD-04)
- **D-26:** Phase 4: Cart sync (wire real validation in setupOnlineListener — CFIX-08)

### Claude's Discretion
- Exact skeleton stagger delay values (existing range: 0.1-0.8s)
- Skeleton shimmer gradient colors (use established `bg-gradient-shimmer` token)
- IntersectionObserver animation pause implementation for off-screen skeletons
- Exact fade transition duration for IDB→fresh data swap
- Dark mode skeleton styling approach (`bg-skeleton` token already defined)
- Loading hierarchy documentation format and location

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — LOAD-01 through LOAD-05, CFIX-08 definitions
- `.planning/ROADMAP.md` §Phase 114 — Success criteria (4 items), dependencies

### Pre-Context Research (CRITICAL)
- `.planning/phases/114-loading-states-offline/114-PRECONTEXT-RESEARCH.md` — Full analysis: gotcha inventory, data contracts, cross-phase contracts, design compliance, existing infrastructure

### Cross-Phase Contracts
- Phase 110 contracts: query key factory, React Query retry config, LoadingWithTimeout, error code registry, AbortController cleanup, toast persistent flag
- Phase 111 contracts: menu polling (`useMenu({ pollWhileNonEmpty })`), CheckoutErrorBanner (CHKP-02), form persistence, onTouched validation
- Phase 112 contracts: ReconnectingBanner (z-25, 2s debounce), drawer exit animation (0.15s easeIn — NEVER change)
- Phase 113 contracts: 44px touch targets, focus-visible rings, no hardcoded hex colors, ESLint ring enforcement

### Existing Code
- `src/components/ui/skeleton/` — Base skeleton primitives (base, text, card, table variants)
- `src/components/ui/admin/SkeletonCrossfade.tsx` — Generic crossfade (to promote to ui/)
- `src/components/ui/LoadingWithTimeout.tsx` — Timeout + retry wrapper
- `src/components/ui/RouteLoading.tsx` — Generic spinner (being replaced)
- `src/components/ui/menu/useMenuCache.ts` — Current cache-on-error pattern (to flip to IDB-first)
- `src/lib/stores/cart-store.ts` — `setupOnlineListener()` stub at line 291
- `src/lib/services/customer-offline-store.ts` — IDB menuCache API
- `src/components/ui/offline/StaleBadge.tsx` — Cache age display component
- `src/components/ui/account/OrdersTab/OrderCardSkeleton.tsx` — Reusable order card skeleton
- `src/components/ui/account/ProfileTab/ProfileSkeleton.tsx` — Reusable profile skeleton
- `src/components/ui/account/AddressesTab/AddressCardSkeleton.tsx` — Reusable address skeleton

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `OrderCardSkeleton` — existing skeleton for order cards, reusable in orders list skeleton
- `ProfileSkeleton`, `AddressCardSkeleton` — reusable for account page per-tab fallbacks
- `SkeletonCrossfade` — generic crossfade component, needs promotion from admin/ to ui/
- `LoadingWithTimeout` — timeout wrapper, ready to compose with new skeletons
- `StaleBadge` — cache age display, ready for IDB-first menu
- `CheckoutErrorBanner` — price change alert pattern from Phase 111, reusable for cart sync

### Established Patterns
- Skeleton primitives in `ui/skeleton/` (base, text, card, table) — compose new page skeletons from these
- `loading.tsx` files export default function returning skeleton — pure RSC streaming boundary
- `menuCache` API (save/get/isStale/clear) in `customer-offline-store.ts`
- Cart store with Zustand + IDB persist via `cart-idb-storage.ts`
- Design tokens: `bg-skeleton`, `bg-skeleton-shimmer`, `animate-shimmer`, stagger classes

### Integration Points
- Three `loading.tsx` files: `(customer)/orders/`, `(customer)/orders/[id]/`, `(customer)/account/`
- `AccountClient.tsx` Suspense fallback (raw animate-pulse divs to replace)
- `useMenuCache.ts` hook (flip from cache-on-error to IDB-first)
- `cart-store.ts` `setupOnlineListener()` at line 291 (stub to real sync)
- Service worker: NetworkFirst /api/menu (5s timeout, 15min TTL) — complementary to IDB

</code_context>

<specifics>
## Specific Ideas

No specific requirements — all decisions derived from codebase analysis and pre-context research. Open to standard approaches within the established patterns.

</specifics>

<deferred>
## Deferred Ideas

None — analysis stayed within phase scope.

</deferred>

---

*Phase: 114-loading-states-offline*
*Context gathered: 2026-04-09*
