# Requirements: Morning Star V8 UI Rewrite

**Defined:** 2026-02-13
**Core Value:** Every UI element is reliably clickable and the app feels delightfully alive with motion.

## v1.7 Requirements

Requirements for production deployment and readiness. Each maps to roadmap phases.

### Deployment

- [x] **DEPL-01**: App deployed to Vercel at delivery.mandalaymorningstar.com
- [ ] **DEPL-02**: Health endpoint (`/api/health`) validates all service connections
- [ ] **DEPL-03**: All environment variables configured for production scope in Vercel

### Monitoring

- [ ] **MNTR-01**: Sentry client-side errors captured via `instrumentation-client.ts`
- [ ] **MNTR-02**: Sentry server/edge errors captured via `instrumentation.ts`
- [ ] **MNTR-03**: Source maps uploaded to Sentry on every build
- [ ] **MNTR-04**: @vercel/speed-insights integrated for real user monitoring
- [ ] **MNTR-05**: Sentry SDK updated to ^10.38.0

### Performance

- [ ] **PERF-01**: Hero text visible at server render (no opacity:0 blocking LCP)
- [ ] **PERF-02**: LazyMotion features loaded asynchronously (not sync domMax)
- [ ] **PERF-03**: LCP < 4000ms on homepage (Lighthouse mobile)
- [ ] **PERF-04**: Lighthouse performance score > 70 on customer routes

### Admin Pages

- [ ] **ADMN-01**: Admin order detail page at `/admin/orders/[id]` with full order info
- [ ] **ADMN-02**: Admin order detail integrates EmailHistory component
- [ ] **ADMN-03**: Admin order detail has status management controls
- [ ] **ADMN-04**: Admin profile page at `/admin/profile` with self-management

### Operations

- [ ] **OPS-01**: Google OAuth consent screen configured and published to production
- [ ] **OPS-02**: Google sign-in works end-to-end on production domain
- [ ] **OPS-03**: Apple Sign-in domain verified and Service ID configured
- [ ] **OPS-04**: Resend domain verified with SPF + DKIM + DMARC DNS records
- [ ] **OPS-05**: Stripe production webhook endpoint with correct signing secret
- [ ] **OPS-06**: Domain verified in Google Search Console

### Branding & Compliance

- [ ] **BRND-01**: Homepage links to privacy policy and terms of service
- [ ] **BRND-02**: Homepage clearly explains app purpose (meal delivery subscription)
- [ ] **BRND-03**: Google OAuth brand verification submitted and approved

### Service Worker

- [ ] **SW-01**: Service worker scope expanded from /driver to /
- [ ] **SW-02**: Content-hash based revision strategy (replace Date.now())
- [ ] **SW-03**: "Update available" banner shown when new version deployed
- [ ] **SW-04**: Auth callback and Sentry tunnel routes excluded from SW caching

### CI/CD

- [ ] **CICD-01**: Lighthouse CI assertions changed to error for LCP > 4000ms, CLS > 0.15
- [ ] **CICD-02**: Chromatic visual regression workflow in GitHub Actions
- [ ] **CICD-03**: CSS lint and Prettier format check added to CI pipeline
- [ ] **CICD-04**: GitHub branch protection requires lighthouse + chromatic checks

### Backlog Cleanup

- [ ] **BKLG-01**: SETT-04 language preference in customer settings
- [ ] **BKLG-02**: CartPage modifier editor wired to ItemDetailSheet
- [ ] **BKLG-03**: Tracking page route_id extraction from routeStop
- [ ] **BKLG-04**: UnifiedMenuItemCard refactored to < 400 lines
- [ ] **BKLG-05**: Dead `send-order-confirmation` Edge Function removed
- [ ] **BKLG-06**: Visual regression baselines generated via Chromatic

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
| DEPL-02 | Phase 58 | Pending |
| DEPL-03 | Phase 58 | Pending |
| MNTR-01 | Phase 59 | Pending |
| MNTR-02 | Phase 59 | Pending |
| MNTR-03 | Phase 59 | Pending |
| MNTR-04 | Phase 59 | Pending |
| MNTR-05 | Phase 59 | Pending |
| PERF-01 | Phase 60 | Pending |
| PERF-02 | Phase 60 | Pending |
| PERF-03 | Phase 60 | Pending |
| PERF-04 | Phase 60 | Pending |
| ADMN-01 | Phase 61 | Pending |
| ADMN-02 | Phase 61 | Pending |
| ADMN-03 | Phase 61 | Pending |
| ADMN-04 | Phase 61 | Pending |
| OPS-01 | Phase 62 | Pending |
| OPS-02 | Phase 62 | Pending |
| OPS-03 | Phase 62 | Pending |
| OPS-04 | Phase 62 | Pending |
| OPS-05 | Phase 62 | Pending |
| OPS-06 | Phase 62 | Pending |
| BRND-01 | Phase 63 | Pending |
| BRND-02 | Phase 63 | Pending |
| BRND-03 | Phase 63 | Pending |
| SW-01 | Phase 64 | Pending |
| SW-02 | Phase 64 | Pending |
| SW-03 | Phase 64 | Pending |
| SW-04 | Phase 64 | Pending |
| CICD-01 | Phase 65 | Pending |
| CICD-02 | Phase 65 | Pending |
| CICD-03 | Phase 65 | Pending |
| CICD-04 | Phase 65 | Pending |
| BKLG-01 | Phase 66 | Pending |
| BKLG-02 | Phase 66 | Pending |
| BKLG-03 | Phase 66 | Pending |
| BKLG-04 | Phase 66 | Pending |
| BKLG-05 | Phase 66 | Pending |
| BKLG-06 | Phase 66 | Pending |

**Coverage:**
- v1.7 requirements: 35 total (1 already complete)
- Mapped to phases: 34/34 pending requirements mapped
- Unmapped: 0

---
*Requirements defined: 2026-02-13*
*Last updated: 2026-02-13 after roadmap creation*
