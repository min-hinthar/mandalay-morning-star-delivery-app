# Phase 111: Checkout Conversion — Enhancement Recommendations

## Priority Matrix

| #  | Enhancement                                                            | Priority    | Effort | Impact                                                |
|----|------------------------------------------------------------------------|-------------|--------|-------------------------------------------------------|
| 1  | CHKP-04: Cutoff modal one-click reschedule button                      | MUST-HAVE   | Low    | Critical — recovers ~5% of cutoff-blocked orders      |
| 2  | CFIX-07: Form persistence test + reset() audit                         | MUST-HAVE   | Medium | Critical — verifies + locks contract; uncovers bug    |
| 3  | CHKP-01: RHF `mode: "onTouched"` on 3 checkout forms                   | MUST-HAVE   | Low    | High — converts "annoying" to "helpful" validation    |
| 4  | CFIX-09: Conditional menu polling while cart non-empty                 | MUST-HAVE   | Low    | High — detects price/availability changes early       |
| 5  | CHKP-02: PRICE_CHANGED case in CheckoutErrorBanner                     | MUST-HAVE   | Medium | High — explains price changes (no more "Dismiss")     |
| 6  | CHKP-03: Prefetch on step transitions (menu + profile)                 | MUST-HAVE   | Low    | Medium — eliminates perceived latency on step change  |
| 7  | Add `PRICE_CHANGED` to `ClientErrorCodes` enum                         | SHOULD-HAVE | Low    | Medium — discoverability + type safety                |
| 8  | Investigate CheckoutClient `reset()` on unmount vs sessionStorage      | SHOULD-HAVE | Low    | High — uncovers Phase 111's only open architectural risk |
| 9  | Use `useToast` (not `useToastV8`) for any Phase 111 critical toasts    | SHOULD-HAVE | Low    | Medium — prevents toast-then-vanish anti-pattern      |
| 10 | Add Storybook stories for PRICE_CHANGED banner + reschedule modal      | NICE-TO-HAVE| Low    | Low — visual regression coverage                      |
| 11 | E2E test: Stripe error → Retry → form fields preserved                 | NICE-TO-HAVE| Medium | High — Playwright lock on CFIX-07                     |
| 12 | Burmese copy review for new strings (reschedule button, price change)  | NICE-TO-HAVE| Low    | Low — bilingual brand consistency                     |

---

## Detailed Recommendations

### 1. CHKP-04: Cutoff Modal One-Click Reschedule (MUST-HAVE)

**What**: Extend `src/components/ui/delivery/CutoffModal.tsx` with optional `rescheduleOption` (date string + display label) and `onReschedule` callback. When provided, render a primary "Reschedule to {label}" button between "Got it" and "Browse Menu". In `CheckoutClient.tsx`, compute the next available delivery date via `getNextDeliveryDate(now, deliveryDays)` and wire the handler to call `setDelivery({ date, windowStart, windowEnd })`, `setStep("time")`, then close modal.

**Why**: ~5% of checkout sessions hit the cutoff modal (peak Friday 2-3 PM). Currently the only paths are "Got it" (dead-end) or "Browse Menu" (loses checkout context). One-click reschedule rescues the order while preserving cart, address, and payment data. Highest-leverage change in Phase 111.

**Design compliance**: ROADMAP 111 SC #4 ("one-click reschedule"); customer trust principle "one-click recovery offered when possible" (PRECONTEXT §7).

**Implementation hint**:
```typescript
// CheckoutClient.tsx
const nextDelivery = useMemo(() => {
  const next = getNextDeliveryDate(new Date(), deliveryDays);
  if (!next) return undefined;
  return {
    dateString: formatDateString(next),
    displayDate: formatDisplayDate(next),
  };
}, [deliveryDays]);

const handleReschedule = useCallback(() => {
  if (!nextDelivery) return;
  // Pick first active time window of new day
  const dayConfig = deliveryDays.find(d => /* matching day */);
  setDelivery({
    date: nextDelivery.dateString,
    windowStart: dayConfig.windows[0].start,
    windowEnd: dayConfig.windows[0].end,
  });
  setStep("time");
  setShowCutoffModal(false);
}, [nextDelivery, deliveryDays, setDelivery, setStep]);

<CutoffModal
  isOpen={showCutoffModal}
  onClose={() => setShowCutoffModal(false)}
  nextDeliveryDate={gate.deliveryDate.displayDate}
  rescheduleOption={nextDelivery}
  onReschedule={handleReschedule}
/>
```

