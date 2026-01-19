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

---

## 2026-01-18: Server Component Scroll Handlers Need Client Wrapper

**Context:** Hero buttons not working - page.tsx is server component, can't have scroll handlers
**Learning:** When server components need interactive scroll-to-section behavior:
1. Create client wrapper (`HomePageClient.tsx`) with `"use client"`
2. Define refs: `const menuRef = useRef<HTMLDivElement>(null)`
3. Create handlers: `const scrollToMenu = () => menuRef.current?.scrollIntoView({ behavior: "smooth" })`
4. Pass handlers as props to child components
5. Wrap target sections with `<div ref={menuRef}>`
**Apply when:** Homepage with scroll-to-section CTAs, any server component needing scroll handlers

---

## 2026-01-18: Mobile Nav Z-Index Hierarchy

**Context:** Mobile menu panel stacking behind header, only some links visible
**Learning:** Mobile navigation requires specific z-index hierarchy:
- Header: `z-50`
- Mobile menu overlay: `z-[55]` (below panel, above header)
- Mobile menu panel: `z-[60]` (above everything)

Use `z-[N]` syntax for precise stacking when standard Tailwind z-index values conflict.
**Apply when:** Debugging mobile menu visibility issues, building slide-down mobile nav panels

---

## 2026-01-18: Global Sticky UI in providers.tsx

**Context:** CartBar missing on public pages - was only in CustomerLayout
**Learning:** Global sticky UI elements (cart bars, notifications) go in `providers.tsx` with route-based conditional rendering:
```tsx
const HIDE_ROUTES = ["/checkout", "/admin", "/driver"];
const showCartBar = !HIDE_ROUTES.some(r => pathname.startsWith(r));
return (
  <QueryProvider>
    {children}
    {showCartBar && <CartBar />}
  </QueryProvider>
);
```
**Apply when:** Adding sticky bottom bars, floating action buttons, or global UI that should appear on most pages

---

## 2026-01-18: White Text on Animated Gradients

**Context:** Light theme had poor contrast on animated gradient sections (FooterCTA, Hero)
**Learning:** Animated gradients cycle through light and dark colors. White text fails during light phases. Fix with semi-transparent dark overlay:
- Hero buttons: `bg-black/20 backdrop-blur-sm`
- CTA sections: Add `<div className="absolute inset-0 bg-black/15" />` overlay
Overlay should be subtle (15-20%) to maintain gradient visibility while ensuring WCAG contrast.
**Apply when:** White text on `bg-gradient-animated` or any multi-color gradient

---

## 2026-01-18: Add-to-Cart Success Animation Pattern

**Context:** Adding visual feedback when items added to cart in modal
**Learning:** Pattern for success state before closing modal:
```tsx
const [isAdding, setIsAdding] = useState(false);

const handleAdd = () => {
  setIsAdding(true);
  onAddToCart(...);
  setTimeout(() => {
    setIsAdding(false);
    onClose();
  }, 400); // Brief success display
};

<Button className={isAdding && "bg-jade"}>
  <AnimatePresence mode="wait">
    {isAdding ? <Check /> : "Add to Cart"}
  </AnimatePresence>
</Button>
```
**Apply when:** Adding positive feedback to form submissions, cart actions, saves

---

## 2026-01-18: web-vitals v5 API Changes (FID → INP)

**Context:** Setting up Core Web Vitals monitoring for Sprint 4
**Learning:** web-vitals v5 removed `onFID` - replaced by `onINP` (Interaction to Next Paint). Google deprecated FID in 2024, INP is now the responsiveness metric. Also update thresholds: INP good < 200ms (vs FID < 100ms). Import `onINP` not `onFID`.
**Apply when:** Setting up web vitals monitoring, updating from older web-vitals versions

---

## 2026-01-18: JSX.Element Namespace in React 19

**Context:** Dynamic imports utility file using JSX.Element for return types
**Learning:** React 19 with TypeScript may not expose `JSX` namespace globally. Use `ReactElement` from `react` instead of `JSX.Element` for component return types. Import: `import type { ReactElement } from "react"`.
**Apply when:** Type errors about "Cannot find namespace 'JSX'", defining component factory utilities

---

## 2026-01-18: PRD Clarification Scope Expansion Patterns

