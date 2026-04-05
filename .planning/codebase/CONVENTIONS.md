# Coding Conventions

**Analysis Date:** 2026-04-04

## Naming Patterns

**Files:**
- React components: PascalCase (`OrderDetailPanel.tsx`, `RouteStopCard.tsx`)
- Hooks: camelCase with `use` prefix (`useAcceptRoute.ts`, `useReorderStops.ts`)
- Utilities/services: kebab-case (`delivery-dates.ts`, `cart-store.ts`, `origin-check.ts`)
- API routes: `route.ts` (Next.js App Router convention)
- Test files: `__tests__/` subfolder alongside source, same name as source + `.test.ts/.tsx`

**Functions:**
- Exported named functions: PascalCase for components (`OrderDetailPanel`), camelCase for hooks/utils (`useAcceptRoute`, `calculateOrderTotals`)
- Internal helpers: camelCase (`makePtDate`, `fromMock`, `buildRpcPayload`)

**Variables:**
- camelCase (`deliveryFee`, `scheduledDate`, `isAccepting`)
- Underscore prefix for intentionally unused: `_addressId`, `_i`, `_a` (ESLint enforced)
- Constants: SCREAMING_SNAKE_CASE (`DELIVERY_FEE`, `MAX_ITEM_QUANTITY`, `CUTOFF_DAY`)

**Types/Interfaces:**
- `interface` for options/props bags (`UseAcceptRouteOptions`, `OrderDetailPanelProps`, `LogContext`)
- `type` for aliases and unions (`SupabaseClient`, `LogLevel`, `OrderStatus`)
- Database row types: `PascalCase` + `Row` suffix (`MenuItemsRow`, `OrdersRow`, `RouteStopsRow`)
- Zod schemas: camelCase + `Schema` suffix (`createCheckoutSessionSchema`, `checkoutItemSchema`)
- Inferred types from Zod: `z.infer<typeof schemaName>` (`CreateCheckoutSessionInput`, `CheckoutItemInput`)

## Code Style

**Formatting (Prettier):**
- Double quotes (`singleQuote: false`)
- Semicolons required (`semi: true`)
- Print width: 100 characters
- Trailing commas: ES5 style (`trailingComma: "es5"`)

**Linting (ESLint flat config via `eslint.config.mjs`):**
- Extends: `next/core-web-vitals`, `next/typescript`, `prettier`
- Unused vars: `warn` — underscore prefix exempts (`^_` pattern)
- Max file lines: `warn` at 400 lines (excluding `src/types/**`, test files, stories)
- Circular imports: `error` via `eslint-plugin-import-x` (max depth 10)
- Old component paths blocked via `no-restricted-imports` (many consolidated dirs)

**Design Token Enforcement (ESLint `no-restricted-syntax`, error-level):**
- No hardcoded hex colors in Tailwind classes (`bg-[#xxx]`, `text-[#xxx]`)
- No `text-white`/`text-black`/`bg-white`/`bg-black` — use semantic tokens
- No arbitrary pixel font sizes (`text-[Npx]`) — use scale (`text-2xs` through `text-xl`)
- No arbitrary pixel spacing (`p-[Npx]`, `m-[Npx]`, `gap-[Npx]`) — use scale
- No inline `fontSize`/`fontWeight`/`zIndex` numeric style props — use Tailwind classes
- No hardcoded `boxShadow`/`backdropFilter`/`filter` — use `var(--shadow-*)`, `var(--blur-*)`
- No hardcoded `transitionDuration`/`duration-[Nms]` — use `var(--duration-*)` tokens
- No `cssText` assignment — use individual `style.property` for CSP compatibility

## Import Organization

**Order (no enforced auto-sort tool, but consistent in practice):**
1. Framework/Next.js imports (`next/server`, `next/headers`, `react`)
2. Third-party libraries (`stripe`, `date-fns`, `framer-motion`)
3. Internal `@/` alias imports (lib, types, components)
4. Relative `./` sibling imports (helpers, validation, types within same route folder)

**Path Aliases:**
- `@/` maps to `src/` (configured in `tsconfig.json` and `vitest.config.ts`)
- All internal imports use `@/` — no relative cross-directory imports

**`type` imports:**
- `import type { Foo }` used consistently for type-only imports

## Directive Placement

