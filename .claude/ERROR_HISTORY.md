# Error History

Check here before debugging. Archive: `.claude/archive/errors-v1.0-v1.1.md`

---

## Driver Invite Magic Link → Homepage | Auth Flow | Critical

`action_link` from `generateLink()` uses implicit flow — tokens as `#hash` fragments, invisible to server Route Handlers. Also `redirectTo` with multiple params gets split by GoTrue.

**Fix:** Use `hashed_token` + custom `/auth/confirm` route with `verifyOtp()`. Never use `action_link`.

See: `.claude/learnings/supabase-auth.md`

---

## Tailwind v4 Z-Index & Token Issues | Build/Runtime | Critical

Custom `zIndex` theme extensions don't generate classes in v4. CSS variable names vs utility names mismatch. Auto-content scanning picks up docs/planning files.

**Fix:** Use numeric classes (`z-50`, `z-[60]`). Add `@source not` for non-source dirs. See: `.claude/learnings/tailwind-v4.md`

---

## NEXT_REDIRECT Swallowed by Async/Await + Try/Catch | Runtime | High

Async/await + try/catch intercepts redirect errors. Re-throw from async context becomes unhandled promise rejection that never reaches Next.js.

**Fix:** Don't use async/await or `.catch()` for redirect-capable server actions. Only attach `.then()`.

---

## Dropdown Menu Items Not Clickable | Runtime | High

Click-outside ref only wrapped trigger, not menu content. Mousedown → outside detection → menu closes before click fires.

**Fix:** Wrap click-outside ref around entire dropdown (trigger + content).

---

## File Casing — Module Not Found on Vercel | Build | High

Git tracked `drawer.tsx` lowercase, import was `"./Drawer"` uppercase. Windows ignores case, Linux doesn't.

**Fix:** `git mv` two-step rename. Match import casing exactly to filename.

---

## Mobile Crash on Modal/Drawer Close | Runtime | Critical

Four related issues consolidated:
1. **scrollTo during exit animation** — defer with `onExitComplete`
2. **setTimeout not cleaned up** — track in ref, clear on unmount
3. **SearchInput handleBlur** — same setTimeout cleanup pattern
4. **AddToCartButton async setState** — use `isMountedRef` guard

**Universal pattern:** Track all timeouts in refs, clear on unmount. Use `isMountedRef` for async setState.
Utilities: `useSafeTimeout`, `useSafeInterval`, `useSafeAsync` in `src/lib/hooks/useSafeEffects/`

---

## Event Listener Accumulation (useCallback Anti-pattern) | Runtime | Critical

`useCallback` with `isOpen` dep → function reference changes each toggle → listeners accumulate because cleanup removes wrong reference.

**Fix:** Define handlers inside `useEffect` with guard clause, not `useCallback`.

---

## Storage Migration Ownership | Migration | Medium

`storage.objects` owned by `supabase_storage_admin`, not `postgres`. Dashboard SQL Editor can't CREATE/DROP POLICY.

**Fix:** Use MCP `apply_migration` or `supabase db push` for storage policies.

---

## Driver Avatar Not Synced | Cache | Medium

`revalidatePath("/driver")` defaults to `type: "page"` — doesn't invalidate the layout which provides avatar data.

**Fix:** `revalidatePath("/driver", "layout")` — invalidates layout AND child pages.

---

## Google Images Not Rendering | Runtime/Config | High

Three compounding root causes (each session found a new layer):

1. **Referrer policy** — `Referrer-Policy: strict-origin-when-cross-origin` blocks Google image requests + narrow `remotePatterns` hostname.
   **Fix:** `referrerPolicy="no-referrer"` on all external `<img>` tags. Use `**.googleusercontent.com` wildcard.

2. **SW CacheFirst + opaque responses** — `CacheFirst` permanently cached failed opaque (status 0) cross-origin responses. One transient failure → blank images forever.
   **Fix:** Switch to `NetworkFirst` with timeout for external images. Bump `CACHE_VERSION` to bust stale entries. Add activate handler to delete old versioned caches.

