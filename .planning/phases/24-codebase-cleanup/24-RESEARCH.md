# Phase 24: Codebase Cleanup - Research

**Researched:** 2026-01-26
**Domain:** Codebase maintenance, dead code removal, import consolidation
**Confidence:** HIGH

## Summary

This phase focuses on removing legacy 3D code, consolidating duplicate implementations, and cleaning up unused files and exports. The codebase currently has:

- **7 3D-related files** in `src/components/3d/` plus test pages and GLB assets
- **28 unused files** detected by knip (includes 3D, legacy headers, unused components)
- **396 unused exports** across the codebase
- **3+ animation token files** that need consolidation
- **Legacy v6- prefixed aliases** in tailwind.config.ts marked for removal

The cleanup is mechanical and low-risk since knip already identifies targets. The 3D removal will yield significant bundle size reduction (~650KB+ gzipped from three.js alone).

**Primary recommendation:** Use knip output as the authoritative list, remove files in dependency order (leaf files first), consolidate animation tokens to single source of truth, then verify build/tests pass.

## Standard Stack

The cleanup tools already in use:

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| knip | ^5.82.1 | Dead code detection | Already installed, comprehensive analysis |
| @next/bundle-analyzer | ^16.1.3 | Bundle size measurement | Already installed, measures 3D removal impact |
| TypeScript | ^5 | Type checking | Catches broken imports after cleanup |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `pnpm build` | Validates no broken imports | After each removal batch |
| `pnpm test` | Validates functionality preserved | After cleanup complete |
| `pnpm typecheck` | Fast type validation | After import changes |

**Installation:** No new dependencies required. All cleanup tools already in devDependencies.

## Architecture Patterns

### File Removal Order (Dependency-Safe)

Remove in this order to avoid broken import errors during cleanup:

```
1. Leaf components (no dependents)
   └── Components only imported by files also being removed

2. Their parent components
   └── Files that import only from step 1

3. Supporting files
   └── Hooks, utilities, types used only by removed components

4. Export barrels (index.ts)
   └── Update to remove deleted exports

5. NPM packages
   └── Uninstall after all code using them removed
```

### Consolidation Strategy

```
BEFORE (scattered):
src/lib/animations.ts         # V3 Foundation
src/lib/animations/variants.ts # Additional variants
src/lib/animations/cart.ts    # Cart-specific
src/lib/motion.ts             # V6 presets
src/lib/motion-tokens.ts      # V7 tokens

AFTER (consolidated):
src/lib/motion-tokens.ts      # Single source of truth
  - All spring presets
  - All duration/easing tokens
  - All hover effects
  - Stagger utilities
  - Viewport configs
```

### Import Path Standardization

```typescript
// BEFORE (mixed paths)
import { spring } from "@/lib/motion-tokens";
import { fadeIn } from "@/lib/animations";
import { v6Spring } from "@/lib/motion";

// AFTER (single source)
import { spring, fadeIn, staggerContainer } from "@/lib/motion-tokens";
```

### Anti-Patterns to Avoid
- **Removing files without checking imports:** Always run `pnpm typecheck` after each batch
- **Removing index.ts barrels first:** Update exports, don't delete until dependents removed
- **Removing test files with components:** Remove component test files when removing components
- **Force-uninstalling packages:** Packages may have peer dependency relationships

## Don't Hand-Roll

Problems that have existing solutions in this codebase:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Finding dead code | Manual grep | `pnpm knip` | Already configured, 100+ plugins |
| Bundle size analysis | Manual estimation | `ANALYZE=true pnpm build` | Visual treemap output |
| Import path validation | Manual search | `pnpm typecheck` | Catches broken paths instantly |
| Circular dependency check | Manual tracing | Build error messages | Next.js reports clearly |

**Key insight:** knip output is the authoritative removal list. Do not manually hunt for dead code - trust the tool.

## Common Pitfalls

### Pitfall 1: Removing Files That Are Dynamically Imported
**What goes wrong:** `dynamic(() => import(...))` calls aren't statically analyzable
**Why it happens:** knip can miss dynamic imports in some cases
**How to avoid:** The 3D files ARE dynamically imported but knip correctly identifies them as unused because Hero3DSection (the dynamic importer) is itself unused
**Warning signs:** Runtime errors after cleanup about missing modules

### Pitfall 2: Breaking Re-exports in Barrel Files
**What goes wrong:** Removing a file but not updating its index.ts barrel causes build failure
**Why it happens:** Export barrels re-export from deleted files
**How to avoid:** Update index.ts files BEFORE running build verification
**Warning signs:** "Module not found" errors pointing to index.ts files

### Pitfall 3: Removing Dev Dependencies That Are Used in Config
**What goes wrong:** Uninstalling packages used by eslint.config.js, vitest.config.ts, etc.
**Why it happens:** knip flags as "unused" but they're config dependencies
**How to avoid:** knip's devDependencies list includes eslint-config-next, husky, lint-staged - verify config usage before removing
**Warning signs:** knip lists packages that ARE in config files

### Pitfall 4: Partial Animation Token Migration
**What goes wrong:** Some components use old tokens, others use new, causing inconsistent behavior
**Why it happens:** Consolidation done incrementally without updating all consumers
**How to avoid:** Update all 100+ files importing from motion files in single commit
**Warning signs:** TypeScript errors about missing exports after consolidation

