# Change Log — Mandalay Morning Star

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Planning Phase
- Initial project spec created
- Architecture documented
- Milestone definitions (V0/V1/V2) finalized

---

## [0.0.1] - 2026-01-12

### Added
- **PROJECT_SPEC.md**: Complete product requirements and engineering design
- **architecture.md**: System diagrams and component architecture
- **change_log.md**: This file
- **project_status.md**: Progress tracking
- **CLAUDE.md**: Project memory for AI context

### Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Project goal | Shipping MVP | Real business launch |
| Mobile strategy | PWA (not native) | Faster to ship; evaluate native for V2 |
| Tip feature | Deferred to V2 | Reduce V1 complexity |
| Tax handling | Fixed rate for V1 | Stripe Tax considered for V2 |

### Open Items
- [ ] Finalize cart storage approach (Zustand recommended)
- [ ] Confirm image hosting (Supabase Storage recommended)
- [ ] Set up development environment

---

## Future Releases

### [0.1.0] - V0: Skeleton (Target: Week 2)
- Project scaffold (Next.js, Tailwind, shadcn)
- Supabase Auth integration
- Coverage checker
- Menu browse UI

### [0.2.0] - V1: Ordering Core (Target: Week 5)
- Cart + modifiers
- Checkout flow
- Stripe integration
- Order confirmation

### [0.3.0] - V2: Ops-Ready (Target: Week 8)
- Admin dashboard
- Driver app
- Real-time tracking
- Refunds

---

## Version History

| Version | Date | Status | Description |
|---------|------|--------|-------------|
| 0.0.1 | 2026-01-12 | Planning | Initial spec complete |
| 0.1.0 | TBD | Planned | V0 Skeleton |
| 0.2.0 | TBD | Planned | V1 Ordering Core |
| 0.3.0 | TBD | Planned | V2 Ops-Ready |
