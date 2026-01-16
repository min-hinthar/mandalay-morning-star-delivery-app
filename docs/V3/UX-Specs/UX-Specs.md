# UX Specification: Mandalay Morning Star V3

> **Source PRD**: PRD.md + PRD-clarification-session.md
> **Generated**: 2026-01-15
> **Scope**: Complete UX foundations for Customer, Driver, and Admin experiences

---

## Pass 1: Mental Model

### Customer Experience

**Primary user intent:** "I want to order delicious Burmese food for Saturday delivery with minimal friction."

**Likely misconceptions:**
- "I can order anytime and get it today" → Reality: Saturday-only delivery with Friday 3PM cutoff
- "This is like DoorDash/Uber Eats" → Reality: Pre-scheduled weekly delivery, not on-demand
- "Delivery is expensive" → Reality: Free delivery over $100 encourages larger orders
- "I need to create an account to browse" → Reality: Can browse freely, account for checkout

**UX principle to reinforce:** The Saturday delivery model is a FEATURE (planned meals, premium service), not a limitation. First-time visitors need explicit onboarding to shift from on-demand mental model.

**Key mental model reinforcement:**
- Welcome modal for first-timers explaining Saturday model
- Persistent "Ordering for [Saturday Date]" context throughout
- Free delivery threshold shown everywhere to reframe fee as incentive

---

### Driver Experience

**Primary user intent:** "I want to efficiently complete my Saturday deliveries without getting lost or confused."

**Likely misconceptions:**
- "I only need to see the next stop" → Reality: Route context (all stops, progress) reduces anxiety
- "If I lose signal, I lose my progress" → Reality: Offline-first with sync
- "Photo proof is mandatory" → Reality: Optional but encouraged

**UX principle to reinforce:** The driver app is a COMPANION, not a task list. It should feel like a supportive co-pilot showing the full journey, not a restrictive checklist.

---

### Admin Experience

**Primary user intent:** "I want to see what's happening right now and catch problems before customers complain."

**Likely misconceptions:**
- "I need to switch between real-time view and analytics" → Reality: Unified dashboard shows both
- "Exceptions require navigation to resolve" → Reality: All actions available inline
- "I can only see today's data" → Reality: Configurable periods with comparisons

**UX principle to reinforce:** The admin dashboard is a COMMAND CENTER, not a reporting tool. Real-time operations and analytics coexist without context-switching.

---

## Pass 2: Information Architecture

### Customer IA

**All user-visible concepts:**
- Menu categories (Curries, Noodles, Soups, etc.)
- Menu items (Mohinga, Ohn No Khao Swe, etc.)
- Item customizations (spice level, add-ons)
- Item details (names in English + Burmese, description, price, allergens, photo)
- Cart contents and running total
- Free delivery progress indicator
- Delivery address (new or saved)
- Coverage validation status
- Delivery date (this/next Saturday)
- Delivery time window (hourly slots)
- Order summary and totals
- Payment (Stripe)
- Order confirmation
- Order tracking (status, driver location, ETA)
- Order history and reorder
- Favorites
- Account settings (addresses, payments, notifications)
- Customer feedback (food, delivery, packaging ratings)

**Grouped structure:**

#### Ordering (Primary Surface)
- Menu categories: **Primary** — First thing users see after hero
- Menu items: **Primary** — Grid within categories
- Item details modal: **Primary** — Opens on item tap
- Item customizations: **Primary** — Within item modal
- Cart bar: **Primary** — Always visible at bottom
- Free delivery progress: **Primary** — Visible in cart bar, menu, item modal
- Rationale: Ordering is THE task; everything ordering-related must be immediately accessible

#### Checkout Flow (Sequential)
- Delivery address: **Primary** — Step 1
- Coverage status: **Primary** — Validation in Step 1
- Delivery date: **Primary** — Shown throughout, editable in Step 2
- Delivery time window: **Primary** — Step 2
- Order summary: **Primary** — Step 3 (review)
- Payment: **Primary** — Step 4 (Stripe redirect)
- Rationale: Linear 4-step flow; each step is primary within its context

#### Post-Order (Secondary Surface)
- Order confirmation: **Secondary** — After payment success
- Order tracking: **Secondary** — Accessible from confirmation/history
- Order history: **Secondary** — In account area
- Reorder button: **Secondary** — In order history cards
- Customer feedback: **Secondary** — Post-delivery in order detail
- Rationale: Users access these AFTER the primary task; shouldn't compete with ordering

#### Account (Progressive/Hidden Until Needed)
- Saved addresses: **Hidden** — In account settings
- Payment methods: **Hidden** — Managed via Stripe
- Favorites: **Secondary** — Accessible from account, also via heart icon on items
- Notification preferences: **Hidden** — In account settings
- Account deletion: **Hidden** — Deep in settings (GDPR)
- Rationale: Account management is rare; hide to reduce noise

#### Search & Filters
- Search bar: **Primary** — In menu header
- Autocomplete suggestions: **Primary** — Dropdown on type
- Allergen filters: **Secondary** — Filter controls in menu
- Rationale: Search is primary for returning users; filters are power-user feature

---

### Driver IA

**All user-visible concepts:**
- Route summary (stop count, estimated duration, start time)
- Route progress (stops completed, time elapsed)
- Current stop details (address, items, customer notes, time window)
- Route overview (all stops, not just next)
- Navigation launch (Google Maps)
- Delivery confirmation (arrived, completed)
- Photo capture
- Exception reporting (reason codes)
- Offline status and sync indicator
- Route completion summary

