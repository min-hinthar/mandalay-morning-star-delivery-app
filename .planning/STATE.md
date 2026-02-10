# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-07)

**Core value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.
**Current focus:** Phase 54 in progress. Email infrastructure (54-01), shared components (54-02), all 4 email templates (54-03, 54-04), route integration (54-05), and cron/webhook endpoints (54-06) complete. All order lifecycle events now trigger branded emails via sendEmail().

## Current Position

Phase: 54 (7 of 10 in v1.6)
Plan: 5 of ~6 in current phase (54-01 through 54-06 complete)
Status: In progress
Last activity: 2026-02-10 -- Completed 54-05-PLAN.md

Progress: [█████████████████████████████░] ~95%

## Milestones

| Milestone | Phases | Plans | Shipped |
|-----------|--------|-------|---------|
| v1.0 MVP | 1-8 | 32 | 2026-01-23 |
| v1.1 Tech Debt | 9-14 | 21 | 2026-01-23 |
| v1.2 Playful UI Overhaul | 15-24 | 29 | 2026-01-27 |
| v1.3 Full Codebase Consolidation | 25-34 | 53 | 2026-01-28 |
| v1.4 Mobile Excellence | 35-39 | 39 | 2026-02-05 |
| v1.5 Performance & Repo Health | 40-47 | 34 | 2026-02-07 |
| v1.6 Production Polish | 48-57 | ~23 | -- |

**Total completed:** 52 phases, 237 plans, 297 requirements

## Performance Metrics

**Velocity:**
- Total plans completed: 231
- Average duration: --
- Total execution time: --

*Metrics carry forward from v1.5. Updated after each plan completion.*

## Accumulated Context

### Key Decisions

