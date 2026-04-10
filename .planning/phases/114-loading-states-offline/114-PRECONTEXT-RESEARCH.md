# Phase 114: Loading States & Offline — Deep Pre-Context Research

**Generated:** 2026-04-09
**Protocol:** 12-Agent Deep Phase Assumptions (2 waves, 6 agents each)
**Phase Goal:** Customers see content-shaped previews while pages load and can browse the menu offline

---

## 1. Resolved Assumptions

### Technical Approach (HIGH confidence)

- **Skeleton components:** Build 3 new page-level skeletons (OrdersListSkeleton, OrderDetailSkeleton, AccountSkeleton) using existing `src/components/ui/skeleton/` primitive library (base, text, card, table variants)
- **Loading.tsx replacement:** Swap `RouteLoading` (generic spinner) in customer-facing `loading.tsx` files with content-shaped skeletons. These are App Router RSC streaming boundaries — component swap only, no Suspense refactoring needed for orders pages
- **Account page:** Fix BOTH `loading.tsx` (RSC streaming) AND `AccountClient.tsx` Suspense fallback (replace raw `animate-pulse` divs with proper skeleton components)
- **SkeletonCrossfade promotion:** Move from `src/components/ui/admin/SkeletonCrossfade.tsx` to `src/components/ui/SkeletonCrossfade.tsx` — zero admin-specific imports, fully generic
- **LoadingWithTimeout:** Wrap new skeletons for LOAD-05 hierarchy enforcement
- **IDB-first menu:** Modify `useMenuCache.ts` to load IndexedDB cache immediately on mount before network fetch, not only on error
- **Cart sync:** Replace stub `setupOnlineListener()` (clears flag + toast) with real price/availability validation against `/api/menu`

### Scope Boundaries (HIGH confidence)

**In scope:**
- LOAD-01: Orders list → content-shaped skeleton (replace loading.tsx)
- LOAD-02: Order detail → content-shaped skeleton (new component + replace loading.tsx)
- LOAD-03: Account page → tab-shaped skeleton (loading.tsx + AccountClient Suspense)
- LOAD-04: Menu IDB-first cold-start (modify useMenuCache)
- LOAD-05: Loading hierarchy pattern (skeleton > spinner > timeout) documented + enforced
- CFIX-08: Real cart sync on reconnect (price validation, user notification)

**Out of scope:**
- Admin/driver loading states (already have PageSkeletons + SkeletonCrossfade)
- Service worker caching strategy changes (already caches /api/menu NetworkFirst 5s/15min)
- Menu data model changes
- Full offline-first architecture
- Push notifications for offline state

**Ambiguous → Resolved:**
- SSR pages vs client skeletons → Replace loading.tsx only for orders pages (pure RSC, no client fetching)
- SkeletonCrossfade location → Move to `ui/` (fully generic, zero admin imports)
- SW cache vs IDB overlap → Complementary: SW (15min TTL) primary, IDB (24h) fallback
- Animation cycle limits → Keep 10 cycles for skeletons (15s), 20 for spinners (30s) — intentional design, not a bug

### Implementation Order (HIGH confidence)

1. **Skeleton components** — Build OrdersListSkeleton, OrderDetailSkeleton, AccountSkeleton; promote SkeletonCrossfade; swap loading.tsx files (LOAD-01, LOAD-02, LOAD-03)
2. **Loading hierarchy** — Wrap skeletons with LoadingWithTimeout; fix AccountClient Suspense fallback; document pattern (LOAD-05)
3. **Offline menu** — Flip useMenuCache to IDB-first on cold start (LOAD-04)
4. **Cart sync** — Wire real validation in setupOnlineListener for pendingSync items (CFIX-08)

### Backend Requirements

- No new API endpoints needed — `/api/menu` returns sufficient data for cart validation (basePriceCents, isActive, isSoldOut, modifierGroups)
- No database changes
- No new environment variables

---

## 2. Realistic Data/Scale Analysis

