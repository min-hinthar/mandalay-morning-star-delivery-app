# Requirements: Morning Star V8 UI Rewrite

**Defined:** 2026-02-13
**Core Value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.

## v1.7 Requirements

Requirements for production deployment and readiness. Each maps to roadmap phases.

### Deployment

- [x] **DEPL-01**: App deployed to Vercel at delivery.mandalaymorningstar.com
- [x] **DEPL-02**: Health endpoint (`/api/health`) validates all service connections *(code verified; human production test pending)*
- [x] **DEPL-03**: All environment variables configured for production scope in Vercel *(human verification pending)*

### Monitoring

- [x] **MNTR-01**: Sentry client-side errors captured via `instrumentation-client.ts`
- [x] **MNTR-02**: Sentry server/edge errors captured via `instrumentation.ts`
- [x] **MNTR-03**: Source maps uploaded to Sentry on every build
- [x] **MNTR-04**: @vercel/speed-insights integrated for real user monitoring
- [x] **MNTR-05**: Sentry SDK updated to ^10.38.0

### Performance

- [x] **PERF-01**: Hero text visible at server render (no opacity:0 blocking LCP)
- [x] **PERF-02**: LazyMotion features loaded asynchronously (not sync domMax)
- [x] **PERF-03**: LCP < 4000ms on homepage (Lighthouse mobile) *(CI enforcement via lighthouserc.js)*
- [x] **PERF-04**: Lighthouse performance score > 70 on customer routes *(CI enforcement via lighthouserc.js)*

### Admin Pages

- [x] **ADMN-01**: Admin order detail page at `/admin/orders/[id]` with full order info
- [x] **ADMN-02**: Admin order detail integrates EmailHistory component
- [x] **ADMN-03**: Admin order detail has status management controls
- [x] **ADMN-04**: Admin profile page at `/admin/profile` with self-management

### Operations

- [x] **OPS-01**: Google OAuth consent screen configured and published to production *(human verification pending)*
- [x] **OPS-02**: Google sign-in works end-to-end on production domain *(human verification pending)*
- [ ] ~~**OPS-03**: Apple Sign-in domain verified and Service ID configured~~ *Removed — no Apple Developer account; deferred indefinitely*
- [x] **OPS-04**: Resend domain verified with SPF + DKIM + DMARC DNS records *(human verification pending)*
- [x] **OPS-05**: Stripe production webhook endpoint with correct signing secret *(human verification pending)*
- [x] **OPS-06**: Domain verified in Google Search Console *(human verification pending)*

### Branding & Compliance

- [x] **BRND-01**: Homepage links to privacy policy and terms of service
- [x] **BRND-02**: Homepage clearly explains app purpose (meal delivery subscription)
- [ ] **BRND-03**: Google OAuth brand verification submitted and approved *(human action pending — submit in Cloud Console)*

### Service Worker

- [x] **SW-01**: Service worker scope expanded from /driver to /
- [x] **SW-02**: Content-hash based revision strategy (replace Date.now())
- [x] **SW-03**: "Update available" banner shown when new version deployed
- [x] **SW-04**: Auth callback and Sentry tunnel routes excluded from SW caching

### CI/CD

- [x] **CICD-01**: Lighthouse CI assertions changed to error for LCP > 4000ms, CLS > 0.15
- [ ] ~~**CICD-02**: Chromatic visual regression workflow in GitHub Actions~~ *Deferred to v1.8+*
- [x] **CICD-03**: CSS lint and Prettier format check added to CI pipeline
- [ ] ~~**CICD-04**: GitHub branch protection requires lighthouse + chromatic checks~~ *Deferred to v1.8+*

### Backlog Cleanup

- [ ] ~~**BKLG-01**: SETT-04 language preference in customer settings~~ *Deferred to v1.8+*
- [x] **BKLG-02**: CartPage modifier editor wired to ItemDetailSheet
- [x] **BKLG-03**: Tracking page route_id extraction from routeStop
- [x] **BKLG-04**: UnifiedMenuItemCard refactored to < 400 lines
- [x] **BKLG-05**: Dead `send-order-confirmation` Edge Function removed
- [x] **BKLG-06**: Dead code audit complete (Chromatic baselines deferred with CICD-02)

