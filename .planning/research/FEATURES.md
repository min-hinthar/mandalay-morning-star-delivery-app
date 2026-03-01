# Feature Research

**Domain:** Meal delivery ops tooling (small-scale, Saturday-only, solo operator, family drivers)
**Researched:** 2026-03-01
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features the solo operator and customers will assume exist for a functional Saturday operation. Missing any of these means the app cannot go live.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Ops status overview** -- at-a-glance order counts by status (pending/confirmed/preparing/out/delivered) | Operator needs situational awareness in <5 seconds on Saturday morning | LOW | Existing admin orders page has status filter badges with counts; needs elevation to a dedicated ops view scoped to current Saturday |
| **Bulk status transitions** -- select multiple orders, advance status in one click | 40 orders x individual clicks = 10 min wasted; every delivery platform has bulk actions | MEDIUM | No bulk endpoint exists. Need `POST /api/admin/orders/bulk-status` with array of order IDs + target status. Optimistic UI with rollback on partial failure |
| **Order-to-route assignment** -- assign confirmed orders to a driver's route | Core operational workflow; without this, operator must call/text drivers manually | MEDIUM | Route creation API exists (`POST /api/admin/routes` with `orderIds` + `driverId`). UI needs a visual assignment panel. `PATCH /api/admin/orders/[id]/driver` assigns driver to individual order |
| **Unassigned orders indicator** -- badge showing orders not yet on any route | Operator must know at a glance how many orders still need routing | LOW | Query: orders with status `confirmed`/`preparing` with no matching `route_stops` entry. Display as red badge count |
| **Order cutoff enforcement** -- prevent checkout after cutoff time | Customers will attempt to order Saturday morning; must be blocked with clear messaging | LOW | `isPastCutoff()` exists in `delivery-dates.ts` but has bug (BL-01: time-only comparison). Fix + surface cutoff modal at checkout |
| **Email delivery status visibility** -- admin sees whether email reached customer | If customer says "I never got confirmation", operator needs to check | LOW | `notification_logs` table tracks status (sent/failed/delivered/opened/bounced). Need admin UI to surface per-order email status |
| **Failed email retry** -- one-click resend for failed emails | Emails fail; operator needs self-service recovery without developer help | LOW | `POST /api/admin/emails/[id]/resend` already exists. Wire into admin email dashboard and per-order detail view |
| **Configurable delivery fee** -- change delivery fee without code deploy | Business rule that changes seasonally | LOW | `app_settings` table + admin settings UI exist with `baseDeliveryFeeCents`. Wire server-side reads to use DB value instead of hardcoded constant |
| **Configurable cutoff time** -- change order cutoff without code deploy | May shift from Friday 3PM to Friday 5PM based on kitchen capacity | MEDIUM | `CUTOFF_HOUR` and `CUTOFF_DAY` are hardcoded in `types/delivery.ts`. Refactor `getCutoffForSaturday()` and `isPastCutoff()` to read from `app_settings`. Settings schema already has `deliveryCutoffTime` |
| **Driver stop list** -- driver sees ordered list of stops with name, address, phone | Minimum viable driver experience for completing deliveries | LOW | Existing driver route page (`/driver/route`) fetches active route with stops. Already functional |
| **Mark delivered action** -- driver taps to mark individual stop delivered | Core delivery completion workflow | LOW | Existing `PATCH /api/driver/routes/[routeId]/stops/[stopId]`. Already functional |

### Differentiators (Competitive Advantage)

