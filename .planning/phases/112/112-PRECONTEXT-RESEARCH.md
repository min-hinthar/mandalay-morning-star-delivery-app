# Phase 112: Order Tracking Overhaul — Pre-Context Research

**Phase:** 112 — Order Tracking Overhaul
**Goal:** Customers can reliably track their delivery on mobile with a usable map and stable connection
**Depends on:** Phase 110 (Critical Fixes & Data Reliability)
**Requirements:** CFIX-10, TRAK-01, TRAK-02, TRAK-03, TRAK-04
**Generated:** 2026-04-08 via deep-phase-assumptions 12-agent protocol

---

## 1. Resolved Assumptions

### Technical Approach (HIGH confidence)

| Decision | Choice | Source |
|---|---|---|
| Bottom sheet library | **Reuse existing `src/components/ui/Drawer.tsx`** — no vaul, no Radix Dialog drawer | Wave 1 Agent 5; Wave 2 Agent 8, Agent 12 |
| Snap points | **Binary** (collapsed peek ↔ full 95vh) — Drawer.tsx does not support 3-tier snap | Drawer.tsx:52,257 |
| Backoff curve | **Reuse Phase 110 constants verbatim** — `Math.min(1000 * 2 ** i, 30000)` | query-provider.tsx:41-43 |
| Reconnect retries | **Infinite while page open** — no max attempt counter (delivery window 30-90 min) | query-provider.tsx + delivery domain |
| Visibility pause aggression | **`removeChannel()` for BOTH channels** when hidden — not idle | Wave 2 Agent 12; Supabase billing model |
| Reconnect on resume | **Immediate** `fetchTrackingData()` + `setupSubscriptions()` | useTrackingSubscription.ts |
| Mute scope | **Global per-user localStorage** key — persists across orders | useSoundPreference precedent |
| Mute storage key | `"trackingAudioMuted"` (boolean) | New |
| Reconnect banner debounce | **2s delay** before showing (avoid flash on momentary blips) | Phase 111 banner UX |
| Banner placement | **Below header, above map** (z-25) | TrackingPageClient.tsx:217 |
| Mute icon placement | **Header**, between ShareButton and RefreshCw button | TrackingPageClient.tsx:198-210 |
| Desktop scope | **Mobile-only sheet** — desktop `lg:grid-cols-2` unchanged | TrackingPageClient.tsx:217 |

### Implementation Order (HIGH confidence)

1. **TRAK-04 (exponential backoff)** — pure logic, single hook, low risk, foundation for TRAK-02 timing
2. **TRAK-03 (visibility pause)** — same hook as #1, mirrors Phase 111 conditional polling pattern
3. **TRAK-02 (Reconnecting banner)** — depends on #1's stable backoff state
4. **CFIX-10 (mute toggle)** — independent, header-only, ~30 LOC
5. **TRAK-01 (bottom sheet layout)** — biggest visual change, last to land

### Backend/Frontend Split

| Layer | Changes |
|---|---|
| Backend | **None** — no API contract changes, no DB schema, no migration, no RLS policy changes |
| Client hook | `useTrackingSubscription.ts` major refactor (backoff, visibility, channel cleanup) |
| Client component | `TrackingPageClient.tsx` major refactor (Drawer wrap, mute toggle, banner) |
| Types | `src/types/tracking.ts` minor — add mute state shape if needed |
| Tokens | One alias addition (`border-status-warning` — minor) |

---

## 2. Realistic Data/Scale Analysis

| Metric | Current | Phase 112 Impact |
|---|---|---|
| Concurrent tracking sessions | 20-50 (Saturday peak) | Unchanged — no new channels |
| Realtime channel cost | 2 channels per active session × 50 = 100 | **Reduced** — visibility pause kills idle channels |
| Polling fallback frequency | 30s | Unchanged |
| Reconnect attempts under bad network | Linear 5s × infinite | **Exponential 1→30s capped** — fewer total requests on extended outage |
| Audio play count | 1 per status change × 4-5 transitions = 4-5/order | **0** if user mutes (currently unmutable) |
| Tab visibility hidden % | Unmeasured but high — users tab away while waiting | **Measurable savings** from removeChannel + polling stop |

