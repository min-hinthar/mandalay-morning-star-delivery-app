---
status: resolved
trigger: "checkout-step2-step3-styling - Three checkout flow issues"
created: 2026-01-30T00:00:00Z
updated: 2026-01-30T00:00:00Z
---

## Current Focus

hypothesis: Three confirmed issues with specific root causes
test: Apply targeted fixes to each component
expecting: Fixes will resolve all three styling/display issues
next_action: Fix all three issues

## Root Causes Found

1. **Date picker "Next Week" label** - TimeSlotPicker.tsx line 121 shows "Next Week" for all `isNextWeek` dates. Should show "In 2 Weeks", "In 3 Weeks" for dates further out.

2. **Delivery time muted text** - TimeSlotDisplay.tsx lines 24, 28 use `text-muted` class making text too dim. Should use proper text color.

3. **Place order button unstyled** - PaymentStepV8.tsx uses custom motion.button with `bg-status-success` which may not be properly defined. Should use Button component with proper variant.

## Symptoms

expected:
  - Step 2 date picker should show specific week ranges like "next week", "next 2 weeks", "next 3 weeks" etc.
  - Step 3 delivery time span text color should NOT be muted
  - Step 3 place order button should be properly styled

actual:
  - Date picker showing generic "next week" instead of specific week ranges
  - Delivery time text is muted/grayed out
  - Place order button lacks proper styling

errors: None - styling/display issues

reproduction: Go through checkout flow, observe Step 2 date selection and Step 3 delivery time + place order button

started: Never worked - always broken

## Eliminated

## Evidence

## Resolution

root_cause: |
  Three separate styling/display issues:
  1. TimeSlotPicker showed "Next Week" for all future dates instead of "In X Weeks"
  2. TimeSlotDisplay used `text-muted` class making delivery time text too dim
  3. Place Order button used custom inline styles with undefined `bg-status-success` token

fix: |
  1. Added `weekOffset` prop to DatePill component and calculated offsets based on whether first date cutoff passed. Badge now shows "Next Week", "In 2 Weeks", "In 3 Weeks" appropriately.
  2. Changed TimeSlotDisplay spans from `text-muted` to `text-text-primary` and added `text-primary` to icons for better visibility.
  3. Replaced custom motion.button with Button component using `variant="success"` which has proper styling including `bg-green`, hover states, and built-in loading state handling.

verification: |
  - TypeScript: No errors
  - ESLint: No errors
  - Build: Successful

files_changed:
  - src/components/ui/checkout/TimeSlotPicker.tsx
  - src/components/ui/checkout/TimeSlotDisplay.tsx
  - src/components/ui/checkout/PaymentStepV8.tsx
