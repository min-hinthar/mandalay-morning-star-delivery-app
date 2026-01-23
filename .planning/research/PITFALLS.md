# Domain Pitfalls: UI/UX Frontend Rewrite

**Project:** Morning Star Delivery App UI Rewrite
**Domain:** Next.js 16 + React 19 + TailwindCSS 4 + Framer Motion + Radix UI
**Researched:** 2026-01-21
**Confidence:** HIGH (verified against existing codebase issues and official documentation)

---

## Critical Pitfalls

Mistakes that cause rewrites or major clickability/usability failures.

---

### Pitfall 1: Stacking Context Traps from CSS Properties

**What goes wrong:** Elements become unclickable or visually misplaced because CSS properties silently create new stacking contexts, trapping z-index values within their local hierarchy.

**Why it happens:** The following CSS properties create new stacking contexts:
- `transform` (including `translateZ(0)`, `scale()`, `rotate()`)
- `backdrop-filter` / `backdrop-blur`
- `filter`
- `opacity` < 1
- `will-change: transform`
- `position: fixed/sticky` with z-index
- `isolation: isolate`

When a header uses `backdrop-blur` for frosted glass effect, it creates a new stacking context. Any z-index inside that context only competes with siblings in that same context, not globally.

**Consequences:**
- Header nav items unclickable when overlays have higher global z-index
- Dropdowns appear behind parent containers despite high z-index values
- Modal backdrops fail to cover certain page sections

**Prevention:**
1. **Audit every fixed/sticky element** for stacking-context-creating properties
2. **Use a single portal root** for all overlays (Radix does this by default)
3. **Test z-index hierarchy** by temporarily setting all fixed elements to `pointer-events-none` - if underlying content becomes clickable, you have a stacking context trap
4. **Document which components create stacking contexts** in a LAYER_MAP.md

**Detection (warning signs):**
- "Works on homepage but not on /menu page" reports
- Intermittent click failures that vary by scroll position
- Overlays working in isolation but failing when composed

**Phase mapping:** Address in Phase 1 (Foundation) - establish layer architecture before building components

**Evidence from codebase:**
```tsx
// header.tsx line 337-338 - creates stacking context
backdropFilter: `blur(${isAtTop ? 8 : 16}px)`,
WebkitBackdropFilter: `blur(${isAtTop ? 8 : 16}px)`,
```

---

### Pitfall 2: Z-Index Token Collision and Hardcoding

**What goes wrong:** Multiple components use the same or conflicting z-index values, causing unpredictable layer ordering across different page compositions.

**Why it happens:**
- Developers hardcode `z-50` or `z-[60]` without checking existing usage
- No single source of truth for layer hierarchy
- Copy-paste from examples without understanding layer intent

**Consequences:**
- Cart drawer appears behind mobile nav
- Tooltips hidden by sticky headers
- Modal backdrops fail to dim certain sections

**Prevention:**
1. **Establish tokenized z-index system:**
   ```css
   --z-dropdown: 10;
   --z-sticky: 20;
   --z-fixed: 30;
   --z-modal-backdrop: 40;
   --z-modal: 50;
   --z-popover: 60;
   --z-tooltip: 70;
   --z-max: 100;
   ```
2. **ESLint rule to catch hardcoded z-index:**
   ```js
   "no-restricted-syntax": ["error", {
     selector: "Literal[value=/z-\\[\\d+\\]/]",
     message: "Use z-[var(--z-*)] tokens"
   }]
   ```
3. **Component layer assignment table** mapping each overlay type to its token

**Detection:**
- `grep -r "z-\[" src/` returns numeric values instead of CSS vars
- Multiple components using `z-50` for different semantic purposes

**Phase mapping:** Address in Phase 1 (Foundation) - token system must exist before any component work

**Evidence from codebase (50+ instances found):**
```tsx
// Various files using tokenized approach (correct):
"z-[var(--z-modal)]"
"z-[var(--z-sticky)]"

// grain.ts line 264 - hardcoded (incorrect):
zIndex: 9999,
```

---

### Pitfall 3: Overlay State Persisting Across Route Changes

**What goes wrong:** Mobile menu, modal, or drawer state remains open when user navigates to a new route via Link or router.push(), causing the overlay backdrop to intercept clicks on the new page.

**Why it happens:**
- State managed in useState() without listening to pathname changes
- AnimatePresence exit animation running while new page renders
- No cleanup in useEffect tied to route changes

**Consequences:**
- Header/nav completely unclickable after navigation
- Invisible backdrop blocking entire page
- User thinks app is frozen

