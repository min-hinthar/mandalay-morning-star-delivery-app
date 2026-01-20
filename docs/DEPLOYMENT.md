# Deployment Guide

Complete guide for deploying Mandalay Morning Star to production.

## Prerequisites

- GitHub repository access
- Vercel account
- Supabase project (production)
- Stripe account (with live mode access)
- Google Cloud project with APIs enabled
- (Optional) Sentry account for error tracking

## 1. Vercel Setup

### Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click "Import Project"
3. Select your GitHub repository
4. Configure:
   - Framework Preset: Next.js
   - Root Directory: `.` (default)
   - Build Command: `pnpm build`
   - Install Command: `pnpm install`

### Environment Variables

Add all variables in Vercel Project Settings > Environment Variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `NEXT_PUBLIC_APP_URL` | Yes | Your production URL (e.g., `https://your-app.vercel.app`) |
| `GOOGLE_MAPS_API_KEY` | Yes | Google Maps API key |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (live mode: `sk_live_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key (live mode: `pk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `RESEND_API_KEY` | Yes | Resend API key for emails |
| `SENTRY_DSN` | No | Sentry DSN for error tracking |
| `SENTRY_AUTH_TOKEN` | No | Sentry auth token for source maps |

### Custom Domain (Optional)

1. Go to Vercel Project Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` to match

## 2. Supabase Configuration

### URL Configuration

1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Configure:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: Add `https://your-app.vercel.app/auth/callback`

### Email Templates (Optional)

Customize email templates in Authentication > Email Templates:
- Confirmation email
- Magic link email
- Password reset email

### Database Migrations

If deploying to a new Supabase project:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Storage Buckets

Verify storage buckets exist:
- `menu-images` - Menu item images
- `delivery-photos` - Driver delivery photos

## 3. Stripe Configuration

### Webhook Setup

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Configure:
   - Endpoint URL: `https://your-app.vercel.app/api/webhooks/stripe`
   - Events to listen for:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

### Products and Prices

The app creates products dynamically. For production:
1. Go to Stripe Dashboard > Products
2. Verify menu items are created correctly after first order

## 4. Google Cloud Configuration

### API Restrictions

For production, restrict your API key:

1. Go to Google Cloud Console > APIs & Services > Credentials
2. Edit your API key
3. Under "API restrictions", select:
   - Geocoding API
   - Routes API (or Distance Matrix API)
4. Under "Application restrictions":
   - Select "HTTP referrers"
   - Add your production domain

## 5. Post-Deployment Verification

### Health Checks

1. **Homepage loads** - Visit `https://your-app.vercel.app`
2. **Auth works** - Test sign up and sign in with magic link
3. **Menu displays** - Browse menu items
4. **Cart functions** - Add items to cart
5. **Checkout works** - Complete a test order (use Stripe test card: `4242 4242 4242 4242`)
6. **Admin access** - Log in as admin and verify dashboard
7. **Driver app** - Log in as driver and verify route display

### Common Issues

#### Auth Callback 303 Error
- Verify `NEXT_PUBLIC_APP_URL` is set correctly
- Check Supabase redirect URLs include your production domain

#### Stripe Webhook Failures
- Check webhook logs in Stripe Dashboard
- Verify webhook secret is correct
- Ensure endpoint URL is exactly `/api/webhooks/stripe`

#### Map Not Loading
- Verify Google Maps API key is set
- Check API restrictions allow your domain
- Verify Geocoding and Routes APIs are enabled

## 6. Monitoring

### Vercel Analytics

Enable in Vercel Project Settings > Analytics for:
- Web Vitals tracking
- Usage metrics
- Error tracking

### Sentry (Recommended)

1. Create project at [sentry.io](https://sentry.io)
2. Add `SENTRY_DSN` to Vercel environment variables
3. Add `SENTRY_AUTH_TOKEN` for source map uploads

### Supabase Monitoring

Monitor in Supabase Dashboard:
- API requests in API > Logs
- Database queries in Database > Query Performance
- Auth events in Authentication > Logs

## 7. Backup and Recovery

### Database Backups

Supabase provides automatic daily backups on paid plans. For additional safety:

```bash
# Export database
supabase db dump > backup.sql

# Import database
supabase db push < backup.sql
```

### Environment Variables Backup

Export environment variables from Vercel:
1. Go to Project Settings > Environment Variables
2. Document all variables in a secure location (1Password, etc.)

## 8. Scaling Considerations

### Vercel

- Free tier: 100GB bandwidth/month
- Pro tier: Higher limits, team features
- Enterprise: Custom limits, SLA

### Supabase

- Free tier: 500MB database, 2GB bandwidth
- Pro tier: 8GB database, 250GB bandwidth
- Scale as needed based on order volume

### Stripe

- Standard processing fees apply
- Consider Stripe Billing for subscriptions
- Enable fraud prevention tools

## Quick Reference

| Service | Dashboard |
|---------|-----------|
| Vercel | [vercel.com/dashboard](https://vercel.com/dashboard) |
| Supabase | [app.supabase.com](https://app.supabase.com) |
| Stripe | [dashboard.stripe.com](https://dashboard.stripe.com) |
| Google Cloud | [console.cloud.google.com](https://console.cloud.google.com) |
| Sentry | [sentry.io](https://sentry.io) |
