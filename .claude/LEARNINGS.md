# Session Learnings

Patterns, conventions, and insights discovered while working on this codebase.

**Archive:** `.claude/archive/learnings-v1.0-v1.1.md` for older entries.

---

## 2026-01-25: Framer Motion Step Animation Direction

**Context:** Multi-step checkout with AnimatePresence slide animations
**Learning:** When direction is calculated in useEffect after step change, animation starts with stale direction value. AnimatePresence reads `custom={direction}` on render, before useEffect runs.

**Fix:** Use ref for direction, set synchronously BEFORE step change:
```tsx
// ❌ Broken - useEffect runs after render
const [direction, setDirection] = useState(1);
useEffect(() => {
  setDirection(currentIndex >= prevIndex ? 1 : -1);
}, [step]);

// ✅ Working - ref updates synchronously
const directionRef = useRef(1);
const goToPrevStep = () => {
  directionRef.current = -1;  // Set BEFORE step change
  forceUpdate({});
  setStep(STEPS[currentIndex - 1]);
};
```

**Apply when:** Step navigation with direction-aware animations (slide left/right, enter/exit variants with `custom` prop).

---

## 2026-01-25: Date String Parsing Creates Timezone Bugs

**Context:** Delivery date picker showing Fridays instead of Saturdays
**Learning:** `new Date("YYYY-MM-DD")` parses as UTC midnight. For Pacific Time (UTC-8), "2025-01-25T00:00:00Z" displays as Jan 24 at 4pm local = Friday.

**Fix:** Always use `timeZone` option when formatting dates:
```tsx
// ❌ Shows wrong day for west coast users
const dateObj = new Date(dateString);
const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });

// ✅ Consistent display across timezones
const dayName = dateObj.toLocaleDateString("en-US", {
  weekday: "short",
  timeZone: TIMEZONE  // "America/Los_Angeles"
});
```

**Apply when:** Displaying dates from YYYY-MM-DD strings, especially for business logic tied to specific days (delivery schedules, cutoff times).

---

## 2026-01-25: Fragment Cannot Receive className (Radix Slot)

**Context:** Button component using Radix Slot's `asChild` prop throws React warning about className on Fragment
**Learning:** When Radix Slot passes props to children, Fragments can't receive className. React warns: "Invalid prop `className` supplied to `React.Fragment`."

**Fix:** Replace Fragment with `<span className="contents">` - preserves layout while accepting props:
```tsx
// ❌ Fragment can't receive className from Radix Slot
<>
  <Loader2 />
  <span>Loading...</span>
</>

// ✅ span with contents display preserves Fragment-like layout
<span className="contents">
  <Loader2 />
  <span>Loading...</span>
</span>
```

**Apply when:** Any component using Radix's `asChild` prop where children wrap content in Fragments.

---

## 2026-01-25: Context Provider Re-render Loops

**Context:** Multiple components (Tooltip, Dropdown, Modal, PushToast) causing infinite re-renders
**Learning:** Context providers with inline object values or unstable setters trigger re-renders on every parent render. All consumers re-render when context value identity changes.

**Fix:** Memoize context value object and wrap setters in useCallback:
```tsx
// ❌ New object every render → all consumers re-render
<Context.Provider value={{ isOpen, setIsOpen }}>

// ✅ Stable references prevent cascading re-renders
const contextValue = useMemo(() => ({
  isOpen,
  setIsOpen: useCallback((v) => setIsOpen(v), []),
}), [isOpen]);
<Context.Provider value={contextValue}>
```

**Apply when:** Creating context providers, especially for UI state (modals, dropdowns, tooltips).

---

## 2026-01-25: Windows Git Case-Sensitive Rename

**Context:** Renaming component files from kebab-case to PascalCase (e.g., `login-form.tsx` → `LoginForm.tsx`)
**Learning:** Windows filesystem is case-insensitive, but Git is case-sensitive. Direct rename (`git mv file.tsx File.tsx`) fails silently or causes tracking issues.

**Fix:** Two-step rename through intermediate name:
```bash
git mv login-form.tsx login-form.tsx.tmp && git mv login-form.tsx.tmp LoginForm.tsx
```

**Apply when:** Renaming files with only casing changes on Windows.

---

## 2026-01-25: Component Deletion Requires Barrel Cleanup

**Context:** Deleting unused components left their barrel file exports dangling
**Learning:** When deleting component files, also:
1. Remove exports from `index.ts` barrel files
2. Check for any imports across codebase (`grep "from.*ComponentName"`)
3. Verify deletion didn't break type exports

**Gotcha:** Exploration tools may report components as "unused" when only imported via barrel file re-exports. Always verify actual usage before deletion.

**Deletion Checklist:**
```bash
# 1. Find all imports
grep -r "from.*ComponentName" src --include="*.tsx" --include="*.ts"
# 2. Delete file
rm src/components/path/ComponentName.tsx
# 3. Remove from barrel
# Edit index.ts to remove export
# 4. Typecheck
pnpm typecheck
```

**Apply when:** Deleting any exported component or utility.

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

**Critical:** The ref must wrap BOTH trigger AND content (entire dropdown), not just trigger.
If ref only contains trigger, clicking menu items registers as "outside" click → menu closes before click completes.

```tsx
// ✅ Correct: ref wraps entire dropdown
const DropdownMenu = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  return <div ref={containerRef}>{children}</div>; // Contains trigger + content
};
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

### 3D Transforms + Scale/Z-Index = Flickering
**Context:** Menu cards with `preserve-3d` tilt effect flickered when combined with Framer Motion's `whileHover`/`whileTap`
**Learning:** `zIndex` changes and `scale` transforms in `whileHover`/`whileTap` create new stacking contexts that break `preserve-3d` inheritance. The browser recalculates layer compositing, causing content to flicker or disappear during 3D rotations.

```tsx
// ❌ Flickering - zIndex and scale create stacking context conflicts
<motion.div
  style={{ transformStyle: "preserve-3d", rotateX, rotateY }}
  whileHover={{ scale: 1.03, zIndex: 50 }}  // Breaks 3D context
  whileTap={{ scale: 0.98 }}                 // Also conflicts
