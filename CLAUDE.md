# CLAUDE.md — Mandalay Morning Star Project Memory (v3.0)

> **Purpose**: Concise project context for Claude Code. Link to docs for details.
> **Last Updated**: 2026-01-15 | **Phase**: V1 Complete - V2 Planning

---

## 🎯 Project Identity

**Mandalay Morning Star** — Account-based, à la carte Burmese food ordering for **Saturday-only delivery** in Southern California.

**Inspiration**: Panda Express web ordering UX — fast category browsing, item modals, cart drawer, streamlined checkout.

**Kitchen**: 750 Terrado Plaza, Suite 33, Covina, CA 91723

---

## 📊 Milestone Status

| Version | Status | Progress | Focus |
|---------|--------|----------|-------|
| **V0** | ✅ Done | 100% | Scaffold, Auth, DB schema, Menu seed |
| **V1** | ✅ Done | 100% | Full ordering flow + Admin basics |
| **V2** | 📋 Planned | 0% | Driver ops, tracking, polish |

### V1 Sprint Progress
| Sprint | Status | Tasks |
|--------|--------|-------|
| Sprint 1: Menu Browse | ✅ Complete | 6/6 |
| Sprint 2: Cart + Checkout | ✅ Complete | 7/7 |
| Sprint 3: Payment + Confirm | ✅ Complete | 7/7 |
| Sprint 4: Admin Basics | ✅ Complete | 5/5 |

→ See [docs/project_status.md](docs/project_status.md) for detailed tracking.

---

## 🏗️ Tech Stack (Locked)

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 App Router + TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui + Framer Motion |
| Database | Supabase Postgres + RLS-first |
| Auth | Supabase Auth (email/password + OAuth) |
| Payments | Stripe Checkout Sessions (one-time) |
| Maps | Google Maps Platform (Geocoding, Routes API) |
| Hosting | Vercel (Edge + Serverless) |
| CI/CD | GitHub Actions |

---

## 📁 Key Documentation

| Doc | Purpose |
|-----|---------|
| [docs/00-context-pack.md](docs/00-context-pack.md) | Business rules, personas, core flows |
| [docs/04-data-model.md](docs/04-data-model.md) | Database schema + RLS policies |
| [docs/05-menu.md](docs/05-menu.md) | Menu system + modifier patterns |
| [docs/06-stripe.md](docs/06-stripe.md) | Payment flow + webhooks |
| [docs/architecture.md](docs/architecture.md) | System architecture overview |
| [docs/v1-spec.md](docs/v1-spec.md) | V1 feature specifications |
| [docs/v2-spec.md](docs/v2-spec.md) | V2 feature specifications |
| [docs/frontend-design-system.md](docs/frontend-design-system.md) | UI/UX patterns + components |
| [docs/component-guide.md](docs/component-guide.md) | Frontend Component Implementation Guide |

---

## 🔑 Core Business Rules (Memorize These)

### Delivery
```
Day: Saturday only
Hours: 11:00–19:00 PT
Window: Hourly slots (e.g., 14:00–15:00)
Cutoff: Friday 15:00 PT
  → After cutoff: order targets NEXT Saturday
  → After cutoff: no edits allowed
```

### Fees
```
Delivery Fee:
  items_subtotal < $100 → $15
  items_subtotal ≥ $100 → $0 (FREE)

items_subtotal = Σ((base_price + modifier_deltas) × qty)
  → Pre-tax, pre-tip, pre-fee
  → Computed SERVER-SIDE ONLY (never trust client)
```

### Coverage
```
Origin: Covina kitchen
Max Distance: 50 miles
Max Duration: 90 minutes
Both constraints must pass
```

---

## 🔒 Security Non-Negotiables

1. **Price calculation**: Server-only. Never trust client cart totals.
2. **RLS policies**: Every table must have appropriate row-level security.
3. **Webhook verification**: Always verify Stripe signatures.
4. **Coverage validation**: Server-side geocoding + route validation.
5. **Cutoff enforcement**: Server-side timestamp checks.
6. **Input validation**: Zod schemas at all API boundaries.

---

## 🧪 Testing Requirements

### Unit Tests (Required)
- [ ] Subtotal calculation with modifiers
- [ ] Delivery fee threshold logic
- [ ] Cutoff/scheduling date selection
- [ ] Coverage validation (distance + duration)

### Integration Tests (Required)
- [ ] Order → Checkout Session → Webhook → Confirmed
- [ ] Out-of-coverage blocks checkout
- [ ] Post-cutoff blocks edits
- [ ] Modifier price delta calculations