**Prevention:**
```tsx
// In any component managing overlay state
const pathname = usePathname();

useEffect(() => {
  // Close all overlays on route change
  setIsOpen(false);
  setIsMobileMenuOpen(false);
}, [pathname]);
```

**Detection:**
- "Works on first page load but breaks after navigation"
- `isMobileMenuOpen` state true when inspecting on non-home pages
- Backdrop element present in DOM after navigation

**Phase mapping:** Address in Phase 2 (Navigation/Overlays) - must be part of overlay infrastructure

**Evidence from codebase (fix applied 2026-01-21):**
```tsx
// HeaderClient.tsx - this pattern was missing
useEffect(() => {
  setIsMobileMenuOpen(false);
}, [pathname]);
```

---

### Pitfall 4: Radix Dropdown Event Swallowing

**What goes wrong:** Actions inside Radix dropdown menus (like signout) fail silently because:
1. Form submissions inside DropdownMenuItem are swallowed
2. `event.preventDefault()` in onSelect blocks Next.js redirect()
3. Server actions throwing NEXT_REDIRECT get caught in try/catch

**Why it happens:**
- Radix closes dropdown immediately on item click, interrupting async actions
- Next.js redirect() works by throwing a special error
- Developer try/catch blocks capture the redirect error

**Consequences:**
- Signout button shows loading spinner forever
- Delete actions appear to succeed but nothing happens
- Navigation actions fail silently

**Prevention:**
1. **Never use `<form action={...}>` inside dropdown items**
2. **Create DropdownAction component** that handles async with loading state:
   ```tsx
   onSelect={() => {
     // NO event.preventDefault() for navigation actions
     handleAsyncAction();
   }}
   ```
3. **Re-throw redirect errors:**
   ```tsx
   } catch (error) {
     if (String(error).includes("NEXT_REDIRECT")) {
       throw error; // Let Next.js handle redirect
     }
     // Handle actual errors
   }
   ```

**Detection:**
- Button shows loading state but action never completes
- No network request visible in DevTools
- Works when called outside dropdown context

**Phase mapping:** Address in Phase 2 (Navigation/Overlays) - dropdown infrastructure

**Evidence from codebase:**
```tsx
// DropdownAction.tsx - had event.preventDefault() blocking redirect
// user-menu.tsx - uses DropdownAction for signout
```

---

### Pitfall 5: AnimatePresence Mounting/Unmounting Race Conditions

**What goes wrong:** Exit animations don't play, or components appear to "flash" because AnimatePresence is unmounted before exit animation completes.

**Why it happens:**
- AnimatePresence placed inside conditional rendering instead of wrapping it
- Parent component unmounts during child exit animation
- Key changes cause immediate remount instead of animate transition

**Consequences:**
- Jarring UI with no exit transitions
- Memory leaks from interrupted animations
- Components briefly visible then disappear

**Prevention:**
```tsx
// WRONG - AnimatePresence unmounts with content
{isOpen && (
  <AnimatePresence>
    <Modal />
  </AnimatePresence>
)}

// CORRECT - AnimatePresence always mounted
<AnimatePresence>
  {isOpen && <Modal key="modal" />}
</AnimatePresence>
```

**Detection:**
- Exit animations never play
- React DevTools shows AnimatePresence mounting/unmounting with content
- Memory profiler shows retained motion values

**Phase mapping:** Address in Phase 3 (Animation System) - establish patterns before component animations

---

## Moderate Pitfalls

Mistakes that cause delays, visual bugs, or technical debt.

---

### Pitfall 6: Portal Container Z-Index Inheritance

**What goes wrong:** Radix portals render to document.body by default, but inherit stacking context from where the trigger is placed, not from the portal target.

**Why it happens:**
- Developer assumes portal escapes all stacking contexts
- Some Radix components (Dialog, Dropdown) handle this; custom portals may not
- Mixed use of Radix portals and custom createPortal()

**Consequences:**
- Dropdown content appears behind header
- Dialog backdrop doesn't cover sticky elements
- Inconsistent z-index behavior across components

**Prevention:**
1. **Use Radix primitives consistently** - they handle portal z-index
2. **Custom portals need explicit z-index** on portal content, not container
3. **Create single OverlayRoot** component for non-Radix overlays

**Detection:**
- Overlay appears behind some elements but not others
- Works in isolation, fails in page context
- Inspect shows portal in body but visually behind fixed elements

**Phase mapping:** Address in Phase 2 (Navigation/Overlays)

---

### Pitfall 7: Body Scroll Lock Conflicts

**What goes wrong:** Multiple overlays try to lock body scroll, and cleanup restores scroll when one closes even if another is still open.

**Why it happens:**
```tsx
// Each overlay does this independently
useEffect(() => {
  if (isOpen) document.body.style.overflow = "hidden";
  return () => { document.body.style.overflow = ""; };
}, [isOpen]);
```