- `"use client"` at top of file (line 1) for any file using hooks, state, events, or browser APIs
- API route files (`src/app/api/**/route.ts`) are server-only — no `"use client"` directive
- Server utility files (`src/lib/supabase/server.ts`) are server-only — no directive needed
- Zustand stores: no `"use client"` directive (store files are module-level, not component files)

## Error Handling

**API Routes:**
- Consistent `errorResponse(code, message, status, details?)` helper pattern (defined per-route in `validation.ts` or `helpers.ts`)
- Returns `NextResponse.json({ error: { code, message, details } }, { status })` shape
- Try/catch wraps entire handler body; caught errors logged via `logger.exception()` and return 500
- Webhook handlers return 500 (not 200) on DB errors to trigger provider retry

**Client Hooks:**
- try/catch with `toast({ type: "error" })` for user-facing errors
- Network errors caught separately from non-ok responses
- Loading state via `useState` (`isAccepting`, `isLoading`) in `finally` block

**Zod Validation:**
- `schema.safeParse(body)` — never `.parse()` directly in handlers
- On failure: return `errorResponse("VALIDATION_ERROR", ..., 400, parsed.error.issues)`

## Logging

**Framework:** Custom `logger` object in `src/lib/utils/logger.ts` — wraps Sentry.

**API:**
```typescript
logger.info("Order confirmed", { orderId, api: "stripe-webhook" });
logger.error("Failed to update order", { orderId, userId, flowId: "checkout" });
logger.exception(error, { userId, flowId, orderId });
```

**Context interface:**
```typescript
interface LogContext {
  userId?: string;
  flowId?: string;
  orderId?: string;
  sessionId?: string;
  api?: string;
  [key: string]: unknown;
}
```

**Rules:**
- Use `logger.*` (never `console.log/error`) in production server code
- `console.*` only in development guards (`if (process.env.NODE_ENV === "development")`)
- Test mocks always no-op: `vi.mock("@/lib/utils/logger", () => ({ logger: { info: vi.fn(), ... } }))`

## Comments

**When to Comment:**
- Bug references: inline `// BUG-02: ...`, `// TZ-05: ...` for traceability
- Architecture decisions: JSDoc block above non-obvious helpers
- Separation sections: `// ── Section Name ───` dividers in large files
- Test groups: `// ===================` section comments in large test files

**JSDoc:**
- Used on exported public API functions (`createMockMenuItem`, `logger.exception`)
- Example in doc: `@example` tag used in `logger` JSDoc
- Interface properties: not typically documented (names are self-describing)

## Function Design

**Size:** Functions kept focused; files warned at 400 lines (ESLint)
**Parameters:** Options object pattern for hooks (`useAcceptRoute({ routeId, onSuccess })`)
**Return Values:**
- Hooks return named object (`{ acceptRoute, isAccepting }`)
- Utilities return typed result objects (`{ isNextWeek, dateString }`)
- API handlers return `NextResponse`

## Module Design

**Exports:**
- Named exports only — no default exports except Next.js page/route files (`export async function POST`, `export default function Page`)
- Barrel files (`index.ts`) for all major directories: `src/lib/hooks/index.ts`, `src/test/factories/index.ts`
- Barrel must re-export ALL original exports (enforced by convention)

**Component Subfolder Pattern (for files approaching 400-line limit):**
```
ComponentName/
  index.tsx          # Barrel — re-exports everything
  SubComponent.tsx   # PascalCase extracted pieces
  useHook.ts         # camelCase, must have "use client"
  helpers.ts         # camelCase pure helpers
  types.ts           # shared types for the component
```
Example: `src/components/ui/admin/orders/OrderDetailPanel/` with `index.tsx`, `OrderDetailPanel.tsx`, `CustomerContactCard.tsx`, `DeliveryInfoCard.tsx`, `types.ts`

**API Route Subfolder Pattern:**
```
route-name/
  route.ts           # Handler (POST/GET/etc)
  helpers.ts         # DB helpers, email senders
  validation.ts      # errorResponse helper, fetch+validate helpers
  types.ts           # Request/response types
  schemas.ts         # Zod schemas (or in validations/)
  __tests__/         # Co-located tests
```
Example: `src/app/api/checkout/session/`

## React Compiler

React Compiler is enabled — do NOT manually add `useMemo`, `useCallback`, or `React.memo`. The compiler auto-memoizes client components. `useCallback` appears in pre-compiler hooks but should not be added to new code.

---

*Convention analysis: 2026-04-04*
