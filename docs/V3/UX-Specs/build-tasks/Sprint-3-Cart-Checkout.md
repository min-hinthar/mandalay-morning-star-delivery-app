# Sprint 3: Cart & Checkout

> **Prompts**: 14-18 from UX-Prompts.md
> **Dependencies**: Sprints 1-2 (tokens, layouts, base components)
> **Focus**: Cart functionality and checkout flow components

## Overview

This sprint implements the cart and checkout experience — the critical path to conversion. Sticky cart bar, expandable cart view, and checkout step components.

## P1-Foundation UI Assets

Design templates for cart components. **`/frontend-design` should improve upon these** with enhanced interactions and polish.

| Asset | Description | Files |
|-------|-------------|-------|
| **Cart Overview 1** | Cart bar, item list layout | [code.html](../../UI-Assets/P1-Foundation/Cart-Overview-1/code.html) / [screen.png](../../UI-Assets/P1-Foundation/Cart-Overview-1/screen.png) |
| **Cart Overview 2** | Cart summary, totals | [code.html](../../UI-Assets/P1-Foundation/Cart-Overview-2/code.html) / [screen.png](../../UI-Assets/P1-Foundation/Cart-Overview-2/screen.png) |
| **Cart Overview 3** | Cart states, interactions | [code.html](../../UI-Assets/P1-Foundation/Cart-Overview-3/code.html) / [screen.png](../../UI-Assets/P1-Foundation/Cart-Overview-3/screen.png) |

---

## Sprint Progress

| Task | Component | Status |
|------|-----------|--------|
| 3.1 | Sticky Cart Bar | ✅ Complete |
| 3.2 | Expanded Cart View | ✅ Complete |
| 3.3 | Checkout Step Indicator | ✅ Complete |
| 3.4 | Address Input | ✅ Complete |
| 3.5 | Time Slot Selector | ✅ Complete |

> Update status: ⬜ Not Started → 🔄 In Progress → ✅ Complete

---

## Task 3.1: Sticky Cart Bar

**Prompt Reference**: Prompt 14 from UX-Prompts.md
**Output File**: `src/components/cart/CartBar.tsx`
**Status**: ✅ Complete

### Reference Assets
> **Templates** (improve upon these):
> - [Cart-Overview-1/screen.png](../../UI-Assets/P1-Foundation/Cart-Overview-1/screen.png) | [code.html](../../UI-Assets/P1-Foundation/Cart-Overview-1/code.html)

### Implementation Guide
1. **Review template** — screen.png for visuals, code.html for structure
2. Run `/frontend-design`
3. Paste the prompt content below
4. **Improve upon template** with enhanced animations, micro-interactions
5. Create sticky bottom bar component
6. Handle expand/collapse interaction

### Prompt Content

```markdown
## Sticky Cart Bar

### Context
Persistent bottom bar showing cart summary on the menu page. Shows item count, total, and provides access to full cart view. Expands on tap to show cart contents. Essential for the mobile ordering experience.

### Requirements

**Collapsed State:**
```
┌─────────────────────────────────────────┐
│ [🛒 3 items]    $45.00    [View Cart →] │
└─────────────────────────────────────────┘
```

**Dimensions:**
- Height: 64px (plus safe area bottom)
- Full width
- Padding: var(--space-4)
- Background: var(--color-cream-darker)
- Shadow: var(--shadow-lg) upward
- Border-radius: var(--radius-lg) var(--radius-lg) 0 0

**Content:**
- Left: Cart icon + item count badge
- Center: Total price (Playfair, 20px, bold)
- Right: "View Cart" or "Checkout" button (primary, sm)

**Free Delivery Progress:**
- When subtotal < $100: Show progress bar below content
- Message: "$55 more for free delivery"
- Progress bar: var(--color-saffron) fill on var(--color-border) track

### States
- Empty: Bar is hidden (content area fills space)
- Has Items: Bar visible with count + total
- Near Free Delivery: Prominent progress message
- Free Delivery Achieved: "Free Delivery!" badge in jade

### Interactions
- Tap anywhere on bar: Expands to full cart view
- Tap "View Cart": Same as above
- Tap "Checkout": Goes directly to checkout flow
- Swipe up: Expands cart
- Swipe down (when expanded): Collapses cart

### Constraints
- Must respect iOS safe area (env(safe-area-inset-bottom))
- Must not cover content (page needs bottom padding)
- Animation: 300ms ease-out expand/collapse
- Z-index: 40 (below header)
```