3. **`loading="lazy"` + animated containers** — `<img loading="lazy">` inside framer-motion `initial={{ opacity: 0 }}` wrappers: IntersectionObserver never fires during SPA nav.
   **Fix:** Remove `loading="lazy"` from primary content images in animated containers. Add `onError` fallback.

4. **Opaque responses uncacheable** — Even with `NetworkFirst`, `CacheableResponsePlugin` with `statuses: [0, 200]` still cached bad opaques. Must use `statuses: [200]` only. The real fix: replace plain `<img>` with `next/image` which proxies through `/_next/image` (same-origin, real status codes).

**Prevention:** In PWAs, always use `next/image` for external URLs (proxies same-origin). Never `CacheFirst` for cross-origin. Never `statuses: [0]` in CacheableResponsePlugin. Never `loading="lazy"` inside opacity-animated containers.

---

## CI Checkout 404 | CI/CD | Medium

Job-level `permissions` is an allowlist — drops `contents: read` if not listed.

**Fix:** Always include `contents: read` alongside other permissions. Add `fetch-depth: 2` for `dorny/paths-filter`.

---

## Double-Add Cart Items | Logic | High

Button called `addItem()` directly AND triggered `onAdd()` callback which also called `addItem()`.

**Fix:** Single mutation owner — UI components only trigger callbacks, parent owns mutation.

---

## Design Tokens Resolve to Transparent | Build/Runtime | Critical

Tailwind v4 + Turbopack ignores `tailwind.config.ts`. Only `@theme inline {}` in `globals.css` drives utility generation.

**Fix:** Add tokens to `@theme inline` with self-referencing pattern. Verify with computed styles.

---

## Update Banner Invisible (Wrong Token Name) | Runtime | Medium

`bg-info` → doesn't exist. Actual token is `bg-status-info`. No build error, just transparent.

**Fix:** Status colors use `status-` prefix: `bg-status-info`, `bg-status-error`, etc.

---

## Route Map Never Renders (useRef + Conditional Mount) | Runtime | High

`useRef` for element inside conditional render — effect runs before element exists, never re-runs.

**Fix:** Callback ref + `useState` pattern. See: `.claude/learnings/react-patterns.md`

---

## PostgREST Ambiguous FK → Query Failure | Runtime | Critical

**Date:** 2026-03-02 | **Files:** 8 API routes (driver + admin)

Migration `030_email_reliability.sql` added `orders.contacted_by → profiles`, creating a second FK alongside `orders.user_id → profiles`. PostgREST cannot resolve un-hinted `profiles` joins when multiple FKs exist — silently fails or returns error.

**Symptoms:** "Failed to load orders" in admin; 404 in driver (null join → empty routeId → bad URL).

**Fix:** Add FK hint: `profiles!orders_user_id_fkey` to every query joining orders → profiles.

**Prevention:** When adding a new FK to a table, grep ALL queries that join the target table and add FK hints. Check: `grep -r 'profiles' src/app/api/ --include='*.ts'`

---

## Storage Bucket Mime Type vs Processing Output | Migration/Config | Critical

**Date:** 2026-03-03 | **Files:** `supabase/migrations/007_menu_photos_storage.sql`, `src/app/api/admin/photos/process/route.ts`

Migration 007 set `allowed_mime_types = ARRAY['image/jpeg', 'image/png']` on the `menu-photos` bucket. Phase 90 added a sharp-based processing route that converts all uploads to WebP (`contentType: "image/webp"`). Every upload silently rejected by storage.

**Fix:** Migration 034 adds `'image/webp'` to the bucket's `allowed_mime_types`.

**Prevention:** When adding server-side image processing that changes output format, check the storage bucket's `allowed_mime_types` matches the output. Run: `grep -r 'allowed_mime_types' supabase/migrations/`

---

## IMMUTABLE Required for Index Expressions | Migration | High

**Date:** 2026-03-03 | **Files:** `supabase/migrations/035_checkout_hardening.sql`

