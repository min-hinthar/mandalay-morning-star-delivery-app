# UX Specification: Mandalay Morning Star V5

> **Source PRD**: docs/V5/PRD.md
> **Created**: 2026-01-18
> **Methodology**: 6-Pass UX Foundation Analysis

---

## Pass 1: Mental Model

### Primary User Intents

| User Type | Primary Intent |
|-----------|----------------|
| Customer | "I want to order Myanmar food for delivery quickly and see when it arrives" |
| Admin | "I want to see what orders need attention right now and keep the kitchen flowing" |
| Driver | "I want to see my next delivery clearly and navigate there efficiently" |

### Likely Misconceptions

**Customer:**
- "Accordion sections mean I have to click to see anything" → Need visible item counts and preview
- "Bottom sheet = app is loading" → Need clear cart affordance
- "Featured items = same items every day" → Need freshness indicators (daily specials)
- "Upsell = pushy sales tactics" → Need genuine "goes well with" recommendations

**Admin:**
- "Operations focus = no revenue visibility" → Revenue still accessible, just not primary
- "Quick preview = full edit capability" → Preview is read-focused, edit requires navigation

**Driver:**
- "High contrast = ugly mode" → Need professional, not medical-device aesthetic
- "Manual toggle = buried in settings" → Need prominent, quick access

### UX Principles to Reinforce

1. **Progressive disclosure over information hiding** - Accordions show counts, not just labels
2. **Context over chrome** - Admin sees order status, not decorative dashboards
3. **Accessibility as feature, not compliance** - Driver mode is a first-class experience

---

## Pass 2: Information Architecture

### All User-Visible Concepts

**Customer Domain:**
- Menu categories, Menu items, Item details, Modifiers/options
- Cart, Cart items, Quantity, Subtotal, Delivery fee, Total
- Checkout steps, Delivery address, Payment method, Order confirmation
- Order status, Delivery tracking, Driver location, ETA
- Account, Order history, Favorites, Addresses
- Featured items, Daily specials, Promotions
- Recommendations, Add-ons, "Goes well with"

**Admin Domain:**
- Order queue, Order details, Order status transitions
- Prep time, Delivery assignments, Driver status
- Menu management, Item availability, Pricing
- Customer list, Customer details
- Revenue (secondary), Analytics (secondary)

**Driver Domain:**
- Current delivery, Next delivery, Route
- Order details, Customer contact, Delivery instructions
- Navigation, ETA, Status updates
- Earnings (secondary), Schedule (secondary)

### Grouped Structure

#### Customer: Browsing & Selection
| Concept | Priority | Rationale |
|---------|----------|-----------|
| Featured items | Primary | First thing seen, drives engagement |
| Menu categories | Primary | Navigation structure |
| Menu items | Primary | Core browsable content |
| Item details | Secondary | Revealed on demand (accordion/modal) |
| Modifiers | Secondary | Part of item detail flow |

#### Customer: Cart & Checkout
| Concept | Priority | Rationale |
|---------|----------|-----------|
| Cart summary | Primary | Always visible (bottom sheet/drawer) |
| Cart items | Primary | Editable list |
| Recommendations | Secondary | Shown during checkout, not blocking |
| Checkout steps | Primary | Linear flow, clear progress |
| Payment | Primary | Critical path |
| Order confirmation | Primary | Success state |

#### Customer: Tracking
| Concept | Priority | Rationale |
|---------|----------|-----------|
| Order status | Primary | Current state at a glance |
| Map with driver | Primary | Visual confirmation |
| Timeline | Primary | Historical context |
| ETA | Primary | Most asked question |
| Driver contact | Secondary | Only if needed |

#### Admin: Operations
| Concept | Priority | Rationale |
|---------|----------|-----------|
| Order queue | Primary | Real-time operational need |
| Order status | Primary | State transitions |
| Prep times | Primary | Kitchen efficiency |
| Driver assignments | Primary | Delivery coordination |
| Quick preview | Secondary | Detail without navigation |

#### Admin: Management
| Concept | Priority | Rationale |
|---------|----------|-----------|
| Menu management | Secondary | Less frequent than orders |
| Analytics | Hidden | Available but not prominent |
| Revenue | Hidden | Accessible via dedicated view |

#### Driver: Active Delivery
| Concept | Priority | Rationale |
|---------|----------|-----------|
| Current order | Primary | Single focus |
| Navigation | Primary | Core task |
| Status update | Primary | Communication to system |
| Customer info | Secondary | Revealed when needed |

