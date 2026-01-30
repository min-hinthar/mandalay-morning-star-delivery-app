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

**Files:** `src/lib/hooks/useBodyScrollLock.ts`, `src/components/ui/Drawer.tsx`, `src/components/ui/Modal.tsx`, `src/components/ui/layout/MobileDrawer/MobileDrawer.tsx`

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

**Prevention:**
1. Always track and cleanup setTimeout/setInterval in useEffect
2. Use `onExitComplete` for scroll operations during animated unmounts
3. Test overlay close on actual iOS devices, not Chrome DevTools emulator

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
