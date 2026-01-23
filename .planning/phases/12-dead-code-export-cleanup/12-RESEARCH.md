# Phase 12: Dead Code & Export Cleanup - Research

**Researched:** 2026-01-23
**Domain:** Dead code removal, barrel file cleanup, export consolidation
**Confidence:** HIGH

## Summary

Phase 12 addresses technical debt accumulated during the V6 to V8 migration by removing dead code identified in Phase 9's knip analysis. The primary cleanup targets are:

1. **v7-index.ts files:** 10 legacy barrel files across the codebase that are no longer imported anywhere
2. **ui/index.ts dead exports:** Components like DropdownAction, Modal as LegacyModal that have zero references
3. **Legacy checkout exports:** 5 aliases (AddressStepLegacy, TimeStepLegacy, etc.) plus the entire v7-index barrel
4. **admin/index.ts consolidation:** Current barrel only has 5 exports; v7-index has 13 more that are unused

The dead code report from Phase 9 identified 47 unused files, 480 unused exports, and 284 unused types. This phase focuses on the export cleanup requirements (EXPT-01 through EXPT-04) and the zero-reference quality requirement (QUAL-02).

**Primary recommendation:** Remove unused exports incrementally by category (v7-index files first, then barrel exports, then unused files), verifying build/typecheck after each batch.

## Current State Analysis

### Barrel File Structure

| Barrel File | Location | Active Exports | Dead Exports | Notes |
|-------------|----------|----------------|--------------|-------|
| ui/index.ts | src/components/ui/ | ~50 | ~8 | Main UI library, 183 files import from it |
| ui/v7-index.ts | src/components/ui/ | 0 | 37 | Entirely unused, safe to delete |
| checkout/index.ts | src/components/checkout/ | ~25 | 5 legacy | 1 file imports from barrel |
| checkout/v7-index.ts | src/components/checkout/ | 0 | 16 | Entirely unused, safe to delete |
| admin/index.ts | src/components/admin/ | 5 | 0 | Minimal, no direct imports found |
| admin/v7-index.ts | src/components/admin/ | 0 | 13 | Entirely unused, safe to delete |

### v7-index.ts Files (All Unused)

| File | Export Count | Status |
|------|--------------|--------|
| src/components/admin/v7-index.ts | 13 exports + 22 types | DELETE |
| src/components/cart/v7-index.ts | ~8 exports | DELETE |
| src/components/checkout/v7-index.ts | 16 exports | DELETE |
| src/components/driver/v7-index.ts | 6 exports + 6 types | DELETE |
| src/components/homepage/v7-index.ts | 5 exports + 11 types | DELETE |
| src/components/layout/v7-index.ts | 5 exports + 7 types | DELETE |
| src/components/layouts/v7-index.ts | 16 exports + 24 types | DELETE |
| src/components/menu/v7-index.ts | 9 exports + 10 types | DELETE |
| src/components/tracking/v7-index.ts | 14 exports + 17 types | DELETE |
| src/components/ui/v7-index.ts | 37 exports + types | DELETE |

### Unused Files (47 Total)

High-priority unused files for removal:

| Category | Files | Action |
|----------|-------|--------|
| Context/Store | HeaderContext.tsx, contexts/index.ts, cart-store.ts | Remove |
| Hooks | use-cart.ts, useExperiment.tsx, useFeatureFlag.tsx, useFrameRate.ts | Remove |
| Utilities | ab-testing.ts, feature-flags.ts, dynamic-imports.tsx | Remove |
| Components | 25+ files including CartDrawer, CartItem duplicates | Remove |
| Test Mocks | test/mocks/index.ts, test/mocks/supabase.ts | Remove |

## Dead Exports Inventory

### EXPT-01: ui/index.ts Dead Exports

Exports to remove from src/components/ui/index.ts:

| Export | Line | Reason |
|--------|------|--------|
| `Modal as LegacyModal` | 107 | Legacy alias, 0 references |
| `DropdownAction` | 149 | 0 references |
| `Confetti` | 258 | 0 references (but SuccessAnimation is also dead) |
| SkipLinks, MainContent, VisuallyHidden, LiveRegion | SkipLink.tsx | 0 references each |

**Note:** Many ui/index.ts exports ARE actively used (183 imports). Only remove zero-reference items.

### EXPT-02: Legacy Checkout Exports (5 items in index.ts + 16 in v7-index)

From src/components/checkout/index.ts lines 27-35:

| Export | Line | Status |
|--------|------|--------|
| `AddressStepLegacy` | 28 | Remove |
| `TimeStepLegacy` | 29 | Remove |
| `PaymentStepLegacy` | 32 | Remove |
| `CheckoutSummaryLegacy` | 33 | Remove |
| `AddressCardLegacy` | 34 | Remove |

Plus entire v7-index.ts file (16 exports).

### EXPT-03: Admin Consolidation

