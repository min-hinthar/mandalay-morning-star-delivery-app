# Phase 111: Checkout Conversion — Pre-Context Research

**Date:** 2026-04-07
**Phase Goal:** Customers complete checkout on first attempt even after payment errors or price changes
**Requirements:** CFIX-07, CFIX-09, CHKP-01, CHKP-02, CHKP-03, CHKP-04
**Research Method:** 12-agent parallel deep research (Wave 1 + Wave 2)
**Depends on:** Phase 110 (foundation: query key factory, retry config, AbortController patterns, persistent toast flag, ClientErrorCodes)

---

## 1. Resolved Assumptions

### Technical Approach (HIGH confidence after Wave 2)

| Fix | Approach | Rationale |
|-----|----------|-----------|
| **CFIX-07** | Rely on existing `useCheckoutStore` `persist()` middleware (sessionStorage). Verify all 13 form fields stay in `partialize` after Stripe error path. **No store changes needed** — persistence already covers address/time/contact/payment/notes/tip/promo. Add E2E test to lock contract. | Phase 110 already established `persist()` on checkout-store with sessionStorage. Stripe redirect uses `window.location.href` (same-tab) — sessionStorage survives. The bug is NOT missing persistence; it's that no test asserts the persistence covers payment-error retry paths. Lock the contract with a test. |
| **CFIX-09** | Add conditional `refetchInterval` to `useMenu` hook: `refetchInterval: isCartNonEmpty ? 3 * 60 * 1000 : false`. Read cart state via `useCartStore((s) => s.items.length > 0)` selector. On price change detected (already exposed by `useCartValidation.priceChangedIds`), trigger `CheckoutErrorBanner` with new `PRICE_CHANGED` code. | Requirement: "Menu periodically refetches (2-5 min) while cart non-empty". 3 minutes is the midpoint of the 2-5 range and avoids hammering the menu API. `useCartValidation` already detects price changes via live menu comparison — Phase 111 only needs to wire periodic refetch + surface the change. Conditional polling avoids unnecessary fetches on `/menu` browsing. |
| **CHKP-01** | Change all 3 checkout forms (`AddressFormV8`, `TimeStepV8` contact inputs, `PaymentStepV8` contact inputs) to `mode: "onTouched"` in `useForm`. Field validates on first blur, then on every keystroke after. Existing `getFieldState` helper + `ValidatedInput`'s `validationState` prop already render the green checkmark / red shake — only the RHF mode needs changing. | RHF `onTouched` mode is the canonical "validate as user types" pattern that doesn't fire on every initial keystroke. `onChange` fires on first character (annoying), `onSubmit` (current) only fires after submit (the bug). `onTouched` waits for blur, then becomes reactive. This is exactly what users expect from "validation as I type after I've tabbed past once." |
| **CHKP-02** | Extend `CheckoutErrorBanner` with new `PRICE_CHANGED` case. Build on the direction-mismatch pattern (lines 195-256): show old price → new price → "Update cart" CTA. Pull old price from cart (`cartItem.basePriceCents`) and new price from validation result (`validation.newPriceCents`). Use `priceDirection: 'up' \| 'down'` to color-code (status-warning for up, status-success for down). | Existing direction-mismatch banner already shows "what changed → clickable action pills" — perfect model. `useCartValidation` already exposes `priceChangedIds`, `newPriceCents`, `priceDirection` — no new data plumbing. Required: a new component case + one new error code constant. |
| **CHKP-03** | In `CheckoutClient.tsx`, on `step === "address"`, prefetch `/api/menu` (already cached by Phase 110 query key factory) AND any time-window-relevant queries. On `step === "time"`, prefetch the customer's saved profile (used by payment step contact prefill). Use `queryClient.prefetchQuery({ queryKey, queryFn })` from `useQueryClient()` hook — NOT the local QueryClient ref. | Prefetching reduces perceived latency on step transitions. The address step takes the longest (typing address) so prefetching menu validation data + profile data during it gives ~2-5s of free background work. Phase 110's query key factory makes this trivially safe. |
| **CHKP-04** | Extend `CutoffModal` with optional `nextDeliveryDateOption` prop (display string + date string) and `onReschedule` callback. Add a primary "Reschedule to {date}" button between "Got it" and "Browse Menu". Compute the date in `CheckoutClient` using `getNextDeliveryDate(now, deliveryDays)` — already exists in `delivery-dates.ts:231`. On click: call `setDelivery({ date, windowStart, windowEnd })` from `useCheckoutStore`, close modal, navigate to time step. | The hard work is already done — `getNextDeliveryDate` returns the next available delivery date respecting day-of-week + cutoff + direction. The new UX is a single button that wires it to the existing checkout-store mutator. Requirement is unambiguous: "one-click reschedule to next available delivery date". |

### Implementation Order (Goal-Backward Sequencing)

```
CHKP-04 (cutoff modal reschedule — extends existing modal, no other deps)
   ↓
CFIX-07 (form persistence test only — verify what already exists)
   ↓
CHKP-01 (RHF onTouched mode flip — 3 forms, isolated change)
   ↓
CFIX-09 (refetchInterval on useMenu, gated on cart) ──┐
CHKP-02 (CheckoutErrorBanner PRICE_CHANGED case)     ─┤── Depends on CFIX-09 wiring
                                                       ┘
CHKP-03 (prefetch on step transitions — uses query key factory)
```

**Dependency reasoning:** CHKP-04 is the most isolated (just modal extension). CFIX-07 is verification + test only. CHKP-01 is a one-line config change per form. CFIX-09 + CHKP-02 are tightly coupled (refetch detects → banner displays). CHKP-03 is independent prefetching.

