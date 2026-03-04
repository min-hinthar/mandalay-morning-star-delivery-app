# Requirements: Morning Star Delivery App

**Defined:** 2026-03-03
**Core Value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.

## v2.0 Requirements

Requirements for production-grade launch MVP. Each maps to roadmap phases.

### Bug Fixes

- [ ] **BUG-01**: Fix payment retry idempotency key — remove Date.now(), use `retry_${order.id}`
- [ ] **BUG-02**: Validate modifier group min_select/max_select constraints at checkout
- [ ] **BUG-03**: Add checkout cleanup rollback with try/catch on each delete
- [ ] **BUG-04**: Fix type assertion null crash on RPC checkout result
- [ ] **BUG-05**: Add refund amount ceiling validation (cannot exceed total_cents)
- [ ] **BUG-06**: Fix cart store debounce race condition — move tracking inside Zustand `set()` or use useDebounce on form submission (`cart-store.ts:51-73`)
- [ ] **BUG-07**: Add cutoff time 10-second safety buffer — `isPastCutoff()` uses bare `getTime()` comparison with no margin for DB insert latency

### Menu & Photos

- [ ] **MENU-01**: Admin can upload photos for menu items via Supabase Storage
- [ ] **MENU-02**: Admin can bulk-upload photos via drag-drop grid matched by item slug
- [ ] **MENU-03**: Photos auto-processed to WebP/AVIF, min 800x600, max 2MB, 4:3 crop
- [ ] **MENU-04**: Menu items track photo freshness via image_updated_at column
- [ ] **MENU-05**: Allergens come from single source (deduplicate tags/allergens overlap)
- [ ] **MENU-06**: Admin can mark items inactive (for owner-verified app-only items)
- [ ] **MENU-07**: Seed fallback photos from `data/menu-photos/` into Supabase Storage for items without admin-uploaded photos

### Checkout & Payment

- [x] **CHKT-01**: Client checkout sends only item IDs + modifier selections (no prices)
- [ ] **CHKT-02**: Cart auto-refreshes prices on 409 PRICE_CHANGED instead of error (audit: server never emits 409 — dead code; downscoped to Phase 96 cleanup)
- [x] **CHKT-03**: Server validates modifier item_index bounds before checkout RPC
- [x] **CHKT-04**: Delivery time windows include configurable prep time buffer
- [x] **CHKT-05**: User cannot place more than one order per Saturday delivery window
- [ ] **CHKT-06**: User can apply promo codes at checkout (Stripe coupon integration) (audit: promo_code not displayed on order detail page)
- [ ] **CHKT-07**: User can add tip at checkout (15%/20%/25%/custom) (audit: tip_cents not displayed on order detail page)
- [ ] **CHKT-08**: User can add delivery instructions ("Leave at door", etc.) (audit: delivery_instructions not rendered on order detail page)
- [x] **CHKT-09**: User can browse and build cart without signing in — (a) anonymous browsing + localStorage cart, (b) auth prompt at checkout, (c) cart transfers to user account on sign-in
- [x] **CHKT-10**: Successful checkouts logged with order ID, total_cents, user_id, payment_intent_id to Sentry breadcrumb + structured log

### Customer UX

- [x] **CUX-01**: Search bar always visible on mobile (not collapsed to icon)
- [x] **CUX-02**: Dietary filter chips above menu grid (Vegan, Gluten-Free, Spicy)
- [x] **CUX-03**: Sold-out items sorted to bottom of search results and grid
- [x] **CUX-04**: Item detail sheet shows scroll indicator when modifiers overflow
- [x] **CUX-05**: Dynamic Saturday schedule hero banner with next delivery date (audit: v1.9 has dynamic hero CTA — verify existing impl, enhance if needed)
- [x] **CUX-06**: Minimum order warning shown inline in cart
- [x] **CUX-07**: Sticky checkout footer on mobile (total + button always visible)
- [x] **CUX-08**: First available delivery date auto-selected
- [x] **CUX-09**: Cart sync status indicator ("Saved" / "Saving...")
- [x] **CUX-10**: Prominent "Offline Mode" banner when browsing cached menu (audit: v1.6 has animated offline banner — verify existing impl, polish if needed)
- [x] **CUX-20**: Delivery gate poll interval reduces to 10s near cutoff (currently static 60s in `useDeliveryGate.ts`)
- [ ] **CUX-11**: User can one-tap reorder from order history (audit: useReorder.ts passes UUID as menuItemSlug)
- [x] **CUX-12**: Rating prompt appears after delivery confirmation (needs: `ratings` table, POST API route, admin ratings view)
- [x] **CUX-13**: User can copy shareable order link (URL copy, not social media integration)
- [x] **CUX-14**: Interactive cards have visible focus rings
- [x] **CUX-15**: Cart items deletable via keyboard with confirmation
- [x] **CUX-16**: Drawer handles have descriptive aria-labels
- [x] **CUX-17**: Form errors linked to fields via aria-describedby
- [x] **CUX-18**: Status indicators use icons alongside color (not color-only)
- [x] **CUX-19**: 3D tilt disabled on keyboard focus