**Context:** Running ultralong (35q) /prd-clarify for V5
**Learning:** Thorough clarification often reveals scope expansion. Pattern: Original PRD has 6 sprints, clarification adds features (i18n, notifications, payments), solution is add Sprint 7 for new features. Better to expand sprints than cram expanded scope. Track decisions in clarification session summary table for easy reference.
**Apply when:** PRD clarification reveals significant new requirements

---

## 2026-01-18: V5 Layout Primitive Components Pattern

**Context:** Creating Container, Stack, Cluster, Grid, SafeArea for V5 foundation
**Learning:** Layout primitives use consistent pattern:
- Props: `gap?: SpacingToken`, `as?: ElementType`, `className?: string`
- Type definitions in `src/types/layout.ts` (SpacingToken, FlexAlign, ResponsiveCols)
- Gap maps: `Record<SpacingToken, string>` mapping tokens to Tailwind classes
- Use `forwardRef` with `HTMLElement` for polymorphic `as` prop
- Export from `src/components/layouts/index.ts` barrel

SafeArea specifics: `edges: ('top'|'bottom'|'left'|'right')[]`, uses `env(safe-area-inset-*)` with `max()` for minimum spacing. Requires `viewportFit: "cover"` in Next.js viewport export.
**Apply when:** Creating layout components, extending layout system

---

## 2026-01-18: V5 Token System Organization

**Context:** Building V5 design tokens in Sprint 1
**Learning:** Token categories and locations:
- `src/styles/tokens.css`: Colors (surface, text, interactive, status, border), typography scale, spacing (4px grid), elevation (6 levels), motion (durations, easings), z-index layers
- `src/lib/motion-tokens.ts`: Framer Motion presets (variants, spring configs, overlay transitions)
- `tailwind.config.ts`: References CSS vars via `var(--token-name)`

Dark mode: Use `[data-theme="dark"]` selector with warmer shadow colors (less opacity, black base). V4 aliases preserved for gradual migration.
**Apply when:** Adding new design tokens, extending token system

---

## 2026-01-18: Conform.js API Requires ariaAttributes

**Context:** Implementing FormField component with @conform-to/react
**Learning:** Conform's `getInputProps`, `getTextareaProps`, `getSelectProps` require `ariaAttributes` option to be explicitly set. TypeScript will error with "Property 'ariaAttributes' is missing in type" if omitted.
```ts
// Correct usage:
getInputProps(field, { type: "text", ariaAttributes: true });
getTextareaProps(field, { ariaAttributes: true });
getSelectProps(field, { ariaAttributes: true });
```
Also, input type must be cast to Conform's union type (excludes "button", "submit", "reset").
**Apply when:** Creating Conform form fields, debugging TS2345 errors with getInputProps

---

## 2026-01-18: V5 Token Migration Mapping

**Context:** Refreshing Button/Badge/Input to V5 tokens
**Learning:** V4 → V5 token mappings:
| V4 Token | V5 Token |
|----------|----------|
| `--color-cta` | `--color-interactive-primary` |
| `--color-charcoal` | `--color-text-primary` |
| `--color-charcoal-muted` | `--color-text-secondary` |
| `--color-surface` | `--color-surface-primary` |
| `--color-cream-darker` | `--color-surface-tertiary` |
| `--color-border` | `--color-border-default` |
| `--color-error` | `--color-status-error` |
| `--color-jade` | `--color-status-success` |
| `--color-warning` | `--color-status-warning` |
| `--shadow-md` | `--elevation-2` |

Status bg colors use opacity: `--color-status-error-bg` = `rgba(196, 92, 74, 0.1)`.
**Apply when:** Migrating components from V4 to V5 design tokens

---

## 2026-01-18: V5 Token Audit Search Patterns

**Context:** Sprint 3 component token audit across customer-facing components
**Learning:** Common V4 remnants requiring search:
```bash
# Find text-muted variants (multiple naming conventions)
grep -r "var(--color-text-muted)" src/components/
grep -r "text-muted" src/components/

# Find hardcoded Tailwind colors
grep -r "emerald-\|amber-\|destructive\|muted-foreground" src/components/
```

Token mapping for muted variants:
| Found | Replace With |
|-------|--------------|
| `var(--color-text-muted)` | `var(--color-text-secondary)` |
| `var(--color-error)` | `var(--color-status-error)` |
| `var(--color-error-light)` | `var(--color-status-error-bg)` |
| `emerald-600` | `var(--color-status-success)` |
| `amber-500` | `var(--color-status-warning)` |
| `muted-foreground` | `var(--color-text-secondary)` |

