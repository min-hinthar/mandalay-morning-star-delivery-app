# Launch Checklist

Pre-launch checklist for Mandalay Morning Star Delivery App. Each item maps to a LAUNCH or OBS requirement.

---

## Infrastructure (LAUNCH-01 to LAUNCH-05)

### LAUNCH-01: Supabase Production Instance

- [ ] Create production Supabase project (separate from dev)
- [ ] Apply all migrations (`001_schema.sql` through latest) in order
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` to production project URL
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` to production anon key
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` to production service role key
- [ ] Run `pnpm seed:menu` against production to populate menu
- [ ] Verify RLS policies active: `pnpm rls:test` (adjust env for prod)
- [ ] Confirm auth callback URL set in Supabase Dashboard -> Authentication -> URL Configuration

### LAUNCH-02: Production Environment Variables

All required vars (validated by `pnpm launch:check`):

| Variable                             | Prefix/Format | Source                                      |
| ------------------------------------ | ------------- | ------------------------------------------- |
| `STRIPE_SECRET_KEY`                  | `sk_live_`    | Stripe Dashboard -> Developers -> API keys  |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_`    | Stripe Dashboard -> Developers -> API keys  |
| `NEXT_PUBLIC_SUPABASE_URL`           | `https://`    | Supabase Dashboard -> Settings -> API       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | set           | Supabase Dashboard -> Settings -> API       |
| `SUPABASE_SERVICE_ROLE_KEY`          | set           | Supabase Dashboard -> Settings -> API       |
| `RESEND_API_KEY`                     | `re_`         | Resend Dashboard -> API Keys                |
| `GOOGLE_MAPS_API_KEY`                | set           | Google Cloud Console -> Credentials         |
| `UPSTASH_REDIS_REST_URL`             | `https://`    | Vercel Marketplace -> Upstash Redis         |
| `UPSTASH_REDIS_REST_TOKEN`           | set           | Vercel Marketplace -> Upstash Redis         |
| `NEXT_PUBLIC_SENTRY_DSN`             | `https://`    | Sentry Dashboard -> Settings -> Client Keys |
| `NEXT_PUBLIC_APP_URL`                | `https://`    | Your production domain                      |

Optional:

| Variable            | Default               | Notes                                 |
| ------------------- | --------------------- | ------------------------------------- |
| `DELIVERY_TIMEZONE` | `America/Los_Angeles` | Override if different timezone needed |

- [ ] All required vars set in Vercel Dashboard -> Settings -> Environment Variables
- [ ] Run `pnpm launch:check` to validate all vars present and correctly prefixed

### LAUNCH-03: DNS + Custom Domain + SSL

- [ ] Add custom domain in Vercel Dashboard -> Settings -> Domains
- [ ] Configure DNS records at registrar:
  - `A` record: `76.76.21.21` (Vercel)
  - `CNAME` record: `cname.vercel-dns.com` (for `www` subdomain)
- [ ] Wait for DNS propagation (up to 48h, usually minutes)
- [ ] Verify SSL certificate auto-provisioned by Vercel
- [ ] Test: `curl -I https://yourdomain.com` -- expect `200 OK` with valid cert
- [ ] Verify redirect: `http://yourdomain.com` -> `https://yourdomain.com`

### LAUNCH-04: Google Maps API

- [ ] Enable billing on Google Cloud project (Google Cloud Console -> Billing)
- [ ] Set budget cap: $50/month recommended (Google Cloud Console -> Billing -> Budgets & alerts)
- [ ] Verify APIs enabled:
  - Geocoding API
  - Maps JavaScript API
  - Distance Matrix API
- [ ] Restrict API key to production domain (Google Cloud Console -> Credentials -> API key -> Application restrictions)
- [ ] Test geocoding: verify address lookup returns results for Covina, CA area

### LAUNCH-05: Upstash Redis

- [ ] Provision Redis database via Vercel Marketplace (Vercel Dashboard -> Integrations -> Upstash Redis)
- [ ] Set `UPSTASH_REDIS_REST_URL` in Vercel env vars
- [ ] Set `UPSTASH_REDIS_REST_TOKEN` in Vercel env vars
- [ ] Verify connectivity: health endpoint reports redis as "healthy" (`/api/health?deep=true`)

---

## External Monitoring (OBS-03, OBS-04)

### OBS-03: BetterStack Uptime Monitoring