### Backend Requirements

**No new tables, no new API routes, no new RPC functions.** All Phase 111 work is client-side.

| Touch | Purpose |
|-------|---------|
| `src/lib/hooks/useMenu.ts` | Add conditional `refetchInterval` arg + new hook variant `useMenuWithCartPolling()` OR refactor `useMenu` to accept polling param |
| `src/components/ui/checkout/AddressFormV8.tsx` | Add `mode: "onTouched"` to `useForm` |
| `src/components/ui/checkout/PaymentStepV8.tsx` | Add `mode: "onTouched"` to phone/name `useForm` (if RHF) — verify implementation |
| `src/components/ui/checkout/CheckoutErrorBanner.tsx` | Add `PRICE_CHANGED` case using direction-mismatch render pattern |
| `src/components/ui/delivery/CutoffModal.tsx` | Add optional `nextDeliveryDateOption` + `onReschedule` props |
| `src/app/(customer)/checkout/CheckoutClient.tsx` | Wire `nextDeliveryDateOption` computation + `onReschedule` handler. Add `useQueryClient()` prefetch on step transitions. |
| `src/types/errors.ts` | Add `PRICE_CHANGED` to `ClientErrorCodes` enum (or new server-emitted code) |
| `src/lib/hooks/useCartValidation.ts` | Verify it already exposes `priceChangedIds` + `newPriceCents` + `priceDirection` (it does — no changes needed) |
| **Tests:** `CheckoutClient.test.tsx`, `usePaymentSubmit.test.ts` | Add CFIX-07 form persistence assertions across error paths |

---

## 2. Realistic Data/Scale Analysis

| Variable | Production Reality |
|----------|-------------------|
| Concurrent customers in checkout | ~1-5 typical, ~10 peak Saturday morning |
| Form-field count per step | Address: 6 fields, Time: 1 selection, Payment: 2 contact + 1 method |
| Menu poll frequency (CFIX-09) | 3 min interval × ~5 typical browse-time minutes = 1-2 polls per cart session |
| Menu API payload size | ~30-80KB (50-100 items × ~500 bytes each) |
| Price change frequency | <1% of items per day (admin manual menu edits) — polling rarely produces a banner |
| Time on address step | p50 ~30s, p95 ~120s — generous prefetch window for CHKP-03 |
| Stripe error rate | ~0.5% of sessions (per Phase 110 metrics) — CFIX-07 is exercised on 1-in-200 checkouts |
| Cutoff modal trigger rate | ~5% of checkout sessions (peak around Friday 2-3 PM) — CHKP-04 reschedule is high-impact |
| sessionStorage size | 13 form fields × ~100 bytes = ~1.3 KB per checkout session — well under 5 MB limit |

**Implication:** Polling at 3min × ~10 active sessions × 80KB = ~2.4 MB/min menu egress at peak — trivial. Prefetching during address step gives 30-120s headroom — even slow networks complete prefetch invisibly. Form persistence is essentially free at 1.3KB.

---

## 3. Cross-Phase Contract Inventory

### What Phase 111 Inherits (MUST NOT BREAK)

| From Phase | Contract | Risk if broken |
|---|---|---|
| **Phase 81** (v1.9) | `CutoffModal` preserves cart items on close; default actions are `Got it` + `Browse Menu` | CHKP-04 must ADD reschedule button without removing existing actions |
| **Phase 84** (v1.9) | `checkoutLimiter` (3/1m) on `/api/checkout/session` | N/A — Phase 111 doesn't change rate limiting |
| **Phase 106** (v2.2) | `getZonedDayOfWeek()`, `TIMEZONE` constant, `isPastCutoffForDay()`, `getNextDeliveryDate()` | CHKP-04 reschedule MUST use `getNextDeliveryDate()`, never `getUTCDay()` |
| **Phase 108** (v2.2) | 13 rate limiters via Upstash REST; in-memory fallback | CFIX-09 polling frequency must not trigger rate limit (3min interval is well under any limiter) |
| **Phase 110-01** | `src/lib/queryKeys.ts` factory with `menu.list()`, `menu.search(q)`, `addresses.list()`, `orders.history()` | CHKP-03 prefetch + CFIX-09 invalidation MUST use factory keys, not inline arrays |
| **Phase 110-01** | `shouldRetryQuery` + `queryRetryDelay` exported from `query-provider.tsx`; `mutations: { retry: false }` | Phase 111 must NOT add `retry: true` to any mutation |
| **Phase 110-02** | `EmptyCheckoutError` component; render-time empty cart guard in `CheckoutClient.tsx`; `useCart((s) => s.items.length === 0)` selector pattern | CHKP-03 prefetch must not run when cart is empty (would trigger empty cart redirect) |
| **Phase 110-02** | `cutoffModalOpen` prop on `PaymentStepV8`; defense-in-depth disabled state + handler early return | CHKP-04 must keep `cutoffModalOpen` semantically correct — closing the modal via reschedule MUST set `showCutoffModal: false` |
| **Phase 110-03** | `STRIPE_TIMEOUT_MS = 10000`; `usePaymentSubmit` AbortController + cleanup pattern; persistent toast on `CHECKOUT_NETWORK_TIMEOUT` | CFIX-07 form persistence verification must cover this timeout path |
| **Phase 110-03** | `CART_VALIDATION_TIMEOUT_MS = 30000`; `useCartValidation` exposes `timedOut` + `proceedAnyway` | CFIX-09 polling must NOT trigger the 30s timeout (separate refetch path) |
| **Phase 110-03** | `ClientErrorCodes` enum (`CHECKOUT_NETWORK_TIMEOUT`, `CART_VALIDATION_TIMEOUT`); `useToast.persistent: boolean` flag | CHKP-02 should add `PRICE_CHANGED` to `ClientErrorCodes` for grep-discoverability |
| **Phase 110-03** | `useToast` is the persistent-capable toast hook; `useToastV8` is NOT | Phase 111 critical errors MUST import from `useToast`, not `useToastV8` |
| **BUG-06** (cart-store) | Debounce atomicity inside `set()` callback | Phase 111 must NOT touch `cart-store.ts` |