---

## Pass 3: Affordances

### Customer Affordances

| Action | Visual/Interaction Signal |
|--------|---------------------------|
| Open category | Accordion header with chevron + item count badge |
| View item detail | Card tap → modal/expanded view |
| Add to cart | Prominent button with + icon, becomes quantity stepper after add |
| Open cart | Floating bottom bar with item count + total, tap to expand |
| Expand bottom sheet | Drag handle at top, swipe up gesture |
| Dismiss bottom sheet | Swipe down, tap overlay, X button |
| Proceed to checkout | Primary CTA in cart, disabled if empty |
| Select recommendation | Smaller cards with quick-add button |
| Track order | Map is interactive (pinch zoom), timeline is read-only |

### Admin Affordances

| Action | Visual/Interaction Signal |
|--------|---------------------------|
| View order details | Row hover reveals preview panel |
| Change order status | Status badge is a dropdown trigger |
| Assign driver | Driver column shows assignment dropdown |
| Access quick preview | Click row (not specific cell) |
| Navigate to full edit | Link/button within preview panel |
| Toggle view mode | Tabs or segmented control (queue/history) |

### Driver Affordances

| Action | Visual/Interaction Signal |
|--------|---------------------------|
| Start navigation | Large "Navigate" button, maps icon |
| Update status | Bottom action bar with status buttons |
| View order details | Expandable card, tap to reveal |
| Toggle high-contrast | Prominent toggle in header (not buried) |
| Contact customer | Phone/message icons, secondary placement |

### Affordance Rules

1. **If user sees a card, they can tap it** - All cards are interactive
2. **If user sees a badge count, content exists** - Never show "0" badges
3. **If user sees a chevron, content expands** - Consistent accordion pattern
4. **If user sees drag handle, content is draggable** - Bottom sheet, drawers
5. **If user sees a dropdown arrow, options exist** - Status, filters, sorts
6. **If button is disabled, reason is visible** - Tooltip or inline text

---

## Pass 4: Cognitive Load

### Friction Points

| Moment | Type | Location | Simplification |
|--------|------|----------|----------------|
| "Which category has my dish?" | Choice | Menu page | Show item counts, allow search |
| "What's in my cart?" | Uncertainty | Any page | Persistent bottom bar with summary |
| "Is this recommendation relevant?" | Choice | Checkout | Show "popular pairing" social proof |
| "Did my order go through?" | Uncertainty | Post-checkout | Immediate confirmation + email |
| "Where's my driver?" | Waiting | Tracking | Auto-refresh map, ETA countdown |
| "Which order needs attention?" | Choice | Admin queue | Sort by urgency, highlight overdue |
| "Am I on the right route?" | Uncertainty | Driver nav | Large address, confirm arrival button |

### Defaults Introduced

| Default | Value | Rationale |
|---------|-------|-----------|
| First accordion | Expanded | Show content immediately, reduce clicks |
| Quantity | 1 | Most common selection |
| Delivery address | Last used | Reduce form friction |
| Payment method | Last used | One-tap checkout enabled |
| Theme | System preference | Respect OS setting |
| Admin view | Operations | Match declared priority |
| Driver contrast | Standard | Opt-in to high contrast |

### Progressive Disclosure

| Hidden Initially | Revealed When |
|------------------|---------------|
| Item modifiers | Item selected |
| Delivery instructions | Checkout address step |
| Order history | Account accessed |
| Revenue analytics | Admin navigates to dedicated view |
| Driver schedule | Driver opens menu |

---

## Pass 5: State Design

### Menu Browsing

| State | User Sees | User Understands | User Can Do |
|-------|-----------|------------------|-------------|
| Empty | "No items available" message | Kitchen is closed/no menu | View hours, check later |
| Loading | Skeleton accordions | Content loading | Wait, scroll shows more skeletons |
| Success | Categories with items | Menu is ready | Browse, add to cart |
| Partial | Some categories grayed | Some items unavailable | Order available items |
| Error | Error message + retry | Something went wrong | Retry, contact support |

### Cart (Bottom Sheet)

| State | User Sees | User Understands | User Can Do |
|-------|-----------|------------------|-------------|
| Empty | "Your cart is empty" + CTA | Need to add items | Browse menu (CTA) |
| Loading | Spinner on totals | Calculating | Wait briefly |
| Success | Items, totals, checkout CTA | Ready to order | Edit, remove, checkout |
| Partial | Items with warnings | Some items changed (price/availability) | Review changes, continue |
| Error | Error banner | Cart sync failed | Retry, refresh |

