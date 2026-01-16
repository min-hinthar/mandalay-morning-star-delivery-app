# Sprint 6: States & Polish

> **Prompts**: 28-35 from UX-Prompts.md
> **Dependencies**: All previous sprints
> **Focus**: Loading, empty, error, success states, and final polish

## Overview

This final sprint implements all UI states (loading, empty, error, success) and adds the polish layer: page transitions, micro-interactions, responsive adaptations, and accessibility. This is what makes the experience feel premium.

## Sprint Progress

| Task | Component | Status |
|------|-----------|--------|
| 6.1 | Loading Skeletons | ⬜ Not Started |
| 6.2 | Empty States | ⬜ Not Started |
| 6.3 | Error States | ⬜ Not Started |
| 6.4 | Success Feedback | ⬜ Not Started |
| 6.5 | Page Transitions | ⬜ Not Started |
| 6.6 | Micro-interactions | ⬜ Not Started |
| 6.7 | Responsive Adaptations | ⬜ Not Started |
| 6.8 | Accessibility & High-Contrast | ⬜ Not Started |

> Update status: ⬜ Not Started → 🔄 In Progress → ✅ Complete

---

## Task 6.1: Loading Skeletons

**Prompt Reference**: Prompt 28 from UX-Prompts.md
**Output File**: `src/components/ui/Skeleton.tsx`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create skeleton components for each content type
4. Implement shimmer animation

### Prompt Content

```markdown
## Loading Skeletons

### Context
Placeholder loading states using skeleton screens with shimmer animation. Used while content loads to prevent layout shift and indicate progress.

### Requirements

**Skeleton Components:**

| Component | Skeleton Shape |
|-----------|---------------|
| Menu Item Card | Image rectangle + 3 text lines |
| Category Tab | Pill shapes |
| Cart Item | Small rectangle + 2 text lines |
| KPI Card | Large text line + small text |
| Driver Card | Rectangle + 3 text lines |

**Skeleton Styling:**
- Background: var(--color-cream-darker)
- Border-radius: Match actual component
- Shimmer: Gradient animation left-to-right

**Shimmer Animation:**
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-cream-darker) 0%,
    var(--color-cream) 50%,
    var(--color-cream-darker) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Layout Matching:**
- Skeleton dimensions must match loaded content
- Prevent cumulative layout shift (CLS)
- Stack skeletons in grid matching real layout

### Menu Item Card Skeleton
```
┌─────────────────────────────┐
│ ┌─────────────────────────┐ │
│ │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ │ ← Image placeholder
│ └─────────────────────────┘ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓              │ ← Title
│ ▓▓▓▓▓▓▓▓                    │ ← Subtitle
│ ▓▓▓▓▓                       │ ← Price
└─────────────────────────────┘
```

### Constraints
- Skeleton count should match expected content
- Use consistent skeleton for same component type
- Shimmer direction: left-to-right
- Respect prefers-reduced-motion (static skeletons)
```

### Acceptance Criteria
- [ ] MenuItemCardSkeleton component
- [ ] CategoryTabSkeleton component
- [ ] CartItemSkeleton component
- [ ] KPICardSkeleton component
- [ ] DriverCardSkeleton component
- [ ] Shimmer animation
- [ ] Matching dimensions to real content
- [ ] prefers-reduced-motion support

---

## Task 6.2: Empty States

**Prompt Reference**: Prompt 29 from UX-Prompts.md
**Output File**: `src/components/ui/EmptyState.tsx`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create empty state component variants
4. Include appropriate CTAs

### Prompt Content

