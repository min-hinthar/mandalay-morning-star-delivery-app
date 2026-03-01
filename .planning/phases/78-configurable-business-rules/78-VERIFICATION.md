---
phase: 78-configurable-business-rules
verified: 2026-03-01T12:30:00Z
status: passed
score: 20/20 must-haves verified
re_verification: false
---

# Phase 78: Configurable Business Rules Verification Report

**Phase Goal:** Make all delivery business rules (fees, thresholds, cutoff times, time windows) configurable through admin settings instead of hardcoded constants
**Verified:** 2026-03-01T12:30:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `getBusinessRules()` returns all 9 delivery settings from `app_settings` table | VERIFIED | `src/lib/settings/business-rules.ts` queries `app_settings` with `.eq("category", "delivery")`, maps 9 keys via `DB_KEY_MAP` |
| 2 | `generateTimeWindows(start, end)` produces 1-hour slots matching `TIME_WINDOWS` format | VERIFIED | `src/lib/settings/generate-time-windows.ts` — 6 unit tests confirm 8-slot output, AM/PM labels, boundaries |
| 3 | Settings PATCH for delivery category calls `revalidateTag('business-rules')` | VERIFIED | `src/app/api/admin/settings/route.ts:216` — `revalidateTag("business-rules", { expire: 0 })` after upsert |
| 4 | Migration 029 seeds 5 new keys and fixes 2 mismatched values | VERIFIED | `supabase/migrations/029_business_rules_settings.sql` — 5 INSERTs + 2 conditional UPDATEs (599->1500, 5000->10000) |
| 5 | `delivery-dates.ts` functions accept cutoffDay/cutoffHour as parameters instead of importing constants | VERIFIED | File uses local `DEFAULT_CUTOFF_DAY=5`/`DEFAULT_CUTOFF_HOUR=15` — no import from `@/types/delivery` |
| 6 | `order.ts` calculateDeliveryFee accepts fee/threshold as parameters | VERIFIED | `src/lib/utils/order.ts` uses local `DEFAULT_DELIVERY_FEE_CENTS`/`DEFAULT_FREE_DELIVERY_THRESHOLD_CENTS` — no type imports |
| 7 | Checkout route calls `getBusinessRules()` for cutoff validation, fee calculation, and time window validation | VERIFIED | `route.ts:43` `await getBusinessRules()`, `route.ts:46` `generateTimeWindows(rules.deliveryStartHour, rules.deliveryEndHour)`, `route.ts:57` `isPastCutoff(saturday, now, rules.cutoffDay, rules.cutoffHour)` |
| 8 | Admin form has Pricing, Schedule, Coverage subsections | VERIFIED | `DeliverySettingsForm.tsx:123,197,291` — three labeled subsections |
| 9 | Admin can edit cutoffDay (dropdown), cutoffHour, deliveryStartHour, deliveryEndHour, maxDeliveryDurationMinutes | VERIFIED | All 5 fields rendered in Schedule and Coverage subsections with `handleNumberChange` and `CHANGED_BORDER` indicators |
| 10 | Save button shows SaveConfirmDialog diff before committing | VERIFIED | `SettingsClient.tsx:58` `showSaveConfirm` state, `SettingsClient.tsx:403` `<SaveConfirmDialog>` rendered, wired via `computeDeliveryChanges()` |
| 11 | Persistent "Last changed by X on Y" attribution line at form top | VERIFIED | `DeliverySettingsForm.tsx:115-116` renders `lastChangedLabel` prop; API returns `updatedAt/updatedBy`; `formatAttributionLabel()` in `delivery-helpers.ts` |
| 12 | No non-test file imports CUTOFF_DAY, CUTOFF_HOUR, TIME_WINDOWS from types | VERIFIED | Grep confirms 0 results — those constants removed from `types/delivery.ts` |
| 13 | No non-test file imports DELIVERY_FEE_CENTS, FREE_DELIVERY_THRESHOLD_CENTS from types | VERIFIED | Grep confirms 0 results — those constants removed from `types/cart.ts` |
| 14 | Cart store has injectable fee settings via `setDeliverySettings` action | VERIFIED | `cart-store.ts:87-90` — `deliveryFeeCents`, `freeDeliveryThresholdCents` fields + `setDeliverySettings` action |
| 15 | `DeliverySettingsSync` wired in both public and customer layouts | VERIFIED | `PublicShell.tsx:21` and `CustomerShell.tsx:21` both render `<DeliverySettingsSync>` with server-fetched values |
| 16 | Homepage hero displays dynamic delivery schedule from DB | VERIFIED | `page.tsx:99` calls `getBusinessRules()`; `HeroContent.tsx:60-64` renders dynamic schedule string and fee info |
| 17 | TimeSlotPicker receives time windows as props | VERIFIED | `TimeSlotPicker.tsx:24` — `timeWindows: TimeWindow[]` prop; checkout `page.tsx:6` generates via `generateTimeWindows(rules.deliveryStartHour, rules.deliveryEndHour)` |
| 18 | Checkout page split into server wrapper + client component | VERIFIED | `checkout/page.tsx` (server) fetches rules and renders `<CheckoutClient timeWindows={timeWindows} />` |
| 19 | Zod schema extended with 5 new fields + cross-field refine | VERIFIED | `settings.ts:47-60` — `cutoff_day`, `cutoff_hour`, `delivery_start_hour`, `delivery_end_hour`, `max_delivery_duration_minutes` + refine `delivery_end_hour > delivery_start_hour` |
| 20 | Restore handler calls `revalidateTag('business-rules')` and uses correct defaults | VERIFIED | `restore/route.ts:121` — `revalidateTag("business-rules", { expire: 0 })`; includes all new fields in restore defaults |

