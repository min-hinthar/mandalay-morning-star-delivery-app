# Error History

Reference for past bugs, root causes, and fixes. Check here before debugging similar issues.

---

## 2025-01-17: Sentry not capturing errors in Vercel production
**Type:** Runtime | **Severity:** High
**Files:** `instrumentation-client.ts`, `next.config.ts`, `sentry.server.config.ts`

**Error:** Sentry debug page not triggering test errors in production
**Root Cause:** Next.js 16+ requires `instrumentation-client.ts` instead of `sentry.client.config.ts`; also missing `SENTRY_AUTH_TOKEN` for source maps and `global-error.tsx` for React errors
**Fix:**
- Created `instrumentation-client.ts` with proper Next.js 16 setup
- Added `global-error.tsx` for React render errors
- Added `authToken` to next.config.ts for source maps
- Updated .env.example with Sentry env vars
- Enabled debug mode when `SENTRY_DEBUG=true`

---

## 2025-01-17: Stripe webhook RLS bypass
**Type:** Runtime | **Severity:** Critical
**Files:** `src/app/api/webhooks/stripe/route.ts`, `src/lib/supabase/server.ts`

**Error:** Orders stuck in "pending" status after successful Stripe payment
**Root Cause:** Webhook used `createClient()` (anon key) which couldn't update orders due to RLS - webhooks have no user session context
**Fix:** Created `createServiceClient()` using `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for trusted server-side operations

---

## 2025-01-17: Missing order_id in Stripe checkout metadata
**Type:** Runtime | **Severity:** High
**Files:** `src/app/api/checkout/session/route.ts`

**Error:** Webhook received `checkout.session.completed` but `session.metadata.order_id` was undefined
**Root Cause:** Order was created after Stripe session, but metadata referenced wrong variable
**Fix:** Ensure order is created first, then pass `order.id` to Stripe session metadata

---

## 2025-01-17: Missing Alert/AlertDialog UI components
**Type:** TypeScript | **Severity:** Medium
**Files:** `src/components/ui/alert.tsx`, `src/components/ui/alert-dialog.tsx`

**Error:** `Cannot find module '@/components/ui/alert'` during typecheck
**Root Cause:** PendingOrderActions component imported shadcn/ui components that weren't installed
**Fix:** Created alert.tsx and alert-dialog.tsx components, installed `@radix-ui/react-alert-dialog`

---

## 2025-01-17: Wrong import path for cn utility
**Type:** TypeScript | **Severity:** Low
**Files:** `src/components/ui/alert.tsx`, `src/components/ui/alert-dialog.tsx`

**Error:** `Cannot find module '@/lib/utils'`
**Root Cause:** Project uses `@/lib/utils/cn` not `@/lib/utils` for the cn utility
**Fix:** Updated imports to use correct path `@/lib/utils/cn`

---

## 2025-01-17: Sentry debug API not sending events
**Type:** Runtime | **Severity:** Medium
**Files:** `src/app/api/debug/sentry/route.ts`

**Error:** Test errors from `/api/debug/sentry` not appearing in Sentry dashboard
**Root Cause:** Sentry events are sent asynchronously; serverless function terminates before flush completes
**Fix:** Added `await Sentry.flush(2000)` before returning response

---

## 2026-01-18: Next.js Dynamic Route Slug Conflict
**Type:** Build | **Severity:** High
**Files:** `src/app/api/orders/[id]/`, `src/app/api/orders/[orderId]/`

**Error:** `Error: You cannot use different slug names for the same dynamic path ('id' !== 'orderId')`
**Root Cause:** Two sibling directories under `api/orders/` used different param names (`[id]` for cancel/retry-payment, `[orderId]` for rating). Next.js requires consistent naming.
**Fix:**
- Moved `[orderId]/rating/` to `[id]/rating/`
- Updated route handler: `resolvedParams.orderId` → `resolvedParams.id`
- Deleted empty `[orderId]/` directory

---

## 2026-01-20: Barrel Import Path Casing Mismatch After File Rename

**Type:** TypeScript | **Severity:** Medium
**Files:** `src/components/layout/v7-index.ts`, `header.tsx`, `footer.tsx`

**Error:** `TS1261: Already included file name 'Header.tsx' differs from file name 'header.tsx' only in casing`
**Root Cause:** Files renamed from PascalCase to lowercase (`Header.tsx` → `header.tsx`) but barrel import paths not updated. Windows filesystem case-insensitive, so it worked locally until typecheck ran.
**Fix:** Update barrel import paths to match actual file casing:
```ts
// Before (broken)
} from "./Header";
} from "./Footer";