**Grouped structure:**

#### Route Overview (Primary)
- Route summary card: **Primary** — Home screen before route starts
- Route progress: **Primary** — Always visible during route
- All stops list: **Primary** — Scrollable, shows full route context
- Rationale: Drivers need journey context, not just next stop

#### Current Stop (Primary)
- Stop details card: **Primary** — Dominates active view
- Address + navigation: **Primary** — One-tap to maps
- Items list: **Primary** — What to hand over
- Customer notes: **Primary** — Special instructions
- Time window: **Primary** — Delivery expectation
- Rationale: Current stop is THE immediate task

#### Actions (Primary)
- Navigate button: **Primary** — Always accessible
- Arrived button: **Primary** — After navigation
- Photo capture: **Primary** — Default path at arrival
- Complete delivery: **Primary** — Final action
- Log exception: **Secondary** — Available but not prominent
- Rationale: Actions are linear; exception is the escape hatch

#### Status (Secondary)
- Offline indicator: **Secondary** — Only when relevant
- Sync status: **Secondary** — Background, shows when syncing
- High-contrast toggle: **Secondary** — In quick settings
- Rationale: Status is ambient awareness, not primary focus

---

### Admin IA

**All user-visible concepts:**
- Today's overview (orders, drivers, exceptions)
- Real-time driver locations (map)
- Driver progress cards
- Exception alerts
- Order management
- Driver management
- Route management
- Analytics (driver stats, delivery metrics)
- Menu management
- Comparative metrics (WoW)

**Grouped structure:**

#### Operations Dashboard (Primary)
- Today's overview: **Primary** — KPI row at top
- Driver location map: **Primary** — Live map
- Driver progress cards: **Primary** — Status for each driver
- Exception alerts: **Primary** — Push to top of attention
- Rationale: Saturday operations are THE admin task

#### Exception Handling (Primary)
- Alert cards: **Primary** — Action-dense, no navigation needed
- View order details: **Primary** — Inline expand
- Contact customer: **Primary** — One-tap
- Contact driver: **Primary** — One-tap
- Resolve with notes: **Primary** — Inline action
- Rationale: Exceptions are urgent; all resolution options must be immediate

#### Analytics (Secondary)
- Driver stats: **Secondary** — Separate analytics section
- Delivery metrics: **Secondary** — KPIs, trends, charts
- Comparative metrics: **Secondary** — WoW with configurable periods
- Rationale: Analytics inform but don't drive real-time ops

#### Management (Secondary)
- Order management: **Secondary** — Search/filter orders
- Driver management: **Secondary** — CRUD drivers
- Route management: **Secondary** — View/edit routes
- Menu management: **Secondary** — Toggle availability, edit items
- Rationale: Management tasks are between Saturdays, not during

---

## Pass 3: Affordances

### Customer Affordances

| Action | Visual/Interaction Signal |
|--------|---------------------------|
| Browse categories | Horizontal scrollable tabs with active indicator; tap to filter |
| View item details | Card is tappable; subtle hover lift on desktop; tap opens modal |
| Add to cart | Prominent button in item modal; saffron color = action |
| Adjust quantity | +/- buttons with number between; clearly increment/decrement |
| Select modifier | Radio buttons for single-select; checkboxes for multi-select |
| View cart | Sticky bottom bar shows item count + total; tap to expand |
| Remove from cart | Swipe left (mobile) or trash icon on hover (desktop) |
| Proceed to checkout | Large CTA button in cart; "Checkout" text; disabled if empty |
| Enter address | Input field with autocomplete dropdown; map pin icon |
| Select time window | Time slot cards; tap to select; selected = filled state |
| Complete payment | "Pay $X.XX" button; redirects to Stripe |
| Track order | Tracking link in confirmation; map + status timeline |
| Search menu | Search icon in header; tap opens search overlay with input |
| Filter by allergen | Filter icon; opens sheet with allergen toggles |
| Favorite an item | Heart icon on item card; tap to toggle; filled = favorited |
| Reorder | "Reorder" button on order history card; adds all items to cart |
| Add/adjust tip | "Adjust Tip" link in order history; opens tip input |

**Affordance rules:**
- If user sees saffron/gold button → Primary action (do this next)
- If user sees card with image → Tappable to see details
- If user sees sticky bar at bottom → Shows current state, tappable to expand
- If user sees icon + number → Tappable with quantity feedback
- If user sees heart icon → Tappable to favorite/unfavorite
- If user sees horizontal scroll → Can swipe to see more
- If user sees pill/chip → Tappable filter or tag

---

### Driver Affordances

| Action | Visual/Interaction Signal |
|--------|---------------------------|
| Start route | Large "Start Route" button; prominently placed; saffron color |
| View all stops | Scrollable stop list; numbers indicate order; current highlighted |
| Navigate to stop | "Navigate" button with map icon; opens external maps |
| Mark arrived | "Arrived" button appears after proximity or manual tap |
| Take delivery photo | Camera viewfinder UI; prominent capture button |
| Skip photo | "Skip Photo" link below capture; requires reason selection |
| Complete delivery | "Complete" button after photo or skip; confirmation animation |
| Report exception | "Issue" button in secondary position; opens reason modal |
| Toggle high-contrast | Accessibility icon in header; tap toggles theme |
| View sync status | Cloud icon with sync animation; tap shows queue details |

