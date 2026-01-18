# V4 UX Prompts — 28 Implementation Tasks

> **Source**: V4 UX-Specs + PRD Clarification Session
> **Organization**: 4 sprints, 28 prompts
> **Quality Bar**: Premium, 95%+ design quality, no bugs, consistent tokens

---

## Sprint 1: Bug Fixes (7 prompts)

### Prompt 1.1: Dynamic Text Contrast for HomepageHero

```
Create a useLuminance hook and apply it to HomepageHero.tsx for dynamic text color.

REQUIREMENTS:
- Create src/lib/hooks/useLuminance.ts
- Calculate relative luminance of background color
- Return "light" | "dark" based on WCAG contrast threshold
- For gradients, sample the dominant color or use weighted average

IMPLEMENTATION:
- Parse CSS color (hex, rgb, hsl) to RGB values
- Calculate luminance: L = 0.2126*R + 0.7152*G + 0.0722*B
- Threshold: if L > 0.179, background is light → use dark text
- Apply to HomepageHero.tsx lines 154, 207
- Replace text-white with dynamic class based on luminance
- Add text-shadow for additional contrast on gradients

OUTPUT:
- src/lib/hooks/useLuminance.ts
- Update src/components/homepage/HomepageHero.tsx

TOKENS TO USE:
- var(--color-charcoal) for dark text
- var(--color-cream) for light text
```

### Prompt 1.2: Saturday Badge Dynamic Contrast

```
Apply the same luminance detection to the Saturday delivery badge in HomepageHero.

REQUIREMENTS:
- Use useLuminance hook from Prompt 1.1
- Saturday badge (lines 199-210) currently uses .glass class with white text
- Detect the effective background (glass overlay on gradient)
- Switch text color dynamically

IMPLEMENTATION:
- Option A: Use dark text with glass effect
- Option B: Replace glass with solid bg-[var(--color-primary)]/90
- Badge should be visible on ALL hero image variants (A/B test ready)

OUTPUT:
- Update src/components/homepage/HomepageHero.tsx lines 199-210
- Ensure badge readable in light mode, dark mode, and all A/B variants
```

### Prompt 1.3: Intersection Observer for Category Scroll

```
Replace hardcoded headerOffset with Intersection Observer in menu-content.tsx.

REQUIREMENTS:
- Remove headerOffset = 140 (line 59-83)
- Create useActiveCategory hook using Intersection Observer
- Observe all category sections
- Update active category when section enters viewport
- Smooth scroll to category when tab clicked

IMPLEMENTATION:
- src/lib/hooks/useActiveCategory.ts
- Options: { rootMargin: "-56px 0px -80% 0px" } (accounts for collapsed header)
- Track which section is most visible
- Update URL hash without page jump
- scrollIntoView with behavior: "smooth"

OUTPUT:
- src/lib/hooks/useActiveCategory.ts
- Update src/components/menu/menu-content.tsx
- Remove scroll-mt-32 hacks, use proper IO detection
```

### Prompt 1.4: Fix CheckoutLayout to 3 Steps

```
Reconcile CheckoutLayout.tsx with checkout-store.ts - use 3 steps everywhere.

REQUIREMENTS:
- CheckoutLayout.tsx has 4 steps: address, time, review, pay
- checkout-store.ts has 3 steps: address, time, payment
- Standardize on 3 steps: address, time, payment
- Integrate CheckoutLayout as the page wrapper

IMPLEMENTATION:
- Update src/components/layouts/CheckoutLayout.tsx:
  - Change steps to ["address", "time", "payment"]
  - Remove "review" and "pay" steps
  - Match labels: "Address", "Time", "Payment"
- Update src/types/checkout.ts to export single source of truth
- Ensure checkout page uses CheckoutLayout wrapper

OUTPUT:
- src/components/layouts/CheckoutLayout.tsx (fixed)
- src/types/checkout.ts (canonical type)
- src/app/(customer)/checkout/page.tsx (use wrapper)
```

### Prompt 1.5: DropdownAction Component

