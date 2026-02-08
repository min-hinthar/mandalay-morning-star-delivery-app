# Pitfalls Research: v1.6 Production Polish

**Domain:** Production polish for existing animation-heavy Next.js 16 meal delivery PWA
**Researched:** 2026-02-07
**Confidence:** HIGH (codebase audit + official docs + project error history)

---

## Critical Pitfalls

### Pitfall 1: Auth Form Animations Breaking Focus Management and Accessibility

**What goes wrong:**
Adding Framer Motion animations to the auth form (login, signup, forgot-password) disrupts keyboard focus order, screen reader announcements, and `prefers-reduced-motion`. Animated form transitions cause: (a) focus trapped in invisible elements during exit animations, (b) autofill popups positioned incorrectly relative to animated inputs, (c) magic link success message announced before animation completes (or never announced if animated in).

**Why it happens:**
Framer Motion `AnimatePresence` removes DOM elements during exit animations. If focus is on a child element when it exits, focus is lost entirely. Developers animate the form container without managing focus programmatically. Browser autofill popups anchor to DOM position, not visual position -- animated `transform` creates disconnect.

**How to avoid:**
- Use `onExitComplete` to move focus to the next logical element after exit animation finishes
- Set `aria-live="polite"` on success/error message containers so screen readers announce them after animation settles
- Keep input elements in DOM during transitions (animate opacity/transform, not mount/unmount)
- Test with `prefers-reduced-motion: reduce` -- auth must work with zero animation
- Framer Motion v8+ makes tap events keyboard-accessible by default (`tabindex="0"` on tap listeners) -- leverage this, don't override it

**Warning signs:**
- Focus visually disappears after form step transitions
- Tab key navigates to elements behind/inside animated containers
- `useReducedMotion()` hook not checked before applying auth animations
- Browser password autofill popup appears in wrong position

**Phase to address:** Auth form redesign phase

**Project context:** Current `LoginForm.tsx` is simple (83 lines, no animations). Adding animations to a working auth form is high-risk for regressions. The existing `NEXT_REDIRECT` error in `ERROR_HISTORY.md` shows this codebase has had issues with auth flow interruptions.

---

### Pitfall 2: Cart Validation Race Condition on Zustand Hydration

**What goes wrong:**
Cart validation fires before Zustand persist middleware finishes hydrating from localStorage. Validation sees empty cart (initial state), marks everything as stale, then hydration loads the real cart -- but validation already ran. User sees "your cart is empty" flash, then items appear, or worse, validation already cleared the cart.

**Why it happens:**
Zustand persist with `createJSONStorage(getStorage)` hydrates asynchronously on mount. The store starts with `items: []` (the initial state in `cart-store.ts` line 128). Any `useEffect` or component logic that reads `items` on first render sees the empty array. Server-rendered HTML shows empty cart, client hydrates with persisted items -- SSR mismatch.

**How to avoid:**
- Use Zustand's `onRehydrateStorage` callback to flag hydration completion:
  ```typescript
  persist({
    // ...existing config
    onRehydrateStorage: () => (state) => {
      // state is now hydrated, safe to validate
      useCartStore.setState({ _hydrated: true });
    },
  })
  ```
- Gate all cart validation logic behind `_hydrated === true`
- For SSR mismatch: render cart skeleton until hydrated (avoid showing empty cart then popping items in)
- The existing `useCartStore` already uses `partialize` correctly (line 258) -- maintain this

**Warning signs:**
- Cart page flashes "empty cart" before showing items
- Validation logic runs in `useEffect` without checking hydration state
- Console hydration mismatch warnings on cart/checkout pages
- Test passes in dev (hot reload preserves state) but fails on fresh page load

**Phase to address:** Cart validation phase

**Project context:** Cart store (`cart-store.ts`) persists to localStorage with `mms-cart` key. Checkout store (`checkout-store.ts`) does NOT persist -- intentional. Validation must handle the asymmetry: cart is persisted, checkout state resets on refresh.

---

### Pitfall 3: Stripe Webhook Duplicate Processing Without Idempotency

