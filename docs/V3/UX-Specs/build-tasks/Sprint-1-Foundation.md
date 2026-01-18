# Sprint 1: Foundation & Layout

> **Prompts**: 1-7 from UX-Prompts.md
> **Dependencies**: None (start here)
> **Focus**: Design tokens, animation utilities, app shells

## Overview

This sprint establishes the visual and structural foundation for the entire V3 UI. Everything else depends on these tokens and layouts being in place first.

## Sprint Progress

| Task | Component | Status | Reference Asset |
|------|-----------|--------|-----------------|
| 1.1 | Design Tokens - Light Theme | 🎨 Prototype Ready | [Light-Theme.md](../../UI-Assets/P1-Foundation/Light-Theme.md) |
| 1.2 | Design Tokens - Dark Theme | 🎨 Prototype Ready | [Dark-Theme.md](../../UI-Assets/P1-Foundation/Dark-Theme.md) |
| 1.3 | Animation Tokens & Utilities | ⬜ Not Started | — |
| 1.4 | Customer App Shell | ⬜ Not Started | — |
| 1.5 | Checkout Flow Shell | ⬜ Not Started | — |
| 1.6 | Driver App Shell | ⬜ Not Started | — |
| 1.7 | Admin Dashboard Shell | ⬜ Not Started | — |

> Update status: ⬜ Not Started → 🔄 In Progress → 🎨 Prototype Ready → ✅ Complete

---

## P1-Foundation UI Assets

Design prototypes serve as visual reference. **`/frontend-design` should improve upon these templates** with enhanced aesthetics, animations, and polish.

| Asset | Description | Files |
|-------|-------------|-------|
| **Design Tokens 1** | Color palette, typography showcase | [code.html](../../UI-Assets/P1-Foundation/Design-Tokens-1/code.html) / [screen.png](../../UI-Assets/P1-Foundation/Design-Tokens-1/screen.png) |
| **Design Tokens 2** | Component samples, spacing | [code.html](../../UI-Assets/P1-Foundation/Design-Tokens-2/code.html) / [screen.png](../../UI-Assets/P1-Foundation/Design-Tokens-2/screen.png) |
| **Design Tokens 3** | Extended tokens, variants | [code.html](../../UI-Assets/P1-Foundation/Design-Tokens-3/code.html) / [screen.png](../../UI-Assets/P1-Foundation/Design-Tokens-3/screen.png) |
| **Light Theme** | Primary brand colors + component showcase | [MD](../../UI-Assets/P1-Foundation/Light-Theme.md) / [PNG](../../UI-Assets/P1-Foundation/Light-Theme.png) |
| **Dark Theme** | Dark mode with warm undertones | [MD](../../UI-Assets/P1-Foundation/Dark-Theme.md) / [PNG](../../UI-Assets/P1-Foundation/Dark-Theme.png) |

### Finalized Design Tokens (from UI Assets)

```css
/* Brand Colors (updated from finalized assets) */
--primary: #9B1B1E;           /* Bold Red from logo */
--cta: #F4D03F;               /* Bright Gold from logo */
--curry: #8B4513;             /* Warm brown accent */
--jade: #2E8B57;              /* Success green */
--cream: #FFFEF7;             /* Light background */
--charcoal: #1A1A1A;          /* Primary text */
--background-dark: #1a0505;   /* Dark mode background */

/* Typography */
Display: "Manrope" (sans-serif, bold headings)
Serif: "Playfair Display" (elegant accents)
Body: "DM Sans" (readable, geometric)
Burmese: "Padauk" (Myanmar script)
```

---

## Task 1.1: Design Tokens - Light Theme

**Prompt Reference**: Prompt 1 from UX-Prompts.md
**Output File**: `src/styles/tokens.css`
**Status**: 🎨 Prototype Ready

### Reference Assets
> **Templates** (improve upon these):
> - [Design-Tokens-1/screen.png](../../UI-Assets/P1-Foundation/Design-Tokens-1/screen.png) | [code.html](../../UI-Assets/P1-Foundation/Design-Tokens-1/code.html)
> - [Design-Tokens-2/screen.png](../../UI-Assets/P1-Foundation/Design-Tokens-2/screen.png) | [code.html](../../UI-Assets/P1-Foundation/Design-Tokens-2/code.html)
> - [Design-Tokens-3/screen.png](../../UI-Assets/P1-Foundation/Design-Tokens-3/screen.png) | [code.html](../../UI-Assets/P1-Foundation/Design-Tokens-3/code.html)
> - [Light-Theme.md](../../UI-Assets/P1-Foundation/Light-Theme.md) | [PNG](../../UI-Assets/P1-Foundation/Light-Theme.png)

### Implementation Guide
1. **Review templates** — screen.png for visuals, code.html for structure
2. Run `/frontend-design`
3. Paste the prompt content below
4. **Improve upon templates** with enhanced polish, animations, accessibility
5. Review generated CSS custom properties
6. Integrate into project's global styles

### Prompt Content

```markdown
## Design Tokens - Light Theme

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
```