**Apply when:** Running V5 token audits, migrating checkout/cart components

---

## 2026-01-18: Accordion Accessibility with useId

**Context:** Creating MenuAccordion for V5 Sprint 3
**Learning:** Accessible accordion pattern requires unique IDs for aria-controls/aria-labelledby:
```tsx
function AccordionItem({ item }) {
  const contentId = useId();  // React 18+ hook
  const headerId = useId();

  return (
    <>
      <button
        id={headerId}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >...</button>
      <div
        id={contentId}
        role="region"
        aria-labelledby={headerId}
      >...</div>
    </>
  );
}
```
Use `useReducedMotion` from Framer Motion to disable animations when user prefers reduced motion.
**Apply when:** Building accordions, disclosure widgets, or any expand/collapse UI

---

## 2026-01-18: Expandable Table Row Pattern

**Context:** Adding quick preview to admin tables (Orders, Routes, Drivers)
**Learning:** Reusable expandable row structure:
1. **Wrapper component:** Takes `children` (row cells) + `previewContent` (expanded panel)
2. **Click handling:** Use `target.closest()` to exclude interactive elements (buttons, dropdowns, links)
3. **State management:** Create `useExpandedRows` hook - single expanded row at a time via `Set.clear()` + `Set.add()`
4. **Animation:** Framer Motion `AnimatePresence` with `height: "auto"` + staggered opacity
5. **Column span:** Preview row uses `colSpan={columnCount + 1}` (extra for expand indicator)

Key pattern for interactive elements:
```tsx
const isInteractive = target.closest("button") || target.closest("a") ||
  target.closest('[role="menuitem"]') || target.closest('[data-radix-collection-item]');
if (isInteractive) return; // Don't expand
```
**Apply when:** Building data tables with expandable detail views, order/route/driver lists

---

## 2026-01-18: Operations KPI Card Urgency System

**Context:** Creating command-center styled dashboard for admin operations
**Learning:** 4-level urgency system for operational metrics:
| Level | Condition | Visual Treatment |
|-------|-----------|------------------|
| `ok` | Value = 0 | Green status light, no badge |
| `moderate` | 1-3 items | Yellow light, "ATTENTION" badge |
| `urgent` | 4+ items | Red light + pulse, "URGENT" badge |
| `critical` | 10+ items | Red pulse + corner flag, "CRITICAL" badge |

Configurable thresholds: `{ moderate: 1, urgent: 4, critical: 10 }`. Different metrics use different thresholds (prep time: 20/30/45 min).

Quick action buttons change style based on urgency - urgent/critical uses filled red button, ok/moderate uses outline style.
**Apply when:** Building operational dashboards, monitoring UIs, status displays

---

## 2026-01-18: Skill Development Best Practices

**Context:** Refactoring all skills to universal, project-agnostic format using skill-creator guidelines
**Learning:** Effective skill structure follows progressive disclosure pattern:
- **SKILL.md:** Lean body (1,500-2,000 words), core workflows only
- **references/:** Detailed patterns, advanced techniques (2,000-5,000+ words each)
- **examples/:** Working code examples users can copy directly
- **scripts/:** Utility scripts for common operations

Critical conventions:
- Frontmatter description uses **third-person** with specific trigger phrases: `"This skill should be used when the user asks to 'create X', 'configure Y'..."`
- Body uses **imperative/infinitive form** (verb-first): "To create a component..." not "You should create..."
- No project-specific paths, tokens, or conventions in reusable skills
**Apply when:** Creating or refactoring skills for Claude Code plugins

---

## 2026-01-18: useLuminance Hook for Dynamic Text Contrast

**Context:** V4 bug fix - white text unreadable on light hero backgrounds
**Learning:** WCAG luminance detection pattern for dynamic text color:
```ts
// src/lib/hooks/useLuminance.ts
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Threshold: L > 0.179 means light background → use dark text
const textClass = luminance > 0.179 ? "text-charcoal" : "text-cream";
```
For gradients, either sample dominant color or use solid background overlay (`bg-black/20`) for guaranteed contrast.
**Apply when:** Text overlays on images, animated gradients, hero sections, any dynamic background

---

## 2026-01-18: Radix DropdownMenuItem Event Handling

**Context:** V4 bug fix - signout button in dropdown not working
**Learning:** Radix `<DropdownMenuItem>` has specific event behavior:
- `onClick` - fires but dropdown closes immediately, may interrupt async
- `onSelect` - proper handler, keeps menu state until action completes
- Forms inside dropdown - `<form action={...}>` submit events are swallowed

