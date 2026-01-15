# Sprint 4: Tracking & Driver

> **Prompts**: 19-21 from UX-Prompts.md
> **Dependencies**: Sprints 1-2 (tokens, layouts, base components)
> **Focus**: Order tracking and driver interface components

## Overview

This sprint implements the real-time tracking experience for customers and the delivery interface for drivers. These components enable the Saturday delivery operations.

## Sprint Progress

| Task | Component | Status |
|------|-----------|--------|
| 4.1 | Order Tracking View | ⬜ Not Started |
| 4.2 | Driver Route Card | ⬜ Not Started |
| 4.3 | Driver Stop Card | ⬜ Not Started |

> Update status: ⬜ Not Started → 🔄 In Progress → ✅ Complete

---

## Task 4.1: Order Tracking View

**Prompt Reference**: Prompt 19 from UX-Prompts.md
**Output File**: `src/components/tracking/OrderTracking.tsx`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create tracking page with map and timeline
4. Handle real-time updates

### Prompt Content

```markdown
## Order Tracking View

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
```

### Acceptance Criteria
- [ ] Header with order number and contact button
- [ ] Live map with driver and destination pins
- [ ] Route line between driver and destination
- [ ] ETA display with driver name
- [ ] Vertical status timeline
- [ ] Completed/current/upcoming status styling
- [ ] Pulsing animation for current status
- [ ] Collapsible order items
- [ ] Real-time location updates
- [ ] Full-screen map on tap

---

## Task 4.2: Driver Route Card

**Prompt Reference**: Prompt 20 from UX-Prompts.md
**Output File**: `src/components/driver/RouteCard.tsx`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create route summary card
4. Handle route states

### Prompt Content

```markdown
## Driver Route Card

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
```

### Acceptance Criteria
- [ ] Date header
- [ ] Large stop count number
- [ ] Duration and start time info
- [ ] Large Start Route button (56px)
- [ ] Card styling (shadow, radius)
- [ ] No Route state
- [ ] Route Complete state with stats
- [ ] Clean, calm visual design

---

## Task 4.3: Driver Stop Card

**Prompt Reference**: Prompt 21 from UX-Prompts.md
**Output File**: `src/components/driver/StopCard.tsx`
**Status**: ⬜ Not Started

### Implementation Guide
1. Run `/frontend-design`
2. Paste the prompt content below
3. Create stop detail card with actions
4. Handle delivery workflow states

### Prompt Content

```markdown
## Driver Stop Card

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
```

### Acceptance Criteria
- [ ] Stop progress indicator (X of Y)
- [ ] Progress bar with percentage
- [ ] Large, glanceable address
- [ ] Customer info (time window, name, phone)
- [ ] Highlighted customer note section
- [ ] Items list
- [ ] Navigate button (56px, primary)
- [ ] Arrived and Issue buttons (44px, secondary)
- [ ] Phone number tap-to-call
- [ ] Address tap-to-copy
- [ ] Offline support indicators

---

## Sprint Completion Checklist

Before marking Sprint 4 complete:

- [ ] All 3 tasks completed
- [ ] Tracking map displays correctly
- [ ] Status timeline animates properly
- [ ] Driver route card states work
- [ ] Driver stop card actions function
- [ ] Large touch targets verified (44px+)
- [ ] Offline indicators present
- [ ] Real-time updates working
- [ ] No TypeScript errors
- [ ] Visual review complete
