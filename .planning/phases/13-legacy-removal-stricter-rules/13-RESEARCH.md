# Phase 13: Legacy Removal & Stricter Rules - Research

**Researched:** 2026-01-23
**Domain:** Build configuration, ESLint rules, TypeScript compiler options, file deletion
**Confidence:** HIGH

## Summary

Phase 13 requires three types of changes: deleting legacy v7-index.ts barrel files, upgrading ESLint z-index rule severity, and enabling stricter TypeScript flags. Current codebase investigation reveals:

1. **v7-index.ts files**: 10 files exist, zero active imports reference them (Phase 11 completed migration)
2. **ESLint z-index rule**: Currently at "warn" with 12 warnings - 11 are false positives (documented local stacking contexts), 1 is a real violation in `ui-v8/Modal.tsx`
3. **TypeScript strict flags**: Enabling `noUnusedLocals` and `noUnusedParameters` would cause ~62 errors that need fixing first

**Primary recommendation:** Fix violations BEFORE changing rule severity. Order: (1) Fix TypeScript violations, (2) Fix/suppress z-index warnings, (3) Upgrade rules to error, (4) Delete v7-index.ts files, (5) Verify build.

## Standard Stack

This phase involves configuration changes, not new libraries.

### Core Tools
| Tool | Version | Purpose | Configuration File |
|------|---------|---------|-------------------|
| TypeScript | 5.9.3 | Type checking | tsconfig.json |
| ESLint | 9.39.2 | Lint rules | eslint.config.mjs |
| pnpm | 10.28.1 | Package manager | package.json |

### Key Files
| File | Purpose | Changes Needed |
|------|---------|----------------|
| `tsconfig.json` | TypeScript config | Add noUnusedLocals, noUnusedParameters |
| `eslint.config.mjs` | ESLint flat config | Change "warn" to "error" on line 45 |
| `src/components/*/v7-index.ts` | Legacy barrels (10 files) | Delete all |

## Architecture Patterns

### v7-index.ts File Locations (10 files)

```
src/components/
├── admin/v7-index.ts        # Has exports (AdminDashboard, Charts, etc.)
├── cart/v7-index.ts         # Empty (only comments, exports removed in Phase 12)
├── checkout/v7-index.ts     # Has exports (CheckoutWizard, AddressInput, etc.)
├── driver/v7-index.ts       # Has exports (DriverDashboard, Leaderboard, etc.)
├── homepage/v7-index.ts     # Has exports (Hero, FloatingFood, Timeline, etc.)
├── layout/v7-index.ts       # Has exports (Header, MobileNav, Footer)
├── layouts/v7-index.ts      # Has exports (PageTransition, ParallaxContainer, etc.)
├── menu/v7-index.ts         # Has exports (CategoryCarousel, MenuItemCard, etc.)
├── tracking/v7-index.ts     # Has exports (TrackingMap, StatusTimeline, etc.)
└── ui/v7-index.ts           # Has exports (MorphingMenu, AnimatedLink, etc.)
```

**Key finding:** Zero imports reference these files (verified by grep). Safe to delete.

### ESLint z-index Rule Location

```javascript
// eslint.config.mjs line 45-72
{
  files: ["src/components/**/*.tsx", "src/app/**/*.tsx"],
  rules: {
    "no-restricted-syntax": [
      "warn",  // <-- Change to "error"
      // ... z-index patterns
    ]
  }
}
```

### TypeScript Config Changes

```json
// tsconfig.json - add to compilerOptions
{
  "compilerOptions": {
    "strict": true,  // already present
    "noUnusedLocals": true,     // ADD
    "noUnusedParameters": true  // ADD
  }
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Z-index layer system | Custom values | `zIndex` tokens from `@/design-system/tokens/z-index` | Already exists, enforced by ESLint |
| Barrel exports | v7-index.ts patterns | Direct imports | Phase 11 migrated all consumers |

## Common Pitfalls

### Pitfall 1: Upgrading Rule Severity Before Fixing Violations
**What goes wrong:** Build fails immediately on existing violations
**Why it happens:** ESLint warnings become errors before code is fixed
**How to avoid:** Always fix violations BEFORE changing severity
**Warning signs:** Non-zero warning count in `pnpm lint`

### Pitfall 2: Z-Index False Positives
**What goes wrong:** Local stacking contexts flagged as violations
**Why it happens:** ESLint rule catches ALL `zIndex: number` patterns, including documented local stacking contexts
**How to avoid:** Add `// eslint-disable-next-line no-restricted-syntax` comments for legitimate local contexts
**Current false positives:**
- `FloatingFood.tsx` lines 65, 76, 87, 98, 109, 120 (data object properties)
- `Hero.tsx` lines 212, 219, 270 (documented local stacking, see comment at line 204)

### Pitfall 3: React Import False Positives
**What goes wrong:** 26 files report "React is declared but never read"
**Why it happens:** Modern JSX transform doesn't need explicit React import
**How to avoid:** Remove unnecessary `import React from 'react'` statements
**Files affected:** Multiple component files in admin, checkout, driver, menu, tracking, ui-v8

