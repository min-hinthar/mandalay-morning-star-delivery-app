# Build-Order Prompts: Mandalay Morning Star V3

> **Source**: UX-Specs.md
> **Generated**: 2026-01-15
> **Target Tools**: v0, Bolt, Claude `/frontend-design`, or manual implementation

## Overview

Complete UI generation prompts for Mandalay Morning Star V3 — a premium Burmese food ordering platform with Customer, Driver, and Admin experiences. Build in sequence; each prompt is self-contained.

## Build Sequence

### Phase 1: Foundation (Prompts 1-3)
1. **Design Tokens - Light Theme** - CSS variables for colors, typography, spacing
2. **Design Tokens - Dark Theme** - Dark mode color palette maintaining warmth
3. **Animation Tokens & Utilities** - Motion design system with Framer Motion

### Phase 2: Layout Shell (Prompts 4-7)
4. **Customer App Shell** - Header, content area, sticky cart bar
5. **Checkout Flow Shell** - 4-step stepper layout
6. **Driver App Shell** - Mobile PWA layout with bottom actions
7. **Admin Dashboard Shell** - Desktop layout with sidebar navigation

### Phase 3: Core Components (Prompts 8-22)
8. **Button System** - All button variants (primary, secondary, ghost, danger)
9. **Input System** - Text, search, textarea, select components
10. **Card Base** - Reusable card component with variants
11. **Category Tabs** - Horizontal scrollable category navigation
12. **Menu Item Card** - Food item display with image, names, price
13. **Item Detail Modal** - Full item customization interface
14. **Sticky Cart Bar** - Persistent bottom cart summary
15. **Expanded Cart View** - Full cart with item management
16. **Checkout Step Indicator** - Progress stepper for checkout
17. **Address Input** - Autocomplete with coverage validation
18. **Time Slot Selector** - Delivery window picker
19. **Order Tracking View** - Map + timeline + ETA display
20. **Driver Route Card** - Route summary with start action
21. **Driver Stop Card** - Current delivery details and actions
22. **Admin KPI Cards** - Metrics display with comparisons

### Phase 4: Interactions (Prompts 23-27)
23. **Cart Interactions** - Add, remove, quantity adjust animations
24. **Modal Interactions** - Open/close with backdrop
25. **Tab Switching** - Category navigation with content transition
26. **Form Validation** - Inline feedback and error states
27. **Drag & Navigation** - Mobile swipe gestures

### Phase 5: States & Feedback (Prompts 28-31)
28. **Loading Skeletons** - Shimmer states for all major components
29. **Empty States** - Contextual empty views with CTAs
30. **Error States** - Inline errors, banners, retry patterns
31. **Success Feedback** - Toasts, confirmations, celebrations

### Phase 6: Polish (Prompts 32-35)
32. **Page Transitions** - Route change animations
33. **Micro-interactions** - Hover, press, toggle animations
34. **Responsive Adaptations** - Mobile/tablet/desktop breakpoints
35. **Accessibility & High-Contrast** - WCAG compliance, driver sunlight mode

---

## Prompt 1: Design Tokens - Light Theme

### Context
Foundation CSS variables for Mandalay Morning Star, a premium Burmese food delivery platform. These tokens define the visual language used throughout the customer, driver, and admin interfaces. The aesthetic is "elevated fast-casual" — warm, premium, and approachable like a refined Panda Express.

### Requirements

**Color Palette:**
```css
/* Primary */
--color-saffron: #D4A017;        /* Primary actions, CTAs, brand color */
--color-saffron-hover: #B8890F;  /* Saffron hover state */
--color-saffron-light: #FDF6E3;  /* Saffron tinted backgrounds */

/* Accent */
--color-curry: #8B4513;          /* Secondary text, icons, warm accent */
--color-lotus: #FFE4E1;          /* Soft pink for subtle backgrounds */

/* Semantic */
--color-jade: #2E8B57;           /* Success states, confirmations */
--color-jade-light: #E8F5E9;     /* Success backgrounds */
--color-error: #DC2626;          /* Error states, alerts */
--color-error-light: #FEF2F2;    /* Error backgrounds */
--color-warning: #F59E0B;        /* Warning states */
--color-warning-light: #FFFBEB;  /* Warning backgrounds */

/* Neutral */
--color-charcoal: #1A1A1A;       /* Primary text */
--color-charcoal-muted: #4A4A4A; /* Secondary text */
--color-cream: #FFFEF7;          /* Page background */
--color-cream-darker: #F5F4EF;   /* Card/elevated backgrounds */
--color-border: #E5E2D9;         /* Borders, dividers */
```