```markdown
## Empty States

### Context
Contextual empty state displays when no data is available. Each empty state includes an illustration/icon, message, and action to resolve.

### Requirements

**Empty State Components:**

| Context | Icon | Message | Action |
|---------|------|---------|--------|
| Cart | Shopping bag outline | "Your cart is empty" | "Browse Menu" |
| Search | Magnifying glass | "No results for '[query]'" | "Try different keywords" |
| Order History | Receipt outline | "No orders yet" | "Place your first order" |
| Favorites | Heart outline | "No favorites saved" | "Browse menu to add favorites" |
| Driver Route | Calendar | "No route assigned today" | "Check back later" |
| Admin Orders | Inbox | "No orders for this period" | "Adjust date filter" |
| Exceptions | Check circle | "No exceptions - all good!" | None (positive state) |

**Layout:**
```
┌─────────────────────────────┐
│                             │
│         [Icon/Illustration] │ ← 64px icon
│                             │
│   Your cart is empty        │ ← Heading
│                             │
│   Add items from the menu   │ ← Supporting text
│   to get started            │
│                             │
│   [Browse Menu]             │ ← CTA button
│                             │
└─────────────────────────────┘
```

**Styling:**
- Center aligned
- Icon: 64px, var(--color-charcoal-muted)
- Heading: var(--text-lg), semibold
- Supporting text: var(--text-base), var(--color-charcoal-muted)
- CTA: Secondary button style
- Padding: var(--space-8) vertical

### States
- Static empty: As described
- Loading: Show skeletons instead of empty state
- Error: Show error state, not empty state

### Constraints
- Empty states must be helpful, not just "empty"
- Always provide an action when possible
- Use consistent illustration style
- Don't show empty state while loading
```

### Acceptance Criteria
- [ ] EmptyState component with variants
- [ ] Cart empty state
- [ ] Search no results state
- [ ] Order history empty state
- [ ] Favorites empty state
- [ ] Driver no route state
- [ ] Admin no orders state
- [ ] Exceptions all-good state
- [ ] Consistent icon styling (64px)
- [ ] Action button for each

---

## Task 6.3: Error States

**Prompt Reference**: Prompt 30 from UX-Prompts.md
**Output File**: `src/components/ui/ErrorState.tsx`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create error display components
4. Handle different error types

### Prompt Content

```markdown
## Error States

### Context
Error handling UI patterns for failures throughout the app: network errors, validation errors, server errors. Errors should be specific, helpful, and recoverable.

### Requirements

**Error Types:**

| Type | Display | Recovery |
|------|---------|----------|
| Network offline | Top banner | Auto-retry when online |
| API error | Inline message | Retry button |
| Validation error | Below input | Fix input |
| Payment failed | Full-page | Try again button |
| Not found | Full-page | Go home button |

**Inline Error:**
```
┌─────────────────────────────┐
│ [Input field]               │
│ ⚠️ This address is outside  │ ← Red text below input
│    our delivery area        │
└─────────────────────────────┘
```

**Error Banner:**
```
┌─────────────────────────────┐
│ ⚠️ You're offline           │ ← Full-width banner
│ Some features may be limited│ ← At top of screen
└─────────────────────────────┘
```

**Full-Page Error:**
```
┌─────────────────────────────┐
│                             │
│      [Error illustration]   │
│                             │
│   Something went wrong      │
│                             │
│   We couldn't process your  │
│   request. Please try again.│
│                             │
│   [Try Again]  [Go Home]    │
│                             │
└─────────────────────────────┘
```

**Styling:**
- Error color: var(--color-error)
- Error background: var(--color-error-light)
- Warning color: var(--color-warning)
- Icon: Appropriate to severity

### Toast Errors:
- Position: Top center
- Auto-dismiss: 5 seconds
- Dismissible: X button
- Animation: Slide down + fade

### Constraints
- Errors must explain what happened
- Errors must suggest how to fix
- Don't use technical jargon
- Log errors for debugging (console/Sentry)
```

### Acceptance Criteria
- [ ] Inline error component
- [ ] Error banner component
- [ ] Full-page error component
- [ ] Toast error component
- [ ] Network offline banner
- [ ] API error with retry
- [ ] Payment failed page
- [ ] Not found page
- [ ] Auto-dismiss toast (5s)
- [ ] Helpful, non-technical messages

---

## Task 6.4: Success Feedback

**Prompt Reference**: Prompt 31 from UX-Prompts.md
**Output Files**: `src/components/ui/Toast.tsx`, `src/components/ui/Confetti.tsx`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create success feedback components
4. Implement confetti animation

### Prompt Content

