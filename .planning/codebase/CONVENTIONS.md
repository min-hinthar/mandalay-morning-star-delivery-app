# Coding Conventions

**Analysis Date:** 2026-03-19

## Naming Patterns

**Files:**
- React components: `PascalCase.tsx` (`RouteStopCard.tsx`, `ItemDetailSheet.tsx`)
- Hooks: `camelCase` prefixed with `use` (`useAcceptRoute.ts`, `useDeliveryGate.ts`)
- Utilities: `kebab-case.ts` (`delivery-dates.ts`, `delivery-zones.ts`, `route-optimization.ts`)
- Test directories: `__tests__/` co-located with the code under test
- Test files: match source filename with `.test.ts` / `.test.tsx` suffix (`delivery-dates.test.ts`)
- API routes: `route.ts` (Next.js convention), siblings named `helpers.ts`, `validation.ts`, `types.ts`, `schemas.ts`

**Functions:**
- Exported utilities: `camelCase` (`calculateDeliveryFee`, `getNextDeliveryDate`, `isPastCutoffForDay`)
- Hooks: `usePascalCase` (`useAcceptRoute`, `useSplitRoute`)
- Named exports only — no default exports for utilities or hooks
- Factory helpers in tests: `createMock*` pattern (`createMockMenuItem`, `createMockAddress`, `createMockOrder`)

**Variables:**
- `camelCase` throughout
- `SCREAMING_SNAKE_CASE` for module-level constants (`DELIVERY_FEE`, `FREE_THRESHOLD`, `MOCK_DELIVERY_DAYS`)
- Underscore prefix for intentionally unused params: `_addressId`, `_i`, `_a` (enforced by ESLint `argsIgnorePattern: "^_"`)

**Types/Interfaces:**
- `PascalCase` for types and interfaces (`DeliveryDayConfig`, `UseAcceptRouteOptions`, `CheckoutError`)
- `type` preferred over `interface` in most cases
- DB row types suffixed with `Row` (`MenuItemsRow`, `OrdersRow`, `ModifierOptionsRow`) — auto-generated from Supabase

**DB/API:**
- DB columns: `snake_case` (Supabase/Postgres convention)
- Mapped to `camelCase` at the service/settings boundary (`day_of_week` → `dayOfWeek`, `is_active` → `isActive`)
- Error codes: `SCREAMING_SNAKE_CASE` strings (`CUTOFF_PASSED`, `OUT_OF_COVERAGE`, `ITEM_UNAVAILABLE`, `INTERNAL_ERROR`)

## Code Style

**Formatting (Prettier):**
- `printWidth: 100`
- `singleQuote: false` — double quotes
- `semi: true`
- `trailingComma: "es5"`

**Linting (ESLint flat config `eslint.config.mjs`):**
- Extends `next/core-web-vitals`, `next/typescript`, `prettier`
- `max-lines: 400` warning on all `src/**/*.ts(x)` except `src/types/**`, test files, Storybook stories
- `import-x/no-cycle` error — circular dependencies blocked (maxDepth: 10)
- `no-restricted-imports` error on all old component paths (consolidated to `@/components/ui/`)
- Design token enforcement via `no-restricted-syntax` (colors, spacing, shadows, blur, z-index, typography, motion duration)

**Path Aliases:**
- `@/` → `src/` (configured in `vitest.config.ts` and `tsconfig.json`)
- Import from barrel `index.ts` when available (`@/components/ui`, `@/lib/hooks`)

## Import Organization

**Order (enforced by Prettier/ESLint):**
1. External packages (`react`, `next/server`, `vitest`)
2. Internal aliased imports (`@/lib/...`, `@/types/...`, `@/components/...`)
3. Relative imports (`./helpers`, `../delivery-dates`)

**Client Directive:**
- `"use client"` required at top of any file using hooks, event handlers, or browser APIs
- Every extracted subfolder file using hooks needs `"use client"` (enforced by project docs)

**Barrel Exports:**
- `index.ts` / `index.tsx` re-exports ALL original exports from the subfolder
- `src/lib/hooks/index.ts` exports all 30+ hooks
- Do not import from internal barrel of same directory — import siblings directly

## Error Handling

**API Routes pattern — `try/catch` wrapping entire handler:**
```typescript
export async function POST(request: Request) {
  try {
    // ...business logic
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    logger.exception(error, { api: "route-name" });
    if (error instanceof SpecificError) {
      return errorResponse("STRIPE_ERROR", "Payment service error", 500);
    }
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
```

