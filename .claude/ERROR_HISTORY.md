# Error History

Reference for past bugs, root causes, and fixes. Check here before debugging similar issues.

**Archive:** `.claude/archive/errors-v1.0-v1.1.md` for older entries.

---

## TailwindCSS 4 Z-Index System (Consolidated)
**Type:** Build/Runtime | **Severity:** Critical | **Dates:** 2026-01-22 to 2026-01-24

### The Problem
TailwindCSS 4 z-index handling differs significantly from v3. Four related issues caused silent layering failures.

### Issue 1: Custom zIndex Theme Extensions Don't Generate Classes
```ts
// tailwind.config.ts - THIS DOES NOT WORK IN V4
theme: { extend: { zIndex: { modal: '50' } } }
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
  popover: "z-[60]",  // Arbitrary for non-default values
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
  return <div ref={triggerRef}><button>...</button></div>;
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
  setTimeout(() => window.scrollTo(0, scrollY), 0);  // Never cleaned!
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
  onAdd?.();  // Parent closes drawer here!
  setState("success");
  await new Promise((r) => setTimeout(r, 600));  // Still waiting...
  setState("idle");  // CRASH - component unmounted!
}, []);
```

**Fix:** Add isMountedRef to guard setState in async code:
```typescript
const isMountedRef = useRef(true);
useEffect(() => {
  isMountedRef.current = true;
  return () => { isMountedRef.current = false; };
}, []);

// In async function:
if (isMountedRef.current) setState("idle");
```

```typescript
// BROKEN - setTimeout fires after unmount
const handleBlur = useCallback(() => {
  setTimeout(() => {
    setIsFocused(false);  // Fires on unmounted component!
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

useEffect(() => () => {
  if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
}, []);
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
  [isOpen, onClose]  // ← isOpen causes new function on every toggle
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
  if (!isOpen) return;  // Guard: no listener when closed

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
  return () => { isMountedRef.current = false; };
}, []);

const handleAsync = useCallback(async () => {
  await someOperation();
  if (isMountedRef.current) {
    setState(newValue);  // Only update if still mounted
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

| Pattern | Files | Status |
|---------|-------|--------|
| setTimeout/setInterval | 36+7 files | All have cleanup in useEffect |
| addEventListener | 22 files | All have matching removeEventListener |
| GSAP animations | 4 files | All use useGSAP or manual kill() |
| IntersectionObserver | 4 files | All have disconnect() in cleanup |
| requestAnimationFrame | 4 files | All have cancelAnimationFrame |
| AudioContext | 2 files | All have close() in cleanup |

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
   useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);
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

## 2026-01-26: Double-Add Cart Items (Button + Callback Both Mutate)
**Type:** Logic | **Severity:** High

**Files:** `src/components/ui-v8/cart/AddToCartButton.tsx`, `src/components/ui-v8/menu/MenuContentV8.tsx`, `src/components/homepage/HomepageMenuSection.tsx`

**Error:** Menu items with required modifiers added to cart with quantity 2 instead of 1. User selects one item, cart shows two.

**Root Cause:** `AddToCartButton.handleClick()` called `addItem()` directly, THEN called `onAdd()` callback. Parent's callback chain also called `addItem()` → double mutation.

```tsx
// BROKEN - component mutates AND triggers callback that also mutates
const handleClick = async () => {
  addItem({ ...item });  // First add
  onAdd?.();             // Parent's onAdd also calls addItem() → Second add
};
```

**Fix:** UI components should ONLY handle presentation; delegate mutations to parent via callback:

```tsx
// WORKING - component only triggers callback, parent handles mutation
const handleClick = async () => {
  // Animation, haptic, etc.
  onAdd?.();  // Parent is SOLE owner of cart mutation
};
```

**Prevention:**
1. Button components that accept mutation callbacks should NOT also perform the mutation
2. One owner principle: exactly ONE place should call `addItem()` for any user action
3. When adding callbacks to existing components, audit whether component already performs the action

---