### Pitfall 5: Removing Types Used Only by Removed Code
**What goes wrong:** Type files appear unused but are actually needed for build
**Why it happens:** TypeScript types don't show runtime usage
**How to avoid:** Keep types until AFTER all using code removed, then remove together
**Warning signs:** Type errors in seemingly unrelated files

## Code Examples

### 3D File Removal (Verified from knip output)

Files confirmed unused by knip:
```
src/components/homepage/Hero3DSection.tsx     # Uses 3D components
src/components/3d/Hero3DCanvas.tsx
src/components/3d/ThemeAwareLighting.tsx
src/components/3d/Scene.tsx
src/components/3d/index.ts
src/components/3d/hooks/useGPUTier.ts
src/components/3d/loaders/Hero3DLoader.tsx
src/components/3d/models/FoodModel.tsx
src/app/(dev)/3d-test/page.tsx
src/app/(dev)/3d-test/RotatingCube.tsx
public/models/rice-bowl.glb
```

### Package Uninstall Command

```bash
# After all 3D code removed
pnpm remove @react-three/fiber @react-three/drei three @react-spring/three @types/three detect-gpu
```

### Header Files to Remove (Verified from knip)

```
src/components/layout/header.tsx          # Old header (AppHeader is current)
src/components/layout/HeaderClient.tsx    # Old client wrapper
src/components/layout/HeaderServer.tsx    # Old server wrapper
src/components/layout/MobileNav.tsx       # Old mobile nav (MobileDrawer is current)
src/components/layout/NavLinks.tsx        # Unused nav links
src/components/layout/footer.tsx          # Unused footer component
```

### Animation Token Consolidation Example

```typescript
// In src/lib/motion-tokens.ts (keep this as single source)

// Re-export from removed files for backward compatibility during migration
// These can be removed after all imports updated
export {
  fadeIn,
  slideUp,
  slideDown,
  // ... from animations.ts
} from "./animations";

// Or inline the values if files being removed:
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};
```

### Barrel File Update Pattern

```typescript
// src/components/menu/index.ts
// BEFORE
export { CategoryTabs } from "./category-tabs";
export { MenuGrid } from "./MenuGrid";
export { MenuHeader } from "./menu-header";
export { CategoryCarousel } from "./CategoryCarousel";  // REMOVE - knip flagged
export { ModifierToggle } from "./ModifierToggle";      // REMOVE - knip flagged
export { VisualPreview } from "./VisualPreview";        // REMOVE - knip flagged

// AFTER
export { CategoryTabs } from "./category-tabs";
export { MenuGrid } from "./MenuGrid";
export { MenuHeader } from "./menu-header";
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `src/components/layout/header.tsx` | `src/components/layout/AppHeader/` | Phase 23 | Use AppHeader exclusively |
| 3D Hero with R3F | 2D gradient fallback | Phase 24 decision | Removes ~650KB+ from bundle |
| `@/lib/motion.ts` (v6) | `@/lib/motion-tokens.ts` (v7) | Phase 18 | Consolidate to motion-tokens |
| `@/lib/animations.ts` | `@/lib/motion-tokens.ts` | Phase 24 | Single animation source |
| Multiple menu card types | UnifiedMenuItemCard | Phase 18 | Single card component |

**Deprecated/outdated (remove in this phase):**
- `src/lib/motion.ts` - v6 presets, superseded by motion-tokens
- `src/lib/animations/variants.ts` - Variants now in motion-tokens
- `v6-*` prefixed Tailwind aliases - Just remove, primary names work

## Open Questions

1. **Unused npm dependencies flagged by knip**
   - What we know: `@conform-to/react`, `@conform-to/zod`, `@stripe/stripe-js` flagged
   - What's unclear: `@stripe/stripe-js` is used via Stripe SDK initialization - may be false positive
   - Recommendation: Keep @stripe/stripe-js, safe to remove @conform-to/* if not using Conform forms

2. **ui-v8 component folder**
   - What we know: Contains V8 implementations, many with default exports flagged by knip
   - What's unclear: Whether these are actively used or legacy
   - Recommendation: Check import usage before removing - likely active components with export style issues

## Sources

### Primary (HIGH confidence)
- Local codebase analysis via knip (`pnpm knip` output)
- Local codebase file structure (Glob/Grep exploration)
- package.json dependencies list

### Secondary (MEDIUM confidence)
- [Knip Configuration Documentation](https://knip.dev/reference/configuration)
- [Next.js Bundle Analyzer](https://nextjs.org/docs/14/pages/building-your-application/optimizing/bundle-analyzer)
- [React Three Fiber Bundle Size Discussion](https://github.com/pmndrs/react-three-fiber/discussions/812)

### Tertiary (LOW confidence)
- Web search results for cleanup patterns

## Metadata

**Confidence breakdown:**
- 3D removal scope: HIGH - knip confirms all files unused, clear dependency chain
- Legacy header removal: HIGH - knip confirms, AppHeader is current implementation
- Animation consolidation: MEDIUM - patterns clear, but 100+ files need import updates
- npm dependency removal: MEDIUM - knip flags some that may have hidden usage

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (stable domain, tools well-established)
