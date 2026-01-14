# CLAUDE.md — Project Memory

> **Project**: Mandalay Morning Star  
> **Type**: Burmese food ordering PWA (Saturday delivery only)  
> **Goal**: Shipping MVP for real business launch  
> **Repo**: https://github.com/min-hinthar/mandalay-morning-star-delivery-app

---

## Quick Context

**What**: A la carte ordering from categorized Burmese menu → Saturday delivery in SoCal  
**Who**: Existing customer base (know the food, need easy ordering)  
**Where**: Kitchen in Covina, CA → 50mi/90min coverage radius

---

## Core Business Rules (Memorize)

| Rule | Value |
|------|-------|
| Delivery day | Saturday only, 11am-7pm PT |
| Order cutoff | Friday 3:00 PM PT |
| Fee threshold | < $100 → $15 fee; ≥ $100 → free |
| Coverage | ≤ 50 miles AND ≤ 90 minutes driving |

---

## Tech Stack

```
Next.js 15 (App Router) + TypeScript (strict)
Tailwind + shadcn/ui + Framer Motion
Supabase Auth + Postgres + RLS
Stripe Checkout + webhooks
Google Maps (geocoding + distance)
Vercel (hosting)
```

---

## Current Milestone

**V0 — Skeleton** (Not Started)
- Auth + coverage checker + menu browse
- See: `docs/project_status.md`

---

## Key Documents

| Doc | Purpose |
|-----|---------|
| `docs/PROJECT_SPEC.md` | Full requirements + engineering design |
| `docs/architecture.md` | System diagrams |
| `docs/project_status.md` | Progress tracking |
| `docs/change_log.md` | Version history |
| `data/menu.seed.yaml` | Menu data (47 items, 8 categories) |

---

## Implementation Rules

1. **Prices computed server-side** — never trust client amounts
2. **All tables have RLS** — test cross-user isolation
3. **Webhook signatures verified** — reject invalid Stripe calls
4. **Zod at boundaries** — validate all API inputs
5. **Migrations idempotent** — use IF NOT EXISTS

---

## Brand Colors

```
Gold:    #D4AF37 (primary accent)
Red:     #8B1A1A (secondary)
Green:   #34A853 (Myanmar flag accent)
BG:      #FDF8F0 (warm off-white)
```

---

## Open Decisions

| # | Question | Recommendation |
|---|----------|----------------|
| 1 | Cart storage | Zustand + persist |
| 2 | Image hosting | Supabase Storage |
| 3 | Real-time updates | Supabase Realtime |

---

## Workflow

- **Claude** = Planning + Review
- **Codex** = Implementation
- PRs require: lint + typecheck + tests + build
- One branch, one PR at a time

---

*Keep this file < 100 lines. Link to docs for details.*