---

### 2. CFIX-07: Form Persistence Test + reset() Audit (MUST-HAVE)

**What**: Add a Vitest integration test in `src/__tests__/checkout/form-persistence.test.tsx` that fills all 13 form fields (`useCheckoutStore.partialize` set), simulates a `STRIPE_ERROR` response, asserts the store still contains every field, simulates a Retry click, and asserts `usePaymentSubmit.handleCheckout` re-fires with the SAME form data. **Also**: read `CheckoutClient.tsx:159-161` (`useEffect(() => () => reset(), [reset])`) and verify whether the `reset()` cleanup fires during the same-tab Stripe redirect — if yes, this BREAKS form persistence and needs gating.

**Why**: Phase 110 added sessionStorage persistence as a side effect, but no test asserts the contract. Form persistence is silently working today, but a future refactor could remove `partialize` field by accident. Lock the contract. The `reset()` audit is the highest-priority unknown — if it clears sessionStorage during Stripe redirect, CFIX-07 is broken at the framework level.

**Design compliance**: Customer trust principle "Form state must survive transient errors" (PRECONTEXT §7); Frustrations directive "Never skip verification".

**Implementation hint**:
```typescript
// form-persistence.test.tsx
it("preserves all 13 form fields across Stripe error retry", async () => {
  // 1. Render CheckoutClient with mock data
  // 2. Fill address, time, payment fields
  // 3. Mock /api/checkout/session to return STRIPE_ERROR
  // 4. Click Place Order
  // 5. Assert error banner visible
  // 6. Assert useCheckoutStore.getState() still has all 13 fields
  // 7. Click Retry
  // 8. Assert /api/checkout/session called with original data
});

// reset() audit — read CheckoutClient.tsx:159-161, then test:
it("does NOT clear checkout store when payment redirects to Stripe", async () => {
  // Simulate window.location.href assignment (jest spy)
  // Verify sessionStorage still contains checkout-store key
});
```

If reset is the problem, fix:
```typescript
useEffect(() => {
  return () => {
    // Phase 111 CFIX-07 — only reset on true unmount, not Stripe redirect
    if (!window.location.href.includes("stripe.com")) {
      reset();
    }
  };
}, [reset]);
```

---

### 3. CHKP-01: RHF `onTouched` Mode on Checkout Forms (MUST-HAVE)

**What**: Add `mode: "onTouched"` to the `useForm` config in `AddressFormV8.tsx:51` (and any other RHF-using checkout forms). With `onTouched`, fields validate on first blur, then re-validate on every keystroke after. The existing `getFieldState` helper + `<ValidatedInput>` already render the correct visual states — only the RHF mode flag needs flipping.

**Why**: Currently `mode` defaults to `"onSubmit"`, so users see no validation feedback until they click Submit. The requirement is "as user types" but `onChange` (validate every keystroke) is too aggressive — it flashes "Required" on the first character. `onTouched` is the canonical pattern: silent until first blur, then helpfully reactive. This is a one-line fix per form with massive UX impact.

**Design compliance**: ROADMAP 111 SC #2 ("inline validation errors as user types"); customer trust principle "Inline validation: helpful, not nagging" (PRECONTEXT §7).

**Implementation hint**:
```typescript
// AddressFormV8.tsx — line 51
const {
  register,
  handleSubmit,
  control,
  formState: { errors, dirtyFields, touchedFields },
} = useForm<AddressFormValues>({
  mode: "onTouched", // Phase 111 CHKP-01
  resolver: zodResolver(addressFormSchema) as Resolver<AddressFormValues>,
  defaultValues: { /* ... */ },
});
```

