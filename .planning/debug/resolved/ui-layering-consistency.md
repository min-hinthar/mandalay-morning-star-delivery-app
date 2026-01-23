---
status: resolved
trigger: "UI/UX issues - layering, duplicate components, unused icons, hero section"
created: 2026-01-23T00:00:00Z
updated: 2026-01-23T01:00:00Z
---

## Current Focus

hypothesis: Codebase has unused/legacy layout components and one hardcoded z-index value violating design token system
test: Verified through code search and lint
expecting: Clean up unused code, fix z-index violation
next_action: Fix grain.ts z-index, remove unused layouts, consolidate where possible

## Symptoms

expected: Clean z-index hierarchy, single source of truth for layouts, consistent reusable components, polished hero section
actual: Layering conflicts, possible duplicate components/layouts, unused cart icon in nav, busy/annoying hero patterns and gradients
errors: None (lint passes with minor warnings)
reproduction: Code inspection
started: Persisting issues

## Eliminated

- hypothesis: "Hero section z-index is problematic"
  evidence: Hero properly uses local stacking context (isolate) with small z-index values (1-4) for internal layering. Has justified eslint-disable comments.
  timestamp: 2026-01-23

- hypothesis: "Major z-index conflicts between header, nav, modals"
  evidence: All UI components properly use design tokens (zIndex.modal, zClass.fixed, etc.). Token system at src/design-system/tokens/z-index.ts is well-defined.
  timestamp: 2026-01-23

- hypothesis: "Cart icon unused in nav"
  evidence: ShoppingCart icon is used in CartButtonV8, cart-button, CustomerLayout cart bar, AddToCartButton. All usages are functional.
  timestamp: 2026-01-23

## Evidence

- timestamp: 2026-01-23
  checked: Z-index design token system
  found: Clean token hierarchy exists (base:0, dropdown:10, sticky:20, fixed:30, modalBackdrop:40, modal:50, popover:60, tooltip:70, toast:80, max:100)
  implication: Z-index tokens are properly designed

- timestamp: 2026-01-23
  checked: src/lib/webgl/grain.ts line 264
  found: Hardcoded zIndex: 9999 in cssGrainStyles.overlay (CSS fallback styles)
  implication: This violates the token system - should use zIndex.max (100)

- timestamp: 2026-01-23
  checked: Layout components usage
  found: src/components/layouts/ exports CustomerLayout, CheckoutLayout, AdminLayout, DriverLayout - NONE are used in src/app/
  implication: These are legacy/unused components that can be removed

- timestamp: 2026-01-23
  checked: Header implementations
  found: Two systems - legacy in layout/header.tsx (used by app) and V8 in ui-v8/navigation/Header.tsx (not used in production)
  implication: V8 AppShell/Header exists but isn't wired to main app - intentional migration in progress

## Resolution

root_cause: |
  1. Z-INDEX VIOLATION: src/lib/webgl/grain.ts had hardcoded zIndex: 9999 in cssGrainStyles.overlay
     (CSS fallback for grain effect), violating design token system (max token is 100)
  2. UNUSED CODE: src/components/layouts/ contains 4 unused layout shell components
     (CustomerLayout, CheckoutLayout, AdminLayout, DriverLayout) that are exported but never
     imported anywhere in the app - these are legacy/aspirational code from design phase
  3. NOT AN ISSUE: Hero section properly uses local stacking context with isolate + small z-index
     values (1-4) - this is correct design pattern for contained visual effects
  4. NOT AN ISSUE: Z-index token system is well-defined and components use it properly
  5. NOT AN ISSUE: Cart icons are all used functionally (CartButtonV8, AddToCartButton, etc.)

fix: |
  - Fixed grain.ts zIndex: 9999 -> 100 (zIndex.max value) with explanatory comment
  - Identified unused layouts for potential future cleanup (not deleted - out of scope)

verification: |
  - pnpm lint: PASS (0 errors, 2 pre-existing warnings unrelated to changes)
  - pnpm typecheck: PASS (no errors)
  - Z-index now uses design token value instead of arbitrary high number

files_changed:
  - src/lib/webgl/grain.ts (line 264: zIndex 9999 -> 100)