**Bandwidth calculation:** Without backoff, 5s polling × 12 retries/min × 50 sessions = 3000 req/min during outage. With backoff (1+2+4+8+16+30 = 61s for 6 retries), ~6 req/min/session × 50 = 300 req/min — **10x reduction** during outage events.

---

## 3. Cross-Phase Contract Inventory

### From Phase 110 (Critical Fixes & Data Reliability) — **inherited contracts**

| Contract | Source | Phase 112 Use |
|---|---|---|
| `Math.min(1000 * 2 ** i, 30000)` backoff curve | `src/lib/providers/query-provider.tsx:41-43` | TRAK-04 reconnect — extract to shared util |
| `QUERY_RETRY_ATTEMPTS = 3` constant | query-provider.tsx:22 | Reference for max-attempt patterns |
| `RETRY_BACKOFF_MAX_MS = 30000` constant | query-provider.tsx | Cap for tracking reconnect |
| Retry filter (5xx + 429 + status 0 only) | query-provider.tsx:31-36 | Future polling retry behavior |
| AbortController + setTimeout cleanup pattern | usePaymentSubmit.ts | TRAK-04 polling cleanup |
| ClientErrorCodes registry | `src/types/errors.ts` | Add `TRACKING_RECONNECT_TIMEOUT` if needed |
| `queryKeys` factory | `src/lib/queryKeys.ts:12-29` | If polling moves to React Query |

### From Phase 111 (Checkout Conversion) — **inherited patterns**

| Contract | Source | Phase 112 Use |
|---|---|---|
| Conditional polling gate | `useMenu.ts:47` (`refetchInterval: enabled ? MS : false`) | TRAK-03 visibility-gated polling |
| Direct Zustand selector (no useMemo) | `useMenu.ts:42-47` | Reactive transition handling |
| `aria-live="polite"` banner pattern | `CheckoutErrorBanner.tsx:219` | TRAK-02 banner accessibility |
| `bg-status-warning-bg + text-status-warning` tokens | `CheckoutErrorBanner.tsx` | TRAK-02 banner styling |
| Direction-aware banner with icons | `CheckoutErrorBanner.tsx:192-197,378-433` | TRAK-02 (could mirror or simpler) |

### What Phase 112 must NOT break

- React Query default options (queries retry 3x, mutations never retry)
- Existing rate limit tier `customerLimiter` (30/min on `/api/tracking/{orderId}`)
- Realtime channel cleanup pattern (race protection at useTrackingSubscription.ts:177-181)
- `bg-cream` page background, sticky header z-20 layering
- LazyDeliveryMap component (do not modify map internals)
- Drawer.tsx exit animation (`duration: 0.15s easeIn` — mobile Safari GPU crash protection — never make spring)

### Forward contracts (what Phase 112 feeds into)

| Future Phase | What it consumes from Phase 112 |
|---|---|
| **Phase 113 (A11Y)** | Mute button must hit 44px touch target, banner must pass WCAG AA contrast, focus indicator must be consistent |
| **Phase 114 (Loading States)** | Tracking page skeleton may need new shape (full-height map placeholder + sheet skeleton) |
| **Phase 116 (Polish)** | Sticky button patterns from mute toggle could inform sticky reorder button (UXPL-05) |

---

## 4. Existing Codebase Inventory

### Files Phase 112 will MODIFY

| File | Lines | Modification scope |
|---|---|---|
| `src/lib/hooks/useTrackingSubscription.ts` | 328 | **MAJOR** — backoff, visibility pause, channel cleanup, mute integration |
| `src/components/ui/orders/tracking/TrackingPageClient.tsx` | 381 | **MAJOR** — Drawer wrap, mute toggle, audio gate, banner integration |

### Files Phase 112 will CREATE

| File | Purpose |
|---|---|
| `src/components/ui/orders/tracking/ReconnectingBanner.tsx` | TRAK-02 banner — reusable, ~80 LOC |
| `src/components/ui/orders/tracking/MuteToggle.tsx` | CFIX-10 button — ~50 LOC |
| `src/lib/hooks/useMutePreference.ts` | localStorage-backed mute state — ~40 LOC |
| `src/lib/hooks/__tests__/useTrackingSubscription.test.ts` | Expand existing tests for backoff + visibility |
| `src/lib/utils/backoff.ts` (optional) | Extract Phase 110 backoff to shared util |

