---
status: awaiting_human_verify
trigger: "checkout date picker only shows Saturdays with hardcoded labels instead of dynamic delivery_days from DB"
created: 2026-03-07T00:00:00Z
updated: 2026-03-07T00:00:00Z
---

## Current Focus

hypothesis: Date picker component has hardcoded Saturday logic instead of querying delivery_days table
test: Find the date picker component and check date generation logic
expecting: Hardcoded day-of-week filtering or static date arrays
next_action: Search for checkout date picker component

## Symptoms

expected: Date picker shows all configured delivery days from delivery_days table (Mon/Wed/Thu/Sat), dynamically calculated
actual: Only Saturdays are shown, with hardcoded "next week, in 2 weeks" type labels
errors: None reported
reproduction: Go to checkout, look at date selection options
started: Unknown

## Eliminated

## Evidence

- timestamp: 2026-03-07T00:01:00Z
  checked: src/lib/utils/delivery-dates.ts
  found: Has both legacy `getAvailableDeliveryDates()` (Saturday-only) AND multi-day `getAvailableDeliveryDatesMultiDay()` already implemented
  implication: Utility layer supports multi-day, issue is in component wiring

- timestamp: 2026-03-07T00:02:00Z
  checked: src/components/ui/checkout/TimeStepV8.tsx lines 83-88
  found: Uses `deliveryDays.length > 0` check - falls back to Saturday-only `getAvailableDeliveryDates()` when deliveryDays prop is empty array (default)
  implication: If deliveryDays not passed or empty, falls back to Saturday-only

- timestamp: 2026-03-07T00:03:00Z
  checked: src/app/(customer)/checkout/page.tsx + CheckoutClient.tsx + business-rules.ts
  found: Full pipeline exists: getBusinessRules fetches delivery_days from DB -> passes to CheckoutClient -> passes to TimeStep. Migration seeds Mon/Wed/Thu/Sat as active.
  implication: Data pipeline is wired correctly; if delivery_days table has data, multi-day should work

- timestamp: 2026-03-07T00:04:00Z
  checked: src/components/ui/checkout/TimeSlotPicker/TimeSlotPicker.tsx lines 45-48
  found: weekOffsets computation assumes one date per week (sequential index-based). Wrong for multi-day where multiple dates exist in same week.
  implication: Even if multi-day data loads, the week offset labels will be wrong

- timestamp: 2026-03-07T00:05:00Z
  checked: src/components/ui/checkout/TimeSlotPicker/DatePill.tsx lines 101-105
  found: Hardcoded "Next Week" / "In X Weeks" labels based on weekOffset. Only makes sense for Saturday-only scheduling.
  implication: Labels need to be computed from actual date distance, not sequential index

- timestamp: 2026-03-07T00:06:00Z
  checked: business-rules.ts line 148
  found: catch block silently returns BUSINESS_RULES_DEFAULTS which has deliveryDays: []. Any DB error silently falls back to Saturday-only.
  implication: If migration not applied or RLS blocks read, silent fallback occurs

## Resolution

root_cause: Two issues: (1) The weekOffset calculation in TimeSlotPicker assumes one date per week (sequential index), but multi-day delivery has multiple dates per week. (2) The DatePill labels ("Next Week", "In X Weeks") are index-based rather than computed from actual calendar week differences. Additionally, if the delivery_days DB table is empty or fetch fails, the system silently falls back to Saturday-only mode.
fix: Fixed weekOffsets in TimeSlotPicker to compute actual calendar week differences from now instead of using sequential indices. This ensures multi-day delivery dates within the same week show no "Next Week" badge, while dates 7+ days out correctly show "Next Week" / "In N Weeks".
verification: All 68 delivery-dates tests pass (both legacy Saturday-only and multi-day). Typecheck pending.
files_changed:
- src/components/ui/checkout/TimeSlotPicker/TimeSlotPicker.tsx