## Future Requirements

Deferred beyond v1.7. Tracked but not in current roadmap.

### Post-Launch Hardening

- **HARD-01**: Rate limiting upgrade from in-memory Map to Redis/Vercel KV
- **HARD-02**: Content Security Policy headers configured
- **HARD-03**: Supabase RLS audit for all tables
- **HARD-04**: E2E tests running in CI pipeline
- **HARD-05**: Bundle size tracking and regression alerts in CI
- **HARD-06**: Database production project separation from development

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Backend/schema changes | Supabase + Stripe contracts stay stable |
| Multi-restaurant marketplace | Not part of Morning Star scope |
| Real-time subscriptions (WebSocket) | Weekly delivery model doesn't need it; manual refresh works |
| Full E2E test suite in CI | 5-10 min per run, fragile; run critical path only |
| Admin RBAC (role-based access control) | Single admin for now; premature complexity |
| Custom monitoring dashboard | Sentry + Vercel Analytics already provide dashboards |
| Docker/Kubernetes | Vercel is serverless; containerization adds zero value |
| Multi-region deployment | Single US region fine for LA-based service |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEPL-01 | -- | Complete |
| DEPL-02 | Phase 58 | Code verified (human test pending) |
| DEPL-03 | Phase 58 | Human verification pending |
| MNTR-01 | Phase 59 | Satisfied |
| MNTR-02 | Phase 59 | Satisfied |
| MNTR-03 | Phase 59 | Satisfied |
| MNTR-04 | Phase 59 | Satisfied |
| MNTR-05 | Phase 59 | Satisfied |
| PERF-01 | Phase 60 | Satisfied |
| PERF-02 | Phase 60 | Satisfied |
| PERF-03 | Phase 60 | Satisfied (CI enforced) |
| PERF-04 | Phase 60 | Satisfied (CI enforced) |
| ADMN-01 | Phase 61 | Satisfied |
| ADMN-02 | Phase 61 | Satisfied |
| ADMN-03 | Phase 61 | Satisfied |
| ADMN-04 | Phase 61 | Satisfied |
| OPS-01 | Phase 62 | Human verification pending |
| OPS-02 | Phase 62 | Human verification pending |
| OPS-03 | Phase 62 | Removed (no Apple Developer account) |
| OPS-04 | Phase 62 | Human verification pending |
| OPS-05 | Phase 62 | Human verification pending |
| OPS-06 | Phase 62 | Human verification pending |
| BRND-01 | Phase 63 | Satisfied |
| BRND-02 | Phase 63 | Satisfied |
| BRND-03 | Phase 63 | Human action pending |
| SW-01 | Phase 64 | Satisfied |
| SW-02 | Phase 64 | Satisfied |
| SW-03 | Phase 64 | Satisfied |
| SW-04 | Phase 64 | Satisfied |
| CICD-01 | Phase 65 | Satisfied |
| CICD-02 | Phase 65 | Deferred to v1.8+ |
| CICD-03 | Phase 65 | Satisfied |
| CICD-04 | Phase 65 | Deferred to v1.8+ |
| BKLG-01 | Phase 66 | Deferred to v1.8+ |
| BKLG-02 | Phase 66 | Satisfied |
| BKLG-03 | Phase 66 | Satisfied |
| BKLG-04 | Phase 66 | Satisfied |
| BKLG-05 | Phase 66 | Satisfied |
| BKLG-06 | Phase 66 | Satisfied (redefined as dead code audit) |

**Coverage:**
- v1.7 requirements: 35 total
- Satisfied: 26 (code verified)
- Human verification pending: 8
- Deferred: 3 (CICD-02, CICD-04, BKLG-01)
- Removed: 1 (OPS-03)
- Human action pending: 1 (BRND-03)

---
*Requirements defined: 2026-02-13*
*Last updated: 2026-02-16 after milestone audit*