### Files Phase 112 will READ but NOT modify

- `src/components/ui/Drawer.tsx` (use as bottom sheet primitive)
- `src/lib/providers/query-provider.tsx` (import backoff constants)
- `src/lib/hooks/useAnimationPreference.ts` (gate animations)
- `src/components/ui/maps/LazyMaps.tsx` (LazyDeliveryMap untouched)
- `src/types/tracking.ts` (consume types)

### Existing constants (already defined)

| Constant | Location | Value |
|---|---|---|
| `POLLING_INTERVAL` | useTrackingSubscription.ts:29 | 30000 (30s) |
| `RECONNECT_DELAY` | useTrackingSubscription.ts:32 | **5000 — replace with array** |
| `RETRY_BACKOFF_BASE_MS` | query-provider.tsx | 1000 |
| `RETRY_BACKOFF_MAX_MS` | query-provider.tsx | 30000 |
| `QUERY_RETRY_ATTEMPTS` | query-provider.tsx | 3 |
| `AVERAGE_SPEED_MPH` | eta.ts:10 | 35 |

### Existing hooks available for reuse

- `useTrackingSubscription` — main subscription hook
- `useShowLiveTracking` — derives map visibility (`useTrackingSubscription.ts:332-337`)
- `useLastUpdateDisplay` — formats "5m ago" (`useTrackingSubscription.ts:342-380`)
- `useSafeInterval` — battery-aware interval (already used in ETACountdown)
- `useAnimationPreference` — motion gate (`useAnimationPreference.ts`)
- `useBodyScrollLock` — for sheet body lock (already used in Drawer.tsx)
- `useReducedMotion` — Framer Motion built-in

### Test coverage gap

