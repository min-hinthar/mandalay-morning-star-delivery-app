# Phase 34: Full src/ Consolidation - Research

**Researched:** 2026-01-27
**Domain:** Next.js project structure, TypeScript module organization, ESLint import restrictions
**Confidence:** HIGH

## Summary

This phase consolidates all `src/` subdirectories into a single organized structure, building on Phase 33's successful components consolidation. The primary targets are: merging `design-system/` into `lib/design-system/`, moving `contexts/` to `app/`, and ensuring no duplicate exports between directories.

The codebase currently has:
- `design-system/tokens/` with 2 files (motion.ts, z-index.ts) imported by 27 component files
- `contexts/` with 1 file (DriverContrastContext.tsx) imported by 2 driver components
- `lib/` already well-organized with subdirectories (hooks/, utils/, services/, stores/, validations/)
- `types/` with 11 domain type files
- `styles/` with 4 CSS files properly referenced from globals.css
- Duplicate motion tokens: `design-system/tokens/motion.ts` vs `lib/motion-tokens.ts` (different purposes)

**Primary recommendation:** Merge design-system/ into lib/design-system/, move contexts/ to app/, add ESLint guards for removed paths, and verify no type conflicts exist between types/ and lib/validations/.

## Standard Stack

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| ESLint no-restricted-imports | 9.x | Prevent imports from removed directories | Already proven in Phase 33 |
| knip | 5.82.1 | Find unused exports and files | Already configured, fast execution |
| TypeScript path aliases | 5.x | @/ imports | Already configured via tsconfig |

### Supporting

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| grep/ripgrep | N/A | Find import usages before migration | Per-directory migration |
| barrel exports (index.ts) | N/A | Public API definition | For lib/ subdirectories |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Moving contexts/ to app/ | Keeping separate contexts/ | CONTEXT.md decision: co-locate with app router |
| lib/design-system/ destination | design-system/ as root | CONTEXT.md decision: lib/ wins |

## Architecture Patterns

### Recommended Final Structure

```
src/
├── app/                       # Routes + contexts (co-located)
│   ├── providers.tsx          # App-level providers
│   ├── contexts/              # NEW: Moved from src/contexts/
│   │   └── DriverContrastContext.tsx
│   ├── (admin)/
│   ├── (auth)/
│   ├── (customer)/
│   ├── (driver)/
│   ├── (public)/
│   └── api/
├── components/                # UI components (Phase 33 complete)
│   └── ui/
├── lib/                       # All utilities, organized by type
│   ├── auth/                  # Auth utilities
│   ├── constants/
│   ├── design-system/         # NEW: Merged from src/design-system/
│   │   └── tokens/
│   │       ├── motion.ts      # Overlay motion configs
│   │       └── z-index.ts     # Z-index layer system
│   ├── gsap/
│   ├── hooks/                 # Custom hooks (has index.ts)
│   ├── providers/
│   ├── queries/
│   ├── services/
│   ├── stores/
│   ├── stripe/
│   ├── supabase/
│   ├── utils/
│   ├── validations/
│   ├── validators/
│   ├── webgl/
│   ├── motion-tokens.ts       # V7 motion system (different from overlay motion)
│   ├── micro-interactions.ts
│   ├── swipe-gestures.ts
│   ├── theme-sounds.ts
│   └── web-vitals.tsx
├── styles/                    # Global CSS (stays)
│   ├── animations.css
│   ├── high-contrast.css
│   ├── responsive.css
│   └── tokens.css
├── types/                     # Global types (stays)
│   ├── address.ts
│   ├── analytics.ts
│   ├── cart.ts
│   ├── checkout.ts
│   ├── database.ts
│   ├── delivery.ts
│   ├── driver.ts
│   ├── layout.ts
│   ├── menu.ts
│   ├── order.ts
│   └── tracking.ts
├── stories/                   # Storybook stories (stays)
├── test/                      # Test utilities (stays)
└── proxy.ts                   # Root-level utility
```

### Pattern 1: ESLint Guards for Removed Paths

**What:** Block imports from consolidated directories using no-restricted-imports
**When to use:** After each directory removal
**Example:**

```javascript
// Add to eslint.config.mjs patterns array
{
  group: ["@/design-system/*", "@/design-system", "**/design-system/*"],
  message: "design-system/ consolidated into lib/design-system/. Import from @/lib/design-system."
},
{
  group: ["@/contexts/*", "@/contexts", "**/contexts/*"],
  message: "contexts/ moved to app/contexts/. Import from @/app/contexts."
}
```

### Pattern 2: Import Path Update Strategy

**What:** Systematic import path updates using grep then IDE refactoring
**When to use:** Before moving/deleting any directory
**Example:**

