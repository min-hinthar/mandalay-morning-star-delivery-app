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
Multiple `z-[var(--z-*)]` patterns cause Tailwind to generate `.z-[var(--z-...)]` with literal `...`.

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

## 2026-01-24: NEXT_REDIRECT Swallowed by Promise .catch()
**Type:** Runtime | **Severity:** High

**Error:** Server action with `redirect()` silently fails - no redirect, no error

**Root Cause:** Re-throwing NEXT_REDIRECT inside `.catch()` on fire-and-forget promise doesn't propagate:
```javascript
// BROKEN
handleClick().catch((e) => { throw e; }); // Creates unhandled rejection, not propagation
```

**Fix:** Don't wrap redirect-capable calls in `.catch()`:
```javascript
// WORKING
handleClick(); // Let errors bubble naturally
```

**Prevention:** Server actions using `redirect()` must not be wrapped in error handlers.

---