**What goes wrong:**
Stripe sends the same webhook event multiple times (retry on timeout, network flake). Without idempotency, the Edge Function processes each delivery: sends duplicate emails ("Your order has been confirmed" x3), creates duplicate database records, or charges wrong amounts by applying discounts twice.

**Why it happens:**
Supabase Edge Functions have cold starts (1-3 seconds). If the function takes >5 seconds on first invocation, Stripe's timeout fires and retries. The retry arrives while the first invocation is still processing -- both execute. Stripe explicitly documents: "Webhook endpoints might occasionally receive the same event more than once."

**How to avoid:**
- Store processed `event.id` in a Supabase table with a UNIQUE constraint before processing:
  ```sql
  INSERT INTO webhook_events (event_id, event_type, processed_at)
  VALUES ($1, $2, NOW())
  ON CONFLICT (event_id) DO NOTHING
  RETURNING event_id;
  ```
  If insert returns no rows, event was already processed -- skip
- Verify webhook signature within 5-minute window (Stripe requirement)
- Disable default JWT auth for webhook endpoint in `config.toml`:
  ```toml
  [functions.stripe-webhook]
  verify_jwt = false
  ```
- Use conditional database writes: `UPDATE orders SET status = 'confirmed' WHERE status = 'pending'` -- prevents re-confirming already-confirmed orders

