# Coding Conventions

**Analysis Date:** 2026-03-18

## Naming Patterns

**Files:**
- React components: `PascalCase.tsx` for single-file components (e.g., `CartButton.tsx`, `DeliveryMetricsDashboard.tsx`)
- Multi-file components: `PascalCase/` subfolder with `index.tsx` barrel (e.g., `Modal/index.tsx`, `DragReorderList/index.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useAcceptRoute.ts`, `useTrackingSubscription.ts`)
- Utilities: `kebab-case.ts` (e.g., `delivery-dates.ts`, `delivery-zones.ts`)
- Validation schemas: `kebab-case.ts` in `src/lib/validations/` (e.g., `checkout.ts`, `driver-api.ts`)
- Stores: `kebab-case-store.ts` (e.g., `cart-store.ts`, `driver-store.ts`)
- API routes: `route.ts` with co-located `helpers.ts`, `validation.ts`, `types.ts`
- Test files: inside `__tests__/` subdirectory with `.test.ts` or `.test.tsx` extension

**Functions:**
- camelCase for all functions: `computeDeliveryGate`, `createMockMenuItem`, `getPageTitle`
- Exported hooks: `use` prefix always present
- Factory functions: `create` prefix (e.g., `createMockMenuItem`, `createMockStripeClient`)
- Pure helper functions: descriptive verb-noun (e.g., `buildRpcPayload`, `fetchAndValidateCart`)

**Variables:**
- camelCase throughout
- Underscore prefix for unused function args and private store internals: `_hasHydrated`, `_i`, `_a`
- Constants: SCREAMING_SNAKE_CASE at module-level (e.g., `DEBOUNCE_MS`, `POLLING_INTERVAL`, `MAX_ITEM_QUANTITY`)

**Types/Interfaces:**
- PascalCase for all types and interfaces; no `I` prefix on interfaces
- Union types: plain name (e.g., `PaymentMethod`, `OrderStatus`, `RouteStopStatus`)
- DB row types: `Row` suffix from generated schema (e.g., `MenuItemsRow`, `OrdersRow`)
- API response types: `Response` suffix (e.g., `MenuResponse`, `AddressListResponse`)
- Form/schema types: `Values` or `Input` suffix (e.g., `AddressFormValues`, `CheckoutItemInput`)

## Code Style

**Formatting (Prettier):**
- `printWidth: 100`
- `singleQuote: false` (double quotes)
- `semi: true`
- `trailingComma: "es5"`

**Linting (ESLint):**
- Extends: `next/core-web-vitals`, `next/typescript`, `prettier`
- Circular dependency prevention: `import-x/no-cycle` at `maxDepth: 10`
- `@typescript-eslint/no-unused-vars`: warn, underscore-prefix exempt
- File size: `max-lines: 400` warning on `src/**/*.{ts,tsx}` (exempt: `src/types/**`, test files, stories)
- Staged files: `lint-staged` runs `eslint --max-warnings=0` on commit

## Import Organization

**Order observed in source files:**
1. React / Next.js framework (`"react"`, `"next/..."`)
2. Third-party libraries (`"framer-motion"`, `"@tanstack/react-query"`, `"zod"`, `"zustand"`)
3. Internal path alias imports (`"@/components/..."`, `"@/lib/..."`, `"@/types/..."`)
4. Relative imports (`"./helpers"`, `"../route"`)

**Path Aliases:**
- `@/` maps to `src/` (via `tsconfig.json` and `vitest.config.ts`)

## Restricted Import Paths (ESLint Error-Level)

All legacy directories are blocked; import from consolidated paths only:

| Blocked | Use Instead |
|---------|-------------|
| `@/components/ui-v8/*` | `@/components/ui` |
| `@/components/menu/*` | `@/components/ui/menu` |
| `@/components/admin/*` | `@/components/ui/admin` |
| `@/components/checkout/*` | `@/components/ui/checkout` |
| `@/components/driver/*` | `@/components/ui/driver` |
| `@/components/navigation/*` | `@/components/ui/layout` or `@/components/ui/navigation` |
| `@/contexts/*` | `@/app/contexts` |
| `@/design-system/*` | `@/lib/design-system` |

## Design Token Enforcement (ESLint `no-restricted-syntax`)

Applied to `src/components/**/*.tsx` and `src/app/**/*.tsx`:

**Colors — use semantic tokens:**
- `text-white` → `text-text-inverse` or `text-hero-text`
- `text-black` → `text-text-primary`
- `bg-white` → `bg-surface-primary`
- `bg-black` → `bg-surface-inverse`
- `bg-[#hex]`, `text-[#hex]` → use design token color classes