### Admin Enhancements

- [x] **ADMIN-01**: Orders grouped by delivery time window on ops dashboard
- [ ] **ADMIN-02**: Admin menu photo management grid (upload, crop, replace)

### Driver Enhancements

- [x] **DRV-01**: Driver can contact customer with one tap (phone or text)
- [x] **DRV-02**: Driver can open turn-by-turn navigation to stop address
- [x] **DRV-03**: Driver must capture photo proof on delivery completion (depends on Phase 90 photo storage infrastructure)

### Observability

- [ ] **OBS-01**: All API routes use standardized error format `{error: {code, message, details?}}`
- [x] **OBS-02**: Webhook events logged with body hash + signature
- [ ] **OBS-03**: Health check has external alerting for downtime
- [ ] **OBS-04**: Database backed up daily with verification
- [x] **OBS-05**: First 4 menu images preloaded (not lazy above fold)
- [ ] **OBS-06**: Bundle under 200KB first-load JS (tree-shaking audit)
- [x] **OBS-07**: Timezone from env var (not hardcoded)

### Testing

- [x] **TST-01**: Concurrent cart addition race condition tests
- [ ] **TST-02**: Stripe webhook failure/transition tests
- [ ] **TST-03**: RLS policy multi-user edge case tests
- [x] **TST-04**: Cutoff boundary tests including DST transitions
- [x] **TST-05**: Refund calculation rounding/ceiling tests
- [x] **TST-06**: Full Saturday dry run — 20 test orders through lifecycle (requires: test Stripe keys, test users, test addresses setup)
- [x] **TST-07**: Load test — 50 concurrent checkout submissions via k6 or Artillery

### Pre-Launch Checklist

- [ ] **LAUNCH-01**: Supabase production instance provisioned (separate from staging)
- [ ] **LAUNCH-02**: Production env vars set (Stripe live keys, Resend domain, Sentry DSN)
- [ ] **LAUNCH-03**: DNS + custom domain verified with SSL
- [ ] **LAUNCH-04**: Google Maps API billing enabled with budget cap
- [ ] **LAUNCH-05**: Upstash Redis provisioned on Vercel Marketplace
- [ ] **LAUNCH-06**: Stripe webhook tested with real test payments
- [ ] **LAUNCH-07**: Email delivery confirmed (all 4 templates: confirmation, reminder, tracking, feedback)
- [ ] **LAUNCH-08**: Mobile testing (iOS Safari, Android Chrome, PWA install)
- [ ] **LAUNCH-09**: Admin trained on ops dashboard
- [ ] **LAUNCH-10**: Driver(s) completed test deliveries
- [ ] **LAUNCH-11**: Refund and emergency procedures documented

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Stripe webhook failures lose orders | Medium | Critical | Webhook retry + reconciliation dashboard |
| Menu photos not available from owner | High | Medium | Fallbacks exist in `data/menu-photos/` |
| Driver app offline during delivery | Medium | High | IndexedDB queue built; test in Phase 95 |
| Cutoff time confusion for customers | High | Medium | Phase 92 hero banner + countdown |
| Google Maps API quota exceeded | Low | High | Budget caps + Leaflet fallback |
| Supabase free tier limits hit | Medium | Critical | Monitor usage; upgrade to Pro before launch |
| Platform price drift | High | High | Periodic manual check; automated sync deferred |

## Success Metrics (4 weeks post-launch)

| Metric | Target |
|--------|--------|
| Orders per Saturday | 30+ |
| Checkout completion rate | >70% |
| Average order value | >$40 |
| Zero payment double-charges | 100% |
| Page load time (LCP) | <2.5s |
| Admin time per Saturday | <30 minutes |

## Future Requirements

Deferred beyond v2.0. Tracked but not in current roadmap.

### Notifications

- **NOTF-01**: Push notifications for route assignments
- **NOTF-02**: Email notifications for route assignments

### Advanced Driver

- **ADV-01**: Driver messaging system
- **ADV-02**: Weather alerts for drivers
- **ADV-03**: Auto-assignment algorithm
- **ADV-04**: Tip tracking for drivers

### Quality Infrastructure

- **QUAL-01**: Chromatic visual regression baselines
- **QUAL-02**: Lighthouse CI at score 70+
- **QUAL-03**: Apple Sign-in

### Internationalization

- **I18N-01**: Myanmar/English language toggle
- **I18N-02**: Burmese descriptions for menu items

### Menu Extras

