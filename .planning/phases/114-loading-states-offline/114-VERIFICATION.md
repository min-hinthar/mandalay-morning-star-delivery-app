---
phase: 114-loading-states-offline
verified: 2026-04-12T03:56:00Z
status: human_needed
score: 6/6 must-haves verified
re_verification: false
human_verification:
  - test: "Mobile skeleton layout fidelity on real device"
    expected: "Orders list, order detail, and account skeletons visually match the real page layout on iPhone 12 (390x844). Skeleton cards, headers, and tab bars align with actual content dimensions."
    why_human: "Content-shaped skeletons are verified at the code level (DOM structure matches), but visual fidelity on a real mobile viewport requires browser observation."
  - test: "IDB-first menu load on cold start"
    expected: "Clear service worker cache. Load /menu with network offline. Previously-cached menu items appear instantly from IndexedDB. Stale badge appears if cache is >24h."
    why_human: "IDB-first loading is code-verified (idbLoadedRef guard, 24h stale check), but offline cold-start behavior requires a real browser with DevTools network disabled."
  - test: "Cart sync on reconnect"
    expected: "Add items to cart while offline (pendingSync=true). Go online. Items sync against /api/menu -- price changes update, unavailable items removed with 30s toast."
    why_human: "setupOnlineListener and syncPendingCartItems are code-verified, but the full offline-to-online sync flow requires toggling network state in a real browser."
---

# Phase 114: Loading States & Offline -- Verification Report

**Phase Goal:** Customers see content-shaped previews while pages load and can browse the menu offline
**Verified:** 2026-04-12T03:56:00Z
**Status:** human_needed
**Re-verification:** No -- initial verification

---

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Orders list, order detail, and account pages show content-shaped skeletons | PASS | `OrdersListSkeleton.tsx` (33 lines), `OrderDetailSkeleton.tsx` (97 lines), `AccountSkeleton.tsx` (28 lines) |
| 2 | Loading state hierarchy enforced: skeleton for page loads, timeout fallback after 15s | PASS | `orders/loading.tsx:5` and `account/loading.tsx:5`: `<LoadingWithTimeout skeleton={...} timeoutMs={15000} />` |
| 3 | Cold-start offline shows cached menu from IndexedDB | ? HUMAN | `useMenuCache.ts:28-34` idbLoadedRef guard + 24h stale check; requires offline browser test |
| 4 | Cart items marked pendingSync sync when connectivity returns | ? HUMAN | `cart-store.ts:537` setupOnlineListener + line 432 syncPendingCartItems; requires network toggle test |

**Code-level score:** 4/4 truths have complete implementations. 2 require human testing for offline/reconnect behavior.