**Typography:**
```css
/* Font Families */
--font-display: "Playfair Display", Georgia, serif;
--font-body: "DM Sans", system-ui, sans-serif;
--font-burmese: "Padauk", "Noto Sans Myanmar", sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

**Spacing:**
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

**Border Radius:**
```css
--radius-sm: 0.375rem;  /* 6px - buttons, inputs */
--radius-md: 0.5rem;    /* 8px - cards */
--radius-lg: 0.75rem;   /* 12px - modals, large cards */
--radius-xl: 1rem;      /* 16px - hero sections */
--radius-full: 9999px;  /* Pills, avatars */
```

**Shadows:**
```css
--shadow-sm: 0 1px 2px rgba(26, 26, 26, 0.05);
--shadow-md: 0 4px 6px -1px rgba(26, 26, 26, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(26, 26, 26, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(26, 26, 26, 0.1);
```

### Constraints
- Use CSS custom properties (variables) for all values
- Tokens only — no component styles in this file
- Must support Tailwind CSS integration
- Include Google Fonts imports for Playfair Display, DM Sans, Padauk

---

## Prompt 2: Design Tokens - Dark Theme

### Context
Dark mode color palette for Mandalay Morning Star. Must maintain the warm, Burmese aesthetic even in dark mode — avoid cold grays. Users can toggle between light/dark manually, with system preference as default.

### Requirements

**Dark Color Palette:**
```css
[data-theme="dark"] {
  /* Primary - brighter for dark backgrounds */
  --color-saffron: #E5B523;
  --color-saffron-hover: #F5C533;
  --color-saffron-light: #2A2418;

  /* Accent - warmer tones */
  --color-curry: #C4875A;
  --color-lotus: #3D2A28;

  /* Semantic - brighter for visibility */
  --color-jade: #4ADE80;
  --color-jade-light: #1A2E1A;
  --color-error: #F87171;
  --color-error-light: #2D1A1A;
  --color-warning: #FBBF24;
  --color-warning-light: #2D2A1A;

  /* Neutral - inverted */
  --color-charcoal: #F5F5F5;
  --color-charcoal-muted: #A3A3A3;
  --color-cream: #1A1918;
  --color-cream-darker: #252423;
  --color-border: #3D3B38;
}
```

### Implementation
- Use `data-theme` attribute on `<html>` element
- Check `prefers-color-scheme` media query for initial state
- Store user preference in localStorage
- Transition colors smoothly (200ms) on theme change

### Constraints
- Same variable names as light theme — only values change
- Maintain 4.5:1 contrast ratio for text
- Warm undertones required — no pure gray (#333, #666, etc.)

---

## Prompt 3: Animation Tokens & Utilities

### Context
Motion design system for Mandalay Morning Star using Framer Motion. Animations should feel premium and intentional — rich motion throughout the app for a delightful experience. Used for page transitions, micro-interactions, and celebrations.

### Requirements

**Duration Tokens:**
```css
--duration-micro: 150ms;     /* Hover, toggles, quick feedback */
--duration-standard: 300ms;  /* Page transitions, modals */
--duration-dramatic: 500ms;  /* Celebrations, hero animations */
```

**Easing Functions:**
```css
--ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);           /* Decelerate */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);          /* Smooth */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Playful */
```

**Framer Motion Variants:**
```typescript
// Fade in
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 }
};

// Slide up (for cards, content)
const slideUp = {
  initial: { y: 10, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -10, opacity: 0 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};

// Scale in (for modals)
const scaleIn = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
  transition: { duration: 0.3 }
};

// Stagger children
const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
};
```

**Keyframe Animations (CSS):**
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes confetti {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
}
```