### Checkout Flow

| State | User Sees | User Understands | User Can Do |
|-------|-----------|------------------|-------------|
| Empty | Redirect to menu | Can't checkout empty cart | Start shopping |
| Loading | Step skeleton | Page loading | Wait |
| Success (step) | Completed step checkmark | Step complete | Continue to next |
| Success (final) | Confirmation + order number | Order placed | Track order, continue shopping |
| Partial | Form with validation errors | Missing/invalid info | Fix errors |
| Error (payment) | Payment error modal | Payment failed | Retry, change method |

### Order Tracking

| State | User Sees | User Understands | User Can Do |
|-------|-----------|------------------|-------------|
| Empty | "No active orders" | Nothing to track | View history |
| Loading | Map skeleton + timeline skeleton | Loading tracking | Wait |
| Success | Live map + timeline | Order in progress | Watch, wait |
| Partial | Timeline only (no driver yet) | Order being prepared | Watch status |
| Error | "Tracking unavailable" | System issue | Contact support, check later |

### Admin Order Queue

| State | User Sees | User Understands | User Can Do |
|-------|-----------|------------------|-------------|
| Empty | "No pending orders" | Caught up | Relax, check history |
| Loading | Table skeleton | Loading orders | Wait |
| Success | Order rows with status | Work to do | Process orders |
| Partial | Some rows loading | Realtime updates | Work on loaded orders |
| Error | Error banner + stale data | Connection issue | Retry, data may be outdated |

### Driver Current Delivery

| State | User Sees | User Understands | User Can Do |
|-------|-----------|------------------|-------------|
| Empty | "No active delivery" | Between deliveries | Wait for assignment |
| Loading | Card skeleton | Loading delivery | Wait |
| Success | Full delivery card + nav | Have a delivery | Navigate, update status |
| Partial | Address only (no map) | Map loading/unavailable | Use address text |
| Error | "Delivery data error" | System issue | Contact dispatch |

---

## Pass 6: Flow Integrity

### Flow Risks

| Risk | Where | Mitigation |
|------|-------|------------|
| User adds items but forgets cart | Menu browsing | Persistent bottom bar with count + total |
| User abandons checkout at upsell | Checkout upsell step | Make upsells skippable with clear "No thanks" |
| User doesn't notice delivery fee | Cart summary | Always show fee (even if $0) before checkout |
| User submits wrong address | Checkout | Show map preview of address, confirm prompt |
| User confused by accordion collapse | Menu | First category auto-expanded, counts visible |
| Admin misses urgent order | Order queue | Visual urgency indicators (color, badge) |
| Driver misses high-contrast toggle | Driver header | Prominent position, icon-only quick access |
| User loses tracking page | Post-order | Order confirmation email with tracking link |
| Payment fails silently | Checkout | Modal with clear error + retry option |

### Visibility Decisions

**Must Be Visible (Always):**
- Cart item count and total (bottom bar)
- Current checkout step
- Order status (when tracking)
- Driver location on map (when assigned)
- Urgent order indicators (admin)
- High-contrast toggle (driver)

**Can Be Implied (Progressive):**
- Individual item modifiers (revealed on selection)
- Delivery instructions (part of checkout flow)
- Order history (account section)
- Revenue analytics (admin sub-navigation)
- Driver earnings (driver account)

### UX Constraints (Hard Rules)

1. **No checkout without cart visibility** - User must see what they're paying for
2. **No payment without address confirmation** - Prevent wrong delivery
3. **No order status without timeline** - Map alone is ambiguous
4. **No admin action without confirmation** - Prevent accidental status changes
5. **No driver navigation without address visible** - Safety requirement
6. **No hidden fees** - All costs visible before payment step
7. **No silent failures** - Every error gets user-visible feedback

---

## Visual Specifications

> Passes 1-6 complete. Visual specifications informed by above analysis.

### Design System Foundation

#### Color System (High Contrast + Bold)

