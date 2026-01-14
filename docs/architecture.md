# docs/architecture.md — System Architecture (v1.0)

> **Last Updated**: 2026-01-13
> **Status**: Active development (V1)

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Next.js App Router (React 18 + TypeScript)                                 │
│  ├── Public Pages: Menu browse, Coverage check, Order status                │
│  ├── Auth Pages: Login, Register, Password reset                            │
│  ├── Customer Pages: Cart, Checkout, Order history, Profile                 │
│  ├── Admin Pages: Menu CRUD, Orders, Drivers, Analytics                     │
│  └── Driver Pages: Route view, Status updates, Location ping                │
├─────────────────────────────────────────────────────────────────────────────┤
│  UI Layer: Tailwind CSS + shadcn/ui + Framer Motion                         │
│  State: React Query (server) + Zustand (client cart)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  Next.js Route Handlers (app/api/...)                                       │
│  ├── /api/menu/** ─────────────── Menu queries (public)                     │
│  ├── /api/coverage/check ──────── Geocode + route validation                │
│  ├── /api/cart/** ─────────────── Cart operations (auth required)           │
│  ├── /api/checkout/session ────── Create Stripe Checkout Session            │
│  ├── /api/webhooks/stripe ─────── Stripe webhook handler                    │
│  ├── /api/orders/** ───────────── Order queries + mutations                 │
│  ├── /api/admin/** ────────────── Admin operations (role-gated)             │
│  └── /api/driver/** ───────────── Driver operations (role-gated)            │
├─────────────────────────────────────────────────────────────────────────────┤
│  Validation: Zod schemas at all boundaries                                  │
│  Auth: Supabase session verification                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│  SUPABASE            │ │  STRIPE              │ │  GOOGLE MAPS         │
├──────────────────────┤ ├──────────────────────┤ ├──────────────────────┤
│  Auth                │ │  Checkout Sessions   │ │  Geocoding API       │
│  ├── Email/Password  │ │  ├── One-time        │ │  ├── Address → LatLng│
│  ├── OAuth (Google)  │ │  ├── Line items      │ │  └── Validation      │
│  └── Session mgmt    │ │  └── Metadata        │ │                      │
│                      │ │                      │ │  Routes API          │
│  Postgres            │ │  Webhooks            │ │  ├── Distance        │
│  ├── RLS-first       │ │  ├── session.done    │ │  ├── Duration        │
│  ├── All core tables │ │  ├── payment.failed  │ │  └── Polyline        │
│  └── Realtime subs   │ │  └── charge.refunded │ │                      │
│                      │ │                      │ │  Static Maps         │
│  Storage (v2)        │ │  Customer portal     │ │  └── Order tracking  │
│  └── Menu images     │ │  └── Payment methods │ │                      │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘
```

---

## 2. Directory Structure

```
mandalay-morning-star/
├── .github/
│   └── workflows/
│       ├── ci.yml              # Lint, typecheck, test, build
│       └── preview.yml         # Vercel preview deployments
│
├── app/                        # Next.js App Router
│   ├── (public)/               # No auth required
│   │   ├── page.tsx            # Homepage + coverage checker
│   │   ├── menu/
│   │   │   └── page.tsx        # Menu browse
│   │   └── order/[id]/
│   │       └── page.tsx        # Order status (with token)
│   │
│   ├── (auth)/                 # Auth pages (guest only)
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   │
│   ├── (customer)/             # Auth required (customer)
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   └── profile/
│   │
│   ├── (admin)/                # Admin role required
│   │   ├── layout.tsx          # Admin shell
│   │   ├── dashboard/
│   │   ├── menu/
│   │   ├── orders/
│   │   ├── drivers/
│   │   └── settings/
│   │
│   ├── (driver)/               # Driver role required
│   │   ├── route/
│   │   └── history/
│   │
│   ├── api/                    # Route handlers
│   │   ├── menu/
│   │   ├── coverage/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   ├── webhooks/
│   │   ├── admin/
│   │   └── driver/
│   │
│   ├── layout.tsx              # Root layout
│   ├── providers.tsx           # Context providers
│   └── globals.css             # Global styles + theme
│
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── layout/                 # Header, Footer, Nav, Shell
│   ├── menu/                   # MenuGrid, ItemCard, ItemModal, CategoryTabs
│   ├── cart/                   # CartDrawer, CartItem, CartSummary
│   ├── checkout/               # CheckoutStepper, AddressForm, TimeSlotPicker
│   ├── order/                  # OrderTimeline, OrderMap, StatusBadge
│   ├── admin/                  # AdminTable, MenuEditor, OrderManager
│   └── shared/                 # Reusable patterns
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client (cookies)
│   │   ├── admin.ts            # Service role client
│   │   └── types.ts            # Generated DB types
│   │
│   ├── stripe/
│   │   ├── client.ts           # Stripe instance
│   │   ├── webhooks.ts         # Webhook verification
│   │   └── checkout.ts         # Session creation
│   │
│   ├── maps/
│   │   ├── geocode.ts          # Address → coordinates
│   │   ├── coverage.ts         # Distance/duration validation
│   │   └── routing.ts          # Route optimization (v2)
│   │
│   ├── utils/
│   │   ├── dates.ts            # Cutoff, scheduling helpers
│   │   ├── currency.ts         # Formatting, conversion
│   │   ├── validation.ts       # Zod schemas
│   │   └── constants.ts        # Business rule constants
│   │
│   └── hooks/
│       ├── useMenu.ts          # Menu queries
│       ├── useCart.ts          # Cart state
│       ├── useAuth.ts          # Auth state
│       └── useOrder.ts         # Order queries
│
├── stores/
│   └── cart.ts                 # Zustand cart store
│
├── data/
│   └── menu.seed.yaml          # Canonical menu data
│
├── supabase/
│   ├── migrations/             # SQL migrations
│   ├── seed.sql                # Seed data
│   └── config.toml             # Supabase config
│
├── docs/                       # Project documentation
│   ├── 00-context-pack.md
│   ├── 04-data-model.md
│   ├── 05-menu.md
│   ├── 06-stripe.md
│   ├── architecture.md
│   ├── frontend-design-system.md
│   ├── v1-spec.md
│   ├── v2-spec.md
│   ├── project_status.md
│   └── change_log.md
│
├── tests/
│   ├── unit/                   # Unit tests
│   ├── integration/            # API integration tests
│   └── e2e/                    # Playwright E2E tests
│
├── CLAUDE.md                   # Project memory
├── Codex.md                    # Implementation workflow
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── .env.example
```

---

## 3. Data Flow Diagrams

### 3.1 Order Flow (Happy Path)

```
Customer                   Client                    Server                    External
   │                         │                         │                         │
   │ Browse menu             │                         │                         │
   │────────────────────────►│                         │                         │
   │                         │ GET /api/menu           │                         │
   │                         │────────────────────────►│                         │
   │                         │                         │ Query Supabase          │
   │                         │                         │────────────────────────►│
   │                         │◄────────────────────────│◄────────────────────────│
   │◄────────────────────────│                         │                         │
   │                         │                         │                         │
   │ Add to cart             │                         │                         │
   │────────────────────────►│ Zustand store update    │                         │
   │◄────────────────────────│ (local state)           │                         │
   │                         │                         │                         │
   │ Proceed to checkout     │                         │                         │
   │────────────────────────►│                         │                         │
   │                         │ POST /api/checkout      │                         │
   │                         │────────────────────────►│                         │
   │                         │                         │ Validate cart           │
   │                         │                         │ Compute totals          │
   │                         │                         │ Validate coverage       │
   │                         │                         │────────────────────────►│ Google Maps
   │                         │                         │◄────────────────────────│
   │                         │                         │ Create order (draft)    │
   │                         │                         │────────────────────────►│ Supabase
   │                         │                         │◄────────────────────────│
   │                         │                         │ Create Checkout Session │
   │                         │                         │────────────────────────►│ Stripe
   │                         │                         │◄────────────────────────│
   │                         │◄────────────────────────│ Return session URL      │
   │ Redirect to Stripe      │                         │                         │
   │◄────────────────────────│                         │                         │
   │                         │                         │                         │
   │ Complete payment        │                         │                         │
   │────────────────────────────────────────────────────────────────────────────►│ Stripe
   │                         │                         │                         │
   │                         │                         │ Webhook: session.done   │
   │                         │                         │◄────────────────────────│ Stripe
   │                         │                         │ Verify signature        │
   │                         │                         │ Update order → paid     │
   │                         │                         │────────────────────────►│ Supabase
   │                         │                         │◄────────────────────────│
   │                         │                         │                         │
   │ Redirect to success     │                         │                         │
   │◄────────────────────────────────────────────────────────────────────────────│ Stripe
   │                         │ GET /order/{id}         │                         │
   │                         │────────────────────────►│                         │
   │ View confirmation       │                         │                         │
   │◄────────────────────────│◄────────────────────────│                         │
```

### 3.2 Coverage Validation Flow

```
Customer                   Server                    Google Maps
   │                         │                         │
   │ Enter address           │                         │
   │────────────────────────►│                         │
   │                         │ Geocode address         │
   │                         │────────────────────────►│
   │                         │◄────────────────────────│
   │                         │ (lat, lng, formatted)   │
   │                         │                         │
   │                         │ Calculate route         │
   │                         │ Kitchen → Customer      │
   │                         │────────────────────────►│
   │                         │◄────────────────────────│
   │                         │ (distance, duration)    │
   │                         │                         │
   │                         │ Check constraints:      │
   │                         │ distance ≤ 50 miles     │
   │                         │ duration ≤ 90 minutes   │
   │                         │                         │
   │ Coverage result         │                         │
   │◄────────────────────────│                         │
   │ (valid/invalid + reason)│                         │
```

---

## 4. State Management Strategy

### 4.1 Server State (React Query)

```typescript
// Menu data — public, cached aggressively
const { data: menu } = useQuery({
  queryKey: ['menu'],
  queryFn: () => fetch('/api/menu').then(r => r.json()),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// User's orders — auth required, refetch on focus
const { data: orders } = useQuery({
  queryKey: ['orders', userId],
  queryFn: () => fetch('/api/orders').then(r => r.json()),
  enabled: !!userId,
  refetchOnWindowFocus: true,
});

// Single order with realtime — for tracking
const { data: order } = useQuery({
  queryKey: ['order', orderId],
  queryFn: () => fetch(`/api/orders/${orderId}`).then(r => r.json()),
  refetchInterval: (query) => 
    query.state.data?.status === 'out_for_delivery' ? 10000 : false,
});
```

### 4.2 Client State (Zustand)

```typescript
// stores/cart.ts
interface CartItem {
  menuItemId: string;
  menuItemSlug: string;
  name: string;
  basePrice: number;
  quantity: number;
  modifiers: SelectedModifier[];
  notes?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  
  // Computed (client-side for UI only — server recalculates)
  itemsSubtotal: () => number;
  estimatedDeliveryFee: () => number;
  itemCount: () => number;
}
```

---

## 5. Authentication & Authorization

### 5.1 Auth Flow (Supabase)

```typescript
// Middleware: app/middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(/* ... */);
  const { data: { session } } = await supabase.auth.getSession();
  
  // Route protection
  if (request.nextUrl.pathname.startsWith('/checkout')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  return NextResponse.next();
}
```

### 5.2 Role Matrix

| Route | Guest | Customer | Admin | Driver |
|-------|-------|----------|-------|--------|
| `/menu` | ✅ | ✅ | ✅ | ✅ |
| `/cart` | 🔒 | ✅ | ✅ | ❌ |
| `/checkout` | 🔒 | ✅ | ✅ | ❌ |
| `/orders` | 🔒 | ✅ own | ✅ all | ❌ |
| `/admin/**` | ❌ | ❌ | ✅ | ❌ |
| `/driver/**` | ❌ | ❌ | ❌ | ✅ |

🔒 = Redirect to login

---

## 6. API Design Patterns

### 6.1 Response Envelope

```typescript
// Success
{
  "data": { /* payload */ },
  "meta": {
    "timestamp": "2026-01-13T12:00:00Z",
    "version": "v1"
  }
}

// Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": [
      { "field": "address", "message": "Out of delivery coverage" }
    ]
  }
}
```

### 6.2 Zod Validation Pattern

```typescript
// lib/validation.ts
export const createOrderSchema = z.object({
  addressId: z.string().uuid(),
  timeWindowStart: z.string().regex(/^\d{2}:\d{2}$/),
  timeWindowEnd: z.string().regex(/^\d{2}:\d{2}$/),
  items: z.array(z.object({
    menuItemId: z.string().uuid(),
    quantity: z.number().int().min(1).max(50),
    modifiers: z.array(z.object({
      optionId: z.string().uuid(),
    })),
    notes: z.string().max(500).optional(),
  })).min(1),
  customerNotes: z.string().max(1000).optional(),
});

// Route handler
export async function POST(request: Request) {
  const body = await request.json();
  const result = createOrderSchema.safeParse(body);
  
  if (!result.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', details: result.error.issues } },
      { status: 400 }
    );
  }
  
  // Proceed with validated data
  const validated = result.data;
}
```

---

## 7. Performance Considerations

### 7.1 Caching Strategy

| Data | Cache | TTL | Invalidation |
|------|-------|-----|--------------|
| Menu categories | Edge (CDN) | 5 min | On admin update |
| Menu items | Edge (CDN) | 5 min | On admin update |
| User profile | None | - | - |
| Orders | None | - | - |
| Order status | Realtime | - | Supabase subscription |

### 7.2 Bundle Optimization

```typescript
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: ['@radix-ui/*', 'lucide-react'],
  },
};