### Acceptance Criteria
- [ ] All color tokens defined
- [ ] Typography scale complete
- [ ] Spacing scale complete
- [ ] Border radius tokens defined
- [ ] Shadow tokens defined
- [ ] Google Fonts imported
- [ ] Tailwind integration compatible

---

## Task 1.2: Design Tokens - Dark Theme

**Prompt Reference**: Prompt 2 from UX-Prompts.md
**Output File**: `src/styles/tokens-dark.css`
**Status**: 🎨 Prototype Ready

### Reference Asset
> **Finalized Prototype**: [Dark-Theme.md](../../UI-Assets/P1-Foundation/Dark-Theme.md) | [PNG Preview](../../UI-Assets/P1-Foundation/Dark-Theme.png)
>
> Review the markdown file to see the dark mode color palette with warm undertones. The dark background (#1a0505) maintains the Burmese aesthetic.

### Implementation Guide
1. **Review the finalized prototype** — [Dark-Theme.md](../../UI-Assets/P1-Foundation/Dark-Theme.md)
2. Run `/frontend-design`
3. Paste the prompt content below
4. **Ensure dark mode uses the finalized background** (--background-dark: #1a0505)
5. Review dark mode color overrides
6. Ensure smooth theme transitions

### Prompt Content

```markdown
## Design Tokens - Dark Theme

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
```

### Acceptance Criteria
- [ ] Dark mode colors maintain warm aesthetic
- [ ] 4.5:1 contrast ratios verified
- [ ] Theme toggle mechanism implemented
- [ ] localStorage preference persistence
- [ ] Smooth 200ms color transitions
- [ ] Respects prefers-color-scheme

---

## Task 1.3: Animation Tokens & Utilities

**Prompt Reference**: Prompt 3 from UX-Prompts.md
**Output File**: `src/lib/animations.ts`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create reusable Framer Motion variants
4. Export animation utilities

### Prompt Content

```markdown
## Animation Tokens & Utilities

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
```

### Acceptance Criteria
- [ ] Duration tokens defined
- [ ] Easing functions exported
- [ ] Framer Motion variants (fadeIn, slideUp, scaleIn, stagger)
- [ ] CSS keyframes for shimmer, pulse, confetti
- [ ] prefers-reduced-motion support
- [ ] TypeScript types for variants

---

## Task 1.4: Customer App Shell

**Prompt Reference**: Prompt 4 from UX-Prompts.md
**Output File**: `src/components/layouts/CustomerLayout.tsx`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create responsive layout component
4. Handle sticky header and cart bar

### Prompt Content

```markdown
## Customer App Shell

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
```

### Acceptance Criteria
- [ ] Sticky header (56px)
- [ ] Scrollable main content area
- [ ] Sticky cart bar (64px + safe area)
- [ ] Cart bar hidden when empty
- [ ] Shadow on scroll for header
- [ ] Responsive breakpoints
- [ ] iOS safe area support

---

## Task 1.5: Checkout Flow Shell

**Prompt Reference**: Prompt 5 from UX-Prompts.md
**Output File**: `src/components/layouts/CheckoutLayout.tsx`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create 4-step checkout layout
4. Handle step navigation

### Prompt Content

```markdown
## Checkout Flow Shell

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
```

### Acceptance Criteria
- [ ] Header with back/close navigation
- [ ] Horizontal step indicator
- [ ] Scrollable step content area
- [ ] Fixed bottom action button
- [ ] Dynamic button text per step
- [ ] Disabled state handling
- [ ] Mobile-first responsive

---

## Task 1.6: Driver App Shell

**Prompt Reference**: Prompt 6 from UX-Prompts.md
**Output File**: `src/components/layouts/DriverLayout.tsx`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create mobile PWA layout
4. Handle large touch targets

### Prompt Content

```markdown
## Driver App Shell

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
```

### Acceptance Criteria
- [ ] Header (48px) with controls
- [ ] Large touch targets (56px primary, 44px secondary)
- [ ] Bottom action area with primary/secondary buttons
- [ ] Offline indicator support
- [ ] High-contrast toggle
- [ ] iOS safe area support
- [ ] One-handed operation optimized

---

## Task 1.7: Admin Dashboard Shell

**Prompt Reference**: Prompt 7 from UX-Prompts.md
**Output File**: `src/components/layouts/AdminLayout.tsx`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create desktop-first dashboard layout
4. Handle navigation and content areas

### Prompt Content

```markdown
## Admin Dashboard Shell

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
```

### Acceptance Criteria
- [ ] Top navigation bar (64px)
- [ ] Active nav item styling
- [ ] User dropdown
- [ ] Full-width content area
- [ ] Max-width 1536px centering
- [ ] Dashboard grid layout
- [ ] Desktop-first (1024px minimum)

---

## Sprint Completion Checklist

Before marking Sprint 1 complete:

- [ ] All 7 tasks completed
- [ ] Design tokens integrated into Tailwind config
- [ ] Animation utilities exported and typed
- [ ] All layouts responsive
- [ ] iOS safe area support verified
- [ ] Dark mode toggle working
- [ ] No TypeScript errors
- [ ] Visual review complete