Current test file `src/lib/hooks/__tests__/useTrackingSubscription.test.ts` (291 lines):
- ✅ `useShowLiveTracking` (4 tests)
- ✅ `useLastUpdateDisplay` (5 tests)
- ✅ State shape validation (3 tests)
- ✅ Realtime handlers mocked (3 tests)
- ✅ Polling constants (2 tests)
- ❌ **No tests** for setupSubscriptions reconnect logic
- ❌ **No tests** for visibility behavior (doesn't exist yet)
- ❌ **No tests** for exponential backoff curve (doesn't exist yet)
- ❌ **No tests** for mute persistence (doesn't exist yet)

---

## 5. Gotcha Inventory (Critical / High / Medium)

### CRITICAL — production blockers

| ID | Gotcha | Source | Fix |
|---|---|---|---|
| C-1 | **Drawer exit must stay `duration: 0.15s easeIn`** — not spring. Spring exit caused cascading mobile Safari GPU compositor crashes (commit 4087d3bf, 2026-01-30). | Drawer.tsx:85-106 + comment | Do NOT modify Drawer.tsx exit animation. Phase 112 wraps Drawer, doesn't reconfigure it. |
| C-2 | **`document.visibilitychange` listener cleanup** — must `removeEventListener` in useEffect return; otherwise listeners accumulate on remount and audio fires on hidden tab. | performance.md:18-40 | Listener registered inside `useEffect`, cleanup in returned function |
| C-3 | **Realtime channel accumulation** — Supabase does not auto-unsubscribe on unmount. `removeChannel()` must be called for both `channelRef` and `locationChannelRef`. | useTrackingSubscription.ts:290-305 + supabase-auth.md | Existing pattern; preserve in TRAK-03 visibility logic |
| C-4 | **Audio autoplay policy** — `audio.play()` requires prior user gesture on mobile. First mute toggle action also unblocks; subsequent plays succeed. | W3C autoplay spec | Wrap in `try/catch` (already done at TrackingPageClient.tsx:90); handle promise rejection silently |
| C-5 | **localStorage SSR safety** — read-on-mount only, not in render. Hydration mismatch otherwise. | useAnimationPreference.ts:62-67 | `useState(false)` + `useEffect` reads localStorage, sets `isHydrated` flag |

### HIGH — likely to bite

| ID | Gotcha | Source | Fix |
|---|---|---|---|
| H-1 | **iOS Safari `100vh` excludes safe area** — bottom sheet at 100vh is too tall, hidden by home indicator | mobile-ux.md:80-95 | Use `100dvh` (dynamic viewport) or `100svh`; also `pb-safe` utility |
| H-2 | **Two-layer touch action** — height="full" blocks swipe; content `touchAction: "pan-y"` blocks too if non-overflowing. ResizeObserver detects + removes `touchAction`. | mobile-ux.md:63-76 | Drawer.tsx already handles this correctly; reuse |
| H-3 | **Channel subscription race on visibility flip-flop** — user tabs in/out rapidly, `setupSubscriptions()` called multiple times before previous SUBSCRIBED returns | useTrackingSubscription.ts:177-181 | Existing race protection (clear pending reconnect timeout); extend to visibility handler |
| H-4 | **Reconnecting banner flicker** — momentary network blip (200-500ms) shows + hides banner instantly = jarring | Phase 111 UX precedent | 2s debounce before showing (set state after 2s timer if still disconnected) |
| H-5 | **Body scroll lock + AnimatePresence exit** — `window.scrollTo()` during exit animation crashes iOS Safari | mobile-ux.md:8-12, Drawer.tsx commit 4087d3bf | Drawer.tsx already uses `deferRestore: true` + `onExitComplete` — preserve |
| H-6 | **Map gesture conflict with sheet drag** — full-viewport map below sheet handle = touches near sheet edge ambiguous | Inferred from bottom sheet patterns | Sheet drag handle 44px tall, map `touch-action: pan-x pan-y` only inside sheet bounds |
| H-7 | **`useEffect` deps for visibility listener** — `[]` deps captures stale refs to `setupSubscriptions` | react-patterns.md + Phase 110 patterns | Define listener inside same `useEffect` as subscription setup, share closure scope |
| H-8 | **Mute icon must use `aria-pressed`** — not just visual swap; screen readers need toggle state | useAnimationPreference.tsx:39-85 | `<button aria-pressed={isMuted}>` |
| H-9 | **`google.maps.*` in `useMemo` runs before API loads** — guard with `if (!isLoaded) return null` | Project CLAUDE.md gotcha | Phase 112 doesn't touch map internals — verify LazyDeliveryMap unchanged |

### MEDIUM — worth knowing

| ID | Gotcha | Source | Fix |
|---|---|---|---|
| M-1 | **NearbyBanner already does audio + haptic** — its pattern is canonical for new banners | NearbyBanner.tsx:40-69 | Mirror exactly; do not invent new audio loading code |
| M-2 | **`PostgREST FK hints` regression risk** | data-schema.md, project CLAUDE.md | Phase 112 doesn't touch SQL — N/A |
| M-3 | **`loading="lazy"` + `opacity: 0` containers** | animation.md:27-34 | Phase 112 doesn't add new images |
| M-4 | **AnimatePresence direction refs synchronous** — direction state set in useEffect runs after render, AnimatePresence reads stale | animation.md:1-5 | If using direction in banner, set ref synchronously before state change |
| M-5 | **`useRef` on conditional render targets breaks observers** | DeliveryMapCard fix commit 9bc12e6e | Use stable wrapper for map IntersectionObserver — already fixed in LazyMaps |
| M-6 | **Reduced motion gap in StatusStepper** | Wave 2 Agent 8 finding | Pre-existing — out of scope for Phase 112 (flag for Phase 113) |

---

## 6. Data Contracts

### TrackingData (consumed, not changed)

```typescript
// src/types/tracking.ts:23-32
interface TrackingData {
  order: TrackingOrderInfo;           // Full order with items, address, status
  routeStop: TrackingRouteStopInfo | null;
  driver: TrackingDriverInfo | null;
  driverLocation: DriverLocation | null;
  eta: { minMinutes; maxMinutes; estimatedArrival } | null;
  routeId: string | null;
  restaurantLocation: LatLng;
  rating: number | null;
}
```

### TrackingSubscriptionState (existing return shape — unchanged)

```typescript
interface TrackingSubscriptionState {
  isConnected: boolean;
  connectionError: string | null;
  orderStatus: OrderStatus | null;
  stopStatus: RouteStopStatus | null;
  driverLocation: DriverLocation | null;
  stopEta: string | null;
  deliveryPhotoUrl: string | null;
  lastUpdate: Date | null;
}
```

### New: useMutePreference return shape

```typescript
interface MutePreferenceReturn {
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
  isHydrated: boolean;  // SSR safety
}
```

### Realtime channel filter format (unchanged)

```typescript
// Tracking channel: postgres_changes UPDATE
{ event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` }
{ event: "UPDATE", schema: "public", table: "route_stops", filter: `order_id=eq.${orderId}` }

// Location channel: postgres_changes INSERT
{ event: "INSERT", schema: "public", table: "location_updates", filter: `route_id=eq.${routeId}` }
```

### Subscription state machine (extending existing)

```
[Initial] → setupSubscriptions()
   ↓ subscribe callback
SUBSCRIBED ↔ CLOSED/CHANNEL_ERROR
   ↓                  ↓
isConnected=true    isConnected=false
stopPolling()       startPolling()
                    setTimeout(setupSubscriptions, backoffMs)

[NEW: visibility hidden]
   ↓
removeChannel(both)
stopPolling()
clear reconnectTimeout

[NEW: visibility visible]
   ↓
fetchTrackingData()
setupSubscriptions()
```

---

## 7. Design Compliance Matrix

| Principle | Phase 112 Compliance |
|---|---|
| Tailwind v4 token-only | ✅ All colors via existing tokens (`bg-status-warning-bg`, `text-status-warning`, `bg-cream`, `text-charcoal-*`) |
| 4px spacing grid | ✅ Sheet snap height in vh (allowed); padding all 4px multiples |
| Motion tokens | ✅ Spring damping=30 stiffness=300 (existing `overlayMotion.sheetOpen`) |
| Z-index tokens | ✅ Sheet z-50 (modal level), banner z-25 (between sticky header z-20 and modal z-40) |
| Touch targets ≥44px | ✅ Mute button 44px, drag handle 44px tall hit area |
| `prefers-reduced-motion` | ✅ Drawer.tsx already handles; banner uses `useAnimationPreference()` |
| `aria-live` for status | ✅ Banner `role="status" aria-live="polite"` |
| `aria-pressed` for toggle | ✅ Mute button |
| Dark mode tokens | ✅ All chosen tokens have dark variants |
| ESLint hardcoded color/px rules | ✅ No hex colors, all spacing tokenized |

---

## 8. Identity/Brand Ethical Framework

(Source: docs/frontend-design-system.md + email templates)

### Voice principles

- **Warmth, not corporate** — "Reconnecting..." (calm), not "Connection lost" (alarming)
- **Conversational possessives** — "Your driver", "Your delicious meal"
- **Burmese family-business undertone** — emails open with "Mingalabar!"; tracking page can echo
- **Brevity over completeness** — status text ≤2 sentences; trust haptic + visual for the rest

### Forbidden patterns

- ❌ "ERROR: Connection lost" or "FAILED" framing
- ❌ Technical jargon ("WebSocket disconnected", "HTTP 503")
- ❌ Exclamation marks for error states (reserved for celebration: "Delivered!")
- ❌ Generic AI gradients / corporate blue palette

### Phase 112-specific copy

| Element | Recommended Copy | Why |
|---|---|---|
| Reconnecting banner title | "Reconnecting..." | Calm, action-oriented, matches existing header dot |
| Reconnecting banner subtitle (optional) | "We're updating your driver's location" | Conversational, reassuring, "we" not "system" |
| Mute button label (aria-label) | "Mute notifications" / "Unmute notifications" | Match toggle state |
| Mute toast (on toggle) | None — visual icon swap is enough | Reduce noise |
| Banner dismiss action | None — auto-dismiss on reconnect | Calm UX |

---

## 9. Architectural Decisions

### D-1: Bottom sheet library — **Drawer.tsx (existing)**

**Options evaluated:**
- **vaul** (~3KB, Linear/Vercel use it) — would need new dependency
- **@radix-ui/react-dialog** (already installed) + custom drag — would duplicate Drawer.tsx work
- **Drawer.tsx** (existing custom) — already supports bottom sheet, swipe-to-dismiss, focus trap, scroll lock, mobile Safari GPU protection

**Chosen: Drawer.tsx** — battle-tested, mobile Safari hardened, zero new deps, V8 architecture compliance (no external registries).

### D-2: Snap points — **Binary**

**Options evaluated:**
- 3-tier (peek 25% / half 60% / full 95%) — would require Drawer.tsx extension
- 2-tier (peek + full) — minimal extension
- Binary (collapsed peek with header summary visible / expanded 95vh) — current Drawer.tsx supports

**Chosen: Binary** — Drawer.tsx supports this natively. Peek state shows essential info (driver name, ETA, status). Full state shows everything.

### D-3: Backoff implementation — **Reuse Phase 110 formula, extract to util**

**Options evaluated:**
- Inline `Math.min(1000 * 2 ** i, 30000)` in useTrackingSubscription.ts
- Import directly from query-provider.tsx (cross-module dependency)
- Extract to `src/lib/utils/backoff.ts` shared util

**Chosen: Extract to util** — query-provider.tsx imports same util; tracking hook imports same util; future polling consumers reuse. ~10 LOC.

### D-4: Visibility pause aggression — **removeChannel + stop polling**

**Options evaluated:**
- Idle channel (keep connected, just stop callbacks) — Supabase still bills for active connection
- Stop polling only, keep Realtime — saves polling but Realtime channel idles
- removeChannel + stopPolling — clean state, savings on both

**Chosen: removeChannel + stopPolling** — cleanest state, no idle billing, fast reconnect on visible (initial fetch covers gap).

### D-5: Mute persistence — **Global localStorage, per-user**

**Options evaluated:**
- Per-order localStorage (unique key per order ID) — user has to mute every order
- Server-side user preference — overkill, requires schema change
- Global localStorage `trackingAudioMuted` — once muted, all tracking pages respect

**Chosen: Global localStorage** — matches `useSoundPreference` precedent.

### D-6: Reconnect banner debounce — **2s**

**Options evaluated:**
- 0s (immediate) — flickers on momentary blips
- 5s (Phase 111 patient) — too late, user notices "stuck"
- 2s — sweet spot, ignores blips, surfaces real issues

**Chosen: 2s** — set `showBanner = true` after 2s timer if still disconnected. Clear timer on reconnect.

### D-7: Banner placement — **Below header, fixed top**

**Options evaluated:**
- Inside header (replace "Live" indicator) — too crowded
- Floating in info pane — invisible when sheet collapsed
- Fixed below header — visible regardless of sheet state, escapes scroll

**Chosen: Fixed top, below header** — `position: fixed; top: 56px; z-index: 25`.

### D-8: Mute icon — **Header, between Share and Refresh**

**Chosen: Header position** — adjacent to other connection-related controls. Volume2/VolumeX from lucide-react (already installed).

---

## 10. File Map

### CREATE

| Path | Purpose | Est. LOC |
|---|---|---|
| `src/components/ui/orders/tracking/ReconnectingBanner.tsx` | TRAK-02 banner with 2s debounce, aria-live, dark mode | ~80 |
| `src/components/ui/orders/tracking/MuteToggle.tsx` | CFIX-10 button with aria-pressed, lucide icons | ~50 |
| `src/lib/hooks/useMutePreference.ts` | localStorage-backed mute hook (SSR-safe) | ~40 |
| `src/lib/utils/backoff.ts` | Shared exponential backoff util (extracted from query-provider) | ~20 |
| `src/lib/hooks/__tests__/useMutePreference.test.ts` | Mute hook tests | ~80 |

### MODIFY

| Path | Modification |
|---|---|
| `src/lib/hooks/useTrackingSubscription.ts` | Add visibility listener, replace RECONNECT_DELAY with backoff util, accept mute state |
| `src/components/ui/orders/tracking/TrackingPageClient.tsx` | Wrap mobile layout in Drawer, mount banner + mute toggle, gate audio with mute state |
| `src/lib/providers/query-provider.tsx` | Refactor to import from `lib/utils/backoff.ts` |
| `src/lib/hooks/__tests__/useTrackingSubscription.test.ts` | Expand: backoff curve test, visibility pause test, channel cleanup verification |
| `src/components/ui/orders/tracking/index.ts` | Re-export new components |

### READ-ONLY (reference)

- `src/components/ui/Drawer.tsx`
- `src/lib/providers/query-provider.tsx`
- `src/lib/hooks/useAnimationPreference.ts`
- `src/lib/design-system/tokens/motion.ts`
- `src/components/ui/orders/tracking/NearbyBanner.tsx` (audio pattern reference)

---

## 11. Gray Area Resolutions

All 15 gray areas resolved to HIGH confidence in Wave 2 Agent 12. Summary:

| # | Gray Area | Resolution |
|---|---|---|
| 1 | Mute scope | Global localStorage per-user |
| 2 | Snap points | Binary (collapsed/full) |
| 3 | Banner timing | 2s debounce |
| 4 | Max retries | Infinite while page open |
| 5 | Visibility pause | removeChannel BOTH + stopPolling |
| 6 | Reconnect on resume | Immediate fetchTrackingData() |
| 7 | Mute persistence | Global localStorage |
| 8 | Banner placement | Below header, z-25, fixed top |
| 9 | Mute icon position | Header, between Share and Refresh |
| 10 | Desktop scope | Mobile-only sheet, desktop unchanged |
| 11 | Test additions | Backoff curve, visibility, mute persistence |
| 12 | Realtime RLS | Inherited automatically (no extra filters) |
| 13 | Location channel pause | Both channels removed together |
| 14 | Sheet drag perf | Drawer.tsx willChange already handles |
| 15 | vaul vs Drawer | Drawer.tsx (no new deps) |

---

## 12. Animation/Ceremony Implementation Patterns

### Drawer.tsx (bottom sheet base) — already implemented

- **Open spring:** `damping: 30, stiffness: 300` (heavy, weighty feel)
- **Exit transition:** `duration: 0.15s easeIn` — **MUST NOT BECOME SPRING** (mobile Safari GPU crash, commit 4087d3bf)
- **Backdrop:** `duration: 0.2s easeOut`
- **Drag handle:** `w-12 h-1.5 rounded-full bg-border-default`, scale + darken on drag
- **Swipe-to-dismiss:** 150px threshold + velocity-based, haptic on close
- **Focus trap:** Tab cycles within drawer, restores prior active element on close
- **Body scroll lock:** `useBodyScrollLock(isOpen, { deferRestore: true })` + `onExitComplete`
- **Reduced motion:** Switches to `duration: 0` instant variants

### Reconnecting banner (TRAK-02) — new

- **Enter:** `m.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}`
- **Spring:** `stiffness: 300, damping: 25` (matches NearbyBanner.tsx:81-86)
- **Exit:** `duration: 0.15s easeIn` (matches Drawer pattern)
- **Reduced motion:** Use `useAnimationPreference().getSpring()` gate
- **Aria:** `role="status" aria-live="polite"`

### Mute toggle (CFIX-10) — new

- **Icon swap:** Volume2 ↔ VolumeX from lucide-react
- **Click feedback:** `triggerHaptic("light")` (existing util)
- **Animation:** Optional scale pulse `spring.snappy` (`stiffness: 600, damping: 35`)
- **Reduced motion:** Instant icon swap, no spring

### Audio gate

```typescript
// In TrackingPageClient status transition useEffect:
if (!isMuted && !document.hidden) {
  try {
    const audio = new Audio("/sounds/notification.mp3");
    audio.volume = 0.2;
    void audio.play().catch(() => {/* graceful */});
  } catch {/* skip */}
}
```

---

## 13. Core Domain Architecture

### Realtime channel lifecycle (extended for Phase 112)

```
Mount
  ├── fetchTrackingData() [initial]
  ├── setupSubscriptions() [tracking channel]
  ├── setupLocationSubscription() [location channel, if routeId]
  └── document.addEventListener('visibilitychange', handler)

Subscribe SUBSCRIBED
  └── isConnected=true, stopPolling(), reset backoff attempt counter

Subscribe CLOSED|CHANNEL_ERROR
  ├── isConnected=false
  ├── startPolling() [30s interval fallback]
  ├── attempt++
  └── setTimeout(setupSubscriptions, backoffDelay(attempt))
       where backoffDelay(i) = Math.min(1000 * 2**i, 30000)

visibilitychange → hidden
  ├── removeChannel(channelRef.current)
  ├── removeChannel(locationChannelRef.current)
  ├── stopPolling()
  └── clearTimeout(reconnectTimeoutRef.current)

visibilitychange → visible
  ├── fetchTrackingData() [refresh state]
  ├── setupSubscriptions() [re-subscribe tracking]
  └── setupLocationSubscription() [re-subscribe location]

Unmount
  ├── removeChannel(both)
  ├── stopPolling()
  ├── clearTimeout
  └── document.removeEventListener('visibilitychange', handler)
```

### Polling fallback (unchanged interval)

- 30-second interval via `setInterval`
- Calls existing `fetchTrackingData()` (raw fetch, not React Query)
- Mutually exclusive with active Realtime — auto-stop on SUBSCRIBED, auto-start on CLOSED

### ETA calculation (unchanged)

- Server-side only in `/api/tracking/[orderId]` route
- Inputs: driver lat/lng, customer lat/lng, remainingStops
- Formula: Haversine × 1.3 road factor / 35mph + (5min × stops × buffer)
- Output: { minMinutes, maxMinutes, estimatedArrival }

### Service boundaries (unchanged)

- **Client:** Realtime subscription, polling fallback, audio playback, mute state
- **Server:** Auth check, RLS enforcement, 6 DB queries, ETA calculation, rate limit (`customerLimiter` 30/min)
- **Realtime:** RLS-enforced automatically on subscribed tables — no extra filters needed in channel.on() calls

---

## 14. Expanded Gotcha Inventory (Wave 2 findings merged)

(Already merged into Section 5 above. Total: 5 Critical, 9 High, 6 Medium = **20 gotchas** with file:line evidence.)

---

## 15. Design Token Audit Results

### Token gaps

| Token | Status | Workaround |
|---|---|---|
| `border-status-warning` | **MISSING** alias | Use `border-status-warning` color directly: `style={{borderColor: 'var(--color-status-warning)'}}` OR add alias in Tailwind config |

All other tokens needed for Phase 112 already exist.

### Verified-ready tokens

- **Colors:** `bg-status-warning-bg`, `text-status-warning`, `bg-cream`, `text-charcoal-*`, `bg-overlay-heavy`
- **Z-index:** `z-20` (sticky), `z-40` (backdrop), `z-50` (modal/sheet), `z-[80]` (toast)
- **Motion:** `overlayMotion.sheetOpen`, `overlayMotion.modalOpen`, `overlayMotion.backdrop`, all spring presets
- **Spacing:** Full 4px grid + safe area utilities (`pb-safe`, `pt-safe`, `min-h-safe-bottom`)
- **Blur:** `blur-md` through `blur-3xl`
- **Easing:** `ease-default`, `ease-spring`, `ease-in-out`
- **Duration:** `duration-fast` (150ms), `duration-normal` (220ms), `duration-slow` (350ms)

### Arbitrary values: permitted

- `h-[100dvh]`, `h-[100svh]` — viewport-dependent layouts (precedent in Drawer.tsx with `max-h-[calc(95vh-3rem)]`)
- ESLint blocks hex colors and arbitrary px-spacing only

### Token additions for Phase 112 (1 minor)

```typescript
// tailwind.config.ts — add alias under status object
borderColor: {
  "status-warning": "var(--color-status-warning)",
}
```

---

## Appendix A: Wave 1 + Wave 2 Agent Outputs

This research consolidated findings from 12 parallel agents:
- **Wave 1:** Identity/Brand, Specs, Prototypes, Phase Audit, Codebase, Learnings
- **Wave 2:** Learnings Mapping, Animation/Ceremony, Core Domain, Tokens, Git History, Gray Areas

All findings cited inline with file:line evidence. Source documents preserved in conversation history.

---

_Generated 2026-04-08 — Phase 112 deep-phase-assumptions protocol_