**Spacing — no arbitrary px:**
- Forbidden: `m-[Npx]`, `mx-[Npx]`, `p-[Npx]`, `px-[Npx]`, `gap-[Npx]`
- Use Tailwind scale: `m-1`, `p-4`, `gap-2`, etc.

**Typography:**
- Forbidden: `text-[Npx]` → use `text-2xs`, `text-xs`, `text-sm`, etc.
- Forbidden: inline `fontSize` px value or `fontWeight` numeric in style objects
- Use Tailwind: `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700)

**Z-index:** Standard Tailwind only: `z-0`, `z-10`, `z-20`, `z-30`, `z-40`, `z-50`, `z-[60]`, `z-[70]`, `z-[80]`, `z-[100]`. No inline `zIndex: N`.

**Shadows:** `var(--shadow-*)` or `shadow-*` utilities. No hardcoded `boxShadow` literals (Framer Motion animation exception applies).

**Blur:** `var(--blur-*)` or `backdrop-blur-*`. No hardcoded `blur(Npx)`.

**Duration:** `duration-fast` (150ms), `duration-normal` (220ms), `duration-slow` (350ms), `duration-slower` (500ms). No `duration-[Nms]` or inline `transitionDuration`.

**CSP:** No `element.style.cssText`. Use individual `style.property` assignments.

## Error Handling

**API route — standardized response shape:**
```typescript
// Always: { error: { code, message, details? } } with appropriate HTTP status
return NextResponse.json(
  { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
  { status: 401 }
);
```

**API route — catch-all pattern:**
```typescript
try {
  // handler logic
} catch (error) {
  logger.exception(error, { api: "route-name" });
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Failed to ..." } },
    { status: 500 }
  );
}
```

**Client-side hooks — toast on failure, never throw:**
```typescript
try {
  const response = await fetch(...);
  if (!response.ok) {
    toast({ message: "...", type: "error" });
    return;
  }
  toast({ message: "...", type: "success" });
  onSuccess?.();
} catch {
  toast({ message: "...", type: "error" });
} finally {
  setIsLoading(false);
}
```

**Supabase query errors:**
```typescript
const { data, error } = await supabase.from("table").select("*");
if (error) throw error; // let API catch-all handle it
// OR return early for inline handling:
if (error) return { ok: false as const, response: errorResponse("INTERNAL_ERROR", "...", 500) };
```

## Logging

**Module:** `src/lib/utils/logger.ts`

**Methods:** `logger.info()`, `logger.warn()`, `logger.error()`, `logger.exception(error, context?)`

**Pattern:** Used in API route catch blocks only. Client components/hooks use toast; never use `console.log` in production code.

## Comments

**When to comment:**
- Module-level JSDoc for complex hooks and service functions
- Inline `// NOTE:` for important caveats and disabled rules
- `// BUG-NN:` to trace decision back to specific bug fix
- Section dividers with `// ===...===` for long files

**JSDoc style:**
```typescript
/**
 * Hook for subscribing to real-time tracking updates.
 * Falls back to polling if Realtime connection fails.
 */
export function useTrackingSubscription({ ... }: Options): Return { ... }
```

## React Compiler Implications

React Compiler (`babel-plugin-react-compiler`) is enabled. Auto-memoizes client components.

**Rules:**
- Do NOT add `useMemo`, `useCallback`, or `React.memo` manually for performance
- `useCallback` may still appear for semantic clarity and correct dependency arrays in hooks
- Do NOT add new manual memoization

## Component Patterns

**`'use client'` directive:** Required on any file using hooks, event handlers, or browser APIs. Always at top of file before imports.

**Server Components:** Default in App Router. No directive. Fetch server-side, pass as props.

**Framer Motion:** Use `m` (not `motion`) for tree-shaking:
```typescript
import { m, AnimatePresence } from "framer-motion";
// Use: <m.div ...> not <motion.div ...>
```

**Animation variants as const:**
```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
} as const;
```

**Guard animations with preference hook:**
```typescript
const { shouldAnimate } = useAnimationPreference();
```

## Form Patterns (React Hook Form + Zod)

**Schema location:** `src/lib/validations/` — one file per domain, export schema + inferred type.

**Schema definition:**
```typescript
// src/lib/validations/checkout.ts
import { z } from "zod";
export const createCheckoutSessionSchema = z.object({
  addressId: z.string().uuid("Invalid address ID"),
  paymentMethod: z.enum(["stripe", "cod"]).default("stripe"),
  // ...
});
export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;
```

