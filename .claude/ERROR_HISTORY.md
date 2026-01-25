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