### Pitfall 4: API Route Request Parameter
**What goes wrong:** 16 API routes report "'request' is declared but never used"
**Why it happens:** Next.js route handlers require signature but don't always use request
**How to avoid:** Prefix with underscore: `_request` to indicate intentionally unused
**Pattern:**
```typescript
// Before
export async function GET(request: Request, { params }: Props) {

// After
export async function GET(_request: Request, { params }: Props) {
```

### Pitfall 5: Deleting v7-index.ts With Active Imports
**What goes wrong:** TypeScript errors on missing module
**Why it happens:** File deleted before all imports migrated
**How to avoid:** Verify zero imports with grep BEFORE deleting
**Current state:** Zero imports found (safe to delete)

## Code Examples

### ESLint Rule Change
```javascript
// eslint.config.mjs - line 45
// Before
"no-restricted-syntax": ["warn", ...patterns]

// After
"no-restricted-syntax": ["error", ...patterns]
```

### tsconfig.json Update
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    // ... rest of config
  }
}
```

### ESLint Disable for Local Stacking Context
```typescript
// In Hero.tsx at line 212
<canvas
  className="absolute inset-0 pointer-events-none"
  // eslint-disable-next-line no-restricted-syntax
  style={{ width: "100%", height: "100%", zIndex: 1 }}
/>
```

### Prefix Unused Parameters
```typescript
// API route handler
export async function DELETE(
  _request: Request,  // Prefixed with underscore
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

### Remove Unnecessary React Import
```typescript
// Before
import React from 'react';
import { motion } from 'framer-motion';

// After (modern JSX transform)
import { motion } from 'framer-motion';
```

## Current Violations Summary

### ESLint Z-Index Warnings (12 total)
| File | Lines | Type | Fix |
|------|-------|------|-----|
| FloatingFood.tsx | 65, 76, 87, 98, 109, 120 | Data object (false positive) | ESLint disable or refactor |
| Hero.tsx | 212, 219, 270, 448 | Local stacking (false positive) | ESLint disable |
| Hero.tsx | 270 (second violation) | Local stacking | ESLint disable |
| ui-v8/Modal.tsx | 354 | Real violation (`z-10`) | Change to `z-dropdown` |

### TypeScript noUnusedLocals/noUnusedParameters Errors (~62 total)
| Category | Count | Fix Strategy |
|----------|-------|--------------|
| Unused React imports | 26 | Remove import statements |
| Unused `request` param | 16 | Prefix with `_request` |
| Other unused vars | 20 | Remove or prefix with `_` |

## State of the Art

| Phase 10 State | Current State | Impact |
|----------------|---------------|--------|
| 0 z-index warnings | 12 warnings (11 false positives) | Must fix/suppress before error upgrade |
| `strict: true` | `strict: true` | Need to add 2 more flags |
| v7-index.ts imported | v7-index.ts orphaned | Safe to delete |

**Note on discrepancy:** Phase 10 verification reported "0 warnings" but current lint shows 12. This is because Phase 10 focused on Tailwind class z-index (`z-10`, `z-20`) while the current warnings are primarily from inline style `zIndex: number` patterns in data objects and documented local stacking contexts.

## Open Questions

None. All research questions answered with high confidence.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: `eslint.config.mjs`, `tsconfig.json`, all v7-index.ts files
- Command verification: `pnpm lint`, `npx tsc --noUnusedLocals --noUnusedParameters`
- grep verification for v7-index imports: 0 matches

### Secondary (MEDIUM confidence)
- Phase 10 VERIFICATION.md - explains z-index token migration strategy
- LEARNINGS.md - documents v7-index migration pattern from Phase 11

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- v7-index.ts deletion: HIGH - verified zero imports with grep
- ESLint upgrade: HIGH - analyzed all 12 warnings, identified fix strategies
- TypeScript flags: HIGH - ran tsc with flags, categorized all ~62 errors

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (stable configuration domain)

## Recommended Execution Order

1. **Fix TypeScript violations** (prerequisite)
   - Remove 26 unnecessary React imports
   - Prefix 16 API route `request` params with `_`
   - Fix 20 other unused variables

2. **Enable TypeScript strict flags**
   - Add `noUnusedLocals: true` to tsconfig.json
   - Add `noUnusedParameters: true` to tsconfig.json
   - Verify: `pnpm typecheck` passes

3. **Fix z-index violations**
   - Change `z-10` to `z-dropdown` in `ui-v8/Modal.tsx`
   - Add ESLint disable comments for 11 false positives (local stacking contexts)

4. **Upgrade ESLint z-index rule**
   - Change "warn" to "error" in eslint.config.mjs line 45
   - Verify: `pnpm lint` passes

5. **Delete v7-index.ts files** (10 files)
   - Safe to delete - zero active imports
   - Verify: `pnpm typecheck` still passes

6. **Final verification**
   - Run: `pnpm lint && pnpm typecheck && pnpm build`
