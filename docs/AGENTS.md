# Codex.md — Implementation Workflow (v2.0)

> **Role**: Codex implements. Claude plans and reviews.
> **Last Updated**: 2026-01-13

---

## Prime Directive

Implement only what the specs say. If specs are unclear:
1. Check linked documentation first
2. If still unclear, create an issue or ask Claude

---

## Required Reading (Before Any Work)

| Priority | Document | Purpose |
|----------|----------|---------|
| 🔴 Must | [CLAUDE.md](CLAUDE.md) | Project memory + quick ref |
| 🔴 Must | [docs/v1-spec.md](docs/v1-spec.md) | V1 feature specs |
| 🟡 Important | [docs/architecture.md](docs/architecture.md) | System design |
| 🟡 Important | [docs/frontend-design-system.md](docs/frontend-design-system.md) | UI/UX patterns |
| 🟡 Important | [docs/component-guide.md](docs/component-guide.md) | Frontend Component Implementation Guide |
| 🟢 Reference | [docs/00-context-pack.md](docs/00-context-pack.md) | Business rules, personas, core flows |
| 🟢 Reference | [docs/04-data-model.md](docs/04-data-model.md) | Database schema |
| 🟢 Reference | [docs/05-menu.md](docs/05-menu.md) | Menu system + modifier patterns |
| 🟢 Reference | [docs/06-stripe.md](docs/06-stripe.md) | Payment flow |

---

## Branch / PR Discipline

### Branch Naming
```
feat/<area>-<short>   → feat/menu-category-tabs
fix/<area>-<short>    → fix/cart-modifier-total
chore/<short>         → chore/update-deps
docs/<short>          → docs/api-contracts
```

### PR Rules
- One branch, one PR, one focused change
- No drive-by refactors
- Screenshots/GIFs for UI changes
- Test evidence required

---

## V1 Implementation Order

### Sprint 1: Menu Browse (Days 1-5)

```
Task 1.1: Menu Data Layer
├── Create menu API route (GET /api/menu)
├── Create React Query hooks (useMenu, useMenuSearch)
├── Create menu types (types/menu.ts)
└── Test: Menu API returns expected structure

Task 1.2: Category Tabs Component
├── Create CategoryTabs component
├── Implement horizontal scroll (mobile)
├── Implement sticky behavior
├── Add active state styling
└── Test: Clicking tab scrolls to section

Task 1.3: Item Card Component
├── Create ItemCard component
├── Implement sold out overlay
├── Implement popular badge
├── Implement allergen icons
├── Add hover/tap states (Framer Motion)
└── Test: Card renders all states correctly

Task 1.4: Menu Grid Layout
├── Create MenuGrid component
├── Implement responsive columns (1/2/3/4)
├── Implement category sections
├── Add skeleton loading states
└── Test: Grid is responsive

Task 1.5: Search Component
├── Create SearchInput component
├── Implement debounced search (300ms)
├── Create search API route (GET /api/menu/search)
├── Update grid with search results
└── Test: Search filters items correctly

Task 1.6: Item Detail Modal
├── Create ItemDetailModal component
├── Implement modifier group UI (radio/checkbox)
├── Implement quantity selector
├── Implement notes textarea
├── Calculate live price
├── Add "Add to Cart" button
└── Test: Modifiers calculate price correctly
```

### Sprint 2: Cart System (Days 6-10)

```
Task 2.1: Cart State (Zustand)
├── Create cart store (stores/cart.ts)
├── Implement addItem, updateQuantity, removeItem, clearCart
├── Implement computed values (subtotal, fee, count)
├── Persist to localStorage
└── Test: Cart state persists across refresh

Task 2.2: Cart Drawer Component
├── Create CartDrawer component (Sheet)
├── Implement CartItem component
├── Implement cart summary (subtotal, fee)
├── Add delivery fee threshold message
├── Implement empty state
└── Test: Drawer opens/closes, items editable

Task 2.3: Cart Icon Badge
├── Add cart icon to header
├── Implement badge with item count
├── Add bounce animation on add
└── Test: Badge updates on cart change

Task 2.4: Address Management
├── Create address API routes (CRUD)
├── Create AddressForm component
├── Create AddressList component
├── Implement address validation UI
└── Test: User can add/edit/delete addresses
```

### Sprint 3: Checkout Flow (Days 11-18)

```
Task 3.1: Coverage Validation
├── Create coverage API route (POST /api/coverage/check)
├── Integrate Google Geocoding API
├── Integrate Google Routes API
├── Implement distance/duration checks
├── Create CoverageResult component
└── Test: Out-of-range address is rejected

Task 3.2: Time Window Picker
├── Create TimeWindowPicker component
├── Implement cutoff logic (Friday 15:00 PT)
├── Display Saturday date with warning
├── Create time slot buttons
└── Test: Cutoff logic selects correct Saturday

Task 3.3: Checkout Stepper
├── Create CheckoutPage layout
├── Create CheckoutStepper component
├── Implement step navigation
├── Create AddressStep component
├── Create TimeStep component
├── Create ReviewStep component
└── Test: User can navigate steps

Task 3.4: Stripe Integration
├── Create checkout API route (POST /api/checkout/session)
├── Validate cart server-side
├── Calculate totals server-side
├── Create Stripe Checkout Session
├── Create order in DB (pending_payment)
├── Redirect to Stripe
└── Test: Checkout session created correctly

Task 3.5: Webhook Handler
├── Create webhook route (POST /api/webhooks/stripe)
├── Verify Stripe signature
├── Handle checkout.session.completed
├── Update order status to paid
├── Handle payment_intent.payment_failed
└── Test: Webhook updates order correctly

Task 3.6: Confirmation Page
├── Create order confirmation page (/order/[id])
├── Display order details
├── Display payment summary
├── Add "Track Order" button
├── Add "Continue Shopping" button
└── Test: Page displays correct data
```

