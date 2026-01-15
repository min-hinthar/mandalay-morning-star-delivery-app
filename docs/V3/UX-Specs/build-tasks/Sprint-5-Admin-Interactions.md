# Sprint 5: Admin & Interactions

> **Prompts**: 22-27 from UX-Prompts.md
> **Dependencies**: Sprints 1-4 (all previous)
> **Focus**: Admin dashboard components and interaction patterns

## Overview

This sprint implements admin KPI cards and the core interaction patterns used throughout the app: cart animations, modals, tabs, form validation, and mobile gestures.

## Sprint Progress

| Task | Component | Status |
|------|-----------|--------|
| 5.1 | Admin KPI Cards | ⬜ Not Started |
| 5.2 | Cart Interactions | ⬜ Not Started |
| 5.3 | Modal Interactions | ⬜ Not Started |
| 5.4 | Tab Switching | ⬜ Not Started |
| 5.5 | Form Validation | ⬜ Not Started |
| 5.6 | Mobile Swipe Gestures | ⬜ Not Started |

> Update status: ⬜ Not Started → 🔄 In Progress → ✅ Complete

---

## Task 5.1: Admin KPI Cards

**Prompt Reference**: Prompt 22 from UX-Prompts.md
**Output File**: `src/components/admin/KPICard.tsx`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create KPI card with comparison indicators
4. Handle real-time updates

### Prompt Content

```markdown
## Admin KPI Cards

### Context
Key performance indicator cards for admin dashboard header. Shows today's metrics: Orders, Active Drivers, Exceptions, Revenue. Each card shows current value and week-over-week comparison.

### Requirements

**Layout (4-column row):**
```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 45       │ │ 4        │ │ 2        │ │ $4,230   │
│ Orders   │ │ Drivers  │ │ Exceptions│ │ Revenue  │
│ ↑12%     │ │ All Active│ │ ↓1       │ │ ↑8%      │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

**Card Dimensions:**
- Flex: 1 (equal width)
- Height: 100px
- Padding: var(--space-4)
- Background: white
- Border-radius: var(--radius-md)
- Border: 1px var(--color-border)

**Typography:**
- Value: var(--font-display), 36px, bold, var(--color-charcoal)
- Label: var(--font-body), 14px, var(--color-charcoal-muted)
- Comparison: var(--font-body), 14px, var(--font-semibold)

**Comparison Indicators:**
- Positive: ↑ arrow + percentage, var(--color-jade)
- Negative: ↓ arrow + percentage, var(--color-error)
- Neutral: → arrow or "Same", var(--color-charcoal-muted)

**Exception Card Special:**
- When exceptions > 0: Red accent (border or background tint)
- Click navigates to exceptions list

### States
- Loading: Skeleton placeholders
- Loaded: Values displayed with comparisons
- Refreshing: Subtle pulse animation on values
- Error: "Error loading" with retry link

### Interactions
- Tap card: Opens detailed view (modal or drill-down)
- Hover: Tooltip showing more context (desktop)
- Auto-refresh: Updates every 30 seconds

### Constraints
- Revenue shows as currency with $ symbol
- Percentages rounded to whole numbers
- Comparison period: this Saturday vs last Saturday
- Red highlight for exceptions is critical — must draw attention
```

### Acceptance Criteria
- [ ] 4-column responsive layout
- [ ] Large value display (36px)
- [ ] Label below value
- [ ] Comparison indicator with arrow
- [ ] Color coding (jade positive, error negative)
- [ ] Exception card red accent when > 0
- [ ] Loading skeleton state
- [ ] Refresh animation
- [ ] Click to drill-down

---

## Task 5.2: Cart Interactions

**Prompt Reference**: Prompt 23 from UX-Prompts.md
**Output File**: `src/components/cart/CartAnimations.tsx`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create Framer Motion animation variants
4. Export reusable animation hooks

### Prompt Content

```markdown
## Cart Interactions

### Context
Animation and interaction patterns for cart operations: adding items, removing items, adjusting quantities. These micro-interactions make the ordering experience feel polished and responsive.

### Requirements

**Add to Cart:**
1. Button shows loading spinner briefly (150ms)
2. Button flashes success (check icon + green)
3. Item "flies" to cart bar (arc animation, 300ms)
4. Cart bar bounces up slightly
5. Item count badge increments with pop animation

**Remove from Cart:**
1. Item card slides left revealing red "Delete" button (swipe gesture)
2. OR tap X button on item
3. Item slides out to left (200ms)
4. Other items slide up to fill gap
5. Item count decrements
6. If last item: cart bar slides down and hides

**Quantity Adjust:**
1. Tap +/- triggers haptic feedback (if supported)
2. Number does quick flip animation
3. Price updates with counter animation
4. Cart total updates simultaneously

**Cart Bar Expand:**
1. Tap cart bar
2. Bar content fades out (100ms)
3. Full cart slides up from bottom (300ms, ease-out)
4. Backdrop fades in