**Score:** 20/20 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/settings/business-rules.ts` | Cached DB reader for 9 business rule values | VERIFIED | 97 lines, exports `BusinessRules`, `BUSINESS_RULES_DEFAULTS`, `getBusinessRules` |
| `src/lib/settings/generate-time-windows.ts` | Pure function generating TimeWindow[] | VERIFIED | 34 lines, exports `generateTimeWindows(startHour, endHour)` |
| `src/lib/settings/index.ts` | Barrel re-exports | VERIFIED | Re-exports all 4 items from both modules |
| `supabase/migrations/029_business_rules_settings.sql` | Migration with 5 INSERTs + 2 UPDATEs | VERIFIED | 23 lines, correct idempotent INSERT ON CONFLICT + conditional UPDATEs |
| `src/lib/settings/__tests__/business-rules.test.ts` | Unit tests for getBusinessRules | VERIFIED | 137 lines, 6 tests covering DB data, error fallback, key mapping, partial data |
| `src/lib/settings/__tests__/generate-time-windows.test.ts` | Unit tests for generateTimeWindows | VERIFIED | 72 lines, 6 tests covering 8-slot output, AM/PM, boundaries, edge cases |
| `src/components/ui/admin/settings/SaveConfirmDialog.tsx` | Diff dialog before save | VERIFIED | 109 lines, renders old->new table with $0 fee warning |
| `src/components/ui/cart/DeliverySettingsSync.tsx` | Server-to-client store sync | VERIFIED | 25 lines, `useEffect` syncs `setDeliverySettings` on mount |
| `src/app/(public)/PublicShell.tsx` | Client wrapper for public layout | VERIFIED | Created with `DeliverySettingsSync` rendering |
| `src/app/(customer)/checkout/CheckoutClient.tsx` | Client checkout component | VERIFIED | Extracted from `page.tsx` for server wrapper pattern |
| `src/lib/validations/settings.ts` | Extended Zod schema | VERIFIED | 5 new fields + cross-field refine on delivery_end_hour |
| `src/components/ui/admin/settings/settings-types.ts` | Extended DeliverySettings interface | VERIFIED | 5 new fields: `cutoffDay`, `cutoffHour`, `deliveryStartHour`, `deliveryEndHour`, `maxDeliveryDurationMinutes` |
| `src/types/delivery.ts` | Constants removed | VERIFIED | `CUTOFF_DAY`, `CUTOFF_HOUR`, `TIME_WINDOWS` absent — `TIMEZONE` and type exports remain |
| `src/types/cart.ts` | Fee constants removed | VERIFIED | `DELIVERY_FEE_CENTS`, `FREE_DELIVERY_THRESHOLD_CENTS` absent — `MINIMUM_ORDER_CENTS` intentionally kept as UI limit |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/lib/settings/business-rules.ts` | `app_settings` table | Supabase query with `eq("category", "delivery")` | WIRED | Line 65-67: `.from("app_settings").select("key, value").eq("category", "delivery")` |
| `src/app/api/admin/settings/route.ts` | business-rules cache | `revalidateTag("business-rules")` after upsert | WIRED | Line 216: `revalidateTag("business-rules", { expire: 0 })` |
| `src/app/api/admin/settings/restore/route.ts` | business-rules cache | `revalidateTag("business-rules")` after restore | WIRED | Line 121: `revalidateTag("business-rules", { expire: 0 })` |
| `src/app/api/checkout/session/route.ts` | `src/lib/settings/business-rules.ts` | `getBusinessRules()` call | WIRED | Line 7 import, line 43 `await getBusinessRules()` |
| `src/app/api/checkout/session/route.ts` | delivery-dates.ts | `isPastCutoff(saturday, now, cutoffDay, cutoffHour)` | WIRED | Line 57: passes `rules.cutoffDay`, `rules.cutoffHour` |
| `src/app/api/checkout/session/route.ts` | generate-time-windows | `generateTimeWindows` for time window validation | WIRED | Line 46: `generateTimeWindows(rules.deliveryStartHour, rules.deliveryEndHour)` |
| `src/components/ui/admin/settings/SettingsClient/SettingsClient.tsx` | `SaveConfirmDialog.tsx` | Save triggers diff dialog | WIRED | Line 15 import, line 184 `computeDeliveryChanges()`, line 403 `<SaveConfirmDialog>` |
| `src/app/(public)/PublicShell.tsx` | cart store | `DeliverySettingsSync` syncs server rules | WIRED | Line 5 import, line 21 `<DeliverySettingsSync deliveryFeeCents={...}>` |
| `src/app/(customer)/CustomerShell.tsx` | cart store | `DeliverySettingsSync` syncs server rules | WIRED | Line 5 import, line 21 `<DeliverySettingsSync deliveryFeeCents={...}>` |
| `src/app/(public)/page.tsx` | `src/lib/settings/business-rules.ts` | `getBusinessRules()` passed as props to Hero | WIRED | Line 4 import, line 99 `await getBusinessRules()`, props passed to `<Hero>` |
| `src/app/(customer)/checkout/page.tsx` | business rules | Server wrapper generates timeWindows for CheckoutClient | WIRED | Line 1 imports, line 6 `generateTimeWindows(...)`, `<CheckoutClient timeWindows={...}>` |

