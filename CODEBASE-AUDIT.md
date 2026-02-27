# Codebase Deep-Dive Audit Report

**Date:** 2026-02-26
**Scope:** Full codebase — 973 TS/TSX files, 92 API routes, 44 pages, 6 layouts
**Stack:** Next.js 16 | React 19 | Supabase | Stripe | Tailwind 4 | Zustand | Framer Motion

---

## Table of Contents

1. [Critical Issues (Fix Immediately)](#1-critical-issues)
2. [Security Vulnerabilities](#2-security-vulnerabilities)
3. [Dead Code & Unwired Code](#3-dead-code--unwired-code)
4. [Architecture & Routing Gaps](#4-architecture--routing-gaps)
5. [State Management Issues](#5-state-management-issues)
6. [Test Coverage Gaps](#6-test-coverage-gaps)
7. [Performance Concerns](#7-performance-concerns)
8. [CI/CD & Tooling Gaps](#8-cicd--tooling-gaps)
9. [Code Quality & Consistency](#9-code-quality--consistency)
10. [Recommendations Priority Matrix](#10-recommendations-priority-matrix)

---

## 1. Critical Issues

### 1.1 Missing Root Middleware (Session Refresh Broken)

**Severity:** CRITICAL
**File:** `src/middleware.ts` — DOES NOT EXIST

The Supabase session refresh function is defined at `src/lib/supabase/middleware.ts` but **never invoked**. No root-level `middleware.ts` exists to call `updateSession()`.

**Impact:**

- Auth tokens may expire mid-session without refresh
- No cross-cutting session management
- Middleware-level route gating defined but not wired

**Fix:** Create `src/middleware.ts`:

```typescript
import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

### 1.2 Debug Endpoint Unprotected in Production

**Severity:** CRITICAL
**File:** `src/app/api/debug/sentry/route.ts`

No authentication check. Anyone can trigger Sentry error reports, potentially spamming your Sentry quota.

**Fix:** Add `requireAdmin()` guard or restrict to `NODE_ENV === "development"`.

### 1.3 Cron Endpoint Fails Open

**Severity:** HIGH
**File:** `src/app/api/cron/delivery-reminders/route.ts`

If `CRON_SECRET` env var is not configured, the endpoint accepts **any** request:

```typescript
function isAuthorized(request: Request): boolean {
  if (!CRON_SECRET) return true; // ← DANGEROUS
}
```

**Fix:** Reject if secret not configured in production.

---

## 2. Security Vulnerabilities

### 2.1 CSP Allows unsafe-inline and unsafe-eval

**File:** `next.config.ts:46`

Google Maps requires `unsafe-inline` and `unsafe-eval` in `script-src`. This weakens XSS protection.

**Recommendation:** Investigate CSP nonce strategy for inline scripts. Not urgent but should be on the roadmap.

### 2.2 dangerouslySetInnerHTML in Admin Email Preview

**File:** `src/components/ui/admin/orders/OrderDetailPage/ManualEmailDialog.tsx:207`

```tsx
dangerouslySetInnerHTML={{ __html: htmlBody + footerHtml }}
```

The `htmlBody` comes from TipTap editor (admin-only). Risk is low since only admins compose emails, but a compromised admin account could inject XSS into email previews.

**Recommendation:** Sanitize HTML with DOMPurify before rendering.

### 2.3 Shared Tracking Links Have No Expiration

**File:** `src/app/api/tracking/[orderId]/route.ts`

`?shared=true` allows unauthenticated access to order details. While order IDs are UUIDv4 (brute-force infeasible), there's no TTL on shared links.

**Recommendation:** Add signed, time-limited tokens for shared tracking URLs.

### 2.4 Weak Validation on Admin Email Send

**File:** `src/app/api/admin/emails/send/route.ts`

Uses loose object destructuring instead of Zod validation:

```typescript
const { orderId, emailType } = body as { orderId?: string; emailType?: string };
```

**Fix:** Add proper Zod schema validation like all other routes.

---

## 3. Dead Code & Unwired Code

### 3.1 Entire `navigation/` Directory is Dead Code

**Path:** `src/components/ui/navigation/` (6 files)

| File                | Lines | Status         |
| ------------------- | ----- | -------------- |
| `Header.tsx`        | ~200  | Never imported |
| `BottomNav.tsx`     | ~100  | Never imported |
| `AppShell.tsx`      | ~100  | Never imported |
| `PageContainer.tsx` | ~50   | Never imported |
| `MobileMenu.tsx`    | ~100  | Never imported |
| `index.ts`          | ~10   | Never imported |

**Action:** Delete entire directory. These were replaced by `AppHeader`, `MobileDrawer`, and layout components.

### 3.2 `useScrollDirection` Hook — Superseded

**File:** `src/lib/hooks/useScrollDirection.ts`

Only used by the dead `navigation/Header.tsx` and `menu/MenuHeader.tsx`. The codebase has moved to `useScrollDirectionWithVelocity` (used via `useHeaderVisibility`).

**Action:** Verify MenuHeader usage, then remove if only the dead Header uses it.

### 3.3 Duplicate Toast Systems

**Files:**

- `src/lib/hooks/useToast.ts` — Legacy V5/V6 API (35 importers)
- `src/lib/hooks/useToastV8.ts` — Current V8 API with sound support (11 importers)

Two nearly identical implementations coexist. `useToast` has 3x more importers but `useToastV8` is the newer, richer version.

**Action:** Migrate all 35 `useToast` consumers to `useToastV8`, then remove the legacy hook.

### 3.4 Duplicate Stagger Animation Libraries

**Files:**

- `src/lib/micro-interactions/stagger.ts`
- `src/lib/motion-tokens/stagger.ts`

Both export container stagger functions with different APIs but identical purpose.

**Action:** Consolidate into one, document which is canonical.

### 3.5 Duplicate StarRating Components

**Files:**

- `src/components/ui/orders/tracking/StarRating.tsx` (85 lines, simple)
- `src/components/ui/admin/analytics/StarRating.tsx` (226 lines, animated)

Different interfaces, different feature sets. Should be one shared component.

### 3.6 Hooks Missing from Barrel Export

9 hooks are implemented and actively used but **missing from `src/lib/hooks/index.ts`**:

| Hook                        | Consumers |
| --------------------------- | --------- |
| `useCartValidation`         | 6         |
| `useFavorites`              | 14        |
| `useSoundEffect`            | 8         |
| `useDriverRating`           | 4         |
| `useSoundPreference`        | 4         |
| `useFontSize`               | 5         |
| `useRateLimitToast`         | 2         |
| `useThemeTransition`        | 3         |
| `useDynamicImportWithRetry` | 1         |

**Action:** Add all 9 to the barrel export for consistency.

---

## 4. Architecture & Routing Gaps

### 4.1 Customer Layout Has No Auth Guard

**File:** `src/app/(customer)/layout.tsx`

Unlike `(admin)` and `(driver)` layouts which have server-side auth gates, the `(customer)` layout is a plain client component with no auth check. Each page handles auth individually, creating:

- Inconsistent protection patterns
- Late auth checks (after hydration for client pages like `/checkout`)
- `/cart` page has **zero** auth protection

**Recommendation:** Add server-side auth guard to `(customer)/layout.tsx` matching the admin/driver pattern.

### 4.2 Auth Redirect Parameter Inconsistency

Some pages redirect to `/login?next=/path`, others to `/login?redirect=/path`. The login page must handle both or one silently fails.

| Pattern      | Used By                                 |
| ------------ | --------------------------------------- |
| `?next=`     | Admin layout, driver layout, middleware |
| `?redirect=` | Checkout page, account page             |

**Fix:** Standardize on one parameter name.

### 4.3 Missing Error Boundaries (16 routes)

Routes with **no `error.tsx`**:

- `(customer)/cart`
- `(driver)/driver/schedule`, `/earnings`, `/history`, `/profile`
- `(admin)/admin/categories`, `/photos`, `/sections`, `/emails`, `/profile`, `/settings`
- `(admin)/admin/menu/[id]`, `/orders/[id]`, `/drivers/[id]`, `/routes/[id]`
- `(driver)/driver/route/[stopId]`

### 4.4 Missing Loading States (9 routes)

Routes with **no `loading.tsx`**:

- `(customer)/orders/[id]` (detail)
- `(customer)/orders/[id]/confirmation`
- `(customer)/orders/[id]/feedback`
- `(driver)/driver/schedule`
- `(driver)/driver/earnings` (has loading.tsx ✓)
- `(driver)/driver/history` (has loading.tsx ✓)
- `(driver)/driver/profile`

### 4.5 Missing `not-found.tsx` Boundaries

Only exists at: root, `(admin)/admin`, `(admin)/admin/orders/[id]`, `(driver)/driver`.

Missing for: `(customer)` group, `(public)` group, most dynamic `[id]` routes.

---

## 5. State Management Issues

### 5.1 Race Conditions

**`useOfflineSync.ts`** — Lines 79-91:

- `pendingCounts` not in dependency array of `updatePendingCounts`
- State set after potential unmount (no mounted ref check)
- Catch block uses stale closure value
- `eslint-disable react-hooks/exhaustive-deps` suppresses the warning

**`useLocationTracking.ts`** — Lines 80-131:

- `sendLocationUpdate` doesn't check if tracking was stopped
- `updateTimeoutRef.current` can fire after `stopTracking()` returns
- Stale timeout sends location updates for no active route

**`useTrackingSubscription.ts`** — Lines 176-231:

- `setupSubscriptions` called recursively on reconnect
- If reconnect happens before old channel cleanup completes, multiple channels accumulate

### 5.2 Over-Memoization in useCart

**File:** `src/lib/hooks/useCart.ts`

13-item dependency array on `useMemo`. Every state change triggers re-evaluation. With React Compiler enabled, manual memoization is unnecessary and could be removed.

### 5.3 Checkout Store Missing Completion Reset

**File:** `src/lib/stores/checkout-store.ts`

`reset()` must be called manually. If user completes checkout and navigates away without the cleanup effect firing, stale state persists.

---

## 6. Test Coverage Gaps

### 6.1 Coverage Summary

| Category          | Count | Tested    | Gap           |
| ----------------- | ----- | --------- | ------------- |
| API Routes        | 92    | 3 (3.3%)  | 89 untested   |
| React Hooks       | 40+   | 1 (2.5%)  | 39+ untested  |
| Zustand Stores    | 4     | 2 (50%)   | 2 untested    |
| Utility Functions | 20+   | 8 (40%)   | 12+ untested  |
| E2E Specs         | N/A   | 18 suites | Good coverage |

### 6.2 Critical Untested Business Logic

| Feature               | Risk   | Files                               |
| --------------------- | ------ | ----------------------------------- |
| Order cancellation    | HIGH   | `api/orders/[id]/cancel`            |
| Payment retry         | HIGH   | `api/orders/[id]/retry-payment`     |
| Refund processing     | HIGH   | `api/admin/orders/[id]/refund`      |
| Driver management     | HIGH   | All 8+ `api/admin/drivers/*` routes |
| Rate limiting         | MEDIUM | `src/lib/rate-limit/`               |
| Offline sync (driver) | MEDIUM | `src/lib/services/offline-store/`   |
| Auth/session handling | MEDIUM | No unit tests for auth flows        |

### 6.3 Positive Notes

- Checkout session route has excellent validation tests
- Stripe webhook has comprehensive idempotency tests
- Tracking API has thorough schema validation tests
- E2E coverage is strong (18 Playwright specs, ~6,500 lines)
- No skipped tests (`.skip`, `.todo`, `.only`) — clean suite

---

## 7. Performance Concerns

### 7.1 Components Over 400-Line Limit

| File                                          | Lines | Action                                     |
| --------------------------------------------- | ----- | ------------------------------------------ |
| `homepage/SettingsNudgeBanner.tsx`            | 452   | Split into subfolder                       |
| `menu/ItemDetailSheet.tsx`                    | 451   | Split into subfolder                       |
| `orders/tracking/ETACountdown.tsx`            | 449   | Split into subfolder                       |
| `orders/tracking/DeliveryMap/DeliveryMap.tsx` | 422   | Already in subfolder, needs internal split |
| `admin/drivers/DriverDetailClient.tsx`        | 413   | Split helpers                              |
| `admin/settings/DeliverySettingsForm.tsx`     | 407   | Split sections                             |
| `admin/sections/ItemSelector.tsx`             | 402   | Extract subcomponents                      |

### 7.2 Console Statements in Production Code

69 `console.log/warn/error` occurrences across 34 files. `next.config.ts` strips `console.log` in production but `console.warn` and `console.error` remain.

**Recommendation:** Replace remaining calls with the structured `logger` utility.

### 7.3 React.memo Not Used

0 files use `React.memo`. With React Compiler enabled (`reactCompiler: true`), manual memoization is unnecessary — the compiler handles it. This is **correct** for this stack.

---

## 8. CI/CD & Tooling Gaps

### 8.1 Missing CI Jobs

| Job                        | Status    | Impact                         |
| -------------------------- | --------- | ------------------------------ |
| E2E Tests (Playwright)     | NOT IN CI | Config exists, not run         |
| Dead Code Detection (Knip) | NOT IN CI | `knip.json` exists, not run    |
| Security Audit             | NOT IN CI | No `npm audit` or Snyk         |
| Bundle Size Check          | NOT IN CI | `@next/bundle-analyzer` exists |

### 8.2 Knip Config Has Narrow Entry Points

**File:** `knip.json`

```json
"entry": ["src/app/**/*.{ts,tsx}", "src/components/**/index.ts", "src/lib/**/index.ts"]
```

Misses:

- API routes under `src/app/api/**`
- Files imported directly (not through barrel exports)
- Script files in `scripts/`

### 8.3 Lint-Staged Incomplete

**File:** `package.json` lint-staged config

- Has ESLint + Stylelint on commit
- Missing: Prettier formatting (only checked in CI, not fixed on commit)
- Missing: TypeScript check on staged files

### 8.4 ESLint Consolidation Guards Are Stale

**File:** `eslint.config.mjs`

15+ import restrictions guard against importing from old paths (`@/components/ui-v8`, etc.) that no longer exist in the codebase. These add noise and confusion.

**Action:** Audit and remove expired guards.

### 8.5 Z-Index Strategy Conflict

- Stylelint forbids numeric z-index values
- Tailwind 4 can't generate custom z-index utility classes
- ESLint acknowledges this in a comment but the conflict remains

Current workaround: `zClass` utility from `src/lib/design-system/tokens/z-index.ts`. But not all developers may know to use it.

---

## 9. Code Quality & Consistency

### 9.1 No `as any` Type Assertions

Excellent — zero `as any` in the entire codebase. TypeScript discipline is strong.

### 9.2 No `@ts-ignore` or `@ts-expect-error`

Excellent — zero suppression comments. All type issues are resolved properly.

### 9.3 Only 1 TODO Comment

**File:** `src/components/ui/homepage/SiteFooter.tsx:56`

```typescript
// TODO: Replace with verified Yelp business page URL once confirmed
```

Minimal tech debt markers.

### 9.4 eslint-disable Usage (46 instances)

Most are justified:

- `@next/next/no-img-element` — Dynamic external URLs (Google avatar, Supabase storage)
- `no-restricted-syntax` — Framer Motion requires numeric boxShadow/z-index for interpolation
- `react-hooks/exhaustive-deps` — 4 instances, some hiding real bugs (see Section 5.1)

### 9.5 Env Var Documentation Gap

**File:** `src/lib/health/env.ts`

Missing validation for env vars used in code:

- `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
- `RESEND_WEBHOOK_SECRET`

---

## 10. Recommendations Priority Matrix

### P0 — Fix Immediately (Security/Correctness)

| #   | Issue                                                   | Effort | Section |
| --- | ------------------------------------------------------- | ------ | ------- |
| 1   | Create root `src/middleware.ts` to wire session refresh | 15 min | 1.1     |
| 2   | Protect `/api/debug/sentry` endpoint                    | 5 min  | 1.2     |
| 3   | Fix cron endpoint fail-open behavior                    | 5 min  | 1.3     |
| 4   | Add Zod validation to `/api/admin/emails/send`          | 15 min | 2.4     |

### P1 — Fix Soon (Architecture/Reliability)

| #   | Issue                                                   | Effort | Section |
| --- | ------------------------------------------------------- | ------ | ------- |
| 5   | Add auth guard to `(customer)` layout                   | 30 min | 4.1     |
| 6   | Standardize auth redirect params (`next` vs `redirect`) | 20 min | 4.2     |
| 7   | Fix `useOfflineSync` race condition                     | 15 min | 5.1     |
| 8   | Fix `useLocationTracking` stale timeout                 | 10 min | 5.1     |
| 9   | Fix `useTrackingSubscription` channel accumulation      | 15 min | 5.1     |
| 10  | Add error boundaries to 16 routes                       | 1 hr   | 4.3     |
| 11  | Add loading states to 6 routes                          | 45 min | 4.4     |
| 12  | Add missing hooks to barrel export                      | 10 min | 3.6     |

### P2 — Fix When Possible (Code Health)

| #   | Issue                                         | Effort | Section |
| --- | --------------------------------------------- | ------ | ------- |
| 13  | Delete dead `navigation/` directory (6 files) | 5 min  | 3.1     |
| 14  | Consolidate dual toast systems                | 2 hrs  | 3.3     |
| 15  | Consolidate duplicate StarRating components   | 1 hr   | 3.5     |
| 16  | Consolidate duplicate stagger animation libs  | 30 min | 3.4     |
| 17  | Split 7 oversized components (>400 lines)     | 2 hrs  | 7.1     |
| 18  | Replace console.\* calls with logger utility  | 1 hr   | 7.2     |
| 19  | Remove stale ESLint consolidation guards      | 30 min | 8.4     |
| 20  | Add E2E tests to CI pipeline                  | 1 hr   | 8.1     |
| 21  | Add Knip dead code detection to CI            | 30 min | 8.1     |

### P3 — Roadmap Items

| #   | Issue                                       | Effort | Section |
| --- | ------------------------------------------- | ------ | ------- |
| 22  | Write tests for 89 untested API routes      | Days   | 6.2     |
| 23  | Sanitize HTML in email preview (DOMPurify)  | 30 min | 2.2     |
| 24  | Add signed tokens for shared tracking links | 2 hrs  | 2.3     |
| 25  | Investigate CSP nonce strategy              | 4 hrs  | 2.1     |
| 26  | Sync env validation with actual usage       | 30 min | 9.5     |

---

## Overall Assessment

**Strengths:**

- Excellent TypeScript discipline (zero `any`, zero `ts-ignore`)
- Strong server-side price calculation (never trusts client)
- Comprehensive Zod validation on critical routes
- Multi-tiered rate limiting with fail-safe
- Robust Stripe webhook idempotency
- Well-structured design system with token enforcement
- Good security headers (CSP, HSTS, X-Frame-Options)
- React Compiler enabled (eliminates manual memoization)
- Strong E2E test coverage (18 Playwright specs)

**Weaknesses:**

- Missing root middleware (session refresh not wired)
- Customer routes lack consistent auth protection
- Only 3 of 92 API routes have unit tests
- Several race conditions in hooks
- Dead code accumulating (navigation/, dual toast, dual stagger)
- CI pipeline missing E2E tests and dead code detection
- Auth redirect parameter naming inconsistent

**Verdict:** The codebase is well-architected for a production delivery app with strong security fundamentals. The 4 P0 issues should be addressed immediately. The dead code and consistency issues are typical of a rapidly evolving project at v1.8 and can be cleaned up incrementally.