### Sprint 4: Order Management & Admin (Days 19-25)

```
Task 4.1: Order History Page
├── Create orders page (/orders)
├── Create OrderCard component
├── Implement pagination
├── Create order detail page
└── Test: User sees their orders

Task 4.2: Order Status Page
├── Create OrderTimeline component
├── Display status progression
├── Show timestamps for completed steps
├── Add cancel button (if before cutoff)
└── Test: Timeline reflects current status

Task 4.3: Admin Layout
├── Create admin layout with sidebar
├── Implement role check middleware
├── Create AdminNav component
└── Test: Non-admin cannot access

Task 4.4: Admin Menu CRUD
├── Create menu management page
├── Create MenuItemForm component
├── Create category management
├── Implement activate/sold-out toggles
└── Test: Admin can create/edit items

Task 4.5: Admin Orders View
├── Create orders list page
├── Create filters (status, date)
├── Create order detail view
├── Implement status update
├── Add internal notes
└── Test: Admin can manage orders
```

---

## Code Quality Requirements

### TypeScript
```typescript
// ✅ Good
const calculateSubtotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => {
    const modifierTotal = item.modifiers.reduce(
      (m, mod) => m + mod.priceDeltaCents,
      0
    );
    return sum + (item.basePriceCents + modifierTotal) * item.quantity;
  }, 0);
};

// ❌ Bad
const calculateSubtotal = (items: any) => {
  // ...
};
```

### Component Structure
```tsx
// ✅ Good: Props interface, destructured props, clean JSX
interface ItemCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}

export function ItemCard({ item, onSelect }: ItemCardProps) {
  return (
    <motion.article
      className="..."
      onClick={() => onSelect(item)}
    >
      {/* JSX */}
    </motion.article>
  );
}

// ❌ Bad: Inline types, prop drilling, messy JSX
export function ItemCard(props: any) { ... }
```

### API Routes
```typescript
// ✅ Good: Zod validation, proper error handling
import { z } from 'zod';

const schema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().min(1).max(50),
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
  
  // Use result.data
}
```

---

## Testing Requirements

### Unit Tests (Jest/Vitest)
- [ ] Price calculation with modifiers
- [ ] Delivery fee threshold ($100)
- [ ] Cutoff date calculation
- [ ] Coverage validation logic

### Integration Tests
- [ ] Menu API returns correct structure
- [ ] Checkout session creation
- [ ] Webhook processing
- [ ] Order state transitions

### E2E Tests (Playwright)
- [ ] Full order happy path
- [ ] Out-of-coverage rejection
- [ ] Sold-out item handling
- [ ] Cart persistence
- [ ] Admin menu CRUD

---

## PR Template

```markdown
## What Changed
Brief description of changes.

## Why
Business/technical justification.

## Screenshots/GIF
(Required for UI changes)

## Test Evidence
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing done

## Checklist
- [ ] TypeScript strict, no `any`
- [ ] Lint + typecheck pass
- [ ] RLS policies verified (if DB changes)
- [ ] Zod validation at boundaries
- [ ] Mobile-responsive
- [ ] Loading/error states handled
- [ ] Accessibility basics (focus, ARIA)

## Related
- Closes #123
- Refs docs/v1-spec.md Section 3
```

---

## Security Checklist (Per PR)

- [ ] Prices calculated server-side only
- [ ] RLS policies on new tables
- [ ] Webhook signatures verified
- [ ] Input validated with Zod
- [ ] No secrets in client code
- [ ] Auth checked on protected routes
- [ ] Role checked on admin routes

---

## File Naming Conventions

```
components/
  menu/
    CategoryTabs.tsx        # PascalCase for components
    CategoryTabs.test.tsx   # Test files next to component
    index.ts                # Barrel exports
    
lib/
  utils/
    currency.ts             # camelCase for utilities
    dates.ts
    
app/
  api/
    menu/
      route.ts              # Next.js convention
    checkout/
      session/
        route.ts
        
stores/
  cart.ts                   # Zustand stores
  
types/
  menu.ts                   # Type definitions
  order.ts
```

---

## Common Patterns

### React Query Hook
```typescript
// lib/hooks/useMenu.ts
export function useMenu() {
  return useQuery({
    queryKey: ['menu'],
    queryFn: async () => {
      const res = await fetch('/api/menu');
      if (!res.ok) throw new Error('Failed to fetch menu');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

### Zustand Store
```typescript
// stores/cart.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  // ...
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => ({
        items: [...state.items, item],
      })),
    }),
    { name: 'cart-storage' }
  )
);
```

### API Route with Auth
```typescript
// app/api/orders/route.ts
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED' } },
      { status: 401 }
    );
  }
  
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  return NextResponse.json({ data: orders });
}
```

---

## Definition of Done

A task is complete when:
- [ ] Code implements spec exactly
- [ ] TypeScript compiles with no errors
- [ ] ESLint passes with no warnings
- [ ] Unit tests written and passing
- [ ] Integration tests passing (if applicable)
- [ ] Manual testing on mobile + desktop
- [ ] Screenshots/GIF attached to PR
- [ ] PR reviewed and approved
- [ ] Merged to main
- [ ] Deployed to preview (automatic)
- [ ] `docs/project_status.md` updated, completion percentage updated
