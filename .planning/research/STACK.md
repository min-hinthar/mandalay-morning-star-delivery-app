# Stack Research: v1.6 Production Polish

**Domain:** Meal delivery PWA - production polish features
**Researched:** 2026-02-07
**Confidence:** HIGH

## Executive Summary

The v1.6 production polish milestone requires minimal new dependencies. The existing stack (Next.js 16, Framer Motion, Zustand, Supabase, cmdk, Serwist) already covers 80% of what's needed. The primary additions are: (1) `resend` + `@react-email/components` for server-side email rendering in Next.js API routes (replacing raw HTML strings in Supabase Edge Functions), and (2) leveraging Serwist's built-in `BackgroundSyncQueue` for driver offline retry (already bundled, just not used). Everything else -- auth form animations, settings page, 404 page, cart validation, command palette enhancement -- uses existing libraries with no new installs.

---

## New Dependencies (Install These)

### Email System

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| resend | ^6.9.1 | Email sending from Next.js API routes | Already used via raw HTTP in Edge Functions; SDK gives type-safe API, React component rendering, delivery tracking. Current driver invite flow already calls Resend API manually. |
| @react-email/components | ^1.0.7 | Email template components | Replaces raw HTML string templates in Edge Functions. Type-safe JSX, preview-able, maintainable. Supports dark mode as of v5.0. |
| @react-email/render | ^2.0.4 | Render React Email to HTML string | Needed to render templates server-side in API routes. Used by `resend.emails.send({ react: <Component /> })` internally but useful for preview/testing. |

**Rationale for server-side email shift:**
Current email system uses Supabase Edge Functions with raw HTML template strings (500+ lines in `send-order-confirmation/index.ts` and `send-delivery-notification/index.ts`). For the new refund/cancel notification emails, building in the Next.js app with React Email components is more maintainable:
- Same language and tooling as the rest of the codebase
- React components for email templates (reusable headers, footers, buttons)
- Preview in browser during development
- Type-safe props for template data
- Existing Edge Functions continue to work for current flows

**Installation:**
```bash
pnpm add resend @react-email/components @react-email/render
```

---

## Existing Stack (No New Installs Needed)

### 1. Auth Form Animations

| Existing Library | Version | Feature Area | How Used |
|-----------------|---------|--------------|----------|
| framer-motion | 12.26.1 | Premium auth form animations | AnimatePresence for form transitions, m.div for field reveals, spring physics for submit button states. LazyMotion with domMax already configured. |
| react-hook-form | 7.71.1 | Form state management | Already used for auth forms. Add field-level animations tied to validation state. |
| @hookform/resolvers | 5.2.2 | Zod validation | Already wired. Use for inline validation feedback animations. |

**Pattern:** Existing `LoginForm.tsx` and `SignupForm.tsx` use basic Card layout with server actions. Enhance with Framer Motion variants for:
- Tab switching animation between login/signup
- Field entrance stagger (opacity + translateY)
- Error shake animation on validation failure
- Success checkmark morph on magic link sent
- Loading spinner transition on submit

**No new library needed.** Framer Motion 12.x supports all required animation patterns. The `AnimatePresence` + `m.div` components already used in `CommandPalette.tsx` demonstrate the exact patterns needed.

### 2. Customer Settings Page

| Existing Library | Version | Feature Area | How Used |
|-----------------|---------|--------------|----------|
| next-themes | 0.4.6 | Theme toggle (light/dark/system) | Already integrated. Settings page exposes `useTheme().setTheme()` via radio group. |
| @radix-ui/react-radio-group | 1.3.1 | Preference selections | Already installed. Use for notification preferences, dietary preferences, theme selection. |
| @radix-ui/react-checkbox | 1.3.2 | Toggle preferences | Already installed. Use for individual notification toggles (email, push). |
| @radix-ui/react-select | 2.2.6 | Dropdown selections | Already installed. Use for language, delivery time defaults. |
| zustand | 5.0.10 | Client-side preference persistence | Already used for cart/driver stores. Create `usePreferencesStore` with same persist pattern. |
| zod | 4.3.5 | Settings validation | Already used. Define settings schema for type-safe preferences. |

**Architecture:** Customer settings stored in two layers:
1. **Supabase `profiles` table** -- server-authoritative preferences (notification preferences, delivery defaults, dietary restrictions) synced on save
2. **Zustand + localStorage** -- UI preferences (theme, language) for instant client-side reactivity

