# Sprint 2: Base UI Components

> **Prompts**: 8-13 from UX-Prompts.md
> **Dependencies**: Sprint 1 (design tokens, layouts)
> **Focus**: Core UI components and menu browsing elements

## Overview

This sprint builds the foundational UI components used throughout the app: buttons, inputs, cards, and menu-specific components. These are the building blocks for all features.

## Sprint Progress

| Task | Component | Status | Output |
|------|-----------|--------|--------|
| 2.1 | Button System | ✅ Complete | `src/components/ui/button.tsx` |
| 2.2 | Input System | ✅ Complete | `src/components/ui/input.tsx`, `search-input.tsx` |
| 2.3 | Card Base | ✅ Complete | `src/components/ui/card.tsx` |
| 2.4 | Category Tabs | ✅ Complete | `src/components/menu/category-tabs.tsx` |
| 2.5 | Menu Item Card | ✅ Complete | `src/components/menu/menu-item-card.tsx` |
| 2.6 | Item Detail Modal | ✅ Complete | `src/components/menu/item-detail-modal.tsx` |

> Update status: ⬜ Not Started → 🔄 In Progress → ✅ Complete
>
> **Sprint 2 Complete!** All 6 tasks implemented with V3 design tokens.

---

## Task 2.1: Button System

**Prompt Reference**: Prompt 8 from UX-Prompts.md
**Output File**: `src/components/ui/Button.tsx`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create all button variants and sizes
4. Export typed component

### Prompt Content

```markdown
## Button System

### Context
Complete button component system for Mandalay Morning Star. Buttons are the primary interactive elements across customer, driver, and admin interfaces. Saffron (gold) is the primary action color.

### Requirements

**Variants:**

| Variant | Background | Text | Border | Use Case |
|---------|------------|------|--------|----------|
| Primary | var(--color-saffron) | white | none | Main CTAs |
| Secondary | white | var(--color-charcoal) | 1px var(--color-saffron) | Supporting actions |
| Ghost | transparent | var(--color-charcoal) | none | Subtle actions |
| Danger | var(--color-error) | white | none | Destructive actions |

**Sizes:**

| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| sm | 32px | 12px 16px | 14px |
| md | 40px | 12px 20px | 16px |
| lg | 48px | 16px 24px | 16px |
| xl | 56px | 16px 32px | 18px (driver) |

**States:**
- Default: As specified per variant
- Hover: Darken background 10% (primary) or add light saffron bg (secondary/ghost)
- Active/Pressed: Scale to 0.98, darken 15%
- Focused: 2px offset ring in var(--color-saffron)
- Disabled: 50% opacity, cursor not-allowed
- Loading: Spinner replaces text, maintain width

**Anatomy:**
- Optional left icon (16px, 8px gap)
- Label text (font-medium)
- Optional right icon (16px, 8px gap)
- Border-radius: var(--radius-sm)

### Interactions
- Click: Triggers action
- Keyboard: Enter/Space activates
- Tab: Receives focus

### Constraints
- All buttons must have visible focus state
- Loading state must not change button dimensions
- Icon-only buttons need aria-label
- Minimum touch target: 44px (even if button is smaller, tap area extends)
```

### Acceptance Criteria
- [ ] All 4 variants implemented (primary, secondary, ghost, danger)
- [ ] All 4 sizes implemented (sm, md, lg, xl)
- [ ] All states (hover, active, focus, disabled, loading)
- [ ] Icon support (left, right, icon-only)
- [ ] Accessible (focus ring, aria-label for icon-only)
- [ ] TypeScript props interface

---

## Task 2.2: Input System

**Prompt Reference**: Prompt 9 from UX-Prompts.md
**Output Files**: `src/components/ui/Input.tsx`, `src/components/ui/Select.tsx`, `src/components/ui/Checkbox.tsx`, `src/components/ui/Radio.tsx`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create all input component variants
4. Ensure consistent styling

### Prompt Content