### Constraints
- All animations must respect `prefers-reduced-motion`
- Provide static fallbacks for reduced motion users
- No animation longer than 500ms (except confetti celebration)
- Export as reusable Framer Motion variants

---

## Prompt 4: Customer App Shell

### Context
Main layout wrapper for the customer ordering experience. Mobile-first design for a Burmese food delivery platform. Users browse menu, add items to cart, and checkout for Saturday delivery.

### Requirements

**Structure:**
```
┌─────────────────────────────┐
│ Header (sticky, 56px)       │
├─────────────────────────────┤
│                             │
│ Main Content                │
│ (scrollable)                │
│                             │
├─────────────────────────────┤
│ Cart Bar (sticky, 64px)     │
└─────────────────────────────┘
```

**Header:**
- Height: 56px
- Position: sticky top
- Background: var(--color-cream) with subtle shadow on scroll
- Contents: Logo (left), Search icon (center-right), Account avatar (right)
- Z-index: 50

**Main Content:**
- Full width
- Padding: 0 (pages handle their own padding)
- Min-height: calc(100vh - 56px - 64px)
- Background: var(--color-cream)

**Cart Bar:**
- Height: 64px (plus safe area padding on iOS)
- Position: sticky bottom
- Background: var(--color-cream-darker)
- Shadow: var(--shadow-lg) pointing upward
- Z-index: 40
- Hidden when cart is empty

**Responsive Behavior:**
- Mobile (< 640px): As described above
- Tablet (640-1023px): Same layout, wider content
- Desktop (1024px+): Max-width 1280px, centered, optional sidebar

### States
- Default: Header + content + cart bar
- Empty Cart: Cart bar hidden, content fills remaining space
- Scrolled: Header gains shadow

### Constraints
- Mobile-first implementation
- Use CSS Grid or Flexbox for layout
- Cart bar must account for iOS safe areas (env(safe-area-inset-bottom))
- No horizontal scroll

---

## Prompt 5: Checkout Flow Shell

### Context
4-step checkout layout for Mandalay Morning Star. Steps are: Address → Time → Review → Pay. Linear flow with ability to go back. Mobile-first with horizontal stepper.

### Requirements

**Structure:**
```
┌─────────────────────────────┐
│ ← Back    Checkout    [X]   │ ← Header
├─────────────────────────────┤
│ ● ─── ○ ─── ○ ─── ○         │ ← Step indicator
│ Address Time Review  Pay    │
├─────────────────────────────┤
│                             │
│ Step Content                │
│ (scrollable)                │
│                             │
├─────────────────────────────┤
│ [Continue to Time →]        │ ← Action button
└─────────────────────────────┘
```

**Header:**
- Height: 56px
- Back arrow (left) — returns to previous step or cart
- "Checkout" title (center)
- Close X (right) — returns to menu with confirmation

**Step Indicator:**
- Horizontal stepper
- Current step: filled circle (var(--color-saffron))
- Completed steps: checkmark in jade circle
- Future steps: outlined circle (var(--color-border))
- Connecting lines between steps
- Step labels below circles

**Step Content:**
- Full width with padding (var(--space-4))
- Scrollable if content exceeds viewport
- Each step is a separate component

**Action Button:**
- Full-width primary button
- Height: 48px
- Fixed at bottom (above safe area)
- Text changes per step: "Continue to Time", "Continue to Review", "Review Order", "Pay $XX.XX"
- Disabled state when step is incomplete

### States
- Step 1 (Address): Address input or selection
- Step 2 (Time): Time slot selection
- Step 3 (Review): Order summary
- Step 4 (Pay): Stripe redirect state

### Constraints
- Steps must be completeable in order
- Back button works at all steps
- Close X should confirm before abandoning checkout
- Mobile: vertical stack; Desktop: can show sidebar summary

---

## Prompt 6: Driver App Shell

### Context
Mobile PWA layout for delivery drivers. Optimized for one-handed use while driving. Large touch targets, glanceable information, and offline support indicators. Used on Saturday delivery routes.

### Requirements

