# Session Learnings

Patterns, conventions, and insights discovered while working on this codebase.

**Archive:** `.claude/archive/learnings-v1.0-v1.1.md` for older entries.

---

## TailwindCSS 4 Patterns (Consolidated)

### Auto-Content Detection
TailwindCSS 4 with `@tailwindcss/postcss` scans ALL files in repository - including `docs/`, `.planning/`, `.claude/` - even when not in configured content paths. Code examples in markdown get compiled into CSS.

**Prevention:** Use valid, current Tailwind classes in ALL documentation code examples.

### Z-Index Utilities
Custom `zIndex` theme extensions do NOT generate utility classes in v4.

```ts
// ❌ This does NOT create z-modal class
theme: { extend: { zIndex: { modal: '50' } } }

// ✅ Use default scale or arbitrary values
z-50       // Default scale
z-[60]     // Arbitrary value
```

### @theme Variable Naming
CSS variables use full prefix (`--z-index-modal`), utilities strip it (`z-modal`).
TypeScript helpers must reference full CSS variable name: `var(--z-index-modal)`.

**Helper pattern:**
```ts
export const zClass = {
  sticky: "z-30",
  fixed: "z-40",
  modal: "z-50",
  popover: "z-[60]",
};
```

---

## Next.js Patterns

### NEXT_REDIRECT Cannot Be Caught
`redirect()` throws special error that must propagate unhandled. This fails:
```javascript
handleClick().catch((e) => { throw e; }); // Creates unhandled rejection
```
**Pattern:** Don't wrap redirect-capable server actions in `.catch()`.

---

## GSD Workflow Patterns (Consolidated)

### Wave-Based Parallel Execution
Plans grouped by dependencies enable safe parallelization:
- Wave 1: Independent plans (no deps within wave)
- Wave 2: Plans depending only on Wave 1

**Results:** 4 parallel agents ~8min vs ~28min sequential. Git serializes commits naturally.

### Phase vs Integration Verification Gap
Phase verifier confirms components exist and are wired internally, but does NOT check:
- Whether V8 components imported into live app
- Whether legacy components still being used

**Detection:**
```bash
grep -r "MenuContentV8" src/app --include="*.tsx"
# Empty = orphaned component
```

---

## UI Component Patterns

### Dropdown Event Handling
Use `mousedown` for outside click detection (fires before `click`, catches event earlier).
Do NOT use `stopPropagation()` on dropdown content - let events bubble.

```tsx
useEffect(() => {
  const handleMouseDown = (e: MouseEvent) => {
    if (!dropdownRef.current?.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };
  document.addEventListener("mousedown", handleMouseDown);
  return () => document.removeEventListener("mousedown", handleMouseDown);
}, []);
```

### onMouseDown for Autocomplete
When input blur fires before onClick, suggestions disappear before click registers.
Use `onMouseDown` with `e.preventDefault()` to prevent blur:
```tsx
<button onMouseDown={(e) => { e.preventDefault(); onSelect(item); }}>
```

### Focus Trap Pattern
```tsx
const focusables = drawerRef.current?.querySelectorAll<HTMLElement>(
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
);
// Tab wraps: last → first, Shift+Tab: first → last
```

### useMediaQuery Breakpoint Precision
Use 639px for exclusive mobile to match Tailwind's `sm:` (640px):
```tsx
const isMobile = useMediaQuery("(max-width: 639px)");
// < 640px = mobile, >= 640px = desktop
```

---

## Animation Patterns

### GSAP ScrollTrigger Play-Once
```tsx
gsap.from(cards, {
  y: 40, opacity: 0, stagger: 0.06,
  scrollTrigger: {
    trigger: containerRef.current,
    start: "top 85%",
    toggleActions: "play none none none",  // Play once only
  },
});
```

### Skeleton Loading Structure
Match exact DOM structure of loaded state to prevent layout shift:
- Same sticky positions, heights, spacing
- Same grid structure, aspect ratios

---

## Testing Patterns

### E2E DOM Removal for AnimatePresence
Don't use `.not.toBeVisible()` - element may be invisible but still blocking clicks.
Use `.count()` to verify complete DOM removal:
```typescript
const count = await page.locator('[data-testid="overlay-backdrop"]').count();
expect(count).toBe(0);
```

---

## Design Token Patterns

### Check Fallback Code for Token Violations
Fallback CSS (non-WebGL path, polyfills, error handlers) often has hardcoded values.
ESLint catches className violations but misses inline style objects.

```bash
grep -r "zIndex.*[0-9][0-9][0-9]" src/lib src/components --include="*.ts" --include="*.tsx"
```

### ESLint Severity for Legacy Migration
Add rules at "warn" first, upgrade to "error" after migration complete.
Create migration tracker with violation inventory mapped to future phases.

---

## Stacking Context Patterns

### Isolation Insufficient for Mixed Codebases
`isolate` only prevents z-index competition within subtree. Multiple isolated sections still compete at document level. Legacy components without isolation create z-index leakage.

**Solution:** Remove all legacy components, establish single z-index hierarchy from app root.

### Integration Gap Closure
Incremental adoption creates "frankenstein" state where:
- V8 tokens conflict with legacy values
- Import paths may resolve to legacy in some code paths
- CSS cascade order creates unexpected results

**Pattern:** Atomic swap - replace ALL usages of legacy component in single commit, then delete legacy files.

---

## Build Patterns

### Network Errors Are Infrastructure
Google Fonts 403 errors in sandboxed environments are infrastructure issues, not code.
- Don't block verification on network errors
- Verify code correctness with typecheck, lint, tests
- Build success is bonus validation

---

## Component Organization

### V8 Barrel Export Pattern
Group exports by feature domain with comments:
```tsx
// Category navigation
export { CategoryTabsV8 } from "./CategoryTabsV8";

// Item display
export { MenuItemCardV8 } from "./MenuItemCardV8";

// Search
export { SearchInputV8 } from "./SearchInputV8";
```

---
