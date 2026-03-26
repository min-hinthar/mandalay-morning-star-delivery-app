---
status: awaiting_human_verify
trigger: "Admin menu 'create new menu item' fails with permission denied error. Was working before, now broken."
created: 2026-03-25T00:00:00Z
updated: 2026-03-25T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — "Add Item" button is a non-functional placeholder (no onClick/href). No create menu item UI exists.
test: Verified via code read + git history — button has never had a handler
expecting: N/A — root cause confirmed
next_action: Implement AddMenuItemDialog and wire it into menu page

## Symptoms

expected: Admin can create new menu items via Admin > Menu > Add Item
actual: Error message shown — permission denied
errors: Permission denied (likely RLS or auth related)
reproduction: Admin > Menu > Add Item, fill form, submit
started: Regression — was working before

## Eliminated

## Evidence

- timestamp: 2026-03-25T00:05:00Z
  checked: src/app/(admin)/admin/menu/page.tsx lines 196-199
  found: "Add Item" Button has no onClick handler and no href — dead button
  implication: No menu item creation UI exists

- timestamp: 2026-03-25T00:06:00Z
  checked: git history for menu page and /admin/menu/new route
  found: No create/new page ever existed. Button was always a placeholder since initial commit.
  implication: Feature was never implemented

- timestamp: 2026-03-25T00:07:00Z
  checked: POST /api/admin/menu route and RLS policies
  found: API endpoint exists and works correctly. RLS policy uses is_admin() SECURITY DEFINER function — correct.
  implication: Backend is ready, frontend is missing

- timestamp: 2026-03-25T00:08:00Z
  checked: AddCategoryDialog pattern
  found: Categories page has working AddCategoryDialog with same pattern needed for menu items
  implication: Can follow same pattern for menu items

## Resolution

root_cause: "Add Item" button on admin menu page is a non-functional placeholder — no onClick handler, no navigation, no dialog. The create menu item UI was never implemented despite the backend POST API being ready.
fix: Created AddMenuItemDialog component with full form (name, slug, description, price, category, active/sold-out toggles, allergens). Replaced dead placeholder button in menu page with the dialog. Backend POST /api/admin/menu was already correct.
verification: typecheck clean, lint clean, format clean, 851/851 tests pass, build succeeds
files_changed:
  - src/app/(admin)/admin/menu/AddMenuItemDialog.tsx (new)
  - src/app/(admin)/admin/menu/page.tsx (replaced dead button with AddMenuItemDialog)
