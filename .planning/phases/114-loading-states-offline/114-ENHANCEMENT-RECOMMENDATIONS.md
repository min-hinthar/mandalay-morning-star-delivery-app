# Phase 114: Loading States & Offline — Enhancement Recommendations

**Generated:** 2026-04-09
**Protocol:** 12-Agent Deep Phase Assumptions

---

## Priority Matrix

| # | Recommendation | Priority | Effort | Impact |
|---|---------------|----------|--------|--------|
| 1 | SkeletonCrossfade promotion to shared | MUST-HAVE | Low | High |
| 2 | Loading hierarchy constants file | MUST-HAVE | Low | High |
| 3 | Cart sync hook extraction | MUST-HAVE | Medium | High |
| 4 | Stale menu tiered warnings | SHOULD-HAVE | Low | Medium |
| 5 | Skeleton stagger on orders list | SHOULD-HAVE | Low | Medium |
| 6 | Online listener guard refactor | SHOULD-HAVE | Low | Medium |
| 7 | AccountClient per-tab Suspense | SHOULD-HAVE | Medium | Medium |
| 8 | pendingSync visual indicator | SHOULD-HAVE | Low | Medium |
| 9 | Skeleton animation Infinity option | NICE-TO-HAVE | Low | Low |
| 10 | Offline state centralization | NICE-TO-HAVE | Medium | Medium |
| 11 | Storybook skeleton stories | NICE-TO-HAVE | Medium | Low |
| 12 | Cart sync retry timer | NICE-TO-HAVE | Medium | Medium |

---

## Detailed Recommendations

### 1. SkeletonCrossfade Promotion to Shared (MUST-HAVE)

**What:** Move `src/components/ui/admin/SkeletonCrossfade.tsx` to `src/components/ui/SkeletonCrossfade.tsx`. Update all admin imports.

**Why:** Component is fully generic (imports only React + framer-motion). Currently 28 files reference it but only admin pages can use it without awkward cross-directory imports.

**Design compliance:** Follows file organization rule — shared components in `ui/`, domain-specific in `ui/{domain}/`.

**Implementation hint:** Single file move + barrel update + find-replace on import paths. No logic changes needed.

---

### 2. Loading Hierarchy Constants File (MUST-HAVE)

**What:** Create `src/lib/constants/loading.ts` with documented loading state hierarchy:

```typescript
export const LOADING_HIERARCHY = {
  SKELETON_MIN_DISPLAY_MS: 300,    // Minimum skeleton visibility
  SPINNER_THRESHOLD_MS: 200,       // Delay before showing spinner for actions
  TIMEOUT_ORDERS_MS: 10_000,       // Timeout for page loads
  TIMEOUT_MAPS_MS: 15_000,         // Timeout for map loads
  TIMEOUT_CHARTS_MS: 10_000,       // Timeout for chart loads
} as const;
```

**Why:** LOAD-05 requires hierarchy to be "documented and enforced." Currently timeouts are hardcoded per-component (10s charts, 15s maps) with no central reference.

**Design compliance:** Follows established pattern of constants files (e.g., timeout constants from Phase 110).

**Implementation hint:** Extract magic numbers from LoadingWithTimeout usage sites into this constants file.

---

### 3. Cart Sync Hook Extraction (MUST-HAVE)

**What:** Extract cart sync logic from `setupOnlineListener()` into a dedicated `useCartSyncOnReconnect()` hook in `src/lib/hooks/`.

**Why:** Current implementation is a module-level side effect in cart-store.ts that:
- Has no cleanup (listeners accumulate on HMR)
- Clears pendingSync without validation (misleading "Cart synced!" toast)
- Can't be tested in isolation

The new hook should:
1. Listen for "online" event with proper useEffect cleanup
2. Fetch fresh menu data from `/api/menu`
3. Compare pendingSync items against current prices/availability
4. Update cart store with corrected prices or remove unavailable items
5. Show appropriate toast (success, price changes, removals)

**Design compliance:** Matches driver pattern (`useOfflineSync`) — same project, same architecture.

**Implementation hint:** Reference `src/lib/hooks/useOfflineSync.ts` for sync queue pattern. Reuse Phase 111's PRICE_CHANGED banner for price delta display.

---

### 4. Stale Menu Tiered Warnings (SHOULD-HAVE)

**What:** Enhance StaleBadge to show different severity levels based on cache age:

| Age | Badge Variant | Message |
|-----|--------------|---------|
| < 4h | status-info | "Cached 2h ago" |
| 4-8h | status-warning | "Cached 6h ago — items may be unavailable" |
| 8-24h | status-error | "Cached 18h ago — prices may have changed" |
| > 24h | status-critical | "Cached 2d ago — very outdated" |

**Why:** Current StaleBadge shows only relative time with no severity indication. A 2-hour-old cache is reliable; a 20-hour-old cache is risky for pricing. Users need to understand the risk level.

**Design compliance:** Uses existing status badge variants. No new tokens needed.

**Implementation hint:** `menuCache.getAgeMs()` already exists. Add threshold logic to StaleBadge component.

---

### 5. Skeleton Stagger on Orders List (SHOULD-HAVE)

**What:** Add stagger animation delays to OrdersListSkeleton card items, matching the established MenuSkeleton pattern.

