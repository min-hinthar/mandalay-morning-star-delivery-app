# Coding Conventions

**Analysis Date:** 2026-01-21

## Naming Patterns

**Files:**
- PascalCase for React components: `LoginForm.tsx`, `MenuContent.tsx`
- camelCase for utility functions: `useCart.ts`, `geocoding.ts`
- camelCase for hooks: `useAnimationPreference.ts`, `useResponsive.ts`
- kebab-case for test files: `login-form.test.tsx`, `cart-store.test.ts`
- UPPERCASE constants: `MAX_ITEM_QUANTITY`, `DELIVERY_FEE_CENTS`
- Index files for barrel exports: `src/lib/hooks/index.ts`, `src/lib/auth/index.ts`

**Functions:**
- camelCase naming: `getNextSaturday()`, `calculateTrendPercentage()`, `formatPrice()`
- Verb-first for functions that perform actions: `validateStopsForOptimization()`, `transformDriverStats()`
- Query-style for data accessors: `getItemsSubtotal()`, `getEstimatedDeliveryFee()`
- Function parameters are camelCase
- Event handlers prefixed with `handle`: `handleSubmit()`, `handleChange()`

**Variables:**
- camelCase for all variables: `const baseItem`, `let preference`, `const newItem`
- Underscore-prefixed variables (_) for intentionally unused parameters (allowed via ESLint config)
- const by default, let only when mutation needed
- Descriptive names: `formatValue`, `sanitizedNodeOptions`, `isHydrated`

