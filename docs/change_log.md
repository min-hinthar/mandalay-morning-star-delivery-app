# docs/change_log.md — Project Change Log

> **Format**: Keep entries reverse-chronological (newest first)
> **Convention**: `[TYPE] Description — @author (if applicable)`

---

## [Unreleased]

### Added
- V1 detailed feature specifications (docs/v1-spec.md)
- V2 detailed feature specifications (docs/v2-spec.md)
- Comprehensive architecture documentation (docs/architecture.md)
- Frontend design system documentation (docs/frontend-design-system.md)
- Project status tracking (docs/project_status.md)
- Updated CLAUDE.md with V1/V2 context

### Changed
- None yet

### Fixed
- None yet

### Removed
- None yet

---

## [V1-S1] — 2026-01-14 (In Progress)

### Added
- [FEATURE] Menu data layer (V1-S1-001) — @Codex
  - `src/types/menu.ts`: Menu type definitions (MenuItem, MenuCategory, ModifierGroup, etc.)
  - `src/app/api/menu/route.ts`: Full menu API with categories and modifiers
  - `src/app/api/menu/search/route.ts`: Search API with Zod validation
  - `src/lib/hooks/useMenu.ts`: React Query hooks (useMenu, useMenuSearch)
  - `src/lib/providers/query-provider.tsx`: QueryClient configuration
  - 5-minute stale time caching for menu data

- [FEATURE] Category tabs component (V1-S1-002) — @Codex
  - `src/components/menu/category-tabs.tsx`: Enhanced tab navigation
  - `src/lib/hooks/useScrollSpy.ts`: Scroll-spy hook for active section detection
  - `src/components/menu/menu-content.tsx`: Integration component
  - "All" pseudo-tab for showing all items
  - Sticky positioning with backdrop blur
  - Framer Motion shared layout animation
  - Touch targets ≥ 44px, keyboard accessible
  - Respects `prefers-reduced-motion`

### Technical Decisions
- [DECISION] React Query for server state — Caching with 5-min stale time, automatic refetch
- [DECISION] Intersection Observer pattern for scroll-spy — Better performance than scroll events

---

## [V0] — 2026-01-13

### Added
- Initial project scaffold (Next.js 15 + TypeScript)
- Tailwind CSS + shadcn/ui configuration
- Supabase project connection
- Core database schema (all tables from docs/04-data-model.md)
- RLS policies baseline
- Supabase Auth integration (email + profiles trigger)
- Menu seed YAML (data/menu.seed.yaml)
- Menu seed validation rules (docs/menu-seed-validation.md)
- Core documentation:
  - docs/00-context-pack.md — Business rules
  - docs/04-data-model.md — Database schema
  - docs/05-menu.md — Menu system
  - docs/06-stripe.md — Payment integration
  - Codex.md — Implementation workflow
  - Claude.md — Planning operating system

### Technical Decisions
- [DECISION] Stripe Checkout Sessions over custom payment forms — Lower PCI scope
- [DECISION] Zustand for client cart state — Lightweight, simple API
- [DECISION] React Query for server state — Caching, optimistic updates
- [DECISION] Saturday-only delivery — Simplify scheduling in V1
- [DECISION] Single kitchen origin — No multi-location complexity in V1

---

## Template for Future Entries

```markdown
## [Version] — YYYY-MM-DD

### Added
- [FEATURE] Description — @owner
- [DOC] Added new documentation for X

### Changed
- [REFACTOR] Improved X for better Y
- [PERF] Optimized Z

### Fixed
- [BUG] Fixed issue where X caused Y
- [SECURITY] Patched vulnerability in Z

### Removed
- [DEPRECATION] Removed legacy X

### Technical Decisions
- [DECISION] Chose X over Y — Rationale

### Known Issues
- [ISSUE] Description — Workaround if any
```

---

## Version Naming Convention

- **V0**: Foundation (scaffold, auth, schema)
- **V1**: Core ordering flow (menu, cart, checkout, orders)
- **V2**: Delivery operations (drivers, routes, tracking)
- **V3+**: Scale and polish (analytics, loyalty, optimization)

Minor versions (V1.1, V1.2) for bug fixes and small features within a major version.
