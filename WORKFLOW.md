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

## Implementation Status

### V1 (COMPLETE - All 4 Sprints)

- ✅ Sprint 1: Menu Browse (6/6 tasks)
- ✅ Sprint 2: Cart + Checkout (7/7 tasks)
- ✅ Sprint 3: Payment + Confirmation (7/7 tasks)
- ✅ Sprint 4: Admin Basics (5/5 tasks)

### V2 Progress

#### Sprint 1: Admin Route Management (COMPLETE)

```
✅ V2 Database migration (drivers, routes, route_stops, etc.)
✅ V2 Type definitions
✅ Driver management API (CRUD + activate/deactivate)
✅ Driver management UI (table, search, filter, modal)
✅ Route management API (CRUD + stops)
✅ Route management UI (date filter, status, create modal)
✅ Route optimization service (Google Routes API)
✅ Admin nav updates
```

#### Sprint 2: Driver Mobile Interface (COMPLETE)

```
✅ Driver auth + protected routes (role check in layout)
✅ Driver mobile API endpoints:
   ├── GET /api/driver/me
   ├── GET /api/driver/routes/active
   ├── GET /api/driver/routes/history
   ├── POST /api/driver/routes/[id]/start
   ├── POST /api/driver/routes/[id]/complete
   ├── PATCH /api/driver/routes/[id]/stops/[stopId]
   ├── POST /api/driver/routes/[id]/stops/[stopId]/photo
   ├── POST /api/driver/routes/[id]/stops/[stopId]/exception
   └── POST /api/driver/location
✅ Driver mobile UI components:
   ├── DriverShell, DriverNav, DriverHeader
   ├── ActiveRouteView, StopList, StopCard
   ├── StopDetailView, DeliveryActions
   ├── PhotoCapture, ExceptionModal
   ├── LocationTracker, OfflineBanner
   └── NavigationButton
✅ GPS tracking with adaptive intervals (2-10 min based on speed)
✅ Offline support (IndexedDB + Service Worker)
✅ Delivery photos storage bucket + RLS policies
✅ Route history page
```

#### Sprint 3: Customer Tracking (COMPLETE)

```
✅ Tracking types + validation schemas
✅ ETA calculation utility (Haversine + stop buffer)
✅ Tracking API endpoint (GET /api/tracking/{orderId})
✅ Realtime subscription hook (Supabase + polling fallback)
✅ Tracking UI components:
   ├── StatusTimeline, ETADisplay
   ├── DeliveryMap, DriverCard
   ├── OrderSummary, SupportActions
   └── TrackingPageClient
✅ Customer tracking page (/orders/[id]/tracking)
✅ E2E tests for tracking flows
```

#### Sprint 4: Analytics & Notifications (COMPLETE)

```
✅ Database migration (notification_logs, driver_ratings, materialized views)
✅ Analytics type definitions (DriverStats, DeliveryMetrics)
✅ Validation schemas + unit tests
✅ Email notification Edge Function:
   ├── out_for_delivery template
   ├── arriving_soon template
   └── delivered template
✅ Driver analytics API:
   ├── GET /api/admin/analytics/drivers
   └── GET /api/admin/analytics/drivers/[driverId]
✅ Delivery metrics API:
   └── GET /api/admin/analytics/delivery
✅ Rating API:
   ├── POST /api/orders/[orderId]/rating
   └── GET /api/orders/[orderId]/rating
✅ Animated UI components:
   ├── AnimatedCounter (spring physics)
   ├── MetricCard (trend indicators)
   ├── DriverLeaderboard (medals)
   ├── StarRating (interactive)
   ├── PerformanceChart (Recharts)
   ├── DeliverySuccessChart
   ├── PeakHoursChart
   └── ExceptionBreakdown
✅ Driver analytics dashboard (/admin/analytics/drivers)
✅ Delivery metrics dashboard (/admin/analytics/delivery)
✅ Customer feedback UI (/orders/[id]/feedback)
✅ Admin nav updates with Analytics section
✅ E2E tests for dashboards + feedback
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
