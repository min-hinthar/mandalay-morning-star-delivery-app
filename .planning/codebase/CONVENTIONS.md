# Coding Conventions

**Analysis Date:** 2026-03-06

## Naming Patterns

**Files:**
- UI primitives (shadcn-based): `kebab-case.tsx` (e.g., `alert-dialog.tsx`, `scroll-area.tsx`)
- Custom UI components: `PascalCase.tsx` (e.g., `EmptyState.tsx`, `FloatingLabelInput.tsx`, `Backdrop.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g., `useDeliveryGate.ts`, `useCart.ts`)
- Utilities: `camelCase.ts` (e.g., `cn.ts`, `logger.ts`)
- Stores: `kebab-case.ts` suffixed with `-store` (e.g., `cart-store.ts`, `driver-store.ts`)
- Validations: `kebab-case.ts` matching domain (e.g., `checkout.ts`, `driver-api.ts`)
- API routes: `route.ts` (Next.js App Router convention)
- Test files: `*.test.ts` or `*.test.tsx` inside `__tests__/` subdirectory

**Functions:**
- Use `camelCase` for all functions: `computeDeliveryGate`, `calculateItemPrice`, `createItemSignature`
- Factory functions: prefix with `create` (e.g., `createMockStripeClient`, `createMockMenuItem`)
- Boolean helpers: prefix with `is`, `has`, `should` (e.g., `isOpen`, `shouldAnimate`)
- API route handlers: export named `GET`, `POST`, `PUT`, `PATCH`, `DELETE` (Next.js convention)

**Variables:**
- Use `camelCase` for all variables
- Constants: `SCREAMING_SNAKE_CASE` for module-level constants (e.g., `MAX_ITEM_QUANTITY`, `DEBOUNCE_MS`, `DELIVERY_FEE`)
- Database row types use `snake_case` fields; app-layer types use `camelCase` fields

**Types:**
- Use `PascalCase` for all types and interfaces
- Suffix row types with `Row` (e.g., `MenuItemRow`, `ModifierOptionRow`)
- Database-generated types: `MenuItemsRow`, `ModifierOptionsRow` (from `@/types/database`)
- Domain types: `MenuItem`, `CartItem`, `DeliveryGateState`
- Input types: `CreateCheckoutSessionInput`, `ReassignStopInput`
- Zod schemas: `camelCase` suffixed with `Schema` (e.g., `createCheckoutSessionSchema`, `reassignStopSchema`)

## Code Style

**Formatting:**
- Prettier with config at `.prettierrc`
- Double quotes (not single quotes)
- Semicolons: always
- Print width: 100 characters
- Trailing commas: `es5`
- Run: `pnpm format:check`

**Linting:**
- ESLint 9 flat config at `eslint.config.mjs`
- Extends: `next/core-web-vitals`, `next/typescript`, `prettier`
- `import-x/no-cycle` enforced (max depth 10) to prevent circular dependencies
- `max-lines` warning at 400 lines (skip blank lines and comments)
- Underscore-prefixed unused vars allowed: `_error`, `_request`
- CSS linting: Stylelint with `stylelint-config-standard`
- Run: `pnpm lint && pnpm lint:css`

**TypeScript:**
- Strict mode enabled in `tsconfig.json`
- `noUnusedLocals` and `noUnusedParameters` enforced
- Path alias: `@/*` maps to `./src/*`
- Target: ES2017

**File Size:**
- Max 400 lines per file (ESLint warning, not error)
- Exempt: `src/types/**`, test files, Storybook stories
- When splitting, use subfolder with barrel `index.tsx` re-exporting all

## Import Organization

**Order:**
1. React / React DOM
2. Third-party packages (`next/server`, `zustand`, `zod`, `framer-motion`, etc.)
3. Internal absolute imports using `@/` alias (`@/lib/`, `@/components/`, `@/types/`)
4. Relative imports (co-located files)

**Path Aliases:**
- `@/*` -> `./src/*` (the only alias)

**Restricted Imports (ESLint enforced):**
- Consolidated directories are blocked with error-level rules
- All components must import from `@/components/ui/*` (not old `@/components/menu/*`, `@/components/admin/*`, etc.)
- Contexts: import from `@/app/contexts` (not `@/contexts`)
- Design system: import from `@/lib/design-system` (not `@/design-system`)

## Error Handling

**API Routes:**
- Wrap entire handler in `try/catch`
- Return structured error responses: `{ error: { code: string, message: string } }`
- Use HTTP status codes correctly: 400, 401, 403, 404, 500
- Error codes are `SCREAMING_SNAKE_CASE`: `"UNAUTHORIZED"`, `"NOT_FOUND"`, `"INTERNAL_ERROR"`, `"FORBIDDEN"`
- Log exceptions via `logger.exception(error, context)` in catch blocks
- Example pattern from `src/app/api/menu/route.ts`:
  ```typescript
  try {
    // ... handler logic
  } catch (error) {
    logger.exception(error, { api: "menu" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch menu" } },
      { status: 500 }
    );
  }
  ```

**Auth Checks:**
- Check `supabase.auth.getUser()` at top of protected routes
- Return 401 with `UNAUTHORIZED` code if no user
- Return 403 with `FORBIDDEN` code for role mismatch

**Rate Limiting:**
- Call `checkRateLimit()` early in route handler
- Return `rl.response` directly if `rl.limited` is true
- Different limiters: `publicReadLimiter`, `apiWriteLimiter`, `webhookLimiter`

**Zod Validation:**
- Use `.safeParse()` and check `result.success`
- Return 400 with validation errors if parsing fails

## Logging

**Framework:** Custom structured logger at `src/lib/utils/logger.ts` wrapping Sentry

**Patterns:**
- Use `logger.info()`, `logger.warn()`, `logger.error()`, `logger.debug()`
- Use `logger.exception(error, context)` for caught exceptions (sends to Sentry)
- Always include context object: `{ orderId, userId, api: "route-name" }`
- Never use raw `console.log` in production code (exception: dev-only warnings in components)

## Comments

**When to Comment:**
- Section dividers using `// ===...===` bars for major code sections
- JSDoc on exported functions and complex interfaces
- Inline comments for business logic rationale
- Bug fix references: `// BUG-06 fix`, `// TST-01`, `// CHKT-01`
- Phase references in ESLint rules: `// Phase 26`, `// Phase 33`, etc.

**JSDoc/TSDoc:**
- Use `/** */` on exported functions, especially hooks and utilities
- Include `@example` blocks where helpful (see `src/lib/utils/logger.ts`)
- Component props get `/** description */` inline on each property

## Function Design

**Size:** Functions should be focused and small. Extract helpers for complex logic. Max file size 400 lines forces function decomposition.

**Parameters:**
- Use typed objects for 3+ parameters
- API route params: `{ params }: RouteParams` with `RouteParams` having `params: Promise<{ id: string }>`
- Optional parameters use `?` or have defaults

**Return Values:**
- API routes return `NextResponse.json()`
- Hooks return typed state objects
- Pure functions exported separately from hooks for testability (e.g., `computeDeliveryGate` is pure, `useDeliveryGate` is the hook wrapper)

## Module Design

**Exports:**
- Named exports preferred over default exports
- Components: `export { Button, buttonVariants }`
- Hooks: `export function useDeliveryGate()` + `export function computeDeliveryGate()`
- Types: `export type` / `export interface` alongside implementation

**Barrel Files:**
- Hooks barrel: `src/lib/hooks/index.ts`
- Component subfolders use `index.tsx` barrel
- Not all directories have barrels; many modules are imported directly

## Component Patterns

**UI Components:**
- Use `cva` (class-variance-authority) for variant styling: `src/components/ui/button.tsx`
- Use `cn()` from `@/lib/utils/cn` for className merging (clsx + tailwind-merge)
- Use `React.forwardRef` for interactive primitives
- Set `displayName` on forwarded ref components
- Client components must have `"use client"` directive at top
- React Compiler is enabled -- do NOT use manual `useMemo`, `useCallback`, `React.memo`

**Design Token Enforcement (ESLint):**
- No hardcoded hex colors in Tailwind classes (use semantic tokens: `bg-primary`, `text-text-inverse`)
- No `text-white`/`text-black`/`bg-white`/`bg-black` (use `text-text-inverse`, `text-text-primary`, `bg-surface-primary`, `bg-surface-inverse`)
- No arbitrary pixel values in spacing/padding/margin/gap (use Tailwind scale)
- No hardcoded `fontSize`, `fontWeight`, `boxShadow`, `transitionDuration` in style objects
- No `duration-[Nms]` (use `duration-fast`, `duration-normal`, `duration-slow`, `duration-slower`)
- No `cssText` assignments (CSP compatibility)
- z-index: use standard Tailwind classes `z-0` through `z-50`, or `z-[60]`/`z-[70]`/etc., or tokens from `@/lib/design-system/tokens/z-index`

**Tailwind v4:**
- `@theme inline` in CSS is the source of truth for design tokens
- `tailwind.config.ts` content is dead code (kept for reference only)

**Data Mapping:**
- Database rows use `snake_case` (e.g., `base_price_cents`, `is_sold_out`)
- Application types use `camelCase` (e.g., `basePriceCents`, `isSoldOut`)
- Map explicitly at the API boundary in route handlers

**Zustand Stores:**
- Create with `create()` from zustand
- Use `persist` middleware with `createJSONStorage` for client persistence
- Export store hook and any test helpers (e.g., `__clearDebounceState`)
- Access state in tests: `useCartStore.getState()`

---

*Convention analysis: 2026-03-06*