```
Create a full-featured DropdownAction component to fix signout and other dropdown forms.

REQUIREMENTS:
- Replace form-based actions in Radix dropdowns
- Props: onClick, loading, disabled, icon, variant, children
- Loading state: spinner replaces icon
- Support async onClick handlers
- Properly propagate click through Radix dropdown

IMPLEMENTATION:
- src/components/ui/DropdownAction.tsx
- Use Radix DropdownMenuItem internally
- Handle async: set loading true, await onClick, set loading false
- Error handling: catch and log, don't break dropdown
- Variants: default, destructive (for signout/delete actions)

USAGE IN USER-MENU:
- Replace <form action={signOut}> with <DropdownAction onClick={signOut}>
- Show loading spinner while signing out
- Handle success (redirect) and error (toast)

OUTPUT:
- src/components/ui/DropdownAction.tsx
- Update src/components/auth/user-menu.tsx
```

### Prompt 1.6: Expanded Z-Index Tokens + CSS Layers

```
Create comprehensive z-index token system with CSS @layer for cascade control.

REQUIREMENTS:
- Expand current z-index tokens (--z-sticky: 20, --z-modal: 50)
- Add granular levels: base, dropdown, tooltip, overlay, modal, toast
- Use CSS @layer for proper cascade order
- Replace all hardcoded z-index values (z-30, z-40, etc.)

IMPLEMENTATION:
tokens.css additions:
  --z-base: 1;
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-overlay: 30;
  --z-modal: 40;
  --z-tooltip: 50;
  --z-toast: 60;

CSS Layers (globals.css):
  @layer base, tokens, components, utilities;

AUDIT FILES:
- menu-header.tsx (z-30 → --z-sticky)
- category-tabs.tsx (z-20 → --z-sticky)
- All modals, drawers, tooltips

OUTPUT:
- src/styles/tokens.css (expanded)
- src/styles/globals.css (CSS layers)
- All files with hardcoded z-index updated
```

### Prompt 1.7: Collapsible Scroll-Direction-Aware Headers

```
Create useScrollDirection hook and apply to all sticky headers.

REQUIREMENTS:
- Headers expand on scroll up, collapse on scroll down
- Collapsed height: 56px (h-14)
- Expanded height: variable (depends on content)
- Smooth transition: 200ms ease-out
- Apply to: CustomerLayout, MenuHeader, CategoryTabs

IMPLEMENTATION:
- src/lib/hooks/useScrollDirection.ts
  - Track scroll position
  - Detect direction: "up" | "down" | "idle"
  - Debounce/throttle for performance
  - Return { scrollDirection, isCollapsed }

- Header component pattern:
  - Expanded: show full content
  - Collapsed: show minimal (logo + key actions)
  - Transition: height + opacity for extra content

OUTPUT:
- src/lib/hooks/useScrollDirection.ts
- Update src/components/layouts/CustomerLayout.tsx
- Update src/components/menu/menu-header.tsx
- Update src/components/menu/category-tabs.tsx
```

---

## Sprint 2: Consistency (8 prompts)

### Prompt 2.1: Port ItemCard to MenuItemCard

```
Consolidate all ItemCard features into MenuItemCard, deprecate ItemCard.

REQUIREMENTS:
- MenuItemCard uses 16:9 (aspect-video) - this is the standard
- ItemCard uses 4:3 - deprecated
- Port any unique ItemCard features as MenuItemCard variants/props
- Update all usages to MenuItemCard

AUDIT ITEMCARD FEATURES:
- Check for unique hover effects, badges, layouts
- Port as props: variant="compact" | "featured" | "default"

IMPLEMENTATION:
- Enhance src/components/menu/MenuItemCard.tsx
- Add any missing features from ItemCard as props
- Find and replace all ItemCard imports
- Delete src/components/menu/ItemCard.tsx (or mark deprecated)

OUTPUT:
- src/components/menu/MenuItemCard.tsx (enhanced)
- All files using ItemCard updated
- ItemCard.tsx deleted or deprecated
```

### Prompt 2.2: Full CartItem Rewrite

```
Rewrite CartItem component with V4 patterns and design tokens.

REQUIREMENTS:
- Current CartItem uses tailwind colors (border, foreground, etc.)
- Rewrite to use --color-* tokens exclusively
- Follow V4 component patterns:
  - Framer Motion for animations
  - Design token variables only
  - TypeScript strict mode

IMPLEMENTATION:
- New src/components/cart/CartItem.tsx
- Structure:
  - Image (80px square, aspect-square)
  - Item details (name, modifiers, notes)
  - Quantity controls (+/- buttons)
  - Price display
  - Swipe-to-delete (mobile)
- All colors: var(--color-*)
- All spacing: var(--space-*)
- All shadows: var(--shadow-*)

OUTPUT:
- src/components/cart/CartItem.tsx (full rewrite)
- Verify in CartDrawer and CartBar contexts
```