**No customer settings page exists yet.** Route: `/settings`. Uses existing form patterns from admin settings page (`src/app/(admin)/admin/settings/page.tsx`).

### 3. Cart Validation (Stale Item Detection)

| Existing Library | Version | Feature Area | How Used |
|-----------------|---------|--------------|----------|
| zustand | 5.0.10 | Cart store | `useCartStore` already persists to localStorage. Add `validateCart()` method that cross-references menu API on mount. |
| @tanstack/react-query | 5.90.1 | Menu data fetching | Use `useQuery` to fetch current menu prices on cart page mount. Compare against stored `basePriceCents`. |

**Pattern:** On cart page mount or checkout page mount:
1. Fetch current menu items via existing `/api/menu` endpoint
2. Compare each cart item's `basePriceCents` and `menuItemId` against live data
3. Flag items that are: removed from menu, price-changed, or out-of-stock
4. Show inline warning per item with "Remove" or "Update Price" actions
5. Block checkout if any flagged items remain

**No new dependency needed.** Uses existing cart store + React Query for the validation check.

### 4. Driver Offline Sync Retry

| Existing Library | Version | Feature Area | How Used |
|-----------------|---------|--------------|----------|
| serwist | 9.5.4 | Service worker with background sync | Serwist includes `BackgroundSyncQueue` and `BackgroundSyncPlugin` out of the box. Currently NOT used -- the app has a custom IndexedDB sync implementation. |

**Current state:** The app already has a full offline sync system:
- `src/lib/services/offline-store/db.ts` -- IndexedDB database with pending stores
- `src/lib/services/offline-store/sync.ts` -- sequential sync with no retry/backoff
- `src/lib/hooks/useOfflineSync.ts` -- React hook with queue/sync/counts
- `src/lib/stores/driver-store.ts` -- Zustand store with pending actions queue

**What's missing:** Exponential backoff, retry limits, and Background Sync API integration. Two options:

**Option A (Recommended): Enhance existing custom implementation**
- Add exponential backoff to `syncPendingItems()` (5s base, 5min cap)
- Add `retryCount` and `maxRetries` fields to pending items in IndexedDB
- Add `navigator.serviceWorker.ready.then(reg => reg.sync.register('pending-sync'))` to trigger sync from service worker
- Keep existing IndexedDB stores (no migration needed)

**Option B: Replace with Serwist BackgroundSyncPlugin**
- More standard, but requires rewriting the sync layer
- Plugin automatically intercepts failed fetch requests and replays them
- Less control over sync order and conflict resolution

**Recommendation: Option A.** The existing custom implementation already handles the domain-specific sync logic (status updates, photo uploads, location updates have different retry semantics). Adding backoff + SW integration is ~50 lines of code. Ripping it out for Serwist's generic plugin loses domain logic.

### 5. Premium 404 Page

| Existing Library | Version | Feature Area | How Used |
|-----------------|---------|--------------|----------|
| framer-motion | 12.26.1 | Animation | Animated illustration, staggered text reveal, hover effects on CTA button |
| lucide-react | 0.562.0 | Icons | 404 visual elements (search, map-pin, utensils for food-themed 404) |

**Pattern:** Next.js App Router uses `not-found.tsx` at the root app level. Currently no `not-found.tsx` exists. Create `src/app/not-found.tsx` with:
- Animated food illustration (CSS/SVG animation or Framer Motion)
- Branded color scheme using existing design tokens
- Search bar linking to command palette
- Popular menu items as suggestions
- "Back to menu" CTA with hover animation

**No new dependency needed.** GSAP could be used for a more elaborate illustration animation but Framer Motion is simpler and already the primary animation library for React components.

### 6. Enhanced Command Palette

| Existing Library | Version | Feature Area | How Used |
|-----------------|---------|--------------|----------|
| cmdk | 1.1.1 | Command palette core | Already integrated in `CommandPalette.tsx`. Has `keywords` prop (added in 1.1) for enhanced filtering. |
| framer-motion | 12.26.1 | Animations | Already used for backdrop + dialog spring animations. |

**Current implementation:** `src/components/ui/search/CommandPalette/` with:
- cmdk integration for keyboard nav and filtering
- Recent searches with localStorage
- Popular item suggestions
- Spring-animated entrance/exit

