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

---

## 2026-01-18: V4 Planning Workflow (PRD → clarify → UX-Specs → build-tasks)

**Context:** Creating V4 iteration to address V3 bugs and quality gaps
**Learning:** Full version iteration workflow: 1) Create PRD.md with findings, 2) Run `/prd-clarify` (35 questions for thorough), 3) Run `/prd-ux` (6-pass methodology), 4) Generate build-tasks sprints. Output structure: `docs/V4/PRD.md`, `PRD-clarification-session.md`, `UX-Specs/UX-Specs.md`, `UX-Specs/UX-Prompts.md`, `UX-Specs/build-tasks/Sprint-N-*.md`.
**Apply when:** Starting new major version iteration or refinement pass

---

## 2026-01-18: Multi-agent exploration for bug investigation

**Context:** Investigating V3 bugs (white text, scroll jump, checkout, signout)
**Learning:** Use 3 parallel Explore agents with specific focus areas: 1) UI/layout issues, 2) Functional bugs, 3) Design quality gaps. Each returns targeted findings. Combine results to build comprehensive bug list. More efficient than sequential file reading.
**Apply when:** Investigating multiple related issues across codebase

---

## 2026-01-18: V3→V4 Bug Root Causes

**Context:** Debugging V3 implementation issues
**Learning:** Common V3 bug patterns:
- **White text on light bg:** `text-white` class hardcoded without luminance check → use dynamic contrast detection
- **Scroll jump:** Hardcoded `headerOffset` mismatch with actual header → use Intersection Observer
- **Type mismatch:** Different step counts in layout vs store → single source of truth in types file
- **Form in dropdown:** Radix dropdown swallows form submit → create DropdownAction component with onClick
- **Z-index chaos:** Hardcoded values (z-30) → expanded token system with CSS Layers
**Apply when:** Debugging similar UI/UX issues

---

## 2026-01-18: Clarification session depth selection

**Context:** Running /prd-clarify for V4 requirements
**Learning:** Depth options: Quick (5), Medium (10), Long (20), Ultralong (35 questions). Ultralong captures edge cases, A/B testing decisions, animation preferences, performance targets. Creates comprehensive decision record in `PRD-clarification-session.md`. Worth the time for major iterations.
**Apply when:** Deciding clarification depth for new PRD

---

## 2026-01-18: 6-Pass UX Methodology

**Context:** Generating V4 UX-Specs via /prd-ux skill
**Learning:** 6 passes before any visual specs: 1) Mental Model (user beliefs), 2) Information Architecture (concept grouping), 3) Affordances (what looks clickable), 4) Cognitive Load (friction points), 5) State Design (empty/loading/success/error), 6) Flow Integrity (where users fail). Produces comprehensive UX-Specs.md that informs visual decisions.
**Apply when:** Creating UX specifications from PRD

---

## 2026-01-18: Sprint organization by risk

**Context:** Planning V4 sprints
**Learning:** Batch tasks by risk level for release strategy:
- **Low risk:** Token audit, lint rules, docs → ship immediately
- **Medium risk:** Component rewrites, animation changes → after unit tests
- **High risk:** Checkout fix, header collapse, A/B infra → after E2E tests
Priority order: Bugs > Consistency > Polish > Performance
**Apply when:** Planning sprint order and release batching

---

## 2026-01-18: V4 Build Tasks Documentation Structure

**Context:** Creating V4 build-tasks for implementation
**Learning:** Each sprint file contains: Progress table, task sections with Goal/Status/Prompt/Verification. Prompts are complete (paste into /frontend-design). CLAUDE.md provides workflow guide, design system reference, output locations. Sprint completion checklist before advancing.
**Apply when:** Setting up build-tasks for new version

---

## 2026-01-18: Sprint 1 Hook Patterns