**Cart Bar Collapse:**
1. Swipe down or tap backdrop
2. Cart slides down (200ms)
3. Backdrop fades out
4. Bar content fades in

### Framer Motion Variants
```typescript
const addToCartButton = {
  success: {
    scale: [1, 1.1, 1],
    backgroundColor: ["#D4A017", "#2E8B57", "#D4A017"],
    transition: { duration: 0.4 }
  }
};

const cartItemRemove = {
  exit: {
    x: -300,
    opacity: 0,
    height: 0,
    transition: { duration: 0.2 }
  }
};

const cartExpand = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 }
  }
};
```

### Constraints
- All animations under 300ms (except cart expand)
- Respect prefers-reduced-motion (skip animations)
- Haptic feedback on quantity change (iOS/Android)
- Animations must not block interaction
```

### Acceptance Criteria
- [ ] Add to cart button success animation
- [ ] Item fly-to-cart animation
- [ ] Cart bar bounce on add
- [ ] Item count badge pop animation
- [ ] Swipe-to-delete with slide reveal
- [ ] Item slide-out on remove
- [ ] Quantity flip animation
- [ ] Cart expand/collapse animations
- [ ] prefers-reduced-motion support
- [ ] Haptic feedback integration

---

## Task 5.3: Modal Interactions

**Prompt Reference**: Prompt 24 from UX-Prompts.md
**Output File**: `src/components/ui/Modal.tsx`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create modal component with animations
4. Handle focus management

### Prompt Content

```markdown
## Modal Interactions

### Context
Open/close interaction patterns for modals throughout the app: item detail modal, checkout modals, confirmation dialogs. Consistent, polished modal behavior.

### Requirements

**Open Animation:**
- Desktop: Scale from 95% to 100% + fade in (300ms)
- Mobile: Slide up from bottom (300ms, spring easing)
- Backdrop: Fade in from transparent to rgba(0,0,0,0.5)

**Close Animation:**
- Desktop: Scale to 95% + fade out (200ms)
- Mobile: Slide down (200ms)
- Backdrop: Fade out

**Close Triggers:**
- Tap backdrop (desktop)
- Tap X button
- Press Escape key
- Swipe down (mobile, if modal is at top)

**Focus Management:**
- On open: Focus moves to first focusable element
- On close: Focus returns to trigger element
- Tab trapping: Focus stays within modal

**Backdrop:**
- Color: rgba(26, 26, 26, 0.5)
- Click triggers close
- Prevents body scroll

### Framer Motion Implementation
```typescript
const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: window.innerWidth < 640 ? "100%" : 0
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: window.innerWidth < 640 ? "100%" : 0,
    transition: { duration: 0.2 }
  }
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};
```

### Constraints
- Body scroll must be locked when modal is open
- Modal must be dismissible (accessibility)
- Animation should not cause layout shift
- Nested modals: Close inner first
```

### Acceptance Criteria
- [ ] Desktop scale animation
- [ ] Mobile slide-up animation
- [ ] Backdrop fade animation
- [ ] X button close
- [ ] Escape key close
- [ ] Backdrop click close
- [ ] Swipe down close (mobile)
- [ ] Focus trap implementation
- [ ] Focus restoration on close
- [ ] Body scroll lock
- [ ] Nested modal support

---

## Task 5.4: Tab Switching

**Prompt Reference**: Prompt 25 from UX-Prompts.md
**Output File**: `src/components/ui/TabSwitcher.tsx`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create tab component with content transitions
4. Handle direction-aware animations

### Prompt Content

```markdown
## Tab Switching

### Context
Category tab navigation on the menu page. Smooth content transitions when switching between menu categories. Tabs scroll horizontally on mobile.

### Requirements

**Tab Selection Animation:**
1. Tapped tab: Scale 0.98 briefly
2. Active indicator: Slide to new tab (200ms)
3. Old tab: Text color fades to muted (150ms)
4. New tab: Text color brightens to active (150ms)

**Content Transition:**
- Direction-aware: Swipe left for next, right for previous
- Content fades + slides in direction of navigation
- Duration: 200ms
- No layout shift (container height stable)

**Tab Scroll (Mobile):**
- Horizontal scroll with momentum
- Active tab scrolls into view when selected
- Edge fade indicators show more content

**Tab Indicator:**
- Bottom border (2px, saffron)
- Animates position between tabs (200ms, ease-out)
- Width matches tab text width

### Implementation
```typescript
const tabContent = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -50 : 50,
    opacity: 0,
    transition: { duration: 0.2 }
  })
};
```