### E2E Tests (Required for V1)
- [ ] Full happy path: browse → cart → checkout → confirmation
- [ ] Error states: out-of-coverage, payment failed, sold out
- [ ] Mobile responsive flows

---

## 🎨 Design System Quick Reference

**Aesthetic**: Warm, premium, fast-casual — NOT generic AI slop.

```css
/* Theme Tokens */
--color-saffron: #D4A017      /* Primary gold/yellow */
--color-curry: #8B4513        /* Warm brown accent */
--color-lotus: #FFE4E1        /* Soft pink background */
--color-jade: #2E8B57         /* Success/action green */
--color-charcoal: #1A1A1A     /* Primary text */
--color-cream: #FFFEF7        /* Background */

/* Typography */
Display: "Playfair Display" (serif, elegant)
Body: "DM Sans" (geometric, readable)
Burmese: "Padauk" or "Noto Sans Myanmar"

/* Motion */
Micro: 150ms ease-out
Standard: 300ms ease-in-out
Dramatic: 500ms cubic-bezier(0.4, 0, 0.2, 1)
```

→ Full system: [docs/frontend-design-system.md](docs/frontend-design-system.md)

---

## 🔄 Claude-Led Development

### Workflow
Claude Code handles planning, implementation, testing, and reviews as a unified workflow.

### Available Skills
- `/commit` - Standardized git commits with co-author attribution
- `/commit-push-pr` - Full commit, push, and PR creation workflow
- `stripe:stripe-best-practices` - Stripe integration guidance

### Branch Naming
```
feat/<area>-<short>   → feat/stripe-checkout
fix/<area>-<short>    → fix/webhook-signature
```

### PR Checklist (Must Pass)
- [ ] TypeScript strict, no `any`
- [ ] Lint + typecheck + tests + build pass
- [ ] Migrations idempotent
- [ ] RLS policies verified
- [ ] Zod validation at boundaries
- [ ] Webhook signatures verified
- [ ] Mobile-first responsive
- [ ] Screenshot/GIF for UI changes

→ See [WORKFLOW.md](WORKFLOW.md) for detailed implementation patterns.

---

## 📋 Quick Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm lint             # ESLint
pnpm typecheck        # TypeScript check
pnpm test             # Run tests
pnpm test:e2e         # E2E tests

# Database
pnpm db:generate      # Generate types from Supabase
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed menu data

# Build & Deploy
pnpm build            # Production build
vercel deploy --prod  # Deploy to Vercel
```

---

## ⚠️ Known Constraints & Gotchas

1. **Supabase RLS**: Must enable RLS on ALL tables. Default deny.
2. **Stripe webhooks**: Use `stripe listen` locally for testing.
3. **Google Maps**: API key must have Geocoding + Routes API enabled.
4. **Timezone**: All cutoff logic uses `America/Los_Angeles` (PT).
5. **Menu imports**: Slugs are immutable once orders reference them.
6. **Framer Motion**: Use `LayoutGroup` for shared layout animations.

---

## 🚫 Anti-Patterns (Reject PRs With These)

- Client-side price/fee calculation
- Missing RLS policies
- Unverified webhook handlers
- `any` types in TypeScript
- Inline styles instead of Tailwind
- Generic font families (Inter, Arial, system-ui)
- Hard-coded magic numbers without constants
- Missing loading/error/empty states
- Desktop-first layouts

---

## 📞 Quick References

- **Stripe Dashboard**: https://dashboard.stripe.com
- **Supabase Dashboard**: https://app.supabase.com
- **Vercel Dashboard**: https://vercel.com
- **shadcn/ui Docs**: https://ui.shadcn.com
- **Framer Motion**: https://www.framer.com/motion

---

## 🔮 Current Focus (V2 Planning)

**V1 Complete!** All 25 tasks across 4 sprints are done.

### V1 Delivered Features
- ✅ Menu browsing with categories, search, modifiers
- ✅ Cart management with Zustand
- ✅ Address management with geocoding + coverage validation
- ✅ Stripe Checkout with webhook integration
- ✅ Order confirmation, status, and history pages
- ✅ Email notifications via Supabase Edge Functions
- ✅ Admin dashboard with analytics, orders, menu, categories

### V2 Planning (Driver Ops + Tracking)

**Sprint 1**: Admin Route Management
- Driver CRUD, route creation, order assignment

**Sprint 2**: Driver Mobile Interface
- PWA with route view, stop management, location tracking

**Sprint 3**: Customer Tracking
- Real-time status timeline, live driver map, ETA display

**Sprint 4**: Polish
- Delivery photos, SMS notifications, driver dashboard

→ Detailed specs: [docs/v2-spec.md](docs/v2-spec.md)
