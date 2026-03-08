---
status: awaiting_human_verify
trigger: "email-suggested-items-placeholder"
created: 2026-03-07T00:00:00Z
updated: 2026-03-07T00:10:00Z
---

## Current Focus

hypothesis: CONFIRMED — SuggestedItems had hardcoded items, no props, no DB query
test: typecheck + lint pass
expecting: All callers now fetch real menu items and pass them through
next_action: Await human verification

## Symptoms

expected: "You might also like" section shows real menu items from the database
actual: Shows hardcoded ["Mohinga", "Tea Leaf Salad", "Samosa"] every time
errors: None — renders fine, just wrong data
reproduction: Send any order confirmation email, look at suggested items
started: Always been this way — scaffolded with placeholder data

## Eliminated

(none needed — root cause was obvious on first read)

## Evidence

- timestamp: 2026-03-07T00:01:00Z
  checked: src/emails/components/SuggestedItems.tsx
  found: Line 9 has `const SUGGESTED = ["Mohinga", "Tea Leaf Salad", "Samosa"]` hardcoded. Component takes no props.
  implication: This is the root cause — no mechanism to pass real data.

- timestamp: 2026-03-07T00:02:00Z
  checked: src/emails/OrderConfirmation.tsx line 317
  found: `<SuggestedItems />` called with no props
  implication: Only consumer, confirms no data flow from callers.

- timestamp: 2026-03-07T00:03:00Z
  checked: All 4 email sending paths (Stripe webhook, COD helper, verify-payment, approve-cod, admin resend)
  found: None fetch menu items from DB. None pass suggested items to OrderConfirmation.
  implication: All paths need updating.

- timestamp: 2026-03-07T00:10:00Z
  checked: typecheck + lint on all changed files
  found: Clean — zero errors
  implication: Fix compiles correctly

## Resolution

root_cause: SuggestedItems.tsx has hardcoded item names and accepts no props. No email sending code fetches menu items from the database.
fix: |
  1. SuggestedItems now accepts optional `items` prop, falls back to defaults for previews
  2. OrderConfirmation accepts and passes through `suggestedItems` prop
  3. New `fetchSuggestedItemNames()` utility queries active, non-sold-out menu items, shuffles, picks 3, excludes items already in the order
  4. All 5 email sending paths now call fetchSuggestedItemNames before rendering
  5. buildEmailElement passes suggestedItems through for admin resend path
verification: typecheck + lint pass. Awaiting human verification of actual email content.
files_changed:
  - src/emails/components/SuggestedItems.tsx
  - src/emails/OrderConfirmation.tsx
  - src/lib/email/suggestions.ts (new)
  - src/lib/email/index.ts
  - src/lib/email/build.ts
  - src/app/api/webhooks/stripe/handlers.ts
  - src/app/api/checkout/session/helpers.ts
  - src/app/api/orders/[id]/verify-payment/route.ts
  - src/app/api/admin/orders/[id]/approve-cod/route.ts
  - src/app/api/admin/emails/send/route.ts