---

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/components/ui/orders/OrdersListSkeleton.tsx` | VERIFIED | 33 lines, gradient bg, 3 staggered OrderCardSkeleton instances |
| `src/components/ui/orders/OrderDetailSkeleton.tsx` | VERIFIED | 97 lines, 7 content-shaped sections matching real page layout |
| `src/components/ui/account/AccountSkeleton.tsx` | VERIFIED | 28 lines, title + 4-tab bar + content area |
| `src/components/ui/menu/useMenuCache.ts` | VERIFIED | 104 lines, IDB-first loading, idbLoadedRef guard, 24h stale check |
| `src/components/ui/SkeletonCrossfade.tsx` | VERIFIED | 78 lines, shared ui/ path (promoted from admin/) |
| `src/components/ui/LoadingWithTimeout` | VERIFIED | Used in 3 customer loading.tsx files with timeoutMs=15000 |
| `docs/loading-hierarchy.md` | VERIFIED | 44 lines, 3-tier pattern documented |
| `src/lib/stores/cart-store.ts` setupOnlineListener | VERIFIED | Line 537: setupOnlineListener function; line 550: auto-invoked |
| `src/lib/stores/cart-store.ts` purgeStalePendingSync | VERIFIED | Line 527: export function; line 355: called on hydration |

**Artifact score:** 9/9 artifacts present and verified.

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `orders/loading.tsx` | `OrdersListSkeleton` | import + LoadingWithTimeout | WIRED | Line 1: import, line 5: skeleton prop |
| `orders/[id]/loading.tsx` | `OrderDetailSkeleton` | import + LoadingWithTimeout | WIRED | LoadingWithTimeout wrapping confirmed |
| `account/loading.tsx` | `AccountSkeleton` | import + LoadingWithTimeout | WIRED | Line 1: import, line 5: skeleton prop |
| `useMenuCache.ts` | IndexedDB (idb-keyval) | idbLoadedRef mount effect | WIRED | Lines 28-34: ref guard, get() call |
| `cart-store.ts` | `/api/menu` | setupOnlineListener fetch | WIRED | Line 537: listener setup, line 432: sync function |
| `cart-store.ts` | toast | `duration: 30_000` | WIRED | Line 499: 30s duration (ToastOptions lacks persistent field) |
| admin SkeletonCrossfade | shared ui/ SkeletonCrossfade | re-export barrel | WIRED | admin/ version is 3-line re-export |

**Link score:** 7/7 key links wired.

---

### Behavioral Spot-Checks

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| OrdersListSkeleton has gradient bg + staggered cards | File inspection (33 lines) | Gradient bg, header, 3 OrderCardSkeleton | PASS |
| OrderDetailSkeleton has 7 sections | File inspection (97 lines) | All 7 content sections present | PASS |
| AccountSkeleton has 4-tab bar | File inspection (28 lines) | Title + 4 tab placeholders + content | PASS |
| LoadingWithTimeout at 15s on 3 pages | grep timeoutMs in loading.tsx files | All 3 show timeoutMs={15000} | PASS |
| SkeletonCrossfade at shared path (78 LOC) | wc -l SkeletonCrossfade.tsx | 78 lines confirmed | PASS |
| useMenuCache IDB-first with 24h stale check | grep idbLoadedRef + stale | Lines 28-34, 41-43 | PASS |
| Cart sync uses duration: 30_000 not persistent | grep in cart-store.ts | Line 499: `duration: 30_000` | PASS |
| purgeStalePendingSync on hydration | grep in cart-store.ts | Line 355: called during hydration | PASS |

---

### Requirements Coverage

| Req ID | Source Plan | Description | Status | Evidence |
|--------|------------|-------------|--------|---------|
| LOAD-01 | 114-01 | Orders list content-shaped skeleton | SATISFIED | OrdersListSkeleton.tsx (33 lines), orders/loading.tsx swapped |
| LOAD-02 | 114-01 | Order detail content-shaped skeleton | SATISFIED | OrderDetailSkeleton.tsx (97 lines), orders/[id]/loading.tsx swapped |
| LOAD-03 | 114-01 | Account page content-shaped skeleton | SATISFIED | AccountSkeleton.tsx (28 lines), account/loading.tsx swapped |
| LOAD-04 | 114-03 | IDB-first menu cache for offline | SATISFIED (human confirm) | useMenuCache.ts: 104 lines, idbLoadedRef guard, 24h stale check |
| LOAD-05 | 114-02 | Loading hierarchy enforcement | SATISFIED | 3 loading.tsx files use LoadingWithTimeout at 15s; docs/loading-hierarchy.md (44 lines) |
| CFIX-08 | 114-03 | Cart sync on reconnect | SATISFIED (human confirm) | cart-store.ts:537 setupOnlineListener, :432 syncPendingCartItems, :499 duration: 30_000 |

**Score: 6/6 requirements satisfied.** LOAD-04 and CFIX-08 require human testing for offline/reconnect scenarios.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | -- | -- | -- | No anti-patterns found in Phase 114 files |

---

### Human Verification Required

#### 1. Mobile Skeleton Layout Fidelity

**Test:** Open Chrome DevTools, iPhone 12 (390x844). Navigate to /orders, /orders/[id], /account with network throttling (Slow 3G).
**Expected:** Content-shaped skeletons mirror real page layout -- card borders, header spacing, tab bar alignment match actual components.
**Why human:** DOM structure is code-verified, but visual alignment on mobile viewport requires browser observation.

#### 2. IDB-First Menu Load (Offline)

**Test:** Visit /menu once (populates IDB cache). Go offline in DevTools. Hard refresh /menu.
**Expected:** Menu items render from IDB cache instantly. If cache >24h, stale badge appears.
**Why human:** idbLoadedRef + stale check are code-verified, but offline cold-start requires real browser.

#### 3. Cart Sync on Reconnect

**Test:** Go offline. Add items to cart (pendingSync: true). Go online. Watch console/toasts.
**Expected:** syncPendingCartItems fires, validates against /api/menu, updates prices, removes unavailable items with 30s toast.
**Why human:** setupOnlineListener is code-verified, but the full offline-to-online flow requires network state toggling.

---

### Gaps Summary

No code-level gaps found. All 6 requirements have complete implementations. The `human_needed` status reflects that LOAD-04 and CFIX-08 are offline/reconnect behaviors that cannot be fully confirmed by static analysis -- they require a browser with network state toggling.

---

_Verified: 2026-04-12T03:56:00Z_
_Verifier: Claude (gsd-verifier)_
