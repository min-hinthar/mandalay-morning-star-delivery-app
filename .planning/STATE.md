---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Production-Grade Launch MVP
status: active
stopped_at: Completed 92-04-PLAN.md
last_updated: "2026-03-03T19:47:25Z"
last_activity: 2026-03-03 — Modifier scroll overflow fade indicator in ItemDetailSheet
progress:
  total_phases: 7
  completed_phases: 5
  total_plans: 18
  completed_plans: 18
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-03)

**Core value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.
**Current focus:** v2.0 Production-Grade Launch MVP — Phase 92 complete

## Current Position

Phase: 92 of 95 (Customer UX: Discovery & Shopping) - COMPLETE
Plan: 4/4 completed
Status: Phase 92 complete
Last activity: 2026-03-03 — Modifier scroll overflow fade indicator in ItemDetailSheet

Progress: [██████████] 100% (5/7 phases)

## Performance Metrics

**Velocity:**

- Total plans completed: 361 (across v1.0-v2.0)
- Average duration: ~15 min
- Total execution time: ~88 hours

**By Milestone:**

| Milestone          | Phases | Plans | Duration |
| ------------------ | ------ | ----- | -------- |
| v1.0               | 8      | 32    | 2 days   |
| v1.1               | 6      | 21    | 1 day    |
| v1.2               | 9      | 29    | 4 days   |
| v1.3               | 10     | 53    | 2 days   |
| v1.4               | 8      | 39    | 6 days   |
| v1.5               | 8      | 34    | 3 days   |
| v1.6               | 10     | 47    | 6 days   |
| v1.7               | 9      | 32    | 3 days   |
| v1.8               | 10     | 25    | 10 days  |
| v1.9               | 12     | 38    | 3 days   |
| v2.0 (in progress) | 3      | 10    | 1 day    |
| v2.0 91-01         | 1      | 1     | 7 min    |
| v2.0 91-02         | 1      | 1     | 10 min   |
| v2.0 91-03         | 1      | 1     | 20 min   |
| v2.0 91-04         | 1      | 1     | 7 min    |
| v2.0 92-02         | 1      | 1     | 8 min    |
| **Total**          | **95** | **365** | **41 days** |

## Accumulated Context

### Phase 91 Decisions
- Migration numbered 035 (033/034 taken by photo pipeline)
- Removed BUG-08 client-side price drift detection; 91-02 implements server-side approach
- Server-authoritative pricing: Zod schema strips basePriceCents/priceDeltaCents from client input
- totalCents clamped to Math.max(0) to prevent negative totals from large discounts
- Tip represented as Stripe line item; discounts via Stripe discounts param
- Extracted validatePromoCode to src/lib/stripe/promo.ts; cleanupOrder to helpers.ts
- Tip computed in UI from subtotal (reactive to cart changes), not stored as tipCents
- Custom tip clamped to $0-$1000 matching Zod schema
- text-text-inverse used instead of text-white per Tailwind v4 design token enforcement
- Stripe SDK v17+: coupon at promo.promotion.coupon (not promo.coupon)
- Checkout page also passes prepTimeBufferMinutes for UI/API consistency
- useCartStore.getState() for non-hook access inside fetch handler — safe pattern for event callbacks
- Duplicate order check uses delivery.date from checkout store (not gate.deliveryDate) — matches actual selection
- Dual-layer duplicate detection: useExistingOrder (client warning) + server DUPLICATE_ORDER (enforcement)

### Phase 92 Decisions
- setTimeout chain replaces setInterval for dynamic 10s/60s polling based on cutoff proximity
- Hero delivery date text placed between CTA and countdown for visual hierarchy
- Auto-select only fires when delivery is null -- preserves user manual selection
- max-h-[50vh] constrains modifier container to trigger overflow on items with many modifier groups
- 4px threshold for isAtBottom handles sub-pixel rounding across browsers
- from-surface-primary token for gradient ensures dark mode compatibility (#fff light / #000 dark)

### Phase 94 Decisions
- useState<Set<string>> for collapse state (not Radix Collapsible — overkill for toggle)
- Top-level Select All excludes collapsed windows for consistent UX
- Native sms: URI for driver SMS — no backend SMS service for MVP
- NavigationButton lat/lng made optional; falls back to encodeURIComponent(address)
- Photo enforcement is client-side only — no server-side gate on PATCH endpoint (offline sync safety)
- Offline-queued photo sets hasPhoto=true immediately (driver not blocked by connectivity)
- Extracted SimpleRouteDone to keep SimpleStopView under 400 lines

### Phase 90 Decisions
- Server-side sharp for WebP conversion (not client-side Canvas) — consistent output across devices
- 4:3 aspect ratio at 800x600 standardized for all menu photos
- Removed Google Drive URL from photo management — Supabase Storage is sole source
- Slug-based photo matching: filename minus extension = menu item slug
- Allergen dedup: removed redundant contains_* tags, canonical allergens_enum is single source
- Bulk upload threshold: >1 files triggers BulkUploadMatcher modal
- Photo seed only updates image_url when null or contains "fallback"

### Phase 89 Decisions
- Idempotency key uses only order ID (no attempt counter) — Stripe handles concurrent retries
- cleanupOrder is module-level function for reuse across checkout route
- RPC result validated with typeof/Array.isArray guards (no Zod, lightweight)
- modifierGroups parameter is optional for backward compatibility
- Refund uses calculate-then-apply pattern (no DB writes before ceiling validation)
- Debounce moved inside Zustand set() for atomicity; standalone function removed
- 10-second safety buffer only affects isPastCutoff, not UI countdown

### Pending Todos (Human Actions)

- Apply migrations 027-035 to production Supabase
- Configure RESEND_WEBHOOK_SECRET env var for svix webhook verification
- Provision Upstash Redis on Vercel Marketplace for production rate limiting
- Create Sentry alert rule "Rate Limit Spike" in Sentry Dashboard
- Verify timezone for customer gate: Asia/Yangon vs America/Los_Angeles

### Blockers/Concerns

- Upstash Redis provisioning needed via Vercel Marketplace before rate limiting is active in production
- Migrations 027-035 must be applied before deploying v2.0 features

## Session Continuity

Last session: 2026-03-03T19:46:51Z
Stopped at: Completed 92-02-PLAN.md
Resume file: .planning/phases/92-customer-ux-discovery-shopping/92-03-PLAN.md
Next action: Execute 92-03 plan