// After (working)
} from "./header";
} from "./footer";
```
**Prevention:** After renaming files, update ALL import paths (not just export names). Run `pnpm typecheck` immediately after renames.

---

## 2026-01-20: Module Export Chain Failures After Bulk Rename

**Type:** TypeScript | **Severity:** Medium
**Files:** Multiple v7-index.ts barrel files, component files (38 total)

**Error:** `Module '"./AuthModal"' has no exported member 'AuthModalV7'` (and similar for 10+ components)
**Root Cause:** After renaming files (AuthModalV7.tsx → AuthModal.tsx), barrel exports still referenced old names like `export { AuthModalV7 }` which no longer existed. The component now exports `AuthModal` but barrel tried to re-export non-existent `AuthModalV7`.
**Fix:** Update each barrel file to export actual names with aliases for backward compatibility:
```ts
// Before (broken)
export { AuthModalV7 } from "./AuthModal";

// After (working)
export { AuthModal } from "./AuthModal";
export { AuthModal as AuthModalV7 } from "./AuthModal";  // Alias for compat
```
**Prevention:** When bulk renaming files, also update barrel exports. Run `pnpm typecheck` after each batch of renames, not just at the end.

---

## 2026-01-20: Import Name Collision Causing Circular Reference

**Type:** TypeScript | **Severity:** Medium
**Files:** `src/components/layouts/PageTransition.tsx`, `src/lib/motion-tokens.ts`

**Error:** TypeScript error about circular reference or "Block-scoped variable 'duration' used before its declaration"
**Root Cause:** File imported `duration` from motion-tokens, but also declared local constant `duration = motionDuration.normal` - same name collision.
**Fix:** Rename import using alias:
```ts
import { spring, duration as motionDuration, easing } from "@/lib/motion-tokens";
const fastExit = { duration: motionDuration.fast, ease: easing.in };
```
**Prevention:** Use import aliases when imported name might conflict with common variable names (duration, type, value, etc.)

---

## 2026-01-18: V4 Bug - Signout Button Not Working (Form in Radix Dropdown)
**Type:** Runtime | **Severity:** High
**Files:** `src/components/auth/user-menu.tsx`, `src/components/ui/DropdownAction.tsx`

**Error:** Clicking "Sign out" in user dropdown does nothing - no error, no network request
**Root Cause:** Radix UI `<DropdownMenuItem>` swallows form submit events. The signout action used `<form action={signOut}>` which never triggered because Radix intercepts the event.
**Fix:** Created `DropdownAction.tsx` component that:
- Uses `onSelect` prop (not `onClick`) for Radix dropdown items
- Handles async actions with loading state
- Calls server action directly without form wrapper
```tsx
<DropdownAction
  onSelect={async () => { await signOut(); }}
  variant="destructive"
>
  Sign out