```bash
# Find all imports from design-system
grep -rn "from ['\"]@/design-system" src/ --include="*.tsx" --include="*.ts"

# Current: 27 files import from @/design-system/tokens/
# Target: Update to @/lib/design-system/tokens/
```

### Pattern 3: Motion Tokens Clarification

**What:** Two motion token systems exist for different purposes - keep both
**Difference:**
- `design-system/tokens/motion.ts`: Overlay-specific spring physics (modals, drawers, toasts)
- `lib/motion-tokens.ts`: V7 playful animation system (hover, tap, scroll reveal, celebrations)

**Resolution:** Both are needed. Move overlay motion to lib/design-system/tokens/ to consolidate location while preserving functionality.

### Anti-Patterns to Avoid

- **Merging different-purpose files:** Don't combine motion.ts files - they serve different purposes
- **Breaking z-index imports:** 27 components depend on design-system/tokens/z-index - update all atomically
- **Context provider nesting issues:** DriverContrastProvider wraps driver routes - preserve provider hierarchy

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Import path updates | Manual find/replace | IDE rename + grep verification | Catches all references |
| Unused code detection | Manual code review | knip | Handles export chains |
| Import prevention | Git hooks | ESLint no-restricted-imports | IDE integration |
| Type conflict detection | Manual comparison | TypeScript compiler | Catches at build time |

**Key insight:** This phase is primarily path reorganization. TypeScript and ESLint provide all necessary tooling for safe migration.

## Common Pitfalls

### Pitfall 1: Breaking Design System Imports Mid-Migration

