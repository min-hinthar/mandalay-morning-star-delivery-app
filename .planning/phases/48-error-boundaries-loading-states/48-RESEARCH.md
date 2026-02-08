# Phase 48: Error Boundaries & Loading States - Research

**Researched:** 2026-02-07
**Domain:** Next.js App Router error/loading file conventions, Sentry integration, CSS animations
**Confidence:** HIGH

## Summary

Phase 48 fills gaps in error recovery and loading feedback across all route segments. The project already has 8 error.tsx files (4 legacy hand-crafted, 4 using `RouteError` component) and 4 loading.tsx files (all using `RouteLoading`). The task adds ~6 new error.tsx files per INFR-01, ~11 new loading.tsx files per INFR-02, and refactors the `RouteError` component to use CSS-only animations per ERRP-06.

Two key patterns exist:
- **New pattern (use this):** 3-6 line files delegating to `RouteError`/`RouteLoading` components
- **Legacy pattern (do not copy):** 50+ line hand-crafted error pages with inline JSX

The `RouteError` component currently uses Framer Motion (`m.div` from `framer-motion`), which violates ERRP-06. It must be refactored to use CSS-only `animate-fade-in-up` from `src/styles/animations.css`.

**Primary recommendation:** Refactor `RouteError` to CSS-only animation, then create all missing error/loading files using the 3-6 line delegation pattern.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Two actions on error: **retry** (primary button) and **go home** (secondary/ghost button)
- After 2+ retry failures, emphasize the "go home" action more prominently
- Show technical error details (message, stack trace) in **development mode only**; production stays clean
- Light personality tone: friendly but brief ("Oops, we hit a bump!" style, not generic "Something went wrong")
- Same error boundary style for all roles (admin, customer, driver) -- no role-specific differences
- Log errors to **Sentry** in production
- Error boundary mounts with **subtle CSS fade-in** animation
- Nested layout error handling: Claude's discretion on section-only vs full-page based on Next.js hierarchy
- **Reuse existing** skeleton components and RouteLoading component for all new loading states
- All missing loading.tsx files get **generic RouteLoading** -- no custom skeletons per page
- **CSS-only for error files, Framer Motion allowed for loading files** (if already imported)
- App shell (nav, sidebar) stays visible during loading -- only content area shows loading state
- **Lightly branded** -- uses app colors, Morning Star logo, friendly tone
- **Logo + icon**: Morning Star logo at top, alert icon near the message
- **Soft red/orange** color scheme -- traditional error colors but softened, not aggressive
- Button hierarchy: **retry is primary**, go home is secondary/ghost
- Error card **vertically centered** in the content area

### Claude's Discretion
- Exact skeleton component selection per loading.tsx
- Nested error boundary hierarchy decisions (section vs full-page per route)
- Exact error messages and wording (within "light personality" constraint)
- Sentry integration approach (existing setup vs new)
- CSS fade-in timing and easing

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.2 | App Router `error.tsx` / `loading.tsx` file conventions | Built-in error boundary and Suspense wrappers |
| React | 19.2.3 | `useEffect`, `useState` for retry counter | Runtime |
| @sentry/nextjs | ^10.34.0 | `captureException` in error boundaries | Already configured in project |
| lucide-react | (installed) | `AlertTriangle`, `RefreshCw`, `Home` icons | Already used in existing error components |
| framer-motion | ^12.26.1 | `RouteLoading` component only (NOT error files) | Already used in loading states |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CSS animations | N/A | `animate-fade-in-up` class | Error boundary mount animation (ERRP-06) |
| shadcn Button | (installed) | Primary/ghost button variants | Retry and go-home actions |

### Alternatives Considered
None -- all tools already exist in the project.

**Installation:** No new packages needed.

## Architecture Patterns

### Next.js Component Hierarchy (CRITICAL)

```
layout.tsx
  error.tsx      <-- catches errors from children below
    loading.tsx   <-- Suspense boundary
      page.tsx
        nested layout.tsx
```

**Key rule:** `error.tsx` does NOT catch errors thrown by its sibling `layout.tsx`. To catch layout errors, the `error.tsx` must be in the parent segment.

### Current Route Structure and Coverage