```markdown
## Success Feedback

### Context
Positive feedback patterns for successful actions: order placed, item added, delivery complete. Celebratory moments that make the experience delightful.

### Requirements

**Success Types:**

| Action | Feedback |
|--------|----------|
| Add to cart | Button flash + item animation to cart |
| Order placed | Confetti + success page |
| Delivery complete | Checkmark animation |
| Rating submitted | Thank you message |
| Address saved | Brief toast |

**Success Toast:**
```
┌─────────────────────────────┐
│ ✓ Item added to cart        │ ← Green background
└─────────────────────────────┘
```
- Position: Top center
- Background: var(--color-jade)
- Duration: 2 seconds
- Animation: Slide down, fade out

**Order Confirmation:**
```
┌─────────────────────────────┐
│          🎉                 │
│                             │
│   Order Confirmed!          │
│                             │
│   Your order #12345 is      │
│   confirmed for Saturday    │
│                             │
│   [Track Order]             │
│   [Continue Shopping]       │
└─────────────────────────────┘
```
- Confetti animation on load
- Large check animation
- Order details summary

**Delivery Complete (Driver):**
- Large animated checkmark (1s)
- "Delivery Complete!" text
- Auto-advance to next stop (2s delay)
- Stats increment animation

### Confetti Animation
```typescript
// Framer Motion confetti
const confetti = {
  initial: { y: 0, opacity: 1, rotate: 0 },
  animate: {
    y: -500,
    opacity: 0,
    rotate: 720,
    transition: { duration: 2, ease: "easeOut" }
  }
};
// 20-30 particles with random colors
```

### Constraints
- Celebrations should feel earned, not constant
- Respect prefers-reduced-motion
- Don't block user with celebrations
- Quick acknowledgment for minor actions
```

### Acceptance Criteria
- [ ] Success toast component (green)
- [ ] Toast slide animation
- [ ] Order confirmation page
- [ ] Confetti animation (20-30 particles)
- [ ] Large checkmark animation
- [ ] Delivery complete feedback
- [ ] Stats increment animation
- [ ] prefers-reduced-motion support
- [ ] Auto-dismiss timing

---

## Task 6.5: Page Transitions

**Prompt Reference**: Prompt 32 from UX-Prompts.md
**Output File**: `src/components/layouts/PageTransition.tsx`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create page transition wrapper
4. Handle navigation direction

### Prompt Content

```markdown
## Page Transitions

### Context
Smooth transitions between pages/routes in the app. Makes navigation feel polished and spatial. Different transitions for different navigation types.

### Requirements

**Transition Types:**

| Navigation | Transition |
|------------|------------|
| Forward (drill down) | Slide left + fade |
| Backward | Slide right + fade |
| Modal open | Slide up (mobile) / Scale (desktop) |
| Modal close | Slide down / Scale out |
| Tab switch | Crossfade |
| Full page change | Fade |

**Forward Navigation:**
- New page slides in from right (30px)
- Current page fades + slides left
- Duration: 300ms
- Easing: ease-out

**Backward Navigation:**
- Current page slides right + fades
- Previous page slides in from left
- Duration: 250ms
- Easing: ease-in-out

**Implementation:**
```typescript
// Next.js App Router with Framer Motion
const pageVariants = {
  initial: (direction: 'forward' | 'backward') => ({
    x: direction === 'forward' ? 30 : -30,
    opacity: 0
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] }
  },
  exit: (direction: 'forward' | 'backward') => ({
    x: direction === 'forward' ? -30 : 30,
    opacity: 0,
    transition: { duration: 0.25 }
  })
};
```

### Constraints
- No transition on initial page load
- Transitions must not cause layout shift
- Keep transitions under 300ms
- Disable for prefers-reduced-motion
```

### Acceptance Criteria
- [ ] PageTransition wrapper component
- [ ] Forward navigation (slide left)
- [ ] Backward navigation (slide right)
- [ ] Direction detection
- [ ] 300ms duration
- [ ] No initial page load transition
- [ ] No layout shift
- [ ] prefers-reduced-motion support

---

## Task 6.6: Micro-interactions

**Prompt Reference**: Prompt 33 from UX-Prompts.md
**Output File**: `src/lib/micro-interactions.ts`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create reusable micro-interaction variants
4. Apply to existing components

### Prompt Content

