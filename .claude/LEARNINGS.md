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

### Semantic Token Naming vs Usage Intent
**Context:** Footer section using `bg-text-primary` with `text-white` caused white-on-white in dark mode
**Learning:** `bg-text-primary` uses the text color as a background - in light mode it's dark (#111111), in dark mode it's light (#F8F7F6). This creates inverted behavior that breaks hardcoded `text-white`.

**Token usage patterns:**
```tsx
// ❌ bg-text-primary inverts, text-white doesn't
<section className="bg-text-primary">
  <h3 className="text-white">...</h3>  // Dark mode: light bg + white text = invisible
</section>

// ✅ Use semantic inverse token for contrast
<section className="bg-primary">
  <h3 className="text-text-inverse">...</h3>  // Auto-contrasts: white on dark, black on light
</section>

// ✅ Or use dedicated section tokens (footer, hero, etc.)
<section className="bg-footer-bg">
  <h3 className="text-footer-text">...</h3>  // Both switch together
</section>
```

**Key tokens:**
- `text-text-inverse`: White in light mode, black in dark mode - use on colored backgrounds
- `bg-footer-bg` / `text-footer-text`: Theme-aware footer pair defined in tokens.css

**Apply when:** Creating sections with solid backgrounds that need contrasting text in both themes.

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

## 2026-01-27: ESLint Guards for Consolidated Directories

**Context:** Phase 33 consolidated 8 directories into ui/ subdirectories. Needed to prevent accidental recreation.
**Learning:** Use ESLint's `no-restricted-imports` with multiple path patterns per directory to block both direct and aliased imports:

```javascript
// eslint.config.mjs
{
  rules: {
    "no-restricted-imports": ["error", {
      patterns: [
        {
          group: ["@/components/menu/*", "@/components/menu", "**/components/menu/*"],
          message: "menu/ consolidated into ui/menu/. Import from @/components/ui/menu."
        },
        // Repeat for each consolidated directory
      ]
    }]
  }
}
```

**Pattern elements:**
- `@/components/dir/*` - Catches aliased deep imports
- `@/components/dir` - Catches aliased barrel imports
- `**/components/dir/*` - Catches relative path imports

**Apply when:** Consolidating directories, removing deprecated paths, enforcing canonical import locations.

---

## 2026-01-27: CSS Variables for Theme-Aware Inline Styles

**Context:** CommandPalette had `backgroundColor: "rgba(255,255,255,0.85)"` inline style that wasn't theme-aware
**Learning:** When Tailwind classes don't support exact opacity values (e.g., `bg-surface-primary/85` not available), define CSS variable in tokens.css and reference in inline style:

```css
/* tokens.css - light theme */
--color-surface-primary-85: rgba(255, 255, 255, 0.85);

/* tokens.css - dark theme */
--color-surface-primary-85: rgba(0, 0, 0, 0.85);
```

```tsx
// Component
style={{ backgroundColor: "var(--color-surface-primary-85)" }}
```

**Apply when:** Glassmorphism effects, custom opacity backgrounds, or any inline style that needs to respect theme. Prefer tokens.css over component-level CSS variables for discoverability.

---

## 2026-01-27: Tailwind v4 Scans ALL Files for Class Patterns

**Context:** Build warnings about `var(--color-*)` wildcard patterns in generated CSS
**Learning:** Tailwind v4's auto-content detection scans ALL project files including:
- `eslint.config.mjs` — ESLint rule messages
- `scripts/*.js` — Build/audit scripts
- `.planning/**/*.md` — Planning documentation
- `docs/**/*.md` — User documentation

Any string matching Tailwind class syntax gets compiled, including examples in error messages.

**Fix:** Replace wildcards with concrete examples in documentation/messages:
```javascript
// BAD: Generates invalid CSS class
// Pattern like: bg-[ var(--color-WILDCARD) ]  <-- Don't use wildcards in examples!

// GOOD: Uses valid existing class
message: "Use bg-primary, bg-surface-primary instead"
```

**Apply when:** Writing ESLint rules, audit scripts, or documentation that includes Tailwind class examples. Always use real, valid class names.

---

## 2026-01-27: Tailwind v4 @source not Directive

**Context:** CSS parsing error `Unexpected token Delim('*')` from `--shadow-*` patterns in docs/scripts
**Learning:** Tailwind v4 auto-scans ALL directories for utility class patterns. Documentation files with wildcard examples like `var(--shadow-*)` generate invalid CSS.

**Fix:** Use `@source not` directive to exclude non-source directories:
```css
@import "tailwindcss";

/* Exclude directories that contain documentation patterns */
@source not "../../docs";
@source not "../../scripts";
@source not "../../.planning";

@import "../styles/tokens.css";
```

**Apply when:**
- CSS parsing errors with `Unexpected token` in generated Tailwind output
- Documentation/scripts contain CSS variable patterns with wildcards
- Build errors from files outside `src/`

---

## 2026-01-27: Tailwind v4 @theme inline for Custom Token Utilities

**Context:** `bg-overlay-heavy` class not applying despite token being defined in tokens.css
**Learning:** Tailwind v4 only generates utility classes for CSS variables explicitly mapped in `@theme inline`. Having `--color-overlay-heavy` in tokens.css is NOT sufficient - it must be declared in the theme block.

```css
/* ❌ Token exists but no utility generated */
/* tokens.css has: --color-overlay-heavy: rgba(0,0,0,0.8); */
/* But bg-overlay-heavy doesn't work */

/* ✅ Add to @theme inline in globals.css */
@theme inline {
  --color-overlay: var(--color-overlay);
  --color-overlay-heavy: var(--color-overlay-heavy);
  --color-overlay-light: var(--color-overlay-light);
}
/* Now bg-overlay-heavy works */
```

**Apply when:** Adding new color tokens that need Tailwind utility class generation (bg-*, text-*, border-*, etc.).

---

## 2026-01-27: Mobile-Only Drawer Backdrop Blur Issues

**Context:** CartDrawer backdrop blur causing visual artifacts on mobile devices
**Learning:** `backdrop-blur-sm` on mobile can cause:
- Performance issues on lower-end devices
- Visual artifacts with fixed/sticky elements
- Janky animations during drawer open/close

**Fix:** Apply blur only on larger screens using responsive modifier:
```tsx
// ❌ Blur on all devices - causes mobile issues
className="fixed inset-0 bg-overlay backdrop-blur-sm"

// ✅ Blur only on tablet+ (sm: = 640px+)
className="fixed inset-0 bg-overlay-heavy sm:backdrop-blur-sm"
```

**Token consideration:** Also increased opacity from `bg-overlay` (50%) to `bg-overlay-heavy` (80-90%) to compensate for missing blur on mobile.

**Apply when:** Drawer/modal overlays with backdrop-blur, especially on mobile-first apps.

---

## 2026-01-28: touchAction Conflicts in Nested Mobile Elements

**Context:** Bottom sheet with swipe-to-close (needs `pan-x`) containing scrollable content (needs `pan-y`)
**Learning:** Parent's `touchAction: "pan-x"` (for swipe gesture) blocks vertical scroll in children. Adding `touchAction: "pan-y"` on child content restores scroll but may conflict with parent gesture detection.

**Hierarchy matters:**
```tsx
// Parent: swipe-to-close gesture handler
<motion.div style={{ touchAction: "pan-x" }} drag="y">
  {/* Child: scrollable content wrapper */}
  <div style={{ touchAction: "pan-y" }}>
    {/* Scrollable content - vertical scroll works */}
  </div>
</motion.div>
```

**Key insight:** The drag handle should have `touch-none` (let Framer handle all gestures), while content areas use `pan-y` to allow native scroll.

**Apply when:** Building swipeable overlays (drawers, sheets) with scrollable content on mobile.

---

## 2026-01-28: Defensive Checks for Framer Motion Drag Handlers

**Context:** Swipe-to-close causing app crash/reload on mobile
**Learning:** Framer Motion's `PanInfo` object in drag handlers (`onDrag`, `onDragEnd`) may have undefined `offset` or `velocity` properties in edge cases (rapid gestures, interrupted drags).

**Fix:** Add defensive checks before accessing properties:
```tsx
const handleDragEnd = (_: unknown, info: PanInfo) => {
  setIsDragging(false);
  setDragOffset(0);

  // Defensive check for malformed event info
  if (!info?.offset || !info?.velocity) return;

  const offset = info.offset.y;
  const velocity = info.velocity.y;
  // ... rest of logic
};
```

**Apply when:** Any Framer Motion drag gesture implementation, especially on mobile where gesture interruption is common.

---

## 2026-01-29: Performance Optimization Patterns

### Lazy Load Below-Fold Heavy Components
**Context:** Google Maps loading synchronously on page load despite being below the fold
**Learning:** Heavy third-party libraries (Google Maps, charts, video players) should be lazy loaded when not immediately visible. Use React.lazy() + Suspense with skeleton fallback.

```tsx
// ❌ Loads 369KB Google Maps chunk on initial page load
import { HowItWorksSection } from "./HowItWorksSection";

// ✅ Lazy load - reduces initial bundle by 58%
const HowItWorksSection = React.lazy(() =>
  import("./HowItWorksSection").then((m) => ({ default: m.HowItWorksSection }))
);

<Suspense fallback={<HowItWorksSkeleton />}>
  <HowItWorksSection />
</Suspense>
```

**Apply when:** Components with heavy dependencies that aren't visible on initial viewport (below fold, in tabs, in modals).

### IntersectionObserver for Animation Pause
**Context:** Map pulsing animation running every 1500ms even when off-screen
**Learning:** setInterval animations waste CPU/battery when element isn't visible. Use IntersectionObserver to pause when off-screen.

```tsx
const [isVisible, setIsVisible] = useState(false);
const containerRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => setIsVisible(entry.isIntersecting),
    { threshold: 0.1 }
  );
  if (containerRef.current) observer.observe(containerRef.current);
  return () => observer.disconnect();
}, []);

useEffect(() => {
  if (!isVisible) return;  // Skip when off-screen
  const interval = setInterval(animatePulse, 1500);
  return () => clearInterval(interval);
}, [isVisible]);
```

**Apply when:** Any repeating animation (setInterval, requestAnimationFrame loops) in scrollable content.

### willChange Only on Interaction
**Context:** `willChange: "transform"` on all menu cards causing GPU memory pressure
**Learning:** `willChange` creates compositor layers. Too many layers = janky animations. Apply only during interaction.

```tsx
// ❌ Always creates GPU layer - memory pressure with many cards
<div style={{ willChange: "transform" }} />

// ✅ Layer only when needed
const [isHovered, setIsHovered] = useState(false);
<div
  style={{ willChange: isHovered ? "transform" : "auto" }}
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
/>
```

**Apply when:** Components with hover/tap animations that appear in lists (cards, menu items, list rows).

### optimizePackageImports for Tree-Shaking
**Context:** @react-google-maps/api not tree-shaken, full library bundled
**Learning:** Some packages don't tree-shake automatically. Add to Next.js config.

```ts
// next.config.ts
experimental: {
  optimizePackageImports: [
    "@react-google-maps/api",
    "lucide-react",
    "date-fns",
    // Add packages that don't tree-shake well
  ],
}
```

**Apply when:** Bundle analyzer shows large chunks from specific packages that should be smaller based on imports.

---

## 2026-01-28: Bottom Sheet UX Fallbacks for Unreliable Gestures

**Context:** Swipe-to-close gesture unreliable on mobile due to touchAction conflicts
**Learning:** Always provide multiple dismiss methods for bottom sheets:

1. **Close button (X)** - Explicit action, accessible, always works
2. **Reduced height (80vh not 90vh)** - Exposes backdrop for tap-to-close
3. **Swipe gesture** - Nice-to-have, not required

```tsx
<Drawer height="full">  {/* 80vh, not 90vh */}
  <CloseButton onClick={onClose} />  {/* Explicit close */}
  {content}
</Drawer>
```

**Apply when:** Designing mobile bottom sheets, especially with scrollable content.

---

## 2026-01-29: React Portal for Escaping CSS Stacking Contexts

**Context:** Autocomplete dropdown appearing behind glass cards with Framer Motion hover animations
**Learning:** Parent elements with CSS transforms (Framer Motion's `whileHover: { scale }`) create new stacking contexts. Child elements cannot escape with z-index alone, regardless of value.

**Fix:** Use React Portal to render dropdown at `document.body` level with position tracking:

```tsx
import { createPortal } from "react-dom";

const inputRef = useRef<HTMLDivElement>(null);
const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
const [isMounted, setIsMounted] = useState(false);

useEffect(() => { setIsMounted(true); }, []);

useEffect(() => {
  if (isFocused && inputRef.current) {
    const rect = inputRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + window.scrollY + 4,  // Account for scroll
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }
}, [isFocused]);

// Portal-based dropdown
{isMounted && createPortal(
  <div
    style={{
      position: "absolute",
      top: position?.top,
      left: position?.left,
      width: position?.width,
      backgroundColor: "var(--color-surface-elevated)",  // Inline for reliability
    }}
    className="z-[9999]"
  >
    {dropdownContent}
  </div>,
  document.body
)}
```

**Apply when:** Dropdowns, tooltips, or popovers inside components with Framer Motion transforms (scale, rotate, translate). Signs: z-index not working despite high values.

---

## 2026-01-29: Inline Styles with CSS Variables for Guaranteed Application

**Context:** Semantic token `bg-surface-elevated` not applying reliably to portal dropdown
**Learning:** When className-based tokens don't apply (stacking context issues, specificity conflicts), use inline `style` prop with CSS variable reference for guaranteed application.

```tsx
// ❌ May not apply in certain stacking contexts
className="bg-surface-elevated"

// ✅ Guaranteed application - combines both approaches
style={{ backgroundColor: "var(--color-surface-elevated)" }}
className="bg-surface-elevated"
```

**Why both:** className provides IDE autocomplete and linting; inline style ensures CSS actually applies regardless of cascade issues.

**Apply when:** Portal-rendered elements, dynamically positioned elements, or any case where semantic token classes aren't applying as expected.

---

## 2026-01-29: Google Maps AdvancedMarkerElement Requires Map ID

**Context:** Upgrading from legacy `Marker` to `AdvancedMarkerElement` caused warning "map is initialized without a valid Map ID"
**Learning:** `AdvancedMarkerElement` requires a Map ID from Google Cloud Console. Without `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`, markers won't render on vector maps.

**Fix:** Implement fallback pattern - use `AdvancedMarkerElement` when Map ID available, legacy `Marker` otherwise:

```tsx
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

// Map options - only include mapId when available
options={{
  ...(MAP_ID && { mapId: MAP_ID }),
}}

// Inside GoogleMap: Legacy fallback when no Map ID
{!MAP_ID && (
  <Marker position={position} icon={{ path: google.maps.SymbolPath.CIRCLE, ... }} />
)}

// AdvancedMarkerElement via useEffect when Map ID available
useEffect(() => {
  if (!map || !isLoaded || !MAP_ID) return;
  markerRef.current = new google.maps.marker.AdvancedMarkerElement({
    map,
    position,
    content: customHtmlElement,
  });
  return () => { markerRef.current?.map = null; };
}, [map, isLoaded]);
```

**Apply when:** Using Google Maps with custom markers. Enables gradual adoption of vector maps while maintaining compatibility.

---

## 2026-01-29: Next.js Image Aspect Ratio with Fixed Width

**Context:** Logo images getting squished due to fixed width AND height classes
**Learning:** When using Next.js Image with a fixed width, add `style={{ height: "auto" }}` to maintain aspect ratio instead of using both `w-*` and `h-*` classes.

```tsx
// ❌ Squished - both dimensions fixed
<Image
  src="/logo.png"
  width={48}
  height={48}
  className="w-12 h-12"
/>

// ✅ Maintains aspect ratio
<Image
  src="/logo.png"
  width={48}
  height={48}
  style={{ height: "auto" }}
  className="w-12"
/>
```

**Apply when:** Displaying logos or images where aspect ratio must be preserved and width is the controlling dimension.

---