**Structure:**
```
┌─────────────────────────────┐
│ Mandalay     [☀️] [⚙️]      │ ← Header (48px)
├─────────────────────────────┤
│                             │
│ Main Content                │
│ (scrollable)                │
│                             │
├─────────────────────────────┤
│ [   Primary Action   ]      │ ← Action area (80px)
│ [Secondary] [Secondary]     │
└─────────────────────────────┘
```

**Header:**
- Height: 48px
- Logo/wordmark (left)
- High-contrast toggle icon (right) — sun icon
- Settings gear (right)
- Offline indicator (appears left of icons when offline)
- Background: var(--color-cream)

**Main Content:**
- Full width with padding (var(--space-4))
- Scrollable
- Background: var(--color-cream)

**Action Area:**
- Height: 80px (plus safe area)
- Primary action button: Large (56px height), full width
- Secondary actions: Two buttons below, each 50% width, 44px height
- Background: var(--color-cream-darker)
- Fixed to bottom

**Touch Targets:**
- Minimum 56px for primary actions
- Minimum 44px for all other interactive elements

### States
- No Route: Shows "No route assigned" message
- Route Ready: Shows route summary card
- Active Route: Shows current stop card
- Route Complete: Shows summary stats

### Constraints
- Large text (minimum 16px body, 20px headings)
- High contrast by default (can be increased)
- Offline indicator must be prominent when active
- One-handed use: primary actions at bottom

---

## Prompt 7: Admin Dashboard Shell

### Context
Desktop-first dashboard for kitchen administrators managing Saturday deliveries. Shows real-time operations, driver progress, exceptions, and key metrics. Single unified view without requiring navigation between real-time and analytics.

### Requirements

**Structure:**
```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo]  Dashboard | Orders | Drivers | Analytics | Menu         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Main Content Area (full width, scrollable)                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Navigation:**
- Height: 64px
- Logo (left)
- Nav items (center): Dashboard, Orders, Drivers, Analytics, Menu
- Current page: underline + var(--color-saffron) text
- User avatar + dropdown (right)
- Background: var(--color-cream)
- Border-bottom: 1px var(--color-border)

**Main Content:**
- Full width
- Padding: var(--space-6)
- Background: var(--color-cream)
- Max-width: 1536px, centered on very large screens

**Dashboard Grid (when on Dashboard):**
```
┌──────────┬──────────┬──────────┬──────────┐
│ KPI 1    │ KPI 2    │ KPI 3    │ KPI 4    │  ← KPI row
├──────────┴──────────┼──────────┴──────────┤
│                     │                     │
│ Live Map            │ Exceptions          │  ← Main row (60% / 40%)
│                     │                     │
├─────────────────────┴─────────────────────┤
│ Driver Progress Cards                      │  ← Full width
└───────────────────────────────────────────┘
```

### States
- Default: Dashboard with live data
- Loading: Skeleton placeholders
- No Data: "No operations today" with link to historical

### Constraints
- Desktop-first (minimum 1024px viewport)
- All dashboard content visible above fold on 1080p
- Real-time updates via subscriptions (no manual refresh)
- Exceptions always visible without scrolling

---

## Prompt 8: Button System

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

---

## Prompt 9: Input System

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

---

## Prompt 10: Card Base

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

---

## Prompt 11: Category Tabs

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

---

## Prompt 12: Menu Item Card

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

---

## Prompt 13: Item Detail Modal

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

---

## Prompt 14: Sticky Cart Bar

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

---

## Prompt 15: Expanded Cart View

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

---

## Prompt 16: Checkout Step Indicator

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

---

## Prompt 17: Address Input

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

---

## Prompt 18: Time Slot Selector

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

---

## Prompt 19: Order Tracking View

### Context
Real-time order tracking page showing order status, driver location on map, and estimated arrival time. Customers access this after ordering and during delivery.

### Requirements

**Layout:**
```
┌─────────────────────────────┐
│ Order #12345      [Contact] │ ← Header
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │       Live Map          │ │ ← 40% viewport
│ │     🚗 Driver pin       │ │
│ │     📍 Destination      │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ Arriving in ~15 min         │ ← ETA (large)
│ Driver: John D.             │
├─────────────────────────────┤
│ ● Confirmed        10:30 AM │
│ ● Preparing        11:00 AM │ ← Status timeline
│ ● Out for Delivery 2:15 PM  │
│ ○ Delivered        --:--    │
├─────────────────────────────┤
│ Your Order                  │
│ ├ 2x Mohinga                │ ← Collapsible
│ ├ 1x Ohn No Khao Swe       │
│ └ 1x Tea Leaf Salad         │
└─────────────────────────────┘
```

**Map:**
- Height: 40% viewport (min 200px, max 300px)
- Shows: Driver location (car icon), destination (pin)
- Route line: var(--color-saffron) dashed line
- Updates: Real-time driver location

**ETA Display:**
- Large text: var(--font-display), 28px
- Format: "Arriving in ~X min" or "Arriving soon"
- Driver name below

**Status Timeline:**
- Vertical timeline with dots and lines
- Completed: Filled dot (var(--color-jade)), solid line, timestamp
- Current: Filled dot (var(--color-saffron)), pulsing
- Upcoming: Outlined dot, dashed line, "--:--"

**Statuses:**
1. Confirmed (order placed)
2. Preparing (kitchen working)
3. Out for Delivery (driver has it)
4. Delivered (complete)

### States
- Preparing: Map shows kitchen location, "Preparing your order"
- Out for Delivery: Map shows driver, ETA updates
- Delivered: "Delivered at X:XX PM", feedback prompt

### Interactions
- Tap Contact: Opens call/message options
- Tap map: Expands to full screen
- Pull to refresh: Updates status (also auto-updates)

### Constraints
- Map requires driver location data (subscription)
- ETA calculated from driver position + traffic
- Graceful degradation if GPS unavailable
- Auto-refresh every 30 seconds

---

## Prompt 20: Driver Route Card

### Context
Summary card shown to drivers before starting their Saturday delivery route. Displays total stops, estimated duration, and start action. Appears on driver home screen.

### Requirements

**Layout:**
```
┌─────────────────────────────┐
│ Saturday, January 18        │ ← Date
├─────────────────────────────┤
│                             │
│        12 stops             │ ← Large number
│                             │
│  Est. 4 hours               │ ← Duration
│  Start: 11:00 AM            │ ← Start time
│                             │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │      Start Route        │ │ ← Primary CTA (large)
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Card Styling:**
- Background: white
- Border-radius: var(--radius-lg)
- Shadow: var(--shadow-md)
- Padding: var(--space-6)
- Margin: var(--space-4)

