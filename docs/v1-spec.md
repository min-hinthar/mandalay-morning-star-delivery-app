# docs/v1-spec.md — V1 Feature Specifications

> **Version**: 1.0
> **Status**: Active Development
> **Target**: Week 4

---

## 1. Menu Browse System

### 1.1 User Stories

**US-1.1.1**: As a customer, I want to browse menu items by category so I can quickly find what I want.

**US-1.1.2**: As a customer, I want to search for menu items by name so I can find specific dishes.

**US-1.1.3**: As a customer, I want to see item details with modifiers so I can customize my order.

**US-1.1.4**: As a customer, I want to see Burmese names alongside English so I recognize traditional dishes.

### 1.2 Acceptance Criteria

#### Category Tabs
- [ ] Horizontal scrollable tabs on mobile
- [ ] Sticky below header on scroll
- [ ] Active tab visually highlighted
- [ ] Clicking tab scrolls to category section
- [ ] "All" pseudo-tab shows everything
- [ ] Order matches `sort_order` from DB
- [ ] Only `is_active` categories displayed

#### Menu Grid
- [ ] Responsive grid: 1 col mobile, 2 col tablet, 3-4 col desktop
- [ ] Item cards show: image, name_en, name_my, base_price
- [ ] Sold out items show overlay + disabled
- [ ] "Popular" badge on featured items
- [ ] Allergen icons displayed (hover for labels)
- [ ] Skeleton loading states
- [ ] Empty state if no items

#### Search
- [ ] Search input in header (expandable on mobile)
- [ ] Debounce: 300ms
- [ ] Searches: name_en, name_my, description_en
- [ ] Results update grid in real-time
- [ ] "No results" state with suggestions
- [ ] Clear button resets to category view

#### Item Detail Modal
- [ ] Opens on card click
- [ ] Large image (if available)
- [ ] Full description
- [ ] Modifier groups with selection UI
- [ ] Quantity selector (1-50)
- [ ] Optional notes textarea (500 char max)
- [ ] Live price calculation
- [ ] "Add to Cart" button (disabled if required modifiers missing)
- [ ] Allergen warnings prominent
- [ ] Close on backdrop click or X button
- [ ] Trap focus for accessibility

### 1.3 Component Hierarchy

```
MenuPage
├── MenuHeader
│   ├── SearchInput
│   └── CartButton (with badge)
├── CategoryTabs
│   └── CategoryTab[] (horizontal scroll)
├── MenuGrid
│   ├── CategorySection[]
│   │   ├── CategoryHeader
│   │   └── ItemCard[] (grid)
│   └── EmptyState (if no results)
└── ItemDetailModal
    ├── ItemImage
    ├── ItemInfo
    │   ├── NameDisplay (en + my)
    │   ├── Description
    │   ├── AllergenBadges
    │   └── PriceDisplay
    ├── ModifierSection[]
    │   ├── GroupHeader
    │   └── ModifierOption[] (radio/checkbox)
    ├── QuantitySelector
    ├── NotesInput
    └── AddToCartButton
```

### 1.4 API Contracts

#### GET /api/menu

```typescript
// Response
{
  data: {
    categories: Array<{
      id: string;
      slug: string;
      name: string;
      sortOrder: number;
      items: Array<{
        id: string;
        slug: string;
        nameEn: string;
        nameMy: string;
        descriptionEn: string;
        imageUrl: string | null;
        basePriceCents: number;
        isActive: boolean;
        isSoldOut: boolean;
        tags: string[];
        allergens: string[];
        modifierGroups: Array<{
          id: string;
          slug: string;
          name: string;
          selectionType: 'single' | 'multiple';
          minSelect: number;
          maxSelect: number;
          options: Array<{
            id: string;
            slug: string;
            name: string;
            priceDeltaCents: number;
            isActive: boolean;
          }>;
        }>;
      }>;
    }>;
  };
  meta: { timestamp: string };
}
```

#### GET /api/menu/search?q={query}

```typescript
// Response
{
  data: {
    items: Array<MenuItem>; // Same shape as above
    query: string;
    count: number;
  };
}
```

### 1.5 Edge Cases

| Case | Handling |
|------|----------|
| All items sold out in category | Show category with all items disabled |
| No categories active | Show "Menu coming soon" message |
| Image fails to load | Show placeholder image |
| Very long item name | Truncate with ellipsis, full name in modal |
| 50+ modifier options | Scrollable list with search (future) |
| Required modifier group with all options inactive | Error state, block add to cart |

### 1.6 Test Plan

**Unit Tests**
- [ ] Price calculation with modifiers
- [ ] Modifier validation (min/max selection)
- [ ] Search filtering logic
- [ ] Category sorting

**Integration Tests**
- [ ] Menu API returns expected structure
- [ ] Search API filters correctly
- [ ] Sold out items not orderable