```markdown
## Input System

### Context
Form input components for Mandalay Morning Star. Used in checkout (address, notes), search, and admin interfaces. Inputs should feel refined and match the premium aesthetic.

### Requirements

**Text Input:**
- Height: 44px
- Padding: 12px 16px
- Border: 1px var(--color-border)
- Border-radius: var(--radius-sm)
- Font: var(--font-body), var(--text-base)
- Placeholder: var(--color-charcoal-muted)

**States:**
- Default: Border var(--color-border)
- Focused: Border var(--color-saffron), subtle shadow
- Error: Border var(--color-error), error message below
- Disabled: Background var(--color-cream-darker), 50% opacity

**Search Input:**
- Same as text input
- Search icon (left, inside padding)
- Clear X button (right, appears when has value)
- Height: 44px

**Textarea:**
- Same styling as text input
- Min-height: 88px
- Resize: vertical only
- Auto-grow option

**Select:**
- Same styling as text input
- Chevron icon (right)
- Dropdown: var(--color-cream) background, var(--shadow-lg)
- Options: 44px height each, hover highlight

**Checkbox:**
- Size: 20px × 20px
- Unchecked: Border var(--color-border), white background
- Checked: Background var(--color-saffron), white checkmark
- Focus: Ring around checkbox

**Radio:**
- Size: 20px × 20px
- Unselected: Border var(--color-border), white background
- Selected: Border var(--color-saffron), inner dot var(--color-saffron)
- Focus: Ring around radio

### Constraints
- All inputs must have associated labels
- Error messages appear below input, not as tooltips
- Inputs must work with form autofill
- 44px minimum height for touch targets
```

### Acceptance Criteria
- [ ] Text input with all states
- [ ] Search input with icon and clear button
- [ ] Textarea with auto-grow option
- [ ] Select dropdown with options
- [ ] Checkbox with checked animation
- [ ] Radio button with selection
- [ ] Error state handling
- [ ] Label association

---

## Task 2.3: Card Base

**Prompt Reference**: Prompt 10 from UX-Prompts.md
**Output File**: `src/components/ui/Card.tsx`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create card component with variants
4. Handle interactive states

### Prompt Content

```markdown
## Card Base

### Context
Reusable card component that serves as the foundation for menu items, order cards, driver cards, etc. Cards are the primary content container throughout the app.

### Requirements

**Base Card:**
- Background: var(--color-cream-darker) or white
- Border-radius: var(--radius-md) (8px)
- Border: none (use shadow for elevation)
- Shadow: var(--shadow-sm)
- Padding: var(--space-4)

**Variants:**

| Variant | Shadow | Border | Use Case |
|---------|--------|--------|----------|
| Flat | none | 1px var(--color-border) | List items |
| Elevated | var(--shadow-md) | none | Standalone cards |
| Interactive | var(--shadow-sm) → var(--shadow-md) on hover | none | Clickable cards |
| Alert | none | 4px left border (color varies) | Exception cards |

**Interactive Card States:**
- Default: var(--shadow-sm)
- Hover: var(--shadow-md), scale 1.01, cursor pointer
- Active: var(--shadow-sm), scale 0.99
- Focused: 2px outline var(--color-saffron)

**Alert Card Accent Colors:**
- Error: var(--color-error) left border
- Warning: var(--color-warning) left border
- Success: var(--color-jade) left border
- Info: var(--color-saffron) left border

### Constraints
- Cards should not have both border and shadow
- Interactive cards need keyboard support (role="button", tabIndex)
- Content padding is consistent (var(--space-4))
- Cards stack vertically with var(--space-3) gap
```

### Acceptance Criteria
- [ ] Base card styling
- [ ] All 4 variants (flat, elevated, interactive, alert)
- [ ] Interactive hover/active/focus states
- [ ] Alert accent colors
- [ ] Keyboard accessibility for interactive cards
- [ ] Consistent padding and spacing

---

## Task 2.4: Category Tabs

**Prompt Reference**: Prompt 11 from UX-Prompts.md
**Output File**: `src/components/menu/CategoryTabs.tsx`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create horizontally scrollable tabs
4. Handle active state and scroll indicators

### Prompt Content