**Typography:**
- Date: var(--font-body), var(--text-lg), semibold
- Stop count: var(--font-display), 48px, bold
- "stops" label: var(--text-lg), normal, muted
- Duration/Start: var(--text-base), normal

**Start Route Button:**
- Height: 56px (driver large button)
- Full width
- Primary style (saffron)
- Large text (18px)

### States
- Route Ready: Card shown with start button
- Route Started: Card replaced with active route view
- No Route: Different card showing "No route assigned today"
- Route Complete: Card shows "Route complete!" with stats summary

### Interactions
- Tap Start Route: Transitions to first stop view
- Card is not interactive otherwise

### Constraints
- Stop count and duration come from route data
- Start time is recommended start, not enforced
- Route can be started anytime Saturday morning
- Card should feel calm and clear (not rushed)

---

## Prompt 21: Driver Stop Card

### Context
Current delivery stop card showing address, customer info, items to deliver, and actions. This is the primary view while on an active route. Large touch targets for use while driving.

### Requirements

**Layout:**
```
┌─────────────────────────────┐
│ Stop 3 of 12                │ ← Progress
│ ████████░░░░░░ 25%          │ ← Progress bar
├─────────────────────────────┤
│ 789 Pine Road               │ ← Address (large)
│ Apt 4B                      │
│ Covina, CA 91723            │
├─────────────────────────────┤
│ Window: 12:00 - 1:00 PM     │ ← Time window
│ Customer: Jane D.           │ ← Name
│ 📞 (626) 555-1234           │ ← Phone (tappable)
├─────────────────────────────┤
│ Note: "Gate code: 1234"     │ ← Customer note (highlighted)
├─────────────────────────────┤
│ Items to Deliver            │
│ • 2x Mohinga                │
│ • 1x Ohn No Khao Swe       │ ← Items list
│ • 1x Tea Leaf Salad         │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │      Navigate 📍        │ │ ← Primary: Opens maps
│ └─────────────────────────┘ │
│ ┌───────────┐ ┌───────────┐ │
│ │  Arrived  │ │   Issue   │ │ ← Secondary actions
│ └───────────┘ └───────────┘ │
└─────────────────────────────┘
```