### Prompt 2.3: Badge Variants

```
Enhance Badge component with V4 semantic variants.

REQUIREMENTS:
Current Badge is generic shadcn default.
Add variants:
- featured: Gold background, star icon (for popular items)
- allergen: Amber background, warning style (for dietary info)
- price: Green (discount) or red (premium) (for price modifiers)
- status: Semantic colors (for order/delivery status)

IMPLEMENTATION:
- Update src/components/ui/Badge.tsx
- Add variant prop: "default" | "featured" | "allergen" | "price-discount" | "price-premium" | "status-success" | "status-warning" | "status-error"
- Use design tokens for all colors
- Add optional icon slot

OUTPUT:
- src/components/ui/Badge.tsx (enhanced)
- Update MenuItemCard to use new badge variants
```

### Prompt 2.4: Header Normalization

```
Normalize all sticky headers to consistent styling.

REQUIREMENTS:
- Collapsed height: 56px (h-14)
- Backdrop: backdrop-blur-lg (16px)
- Z-index: var(--z-sticky)
- Background: var(--color-cream)/95 (light) or var(--color-background)/95 (dark)
- Border: border-b border-[var(--color-border)]

APPLY TO:
- CustomerLayout header
- MenuHeader
- CategoryTabs
- Any other sticky elements

OUTPUT:
- All sticky headers use identical token-based styling
- No hardcoded values
```

### Prompt 2.5: Unified Cart UI Style

```
Create new unified style for cart drawer and cart bar.

REQUIREMENTS:
- CartDrawer and CartBar currently use different styles
- Design new shared style using only design tokens
- Apply to both components

SHARED STYLE:
- Background: var(--color-surface)
- Border: var(--color-border)
- Shadow: var(--shadow-lg)
- Spacing: var(--space-4) padding
- Typography: consistent with V4 type scale

IMPLEMENTATION:
- Create shared CartContainer styles or component
- Apply to cart-drawer.tsx and CustomerLayout CartBar
- Ensure visual consistency between drawer (tablet+) and bar (mobile)

OUTPUT:
- src/components/cart/cart-drawer.tsx (updated)
- src/components/layouts/CustomerLayout.tsx (CartBar updated)
```

### Prompt 2.6: Full Token Audit

```
Audit and replace all hardcoded values with design tokens.

REQUIREMENTS:
- No hardcoded hex colors (except in tokens.css)
- No hardcoded pixel values for spacing
- No hardcoded border-radius values
- No hardcoded opacity values

NEW TOKENS TO ADD:
- --opacity-subtle: 0.5
- --opacity-muted: 0.7
- --opacity-visible: 0.9
- --opacity-solid: 1

IMPLEMENTATION:
- Use grep/search to find all hardcoded values
- Replace with appropriate tokens
- Add missing tokens to tokens.css

VERIFY:
- Run Stylelint/ESLint (see 2.7)
- Visual regression check

OUTPUT:
- src/styles/tokens.css (expanded)
- All component files updated
```

### Prompt 2.7: Stylelint + ESLint Token Rules

```
Create linting rules to enforce token usage.

REQUIREMENTS:
- Stylelint: Block hardcoded colors in CSS
- ESLint: Block hardcoded colors in className strings
- Warn on non-token spacing values
- Error on non-token z-index values

IMPLEMENTATION:
Stylelint config:
- stylelint-declaration-strict-value for colors, z-index
- Custom regex rules for hex/rgb values

ESLint config:
- Custom rule or plugin for className analysis
- Detect patterns like "bg-[#hex]", "text-[rgb()]"

OUTPUT:
- .stylelintrc.json (new or updated)
- .eslintrc.json (updated)
- package.json (new dev dependencies)
```

### Prompt 2.8: Dark Mode Parity Testing

