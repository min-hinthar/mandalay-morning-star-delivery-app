# Error History

Reference for past bugs, root causes, and fixes. Check here before debugging similar issues.

**Archive:** `.claude/archive/errors-v1.0-v1.1.md` for older entries.

---

## Driver Invite Magic Link Redirects to Homepage

**Date:** 2026-02-17 | **Type:** Auth Flow | **Severity:** Critical
**Files:** `auth/callback/route.ts`, `api/admin/drivers/invite/route.ts`, `api/admin/drivers/[id]/resend-invite/route.ts`

**Error:** Driver clicks invite email link → redirected to homepage. No session established, role not changed.

**Root cause:** `admin.generateLink()` returns an `action_link` that uses Supabase's **implicit flow**. Tokens arrive as `#hash` fragments, invisible to server-side Route Handlers. `exchangeCodeForSession(code)` gets `null` for `code` and fails. Additionally, `&invite_id=...` in `redirectTo` gets split off by GoTrue's `/verify` endpoint.

**Fix:** Created `/auth/confirm/route.ts` that takes `hashed_token` from `generateLink` and calls `verifyOtp()` server-side. Invite APIs now construct their own URL using `hashed_token` + `URL.searchParams` (proper encoding) instead of `action_link`.

**Key learning:** Never use `action_link` from `generateLink()`. Always use `hashed_token` + `verifyOtp()`. See `.claude/learnings/supabase-auth.md`.

---

## TailwindCSS 4 Z-Index System (Consolidated)

**Type:** Build/Runtime | **Severity:** Critical | **Dates:** 2026-01-22 to 2026-01-24

### The Problem

TailwindCSS 4 z-index handling differs significantly from v3. Four related issues caused silent layering failures.

### Issue 1: Custom zIndex Theme Extensions Don't Generate Classes

```ts
// tailwind.config.ts - THIS DOES NOT WORK IN V4
theme: {
  extend: {
    zIndex: {
      modal: "50";
    }
  }
}
```

Expected `z-modal` class → **NOT generated**. Use `z-50` or `z-[50]` instead.

### Issue 2: CSS Variable Names vs Utility Names

CSS defines `--z-index-modal`, but utility is `z-modal` (prefix stripped).
TypeScript helpers referencing `var(--z-modal)` fail silently.

### Issue 3: Arbitrary Values Generate Invalid Wildcard CSS

Multiple z-index patterns with CSS variable wildcards cause Tailwind to generate invalid utility classes.

### Issue 4: Auto-Content Detection Scans All Files

Tailwind 4 scans markdown in `docs/`, `.planning/`, `.claude/` even without explicit config.
Code examples with deprecated classes get compiled into CSS.

### Fix Pattern

```ts
// z-index.ts - Use numeric classes only
export const zClass = {
  sticky: "z-30",
  fixed: "z-40",
  modal: "z-50",
  popover: "z-[60]", // Arbitrary for non-default values
};
```

### Prevention

1. Use numeric z-index classes (`z-50`) not custom names (`z-modal`)
2. Verify CSS variable names match exactly between CSS and TypeScript
3. Keep documentation code examples valid and current
4. Test z-index with DevTools computed styles

---

## 2026-01-25: NEXT_REDIRECT Swallowed by Async/Await + Try/Catch (Updated)

**Type:** Runtime | **Severity:** High

**Files:** `src/components/ui/DropdownAction.tsx`

**Error:** Server action with `redirect()` silently fails - no redirect, no error. Signout button and other redirect actions appear broken.

**Root Cause:** Using async/await with try/catch for server actions that call redirect():

```typescript
// BROKEN - async/await intercepts redirect errors
const handleClick = useCallback(async () => {
  try {
    await serverAction(); // Server action calls redirect()
  } catch (error) {
    if (error includes "NEXT_REDIRECT") {
      throw error; // Re-throw doesn't propagate from async context
    }
  }
});
// Called with void: void handleClick();
```

When NEXT_REDIRECT is caught and re-thrown in async context:

1. The re-throw becomes an unhandled promise rejection
2. Next.js's redirect handler never receives it
3. No redirect occurs

**Fix:** Don't use async/await or rejection handlers for redirect-capable actions:

```typescript
// WORKING - only attach success handler, let rejections propagate
const handleClick = useCallback(() => {
  const result = onClick();
  if (result instanceof Promise) {
    result.then(() => {
      onSuccess?.();
    });
    // NO .catch() - let NEXT_REDIRECT propagate to Next.js
  }
});
```

