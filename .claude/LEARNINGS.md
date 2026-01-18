# Session Learnings

Patterns, conventions, and insights discovered while working on this codebase.

---

## 2026-01-17: Skill/Hook file interpolation

**Context:** Implementing shared prompt between skill and hook using `{{file:...}}` syntax
**Learning:** `{{file:.claude/prompts/foo.md}}` template syntax is NOT expanded in SKILL.md or hook .md files. Must inline content directly.
**Apply when:** Creating skills or hooks that need to share logic - duplicate the content or use a different sharing mechanism

---

## 2026-01-17: UI Assets directory structure

**Context:** Adding design assets from external sources (Google Stitch exports)
**Learning:** UI Assets live in `docs/V3/UI-Assets/P1-Foundation/`, not root `V3/`. Naming convention: `PascalCase-Hyphenated` folders (e.g., `Cart-Overview-1/`, `Design-Tokens-2/`). Each contains `code.html` + `screen.png`.
**Apply when:** Adding new design prototypes or referencing assets in build-tasks

---

## 2026-01-17: useCart hook API

**Context:** Building CustomerLayout with cart bar
**Learning:** `useCart()` returns `estimatedTotal` not `total`. Full API: `itemCount`, `items`, `itemsSubtotal`, `estimatedDeliveryFee`, `estimatedTotal`, `isEmpty`, `formattedSubtotal`, etc.
**Apply when:** Accessing cart totals in components

---

## 2026-01-17: V3 Design Token System

**Context:** Implementing Sprint-1 foundation tokens
**Learning:** CSS custom properties go in `src/styles/tokens.css`. Use `var(--color-*)` for colors, `var(--space-*)` for spacing. Dark mode uses warm undertones (`#1A1918` background, `#3D3B38` borders) - never cold grays. Import tokens before animations in globals.css.
**Apply when:** Creating new components or updating theme

---

## 2026-01-17: Layout component directory

**Context:** Creating app shell layouts
**Learning:** New layouts go in `src/components/layouts/` (plural), not `src/components/layout/` (singular, legacy). Export from barrel file `index.ts`. Existing `layout/` has header.tsx, nav-links.tsx, mobile-menu.tsx.
**Apply when:** Adding new layout wrappers or app shells

---

## 2026-01-17: V3 Button variant naming

**Context:** Enhancing Button with V3 design system
**Learning:** V3 uses `danger` not `destructive` for destructive button variant. Also added `primary` (saffron CTA) as distinct from `default`. Rename usages when migrating to V3.
**Apply when:** Creating/updating buttons, fixing TS errors about missing variant

---

## 2026-01-17: Test environment mocks (jsdom)

**Context:** CategoryTabs using ResizeObserver broke tests
**Learning:** jsdom lacks `ResizeObserver` and `matchMedia`. Add mocks in `src/test/setup.ts`:
```ts
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
window.matchMedia = (q) => ({ matches: false, media: q, addEventListener: () => {}, ... });
```
**Apply when:** Using ResizeObserver, matchMedia, or responsive hooks in components

---

## 2026-01-17: useMediaQuery hook location

**Context:** ItemDetailModal needed viewport detection for mobile animations
**Learning:** Generic hooks go in `src/lib/hooks/`. Created `useMediaQuery.ts` - returns false during SSR, updates on resize. Use for responsive behavior in components.
**Apply when:** Need different behavior/animations for mobile vs desktop

---

## 2026-01-17: Framer Motion swipe-to-delete pattern

**Context:** Adding swipe-left-to-delete to CartItem
**Learning:** Use `useMotionValue(0)` + `useTransform` for reactive UI. Structure: outer container with `overflow-hidden`, hidden delete button behind, draggable content on top with `drag="x"` and `dragConstraints`. Check `info.offset.x` in `onDragEnd` to trigger deletion.
**Apply when:** Implementing swipe gestures for list items

---

## 2026-01-17: Responsive drawer animations