Pattern for async actions in dropdowns:
```tsx
<DropdownMenuItem
  onSelect={(e) => {
    e.preventDefault(); // Keep menu open during action
    handleAsyncAction().finally(() => {
      // Close manually or let redirect handle it
    });
  }}
>
```
Or create `DropdownAction` wrapper component with loading state.
**Apply when:** Server actions in dropdowns, signout buttons, delete confirmations in menus

---

## 2026-01-18: ESLint Underscore Convention for Unused Variables

**Context:** Fixing "defined but never used" warnings for intentionally unused variables
**Learning:** ESLint's `@typescript-eslint/no-unused-vars` doesn't automatically ignore underscore-prefixed variables. Add explicit config in `eslint.config.mjs`:
```js
{
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
  },
}
```
Variables prefixed with `_` (e.g., `_unused`, `_index`) will be ignored.
**Apply when:** Using underscore convention for intentionally unused variables, configuring new ESLint flat config

---

## 2026-01-18: Catch Block Error Variable Scoping

**Context:** Simplifying catch blocks that don't use the error - TypeScript 4.0+ allows `catch { }` syntax
**Learning:** When changing `catch (error) {` to `catch {`, ensure no code inside references `error`. Common pattern in this codebase:
```ts
// BEFORE - catches error but also has shadowed variable from response
try {
  const error = await response.json();  // This 'error' is different
  throw new Error(error.error);
} catch {
  // ❌ BROKEN - 'error' not defined here
  description: error instanceof Error ? error.message : "Failed"
}

// AFTER - capture error with different name
} catch (err) {
  description: err instanceof Error ? err.message : "Failed"
}
```
If catch block uses error message, must capture it. Use `err` to avoid confusion with inner `error` variables.
**Apply when:** Simplifying catch blocks, fixing "Cannot find name 'error'" TypeScript errors

---

## 2026-01-18: React useEffect Ref Cleanup Pattern

**Context:** Fixing "ref value will likely have changed" ESLint warning in useActiveCategory
**Learning:** When accessing `.current` of a ref in useEffect cleanup, the ref value may change before cleanup runs. Capture ref value at effect start:
```ts
useEffect(() => {
  // ✅ Capture ref values immediately
  const observer = observerRef.current;
  const visMap = visibilityMap.current;

  sectionIds.forEach((id) => {
    const element = document.getElementById(id);
    if (element) observer?.observe(element);
  });

  return () => {
    // ✅ Use captured values in cleanup
    observer?.disconnect();
    visMap.clear();
  };
}, [deps]);
```
This ensures cleanup operates on the same values that were used during effect execution.
**Apply when:** Using refs in useEffect with cleanup, Intersection Observer patterns, manual subscription management

---

## 2026-01-19: Framer Motion ease Arrays Need `as const`

**Context:** TypeScript errors when using cubic-bezier arrays in animation variants
**Learning:** `ease: [0.25, 0.46, 0.45, 0.94]` is inferred as `number[]`, not a tuple. Framer Motion's `Easing` type requires `[number, number, number, number]`. Fix with `as const`:
```ts
transition: {
  duration: 0.15,
  ease: [0.25, 0.46, 0.45, 0.94] as const,  // Typed as tuple
}
```
Same applies to all Framer Motion string literals (`type: "spring" as const`, `ease: "easeOut" as const`).
**Apply when:** TypeScript errors about `Type 'number[]' is not assignable to type 'Easing'`

---

## 2026-01-19: useSwipeToDelete Hook API

**Context:** Using swipe-gestures.ts hooks for cart item swipe-to-delete
**Learning:** The `useSwipeToDelete` hook returns:
```ts
interface SwipeToDeleteResult {
  motionProps: Partial<MotionProps>;  // Spread on motion.div
  isDragging: boolean;
  dragOffset: number;                  // Current position
  progress: number;                    // 0-1 toward threshold
  isRevealed: boolean;                 // Delete button visible
  deleteButtonProps: { opacity, scale, isImminent };
  reset: () => void;
}
```
Options: `revealThreshold`, `autoDeleteThreshold`, `velocityThreshold`, `onDelete`, `onRevealChange`.
**Apply when:** Implementing swipe-to-delete in cart items or list items

---