**Enhancements (no new deps):**
- Add category-based grouping (`Command.Group`)
- Add keyboard shortcut hints per result
- Fuzzy matching via cmdk's built-in `command-score`
- Action commands (not just search): "Go to cart", "Go to orders", "Toggle theme"
- Item previews with thumbnail and price

**cmdk 1.1.1 is current.** Last published ~1 year ago, stable, no breaking changes expected. The `keywords` prop and `asChild` prop added in 1.1 are already available.

### 7. Email Notifications (Order Confirmation, Refund, Cancel)

| Existing Library | Version | Feature Area | How Used |
|-----------------|---------|--------------|----------|
| resend (NEW) | ^6.9.1 | Email delivery | Send refund/cancel notification emails from Next.js API routes |
| @react-email/components (NEW) | ^1.0.7 | Email templates | Build maintainable templates for: order confirmation, refund processed, order cancelled |

**Current state:** Two Supabase Edge Functions handle order confirmation and delivery notifications using raw HTML strings with inline styles. These work but are unmaintainable.

**New emails needed:**
1. **Refund processed** -- triggered from `/api/admin/orders/[id]/refund` (already exists)
2. **Order cancelled** -- triggered from `/api/admin/orders/[id]/cancel` (already exists)
3. **Order confirmation (v2)** -- migrate existing Edge Function template to React Email (optional, can keep Edge Function)

**Architecture decision:** Build new email templates in `src/emails/` using React Email. Send via Resend SDK from existing API routes. Keep existing Edge Functions running for backward compatibility -- migrate them to React Email in a future phase.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| resend + @react-email/components | Keep Supabase Edge Functions with raw HTML | If you want to avoid adding dependencies; but raw HTML templates are fragile at 500+ lines |
| Custom exponential backoff | Serwist BackgroundSyncPlugin | If starting from scratch with no existing sync logic; not worth it here since custom sync already handles domain-specific retry semantics |
| Framer Motion for 404 animation | Lottie (lottie-react) | If you want a designer-created animated illustration; adds ~45KB dependency for a single page |
| Zustand for preferences | Supabase only (no client cache) | If preferences rarely change and you don't need instant UI updates; latency on theme toggle would be poor |
| cmdk 1.1.1 (keep current) | @udecode/cmdk or kbar | If you need multi-context menus or editor-style palettes; overkill for food search |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| nodemailer | Requires SMTP config, no delivery tracking, poor DX | resend (API-based, React component support) |
| lottie-react / lottie-web | 45KB+ dependency for single 404 page animation | Framer Motion (already installed, 0KB marginal cost) |
| react-i18next / next-intl | Premature for language settings; app has Burmese name fields but no full i18n | Store language preference in settings, implement i18n when needed |
| web-push | Push notification library; premature unless push notifications are in scope | Defer to post-launch; email notifications cover v1.6 |
| idb (IndexedDB wrapper) | Convenience wrapper for IndexedDB | Existing custom IndexedDB implementation in `src/lib/services/offline-store/` already works |
| @tanstack/react-form | Alternative form library | react-hook-form already deeply integrated; switching adds migration cost for zero benefit |
| sonner | Toast library | @radix-ui/react-toast already installed and configured |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| resend@^6.9.1 | Next.js 16, React 19 | Server-side only; import in API routes, not client components |
| @react-email/components@^1.0.7 | React 19 | Render on server only; components export JSX for email |
| @react-email/render@^2.0.4 | @react-email/components@^1.0.7 | Peer dependency; renders React Email to HTML string |
| cmdk@1.1.1 | React 19 | Already verified working in current codebase |
| serwist@9.5.4 | BackgroundSyncQueue | Built-in; import from `serwist` package directly |

**React 19 compatibility note:** resend and @react-email/components both support React 19. The `react` property in `resend.emails.send()` accepts a React element and renders it server-side.

**Next.js 16 compatibility note:** Add `@react-email/render` to `serverComponentsExternalPackages` in `next.config.ts` if build errors occur (known issue with SSR bundling of email rendering).

---

## Integration Points

### Email Flow Architecture

```
Current (keep for now):
  Stripe webhook -> API route -> Supabase Edge Function -> Resend API (raw HTML)

New (for refund/cancel):
  Admin action -> API route -> resend.emails.send({ react: <Template /> })

Future migration:
  Stripe webhook -> API route -> resend.emails.send({ react: <Template /> })
```