---

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|----------|
| RULES-01 | Plan 01 | `cutoff_hour` + `cutoff_day` configurable via admin settings | SATISFIED | `cutoff_day` and `cutoff_hour` in migration 029, Zod schema, `BusinessRules` interface, admin form Schedule subsection, checkout route uses `rules.cutoffDay/cutoffHour` |
| RULES-02 | Plan 01 | `delivery_fee_cents` configurable via admin settings | SATISFIED | `base_delivery_fee_cents` in DB, mapped to `deliveryFeeCents` in `BusinessRules`, admin form Pricing subsection, checkout route `rules.deliveryFeeCents` |
| RULES-03 | Plan 01 | `free_delivery_threshold_cents` configurable via admin settings | SATISFIED | `free_delivery_threshold_cents` in DB, mapped to `freeDeliveryThresholdCents`, cart store injects dynamically via `setDeliverySettings` |
| RULES-04 | Plan 01 | `delivery_start_hour` / `delivery_end_hour` configurable | SATISFIED | Both keys in migration 029, admin form Schedule subsection, checkout uses `rules.deliveryStartHour/deliveryEndHour` for time window generation |
| RULES-05 | Plan 01 | `max_delivery_radius_miles` / `max_delivery_duration_minutes` configurable | SATISFIED | Both keys in migration 029, editable in admin form Coverage subsection, stored in DB and retrievable via `getBusinessRules()` |
| RULES-06 | Plan 03 | Admin Settings form to edit all values | SATISFIED | `DeliverySettingsForm.tsx` with Pricing/Schedule/Coverage subsections renders all 9 configurable fields with change indicators and `SaveConfirmDialog` confirmation flow |
| RULES-07 | Plan 01, 02 | Server reads from `app_settings` instead of constants with 5min cache | SATISFIED | `getBusinessRules()` uses `unstable_cache` with `revalidate: 300` (5 min), queries DB, checkout route uses it for all server-side logic |
| RULES-08 | Plan 04 | Customer pages display configured delivery fee, cutoff time, delivery hours dynamically | SATISFIED | Homepage hero (`page.tsx` + `HeroContent.tsx`), menu page layout, checkout (`CheckoutClient`), cart components via Zustand store — all read from `getBusinessRules()` via server components |
| RULES-10 | Plan 01 | Changes take effect immediately on next page load via `revalidateTag` | SATISFIED | Both PATCH and restore handlers call `revalidateTag("business-rules", { expire: 0 })` after successful DB write |

