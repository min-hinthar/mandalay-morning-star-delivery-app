---
phase: 01-foundation-token-system
verified: 2026-01-22T09:01:34Z
status: gaps_found
score: 3/4 truths verified (with caveats)
gaps:
  - truth: "Z-index values are defined as CSS custom properties and consumed via TailwindCSS utilities"
    status: partial
    reason: "TypeScript zIndexVar constants reference wrong CSS variable names"
    artifacts:
      - path: "src/design-system/tokens/z-index.ts"
        issue: "zIndexVar.modal = 'var(--z-modal)' but CSS defines --z-index-modal"
    missing:
      - "Update zIndexVar to reference --z-index-* variables (not --z-*)"
      - "Test that TailwindCSS generates z-modal utility from --z-index-modal"
  - truth: "ESLint/Stylelint fails the build when hardcoded z-index values are detected"
    status: partial
    reason: "Rules work correctly but legacy codebase has 50+ violations causing build failure"
    artifacts:
      - path: "eslint.config.mjs"
        issue: "Rules active, detecting violations correctly"
      - path: "legacy components"
        issue: "50+ files with hardcoded z-index values (z-10, z-20, z-50, etc.)"
    missing:
      - "Migrate legacy components to use z-index tokens OR"
      - "Create migration plan and temporarily downgrade rules to warn until migration complete"
---

# Phase 1: Foundation & Token System Verification Report

**Phase Goal:** Establish the infrastructure that prevents z-index chaos and enables consistent animation timing

**Verified:** 2026-01-22T09:01:34Z

**Status:** gaps_found

**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Z-index values are defined as CSS custom properties and consumed via TailwindCSS utilities (no hardcoded z-50, z-100, etc.) | PARTIAL | CSS tokens exist in globals.css @theme block. TypeScript constants exist but reference wrong variable names (--z-modal vs --z-index-modal). No actual usage to verify TailwindCSS generation. |
| 2 | ESLint/Stylelint fails the build when hardcoded z-index values are detected | PARTIAL | Rules work correctly (tested with z-50, z-index: 50). However, legacy codebase has 50+ violations, so build currently FAILS. Rules achieving goal but need migration plan. |
| 3 | GSAP plugins (ScrollTrigger, SplitText) can be used in components with proper cleanup via useGSAP | VERIFIED | GSAP 3.14.2 and @gsap/react 2.1.2 installed. Plugin registration module exports all required plugins. Not used yet, but infrastructure ready. |
| 4 | Stacking context rules are documented and isolation boundaries are established | VERIFIED | docs/STACKING-CONTEXT.md exists with 160 lines covering token table, usage patterns, isolation boundaries, troubleshooting. |

**Score:** 2/4 verified, 2/4 partial


### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| src/app/globals.css | Z-index tokens in @theme block | VERIFIED | Lines 57-67 contain all 10 z-index tokens (--z-index-base through --z-index-max) |
| src/design-system/tokens/z-index.ts | TypeScript constants | PARTIAL | File exists with all exports (zIndex, zIndexVar, zClass). BUG: zIndexVar uses wrong CSS variable names (--z-modal should be --z-index-modal) |
| src/lib/gsap/index.ts | GSAP plugin registration | VERIFIED | 43 lines, exports gsap, useGSAP, ScrollTrigger, SplitText, Flip, Observer. Plugins registered at module load. |
| src/lib/gsap/presets.ts | Animation presets | VERIFIED | 173 lines, exports gsapDuration, gsapEase, gsapPresets, scrollTriggerPresets. |
| eslint.config.mjs | Z-index enforcement in JSX | VERIFIED | Lines 42-74 contain comprehensive rules catching z-[number], z-0 through z-100, inline zIndex at error severity. |
| .stylelintrc.json | Z-index enforcement in CSS | VERIFIED | Lines 4-7 contain declaration-property-value-disallowed-list rule for z-index. Tested: catches z-index: 50, allows var(--z-index-modal). |
| docs/STACKING-CONTEXT.md | Stacking context documentation | VERIFIED | 160 lines with token table, usage patterns, isolation boundaries, troubleshooting. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| src/design-system/tokens/z-index.ts | src/app/globals.css | CSS variable names match | NOT_WIRED | MISMATCH: TypeScript references --z-modal but CSS defines --z-index-modal. Pattern should be --z-index-* throughout. |
| eslint.config.mjs | z-index token system | Error messages reference docs | WIRED | Error messages reference docs/STACKING-CONTEXT.md and suggest token names. |
| .stylelintrc.json | CSS variables | Disallow hardcoded values | WIRED | Rule blocks numeric z-index values, allows -1 and 1 as exceptions. |
| src/lib/gsap/presets.ts | src/lib/motion-tokens.ts | Consistent animation feel | UNCERTAIN | Presets claim to match motion-tokens.ts feel (snappy, bouncy, etc.) but motion-tokens.ts not verified. |
| src/lib/gsap/index.ts | gsap.registerPlugin | Plugin registration | WIRED | Line 22 registers all plugins. Config and defaults set appropriately. |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| FOUND-01: Z-index token system | PARTIAL | TypeScript constants reference wrong CSS variable names |
| FOUND-02: ESLint/Stylelint enforcement | PARTIAL | Rules work but legacy code has 50+ violations |
| FOUND-05: GSAP plugin registration | SATISFIED | Infrastructure complete and ready to use |
| FOUND-07: Stacking context documentation | SATISFIED | Comprehensive documentation exists |


### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/design-system/tokens/z-index.ts | 31-40 | Wrong CSS variable names in zIndexVar | Blocker | Using zIndexVar.modal in style objects will reference non-existent --z-modal variable |

**Legacy Code Anti-Patterns (Pre-existing):**

50+ files with hardcoded z-index values detected by new linting rules:
- 13 inline zIndex: number in style objects (FloatingFood.tsx, CartAnimations.tsx)
- 37+ z-10, z-20, z-50 TailwindCSS classes

These are expected - legacy code predates token system. Options:
1. Migrate all to tokens (large effort)
2. Temporarily downgrade rules to warn until migration
3. Add ESLint disable comments with migration tickets

### Human Verification Required

#### 1. TailwindCSS z-index utility generation

**Test:** Create a component using className="z-modal" and inspect in browser DevTools

**Expected:** Element should have z-index: 50 applied via utility class

**Why human:** TailwindCSS @theme behavior not verified programmatically. Need to confirm --z-index-* generates z-* utilities as claimed.

#### 2. GSAP useGSAP cleanup behavior

**Test:** Create component with useGSAP hook, mount/unmount, check for memory leaks

**Expected:** Animations clean up on unmount, no lingering tweens or listeners

**Why human:** Cleanup behavior requires runtime testing with component lifecycle

#### 3. Stylelint CSS build integration

**Test:** Run full build with pnpm build (not just lint:css)

**Expected:** Build fails if CSS files have hardcoded z-index

**Why human:** Need to verify lint:css is called in build pipeline


### Gaps Summary

**Gap 1: TypeScript zIndexVar uses wrong CSS variable names**

The TypeScript constants in src/design-system/tokens/z-index.ts reference CSS variables like var(--z-modal), but the actual CSS defines --z-index-modal. This means:

- zIndexVar.modal returns "var(--z-modal)" 
- But CSS only defines --z-index-modal
- Using zIndexVar in inline styles will fail silently (no z-index applied)

Root cause: Confusion about TailwindCSS 4 naming. The @theme uses --z-index-* which TailwindCSS strips to generate z-* utilities. But the raw CSS variables remain --z-index-*.

Fix: Update all zIndexVar values to use --z-index-* prefix.

**Gap 2: Legacy codebase violations block build**

The linting rules work correctly and achieve the goal of "failing build on hardcoded z-index". However, this exposes 50+ violations in pre-existing code:

- FloatingFood.tsx: 6 inline zIndex: 5 style objects
- Multiple hero/menu components: z-10, z-20, z-50 classes

Impact: Build currently fails with pnpm lint. The goal is achieved (rules prevent new violations) but legacy code needs migration.

Options:
1. Migrate all files - Replace with tokens (large effort, ~50 files)
2. Phased migration - Downgrade to warn, create migration tickets, upgrade back to error when complete
3. Selective disable - Add eslint-disable-next-line with TODO comments for migration

Recommendation: Option 2 (phased migration) aligns with roadmap - token system is foundation, overlay/navigation phases will naturally migrate components as they are rebuilt.

---

_Verified: 2026-01-22T09:01:34Z_
_Verifier: Claude (gsd-verifier)_
