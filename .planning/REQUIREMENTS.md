# Requirements: Morning Star Delivery App

**Defined:** 2026-02-16
**Core Value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.

## v1.8 Requirements

Requirements for post-launch hardening, driver experience overhaul, and role-based auth routing.

### Security

- [ ] **SEC-01**: CSP headers configured in report-only mode with all external domains whitelisted (Stripe, Google Maps, Supabase, Sentry, Google Fonts, Vercel Analytics)
- [ ] **SEC-02**: CSP enforced after report-only validation (upgrade Content-Security-Policy-Report-Only to Content-Security-Policy)
- [ ] **SEC-03**: All Supabase tables audited for RLS policies (featured_sections, customer_settings, driver_invites, webhook_events, order_audit_log, app_settings, email_logs)
- [ ] **SEC-04**: Missing RLS policies added with proper role-based access (driver own-read, admin bypass, service-role for system tables)
- [ ] **SEC-05**: RLS policy indexes added on user_id, driver_id, route_id columns for performance
- [ ] **SEC-06**: Rate limiting upgraded from in-memory Map to Upstash Redis (@upstash/redis + @upstash/ratelimit)
- [ ] **SEC-07**: Rate limiting applied to auth endpoints (5/min signIn, 3/hr signUp) and high-traffic API routes (location updates, order creation)
- [ ] **SEC-08**: cssText usages refactored to individual DOM property assignments for CSP compatibility (FlyToCart.tsx, CustomMarkers.tsx)

### Auth Routing

- [ ] **AUTH-01**: Admin users redirect to /admin dashboard after login
- [ ] **AUTH-02**: Driver users redirect to /driver dashboard after login
- [ ] **AUTH-03**: Customer users redirect to /menu after login
- [ ] **AUTH-04**: Driver onboarding lifecycle handled — new drivers (no active driver record) redirect to /driver/onboard instead of /driver
- [ ] **AUTH-05**: Admin and driver routes protected at proxy/middleware level before page render (block unauthorized access without full page load)

### Driver Profile & Onboarding

- [ ] **DPROF-01**: Driver can edit name, phone, vehicle type, and license plate from profile page
- [ ] **DPROF-02**: Driver can upload profile photo via Supabase Storage (driver-photos bucket)
- [ ] **DPROF-03**: Profile completeness indicator on dashboard showing missing fields
- [ ] **DPROF-04**: Onboarding checklist on dashboard for new drivers (profile complete, first route viewed, first delivery done)
- [ ] **DPROF-05**: Test delivery page (/driver/test-delivery) with mock route data for practicing delivery flow

### Driver Dashboard