**Context:** Implementing V4 Sprint 1 bug fixes
**Learning:** New utility hooks created:
- `useLuminance.ts` - WCAG luminance detection, parses hex/rgb/hsl, returns "light"|"dark", has gradient support
- `useActiveCategory.ts` - Intersection Observer for scroll spy, replaces hardcoded headerOffset
- `useScrollDirection.ts` - Tracks scroll up/down for collapsible headers, returns `{ isCollapsed, scrollY, isAtTop }`
All hooks in `src/lib/hooks/`. Use CSS vars for dynamic z-index: `z-[var(--z-sticky)]`.
**Apply when:** Building scroll-aware, contrast-aware, or responsive UI components

---

## 2026-01-18: Type Export Refactoring

**Context:** Reconciling CheckoutLayout steps (4 vs 3)
**Learning:** When moving type to canonical location (e.g., `types/checkout.ts`), update all barrel exports. Change `export { Component, type Type } from "./Component"` to `export type { Type } from "@/types/..."`. Components import type from types file, barrel re-exports for consumers.
**Apply when:** Refactoring types to single source of truth

---

## 2026-01-18: DropdownMenuItem Limitations

**Context:** Creating DropdownAction for async onClick
**Learning:** Custom dropdown-menu.tsx lacks `disabled` prop on DropdownMenuItem. Handle disabled state via: `onClick={isDisabled ? undefined : handleClick}` + `pointer-events-none` class. Loading state: swap icon for Loader2 spinner.
**Apply when:** Adding async actions to custom dropdown components

---

## 2026-01-18: Framer Motion Header Collapse

**Context:** Implementing scroll-direction-aware headers
**Learning:** Use `motion.header` with `animate={{ y: isCollapsed ? -56 : 0 }}` and `transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}` for smooth collapse. Keep header visible during search: `isCollapsed && !showSearch`. Swap `<header>` closing tag to `</motion.header>`.
**Apply when:** Building collapsible sticky headers

---

## 2026-01-18: Next.js Dynamic Route Slug Conflicts

**Context:** Dev server failed with "cannot use different slug names for same dynamic path"
**Learning:** Two sibling directories with different param names (`api/orders/[id]` and `api/orders/[orderId]`) cause Next.js to fail. Consolidate to single param name. When merging, update all references in route handlers (`resolvedParams.orderId` → `resolvedParams.id`).
**Apply when:** Creating new dynamic routes, debugging "different slug names" errors

---

## 2026-01-18: Intersection Observer Test Mocking

**Context:** Tests failed after replacing scroll-based category detection with Intersection Observer
**Learning:** Mock IntersectionObserver class, capture callback in constructor, trigger manually via `act(() => intersectionCallback([{ target, intersectionRatio: 0.5, isIntersecting: true }], observer))`. Old scroll events (`fireEvent.scroll`) won't trigger IO-based detection.
**Apply when:** Testing components that use Intersection Observer for visibility detection

---

## 2026-01-18: Playwright Exact Text Matching

**Context:** E2E test for "All" tab matched both "All" and "All-Day Breakfast"
**Learning:** Use `getByRole("tab", { name: "All", exact: true })` instead of `:has-text("All")`. The `:has-text()` selector is a substring match. For exact matches, use Playwright's `exact: true` option or `text-is()` CSS selector.
**Apply when:** Writing E2E selectors for elements with text that could be substrings of other elements

---

## 2026-01-18: V4 Component Consolidation Pattern

**Context:** Merging duplicate ItemCard (4:3) and MenuItemCard (16:9) into single component
**Learning:** When consolidating similar components: 1) Add `variant` prop to preserve unique features (`default`, `compact`, `featured`), 2) Update all imports in consuming files, 3) Export skeleton from same file for co-location, 4) Delete old component and update barrel exports. Always grep for usages before deletion.
**Apply when:** Merging duplicate card/item components with different aspect ratios or layouts

---

## 2026-01-18: Tests Coupled to CSS Classes Break on Refactors

