# Requirements: v1.8 Post-Launch Hardening & Driver Experience

**Status:** Gap Closure in Progress
**Coverage:** 34/37 complete (92%) — 3 requirements reset for gap closure

---

## v1.8 Requirements

### Security

- [x] **SEC-01**: CSP headers configured in report-only mode with all external domains whitelisted (Stripe, Google Maps, Supabase, Sentry, Google Fonts, Vercel Analytics)
- [ ] **SEC-02**: CSP enforced after report-only validation (upgrade Content-Security-Policy-Report-Only to Content-Security-Policy)
- [x] **SEC-03**: All Supabase tables audited for RLS policies (featured_sections, customer_settings, driver_invites, webhook_events, order_audit_log, app_settings, email_logs)
- [x] **SEC-04**: Missing RLS policies added with proper role-based access (driver own-read, admin bypass, service-role for system tables)
- [x] **SEC-05**: RLS policy indexes added on user_id, driver_id, route_id columns for performance
- [x] **SEC-06**: Rate limiting upgraded from in-memory Map to Upstash Redis (@upstash/redis + @upstash/ratelimit)
- [x] **SEC-07**: Rate limiting applied to auth endpoints (5/min signIn, 3/hr signUp) and high-traffic API routes (location updates, order creation)
- [x] **SEC-08**: cssText usages refactored to individual DOM property assignments for CSP compatibility (FlyToCart.tsx, CustomMarkers.tsx)

### Auth Routing

- [x] **AUTH-01**: Admin users redirect to /admin dashboard after login
- [x] **AUTH-02**: Driver users redirect to /driver dashboard after login
- [x] **AUTH-03**: Customer users redirect to /menu after login
- [x] **AUTH-04**: Driver onboarding lifecycle handled — new drivers (no active driver record) redirect to /driver/onboard instead of /driver
- [x] **AUTH-05**: Admin and driver routes protected at proxy/middleware level before page render (block unauthorized access without full page load)

### Driver Profile & Onboarding

- [x] **DPROF-01**: Driver can edit name, phone, vehicle type, and license plate from profile page
- [x] **DPROF-02**: Driver can upload profile photo via Supabase Storage (driver-photos bucket)
- [x] **DPROF-03**: Profile completeness indicator on dashboard showing missing fields
- [x] **DPROF-04**: Onboarding checklist on dashboard for new drivers (profile complete, first route viewed, first delivery done)
- [ ] **DPROF-05**: Test delivery page (/driver/test-delivery) with mock route data for practicing delivery flow

### Driver Dashboard

- [x] **DDASH-01**: Weekly earnings summary card showing computed earnings (per-delivery rate x completed deliveries)
- [x] **DDASH-02**: Per-route earnings breakdown showing earnings for each completed route
- [x] **DDASH-03**: Earnings history chart using Recharts (bar/line) showing weekly/monthly trends
- [x] **DDASH-04**: Upcoming assigned routes visible on driver home (not just today's route)
- [x] **DDASH-05**: Weekly schedule view showing all planned routes for the coming week
- [x] **DDASH-06**: Availability scheduling — driver can mark available days of the week (recurring)
- [ ] **DDASH-07**: One-off unavailability — driver can block specific dates (vacation, sick)
- [x] **DDASH-08**: History page date-range filtering
- [x] **DDASH-09**: History page pagination for large result sets
- [x] **DDASH-10**: Monthly summary view in history with aggregate stats
- [x] **DDASH-11**: Earnings streak and badges wired to existing unused dashboard props (badges, streakDays)
- [x] **DDASH-12**: Performance milestones computed from existing stats (100 deliveries badge, 5-star streak)

### Driver UI Polish

- [x] **DUI-01**: Driver bottom nav expanded with earnings and schedule tabs
- [x] **DUI-02**: Mobile-first driver layouts with larger touch targets and better scan hierarchy
- [x] **DUI-03**: Visual parity with customer side — animation polish, glassmorphism cards, consistent design tokens
- [x] **DUI-04**: Admin view of driver availability when creating/assigning routes

### Cleanup

- [x] **CLN-01**: Dead code removed — ~10 unused exports (parsePriceToCents, canEditOrder, formatPriceValue, formatDate, reverseGeocode, createItemSignature re-export, getDeliveryFeeMessage, WEB_VITALS_THRESHOLDS, getPerformanceScore) + useABTest.ts file
- [x] **CLN-02**: Dead barrel file removed (OrderDetailExpanded/index.tsx)
- [x] **CLN-03**: Placeholder social links in SiteFooter resolved or removed

## Traceability

| Requirement | Phase    | Status   |
| ----------- | -------- | -------- |
| SEC-01      | Phase 67 | Complete |
| SEC-02      | Phase 75 | Pending  |
| SEC-03      | Phase 68 | Complete |
| SEC-04      | Phase 68 | Complete |
| SEC-05      | Phase 68 | Complete |
| SEC-06      | Phase 69 | Complete |
| SEC-07      | Phase 69 | Complete |
| SEC-08      | Phase 67 | Complete |
| AUTH-01     | Phase 70 | Complete |
| AUTH-02     | Phase 70 | Complete |
| AUTH-03     | Phase 70 | Complete |
| AUTH-04     | Phase 70 | Complete |
| AUTH-05     | Phase 70 | Complete |
| DPROF-01    | Phase 71 | Complete |
| DPROF-02    | Phase 71 | Complete |
| DPROF-03    | Phase 71 | Complete |
| DPROF-04    | Phase 74 | Complete |
| DPROF-05    | Phase 75 | Pending  |
| DDASH-01    | Phase 72 | Complete |
| DDASH-02    | Phase 72 | Complete |
| DDASH-03    | Phase 72 | Complete |
| DDASH-04    | Phase 73 | Complete |
| DDASH-05    | Phase 73 | Complete |
| DDASH-06    | Phase 73 | Complete |
| DDASH-07    | Phase 76 | Pending  |
| DDASH-08    | Phase 73 | Complete |
| DDASH-09    | Phase 73 | Complete |
| DDASH-10    | Phase 73 | Complete |
| DDASH-11    | Phase 72 | Complete |
| DDASH-12    | Phase 72 | Complete |
| DUI-01      | Phase 72 | Complete |
| DUI-02      | Phase 74 | Complete |
| DUI-03      | Phase 74 | Complete |
| DUI-04      | Phase 73 | Complete |
| CLN-01      | Phase 67 | Complete |
| CLN-02      | Phase 67 | Complete |
| CLN-03      | Phase 67 | Complete |

**Coverage:** 34/37 complete (92%)

---

_Requirements defined: 2026-02-16_
_Gap closure started: 2026-02-26_