- [ ] Create free account at [betterstack.com](https://betterstack.com)
- [ ] Add monitor:
  - **URL:** `GET https://yourdomain.com/api/health?deep=true`
  - **Interval:** 3 minutes
  - **Alert on:** HTTP status 503
  - **Expected status:** 200
- [ ] Configure alert channels (BetterStack Dashboard -> Settings -> Integrations):
  - Email notification
  - SMS notification (recommended)
- [ ] Verify first check succeeds in BetterStack dashboard
- [ ] Optional: Add status page for public uptime display

### OBS-04: Database Backups (Supabase Pro)

- [ ] Upgrade production Supabase project to Pro plan (Supabase Dashboard -> Settings -> Billing)
- [ ] Verify daily backups appear (Supabase Dashboard -> Database -> Backups)
- [ ] Confirm Point-in-Time Recovery (PITR) is active
- [ ] Document backup retention period (Pro: 7 days)
- [ ] Test: request a backup restoration to staging to verify process works

---

## Payment and Email (LAUNCH-06, LAUNCH-07)

### LAUNCH-06: Stripe Webhook

- [ ] Switch Stripe to live mode (Stripe Dashboard -> toggle "Test mode" off)
- [ ] Create webhook endpoint (Stripe Dashboard -> Developers -> Webhooks -> Add endpoint):
  - **URL:** `https://yourdomain.com/api/webhooks/stripe`
  - **Events to subscribe:**
    - `checkout.session.completed`
    - `checkout.session.expired`
    - `payment_intent.payment_failed`
    - `charge.refunded`
- [ ] Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET` env var
- [ ] Test with Stripe CLI: `stripe trigger checkout.session.completed --api-key sk_live_...`
- [ ] Verify webhook received in app logs / Sentry
- [ ] Confirm idempotency: re-sending same event does not create duplicate orders

### LAUNCH-07: Email Delivery

- [ ] Verify sending domain in Resend Dashboard -> Domains (add DNS records)
- [ ] Set `RESEND_API_KEY` (production key) in Vercel env vars
- [ ] Test all 4 email templates:
  - [ ] Order confirmation email
  - [ ] Delivery reminder email
  - [ ] Order tracking/status update email
  - [ ] Feedback/rating request email
- [ ] Verify emails land in inbox (not spam) for Gmail, Outlook, Yahoo
- [ ] Check "From" address matches verified domain

---

## Device Testing (LAUNCH-08)

### Cross-Device Verification

- [ ] **iOS Safari:** Full order flow (browse -> cart -> checkout -> confirmation)
- [ ] **Android Chrome:** Full order flow
- [ ] **Desktop Chrome:** Full order flow + admin dashboard
- [ ] **Desktop Firefox:** Basic smoke test
- [ ] **PWA Install:**
  - [ ] iOS: "Add to Home Screen" works, app icon appears
  - [ ] Android: Install prompt appears, app launches as standalone
- [ ] **Offline mode:** App shows offline banner, queued actions sync on reconnect
- [ ] **Touch targets:** All buttons/links >= 44x44px on mobile
- [ ] **Responsive breakpoints:** sm (640px), md (768px), lg (1024px), xl (1280px)

---

## Training and Procedures (LAUNCH-09, LAUNCH-10, LAUNCH-11)

### LAUNCH-09: Admin Operations Walkthrough

10-step admin training procedure:

1. **Login:** Navigate to `/admin`, sign in with admin credentials
2. **View Orders:** Dashboard shows today's orders with status filters (pending, confirmed, delivering, delivered)
3. **Assign Driver:** Click order -> select driver from dropdown -> confirm assignment
4. **Operations Dashboard:** Review ops overview -- active orders, driver locations, delivery windows
5. **Bulk Operations:** Select multiple orders -> bulk assign driver / bulk update status
6. **Send Emails:** Trigger order confirmation / delivery reminder emails from order detail
7. **Analytics:** Review revenue, order count, popular items, driver performance metrics
8. **Menu Management:** Add/edit/remove menu items, update prices, manage photos, toggle availability
9. **Process Refund:** Order detail -> Refund button -> select items -> confirm refund amount -> submit
10. **Settings:** Update business hours, delivery coverage, cutoff time, app settings

### LAUNCH-10: Driver Test Deliveries

10-step driver verification procedure:

1. **Accept Invite:** Receive invite email -> click signup link -> create account
2. **Complete Profile:** Upload photo, enter vehicle info, set availability
3. **View Route:** Open driver dashboard -> see assigned deliveries on map
4. **Navigate:** Tap address -> opens Google Maps / Apple Maps with directions
5. **Contact Customer:** Tap phone icon to call, tap message icon for SMS
6. **Arrive:** Mark "arrived" status when at delivery location
7. **Take Photo:** Capture delivery proof photo (required before marking complete)
8. **Deliver:** Hand off order to customer
9. **Complete Delivery:** Mark as "delivered" -> photo uploads -> status updates
10. **Review Stats:** Check completed deliveries, ratings, earnings in driver dashboard

### LAUNCH-11: Refund and Emergency Procedures

**Refund Process (6 steps):**

1. Customer reports issue via order detail page or contacts admin
2. Admin navigates to order in admin dashboard
3. Admin clicks "Refund" on order detail
4. Admin selects full or partial refund, picks items if partial
5. System calculates refund amount (proportional to item prices)
6. Admin confirms -> Stripe processes refund -> order status updates -> customer notified via email

**Emergency Procedures:**

**Payment System Down (Stripe outage):**

- Check [status.stripe.com](https://status.stripe.com) for known incidents
- Temporarily disable checkout with maintenance banner
- Monitor Sentry for payment-related errors
- Resume checkout once Stripe status returns to operational
- Process any queued/failed payments manually

**App Down (Vercel/Next.js outage):**

- Check [vercel-status.com](https://vercel-status.com) for platform issues
- Monitor BetterStack alerts for health endpoint failures
- If Vercel issue: wait for platform recovery (Vercel SLA)
- If app bug: rollback to last known good deployment in Vercel Dashboard -> Deployments
- Notify customers via backup communication channel (email/SMS)

**Driver Issues:**

- Driver app not loading: Clear cache, reinstall PWA, check network connection
- Driver can't mark delivery: Admin can manually update order status in dashboard
- Driver no-show: Reassign order to available driver via admin dashboard
- Multiple drivers unavailable: Admin contacts customers to reschedule delivery

---

## Validation

Run automated checks:

```bash
pnpm launch:check
```

This validates all programmatic items (env vars, connectivity, DNS). Manual items above must be verified by hand.
