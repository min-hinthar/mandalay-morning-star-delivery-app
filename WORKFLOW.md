# WORKFLOW.md — Implementation Guide (v3.0)

> **Purpose**: Development workflow and implementation patterns for Claude Code.
> **Last Updated**: 2026-01-15

---

## Prime Directive

Implement exactly what the specs say. If specs are unclear:
1. Check linked documentation first
2. If still unclear, ask for clarification

---

## Key Documentation

| Priority | Document | Purpose |
|----------|----------|---------|
| Must | [CLAUDE.md](CLAUDE.md) | Project memory + quick ref |
| Must | [docs/v1-spec.md](docs/v1-spec.md) | V1 feature specs |
| Important | [docs/architecture.md](docs/architecture.md) | System design |
| Important | [docs/frontend-design-system.md](docs/frontend-design-system.md) | UI/UX patterns |
| Important | [docs/component-guide.md](docs/component-guide.md) | Component patterns |
| Reference | [docs/00-context-pack.md](docs/00-context-pack.md) | Business rules |
| Reference | [docs/04-data-model.md](docs/04-data-model.md) | Database schema |
| Reference | [docs/05-menu.md](docs/05-menu.md) | Menu system |
| Reference | [docs/06-stripe.md](docs/06-stripe.md) | Payment flow |

---

## Branch / PR Discipline

### Branch Naming
```
feat/<area>-<short>   → feat/stripe-checkout
fix/<area>-<short>    → fix/webhook-signature
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

### Sprint 1: Menu Browse (COMPLETE)

```
✅ Task 1.1: Menu Data Layer
✅ Task 1.2: Category Tabs Component
✅ Task 1.3: Item Card Component
✅ Task 1.4: Menu Grid Layout
✅ Task 1.5: Search Component
✅ Task 1.6: Item Detail Modal
```

### Sprint 2: Cart + Checkout (COMPLETE)

```
✅ Task 2.1: Cart State (Zustand)
✅ Task 2.2: Cart Drawer Component
✅ Task 2.3: Cart Summary
✅ Task 2.4: Address Management
✅ Task 2.5: Coverage Validation
✅ Task 2.6: Time Window Picker
✅ Task 2.7: Checkout Stepper
```

### Sprint 3: Payment + Confirmation (ACTIVE)

```
⬜ Task 3.1: Stripe Integration
├── Create src/lib/stripe/server.ts
├── Implement POST /api/checkout/session
├── Validate cart server-side
├── Calculate totals server-side
├── Create order in DB (pending_payment)
├── Create Stripe Checkout Session
└── Test: Checkout session created correctly

⬜ Task 3.2: Webhook Handler
├── Implement POST /api/webhooks/stripe
├── Verify Stripe signature
├── Handle checkout.session.completed
├── Update order status to paid
├── Handle payment_intent.payment_failed
└── Test: Webhook updates order correctly

⬜ Task 3.3: Order Creation Flow
├── Update src/types/order.ts to match DB schema
├── Create src/lib/services/order.ts
├── Snapshot prices at order creation
└── Test: Order created with correct totals

⬜ Task 3.4: Confirmation Page
├── Create /orders/[id]/confirmation page
├── Display order details + payment summary
├── Clear cart on successful payment
└── Test: Page displays correct data

⬜ Task 3.5: Order Status Page
├── Create OrderTimeline component
├── Display status progression
├── Show timestamps for completed steps
└── Test: Timeline reflects current status

⬜ Task 3.6: Order History Page
├── Create /orders page
├── Create OrderCard component
├── Implement pagination
└── Test: User sees their orders

⬜ Task 3.7: Email Notifications
├── Create Supabase Edge Function
├── Send order confirmation email
├── Trigger from webhook handler
└── Test: Email sent on order confirmation
```

### Sprint 4: Admin Basics (PENDING)

```
⬜ Task 4.1: Admin Layout
⬜ Task 4.2: Menu Item CRUD
⬜ Task 4.3: Category Management
⬜ Task 4.4: Orders List View
⬜ Task 4.5: Basic Analytics
```

---

## Code Quality Requirements

### TypeScript
```typescript
// GOOD: Explicit types, no any
const calculateSubtotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => {
    const modifierTotal = item.modifiers.reduce(
      (m, mod) => m + mod.priceDeltaCents,
      0
    );
    return sum + (item.basePriceCents + modifierTotal) * item.quantity;
  }, 0);
};

// BAD: Using any
const calculateSubtotal = (items: any) => { /* ... */ };
```

### Component Structure
```tsx
// GOOD: Props interface, destructured props
interface ItemCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}

export function ItemCard({ item, onSelect }: ItemCardProps) {
  return (
    <motion.article className="..." onClick={() => onSelect(item)}>
      {/* JSX */}
    </motion.article>
  );
}
```

### API Routes
```typescript
// GOOD: Zod validation, proper error handling
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

### Unit Tests (Vitest)
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
    MenuItemCard.tsx        # PascalCase for components
    __tests__/
      MenuItemCard.test.tsx # Tests in __tests__ folder
    index.ts                # Barrel exports

lib/
  utils/
    currency.ts             # camelCase for utilities

app/
  api/
    checkout/
      session/
        route.ts            # Next.js convention

stores/
  cart-store.ts             # Zustand stores

types/
  menu.ts                   # Type definitions
```

---

## Common Patterns

### React Query Hook
```typescript
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
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => ({
        items: [...state.items, item],
      })),
    }),
    { name: 'mms-cart' }
  )
);
```

### API Route with Auth
```typescript
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED' } },
      { status: 401 }
    );
  }

  // Continue with authenticated user
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
- [ ] `docs/project_status.md` updated