```css
/* Surface Colors */
--color-surface-primary: #FFFFFF;      /* Light: Pure white */
--color-surface-secondary: #F8F7F6;    /* Light: Warm off-white */
--color-surface-tertiary: #F0EEEC;     /* Light: Nested elements */

--color-surface-primary-dark: #1A1918; /* Dark: Rich charcoal */
--color-surface-secondary-dark: #2A2827;
--color-surface-tertiary-dark: #3A3837;

/* Text Colors - High Contrast */
--color-text-primary: #1A1918;         /* Light: Near-black */
--color-text-secondary: #4A4845;       /* Light: Accessible gray */
--color-text-inverse: #FFFFFF;

--color-text-primary-dark: #F8F7F6;
--color-text-secondary-dark: #B5B3B0;

/* Interactive Colors - Bold */
--color-interactive-primary: #D4A853;  /* Saffron - CTA */
--color-interactive-hover: #C49843;
--color-interactive-active: #B48833;

--color-accent-secondary: #2D8B6F;     /* Jade - Success, secondary */
--color-accent-tertiary: #C45C4A;      /* Chili - Destructive */

/* Status Colors */
--color-status-success: #2D8B6F;
--color-status-warning: #D4A853;
--color-status-error: #C45C4A;
--color-status-info: #4A7C9B;
```

#### Typography (Playfair + Inter Optimized)

```css
/* Display - Playfair Display */
--font-display: 'Playfair Display', serif;
--font-display-weight: 600;

/* Body - Inter */
--font-body: 'Inter', sans-serif;

/* Scale */
--text-xs: 0.75rem;    /* 12px - Labels, captions */
--text-sm: 0.875rem;   /* 14px - Secondary text */
--text-base: 1rem;     /* 16px - Body */
--text-lg: 1.125rem;   /* 18px - Emphasis */
--text-xl: 1.25rem;    /* 20px - Subheadings */
--text-2xl: 1.5rem;    /* 24px - Section titles */
--text-3xl: 2rem;      /* 32px - Page titles */
--text-4xl: 2.5rem;    /* 40px - Hero */
```

#### Spacing (4px Grid)

```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

### Component Specifications

#### Accordion Category (Menu)

```
┌─────────────────────────────────────────┐
│ ▼ Appetizers                      (12)  │ ← Header: tap to expand/collapse
├─────────────────────────────────────────┤
│ ┌─────────┐                             │
│ │  IMG    │ Samosa (4 pcs)              │ ← Item card
│ │         │ Crispy pastry with...       │
│ └─────────┘ $8.99           [+ Add]     │
│                                         │
│ ┌─────────┐                             │
│ │  IMG    │ Spring Rolls                │
│ │         │ Fresh vegetables...         │
│ └─────────┘ $7.99           [+ Add]     │
└─────────────────────────────────────────┘
```

- Chevron rotates on expand (180°)
- Item count badge always visible
- First category auto-expanded on load
- Smooth height animation (300ms ease-out)

#### Bottom Sheet Cart (Mobile)

```
┌─────────────────────────────────────────┐
│              ═══                        │ ← Drag handle
│                                         │
│  Your Cart                    [X Close] │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Samosa (4 pcs)         x2  $17.98 │  │ ← Swipe left to delete
│  │ Spring Rolls           x1   $7.99 │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ─────────────────────────────────────  │
│  Subtotal                      $25.97   │
│  Delivery Fee                   $4.99   │
│  ─────────────────────────────────────  │
│  Total                         $30.96   │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │        Checkout  →                  ││ ← Primary CTA
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

- Partial expand: Shows summary + checkout CTA
- Full expand: Shows all items
- Swipe down to minimize
- Swipe item left to delete (reveal red delete button)

#### Cart Bottom Bar (Persistent)

```
┌─────────────────────────────────────────┐
│  🛒 3 items              $30.96  [View] │ ← Tap to open bottom sheet
└─────────────────────────────────────────┘
```

- Fixed to bottom (safe area aware)
- Hidden when cart empty
- Tap anywhere to open bottom sheet
- Shows on all customer pages except checkout

#### Order Tracking (Map + Timeline)

```
┌─────────────────────────────────────────┐
│  ┌─────────────────────────────────────┐│
│  │                                     ││
│  │            MAP                      ││ ← Interactive map
│  │         📍 Driver                   ││
│  │                                     ││
│  │                    🏠 You           ││
│  │                                     ││
│  └─────────────────────────────────────┘│
│                                         │
│  Arriving in ~12 minutes                │ ← ETA prominent
│                                         │
│  ● Confirmed           2:30 PM          │
│  ● Preparing           2:35 PM          │ ← Timeline
│  ● Out for delivery    2:50 PM  ←       │
│  ○ Delivered           ~3:05 PM         │
│                                         │
│  Driver: John D.            📞  💬      │ ← Contact secondary
└─────────────────────────────────────────┘
```

- Map takes ~40% of viewport
- Current step highlighted with arrow
- Future steps grayed with estimated time
- Contact options visible but not prominent

