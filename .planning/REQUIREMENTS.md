# Requirements: Morning Star Delivery App

**Defined:** 2026-03-14
**Core Value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.

## v2.1 Requirements

Requirements for Route Operations & Admin Mobile milestone. Each maps to roadmap phases.

### Auth & Foundation

- [x] **FOUND-01**: Admin and driver land on correct dashboard after login/OAuth (audit runtime behavior, fix redirect bug)
- [x] **FOUND-02**: Order detail shows full item list with modifiers and special instructions
- [x] **FOUND-03**: Order detail shows tip amount in totals breakdown
- [x] **FOUND-04**: Order detail shows delivery notes, payment status, customer contact on one screen
- [ ] **FOUND-05**: Driver can add delivery notes per stop (text input, column already exists)
- [ ] **FOUND-06**: Admin route detail shows arrived_at/delivered_at timestamps per stop

### Admin Route Editing

- [ ] **ROUTE-01**: Admin can drag-reorder stops on desktop (DnD via @dnd-kit)
- [ ] **ROUTE-02**: Admin can reorder stops on mobile via move-up/move-down buttons
- [ ] **ROUTE-03**: Admin can split an overloaded route into two routes (select stops → new route)
- [ ] **ROUTE-04**: Admin can merge two light routes into one
- [ ] **ROUTE-05**: Admin can reassign driver on an in-progress route

### Driver Experience

- [ ] **DRV-01**: Driver can accept/decline an assigned route before starting
- [ ] **DRV-02**: Driver page audit — all pages load real data, no empty/stub content
- [ ] **DRV-03**: Driver can reorder remaining pending stops in advanced mode

### Admin Mobile

- [ ] **MOBL-01**: Admin sidebar converts to drawer/bottom nav on mobile
- [ ] **MOBL-02**: Admin tables convert to card layouts on mobile
- [ ] **MOBL-03**: All admin touch targets meet 44px minimum
- [ ] **MOBL-04**: Route progress widget on ops dashboard (driver + progress bar + delivered/total)

## Future Requirements

### Notifications

- **NOTF-01**: Push/email notifications for route assignments
- **NOTF-02**: Customer delivery status email updates with photo proof

### Advanced Driver

- **ADV-01**: Driver messaging with admin
- **ADV-02**: Weather alerts for delivery days
- **ADV-03**: Auto-assignment based on driver zones
- **ADV-04**: Tip tracking and payout reports

### Quality

- **QUAL-01**: Chromatic visual regression baselines
- **QUAL-02**: Lighthouse CI score 70+
- **QUAL-03**: Apple Sign-in integration

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time GPS tracking map | Manual status updates sufficient at 20-50 orders; battery drain, WebSocket complexity |
| Auto-dispatch / auto-assignment | Solo operator with 2-4 family drivers; manual control preferred |
| Cross-route drag-and-drop | High misfire rate; existing Reassign dropdown handles single-stop moves |
| Complex TSP solver | Over-engineered for 5-15 stops; Google Directions waypoint optimization sufficient |
| Live ETA updates to customers | Would require WebSocket + continuous polling; text status updates via email suffice |
| Driver chat / messaging | Family drivers; phone/SMS handles communication |
| Offline map tiles | Urban SoCal; cellular coverage reliable; Google Maps deep-link handles offline |
| Batch photo upload | One photo per stop sufficient for proof of delivery |
| Route scheduling (future dates) | Saturday-only model; routes created same-day or day-before |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 99 | Complete |
| FOUND-02 | Phase 99 | Complete |
| FOUND-03 | Phase 99 | Complete |
| FOUND-04 | Phase 99 | Complete |
| FOUND-05 | Phase 99 | Pending |
| FOUND-06 | Phase 99 | Pending |
| ROUTE-01 | Phase 100 | Pending |
| ROUTE-02 | Phase 100 | Pending |
| ROUTE-03 | Phase 100 | Pending |
| ROUTE-04 | Phase 100 | Pending |
| ROUTE-05 | Phase 100 | Pending |
| DRV-01 | Phase 101 | Pending |
| DRV-02 | Phase 101 | Pending |
| DRV-03 | Phase 101 | Pending |
| MOBL-01 | Phase 102 | Pending |
| MOBL-02 | Phase 102 | Pending |
| MOBL-03 | Phase 102 | Pending |
| MOBL-04 | Phase 102 | Pending |

**Coverage:**
- v2.1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-03-14*
*Last updated: 2026-03-14 after roadmap creation*
