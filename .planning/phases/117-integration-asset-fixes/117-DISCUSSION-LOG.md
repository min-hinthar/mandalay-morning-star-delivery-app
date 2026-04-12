# Phase 117: Integration & Asset Fixes - Discussion Log (Assumptions Mode)

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the analysis.

**Date:** 2026-04-11
**Phase:** 117-integration-asset-fixes
**Mode:** assumptions (auto)
**Areas analyzed:** Toast Wiring Fix, Legacy Toast Cleanup, OG Image Asset, Test Updates
**Research source:** 12-agent deep protocol (6 Wave 1 + 4 Wave 2)

## Assumptions Presented

### Toast Wiring Fix (CFIX-04)

| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Import swap `useToast` → `useToastV8` fixes dead dispatch | Confident | `usePaymentSubmit.ts:6` imports legacy; `Toast.tsx:20-23` reads V8 store |
| `duration: Infinity` fails — need guard clause in `addToRemoveQueue` | Confident | Verified: `setTimeout(fn, Infinity)` overflows 32-bit int → 1ms fire |
| `duration: 0` with guard = persistent (skip remove queue) | Confident | Convention matches react-hot-toast, sonner; V8 has no guards at line 186-195 |
| API shape transform: title→message, variant→type, persistent→duration:0 | Confident | V8 ToastOptions interface vs legacy Toast type |
| Use title only ("Checkout timed out"), not merged title+description | Confident | V8 max-w-[380px]; existing toasts avg 30-65 chars |
| No action button on toast | Confident | Banner has "Try again"; cart undo is only action button precedent |
| No Burmese text in toast | Confident | 0/81 V8 toast files use bilingual content |

### Legacy Toast Cleanup

| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| `useToast.ts` has zero consumers after migration | Confident | Exhaustive grep: only `usePaymentSubmit.ts` + its test import it |
| Safe to delete entirely (module + test + barrel export) | Confident | No hook consumers, no function consumers post-swap |

### OG Image Asset (UXPL-06)

| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Static PNG sufficient (no dynamic generation needed) | Confident | UXPL-06 requires "rich preview when shared" — static brand image satisfies |
| All metadata code already correct | Confident | `layout.tsx:46`, `share/page.tsx:71,101,108` reference `/og-image.png` |
| Use hero gradient + logo + tagline for brand-appropriate image | Confident | Brand tokens, logo asset, tagline all available in codebase |
| `sharp` v0.34.5 available for programmatic generation | Confident | Already in `package.json` dependencies |

### Test Updates

| Assumption | Confidence | Evidence |
|------------|-----------|----------|
| Mock path change: `useToast` → `useToastV8` | Confident | Direct dependency of import swap |
| Assertion change: `persistent/variant` → `duration/type` | Confident | V8 API has different field names |
| Need new persistent toast unit test for guard clause | Confident | No existing test covers `duration: 0` behavior |

## Corrections Made

No corrections — all assumptions auto-confirmed (--auto mode, all Confident).

## Research Agents Deployed

### Wave 1 (6 agents)
1. Toast system deep analysis — API shapes, import mapping, exact diff
2. OG image + meta analysis — metadata references, brand assets, color palette
3. Prior phase contracts — Phase 110/116 contracts, requirement definitions
4. Checkout flow codebase — Stripe timeout → error display pipeline
5. Learnings + gotchas — 14 gotchas with severity ratings
6. Git history + legacy toast — migration timeline, orphaned imports

### Wave 2 (4 agents)
7. V8 toast persistence — **CRITICAL**: discovered `setTimeout(fn, Infinity)` fires at 1ms
8. Gray areas resolution — 5 ambiguities resolved with codebase evidence
9. OG image creation approach — Sharp build script recommended
10. Design token + brand audit — complete brand identity inventory

## Key Discovery

The most impactful finding was from Wave 2 Agent 7: `setTimeout(fn, Infinity)` overflows JavaScript's 32-bit signed integer for timer delays, causing the callback to fire at ~1ms instead of never. This means the naive fix (import swap + `duration: Infinity`) would produce a toast that appears and vanishes instantly — worse than the current dead-dispatch bug. The fix requires patching `useToastV8.addToRemoveQueue` with a guard clause first.