**Typed error responses via `errorResponse` helper (`src/app/api/checkout/session/validation.ts`):**
```typescript
export function errorResponse(code: CheckoutErrorCode, message: string, status: number, details?: unknown) {
  const error: CheckoutError = { code, message, details };
  return NextResponse.json({ error }, { status });
}
```

**Cleanup operations — each step independently try/caught:**
```typescript
// BUG-03 pattern: independent cleanup, failures logged not thrown
try { await supabase.from("order_item_modifiers").delete()... } catch (e) { logger.exception(e, ctx); }
try { await supabase.from("order_items").delete()... } catch (e) { logger.exception(e, ctx); }
try { await supabase.from("orders").delete()... } catch (e) { logger.exception(e, ctx); }
```

**Client-side hooks — try/catch with toast error, finally clears loading:**
```typescript
const acceptRoute = useCallback(async () => {
  setIsAccepting(true);
  try {
    const response = await fetch(...);
    if (!response.ok) {
      toast({ message: "...", type: "error" });
      return;
    }
    toast({ message: "Route accepted!", type: "success" });
    onSuccess?.();
  } catch {
    toast({ message: "...", type: "error" });
  } finally {
    setIsAccepting(false);
  }
}, [routeId, onSuccess]);
```

**Zod validation — `safeParse` + early return:**
```typescript
const parsed = createCheckoutSessionSchema.safeParse(body);
if (!parsed.success)
  return errorResponse("VALIDATION_ERROR", "Invalid request data", 400, parsed.error.issues);
```

**Webhook handlers — return 500 on DB errors for retry, never swallow into 200** (see `src/app/api/webhooks/stripe/handlers.ts`).

## Logging

**Framework:** `logger` from `@/lib/utils/logger` (Sentry-backed)

**Methods:** `logger.info()`, `logger.warn()`, `logger.error()`, `logger.exception(error, context)`

**Patterns:**
- `logger.exception(error, { api: "route-name", userId, flowId })` on caught errors
- `logger.info("Action completed", { userId, orderId })` on success paths
- `logger.warn()` for non-fatal issues (rate limits, missing optional data)
- Tests mock logger with no-op: `vi.mock("@/lib/utils/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), exception: vi.fn() } }))`

## Comments

**Bug fix comments:** `// BUG-XX FIX:` followed by explanation (e.g., `// BUG-03 FIX: Independent cleanup`)
**Security comments:** `// CHKT-01: Server-authoritative pricing` labeling deliberate design decisions
**Test labels:** `describe("BUG-07: cutoff safety buffer", ...)` tie tests to tracked bugs
**TSDoc:** Used sparingly on exported utility functions; not required on hooks

## Function Design

**Size:** Max 400 lines per file (ESLint warning). Hooks and utilities stay focused; split into subfolder when needed.

**Parameters:** Options object pattern for hooks with multiple params:
```typescript
interface UseAcceptRouteOptions { routeId: string; onSuccess?: () => void; }
export function useAcceptRoute({ routeId, onSuccess }: UseAcceptRouteOptions) { ... }
```

**Return Values:**
- Hooks return named object: `{ acceptRoute, isAccepting }`
- Utilities return typed objects: `{ isOpen, urgency, deliveryDate, timeUntilCutoff, cutoffDate }`
- Validation functions return `{ valid: boolean, errors: ..., items: ... }`

## Module Design

**Exports:** Named exports throughout; no default exports for utilities, hooks, or components
**Barrel Files:** Always present for directories with 3+ files (`src/lib/hooks/index.ts`, `src/components/ui/*/index.tsx`)
**No circular imports:** `import-x/no-cycle` enforced at error level

## Validation Patterns

**Server-side (Zod schemas in `src/lib/validations/`):**
- Schema files named after domain: `checkout.ts`, `route.ts`, `driver-api.ts`, `analytics.ts`
- Schema variable: `createXxxSchema`, `xxxSchema`
- All UUIDs validated with `z.string().uuid()`
- Dates validated as `YYYY-MM-DD` string regex
- Times validated as `HH:MM` (24h) string regex
- Client-submitted prices stripped (`basePriceCents`, `priceDeltaCents` — server authoritative)

**Delivery-specific validations:**
- `isPastCutoffForDay(deliveryDate, dayConfig, now)` — includes 10s safety buffer
- `isPastCutoff(deliveryDate, now, cutoffDay, cutoffHour)` — legacy single-day version
- Time windows validated against `generateTimeWindows()` output before accepting checkout

---

*Convention analysis: 2026-03-19*