### Settings Page Data Flow

```
Client                          Server
  |                                |
  |-- usePreferencesStore -------->| (Zustand, localStorage)
  |   (theme, language - instant)  |
  |                                |
  |-- POST /api/settings -------->| (Supabase profiles table)
  |   (notifications, dietary,     |
  |    delivery defaults - on save)|
  |                                |
  |<- GET /api/settings -----------|
  |   (hydrate on page load)       |
```

### Cart Validation Flow

```
Cart page mount
  |
  v
useQuery('/api/menu') -- fetch current menu
  |
  v
compareCartItems(cartStore.items, menuData)
  |
  v
Mark stale items: { removed, priceChanged, outOfStock }
  |
  v
Show inline warnings per item
  |
  v
Block checkout until resolved
```

---

## Installation Summary

```bash
# New dependencies (3 packages)
pnpm add resend @react-email/components @react-email/render

# No dev dependencies needed
# No config changes needed (beyond next.config.ts serverComponentsExternalPackages if needed)
```

**Total new dependency cost:**
- resend: ~15KB (server-only, no client bundle impact)
- @react-email/components: ~25KB (server-only, no client bundle impact)
- @react-email/render: ~10KB (server-only, no client bundle impact)
- Client bundle impact: 0KB (all server-side)

---

## Configuration Required

### next.config.ts (if needed)

```typescript
const nextConfig = {
  // Add only if @react-email/render causes SSR bundling errors
  serverExternalPackages: ['@react-email/render'],
};
```

### Email template directory

```
src/emails/
  components/
    EmailHeader.tsx      # Shared branded header
    EmailFooter.tsx      # Shared footer with address
    EmailButton.tsx      # Branded CTA button
  OrderConfirmation.tsx  # Migrate from Edge Function (future)
  RefundProcessed.tsx    # NEW
  OrderCancelled.tsx     # NEW
```

### Resend client wrapper

```typescript
// src/lib/services/email.ts
import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);
```

**Environment variable:** `RESEND_API_KEY` already configured (used by Supabase Edge Functions). Same key works for the Node.js SDK.

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Email stack (resend + react-email) | HIGH | Already using Resend via raw HTTP; SDK is the official abstraction. React Email 5.0 confirmed React 19 + Tailwind 4 support. |
| Auth form animations | HIGH | Framer Motion 12.x already in use; patterns demonstrated in CommandPalette.tsx |
| Settings page | HIGH | All UI primitives already installed (Radix, RHF, Zustand); follows admin settings pattern |
| Cart validation | HIGH | Uses existing cart store + menu API; pure business logic, no new deps |
| Driver offline retry | HIGH | Custom IndexedDB sync already exists; enhancement is straightforward |
| 404 page | HIGH | Standard Next.js file convention + Framer Motion |
| Command palette | HIGH | cmdk 1.1.1 already integrated; enhancements use existing API |

---

## Sources

- [resend npm](https://www.npmjs.com/package/resend) -- v6.9.1 confirmed, published 11 days ago
- [@react-email/components npm](https://www.npmjs.com/package/@react-email/components) -- v1.0.7 confirmed
- [@react-email/render npm](https://www.npmjs.com/package/@react-email/render) -- v2.0.4 confirmed
- [React Email 5.0 announcement](https://resend.com/blog/react-email-5) -- dark mode, Tailwind 4 support
- [cmdk npm](https://www.npmjs.com/package/cmdk) -- v1.1.1, keywords prop, asChild prop
- [Serwist background sync guide](https://serwist.pages.dev/docs/serwist/guide/background-syncing) -- BackgroundSyncQueue API
- [Next.js not-found convention](https://nextjs.org/docs/app/api-reference/file-conventions/not-found) -- App Router file convention
- [Framer Motion docs](https://motion.dev/docs) -- AnimatePresence, variants, spring physics
- Codebase analysis: `package.json`, `src/lib/services/offline-store/`, `src/lib/stores/cart-store.ts`, `src/components/ui/auth/LoginForm.tsx`, `src/components/ui/search/CommandPalette/`, `supabase/functions/`
- Previous research: `.planning/phases/36.2-feature-finalization-polish/36.2-RESEARCH.md`

---
*Stack research for: v1.6 Production Polish*
*Researched: 2026-02-07*