#### Existing error.tsx files (8 total)
| File | Pattern | Notes |
|------|---------|-------|
| `src/app/error.tsx` | Legacy hand-crafted | 60 lines, inline JSX, uses `brand-red` |
| `src/app/(admin)/admin/error.tsx` | Legacy hand-crafted | 60 lines, catches layout errors for all admin sub-routes |
| `src/app/(customer)/orders/error.tsx` | Legacy hand-crafted | 65 lines, 3 buttons |
| `src/app/(driver)/driver/error.tsx` | Legacy hand-crafted | 60 lines |
| `src/app/(admin)/admin/analytics/error.tsx` | RouteError delegation | 13 lines |
| `src/app/(customer)/orders/[id]/tracking/error.tsx` | RouteError delegation | 13 lines |
| `src/app/(public)/error.tsx` | RouteError delegation | 13 lines |
| `src/app/(public)/menu/error.tsx` | RouteError delegation | 13 lines |

#### Missing error.tsx files (INFR-01: 6 required)
| Route Segment | Why Needed | Parent Fallback |
|---------------|-----------|-----------------|
| `(admin)/admin/menu/` | Menu management errors | Falls to `admin/error.tsx` |
| `(admin)/admin/drivers/` | Driver management errors | Falls to `admin/error.tsx` |
| `(admin)/admin/routes/` | Route management errors | Falls to `admin/error.tsx` |
| `(driver)/driver/route/` | Active route errors | Falls to `driver/error.tsx` |
| `(customer)/account/` | Account page errors | Falls to root `error.tsx` |
| `(customer)/checkout/` | Checkout errors | Falls to root `error.tsx` |

#### Additional route segments without error.tsx (beyond INFR-01)
These segments currently bubble up to parent error boundaries. Adding error.tsx here is optional but provides granularity:
| Route Segment | Current Fallback |
|---------------|-----------------|
| `(admin)/admin/categories/` | `admin/error.tsx` |
| `(admin)/admin/orders/` | `admin/error.tsx` |
| `(admin)/admin/photos/` | `admin/error.tsx` |
| `(admin)/admin/sections/` | `admin/error.tsx` |
| `(admin)/admin/settings/` | `admin/error.tsx` |
| `(driver)/driver/history/` | `driver/error.tsx` |
| `(customer)/cart/` | root `error.tsx` |
| `(customer)/orders/[id]/` | `orders/error.tsx` |
| `(auth)/` group (login/signup/forgot) | root `error.tsx` |

**Recommendation:** Per phase goal ("every route segment"), add error.tsx to ALL segments that have a `page.tsx` but no `error.tsx`. However, the strict requirement (INFR-01) only mandates 6. Claude's discretion on how many beyond 6.

#### Existing loading.tsx files (4 total)
| File | Pattern |
|------|---------|
| `(admin)/admin/analytics/loading.tsx` | RouteLoading delegation |
| `(customer)/orders/[id]/tracking/loading.tsx` | RouteLoading delegation |
| `(public)/loading.tsx` | RouteLoading delegation |
| `(public)/menu/loading.tsx` | RouteLoading delegation |

#### Missing loading.tsx files (INFR-02: admin pages + others)
| Route Segment | Suggested Message |
|---------------|-------------------|
| `(admin)/admin/` (root dashboard) | "Loading dashboard..." |
| `(admin)/admin/categories/` | "Loading categories..." |
| `(admin)/admin/drivers/` | "Loading drivers..." |
| `(admin)/admin/drivers/[id]/` | "Loading driver details..." |
| `(admin)/admin/menu/` | "Loading menu..." |
| `(admin)/admin/menu/[id]/` | "Loading menu item..." |
| `(admin)/admin/orders/` | "Loading orders..." |
| `(admin)/admin/photos/` | "Loading photos..." |
| `(admin)/admin/routes/` | "Loading routes..." |
| `(admin)/admin/routes/[id]/` | "Loading route details..." |
| `(admin)/admin/sections/` | "Loading sections..." |
| `(admin)/admin/settings/` | "Loading settings..." |
| `(driver)/driver/` (root) | "Loading dashboard..." |
| `(driver)/driver/route/` | "Loading route..." |
| `(driver)/driver/history/` | "Loading history..." |
| `(customer)/account/` | "Loading account..." |
| `(customer)/checkout/` | "Loading checkout..." |
| `(customer)/cart/` | "Loading cart..." |
| `(customer)/orders/` | "Loading orders..." |