**Consequences:**
- Body becomes scrollable while modal still open
- Scroll position jumps when overlay closes
- iOS Safari exhibits scroll-through on overlays

**Prevention:**
1. **Use scroll-lock library** like `body-scroll-lock` or `react-remove-scroll`
2. **Centralized scroll lock manager** that counts active locks:
   ```tsx
   const scrollLockCount = useRef(0);
   const lockScroll = () => { scrollLockCount.current++; lock(); };
   const unlockScroll = () => {
     scrollLockCount.current--;
     if (scrollLockCount.current === 0) unlock();
   };
   ```
3. **Radix Dialog handles this** - prefer Radix for modals

**Detection:**
- Open modal A, open modal B, close B - page scrollable with A still open
- iOS: can scroll page through modal backdrop

**Phase mapping:** Address in Phase 2 (Navigation/Overlays)

---

### Pitfall 8: Framer Motion Performance on Low-End Devices

**What goes wrong:** Animations cause jank, dropped frames, or battery drain on mobile devices.

**Why it happens:**
- Animating layout properties (width, height, top, left) instead of transforms
- Too many simultaneous animated components
- Complex spring physics with high stiffness/low damping
- useTransform creating unnecessary subscriptions

**Consequences:**
- 15-30fps on mid-tier Android devices
- Battery complaints from users
- iOS Safari janky scrolling

**Prevention:**
1. **Only animate transform and opacity** - GPU-accelerated
2. **Use `layout` prop sparingly** - triggers layout recalculation
3. **Reduce spring stiffness** for mobile: stiffness: 300 -> 200
4. **LazyMotion for code splitting:**
   ```tsx
   import { LazyMotion, domAnimation } from "framer-motion";
   <LazyMotion features={domAnimation}>
   ```
5. **useReducedMotion** hook for accessibility and performance

**Detection:**
- Chrome DevTools Performance tab shows long "Recalculate Style" blocks
- FPS drops below 30 during animations
- `layout` prop usage on frequently rerendering components

**Phase mapping:** Address in Phase 3 (Animation System) - establish performance patterns

---

### Pitfall 9: Inconsistent Animation Timing

**What goes wrong:** Enter and exit animations have mismatched durations, springs have inconsistent feel, different components animate at different speeds for same interaction type.

**Why it happens:**
- Inline animation configs instead of shared tokens
- Different developers using different duration values
- No design system for motion

**Consequences:**
- UI feels "janky" and unpolished
- Exit animations feel too slow or too fast
- Brand motion identity inconsistent

**Prevention:**
1. **Motion token system:**
   ```tsx
   export const spring = {
     snappy: { stiffness: 600, damping: 35 },
     rubbery: { stiffness: 400, damping: 20 },
     floaty: { stiffness: 50, damping: 10 },
   };
   export const duration = {
     instant: 0.1,
     fast: 0.15,
     normal: 0.25,
     slow: 0.4,
   };
   ```
2. **Shared variants for common patterns:**
   ```tsx
   export const fadeSlideUp = {
     initial: { opacity: 0, y: 20 },
     animate: { opacity: 1, y: 0 },
     exit: { opacity: 0, y: -10 },
   };
   ```
3. **ESLint rule for inline duration/stiffness values**

**Detection:**
- Animation durations vary: 0.15, 0.2, 0.25, 0.3 across codebase
- Spring configs defined inline instead of using tokens
- No `motion-tokens.ts` import in animation-heavy components

**Phase mapping:** Address in Phase 1 (Foundation) - motion tokens

**Evidence from codebase (good pattern exists):**
```tsx
// lib/motion-tokens.ts - already has spring tokens
export const spring = {
  ultraBouncy: { type: "spring", stiffness: 300, damping: 15 },
  snappy: { type: "spring", stiffness: 600, damping: 35 },
  // ...
};
```

---

### Pitfall 10: Glass/Blur Effects Breaking Text Contrast

**What goes wrong:** Text becomes unreadable on glassmorphism backgrounds because blur + transparency reduces contrast below WCAG thresholds.

**Why it happens:**
- Glass effect looks good on solid background in design
- Real page has varied content behind glass element
- Dynamic content (images, gradients) creates unpredictable contrast

**Consequences:**
- WCAG 2.1 AA violations
- User complaints about readability
- Accessibility audit failures

**Prevention:**
1. **Always include explicit text color** with glass effects:
   ```css
   .glass {
     background: rgba(255, 255, 255, 0.8);
     backdrop-filter: blur(12px);
     color: var(--color-text-primary); /* Explicit, don't inherit */
   }
   ```
