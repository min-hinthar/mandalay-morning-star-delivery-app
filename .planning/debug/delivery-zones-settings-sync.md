---
status: awaiting_human_verify
trigger: "Admin settings page delivery zones may not be in sync with configured business logic"
created: 2026-03-16T00:00:00Z
updated: 2026-03-16T00:01:00Z
---

## Current Focus

hypothesis: CONFIRMED - Multiple sync gaps between admin settings UI and actual business logic
test: Code review of all layers (UI types, API validation, business rules, coverage service)
expecting: Gaps at validation, coverage service, and zone bearing config levels
next_action: Fix all identified issues

## Symptoms

expected: Admin settings page should display and allow editing of delivery zones, distance fee tiers, and direction-based routing that match the actual business logic used in checkout/delivery flow.
actual: Multiple disconnects found between settings UI, API validation, and business logic consumption.
errors: No runtime errors — silent data loss and hardcoded fallbacks.
reproduction: Edit long_distance_fee or long_distance_threshold in admin settings; save; the values are silently rejected by API validation.
started: Built incrementally across phases.

## Eliminated

## Evidence

- timestamp: 2026-03-16T00:00:30Z
  checked: Zod validation schema (src/lib/validations/settings.ts)
  found: deliverySettingsBaseSchema is MISSING long_distance_fee_cents and long_distance_threshold_miles fields
  implication: PATCH /api/admin/settings silently strips these fields during validation — admin edits to extended delivery fee and distance threshold are LOST

- timestamp: 2026-03-16T00:00:35Z
  checked: Coverage service (src/lib/services/coverage.ts)
  found: Uses hardcoded DEFAULT_ZONES and BUSINESS_RULES_DEFAULTS instead of fetching from DB via getBusinessRules()
  implication: Coverage check (direction routing, fee tier, eligible days) is NEVER affected by admin settings changes — always uses compile-time defaults

- timestamp: 2026-03-16T00:00:40Z
  checked: Admin UI DeliveryZone type (settings-types.ts)
  found: DeliveryZone = { name, feeCents, description } — a generic zone concept with NO bearing fields
  implication: UI "Delivery Zones" section is a completely different concept from the DB delivery_zones table (which has direction, bearing_start, bearing_end, reference_cities). They are not connected at all.

- timestamp: 2026-03-16T00:00:45Z
  checked: Admin settings PATCH API route (src/app/api/admin/settings/route.ts)
  found: Sends each field as individual app_settings upsert (key/value pattern). The UI deliveryZones array would be stored as a single JSONB value under key "delivery_zones" — but the business-rules.ts reader fetches zones from the delivery_zones TABLE, not from app_settings
  implication: Even if the UI zones were saved, they'd go to the wrong place (app_settings row vs delivery_zones table)

- timestamp: 2026-03-16T00:00:50Z
  checked: DeliveryDaysManager component
  found: Self-contained, fetches/saves directly to /api/admin/delivery-days. Direction field is editable per-day. This part works correctly.
  implication: Per-day direction routing is properly synced through its own dedicated API

- timestamp: 2026-03-16T00:00:55Z
  checked: business-rules.ts fetchBusinessRules()
  found: Correctly reads long_distance_fee_cents and long_distance_threshold_miles from app_settings AND delivery zones from delivery_zones table. The reader is correct — the problem is the writer (admin settings) can't write these values.
  implication: If we fix the validation schema, the long_distance settings will flow through correctly. Zone bearings need a separate management UI or should use the delivery_zones table directly.

## Resolution

root_cause: Three sync gaps between admin settings UI and business logic:
  1. CRITICAL: Zod validation schema missing long_distance_fee_cents and long_distance_threshold_miles — admin edits to these fields are silently rejected
  2. MODERATE: coverage.ts uses hardcoded DEFAULT_ZONES and BUSINESS_RULES_DEFAULTS instead of reading from DB — coverage checks ignore admin settings entirely
  3. LOW: UI "Delivery Zones" (name/fee/description) is disconnected from DB delivery_zones table (direction/bearing_start/bearing_end/reference_cities) — two different concepts sharing the same name
fix:
  1. Added long_distance_fee_cents and long_distance_threshold_miles to Zod deliverySettingsBaseSchema
  2. Refactored coverage.ts to use getBusinessRules() for zones, fee thresholds, and delivery day mapping
  3. Removed misleading generic "Delivery Zones" UI section (name/fee/description) that was disconnected from actual bearing-based delivery_zones table
  4. Updated delivery-helpers.ts to include long distance fields in change detection and formatting
  5. Updated coverage.test.ts to mock getBusinessRules
verification: pnpm lint + lint:css + format:check + typecheck + test (782/782) + build all pass
files_changed:
  - src/lib/validations/settings.ts
  - src/lib/services/coverage.ts
  - src/components/ui/admin/settings/DeliverySettingsForm.tsx
  - src/components/ui/admin/settings/delivery-helpers.ts
  - src/lib/services/__tests__/coverage.test.ts
