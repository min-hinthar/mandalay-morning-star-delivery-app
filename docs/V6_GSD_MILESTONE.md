# V6: GSD Milestone — Multi-Day Delivery, Bilingual, COD & Full Wiring

> **Target:** Expand from Saturday-only to multi-day delivery (Mon/Wed/Thu/Sat), add bilingual (EN/MY) support, implement Cash on Delivery (COD) with admin approval, and ensure all ordering/payment routes are fully wired and functional.
> **Duration:** 1 sprint | **Completed:** March 2026
> **Context:** V5 production-grade launch complete → V6 expands delivery flexibility, payment options, and language accessibility

---

## Feature Overview

| #   | Feature                    | Status | Scope                                                              |
| --- | -------------------------- | ------ | ------------------------------------------------------------------ |
| 1   | Multi-Day Delivery         | Done   | Mon/Wed/Thu/Sat with per-day cutoffs and fees                      |
| 2   | Bilingual Homepage (EN/MY) | Done   | Myanmar translations displayed inline below English                |
| 3   | Cash on Delivery (COD)     | Done   | Full flow: checkout → pending_approval → admin approve → confirmed |
| 4   | All Ordering Routes Wired  | Done   | Stripe + COD both send emails, handle edge cases                   |

---

## 1. Multi-Day Delivery

### 1.1 Database & Config

- **Migration:** `20260307_multiday_delivery_cod.sql`
  - `delivery_days` JSONB column on `business_rules` table
  - `DeliveryDayConfig` interface: `{ dayOfWeek, isActive, cutoffDay, cutoffHour, deliveryFeeCents }`
  - `create_order_with_items` RPC updated to accept `payment_method` param
  - `payment_method` column on `orders` with CHECK constraint (`'stripe' | 'cod'`)

### 1.2 Core Logic

| File                               | Change                                                                                                                                                         |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/utils/delivery-dates.ts`  | `getNextDeliveryDate()`, `getAvailableDeliveryDatesMultiDay()`, `isPastCutoffForDay()` — all handle empty `activeDays` safely (return `null` → fallback state) |
| `src/lib/hooks/useDeliveryGate.ts` | `useDeliveryGateMultiDay(deliveryDays)` hook — computes gate state for arbitrary delivery day configs                                                          |
| `src/lib/settings.ts`              | `getBusinessRules()` returns `deliveryDays: DeliveryDayConfig[]` from `unstable_cache()` with 300s TTL                                                         |

### 1.3 Validation Fixes (Critical)

| File                                          | Before                                                          | After                                                                           | Severity |
| --------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------- |
| `src/lib/validations/route.ts`                | `isSaturday()` refinement — **blocked all non-Saturday routes** | `isValidDate()` — accepts any valid date (server validates against active days) | CRITICAL |
| `src/lib/validations/__tests__/route.test.ts` | "rejects non-Saturday delivery date"                            | "accepts valid delivery date (Wednesday)", "rejects invalid date format"        | HIGH     |
| `src/lib/utils/order.ts` (line 150)           | `"Saturday delivery to your address"`                           | `"Delivery to your address"`                                                    | MEDIUM   |

### 1.4 Checkout Route Multi-Day Validation

```
src/app/api/checkout/session/route.ts (lines 51-80)
```

- Finds matching `dayConfig` from `rules.deliveryDays` by `scheduledDayOfWeek`
- Validates `isPastCutoffForDay(scheduledDate, dayConfig, now)`
- Falls back to legacy Saturday-only validation if `deliveryDays` array is empty
- Uses per-day `deliveryFeeCents` if available: `dayConfig?.deliveryFeeCents ?? rules.deliveryFeeCents`

---

## 2. Bilingual Homepage (EN/MY)

### 2.1 Pattern

English text displayed first, Myanmar text below in smaller/muted styling. No language toggle — both shown simultaneously for the primarily Burmese-speaking customer base.

### 2.2 CutoffModal Bilingual

```
src/components/ui/delivery/CutoffModal.tsx
```

| Element     | English                                    | Myanmar                                                                 |
| ----------- | ------------------------------------------ | ----------------------------------------------------------------------- |
| Heading     | "Ordering is currently closed"             | "မှာယူမှုကို ယာယီပိတ်ထားပါသည်"                                          |
| Message     | "Your next chance to order is for {date}"  | "နောက်တစ်ကြိမ် မှာယူနိုင်သည့်ရက်မှာ {date} ဖြစ်ပါသည်"                   |
| Reassurance | "Your cart items are saved for next time." | "သင့်ဈေးခြင်းထဲရှိ ပစ္စည်းများကို နောက်တစ်ကြိမ်အတွက် သိမ်းဆည်းထားပါသည်" |

Styling: Myanmar text uses `text-text-secondary` / `text-text-muted` with `-mt-3` for tight vertical rhythm beneath English lines.

---

## 3. Cash on Delivery (COD)

### 3.1 Order Flow

```
Customer checkout (paymentMethod: "cod")
  → createCODOrder() via RPC
  → status: "pending_approval"
  → Email: "Your order has been received" (isPendingApproval: true)