- **MEXT-01**: External platform ID mapping (DoorDash/UberEats)
- **MEXT-02**: Price history table with effective dates
- **MEXT-03**: Menu item "last synced" tracking
- **MEXT-04**: Burmese descriptions (description_my)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time GPS map for customers | Text status updates suffice at 50-150 orders |
| Push notifications via service worker | Email + SMS covers it |
| Customer loyalty/referral system | Get first 100 regulars first |
| Multi-admin role system | Solo operator for now |
| Multi-location support | Single Covina kitchen |
| Subscription/recurring orders | Not enough volume |
| Live chat support | Email response adequate at this scale |
| Advanced analytics dashboards | Simple counts + revenue enough |
| Full i18n translation | Burmese names exist; full i18n later |
| Social media integration | Manual sharing sufficient |
| Docker/Kubernetes | Vercel is serverless |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | Phase 89 | Pending |
| BUG-02 | Phase 89 | Pending |
| BUG-03 | Phase 89 | Pending |
| BUG-04 | Phase 89 | Pending |
| BUG-05 | Phase 89 | Pending |
| BUG-06 | Phase 89 | Pending |
| BUG-07 | Phase 89 | Pending |
| MENU-01 | Phase 90 | Pending |
| MENU-02 | Phase 90 | Pending |
| MENU-03 | Phase 90 | Pending |
| MENU-04 | Phase 90 | Pending |
| MENU-05 | Phase 90 | Pending |
| MENU-06 | Phase 90 | Pending |
| MENU-07 | Phase 90 | Pending |
| ADMIN-02 | Phase 90 | Pending |
| CHKT-01 | Phase 91 | Complete |
| CHKT-02 | Phase 96 | Pending |
| CHKT-03 | Phase 91 | Complete |
| CHKT-04 | Phase 91 | Complete |
| CHKT-05 | Phase 91 | Complete |
| CHKT-06 | Phase 96 | Pending |
| CHKT-07 | Phase 96 | Pending |
| CHKT-08 | Phase 96 | Pending |
| CHKT-09 | Phase 91 | Complete |
| CHKT-10 | Phase 91 | Complete |
| CUX-01 | Phase 92 | Complete |
| CUX-02 | Phase 92 | Complete |
| CUX-03 | Phase 92 | Complete |
| CUX-04 | Phase 92 | Complete |
| CUX-05 | Phase 92 | Complete |
| CUX-06 | Phase 92 | Complete |
| CUX-07 | Phase 92 | Complete |
| CUX-08 | Phase 92 | Complete |
| CUX-09 | Phase 92 | Complete |
| CUX-10 | Phase 92 | Complete |
| CUX-20 | Phase 92 | Complete |
| CUX-11 | Phase 96 | Pending |
| CUX-12 | Phase 93 | Complete |
| CUX-13 | Phase 93 | Complete |
| CUX-14 | Phase 93 | Complete |
| CUX-15 | Phase 93 | Complete |
| CUX-16 | Phase 93 | Complete |
| CUX-17 | Phase 93 | Complete |
| CUX-18 | Phase 93 | Complete |
| CUX-19 | Phase 93 | Complete |
| ADMIN-01 | Phase 94 | Complete |
| DRV-01 | Phase 94 | Complete |
| DRV-02 | Phase 94 | Complete |
| DRV-03 | Phase 94 | Complete |
| OBS-01 | Phase 95 | Pending |
| OBS-02 | Phase 95 | Complete |
| OBS-03 | Phase 95 | Pending |
| OBS-04 | Phase 95 | Pending |
| OBS-05 | Phase 95 | Complete |
| OBS-06 | Phase 95 | Pending |
| OBS-07 | Phase 95 | Complete |
| TST-01 | Phase 95 | Complete |
| TST-02 | Phase 95 | Pending |
| TST-03 | Phase 95 | Pending |
| TST-04 | Phase 95 | Complete |
| TST-05 | Phase 95 | Complete |
| TST-06 | Phase 95 | Complete |
| TST-07 | Phase 95 | Complete |
| LAUNCH-01 | Phase 95 | Pending |
| LAUNCH-02 | Phase 95 | Pending |
| LAUNCH-03 | Phase 95 | Pending |
| LAUNCH-04 | Phase 95 | Pending |
| LAUNCH-05 | Phase 95 | Pending |
| LAUNCH-06 | Phase 95 | Pending |
| LAUNCH-07 | Phase 95 | Pending |
| LAUNCH-08 | Phase 95 | Pending |
| LAUNCH-09 | Phase 95 | Pending |
| LAUNCH-10 | Phase 95 | Pending |
| LAUNCH-11 | Phase 95 | Pending |

**Coverage:**
- v2.0 requirements: 74 total
- Mapped to phases: 74
- Unmapped: 0

---
*Requirements defined: 2026-03-03*
*Last updated: 2026-03-03 after gap closure phases 96-97 created*