**Affordance rules:**
- If user sees large button at bottom → Primary action for current state
- If user sees numbered list → Sequential stops, can tap to preview any
- If user sees camera UI → Photo capture mode; button = snap
- If user sees icon in header → Settings or toggle action
- If user sees cloud icon pulsing → Background sync in progress

---

### Admin Affordances

| Action | Visual/Interaction Signal |
|--------|---------------------------|
| View driver on map | Driver pin on map; tap to highlight/select |
| View driver details | Driver card; tap to expand; shows route detail |
| Handle exception | Exception card with action buttons inline (no navigation) |
| Contact customer | Phone/message icon on exception card; one-tap |
| Contact driver | Phone icon on driver card; one-tap |
| Resolve exception | "Resolve" button with text input for notes |
| View analytics | "Analytics" nav item; separate section |
| Change time period | Period selector dropdown; options for day/week/month |
| Toggle WoW comparison | Toggle switch on metrics; shows/hides comparison |
| Manage orders | "Orders" nav item; search/filter interface |
| Toggle item availability | Toggle switch on menu item row; instant save |

**Affordance rules:**
- If user sees card with red accent → Exception requiring attention
- If user sees toggle switch → Binary state change, instant
- If user sees dropdown → Selection from options
- If user sees map with pins → Interactive; pins are tappable
- If user sees inline buttons → Actions available without navigation

---

## Pass 4: Cognitive Load

### Customer Friction Points

| Moment | Type | Simplification |
|--------|------|----------------|
| First visit: understanding Saturday model | Uncertainty | Welcome modal with clear explanation; one dismissal |
| Browsing large menu | Choice | Menu-first homepage with clear categories; max 8 visible categories |
| Choosing modifiers | Choice | Smart defaults (medium spice); most popular marked |
| Address entry | Uncertainty | Autocomplete; saved addresses for returning users |
| Coverage validation | Waiting | Instant feedback with loading state; clear error with map if invalid |
| Selecting time window | Choice | Show only available windows; highlight "popular" slot |
| Payment | Waiting | Clear "Redirecting to payment..." state; return to confirmation |
| Tracking: when will it arrive? | Uncertainty | Always-visible ETA; map shows driver even before dispatch |

**Defaults introduced:**
- Spice level: Medium (can adjust)
- Delivery date: Next available Saturday (auto-advances after cutoff)
- Time window: None pre-selected (forces conscious choice for planning)
- Tip: No default (passive tip option in order history)

**Progressive disclosure:**
- Allergen filtering: Hidden until filter icon tapped
- Account settings: Behind account menu
- Order history: Behind account menu
- Favorites: Shown in account; heart icon available but not prominent

---

### Driver Friction Points

| Moment | Type | Simplification |
|--------|------|----------------|
| Starting the day: what's my route? | Uncertainty | Route summary card with clear stats; one "Start" button |
| Navigating: which stop next? | Uncertainty | Current stop highlighted; route overview always accessible |
| At delivery: what do I do? | Choice | Linear buttons: Arrived → Photo → Complete |
| Photo capture: is this required? | Uncertainty | Photo is default path; skip option with reason selection |
| Offline: am I losing data? | Uncertainty | Clear offline indicator; sync icon shows queue count |
| Sunlight: can't see screen | Uncertainty | High-contrast toggle in quick-access header |

**Defaults introduced:**
- Photo capture: On (default path, skip available)
- Navigation app: Google Maps (most common)
- High-contrast: Off (toggle available)

**Progressive disclosure:**
- Route stats (detailed): In completion summary
- Exception reasons: Only shown when "Issue" tapped
- Sync queue details: Only shown when sync icon tapped

---

### Admin Friction Points

| Moment | Type | Simplification |
|--------|------|----------------|
| Starting Saturday ops | Uncertainty | Dashboard auto-shows today; key metrics at top |
| Finding problem orders | Waiting/Choice | Exceptions auto-surface to top; red visual priority |
| Resolving exceptions | Choice | All actions inline (no navigation required) |
| Understanding driver progress | Uncertainty | Progress bars + ETA on each driver card |
| Comparing performance | Choice | Default WoW comparison; period selector for custom |
| Managing many orders | Choice | Search + filter; batch actions where appropriate |

**Defaults introduced:**
- Dashboard view: Today's operations (not historical)
- Metrics comparison: Week-over-week (can change period)
- Exception sort: Most recent first

**Progressive disclosure:**
- Detailed analytics: In separate analytics section
- Driver management: In separate drivers section
- Menu management: In separate menu section

---

## Pass 5: State Design

### Customer: Menu Browsing

| State | User Sees | User Understands | User Can Do |
|-------|-----------|------------------|-------------|
| Empty | Skeleton cards with shimmer | Page is loading | Wait |
| Loading | Category tabs + skeleton item cards | Content loading | Browse categories while items load |
| Success | Full menu with images, prices | Ready to order | Tap items, add to cart |
| Partial | Some items, some skeletons | More loading | Interact with loaded items |
| Error | "Couldn't load menu" + retry button | Something went wrong | Tap retry |

### Customer: Cart

| State | User Sees | User Understands | User Can Do |
|-------|-----------|------------------|-------------|
| Empty | Minimized bar: "Your cart is empty" | No items added | Continue browsing |
| Loading | N/A (cart is local) | N/A | N/A |
| Success | Item count + total + "Checkout" | Ready to proceed | Expand cart, checkout |
| Partial | Items + "1 item unavailable" banner | Something sold out | Remove unavailable, see suggestions |
| Error | N/A (local state) | N/A | N/A |