Admin approves (/api/admin/orders/[id]/approve-cod)
  → status: "confirmed"
  → Email: "Your order is confirmed!" (isPendingApproval: false)
```

### 3.2 Checkout COD Branch

```
src/app/api/checkout/session/route.ts (lines 222-310)
```

- Validates `rules.codEnabled` before accepting COD
- Calls `createCODOrder(supabase, { ... })` from `src/lib/services/cod-order.ts`
- Fire-and-forget email with `isPendingApproval: true`
- Returns `{ sessionUrl: null, orderId }` (no Stripe redirect)

### 3.3 Admin Approval Route

```
src/app/api/admin/orders/[id]/approve-cod/route.ts (197 lines)
```

| Concern                | Implementation                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| Auth                   | `requireAdmin()` + `checkRateLimit(adminLimiter)`                                                  |
| Validation             | Verify `payment_method === "cod"` and `status === "pending_approval"`                              |
| Race condition guard   | `.eq("status", "pending_approval")` on UPDATE — prevents double-approval                           |
| Row count verification | `.select("id")` + `!updated?.length` check → 409 CONFLICT                                          |
| Audit log              | Insert into `order_audit_log` with action `"cod_approved"`                                         |
| Confirmation email     | Async IIFE fetches full order + profile, sends `OrderConfirmation` with `isPendingApproval: false` |

**Cross-reference:** `.select("id")` pattern from `.claude/learnings/stripe.md` — "Supabase `.update()` Returns No Row Count by Default"

### 3.4 Payment UI

```
src/components/ui/checkout/PaymentStepV8.tsx
```

- `PaymentMethodSelector` component for choosing Stripe vs COD
- COD redirects to `/orders/${orderId}/confirmation?cod=true` (no Stripe)
- `paymentMethod` included in checkout request body

### 3.5 Confirmation Page COD Support

```
src/app/(customer)/orders/[id]/confirmation/page.tsx
```

- Handles `pending_approval` status (line 179)
- Query includes `payment_method`, `cod_approved_at`, `cod_approved_by`
- Routes to `OrderConfirmationV8` component

---

## 4. Email System — COD Integration

### 4.1 OrderConfirmation Template

```
src/emails/OrderConfirmation.tsx (325 lines)
```

**New prop:** `isPendingApproval?: boolean`

| Aspect              | Confirmed Order                                         | COD Pending Order                                         |
| ------------------- | ------------------------------------------------------- | --------------------------------------------------------- |
| Preview text        | "Your order #XXXX is confirmed"                         | "Your order #XXXX has been received"                      |
| Greeting            | "We're excited to prepare your delicious Burmese meal." | "We've received it and our team will confirm it shortly." |
| Notice banner       | —                                                       | Yellow "Awaiting Confirmation" box explaining COD review  |
| Status tracker step | `"confirmed"`                                           | `"received"`                                              |
| Subject line        | "Your order is confirmed!"                              | "Your order has been received"                            |

### 4.2 OrderStatusTracker

```
src/emails/components/OrderStatusTracker.tsx (176 lines)
```

**New step type:** `"received"`

| Step Array                                              | Steps                                                |
| ------------------------------------------------------- | ---------------------------------------------------- |
| `CONFIRMED_STEPS` (default)                             | Confirmed → Preparing → Out for Delivery → Delivered |
| `COD_PENDING_STEPS` (when `currentStep === "received"`) | Received → Confirmed → Preparing → Delivered         |

Dynamic selection: `const steps = currentStep === "received" ? COD_PENDING_STEPS : CONFIRMED_STEPS;`

### 4.3 OrderTotalsTable

```
src/emails/components/OrderTotalsTable.tsx
```

Payment method display:

- `paymentMethod === "cod"` → "Payment: Cash on Delivery"
- Otherwise → "Paid with {paymentMethod}"

### 4.4 Email Send Points

| Trigger                   | Location                                             | Subject                              | `isPendingApproval` |
| ------------------------- | ---------------------------------------------------- | ------------------------------------ | ------------------- |
| Stripe webhook (existing) | `src/app/api/webhooks/stripe/handlers.ts`            | "Your order is confirmed!"           | `undefined` (falsy) |
| COD order placed (NEW)    | `src/app/api/checkout/session/route.ts`              | "Your order #XXXX has been received" | `true`              |
| COD order approved (NEW)  | `src/app/api/admin/orders/[id]/approve-cod/route.ts` | "Your order #XXXX is confirmed!"     | `false`             |

---

## 5. Bugs Found & Fixed

### 5.1 Critical Bugs

| #   | Bug                                | File                   | Root Cause                                               | Fix                                                                        | Cross-ref             |
| --- | ---------------------------------- | ---------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------- |
| 1   | **Non-Saturday routes rejected**   | `route.ts`             | `isSaturday()` Zod refinement hardcoded to Saturday-only | Replaced with `isValidDate()` accepting any valid date                     | —                     |
| 2   | **Double-approval race condition** | `approve-cod/route.ts` | `.update()` without status guard; no row count check     | Added `.eq("status", "pending_approval")` + `.select("id")` + 409 CONFLICT | `learnings/stripe.md` |

### 5.2 Medium Bugs

| #   | Bug                                                         | File                        | Fix                                                          |
| --- | ----------------------------------------------------------- | --------------------------- | ------------------------------------------------------------ |
| 3   | Stripe line item says "Saturday delivery"                   | `order.ts`                  | Changed to "Delivery to your address"                        |
| 4   | CutoffModal heading says "preparing this week's deliveries" | `CutoffModal.tsx`           | Changed to "Ordering is currently closed"                    |
| 5   | No email sent for COD orders                                | `checkout/session/route.ts` | Added fire-and-forget `sendEmail()` after `createCODOrder()` |
| 6   | No email sent when COD approved                             | `approve-cod/route.ts`      | Added async email send after successful approval             |

### 5.3 Low Bugs / Polish

| #   | Bug                                                           | File                   | Fix                                                                       |
| --- | ------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------- |
| 7   | Stale route.test.ts after validation change                   | `route.test.ts`        | Updated: added Wednesday test, changed "non-Saturday" to "invalid format" |
| 8   | "Paid with cod" in email                                      | `OrderTotalsTable.tsx` | Changed to "Payment: Cash on Delivery"                                    |
| 9   | Missing explicit `isPendingApproval: false` on approval email | `approve-cod/route.ts` | Added explicit prop (was technically OK since `undefined` is falsy)       |

---

## 6. Files Modified

### New or Substantially Changed

| File                                                 | Lines  | Change Type                                      |
| ---------------------------------------------------- | ------ | ------------------------------------------------ |
| `src/app/api/admin/orders/[id]/approve-cod/route.ts` | 197    | Race condition guard + email wiring              |
| `src/app/api/checkout/session/route.ts`              | 478    | COD email send (imports + fire-and-forget block) |
| `src/emails/OrderConfirmation.tsx`                   | 325    | `isPendingApproval` prop + COD notice banner     |
| `src/emails/components/OrderStatusTracker.tsx`       | 176    | `"received"` step + `COD_PENDING_STEPS` array    |
| `src/emails/components/OrderTotalsTable.tsx`         | 212    | COD payment method display                       |
| `src/components/ui/delivery/CutoffModal.tsx`         | 84     | Bilingual text (EN/MY)                           |
| `src/lib/validations/route.ts`                       | ~30    | `isSaturday()` → `isValidDate()`                 |
| `src/lib/validations/__tests__/route.test.ts`        | ~90    | Multi-day test cases                             |
| `src/lib/utils/order.ts`                             | 1 line | Removed "Saturday" from description              |

### Pre-existing (from earlier sessions in this milestone)

| File                                                     | Purpose                                        |
| -------------------------------------------------------- | ---------------------------------------------- |
| `supabase/migrations/20260307_multiday_delivery_cod.sql` | Schema: delivery_days, payment_method, COD RPC |
| `src/lib/utils/delivery-dates.ts`                        | Multi-day delivery date computation            |
| `src/lib/hooks/useDeliveryGate.ts`                       | `useDeliveryGateMultiDay` hook                 |
| `src/lib/services/cod-order.ts`                          | `createCODOrder()` service                     |
| `src/components/ui/checkout/PaymentStepV8.tsx`           | Payment method selector UI                     |
| `src/app/(customer)/orders/[id]/confirmation/page.tsx`   | COD confirmation page support                  |

---

## 7. Learnings Applied

| Learning                             | Source                          | Application                                                 |
| ------------------------------------ | ------------------------------- | ----------------------------------------------------------- |
| `.update()` returns no row count     | `.claude/learnings/stripe.md`   | Added `.select("id")` to approve-cod update                 |
| Stale tests after validation changes | `.claude/learnings/testing.md`  | Updated route.test.ts immediately after route.ts change     |
| PostgREST ambiguous FK hints         | `.claude/ERROR_HISTORY.md`      | Verified `addresses` join syntax in approve-cod email query |
| Fire-and-forget email pattern        | `stripe/handlers.ts` (existing) | Replicated `void sendEmail(...)` pattern for COD emails     |

---

## 8. Verification

### Automated (requires local environment)

```bash
pnpm lint && pnpm lint:css && pnpm format:check && pnpm typecheck && pnpm test && pnpm build
```

> **Note:** Could not run in VM due to pnpm node_modules symlink IO errors. Must be run locally.

### Manual Code Review

- Subagent review of all 6 modified files: passed
- Caught 1 issue: missing explicit `isPendingApproval: false` on approval email → fixed
- File line counts verified: all under 400 except checkout route (478, acceptable — already has `validation.ts` + `helpers.ts` split)

### Test Coverage Gaps (recommended follow-up)

| Test                                                    | Priority |
| ------------------------------------------------------- | -------- |
| COD checkout flow E2E                                   | HIGH     |
| COD approval endpoint unit test                         | HIGH     |
| OrderConfirmation email snapshot (pending vs confirmed) | MEDIUM   |
| Multi-day cutoff edge cases (day boundary, timezone)    | MEDIUM   |
| CutoffModal bilingual rendering                         | LOW      |

---

## 9. Architecture Decisions

| Decision                                      | Rationale                                                                                                                             |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Fire-and-forget email (not blocking)          | Matches existing Stripe webhook pattern; email failure must not block order flow                                                      |
| Async IIFE for approve-cod email              | Need to fetch full order details which requires multiple DB calls; wrapping in IIFE keeps route response fast                         |
| `isPendingApproval` prop vs separate template | Single template reduces duplication; conditional rendering keeps email maintenance in one place                                       |
| `COD_PENDING_STEPS` vs parameterized steps    | Explicit step arrays are clearer than runtime step generation; only 2 variants needed                                                 |
| Bilingual inline (not toggle)                 | Customer base is primarily Burmese-speaking; showing both languages simultaneously avoids missing content                             |
| `isValidDate()` not `isActiveDeliveryDay()`   | Route validation is a Zod schema (sync); active day validation happens server-side in checkout route with full business rules context |