**Current admin/index.ts (5 exports):**
```typescript
export { AdminNav } from "./AdminNav";
export { OrdersTable } from "./OrdersTable";
export type { AdminOrder } from "./OrdersTable";
export { RevenueChart } from "./RevenueChart";
export { PopularItems } from "./PopularItems";
```

**admin/v7-index.ts (13 exports) - ALL UNUSED:**
- AdminDashboard, AdminDashboardV7
- Charts, ChartsV7, Sparkline, SparklineV7
- OrderManagement, OrderManagementV7
- RouteOptimization, RouteOptimizationV7
- StatusCelebration, InlineCelebrationV7, useCelebration

**Action:** Delete v7-index.ts entirely. The index.ts is correct as-is.

### EXPT-04: Skeleton Variant Dead Exports

From dead code report, skeleton-related dead exports:

| File | Export | Reason |
|------|--------|--------|
| skeleton.tsx | `default` (line 472) | Default export unused, named exports used |
| ui/v7-index.ts | SkeletonV7, all skeleton re-exports | Entire file unused |

**Note:** The named skeleton exports (Skeleton, SkeletonText, etc.) ARE actively used via ui/index.ts.

## Standard Stack

### Core Tools
| Tool | Version | Purpose | Why Use |
|------|---------|---------|---------|
| knip | 5.82.1 | Dead code detection | Already configured, comprehensive analysis |
| TypeScript | 5.x | Type checking | Verifies no import breaks |
| Next.js | 16.1.2 | Build verification | Full tree-shaking, catches dead imports |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| pnpm build | Full verification | After each cleanup batch |
| pnpm typecheck | Quick verification | After individual file edits |
| pnpm test | Regression check | Before commit |

## Architecture Patterns

### Safe Deletion Pattern

```
1. Run knip to identify targets
2. Check for dynamic imports: grep -r "import(" for component name
3. Remove export from barrel
4. Run typecheck
5. If errors, check direct imports
6. Run build
7. Commit batch
```

### Barrel Export Cleanup Pattern

**Before:**
```typescript
// Legacy pattern with V7 aliases
export { Component, Component as ComponentV7 } from "./Component";
```

**After:**
```typescript
// Clean single export
export { Component } from "./Component";
```

### Import Path Migration (if needed)

If any code imports from v7-index directly:

```typescript
// Before
import { ComponentV7 } from "@/components/checkout/v7-index";

// After
import { Component } from "@/components/checkout";
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Finding unused exports | Manual grep | knip report from Phase 9 | AST-aware, handles re-exports |
| Verifying no breakage | Visual inspection | pnpm build + typecheck | Catches all import paths |
| Finding all imports | grep | TypeScript errors | Type system knows all references |
| Batching changes | One big PR | Multiple small commits | Easier rollback if issues |

## Common Pitfalls

### Pitfall 1: Removing Exports Used by Tests/Stories

**What goes wrong:** Removing export breaks Storybook stories or tests
**Why it happens:** knip.json ignores test/story files, may report export as unused
**How to avoid:** Check for `*.stories.tsx` and `*.test.tsx` imports before deleting
**Warning signs:** Export is a UI component with visual variations

### Pitfall 2: Breaking Dynamic Imports

**What goes wrong:** Runtime error when dynamic import fails
**Why it happens:** `import()` calls not tracked by static analysis
**How to avoid:** Search for `import("` + component name before removing
**Warning signs:** Component used in lazy loading, code splitting

### Pitfall 3: Removing Type-Only Exports

**What goes wrong:** TypeScript compilation fails elsewhere
**Why it happens:** Type imports may not create runtime references
**How to avoid:** Remove types alongside their components, not separately
**Warning signs:** Export is a TypeScript interface/type

### Pitfall 4: V7 Index Import Paths

**What goes wrong:** Files still import from v7-index path after deletion
**Why it happens:** Direct imports to v7-index.ts instead of main index.ts
**How to avoid:** Grep for "v7-index" imports before deleting
**Warning signs:** knip shows 0 references but grep finds imports

### Pitfall 5: Removing Default Exports Used Dynamically

**What goes wrong:** next/dynamic imports fail
**Why it happens:** `dynamic(() => import("./Component"))` uses default export
**How to avoid:** Keep default exports on components that may be dynamically imported
**Warning signs:** Component in app pages or heavy UI components

## Removal Strategy

### Phase 12-01: Zero-Reference Export Removal

**Scope:** Files with zero references (not barrels)
**Files to delete:** 47 unused files from dead code report

**Batch 1: Context/Store/Hook files**
- src/contexts/HeaderContext.tsx
- src/contexts/index.ts
- src/hooks/use-cart.ts
- src/stores/cart-store.ts

**Batch 2: Utility files**
- src/lib/ab-testing.ts
- src/lib/dynamic-imports.tsx
- src/lib/feature-flags.ts

**Batch 3: Component files (25+)**
- Cart component duplicates
- Admin unused components
- Layout unused components

### Phase 12-02: UI and Checkout Export Cleanup

**Scope:** Barrel file export cleanup

**Step 1: Delete checkout/v7-index.ts**
- Verify: `grep -r "v7-index" src/components/checkout/`
- Action: Delete file

**Step 2: Remove checkout/index.ts legacy exports**
```typescript
// Remove these lines (27-35):
export { AddressStep as AddressStepLegacy } from "./AddressStep";
export { TimeStep as TimeStepLegacy } from "./TimeStep";
export { PaymentStep as PaymentStepLegacy } from "./PaymentStep";
export { CheckoutSummary as CheckoutSummaryLegacy } from "./CheckoutSummary";
export { AddressCard as AddressCardLegacy } from "./AddressCard";
```

**Step 3: Delete ui/v7-index.ts**
- Entire file is unused
- Contains FlipCard, ExpandingCard, Carousel, etc. - all dead

**Step 4: Clean ui/index.ts dead exports**
- Remove LegacyModal alias
- Remove DropdownAction export
- Remove Confetti export (verify first)

### Phase 12-03: Admin Consolidation and Skeleton Cleanup

**Scope:** Admin barrel cleanup, remaining skeleton exports

**Step 1: Delete admin/v7-index.ts**
- Verify: `grep -r "v7-index" src/components/admin/`
- Action: Delete file (13 exports, all unused)

**Step 2: Delete remaining v7-index files**
- cart/v7-index.ts
- driver/v7-index.ts
- homepage/v7-index.ts
- layout/v7-index.ts
- layouts/v7-index.ts
- menu/v7-index.ts
- tracking/v7-index.ts

**Step 3: Remove skeleton default export**
- Line 472 in skeleton.tsx: `export default Skeleton;`
- Keep all named exports (actively used)

## Risk Areas

### High Risk
| Area | Risk | Mitigation |
|------|------|------------|
| ui/index.ts changes | 183 files import from here | Remove only verified-dead exports |
| Default exports | May break dynamic imports | Search for `import()` before removing |

### Medium Risk
| Area | Risk | Mitigation |
|------|------|------------|
| Type exports | May be used for type-only imports | Remove with associated component |
| Checkout changes | Active user flow | Verify checkout page works after |

### Low Risk
| Area | Risk | Mitigation |
|------|------|------------|
| v7-index.ts deletion | Files already confirmed unused | Grep verification before delete |
| Unused files deletion | May have planned future use | Document what was removed |

## Testing Plan

### Pre-Cleanup Verification
```bash
# Verify current state passes
pnpm typecheck
pnpm test
pnpm build
```

### Per-Batch Verification
```bash
# After each batch of deletions
pnpm typecheck  # Quick check
pnpm build      # Full verification
```

### Post-Cleanup Verification
```bash
# Full verification suite
pnpm lint && pnpm lint:css && pnpm typecheck && pnpm test && pnpm build

# Manual smoke tests
# - /checkout page loads and works
# - /admin page loads
# - /menu page with cart interactions
```

### Re-run Dead Code Analysis
```bash
# Verify cleanup was successful
npx knip --reporter json > dead-code-post-cleanup.json
# Compare counts to Phase 9 report
```

## Code Examples

### Removing Barrel Export
```typescript
// Before: src/components/checkout/index.ts
export { AddressStep as AddressStepLegacy } from "./AddressStep";  // REMOVE

// After: Line deleted
```

### Verifying No Imports Before Delete
```bash
# Check for any imports of v7-index
grep -r "from.*v7-index" src/

# Check for dynamic imports of component
grep -r "import.*ComponentName" src/
```

### Deleting Unused File
```bash
# Verify file has no references
npx knip --include files | grep "filename.tsx"

# Remove file
rm src/path/to/unused-file.tsx

# Verify build
pnpm typecheck
```

## Sources

### Primary (HIGH confidence)
- `.planning/phases/09-analysis-component-creation/dead-code-report.md` - Complete dead code inventory
- `src/components/ui/index.ts` - Current barrel structure
- `src/components/checkout/index.ts` - Checkout barrel
- `src/components/admin/index.ts` - Admin barrel
- `knip.json` - Dead code analysis configuration

### Secondary (MEDIUM confidence)
- `src/components/*/v7-index.ts` - Legacy barrel files
- Phase 9 research - Tool selection and methodology

### Tertiary (LOW confidence)
- Dynamic import usage patterns - may need runtime verification

## Metadata

**Confidence breakdown:**
- Current state analysis: HIGH - verified via grep and file reading
- Dead exports inventory: HIGH - from Phase 9 knip report
- Removal strategy: HIGH - standard cleanup patterns
- Risk assessment: MEDIUM - some edge cases may exist

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - cleanup is time-insensitive)