### Acceptance Criteria
- [ ] Sticky bottom positioning
- [ ] Cart icon with item count badge
- [ ] Total price display
- [ ] View Cart / Checkout buttons
- [ ] Free delivery progress bar
- [ ] Hidden when cart empty
- [ ] iOS safe area support
- [ ] Expand/collapse animations

---

## Task 3.2: Expanded Cart View

**Prompt Reference**: Prompt 15 from UX-Prompts.md
**Output File**: `src/components/cart/CartView.tsx`
**Status**: ✅ Complete

### Reference Assets
> **Templates** (improve upon these):
> - [Cart-Overview-2/screen.png](../../UI-Assets/P1-Foundation/Cart-Overview-2/screen.png) | [code.html](../../UI-Assets/P1-Foundation/Cart-Overview-2/code.html)
> - [Cart-Overview-3/screen.png](../../UI-Assets/P1-Foundation/Cart-Overview-3/screen.png) | [code.html](../../UI-Assets/P1-Foundation/Cart-Overview-3/code.html)

### Implementation Guide
1. **Review templates** — screen.png for visuals, code.html for structure
2. Run `/frontend-design`
3. Paste the prompt content below
4. **Improve upon templates** with enhanced swipe gestures, transitions
5. Create full cart view with item management
6. Handle quantity changes and removal

### Prompt Content

```markdown
## Expanded Cart View

### Context
Full cart view showing all items, quantities, and order summary. Accessible by tapping the cart bar. Users can adjust quantities, remove items, and proceed to checkout.

### Requirements

**Layout:**
```
┌─────────────────────────────┐
│ Your Cart (3)          [×]  │ ← Header
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ [img] Mohinga       [-] │ │
│ │       $12.99    1   [+] │ │ ← Cart item
│ │       Medium spice      │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ [img] Ohn No Kh...  [-] │ │
│ │       $14.99    2   [+] │ │
│ └─────────────────────────┘ │
│            ...              │
├─────────────────────────────┤
│ Subtotal           $42.97   │
│ Delivery Fee       $15.00   │ ← Or "FREE"
│ ─────────────────────────── │
│ Total              $57.97   │
├─────────────────────────────┤
│ $43 more for free delivery  │ ← If applicable
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │     Checkout $57.97     │ │ ← CTA
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Cart Item:**
- Thumbnail: 60px × 60px, rounded
- Name: var(--text-base), semibold (truncate with ellipsis)
- Price: var(--text-sm), var(--color-saffron)
- Modifiers: var(--text-xs), var(--color-charcoal-muted)
- Quantity: Inline stepper (32px buttons)
- Remove: Swipe left reveals delete, or tap quantity to 0

**Summary:**
- Subtotal: Items only
- Delivery Fee: $15 or "FREE" (jade color)
- Total: var(--font-display), 20px, bold

### States
- Default: Shows all items and totals
- Item Removed: Slide out animation
- Quantity Changed: Price updates immediately
- Empty (after removing all): "Your cart is empty" + continue shopping CTA

### Interactions
- Tap item: Opens item modal for editing
- Swipe left on item: Reveals delete button
- Tap +/-: Adjust quantity (0 removes item)
- Tap Checkout: Navigate to checkout flow
- Tap X or swipe down: Close cart view

