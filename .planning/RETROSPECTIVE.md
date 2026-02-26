# Project Retrospectives

## v1.8 Gap Closure (2026-02-26)

### What Was Built

- 2 gap closure phases (75-76), 2 plans
- Phase 75: Wired test-delivery href in OnboardingWalkthroughCard (DPROF-05), confirmed SEC-02 CSP unsafe-eval is intentional for Google Maps
- Phase 76: Wired BlockedDateChips into driver schedule page (DDASH-07), fixed stale closure bug in availability state

### What Worked

- **Milestone audit correctly identified gaps** — the audit found 3 requirements (SEC-02, DPROF-05, DDASH-07) that passed phase-level verification but had integration-level issues
- **Pre-built components just needed wiring** — BlockedDateChips and the test-delivery page were fully built and tested; they just needed to be connected to their consuming pages
- **Fast closure** — both phases completed in <1 day because the components existed; only wiring was needed

### What Was Inefficient

- **Original phases should have caught these wiring gaps** — Phases 73 and 74 built BlockedDateChips and the test-delivery page but never verified they were actually rendered/reachable from the UI
- **Phase verification checked existence, not integration** — the VERIFICATION.md process confirmed components existed and exported correctly, but did not check that they were imported and rendered somewhere
- **3/8 phases had no VERIFICATION.md** — Phases 67, 71, and 74 skipped verification entirely

### Patterns

- Pre-built components need integration testing, not just unit verification
- Barrel exports (index.tsx) can create false confidence — a component exported from a barrel but never imported elsewhere is dead code
- href: null in configuration objects is a silent failure mode — should be caught by lint or integration check
- E2E flow testing (not just per-component testing) is the only way to catch navigation gaps

### Key Lessons

- **Milestone audit is essential** — caught 3 gaps that per-phase verification missed
- **Integration checking > existence checking** — "does this component exist?" is necessary but insufficient; "is this component reachable by users?" is the real question
- **Silent failures accumulate** — try/catch with silent fallback (like the increment_driver_deliveries RPC) and href: null both hide problems until an audit surfaces them
- **Gap closure is cheap when components are pre-built** — the 2 phases took <1 day vs 3 days for the original 8 phases