**Why:** Current OrderCardSkeleton renders 4 static cards simultaneously. The menu skeleton uses `stagger-1` through `stagger-8` CSS classes for cascade effect. Visual consistency matters.

**Design compliance:** `stagger-1` through `stagger-8` classes already defined in `animations.css:121-144`. Pattern established in `MenuSkeleton.tsx:113`.

**Implementation hint:**
```tsx
{Array.from({ length: 4 }).map((_, i) => (
  <OrderCardSkeleton key={i} className={`stagger-${i + 1}`} />
))}
```

---

### 6. Online Listener Guard Refactor (SHOULD-HAVE)

**What:** Add idempotency guard to `setupOnlineListener()` to prevent listener accumulation on HMR or re-import:

```typescript
let listenerSetup = false;
export function setupOnlineListener() {
  if (listenerSetup || typeof window === "undefined") return;
  listenerSetup = true;
  // ... listener registration
}
```

**Why:** Module-level side effects without guards can register duplicate listeners during development (HMR) or if the module is imported from multiple entry points. Each duplicate fires the sync handler again.

**Design compliance:** Standard SSR-safe pattern used throughout the codebase.

**Implementation hint:** Also add `navigator.onLine` verification inside the handler before processing (false positive "online" events happen on some browsers).

---

### 7. AccountClient Per-Tab Suspense (SHOULD-HAVE)

**What:** Wrap each tab content in AccountClient with individual Suspense boundaries:

```tsx
{activeTab === "profile" && (
  <Suspense fallback={<ProfileSkeleton />}>
    <ProfileTab />
  </Suspense>
)}
```

**Why:** Currently, all tabs share a single outer Suspense. If a tab's async operation suspends, the ENTIRE account page shows the fallback. Per-tab Suspense means switching tabs shows the appropriate tab skeleton, not a page-level spinner.

**Design compliance:** Follows menu page pattern (Suspense wrapping async component). Skeletons (ProfileSkeleton, OrderCardSkeleton, AddressCardSkeleton) already exist for each tab.

**Implementation hint:** AccountClient lines 82-92 render tabs conditionally. Wrap each case in Suspense with existing skeleton fallback.

---

### 8. pendingSync Visual Indicator (SHOULD-HAVE)

**What:** Show a subtle visual indicator on cart items that have `pendingSync: true` — semi-transparent overlay or small clock icon.

**Why:** Users adding items offline see no difference from online behavior. A subtle indicator communicates "this was added offline and will be validated when you reconnect." This sets expectations before the sync toast appears.

**Design compliance:** Uses existing status tokens (text-text-muted for the icon, bg-status-warning-bg/10 for overlay).

**Implementation hint:** Check `item.pendingSync` in CartItemCard render. Show Clock icon with tooltip "Added offline — will sync when connected."

---

### 9. Skeleton Animation Infinity Option (NICE-TO-HAVE)

**What:** Add optional `infinite` prop to Skeleton base component that sets `repeat: Infinity` instead of the default 10 cycles.

**Why:** Edge case: if a slow server response takes 20+ seconds, the 10-cycle shimmer (15s total) stops animating while content still loads. The skeleton appears "frozen." An `infinite` prop for known-slow pages would prevent this.

**Design compliance:** Opt-in only; default behavior unchanged. Accessibility: still respects `useAnimationPreference().shouldAnimate`.

**Implementation hint:** `<Skeleton infinite />` → `repeat: infinite ? Infinity : 10` in base.tsx animation config.

---

### 10. Offline State Centralization (NICE-TO-HAVE)

**What:** Merge `useCustomerOfflineSync` and `OfflineIndicator` online/offline tracking into a single shared context or event emitter.

**Why:** Both independently track `navigator.onLine` and listen to window events. Two separate state machines for the same boolean creates risk of desynchronization and duplicate event handlers.

**Design compliance:** DRY principle. Reference: driver offline uses single `useOfflineSync` hook.

**Implementation hint:** Create `OfflineContext` provider wrapping customer layout. Both `OfflineIndicator` and `useCustomerOfflineSync` consume from it instead of duplicating listeners.

---

### 11. Storybook Skeleton Stories (NICE-TO-HAVE)

**What:** Add Storybook stories for all new skeleton components (OrdersListSkeleton, OrderDetailSkeleton, AccountSkeleton) showing light mode, dark mode, and reduced motion variants.

**Why:** Visual regression coverage for loading states. Skeletons are pure UI with no data dependencies — ideal Storybook candidates.

**Design compliance:** Storybook already configured (port 6006). No new dependencies.

**Implementation hint:** Co-locate `.stories.tsx` files with components. Use CSF3 format.

---

### 12. Cart Sync Retry Timer (NICE-TO-HAVE)

**What:** Add a background retry timer (60s interval) for cart sync, matching the driver offline sync pattern.

**Why:** The "online" event isn't 100% reliable — some networks report online but have no actual connectivity. A periodic retry ensures pendingSync items eventually get validated even if the initial online event fails.

**Design compliance:** Matches `useOfflineSync.ts` pattern (60s polling when queue non-empty + online).

**Implementation hint:** Inside `useCartSyncOnReconnect`, add:
```typescript
useEffect(() => {
  if (!hasPendingItems || !isOnline) return;
  const timer = setInterval(syncCartItems, 60_000);
  return () => clearInterval(timer);
}, [hasPendingItems, isOnline]);
```

---

_Recommendations generated: 2026-04-09_