>

// ✅ No flickering - disable scale when using 3D tilt
<motion.div
  style={{ transformStyle: "preserve-3d", rotateX, rotateY }}
  whileHover={!shouldEnableTilt ? { scale: 1.03 } : undefined}
  whileTap={!shouldEnableTilt ? { scale: 0.98 } : undefined}
>
```

**Apply when:** Combining Framer Motion's `whileHover`/`whileTap` with CSS 3D transforms (`preserve-3d`, `perspective`, `rotateX/Y/Z`). The 3D effect itself provides hover feedback, so scale transforms are redundant and harmful.

---

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

## State Mutation Patterns

### Single Mutation Owner Principle
Action buttons that accept callbacks should NOT also perform the same action directly. Exactly one component should own state mutation for any user action.

```tsx
// ❌ Double mutation - component AND parent both mutate
const AddButton = ({ onAdd }) => {
  const handleClick = () => {
    addToStore(item);  // Component mutates
    onAdd?.();         // Callback may ALSO mutate
  };
};

// ✅ Single owner - parent owns mutation
const AddButton = ({ onAdd }) => {
  const handleClick = () => {
    playAnimation();   // UI only
    onAdd?.();         // Parent decides what to do
  };
};
```

**Apply when:** Creating action buttons with callbacks, especially for mutations (cart, favorites, forms).

### Cart Item Deduplication by Signature
Create unique signature from (menuItemId + modifiers + notes) for cart deduplication:

```tsx
function createItemSignature(item: {
  menuItemId: string;
  modifiers: SelectedModifier[];
  notes: string;
}): string {
  const sortedModifiers = [...item.modifiers]
    .sort((a, b) => a.optionId.localeCompare(b.optionId))
    .map((m) => m.optionId)
    .join("|");
  return `${item.menuItemId}::${sortedModifiers}::${item.notes.trim()}`;
}
```

Merge quantities for matching signatures instead of creating duplicate entries.

**Apply when:** Cart stores, wishlists, or any collection where duplicates should merge.

### Store-Level Debounce for Rapid Mutations
Even with single mutation owner, rapid double-clicks or animation callbacks can trigger multiple adds. Add debounce at store level as final safeguard:

```tsx
const recentAdditions = new Map<string, number>();
const DEBOUNCE_MS = 300;

function shouldDebounce(signature: string): boolean {
  const now = Date.now();
  const lastAdd = recentAdditions.get(signature);
  if (lastAdd && now - lastAdd < DEBOUNCE_MS) {
    return true;  // Skip this add
  }
  recentAdditions.set(signature, now);
  return false;
}

// Export for test cleanup
export function __clearDebounceState(): void {
  recentAdditions.clear();
}
```

**Apply when:** Mutation stores where UI animations or callbacks may fire multiple times. Always export clear function for test isolation.

---

## Hydration Patterns

### Platform Detection Causes Hydration Mismatch
**Context:** SearchTrigger showing "Cmd K" vs "Ctrl K" based on platform
**Learning:** Hooks that access `navigator.platform` or `navigator.userAgent` return different values server (undefined/false) vs client (actual value). If used in render output (aria-label, text), causes hydration mismatch.

**Fix:** Return `mounted` state alongside detected value, render neutral content until mounted:
```tsx
function useIsMac() {
  const [state, setState] = useState({ isMac: false, mounted: false });

  useEffect(() => {
    const platform = navigator.platform?.toLowerCase() || "";
    setState({
      isMac: platform.includes("mac"),
      mounted: true,
    });
  }, []);

  return state;
}

// Usage: render neutral text until mounted
const shortcutText = mounted ? (isMac ? "Cmd K" : "Ctrl K") : "K";
```

**Apply when:** Any hook accessing browser-only APIs (navigator, window properties) that affect render output.

---

## cmdk Library Patterns

### Command.Input Requires Explicit State Binding
**Context:** Command palette search input not responding to typing
**Learning:** When using `shouldFilter={false}` on cmdk's `<Command>`, the `<Command.Input>` does NOT automatically manage state. Must explicitly pass `value` and `onValueChange` props.

```tsx
// ❌ Input appears to work but query state never updates
<Command shouldFilter={false}>
  <Command.Input placeholder="Search..." />
  {/* query is always "" */}
</Command>

// ✅ Explicit state binding
const [query, setQuery] = useState("");
<Command shouldFilter={false}>
  <Command.Input
    value={query}
    onValueChange={setQuery}
    placeholder="Search..."
  />
</Command>
```

**Apply when:** Using cmdk with custom filtering logic (`shouldFilter={false}`).

---

## Next.js Route Groups Not Part of URL Path

**Context:** Account icon and mobile nav sign-in links returning 404
**Learning:** Next.js route groups like `(auth)` are **not part of the URL path**. The parentheses are stripped from the URL.

```
File:  src/app/(auth)/login/page.tsx
URL:   /login           ✅ Correct
NOT:   /auth/login      ❌ 404
```

When linking to pages inside route groups, use the actual URL path without the group name:
```tsx
// ❌ Wrong - includes route group name
<Link href="/auth/login">Sign In</Link>

// ✅ Correct - route group stripped from URL
<Link href="/login">Sign In</Link>
```

**Apply when:** Linking to pages that use Next.js route groups `(groupName)` for organization.

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