#### Admin Quick Preview (Table Row)

```
┌────────────────────────────────────────────────────────────────┐
│ Order    │ Customer    │ Items │ Total  │ Status    │ Driver   │
├──────────┼─────────────┼───────┼────────┼───────────┼──────────┤
│ #1234    │ John D.     │ 3     │ $30.96 │ ▼ Preparing│ ▼ Assign │ ← Row
├──────────┴─────────────┴───────┴────────┴───────────┴──────────┤
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Quick Preview                                    [→ Full]  │ │
│ │                                                            │ │
│ │ Items:                                                     │ │
│ │ • 2x Samosa (4 pcs)                                        │ │
│ │ • 1x Spring Rolls                                          │ │
│ │                                                            │ │
│ │ Delivery: 123 Main St, Apt 4B                              │ │
│ │ Notes: "Leave at door"                                     │ │
│ │                                                            │ │
│ │ Ordered: 2:30 PM (15 min ago)                              │ │
│ └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

- Click row to expand preview
- Preview is read-only summary
- "Full" link navigates to edit view
- Status/Driver dropdowns work without opening preview

#### Driver High-Contrast Mode

```
Standard Mode:                    High-Contrast Mode:
┌─────────────────────┐          ┌─────────────────────┐
│ ☀️ [Toggle]         │          │ ◐ [Toggle]          │ ← Quick toggle
│                     │          │                     │
│ Current Delivery    │          │ CURRENT DELIVERY    │ ← Bolder text
│                     │          │                     │
│ 123 Main Street     │          │ ███ 123 MAIN ST ███ │ ← High contrast
│ Apt 4B              │          │ APT 4B              │
│                     │          │                     │
│ [  Navigate  ]      │          │ [■■ NAVIGATE ■■]    │ ← Larger touch targets
│                     │          │                     │
│ [Picked Up] [Issue] │          │ [PICKED UP] [ISSUE] │
└─────────────────────┘          └─────────────────────┘
```

- Toggle in header, not settings
- 7:1 contrast ratio minimum
- Larger touch targets (48px minimum)
- Bolder typography weights
- High contrast persists across session

### Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | < 640px | Bottom sheet cart, stacked layouts |
| Tablet | 640-1024px | Side drawer cart, 2-column grids |
| Desktop | > 1024px | Side drawer cart, 3-4 column grids, wider containers |

### Interaction Specifications

#### Micro-interactions

| Interaction | Animation |
|-------------|-----------|
| Button tap | Scale 0.98 + slight darken (100ms) |
| Card hover | Subtle lift (elevation +1, 150ms) |
| Accordion expand | Height auto + chevron rotate (300ms ease-out) |
| Bottom sheet open | Slide up from bottom (250ms ease-out) |
| Toast appear | Slide in from top + fade (200ms) |
| Status change | Color transition (200ms) |

#### Gesture Support (Mobile)

| Gesture | Action |
|---------|--------|
| Swipe down on bottom sheet | Minimize/close |
| Swipe left on cart item | Reveal delete button |
| Pull to refresh | Reload current data |
| Pinch on map | Zoom in/out |

### Accessibility Requirements

- **Color contrast**: 4.5:1 minimum (7:1 in driver high-contrast)
- **Touch targets**: 44px minimum (48px in driver mode)
- **Focus indicators**: Visible focus ring on all interactive elements
- **Screen reader**: All images have alt text, form fields have labels
- **Keyboard navigation**: Full functionality without mouse
- **Reduced motion**: Respect `prefers-reduced-motion`, provide static alternatives

---

## Appendix: Screen Inventory

### Customer Screens
1. Homepage (featured items hero)
2. Menu (accordion categories)
3. Item Detail (modal)
4. Cart (bottom sheet mobile, drawer desktop)
5. Checkout - Address
6. Checkout - Payment
7. Checkout - Review + Upsells
8. Order Confirmation
9. Order Tracking
10. Account / Profile
11. Order History
12. Support / Contact Form

### Admin Screens
1. Dashboard (operations focus)
2. Order Queue
3. Order Detail
4. Menu Management
5. Customer List
6. Analytics (secondary)

### Driver Screens
1. Current Delivery
2. Delivery History
3. Earnings
4. Settings (high-contrast toggle)

---

## Next Steps

1. Generate Sprint 1 build tasks from Foundation section
2. Create component Storybook stories alongside implementation
3. Set up Playwright visual regression baseline after Sprint 6