**Prevention:**

1. Server actions with `redirect()` must NOT be wrapped in try/catch
2. Don't use async/await for calling redirect-capable actions
3. Only attach `.then()` handlers, never `.catch()` that touches redirects
4. Let unhandled rejections propagate to Next.js's global handler

---

## 2026-01-25: Dropdown Menu Items Not Clickable

**Type:** Runtime | **Severity:** High

**Files:** `src/components/ui/dropdown-menu.tsx`

**Error:** Clicking dropdown menu items (e.g., signout button) doesn't trigger action - menu closes immediately

**Root Cause:** Click-outside handler ref only wrapped the trigger button, not the menu content.
Event sequence: mousedown → outside detection → menu closes → click never fires on menu item.

```tsx
// BROKEN - ref only on trigger
const DropdownMenuTrigger = () => {
  const triggerRef = useRef(null);
  // handleClickOutside uses triggerRef
  return (
    <div ref={triggerRef}>
      <button>...</button>
    </div>
  );
};
// Menu content is rendered elsewhere, not inside triggerRef
```

**Fix:** Move click-outside handler to root DropdownMenu component with ref wrapping both trigger AND content:

```tsx
// WORKING - ref wraps entire dropdown
const DropdownMenu = ({ children }) => {
  const containerRef = useRef(null);
  // handleClickOutside uses containerRef
  return <div ref={containerRef}>{children}</div>; // Contains trigger + content
};
```

**Prevention:** Click-outside refs must contain ALL interactive elements of the component.

---

## 2026-01-27: Module Not Found on Vercel (File Casing)

**Type:** Build | **Severity:** High

**Files:** `src/components/ui/index.ts`, `src/components/ui/Drawer.tsx`

**Error:** Build passes locally (Windows), fails on Vercel (Linux):

```
Module not found: Can't resolve './Drawer'
```

**Root Cause:** Git tracked file as `drawer.tsx` (lowercase), but `index.ts` imported `"./Drawer"` (uppercase). Windows filesystem is case-insensitive → works locally. Linux is case-sensitive → fails on Vercel.

**Detection:**

```bash
git ls-files | grep -i drawer
# Shows: src/components/ui/drawer.tsx  ← lowercase in git
# But import is: from "./Drawer"       ← uppercase
```

**Fix:**

```bash
git mv src/components/ui/drawer.tsx src/components/ui/Drawer.tsx
git commit -m "fix: correct Drawer.tsx casing for Linux builds"
```

**Prevention:**

1. Match import casing exactly to filename
2. Use PascalCase for all component files consistently
3. Test with `git ls-files | grep -i <name>` before pushing
4. Consider CI that runs on Linux to catch early

---

## 2026-01-29: Mobile Crash on Modal/Drawer Close (Scroll Lock Issues)

**Type:** Runtime | **Severity:** Critical

**Files:** `src/lib/hooks/useBodyScrollLock.ts`, `src/components/ui/Drawer.tsx`, `src/components/ui/Modal.tsx`, `src/components/ui/layout/MobileDrawer/MobileDrawer.tsx`, `src/components/ui/menu/SearchInput.tsx`, `src/components/ui/cart/AddToCartButton.tsx`

**Error:** App crashes, reloads, shows "Can't open page" error, or white screen when closing modals/drawers on mobile (iOS Safari, Chrome, Android). Intermittent - sometimes works, sometimes crashes.

### Issue 1: scrollTo During Exit Animation (Fixed 2026-01-29)

Scroll lock cleanup called `window.scrollTo()` synchronously, but AnimatePresence exit animation was still running (~200ms).

**Fix:** Use `deferRestore: true` option and call `restoreScrollPosition` in `onExitComplete`:

```tsx
const { restoreScrollPosition } = useBodyScrollLock(isOpen, { deferRestore: true });
<AnimatePresence onExitComplete={restoreScrollPosition}>
```

### Issue 2: setTimeout Not Cleaned Up (Fixed 2026-01-29)

Even with `deferRestore: false`, the setTimeout wasn't tracked or cleaned. Component unmount → timeout still queued → `scrollTo` on disposed DOM → crash.

```typescript
// BROKEN - setTimeout fires after unmount
if (!deferRestore) {
  setTimeout(() => window.scrollTo(0, scrollY), 0); // Never cleaned!
}
```

**Fix:** Track timeout in ref and clear on cleanup:

```typescript
const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// In cleanup:
if (timeoutRef.current) clearTimeout(timeoutRef.current);
timeoutRef.current = setTimeout(() => { ... }, 0);

// Unmount cleanup:
useEffect(() => () => {
  if (timeoutRef.current) clearTimeout(timeoutRef.current);
}, []);
```

### Issue 3: SearchInput handleBlur setTimeout (Fixed 2026-01-30)

SearchInput.tsx had setTimeout in `handleBlur` and `handleIconClick` not tracked or cleaned.

### Issue 4: AddToCartButton async setState (Fixed 2026-01-30)

AddToCartButton.tsx has async `handleClick` with `await setTimeout(600ms)` for success animation.
When user adds item, parent calls `onClose()` → component unmounts → async continues → `setState` on unmounted.

```typescript
// BROKEN - async function continues after unmount
const handleClick = useCallback(async () => {
  setState("loading");
  onAdd?.(); // Parent closes drawer here!
  setState("success");
  await new Promise((r) => setTimeout(r, 600)); // Still waiting...
  setState("idle"); // CRASH - component unmounted!
}, []);
```

**Fix:** Add isMountedRef to guard setState in async code:

```typescript
const isMountedRef = useRef(true);
useEffect(() => {
  isMountedRef.current = true;
  return () => {
    isMountedRef.current = false;
  };
}, []);

// In async function:
if (isMountedRef.current) setState("idle");
```

```typescript
// BROKEN - setTimeout fires after unmount
const handleBlur = useCallback(() => {
  setTimeout(() => {
    setIsFocused(false); // Fires on unmounted component!
  }, 150);
}, []);
```

**Fix:** Same pattern - track timeout in ref:

```typescript
const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const handleBlur = useCallback(() => {
  if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
  blurTimeoutRef.current = setTimeout(() => setIsFocused(false), 150);
}, []);

useEffect(
  () => () => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
  },
  []
);
```

**Prevention:**

1. Always track and cleanup setTimeout/setInterval in useEffect
2. Use `onExitComplete` for scroll operations during animated unmounts
3. Test overlay close on actual iOS devices, not Chrome DevTools emulator

---

## 2026-01-30: Mobile Crash from Event Listener Accumulation (useCallback Anti-pattern)

**Type:** Runtime | **Severity:** Critical

**Files:** `src/components/ui/layout/MobileDrawer/MobileDrawer.tsx`

**Error:** First modal close refreshes page. Second modal close crashes app. Pattern: open → close → open → close = crash.

**Root Cause:** `useCallback` with `isOpen` in dependency array causes function reference to change on every toggle. Event listeners accumulate because cleanup removes wrong reference.

```typescript
// BROKEN - function reference changes when isOpen changes
const handleEscape = useCallback(
  (e: KeyboardEvent) => {
    if (e.key === "Escape" && isOpen) {
      onClose();
    }
  },
  [isOpen, onClose] // ← isOpen causes new function on every toggle
);

useEffect(() => {
  window.addEventListener("keydown", handleEscape);
  return () => window.removeEventListener("keydown", handleEscape);
  // ↑ Cleanup tries to remove CURRENT reference, but listener was added with PREVIOUS reference
}, [handleEscape]);
```

**Bug progression:**

1. Open modal → add listener v1
2. Close modal → isOpen changes → handleEscape becomes v2 → cleanup removes v2 (not v1!) → v1 remains
3. Open again → add listener v3 → now v1 AND v3 are attached
4. Close → multiple stale listeners fire → state corruption → crash

**Fix:** Define handler inside useEffect with guard clause:

```typescript
// WORKING - same reference for add/remove, no listener when closed
useEffect(() => {
  if (!isOpen) return; // Guard: no listener when closed

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [isOpen, onClose]);
```

**Prevention:**

1. Never use `isOpen` (or other frequently-changing state) in useCallback dependencies for event handlers
2. Define event handlers INSIDE useEffect, not with useCallback
3. Add `if (!isOpen) return` guard to prevent listeners when component inactive
4. Pattern: Modal.tsx does this correctly, MobileDrawer.tsx did not

---

## 2026-01-30: Comprehensive setTimeout Cleanup (Mobile Crash Prevention)

**Type:** Runtime | **Severity:** Critical

**Files Fixed:**

- `src/components/ui/auth/AuthModal.tsx` - focus delay
- `src/components/ui/auth/OnboardingTour.tsx` - complete/skip delays
- `src/components/ui/menu/FavoriteButton.tsx` - burst animation delay
- `src/components/ui/menu/UnifiedMenuItemCard/AddButton.tsx` - animation reset delay
- `src/components/ui/menu/MenuContent.tsx` - close animation delay
- `src/components/ui/menu/SearchInput.tsx` - blur/focus delays
- `src/components/ui/error-shake.tsx` - shake reset delay
- `src/components/ui/cart/AddToCartButton.tsx` - async success animation

