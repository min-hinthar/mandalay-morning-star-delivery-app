# Phase 37: Codebase Cleanup - Research

**Researched:** 2026-02-04
**Domain:** Dead code elimination, circular dependency resolution, file size enforcement, ESLint configuration
**Confidence:** HIGH

## Summary

This phase focuses on pure maintenance/refactoring with no new features. The codebase has existing tooling (knip v5.82.1) for dead code detection and ESLint with `no-restricted-imports` for directory guards. Current analysis reveals:

- **9 circular dependencies** detected by madge
- **30 component files** exceed the 400-line threshold
- **3 unused files** and **134 unused exports** detected by knip
- **7 Storybook files** to delete (requirement says 8 - verify count)
- **4 auth components** to delete: AuthModal, MagicLinkSent, OnboardingTour, WelcomeAnimation
- ESLint already guards 14 consolidated directories from Phase 33-34

**Primary recommendation:** Use existing knip for dead code detection, add eslint-plugin-import-x for `no-cycle` rule, and configure `max-lines` as warning. Execute deletions systematically with barrel export cleanup per LEARNINGS.md pattern.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library                | Version | Purpose                                      | Why Standard                                              |
| ---------------------- | ------- | -------------------------------------------- | --------------------------------------------------------- |
| knip                   | 5.82.1  | Dead code detection                          | Already installed, configured, finds unused exports/files |
| madge                  | 8.0.0   | Circular dependency detection                | Available via npx, handles TypeScript/TSConfig paths      |
| eslint-plugin-import-x | 0.5.x   | Import rules (no-cycle, no-restricted-paths) | Fork of eslint-plugin-import, faster, actively maintained |

### Supporting

| Library  | Version | Purpose                                   | When to Use                          |
| -------- | ------- | ----------------------------------------- | ------------------------------------ |
| ts-prune | 0.10.x  | Alternative dead code detection           | Backup if knip misses edge cases     |
| dpdm     | 3.x     | Alternative circular dependency detection | If madge performance is insufficient |

### Alternatives Considered

| Instead of             | Could Use            | Tradeoff                                                        |
| ---------------------- | -------------------- | --------------------------------------------------------------- |
| knip                   | ts-prune             | knip is more comprehensive (deps, files, exports)               |
| madge                  | dpdm                 | madge has better TS support, dpdm is faster for large codebases |
| eslint-plugin-import-x | eslint-plugin-import | import-x is actively maintained fork, better perf               |

**Installation:**

```bash
# eslint-plugin-import-x for no-cycle rule
pnpm add -D eslint-plugin-import-x
# madge already available via npx
```

## Architecture Patterns

### Current Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (admin)/           # Admin route group
│   ├── (auth)/            # Auth route group
│   ├── (customer)/        # Customer route group
│   ├── (driver)/          # Driver route group
│   ├── (public)/          # Public route group
│   └── api/               # API routes
├── components/
│   └── ui/                # Unified component library
│       ├── account/
│       ├── admin/
│       ├── auth/          # Contains files to delete
│       ├── brand/
│       ├── cart/
│       ├── checkout/
│       ├── coverage/
│       ├── driver/
│       ├── homepage/
│       ├── icons/
│       ├── layout/
│       ├── menu/
│       ├── navigation/
│       ├── orders/
│       └── scroll/
├── lib/                   # Utilities, hooks, clients
│   ├── auth/
│   ├── constants/
│   ├── design-system/
│   ├── gsap/
│   └── hooks/
└── types/                 # Shared type definitions
```

### Pattern 1: Barrel Export Cleanup

**What:** When deleting component files, update barrel `index.ts` files
**When to use:** Every file deletion
**Example:**

```typescript
// BEFORE: src/components/ui/auth/index.ts
export { LoginForm } from "./LoginForm";
export { AuthModal } from "./AuthModal"; // DELETE THIS LINE
export { MagicLinkSent } from "./MagicLinkSent"; // DELETE THIS LINE