// Dynamic imports for heavy components
const OrderMap = dynamic(() => import('@/components/order/OrderMap'), {
  loading: () => <MapSkeleton />,
  ssr: false, // Google Maps doesn't SSR
});
```

---

## 8. Error Handling Strategy

### 8.1 Error Boundary Hierarchy

```
RootErrorBoundary (app/error.tsx)
├── AuthErrorBoundary
│   └── Handles auth-related errors, redirects to login
├── CheckoutErrorBoundary
│   └── Preserves cart, shows retry options
└── ComponentErrorBoundary (per-page)
    └── Graceful degradation, fallback UI
```

### 8.2 Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | Request body/params invalid |
| `UNAUTHORIZED` | 401 | Not logged in |
| `FORBIDDEN` | 403 | Logged in, insufficient role |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `COVERAGE_INVALID` | 422 | Address out of delivery range |
| `CUTOFF_PASSED` | 422 | Order modification blocked |
| `PAYMENT_FAILED` | 422 | Stripe payment failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 9. Security Checklist

- [ ] All prices computed server-side from DB
- [ ] RLS policies on every table
- [ ] Webhook signature verification
- [ ] Rate limiting on auth endpoints
- [ ] Input validation (Zod) on all routes
- [ ] CSRF protection (Next.js default)
- [ ] XSS protection (React default)
- [ ] Secure cookies for sessions
- [ ] Environment variables validated at startup
- [ ] No secrets in client bundles

---

## 10. Observability (V2+)

### Planned Instrumentation

- **Logging**: Structured JSON logs (Pino)
- **Metrics**: Vercel Analytics + custom events
- **Errors**: Sentry integration
- **Tracing**: OpenTelemetry for critical paths

### Key Metrics to Track

- Order funnel conversion (menu → cart → checkout → paid)
- Payment success rate
- Average order value
- Coverage check pass rate
- Webhook processing latency
- API response times (p50, p95, p99)