**Error:** Mobile app crashes or refreshes when closing modals/drawers. Pattern: interact → close quickly → crash.

**Root Cause:** setTimeout in callbacks or effects without cleanup. When component unmounts before timer fires, setState executes on unmounted component → mobile browser crash.

**Universal Fix Pattern:**

```typescript
// 1. Add ref to track timeout
const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// 2. Add cleanup effect
useEffect(() => {
  return () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };
}, []);

// 3. Use ref when setting timeout
const handleAction = useCallback(() => {
  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  timeoutRef.current = setTimeout(() => {
    setState(newValue);
  }, delay);
}, []);
```

**For async functions with await:**

```typescript
const isMountedRef = useRef(true);

useEffect(() => {
  isMountedRef.current = true;
  return () => {
    isMountedRef.current = false;
  };
}, []);

const handleAsync = useCallback(async () => {
  await someOperation();
  if (isMountedRef.current) {
    setState(newValue); // Only update if still mounted
  }
}, []);
```

**Prevention:**

1. ALWAYS track setTimeout with useRef
2. ALWAYS add cleanup useEffect
3. For async code, use isMountedRef guard before setState
4. Search for `setTimeout` in PR reviews - require cleanup pattern

---

## 2026-01-30: Cleanup Pattern Audit (Phase 35)

**Type:** Proactive Audit / Prevention | **Severity:** N/A - No issues found

**Files Audited:** 300 files in `src/components/` and `src/lib/`

**Summary:**
Comprehensive audit for memory leaks and crash patterns found 0 critical issues. The codebase already implements proper cleanup patterns for all identified risk areas:

| Pattern                | Files      | Status                                |
| ---------------------- | ---------- | ------------------------------------- |
| setTimeout/setInterval | 36+7 files | All have cleanup in useEffect         |
| addEventListener       | 22 files   | All have matching removeEventListener |
| GSAP animations        | 4 files    | All use useGSAP or manual kill()      |
| IntersectionObserver   | 4 files    | All have disconnect() in cleanup      |
| requestAnimationFrame  | 4 files    | All have cancelAnimationFrame         |
| AudioContext           | 2 files    | All have close() in cleanup           |

**Prevention Utilities Created (35-01):**

- `useMountedRef` - isMounted tracking for async callbacks
- `useSafeTimeout` - Auto-cleanup timeout hook
- `useSafeInterval` - Auto-cleanup interval hook
- `useSafeAsync` - AbortController-based async hook

**Reference:**

- `.planning/phases/35-mobile-crash-prevention/35-AUDIT.md` - Full audit report
- `.claude/CLEANUP-PATTERNS.md` - Pattern documentation
- `src/lib/hooks/useSafeEffects.ts` - Utility hooks

**Key Patterns (already in codebase):**

1. **Timer cleanup:** Store timeout/interval ID in ref, clear in useEffect cleanup

   ```typescript
   const timeoutRef = useRef<NodeJS.Timeout | null>(null);
   useEffect(
     () => () => {
       if (timeoutRef.current) clearTimeout(timeoutRef.current);
     },
     []
   );
   ```

2. **Event listener cleanup:** Define handler inside useEffect, remove in cleanup

   ```typescript
   useEffect(() => {
     const handler = (e: Event) => { ... };
     window.addEventListener("keydown", handler);
     return () => window.removeEventListener("keydown", handler);
   }, []);
   ```

3. **GSAP cleanup:** Use useGSAP with scope for automatic context cleanup

   ```typescript
   useGSAP(() => { gsap.to(...) }, { scope: containerRef });
   ```

4. **Observer cleanup:** Call disconnect() in useEffect cleanup
   ```typescript
   useEffect(() => {
     const observer = new IntersectionObserver(...);
     return () => observer.disconnect();
   }, []);
   ```

---

## 2026-02-19: Storage Migration Fails — Ownership of `storage.objects`

**Date:** 2026-02-19 | **Type:** Migration/Permissions | **Severity:** Medium
**Files:** `supabase/migrations/024_driver_photos_storage.sql`

**Error:** `42501: must be owner of relation objects` + `42703` when running migration through Supabase Dashboard SQL Editor.