| Metric | Value | Source |
|--------|-------|--------|
| Menu items | ~100 items | /api/menu response |
| Menu payload (gzipped) | ~50KB | API route |
| IDB menu cache record | Single "current" key | customer-offline-store.ts:97 |
| Cart max items | 50 | types/cart.ts:75 |
| Cart max quantity/item | 50 | types/cart.ts:76 |
| SW menu cache TTL | 15 minutes | sw.ts:101 |
| IDB staleness threshold | 24 hours | customer-offline-store.ts:131 |
| React Query staleTime | 5 minutes | query-provider.tsx |
| Skeleton shimmer duration | 1.5s × 10 cycles = 15s | skeleton/base.tsx:61 |
| BrandedSpinner duration | 1.5s × 20 cycles = 30s | branded-spinner.tsx:42 |
| SkeletonCrossfade min display | 300ms | SkeletonCrossfade.tsx:29 |

---

## 3. Cross-Phase Contract Inventory

### Consumed from Phase 110

| Contract | File | Lines | Must NOT Break |
|----------|------|-------|----------------|
| Query key factory | src/lib/queryKeys.ts | all | Reuse all keys; no inline array keys |
| React Query retry config | src/lib/providers/query-provider.tsx | all | 3 retries queries, never mutations |
| Timeout constants | STRIPE_TIMEOUT_MS=10s, CART_VALIDATION=30s | — | Don't change overlapping systems |
| LoadingWithTimeout | src/components/ui/LoadingWithTimeout.tsx | all | Extend, don't replace |
| Error code registry | src/types/errors.ts | ClientErrorCodes | Add new codes here only |
| AbortController cleanup | useEffect pattern | — | Every timeout/listener must have cleanup |
| Toast persistent flag | useToast({ persistent: true }) | — | Use for critical errors |

### Consumed from Phase 111

| Contract | File | Must NOT Break |
|----------|------|----------------|
| Menu polling (CFIX-09) | useMenu({ pollWhileNonEmpty }) | 3-min cadence, don't interfere during offline |
| Price-change banner (CHKP-02) | CheckoutErrorBanner | Reuse for CFIX-08 post-reconnect price deltas |
| Form persistence | useCheckoutStore.persist() | Don't trigger reset during offline |
| onTouched validation | RHF mode: "onTouched" | Don't change to "onChange" |

### Consumed from Phase 112

| Contract | File | Must NOT Break |
|----------|------|----------------|
| ReconnectingBanner | Fixed top, z-25, 2s debounce | Don't duplicate banner logic |
| Visibility pause | document.visibilitychange cleanup | removeEventListener in return |
| Mute preference | localStorage "trackingAudioMuted" | Don't play audio if muted |
| Drawer exit animation | duration: 0.15s easeIn | NEVER convert to spring |

### Consumed from Phase 113

| Contract | Must NOT Break |
|----------|----------------|
| 44px touch targets (A11Y-01) | All interactive elements in new UI |
| Focus rings: focus-visible:ring-2 ring-primary ring-offset-2 (A11Y-03) | New buttons/links |
| No hardcoded hex colors (A11Y-04) | Use bg-*, text-*, border-* tokens only |
| ESLint ring enforcement | Use focus-visible:, not focus: |

### Feeds into Phase 116

- Clean skeleton/spinner patterns (reusable for future pages)
- Established offline state machine (for undo/retry UX)
- Consistent error-to-recovery UX pattern

---

## 4. Gotcha Inventory

### Critical (must fix during implementation)

| # | Gotcha | Feature | Source | Fix |
|---|--------|---------|--------|-----|
| C-1 | `loading="lazy"` + animated containers (opacity: 0) = images never load | LOAD-01/02 | animation.md:27-33 | Use `loading="eager"` for images inside skeleton-to-content transitions |
| C-2 | Zustand IDB persist: `getState()` in useMemo not reactive after hydration | LOAD-04, CFIX-08 | state-management.md:112-128 | Use direct Zustand selector, never `useMemo + getState()` |
| C-3 | useRef on conditional renders breaks IntersectionObserver | LOAD-01/02/03 | react-patterns.md:67-86 | Use stable wrapper div, conditionally render children inside |
| C-4 | Cart sync `setupOnlineListener` is stub — clears flag, no server validation | CFIX-08 | cart-store.ts:291-306 | Add /api/menu fetch + price comparison + user notification |
| C-5 | `void asyncFn()` killed on Vercel | CFIX-08 | nextjs.md:143-167 | Use `await` or `after()` for background sync |

### High (significant risk)