**RULES-09** is NOT in scope for Phase 78 (admin ops dashboard countdown timers — mapped to Phase 79 in REQUIREMENTS.md). This is correct.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/ui/cart/DeliverySettingsSync.tsx` | 24 | `return null` | Info | Intentional — behavior-only component with no UI output; correct pattern for store sync |

No blockers or warnings found.

---

### Human Verification Required

#### 1. Admin Form Visual Layout

**Test:** Log in as admin, navigate to Settings > Delivery. Confirm three visual subsections (Pricing, Schedule, Coverage) are visually distinct with labels and separators.
**Expected:** Three clearly grouped sections with readable labels; numeric hour inputs show formatted time preview (e.g., "3:00 PM" next to cutoff hour 15).
**Why human:** Visual layout cannot be verified programmatically.

#### 2. Save Confirmation Dialog Diff

**Test:** Change a delivery setting (e.g., change base fee from $15.00 to $12.00). Click Save. Confirm dialog appears showing old ($15.00) with strikethrough and new ($12.00) highlighted.
**Expected:** Modal shows "Base Delivery Fee | $15.00 ~~strikethrough~~ -> $12.00 highlighted". Confirm saves; Cancel reverts.
**Why human:** Dialog rendering and interaction requires visual + manual test.

#### 3. Homepage Hero Dynamic Content

**Test:** Load the homepage. Confirm the hero text reflects the configured cutoff schedule (e.g., "Order by Friday 3:00 PM for Saturday delivery") and delivery fee.
**Expected:** Hero shows schedule text derived from DB values, not hardcoded strings.
**Why human:** Requires visual inspection and comparison with DB values.

#### 4. End-to-End Cache Invalidation

**Test:** Change a delivery setting in admin. Reload a customer page (without server restart). Confirm the new value appears.
**Expected:** Within one page load after saving, customer-facing pages reflect the updated business rule.
**Why human:** Requires live environment with actual Supabase connection and Next.js cache behavior.

#### 5. Attribution Persistence

**Test:** Save a delivery setting. Reload the admin settings page. Confirm "Last changed by [name] on [date]" appears at the top of the delivery form with the correct admin name.
**Expected:** Attribution line persists across page loads, sourced from DB `updated_by` → profiles join.
**Why human:** Requires live DB + auth session to confirm full attribution lookup chain works.

---

### Committed Work Verification

All 8 task commits verified in git log:

| Commit | Plan | Task |
|--------|------|------|
| `900fcb02` | 01 | Create settings library, time window generator, DB migration |
| `0ca9828f` | 01 | Extend schemas, types, defaults, cache invalidation wiring |
| `89fb1df7` | 02 | Parameterize delivery-dates.ts and order.ts |
| `175b422a` | 02 | Wire checkout route to getBusinessRules() |
| `00708814` | 03 | Add delivery settings diff helpers and SaveConfirmDialog |
| `0b238210` | 03 | Reorganize delivery form with subsections and save confirmation dialog |
| `a33992b8` | 04 | Migrate cart store, hooks, and components from constants to injectable settings |
| `fdf3dbf4` | 04 | Wire server components to pass business rules and remove dead constants |

---

### Notable Design Decisions (Not Gaps)

1. **`MINIMUM_ORDER_CENTS` kept in `types/cart.ts`:** `CartPageContent.tsx` still imports this hardcoded constant. This was an explicit Plan 04 decision — minimum order is a UI limit enforced client-side only. The value IS configurable via admin (it's in `BusinessRules` and the admin form), but client-side cart minimum display was scoped out of Phase 78. Not a RULES-08 gap since that requirement specifies "delivery fee, cutoff time, and delivery hours" only.

2. **`deliveryRadiusMiles` and `maxDeliveryDurationMinutes` not used operationally yet:** These are configurable via admin and stored in DB but no API routes currently enforce them for coverage checks. RULES-05 only requires them to be "configurable via admin settings" — fulfilled.

3. **Optional params with defaults in `delivery-dates.ts` and `order.ts`:** Functions use optional `cutoffDay`/`cutoffHour` params with backward-compatible defaults instead of mandatory params. Server-side consumers (checkout route) explicitly pass DB values; remaining consumers use defaults until future migration.

---

## Summary

Phase 78 achieves its goal. All delivery business rules — fees, thresholds, cutoff times, time windows, delivery hours, radius, duration — are now configurable through admin settings and flow from the database through the application without hardcoded constants in the critical paths.

The foundation layer (`getBusinessRules()`, `generateTimeWindows()`, migration 029) is solid. Server-side enforcement (checkout route) uses DB-sourced values. The admin form exposes all 9 settings with a confirmation dialog preventing accidental changes. Customer-facing pages receive values from server components via props and the Zustand store.

5 human verification items remain for visual/behavioral confirmation in a live environment.

---

_Verified: 2026-03-01T12:30:00Z_
_Verifier: Claude (gsd-verifier)_
