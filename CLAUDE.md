# CLAUDE.md — Mandalay Morning Star Project Memory (v2.0)

> **Purpose**: Concise project context for Claude CLI. Link to docs for details.
> **Last Updated**: 2026-01-13 | **Phase**: V1 Development

---

## 🎯 Project Identity

**Mandalay Morning Star** — Account-based, à la carte Burmese food ordering for **Saturday-only delivery** in Southern California.

**Inspiration**: Panda Express web ordering UX — fast category browsing, item modals, cart drawer, streamlined checkout.

**Kitchen**: 750 Terrado Plaza, Suite 33, Covina, CA 91723

---

## 📊 Milestone Status

| Version | Status | Focus |
|---------|--------|-------|
| **V0** | ✅ Done | Scaffold, Auth, DB schema, Menu seed |
| **V1** | 🔄 Active | Full ordering flow + Admin basics |
| **V2** | 📋 Planned | Driver ops, tracking, polish |

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

## 🔄 Workflow: Claude ↔ Codex

### Roles
- **Claude (Planning)**: Specs, checklists, reviews, architecture decisions
- **Codex (Implementation)**: Code, tests, migrations

### Branch Naming
```
feat/<area>-<short>   → feat/menu-category-tabs
fix/<area>-<short>    → fix/cart-modifier-total
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

## 🔮 Current Focus (V1)

**Active Sprint**: Core ordering flow

1. Menu browsing (category tabs + search + item cards)
2. Item detail modal (modifiers + quantity + notes)
3. Cart drawer (subtotals + fee display)
4. Checkout stepper (Address → Time → Payment → Confirm)
5. Order confirmation page
6. Basic admin menu CRUD

**Next Up (V2)**: Driver ops, real-time tracking, admin dashboard

→ Detailed specs: [docs/v1-spec.md](docs/v1-spec.md)