**Context:** menu-content.test.tsx failed after changing MenuItemCard's sold-out opacity from 60 to 70
**Learning:** Tests using `.closest("[class*='opacity-60']")` break when refactoring styles. Either: 1) Use data-testid for state-based selection (`data-sold-out="true"`), 2) Accept test updates as part of refactor, 3) Use more robust selectors like aria attributes. Class-based assertions are brittle.
**Apply when:** Tests fail after styling changes, evaluating test assertion strategies

---

## 2026-01-18: ESLint Token Enforcement via no-restricted-syntax

**Context:** Adding lint rules to catch hardcoded colors and z-index values
**Learning:** Use ESLint's `no-restricted-syntax` with regex patterns to catch arbitrary value classes:
```js
"no-restricted-syntax": ["warn",
  { selector: "Literal[value=/bg-\\[#[0-9a-fA-F]{3,8}\\]/]", message: "Use var(--color-*)" },
  { selector: "Literal[value=/z-\\[\\d+\\]/]", message: "Use var(--z-*)" }
]
```
Pattern catches className strings containing hardcoded hex or numeric values. Warn level allows incremental adoption.
**Apply when:** Enforcing design token usage across codebase

---

## 2026-01-18: Design Token Migration Checklist

**Context:** Sprint 2 full token audit across components
**Learning:** Token migration search order:
1. Colors: `#[0-9a-f]{3,8}`, `rgb(`, `text-white`, `bg-gray-`, `border-border`
2. Spacing: `p-4`, `m-3`, `gap-2` → `p-[var(--space-3)]`
3. Z-index: `z-10`, `z-50` → `z-[var(--z-sticky)]`
4. Shadows: `shadow-md` → `shadow-[var(--shadow-md)]`
5. Durations: `duration-200` → `duration-[var(--duration-fast)]`

Acceptable exceptions: SVG fills, data visualization colors, confetti/decorative elements.
**Apply when:** Running token audits, migrating to design system

---

## 2026-01-18: E2E Test Resilience Patterns

**Context:** V4 theme parity tests failing on exact pixel values and disabled button states
**Learning:** Avoid brittle E2E assertions:
- **Don't:** `expect(height).toBe(56)` - fails with borders, padding changes
- **Do:** `expect(height).toBeGreaterThanOrEqual(56)` or check CSS class/computed style
- **Don't:** `expect(button).toBeEnabled()` - fails for sold out items
- **Do:** `expect(button).toBeVisible()` then test behavior separately
- **Don't:** `el.classList.contains("h-14")` - class may not exist on all page variants
- **Do:** `style.position === "sticky"` - test behavior not implementation

Different pages may use different header components. Test observable behavior (sticky positioning, backdrop blur) not specific class names.
**Apply when:** Writing E2E tests for UI components, fixing flaky tests

---

## 2026-01-18: Theme System Setup with next-themes + Tailwind

**Context:** App had CSS variables for light/dark but users couldn't toggle themes
**Learning:** CSS variables alone don't enable theming. Full setup requires:
1. `pnpm add next-themes`
2. Create `ThemeProvider` wrapper with `attribute="class"` for Tailwind dark mode
3. Add `suppressHydrationWarning` to `<html>` tag in root layout
4. Create `ThemeToggle` component using `useTheme()` hook
5. Fix hard-coded colors: `bg-white` → `bg-background`, `text-charcoal` → `text-foreground`

ThemeProvider config: `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange` (prevents flash on load).
**Apply when:** Adding theme toggle to app, debugging "dark mode not working", fixing hard-coded white backgrounds

---

## 2026-01-18: CSS Variable Fallbacks for Dynamic Positioning

**Context:** MobileMenu used hard-coded `top-[57px]` which assumes fixed header height
**Learning:** Use CSS variable with fallback: `top-[var(--header-height,57px)]`. This allows dynamic header heights while maintaining default. Define `--header-height` in root or header component. Pattern works for any dimension that may vary.
**Apply when:** Positioning elements relative to dynamic-height components