For `PaymentStepV8.tsx`: read the file first to confirm phone/name inputs use RHF. If they're plain controlled inputs, either (a) wire them to RHF for consistency, or (b) document that contact validation is plain-input pattern by design. Don't half-migrate.

---

### 4. CFIX-09: Conditional Menu Polling While Cart Non-Empty (MUST-HAVE)

**What**: Extend `src/lib/hooks/useMenu.ts` with a `pollWhileNonEmpty?: boolean` option. When true, subscribe to `useCartStore((s) => s.items.length > 0)` and pass `refetchInterval: isNonEmpty ? 3 * 60 * 1000 : false`. Update `useCartValidation.ts` to call `useMenu({ pollWhileNonEmpty: true })`. Leave default `useMenu()` calls (e.g., in `MenuClient`) unchanged — they don't need polling.

**Why**: Customer adds items, then takes 5-10 minutes deciding. During that time, an admin may mark an item sold-out or update prices. Currently, the customer only learns at submit (server-side validation) — by then they've committed mentally. Polling at 3 minutes catches the change early enough that `useCartValidation` updates `priceChangedIds`, which Phase 111 wires to a new banner case (CHKP-02). 3 min × ~10 concurrent customers × ~50KB = trivial bandwidth.

**Design compliance**: ROADMAP 111 inherits CFIX-09 ("Menu periodically refetches 2-5 min while cart non-empty").

**Implementation hint**:
```typescript
// useMenu.ts
import { useCartStore } from "@/lib/stores/cart-store";

const MENU_POLL_INTERVAL_MS = 3 * 60 * 1000; // CFIX-09 — 3 min

export function useMenu(options?: { pollWhileNonEmpty?: boolean }) {
  const isCartNonEmpty = useCartStore((s) => s.items.length > 0);
  return useQuery<MenuResponse>({
    queryKey: queryKeys.menu.list(),
    queryFn: async () => {
      const res = await fetch("/api/menu");
      if (!res.ok) throw new Error("Failed to fetch menu");
      return res.json() as Promise<MenuResponse>;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval:
      options?.pollWhileNonEmpty && isCartNonEmpty ? MENU_POLL_INTERVAL_MS : false,
  });
}
```

**Note:** Polling deduplicates with manual `refetch()` — TanStack Query handles this. No conflict with `useCartValidation`'s 30s timeout AbortController (separate refetch invocation).

---

### 5. CHKP-02: PRICE_CHANGED Case in CheckoutErrorBanner (MUST-HAVE)

**What**: Add a new `case "PRICE_CHANGED"` to `CheckoutErrorBanner.tsx`'s switch (line 91). Implement a `renderPriceChange()` helper that mirrors the direction-mismatch pattern (lines 195-256): show each changed item with `name` → `oldPrice → newPrice` → "Update cart" CTA. Color-code by direction: `bg-status-warning-bg` for `"up"`, `bg-status-success-bg` for `"down"`. Wire from `CheckoutClient.tsx`: when `useCartValidation.priceChangedIds.length > 0`, render the banner with `error.code: "PRICE_CHANGED"` and details synthesized from validation results.

**Why**: Today, price changes either silently update or block submit with a generic "Dismiss" alert (audit P10). Customers don't understand what changed. Following the existing direction-mismatch banner pattern (which already shows "what changed → clickable action") gives customers full transparency. The data is already available — `useCartValidation` exposes `priceChangedIds`, `newPriceCents`, and `priceDirection` from the live menu comparison. Only the rendering layer is missing.

**Design compliance**: ROADMAP 111 SC #3 ("show old-vs-new price explanation, not just Dismiss"); customer trust principle "Price changes must be transparent" (PRECONTEXT §7).