### Customer: Checkout - Address

| State | User Sees | User Understands | User Can Do |
|-------|-----------|------------------|-------------|
| Empty | Address input with placeholder | Need to enter address | Type address |
| Loading | Input disabled, spinner | Validating coverage | Wait |
| Success | Green check + "Delivery available" | Address accepted | Proceed to next step |
| Partial | N/A | N/A | N/A |
| Error | Red message + coverage map | Out of delivery range | Try different address |

### Customer: Order Tracking

| State | User Sees | User Understands | User Can Do |
|-------|-----------|------------------|-------------|
| Empty | N/A (always has order data) | N/A | N/A |
| Loading | Map with kitchen pin + "Preparing" | Order being made | Wait, see status |
| Success (Out for Delivery) | Map with driver pin + ETA | Driver en route | Watch progress |
| Success (Delivered) | "Delivered" status + feedback prompt | Order complete | Rate experience |
| Partial | Map + "Driver location updating..." | Temporary GPS issue | Wait |
| Error | "Tracking unavailable" + contact info | System issue | Contact support |

### Driver: Route Home

| State | User Sees | User Understands | User Can Do |
|-------|-----------|------------------|-------------|
| Empty | "No route assigned today" | No deliveries | Check back later |
| Loading | Spinner + "Loading route..." | Route loading | Wait |
| Success | Route card with stops, time, "Start" | Ready to begin | Tap Start Route |
| Partial | N/A | N/A | N/A |
| Error | "Couldn't load route" + retry | Connection issue | Retry, check offline |

### Driver: Active Delivery

| State | User Sees | User Understands | User Can Do |
|-------|-----------|------------------|-------------|
| Empty | N/A (always has stop data) | N/A | N/A |
| Loading | Stop card with spinner | Loading details | Wait (brief) |
| Success | Full stop details + actions | Ready for this stop | Navigate, mark arrived |
| Partial | Stop card + "Syncing..." | Offline data, will sync | Continue with cached data |
| Error | Red banner + "Offline mode" | No connection | Continue offline |

### Driver: Photo Capture

| State | User Sees | User Understands | User Can Do |
|-------|-----------|------------------|-------------|
| Empty | Camera viewfinder | Ready to capture | Take photo or skip |
| Loading | Photo preview + upload spinner | Uploading | Wait |
| Success | Checkmark + "Photo saved" | Proof recorded | Proceed to complete |
| Partial | N/A | N/A | N/A |
| Error | "Upload failed" + retry + "Complete anyway" | Connection issue | Retry or complete without |

### Admin: Dashboard

| State | User Sees | User Understands | User Can Do |
|-------|-----------|------------------|-------------|
| Empty | "No orders for today" + past data link | Nothing scheduled | View historical data |
| Loading | Skeleton metrics + skeleton cards | Dashboard loading | Wait |
| Success | Live metrics + driver cards + map | Operations in progress | Monitor, drill down |
| Partial | Some metrics + "Updating..." | Real-time refresh | Continue monitoring |
| Error | "Dashboard error" + retry | System issue | Retry, check connection |

### Admin: Exception Alert

| State | User Sees | User Understands | User Can Do |
|-------|-----------|------------------|-------------|
| Empty | No exception cards | No issues | Monitor |
| Loading | Exception card skeleton | Alert loading | Wait |
| Success | Full exception card with actions | Issue needs attention | View, contact, resolve |
| Partial | N/A | N/A | N/A |
| Error | "Couldn't load details" + order ID | Data issue | Use order ID to look up manually |

---

## Pass 6: Flow Integrity

### Customer Flow Risks

| Risk | Where | Mitigation |
|------|-------|------------|
| User doesn't understand Saturday model | First visit | Welcome modal with clear explanation; persistent "Ordering for [Date]" |
| User enters out-of-coverage address | Address step | Instant validation; show coverage map; suggest alternatives |
| User doesn't notice free delivery threshold | Throughout | Show progress everywhere: cart bar, menu banner, item modal, checkout |
| Cart items become unavailable | Return visit | Smart substitution modal with similar item suggestions |
| User abandons at payment redirect | Payment step | Clear "Redirecting..." state; return to confirmation on success |
| User can't find past order | Account | Order history easily accessible; reorder button prominent |
| User forgets cutoff time | Late Thursday/Friday | Banner warning as cutoff approaches; auto-advance to next Saturday after |

**Visibility decisions:**

Must be visible:
- Current Saturday date for order (always)
- Free delivery progress (cart bar, key moments)
- Cart item count + total (sticky bar)
- Delivery time window selected (checkout summary)
- Order status (tracking page)

Can be implied:
- Account logged-in state (avatar presence implies logged in)
- Allergen filtering available (filter icon in header)
- Favorites feature (heart icon on items)
- Past orders exist (shown in account, not on homepage)

**UX constraints for visual phase:**
- Mobile-first: Design for 375px first, then scale up
- Bottom navigation on mobile (cart bar is persistent)
- Minimum tap target: 44px
- No horizontal scroll except for intentional carousels (categories)
- Loading skeletons match content layout (no layout shift)

---

### Driver Flow Risks

| Risk | Where | Mitigation |
|------|-------|------------|
| Driver can't see screen in sunlight | Outdoors | High-contrast mode toggle in quick-access header |
| Driver loses cellular signal | Rural areas | Offline-first; queue actions; show sync status |
| Driver forgets which stop is current | Mid-route | Current stop always highlighted; route overview shows all |
| Driver skips photo but shouldn't | Photo capture | Photo is default path; skip requires reason selection |
| Driver marks wrong stop complete | Stop list | Confirmation before completion; undo window |
| Driver gets lost | Navigation | One-tap Google Maps launch; address always visible |