</DropdownAction>
```
**Prevention:** Never use `<form>` inside Radix dropdown/menu items. Use `onSelect` handler with direct function calls.

---

## 2026-01-18: V4 Bug - CheckoutLayout Step Count Mismatch
**Type:** TypeScript | **Severity:** Medium
**Files:** `src/components/layouts/CheckoutLayout.tsx`, `src/lib/stores/checkout-store.ts`, `src/types/checkout.ts`

**Error:** Checkout steps not rendering correctly, type errors about step array length
**Root Cause:** Layout had 4 steps (`address`, `time`, `review`, `pay`) but store had 3 steps (`address`, `time`, `payment`). Different arrays, different naming conventions.
**Fix:**
- Created canonical type in `src/types/checkout.ts` with 3 steps
- Updated CheckoutLayout to match: `["address", "time", "payment"]`
- Removed "review" step (combined with payment), renamed "pay" → "payment"
**Prevention:** Single source of truth for shared constants. Export from types file, import everywhere else.

---

## 2026-01-18: V4 Bug - Stylelint Config for Tailwind 4
**Type:** Config | **Severity:** Low
**Files:** `.stylelintrc.json`

**Error:** 90+ stylelint errors on first run - complaints about `@theme`, `@custom-variant`, `@utility` at-rules
**Root Cause:** Default stylelint-config-standard doesn't recognize Tailwind 4's new CSS syntax (`@theme`, `@custom-variant`, `@utility`, `@config`)
**Fix:** Extended `.stylelintrc.json` ignoreAtRules to include all Tailwind 4 directives:
```json
{
  "rules": {
    "at-rule-no-unknown": [true, {
      "ignoreAtRules": ["tailwind", "apply", "layer", "config", "theme", "custom-variant", "utility"]
    }],
    "function-no-unknown": [true, { "ignoreFunctions": ["theme", "var"] }]
  }
}
```
Also disabled rules incompatible with Tailwind's output: `import-notation`, `color-function-notation`, `media-feature-range-notation`, etc.
**Prevention:** When adding stylelint to Tailwind projects, check Tailwind version and add all directive names to ignoreAtRules.

---

## 2026-01-23: TailwindCSS 4 CSS Parsing Error with Arbitrary Z-Index Values
**Type:** Build | **Severity:** High
**Files:** `src/app/globals.css`, 42 component files with `z-[var(--zindex-*)]`

**Error:**
```
./src/app/globals.css:805:22
Parsing CSS source code failed
.z-\[var\(--z-*\)\] {
  z-index: var(--z-*);
}
Unexpected token Delim('*')
```

**Root Cause:** TailwindCSS 4 generates fallback patterns for arbitrary value classes. When multiple `z-[var(--zindex-*)]` classes exist (modal, fixed, sticky, etc.), TailwindCSS creates a wildcard pattern `.z-\[var\(--z-*\)\]` as a fallback. The `*` wildcard in the CSS output is invalid CSS syntax.

**Fix:** Migrate from arbitrary values to named TailwindCSS utilities:
```tsx
// Before (causes parsing error)
className="z-[var(--zindex-modal)]"
className="z-[var(--zindex-modal-backdrop)]"

// After (works correctly)
className="z-modal"
className="z-modal-backdrop"
```

Required changes:
1. Define numeric values in `tailwind.config.ts`:
   ```ts
   zIndex: {
     modal: "50",
     "modal-backdrop": "40",
     // ...
   }
   ```
2. Migrate all 57 occurrences across 42 files via sed replacement

**Prevention:** Use named Tailwind utilities (`z-modal`) instead of arbitrary CSS variable syntax (`z-[var(--zindex-modal)]`) for z-index. Named utilities are safer and more maintainable.

---

## 2026-01-22: TailwindCSS @theme Token Name Mismatch in TypeScript Constants
**Type:** Runtime | **Severity:** High
**Files:** `src/design-system/tokens/z-index.ts`, `src/app/globals.css`

**Error:** Inline styles using `zIndexVar.modal` silently fail - elements don't receive z-index
**Root Cause:** CSS defines `--z-index-modal` (with category prefix for TailwindCSS 4 utility generation), but TypeScript zIndexVar references `var(--z-modal)` (without prefix). CSS variable doesn't exist, so style is ignored.

**Detection:** Verifier caught this during phase goal validation - checked actual CSS against TypeScript exports.

**Fix:** Update zIndexVar to use full CSS variable names:
```typescript
// Before (broken - references non-existent variable)
export const zIndexVar = {
  modal: "var(--z-modal)",
};

// After (working - matches actual CSS variable)
export const zIndexVar = {
  modal: "var(--z-index-modal)",
};
```

**Prevention:** When creating TypeScript token constants that mirror CSS custom properties, verify the exact CSS variable names in the source file. TailwindCSS 4 @theme strips prefixes for utility generation (`--z-index-modal` → `z-modal`), but the CSS variable keeps the full name.

---