**Types:**
- PascalCase for types and interfaces: `CartStore`, `ChartDataPoint`, `MenuCategory`
- Interface prefix removed (don't use `ICartStore`): `type SubmitButtonProps`
- Suffixed with `Props` for component props: `ChartsProps`, `MenuItemProps`
- Suffixed with `Row` for database rows: `MenuItemsRow`, `ModifierOptionsRow`
- Suffixed with `Schema` for validation schemas: `createCheckoutSessionSchema`, `driverAnalyticsQuerySchema`
- Enum values in SCREAMING_SNAKE_CASE when appropriate

## Code Style

**Formatting:**
- Tool: Prettier
- Print width: 100 characters
- Single quotes: false (use double quotes)
- Semicolons: true
- Trailing commas: es5 (objects/arrays trailing comma, function params no comma)

**Linting:**
- Tool: ESLint with FlatConfig format
- Extends: `next/core-web-vitals`, `next/typescript`, `prettier`
- Unused variables warning with exceptions for `_`-prefixed vars
- Design token enforcement for z-index and colors in component/page files

**Key ESLint Rules:**
- `@typescript-eslint/no-unused-vars`: warns on unused vars but allows `_` prefix
- `no-restricted-syntax`: warns against hardcoded z-index values (require design tokens)
- No hardcoded hex colors in className strings (use design tokens via `var()`)

## Import Organization

**Order:**
1. React/Next.js built-ins: `import React`, `import Link`, `import { useState }`
2. Third-party packages: `import { motion } from "framer-motion"`, `import { create } from "zustand"`
3. Internal absolute imports: `import { useCartStore } from "@/lib/stores/cart-store"`
4. Types: `import type { CartItem } from "@/types/cart"`
5. Blank line between groups

**Pattern Example:**
```typescript
import { useState, useEffect, type ReactElement } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { useCartStore } from "@/lib/stores/cart-store";
import { cn } from "@/lib/utils/cn";

import type { CartStore } from "@/types/cart";
```

**Path Aliases:**
- `@/*`: resolves to `./src/` directory
- All internal imports use absolute paths with `@/`
- No relative path imports (e.g., never `../utils/cn`)

## Error Handling

**Pattern: Return Object Pattern (Services)**
- Services return result objects with success/error state rather than throwing
- Example from `src/lib/services/geocoding.ts`:
```typescript
return {
  formattedAddress: "",
  lat: 0,
  lng: 0,
  isValid: false,
  reason: "GEOCODE_FAILED",
};
```

**Pattern: Try-Catch with Logging**
- Wrap external API calls in try-catch
- Always console.error with context when catching
- Return safe fallback values
- Example:
```typescript
try {
  const response = await fetch(url.toString());
  const data = await response.json();
  // process data
} catch (error) {
  console.error("Geocoding error:", error);
  return safeFallbackValue;
}
```

**Pattern: Validation Errors**
- Use Zod schemas for input validation
- Return validation result object with `success` boolean
- Use `schema.safeParse()` not `schema.parse()`
- Example:
```typescript
const result = createCheckoutSessionSchema.safeParse(body);
if (result.success) {
  // use result.data
} else {
  // handle result.error
}
```

**Pattern: Throwing (Rare)**
- Only throw for missing critical config: `throw new Error("Missing GOOGLE_MAPS_API_KEY")`
- Do not throw for user input errors (validate instead)

## Logging

**Framework:** console methods (console.log, console.warn, console.error)

**Patterns:**
- `console.error()` with context message for exceptions: `console.error("Geocoding error:", error)`
- `console.warn()` for recoverable issues: `console.warn("Cart limit reached")`
- No debug logs in production code (use Sentry/analytics instead)
- Always include context string before error object

## Comments

**When to Comment:**
- Header comments (/** */) for complex components or Sprint information
- Inline comments for non-obvious logic only
- No comments for self-documenting code
- Comment structure sections with `// ==== SECTION NAME ====`

**JSDoc/TSDoc:**
- Function documentation for public utilities:
```typescript
/**
 * Format price in cents to currency string
 * @param cents Amount in cents (e.g., 1200 for $12.00)
 * @returns Formatted currency string
 */
export function formatPrice(cents: number): string {
  // implementation
}
```

- Comments for hooks with examples:
```typescript
/**
 * V7 Hook to manage animation preferences
 *
 * @example
 * const { preference, setPreference, shouldAnimate } = useAnimationPreference();
 */
export function useAnimationPreference() {
  // implementation
}
```

**File Headers:**
- Include Sprint info and feature description for major components
- Example from `src/components/admin/analytics/Charts.tsx`:
```typescript
/**
 *  Animated Charts - Motion-First Data Visualization
 *
 * Sprint 8: Admin Dashboard
 * Features: Recharts with enter animations, animated axes,
 * interactive tooltips, gradient fills, responsive design
 */
```

## Function Design

**Size:** Keep functions under 100 lines; split larger functions

**Parameters:**
- Max 3-4 params; use object destructuring for more:
```typescript
// Good
function createOrder({ items, address, notes }: CreateOrderProps) {}

// Avoid
function createOrder(items, address, notes, customerId, scheduledDate) {}
```

- Use type for props objects: `type ChartsProps { ... }`

**Return Values:**
- Explicit return type annotations for all functions:
```typescript
export function formatDate(value: Date | string): string {
  // implementation
}

export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  // implementation
}
```

- Return null for optional/missing values (not undefined)
- Return early to avoid deep nesting:
```typescript
if (!active || !payload?.length) return null;
// main logic here
```

## Module Design

**Exports:**
- Use named exports for everything (avoid default exports)
- Group related exports by section in barrel files
- Example from `src/lib/hooks/index.ts`:
```typescript
// ============================================
// RESPONSIVE HOOKS
// ============================================

export { useIsMobile, useIsTablet, useIsDesktop } from "./useResponsive";
```

**Barrel Files:**
- Located at `src/lib/hooks/index.ts`, `src/lib/auth/index.ts`
- Used to centralize and document export groups
- Organize by category with section comments
- Import from barrel, not individual files:
```typescript
// Good
import { useCart, useAddresses } from "@/lib/hooks";

// Avoid
import { useCart } from "@/lib/hooks/useCart";
```

**Storage Patterns:**
- Zustand for client state: `src/lib/stores/cart-store.ts`
- SSR-safe storage using conditional logic for window/localStorage
- Persist middleware for persistence across page reloads

## Client Component Markers

**"use client" directive:**
- Required for interactive components and hooks
- Placed at top of file before imports
- Example:
```typescript
"use client";

import { useState } from "react";
```

## Type Patterns

**Avoid any:**
- Always use proper types
- Use `unknown` for truly unknown types, then narrow

**Optional vs Null:**
- Use `value: Type | null` for values that can be absent
- Use optional (`value?: Type`) only for object properties

**Readonly:**
- Use `readonly` for immutable arrays/objects
- Good for props and configuration objects

## CSS/Tailwind

**Class Names:**
- Use `cn()` utility for conditional classes: `cn("base-class", condition && "active-class")`
- Import from: `import { cn } from "@/lib/utils/cn"`
- Design tokens via CSS variables: `z-[var(--z-modal)]` not `z-50`
- Color tokens: `bg-[var(--color-primary)]` not `bg-red-600`

---

*Convention analysis: 2026-01-21*