**Implementation hint**:
```typescript
// CheckoutErrorBanner.tsx — add case in switch
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

function renderPriceChange(
  details: { items: Array<{ name: string; oldPriceCents: number; newPriceCents: number; direction: "up" | "down" }> },
  onUpdateCart?: () => void
) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-status-warning/10 text-status-warning">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">Prices updated since you added these to your cart</p>
          <p className="text-2xs text-text-muted/70 mt-1">
            ဈေးနှုန်းပြောင်းလဲခြင်း
          </p>
          <ul className="mt-2 space-y-1.5">
            {details.items.map((it) => (
              <li key={it.name} className="text-xs flex items-center gap-2">
                <span className="text-text-primary">{it.name}</span>
                <span className="text-text-muted line-through">${(it.oldPriceCents / 100).toFixed(2)}</span>
                <span className="text-text-muted">→</span>
                <span className={cn("font-semibold", it.direction === "up" ? "text-status-warning" : "text-status-success")}>
                  ${(it.newPriceCents / 100).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {onUpdateCart && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onUpdateCart}>
            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
            Update cart
          </Button>
        </div>
      )}
    </div>
  );
}
```

In `CheckoutClient.tsx`, synthesize the error from validation results and wire `onUpdateCart` to navigate to `/cart`.

---

### 6. CHKP-03: Prefetch on Step Transitions (MUST-HAVE)

**What**: In `CheckoutClient.tsx`, add a `useEffect` watching `step`. On transition to "address", prefetch `queryKeys.menu.list()`. On transition to "time", prefetch `queryKeys.addresses.list()` (or profile equivalent for contact prefill). Use `useQueryClient()` hook — NOT a direct import from `query-provider.tsx` (the local `queryClient` ref is not exported).

**Why**: The address step typically takes 30-120 seconds (typing) — this is free background work. Prefetching during address means by the time the customer reaches time step, the data is already cached and renders instantly. Phase 110's query key factory makes this trivially safe — same keys, same cache.

**Design compliance**: PROJECT.md "design-conscious UX philosophy" — perceived latency reduction without animation.

**Implementation hint**:
```typescript
// CheckoutClient.tsx
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

const queryClient = useQueryClient();

useEffect(() => {
  // Phase 111 CHKP-03 — prefetch next step's data during current step
  if (step === "address") {
    queryClient.prefetchQuery({
      queryKey: queryKeys.menu.list(),
      queryFn: async () => {
        const res = await fetch("/api/menu");
        if (!res.ok) throw new Error("prefetch failed");
        return res.json();
      },
      staleTime: 5 * 60 * 1000,
    });
  } else if (step === "time") {
    queryClient.prefetchQuery({
      queryKey: queryKeys.addresses.list(),
      queryFn: async () => {
        const res = await fetch("/api/addresses");
        if (!res.ok) throw new Error("prefetch failed");
        return res.json();
      },
    });
  }
  // No prefetch on payment step — terminal step
}, [step, queryClient]);
```