```markdown
## Micro-interactions

### Context
Subtle interaction feedback that makes the UI feel alive and responsive. Hover states, button presses, toggles, and other small moments.

### Requirements

**Button Hover:**
- Scale: 1.02
- Shadow: Increase one level
- Duration: 150ms
- Easing: ease-out

**Button Press:**
- Scale: 0.98
- Duration: 100ms
- Return to 1.0 on release

**Card Hover:**
- Scale: 1.01
- Shadow: var(--shadow-md)
- Duration: 150ms
- Cursor: pointer

**Toggle Switch:**
- Knob slides with spring physics
- Background color transitions
- Duration: 200ms

**Checkbox:**
- Scale: 0.9 → 1.1 → 1.0 on check
- Checkmark draws in (SVG animation)
- Duration: 200ms

**Heart Favorite:**
- Scale: 1.3 on tap
- Color fills (outline → filled)
- Particles burst (optional)
- Duration: 300ms

**Quantity Stepper:**
- Number flips/rolls on change
- Button scales on press
- Haptic feedback

### Implementation Examples
```typescript
const buttonHover = {
  scale: 1.02,
  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  transition: { duration: 0.15 }
};

const heartFavorite = {
  tap: { scale: 1.3 },
  transition: { type: "spring", stiffness: 500, damping: 15 }
};
```

### Constraints
- Micro-interactions should be subtle
- Never delay user action for animation
- Consistent across similar elements
- Respect prefers-reduced-motion
```

### Acceptance Criteria
- [ ] Button hover/press animations
- [ ] Card hover lift effect
- [ ] Toggle switch animation
- [ ] Checkbox check animation
- [ ] Heart favorite animation
- [ ] Quantity stepper animations
- [ ] Consistent timing (150-200ms)
- [ ] Subtle, not distracting
- [ ] prefers-reduced-motion support

---

## Task 6.7: Responsive Adaptations

**Prompt Reference**: Prompt 34 from UX-Prompts.md
**Output File**: Applied across all components
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Review and update all components for responsiveness
4. Test at all breakpoints

### Prompt Content

```markdown
## Responsive Adaptations

### Context
Responsive design adaptations for different screen sizes: mobile (< 640px), tablet (640-1023px), desktop (1024px+). Mobile-first approach.

### Requirements

**Breakpoints:**
```css
--bp-sm: 640px;   /* Large phones */
--bp-md: 768px;   /* Tablets */
--bp-lg: 1024px;  /* Laptops */
--bp-xl: 1280px;  /* Desktops */
--bp-2xl: 1536px; /* Large screens */
```

**Menu Grid:**
- Mobile: 2 columns
- Tablet: 3 columns
- Desktop: 4 columns
- Gap: 12px (mobile), 16px (tablet), 24px (desktop)

**Cart:**
- Mobile: Sticky bottom bar → expands to full screen
- Tablet: Slide-in drawer from right
- Desktop: Persistent sidebar (optional)

**Navigation:**
- Mobile: Bottom tab bar (customer), hamburger (admin)
- Tablet: Same as mobile
- Desktop: Top navigation bar

**Typography Scale:**
- Mobile: Base 16px
- Desktop: Base 16px (same, but headings scale up)
- Headings: 1.2x larger on desktop

**Touch Targets:**
- Mobile: Minimum 44px
- Desktop: Minimum 32px (hover available)

**Modals:**
- Mobile: Full-screen, slide from bottom
- Desktop: Centered, 600px max width

### Customer Layout Adaptations
```
Mobile:               Desktop:
┌─────────────┐      ┌───────────────────────────┐
│ Header      │      │ Header with nav           │
├─────────────┤      ├─────────────┬─────────────┤
│             │      │             │             │
│ Menu Grid   │      │ Menu Grid   │ Cart Side   │
│ (2 col)     │      │ (4 col)     │   bar       │
│             │      │             │             │
├─────────────┤      └─────────────┴─────────────┘
│ Cart Bar    │
└─────────────┘
```

### Constraints
- Mobile-first CSS (min-width media queries)
- No horizontal scroll at any breakpoint
- Test at 375px, 768px, 1024px, 1440px
- Content must be readable at all sizes
```

### Acceptance Criteria
- [ ] Breakpoint CSS variables defined
- [ ] Menu grid responsive (2/3/4 columns)
- [ ] Cart behavior per breakpoint
- [ ] Navigation adapts correctly
- [ ] Typography scales appropriately
- [ ] Touch targets meet minimums
- [ ] Modal behavior per breakpoint
- [ ] No horizontal scroll
- [ ] Tested at 375px, 768px, 1024px, 1440px

---

## Task 6.8: Accessibility & High-Contrast