**E2E Tests**
- [ ] Browse categories, click item, add to cart
- [ ] Search for item, view details, add with modifiers
- [ ] Verify sold out item cannot be added

---

## 2. Cart System

### 2.1 User Stories

**US-2.1.1**: As a customer, I want to see my cart items so I can review before checkout.

**US-2.1.2**: As a customer, I want to update quantities or remove items so I can adjust my order.

**US-2.1.3**: As a customer, I want to see the delivery fee rule so I know how to get free delivery.

### 2.2 Acceptance Criteria

#### Cart Drawer
- [ ] Slide-in from right
- [ ] Shows all cart items with modifiers
- [ ] Quantity +/- buttons per item
- [ ] Remove item (trash icon)
- [ ] Item subtotal per line
- [ ] Items subtotal
- [ ] Delivery fee (with threshold message)
- [ ] Estimated total (pre-tax)
- [ ] "Continue Shopping" closes drawer
- [ ] "Checkout" navigates to checkout (requires auth)
- [ ] Empty state with CTA to browse menu
- [ ] Persists across page navigation (local storage)
- [ ] Badge on cart icon shows item count

#### Fee Display Logic
```
if (itemsSubtotal < $100):
  "Delivery: $15"
  "Add $X more for FREE delivery!"
else:
  "Delivery: FREE ✓"
```

### 2.3 State Shape (Zustand)

```typescript
interface CartStore {
  items: CartItem[];
  
  // Actions
  addItem: (item: CartItem) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  
  // Computed (for UI only)
  getItemsSubtotal: () => number;
  getEstimatedDeliveryFee: () => number;
  getItemCount: () => number;
}

interface CartItem {
  cartItemId: string; // Client-generated UUID
  menuItemId: string;
  menuItemSlug: string;
  nameEn: string;
  nameMy: string;
  basePriceCents: number;
  quantity: number;
  modifiers: SelectedModifier[];
  notes: string;
  addedAt: string; // ISO timestamp
}

interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDeltaCents: number;
}
```

### 2.4 Edge Cases

| Case | Handling |
|------|----------|
| Item no longer exists | Show warning, allow removal |
| Item now sold out | Show warning, suggest removal |
| Price changed since added | Server recalculates at checkout |
| Cart exceeds 50 items | Block adding more, show message |
| Modifier no longer available | Show warning at checkout |

---

## 3. Checkout Flow

### 3.1 User Stories

**US-3.1.1**: As a customer, I want to select my delivery address so the kitchen knows where to deliver.

**US-3.1.2**: As a customer, I want to choose a Saturday time window so I receive my order at a convenient time.

**US-3.1.3**: As a customer, I want to pay securely so my payment information is protected.

### 3.2 Checkout Stepper

```
Step 1: Address    Step 2: Time    Step 3: Payment    Step 4: Confirm
   ●─────────────────○─────────────────○─────────────────○
```

### 3.3 Step 1: Address Selection

#### Acceptance Criteria
- [ ] List of saved addresses
- [ ] Add new address form
- [ ] Address validation via Google Geocoding
- [ ] Coverage check on selection
- [ ] Coverage failure shows: distance, reason, alternatives
- [ ] Edit existing address
- [ ] Set default address
- [ ] Delete address (confirm dialog)
- [ ] Delivery notes field (per-order)

#### Address Form Fields
```typescript
{
  label: string;        // "Home", "Work", custom
  line1: string;        // Street address
  line2?: string;       // Apt, suite, etc.
  city: string;
  state: string;        // Default: "CA"
  postalCode: string;   // 5-digit
}
```

#### Coverage Validation Response
```typescript
{
  isValid: boolean;
  distanceMiles: number;
  durationMinutes: number;
  reason?: 'DISTANCE_EXCEEDED' | 'DURATION_EXCEEDED' | 'GEOCODE_FAILED';
  formattedAddress: string;
  coordinates: { lat: number; lng: number };
}
```

### 3.4 Step 2: Time Window Selection

#### Acceptance Criteria
- [ ] Show Saturday date (this Saturday or next)
- [ ] Display cutoff warning if approaching Friday 15:00
- [ ] If past cutoff, auto-select next Saturday
- [ ] Hourly slots from 11:00 to 18:00 (last slot 18:00-19:00)
- [ ] Slots shown as cards/buttons
- [ ] Selected slot highlighted
- [ ] No slot availability logic in V1 (all slots available)