Features that make this app specifically suited for a solo operator running 20-50 Saturday orders with family/friend drivers.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Saturday ops command center** -- single-screen dashboard with countdown timers, status pipeline, driver status, time-slot grouping | Solo operator manages entire Saturday from one screen in <3 minutes; generic admin pages force navigation between orders/routes/drivers | HIGH | New page or redesign of `/admin` for Saturday context. Combines: order status counts with action buttons, cutoff countdown, delivery-start countdown, driver availability widget, time-window groupings (11am: 12, 1pm: 8). Heavy frontend, light backend (reuses existing APIs) |
| **One-click route builder** -- "Unassigned Orders" panel + "Available Drivers" panel, click to create route | Reduces route creation from multi-step form to visual assignment. At 2-4 drivers and 40 orders, highest-leverage UX improvement | HIGH | Backend: existing `POST /api/admin/routes` accepts `orderIds` + `driverId`. Frontend: split-panel layout, order cards grouped by time window or geography, driver cards with capacity indicator, click-to-assign |
| **Driver simple mode** -- toggle that strips driver UI to stop list, customer info, "Mark Delivered" button, one-tap call/text | Family members who deliver occasionally need zero-training UI; existing pages have earnings, badges, availability that confuse non-technical users | MEDIUM | Add `simple_mode` boolean to `drivers` table or `driver_preferences` JSONB. When enabled: hide earnings, badges, availability scheduling. Show only: current route stops, address, phone, "Mark Delivered" with confirmation |
| **Confirmation dialogs on delivery** -- "Mark as delivered at 123 Main St?" before completing | Prevents accidental delivery completion on wrong stop; critical for non-technical family drivers | LOW | Frontend-only: confirmation modal before `PATCH /api/driver/routes/[routeId]/stops/[stopId]`. No backend changes |
| **Pre-checkout Saturday messaging** -- dynamic hero CTA, menu banner, cart countdown, cutoff modal | Customer instantly understands Saturday-only model within 3 seconds; reduces support questions and abandoned carts | MEDIUM | Touches hero section, menu page, cart drawer, checkout page. Uses existing `getDeliveryDate()` and `getTimeUntilCutoff()`. Mostly frontend with existing data |
| **Email reliability dashboard** -- failure rate summary, bounce tracking, webhook event audit trail | Solo operator self-diagnoses email issues without developer; surfaces Resend webhook data already captured | MEDIUM | `notification_logs` captures webhook events via Resend handler. Need: admin page with stats summary, failure list with retry buttons, email event timeline from `metadata.resend_events` |
| **Auto-suggest geographic grouping** -- group unassigned orders by delivery area for route creation | At 40 orders, visual geographic grouping helps operator create efficient routes without a routing algorithm | MEDIUM | Cluster by zip code or postal code from delivery addresses. No Google Maps API needed for clustering |
| **Offline route instructions** -- banner telling driver their route is cached locally | Family driver in cellular dead zone can still see stops; service worker already exists | LOW | Service worker caches pages. Need: explicit prefetch of route data into IndexedDB when route loads, offline-aware banner |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Real-time GPS tracking for customers** | "I want to see my driver like Uber" | Continuous location streaming, battery drain, privacy, WebSocket infrastructure. Overkill at 20-50 orders | Text-based status: "Out for delivery" then "Delivered". Order tracking page exists with polling |
| **Route optimization algorithm** | "Auto-optimize stop order" | Google Directions API cost, TSP solver complexity, poor time-window handling. Manual ordering fine at 5-10 stops per route | Geographic grouping suggestions + manual drag-to-reorder within route |
| **Push notifications** | "Notify customers on status change" | VAPID keys, permission UX, cross-browser testing, background sync. Email + text covers it | Transactional emails (already built) + optional SMS later |
| **Multi-admin role system** | "Different permissions for helper" | Solo operator now. RBAC adds schema complexity, permission checks everywhere, role management UI | Single admin role (already implemented). Revisit when second operator hired |
| **Driver gamification / leaderboard** | "Motivate drivers with badges" | Family drivers are not gig workers. Gamification creates awkward family dynamics. Badges exist from v1.8 | Simple route completion celebration. Hide badges/streaks in simple mode |
| **Auto-assign drivers to routes** | "System should auto-create routes" | At 2-4 drivers, manual takes <2 minutes. Auto-assignment needs availability, capacity balancing, geo optimization. Gets it wrong and operator wastes more time fixing | One-click visual assignment panel. Fast enough at current scale |
| **Customer loyalty / referral** | "Reward repeat customers" | Need 50 regulars first. Points tracking, reward redemption, abuse prevention | Focus on delivery quality. Word of mouth is the referral system |
| **Advanced analytics** | "Heatmaps, cohort analysis" | Current 7-day KPIs sufficient. Analytics require data warehouse, aggregation, complex viz. 20-50 orders/week doesn't need this | Simple KPIs (built): orders, revenue, fulfillment rate. Add email delivery rate |

## Feature Dependencies