```
Create E2E tests to verify all V4 changes work in both light and dark mode.

REQUIREMENTS:
- Test each bug fix in both modes
- Test each consistency change in both modes
- Verify no visual regressions

IMPLEMENTATION:
- Add Playwright tests with colorScheme: "light" and "dark"
- Screenshot comparison for key pages
- Specific assertions for:
  - Hero text readable
  - Category scroll works
  - Checkout loads
  - Signout works
  - Cards render correctly
  - Headers collapse/expand

OUTPUT:
- tests/e2e/v4-dark-mode.spec.ts
- tests/e2e/v4-light-mode.spec.ts
```

---

## Sprint 3: Polish (7 prompts)

### Prompt 3.1: Contextual Shimmer/Pulse Loading

```
Implement contextual loading states: shimmer for initial load, pulse for refetch.

REQUIREMENTS:
- Shimmer: gradient translateX animation, 1.5s infinite
- Pulse: subtle opacity/scale pulse, 0.5s once
- Track loading context: initial vs refetch

IMPLEMENTATION:
- Update src/components/ui/skeleton.tsx
- Add context prop: "initial" | "refetch"
- Default to "initial" for backwards compatibility
- Shimmer keyframes already exist, add pulse variant

APPLY TO:
- Menu item cards
- Cart items
- Any image loading state

OUTPUT:
- src/components/ui/skeleton.tsx (enhanced)
- Usage examples in components
```

### Prompt 3.2: Variable Stagger Animations

```
Implement variable-timing stagger animations for all lists.

REQUIREMENTS:
- Stagger delay: start at 30ms, decelerate to 80ms
- Apply to: menu grids, cart items, order lists, admin cards
- Respect reduced motion preference

IMPLEMENTATION:
- Create variableStagger function in micro-interactions.ts
- Formula: delay = baseDelay + (index * index * acceleration)
- Cap at maxDelay (80ms)

APPLY TO:
- MenuItemCard grids
- CartItem lists
- Order history
- Admin dashboard cards

OUTPUT:
- src/lib/micro-interactions.ts (enhanced)
- All list components updated
```

### Prompt 3.3: Tight Spring Progress Bars

```
Replace linear easing with tight spring on all progress bars.

REQUIREMENTS:
- Spring config: stiffness: 400, damping: 25
- Apply to: free delivery progress, order tracking, route completion, loading bars
- Respect reduced motion

IMPLEMENTATION:
- Create progressSpring variant in micro-interactions.ts
- Update all progress bar components
- Use Framer Motion's useSpring or spring transition

OUTPUT:
- src/lib/micro-interactions.ts (progressSpring)
- All progress bar components updated
```

### Prompt 3.4: Cart Badge Pulse

```
Add pulse animation to cart badge on ANY cart change.

REQUIREMENTS:
- Trigger: item added, removed, quantity changed
- Animation: scale [1, 1.2, 1] over 0.3s
- Spring physics for natural feel
- Respect reduced motion

IMPLEMENTATION:
- Add pulse state to cart store or hook
- Trigger pulse on cart mutations
- Auto-reset after animation completes
- Use Framer Motion animate prop

OUTPUT:
- Update src/components/cart/cart-button.tsx or wherever badge lives
- Update cart store/hook to trigger pulse
```

### Prompt 3.5: Continuous CTA Shimmer

```
Add continuous subtle gradient shimmer to all primary CTA buttons.

REQUIREMENTS:
- Gradient: from var(--color-cta) to var(--color-primary)
- Shimmer: translateX animation, 3s infinite
- Subtle: low opacity gradient overlay
- Respect reduced motion

IMPLEMENTATION:
- Update Button component variant="primary"
- Add shimmer overlay as ::after pseudo-element
- Animate background-position or transform

OUTPUT:
- src/components/ui/Button.tsx (primary variant enhanced)
- Verify on: Add to Cart, Checkout, Hero CTA
```

### Prompt 3.6: User Animation Toggle

```
Add user-configurable animation preference toggle.

REQUIREMENTS:
- Storage: localStorage key "animation-preference"
- Values: "full" | "reduced" | "none"
- Overrides system prefers-reduced-motion
- UI: Toggle in settings/preferences

IMPLEMENTATION:
- Create useAnimationPreference hook
- Check localStorage first, then system preference
- Apply via data attribute or context
- All animations check this preference

OUTPUT:
- src/lib/hooks/useAnimationPreference.ts
- Settings UI component for toggle
- All animation components respect preference
```

