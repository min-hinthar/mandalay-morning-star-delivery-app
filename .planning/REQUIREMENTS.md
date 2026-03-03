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

### Menu & Photos

- [ ] **MENU-01**: Admin can upload photos for menu items via Supabase Storage
- [ ] **MENU-02**: Admin can bulk-upload photos via drag-drop grid matched by item slug
- [ ] **MENU-03**: Photos auto-processed to WebP/AVIF, min 800x600, max 2MB, 4:3 crop
- [ ] **MENU-04**: Menu items track photo freshness via image_updated_at column
- [ ] **MENU-05**: Allergens come from single source (deduplicate tags/allergens overlap)
- [ ] **MENU-06**: Admin can mark items inactive (for owner-verified app-only items)

### Checkout & Payment

- [ ] **CHKT-01**: Client checkout sends only item IDs + modifier selections (no prices)
- [ ] **CHKT-02**: Cart auto-refreshes prices on 409 PRICE_CHANGED instead of error
- [ ] **CHKT-03**: Server validates modifier item_index bounds before checkout RPC
- [ ] **CHKT-04**: Delivery time windows include configurable prep time buffer
- [ ] **CHKT-05**: User cannot place more than one order per Saturday delivery window
- [ ] **CHKT-06**: User can apply promo codes at checkout (Stripe coupon integration)
- [ ] **CHKT-07**: User can add tip at checkout (15%/20%/25%/custom)
- [ ] **CHKT-08**: User can add delivery instructions ("Leave at door", etc.)
- [ ] **CHKT-09**: User can browse and build cart without signing in (sign in at payment)
- [ ] **CHKT-10**: Successful checkouts logged with order ID, total, user ID

### Customer UX

- [ ] **CUX-01**: Search bar always visible on mobile (not collapsed to icon)
- [ ] **CUX-02**: Dietary filter chips above menu grid (Vegan, Gluten-Free, Spicy)
- [ ] **CUX-03**: Sold-out items sorted to bottom of search results and grid
- [ ] **CUX-04**: Item detail sheet shows scroll indicator when modifiers overflow
- [ ] **CUX-05**: Dynamic Saturday schedule hero banner with next delivery date
- [ ] **CUX-06**: Minimum order warning shown inline in cart
- [ ] **CUX-07**: Sticky checkout footer on mobile (total + button always visible)
- [ ] **CUX-08**: First available delivery date auto-selected
- [ ] **CUX-09**: Cart sync status indicator ("Saved" / "Saving...")
- [ ] **CUX-10**: Prominent "Offline Mode" banner when browsing cached menu
- [ ] **CUX-11**: User can one-tap reorder from order history
- [ ] **CUX-12**: Rating prompt appears after delivery confirmation
- [ ] **CUX-13**: User can share order link for social proof
- [ ] **CUX-14**: Interactive cards have visible focus rings
- [ ] **CUX-15**: Cart items deletable via keyboard with confirmation
- [ ] **CUX-16**: Drawer handles have descriptive aria-labels
- [ ] **CUX-17**: Form errors linked to fields via aria-describedby
- [ ] **CUX-18**: Status indicators use icons alongside color (not color-only)
- [ ] **CUX-19**: 3D tilt disabled on keyboard focus

### Admin Enhancements

- [ ] **ADMIN-01**: Orders grouped by delivery time window on ops dashboard
- [ ] **ADMIN-02**: Admin menu photo management grid (upload, crop, replace)

### Driver Enhancements

- [ ] **DRV-01**: Driver can contact customer with one tap (phone or text)
- [ ] **DRV-02**: Driver can open turn-by-turn navigation to stop address
- [ ] **DRV-03**: Driver must capture photo proof on delivery completion

### Observability

- [ ] **OBS-01**: All API routes use standardized error format `{error: {code, message, details?}}`
- [ ] **OBS-02**: Webhook events logged with body hash + signature
- [ ] **OBS-03**: Health check has external alerting for downtime
- [ ] **OBS-04**: Database backed up daily with verification
- [ ] **OBS-05**: First 4 menu images preloaded (not lazy above fold)
- [ ] **OBS-06**: Bundle under 200KB first-load JS (tree-shaking audit)
- [ ] **OBS-07**: Timezone from env var (not hardcoded)

### Testing

- [ ] **TST-01**: Concurrent cart addition race condition tests
- [ ] **TST-02**: Stripe webhook failure/transition tests
- [ ] **TST-03**: RLS policy multi-user edge case tests
- [ ] **TST-04**: Cutoff boundary tests including DST transitions
- [ ] **TST-05**: Refund calculation rounding/ceiling tests
- [ ] **TST-06**: Full Saturday dry run (20 test orders through lifecycle)
- [ ] **TST-07**: Load test (50 concurrent checkout submissions)

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

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| (populated by roadmapper) | | |

**Coverage:**
- v2.0 requirements: 59 total
- Mapped to phases: 0
- Unmapped: 59

---
*Requirements defined: 2026-03-03*
*Last updated: 2026-03-03 after initial definition*