### What Phase 111 Feeds Into

| To Phase | What 111 provides | Why it matters |
|---|---|---|
| **Phase 112** (Order Tracking) | Conditional polling pattern (CFIX-09) | TRAK-03 polls only when tab visible — same enable/disable predicate pattern |
| **Phase 113** (A11Y) | RHF `onTouched` mode for inline validation | A11Y form validation builds on this — error announcements need real-time errors to announce |
| **Phase 114** (Loading & Offline) | `prefetchQuery` patterns from CHKP-03 | Loading states benefit from prefetched data being instantly available |
| **Phase 115** (Data Layer) | Polling pattern (CFIX-09) inverts to deduplication (DATA-03) — both rely on query key factory consistency | Cache invalidation in DATA-01 needs the same key conventions |
| **Phase 116** (Polish) | `CutoffModal` with reschedule button serves as model for "destructive action with one-click recovery" | UXPL-01 undo toast extends this UX principle |

---

## 4. Form & Validation Implementation Patterns (Reuse Existing)

### React Hook Form Wiring (current state)

**`AddressFormV8.tsx` (lines 46-79):**
- Already uses `useForm({ resolver: zodResolver(addressFormSchema) })`
- Exposes `register`, `handleSubmit`, `control`, `formState: { errors, dirtyFields, touchedFields }`
- Has `getFieldState(field)` helper that returns `'invalid' | 'valid' | 'idle'` based on `errors` + `touchedFields` + `dirtyFields`
- Uses `<ValidatedInput>` which accepts `validationState` and renders green checkmark / red shake / error message
- **Default `mode: "onSubmit"`** — this is the bug
- **One-line fix:** add `mode: "onTouched"` to `useForm` call

**Why `onTouched` not `onChange`:**
- `onChange`: validates on every keystroke → fires on first character → "Required" flashes immediately as user starts typing → annoying
- `onBlur`: validates only on blur → user can't tell mid-typing if their fix is working
- `onTouched`: validates on first blur, THEN on every keystroke → matches "as user types" requirement after the user has interacted with the field once
- `all`: validates on both blur AND change AND submit → equivalent to `onTouched` for our purposes but more re-renders