### Constraints
- Scrollable if many items
- Checkout button always visible at bottom
- Price updates must be instant (optimistic)
- Swipe-to-delete works on touch devices only
```

### Acceptance Criteria
- [ ] Header with item count and close button
- [ ] Scrollable item list
- [ ] Cart item with thumbnail, name, price, modifiers
- [ ] Quantity stepper inline
- [ ] Swipe-to-delete functionality
- [ ] Order summary (subtotal, fee, total)
- [ ] Free delivery progress message
- [ ] Checkout CTA always visible
- [ ] Empty cart state

---

## Task 3.3: Checkout Step Indicator

**Prompt Reference**: Prompt 16 from UX-Prompts.md
**Output File**: `src/components/checkout/StepIndicator.tsx`
**Status**: ✅ Complete

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create horizontal stepper component
4. Handle step states and animations

### Prompt Content

```markdown
## Checkout Step Indicator

### Context
Horizontal progress stepper showing checkout steps: Address → Time → Review → Pay. Indicates current step, completed steps, and upcoming steps. Appears at top of checkout flow.

### Requirements

**Layout:**
```
    ●───────○───────○───────○
  Address  Time  Review   Pay
```

**Dimensions:**
- Container height: 60px
- Circle size: 24px
- Line thickness: 2px
- Padding: var(--space-4) horizontal

**Step Circle States:**
- Current: Filled var(--color-saffron), white number inside
- Completed: Filled var(--color-jade), white checkmark
- Upcoming: Outlined var(--color-border), gray number

**Connecting Lines:**
- Completed: var(--color-jade)
- Upcoming: var(--color-border)

**Labels:**
- Font: var(--font-body), var(--text-xs)
- Current/Completed: var(--color-charcoal)
- Upcoming: var(--color-charcoal-muted)
- Position: Below circles, centered

### States
- Step 1: Address filled, others outlined
- Step 2: Address check, Time filled, others outlined
- Step 3: Address/Time check, Review filled, Pay outlined
- Step 4: All checks, Pay filled

### Interactions
- Tap completed step: Navigate back to that step
- Tap current step: No action
- Tap upcoming step: No action (must complete in order)

### Constraints
- Steps cannot be skipped
- Animation on step transition (fill + checkmark)
- Must fit on mobile without horizontal scroll
- Accessible: progress announced to screen readers
```

### Acceptance Criteria
- [ ] Horizontal layout with 4 steps
- [ ] Circular step indicators
- [ ] Connecting lines between steps
- [ ] Labels below circles
- [ ] Current step styling (saffron)
- [ ] Completed step styling (jade + checkmark)
- [ ] Upcoming step styling (outlined)
- [ ] Step transition animation
- [ ] Navigate to completed steps
- [ ] Screen reader accessibility

---

## Task 3.4: Address Input

**Prompt Reference**: Prompt 17 from UX-Prompts.md
**Output File**: `src/components/checkout/AddressInput.tsx`
**Status**: ✅ Complete

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create address input with autocomplete
4. Handle coverage validation UI

### Prompt Content

```markdown
## Address Input

### Context
Address entry component with Google Places autocomplete for the checkout flow. Must validate that the address is within delivery coverage (50 miles / 90 minutes from Covina kitchen). Shows coverage map on error.

### Requirements

**Layout:**
```
┌─────────────────────────────┐
│ Delivery Address            │ ← Label
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 🔍 Enter your address   │ │ ← Input with autocomplete
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ ● 123 Main St, Covina   │ │ ← Saved address option
│ │   CA 91723              │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ ○ 456 Oak Ave, Pomona   │ │ ← Another saved address
│ │   CA 91766              │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ ✓ Address is in our         │ ← Validation result
│   delivery area             │
└─────────────────────────────┘
```

**Autocomplete Dropdown:**
- Appears as user types (after 3 characters)
- Shows Google Places suggestions
- Highlight matches in bold
- Max 5 suggestions
- Tap to select

**Saved Addresses:**
- Radio button selection
- Shows full address formatted
- Most recent first
- "Add new address" option at bottom

**Validation:**
- Triggered after address selection
- Loading state: Spinner + "Checking coverage..."
- Success: Green check + "Address is in our delivery area"
- Error: Red X + map showing coverage area

**Coverage Error:**
```
┌─────────────────────────────┐
│ ⚠️ Outside Delivery Area    │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │     [Coverage Map]      │ │ ← Shows kitchen + radius
│ └─────────────────────────┘ │
│ We deliver within 50 miles  │
│ of our Covina kitchen.      │
│                             │
│ [Try a different address]   │
└─────────────────────────────┘
```