```markdown
## Category Tabs

### Context
Horizontal scrollable category navigation for the menu page. Categories include Curries, Noodles, Soups, Salads, Desserts, Drinks, etc. Tapping a category filters the menu to show only items in that category.

### Requirements

**Container:**
- Full width
- Height: 48px
- Background: var(--color-cream)
- Horizontal scroll with hidden scrollbar
- Sticky below header on scroll
- Padding: 0 var(--space-4)
- Gap between tabs: var(--space-2)

**Tab Item:**
- Height: 40px
- Padding: 0 var(--space-4)
- Border-radius: var(--radius-full) (pill shape)
- Font: var(--font-body), var(--text-sm), var(--font-medium)
- White-space: nowrap

**States:**
- Inactive: Background transparent, text var(--color-charcoal-muted)
- Active: Background var(--color-saffron-light), text var(--color-saffron), border-bottom 2px var(--color-saffron)
- Hover (inactive): Background var(--color-cream-darker)

**Scroll Indicators:**
- Fade gradient on edges when scrollable
- Left: gradient from var(--color-cream) to transparent
- Right: gradient from transparent to var(--color-cream)
- Only show when content overflows in that direction

### Interactions
- Tap: Selects category, scrolls tab into view
- Swipe: Scrolls tabs horizontally
- Keyboard: Arrow keys navigate between tabs

### Constraints
- Maximum 8 visible categories initially
- Active tab should scroll into view when selected
- First tab selected by default ("All" or first category)
- Tab order should match menu section order
```

### Acceptance Criteria
- [ ] Horizontal scrollable container
- [ ] Pill-shaped tabs
- [ ] Active/inactive/hover states
- [ ] Scroll fade indicators
- [ ] Auto-scroll active tab into view
- [ ] Keyboard navigation
- [ ] Sticky positioning

---

## Task 2.5: Menu Item Card

**Prompt Reference**: Prompt 12 from UX-Prompts.md
**Output File**: `src/components/menu/MenuItemCard.tsx`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create card with image, names, price, allergens
4. Handle favorite toggle and states

### Prompt Content

```markdown
## Menu Item Card

### Context
Card component displaying a menu item on the browse page. Shows food image, English name, Burmese name (equal prominence), price, and allergen indicators. Tapping opens the item detail modal.

### Requirements

**Layout:**
```
┌─────────────────────────────┐
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │    Food Image           │ │ ← 16:9 aspect ratio
│ │                    [♡]  │ │ ← Heart icon top-right
│ └─────────────────────────┘ │
│ Mohinga                     │ ← English name
│ မုန့်ဟင်းခါး                │ ← Burmese name
│ $12.99         🥜 🌶️ 🐟    │ ← Price + allergen icons
└─────────────────────────────┘
```

**Dimensions:**
- Width: 100% of grid column (2-column grid on mobile)
- Image: 16:9 aspect ratio, fills width
- Border-radius: var(--radius-lg) on image, var(--radius-md) on card
- Padding: var(--space-3)
- Gap: var(--space-2) between elements

**Typography:**
- English name: var(--font-body), var(--text-base), var(--font-semibold), var(--color-charcoal)
- Burmese name: var(--font-burmese), var(--text-sm), var(--font-normal), var(--color-charcoal-muted)
- Price: var(--font-display), var(--text-lg), var(--font-semibold), var(--color-saffron)

**Allergen Icons:**
- Size: 16px
- Display: Row, right-aligned with price
- Common icons: 🥜 (nuts), 🌶️ (spicy), 🐟 (fish), 🦐 (shellfish), 🥛 (dairy), 🌾 (gluten)

**Heart (Favorite) Icon:**
- Position: Top-right of image, 8px inset
- Size: 24px tap target, 20px icon
- Default: Outline heart, white with drop shadow
- Favorited: Filled heart, var(--color-error)

### States
- Default: As described
- Hover: Card lifts (shadow-md, scale 1.02)
- Loading: Skeleton image + text placeholders with shimmer
- Sold Out: Grayscale image, "Sold Out" badge overlay

### Interactions
- Tap card: Opens item detail modal
- Tap heart: Toggles favorite (with animation)
- Long press: Quick add to cart (optional)

### Constraints
- Images lazy-load with placeholder
- Missing images show category-specific placeholder
- Both names must be visible — no truncation
- Card must be fully tappable (not just image)
```

### Acceptance Criteria
- [ ] 16:9 image with lazy loading
- [ ] English and Burmese names displayed
- [ ] Price in saffron with display font
- [ ] Allergen icons row
- [ ] Favorite heart toggle with animation
- [ ] Hover lift effect
- [ ] Skeleton loading state
- [ ] Sold out state

---

## Task 2.6: Item Detail Modal

**Prompt Reference**: Prompt 13 from UX-Prompts.md
**Output File**: `src/components/menu/ItemDetailModal.tsx`
**Status**: ⬜ Not Started