**Prompt Reference**: Prompt 35 from UX-Prompts.md
**Output File**: `src/styles/high-contrast.css`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Audit all components for accessibility
4. Implement high-contrast mode for drivers

### Prompt Content

```markdown
## Accessibility & High-Contrast

### Context
WCAG 2.1 AA compliance and high-contrast mode for drivers in sunlight. Accessibility is not optional — it's required for all users.

### Requirements

**Color Contrast:**
- Normal text (< 18px): 4.5:1 minimum
- Large text (≥ 18px): 3:1 minimum
- UI components: 3:1 minimum
- Focus indicators: 3:1 minimum

**Keyboard Navigation:**
- All interactive elements focusable
- Logical tab order (left-to-right, top-to-bottom)
- Skip link to main content
- Focus trap in modals
- Escape closes modals/dropdowns

**Focus Indicators:**
- Style: 2px offset outline
- Color: var(--color-saffron)
- Visible on all focusable elements
- Never remove focus outline without replacement

**Screen Reader Support:**
- All images have alt text
- Icons have aria-label
- Form inputs have labels
- Error messages linked with aria-describedby
- Live regions for dynamic content
- Proper heading hierarchy (h1 → h6)

**Driver High-Contrast Mode:**
```css
[data-high-contrast="true"] {
  --color-charcoal: #000000;
  --color-cream: #FFFFFF;
  --color-saffron: #FFCC00;
  --color-border: #000000;

  /* Increase text sizes */
  --text-base: 1.125rem;  /* 18px */
  --text-lg: 1.25rem;     /* 20px */

  /* Thicker borders */
  --border-width: 2px;

  /* Higher contrast ratios */
  /* All text: 7:1 minimum */
}
```

**Motion Sensitivity:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

### Testing Checklist
- [ ] Tab through entire flow without mouse
- [ ] Use with screen reader (VoiceOver/NVDA)
- [ ] Test with browser zoom at 200%
- [ ] Verify all color contrast
- [ ] Test high-contrast mode

### Constraints
- Never use color alone to convey information
- Never disable zoom
- Touch targets: 44px minimum
- Provide text alternatives for all media
```

### Acceptance Criteria
- [ ] 4.5:1 contrast for normal text
- [ ] 3:1 contrast for large text and UI
- [ ] Keyboard navigation works throughout
- [ ] Skip link to main content
- [ ] Focus trap in modals
- [ ] Visible focus indicators (saffron)
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] aria-describedby for errors
- [ ] Proper heading hierarchy
- [ ] High-contrast CSS for driver mode
- [ ] prefers-reduced-motion support
- [ ] Tested with screen reader
- [ ] Tested at 200% zoom

---

## Sprint Completion Checklist

Before marking Sprint 6 complete:

- [ ] All 8 tasks completed
- [ ] All skeleton components match content
- [ ] Empty states helpful with CTAs
- [ ] Error states recoverable
- [ ] Success feedback delightful
- [ ] Page transitions smooth
- [ ] Micro-interactions subtle
- [ ] Responsive at all breakpoints
- [ ] WCAG 2.1 AA compliant
- [ ] High-contrast mode working
- [ ] prefers-reduced-motion respected
- [ ] Screen reader tested
- [ ] No TypeScript errors
- [ ] Visual review complete

---

## V3 Build Complete Checklist

After all 6 sprints are complete:

### Foundation
- [ ] Design tokens (light + dark)
- [ ] Animation utilities
- [ ] All 4 app shells

### Components
- [ ] Button, Input, Card systems
- [ ] Menu browsing components
- [ ] Cart and checkout components
- [ ] Tracking and driver components
- [ ] Admin dashboard components

### Interactions
- [ ] Cart animations
- [ ] Modal interactions
- [ ] Tab switching
- [ ] Form validation
- [ ] Swipe gestures

### Polish
- [ ] Loading skeletons
- [ ] Empty states
- [ ] Error states
- [ ] Success feedback
- [ ] Page transitions
- [ ] Micro-interactions
- [ ] Responsive design
- [ ] Accessibility

### Quality
- [ ] TypeScript strict (no `any`)
- [ ] WCAG 2.1 AA compliant
- [ ] Mobile-first responsive
- [ ] prefers-reduced-motion support
- [ ] iOS safe area support
- [ ] Dark mode working
- [ ] High-contrast driver mode
