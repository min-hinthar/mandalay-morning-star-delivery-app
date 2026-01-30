# Coding Conventions

**Analysis Date:** 2026-01-30

## Naming Patterns

**Files:**
- Components: PascalCase with `.tsx` extension (`Button.tsx`, `LoginForm.tsx`, `CartDrawer.tsx`)
- Utilities/logic: kebab-case with `.ts` extension (`format.ts`, `eta.ts`, `delivery-dates.ts`)
- Test files: co-located in `__tests__/` directories with `.test.ts` or `.test.tsx` suffix
- E2E specs: kebab-case with `.spec.ts` in `e2e/` directory (`happy-path.spec.ts`, `checkout-flow.spec.ts`)
- API routes: `route.ts` in directory structure matching endpoint (`src/app/api/checkout/session/route.ts`)

**Functions:**
- Exported utilities: camelCase (`formatPrice`, `createItemSignature`, `shouldDebounce`)
- React components: PascalCase (`Button`, `LoginForm`, `MenuCardWrapper`)
- Hooks: camelCase with `use` prefix (`useAnimationPreference`, `useCartStore`, `useTrackingSubscription`)
- Event handlers: camelCase with `handle` prefix (`handleSubmit`, `handleClick`)

**Variables:**
- Constants: UPPER_SNAKE_CASE (`DELIVERY_FEE_CENTS`, `MAX_ITEM_QUANTITY`, `DEBOUNCE_MS`, `STORAGE_KEY`)
- Regular variables: camelCase (`buttonContent`, `isDisabled`, `validBody`)
- Private/internal: underscore prefix for unused destructured vars (`_addressId`)

**Types:**
- Interfaces/Types: PascalCase (`ButtonProps`, `AnimationPreference`, `CartItem`, `MenuItemsRow`)
- Type suffixes: `Props` for component props, `Store` for Zustand stores, `Row` for database types

## Code Style

**Formatting:**
- Tool: Prettier 3.7.4
- Config: `.prettierrc`
  - Double quotes (`"singleQuote": false`)
  - Semicolons required (`"semi": true`)
  - Print width: 100 characters
  - Trailing commas: ES5 style (`"trailingComma": "es5"`)

**Linting:**
- Tool: ESLint 9 (flat config)
- Config: `eslint.config.mjs`
- Base: Next.js core-web-vitals + TypeScript + Prettier integration
- Key rules:
  - `@typescript-eslint/no-unused-vars`: warn with ignore pattern `^_` for unused params
  - `no-restricted-imports`: error for consolidated directories (prevents imports from old paths like `@/components/ui-v8/*`)
  - `no-restricted-syntax`: error for design token violations (hardcoded colors, z-index, spacing, typography)

**CSS/Styling:**
- Tool: Stylelint 17.0.0
- Config: `.stylelintrc.json` extends `stylelint-config-standard`
- Key rules:
  - Disallow hardcoded z-index values, require CSS variables (`var(--z-modal)`)
  - Custom property naming: kebab-case with optional double-dash modifiers
  - Allow Tailwind directives (`@tailwind`, `@apply`, `@layer`)

**TypeScript:**
- Strict mode enabled (`tsconfig.json`)
- `noUnusedLocals`: true
- `noUnusedParameters`: true
- Path alias: `@/*` maps to `./src/*`
- Target: ES2017

## Import Organization

**Order:**
1. React imports
2. Third-party libraries (grouped by package)
3. Internal components (`@/components/*`)
4. Internal utilities (`@/lib/*`)
5. Types (`@/types/*` or `type` imports)
6. Relative imports
7. CSS imports (last)

**Example from `src/components/ui/button.tsx`:**
```typescript
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";

import { BrandedSpinner } from "@/components/ui/branded-spinner";

import { cn } from "@/lib/utils/cn";
import { spring, hover } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
```

**Path Aliases:**
- `@/*`: src directory root (`@/components`, `@/lib`, `@/types`)
- No barrel exports for `ui/` components (import directly from component file)

## Error Handling