### Reference Asset
> **Template** (improve upon this):
> - [Item-Detail-Modal/screen.png](../../UI-Assets/P1-Foundation/Item-Detail-Modal/screen.png) | [code.html](../../UI-Assets/P1-Foundation/Item-Detail-Modal/code.html)

### Implementation Guide
1. **Review template** — screen.png for visuals, code.html for structure
2. Run `/frontend-design`
3. Paste the prompt content below
4. **Improve upon template** with enhanced animations, accessibility
5. Create full item customization modal
6. Handle modifier selection and quantity

### Prompt Content

```markdown
## Item Detail Modal

### Context
Full-screen modal for viewing and customizing a menu item. Opens when tapping a menu item card. Users select modifiers (spice level, add-ons), adjust quantity, and add to cart. Hero image dominates — let the food sell itself.

### Requirements

**Layout (Mobile):**
```
┌─────────────────────────────┐
│                         [X] │ ← Close button
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │    Large Food Photo     │ │ ← 60% viewport height max
│ │                         │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ Mohinga                     │ ← English (Playfair, 24px)
│ မုန့်ဟင်းခါး                │ ← Burmese (Padauk, 18px)
│ $12.99                      │ ← Price (Playfair, 24px, saffron)
├─────────────────────────────┤
│ Traditional rice noodle...  │ ← Description (DM Sans, 14px)
├─────────────────────────────┤
│ 🥜 Contains peanuts         │
│ 🐟 Contains fish            │ ← Allergen list
├─────────────────────────────┤
│ Spice Level                 │
│ ○ Mild  ● Medium  ○ Hot     │ ← Radio group
├─────────────────────────────┤
│ Add-ons                     │
│ ☑ Extra fish cake (+$2)    │ ← Checkbox group
│ ☐ Extra noodles (+$1)      │
├─────────────────────────────┤
│ Special Instructions        │
│ ┌─────────────────────────┐ │
│ │ Optional notes...       │ │ ← Textarea
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ [-]    1    [+]             │ ← Quantity (center)
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │  Add to Cart - $14.99   │ │ ← Primary CTA
│ └─────────────────────────┘ │
│ $85 more for free delivery  │ ← Incentive message
└─────────────────────────────┘
```

**Modal Behavior:**
- Opens from bottom (slide up animation)
- Full screen on mobile, centered modal (max 600px) on desktop
- Scrollable content, fixed bottom CTA
- Close via X button, swipe down, or backdrop tap (desktop)

**Typography:**
- English name: var(--font-display), 24px, semibold
- Burmese name: var(--font-burmese), 18px, normal
- Price: var(--font-display), 24px, semibold, var(--color-saffron)
- Description: var(--font-body), 14px, normal, var(--color-charcoal-muted)

**Quantity Selector:**
- Button size: 40px × 40px
- Number: 24px, semibold, center
- Disabled state for minus at quantity 1

**Add to Cart Button:**
- Full width, 48px height
- Primary button style
- Shows updated price with modifiers
- Success animation on tap (scale + check)

### States
- Default: Quantity 1, default modifier selected
- Customized: Price updates as modifiers change
- Adding: Button shows loading spinner
- Added: Brief success state, then auto-close

### Interactions
- Swipe down: Closes modal (mobile)
- Tap backdrop: Closes modal (desktop)
- Escape key: Closes modal
- Form changes: Update total price in real-time

### Constraints
- Image must load quickly (optimized sizes)
- Price calculation happens client-side for preview, confirmed server-side
- Notes field has 200 character limit
- Quantity has no upper limit (per clarification)
```

### Acceptance Criteria
- [ ] Hero image (60% viewport max)
- [ ] English and Burmese names with correct fonts
- [ ] Description and allergen list
- [ ] Spice level radio selection
- [ ] Add-ons checkbox selection
- [ ] Special instructions textarea
- [ ] Quantity selector
- [ ] Real-time price updates
- [ ] Add to cart with success animation
- [ ] Free delivery incentive message
- [ ] Slide up animation (mobile)
- [ ] Swipe to close (mobile)

---

## Sprint Completion Checklist

Before marking Sprint 2 complete:

- [ ] All 6 tasks completed
- [ ] Button variants tested in all contexts
- [ ] Input components handle all states
- [ ] Cards responsive and accessible
- [ ] Category tabs scroll smoothly
- [ ] Menu item cards display correctly
- [ ] Item modal customization works
- [ ] No TypeScript errors
- [ ] Visual review complete
