# Requirements: Morning Star Delivery App

**Defined:** 2026-04-04
**Core Value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.

## v2.3 Requirements

Requirements for Customer UX Quality milestone. Each maps to roadmap phases.

### Critical Fixes

- [ ] **CFIX-01**: Cart page uses SSR-safe mobile detection instead of useEffect redirect — eliminates white flash
- [ ] **CFIX-02**: Checkout synchronously guards against empty cart before rendering — no spinner-redirect loop
- [ ] **CFIX-03**: Cutoff modal disables checkout submit button while open — prevents order submission after cutoff
- [ ] **CFIX-04**: Stripe session timeout shows error state with retry option — no silent payment failure
- [ ] **CFIX-05**: Cart validation has 30-second timeout with fallback error UI — no infinite spinner
- [ ] **CFIX-06**: React Query provider configures 3 retries with exponential backoff — transient failures recover
- [ ] **CFIX-07**: Checkout form state persists across payment errors — user doesn't re-enter address/time/contact
- [x] **CFIX-08**: Offline cart items actually sync when back online — pendingSync flag honored
- [x] **CFIX-09**: Menu periodically refetches (2-5 min) while cart is non-empty — detects price/availability changes
- [ ] **CFIX-10**: Tracking page audio notifications have mute toggle — no interruption on calls

### Checkout Polish

- [ ] **CHKP-01**: Address and payment forms show inline validation errors as user types — not only on submit
- [x] **CHKP-02**: Price change alerts explain what changed (old price vs new) — not just "Dismiss"
- [ ] **CHKP-03**: Checkout prefetches next step's data while user fills current step — reduces perceived latency
- [ ] **CHKP-04**: Cutoff modal suggests rescheduling to next available delivery date with one-click action

### Order Tracking

- [ ] **TRAK-01**: Tracking page uses full-height map with collapsible info sheet on mobile — not 50/50 split
- [ ] **TRAK-02**: Tracking subscription shows "Reconnecting..." banner when connection drops
- [ ] **TRAK-03**: Tracking polling stops when page is hidden (document.visibilitychange) — resumes on focus
- [ ] **TRAK-04**: Reconnection uses exponential backoff (1s, 2s, 4s, 8s, 30s max) — not linear 5s retry

### Accessibility

- [ ] **A11Y-01**: All interactive elements enforce 44px minimum touch target on mobile — Button/Input sm sized up
- [ ] **A11Y-02**: Text-muted color meets WCAG AA contrast ratio (4.5:1) on all surfaces
- [ ] **A11Y-03**: Focus indicators use consistent ring + offset style across all interactive components
- [ ] **A11Y-04**: Dark mode tokens complete — all surface, text, and border colors have dark mode equivalents

### Loading States

- [x] **LOAD-01**: Orders list page shows content-shaped skeleton while loading — not generic spinner
- [x] **LOAD-02**: Order detail page shows content-shaped skeleton while loading
- [x] **LOAD-03**: Account page shows tab-shaped skeleton while loading
- [x] **LOAD-04**: Menu cached in IndexedDB for offline cold-start — shows cached menu instead of "Coming Soon"
- [x] **LOAD-05**: Loading state hierarchy documented and enforced: skeleton > spinner > timeout fallback

### Data Layer

- [ ] **DATA-01**: Cart add/remove uses optimistic updates with rollback on error — instant UI feedback
- [ ] **DATA-02**: Query key factory centralizes cache keys — consistent invalidation across hooks
- [ ] **DATA-03**: Menu search deduplicates concurrent identical queries — no redundant API calls
- [x] **DATA-04**: Orders list and menu search support pagination — no unbounded fetches

### Micro-Interactions

- [ ] **UXPL-01**: Cart item deletion shows 5-second undo toast — recoverable action
- [ ] **UXPL-02**: Cart clear shows undo toast — recoverable action
- [ ] **UXPL-03**: Swipe-to-delete shows visual preview indicator before drag starts — discoverable gesture
- [ ] **UXPL-04**: Dietary filter chips show scroll indicator when overflowing — discoverable horizontal scroll
- [ ] **UXPL-05**: Order detail has sticky reorder button — visible without scrolling
- [ ] **UXPL-06**: Shared order links include Open Graph meta tags — rich preview when shared

