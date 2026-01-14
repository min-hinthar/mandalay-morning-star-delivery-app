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