**Visibility decisions:**

Must be visible:
- Current stop details (always on active view)
- Route progress (stops done / total)
- Offline indicator (when offline)
- Navigation button (always accessible)
- Time window for current stop

Can be implied:
- High-contrast mode available (icon in header)
- Exception logging available (secondary button)
- Route stats (available in completion summary)

**UX constraints for visual phase:**
- Large touch targets (56px minimum for primary actions)
- High contrast text (4.5:1 minimum, 7:1 for high-contrast mode)
- Single-hand operation (primary actions at bottom)
- Glanceable info (3-second comprehension for key data)

---

### Admin Flow Risks

| Risk | Where | Mitigation |
|------|-------|------------|
| Admin misses exception alert | Dashboard | Exceptions auto-surface to top; visual priority (red) |
| Admin needs to navigate away to resolve | Exception handling | All actions inline on exception card |
| Admin can't identify slow driver | Driver cards | Progress bars with time estimates; yellow/red indicators |
| Admin loses real-time context | Analytics deep-dive | Unified dashboard; real-time + analytics coexist |
| Admin can't compare to last week | Metrics | WoW comparison default; configurable periods |

**Visibility decisions:**

Must be visible:
- Today's key metrics (top of dashboard)
- Exception count badge
- Driver progress (cards on dashboard)
- Real-time map

Can be implied:
- Historical analytics (in analytics section)
- Driver management (in drivers section)
- Menu management (in menu section)
- Order details (expand from card)

**UX constraints for visual phase:**
- Desktop-first for admin (minimum 1024px)
- Exception cards must stand out (red accent, top position)
- Map should be prominent but not dominate (60% width max)
- All dashboard info above fold on 1080p monitor

---

## Visual Specifications

> **Prerequisite**: All 6 passes complete. Proceeding with visual specifications.

### Design System Foundation

#### Color Palette (Light Theme)

```css
/* Primary */
--color-saffron: #D4A017;        /* Primary actions, CTAs */
--color-saffron-hover: #B8890F;  /* Saffron hover state */
--color-saffron-light: #FDF6E3;  /* Saffron backgrounds */

/* Accent */
--color-curry: #8B4513;          /* Secondary text, icons */
--color-lotus: #FFE4E1;          /* Soft pink backgrounds */

/* Semantic */
--color-jade: #2E8B57;           /* Success states */
--color-jade-light: #E8F5E9;     /* Success backgrounds */
--color-error: #DC2626;          /* Error states */
--color-error-light: #FEF2F2;    /* Error backgrounds */
--color-warning: #F59E0B;        /* Warning states */
--color-warning-light: #FFFBEB;  /* Warning backgrounds */

/* Neutral */
--color-charcoal: #1A1A1A;       /* Primary text */
--color-charcoal-muted: #4A4A4A; /* Secondary text */
--color-cream: #FFFEF7;          /* Page background */
--color-cream-darker: #F5F4EF;   /* Card backgrounds */
--color-border: #E5E2D9;         /* Borders, dividers */
```

#### Color Palette (Dark Theme)

```css
/* Maintain warmth in dark mode */
--color-saffron: #E5B523;        /* Brighter for dark bg */
--color-saffron-hover: #F5C533;
--color-saffron-light: #2A2418;  /* Dark saffron bg */

--color-curry: #C4875A;          /* Warmer brown */
--color-lotus: #3D2A28;          /* Muted pink-brown */

--color-jade: #4ADE80;           /* Brighter green */
--color-jade-light: #1A2E1A;
--color-error: #F87171;
--color-error-light: #2D1A1A;
--color-warning: #FBBF24;
--color-warning-light: #2D2A1A;

--color-charcoal: #F5F5F5;       /* Light text on dark */
--color-charcoal-muted: #A3A3A3;
--color-cream: #1A1918;          /* Dark background */
--color-cream-darker: #252423;   /* Elevated surfaces */
--color-border: #3D3B38;
```

#### Typography

```css
/* Font Families */
--font-display: "Playfair Display", Georgia, serif;     /* Headers, prices */
--font-body: "DM Sans", system-ui, sans-serif;          /* Body text, UI */
--font-burmese: "Padauk", "Noto Sans Myanmar", sans-serif; /* Burmese text */

/* Scale */
--text-xs: 0.75rem;    /* 12px - labels, captions */
--text-sm: 0.875rem;   /* 14px - secondary text */
--text-base: 1rem;     /* 16px - body text */
--text-lg: 1.125rem;   /* 18px - emphasized body */
--text-xl: 1.25rem;    /* 20px - card titles */
--text-2xl: 1.5rem;    /* 24px - section headers */
--text-3xl: 1.875rem;  /* 30px - page titles */
--text-4xl: 2.25rem;   /* 36px - hero text */

/* Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

#### Spacing Scale

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

#### Border Radius

```css
--radius-sm: 0.375rem;  /* 6px - buttons, inputs */
--radius-md: 0.5rem;    /* 8px - cards */
--radius-lg: 0.75rem;   /* 12px - modals, large cards */
--radius-xl: 1rem;      /* 16px - hero sections */
--radius-full: 9999px;  /* Pills, avatars */
```

#### Shadows

```css
--shadow-sm: 0 1px 2px rgba(26, 26, 26, 0.05);
--shadow-md: 0 4px 6px -1px rgba(26, 26, 26, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(26, 26, 26, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(26, 26, 26, 0.1);
```

#### Motion / Animation

```css
/* Durations */
--duration-micro: 150ms;     /* Hover states, toggles */
--duration-standard: 300ms;  /* Page transitions, modals */
--duration-dramatic: 500ms;  /* Hero animations, celebrations */

/* Easings */
--ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);      /* Decelerate */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);     /* Smooth */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Playful */

