# Requirements: v1.6 Production Polish

**Defined:** 2026-02-07
**Core Value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.

## v1.6 Requirements

### Auth Experience

- [ ] **AUTH-01**: Login/signup pages display brand logo and mascot with branded layout
- [ ] **AUTH-02**: User can sign in with Google via Supabase OAuth
- [ ] **AUTH-03**: User can sign in with Apple via Supabase OAuth
- [ ] **AUTH-04**: Auth forms use animated transitions (field focus, step changes, submit states)
- [ ] **AUTH-05**: Magic link "check your email" screen shows animated envelope confirmation
- [ ] **AUTH-06**: Forgot password page matches premium auth styling
- [ ] **AUTH-07**: Reset password page matches premium auth styling
- [ ] **AUTH-08**: Auth pages have animated background with floating food illustrations
- [ ] **AUTH-09**: Successful login triggers logo morph animation transitioning to app
- [ ] **AUTH-10**: Signup page shows social proof counter ("Join X+ families")

### Email Notifications

- [ ] **MAIL-01**: Order confirmation email sent via Resend with branded React Email template (items, totals, delivery window, address, order number)
- [ ] **MAIL-02**: Cancellation confirmation email sent when order is cancelled
- [ ] **MAIL-03**: Refund processed email sent when refund is issued
- [ ] **MAIL-04**: Delivery reminder email sent day before scheduled delivery
- [ ] **MAIL-05**: Stripe webhook uses idempotency table to prevent duplicate emails

### Cart Validation

- [ ] **CART-01**: Cart validates items against current menu on mount (hydration-aware, no race condition)
- [ ] **CART-02**: Sold-out items show visual indicator (badge, gray-out) in cart drawer
- [ ] **CART-03**: Unavailable items show inline error with remove/replace action
- [ ] **CART-04**: Price changes since item was added show stale price warning with updated price
- [ ] **CART-05**: Cart page fully implemented (not a stub) with full cart UI

### Customer Settings

- [ ] **SETT-01**: Customer settings page accessible from account with dedicated tab/route
- [ ] **SETT-02**: User can set dietary restrictions/allergies (e.g., vegetarian, gluten-free, nut allergy)
- [ ] **SETT-03**: User can set default delivery instructions ("Leave at door", custom text)
- [ ] **SETT-04**: User can set language preference (English/Burmese) affecting menu display
- [ ] **SETT-05**: User can toggle email notification preferences per type (order updates, promotions, reminders)
- [ ] **SETT-06**: User's theme preference persists across sessions
- [ ] **SETT-07**: All settings sync to database on save

### Admin Settings

- [ ] **ADMN-01**: Admin settings (delivery, operations, notifications) fully managed in app UI
- [ ] **ADMN-02**: Admin settings sync to Supabase database on save
- [ ] **ADMN-03**: Admin settings load from database on page open (not hardcoded defaults)
- [ ] **ADMN-04**: Admin settings show save confirmation with success animation

### 404 & Error Pages

- [ ] **ERRP-01**: 404 page shows brand mascot with contextual expression
- [ ] **ERRP-02**: 404 page provides navigation links (home, menu, orders) and search suggestion
- [ ] **ERRP-03**: 404 page has animated background matching brand style
- [ ] **ERRP-04**: Error pages show contextual messaging (food-themed copy: "We dropped the plate")
- [ ] **ERRP-05**: Error pages have mascot with sad/confused expression
- [x] **ERRP-06**: Error boundaries use CSS-only animations (no Framer Motion -- prevents crash loop)

### Search Enhancement

- [ ] **SRCH-01**: Search uses fuzzy matching with typo tolerance (e.g., "mohiga" finds "Mohinga")
- [ ] **SRCH-02**: Search results grouped by category (Soups, Rice, Snacks, etc.)
- [ ] **SRCH-03**: Search results show food image thumbnails

### Admin/Driver Polish

- [ ] **POLH-01**: Admin loading states use skeleton shimmer (replace animate-pulse everywhere)
- [ ] **POLH-02**: Admin table rows have hover micro-interactions (subtle lift/glow)
- [ ] **POLH-03**: Status badges animate on state change (scale + color morph)
- [ ] **POLH-04**: Empty states show branded illustrations with helpful messaging
- [ ] **POLH-05**: Driver history page shows real on-time percentage (not hardcoded 98%)
- [ ] **POLH-06**: Driver stop detail page has premium animations matching dashboard quality
- [ ] **POLH-07**: Admin driver list table has premium styling (cards, avatars, status indicators, animations)
- [ ] **POLH-08**: Admin driver detail page polished (stat cards, route history, profile editing feel premium)
- [ ] **POLH-09**: Admin route list page has premium styling (route cards, progress indicators, date navigation animations)
- [ ] **POLH-10**: Admin route detail page polished (map, stops list, driver assignment, optimization modal feel premium)
- [ ] **POLH-11**: Driver assignment flow has smooth animations and clear visual feedback
- [ ] **POLH-12**: Admin orders table has premium styling matching driver/route tables

### Infrastructure