| # | Gotcha | Feature | Source | Fix |
|---|--------|---------|--------|-----|
| H-1 | Skeleton DOM must match content DOM exactly | LOAD-01/02/03 | animation.md:21-23 | Match sticky, grid, heights, aspect ratios |
| H-2 | Event listeners in setupOnlineListener may accumulate | CFIX-08 | react-patterns.md:15-18 | Add `let listenerSetup = false` guard or move to useEffect hook |
| H-3 | pendingSync flag persists in IDB forever if user never reconnects | CFIX-08 | cart-store.ts:156-171 | Add sync-on-checkout or 24h purge |
| H-4 | Drawer swipe-to-close: two-layer fix for height + touchAction | All mobile | mobile-ux.md:63-76 | ResizeObserver to detect overflow, conditionally remove touchAction |
| H-5 | Menu IDB-first could flash stale data before network update | LOAD-04 | — | Show stale badge with age; fade transition when fresh data arrives |

### Medium (manageable)

| # | Gotcha | Feature | Source | Fix |
|---|--------|---------|--------|-----|
| M-1 | Flex `items-center` collapses children without `w-full` | LOAD-01/02/03 | react-patterns.md:43-63 | Add `w-full` to skeleton containers |
| M-2 | Non-existent token names resolve to transparent | All | design-tokens.md:21-23 | Use `bg-surface-tertiary` not `bg-info` for skeleton bg |
| M-3 | IntersectionObserver for animation pause when off-screen | LOAD-05 | performance.md:21-42 | Pause skeleton animations when not visible |
| M-4 | Context provider re-render loops from inline objects | LOAD-04 | react-patterns.md:3-5 | Wrap value in useMemo, setters in useCallback |
| M-5 | Hydration guard needed for navigator.onLine | CFIX-08 | react-patterns.md:9-11 | useEffect + mounted check before render |
| M-6 | Dark mode skeleton: use explicit Tailwind colors on mobile | All | tailwind-v4.md:23-25 | `bg-white dark:bg-black md:bg-white/80` pattern |
| M-7 | Promise.all mock must handle all parallel queries in tests | Testing | testing.md:92-113 | Mock each table name in fixtures |

---

## 5. Data Contracts

### Menu Response (cached in IDB)

```typescript
interface MenuResponse {
  data: {
    categories: Array<{
      id: string;
      slug: string;
      name: string;
      sortOrder: number;
      items: Array<{
        id: string;
        slug: string;
        nameEn: string;
        nameMy: string;
        basePriceCents: number;
        isActive: boolean;
        isSoldOut: boolean;
        tags: string[];
        allergens: string[];
        modifierGroups: Array<{
          id: string;
          name: string;
          selectionType: "single" | "multiple";
          options: Array<{
            id: string;
            name: string;
            priceDeltaCents: number;
            isActive: boolean;
          }>;
        }>;
      }>;
    }>;
  };
  meta: { timestamp: string };
}
```

### Cart Item (with pendingSync)

```typescript
interface CartItem {
  cartItemId: string;
  menuItemId: string;
  nameEn: string;
  basePriceCents: number;
  quantity: number;
  modifiers: Array<{ optionId: string; name: string; priceDeltaCents: number }>;
  notes?: string;
  pendingSync?: boolean; // Set true when added offline
}
```

### IDB Menu Cache Record

```typescript
interface MenuCacheRecord {
  id: "current";
  data: MenuResponse;
  cachedAt: string; // ISO timestamp
  version: string;  // "v1"
}
```

---

## 6. Design Compliance Matrix

