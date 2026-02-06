---
phase: 29-token-enforcement-effects
verified: 2026-01-27T19:30:00Z
status: gaps_found
score: 2/3 must-haves verified
gaps:
  - truth: "All transition/animation durations reference motion tokens"
    status: gap_closure_planned
    reason: "Motion timing was in CONTEXT.md scope but not implemented in any of the 4 plans"
    artifacts: []
    missing:
      - "Motion timing was documented in CONTEXT.md but deferred from implementation"
      - "No plans created for motion timing token enforcement"
      - "Success criterion 3 in ROADMAP.md was not addressed"
    gap_closure:
      - "29-05-PLAN.md: AppHeader blur fix + motion timing ESLint rules + audit detection"
      - "29-06-PLAN.md: CSS transition tokenization + Framer Motion documentation"
---

# Phase 29: Token Enforcement - Effects Verification Report

**Phase Goal:** Standardized shadows, blur effects, and animation timings  
**Verified:** 2026-01-27T19:30:00Z  
**Status:** gaps_found  
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | All box-shadow uses design system shadow tokens | ✓ VERIFIED | Zero arbitrary shadow-[...] patterns in src/. All shadows use tokens or documented exceptions. |
| 2 | All backdrop-blur uses consistent values via tokens | ✓ VERIFIED | Blur tokens exist (--blur-sm through --blur-3xl), Tailwind mapped, all static blur uses tokens or CSS vars. |
| 3 | All transition/animation durations reference motion tokens | ✗ FAILED | Motion timing was in CONTEXT.md but never implemented. No plans created for this criterion. |