- [x] **INFR-01**: Error boundaries (error.tsx) on all 6 missing routes (admin/menu, admin/drivers, admin/routes, driver/route, account, checkout)
- [x] **INFR-02**: Loading states (loading.tsx) on all admin pages lacking them
- [ ] **INFR-03**: Driver offline sync retries pending actions on reconnect with exponential backoff
- [ ] **INFR-04**: Offline sync queue consolidated (resolve dual Zustand + IndexedDB architecture)

## Future Requirements

### Performance (v1.7)
- **PERF-01**: LCP <4s on customer routes
- **PERF-02**: Lighthouse performance score 90+
- **PERF-03**: Lighthouse CI blocking PRs on regression

### Real-time Features (v2.0)
- **REAL-01**: Real-time order status updates via Supabase Realtime
- **REAL-02**: Push notifications for order updates
- **REAL-03**: Admin real-time order alerts

## Out of Scope

| Feature | Reason |
|---------|--------|
| Password-based auth | Magic link + social login is more secure; passwordless is the modern trend |
| Facebook/Twitter OAuth | Declining usage, complex setup; Google + Apple covers 90%+ |
| Real-time cart price sync (WebSocket) | Massive complexity for weekly menu; validate at checkout is sufficient |
| Full i18n framework | Menu already bilingual; UI chrome in English fine for LA market |
| Chat support widget | 200KB+ JS impact on LCP; support email link sufficient |
| Animated onboarding carousel | Scope creep; branded auth pages + clear value prop is sufficient |
| Payment methods management | Stripe Checkout handles this; link to Stripe Customer Portal |
| LCP optimization | Deferred to v1.7 -- v1.6 focuses on polish and features |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 53 | Pending |
| AUTH-02 | Phase 53 | Pending |
| AUTH-03 | Phase 53 | Pending |
| AUTH-04 | Phase 53 | Pending |
| AUTH-05 | Phase 53 | Pending |
| AUTH-06 | Phase 53 | Pending |
| AUTH-07 | Phase 53 | Pending |
| AUTH-08 | Phase 53 | Pending |
| AUTH-09 | Phase 53 | Pending |
| AUTH-10 | Phase 53 | Pending |
| MAIL-01 | Phase 54 | Pending |
| MAIL-02 | Phase 54 | Pending |
| MAIL-03 | Phase 54 | Pending |
| MAIL-04 | Phase 54 | Pending |
| MAIL-05 | Phase 54 | Pending |
| CART-01 | Phase 52 | Pending |
| CART-02 | Phase 52 | Pending |
| CART-03 | Phase 52 | Pending |
| CART-04 | Phase 52 | Pending |
| CART-05 | Phase 52 | Pending |
| SETT-01 | Phase 51 | Pending |
| SETT-02 | Phase 51 | Pending |
| SETT-03 | Phase 51 | Pending |
| SETT-04 | Phase 51 | Pending |
| SETT-05 | Phase 51 | Pending |
| SETT-06 | Phase 51 | Pending |
| SETT-07 | Phase 50 | Pending |
| ADMN-01 | Phase 50 | Pending |
| ADMN-02 | Phase 50 | Pending |
| ADMN-03 | Phase 50 | Pending |
| ADMN-04 | Phase 50 | Pending |
| ERRP-01 | Phase 49 | Pending |
| ERRP-02 | Phase 49 | Pending |
| ERRP-03 | Phase 49 | Pending |
| ERRP-04 | Phase 49 | Pending |
| ERRP-05 | Phase 49 | Pending |
| ERRP-06 | Phase 48 | Complete |
| SRCH-01 | Phase 55 | Pending |
| SRCH-02 | Phase 55 | Pending |
| SRCH-03 | Phase 55 | Pending |
| POLH-01 | Phase 57 | Pending |
| POLH-02 | Phase 57 | Pending |
| POLH-03 | Phase 57 | Pending |
| POLH-04 | Phase 57 | Pending |
| POLH-05 | Phase 57 | Pending |
| POLH-06 | Phase 57 | Pending |
| POLH-07 | Phase 57 | Pending |
| POLH-08 | Phase 57 | Pending |
| POLH-09 | Phase 57 | Pending |
| POLH-10 | Phase 57 | Pending |
| POLH-11 | Phase 57 | Pending |
| POLH-12 | Phase 57 | Pending |
| INFR-01 | Phase 48 | Complete |
| INFR-02 | Phase 48 | Complete |
| INFR-03 | Phase 56 | Pending |
| INFR-04 | Phase 56 | Pending |

**Coverage:**
- v1.6 requirements: 56 total
- Mapped to phases: 56
- Unmapped: 0

## Implementation Constraints

- **UI work must use `/frontend-design` skill** for all component creation and visual polish
- Error boundaries must be CSS-only (no Framer Motion imports -- prevents crash loops)
- Cart validation must be Zustand hydration-aware (gate behind `onRehydrateStorage`)
- Email templates use React Email components (no raw HTML tables)
- Admin settings must persist to Supabase (not just localStorage)

---
*Requirements defined: 2026-02-07*
*Last updated: 2026-02-07 after roadmap creation (56 requirements mapped to 10 phases)*