| Principle | Phase 114 Compliance | Evidence |
|-----------|---------------------|----------|
| Animation-first | Shimmer skeletons (1.5s linear), stagger delays (0.1-0.8s), crossfade transitions (0.2s) | skeleton/base.tsx, animations.css |
| 44px touch targets | All new interactive elements ≥ h-11 | Phase 113 A11Y-01 contract |
| Focus-visible rings | focus-visible:ring-2 ring-primary ring-offset-2 | Phase 113 A11Y-03 contract |
| No hardcoded colors | All tokens verified: bg-skeleton, bg-surface-tertiary, text-text-muted | Token audit: 0 gaps found |
| Dark mode complete | Skeleton: #374151 (dark), shimmer: rgba(255,255,255,0.1) | tokens.css:661-662 |
| Reduced motion | Opt-in via data-reduce-motion="true"; useAnimationPreference().shouldAnimate | animations.css:321-351 |
| OLED dark mode | Pure black surfaces (#000000) | tokens.css:511 |
| Brand accent | Customer: amber-500; Admin: teal | PROJECT.md:209-210 |

---

## 7. Design Token Audit Results

### Status: PASSED (0 gaps)

All skeleton-related tokens verified in both light and dark modes:

| Token | Light Value | Dark Value | Used In |
|-------|------------|------------|---------|
| --color-skeleton | #e5e7eb | #374151 | tokens.css:424/661 |
| --color-skeleton-shimmer | rgba(255,255,255,0.4) | rgba(255,255,255,0.1) | tokens.css:425/662 |
| --color-surface-tertiary | #ebebeb | #141414 | tokens.css:62/514 |
| --color-surface-primary | #ffffff | #000000 | tokens.css:59/511 |
| --color-surface-secondary | #fafafa | #0a0a0a | tokens.css:61/512 |

Tailwind config mapping verified: `skeleton.DEFAULT`, `skeleton.shimmer` both resolve correctly.

CSS utilities verified: `.bg-gradient-shimmer`, `.animate-shimmer`, `.stagger-1` through `.stagger-8` all defined.

No hardcoded hex colors found in any skeleton component.

---

## 8. Existing Infrastructure Inventory

### Skeleton Components (18 files, ready to compose)

| Component | File | Used By |
|-----------|------|---------|
| Skeleton (base) | src/components/ui/skeleton/base.tsx | All skeletons |
| SkeletonText | src/components/ui/skeleton/text-skeletons.tsx | Profile, cards |
| SkeletonAvatar | src/components/ui/skeleton/text-skeletons.tsx | Profile |
| SkeletonCard | src/components/ui/skeleton/card-skeletons.tsx | Menu items |
| SkeletonMenuItem | src/components/ui/skeleton/card-skeletons.tsx | Menu list |
| SkeletonTableRow | src/components/ui/skeleton/table-skeletons.tsx | Admin tables |
| MenuSkeleton | src/components/ui/menu/MenuSkeleton.tsx | /menu loading |
| ProfileSkeleton | src/components/ui/account/ProfileTab/ProfileSkeleton.tsx | Profile tab |
| OrderCardSkeleton | src/components/ui/account/OrdersTab/OrderCardSkeleton.tsx | Orders tab |
| AddressCardSkeleton | src/components/ui/account/AddressesTab/AddressCardSkeleton.tsx | Addresses tab |
| SkeletonCrossfade | src/components/ui/admin/SkeletonCrossfade.tsx | Admin pages |
| LoadingWithTimeout | src/components/ui/LoadingWithTimeout.tsx | Charts, maps |

### Offline Infrastructure (complete)

| Component | File | Purpose |
|-----------|------|---------|
| menuCache API | src/lib/services/customer-offline-store.ts | IDB save/get/isStale/clear |
| useMenuCache | src/components/ui/menu/useMenuCache.ts | Cache-on-error pattern |
| cartIDBStorage | src/lib/services/cart-idb-storage.ts | Zustand persist adapter |
| OfflineIndicator | src/components/ui/offline/OfflineIndicator.tsx | Fixed amber banner |
| OfflineBanner | src/components/ui/customer/OfflineBanner.tsx | Customer-specific |
| useCustomerOfflineSync | src/lib/hooks/useCustomerOfflineSync.ts | Online/offline state |
| SW (Serwist) | src/app/sw.ts | NetworkFirst /api/menu (5s/15min) |
| StaleBadge | src/components/ui/offline/StaleBadge.tsx | Cache age display |

### Loading Infrastructure (complete)

| Component | File | Purpose |
|-----------|------|---------|
| RouteLoading | src/components/ui/RouteLoading.tsx | Full-screen spinner (to replace) |
| BrandedSpinner | src/components/ui/branded-spinner.tsx | Morning Star SVG spinner |
| LoadingWithTimeout | src/components/ui/LoadingWithTimeout.tsx | Timeout + retry wrapper |
| queryKeys | src/lib/queryKeys.ts | Centralized cache keys |
| QueryProvider | src/lib/providers/query-provider.tsx | Retry config |

---

## 9. Customer Page Structure Analysis

### Orders List (`/orders` — pure RSC)

**Data flow:** Server-side Supabase query → `OrderListAnimated` or empty state
**Layout sections to skeleton:**
1. Gradient background container
2. OrdersHeader (title)
3. List of OrderCards (icon + order ID + date + price + status badge + actions)

**Existing skeleton:** OrderCardSkeleton exists in account tab — reusable for orders page
**Required:** OrdersListSkeleton wrapping 3-4 OrderCardSkeleton instances with header

### Order Detail (`/orders/[id]` — pure RSC)

**Data flow:** Server-side Supabase query + Stripe verification → full order render
**Layout sections to skeleton:**
1. Back + Share buttons
2. Order header (ID, date, status badge)
3. OrderTimeline card
4. 2-column delivery info (Clock + MapPin)
5. Order items list (qty, name, modifiers, price)
6. Totals breakdown (5-6 lines)
7. Action buttons (PendingOrderActions, ReorderButton)

**Existing skeleton:** None — must create OrderDetailSkeleton
**Required:** New content-shaped skeleton matching all 7 sections

### Account (`/account` — RSC wrapper + client tabs)

**Data flow:** Server auth check → AccountClient → per-tab client fetching
**Layout sections to skeleton:**
1. "My Account" title
2. Tab bar (Profile, Orders, Feedback, Settings)
3. Tab content area

**Existing skeletons:** ProfileSkeleton, OrderCardSkeleton, AddressCardSkeleton — all used inside tabs
**Required:** AccountSkeleton for loading.tsx + improved AccountClient Suspense fallback

---

## 10. File Map

### Create

| File | Purpose |
|------|---------|
| src/components/ui/orders/OrdersListSkeleton.tsx | Content-shaped skeleton for /orders page |
| src/components/ui/orders/OrderDetailSkeleton.tsx | Content-shaped skeleton for /orders/[id] page |
| src/components/ui/account/AccountSkeleton.tsx | Tab-shaped skeleton for /account page |

### Modify

| File | Change |
|------|--------|
| src/app/(customer)/orders/loading.tsx | RouteLoading → OrdersListSkeleton |
| src/app/(customer)/orders/[id]/loading.tsx | RouteLoading → OrderDetailSkeleton |
| src/app/(customer)/account/loading.tsx | RouteLoading → AccountSkeleton |
| src/components/ui/account/AccountClient.tsx | Replace raw animate-pulse Suspense fallback |
| src/components/ui/menu/useMenuCache.ts | IDB-first loading on mount |
| src/lib/stores/cart-store.ts | Real sync in setupOnlineListener |
| src/components/ui/admin/SkeletonCrossfade.tsx → src/components/ui/SkeletonCrossfade.tsx | Promote to shared |

### Read (reference only)

| File | Purpose |
|------|---------|
| src/components/ui/skeleton/base.tsx | Animation patterns |
| src/components/ui/menu/MenuSkeleton.tsx | Stagger + composition reference |
| src/lib/hooks/useOfflineSync.ts | Driver sync queue pattern (reference for CFIX-08) |
| src/app/api/menu/route.ts | Menu response structure |

---

## 11. Gray Area Resolutions

| # | Gray Area | Resolution | Confidence | Evidence |
|---|-----------|------------|------------|----------|
| 1 | SSR pages need client Suspense? | No — replace loading.tsx only for orders pages (pure RSC) | HIGH | orders/page.tsx, orders/[id]/page.tsx: zero client-side fetching |
| 2 | SkeletonCrossfade promotion | Yes — move to ui/; zero admin imports; fully generic | HIGH | SkeletonCrossfade.tsx imports: React + framer-motion only |
| 3 | IDB vs SW cache conflict | Complementary — SW (15min) primary, IDB (24h) fallback | HIGH | sw.ts:92-105 vs customer-offline-store.ts:131 |
| 4 | Animation cycle limits (10 cycles) | Keep as-is — intentional design, documented in comments | HIGH | base.tsx:54 comment: "should only show briefly" |
| 5 | Cart "sync" meaning | Validate prices/availability + notify user of changes | HIGH | No /api/cart exists; validation via /api/menu comparison |
| 6 | Account loading.tsx vs Suspense | Fix both — loading.tsx for RSC, Suspense for tab switches | HIGH | page.tsx:18 renders AccountClient; AccountClient:100 has Suspense |

---

## 12. Animation/Transition Implementation Patterns

### Skeleton Animation Config

| Animation | Duration | Repeat | Easing | Use Case |
|-----------|----------|--------|--------|----------|
| Shimmer | 1.5s | 10 cycles | linear | Default for all skeletons |
| Wave | 3s | 10 cycles | linear | Alternative for larger surfaces |
| Pulse | 1.5s | 10 cycles | easeInOut | Subtle for small elements |
| Grain | 2s | 10 cycles | easeInOut | Texture overlay |

### Crossfade State Machine

```
Mount → Show skeleton (300ms minimum)
         ↓
isLoading = false → Calculate remaining time
         ↓
remaining ≤ 0 → Show content immediately
remaining > 0 → Delay show by remaining ms
         ↓
Skeleton exit: opacity 0 (0.2s)
Content enter: opacity 0→1 (0.2s)
```

### Stagger Pattern

```tsx
// From MenuSkeleton — established pattern
<div className="grid gap-4 grid-cols-1 xs:grid-cols-2 md:grid-cols-3">
  {Array.from({ length: count }).map((_, i) => (
    <SkeletonCard key={i} className={`stagger-${Math.min(i + 1, 8)}`} />
  ))}
</div>
```

### Accessibility Requirements

- Skeletons: `aria-hidden="true"` (remove from a11y tree)
- Spinners: `role="status"` + `aria-label="Loading"` + `<span className="sr-only">`
- Reduced motion: Check `useAnimationPreference().shouldAnimate`; return static fallback if false
- Opt-in model: Animations ON by default; ignore OS prefers-reduced-motion

---

## 13. Offline Architecture

### Current Menu Offline Flow

```
User opens /menu offline →
  useMenu() fires → fetch('/api/menu') fails →
  useMenuCache effect: if (error && !isLoading) →
    menuCache.get() from IDB →
    setUsingCachedData(true) →
    displayCategories = cachedCategories →
    StaleBadge shows cache age
```

### Proposed IDB-First Flow

```
User opens /menu →
  Phase 1: menuCache.get() from IDB (~50ms) →
    If cache exists: show immediately + set usingCachedData=true
  Phase 2: useMenu() fires → fetch('/api/menu') →
    If succeeds: menuCache.save() + set usingCachedData=false (crossfade to fresh)
    If fails: keep showing cached data with StaleBadge
```

### Cart Sync Architecture

```
User adds item offline →
  cart-store.ts: pendingSync: true →
  Persist to IDB via cartIDBStorage

User comes back online →
  window "online" event →
  New: fetch('/api/menu') for fresh prices →
  Compare each pendingSync item:
    price match → clear pendingSync flag
    price changed → update cart price + show PRICE_CHANGED banner (reuse Phase 111)
    item unavailable → remove from cart + toast notification
  Clear remaining pendingSync flags →
  Toast summary: "Cart synced. 2 items updated."
```

### Cache Hierarchy

| Layer | TTL | Purpose | Precedence |
|-------|-----|---------|------------|
| React Query (in-memory) | 5 min | Hot cache during session | 1st |
| Service Worker (Cache API) | 15 min | Network fallback | 2nd |
| IndexedDB (customer-offline-store) | 24 hours | Long offline periods | 3rd |
| Offline page (/offline) | Precached | Total failure fallback | Last resort |

---

## 14. Deferred Items from Prior Phases

| Source | Item | Phase 114 Relevance |
|--------|------|---------------------|
| Phase 112 Rec #5 | 2-second debounce on Reconnecting banner | Verify when implementing offline states |
| Phase 112 Rec #11 | prefers-reduced-motion for sheet/banner | Apply to new skeleton/banner components |
| Phase 113 Rec #10 | StatusStepper reduced-motion gate | Apply if adding loading step indicators |
| Phase 110 | EmptyCheckoutError role="status" | Don't remove — a11y contract |

---

## 15. Test Coverage Expectations

Current test count: 954+ (as of Phase 111 verification)

Phase 114 should add:
- Skeleton component render tests (dark mode + reduced motion)
- LoadingWithTimeout timeout behavior test
- useMenuCache IDB-first loading test
- Cart sync: pendingSync → online → price validation test
- Cart sync: pendingSync → online → unavailable item removal test
- Loading.tsx renders correct skeleton (not RouteLoading) test

---

_Research completed: 2026-04-09 via 12-agent deep analysis protocol_