/* Common animations */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
```

---

### Responsive Breakpoints

```css
/* Mobile-first breakpoints */
--bp-sm: 640px;   /* Large phones */
--bp-md: 768px;   /* Tablets */
--bp-lg: 1024px;  /* Laptops */
--bp-xl: 1280px;  /* Desktops */
--bp-2xl: 1536px; /* Large screens */
```

**Mobile (< 640px):**
- Single column layout
- Bottom navigation bar
- Full-width cards
- Sticky cart bar at bottom

**Tablet (640px - 1023px):**
- Two-column grid for menu items
- Side drawer for cart (optional)
- Tab bar can move to side

**Desktop (1024px+):**
- Multi-column layouts
- Persistent sidebar navigation
- Hover states active
- Cart drawer or sidebar

---

### Customer Visual Specifications

#### Homepage / Menu

**Layout (Mobile):**
```
┌─────────────────────────────┐
│ [Logo]    [Search] [Account]│ ← Header (sticky, 56px)
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │     Compact Hero        │ │ ← Hero (120px max)
│ │  "Order for Saturday"   │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ [Category] [Category] [→]   │ ← Category tabs (scrollable, 48px)
├─────────────────────────────┤
│ ┌───────┐ ┌───────┐        │
│ │ Item  │ │ Item  │        │ ← Item grid (2 columns)
│ │ Card  │ │ Card  │        │
│ └───────┘ └───────┘        │
│ ┌───────┐ ┌───────┐        │
│ │ Item  │ │ Item  │        │
│ └───────┘ └───────┘        │
│         ...                 │
├─────────────────────────────┤
│ [3 items] [$45.00] [Cart →] │ ← Cart bar (sticky, 64px)
└─────────────────────────────┘
```

**Item Card:**
- Size: 100% width / 2 columns (gap: 12px)
- Image: 16:9 aspect ratio, rounded-lg (12px)
- Content padding: 12px
- Name (English): DM Sans, 16px, semibold, charcoal
- Name (Burmese): Padauk, 14px, normal, charcoal-muted
- Price: Playfair Display, 18px, semibold, saffron
- Allergen icons: 16px, row below price
- Heart icon: Top-right of image, 24px tap target

**Category Tab:**
- Height: 40px
- Padding: 0 16px
- Font: DM Sans, 14px, medium
- Active: saffron text, saffron bottom border (2px)
- Inactive: charcoal-muted text

**Cart Bar:**
- Height: 64px (safe area padding on iOS)
- Background: cream-darker
- Shadow: shadow-lg (upward)
- Left: Item count badge + "items"
- Center: Total price (Playfair, 20px, bold)
- Right: "View Cart" or "Checkout" button

#### Item Modal

**Layout:**
```
┌─────────────────────────────┐
│                         [X] │ ← Close button
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │    Large Food Photo     │ │ ← Hero image (60% viewport height max)
│ │                         │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ Mohinga                     │ ← English name (Playfair, 24px)
│ မုန့်ဟင်းခါး                │ ← Burmese name (Padauk, 18px)
│ $12.99                      │ ← Price (Playfair, 24px, saffron)
├─────────────────────────────┤
│ Traditional rice noodle...  │ ← Description (DM Sans, 14px)
├─────────────────────────────┤
│ 🥜 🌶️ 🐟                    │ ← Allergen icons + labels
├─────────────────────────────┤
│ Spice Level                 │
│ ○ Mild  ● Medium  ○ Hot     │ ← Single-select modifier
├─────────────────────────────┤
│ Add-ons                     │
│ ☑ Extra fish cake (+$2)    │ ← Multi-select modifier
│ ☐ Extra noodles (+$1)      │
├─────────────────────────────┤
│ Special Instructions        │
│ ┌─────────────────────────┐ │
│ │ Optional notes...       │ │ ← Text input
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ [-] 1 [+]                   │ ← Quantity selector
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │   Add to Cart - $14.99  │ │ ← Primary CTA (saffron, full-width)
│ └─────────────────────────┘ │
│ $85 more for free delivery  │ ← Free delivery progress
└─────────────────────────────┘
```

#### Checkout Flow

**Step Indicator:**
- Horizontal stepper (mobile) or vertical (desktop)
- 4 steps: Address → Time → Review → Pay
- Current step: saffron filled circle
- Completed: jade checkmark
- Future: gray outline circle

**Address Step:**
- Saved addresses shown as selectable cards
- "Add new address" option
- Address input with Google Places autocomplete
- Coverage validation inline (green check or red error with map)

**Time Step:**
- Date shown (this/next Saturday)
- Time slots as tappable cards
- Available: cream background
- Selected: saffron border + light saffron background
- Popular slot: small "Popular" badge

**Review Step:**
- Order items summary (collapsible)
- Price breakdown:
  - Items subtotal
  - Delivery fee (or "FREE" in jade)
  - Tax
  - Total (Playfair, 24px, bold)
- Edit buttons for address/time

**Payment:**
- "Pay $XX.XX" button
- Stripe redirect with loading state
- Return to confirmation on success

#### Order Tracking

**Layout:**
```
┌─────────────────────────────┐
│ Order #12345      [Contact] │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │       Live Map          │ │ ← Map (40% viewport, driver pin)
│ │                         │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ Arriving in ~15 min         │ ← ETA (Playfair, 24px)
│ Driver: John D.             │ ← Driver info
├─────────────────────────────┤
│ ● Confirmed        10:30 AM │
│ ● Preparing        11:00 AM │ ← Status timeline
│ ● Out for Delivery 2:15 PM  │
│ ○ Delivered        --:--    │
├─────────────────────────────┤
│ Your Order                  │
│ ├ 2x Mohinga                │ ← Order summary (collapsible)
│ ├ 1x Ohn No Khao Swe       │
│ └ 1x Tea Leaf Salad         │
└─────────────────────────────┘
```

---

### Driver Visual Specifications

#### Route Home (Before Start)

**Layout:**
```
┌─────────────────────────────┐
│ Mandalay          [⚙️] [☀️] │ ← Header (settings, high-contrast toggle)
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │  Saturday, Jan 15       │ │
│ │                         │ │
│ │  12 stops               │ │ ← Route summary card
│ │  Est. 4 hours           │ │
│ │  Start: 11:00 AM        │ │
│ │                         │ │
│ │ ┌─────────────────────┐ │ │
│ │ │    Start Route      │ │ │ ← Primary CTA (saffron, large)
│ │ └─────────────────────┘ │ │
│ └─────────────────────────┘ │
│                             │
├─────────────────────────────┤
│ Route Preview               │
│ 1. 123 Main St - 11:00 AM   │
│ 2. 456 Oak Ave - 11:30 AM   │ ← Stop list preview
│ 3. 789 Pine Rd - 12:00 PM   │
│ ...                         │
└─────────────────────────────┘
```

#### Active Route

**Layout:**
```
┌─────────────────────────────┐
│ Stop 3 of 12     [⚠️] [☀️] │ ← Progress + exception + contrast
├─────────────────────────────┤
│ ████████░░░░  25% complete  │ ← Progress bar
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 789 Pine Road           │ │
│ │ Apt 4B                  │ │
│ │ Covina, CA 91723        │ │ ← Current stop card
│ │                         │ │
│ │ Window: 12:00 - 1:00 PM │ │
│ │ Customer: Jane D.       │ │
│ │ Note: "Gate code: 1234" │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ Items to Deliver            │
│ • 2x Mohinga                │
│ • 1x Ohn No Khao Swe       │ ← Items list
│ • 1x Tea Leaf Salad         │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │      Navigate 📍        │ │ ← Navigation button
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │      I've Arrived       │ │ ← Arrived button (appears after nav)
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