### Constraints
- Swipe gesture support for content (not just tabs)
- Keyboard navigation: Arrow keys between tabs
- Tab underline indicator must be smooth
- Content height should not jump during transition
```

### Acceptance Criteria
- [ ] Tab selection with scale feedback
- [ ] Sliding underline indicator
- [ ] Text color transitions
- [ ] Direction-aware content transition
- [ ] Horizontal scroll on mobile
- [ ] Active tab auto-scroll into view
- [ ] Edge fade indicators
- [ ] Swipe gesture on content
- [ ] Keyboard arrow navigation
- [ ] Stable container height

---

## Task 5.5: Form Validation

**Prompt Reference**: Prompt 26 from UX-Prompts.md
**Output File**: `src/components/ui/FormValidation.tsx`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create validation components and hooks
4. Handle inline error display

### Prompt Content

```markdown
## Form Validation

### Context
Real-time inline form validation patterns for checkout forms, search, and inputs throughout the app. Errors appear inline without submit actions.

### Requirements

**Validation Timing:**
- On blur: Validate when user leaves field
- On change (after error): Re-validate as user types
- On submit: Validate all fields

**Error Display:**
- Position: Below input, left-aligned
- Color: var(--color-error)
- Icon: ⚠️ or similar warning icon
- Font: var(--text-sm)
- Animation: Slide down + fade in (150ms)

**Input Error State:**
- Border: var(--color-error)
- Background: var(--color-error-light)
- Icon: Error icon inside input (right side)

**Error Messages:**
- Empty required field: "This field is required"
- Invalid email: "Please enter a valid email"
- Invalid phone: "Please enter a valid phone number"
- Out of range: "Please enter a value between X and Y"

**Success State (Optional):**
- Border: var(--color-jade)
- Icon: Check inside input (right side)
- For critical fields like address validation

### Implementation
```typescript
const errorMessage = {
  hidden: {
    opacity: 0,
    y: -10,
    height: 0
  },
  visible: {
    opacity: 1,
    y: 0,
    height: "auto",
    transition: { duration: 0.15 }
  }
};
```

### Constraints
- Errors must be associated with inputs (aria-describedby)
- Error messages must be specific and helpful
- Don't show errors before user interaction
- Clear errors when user starts fixing
```

### Acceptance Criteria
- [ ] On-blur validation
- [ ] On-change re-validation after error
- [ ] Error message slide animation
- [ ] Input error border styling
- [ ] Error icon in input
- [ ] Success state with check icon
- [ ] Standard error messages
- [ ] aria-describedby association
- [ ] Error clear on input change
- [ ] Form-level submit validation

---

## Task 5.6: Mobile Swipe Gestures

**Prompt Reference**: Prompt 27 from UX-Prompts.md
**Output File**: `src/lib/swipe-gestures.ts`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create reusable swipe gesture utilities
4. Handle threshold and velocity detection

### Prompt Content

```markdown
## Mobile Swipe Gestures

### Context
Swipe gesture patterns for mobile interactions: swipe to delete cart items, swipe down to close modals, swipe between categories.

### Requirements

**Swipe to Delete (Cart Items):**
- Gesture: Horizontal swipe left
- Threshold: 80px triggers delete button reveal
- Full swipe (200px+): Auto-deletes
- Delete button: Red background, white "Delete" text
- Snap back if not past threshold

**Swipe to Close (Modals):**
- Gesture: Vertical swipe down
- Threshold: 100px triggers close
- Elastic resistance past threshold
- Velocity-sensitive: Fast swipe closes regardless of distance
- Visual feedback: Modal follows finger

**Swipe Between Categories:**
- Gesture: Horizontal swipe on content area
- Left swipe: Next category
- Right swipe: Previous category
- Resistance at first/last category
- Syncs with tab indicator

### Implementation
```typescript
// Using Framer Motion drag
const cartItem = {
  drag: "x",
  dragConstraints: { left: -200, right: 0 },
  dragElastic: 0.1,
  onDragEnd: (_, info) => {
    if (info.offset.x < -150) {
      deleteItem();
    }
  }
};

const modal = {
  drag: "y",
  dragConstraints: { top: 0, bottom: 300 },
  dragElastic: 0.2,
  onDragEnd: (_, info) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      closeModal();
    }
  }
};
```

### Constraints
- Must not conflict with native scroll
- Provide visual feedback during gesture
- Haptic feedback at thresholds
- Fallback: All actions available via tap
```

### Acceptance Criteria
- [ ] Swipe-to-delete with reveal
- [ ] Auto-delete on full swipe
- [ ] Snap back behavior
- [ ] Swipe-to-close modal
- [ ] Velocity detection
- [ ] Elastic resistance
- [ ] Swipe between categories
- [ ] First/last category resistance
- [ ] Tab indicator sync
- [ ] Haptic feedback at thresholds
- [ ] No scroll conflicts

---

## Sprint Completion Checklist

Before marking Sprint 5 complete:

- [ ] All 6 tasks completed
- [ ] KPI cards display correctly
- [ ] All cart animations smooth
- [ ] Modal open/close polished
- [ ] Tab switching direction-aware
- [ ] Form validation user-friendly
- [ ] Swipe gestures natural
- [ ] prefers-reduced-motion respected
- [ ] No TypeScript errors
- [ ] Visual review complete
