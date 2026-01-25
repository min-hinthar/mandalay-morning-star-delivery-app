# Error History Archive: v1.0 - v1.1

Archived errors from shipped milestones. Reference if similar issues resurface.

---

## 2025-01-17: Sentry not capturing errors in Vercel production
**Type:** Runtime | **Severity:** High
**Files:** `instrumentation-client.ts`, `next.config.ts`, `sentry.server.config.ts`

**Error:** Sentry debug page not triggering test errors in production
**Root Cause:** Next.js 16+ requires `instrumentation-client.ts` instead of `sentry.client.config.ts`
**Fix:** Created `instrumentation-client.ts`, added `global-error.tsx`, added `authToken` for source maps

---

## 2025-01-17: Stripe webhook RLS bypass
**Type:** Runtime | **Severity:** Critical
**Files:** `src/app/api/webhooks/stripe/route.ts`, `src/lib/supabase/server.ts`

**Error:** Orders stuck in "pending" after successful Stripe payment
**Root Cause:** Webhook used anon key which couldn't update orders due to RLS
**Fix:** Created `createServiceClient()` using service role key

---

## 2025-01-17: Missing order_id in Stripe checkout metadata
**Type:** Runtime | **Severity:** High
**Fix:** Ensure order is created first, then pass `order.id` to Stripe session metadata

---

## 2025-01-17: Missing Alert/AlertDialog UI components
**Type:** TypeScript | **Severity:** Medium
**Fix:** Created alert.tsx and alert-dialog.tsx, installed `@radix-ui/react-alert-dialog`

---

## 2025-01-17: Wrong import path for cn utility
**Type:** TypeScript | **Severity:** Low
**Fix:** Use `@/lib/utils/cn` not `@/lib/utils`

---

## 2025-01-17: Sentry debug API not sending events
**Type:** Runtime | **Severity:** Medium
**Fix:** Added `await Sentry.flush(2000)` before returning response

---

## 2026-01-18: Next.js Dynamic Route Slug Conflict
**Type:** Build | **Severity:** High
**Error:** `You cannot use different slug names for the same dynamic path`
**Fix:** Use consistent param names (`[id]` everywhere, not mixed `[id]` and `[orderId]`)

---

## 2026-01-20: Barrel Import Path Casing Mismatch After File Rename
**Type:** TypeScript | **Severity:** Medium
**Error:** `TS1261: Already included file name differs only in casing`
**Fix:** Update barrel import paths to match actual file casing after renames

---

## 2026-01-20: Module Export Chain Failures After Bulk Rename
**Type:** TypeScript | **Severity:** Medium
**Fix:** Update barrel exports to use actual names with aliases for backward compatibility

---

## 2026-01-20: Import Name Collision Causing Circular Reference
**Type:** TypeScript | **Severity:** Medium
**Fix:** Use import aliases when imported name might conflict with local variables

---

## 2026-01-18: Signout Button Not Working (Form in Radix Dropdown)
**Type:** Runtime | **Severity:** High
**Root Cause:** Radix `<DropdownMenuItem>` swallows form submit events
**Fix:** Use `onSelect` handler with direct function calls, not `<form>`

---

## 2026-01-18: CheckoutLayout Step Count Mismatch
**Type:** TypeScript | **Severity:** Medium
**Fix:** Single source of truth for shared constants in types file

---

## 2026-01-18: Stylelint Config for Tailwind 4
**Type:** Config | **Severity:** Low
**Fix:** Add Tailwind 4 directives to `ignoreAtRules`: `@theme`, `@custom-variant`, `@utility`, `@config`

---

*Archived: 2026-01-24*