**Note on layout visibility:** The admin layout wraps `{children}` in a `<main className="flex-1 overflow-auto">` div. The `RouteLoading` component currently uses `min-h-screen` which would fill the content area. This is correct -- the nav sidebar stays visible (it's in the layout, outside the error/loading boundary).

### Pattern: RouteError Delegation (use for ALL new error files)

```typescript
'use client'

import { RouteError } from '@/components/ui/RouteError'

export default function XxxError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <RouteError error={error} reset={reset} context="xxx" />
}
```

### Pattern: RouteLoading Delegation (use for ALL new loading files)

```typescript
import { RouteLoading } from '@/components/ui/RouteLoading'

export default function XxxLoading() {
  return <RouteLoading message="Loading xxx..." />
}
```

### Anti-Patterns to Avoid
- **Hand-crafting error pages:** The 4 legacy files (root, admin, orders, driver) have 50-65 lines of inline JSX. New files must use delegation pattern.
- **Using `brand-red` Tailwind class:** Not registered in `@theme inline`, likely resolves to transparent. Use `destructive`, `status-error`, or `primary` instead.
- **Importing Framer Motion in error.tsx files:** Violates ERRP-06 and can cause crash loops if Framer Motion itself errors.
- **Using `min-h-screen` in nested error boundaries:** Admin sub-route error cards should use `min-h-[60vh]` to stay within the sidebar layout.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error boundary UI | Custom JSX per route | `RouteError` component | Consistency, maintainability, single update point |
| Loading states | Custom skeletons per route | `RouteLoading` component | Phase scope says generic loading, no custom skeletons |
| CSS fade animation | Inline CSS or new keyframes | `animate-fade-in-up` from `animations.css` | Already exists with reduced-motion support |
| Sentry error logging | Custom fetch/API calls | `Sentry.captureException()` | Already configured with DSN, replay, tracing |

**Key insight:** The entire phase is wiring up existing components. Almost zero new component code -- just ~13 tiny files delegating to existing components, plus a RouteError refactor.

## Common Pitfalls

### Pitfall 1: Framer Motion in Error Boundaries
**What goes wrong:** If Framer Motion itself errors (bundle load failure, hydration mismatch), an error.tsx that imports Framer Motion creates an infinite crash loop -- the error boundary crashes trying to render the error UI.
**Why it happens:** error.tsx is the last line of defense. Its dependencies must be minimal and reliable.
**How to avoid:** CSS-only animations in error files. `RouteError` must be refactored to remove `m.div` imports.
**Warning signs:** White screen on error, recursive error in React DevTools.

### Pitfall 2: error.tsx Doesn't Catch Layout Errors
**What goes wrong:** An error in `(admin)/admin/layout.tsx` is NOT caught by `(admin)/admin/error.tsx`. It bubbles to the root `error.tsx` or `global-error.tsx`.
**Why it happens:** Next.js component hierarchy: `layout > error > loading > page`. The error boundary wraps the page, not the layout.
**How to avoid:** Accept this hierarchy. The root `error.tsx` and `global-error.tsx` catch layout errors. No need for workarounds.
**Warning signs:** Error in admin sidebar shows root error page instead of admin-styled error.

### Pitfall 3: `brand-red` Is a Ghost Token
**What goes wrong:** `text-brand-red` and `bg-brand-red/10` appear in 24 files but `brand-red` is not registered in `@theme inline` in globals.css. In Tailwind v4 + Turbopack, this means the utility class resolves to nothing.
**Why it happens:** Legacy class from before the Tailwind v4 migration. Was never cleaned up.
**How to avoid:** Use `destructive` (Shadcn), `status-error` (design tokens), or `primary` (brand red). For the "soft red/orange" user preference, use `status-error` (`#C45C4A` light / `#FF6B6B` dark) or `destructive` (`#dc2626` light / `#F87171` dark).
**Warning signs:** Error icon/text appearing without color (default text color instead of red).

### Pitfall 4: RouteLoading Uses min-h-screen
**What goes wrong:** `RouteLoading` has `min-h-screen` which works for full-page loading but may look odd in nested admin routes where the sidebar takes up space.
**Why it happens:** Component was designed for top-level routes.
**How to avoid:** This is acceptable for admin routes because the sidebar is in the layout (stays visible), and `min-h-screen` on the content area just fills the remaining space. The flex layout handles this correctly.

### Pitfall 5: Sentry Client-Side Is Disabled in Dev
**What goes wrong:** Sentry `captureException` calls in error boundaries won't do anything in development because `instrumentation-client.ts` only initializes Sentry in production.
**Why it happens:** Sentry/Next.js 16 compatibility issue causing infinite loops.
**How to avoid:** This is a known state. Error boundaries should still call `captureException` -- it's a no-op in dev but works in production. Add `console.error(error)` as dev fallback (already done in existing components).

### Pitfall 6: Retry Counter State Management
**What goes wrong:** User requirement says "After 2+ retry failures, emphasize go home action." If retry counter is stored in component state, it resets when the error boundary re-mounts.
**Why it happens:** When `reset()` succeeds momentarily then fails again, React re-mounts the error boundary, resetting state.
**How to avoid:** Use `useRef` for the retry counter, or store in a module-level variable scoped to the component instance. The counter should increment on each `reset()` call and never reset during the component's lifecycle.

## Code Examples

### RouteError Refactored (CSS-only animation)

```typescript
// Source: Codebase analysis + CONTEXT.md decisions
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import * as Sentry from '@sentry/nextjs'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RouteErrorProps {
  error: Error & { digest?: string }
  reset: () => void
  context?: string
}

export function RouteError({ error, reset, context }: RouteErrorProps) {
  const retryCount = useRef(0)
  const [showHomeEmphasis, setShowHomeEmphasis] = useState(false)

  useEffect(() => {
    Sentry.captureException(error, {
      tags: { location: `route-error-${context ?? 'unknown'}` },
      extra: { digest: error.digest },
    })
    console.error(error)
  }, [error, context])

  const handleRetry = useCallback(() => {
    retryCount.current += 1
    if (retryCount.current >= 2) {
      setShowHomeEmphasis(true)
    }
    reset()
  }, [reset])

  return (
    <div className="animate-fade-in-up min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Morning Star logo */}
        <Image
          src="/logo.png"
          alt="Morning Star"
          width={48}
          height={48}
          className="mx-auto mb-4"
          style={{ height: 'auto' }}
        />
        {/* Alert icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-status-error-bg flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-status-error" />
        </div>
        <h1 className="text-xl font-display text-text-primary mb-2">
          Oops, we hit a bump!
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          {context
            ? `We couldn't load the ${context}. Give it another shot!`
            : 'Something unexpected happened. Give it another shot!'}
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="text-xs bg-surface-tertiary p-3 rounded-md overflow-auto max-h-24 mb-6 text-left">
            {error.message}
            {error.stack && '\n\n' + error.stack}
          </pre>
        )}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={handleRetry}
            variant={showHomeEmphasis ? 'outline' : 'default'}
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button
            asChild
            variant={showHomeEmphasis ? 'default' : 'ghost'}
            size="sm"
          >
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### Error File Delegation Pattern