2. **Use semi-opaque backgrounds** (0.85+) for text containers
3. **Add subtle border** to improve perceived separation
4. **Test on varied page content** - images, gradients, videos

**Detection:**
- axe-core contrast violations
- Text hard to read on certain page sections
- Works on homepage hero but fails on menu page with food images

**Phase mapping:** Address in Phase 1 (Foundation) - design tokens for glass effects

**Evidence from codebase:**
```tsx
// PlacesAutocomplete had glass class causing readability issues
// Fix: replaced with solid bg-[var(--color-surface-primary)]
```

---

## Minor Pitfalls

Annoyances that are fixable but waste time.

---

### Pitfall 11: PriceTicker inCents Prop Omission

**What goes wrong:** Prices display as $1299.00 instead of $12.99 because values are in cents but component defaults to dollars.

**Why it happens:** PriceTicker defaults `inCents={false}` and developers forget to pass it when using cent-denominated values.

**Prevention:**
```tsx
// Always be explicit
<PriceTicker value={item.basePriceCents} inCents={true} />
```

**Detection:** Prices off by factor of 100

**Phase mapping:** N/A - code review catch

---

### Pitfall 12: Missing Key Prop on AnimatePresence Children

**What goes wrong:** Exit animations don't work because React can't track which child to animate out.

**Prevention:** Always provide unique key to AnimatePresence direct children:
```tsx
<AnimatePresence>
  {items.map((item) => (
    <motion.div key={item.id} exit={{ opacity: 0 }}>
```

**Phase mapping:** N/A - code review catch

---

### Pitfall 13: useMediaQuery SSR Mismatch

**What goes wrong:** Hydration errors because useMediaQuery returns false on server but different value on client.

**Prevention:**
```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
const isMobile = useMediaQuery("(max-width: 640px)");
// Use mounted && isMobile for conditional rendering
```

**Phase mapping:** Address in Phase 1 (Foundation) - hook utilities

---

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation |
|-------|---------------|------------|
| Phase 1: Foundation | Z-index tokens not comprehensive | Audit all existing z-index usage before defining tokens |
| Phase 2: Navigation/Overlays | Route change state persistence | Add pathname effect to ALL overlay components |
| Phase 2: Navigation/Overlays | Portal z-index conflicts | Use Radix primitives consistently; avoid mixing portal strategies |
| Phase 3: Animation System | Performance on mobile | Profile on real Android device before shipping |
| Phase 3: Animation System | AnimatePresence placement | Create standard overlay wrapper with correct AnimatePresence placement |
| Phase 4: Component Library | Glass effect contrast | Include automated contrast testing in component tests |
| Phase 5: Integration | Multiple scroll locks | Use centralized scroll lock manager |

---

## Prevention Checklist for UI Rewrite

Before any component work:
- [ ] Z-index token system defined with semantic names
- [ ] Layer map document created
- [ ] ESLint rule for hardcoded z-index enabled
- [ ] Motion token system established
- [ ] Overlay base component with pathname effect
- [ ] Scroll lock strategy decided

Before shipping any overlay component:
- [ ] Tested after route navigation (not just initial render)
- [ ] Tested with other overlays open simultaneously
- [ ] Z-index uses tokens, not hardcoded values
- [ ] Exit animation verified working
- [ ] Body scroll locked properly

Before shipping any animated component:
- [ ] Uses motion tokens, not inline values
- [ ] Tested on low-end device (or throttled CPU)
- [ ] AnimatePresence correctly placed (always mounted)
- [ ] No layout animations on frequently updating elements

---

## Sources

**Codebase Analysis:**
- Existing LEARNINGS.md entries (2026-01-18 through 2026-01-21)
- Current z-index usage: 50+ tokenized references found
- Known issues documented in PRD_V8.md

**External Research:**
- [Stacking Context Pitfalls](https://css3shapes.com/what-is-a-stacking-context-understanding-z-index/)
- [Backdrop-Filter Positioning Issues](https://medium.com/@aqib-2/why-backdrop-filter-fails-with-positioned-child-elements-0b82b504f440)
- [Transform Z-Index Trap in React](https://dev.to/minoosh/today-i-learned-layouts-and-the-z-index-trap-in-react-366f)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- [Radix Dialog Documentation](https://www.radix-ui.com/primitives/docs/components/dialog)
- [AnimatePresence Memory Leak Issues](https://github.com/framer/motion/issues/625)
- [Framer Motion Performance Tips](https://tillitsdone.com/blogs/framer-motion-performance-tips/)
- [Managing Z-Index for Component Libraries](https://medium.com/@honmavmahesh/managing-stacking-context-and-z-index-for-component-library-1baabaeda7c6)