**Progress Bar:**
- Height: 8px
- Fill: var(--color-jade)
- Track: var(--color-border)
- Border-radius: full

**Address Section:**
- Large text: var(--text-xl), bold
- Tappable to copy to clipboard
- Should be glanceable

**Customer Note:**
- Background: var(--color-warning-light)
- Border-left: 4px var(--color-warning)
- Padding: var(--space-3)
- Always visible (important info)

**Actions:**
- Navigate: Primary, 56px height, launches Google Maps
- Arrived: Secondary, 44px, marks arrival
- Issue: Secondary, 44px, opens exception modal

### States
- Navigating: "Navigate" is primary action
- Arrived: "Arrived" pressed → "Complete" becomes primary
- At Door: Photo capture, then "Complete Delivery"
- Exception: Modal for selecting reason

### Interactions
- Tap Navigate: Opens Google Maps with destination
- Tap Phone: Initiates phone call
- Tap Arrived: Updates status, enables photo capture
- Tap Issue: Opens exception selection modal

### Constraints
- All touch targets minimum 44px (56px for primary)
- Address and phone must be tappable
- Note is always visible (never collapsed)
- Works offline (queues status updates)

---

## Prompt 22: Admin KPI Cards

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

---

## Prompt 23: Cart Interactions

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

---

## Prompt 24: Modal Interactions

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

---

## Prompt 25: Tab Switching

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

---

## Prompt 26: Form Validation

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

---

## Prompt 27: Mobile Swipe Gestures

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

---

## Prompt 28: Loading Skeletons

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

---

## Prompt 29: Empty States

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

---

## Prompt 30: Error States

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

---

## Prompt 31: Success Feedback

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

---

## Prompt 32: Page Transitions

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

---

## Prompt 33: Micro-interactions

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

---

## Prompt 34: Responsive Adaptations

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

---

## Prompt 35: Accessibility & High-Contrast

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

---

## Quality Verification Checklist

### Foundation Coverage
- [x] Light theme tokens defined
- [x] Dark theme tokens defined
- [x] Animation tokens defined
- [x] Typography scale complete
- [x] Spacing scale complete

### Layout Coverage
- [x] Customer app shell
- [x] Checkout flow shell
- [x] Driver app shell
- [x] Admin dashboard shell

### Component Coverage
- [x] Button system
- [x] Input system
- [x] Card base
- [x] Category tabs
- [x] Menu item card
- [x] Item detail modal
- [x] Cart bar (sticky)
- [x] Cart view (expanded)
- [x] Checkout stepper
- [x] Address input
- [x] Time slot selector
- [x] Order tracking
- [x] Driver route card
- [x] Driver stop card
- [x] Admin KPI cards

### Interaction Coverage
- [x] Cart interactions
- [x] Modal interactions
- [x] Tab switching
- [x] Form validation
- [x] Swipe gestures

### State Coverage
- [x] Loading skeletons
- [x] Empty states
- [x] Error states
- [x] Success feedback

### Polish Coverage
- [x] Page transitions
- [x] Micro-interactions
- [x] Responsive adaptations
- [x] Accessibility

### Self-Containment Verified
- [x] No prompt references another prompt
- [x] All measurements are explicit
- [x] All states are documented
- [x] All interactions are specified

---

## Usage Instructions

### With v0 (Vercel)
1. Copy a single prompt
2. Paste into v0.dev
3. Iterate on result
4. Export code

### With Bolt
1. Start new project
2. Paste Foundation prompts first
3. Build up component by component

### With Claude /frontend-design
1. Run `/frontend-design`
2. Paste prompt content
3. Review generated code
4. Iterate as needed

### Manual Implementation
1. Use prompts as specifications
2. Reference for all values/states
3. Check off as you build

**Build in order. Each prompt assumes previous prompts are complete.**