#### Photo Capture

**Layout:**
```
┌─────────────────────────────┐
│ Delivery Photo    [← Back]  │
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │                         │ │
│ │    Camera Viewfinder    │ │ ← Camera preview (70% viewport)
│ │                         │ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│ Take a photo of the         │
│ delivered order             │ ← Instruction text
│                             │
│      ┌───────────────┐      │
│      │       📷      │      │ ← Capture button (large, centered)
│      └───────────────┘      │
│                             │
│    Skip photo (why?) →      │ ← Skip option (secondary)
└─────────────────────────────┘
```

#### High-Contrast Mode

When enabled:
- Background: Pure white (#FFFFFF)
- Text: Pure black (#000000)
- Buttons: High-contrast yellow (#FFCC00) with black text
- Minimum text size: 18px
- Border widths: 2px minimum
- All color contrast: 7:1 minimum

---

### Admin Visual Specifications

#### Dashboard

**Layout (Desktop):**
```
┌───────────────────────────────────────────────────────────────┐
│ [Logo]  Dashboard | Orders | Drivers | Analytics | Menu      │ ← Nav
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ 45       │ │ 4        │ │ 2        │ │ $4,230   │        │ ← KPI row
│  │ Orders   │ │ Drivers  │ │ Exceptions│ │ Revenue  │        │
│  │ ↑12%     │ │ All Active│ │ ↓1       │ │ ↑8%      │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                               │
│  ┌─────────────────────────┐ ┌─────────────────────────────┐ │
│  │                         │ │ Exceptions (2)              │ │
│  │                         │ │ ┌─────────────────────────┐ │ │
│  │       Live Map          │ │ │ Order #234 - No answer  │ │ │
│  │     (Driver pins)       │ │ │ [View] [Call] [Resolve] │ │ │ ← Exception cards
│  │                         │ │ └─────────────────────────┘ │ │
│  │                         │ │ ┌─────────────────────────┐ │ │
│  │                         │ │ │ Order #256 - Wrong addr │ │ │
│  └─────────────────────────┘ │ │ [View] [Call] [Resolve] │ │ │
│                              │ └─────────────────────────┘ │ │
│  ┌─────────────────────────┐ └─────────────────────────────┘ │
│  │ Driver Progress         │                                 │
│  │ ┌─────────────────────┐ │                                 │
│  │ │ John D. ███████░░ 7/12│ │                               │
│  │ │ On schedule          │ │ ← Driver cards                 │
│  │ └─────────────────────┘ │                                 │
│  │ ┌─────────────────────┐ │                                 │
│  │ │ Sarah M. ████░░░░ 4/10│ │                               │
│  │ │ ⚠️ 15 min behind     │ │                                │
│  │ └─────────────────────┘ │                                 │
│  └─────────────────────────┘                                 │
└───────────────────────────────────────────────────────────────┘
```

**Exception Card:**
- Background: white with red-100 left border (4px)
- Header: Order ID + exception type
- Content: Address, customer name, driver name
- Actions: View Details, Call Customer, Call Driver, Resolve (all inline buttons)
- Resolve opens inline form for notes

**Driver Card:**
- Background: cream-darker
- Progress bar: jade for on-time, warning for behind, error for very behind
- Info: Name, stops completed/total, time status
- Click to expand: Shows full route detail

**KPI Card:**
- Large number (Playfair, 36px)
- Label (DM Sans, 14px, muted)
- Comparison: Arrow + percentage (jade for up, error for down)
- Click: Opens detailed view/chart

---

### Component Library Summary

#### Buttons

| Variant | Use | Style |
|---------|-----|-------|
| Primary | Main actions | Saffron bg, white text, rounded-md |
| Secondary | Supporting actions | White bg, charcoal text, saffron border |
| Ghost | Subtle actions | Transparent, charcoal text |
| Danger | Destructive | Error bg, white text |
| Disabled | Inactive | Gray bg, muted text, no pointer |

#### Inputs

| Type | Use | Notes |
|------|-----|-------|
| Text | General input | 44px height, rounded-sm, border |
| Search | Menu search | With search icon, autocomplete |
| Textarea | Notes | Auto-grow, 88px min height |
| Select | Dropdowns | Native or custom dropdown |
| Radio | Single select | Custom styled, saffron when selected |
| Checkbox | Multi select | Custom styled, saffron checkmark |

#### Cards

| Type | Use | Notes |
|------|-----|-------|
| Item Card | Menu items | Image, name, price, clickable |
| Order Card | Order history | Summary, status, reorder button |
| Driver Card | Admin dashboard | Progress, status, expandable |
| Exception Card | Admin alerts | Red accent, inline actions |
| Stop Card | Driver app | Address, items, actions |

#### Feedback

| Type | Use | Style |
|------|-----|-------|
| Toast | Success/error messages | Slides in from top, auto-dismiss |
| Loading skeleton | Content loading | Gray shimmer animation |
| Spinner | Action loading | Saffron color, centered |
| Progress bar | Route progress | Saffron fill on gray track |
| Badge | Counts, status | Pills with semantic colors |

---

### Accessibility Requirements (WCAG 2.1 AA)

1. **Color Contrast**
   - Normal text: 4.5:1 minimum
   - Large text (18px+): 3:1 minimum
   - UI components: 3:1 minimum

2. **Keyboard Navigation**
   - All interactive elements focusable
   - Visible focus ring (saffron, 2px offset)
   - Logical tab order
   - Escape closes modals

3. **Screen Readers**
   - ARIA labels on all icons
   - Proper heading hierarchy (h1 → h6)
   - Form labels associated with inputs
   - Live regions for dynamic content

4. **Touch Targets**
   - Minimum 44px × 44px
   - Driver app: 56px minimum

5. **Motion**
   - Respect prefers-reduced-motion
   - No auto-playing animations
   - Provide pause controls for carousels

---

### Animation Specifications

#### Page Transitions
- Fade + slide up (300ms, ease-out)
- Modal: Scale in from 95% + fade (300ms)

#### Micro-interactions
- Button hover: Scale 1.02 (150ms)
- Button press: Scale 0.98 (100ms)
- Card hover: Shadow increase + scale 1.01 (150ms)
- Toggle: Slide (200ms, ease-in-out)

#### Loading States
- Skeleton shimmer: 1.5s linear infinite
- Spinner: 1s linear infinite rotation
- Progress bar: Width transition (300ms)

#### Celebrations
- Order confirmation: Confetti burst (500ms)
- Delivery complete: Check animation + pulse (500ms)
- Route complete: Stats slide in sequence (staggered 100ms each)

---

## Verification Checklist

### Pass 1: Mental Model ✓
- [x] Primary intent identified for all 3 user types
- [x] Misconceptions enumerated
- [x] Reinforcement principles defined

### Pass 2: Information Architecture ✓
- [x] All concepts enumerated
- [x] Logical groupings created
- [x] Primary/Secondary/Hidden classified

### Pass 3: Affordances ✓
- [x] All actions mapped
- [x] Visual signals defined
- [x] Affordance rules established

### Pass 4: Cognitive Load ✓
- [x] Friction points identified
- [x] Simplifications defined
- [x] Defaults introduced

### Pass 5: State Design ✓
- [x] All major elements have state tables
- [x] Empty/Loading/Success/Partial/Error covered
- [x] User understanding and actions defined

### Pass 6: Flow Integrity ✓
- [x] Flow risks identified
- [x] Mitigations defined
- [x] Visibility decisions made
- [x] UX constraints documented

### Visual Specifications ✓
- [x] Design system tokens defined
- [x] Color palettes (light + dark)
- [x] Typography scale
- [x] Spacing and layout
- [x] Component specifications
- [x] Responsive breakpoints
- [x] Accessibility requirements
- [x] Animation specifications

---

## Next Steps

This UX specification is ready for:
1. **Phase 4**: Generate build-order prompts using `/ux-prompts`
2. **Design implementation**: Use with v0, Bolt, or `/frontend-design`
3. **Development reference**: Detailed specs for engineering team