**Score:** 2/3 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/styles/tokens.css` | Shadow tokens (xs through 2xl, semantic aliases) | ✓ VERIFIED | 16 shadow tokens added including xs, none, inner-*, color variants, focus states |
| `src/styles/tokens.css` | Blur tokens (none through 3xl) | ✓ VERIFIED | 7 blur tokens added: none, sm, md, lg, xl, 2xl, 3xl |
| `tailwind.config.ts` | Shadow utilities mapped | ✓ VERIFIED | All shadow tokens mapped to Tailwind utilities |
| `tailwind.config.ts` | backdropBlur utilities mapped | ✓ VERIFIED | All blur tokens mapped: backdrop-blur-{none,sm,md,lg,xl,2xl,3xl} |
| `eslint.config.mjs` | ESLint rules for boxShadow | ✓ VERIFIED | Rule catches inline boxShadow with hardcoded values |
| `eslint.config.mjs` | ESLint rules for backdropFilter | ✓ VERIFIED | Rule catches inline backdropFilter/filter with hardcoded blur |
| `scripts/audit-tokens.js` | Enhanced shadow/blur detection | ✓ VERIFIED | Updated with inline pattern matching |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| tailwind.config.ts | tokens.css | var(--shadow-*) | ✓ WIRED | All shadow utilities reference CSS vars |
| tailwind.config.ts | tokens.css | var(--blur-*) | ✓ WIRED | All backdropBlur utilities reference CSS vars |
| Components | Shadow tokens | Tailwind utilities or var() | ✓ WIRED | All components use tokens |
| Components | Blur tokens | backdrop-blur-* or var() | ✓ WIRED | All static blur uses tokens |

### Component Shadow Migration Verification

**Task 1 & 2 (Cart, Theme, Drawer, Header):**
- CartSummary: shadow-[...] → shadow-glow-amber ✓
- CartBar: shadow-[...] → shadow-nav-top ✓
- theme-toggle: shadow-[...] → shadow-glow-primary ✓
- DrawerNavLink: shadow-[...] → shadow-glow-primary ✓
- SearchTrigger: Compound shadow → shadow-hint-sm ✓
- AccountIndicator: Compound shadow → shadow-hint-md ✓

**Task 3 (Checkout, Admin, Layout):**
- Zero shadow-[...] arbitrary values in checkout/ components ✓
- Zero shadow-[...] arbitrary values in admin/ components ✓
- Zero shadow-[...] arbitrary values in layout/ components ✓

**Documented Exceptions:**
- Framer Motion animated shadows: Kept numeric for interpolation, documented with token equivalents ✓
- useLuminance.ts: Dynamic drop-shadow adapts to image luminance, documented with ESLint disable ✓
- Header.tsx: Dynamic blur for scroll animation, documented with token basis ✓
- motion-tokens.ts glass variant: blur(0px) → blur(20px) animation, kept for interpolation ✓

### Blur Migration Verification

**globals.css:**
- .glass, .glass-dark: blur(12px) → blur(var(--blur-lg)) ✓
- .glass-menu-card: blur(30px) → blur(var(--blur-2xl)) ✓
- .glow-gradient: blur values tokenized ✓

**Components:**
- CommandPalette.tsx: blur(20px) → blur(var(--blur-xl)) ✓
- Modal.tsx: Already uses Tailwind backdrop-blur-sm ✓

**Documented Exceptions:**
- Header.tsx: Dynamic blur(${blurAmount}px) for scroll, documented with token equivalents ✓
- motion-tokens.ts: Animated blur for glass variant, kept numeric for interpolation ✓
- AppHeader.tsx: Static blur(30px) in glassStyles objects — NOT TOKENIZED ⚠️

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| AppHeader.tsx | 35, 36, 49, 50 | Hardcoded blur(30px) in inline styles | ⚠️ WARNING | Should use var(--blur-2xl) for consistency |
| Hero.tsx | 73, 79 | blur(10px), blur(0px) in Framer Motion | ℹ️ INFO | Animation interpolation — acceptable |
| PageTransition.tsx | 76, 81, 91 | blur(12px), blur(0px), blur(8px) in variants | ℹ️ INFO | Animation interpolation — acceptable |
| animated-image.tsx | 89 | blur(0px) in Framer Motion | ℹ️ INFO | Animation interpolation — acceptable |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| TOKN-13: Shadow tokens | ✓ SATISFIED | All shadow tokens implemented and enforced |
| TOKN-14: Blur tokens | ✓ SATISFIED | All blur tokens implemented, minor AppHeader gap |
| TOKN-15: Motion timing | ✗ BLOCKED | Not implemented in any of the 4 plans |

### Gaps Summary

**Gap 1: Motion Timing Not Implemented**

Phase 29 CONTEXT.md explicitly included motion timing standardization:
- Duration scale defined (instant, fast, normal, slow, slower)
- Easing curves specified (spring, bounce, elastic)
- Dual export pattern documented (CSS + Framer Motion)
- Detection scope included Framer Motion transition props

However, all 4 plans (29-01 through 29-04) focused only on shadows and blur:
- 29-01: Shadow/blur token infrastructure
- 29-02: Shadow component migrations
- 29-03: Blur migrations
- 29-04: Shadow migration completion

**Impact:** Success criterion 3 "All transition/animation durations reference motion tokens" is unmet. ~386 duration occurrences across 118 files remain unstandardized.

**Recommendation:** Either:
1. Create Phase 29-05 plan for motion timing enforcement
2. OR defer motion timing to a separate phase (Phase 35: Motion Standardization)
3. OR update ROADMAP.md to reflect motion timing was intentionally deferred

**Gap 2: AppHeader.tsx Blur Values (Minor)**

AppHeader.tsx glassStylesLight and glassStylesDark objects use hardcoded blur(30px) instead of var(--blur-2xl). This is inconsistent with the pattern established in CommandPalette.tsx and globals.css.

**Impact:** Low — only 2 instances, non-animated, but breaks consistency.

**Fix:** Replace blur(30px) with blur(var(--blur-2xl)) in both light and dark glass style objects.

---

_Verified: 2026-01-27T19:30:00Z_  
_Verifier: Claude (gsd-verifier)_