```
[Bug Fixes (Phase 0)]
    |
    +--requires--> [Configurable Business Rules]
    |                  |
    |                  +--enables--> [Customer Pre-Checkout Gate]
    |                  |               (reads cutoff from app_settings)
    |                  |
    |                  +--enables--> [Saturday Ops Dashboard]
    |                                  (reads cutoff for countdown timers)
    |
    +--requires--> [Saturday Ops Dashboard]
    |                  |
    |                  +--enables--> [Route & Driver Assignment]
    |                                  (unassigned orders panel feeds from ops view)
    |
    +--independent--> [Email Reliability]
    |                    (existing APIs + webhook handler + notification_logs)
    |
    +--independent--> [Driver Simplification]
    |                    (existing driver pages + mode toggle)
    |
    +--independent--> [Production Hardening]
                        (N+1 fixes, indexes, rate limits)
```

### Dependency Notes

- **Bug Fixes must precede everything:** TOCTOU cleanup bug, cutoff logic, and cart race condition are production blockers. No feature work until these are resolved.
- **Configurable Business Rules enables Pre-Checkout Gate:** Checkout gate needs cutoff time from `app_settings` instead of hardcoded `CUTOFF_HOUR=15`. Building gate with hardcoded values creates immediate tech debt.
- **Configurable Business Rules enables Ops Dashboard:** Countdown timers need cutoff time and delivery hours from `app_settings`.
- **Ops Dashboard enables Route Assignment:** Route assignment UI lives within or adjacent to ops dashboard. Unassigned orders count flows from the same data. Building assignment without ops context means rework.
- **Email Reliability is independent:** The pipeline (`sendEmail` -> `notification_logs` -> Resend webhook -> status update) already works. This is purely admin UI + webhook audit enhancement.
- **Driver Simplification is independent:** Adding `simple_mode` toggle and conditional rendering has no feature dependencies. Build in parallel.
- **Production Hardening is independent:** N+1 fixes, indexes, rate limit tuning are infrastructure with no feature dependencies.

## MVP Definition

### Launch With (v1.9)

Essential for the first real Saturday operation:

- [x] Bug fixes (TOCTOU, cutoff, cart race) -- production blockers
- [ ] Saturday Ops Dashboard with bulk status transitions -- operator manages 40 orders from one screen
- [ ] Route & Driver Assignment panel -- operator creates routes and assigns drivers visually
- [ ] Customer Pre-Checkout Gate -- Saturday-only messaging, cutoff enforcement modal
- [ ] Configurable cutoff time + delivery fee -- operator adjusts without deploy
- [ ] Email status visibility per order -- operator answers "did customer get the email?"
- [ ] Failed email retry -- self-service recovery for email failures
- [ ] Driver simple mode toggle -- family member completes route without training
- [ ] Confirmation dialogs on driver delivery actions -- prevents mis-delivery

### Add After Validation (v1.9.x)

Add once first 2-3 Saturdays run successfully:

- [ ] Geographic grouping suggestions for route creation -- after seeing real address distribution
- [ ] Email reliability dashboard with failure rate charts -- after accumulating enough email volume
- [ ] Webhook audit trail with body hash + svix signature verification -- security hardening
- [ ] Offline route instructions with explicit prefetch -- after testing in low-signal areas
- [ ] Order tracking polling indicator with "last updated" timestamp -- customer UX polish

### Future Consideration (v2+)

Defer until consistent 100+ orders/week:

- [ ] Route optimization algorithm -- manual scales to ~100 orders
- [ ] Real-time GPS tracking -- text status sufficient
- [ ] Push notifications -- email + text covers communication
- [ ] Multi-admin roles -- solo operator for now
- [ ] Advanced analytics -- simple KPIs sufficient
- [ ] Customer loyalty/referral -- get 50 regulars first

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Depends On |
|---------|------------|---------------------|----------|------------|
| Bug fixes (TOCTOU, cutoff, cart race) | CRITICAL | LOW | P0 | Nothing |
| Bulk status transitions | HIGH | MEDIUM | P1 | Bug fixes |
| Ops status overview with counts | HIGH | LOW | P1 | Bug fixes |
| Countdown timers (cutoff + delivery start) | HIGH | LOW | P1 | Configurable rules |
| Unassigned orders badge | HIGH | LOW | P1 | Bug fixes |
| Configurable cutoff time + cutoff day | HIGH | MEDIUM | P1 | Bug fixes |
| Configurable delivery fee + free threshold | MEDIUM | LOW | P1 | Bug fixes |
| One-click route builder | HIGH | HIGH | P1 | Ops dashboard |
| Unassigned orders panel | HIGH | MEDIUM | P1 | Ops dashboard |
| Available drivers panel | MEDIUM | LOW | P1 | Ops dashboard |
| Customer pre-checkout gate (cutoff modal) | HIGH | MEDIUM | P1 | Configurable rules |
| Saturday messaging (hero, menu, cart) | MEDIUM | MEDIUM | P1 | Configurable rules |
| Email status on order detail | MEDIUM | LOW | P2 | Nothing |
| Failed email retry UI | MEDIUM | LOW | P2 | Nothing |
| Driver simple mode toggle | MEDIUM | MEDIUM | P2 | Nothing |
| Confirmation dialogs on delivery | MEDIUM | LOW | P2 | Nothing |
| One-tap customer contact (call/text) | MEDIUM | LOW | P2 | Nothing |
| Geographic grouping suggestions | LOW | MEDIUM | P3 | Route builder |
| Email reliability dashboard | LOW | MEDIUM | P3 | Email visibility |
| Webhook audit logging (body hash) | LOW | LOW | P3 | Nothing |
| N+1 query fixes | MEDIUM | LOW | P2 | Nothing |
| DB index audit | MEDIUM | LOW | P2 | Nothing |
| Rate limit tuning | LOW | LOW | P3 | Nothing |
| Driver ownership check (SC-03) | MEDIUM | LOW | P2 | Nothing |

**Priority key:**
- P0: Blocks everything. Fix before any feature work
- P1: Must have for first Saturday. Core operational capability
- P2: Should have. Important for quality and reliability
- P3: Nice to have. Defer if timeline is tight

## Existing Infrastructure Leverage

This milestone builds heavily on existing code. Understanding what exists avoids rebuilding.

| Feature Need | What Already Exists | Gap to Close |
|---|---|---|
| Order status management | `PATCH /api/admin/orders/[id]/status` with valid transitions map, audit logging via `order_audit_log`, email notification on status change | Need bulk endpoint for multiple orders simultaneously |
| Route creation | `POST /api/admin/routes` accepts `orderIds` + `driverId`, validates order status (confirmed/preparing), checks for duplicate route assignments, creates `route_stops` | Need visual UI; currently API-only |
| Driver assignment | `PATCH /api/admin/orders/[id]/driver` with driver validation, audit logging, previous driver tracking | Need batch assignment via route creation UI |
| Settings storage | `app_settings` table with `GET/PATCH /api/admin/settings`, Zod validation schemas (delivery/operations/notifications), admin settings UI with 3 tab forms, `FloatingUnsavedBar`, `RestoreDefaultsDialog` | Wire server logic to read cutoff/fees from DB instead of hardcoded constants in `types/delivery.ts` |
| Email sending | `sendEmail()` with admin kill switch (`email_sending_enabled`), user preference check (`customer_settings.notification_prefs`), retry with exponential backoff (3 attempts, 10s base), notification_logs insert on success/failure | Surface logs in admin UI per order |
| Email retry | `POST /api/admin/emails/[id]/resend` reconstructs email from order data, re-sends via full pipeline | Wire retry button into admin email UI |
| Resend webhooks | `POST /api/webhooks/resend` maps events (delivered/opened/clicked/bounced/complained), updates `notification_logs` status, appends to `metadata.resend_events` array | Surface webhook data in admin; add svix signature verification |
| Email log listing | `GET /api/admin/emails` with pagination, filtering by order/type/status/date, sorting by 5 columns | Need admin dashboard page to render this data |
| Cutoff logic | `isPastCutoff()`, `getCutoffForSaturday()`, `getTimeUntilCutoff()`, `getDeliveryDate()` in `delivery-dates.ts` with timezone-aware calculations | Bug fix (BL-01) + refactor to read cutoff_hour/cutoff_day from `app_settings` |
| Delivery constants | `CUTOFF_DAY=5` (Friday), `CUTOFF_HOUR=15` (3PM), `TIMEZONE="America/Los_Angeles"`, 8 time windows (11am-7pm hourly) in `types/delivery.ts` | Move to `app_settings`; keep constants as fallback defaults |
| Driver dashboard | Full page with route status, stops, earnings, badges, availability, streak days, next route date | Add simple mode conditional rendering to hide complex sections |
| Driver route view | `/driver/route` with active route, stop list, stop status, delivery actions, map polyline | Add confirmation dialog before status change, one-tap contact buttons |
| Admin settings UI | `SettingsClient` with `DeliverySettingsForm`, `OperationsSettingsForm`, `NotificationSettingsForm`, restore defaults, `FloatingUnsavedBar` for unsaved changes | Add cutoff_day, cutoff_hour, delivery_start/end hours to delivery settings form |
| Admin orders page | Status filter badges with counts, `OrdersTable`, individual status change via dropdown, refresh button | Elevate to ops dashboard with bulk actions and action buttons per status group |
| Admin routes page | Route listing with date filter, driver info, stop counts, completion rate | Enhance with visual assignment panel for unassigned orders |