**Form hook setup:**
```typescript
const { register, handleSubmit, control, formState: { errors, dirtyFields, touchedFields } } =
  useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema) as Resolver<AddressFormValues>,
    defaultValues: { label: "Home", line1: "", city: "", state: "CA", postalCode: "" },
  });
```

**Server-side validation:**
```typescript
const parsed = schema.safeParse(body);
if (!parsed.success) {
  return errorResponse("VALIDATION_ERROR", "Invalid request data", 400, parsed.error.issues);
}
const input = parsed.data; // fully typed, safe to use
```

## API Route Patterns

**File layout:**
```
src/app/api/checkout/session/
  route.ts        # HTTP handlers (POST, GET, etc.) — import from helpers/validation
  helpers.ts      # Pure functions specific to this route
  validation.ts   # Re-usable validation helpers, errorResponse factory
  types.ts        # Local TypeScript types
  __tests__/      # Co-located tests
```

**Handler signature:**
```typescript
export async function POST(request: Request) { ... }
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) { ... }
```

**Auth check:**
```typescript
const supabase = await createClient(); // cookie-based, respects RLS
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", ... } }, { status: 401 });
```

**Rate limiting:**
```typescript
const rl = await checkRateLimit({
  limiter: customerLimiter,
  identifier: user.id,
  role: "customer",
  route: "addresses",
});
if (rl.limited) return rl.response;
```

**Service client:** Use `createServiceClient()` only in webhook/cron/admin contexts (bypasses RLS). Use `createClient()` for user-authenticated routes.

**Fire-and-forget (not `void asyncFn()`):**
```typescript
import { after } from "next/server";
after(async () => { await sendEmail(...); });
```

## Supabase Query Patterns

**Typed returns:**
```typescript
const { data, error } = await supabase
  .from("menu_items")
  .select("*")
  .in("id", ids)
  .returns<MenuItemsRow[]>();
```

**FK disambiguation (mandatory when 2+ FKs to same table):**
```typescript
// Prevents PGRST201 error
.select("drivers!fk_route_drivers(profiles(full_name))")
```

**Upsert with affected-row check:**
```typescript
// DO UPDATE WHERE col IS NULL (DO NOTHING won't fill null cols)
const { data } = await supabase
  .from("webhook_events")
  .upsert({ id: eventId }, { onConflict: "id" })
  .select("id"); // chain .select() — .update() returns no row count otherwise
```

**Supabase client selection:**
- `createClient()` — server-side, cookie-based, user auth context, respects RLS
- `createPublicClient()` — anon key, no cookies, for public data reads
- `createServiceClient()` — service role, bypasses RLS, trusted server contexts only

## Zustand Store Patterns

**Store structure:**
```typescript
// src/lib/stores/[name]-store.ts
interface NameState { /* fields + action signatures */ }

const initialState = { field: value };

export const useNameStore = create<NameState>()(
  persist(
    (set, get) => ({
      ...initialState,
      // actions
      setField: (value) => set({ field: value }),
      // computed selectors as methods
      getComputedValue: () => {
        const { field } = get();
        return /* computed */;
      },
    }),
    {
      name: "mms-[name]",           // localStorage key prefix: mms-
      storage: createJSONStorage(getStorage),
      partialize: (state) => ({     // only persist needed fields
        field: state.field,
      }),
    }
  )
);
```

**SSR-safe storage:**
```typescript
const getStorage = (): Storage => {
  if (typeof window === "undefined") return createMemoryStorage();
  return window.localStorage;
};
```

**Cart store:** Uses IndexedDB storage via `src/lib/services/cart-idb-storage.ts`.

**Hydration tracking:** `_hasHydrated` + `_setHasHydrated` pattern in cart store for SSR safety.

## TanStack React Query Patterns

**Query:**
```typescript
export function useAddresses() {
  return useQuery<ResponseType>({
    queryKey: ["resource"],
    queryFn: async () => {
      const res = await fetch("/api/resource");
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error?.message ?? "Failed to fetch resource");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // when applicable
    enabled: Boolean(condition), // when conditional
  });
}
```

**Mutation:**
```typescript
export function useCreateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InputType) => {
      const res = await fetch("/api/resource", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = await res.json();
      if (!res.ok) throw payload; // throw full server error shape
      return payload as ResponseType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource"] });
    },
  });
}
```

---

*Convention analysis: 2026-03-18*
