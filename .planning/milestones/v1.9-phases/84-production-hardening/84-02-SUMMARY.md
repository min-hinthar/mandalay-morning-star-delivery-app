---
phase: 84-production-hardening
plan: 02
status: complete
commit: ba67c826
requirements: [HARD-01, HARD-02, HARD-07]
---

## What was done

### Task 1: Endpoint-specific rate limit tiers
- Added 4 new tiers to `RateLimitTier`: `checkout` (3/1m), `refund` (5/1m), `admin-bulk` (10/1m), `webhook` (30/1m)
- Created 4 limiter instances in `client.ts`
- Exported all 4 from `index.ts`

### Task 2: Applied limiters + enriched Sentry context on 12 files
- **checkout/session**: `apiWriteLimiter` -> `checkoutLimiter`, enriched RPC error with `itemCount`, `totalCents`
- **admin/orders/[id]/refund**: `adminLimiter` -> `refundLimiter`, enriched outer catch with `orderId`
- **admin/orders/[id]/status**: kept `adminLimiter`, enriched outer catch with `orderId`
- **orders/[id]/retry-payment**: `apiWriteLimiter` -> `checkoutLimiter`, enriched Stripe error with `orderId`, `userId`
- **webhooks/stripe**: added `webhookLimiter` with IP-based identification, enriched handler error with `orderId` from metadata
- **driver/routes/[routeId]/stops/[stopId]**: kept `driverActionLimiter`, enriched update error with `routeId`, `stopId`, `driverId`
- **driver/routes/[routeId]/start**: kept `driverActionLimiter`, enriched update error with `routeId`, `driverId`
- **driver/routes/[routeId]/complete**: kept `driverActionLimiter`, enriched update + badge errors with `routeId`, `driverId`
- **admin/routes/[id]**: kept `adminLimiter`, enriched reorder/update/delete errors with `routeId`

## Verification
- `pnpm typecheck` passes
- `pnpm lint` passes
- `pnpm format:check` passes