**Root cause:** `storage.objects` is owned by `supabase_storage_admin`, not `postgres`. The SQL Editor runs as `postgres` and cannot CREATE/DROP POLICY on tables it doesn't own. The `42703` was a cascading error from the same failed execution.

**Fix:** Applied via MCP `apply_migration` tool which uses the management API with service-role (elevated) permissions. Bucket creation (`INSERT INTO storage.buckets`) works fine as `postgres` — only the policy statements require the storage admin role.

**Prevention:**
1. Never apply storage object policies via Dashboard SQL Editor
2. Use MCP `apply_migration` or `supabase db push` for storage migrations
3. See `.claude/learnings/supabase-auth.md` for full pattern

---

## 2026-02-19: Driver Avatar Not Synced Between Header and Nav

**Date:** 2026-02-19 | **Type:** Cache/Revalidation | **Severity:** Medium
**Files:** `api/driver/profile/photo/route.ts`, `api/driver/profile/route.ts`, `driver/layout.tsx`, `DriverHeader.tsx`, `DriverNav.tsx`

**Error:** After uploading a profile photo or saving profile (name), the avatar in DriverHeader (top bar) and DriverNav (bottom tab) didn't update despite `router.refresh()` being called client-side.

**Root cause:** Both API routes called `revalidatePath("/driver")` which defaults to `type: "page"`. This only invalidates `/driver/page.tsx` (dashboard). The **layout** (`/driver/layout.tsx`) — which is the single source of avatar data for both DriverHeader (via context) and DriverNav (via props) — stayed cached with stale data.

**Fix:** Changed to `revalidatePath("/driver", "layout")` in all 3 call sites. The `"layout"` type revalidates the layout AND all child pages.

**Prevention:**
1. When layouts provide data via context or props, always use `revalidatePath(path, "layout")`
2. Default `"page"` type is almost never what you want when layout data matters
3. See `.claude/learnings/nextjs.md` for pattern

---

## 2026-02-28: Google-Hosted Images Not Rendering (Referrer Policy)

**Date:** 2026-02-28 | **Type:** Runtime/Config | **Severity:** High
**Files:** `next.config.ts`, 16 component files with external `<img>` tags

**Error:** Product images (Google Drive thumbnails) and Google OAuth avatars not rendering in cart drawer, header, mobile drawer, and admin tables.

**Root Cause:** Two issues:
1. **Referrer policy blocks Google images.** App sets `Referrer-Policy: strict-origin-when-cross-origin` security header. Browser sends app origin as referrer when loading from `drive.google.com` / `lh3.googleusercontent.com`. Google blocks requests from unknown referrers. `next/image` components worked because they fetch server-side (no referrer sent).
2. **Narrow `remotePatterns` hostname.** Only `lh3.googleusercontent.com` configured, but Google uses `lh4`, `lh5`, `lh6`, etc.

**Fix:**
- Added `referrerPolicy="no-referrer"` to all external `<img>` tags (16 files)
- Changed `hostname: "lh3.googleusercontent.com"` → `hostname: "**.googleusercontent.com"` in `next.config.ts`

**Prevention:**
1. All external `<img>` tags loading from Google domains need `referrerPolicy="no-referrer"`
2. Use wildcard subdomain patterns (`**.domain.com`) in `remotePatterns` for CDNs with multiple subdomains
3. `next/image` doesn't have this issue (server-side fetch) — plain `<img>` does

---

## 2026-02-28: CI Detect Changes Job Fails — Checkout 404 (Permissions Allowlist)

**Date:** 2026-02-28 | **Type:** CI/CD | **Severity:** Medium
**Files:** `.github/workflows/ci.yml`

**Error:** `The process '/usr/bin/git' failed with exit code 128` — `repository not found`

**Root Cause:** Job-level `permissions` in GitHub Actions is an **allowlist**. The `changes` job only had `pull-requests: read`, which drops ALL other default permissions — including `contents: read` needed for `actions/checkout@v4` to clone the repo.

**Fix:** Added `contents: read` alongside `pull-requests: read`:
```yaml
permissions:
  contents: read
  pull-requests: read
```

Also added `fetch-depth: 2` for `dorny/paths-filter@v3` compatibility on push events.

**Prevention:**
1. When setting job-level `permissions`, always include `contents: read` if the job uses `actions/checkout`
2. Job-level permissions are allowlists — unlisted permissions are denied, not inherited

---

## 2026-01-26: Double-Add Cart Items (Button + Callback Both Mutate)

**Type:** Logic | **Severity:** High