// AFTER: src/components/ui/auth/index.ts
export { LoginForm } from "./LoginForm";
// Deleted exports removed
```

### Pattern 2: Circular Dependency Resolution via Extraction

**What:** Extract shared code to third file to break cycle
**When to use:** When A imports B and B imports A
**Example:**

```typescript
// BEFORE: Cycle between SettingsClient.tsx and DeliverySettingsForm.tsx
// SettingsClient imports DeliverySettingsForm
// DeliverySettingsForm imports types/functions from SettingsClient

// AFTER: Extract shared code to settings-types.ts
// src/components/ui/admin/settings/settings-types.ts
export interface SettingsFormProps { ... }
export type SettingsTab = "delivery" | "notifications" | "operations";

// Both files import from settings-types.ts instead of each other
```

### Pattern 3: File Splitting by Concern

**What:** Split large files (>400 lines) into focused modules
**When to use:** Component files exceeding threshold
**Example:**

```typescript
// BEFORE: OrderDetailExpanded.tsx (984 lines)
// Contains: OrderHeader, OrderItems, OrderActions, OrderTimeline, hooks

// AFTER: Split by concern
// OrderDetailExpanded.tsx (main orchestrator, ~150 lines)
// OrderDetailHeader.tsx (~150 lines)
// OrderDetailItems.tsx (~200 lines)
// OrderDetailActions.tsx (~150 lines)
// OrderDetailTimeline.tsx (~200 lines)
// use-order-detail.ts (hooks, ~130 lines)
```

### Anti-Patterns to Avoid

- **Deleting without barrel update:** Leaves dangling exports, breaks builds
- **Renaming via copy-paste:** Loses git history; use `git mv` instead
- **Shallow cycle fix:** Moving import to different file without extracting shared logic
- **Over-splitting:** Creating files that are too small to be meaningful (<50 lines)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                       | Don't Build           | Use Instead                  | Why                                          |
| ----------------------------- | --------------------- | ---------------------------- | -------------------------------------------- |
| Unused export detection       | grep-based script     | knip                         | Handles dynamic imports, re-exports, aliases |
| Circular dependency detection | Manual import tracing | madge                        | Handles barrel exports, transitive deps      |
| Line counting                 | wc -l scripts         | ESLint max-lines             | Integrates with build, respects skip options |
| Import restriction            | Runtime checks        | ESLint no-restricted-imports | Fails at lint time, not runtime              |

**Key insight:** Static analysis tools understand AST, not just text patterns. Grep misses re-exports, dynamic imports, and type-only imports.

## Common Pitfalls

### Pitfall 1: Knip False Positives on Dynamic Imports

**What goes wrong:** Knip reports component as unused when it's dynamically imported
**Why it happens:** Dynamic imports like `React.lazy(() => import("./Component"))` need entry point configuration
**How to avoid:** Review each "unused" finding; check for lazy loading patterns
**Warning signs:** Component used in Suspense boundaries reported as unused

### Pitfall 2: Barrel Export Cycles

**What goes wrong:** Circular dependency in `index.ts` files that re-export components
**Why it happens:** `ui/index.ts` exports `cart/index.ts` which exports `CartDrawer.tsx` which imports from `ui/index.ts`
**How to avoid:** Import from specific files, not barrel exports; configure madge to detect barrel cycles
**Warning signs:** madge reports cycles involving `index.ts` files

### Pitfall 3: Type-Only Imports Creating Cycles

**What goes wrong:** Cycles reported even when only importing types
**Why it happens:** TypeScript compiles away `import type` but analysis tools may still see it
**How to avoid:** Per CONTEXT.md decision: treat same as regular imports (still fix cycles)
**Warning signs:** Cycles between files that only share types

### Pitfall 4: ESLint no-cycle Performance Impact

**What goes wrong:** Lint times increase significantly (10x+ slowdown)
**Why it happens:** Cycle detection requires traversing dependency graph
**How to avoid:** Use `maxDepth: 10` initially, tune based on performance; use `ignoreExternal: true`
**Warning signs:** CI lint step taking >5 minutes

### Pitfall 5: Deleting Files Still Referenced in Tests

**What goes wrong:** Build passes but tests fail
**Why it happens:** knip is configured to ignore test files (`**/*.test.{ts,tsx}`)
**How to avoid:** Run `grep -r "ComponentName" src --include="*.test.*"` before deletion
**Warning signs:** Component marked unused but has `.test.tsx` file

## Code Examples

Verified patterns from official sources and existing codebase:

### ESLint no-cycle Configuration

```javascript
// Source: https://context7.com/un-ts/eslint-plugin-import-x/llms.txt
// eslint.config.mjs
import importX from "eslint-plugin-import-x";

{
  plugins: { "import-x": importX },
  rules: {
    "import-x/no-cycle": [
      "error",
      {
        maxDepth: 10,           // Limit traversal depth for performance
        ignoreExternal: true,   // Skip node_modules
      }
    ]
  }
}
```

### ESLint max-lines Configuration (Warning Mode)

```javascript
// Source: https://eslint.org/docs/latest/rules/max-lines
// eslint.config.mjs
{
  files: ["src/components/**/*.tsx"],
  rules: {
    "max-lines": [
      "warn",  // Warning, not error per CONTEXT.md
      {
        max: 400,
        skipBlankLines: true,
        skipComments: true,
      }
    ]
  }
}
```

### ESLint no-restricted-imports (Existing Pattern)

```javascript
// Source: Current eslint.config.mjs
// Pattern already established for consolidated directories
{
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@/components/navigation/*", "@/components/navigation"],
            message: "navigation/ deleted. Import from @/components/ui/layout."
          }
        ]
      }
    ]
  }
}
```

### Knip Configuration for Next.js

```json
// Source: https://context7.com/webpro-nl/knip/llms.txt
// knip.json (current config is correct)
{
  "$schema": "https://unpkg.com/knip@latest/schema.json",
  "entry": ["src/app/**/*.{ts,tsx}", "src/components/**/index.ts", "src/lib/**/index.ts"],
  "project": ["src/**/*.{ts,tsx}"],
  "ignore": ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}", "**/*.stories.{ts,tsx}"],
  "ignoreDependencies": ["@types/*"]
}
```

### Madge Circular Dependency Check

```bash
# Source: https://www.npmjs.com/package/madge
# Run circular dependency check
npx madge --circular --ts-config ./tsconfig.json --extensions ts,tsx src/

# Generate dependency graph image
npx madge --image graph.svg --ts-config ./tsconfig.json src/
```

### Git History Preservation for Moves

```bash
# Source: .claude/LEARNINGS.md - Windows Git Case-Sensitive Rename
# Preserve git history when moving/renaming
git mv src/components/ui/auth/AuthModal.tsx src/archive/AuthModal.tsx.deleted

# Or for simple deletion (history preserved in git log)
git rm src/components/ui/auth/AuthModal.tsx
```

## State of the Art

| Old Approach             | Current Approach       | When Changed | Impact                         |
| ------------------------ | ---------------------- | ------------ | ------------------------------ |
| ts-prune for dead code   | knip (comprehensive)   | 2023         | Finds deps, files, AND exports |
| eslint-plugin-import     | eslint-plugin-import-x | 2024         | Faster, actively maintained    |
| Manual barrel updates    | Automated via knip     | Current      | Reports dangling exports       |
| grep for cycle detection | madge with TSConfig    | Current      | Handles path aliases           |

**Deprecated/outdated:**

- ts-prune: Still works but knip is more comprehensive
- Manual dependency graphing: madge automates this

## Open Questions

Things that couldn't be fully resolved:

1. **Storybook file count discrepancy**
   - What we know: Found 7 files (Badge, Button, Input, Modal, Container, Grid, Stack)
   - What's unclear: Requirement says 8 files - is there a missing one?
   - Recommendation: Verify with glob, delete all found .stories.tsx in ui/

2. **AuthHandler.tsx status**
   - What we know: Knip reports it as unused file
   - What's unclear: May be dynamically loaded via auth callback flow
   - Recommendation: Verify import paths in auth callback routes before deletion

3. **Navigation folder current state**
   - What we know: REFACTOR-02 says delete 6 files in navigation/
   - What's unclear: `src/components/ui/navigation/` exists with files
   - Recommendation: Distinguish between old `src/components/navigation/` (deleted) and `src/components/ui/navigation/` (current)

## Current Codebase Findings

### Circular Dependencies (9 total)

```
1) SettingsClient.tsx > DeliverySettingsForm.tsx
2) SettingsClient.tsx > NotificationSettingsForm.tsx
3) SettingsClient.tsx > OperationsSettingsForm.tsx
4) ui/index.ts > cart/index.ts > CartDrawer.tsx > ClearCartConfirmation.tsx
5) ui/index.ts > cart/index.ts > CartDrawer.tsx
6) checkout/index.ts > AddressStepV8.tsx > ui/index.ts
7) menu/index.ts > FeaturedCarousel > CardImage.tsx
8) menu/index.ts > FeaturedCarousel > UnifiedMenuItemCard.tsx
9) ui/index.ts > navigation/index.ts > AppShell.tsx > MobileMenu.tsx
```

### Files Over 400 Lines (Top 10)

| File                    | Lines | Notes                    |
| ----------------------- | ----- | ------------------------ |
| FormValidation.tsx      | 1031  | Highest - split priority |
| OrderDetailExpanded.tsx | 984   | Admin order details      |
| HowItWorksSection.tsx   | 876   | Homepage section         |
| AddressesTab.tsx        | 802   | Account addresses        |
| Modal.tsx               | 725   | Core UI component        |
| BrandMascot.tsx         | 635   | Complex animation        |
| DriverDetailClient.tsx  | 597   | Admin driver details     |
| DriverDashboard.tsx     | 585   | Driver interface         |
| OrdersTab.tsx           | 568   | Account orders           |
| RouteDetailClient.tsx   | 565   | Admin route details      |

### Files to Delete (REFACTOR-01, 03)

**Storybook files (7 found):**

- Badge.stories.tsx
- Button.stories.tsx
- Input.stories.tsx
- Modal.stories.tsx
- Container.stories.tsx
- Grid.stories.tsx
- Stack.stories.tsx

**Auth components (4 files):**

- AuthModal.tsx (465 lines)
- MagicLinkSent.tsx
- OnboardingTour.tsx (461 lines)
- WelcomeAnimation.tsx (449 lines)

### Barrel Export to Update (REFACTOR-04)

`src/components/ui/auth/index.ts` exports to remove:

- AuthModal, AuthModalV7, AuthModalProps, AuthModalV7Props
- MagicLinkSent, MagicLinkSentProps
- WelcomeAnimation, WelcomeAnimationProps
- OnboardingTour, OnboardingTourV7, OnboardingTourProps, OnboardingTourV7Props, OnboardingStep

## Sources

### Primary (HIGH confidence)

- `/webpro-nl/knip` Context7 - knip configuration, entry patterns
- `/un-ts/eslint-plugin-import-x` Context7 - no-cycle rule, no-restricted-paths
- Current project's `eslint.config.mjs` - existing patterns
- Current project's `knip.json` - existing configuration
- `.claude/LEARNINGS.md` - deletion checklist pattern

### Secondary (MEDIUM confidence)

- [ESLint max-lines rule](https://eslint.org/docs/latest/rules/max-lines) - configuration options
- [Madge npm](https://www.npmjs.com/package/madge) - circular dependency detection

### Tertiary (LOW confidence)

- WebSearch: Madge TypeScript configuration - community patterns

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - tools already installed and configured
- Architecture: HIGH - patterns from existing LEARNINGS.md and eslint.config.mjs
- Pitfalls: HIGH - derived from codebase analysis and official docs

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (30 days - stable maintenance tooling)