#### Time Window Options
```typescript
const TIME_WINDOWS = [
  { start: '11:00', end: '12:00', label: '11:00 AM - 12:00 PM' },
  { start: '12:00', end: '13:00', label: '12:00 PM - 1:00 PM' },
  { start: '13:00', end: '14:00', label: '1:00 PM - 2:00 PM' },
  { start: '14:00', end: '15:00', label: '2:00 PM - 3:00 PM' },
  { start: '15:00', end: '16:00', label: '3:00 PM - 4:00 PM' },
  { start: '16:00', end: '17:00', label: '4:00 PM - 5:00 PM' },
  { start: '17:00', end: '18:00', label: '5:00 PM - 6:00 PM' },
  { start: '18:00', end: '19:00', label: '6:00 PM - 7:00 PM' },
];
```

#### Cutoff Logic
```typescript
// lib/utils/dates.ts
export function getDeliveryDate(): { date: Date; isNextWeek: boolean } {
  const now = new Date();
  const tz = 'America/Los_Angeles';
  
  // Get this Saturday
  const saturday = getNextSaturday(now, tz);
  
  // Get cutoff (Friday 15:00 PT)
  const cutoff = getCutoffForSaturday(saturday, tz);
  
  if (now > cutoff) {
    // Past cutoff, use next Saturday
    return { 
      date: addDays(saturday, 7), 
      isNextWeek: true 
    };
  }
  
  return { date: saturday, isNextWeek: false };
}
```

### 3.5 Step 3: Payment (Stripe Redirect)

#### Flow
1. User clicks "Pay Now"
2. Client calls `POST /api/checkout/session`
3. Server validates cart + address + time window
4. Server creates order (status: `pending_payment`)
5. Server creates Stripe Checkout Session
6. Server returns session URL
7. Client redirects to Stripe
8. User completes payment
9. Stripe redirects to success URL
10. Webhook updates order to `paid`

#### API: POST /api/checkout/session

```typescript
// Request
{
  addressId: string;
  timeWindowStart: string; // "14:00"
  timeWindowEnd: string;   // "15:00"
  scheduledDate: string;   // "2026-01-18"
  items: Array<{
    menuItemId: string;
    quantity: number;
    modifiers: Array<{ optionId: string }>;
    notes?: string;
  }>;
  customerNotes?: string;
}

// Response (success)
{
  data: {
    sessionUrl: string;
    orderId: string;
  };
}

// Response (error)
{
  error: {
    code: 'COVERAGE_INVALID' | 'CUTOFF_PASSED' | 'ITEM_UNAVAILABLE' | 'VALIDATION_ERROR';
    message: string;
    details?: any[];
  };
}
```

#### Server-Side Calculation (Critical)

```typescript
// NEVER trust client-side calculations
async function calculateOrderTotals(cartItems: CartItem[], db: Database) {
  let itemsSubtotalCents = 0;
  
  for (const item of cartItems) {
    // Fetch current price from DB
    const menuItem = await db.menuItems.findById(item.menuItemId);
    if (!menuItem || !menuItem.isActive || menuItem.isSoldOut) {
      throw new Error(`Item unavailable: ${item.menuItemId}`);
    }
    
    let itemPrice = menuItem.basePriceCents;
    
    // Add modifier deltas
    for (const mod of item.modifiers) {
      const option = await db.modifierOptions.findById(mod.optionId);
      if (!option || !option.isActive) {
        throw new Error(`Modifier unavailable: ${mod.optionId}`);
      }
      itemPrice += option.priceDeltaCents;
    }
    
    itemsSubtotalCents += itemPrice * item.quantity;
  }
  
  const deliveryFeeCents = itemsSubtotalCents < 10000 ? 1500 : 0;
  const taxCents = 0; // V1: taxes handled externally or not charged
  const tipCents = 0; // V1: tips optional, added later if enabled
  const discountCents = 0; // V1: no coupons yet
  
  const totalCents = itemsSubtotalCents + deliveryFeeCents + taxCents + tipCents - discountCents;
  
  return {
    itemsSubtotalCents,
    deliveryFeeCents,
    taxCents,
    tipCents,
    discountCents,
    totalCents,
  };
}
```

### 3.6 Step 4: Confirmation

#### Success Page Content
- [ ] Order number
- [ ] Order status badge
- [ ] Delivery date + time window
- [ ] Delivery address
- [ ] Order items summary
- [ ] Payment summary (subtotal, fee, total)
- [ ] "Track Order" button
- [ ] "Continue Shopping" button

---

## 4. Order Management (Customer)

### 4.1 User Stories

**US-4.1.1**: As a customer, I want to view my order history so I can track past and current orders.

**US-4.1.2**: As a customer, I want to see order status updates so I know when to expect delivery.

### 4.2 Order History Page

#### Acceptance Criteria
- [ ] List of orders, newest first
- [ ] Status badge per order
- [ ] Delivery date + time window
- [ ] Order total
- [ ] Click to view details
- [ ] Pagination (20 per page)
- [ ] Empty state for new users

### 4.3 Order Status Page