| ID | Decision | Phase-Plan |
|----|----------|------------|
| ERRP-06-CSS | CSS-only animate-fade-in-up replaces framer-motion in error boundaries | 48-01 |
| ERRP-06-RETRY | useRef retry counter promotes go-home after 2+ failures | 48-01 |
| ERRP-06-TOKENS | Semantic tokens replace ghost tokens in error UI | 48-01 |
| DFAS-01-LAZY | customer_settings uses lazy row creation (INSERT ON CONFLICT DO NOTHING) | 50-01 |
| DFAS-01-COMPAT | New settings fields optional in Zod schemas for backward compatibility | 50-01 |
| DFAS-02-SAVEBTN | SaveButton wraps Button in m.div for scale animation to avoid motion prop conflicts | 50-02 |
| DFAS-02-CONFIRM | ConfirmDialog uses Button variant mapping (destructive->danger) for consistency | 50-02 |
| DFAS-03-SPLIT | Extracted delivery-helpers.ts from DeliverySettingsForm to stay under 400-line limit | 50-03 |
| DFAS-03-DEFAULTS | Extracted settings-defaults.ts from SettingsClient for DEFAULT_SETTINGS and mapApiResponse | 50-03 |
| DFAS-03-LOWSTOCK | Low stock alerts use threshold=0 as disabled state; toggle sets to 10 or 0 | 50-03 |
| DFAS-04-UPSERT | Nudge banner uses direct Supabase client upsert (no API route) for inline saves | 50-04 |
| DFAS-04-DBTYPES | Added CustomerSettings Row/Insert/Update types to database.ts for type safety | 50-04 |
| DFAS-04-PLACEMENT | PreferenceCounterCard placed as new row below 3-column grid (not crowding existing cards) | 50-04 |
| CUST-01-CAST | Json JSONB columns cast through unknown intermediate for TypeScript strict mode | 51-01 |
| CUST-01-PARTIAL | All customer settings schema fields optional for partial PATCH updates | 51-01 |
| CUST-02-SUSPENSE | Wrapped AccountClient in Suspense boundary for useSearchParams SSR safety | 51-02 |
| CUST-02-SPLIT | Dietary restrictions split into predefined/custom on load via DIETARY_OPTIONS set check | 51-02 |
| CUST-03-TOGGLE | ToggleSwitch wrapped in stopPropagation div to isolate from card expand/collapse | 51-03 |
| CUST-03-CHIPS | Custom allergy chips use border-dashed style to distinguish from predefined chips | 51-03 |
| CUST-04-FONTCSS | Font size applied via CSS custom property --font-size-base for instant WYSIWYG | 51-04 |
| CUST-04-SOUNDSYNC | useSoundPreference shares localStorage key with useSoundEffect (no AudioContext overhead) | 51-04 |
| CUST-04-THEMEFIRE | Theme DB sync is fire-and-forget PATCH (no loading state, already visually applied) | 51-04 |
| CUST-05-SELFCONTAINED | DietarySummaryCard fetches own data, renders null on empty/error (non-critical for checkout) | 51-05 |
| CUST-05-DEEPLINK | SettingsNudgeBanner uses ?tab=settings query param for direct Settings tab navigation | 51-05 |
| CART-01-HYDRATE | useCartHydrated uses persist.hasHydrated() + onFinishHydration() for reliable gate | 52-01 |
| CART-01-REFETCH | Force-refetch menu on validation mount for freshness (not stale cache) | 52-01 |
| CART-01-SILENT | API errors return status 'error' with hasBlockingIssues: false (backend validates on submit) | 52-01 |
| CART-02-SEMANTIC | Overlay uses bg-surface-inverse/40 (not bg-black/40) per semantic token lint rules | 52-02 |
| CART-02-LOCALTYPE | CartItemValidation type defined locally in AttentionSection (promoted to cart.ts in plan 03) | 52-02 |
| CART-02-BADGEBTN | PriceChangeBadge is a full button (whole badge tappable to dismiss, not just X icon) | 52-02 |
| CART-04-STALE | Stale items disable drag, hide quantity stepper, gray out with opacity-50 pointer-events-none | 52-04 |
| CART-04-LOADER | Drawer shows thin animated primary-color bar during validation (not skeleton replacement) | 52-04 |
| CART-04-GATE | Checkout button disabled + warning text when sold-out/unavailable items exist | 52-04 |
| CART-03-STORE | handleDismissPriceChange uses useCartStore.getState() directly (not require()) | 52-03 |
| CART-03-TAX | Estimated tax at 8.5% displayed as "Est. Tax" in order summary | 52-03 |
| CART-03-EDIT | Edit item handler is placeholder; full modifier editing deferred as TODO | 52-03 |
| CART-05-PULSE | Checkout pulse increased to 1.08 scale with green glow blur behind button | 52-05 |
| CART-05-ANIMPARENT | AnimatePresence moved to parent CartPageContent for proper AttentionSection exit animation | 52-05 |
| AUTH-01-STEAM | Custom auth-steam-drift keyframes replace error-drift reuse (gentler, more vertical) | 53-02 |
| AUTH-02-SOCIAL | Full-width labeled social buttons replace 56px icon squares ("Continue with Google/Apple") | 53-03 |
| AUTH-03-GLASS | AuthCard uses layered shadows + ring-white/30 glow + via-secondary accent bar | 53-02 |
| AUTH-04-SPARKLE | MagicLinkConfirmation uses 4 animated Sparkles icons around envelope | 53-04 |
| AUTH-05-RING | LoginSuccessCeremony uses expanding golden ring + 6-sparkle burst computed with trig | 53-06 |
| AUTH-06-EXPIRED | Expired page wrapped in AuthBackground for brand consistency | 53-05 |
| EMAIL-01-CATEGORY | Used 'notifications' category for email_sending_enabled setting (matches existing CHECK constraint) | 54-01 |
| EMAIL-01-FAILOPEN | Kill switch check fails open -- sending continues if app_settings unreadable | 54-01 |
| EMAIL-01-NEWCUST | Customers without customer_settings row default to all notifications opted-in | 54-01 |
| EMAIL-01-TAILWIND | Tailwind imported from @react-email/components (not separate @react-email/tailwind) | 54-02 |
| EMAIL-02-FONTSTK | Georgia/Palatino serif headings + system sans-serif body in emails (no Google Fonts) | 54-02 |
| EMAIL-03-INLINE | Heavy inline styles alongside Tailwind for email client compat | 54-02 |
| EMAIL-03-SPLIT | Extracted OrderTotalsTable, SuggestedItems, SupportSection as shared components for 400-line limit | 54-03 |
| EMAIL-03-NOTRACKER | OrderCancellation omits OrderStatusTracker (cancelled not in delivery status flow) | 54-03 |
| EMAIL-03-FALLBACK | Refund amount defaults to totalCents if refundAmountCents not provided | 54-03 |
| EMAIL-04-HELPERS | Extracted shared helpers.ts for formatPrice/formatDate/shortOrderId/font stacks across email templates | 54-04 |
| EMAIL-04-MAPFALLBACK | Static map only renders when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set; View on Maps link always shown | 54-04 |
| EMAIL-06-DRIVERCAST | Cast drivers table query results due to missing Database type definition | 54-06 |
| EMAIL-06-LOGCAST | Cast notification_logs query results in webhook handler for same reason | 54-06 |
| EMAIL-06-SIMPLEAUTH | Resend webhook uses simple webhook-secret header check (not full svix verification) | 54-06 |
| EMAIL-05-FIREFORGET | All sendEmail() calls use void for fire-and-forget; email failure never blocks API responses | 54-05 |
| EMAIL-05-IDEMPOTENCY | Webhook idempotency uses check-then-claim with UNIQUE constraint as atomic guard | 54-05 |
| EMAIL-05-CREATEELEMENT | React.createElement() in .ts route files instead of JSX (no JSX transform in .ts) | 54-05 |

### Tech Debt (carried forward)

| Item | Severity | Notes |
|------|----------|-------|
| LCP 8-11s | Medium | Deferred to v1.7 |
| Lighthouse score 30-45 | Medium | Deferred to v1.7 |
| UnifiedMenuItemCard 540 lines | Low | Documented exception |
| Lighthouse CI warn-only | Low | Deferred to v1.7 |
| drivers/notification_logs not in Database type | Low | Requires Supabase type gen or manual addition |

### Blockers/Concerns

- Social login (AUTH-02, AUTH-03) requires Google Cloud Console + Apple Developer Portal config -- ops gap, not code gap
- Resend domain verification needed before email features work in production
- Old send-order-confirmation Edge Function replaced by sendEmail() in 54-05; Edge Function can be removed

## Session Continuity

Last session: 2026-02-10
Stopped at: Completed 54-05-PLAN.md
Resume file: None
Next action: Phase 54 email system nearly complete; remaining plans if any

---

*Updated: 2026-02-10 -- Phase 54-05 complete. Stripe webhook idempotency via webhook_events table. Fire-and-forget email triggers wired into all 4 order lifecycle routes: checkout confirmation, admin cancel, admin refund, customer cancel. Old Edge Function call removed.*