**Context:** CartDrawer needed slide-up on mobile, slide-right on desktop
**Learning:** Use `isMobile = useMediaQuery("(max-width: 640px)")` then conditionally set `initial/animate/exit` props: `{ y: "100%" }` for mobile, `{ x: "100%" }` for desktop. Add `drag="y"` on mobile with swipe-down-to-close.
**Apply when:** Building responsive modals/drawers with different animations per breakpoint

---

## 2026-01-17: CSS variables in Tailwind arbitrary values

**Context:** Using V3 design tokens in components
**Learning:** Use `className="bg-[var(--color-saffron)]"` for CSS custom properties. For shadows with variables: `shadow-[var(--shadow-glow-gold)]`. This works in Tailwind 3+ and maintains design token consistency.
**Apply when:** Styling components with V3 tokens instead of hardcoded colors

---

## 2026-01-17: Supabase count in nested select

**Context:** StopDetail needed totalStops from parent route
**Learning:** Add `(count)` to nested select to get row count. Query: `route:routes (id, status, route_stops (count))`. Returns `route.route_stops[0].count`. Must update interface to include `route_stops: { count: number }[]`.
**Apply when:** Need count of related records in Supabase query without fetching all rows

---

## 2026-01-17: Fullscreen overlay with shared content

**Context:** DeliveryMap needed inline + fullscreen modes with same map content
**Learning:** Extract shared JSX into render function `mapContent(inFullscreen: boolean)`. Return fragment with inline container + AnimatePresence fullscreen overlay. Pass boolean to adjust styling (e.g., `gestureHandling: inFullscreen ? "greedy" : "cooperative"`).
**Apply when:** Building components that can expand to fullscreen (maps, images, modals)

---

## 2026-01-17: Framer Motion variants need `as const`

**Context:** Creating animation variants with spring/ease properties
**Learning:** TypeScript requires `as const` for string literal types in Framer Motion variants. Use `type: "spring" as const` and `ease: "easeOut" as const` in transition objects. Without this, TS infers `string` which doesn't satisfy `AnimationGeneratorType`.
**Apply when:** Defining inline Framer Motion variants with spring transitions or custom easing

---

## 2026-01-17: Animation utilities organization

**Context:** Creating reusable animation patterns for cart, tabs, swipe gestures
**Learning:** Animation utilities go in `src/lib/animations/` subdirectory. Each domain gets its own file (`cart.ts`, `tabs.ts`). Export variants, transition presets, and utility functions. Common patterns exported from `variants.ts`. Main `animations.ts` re-exports from subdirectory.
**Apply when:** Adding new animation patterns or Framer Motion utilities

---

## 2026-01-17: TypeScript file casing on Windows

**Context:** Renamed `skeleton.tsx` to `Skeleton.tsx` but imports used lowercase
**Learning:** Windows filesystem is case-insensitive but TypeScript respects import casing. If existing imports use lowercase (`@/components/ui/skeleton`), keep file lowercase. Renaming creates "already included" TS1261 errors because both casings resolve to same file.
**Apply when:** Renaming files on Windows, check existing import casing first

---

## 2026-01-17: V3 CSS utility files location

**Context:** Adding responsive and accessibility CSS for Sprint-6
**Learning:** CSS utility files go in `src/styles/`: `responsive.css` (breakpoints, grids, safe areas), `high-contrast.css` (driver mode with 7:1 contrast). Import in `globals.css`. Use `[data-high-contrast="true"]` selector for high-contrast mode.
**Apply when:** Adding breakpoint utilities, accessibility styles, or theme variants

---

## 2026-01-17: Micro-interactions library

**Context:** Creating reusable hover/tap/toggle animations for Sprint-6
**Learning:** Generic Framer Motion variants go in `src/lib/micro-interactions.ts`. Exports: `buttonVariants`, `cardVariants`, `toggleKnobVariants`, `heartVariants`, `quantityFlipVariants`, timing constants, easing presets. Use with `whileHover`, `whileTap`, or `variants` prop.
**Apply when:** Adding subtle interaction feedback to buttons, cards, toggles, favorites

