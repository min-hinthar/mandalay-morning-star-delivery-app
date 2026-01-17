# Error History

Reference for past bugs, root causes, and fixes. Check here before debugging similar issues.

---

## 2025-01-17: Sentry not capturing errors in Vercel production
**Type:** Runtime | **Severity:** High
**Files:** `instrumentation-client.ts`, `next.config.ts`, `sentry.server.config.ts`

**Error:** Sentry debug page not triggering test errors in production
**Root Cause:** Next.js 16+ requires `instrumentation-client.ts` instead of `sentry.client.config.ts`; also missing `SENTRY_AUTH_TOKEN` for source maps and `global-error.tsx` for React errors
**Fix:**
- Created `instrumentation-client.ts` with proper Next.js 16 setup
- Added `global-error.tsx` for React render errors
- Added `authToken` to next.config.ts for source maps
- Updated .env.example with Sentry env vars
- Enabled debug mode when `SENTRY_DEBUG=true`

---

## 2025-01-17: Stripe webhook RLS bypass
**Type:** Runtime | **Severity:** Critical
**Files:** `src/app/api/webhooks/stripe/route.ts`, `src/lib/supabase/server.ts`

**Error:** Orders stuck in "pending" status after successful Stripe payment
**Root Cause:** Webhook used `createClient()` (anon key) which couldn't update orders due to RLS - webhooks have no user session context
**Fix:** Created `createServiceClient()` using `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for trusted server-side operations

---

## 2025-01-17: Missing order_id in Stripe checkout metadata
**Type:** Runtime | **Severity:** High
**Files:** `src/app/api/checkout/session/route.ts`

**Error:** Webhook received `checkout.session.completed` but `session.metadata.order_id` was undefined
**Root Cause:** Order was created after Stripe session, but metadata referenced wrong variable
**Fix:** Ensure order is created first, then pass `order.id` to Stripe session metadata

---

## 2025-01-17: Missing Alert/AlertDialog UI components
**Type:** TypeScript | **Severity:** Medium
**Files:** `src/components/ui/alert.tsx`, `src/components/ui/alert-dialog.tsx`

**Error:** `Cannot find module '@/components/ui/alert'` during typecheck
**Root Cause:** PendingOrderActions component imported shadcn/ui components that weren't installed
**Fix:** Created alert.tsx and alert-dialog.tsx components, installed `@radix-ui/react-alert-dialog`

---

## 2025-01-17: Wrong import path for cn utility
**Type:** TypeScript | **Severity:** Low
**Files:** `src/components/ui/alert.tsx`, `src/components/ui/alert-dialog.tsx`

**Error:** `Cannot find module '@/lib/utils'`
**Root Cause:** Project uses `@/lib/utils/cn` not `@/lib/utils` for the cn utility
**Fix:** Updated imports to use correct path `@/lib/utils/cn`

---

## 2025-01-17: Sentry debug API not sending events
**Type:** Runtime | **Severity:** Medium
**Files:** `src/app/api/debug/sentry/route.ts`

**Error:** Test errors from `/api/debug/sentry` not appearing in Sentry dashboard
**Root Cause:** Sentry events are sent asynchronously; serverless function terminates before flush completes
**Fix:** Added `await Sentry.flush(2000)` before returning response

---