```typescript
// Source: Existing codebase pattern (analytics/error.tsx, tracking/error.tsx)
'use client'

import { RouteError } from '@/components/ui/RouteError'

export default function MenuError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <RouteError error={error} reset={reset} context="menu" />
}
```

### Loading File Delegation Pattern

```typescript
// Source: Existing codebase pattern (analytics/loading.tsx)
import { RouteLoading } from '@/components/ui/RouteLoading'

export default function MenuLoading() {
  return <RouteLoading message="Loading menu..." />
}
```

### CSS Animation (Already Exists)

```css
/* Source: src/styles/animations.css lines 90-94, 192-195 */
.animate-fade-in-up {
  animation: fade-in-up 500ms ease-out;
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Reduced motion support already included */
[data-reduce-motion="true"] .animate-fade-in-up {
  animation: none !important;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hand-crafted 50-line error pages | 3-line delegation to `RouteError` | Analytics/tracking error.tsx additions | 10x less code per file |
| Framer Motion in error boundaries | CSS-only animations (ERRP-06) | This phase | Eliminates crash loop risk |
| `brand-red` color class | `status-error` or `destructive` | Tailwind v4 migration | `brand-red` not in @theme inline |

**Deprecated/outdated:**
- `brand-red` Tailwind class: Not registered in `@theme inline`, resolves to nothing in Tailwind v4 + Turbopack
- Hand-crafted error boundaries: `src/app/error.tsx`, `(admin)/admin/error.tsx`, `(customer)/orders/error.tsx`, `(driver)/driver/error.tsx` should be migrated to use `RouteError` delegation (but that's optional scope expansion)

## Existing Infrastructure Inventory

### Components
| Component | File | Uses Framer Motion? |
|-----------|------|---------------------|
| `RouteError` | `src/components/ui/RouteError.tsx` | YES (m.div) -- must refactor |
| `RouteLoading` | `src/components/ui/RouteLoading.tsx` | YES (m.div, AnimatePresence) -- OK per user decision |
| `BrandedSpinner` | `src/components/ui/branded-spinner.tsx` | YES (m.svg) -- used by RouteLoading |
| `MapErrorCard` | `src/components/ui/maps/MapErrorCard.tsx` | YES -- component-level, not error.tsx |
| `ChartErrorCard` | `src/components/ui/admin/analytics/ChartErrorCard.tsx` | YES -- component-level |

### Skeleton Components (available for future custom loading states, not needed this phase)
| Component | File |
|-----------|------|
| `Skeleton` (base) | `src/components/ui/skeleton/base.tsx` |
| `SkeletonCard` | `src/components/ui/skeleton/card-skeletons.tsx` |
| `SkeletonTableRow` | `src/components/ui/skeleton/table-skeletons.tsx` |
| `SkeletonText` | `src/components/ui/skeleton/text-skeletons.tsx` |

### Sentry Setup
| File | Status |
|------|--------|
| `instrumentation.ts` | Active -- server + edge Sentry init |
| `instrumentation-client.ts` | **Production only** -- disabled in dev due to Next.js 16 compat issue |
| `sentry.server.config.ts` | Active |
| `sentry.edge.config.ts` | Active |
| `global-error.tsx` | Active -- Sentry.captureException |

### Logo Asset
- `public/logo.png` -- Morning Star logo (use in RouteError component)
- `public/icons/icon-192.png` -- App icon (PWA)
- `public/icons/icon-512.png` -- App icon (PWA)
- `BrandedSpinner` -- Inline SVG star (used by RouteLoading, not a file asset)

## Open Questions

1. **Morning Star Logo Asset Path -- RESOLVED**
   - Logo exists at `public/logo.png` (also `public/icons/icon-192.png` and `public/icons/icon-512.png`)
   - Use `/logo.png` via Next.js `Image` component in the RouteError component
   - Recommendation: Use `Image` with `width={48} height={48} style={{ height: 'auto' }}` per Next.js learnings

2. **Legacy Error File Migration Scope**
   - What we know: 4 legacy error files exist with hand-crafted JSX
   - What's unclear: Whether they should be migrated to RouteError delegation in this phase
   - Recommendation: Include migration of the 4 legacy files to maintain consistency. Each becomes 3-6 lines. Low risk, high consistency value. Claude's discretion.

3. **Color Choice for "Soft Red/Orange"**
   - What we know: User wants "soft red/orange" color scheme, not aggressive
   - Available tokens: `status-error` is `#C45C4A` (warm terracotta), `destructive` is `#dc2626` (standard red), `orange` is `#E87D1E`
   - Recommendation: Use `status-error` (`#C45C4A`) -- it's the softest red in the palette. For background, `status-error-bg` provides a 10% opacity soft wash. This matches "traditional error colors but softened."

## Sources

### Primary (HIGH confidence)
- Context7 `/vercel/next.js` -- error.tsx file conventions, component hierarchy, loading.tsx patterns
- Codebase analysis -- all 8 existing error.tsx, 4 loading.tsx, RouteError, RouteLoading, skeleton library
- `src/styles/animations.css` -- existing `animate-fade-in-up` CSS animation with reduced-motion support
- `src/styles/tokens.css` -- color token values for status-error, destructive, accent-orange
- `src/app/globals.css` -- @theme inline block (confirms brand-red is NOT registered)

### Secondary (MEDIUM confidence)
- `instrumentation-client.ts` -- Sentry production-only constraint documented in code comments
- `.claude/learnings/tailwind-v4.md` -- brand-red ghost token pattern

### Tertiary (LOW confidence)
- None -- all items verified

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and configured
- Architecture: HIGH -- patterns verified from existing codebase files
- Pitfalls: HIGH -- identified from direct code analysis and learnings files
- Color tokens: HIGH -- verified against tokens.css and @theme inline
- Logo availability: HIGH -- verified at `public/logo.png`

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (stable domain, low change velocity)