**Patterns:**
- Server actions: Return `{ success?: string, error?: string }` objects
- Validation: Use Zod schemas with `.safeParse()` for safe parsing
- API routes: Return `NextResponse.json()` with status codes
- Client components: Display errors via toast notifications or inline error states
- Tests: Use `expect().toBe()` for validation errors, check `success` boolean

**Example from tests:**
```typescript
const result = createCheckoutSessionSchema.safeParse(body);
expect(result.success).toBe(false);
```

## Logging

**Framework:** Console (native)

**Patterns:**
- Development warnings: `console.warn()` for accessibility issues (e.g., missing aria-labels)
- Development-only: Check `process.env.NODE_ENV === "development"` before logging
- Error tracking: Sentry integration for production errors (`@sentry/nextjs`)
- No logging in production UI components (use Sentry)

**Example from `src/components/ui/button.tsx`:**
```typescript
if (isIconOnly && !props["aria-label"] && process.env.NODE_ENV === "development") {
  console.warn("Button: Icon-only buttons should have an aria-label for accessibility");
}
```

## Comments

**When to Comment:**
- Complex business logic (debounce tracking, signature generation)
- Public API documentation (JSDoc for exported functions/components)
- Non-obvious patterns (animation preferences, design system decisions)
- TODO/FIXME for known issues (tracked in ERROR_HISTORY.md)

**JSDoc/TSDoc:**
- Used extensively for hooks and utilities
- Includes `@param`, `@returns`, `@example` blocks
- Component props documented via TypeScript interfaces with inline comments

**Example from `src/lib/hooks/useAnimationPreference.ts`:**
```typescript
/**
 * V7 Hook to manage animation preferences
 *
 * Key difference from V5/V6:
 * - Defaults to "full" regardless of OS setting
 * - User must explicitly opt-in to reduced motion
 * - Provides more granular control and callbacks
 *
 * @example
 * const {
 *   preference,
 *   setPreference,
 *   isFullMotion,
 *   shouldAnimate,
 * } = useAnimationPreference();
 */
```

## Function Design

**Size:** Keep functions focused and single-purpose. Extract complex logic into helpers (as seen in `src/lib/stores/cart-store.ts` with `createItemSignature`, `shouldDebounce`)

**Parameters:**
- Use destructuring for object parameters
- Provide default values where appropriate (`currency: string = "USD"`)
- Use TypeScript for type safety, avoid runtime type checks

**Return Values:**
- Utilities: Return primitive values or typed objects
- Hooks: Return objects with named properties for destructuring
- Components: Return JSX.Element or ReactElement
- Server actions: Return `{ success?: string, error?: string }` for form actions

**Example:**
```typescript
export function formatPrice(cents: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}
```

## Module Design

**Exports:**
- Named exports preferred over default exports for utilities
- Default exports used for pages and route handlers
- Barrel files: NOT used for components (direct imports required)
- Re-export types from index files where helpful

**Component Exports:**
```typescript
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(/* ... */);
Button.displayName = "Button";

export { Button, buttonVariants };
```

**Pattern: Export internal utilities for testing:**
```typescript
// From cart-store.ts
export { __clearDebounceState }; // Test-only export
```

## Design Token Enforcement

**ESLint Rules:**
- Prohibit hardcoded hex colors in Tailwind classes (`bg-[#fff]` → use `bg-surface-primary`)
- Prohibit hardcoded spacing (`p-[16px]` → use `p-4`)
- Prohibit hardcoded typography (`text-[14px]` → use `text-sm`)
- Prohibit inline zIndex numbers (use design system tokens)
- Prohibit hardcoded color keywords (`text-white` → use `text-text-inverse`)

**Enforcement:**
- ESLint: AST-based detection via `no-restricted-syntax` selector rules
- Stylelint: CSS variable enforcement for z-index
- Audit script: `pnpm audit:tokens` for token compliance

**Exceptions:**
- Framer Motion: Numeric values allowed for physics-based animations
- Spring transitions: Inline values permitted for interpolation

---

*Convention analysis: 2026-01-30*