**RHF Sources (verified):** [react-hook-form.com/docs](https://react-hook-form.com/docs/useform#mode) — `onTouched` is the recommended mode for "validate after first interaction"

### Validation Schemas (existing, no changes needed)

| File | Schema | Coverage |
|---|---|---|
| `src/lib/validations/address.ts` | `addressFormSchema` | label, line1, city, state (2-char), postalCode |
| `src/lib/validations/checkout.ts` (likely) | Phone + name schemas | Verify path during planning |

### Form-Persistence Storage (verified, already correct)

**`useCheckoutStore` partializes 13 fields** (`checkout-store.ts:113-128`):
```
addressId, address, delivery, customerNotes, tipPercent, customTipCents,
promoCode, promoApplied, discountCents, discountLabel, deliveryInstructions,
paymentMethod, customerPhone, customerName
```

**NOT persisted:** `step` — resets to "address" on reload. This is intentional (Phase 110 left it out). For CFIX-07, the user typically doesn't reload; they hit a Stripe error and click Retry, which re-invokes `handleCheckout` without unmounting the store. Persistence is more of a safety net for the same-tab Stripe redirect path.

**Storage:** `sessionStorage` (line 105) — survives same-tab navigation including Stripe redirect, dies on tab close. This is the correct trade-off (no leakage across tabs/users).

---

## 5. Gotcha Inventory

### Critical (Must Fix or Avoid)

| # | Gotcha | Source | Fix Guidance | Phase 111 Fix |
|---|---|---|---|---|
| 1 | `void asyncFn()` killed on Vercel before completing | `nextjs.md` | Use `await` or `after()` | CHKP-03 prefetch must use `await queryClient.prefetchQuery()`, not `void` |
| 2 | `useToast` vs `useToastV8` split — only `useToast` has `persistent` flag | `useToast.ts:13-19` vs `useToastV8.ts` (no flag) | All Phase 111 critical-error toasts MUST `import { toast } from "@/lib/hooks/useToast"` | CHKP-02 price change toast (if used as fallback) |
| 3 | `getUTCDay()` wrong in LA timezone | Project CLAUDE.md, Phase 106 | Use `getZonedDayOfWeek()` / `getNextDeliveryDate()` | CHKP-04 reschedule date computation |
| 4 | RHF `mode: "onChange"` triggers on first keystroke → flashes "Required" before user finishes typing | RHF docs, UX research | Use `mode: "onTouched"` instead | CHKP-01 |
| 5 | `refetchInterval` runs in background indefinitely if not gated → memory leak when cart cleared mid-checkout | TanStack Query docs | Conditional `refetchInterval: isNonEmpty ? 180000 : false` AND ensure cart selector subscribes correctly | CFIX-09 |
| 6 | `useQueryClient()` returns the provider client; do NOT import the local `queryClient` ref from `query-provider.tsx` (it's not exported) | `query-provider.tsx:46` (local `useState`) | Always use `useQueryClient()` hook in components | CHKP-03 prefetch |

### High (Likely to Bite)

| # | Gotcha | Source | Fix Guidance | Phase 111 Fix |
|---|---|---|---|---|
| 7 | `CutoffModal` `onClose` is bound to `setShowCutoffModal(false)` — adding a reschedule button must call BOTH `onClose` AND the navigation handler, otherwise modal stays open | `CheckoutClient.tsx:295` | New `onReschedule` should compose: `() => { onReschedule(); onClose(); }` | CHKP-04 |
| 8 | Stripe redirect uses `window.location.href = data.data.sessionUrl` (same-tab) | `usePaymentSubmit.ts:203` | sessionStorage survives this (it's the same tab); confirm in test | CFIX-07 verification |
| 9 | `useCheckoutStore` `step` is NOT persisted (line 113-128 omits it) | `checkout-store.ts:113-128` | After Stripe error retry, user lands back on `step: "address"` if they reload — but won't reload in normal Retry flow. Document this trade-off. | CFIX-07 |
| 10 | `prefetchQuery` with stale `staleTime` will not refetch — must respect cache or pass override | TanStack Query docs | Use `prefetchQuery({ ...key, queryFn, staleTime: 0 })` if forcing fresh fetch | CHKP-03 |
| 11 | `useCartValidation` exposes `priceChangedIds` but does NOT auto-render banner — banner is consumer's responsibility | `useCartValidation.ts:303-312` | Wire `CheckoutErrorBanner` in `CheckoutClient.tsx` to show on `priceChangedIds.length > 0` | CHKP-02 |
| 12 | Polling + AbortController interaction: `refetchInterval` doesn't pass through to controller | TanStack Query: refetchInterval is internal | The 30s `useCartValidation` AbortController is on a separate refetch path; CFIX-09's `refetchInterval` won't conflict with it | CFIX-09 |

### Medium (Watch For)

| # | Gotcha | Source | Fix Guidance |
|---|---|---|---|
| 13 | `process.env.STRIPE_SECRET_KEY` inlined at build | Project CLAUDE.md | N/A — Phase 111 doesn't touch server env |
| 14 | `loading="lazy"` + animated containers (opacity 0) = images never load | Project CLAUDE.md | N/A for Phase 111 |
| 15 | Spring physics inconsistent across components | Phase 113 scope | N/A — Phase 113 owns this |
| 16 | Hydration race when cart selector flips during refetch | Phase 110 lessons | Use direct selector `useCartStore((s) => s.items.length > 0)`, not memo |
| 17 | Modal action button inside `<Link asChild>` swallows the onClick handler if href is malformed | Phase 102 lesson | Test CHKP-04 reschedule button isolated from Link |

---

## 6. Data Contracts

### Existing Error Code → UI Mapping (preserved + extended)

| Error code | Source | Client handling | UI shown |
|---|---|---|---|
| `VALIDATION_ERROR` | server | `setError` + ErrorBanner | Direction-mismatch w/ clickable date pills |
| `CUTOFF_PASSED` | server (line 85, 97) | `onCutoffPassed()` callback → opens CutoffModal | Modal w/ next delivery date + **NEW: Reschedule button** |
| `STRIPE_ERROR` | server (line 417) | ErrorBanner | "Payment service error" + Try Again |
| `CHECKOUT_NETWORK_TIMEOUT` | client (Phase 110) | ErrorBanner + persistent toast | "Checkout Timed Out" + Try Again |
| `CART_VALIDATION_TIMEOUT` | client (Phase 110) | Validation hook `timedOut: true` | Inline banner + Proceed Anyway |
| **NEW: `PRICE_CHANGED`** | client (Phase 111) | `useCartValidation.priceChangedIds` non-empty triggers banner | "Price Changed" + old → new + Update Cart |

### CutoffModal Extended Props (CHKP-04)

```typescript
// Current (Phase 81)
export interface CutoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextDeliveryDate: string; // display string e.g. "Saturday, April 12"
}

// Phase 111 extension (additive, backward-compatible)
export interface CutoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextDeliveryDate: string;
  /**
   * Phase 111 CHKP-04 — when present, renders a primary
   * "Reschedule to {label}" button that calls onReschedule then onClose.
   */
  rescheduleOption?: {
    /** ISO date string for selectedDelivery (e.g. "2026-04-11") */
    dateString: string;
    /** Display label (e.g. "Saturday, April 11") */
    displayDate: string;
  };
  /** Phase 111 CHKP-04 — invoked when reschedule button clicked */
  onReschedule?: () => void;
}
```

### useMenu Polling Variant (CFIX-09)

```typescript
// src/lib/hooks/useMenu.ts — extended signature
export function useMenu(options?: { pollWhileNonEmpty?: boolean }) {
  const isCartNonEmpty = useCartStore((s) => s.items.length > 0);
  return useQuery<MenuResponse>({
    queryKey: queryKeys.menu.list(),
    queryFn: async () => { /* ... */ },
    staleTime: 5 * 60 * 1000,
    refetchInterval: options?.pollWhileNonEmpty && isCartNonEmpty
      ? 3 * 60 * 1000  // 3 min — middle of 2-5 range
      : false,
  });
}
```

**Call sites:**
- `useCartValidation.ts` calls `useMenu()` — change to `useMenu({ pollWhileNonEmpty: true })`
- `MenuClient.tsx` (browsing) calls `useMenu()` — leave default (no polling)

### CheckoutErrorBanner PRICE_CHANGED Case (CHKP-02)

```typescript
case "PRICE_CHANGED": {
  const details = error.details as {
    items: Array<{
      name: string;
      oldPriceCents: number;
      newPriceCents: number;
      direction: "up" | "down";
    }>;
  };
  return renderPriceChange(details, onUpdateCart);
}
```

---

## 7. Customer Trust Principles (Phase 111 Guardrails)

| Principle | Confidence | Source |
|---|---|---|
| **Form state must survive transient errors** | HIGH | ROADMAP 111 #1: "Payment error preserves all form fields"; PROJECT.md customer trust |
| **Inline validation: helpful, not nagging** | HIGH | RHF `onTouched` is the canonical "after first interaction" pattern |
| **Price changes must be transparent (not just blocked)** | HIGH | ROADMAP 111 #3: "show old-vs-new price explanation, not just Dismiss"; v1.9 retro lesson |
| **Cutoff modal: one-click recovery offered when possible** | HIGH | ROADMAP 111 #4: "one-click reschedule to next available delivery date" |
| **Polling: respectful, gated, observable** | HIGH | CFIX-09 spec: only while cart non-empty; 2-5 min cadence |
| **Tone: warm, family business, bilingual** | MEDIUM | PROJECT.md context; CutoffModal already uses Burmese alongside English |

### Forbidden Anti-Patterns (Phase 111 must avoid)

- `mode: "onChange"` (flashes errors on first keystroke)
- Polling when cart is empty (wastes bandwidth, no UX value)
- Toast-only price-change notification (must be persistent banner — toast vanishes)
- Reschedule button that doesn't actually reschedule (must call `setDelivery`, not just close modal)
- `void queryClient.prefetchQuery(...)` (Vercel kills it)
- Importing `toast` from `useToastV8` for critical errors (no `persistent` flag there)

---

## 8. Identity/Brand Ethical Framework

**Mandalay Morning Star tone (verified from `CutoffModal.tsx:44-62`):**
- Warm reassurance: "We'd love to see you then"
- Family-business voice (no corporate speak)
- Bilingual: English + Burmese (`မှာယူမှုကို ယာယီပိတ်ထားပါသည်`)
- Reassurance about preserved state: "Your cart items are saved for next time" + Burmese

**CHKP-04 reschedule button copy (suggested):**
- English primary: "Reschedule to {Saturday, April 11}"
- Burmese secondary: "{Saturday, April 11} ဆီသို့ ပြောင်းမည်" (verify with native speaker before ship)
- Tone: helpful, not pushy — primary action visually but not the only path

**CHKP-02 price change copy:**
- English: "Heads up — the price of {item} has changed since you added it to your cart."
- Detail: "Old: $X.XX → New: $Y.YY"
- Burmese (if existing pattern): line under English in muted text
- Action: "Update cart" (matches existing `onUpdateCart` pattern in `CheckoutErrorBanner`)
- **Avoid**: "Item rejected", "Price violation", or any transactional/punitive language

---

## 9. Architectural Decisions

| Decision | Options Considered | Chosen | Rationale |
|---|---|---|---|
| **CFIX-07 storage strategy** | (A) Keep sessionStorage, (B) IDB, (C) localStorage, (D) URL params | **(A) sessionStorage** | Already in place (Phase 110); covers same-tab Stripe redirect; auto-purges on tab close (no leak); ~1.3KB total — well under quota. Only required change is adding test coverage. |
| **CHKP-01 RHF mode** | `onSubmit` / `onBlur` / `onChange` / `onTouched` / `all` | **`onTouched`** | Validates after first blur, then on every change. Matches "as user types" without nagging on first character. RHF docs recommend this exact mode for inline validation. |
| **CFIX-09 polling cadence** | 2 min / 3 min / 5 min / variable | **3 min** | Middle of 2-5 range. With p99 menu fetch ~1s and ~2KB egress per poll, even 100 concurrent customers = 6.6KB/s — negligible. 3 min catches admin price edits quickly without thundering. |
| **CFIX-09 polling gate** | (A) Always on, (B) Cart non-empty only, (C) Checkout step only | **(B) Cart non-empty** | Polling on `/menu` browsing wastes bandwidth (the user is already looking at fresh menu data). Cart non-empty = customer has committed to items and price changes are actionable. Checkout-only would miss price changes during pre-checkout cart review. |
| **CHKP-02 banner vs toast** | Banner only / toast only / both | **Banner only** | Toasts auto-dismiss (5s) — customer can miss the message. Persistent banner in checkout-error region forces acknowledgment. Toast is acceptable as adjunct on `/menu` page (not Phase 111 scope). |
| **CHKP-02 data source** | Add `priceSnapshot` to CartItem / Use existing live comparison | **Existing live comparison** | `useCartValidation.ts:106` already compares `cartItem.basePriceCents` (stored at add time) vs `found.item.basePriceCents` (live from menu). The "snapshot" IS the cart item's persisted price. No new schema. |
| **CHKP-03 prefetch trigger** | (A) On step change, (B) On step focus, (C) On render of next button | **(A) On step change** | Step change = user committed to advancing. Effects fire after render — gives natural prefetch window. Avoids speculative prefetch when user is mid-typing. |
| **CHKP-03 prefetch keys** | Address step → menu / time step → profile / payment step → ? | **menu (during address) + profile (during time)** | Menu is the heaviest (~50KB) and most commonly stale; profile is small but used for contact prefill. Payment step has no remote data to prefetch. |
| **CHKP-04 reschedule auto-advance** | (a) Just set delivery + close modal, (b) Set delivery + advance to time step, (c) Set delivery + advance to payment | **(b) Set delivery + advance to time** | The customer is on the time step when modal fires (or address). Set delivery, close modal, set step to "time" so they can review the new time window before payment. Don't skip past time step — that's where window selection lives. |
| **CHKP-04 button placement** | Primary / Secondary / Above other actions | **Primary, between "Got it" and "Browse Menu"** | "Got it" remains for users who want to bail. "Reschedule" is the helpful path. "Browse Menu" remains for items-not-yet-in-cart users. Three actions, increasing commitment left-to-right. |
| **PRICE_CHANGED error code home** | New file / extend `ClientErrorCodes` / inline string | **Extend `ClientErrorCodes`** | Already established home for client-side codes (Phase 110 D-33). Grep-discoverable. Type-safe via `ClientErrorCode` union. |

---

## 10. File Map

### Files to CREATE

| File | Purpose | Lines (est) |
|---|---|---|
| `src/components/ui/checkout/PriceChangeBanner.stories.tsx` | Storybook coverage for new CHKP-02 case | ~60 |
| `src/__tests__/checkout/form-persistence.test.tsx` (or co-located) | CFIX-07 verification — assert all 13 fields survive Stripe error path | ~120 |

### Files to MODIFY

| File | Fix | Change Summary |
|---|---|---|
| `src/lib/hooks/useMenu.ts` | CFIX-09 | Add `pollWhileNonEmpty` option; conditional `refetchInterval: 3 * 60 * 1000`; subscribe to `useCartStore((s) => s.items.length > 0)` |
| `src/lib/hooks/useCartValidation.ts` | CFIX-09 | Update `useMenu()` call site to pass `{ pollWhileNonEmpty: true }` |
| `src/components/ui/checkout/AddressFormV8.tsx` | CHKP-01 | Add `mode: "onTouched"` to `useForm` config (line 51) |
| `src/components/ui/checkout/PaymentStepV8.tsx` | CHKP-01 | Verify phone/name inputs use RHF; if so, add `mode: "onTouched"`; if plain inputs, wire to RHF or document why not |
| `src/components/ui/checkout/CheckoutErrorBanner.tsx` | CHKP-02 | Add `case "PRICE_CHANGED"` (line 91 switch); add `renderPriceChange()` function (~50 lines, mirrors `renderDirectionMismatch`) |
| `src/components/ui/delivery/CutoffModal.tsx` | CHKP-04 | Add `rescheduleOption?` + `onReschedule?` props; add primary button between "Got it" and "Browse Menu" when option present |
| `src/app/(customer)/checkout/CheckoutClient.tsx` | CHKP-04, CHKP-03, CHKP-02 | Compute `nextDeliveryDateOption` via `getNextDeliveryDate(now, deliveryDays)`; pass to CutoffModal; on reschedule call `setDelivery()` + `setStep("time")`; add `useQueryClient()` + step-transition `prefetchQuery` calls; render `CheckoutErrorBanner` when `priceChangedIds.length > 0` |
| `src/types/errors.ts` | CHKP-02 | Add `PRICE_CHANGED: "PRICE_CHANGED"` to `ClientErrorCodes` |

### Files to READ (reference, no changes)

| File | Purpose |
|---|---|
| `src/lib/queryKeys.ts` | Already complete (Phase 110); use as-is for prefetch keys |
| `src/lib/providers/query-provider.tsx` | Verify `shouldRetryQuery` filter is in place (Phase 110 D-09) |
| `src/lib/stores/checkout-store.ts` | Verify `partialize` covers all 13 form fields (it does) |
| `src/lib/utils/delivery-dates.ts` | `getNextDeliveryDate(now, deliveryDays)` — line 231 |
| `src/lib/hooks/useToast.ts` | Persistent toast hook (NOT useToastV8) |
| `src/lib/hooks/useCartValidation.ts` | Already exposes `priceChangedIds`, `newPriceCents`, `priceDirection` |
| `src/types/cart.ts` | `CartItemValidation` shape — no changes needed |
| `src/components/ui/checkout/usePaymentSubmit.ts` | Stripe submit flow — verify CFIX-07 form-state survival |

### Files to NOT TOUCH

- `src/lib/stores/cart-store.ts` (BUG-06 debounce — Phase 110 verified)
- `src/lib/hooks/useToastV8.ts` (no `persistent` flag — wrong hook for critical errors)
- `src/app/api/checkout/session/route.ts` (server contract stable; CHKP-04 is client-side rescheduling)

---

## 11. Gray Area Resolutions

**12 gray areas resolved to HIGH confidence — see Wave 2 Agent 12 cross-reference findings.** Key resolutions:

| Area | Resolution |
|---|---|
| **CFIX-07: storage strategy** | sessionStorage already in place — verify with test, no new code |
| **CFIX-07: persist `step`?** | NO — step is not persisted intentionally; Stripe Retry path doesn't reload, so persistence is moot |
| **CFIX-09: polling cadence** | 3 minutes (middle of 2-5 range) |
| **CFIX-09: polling gate** | Cart non-empty only (checkout-only would miss pre-cart-review changes) |
| **CFIX-09: refetch path** | `refetchInterval` on `useMenu`, NOT manual `refetch()` (must satisfy "periodically refetches" requirement) |
| **CHKP-01: RHF mode** | `onTouched` (validates after first blur, then reactive) |
| **CHKP-01: scope** | All 3 forms in checkout flow (Address, Time contact, Payment contact) |
| **CHKP-02: data source** | Existing `useCartValidation` live comparison — no schema changes |
| **CHKP-02: surface** | Persistent banner via `CheckoutErrorBanner`, NOT toast |
| **CHKP-03: prefetch trigger** | On step change `useEffect` |
| **CHKP-03: prefetch scope** | Menu (during address) + profile (during time); no payment-step prefetch |
| **CHKP-04: button placement** | Primary, between "Got it" and "Browse Menu" |
| **CHKP-04: post-reschedule navigation** | `setDelivery()` + `setStep("time")` + close modal |
| **PRICE_CHANGED home** | `ClientErrorCodes` enum |
| **`useToast` vs `useToastV8`** | `useToast` (the one with `persistent` flag) for any critical Phase 111 toasts |

---

## 12. Animation/Ceremony Implementation Patterns

**Phase 111 animation scope is minimal** — leverages existing tokens. No new keyframes or springs.

| UI Element | Animation Approach |
|---|---|
| Inline validation error (CHKP-01) | Already implemented via `<ValidatedInput>` shake + `AnimatePresence` slide-in |
| `CheckoutErrorBanner` PRICE_CHANGED (CHKP-02) | Reuses existing `ErrorShake` + spring `default` (300/22/0.8) — already in place at line 182-186 |
| `CutoffModal` reschedule button (CHKP-04) | Reuses `<Button variant="primary">` — no new animation; modal entrance already animated via `Modal` component |
| Step transition prefetch (CHKP-03) | NO visible animation — prefetch is silent background work |
| Form field success state (CHKP-01) | Already implemented via `ValidatedInput.showSuccess` (green checkmark with `useAnimationPreference.getSpring(spring.snappy)`) |

**Spring tokens used (verified from `motion-tokens/core.ts`):**
- `spring.default` (300/22/0.8) — banner entrance (existing)
- `spring.snappy` (600/35/1) — error message slide-in (existing in `AddressFormV8.tsx:129`)
- `spring.gentle` (200/25/1) — form field scale (existing)

**Critical: `useAnimationPreference()` already wraps all springs** — Phase 111 must continue to use `getSpring(spring.X)` not raw `spring.X`, to honor `prefers-reduced-motion`.

---

## 13. Core Domain Architecture (Form Persistence + Polling + Prefetch)

### Form Persistence Flow (CFIX-07 verification)

```
1. Customer fills address/time/payment forms → useCheckoutStore mutators called
2. Each mutator → set(...) → Zustand persist middleware writes to sessionStorage
3. Customer clicks "Place Order" → handleCheckout fires
4. Server returns CUTOFF_PASSED / STRIPE_ERROR / CHECKOUT_NETWORK_TIMEOUT
5. Error banner / modal displays — component does NOT unmount (CheckoutClient stays mounted)
6. Customer fixes issue, clicks Retry → handleCheckout re-fires
7. useCheckoutStore state still in memory + sessionStorage — no reload occurred
8. Form values still in RHF state (component never unmounted)
9. Stripe success → window.location.href redirect → tab navigates away → sessionStorage persists
10. (Stripe → server webhook → email → return to /orders/:id confirmation page)
```

**Persistence is therefore "automatic" for paths 1-8.** The only failure mode is path 9 if customer navigates BACK to /checkout → sessionStorage rehydrates → form fields restore. Test must cover this.

### Polling State Machine (CFIX-09)

```
Cart empty:
  - useMenu()'s refetchInterval: false
  - No background polling

Cart becomes non-empty (item added):
  - useCartStore selector flips
  - useMenu() re-renders with refetchInterval: 180000
  - TanStack Query starts polling
  - Each poll: queryFn fetches /api/menu → updates cache
  - useCartValidation re-derives from new menu data
  - If priceChangedIds non-empty → CheckoutClient renders CheckoutErrorBanner

Cart becomes empty (cart cleared):
  - useCartStore selector flips
  - useMenu() re-renders with refetchInterval: false
  - TanStack Query stops polling
  - Polling resumes if items added again
```

**Edge case:** Customer clicks Stripe "Pay Now" → tab navigates to Stripe → `useMenu` unmounts → polling stops. On return to /checkout (failed payment), polling restarts. Correct behavior.

### Prefetch Flow (CHKP-03)

```
Step transition: address → time
  ↓
useEffect fires after render
  ↓
queryClient.prefetchQuery({
  queryKey: queryKeys.addresses.list(),  // for time step's saved profile
  queryFn: fetchProfile,
})
  ↓
TanStack Query writes to cache (no React state change)
  ↓
When customer reaches payment step → useProfile() reads from cache → instant
```

**Rule:** Prefetch is optional optimization — never block step transition on it. Use `void` is FORBIDDEN (Vercel kills); use `await` inside async useEffect callback OR fire-and-forget but explicitly catch errors.

### Reschedule Flow (CHKP-04)

```
1. Server returns CUTOFF_PASSED → onCutoffPassed() → setShowCutoffModal(true)
2. CutoffModal renders with rescheduleOption computed via getNextDeliveryDate(now, deliveryDays)
3. Customer clicks "Reschedule to Saturday, April 11"
4. onReschedule handler in CheckoutClient fires:
   a. Compute time window (use first window of new day or preserve existing window if compatible)
   b. Call setDelivery({ date: nextDelivery.dateString, windowStart, windowEnd })
   c. Call setStep("time") to land on time review
   d. Call setShowCutoffModal(false)
5. Customer is now on /checkout step="time" with new date pre-selected
6. Customer reviews window → clicks Continue → payment → submit
7. Server validates new date (no longer past cutoff) → success
```

**Key:** the reschedule sets BOTH the date AND a default time window. If `dayConfig` has multiple time windows, pick the first active one. Document this in plan.

---

## 14. Expanded Gotcha Inventory (Wave 2 Synthesis)

Cross-cutting risks affecting multiple Phase 111 fixes:

| Risk | Affected Fixes | Mitigation |
|---|---|---|
| **Polling not deduplicated with manual refetch** | CFIX-09 + CFIX-05 | `refetchInterval` and `refetch()` use the same query → TanStack Query deduplicates automatically. No double fetching. |
| **Prefetch racing with step-change unmount** | CHKP-03 | If user clicks Back during prefetch, the cache write still completes → benign (cache is just warmer). No leak. |
| **`useEffect` cleanup missing on prefetch** | CHKP-03 | Prefetch is a one-shot per step change; cleanup not required if no abort signal. But plan should add abort signal for slow networks. |
| **CHKP-04 reschedule when no next date exists** | CHKP-04 | `getNextDeliveryDate` returns `null` when no active days configured. Hide reschedule button if `null` (don't break the modal). |
| **Form persistence collides with `reset()` on unmount** | CFIX-07 | `CheckoutClient.tsx:159-161` calls `reset()` on unmount. The Stripe redirect path navigates away (unmount fires) → sessionStorage gets cleared via `reset()` → BAD. **Investigate during planning.** |
| **`onTouched` mode breaks first-time form fill UX** | CHKP-01 | `onTouched` does NOT fire on first render — only after first blur. Still helpful, doesn't break new-form UX. |

### Per-Fix Critical Gotchas (must check during planning)

- **CFIX-07:** ⚠️ Verify whether `useCheckoutStore.reset()` clears sessionStorage on `CheckoutClient` unmount during Stripe redirect — if YES, this BREAKS form persistence. Plan must either (a) skip reset on Stripe redirect path, or (b) re-test the actual production behavior. **Highest open risk.**
- **CFIX-09:** Polling fires `useMenu` queryFn → if Phase 110 retry config + 5xx → 3 retries with 30s backoff → first retry kicks in 1s after failure → plan for cumulative load
- **CHKP-01:** `onTouched` does NOT cover form-level errors (server returns 422); existing `triggerShake()` on `handleSubmit` error callback still needed
- **CHKP-02:** PRICE_CHANGED banner must DISMISS when customer clicks "Update cart" (prevents permanent banner)
- **CHKP-03:** Prefetch must use `useQueryClient()` hook, NOT import `queryClient` from provider (not exported)
- **CHKP-04:** `onReschedule` must compose: `setDelivery` + `setStep` + `setShowCutoffModal(false)` — missing any one breaks UX

---

## 15. Design Token Audit Results

**All Phase 111 UI elements have existing design tokens.** Zero new tokens needed.

| Element | Token Used | Status |
|---|---|---|
| Price-change banner background | `bg-status-warning-bg` (price up) / `bg-status-success-bg` (price down) | PASS |
| Price-change banner border | `border-status-warning/20` / `border-status-success/20` | PASS |
| Price-change icon | `text-status-warning` / `text-status-success` | PASS |
| Old price (struck through) | `text-text-muted line-through` | PASS |
| New price (emphasized) | `text-text-primary font-semibold` | PASS |
| Reschedule button | `<Button variant="primary" size="md">` | PASS |
| Modal three-action layout | `flex w-full flex-col gap-3 sm:flex-row sm:justify-center` | PASS (existing CutoffModal pattern) |
| Inline validation: valid state | `<ValidatedInput showSuccess={true}>` → green checkmark via existing token | PASS |
| Inline validation: invalid state | `<ValidatedInput shakeOnError={true}>` → spring.snappy shake | PASS |
| Toast persistent | `useToast({ ..., persistent: true })` (Phase 110 D-32) | PASS |

**Zero token gaps.** Phase 111 is entirely composable from existing primitives.

---

## 16. Open Questions to Resolve in Planning

**These are the only items requiring user/planner judgment before execution:**

| # | Question | Recommendation | Why |
|---|---|---|---|
| 1 | **Does `CheckoutClient.tsx:159-161` `reset()` on unmount clear sessionStorage during Stripe redirect, breaking CFIX-07?** | Investigate first; if yes, gate reset on `step !== "payment"` OR add explicit "don't reset on Stripe redirect" flag | This is the only Phase 111 fix with a real architectural unknown |
| 2 | Does `PaymentStepV8.tsx` use RHF for phone/name inputs, or plain controlled inputs? | Read file during planning; if plain inputs, wire them to RHF for CHKP-01 consistency | RHF gives free `onTouched` validation; plain inputs need manual onChange + onBlur |
| 3 | What time window should auto-populate when reschedule is clicked (CHKP-04)? | First active window of `dayConfig` for the new day; if direction-aware, pick window matching customer's address direction | Customer can change in time step if needed |
| 4 | Should CFIX-09 polling trigger CheckoutErrorBanner on `/menu` or `/cart` pages too, or only on `/checkout`? | Only on `/checkout` (Phase 111 scope is checkout conversion); other pages' price-change handling is Phase 116 | Scope discipline |

**All other gray areas resolved.** No assumption-blocking questions remain.

---

## Summary

**Phase 111 is a low-architectural-risk, high-UX-impact phase.** All 6 fixes leverage Phase 110's foundation (query key factory, retry config, AbortController patterns, persistent toast, ClientErrorCodes, EmptyCheckoutError, cutoffModalOpen wiring). Zero new schemas, zero new API routes, zero new design tokens. The single open architectural question is whether `CheckoutClient.unmount → reset()` clears sessionStorage during Stripe redirect — investigate during planning.

**Highest-impact recommendations** (rank order):
1. CHKP-04 reschedule button (1-line modal extension, massive cutoff-recovery impact)
2. CFIX-07 form persistence test (verify what already exists; lock contract)
3. CHKP-01 RHF `onTouched` (one-line config × 3 forms)
4. CFIX-09 conditional polling (single hook extension)
5. CHKP-02 PRICE_CHANGED banner case (extends existing pattern)
6. CHKP-03 step prefetch (sugar; do last)

**Next step:** Run `/gsd-plan-phase 111` consuming both this file and `111-ENHANCEMENT-RECOMMENDATIONS.md`.