#### Acceptance Criteria
- [ ] Status timeline visualization
- [ ] Current status highlighted
- [ ] Timestamps for completed statuses
- [ ] Order details (items, address, totals)
- [ ] Map placeholder (V2: live tracking)
- [ ] Contact support CTA
- [ ] Cancel button (if before cutoff)

#### Status Timeline

```
○ Order Placed (paid)
│
○ Confirmed (after cutoff)
│
○ In Kitchen
│
○ Out for Delivery
│
● Delivered
```

### 4.4 Order Status Enum

```typescript
type OrderStatus =
  | 'draft'           // Cart not yet paid
  | 'pending_payment' // Checkout session created
  | 'paid'            // Payment received
  | 'confirmed'       // Locked in for delivery
  | 'in_kitchen'      // Being prepared
  | 'out_for_delivery'// Driver dispatched
  | 'delivered'       // Complete
  | 'canceled'        // Canceled before cutoff
  | 'refunded';       // Refunded by admin
```

---

## 5. Admin Dashboard (Basics)

### 5.1 User Stories

**US-5.1.1**: As an admin, I want to manage menu items so I can update offerings.

**US-5.1.2**: As an admin, I want to view orders so I can manage fulfillment.

### 5.2 Admin Menu Management

#### Acceptance Criteria
- [ ] List all menu items (table view)
- [ ] Filter by category, status (active/inactive/sold out)
- [ ] Search by name
- [ ] Add new item form
- [ ] Edit existing item
- [ ] Toggle sold out status
- [ ] Toggle active status
- [ ] Delete item (soft delete, preserve for orders)
- [ ] Reorder items within category
- [ ] Manage categories (CRUD)
- [ ] Manage modifier groups (CRUD)

### 5.3 Admin Order Management

#### Acceptance Criteria
- [ ] List orders (table view)
- [ ] Filter by status, date, customer
- [ ] View order details
- [ ] Update order status manually
- [ ] Add internal notes
- [ ] Cancel order (triggers refund flow)
- [ ] Export orders (CSV)

---

## 6. Webhook Handling

### 6.1 Stripe Webhooks

#### Events to Handle

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Mark order as `paid` |
| `payment_intent.payment_failed` | Mark order as failed, notify user |
| `charge.refunded` | Mark order as `refunded`, update amounts |

#### Handler Flow

```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  
  // 1. Verify signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 });
  }
  
  // 2. Handle event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    case 'charge.refunded':
      await handleRefund(event.data.object);
      break;
  }
  
  return new Response('OK', { status: 200 });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  
  await db.orders.update({
    where: { id: orderId },
    data: {
      status: 'paid',
      stripePaymentIntentId: session.payment_intent,
      updatedAt: new Date(),
    },
  });
  
  // Send confirmation email
  await sendOrderConfirmationEmail(orderId);
}
```

---

## 7. Security Requirements

### 7.1 Input Validation (All Routes)

```typescript
// Every API route must:
// 1. Parse body with Zod schema
// 2. Validate auth if required
// 3. Check role permissions
// 4. Return structured errors

import { z } from 'zod';

const schema = z.object({
  addressId: z.string().uuid(),
  // ... other fields
});

export async function POST(request: Request) {
  const body = await request.json();
  const result = schema.safeParse(body);
  
  if (!result.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', details: result.error.issues } },
      { status: 400 }
    );
  }
  
  // Use result.data (typed and validated)
}
```

### 7.2 RLS Policies (Required)

| Table | Customer | Admin | Driver |
|-------|----------|-------|--------|
| profiles | Read/update own | Read all | Read own |
| addresses | CRUD own | Read all | None |
| orders | Read own, create | CRUD all | Read assigned |
| order_items | Read own orders | Read all | Read assigned |
| menu_* | Read active | CRUD all | Read active |

---

## 8. Test Plan Summary

### Unit Tests (50+ cases)
- Price calculations
- Fee threshold logic
- Date/time utilities
- Validation schemas
- Coverage calculation

### Integration Tests (20+ cases)
- Menu API responses
- Checkout session creation
- Webhook processing
- Order state transitions
- RLS policy enforcement

### E2E Tests (10+ scenarios)
- Full happy path
- Out of coverage flow
- Sold out item handling
- Cart persistence
- Auth required flows
- Admin menu CRUD
- Admin order management

---

## 9. Rollout Checklist

- [ ] Environment variables configured
- [ ] Supabase migrations applied
- [ ] RLS policies enabled
- [ ] Stripe webhooks configured
- [ ] Google Maps API keys set
- [ ] Menu data seeded
- [ ] Test order placed successfully
- [ ] Mobile responsive verified
- [ ] Performance tested (Lighthouse)
- [ ] Error tracking configured
- [ ] Monitoring dashboards set up