`CREATE UNIQUE INDEX ... ON orders (user_id, delivery_window_start::date)` fails with `ERROR: 42P17: functions in index expression must be marked IMMUTABLE`. The `::date` cast on `timestamptz` is STABLE, not IMMUTABLE.

**Fix:** Create an IMMUTABLE wrapper function that pins timezone to `America/Los_Angeles`, then use it in the index expression. See: `.claude/learnings/data-schema.md`

---

## Google OAuth — No Profile Created | Auth/FK | Critical

**Date:** 2026-03-04 | **Files:** `src/lib/auth/role-redirect.ts`, `src/app/auth/callback/route.ts`, `src/app/api/addresses/route.ts`, `src/app/api/checkout/session/route.ts` + 4 more

`getRoleDashboard` self-healing used `supabase.auth.getUser()` on a service role client → always `null` (no session). Email was never available, profile insert silently failed. Google OAuth users had no profile row → FK violations on address save and order creation.

**Fix:** New `ensureProfile()` using upsert + `admin.getUserById()` fallback. Called in auth callbacks (with email param) and belt-and-suspenders in address/checkout API routes.

**Prevention:** Never use `auth.getUser()` on service clients. Use `auth.admin.getUserById()`. See: `.claude/learnings/supabase-auth.md`

---

## Order Stuck "Pending" After Stripe Payment | Webhook/DB | Critical

**Date:** 2026-03-04 | **Files:** `src/app/api/webhooks/stripe/route.ts`, `src/app/api/webhooks/stripe/handlers.ts`, `src/app/(customer)/orders/[id]/confirmation/page.tsx`

Three compounding issues:
1. **Catch block returned 200** — Stripe treated DB errors as success, never retried
2. **No `.select()` on update** — 0-row updates logged as success (order already confirmed or missing)
3. **No client-side fallback** — Confirmation page showed "pending" forever when webhook delayed

**Fix (3 layers):**
- Return 500 in catch block → Stripe retries
- Add `.select("id")` to update → verify rows affected, log diagnostics
- New `OrderStatusPoller` polls status + calls `verify-payment` fallback

**Fix (layer 4 — self-healing):**
- Store `stripe_checkout_session_id` on order at checkout
- verify-payment falls back to stored session ID (no URL param needed)
- Order detail page auto-verifies with Stripe on every render if pending + session ID exists

**Prevention:** Always return 5xx for retryable webhook errors. Always verify `.update()` row count. Always have client-side payment verification fallback. Store payment session references on orders for recovery after navigation.

---

## API Pagination Default Breaks Bulk Operations | Logic | Moderate

**Date:** 2026-03-03 | **Files:** `src/app/(admin)/admin/photos/page.tsx`, `src/app/(admin)/admin/menu/[id]/page.tsx`

Admin pages fetched `/api/admin/menu` without `limit` param. API defaults to `limit=25`. With 53+ menu items, bulk upload slug matching only saw the first 25 items — rest failed to match.

**Fix:** Added `?limit=500` to menu item fetch calls that need the full list.

**Prevention:** When building features that need ALL records (slug matching, bulk operations, dropdowns), always pass an explicit high `limit` or paginate through all results. Never rely on API defaults.

---

## Admin API Response Wrapper Silently Breaks Array Methods | Logic | High

**Date:** 2026-03-04 | **Files:** `CreateRouteModal.tsx`, `RouteDetailClient.tsx` (3 fetch calls)

Admin API endpoints return `{ data: [...], pagination: {...} }` wrapper objects, not plain arrays. Components called `.filter()` / `.map()` directly on the response object. Object `.filter()` is `undefined` — no runtime error, just silently produces nothing. Orders and drivers never appeared in route creation UI.

**Fix:** Unwrap `json.data` before using array methods on API responses.

**Prevention:** All `/api/admin/*` endpoints return `{ data, pagination }`. Always destructure or access `.data` before array operations. Use TypeScript types for API responses to catch this at compile time.
