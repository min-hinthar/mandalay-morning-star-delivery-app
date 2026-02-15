# Dead Code Audit Report - Phase 66

Generated: 2026-02-15
Tool: Knip + manual grep scanning

## Removed

| Type | Item | Confidence | Reason |
|------|------|-----------|--------|
| Edge Function | `supabase/functions/send-order-confirmation/` | HIGH | Superseded by `src/lib/email/` + Resend (Phase 54) |
| Edge Function | `supabase/functions/send-delivery-notification/` | HIGH | Also superseded; zero references in src/ or supabase/ migrations |
| Component | `src/components/ui/animated-image.tsx` | HIGH | Zero imports anywhere |
| Component | `src/components/ui/DiscardChangesModal.tsx` | HIGH | Zero imports anywhere |
| Component | `src/components/ui/auth/AuthHandler.tsx` | HIGH | Zero imports anywhere |
| Component | `src/components/ui/maps/MapErrorCard.tsx` | HIGH | Zero imports anywhere |
| Component | `src/components/ui/admin/analytics/ChartErrorCard.tsx` | HIGH | Zero imports anywhere |
| Component | `src/components/ui/admin/drivers/DriverListTable/DriverMobileCard.tsx` | HIGH | Zero imports anywhere |
| Component | `src/components/ui/admin/routes/RouteListTable/RouteMobileCard.tsx` | HIGH | Zero imports anywhere |
| Component | `OrderDetailExpanded/AuditLogSection.tsx` | HIGH | Replaced by OrderDetailPage; only config.ts still used |
| Component | `OrderDetailExpanded/CancelModal.tsx` | HIGH | Same as above |
| Component | `OrderDetailExpanded/OrderDetailExpanded.tsx` | HIGH | Same as above |
| Component | `OrderDetailExpanded/OrderItemsSection.tsx` | HIGH | Same as above |
| Component | `OrderDetailExpanded/RefundModal.tsx` | HIGH | Same as above |
| Types | `OrderDetailExpanded/types.ts` | HIGH | Same as above |
| Query module | `src/lib/queries/menu.ts` | HIGH | Zero imports anywhere |
| Dependency | `@conform-to/react` | HIGH | Zero imports in codebase |
| Dependency | `@conform-to/zod` | HIGH | Zero imports in codebase |
| Dependency | `@radix-ui/react-toast` | HIGH | Zero imports (custom toast system used) |
| Dependency | `@stripe/stripe-js` | HIGH | Zero imports (server-side Stripe Checkout Sessions) |
| Dependency | `vaul` | HIGH | Zero imports in codebase |
| Dev dependency | `@vitest/coverage-v8` | HIGH | No coverage config in vitest.config.ts |
| Dev dependency | `glob` | HIGH | Zero imports in codebase |
| Dev dependency | `react-email` | HIGH | CLI tool, no scripts reference it |
| console.log | `useServiceWorker.ts:66` | HIGH | Bare log converted to console.debug("[SW]") |
| console.log | `AddressInput.tsx:147` | HIGH | Debug stub converted to console.debug("[AddressInput]") |

## Flagged (Needs User Review)

| Type | Item | Confidence | Reason |
|------|------|-----------|--------|
| Env Var | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | MEDIUM | Only used in health check env schema; `@stripe/stripe-js` removed. May still be needed if Stripe Elements reintroduced |
| API Route | `/api/analytics/vitals` | MEDIUM | Zero frontend fetch references. Was used for custom vitals reporting; now handled by Sentry + Vercel Speed Insights. May be called externally |
| Type | `CUTOFF_DAY` in `delivery.ts` | LOW | Unused const, but documents business rule (Friday = day 5 cutoff) |
| Type | `AddressLabel` in `address.ts` | LOW | Unused type alias, but documents valid address labels |
| Types | Various `*Insert`, `*Update`, `*Row` in `database.ts` | LOW | Supabase table type aliases -- serve as API contracts even if not directly imported |
| Types | `NotificationChannel`, `NotificationMetadata`, etc. in `analytics.ts` | LOW | Part of notification type system; serve as API contracts |
| Types | `DriversInsert`, `DriversUpdate`, `RoutesInsert`, `RoutesUpdate` in `driver.ts` | LOW | Supabase table type aliases |
| Knip | `useCardInteractions.ts`, `useTiltEffect.ts` (UnifiedMenuItemCard) | FALSE POSITIVE | Imported internally by UnifiedMenuItemCard.tsx; Knip can't trace non-barrel imports |

## Kept (Intentional)

| Type | Item | Reason |
|------|------|--------|
| console.log | `web-vitals.tsx:63` | Dev-only guard: `if (process.env.NODE_ENV === "development")` |
| console.log | `web-vitals.tsx:91` | Dev-only guard with `[Web Vitals]` prefix |
| console.log | `auth/callback/route.ts:66,94` | Prefixed `[Auth Callback]` -- server-side auth flow tracing |
| console.log | `vitals/route.ts:42` | Prefixed `[Vitals API]` -- server-side logging |
| console.log | `useServiceWorker.ts:119,141` | Prefixed `[SW]` and `[Cache]` |
| console.log | `cart-idb-storage.ts:19` | Prefixed `[cart-idb]` -- migration logging |
| console.log | `ServiceWorkerRegistration.tsx:32` | Prefixed `[SW]` |
| console.log | `CategoryTabs.tsx:17` | JSDoc example only (not runtime code) |
| Dependency | `eslint-config-next` | Used via FlatCompat.extends("next/core-web-vitals") -- Knip false positive |
| Dependency | `eslint-config-prettier` | Used via FlatCompat.extends("prettier") -- Knip false positive |
| Dependency | `postcss` | Used by postcss.config.mjs -- Knip false positive |
| CSS tokens | All tokens in `tokens.css` | Conservative: template literal usage (`text-${color}`) makes grep unreliable |
| Database types | All `*Row`, `*Insert`, `*Update` types | API contracts / documentation types |

## Knip Configuration Updates

Updated `knip.json`:
- Removed `@types/*` from `ignoreDependencies` (Knip hint: unnecessary)
- Added `eslint-config-next`, `eslint-config-prettier`, `postcss` to `ignoreDependencies` (FlatCompat false positives)

## Unused Exports (Knip - 283 reported)

Knip reports 283 unused exports. Most are:
- **Barrel re-exports** from `index.ts` files (exported for external consumers, used internally)
- **Default exports** alongside named exports
- **Component props types** exported for documentation
- **Config objects** (motion tokens, design tokens) partially used

These are structural exports that enable clean import patterns. Not actionable without breaking import ergonomics.

## Summary

| Category | Removed | Flagged | Kept |
|----------|---------|---------|------|
| Edge Functions | 2 | 0 | 0 |
| Components/Files | 15 | 0 | 0 |
| Dependencies | 8 | 0 | 3 |
| console.log | 2 (converted) | 0 | 8 |
| API Routes | 0 | 1 | All others |
| Env Vars | 0 | 1 | All others |
| Types | 0 | Many (API contracts) | All |
| CSS Tokens | 0 | 0 | All (conservative) |
| **Total lines removed** | **~3,900** | | |
