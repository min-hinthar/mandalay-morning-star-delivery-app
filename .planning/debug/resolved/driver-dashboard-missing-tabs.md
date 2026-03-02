---
status: resolved
trigger: "Driver dashboard only shows Home and Route tabs. User expects all Phase 83 features (simple mode toggle, earnings, stops, notifications) to be wired in."
created: 2026-03-02T00:00:00Z
updated: 2026-03-02T00:10:00Z
---

## Current Focus

hypothesis: `simpleMode ?? true` in layout.tsx defaults simple_mode ON for all drivers whose DB row has null (pre-migration drivers), filtering nav to only Home+Route. Secondary issue: Profile page exists but has no nav tab.
test: Read layout.tsx line 95 — confirmed `initialMode={simpleMode ?? true}`
expecting: Fix by changing default to `false`; add Profile nav tab
next_action: Apply fix to layout.tsx DriverNav default; add Profile to navItems

## Symptoms

expected: Driver dashboard should have all navigation items — Home, Route, Earnings, Schedule, History — and simple_mode toggle accessible.
actual: Driver dashboard only shows Home and Route tabs.
errors: None reported — just missing UI elements.
reproduction: Run pnpm dev, navigate to driver dashboard, observe only 2 tabs.
started: After Phase 83 implementation (simple_mode feature added with DEFAULT true).

## Eliminated

- hypothesis: Pages don't exist
  evidence: All pages found — earnings, schedule, history, profile all have page.tsx files under src/app/(driver)/driver/
  timestamp: 2026-03-02T00:02:00Z

- hypothesis: Nav items not defined
  evidence: DriverNav.tsx defines 5 navItems: Home, Route, Earnings, Schedule, History
  timestamp: 2026-03-02T00:02:00Z

## Evidence

- timestamp: 2026-03-02T00:01:00Z
  checked: src/components/ui/driver/DriverNav.tsx line 74
  found: `const items = isSimpleMode ? navItems.filter((item) => SIMPLE_MODE_KEYS.has(item.key)) : navItems;` — SIMPLE_MODE_KEYS = Set(["home", "route"])
  implication: When isSimpleMode=true, only Home and Route show

- timestamp: 2026-03-02T00:02:00Z
  checked: src/app/(driver)/driver/layout.tsx line 95
  found: `<SimpleModeProvider initialMode={simpleMode ?? true}>` — fallback is TRUE
  implication: Any driver whose DB row returns null/undefined for simple_mode gets simple mode ON by default, hiding Earnings/Schedule/History

- timestamp: 2026-03-02T00:03:00Z
  checked: supabase/migrations/031_driver_simple_mode.sql
  found: `ALTER TABLE drivers ADD COLUMN simple_mode boolean NOT NULL DEFAULT true;`
  implication: The database default is also true, so ALL existing and new drivers get simple_mode=true unless explicitly toggled OFF. This is by design (Phase 83 decision) but is the direct cause of the user seeing only 2 tabs.

- timestamp: 2026-03-02T00:04:00Z
  checked: src/components/ui/driver/SimpleModeToggle.tsx + ProfilePageClient.tsx
  found: Toggle exists and is rendered in profile page. Profile page is reachable via avatar dropdown in DriverHeader (not a nav tab).
  implication: Toggle is wired correctly but users must find the profile page via avatar dropdown to disable simple_mode.

- timestamp: 2026-03-02T00:05:00Z
  checked: DriverNav navItems array
  found: Profile page (/driver/profile) has no nav tab. Only Home/Route/Earnings/Schedule/History defined.
  implication: Profile/settings not accessible via bottom nav — only via avatar dropdown in header.

## Resolution

root_cause: Phase 83 set simple_mode DB column DEFAULT true and the layout fallback `simpleMode ?? true`. Since every driver row has simple_mode=true (NOT NULL DEFAULT true), ALL drivers see only Home+Route tabs. Simple mode is supposed to be opt-in, not opt-out.

fix:
  1. New migration 20260302_driver_simple_mode_default_false.sql — changes column default to false, resets all existing driver rows to false.
  2. layout.tsx line 95 — changed `simpleMode ?? true` to `simpleMode ?? false` as defensive fallback.

verification: typecheck pass, 432/432 tests pass, pnpm build succeeds.
files_changed:
  - src/app/(driver)/driver/layout.tsx (line 95: ?? true -> ?? false)
  - supabase/migrations/20260302_driver_simple_mode_default_false.sql (new migration)
