# Coding Conventions

**Analysis Date:** 2026-03-14

## Naming Patterns

**Files:**
- UI primitives: `kebab-case.tsx` (e.g., `button.tsx`, `alert-dialog.tsx`, `scroll-area.tsx`)
- Custom components: `PascalCase.tsx` (e.g., `AnimatedLink.tsx`, `Backdrop.tsx`, `EmptyState.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g., `useAuth.ts`, `useDeliveryGate.ts`)
- Stores: `kebab-case.ts` suffixed with `-store` (e.g., `cart-store.ts`, `driver-store.ts`)
- Utils: `kebab-case.ts` (e.g., `api-error.ts`, `delivery-dates.ts`)
- Validations: `kebab-case.ts` matching domain (e.g., `checkout.ts`, `driver-api.ts`)
- Types: `kebab-case.ts` matching domain (e.g., `cart.ts`, `delivery.ts`, `database.ts`)
- Tests: `*.test.ts` or `*.test.tsx` in `__tests__/` subdirectory

**Functions:**
- `camelCase` for all functions and methods
- Hooks: `use` prefix (e.g., `useAuth`, `useMenu`, `useDeliveryGateMultiDay`)
- Factory functions: `create` prefix (e.g., `createMockMenuItem`, `createMockStripeClient`)
- Compute functions: `compute` prefix for pure derivation (e.g., `computeDeliveryGate`)
- Boolean getters: `is` prefix (e.g., `isPastCutoff`, `isValidStatusTransition`)

**Variables:**
- `camelCase` for all variables
- Constants: `UPPER_SNAKE_CASE` for module-level constants (e.g., `MAX_CART_ITEMS`, `DEBOUNCE_MS`, `DELIVERY_FEE`)
- Private store internals: `_` prefix (e.g., `_hasHydrated`, `_setHasHydrated`)
- Test export helpers: `__` double underscore prefix (e.g., `__clearDebounceState`)

**Types & Interfaces:**
- `PascalCase` for types and interfaces
- Suffixed by role: `Row` for DB rows (`MenuItemsRow`), `Props` for components (`ButtonProps`), `Store` for Zustand (`CartStore`), `Schema` for Zod (`checkoutItemSchema`)
- Zod schemas: `camelCase` ending in `Schema` (e.g., `createCheckoutSessionSchema`, `addressFormSchema`)
- Inferred Zod types: `PascalCase` ending in `Input` or `Values` (e.g., `CreateCheckoutSessionInput`, `AddressFormValues`)

## Code Style

**Formatting:**
- Prettier with config in `.prettierrc`
- Double quotes (`"singleQuote": false`)
- Semicolons always (`"semi": true`)
- Print width: 100 characters
- Trailing commas: `es5`

**Linting:**
- ESLint flat config in `eslint.config.mjs`
- Extends: `next/core-web-vitals`, `next/typescript`, `prettier`
- Stylelint for CSS in `.stylelintrc.json` (extends `stylelint-config-standard`)
- `import-x/no-cycle` enabled (max depth 10) to prevent circular imports
- `max-lines: 400` (warning) on all `src/**/*.ts{x}` except types, tests, stories
- Underscore-prefixed unused vars allowed: `argsIgnorePattern: "^_"`

**Pre-commit:**
- Husky + lint-staged
- On commit: `eslint --max-warnings=0 --no-warn-ignored` on staged `.ts/.tsx` files
- On commit: `stylelint` on staged `.css` files

**TypeScript:**
- Strict mode enabled (`"strict": true`)
- `noUnusedLocals` and `noUnusedParameters` enabled
- Path alias: `@/*` maps to `./src/*`
- Target: ES2017, JSX: react-jsx

## Design Token Enforcement

62+ design tokens enforced via ESLint `no-restricted-syntax` rules in `eslint.config.mjs`:

**Colors:** Use semantic tokens, never hardcoded hex or `text-white`/`bg-black`:
- `text-white` -> `text-text-inverse` or `text-hero-text`
- `bg-white` -> `bg-surface-primary`
- `bg-black` -> `bg-surface-inverse`
- `bg-[#xxx]` / `text-[#xxx]` -> use design token equivalents

**Typography:** Use Tailwind scale, never arbitrary pixel values:
- `text-[14px]` -> `text-sm`
- Inline `fontSize: "14px"` -> Tailwind class

**Spacing:** Use Tailwind scale, never arbitrary values:
- `m-[8px]`, `p-[16px]`, `gap-[12px]` -> `m-2`, `p-4`, `gap-3`

**Shadows & Blur:** Use CSS variables or Tailwind utilities:
- `boxShadow: "0 2px..."` -> `var(--shadow-*)` or `shadow-*`
- `backdropFilter: "blur(8px)"` -> `var(--blur-*)` or `backdrop-blur-*`

**Duration:** Use token classes:
- `duration-[200ms]` -> `duration-normal`
- Allowed tokens: `duration-instant(0ms)`, `duration-fast(150ms)`, `duration-normal(220ms)`, `duration-slow(350ms)`, `duration-slower(500ms)`

**z-index:** Use standard Tailwind numeric classes:
- `z-0` (base), `z-10` (dropdown), `z-20` (sticky), `z-30` (fixed)
- `z-40` (modal-backdrop), `z-50` (modal), `z-[60]` (popover), `z-[70]` (tooltip)

**CSP:** Use individual `style.property` assignments, never `cssText`.

## Import Organization

**Order (enforced by convention, not auto-sorted):**
1. React / Next.js framework imports
2. Third-party libraries (`framer-motion`, `zod`, `zustand`, etc.)
3. Internal absolute imports with `@/` alias, grouped by:
   - `@/components/ui/...` (UI components)
   - `@/lib/...` (utilities, hooks, stores, services)
   - `@/types/...` (type definitions)
4. Relative imports (co-located files like `./helpers`, `./transform`)

**Path Aliases:**
- `@/*` -> `./src/*` (the only alias; use it for all non-relative imports)

**Barrel Exports:**
- `src/components/ui/index.ts` is the main UI barrel -- import primitives from `@/components/ui`
- Each UI subdirectory has its own `index.ts` barrel (e.g., `@/components/ui/checkout`, `@/components/ui/admin`)
- `src/lib/hooks/index.ts` barrel for hooks

**Consolidation Guards:**
ESLint `no-restricted-imports` prevents importing from deprecated locations. All components live under `@/components/ui/`. Never import from:
- `@/components/menu/*` -> use `@/components/ui/menu`
- `@/components/admin/*` -> use `@/components/ui/admin`
- `@/components/checkout/*` -> use `@/components/ui/checkout`
- `@/components/driver/*` -> use `@/components/ui/driver`
- `@/contexts/*` -> use `@/app/contexts`
- See full list in `eslint.config.mjs` lines 44-151

## Component Patterns

**UI Primitives (shadcn/ui style):**
Use `cva` (class-variance-authority) for variant-based styling. Pattern:

```typescript
// src/components/ui/button.tsx
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "base-classes...",
  {
    variants: {
      variant: { primary: "...", secondary: "...", ghost: "..." },
      size: { sm: "...", md: "...", lg: "..." },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

Key rules:
- Always use `React.forwardRef` for primitives
- Always set `displayName`
- Always accept `className` prop and merge with `cn()`
- Use `"use client"` directive for any component using hooks, events, or Framer Motion
- Export both the component and its variants function
- Export the Props interface

**Animated Components:**
Use Framer Motion `m` (lazy motion) component for animations. Import motion tokens from `@/lib/design-system/tokens/motion`.

```typescript
import { m, type HTMLMotionProps } from "framer-motion";
import { spring, hover } from "@/lib/motion-tokens";

const motionProps = shouldAnimate ? {
  whileHover: hover.buttonPress.whileHover,
  whileTap: hover.buttonPress.whileTap,
  transition: spring.snappyButton,
} : {};
```

- Respect `useAnimationPreference()` hook -- skip motion when user prefers reduced motion
- React Compiler is enabled -- do NOT manually use `useMemo`, `useCallback`, or `React.memo`

**Component Subfolder Pattern:**
When a component exceeds 400 lines, split into subfolder:

```
ComponentName/
  index.tsx          # Barrel re-exports only
  SubComponent.tsx   # PascalCase
  useHook.ts         # camelCase with use prefix
  helpers.ts         # camelCase
```

- Every extracted file using hooks/events needs `'use client'`
- Barrel `index.tsx` must re-export ALL original exports
- Example: `src/components/ui/checkout/index.ts`, `src/components/ui/Modal/index.tsx`

## Zustand Store Patterns

**Store definition:**
```typescript
// src/lib/stores/cart-store.ts
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // State
      items: [],
      // Derived getters
      getItemsSubtotal: () => { /* ... */ },
      // Actions
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "mms-cart",
      storage: createJSONStorage(() => cartIDBStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
```

- Define the store interface separately in `src/types/` (e.g., `CartStore` in `src/types/cart.ts`)
- Use `persist` middleware with `createJSONStorage` for IndexedDB or localStorage
- Use `partialize` to persist only serializable data
- Export test helpers prefixed with `__` for resetting internal state (e.g., `__clearDebounceState`)

## TanStack React Query Patterns

**Data fetching hooks:**
```typescript
// src/lib/hooks/useMenu.ts
import { useQuery } from "@tanstack/react-query";

export function useMenu() {
  return useQuery<MenuResponse>({
    queryKey: ["menu"],
    queryFn: async () => {
      const res = await fetch("/api/menu");
      if (!res.ok) throw new Error("Failed to fetch menu");
      return res.json() as Promise<MenuResponse>;
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

- Always type the `useQuery<T>` generic
- Use hierarchical `queryKey` arrays: `["menu"]`, `["menu", "search", query]`
- Fetch via internal API routes (`/api/...`), not direct Supabase client calls
- Use `enabled` option for conditional queries

## Validation Patterns (Zod)

**Schema definition:**
```typescript
// src/lib/validations/checkout.ts
import { z } from "zod";

export const createCheckoutSessionSchema = z.object({
  addressId: z.string().uuid("Invalid address ID"),
  items: z.array(checkoutItemSchema).min(1).max(50),
  tipCents: z.number().int().min(0).max(100_000).optional(),
  paymentMethod: z.enum(["stripe", "cod"]).default("stripe"),
  customerPhone: z.string()
    .transform((val) => val.replace(/\D/g, ""))
    .pipe(z.string().min(10).max(15)),
});

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;
```

- One schema file per domain in `src/lib/validations/`
- Always export inferred types alongside schemas
- Use `.safeParse()` in API routes, never `.parse()` (to control error responses)
- Include user-friendly error messages in validators

## API Route Patterns

**Standard API route structure:**
```typescript
// src/app/api/addresses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, customerLimiter } from "@/lib/rate-limit";

export async function GET() {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );

    // 2. Rate limiting
    const rl = await checkRateLimit({ limiter: customerLimiter, identifier: user.id, role: "customer", route: "addresses" });
    if (rl.limited) return rl.response;

    // 3. Business logic
    const { data, error } = await supabase.from("addresses").select("*")...;
    if (error) throw error;

    // 4. Success response
    return NextResponse.json({ data, meta: { count: data.length } });
  } catch (error) {
    // 5. Error handling
    logger.exception(error, { api: "addresses" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch addresses" } },
      { status: 500 }
    );
  }
}
```

Key patterns:
- Always wrap in try/catch
- Auth check first, then rate limit, then validation, then business logic
- Use structured error format: `{ error: { code: ApiErrorCode, message: string, details?: unknown } }`
- Error codes: `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `NOT_FOUND`, `RATE_LIMITED`, `INTERNAL_ERROR`, `STRIPE_ERROR`, `CONFLICT`, `BAD_REQUEST`
- Use `apiError()` helper from `@/lib/utils/api-error.ts` for consistent error responses
- Zod validation: `schema.safeParse(body)` -> return 400 with `result.error.issues` on failure
- Use `logger.exception()` for caught errors (sends to Sentry)
- Success responses: `{ data: T, meta?: { count, coverage, etc. } }`

## Error Handling

**Server-side (API routes):**
- Wrap all route handlers in try/catch
- Use `logger.exception(error, context)` for Sentry + console logging
- Return structured `{ error: { code, message } }` JSON responses
- Use `apiError()` utility for common error responses

**Client-side:**
- Use `try/catch` with toast notifications for user-facing errors
- Non-fatal fetch failures: log and continue (e.g., profile auto-fill)
- Use `catch { /* Non-fatal */ }` pattern for optional features

**Logging:**
- Framework: `@/lib/utils/logger.ts` wrapping `@sentry/nextjs`
- Levels: `debug`, `info`, `warn`, `error`, `exception`
- Always include context: `{ api, userId, orderId, flowId }`
- In development: outputs to console with `[LEVEL]` prefix
- In production: adds Sentry breadcrumbs, captures messages for warn/error

```typescript
logger.error("Failed to update order", { orderId, userId, flowId: "checkout" });
logger.exception(error, { api: "stripe-webhook" });
```

## Comments

**When to Comment:**
- Section headers using `// ============...` separator blocks in long files
- JSDoc on exported functions with `@example` where non-obvious
- `@deprecated` annotations with migration path
- Bug fix references: `// BUG-06 FIX: ...` with explanation of root cause
- Business logic notes: `// CHKT-01: No client-sent prices...`
- eslint-disable with reason: `// eslint-disable-next-line react-hooks/exhaustive-deps`

**JSDoc/TSDoc:**
- Used on exported functions in libraries and utilities
- Not required on React components (Props interface serves as documentation)
- Include `@example` for non-obvious APIs (e.g., motion tokens, logger)

## `cn()` Utility

Use `cn()` from `@/lib/utils/cn` for all Tailwind class merging:
```typescript
import { cn } from "@/lib/utils/cn";
// Combines clsx + tailwind-merge
cn("base-class", conditional && "extra", className)
```

## Money Handling

- All monetary values stored and computed in **cents** (integer)
- Variable naming: suffixed with `Cents` (e.g., `basePriceCents`, `deliveryFeeCents`, `totalCents`)
- Display formatting: `formatPrice(cents)` from `@/lib/utils/format.ts`
- Never use floating-point for money calculations

---

*Convention analysis: 2026-03-14*