**Files:** `src/components/ui/cart/AddToCartButton.tsx`, `src/components/ui/menu/MenuContentClient.tsx`, `src/components/homepage/HomepageMenuSection.tsx`

**Error:** Menu items with required modifiers added to cart with quantity 2 instead of 1. User selects one item, cart shows two.

**Root Cause:** `AddToCartButton.handleClick()` called `addItem()` directly, THEN called `onAdd()` callback. Parent's callback chain also called `addItem()` → double mutation.

```tsx
// BROKEN - component mutates AND triggers callback that also mutates
const handleClick = async () => {
  addItem({ ...item }); // First add
  onAdd?.(); // Parent's onAdd also calls addItem() → Second add
};
```

**Fix:** UI components should ONLY handle presentation; delegate mutations to parent via callback:

```tsx
// WORKING - component only triggers callback, parent handles mutation
const handleClick = async () => {
  // Animation, haptic, etc.
  onAdd?.(); // Parent is SOLE owner of cart mutation
};
```

**Prevention:**

1. Button components that accept mutation callbacks should NOT also perform the mutation
2. One owner principle: exactly ONE place should call `addItem()` for any user action
3. When adding callbacks to existing components, audit whether component already performs the action

---

## 2026-02-07: Pepper Design Tokens Not Generating Tailwind Utilities (Systemic)

**Type:** Build/Runtime | **Severity:** Critical

**Files:** `src/app/globals.css`, `tailwind.config.ts`, `src/styles/tokens.css`

**Error:** ~60+ custom design tokens (`bg-status-success-bg`, `text-status-error`, `bg-green`, `rounded-button`, etc.) silently resolve to transparent/0px despite CSS variables being correctly defined in `tokens.css` and mapped in `tailwind.config.ts`.

**Root Cause:** Tailwind v4 + Turbopack ignores `tailwind.config.ts` entirely. The `@config` directive is also silently ignored. Only `@theme inline {}` in globals.css drives utility generation. Tokens were defined in config + CSS but never registered in `@theme inline`.

**Fix:** Added all missing tokens to `@theme inline` block in `globals.css` using the self-referencing pattern: `--color-foo: var(--color-foo);`

**Detection method:** Playwright `browser_evaluate` — create element with class, read `getComputedStyle()`. Transparent/0px = not registered.

**Prevention:**

1. When adding tokens to `tokens.css`, ALWAYS also add to `@theme inline` in `globals.css`
2. Never rely on `tailwind.config.ts` for utility generation in Turbopack projects
3. Verify new token classes with computed style checks, not just visual inspection

---

## 2026-02-16: Update Banner Invisible (Wrong Token Name)

**Type:** Runtime | **Severity:** Medium

**Files:** `src/components/ui/offline/UpdatePrompt.tsx`

**Error:** Auto-update banner fully transparent — invisible to users. No build or lint error.

**Root Cause:** Used `bg-info` which maps to `--color-info` — a token that doesn't exist. The actual token is `--color-status-info` (class: `bg-status-info`). Tailwind generates the class but the CSS variable resolves to nothing → transparent.

**Fix:** `bg-info` → `bg-status-info`, `bg-info/20` → `bg-status-info/20`

**Prevention:**

1. Status colors in this project use `status-` prefix: `bg-status-info`, `bg-status-error`, etc.
2. Shorthand names (`info`, `error`, `success`) don't exist as standalone tokens
3. Verify with DevTools computed style — transparent = wrong token name

---

## 2026-02-16: Route Map Never Renders (useRef + Conditional Mount)

**Type:** Runtime | **Severity:** High

**Files:** `src/lib/hooks/useViewportTrigger.ts`, `src/components/ui/admin/routes/RouteDetailClient/RouteDetailClient.tsx`

**Error:** Google Maps on admin route detail page permanently shows skeleton — map never loads.

**Root Cause:** `useViewportTrigger` used `useRef` for the target element. The map container only mounts after async route data loads (`{route && <div ref={mapRef} />}`). By then the `useEffect` had already run with `ref.current === null` and never re-ran (deps: `[triggered, threshold, fallbackToEager]` — none change when ref.current updates).

**Fix:** Switched to callback ref + `useState` pattern. When element mounts, `setElement(node)` triggers state change → effect re-runs → IntersectionObserver attaches.

**Prevention:**

1. Never use `useRef` for elements inside conditional renders when the ref is consumed by `useEffect`
2. Use callback ref + state pattern for deferred/conditional elements
3. Test lazy-loaded components with actual async data, not just static renders

---
