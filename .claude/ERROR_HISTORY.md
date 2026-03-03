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
Utilities: `useSafeTimeout`, `useSafeInterval`, `useSafeAsync` in `src/lib/hooks/useSafeEffects.ts`

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

**Prevention:** Never use `CacheFirst` for cross-origin images. Never use `loading="lazy"` inside opacity-animated containers.

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