- [x] **DDASH-01**: Weekly earnings summary card showing computed earnings (per-delivery rate x completed deliveries)
- [x] **DDASH-02**: Per-route earnings breakdown showing earnings for each completed route
- [x] **DDASH-03**: Earnings history chart using Recharts (bar/line) showing weekly/monthly trends
- [ ] **DDASH-04**: Upcoming assigned routes visible on driver home (not just today's route)
- [ ] **DDASH-05**: Weekly schedule view showing all planned routes for the coming week
- [ ] **DDASH-06**: Availability scheduling — driver can mark available days of the week (recurring)
- [ ] **DDASH-07**: One-off unavailability — driver can block specific dates (vacation, sick)
- [ ] **DDASH-08**: History page date-range filtering
- [ ] **DDASH-09**: History page pagination for large result sets
- [ ] **DDASH-10**: Monthly summary view in history with aggregate stats
- [x] **DDASH-11**: Earnings streak and badges wired to existing unused dashboard props (badges, streakDays)
- [x] **DDASH-12**: Performance milestones computed from existing stats (100 deliveries badge, 5-star streak)

### Driver UI Polish

- [x] **DUI-01**: Driver bottom nav expanded with earnings and schedule tabs
- [ ] **DUI-02**: Mobile-first driver layouts with larger touch targets and better scan hierarchy
- [ ] **DUI-03**: Visual parity with customer side — animation polish, glassmorphism cards, consistent design tokens
- [ ] **DUI-04**: Admin view of driver availability when creating/assigning routes

### Cleanup

- [ ] **CLN-01**: Dead code removed — ~10 unused exports (parsePriceToCents, canEditOrder, formatPriceValue, formatDate, reverseGeocode, createItemSignature re-export, getDeliveryFeeMessage, WEB_VITALS_THRESHOLDS, getPerformanceScore) + useABTest.ts file
- [ ] **CLN-02**: Dead barrel file removed (OrderDetailExpanded/index.tsx)
- [ ] **CLN-03**: Placeholder social links in SiteFooter resolved or removed

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Notifications

- **NOTF-01**: Push notifications for new route assignments
- **NOTF-02**: Email notifications when routes are assigned (via existing Resend)

### Advanced Driver Features

- **ADV-01**: Driver-to-admin messaging system
- **ADV-02**: Weather-aware route alerts
- **ADV-03**: Automated route assignment based on availability
- **ADV-04**: Tip tracking from customer orders

### Quality

- **QUAL-01**: Chromatic visual regression baselines
- **QUAL-02**: Lighthouse CI gates at score 70 (currently 60)
- **QUAL-03**: Apple Sign-in integration (requires Apple Developer account)

## Out of Scope

| Feature                                           | Reason                                                                             |
| ------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Real-time earnings tracking                       | Weekly Saturday delivery, not gig economy; real-time adds complexity with no value |
| Driver-side route optimization                    | Admin assigns optimized routes; driver reordering undermines admin control         |
| In-app turn-by-turn navigation                    | Google Maps/Waze deep links already provide this                                   |
| Driver chat/messaging                             | Phone call to admin sufficient for 2-3 driver team                                 |
| Multi-language UI (Burmese)                       | Internationalization is cross-cutting; English is working                          |
| Driver payments/payroll integration               | Regulated domain; Morning Star pays drivers outside the app                        |
| Backend schema changes beyond driver_availability | Supabase contracts stay stable                                                     |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase    | Status  |
| ----------- | -------- | ------- |
| SEC-01      | Phase 67 | Pending |
| SEC-02      | Phase 67 | Pending |
| SEC-03      | Phase 68 | Pending |
| SEC-04      | Phase 68 | Pending |
| SEC-05      | Phase 68 | Pending |
| SEC-06      | Phase 69 | Pending |
| SEC-07      | Phase 69 | Pending |
| SEC-08      | Phase 67 | Pending |
| AUTH-01     | Phase 70 | Pending |
| AUTH-02     | Phase 70 | Pending |
| AUTH-03     | Phase 70 | Pending |
| AUTH-04     | Phase 70 | Pending |
| AUTH-05     | Phase 70 | Pending |
| DPROF-01    | Phase 71 | Pending |
| DPROF-02    | Phase 71 | Pending |
| DPROF-03    | Phase 71 | Pending |
| DPROF-04    | Phase 74 | Pending |
| DPROF-05    | Phase 74 | Pending |
| DDASH-01    | Phase 72 | Complete |
| DDASH-02    | Phase 72 | Complete |
| DDASH-03    | Phase 72 | Complete |
| DDASH-04    | Phase 73 | Pending |
| DDASH-05    | Phase 73 | Pending |
| DDASH-06    | Phase 73 | Pending |
| DDASH-07    | Phase 73 | Pending |
| DDASH-08    | Phase 73 | Pending |
| DDASH-09    | Phase 73 | Pending |
| DDASH-10    | Phase 73 | Pending |
| DDASH-11    | Phase 72 | Complete |
| DDASH-12    | Phase 72 | Complete |
| DUI-01      | Phase 72 | Complete |
| DUI-02      | Phase 74 | Pending |
| DUI-03      | Phase 74 | Pending |
| DUI-04      | Phase 73 | Pending |
| CLN-01      | Phase 67 | Pending |
| CLN-02      | Phase 67 | Pending |
| CLN-03      | Phase 67 | Pending |

**Coverage:**

- v1.8 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0

---

_Requirements defined: 2026-02-16_
_Last updated: 2026-02-16 after roadmap creation_