**Warning signs:**
- No `webhook_events` or equivalent idempotency table in database schema
- Edge Function processes event without checking if it was already handled
- Email sends are not gated behind a status check
- No signature verification (Stripe's `constructEvent` call)

**Phase to address:** Email notifications phase

---

### Pitfall 4: Error Boundaries Not Catching Layout or Event Handler Errors

**What goes wrong:**
Adding `error.tsx` to every route segment gives false confidence. Error boundaries in Next.js App Router do NOT catch: (a) errors in the same-segment `layout.tsx`, (b) errors in event handlers, (c) errors in async callbacks/promises, (d) errors in server actions called from Client Components. The app appears "covered" by error boundaries but critical failure modes slip through.

**Why it happens:**
Next.js `error.tsx` wraps the page component, but the layout component wraps the error boundary. Architecture:
```
layout.tsx         <-- NOT caught by same-level error.tsx
  error.tsx        <-- catches page errors only
    page.tsx
```
Event handler errors (onClick, onSubmit) are not rendering errors and React error boundaries don't catch them. `global-error.tsx` catches root layout errors but must render its own `<html>` and `<body>`.

**How to avoid:**
- Place `error.tsx` one level ABOVE the layout you want to protect (parent segment)
- For event handlers: wrap in try/catch with Sentry reporting (already done in `RouteError.tsx`)
- NEVER rely solely on error boundaries for event handler errors -- use `try/catch` in handlers that call APIs
- For server actions: use `.catch()` on the promise returned by the action (but be careful of `NEXT_REDIRECT` -- see `ERROR_HISTORY.md`)
- Current project has `global-error.tsx` (line 7-23) using `NextError statusCode={0}` -- this renders a generic error page. Consider making it consistent with the `RouteError` component design

**Warning signs:**
- Error boundaries exist at every page level but not at layout-parent levels
- No try/catch in onClick/onSubmit handlers that call APIs
- `global-error.tsx` doesn't match the design language of other error pages
- Missing error boundaries for route groups: `(auth)` has no `error.tsx`

**Phase to address:** Error boundaries phase

**Project context:**
Current error coverage audit:
| Route Group | error.tsx | loading.tsx | Notes |
|-------------|-----------|-------------|-------|
| Root `app/` | Yes | No | Custom card UI with Sentry |
| `(public)` | Yes | Yes | Uses `RouteError` component |
| `(public)/menu` | Yes | Yes | |
| `(customer)` | No | No | **GAP -- customer routes unprotected** |
| `(customer)/orders` | Yes | No | |
| `(customer)/orders/[id]/tracking` | Yes | Yes | |
| `(admin)` | Yes | No | Custom admin error UI |
| `(admin)/analytics` | Yes | Yes | |
| `(driver)` | Yes | No | |
| `(auth)` | **No** | **No** | **GAP -- auth errors unhandled** |
| `(customer)/cart` | **No** | **No** | **GAP -- cart errors unhandled** |
| `(customer)/checkout` | **No** | **No** | **GAP -- checkout errors unhandled** |
| `(customer)/account` | **No** | **No** | **GAP -- account errors unhandled** |

---

### Pitfall 5: Driver Offline Sync Replaying Duplicate Status Updates

**What goes wrong:**
Driver goes offline, marks delivery as "delivered", comes back online, sync fires and replays the status update. But: (a) the status was already synced via a different path (driver briefly reconnected), causing duplicate API calls, or (b) multiple sync attempts fire simultaneously (online event + periodic retry + Background Sync API), each replaying the full queue.

**Why it happens:**
The existing `driver-store.ts` has `pendingActions` array in Zustand with localStorage persistence. The `offline-store/stores.ts` has a SEPARATE IndexedDB-based `pendingStatus` queue. Two separate queues for the same purpose means two separate sync mechanisms can fire for the same action. Neither has idempotency keys or "in-flight" status tracking.

**How to avoid:**
- Add idempotency keys to every pending action. Current `pendingStatus.add()` uses `crypto.randomUUID()` as `id` -- this should be sent to the API as an idempotency key
- Mark items as "syncing" before sending, not just "pending". Only remove after server confirms. Prevents double-send from concurrent sync triggers
- Consolidate to ONE queue system. Currently: Zustand `pendingActions` (localStorage) AND IndexedDB `pendingStatus` store -- pick one, delete the other
- Background Sync API only works in Chromium (not Firefox/Safari) -- always implement online-event-based fallback
- Process queue items sequentially, not in parallel. Order matters for status transitions (can't mark "delivered" before "in_transit")

**Warning signs:**
- Two separate offline stores tracking similar data (driver-store.ts vs offline-store/stores.ts)
- No "syncing" intermediate state -- items go from "pending" to "removed"
- API endpoints don't check idempotency keys
- Queue items processed with `Promise.all` instead of sequential loop
- No status transition validation on server side

**Phase to address:** Driver offline sync phase

**Project context:** The `driver-store.ts` `PendingAction` type includes `type: "status_update" | "photo_upload" | "exception"` -- photo uploads are especially dangerous to duplicate (large payloads, storage costs).

---

### Pitfall 6: Polish Pass Regressions on Animation-Heavy Components

**What goes wrong:**
Refactoring working components for "visual polish" breaks existing animation timelines, GSAP cleanup, scroll behavior, or React Compiler optimizations. The component looked fine before, now it has: (a) animation conflicts between old GSAP and new Framer Motion additions, (b) broken cleanup patterns from restructured useEffect dependencies, (c) React Compiler bailouts from adding mutable refs or non-serializable state.

**Why it happens:**
This project has 282 client components, many with complex animation lifecycles. React Compiler is enabled globally -- it auto-memoizes but bails out on patterns like `useRef` mutation inside render. Changing component structure (extracting subcomponents, adding wrapper divs for animations) disrupts existing `useGSAP` scope refs, `AnimatePresence` key hierarchies, and `ScrollTrigger` container refs. The project error history shows this HAS happened: mobile crashes from timer cleanup issues (2026-01-29/30).

**How to avoid:**
- Before touching any component, verify its current animation behavior with Playwright visual snapshots
- Check if component uses GSAP, Framer Motion, or both -- never add the second library to a component that only uses one (see existing conflict detector)
- Run `pnpm typecheck` after every change -- React Compiler errors surface as type issues
- Maintain the existing cleanup patterns (documented in `ERROR_HISTORY.md` Phase 35 audit)
- Use the safe timeout/interval hooks from `src/lib/hooks/useSafeEffects.ts` for any new timers

**Warning signs:**
- Component file is being restructured (extracted into subfolder) AND has GSAP/Framer Motion
- Adding wrapper `<motion.div>` around existing GSAP-animated children
- Changing useEffect dependency arrays in components with animation cleanup
- No visual regression test before starting polish work

**Phase to address:** Polish pass phase (run LAST, after all features are stable)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoded email templates in Edge Function | Ship faster | Hard to maintain, no preview, no i18n | MVP only -- migrate to React Email templates after launch |
| Skip skeleton for low-traffic pages | Less code to write | Inconsistent loading experience | Never for customer-facing; acceptable for admin-only pages |
| localStorage for customer settings | No server round-trip | Lost on device switch, no cross-device sync | Acceptable if backed by Supabase profile row for critical settings |
| Inline error messages instead of toast | Quick implementation | Inconsistent error UX across app | Never -- use existing toast/error pattern consistently |
| Copy-paste error.tsx for each route | Quick coverage | 10+ near-identical files to maintain | Short-term OK, but extract shared `RouteError` component (already exists) |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Edge Functions + Resend | Not verifying sender domain in Resend dashboard | Verify domain FIRST, then deploy Edge Function. Unverified domain = all emails silently fail |
| Stripe webhooks + Edge Functions | Default JWT verification blocks Stripe requests | Set `verify_jwt = false` in `config.toml` for webhook endpoint. Use Stripe signature verification instead |
| Zustand persist + Next.js SSR | Reading persisted state during server render | Gate persisted state reads behind `_hydrated` flag or use `useSyncExternalStore` with `getServerSnapshot` returning initial state |
| Sentry + error boundaries | Reporting error in `useEffect` but also in `global-error.tsx` | Deduplicate: use `error.digest` as fingerprint. Both `error.tsx` and `global-error.tsx` report -- same error gets two Sentry events |
| Service worker + email deep links | Magic link email opens in app with stale cached page | Use `NetworkFirst` for auth callback routes. Current SW config caches static assets with `StaleWhileRevalidate` -- auth routes must bypass |
| React Compiler + Framer Motion | Compiler auto-memoizes animation callbacks, breaking motion values | If animation stutters after React Compiler, add `"use no memo"` directive to specific component, not globally |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Adding Framer Motion `layout` animations to list items | Jank on lists >20 items, dropped frames on mobile | Use `layoutId` only for shared-element transitions, not list reordering. Use CSS `view-transition` for lists | >15 animated items visible simultaneously |
| Skeleton components importing animation libraries | Skeleton itself adds 30KB+ to initial bundle | Skeletons must be CSS-only (pulse animation via Tailwind `animate-pulse`). Never import Framer Motion for skeleton shimmer | Every page load -- skeletons ARE the critical path |
| Loading entire settings schema on customer settings mount | 500ms+ delay rendering settings page on slow connections | Split settings into tabs, load each tab's data on demand. Use React Server Components for initial render | >5 settings categories with 10+ fields each |
| Error boundary rendering complex animated error UI | Error state itself can crash if animation library failed to load | Error fallback must work WITHOUT Framer Motion. Current `RouteError.tsx` imports `m` from framer-motion -- this is a risk | When the error IS a Framer Motion crash |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Stripe webhook without signature verification | Attacker sends fake webhook, triggers fraudulent order confirmations or refunds | Always use `stripe.webhooks.constructEvent(body, sig, endpointSecret)` in Edge Function |
| Customer settings API without row-level security | User A modifies User B's settings via direct API call | Supabase RLS policy: `auth.uid() = user_id` on settings table. Never trust client-side user ID |
| Email notification containing order details over plain HTTP | Order data (address, phone) exposed in transit | Resend sends over HTTPS by default. But: don't include full address in email body -- link to authenticated order page instead |
| Magic link + animation delay | User clicks "send magic link", animation plays for 2s, but link was already sent. User clicks again -> rate-limited by Supabase auth | Disable submit button immediately on click (already done with `useFormStatus` in `LoginForm.tsx`). Don't delay the disable for animation purposes |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Cart validation removing items without explanation | User returns to cart, items gone, no idea why | Show inline message per removed item: "Pad See Ew is no longer available" with undo option |
| Loading skeleton that doesn't match final layout | Layout shift when real content replaces skeleton (CLS penalty) | Skeleton must match exact dimensions of loaded content. Measure real content first, build skeleton to match |
| Error boundary "Try Again" that doesn't work | User clicks retry, same error, no progress. User gives up | After 2 failed retries, show different action: "Contact support" or "Go to homepage". Log retry count |
| Settings save with no feedback | User changes setting, no confirmation it saved. Unsure if it worked | Show inline "Saved" toast on successful save. Show error toast on failure. Disable save button during save |
| Email notification opt-in defaulting to "all on" | User annoyed by emails they didn't ask for. Marks as spam | Default to minimal: order confirmation only. Let user opt INTO marketing/status emails |

## "Looks Done But Isn't" Checklist

- [ ] **Error boundaries:** Route groups `(auth)`, `(customer)/cart`, `(customer)/checkout`, `(customer)/account` have no error.tsx -- verify all customer-facing routes are covered
- [ ] **Loading states:** Route groups `(customer)`, `(driver)`, `(auth)` have no loading.tsx -- verify loading skeletons exist for all async pages
- [ ] **Email notifications:** Domain verified in Resend dashboard, not just coded in Edge Function
- [ ] **Cart validation:** Works on fresh page load (not just hot reload), including when cart has items from a previous session where menu items have since been removed
- [ ] **Offline sync:** Idempotency key sent with every retry, server validates it. Test by: queue 3 actions offline, reconnect, verify exactly 3 API calls (not 6)
- [ ] **Settings page:** Default values render immediately (not after API call). User with no saved settings sees sensible defaults, not empty/broken UI
- [ ] **Auth animations:** Full flow works with `prefers-reduced-motion: reduce` enabled. Tab through entire form -- focus never gets lost
- [ ] **Polish pass:** Visual regression tests pass for ALL pages touched, not just the one being polished. Check adjacent pages that share components
- [ ] **global-error.tsx:** Must include `<html>` and `<body>` tags (current implementation does). Must NOT import from components that might be the source of the error
- [ ] **Service worker:** Magic link auth callback route (`/auth/callback`) not cached by SW. Test: send magic link, click it, verify it works on first try without cache issues

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Duplicate webhook processing | MEDIUM | Add idempotency table, dedupe existing records, re-verify order statuses against Stripe source of truth |
| Cart validation clears valid items | LOW | Items are in localStorage `mms-cart` -- restore from browser storage if caught quickly. Add undo mechanism for future |
| Auth animation breaks focus | LOW | Remove animations, revert to working non-animated form. Animations are enhancement, not requirement |
| Error boundary gap causes white screen | HIGH | User sees blank page, can't navigate. Only recovery: browser back button or manual URL. Must prevent, not recover |
| Offline sync duplicates | HIGH | Dedupe database records by idempotency key. For photos: check storage for duplicates by hash. For status updates: replay from Stripe/source of truth |
| Polish regression breaks existing feature | MEDIUM | Git revert the polish commit. Run test suite to verify. Re-apply polish with visual regression tests in place |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Auth animation focus management | Auth form redesign | Tab through form in all states. Screen reader announces all elements. Works with reduced motion |
| Cart hydration race condition | Cart validation | Fresh page load with persisted cart shows items immediately. No flash of empty state |
| Webhook duplicate processing | Email notifications | Send same Stripe event twice via CLI. Verify only one email sent, one DB record created |
| Error boundary coverage gaps | Error boundaries | Trigger error in every route group. Verify styled error page (not white screen) for all |
| Driver offline sync duplicates | Driver offline sync | Queue 5 actions offline. Reconnect. Verify exactly 5 API calls. Kill network mid-sync, reconnect again -- no duplicates |
| Loading state consistency | Loading states | Navigate to every page on throttled 3G. Verify skeleton appears (not blank white) within 100ms |
| Polish regression | Polish pass (LAST) | Playwright visual regression suite passes before AND after polish changes. No CLS increase |
| Settings save without feedback | Customer settings | Save a setting. Toast appears. Refresh page. Setting persists. Change setting on slow network. Loading indicator visible |

## Sources

### Next.js Error Handling (HIGH confidence)
- [Next.js Official: Error Handling](https://nextjs.org/docs/app/getting-started/error-handling)
- [Next.js Official: error.js Convention](https://nextjs.org/docs/app/api-reference/file-conventions/error)
- [Confusion about error.tsx vs global-error.tsx (GitHub Discussion #68048)](https://github.com/vercel/next.js/discussions/68048)
- [Next.js 15 Error Handling Best Practices (Dev & Deliver)](https://devanddeliver.com/blog/frontend/next-js-15-error-handling-best-practices-for-code-and-routes)
- [Common Mistakes with Next.js App Router (Vercel)](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them)

### Supabase Edge Functions + Resend (HIGH confidence)
- [Supabase Docs: Sending Emails](https://supabase.com/docs/guides/functions/examples/send-emails)
- [Resend: Send with Supabase Edge Functions](https://resend.com/docs/send-with-supabase-edge-functions)
- [Supabase Docs: Stripe Webhooks](https://supabase.com/docs/guides/functions/examples/stripe-webhooks)
- [Edge Functions Troubleshooting](https://supabase.com/docs/guides/functions/troubleshooting)

### Stripe Webhook Idempotency (HIGH confidence)
- [Handling Payment Webhooks Reliably (Medium, Nov 2025)](https://medium.com/@sohail_saifii/handling-payment-webhooks-reliably-idempotency-retries-validation-69b762720bf5)
- [Best Practices for Stripe Webhooks (Stigg)](https://www.stigg.io/blog-posts/best-practices-i-wish-we-knew-when-integrating-stripe-webhooks)
- [Webhooks at Scale: Idempotent, Replay-Safe (DEV, 2026)](https://dev.to/art_light/webhooks-at-scale-designing-an-idempotent-replay-safe-and-observable-webhook-system-7lk)

### Offline Sync + IndexedDB (MEDIUM confidence)
- [Offline-First Frontend Apps in 2025 (LogRocket)](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)
- [Implementing Offline-First with IndexedDB and Sync (Medium)](https://medium.com/@sohail_saifii/implementing-offline-first-with-indexeddb-and-sync-a-real-world-guide-0638c8d01056)
- [Advanced PWA: Offline, Push, Background Sync](https://rishikc.com/articles/advanced-pwa-features-offline-push-background-sync/)

### Zustand Persist + Hydration (HIGH confidence)
- [Zustand Docs: Persisting Store Data](https://zustand.docs.pmnd.rs/integrations/persisting-store-data)
- [Zustand Docs: persist middleware](https://zustand.docs.pmnd.rs/middlewares/persist)
- [Fixing Hydration Errors with Zustand Persist (Medium)](https://medium.com/@judemiracle/fixing-react-hydration-errors-when-using-zustand-persist-with-usesyncexternalstore-b6d7a40f2623)
- [Is it possible to immediately load persisted data? (GitHub Issue #346)](https://github.com/pmndrs/zustand/issues/346)

### Framer Motion Accessibility (HIGH confidence)
- [Framer Motion: Accessibility Guide](https://framer.com/motion/guide-accessibility)
- [Motion: React Accessibility](https://motion.dev/docs/react-accessibility)

### React Suspense + Loading UI (HIGH confidence)
- [Next.js Official: Loading UI and Streaming](https://nextjs.org/docs/14/app/building-your-application/routing/loading-ui-and-streaming)
- [Next.js 15 Streaming Handbook (freeCodeCamp)](https://www.freecodecamp.org/news/the-nextjs-15-streaming-handbook/)

### Project-Specific (HIGH confidence)
- Project `ERROR_HISTORY.md` -- mobile crash patterns, NEXT_REDIRECT issues, cleanup audit
- Project `cart-store.ts` -- Zustand persist implementation details
- Project `driver-store.ts` + `offline-store/stores.ts` -- dual queue architecture
- Project `sw.ts` -- service worker caching strategies
- Project error.tsx audit -- coverage gaps identified

---
*Pitfalls research for: v1.6 Production Polish*
*Researched: 2026-02-07*