### States
- Empty: Placeholder text, no validation
- Typing: Autocomplete dropdown visible
- Selected: Address shown, validation pending
- Validating: Spinner, input disabled
- Valid: Green check, continue enabled
- Invalid: Error message + map

### Constraints
- Google Places API for autocomplete
- Server-side coverage validation (don't trust client)
- Store new addresses to user profile
- Map shows kitchen location + coverage radius
```

### Acceptance Criteria
- [ ] Address input with placeholder
- [ ] Google Places autocomplete dropdown
- [ ] Saved addresses radio selection
- [ ] Coverage validation loading state
- [ ] Valid address success indicator
- [ ] Invalid address with coverage map
- [ ] "Add new address" option
- [ ] Error retry action

---

## Task 3.5: Time Slot Selector

**Prompt Reference**: Prompt 18 from UX-Prompts.md
**Output File**: `src/components/checkout/TimeSlotSelector.tsx`
**Status**: ✅ Complete

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create time slot grid component
4. Handle slot states and selection

### Prompt Content

```markdown
## Time Slot Selector

### Context
Delivery window selector for checkout. Shows available Saturday time slots (11AM-7PM, hourly windows). User must select when they want their order delivered.

### Requirements

**Layout:**
```
┌─────────────────────────────┐
│ Select Delivery Time        │
│ Saturday, January 18, 2026  │ ← Delivery date
├─────────────────────────────┤
│ ┌───────┐ ┌───────┐ ┌─────┐ │
│ │11-12  │ │12-1   │ │ 1-2 │ │
│ │  AM   │ │  PM   │ │ PM  │ │ ← Time slots (grid)
│ └───────┘ └───────┘ └─────┘ │
│ ┌───────┐ ┌───────┐ ┌─────┐ │
│ │ 2-3 ⭐│ │ 3-4   │ │ 4-5 │ │ ← ⭐ = Popular
│ │  PM   │ │  PM   │ │ PM  │ │
│ └───────┘ └───────┘ └─────┘ │
│ ┌───────┐ ┌───────┐         │
│ │ 5-6   │ │ 6-7   │         │
│ │  PM   │ │  PM   │         │
│ └───────┘ └───────┘         │
└─────────────────────────────┘
```

**Time Slot Card:**
- Size: ~100px × 60px (3 columns)
- Border-radius: var(--radius-md)
- Gap: var(--space-3)

**States:**
- Available: Border var(--color-border), white background
- Selected: Border var(--color-saffron), var(--color-saffron-light) background
- Popular: Small star badge in corner
- Unavailable: Gray background, strikethrough text, not clickable

**Typography:**
- Time range: var(--font-body), var(--text-base), semibold
- AM/PM: var(--font-body), var(--text-sm), normal

### States
- No Selection: All available slots shown, continue disabled
- Selected: One slot highlighted, continue enabled
- All Full: Message "All slots are full for this date"

### Interactions
- Tap slot: Selects it (deselects previous)
- Only one selection allowed

### Constraints
- Slots determined by existing orders (capacity limits)
- After Friday 3PM cutoff, show next Saturday's slots
- Popular slot (if any) marked with star
- No default selection — user must choose
```

### Acceptance Criteria
- [ ] Header with delivery date
- [ ] 3-column grid of time slots
- [ ] Available slot styling
- [ ] Selected slot styling (saffron)
- [ ] Popular slot star badge
- [ ] Unavailable slot styling (gray, strikethrough)
- [ ] Single selection only
- [ ] "All full" message when applicable
- [ ] No default selection

---

## Sprint Completion Checklist

Before marking Sprint 3 complete:

- [ ] All 5 tasks completed
- [ ] Cart bar shows/hides correctly
- [ ] Cart view manages items properly
- [ ] Checkout stepper navigates correctly
- [ ] Address autocomplete works
- [ ] Coverage validation displays properly
- [ ] Time slots selectable
- [ ] All animations smooth
- [ ] No TypeScript errors
- [ ] Visual review complete
