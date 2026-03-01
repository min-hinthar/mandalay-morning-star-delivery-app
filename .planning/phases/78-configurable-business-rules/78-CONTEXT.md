# Phase 78: Configurable Business Rules - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace all hardcoded business constants (delivery fee, cutoff day/hour, free delivery threshold, delivery hours, radius) with admin-editable settings stored in `app_settings`. Changes take effect on next page load without a code deploy. Customer-facing pages display configured values dynamically.

</domain>

<decisions>
## Implementation Decisions

### Customer-facing display
- Inline with context — show fee naturally where relevant (e.g., "Delivery: $15.00" in cart, "$15 delivery fee" in checkout summary, "Free delivery over $100" in menu banner)
- Cutoff display: static text on menu/hero ("Order by Friday 3:00 PM for Saturday delivery"), countdown timer in cart/checkout where urgency matters
- Pages that display configured values: homepage hero, menu banner, cart drawer, checkout summary, AND order confirmation page
- Time slot picker on checkout generates slots dynamically from configured `delivery_start_hour` / `delivery_end_hour` — no more hardcoded `TIME_WINDOWS` array

### Settings form organization
- Cutoff input: day-of-week dropdown + time picker (e.g., "Friday at 3:00 PM")
- All delivery settings stay on the Delivery tab, organized into visual subsections: "Pricing", "Schedule", "Coverage"
- No live preview of customer-facing impact — admin checks customer pages after saving
- `max_delivery_duration_minutes`: Claude's discretion on whether standalone field or derived from radius

### Fallback & migration strategy
- Seed on deploy — migration script inserts default rows into `app_settings` with current hardcoded values
- App always reads from DB, never falls back to constants after migration
- Validation + soft warnings for unusual-but-valid values (e.g., $0 delivery fee shows yellow warning but allows save)

### Save confirmation & safety
- Confirmation dialog before saving — lists each changed field with old → new value diff ("Delivery fee: $15.00 → $20.00")
- Simple change history — "Last changed by X on Y" line shown per field or at form top, using existing `updated_at`/`updated_by` columns
- Changed fields get a subtle visual indicator (dot, border color, or "modified" badge) to help admin track unsaved changes

### Cache & live effect
- Immediate revalidation on save via `revalidateTag` — customer pages reflect changes on next load (matches RULES-10)
- Toast + "Last updated: just now" timestamp at top of form after successful save

### Claude's Discretion
- `max_delivery_duration_minutes` field approach (standalone vs derived)
- Loading skeleton design for settings form
- Exact change indicator styling (dot vs border vs badge)
- How the confirmation diff dialog is structured visually

</decisions>

<specifics>
## Specific Ideas

- Confirmation dialog should show old → new for each changed field, preventing accidental changes
- Subsections within Delivery tab: "Pricing" (fee, threshold, min order), "Schedule" (cutoff day/hour, delivery hours), "Coverage" (radius, duration)
- Time slots should be auto-generated from start/end hours in 1-hour increments (matching current TIME_WINDOWS pattern)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SettingsClient` (`src/components/ui/admin/settings/SettingsClient/SettingsClient.tsx`): Full settings page with tabs, save/discard/restore flows, FloatingUnsavedBar, ConfirmDialog
- `DeliverySettingsForm` (`src/components/ui/admin/settings/DeliverySettingsForm.tsx`): Existing form with radius, min order, fee, threshold, cutoff time, time windows, zones
- `deliverySettingsSchema` (`src/lib/validations/settings.ts`): Zod schema for delivery settings validation
- Settings API (`src/app/api/admin/settings/route.ts`): GET/PATCH with `app_settings` table, upsert pattern, rate limiting
- `RestoreDefaultsDialog`, `SaveButton`, `FloatingUnsavedBar`, `ConfirmDialog`: Existing UI components

### Established Patterns
- Settings stored as key-value rows in `app_settings` table with JSONB `value` column
- API converts camelCase ↔ snake_case between client and DB
- Zod validation with `.safeParse()` on both client and server
- Toast notifications for save success/failure
- `beforeunload` warning for unsaved changes
- Design tokens enforced via ESLint (no hardcoded colors/spacing)

### Constants to Replace
- `CUTOFF_DAY = 5`, `CUTOFF_HOUR = 15` in `src/types/delivery.ts` — imported by checkout, cart, tracking
- `DELIVERY_FEE_CENTS = 1500` in `src/types/cart.ts` — imported by cart, checkout summary, free delivery progress
- `FREE_DELIVERY_THRESHOLD_CENTS = 10000` in `src/types/cart.ts` — imported by checkout summary, cart
- `TIME_WINDOWS[]` in `src/types/delivery.ts` — imported by TimeSlotPicker, checkout

### Integration Points
- `isPastCutoff()` in `src/lib/utils/delivery-dates.ts` — must read configured cutoff instead of constants
- `CheckoutSummaryV8` — imports `FREE_DELIVERY_THRESHOLD_CENTS` directly
- `FreeDeliveryProgress` — imports `FREE_DELIVERY_THRESHOLD_CENTS` directly
- `TimeSlotPicker` — imports `TIME_WINDOWS` for slot options
- Stripe checkout session creation — uses delivery fee in line items
- Homepage hero, menu banner — will need to fetch/receive configured values

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 78-configurable-business-rules*
*Context gathered: 2026-03-01*