## v2.4+ Requirements

Deferred to future releases.

### Notifications
- **NOTF-01**: Push notifications for order status changes via service worker
- **NOTF-02**: Email/push notifications for route assignments (carried from v1.8)

### Advanced Features
- **ADV-01**: Driver messaging (carried from v1.8)
- **ADV-02**: Route optimization auto-sort by proximity
- **ADV-03**: Fuzzy search via PostgreSQL similarity() function
- **ADV-04**: Favorites cloud sync across devices
- **ADV-05**: Real-time ETA updates as driver moves

### Quality
- **QUAL-01**: Chromatic visual regression baselines (carried from v1.8)
- **QUAL-02**: Lighthouse CI gates at score 70 (carried from v1.8)
- **QUAL-03**: Apple Sign-in (carried from v1.8)
- **QUAL-04**: Animation system guidelines documentation (when FM vs CSS vs GSAP)
- **QUAL-05**: Storybook component health metrics

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full WCAG 2.1 AA audit | Partial coverage (touch targets, contrast, focus) in v2.3; full audit is a separate initiative |
| Internationalization (Myanmar/English) | Separate milestone — requires content translation pipeline |
| Real-time GPS map for customers | Text status + tracking page sufficient at 20-50 orders |
| Customer loyalty/referral system | Get first 50 regulars first |
| Driver gamification/badges | Family drivers don't need this |
| Multi-admin role system | Solo operator for now |
| Modal/Dialog/Drawer API consolidation | Design system refactor — too broad for this milestone |
| Spring physics harmonization across all components | Polish work beyond critical accessibility fixes |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CFIX-01 | Phase 110 | Pending |
| CFIX-02 | Phase 110 | Pending |
| CFIX-03 | Phase 110 | Pending |
| CFIX-04 | Phase 110 | Pending |
| CFIX-05 | Phase 110 | Pending |
| CFIX-06 | Phase 110 | Pending |
| CFIX-07 | Phase 111 | Pending |
| CFIX-08 | Phase 114 | Complete |
| CFIX-09 | Phase 111 | Complete |
| CFIX-10 | Phase 112 | Pending |
| CHKP-01 | Phase 111 | Pending |
| CHKP-02 | Phase 111 | Complete |
| CHKP-03 | Phase 111 | Pending |
| CHKP-04 | Phase 111 | Pending |
| TRAK-01 | Phase 112 | Pending |
| TRAK-02 | Phase 112 | Pending |
| TRAK-03 | Phase 112 | Pending |
| TRAK-04 | Phase 112 | Pending |
| A11Y-01 | Phase 113 | Pending |
| A11Y-02 | Phase 113 | Pending |
| A11Y-03 | Phase 113 | Pending |
| A11Y-04 | Phase 113 | Pending |
| LOAD-01 | Phase 114 | Complete |
| LOAD-02 | Phase 114 | Complete |
| LOAD-03 | Phase 114 | Complete |
| LOAD-04 | Phase 114 | Complete |
| LOAD-05 | Phase 114 | Complete |
| DATA-01 | Phase 115 | Pending |
| DATA-02 | Phase 110 | Pending |
| DATA-03 | Phase 115 | Pending |
| DATA-04 | Phase 115 | Complete |
| UXPL-01 | Phase 116 | Pending |
| UXPL-02 | Phase 116 | Pending |
| UXPL-03 | Phase 116 | Pending |
| UXPL-04 | Phase 116 | Pending |
| UXPL-05 | Phase 116 | Pending |
| UXPL-06 | Phase 116 | Pending |

**Coverage:**
- v2.3 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0

---
*Requirements defined: 2026-04-04*
*Last updated: 2026-04-04 after roadmap creation*
