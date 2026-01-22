# Morning Star Delivery App — V8 UI Rewrite

## What This Is

A full frontend rewrite of the Morning Star Weekly Delivery meal subscription app. Fresh component library built alongside the existing V7 codebase, with new state management, strict layering system, and animation-first design. Customer flows only (Admin/Driver deferred). The goal is to fix all layering/clickability failures, establish a tokenized design system, and deliver a distinctive visual identity inspired by DoorDash, Uber Eats, and the Pepper template.

## Core Value

**Every UI element is reliably clickable and the app feels delightfully alive with motion.** If overlays block clicks or animations feel janky, we've failed.

## Requirements

### Validated

- ✓ Customer order flow (menu → cart → checkout → Stripe) — existing
- ✓ Supabase auth with role-based access (customer/admin/driver) — existing
- ✓ Stripe subscription and checkout integration — existing
- ✓ Cart state persistence via Zustand + localStorage — existing
- ✓ Server-side rendering with React Query caching — existing
- ✓ Google Maps integration for delivery tracking — existing
- ✓ Admin analytics dashboards — existing
- ✓ Driver delivery management — existing

### Active

- [ ] Strict z-index token system (no hardcoded values anywhere)
- [ ] Layer map with portal strategy for all overlays
- [ ] Fresh component library (buttons, inputs, cards, modals, drawers, toasts, tooltips)
- [ ] New app shell layouts (header, nav, footer, page containers)
- [ ] Cart drawer/sheet with correct opacity and stacking
- [ ] Menu browsing UX (categories, search, item detail)
- [ ] Checkout flow with guided states
- [ ] Motion system with GSAP + Framer Motion tokens
- [ ] Animation everywhere (components, transitions, micro-interactions)
- [ ] Distinctive visual identity (full rebrand)
- [ ] Mobile-first responsive design
- [ ] E2E tests for header clickability, cart open/close, overlay behavior

### Out of Scope

- Admin flow rewrite — V7 admin works, defer to future milestone
- Driver flow rewrite — V7 driver works, defer to future milestone
- Backend/schema changes — Supabase + Stripe contracts stay stable
- Multi-restaurant marketplace — not part of Morning Star scope
- Reduced motion automatic detection — motion-first by design; manual toggle later

## Context

**Current state:**
V7 is functionally blocked by UI layering/interaction defects:
- Header on menu page not clickable
- Signout dropdown doesn't work (preventDefault blocks redirect)
- Cart drawer modal renders transparent
- Cannot checkout on menu page
- Mobile menu state persists across route changes

**Root causes identified:**
- 50+ hardcoded z-index values across components
- Uncontrolled stacking contexts from blur/transform
- Overlay state not resetting on pathname change
- No centralized portal strategy

**Codebase state:**
- Next.js 16.1.2 + React 19.2.3 + TailwindCSS 4
- Framer Motion 12.26.1 already in use
- V4/V5/V6/V7 token versioning creates maintenance burden
- Large component files (700-1000+ lines)
- Codebase map exists at `.planning/codebase/`

**Design direction:**
- Reference apps: DoorDash, Uber Eats, Pepper template
- "Over-the-top animated + playful UI"
- GSAP for timelines/scroll choreography
- Framer Motion for component-level interactions
- Define design system during implementation using UI-UX-Color-Designs skill

## Constraints

- **Tech stack**: Next.js App Router, TailwindCSS, Supabase, Stripe — keep existing
- **Backend contracts**: API routes and Supabase schema stay stable
- **Approach**: Fresh components in new directories, parallel development, swap when ready
- **Skill usage**: Use `@.claude/skills/UI-UX-Color-Designs` for design system work and `@.claude/skills/frontend-design` for implementation

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Full frontend rewrite (not incremental fixes) | V7 has systemic layering issues; patching won't solve root cause | — Pending |
| Fresh components (parallel development) | Allows building new system without breaking existing | — Pending |
| Customer flows only for V1 | Admin/Driver work; focus on broken customer experience | — Pending |
| Animation everywhere (not selective) | User wants "over-the-top animated" experience | — Pending |
| No constraints on dependencies | Open to whatever works best for the rewrite | — Pending |
| Use UI-UX-Color-Designs skill | Structured workflow with verification gates for design system | — Pending |

---
*Last updated: 2026-01-21 after initialization*