## Competitor Feature Analysis

| Feature | DoorDash Merchant | Square for Restaurants | Toast | Our Approach |
|---------|-------------------|------------------------|-------|--------------|
| Ops dashboard | Real-time order board with auto-accept, kitchen display | POS-integrated order flow with ticket management | Kitchen display system with prep timing | Saturday-focused command center with batch operations, countdown timers |
| Route assignment | Automated gig worker dispatch, algorithm-driven | Not applicable (customer pickup model) | Not applicable (dine-in/pickup focus) | Visual split-panel, manual one-click assignment (family drivers, 2-4 max) |
| Cutoff / scheduling | Rolling availability with per-item prep time estimates | Business hours + online ordering windows | Daypart scheduling with auto-disable | Saturday-only with configurable cutoff, clear customer messaging, countdown |
| Email reliability | Automated transactional, no admin visibility into delivery | Basic receipt emails, no failure tracking | Automated via integration, minimal admin tools | Admin dashboard with per-email status, one-click retry, webhook audit trail |
| Driver simplification | Dasher app redesigned May 2025 with simplified layout, "Earn by Time" mode | Not applicable | Not applicable | Simple mode toggle for family/friend drivers, confirmation dialogs, one-tap contact |
| Business rules config | Merchant portal with extensive settings | Dashboard settings with pos integration | Web admin with restaurant-specific config | `app_settings` DB table with admin form, takes effect immediately, no deploy |

## Sources

- Codebase analysis: `src/app/api/admin/orders/`, `src/app/api/admin/routes/`, `src/app/api/admin/settings/`, `src/app/api/admin/emails/`, `src/app/api/webhooks/resend/`, `src/lib/email/`, `src/lib/utils/delivery-dates.ts`, `src/types/delivery.ts`, `src/lib/validations/settings.ts`, `src/components/ui/admin/settings/`
- [Resend Webhook Documentation](https://resend.com/docs/webhooks/introduction) -- webhook events, retry policy (5s/5m/30m/2h/5h/10h), svix-id deduplication, at-least-once delivery guarantee
- [Webhook reliability checklist](https://appmaster.io/blog/webhook-reliability-checklist) -- idempotency patterns, dead-letter queues, signature verification
- [Food Delivery App Architecture (Enatega)](https://enatega.com/food-delivery-app-architecture/) -- dispatch service patterns, courier app features
- [Redesigning A Delivery Driver App](https://amillionadventures.medium.com/redesigning-a-delivery-driver-app-part-3-ui-design-1b54d68eb6a7) -- driver UX simplification: friendlier tone, information hierarchy, obvious actions
- [Food Delivery App Design (Agente)](https://agentestudio.com/blog/food-delivery-app-design) -- admin dashboard capabilities, order management patterns
- [DispatchTrack Mobile App UX Refresh](https://www.dispatchtrack.com/company/news/mobile-app-ui-ux) -- driver app simplification: improved readability, modernized design, intuitive workflows
- [Resend email best practices (GitHub)](https://github.com/resend/email-best-practices) -- email sending patterns, error handling
- V4_MILESTONE_MVP.md -- existing milestone plan with 8-phase structure and acceptance criteria

---
*Feature research for: Meal delivery ops tooling (v1.9 Launch-Ready MVP)*
*Researched: 2026-03-01*