**Critical:** Do NOT use `void prefetchQuery(...)` — Vercel kills it. The implicit promise return is fine (effect doesn't await).

---

### 7. Add `PRICE_CHANGED` to `ClientErrorCodes` Enum (SHOULD-HAVE)

**What**: Add `PRICE_CHANGED: "PRICE_CHANGED"` to the `ClientErrorCodes` constant in `src/types/errors.ts`. Reference it from `CheckoutErrorBanner.tsx` and `CheckoutClient.tsx` instead of inline string literals.

**Why**: Phase 110 D-33 established `ClientErrorCodes` as the home for client-only error codes. Centralizing prevents typos and makes the code grep-discoverable. Phase 111 introduces one new code — keep the convention.

**Design compliance**: Codebase hygiene; matches Phase 110 precedent.

**Implementation hint**:
```typescript
// src/types/errors.ts
export const ClientErrorCodes = {
  CHECKOUT_NETWORK_TIMEOUT: "CHECKOUT_NETWORK_TIMEOUT",
  CART_VALIDATION_TIMEOUT: "CART_VALIDATION_TIMEOUT",
  PRICE_CHANGED: "PRICE_CHANGED", // Phase 111 CHKP-02
} as const;
```

---

### 8. Investigate `CheckoutClient.tsx:159-161` `reset()` on Unmount (SHOULD-HAVE)

**What**: Read `CheckoutClient.tsx` lines 159-161:
```typescript
useEffect(() => {
  return () => reset();
}, [reset]);
```

Determine empirically whether the unmount cleanup fires during a same-tab Stripe redirect (`window.location.href = sessionUrl`). If YES, the `reset()` call will clear `useCheckoutStore` (and its sessionStorage backing) before the customer can return — breaking CFIX-07 silently. If NO, document the safe behavior in a comment so future refactors don't break it.

**Why**: This is Phase 111's only open architectural unknown. Form persistence depends on sessionStorage surviving the round-trip. If `reset()` fires on tab navigation away, sessionStorage gets cleared, and CFIX-07 is impossible at the framework level. Investigating now is cheaper than discovering it via UAT.

**Design compliance**: Frustrations directive "Never skip verification"; Phase 111 CFIX-07 is the load-bearing requirement.

**Implementation hint**: Test in browser dev tools first:
```javascript
// In DevTools console on /checkout
sessionStorage.setItem("test-key", "test-value");
window.location.href = "https://stripe.com";
// On return / back button:
sessionStorage.getItem("test-key"); // expected: "test-value" if React unmount didn't run reset
```

If the browser test confirms sessionStorage survives, write a unit test that mocks `window.location.assign` and asserts `useCheckoutStore.getState()` still has values. If unmount DOES fire reset, gate the cleanup:
```typescript
useEffect(() => {
  return () => {
    // Phase 111 CFIX-07 — preserve form data when redirecting to Stripe
    const isStripeRedirect = window.location.href.includes("checkout.stripe.com");
    if (!isStripeRedirect) {
      reset();
    }
  };
}, [reset]);
```

---

### 9. Use `useToast` (Not `useToastV8`) for Critical Toasts (SHOULD-HAVE)

**What**: When Phase 111 introduces any new toast (e.g., as adjunct notification on price change), import from `@/lib/hooks/useToast` (the persistent-capable version), NOT `@/lib/hooks/useToastV8`. The V8 version does NOT have the `persistent: boolean` flag.

**Why**: Phase 110 D-32 added `persistent` to `useToast` only. The two implementations exist for historical reasons — `useToastV8` predates the persistent flag and is still used by V8 components. Critical errors must use the persistent variant; otherwise the toast vanishes after 5s before the customer can act.

**Design compliance**: PRECONTEXT §7 forbidden anti-pattern: "Toast-then-vanish for critical errors".

**Implementation hint**:
```typescript
// CORRECT
import { toast } from "@/lib/hooks/useToast";
toast({
  title: "Price updated",
  description: "Some items in your cart cost different now.",
  variant: "warning",
  persistent: true, // available
});

// WRONG (would silently auto-dismiss)
import { toast } from "@/lib/hooks/useToastV8";
toast({ /* no persistent option exists */ });
```

Add an ESLint rule or comment ban during planning to prevent regression.

---

### 10. Storybook Stories for PRICE_CHANGED Banner + Reschedule Modal (NICE-TO-HAVE)

**What**: Add stories for the new banner case and the extended modal:
- `CheckoutErrorBanner.stories.tsx` → add `PriceChanged_PriceUp`, `PriceChanged_PriceDown`, `PriceChanged_Mixed`
- `CutoffModal.stories.tsx` → add `WithRescheduleOption`, `WithoutRescheduleOption`, `MultipleDeliveryDays`

**Why**: Phase 111 introduces visible UI surface area. Storybook coverage prevents Phase 113 (A11Y) and Phase 116 (Polish) from accidentally regressing it. ~20 lines per story, permanent value.

**Design compliance**: Project convention — UI components have stories where practical.

**Implementation hint**: Use existing `Meta` patterns. For modal stories, set `parameters: { layout: 'centered' }`. For banner stories, mock the `error` prop with realistic price-change data.

---

### 11. E2E Test: Stripe Error → Retry → Form Preserved (NICE-TO-HAVE)

**What**: Add a Playwright test in `e2e/checkout-form-persistence.spec.ts` that fills the entire checkout form, mocks `/api/checkout/session` to return a 500 once (then succeeds), clicks Place Order, asserts the error banner appears, asserts all form fields are still populated, clicks Retry, asserts the second submit uses identical form data, and asserts the redirect to Stripe fires.

**Why**: Vitest unit tests cover the store persistence in isolation. Playwright E2E covers the full user journey including the actual form rendering, the error display, and the click handlers. This is the highest-fidelity test of CFIX-07 — captures regressions that unit tests miss.

**Design compliance**: Frustrations directive "Never skip verification"; testing pyramid completeness.

**Implementation hint**:
```typescript
// e2e/checkout-form-persistence.spec.ts
test("form fields survive Stripe error retry", async ({ page }) => {
  await page.goto("/checkout");
  await fillAddressForm(page, { line1: "123 Test St", /* ... */ });
  await page.getByRole("button", { name: /next/i }).click();
  await selectTimeWindow(page);
  await fillPaymentForm(page, { name: "Test", phone: "555-1234" });

  // Intercept first attempt → return 500
  await page.route("/api/checkout/session", (route, req) => {
    route.fulfill({ status: 500, body: '{"error":{"code":"INTERNAL_ERROR"}}' });
  });

  await page.getByRole("button", { name: /place order/i }).click();
  await expect(page.getByText(/something went wrong/i)).toBeVisible();

  // Verify fields still populated
  await expect(page.getByLabel("Street Address")).toHaveValue("123 Test St");

  // Retry — second attempt succeeds
  await page.unroute("/api/checkout/session");
  await page.getByRole("button", { name: /try again/i }).click();
  // Assert redirect to Stripe
});
```

---

### 12. Burmese Copy Review for New Strings (NICE-TO-HAVE)

**What**: New copy added in Phase 111:
- Reschedule button: "Reschedule to {date}" + Burmese equivalent
- PRICE_CHANGED banner header: "Prices updated since you added these to your cart" + Burmese
- "Update cart" CTA already has Burmese precedent in `CheckoutErrorBanner.tsx:128-136`

Get the Burmese strings reviewed by a native speaker before ship.

**Why**: Mandalay Morning Star's brand identity is bilingual (English + Burmese, see `CutoffModal.tsx:45-62`). Auto-translated Burmese can be cringe-worthy or grammatically wrong, undermining the family-business tone. Existing strings show care — new strings deserve the same.

**Design compliance**: PROJECT.md brand identity — bilingual support; Identity/Brand Ethical Framework (PRECONTEXT §8).

**Implementation hint**: Coordinate with the project owner for native-speaker review. Suggested defaults (must verify):
- "Reschedule to {Saturday, April 11}" → "{Saturday, April 11} ဆီသို့ ပြောင်းမည်"
- "Prices updated since you added these to your cart" → "သင့်ဈေးခြင်းထဲသို့ ထည့်ပြီးနောက် ဈေးနှုန်းပြောင်းလဲခြင်း"

Mark all new Burmese strings with a `// BURMESE-REVIEW` comment for traceability.

---

## Implementation Phases (Suggested Plan Split)

### Plan 1: Foundation + Reschedule (CHKP-04 + CFIX-07 audit + CHKP-01)
- Investigate `reset()` on unmount risk (rec 8) — DO FIRST
- Form persistence test (rec 2)
- CHKP-04 modal extension + reschedule wiring (rec 1)
- CHKP-01 RHF `onTouched` flip on 3 forms (rec 3)
- Add `PRICE_CHANGED` to ClientErrorCodes (rec 7)

### Plan 2: Polling + Price Transparency (CFIX-09 + CHKP-02)
- CFIX-09 conditional menu polling (rec 4)
- CHKP-02 PRICE_CHANGED banner case (rec 5)
- Wire `useCartValidation.priceChangedIds` → banner in CheckoutClient
- Verify `useToast` not `useToastV8` for any toast adjuncts (rec 9)
- Storybook stories (rec 10)

### Plan 3: Prefetch + E2E (CHKP-03 + tests)
- CHKP-03 prefetch on step transitions (rec 6)
- Playwright form-persistence E2E (rec 11)
- Burmese copy review for new strings (rec 12)
- Final cleanup audit across all useEffects + cart selector subscriptions

---

**Next step:** Run `/gsd-plan-phase 111` consuming both this file and `111-PRECONTEXT-RESEARCH.md`.