### Prompt 3.7: A/B Test Infrastructure

```
Set up Vercel Edge Config for A/B testing.

REQUIREMENTS:
- Vercel Edge Config for feature flags
- Hero variant A/B test ready
- Consistent user experience (same variant per user)

IMPLEMENTATION:
- Set up Edge Config in Vercel dashboard
- Create useABTest hook
- Store variant assignment in cookie/localStorage
- Fetch config at edge for fast response

OUTPUT:
- src/lib/hooks/useABTest.ts
- Vercel Edge Config setup docs
- Hero component with variant support
```

---

## Sprint 4: Performance & Docs (6 prompts)

### Prompt 4.1: Core Web Vitals Optimization

```
Audit and optimize Core Web Vitals: LCP, FID, CLS.

REQUIREMENTS:
- LCP: < 2.5s (Largest Contentful Paint)
- FID: < 100ms (First Input Delay)
- CLS: < 0.1 (Cumulative Layout Shift)

IMPLEMENTATION:
- Run Lighthouse audit
- Identify bottlenecks
- Optimize: image loading, font loading, layout shifts
- Add preload hints, lazy loading, size attributes

OUTPUT:
- Lighthouse report before/after
- Optimization changes documented
```

### Prompt 4.2: Bundle Size Audit

```
Audit and reduce JavaScript bundle size.

REQUIREMENTS:
- Analyze bundle composition
- Identify large dependencies
- Implement code splitting
- Tree shake unused code

IMPLEMENTATION:
- Run bundle analyzer
- Review large imports
- Dynamic imports for heavy components
- Remove unused dependencies

OUTPUT:
- Bundle analysis report
- Reduced bundle size
```

### Prompt 4.3: TTI Improvements

```
Improve Time to Interactive.

REQUIREMENTS:
- Reduce main thread blocking
- Defer non-critical JavaScript
- Optimize hydration

IMPLEMENTATION:
- Identify long tasks
- Use React.lazy for route components
- Defer analytics, tracking scripts
- Optimize React hydration

OUTPUT:
- TTI improvement metrics
```

### Prompt 4.4: Animation Frame Rate

```
Ensure all animations maintain 60fps.

REQUIREMENTS:
- Target: 60fps for all animations
- No jank or dropped frames
- Test on mid-range devices

IMPLEMENTATION:
- Profile animations in DevTools
- Use GPU-accelerated properties (transform, opacity)
- Avoid layout thrashing
- Reduce animation complexity if needed

OUTPUT:
- Performance profiles
- Animation optimizations
```

### Prompt 4.5: Storybook Stories Update

```
Update Storybook stories for all V4 components.

REQUIREMENTS:
- Stories for new components
- Updated stories for modified components
- Document all variants and states

COMPONENTS:
- DropdownAction
- MenuItemCard (unified)
- CartItem (rewritten)
- Badge (variants)
- Collapsible Header
- CTA Button (shimmer)
- Skeleton (shimmer/pulse)

OUTPUT:
- stories/ files for each component
- Storybook deploy
```

### Prompt 4.6: Component Guide + JSDoc

```
Update component documentation with JSDoc and guide.

REQUIREMENTS:
- JSDoc for all public components
- Props documented with types and descriptions
- Usage examples
- Update component-guide.md

OUTPUT:
- JSDoc comments in all V4 components
- docs/component-guide.md updated
```

---

## Implementation Order

**Priority**: Bugs > Consistency > Polish (per clarification Q35)

**Risk batching** (per clarification Q31):
1. Low risk: Token audit, linting rules, documentation
2. Medium risk: Component rewrites, animation changes
3. High risk: Checkout fix, header collapse, A/B infrastructure

---

## Quality Checklist

Before marking any sprint complete:

### Technical
- [ ] TypeScript strict mode (no `any`)
- [ ] All components use design tokens
- [ ] Framer Motion for animations
- [ ] Proper accessibility (ARIA labels, focus states)
- [ ] Mobile-first responsive
- [ ] Reduced motion respected

### Visual
- [ ] Matches V4 UX spec
- [ ] Works in light and dark mode
- [ ] No layout shifts
- [ ] 60fps animations

### Testing
- [ ] pnpm typecheck passes
- [ ] pnpm test passes
- [ ] E2E tests for bug fixes
- [ ] Visual review at all breakpoints