## 2026-01-19: Framer Motion Handlers Require motion.div

**Context:** Spreading swipe navigation props onto regular div element caused TypeScript errors
**Learning:** Framer Motion drag handlers (`onDrag`, `onDragEnd`, etc.) have signature `(event, info: PanInfo) => void`, but native HTML `onDrag` expects `DragEventHandler<T>`. Cannot spread motion props onto `<div>`:
```tsx
// ❌ TypeScript error - onDrag signature mismatch
<div {...swipeProps}>

// ✅ Works - motion.div accepts Framer Motion handlers
<motion.div {...swipeProps}>
```
**Apply when:** Using `useSwipeNavigation`, `useSwipeToDelete`, or any Framer Motion drag hooks

---

## 2026-01-18: Skill Reference File Organization

**Context:** Restructuring frontend-design skill with references/ subdirectory
**Learning:** Reference file distribution by domain:
| Skill | Reference Files |
|-------|-----------------|
| frontend-design | design-systems.md, motion-mastery.md, responsive-architecture.md, accessibility-excellence.md, test-resilience.md |
| mvp-prd | sprint-planning.md, scope-management.md |
| prd-clarify | question-bank.md, sequencing-strategy.md, scope-expansion.md |
| prd-ux | pass-enhancements.md, state-choreography.md, affordance-patterns.md, failure-modes.md |
| ux-prompts | quality-amplifiers.md, verification-templates.md, anti-patterns.md |
| retro | logging-triggers.md, skill-evolution.md, meta-learning.md |

SKILL.md must reference these files in "Additional Resources" section so Claude knows they exist.
**Apply when:** Designing skill file structure, deciding what content goes where

---

## 2026-01-19: ESLint Flat Config Ignores (No .eslintignore)

**Context:** Adding storybook-static/ to lint ignore caused warning about deprecated .eslintignore
**Learning:** ESLint 9+ flat config (`eslint.config.mjs`) doesn't use `.eslintignore`. Add ignores directly in config:
```js
const config = [
  {
    ignores: [
      ".next/**",
      "storybook-static/**",
      "src/stories/**",  // Storybook demo files
    ],
  },
  // ... rest of config
];
```
The `.eslintignore` file will show deprecation warning and be ignored.
**Apply when:** Adding folders to ESLint ignore list, seeing "ESLintIgnoreWarning: The .eslintignore file is no longer supported"

---

## 2026-01-19: Storybook Sample Data Must Match Actual Types

**Context:** MenuAccordion.stories.tsx typecheck failed - sample data had `categorySlug`, `isAvailable`, `sortOrder` but MenuItem type doesn't have these
**Learning:** When creating Storybook stories with sample data, always verify against the actual type definition. Common mismatches:
| Incorrect | Correct (MenuItem type) |
|-----------|------------------------|
| `categorySlug` | *(not in type - remove)* |
| `isAvailable` | `isActive` |
| `sortOrder` | *(not in type - remove)* |

Before writing sample data, read the type file (`src/types/menu.ts`) to ensure all required fields are present and no extra fields are added.
**Apply when:** Creating stories with sample data, fixing typecheck errors in *.stories.tsx files

---

## 2026-01-19: Playwright Visual Regression Configuration

**Context:** Setting up visual regression tests for Sprint 6
**Learning:** Playwright visual regression requires explicit config in `playwright.config.ts`:
```ts
expect: {
  toHaveScreenshot: {
    maxDiffPixels: 100,
    threshold: 0.2,
  },
  toMatchSnapshot: {
    maxDiffPixelRatio: 0.05,
  },
},
snapshotDir: "./e2e/__snapshots__",
```
Capture baselines with: `pnpm exec playwright test --update-snapshots e2e/visual-regression.spec.ts`
**Apply when:** Setting up visual regression tests, configuring Playwright snapshot comparison

---

## 2026-01-19: axe-core Playwright Accessibility Testing Pattern

**Context:** Creating WCAG 2.1 AA accessibility tests with @axe-core/playwright
**Learning:** Standard accessibility test pattern:
```ts
import AxeBuilder from "@axe-core/playwright";

async function checkA11y(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const critical = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious"
  );

  if (critical.length > 0) throw new Error(...);
}
```
For specific rule testing: `.withRules(["color-contrast"])`. For high-contrast mode: `.withTags(["wcag2aaa"])`.
**Apply when:** Adding accessibility tests, auditing pages for WCAG compliance