**What goes wrong:** Moving design-system/ files before updating 27 consumer imports
**Why it happens:** Eager file movement
**How to avoid:**
1. Create target directory first
2. Copy (don't move) files
3. Update all imports to new path
4. Verify build passes
5. Delete old files
**Warning signs:** TypeScript errors in ui/ components

### Pitfall 2: Context Provider Order Disruption

**What goes wrong:** DriverContrastProvider loses access to necessary context
**Why it happens:** Moving provider without checking dependency chain
**How to avoid:**
1. Check where DriverContrastProvider is used (DriverShell.tsx)
2. Verify no parent context dependencies
3. Update import paths without changing provider nesting
**Warning signs:** "useDriverContrast must be used within DriverContrastProvider" errors

### Pitfall 3: Motion Token Import Confusion

**What goes wrong:** Using overlay motion tokens for general animations or vice versa
**Why it happens:** Two files named similar things
**How to avoid:**
- Keep clear documentation in each file header
- `lib/design-system/tokens/motion.ts` = overlays (modals, sheets, toasts)
- `lib/motion-tokens.ts` = V7 playful system (hover, tap, scroll)
**Warning signs:** Animations feel wrong (too bouncy/stiff for context)

### Pitfall 4: Partial Import Updates

**What goes wrong:** Some files still import from old paths after migration
**Why it happens:** grep misses edge cases (dynamic imports, comments)
**How to avoid:**
1. Update imports
2. Run build
3. Run ESLint
4. Add ESLint guard
5. Search for string literal paths
**Warning signs:** Build errors in files not caught by initial grep

### Pitfall 5: Type Definition Overlap

**What goes wrong:** Same type name exists in types/ and lib/validations/
**Why it happens:** Zod inference creates similar types
**How to avoid:**
- types/ = raw interfaces for props/state
- lib/validations/ = Zod-inferred types for API input
- They may have same shape but different purposes
**Warning signs:** TypeScript complaining about incompatible types

## Code Examples

### Design System Import Migration

```typescript
// Before: src/components/ui/Toast.tsx
import { zIndex } from "@/design-system/tokens/z-index";
import { overlayMotion } from "@/design-system/tokens/motion";

// After:
import { zIndex } from "@/lib/design-system/tokens/z-index";
import { overlayMotion } from "@/lib/design-system/tokens/motion";
```

### Context Migration

```typescript
// Before: src/components/ui/driver/DriverShell.tsx
import { DriverContrastProvider } from "@/contexts/DriverContrastContext";

// After:
import { DriverContrastProvider } from "@/app/contexts/DriverContrastContext";
```

### ESLint Guard Configuration

```javascript
// eslint.config.mjs - Add to existing patterns array
{
  patterns: [
    // Existing Phase 33 guards...

    // Phase 34: Full src/ Consolidation guards
    {
      group: ["@/design-system/*", "@/design-system", "**/design-system/*"],
      message: "design-system/ consolidated into lib/design-system/. Import from @/lib/design-system."
    },
    {
      group: ["@/contexts/*", "@/contexts", "**/contexts/*"],
      message: "contexts/ moved to app/contexts/. Import from @/app/contexts."
    }
  ]
}
```

### Knip Configuration Update

```json
{
  "$schema": "https://unpkg.com/knip@latest/schema.json",
  "entry": [
    "src/app/**/*.{ts,tsx}",
    "src/components/**/index.ts",
    "src/lib/**/index.ts"
  ],
  "project": ["src/**/*.{ts,tsx}"],
  "ignore": [
    "**/*.test.{ts,tsx}",
    "**/*.spec.{ts,tsx}",
    "**/*.stories.{ts,tsx}"
  ],
  "ignoreDependencies": ["@types/*"]
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Scattered design system | Centralized lib/design-system | 2025 | Single source for tokens |
| contexts/ at root | Co-located with app/ | 2025 | Better Next.js App Router alignment |
| Multiple barrel files | Feature-based barrels | 2024 | Better tree-shaking |

**Deprecated/outdated:**
- **src/design-system/ directory:** Consolidate to lib/design-system/
- **src/contexts/ directory:** Move to app/contexts/ for co-location

## Codebase Analysis

### Design System Import Inventory

Files importing from `@/design-system/tokens/z-index` (23 files):
- Backdrop.tsx, Toast.tsx, Tooltip.tsx, Dropdown.tsx, Drawer.tsx, Modal.tsx
- dropdown-menu.tsx, MobileDrawer.tsx, CommandPalette.tsx, Header.tsx
- AdminLayout.tsx, AppHeader.tsx, AccountIndicator.tsx, SectionNavDots.tsx
- CartBar.tsx, FlyToCart.tsx, SearchAutocomplete.tsx
- UnifiedMenuItemCard.tsx, CardImage.tsx, GlassOverlay.tsx, DietaryBadges.tsx

Files importing from `@/design-system/tokens/motion` (6 files):
- Backdrop.tsx, Toast.tsx, Tooltip.tsx, Dropdown.tsx, Drawer.tsx

### Contexts Import Inventory

Files importing from `@/contexts`:
- HighContrastToggle.tsx (uses useDriverContrast hook)
- DriverShell.tsx (uses DriverContrastProvider)

### Type Organization Analysis

**types/ directory** (11 files):
- Raw TypeScript interfaces for data shapes
- Database row types from Supabase
- Component prop types

**lib/validations/ directory** (7 files):
- Zod schema definitions
- Inferred types for API input validation
- Runtime validation

**No conflicts detected** - types/ contains raw interfaces, lib/validations/ contains Zod-inferred input types. Different purposes, can coexist.

### styles/ Analysis

- tokens.css: Design tokens (colors, spacing, typography)
- animations.css: CSS keyframe animations
- high-contrast.css: Accessibility high-contrast mode
- responsive.css: Responsive utility classes

All properly imported via globals.css. No consolidation needed - stays as-is.

## Migration Order

Recommended sequence (each fully atomic):

1. **Audit current state** - Run knip, document all imports
2. **Create lib/design-system/tokens/** - Copy files to new location
3. **Update design-system imports** - All 27 files atomically
4. **Verify build passes** - Run full build
5. **Delete old design-system/** - Remove directory
6. **Create app/contexts/** - New directory for contexts
7. **Move DriverContrastContext** - Update 2 consumer imports
8. **Verify build passes** - Run full build
9. **Delete old contexts/** - Remove directory
10. **Add ESLint guards** - Block imports from removed paths
11. **Update knip config** - Add lib/index.ts entries if needed
12. **Final verification** - Run lint + typecheck + build

## Open Questions

1. **Should lib/ have a root index.ts?**
   - What we know: lib/hooks/ has index.ts, lib/auth/ has index.ts
   - What's unclear: Should there be lib/index.ts re-exporting common utilities?
   - Recommendation: No root barrel - each subdirectory manages own exports

2. **proxy.ts at src/ root**
   - What we know: Single file at src/proxy.ts
   - What's unclear: What it does, if it should move
   - Recommendation: Leave as-is unless usage analysis shows it should move

## Sources

### Primary (HIGH confidence)
- Project codebase analysis (direct file inspection)
- Phase 33 RESEARCH.md and PLAN patterns
- eslint.config.mjs (existing ESLint guards pattern)
- knip.json (existing configuration)

### Secondary (MEDIUM confidence)
- [Knip Configuration Documentation](https://knip.dev/reference/configuration) - entry points, ignore patterns
- [Next.js App Router Structure](https://nextjs.org/docs/app/getting-started/project-structure) - official structure guidance
- [Next.js Folder Structure Best Practices 2026](https://www.codebydeep.com/blog/next-js-folder-structure-best-practices-for-scalable-applications-2026-guide) - community patterns

### Tertiary (LOW confidence)
- Web search results on monorepo consolidation patterns

## Metadata

**Confidence breakdown:**
- Design system migration: HIGH - direct codebase analysis, clear import paths
- Contexts migration: HIGH - only 2 consumers, simple move
- ESLint guards: HIGH - proven pattern from Phase 33
- Type organization: HIGH - analyzed both directories, no conflicts

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (30 days - stable refactoring patterns)
