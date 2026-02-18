# Phase 46: Large File Refactoring - Research

**Researched:** 2026-02-06
**Domain:** File splitting, module decomposition, ESLint enforcement
**Confidence:** HIGH

## Summary

Scanned the entire `src/` tree and found **47 files** exceeding 400 lines (excluding types/ and test files). This is up from the 35 mentioned in CONTEXT.md. The files break into four categories: 29 UI components, 7 admin pages, 4 API routes, and 7 lib/utility files.

The highest-risk file is `motion-tokens.ts` (937 lines, 88 importers across the codebase). Any split must preserve barrel re-exports. The existing `UnifiedMenuItemCard/` subfolder pattern in the codebase serves as the reference implementation for the decided splitting convention. ESLint `max-lines` is already configured but only covers `src/components/**/*.tsx` -- it must be expanded to all source files with appropriate exemptions.

**Primary recommendation:** Split files in dependency-safe waves. Start with leaf components (zero or low importers), then tackle shared utilities with barrel re-exports, then admin pages/API routes last.

## Complete File Inventory

### UI Components (29 files)

| #   | File                                                  | Lines | Exports | Components | Hooks | Importers | Commits (6mo) | Notes                                             |
| --- | ----------------------------------------------------- | ----- | ------- | ---------- | ----- | --------- | ------------- | ------------------------------------------------- |
| 1   | `ui/FormValidation.tsx`                               | 1031  | 20      | 6          | 3     | 1         | 2             | Types + hooks + components mixed                  |
| 2   | `ui/admin/orders/OrderDetailExpanded.tsx`             | 984   | 1       | 1          | 0     | 1         | 2             | Monolith with config maps                         |
| 3   | `ui/homepage/HowItWorksSection.tsx`                   | 876   | 3       | 6          | 0     | 2         | 2             | 5 internal sub-components                         |
| 4   | `ui/account/AddressesTab.tsx`                         | 802   | 1       | 2          | 0     | 1         | 2             | Form + card skeleton                              |
| 5   | `ui/Modal.tsx`                                        | 746   | 10      | 5          | 2     | 4         | 3             | Modal + ConfirmModal + useModal                   |
| 6   | `ui/brand/BrandMascot.tsx`                            | 635   | 5       | 4          | 0     | 1         | 2             | Eyes, Mouth, Accessories sub-components           |
| 7   | `ui/admin/drivers/DriverDetailClient.tsx`             | 597   | 1       | 2          | 0     | 1         | 2             | Already imports sub-components                    |
| 8   | `ui/driver/DriverDashboard.tsx`                       | 585   | 3       | 5          | 0     | 2         | 2             | StatCard, StreakDisplay, RouteCard, BadgesDisplay |
| 9   | `ui/admin/routes/RouteDetailClient.tsx`               | 576   | 1       | 1          | 0     | 2         | 3             | Single large component                            |
| 10  | `ui/account/OrdersTab.tsx`                            | 568   | 1       | 2          | 0     | 4         | 2             |                                                   |
| 11  | `ui/coverage/CoverageRouteMap.tsx`                    | 550   | 1       | 2          | 0     | 3         | 2             |                                                   |
| 12  | `ui/checkout/AddressInput.tsx`                        | 546   | 6       | 4          | 0     | 2         | 2             | Multiple exported sub-components                  |
| 13  | `ui/admin/AdminDashboard.tsx`                         | 541   | 4       | 5          | 0     | 2         | 2             | Multiple card sub-components                      |
| 14  | `ui/menu/UnifiedMenuItemCard/UnifiedMenuItemCard.tsx` | 540   | 4       | 1          | 0     | 0         | 4             | ALREADY in subfolder pattern                      |
| 15  | `ui/admin/ExpandableTableRow.tsx`                     | 533   | 5       | 4          | 1     | 2         | 2             | Hook + sub-components                             |
| 16  | `ui/admin/drivers/PendingInvitesTab.tsx`              | 524   | 2       | 1          | 0     | 1         | 4             |                                                   |
| 17  | `ui/admin/drivers/DriverListTable.tsx`                | 523   | 2       | 2          | 0     | 2         | 2             |                                                   |
| 18  | `ui/homepage/Hero.tsx`                                | 518   | 3       | 5          | 0     | 7         | 3             | COUPLING RISK - prior phases kept as-is           |
| 19  | `ui/checkout/PaymentSuccess.tsx`                      | 511   | 3       | 4          | 0     | 1         | 2             |                                                   |
| 20  | `ui/admin/routes/RouteListTable.tsx`                  | 501   | 2       | 1          | 0     | 2         | 2             |                                                   |
| 21  | `ui/admin/routes/CreateRouteModal.tsx`                | 486   | 2       | 1          | 0     | 2         | 3             |                                                   |
| 22  | `ui/orders/tracking/DeliveryMap.tsx`                  | 476   | 2       | 3          | 0     | 5         | 2             |                                                   |
| 23  | `ui/admin/settings/SettingsClient.tsx`                | 476   | 2       | 2          | 0     | 2         | 3             |                                                   |
| 24  | `ui/checkout/TimeSlotPicker.tsx`                      | 472   | 3       | 3          | 0     | 2         | 2             |                                                   |
| 25  | `ui/skeleton.tsx`                                     | 468   | 11      | 8          | 0     | 8         | 2             | 8 independent skeleton variants                   |
| 26  | `ui/account/ProfileTab.tsx`                           | 431   | 1       | 1          | 0     | 1         | 2             |                                                   |
| 27  | `ui/MorphingMenu.tsx`                                 | 425   | 7       | 1          | 0     | 1         | 2             |                                                   |
| 28  | `ui/orders/tracking/StatusTimeline.tsx`               | 407   | 3       | 3          | 0     | 3         | 2             |                                                   |
| 29  | `ui/cart/CartItem.tsx`                                | 401   | 3       | 2          | 0     | 0         | 3             | Barely over threshold                             |

### Admin Pages (7 files)

| #   | File                        | Lines | Internal Funcs | Notes                              |
| --- | --------------------------- | ----- | -------------- | ---------------------------------- |
| 30  | `admin/menu/[id]/page.tsx`  | 646   | 0              | 'use client' monolith, edit form   |
| 31  | `admin/sections/page.tsx`   | 588   | 0              | 'use client', reorderable sections |
| 32  | `admin/categories/page.tsx` | 577   | 0              | 'use client', CRUD                 |
| 33  | `admin/menu/page.tsx`       | 527   | 0              | 'use client', list + filters       |
| 34  | `admin/photos/page.tsx`     | 482   | 0              | 'use client', upload/gallery       |
| 35  | `admin/routes/page.tsx`     | 448   | 0              | 'use client', route management     |
| 36  | `admin/drivers/page.tsx`    | 417   | 0              | 'use client', driver list          |

### API Routes (4 files)

| #   | File                                   | Lines | HTTP Methods             | Helper Funcs | Interfaces | Notes                  |
| --- | -------------------------------------- | ----- | ------------------------ | ------------ | ---------- | ---------------------- |
| 37  | `api/admin/sections/[id]/route.ts`     | 484   | GET, PATCH, DELETE, POST | 0            | 7          | Schemas + types inline |
| 38  | `api/admin/routes/[id]/stops/route.ts` | 444   | POST, PATCH, DELETE      | 0            | 0          |                        |
| 39  | `api/admin/routes/[id]/route.ts`       | 426   | GET, PATCH, DELETE       | 0            | 0          |                        |
| 40  | `api/tracking/[orderId]/route.ts`      | 418   | GET                      | 0            | 10         | Many inline interfaces |

### Lib/Utility Files (7 files)

| #   | File                                 | Lines | Exports | Importers | Sections | Notes                             |
| --- | ------------------------------------ | ----- | ------- | --------- | -------- | --------------------------------- |
| 41  | `lib/motion-tokens.ts`               | 937   | 33      | 88        | 21       | HIGHEST RISK - most imported file |
| 42  | `lib/swipe-gestures.ts`              | 687   | 21      | 4         | 6        | 3 hooks + utility functions       |
| 43  | `lib/utils/analytics-helpers.ts`     | 506   | 19      | 3         | 7        | Clear domain sections             |
| 44  | `lib/micro-interactions.ts`          | 462   | 32      | 1         | 12+      | Framer Motion interaction tokens  |
| 45  | `lib/services/offline-store.ts`      | 405   | 6       | 1         | 4        | Cache stores + sync               |
| 46  | `lib/services/route-optimization.ts` | 401   | 6       | 1         | 2        | Validation + optimization         |
| 47  | `lib/hooks/useSafeEffects.ts`        | 401   | 7       | 0         | 4        | 4 independent hooks               |

## Architecture Patterns

### Decided Subfolder Pattern (from CONTEXT.md)

All splits use subfolders with barrel `index` files:

```
# Component split
ComponentName/
  index.tsx          # Thin orchestrator, re-exports
  SubComponent.tsx   # PascalCase
  useHook.ts         # camelCase
  helpers.ts         # camelCase

# Lib file split
lib-file/
  index.ts           # Barrel re-exports everything
  concern-a.ts       # camelCase
  concern-b.ts       # camelCase
```

### Existing Reference Implementation

`src/components/ui/menu/UnifiedMenuItemCard/` already uses this pattern:

```
UnifiedMenuItemCard/
  index.ts              # Barrel re-exports
  UnifiedMenuItemCard.tsx  # Main component (540 lines - still needs further splitting)
  AddButton.tsx
  CardContent.tsx
  CardImage.tsx
  DietaryBadges.tsx
  GlassOverlay.tsx
  use-card-sound.ts
```

### Admin Page Splitting Strategy

Next.js requires `page.tsx` with a default export. Strategy:

- Extract sub-components to sibling files in same directory
- `page.tsx` becomes thin orchestrator importing from siblings
- Co-located components are private to the route (not imported elsewhere)

```
admin/sections/
  page.tsx              # Thin orchestrator (keeps 'use client' + default export)
  SectionList.tsx       # Extracted sub-component
  SectionEditorPanel.tsx
```

### API Route Splitting Strategy

Next.js requires HTTP methods exported from `route.ts`. Strategy:

- Keep `route.ts` with exported HTTP handlers
- Extract types/interfaces to `types.ts` in same directory
- Extract validation schemas to `schemas.ts`
- Extract shared helper functions to `helpers.ts`
- Handler bodies remain in `route.ts` but are slimmer

```
api/admin/sections/[id]/
  route.ts         # HTTP handlers (GET, PATCH, DELETE, POST)
  types.ts         # Interfaces
  schemas.ts       # Zod schemas
```

### motion-tokens.ts Splitting Strategy (HIGHEST RISK)

88 files import from `@/lib/motion-tokens`. Import analysis reveals:

| Token                | Usage Count | Category    |
| -------------------- | ----------- | ----------- |
| `spring`             | ~70+ files  | Core        |
| `staggerContainer`   | ~15 files   | Stagger     |
| `staggerItem`        | ~12 files   | Stagger     |
| `staggerDelay`       | ~3 files    | Stagger     |
| `staggerContainer80` | 1 file      | Stagger     |
| `variants`           | ~3 files    | Variants    |
| `hover`              | ~2 files    | Interaction |
| `inputFocus`         | 1 file      | Interaction |
| `badgeVariants`      | 1 file      | Variants    |
| `transition`         | ~2 files    | Core        |
| `duration`           | ~3 files    | Core        |
| `easing`             | ~3 files    | Core        |
| `triggerHaptic`      | ~3 files    | Utilities   |
| `parallaxPresets`    | 1 file      | Scroll      |
| `VIEWPORT_AMOUNT`    | 1 file      | Scroll      |

Recommended split into `motion-tokens/`:

```
motion-tokens/
  index.ts           # Barrel re-exports EVERYTHING (zero import breakage)
  core.ts            # duration, easing, spring, transition (~180 lines)
  variants.ts        # variants, hover, inputFocus, tap, overlay, badgeVariants (~200 lines)
  stagger.ts         # staggerContainer, staggerItem, staggerDelay, etc. (~120 lines)
  effects.ts         # celebration, floating, morphing, priceTicker, routeDrawing (~180 lines)
  scroll.ts          # parallax, scrollReveal, VIEWPORT_AMOUNT (~80 lines)
  cards.ts           # flipCard, expandingCard variants (~60 lines)
  utilities.ts       # triggerHaptic + any utility functions (~20 lines)
```

The barrel `index.ts` ensures ALL 88 existing imports work unchanged. Future imports can go direct for tree-shaking.

## Recommended Wave Grouping

### Wave 1: Leaf Components (zero/1 importers, no shared exports)

Low risk, independent. Can be done in parallel.

| File                      | Lines | Reason                                                  |
| ------------------------- | ----- | ------------------------------------------------------- |
| `OrderDetailExpanded.tsx` | 984   | 1 importer, config maps extractable                     |
| `HowItWorksSection.tsx`   | 876   | 5 internal sub-components, 2 importers                  |
| `AddressesTab.tsx`        | 802   | 1 importer, form + skeleton extractable                 |
| `BrandMascot.tsx`         | 635   | 1 importer, 3 sub-components (Eyes, Mouth, Accessories) |
| `DriverDashboard.tsx`     | 585   | 4 internal sub-components                               |
| `PendingInvitesTab.tsx`   | 524   | 1 importer                                              |
| `PaymentSuccess.tsx`      | 511   | 1 importer, 4 sub-components                            |
| `ProfileTab.tsx`          | 431   | 1 importer                                              |
| `MorphingMenu.tsx`        | 425   | 1 importer                                              |
| `CartItem.tsx`            | 401   | 0 importers                                             |

**10 files, ~6,164 lines**

### Wave 2: Admin Components with Moderate Coupling

| File                     | Lines | Reason                                       |
| ------------------------ | ----- | -------------------------------------------- |
| `DriverDetailClient.tsx` | 597   | Already imports sub-components, extract more |
| `RouteDetailClient.tsx`  | 576   | Single monolith, extract sections            |
| `AdminDashboard.tsx`     | 541   | 5 card sub-components                        |
| `DriverListTable.tsx`    | 523   | 2 importers                                  |
| `RouteListTable.tsx`     | 501   | 2 importers                                  |
| `CreateRouteModal.tsx`   | 486   | 2 importers                                  |
| `SettingsClient.tsx`     | 476   | 2 importers                                  |
| `CoverageRouteMap.tsx`   | 550   | 3 importers                                  |
| `OrdersTab.tsx`          | 568   | 4 importers                                  |

**9 files, ~4,818 lines**

### Wave 3: Shared UI Components (higher import counts)

Require more careful import updates.

| File                         | Lines       | Importers     | Reason                                              |
| ---------------------------- | ----------- | ------------- | --------------------------------------------------- |
| `FormValidation.tsx`         | 1031        | 1             | 20 exports, types+hooks+components                  |
| `Modal.tsx`                  | 746         | 4             | Modal + ConfirmModal + useModal + sub-parts         |
| `skeleton.tsx`               | 468         | 8             | 8 independent skeleton variants                     |
| `ExpandableTableRow.tsx`     | 533         | 2             | Hook + 4 sub-components                             |
| `AddressInput.tsx`           | 546         | 2             | 6 exports, multiple sub-components                  |
| `TimeSlotPicker.tsx`         | 472         | 2             | 3 sub-components                                    |
| `DeliveryMap.tsx`            | 476         | 5             | Map + sub-components                                |
| `StatusTimeline.tsx`         | 407         | 3             | 3 components                                        |
| `CheckoutPaymentSuccess.tsx` | (in wave 1) |               |                                                     |
| `UnifiedMenuItemCard.tsx`    | 540         | 0 (via index) | Already in subfolder, main file needs further split |

**9 files, ~5,219 lines** (excluding PaymentSuccess, already in Wave 1)

### Wave 4: Admin Pages

Extract sub-components to co-located sibling files.

| File                        | Lines | Reason             |
| --------------------------- | ----- | ------------------ |
| `admin/menu/[id]/page.tsx`  | 646   | Largest admin page |
| `admin/sections/page.tsx`   | 588   | Reorder UI         |
| `admin/categories/page.tsx` | 577   | CRUD               |
| `admin/menu/page.tsx`       | 527   | List + filters     |
| `admin/photos/page.tsx`     | 482   | Upload/gallery     |
| `admin/routes/page.tsx`     | 448   | Route management   |
| `admin/drivers/page.tsx`    | 417   | Driver list        |

**7 files, ~3,685 lines**

### Wave 5: API Routes

Extract types, schemas, helpers to co-located files.

| File                                   | Lines | Reason                       |
| -------------------------------------- | ----- | ---------------------------- |
| `api/admin/sections/[id]/route.ts`     | 484   | 4 HTTP methods, 7 interfaces |
| `api/admin/routes/[id]/stops/route.ts` | 444   | 3 HTTP methods               |
| `api/admin/routes/[id]/route.ts`       | 426   | 3 HTTP methods               |
| `api/tracking/[orderId]/route.ts`      | 418   | 10 inline interfaces         |

**4 files, ~1,772 lines**

### Wave 6: Lib/Utility Files (highest risk last)

| File                    | Lines | Importers | Reason                                   |
| ----------------------- | ----- | --------- | ---------------------------------------- |
| `motion-tokens.ts`      | 937   | 88        | HIGHEST RISK - barrel re-export critical |
| `swipe-gestures.ts`     | 687   | 4         | 3 hooks + utilities                      |
| `analytics-helpers.ts`  | 506   | 3         | 7 clear domain sections                  |
| `micro-interactions.ts` | 462   | 1         | 32 exports, interaction tokens           |
| `offline-store.ts`      | 405   | 1         | Cache stores + sync                      |
| `route-optimization.ts` | 401   | 1         | Validation + optimization                |
| `useSafeEffects.ts`     | 401   | 0         | 4 independent hooks                      |

**7 files, ~3,799 lines**

### Wave 7: ESLint Configuration

After all splits complete.

## Files to Potentially Leave As-Is

| File                      | Lines | Reason                                                                                         | Recommendation                                                                                       |
| ------------------------- | ----- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `Hero.tsx`                | 518   | Prior phases explicitly kept it due to tight coupling; 7 importers                             | **Evaluate** - if 5 sub-components can cleanly extract, split; if animation coupling is tight, leave |
| `UnifiedMenuItemCard.tsx` | 540   | Already in subfolder with extracted sub-components; remaining 540 lines may be tightly coupled | **Evaluate** - check if further extraction is feasible without breaking component logic              |
| `RouteDetailClient.tsx`   | 576   | Single monolithic component with 1 export                                                      | **Evaluate** - if JSX sections are cleanly separable, split; otherwise leave                         |
| `route-optimization.ts`   | 401   | Barely over threshold, 2 main functions                                                        | **Consider leaving** - splitting 2 functions across files adds overhead                              |
| `useSafeEffects.ts`       | 401   | Barely over threshold, 4 independent hooks                                                     | **Split** - each hook is independent, clean split                                                    |

## Don't Hand-Roll

| Problem                       | Don't Build         | Use Instead                                | Why                           |
| ----------------------------- | ------------------- | ------------------------------------------ | ----------------------------- |
| Barrel re-exports             | Manual export lists | TypeScript `export * from`                 | Ensures all exports forwarded |
| Import path updates           | Manual find-replace | IDE refactoring or `sed` with verification | Catches all import sites      |
| File size checking            | Custom script       | ESLint `max-lines` (already built-in)      | Already configured in project |
| Circular dependency detection | Manual analysis     | `import-x/no-cycle` (already configured)   | Already in ESLint config      |

## Common Pitfalls

### Pitfall 1: Breaking Barrel Imports After Split

**What goes wrong:** Move `FormValidation.tsx` to `FormValidation/index.tsx` but forget that some files import it as `@/components/ui/FormValidation` (the `.tsx` extension is implicit).
**Why it happens:** TypeScript resolves `@/components/ui/FormValidation` to either `FormValidation.tsx` or `FormValidation/index.tsx`. When you move the file to a subfolder, the import path stays the same.
**How to avoid:** This actually works in our favor. `@/components/ui/FormValidation` resolves to `FormValidation/index.tsx` automatically. **No import changes needed for the subfolder pattern.**
**Warning signs:** TypeScript errors after moving files.

### Pitfall 2: motion-tokens Split Breaking 88 Files

**What goes wrong:** Split motion-tokens without proper barrel re-export, breaking 88 importers.
**Why it happens:** Missing exports in barrel file.
**How to avoid:** Create `motion-tokens/index.ts` with `export * from './core'`, `export * from './variants'`, etc. Run `pnpm typecheck` immediately after.
**Warning signs:** Any TypeScript error mentioning motion-tokens.

### Pitfall 3: 'use client' Boundary Loss

**What goes wrong:** Extract a sub-component to a separate file but forget `'use client'` directive. Next.js treats it as a Server Component.
**Why it happens:** The parent file had `'use client'` which covered all components defined in it.
**How to avoid:** Every extracted file that uses React hooks, event handlers, or browser APIs needs its own `'use client'` directive.
**Warning signs:** Runtime errors about hooks in Server Components.

### Pitfall 4: Admin Page Co-location Conflicts

**What goes wrong:** Extract components from `page.tsx` to sibling files in the app router directory. Next.js might treat them as route segments.
**Why it happens:** Next.js App Router has special file conventions (`page.tsx`, `layout.tsx`, `loading.tsx`, etc.).
**How to avoid:** Non-special filenames (like `SectionList.tsx`) are safely ignored by the App Router. Only `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `template.tsx`, `route.ts`, and `default.tsx` are special. Arbitrary `.tsx` files co-located in the route directory are fine.
**Warning signs:** None expected - this is safe.

### Pitfall 5: Circular Dependencies After Split

**What goes wrong:** Split a file and create circular imports between the new modules.
**Why it happens:** When a monolith has functions that reference each other, splitting them into separate files creates circular dependencies.
**How to avoid:** Group mutually-dependent code into the same sub-module. Run `pnpm lint` after each split to catch `import-x/no-cycle` errors.
**Warning signs:** ESLint `import-x/no-cycle` errors.

### Pitfall 6: API Route Splitting Breaking NextResponse

**What goes wrong:** Extract types/helpers from `route.ts` but the HTTP handler functions rely on closure-scoped variables.
**Why it happens:** API route handlers often define Zod schemas and type interfaces at module scope, then reference them in handlers.
**How to avoid:** Extract types and schemas as named exports from `types.ts`/`schemas.ts`, import them back into `route.ts`.
**Warning signs:** TypeScript errors about missing types.

## ESLint max-lines Configuration

### Current State

The project already has `max-lines` configured at line 142-155 of `eslint.config.mjs`:

```javascript
{
  // File size enforcement - REFACTOR-06 (warning only)
  files: ["src/components/**/*.tsx"],
  rules: {
    "max-lines": [
      "warn",
      {
        max: 400,
        skipBlankLines: true,
        skipComments: true,
      }
    ]
  }
},
```

### Required Changes

1. **Expand file scope** from `src/components/**/*.tsx` to all source files
2. **Add exemptions** for types/ and test files
3. **Keep as warning** (per CONTEXT.md decision)

Target configuration:

```javascript
{
  // File size enforcement - Phase 46 (warning only)
  files: [
    "src/**/*.ts",
    "src/**/*.tsx",
  ],
  ignores: [
    "src/types/**",          // Type definition files
    "src/**/*.test.ts",      // Test files
    "src/**/*.test.tsx",     // Test files
    "src/stories/**",        // Storybook stories
  ],
  rules: {
    "max-lines": [
      "warn",
      {
        max: 400,
        skipBlankLines: true,
        skipComments: true,
      }
    ]
  }
},
```

**Confidence:** HIGH - ESLint `max-lines` is a built-in rule. The flat config format used in this project supports `ignores` at the config object level.

Note: The flat config `ignores` inside a config object with `files` acts as a filter (removes those patterns from `files`). This is the correct approach per ESLint flat config docs.

## Code Examples

### Barrel Re-export Pattern (motion-tokens/index.ts)

```typescript
// motion-tokens/index.ts
// Barrel re-exports - all existing imports continue to work
export * from "./core";
export * from "./variants";
export * from "./stagger";
export * from "./effects";
export * from "./scroll";
export * from "./cards";
export * from "./utilities";
```

### Component Subfolder Pattern (FormValidation/)

```typescript
// FormValidation/index.tsx
export { ValidatedInput, ValidatedTextarea, ValidatedForm } from "./ValidatedInputs";
export { ValidationMessage, InlineError } from "./ValidationMessage";
export {
  FormValidationProvider,
  useFormValidation,
  useFormValidationOptional,
} from "./FormValidationProvider";
export { useFieldValidation } from "./useFieldValidation";
export { validationRules, combineRules } from "./validationRules";
export type { ValidationRule, ValidationState, FieldValidation } from "./types";
```

### Admin Page Extraction Pattern

```typescript
// admin/sections/page.tsx (after split)
'use client';

import { SectionList } from './SectionList';
import { SectionToolbar } from './SectionToolbar';

export default function SectionsPage() {
  // Thin orchestrator - state management + layout only
  const [sections, setSections] = useState([]);
  // ...
  return (
    <div>
      <SectionToolbar onAdd={handleAdd} />
      <SectionList sections={sections} onReorder={handleReorder} />
    </div>
  );
}
```

### API Route Extraction Pattern

```typescript
// api/admin/sections/[id]/types.ts
export interface SectionWithItems extends FeaturedSectionsRow {
  featured_section_items: {
    /* ... */
  }[];
}

// api/admin/sections/[id]/schemas.ts
import { z } from "zod";
export const updateSectionSchema = z.object({
  /* ... */
});
export const actionSchema = z.object({
  /* ... */
});

// api/admin/sections/[id]/route.ts (slimmer)
import type { SectionWithItems } from "./types";
import { updateSectionSchema, actionSchema } from "./schemas";
// ... handler functions using imported types/schemas
```

## State of the Art

| Old Approach              | Current Approach                         | When Changed | Impact                             |
| ------------------------- | ---------------------------------------- | ------------ | ---------------------------------- |
| ESLint `.eslintrc` config | ESLint flat config (`eslint.config.mjs`) | ESLint 9+    | Project already uses flat config   |
| `eslint-plugin-import`    | `eslint-plugin-import-x`                 | 2024         | Project already uses import-x      |
| Manual barrel files       | `export * from` re-exports               | Standard TS  | Automatically forwards all exports |

## Open Questions

1. **Hero.tsx (518 lines):** Prior phases explicitly kept it as-is due to coupling. The CONTEXT.md for Phase 46 says "All 35 files" but also "Leave as-is if splitting requires major restructuring." Need to evaluate during implementation whether Hero's 5 sub-components can cleanly separate or if animation coupling prevents it.

2. **UnifiedMenuItemCard.tsx (540 lines):** Already in a subfolder with 7 extracted sub-files, but the main file is still 540 lines. May need deeper extraction or may represent an irreducible complexity. Evaluate during implementation.

3. **Exact file count discrepancy:** CONTEXT.md says 35 files, scan found 47. The difference likely comes from files that grew after the initial count, or the original count excluded some categories. The plan should target all 47 files (minus any leave-as-is decisions).

4. **Admin page co-location pattern:** Next.js App Router supports co-located files, but the project currently keeps all extracted components in `src/components/ui/admin/`. Splitting admin pages by co-locating components in the route directory would be a pattern divergence. Alternative: extract to the existing `ui/admin/` component tree instead.

## Sources

### Primary (HIGH confidence)

- **Codebase scan:** Direct `wc -l` and `grep` analysis of all 47 files
- **ESLint config:** Read from `eslint.config.mjs` in project root
- **UnifiedMenuItemCard pattern:** Existing reference implementation in codebase
- **Import analysis:** `grep -rl` across entire `src/` tree

### Secondary (MEDIUM confidence)

- **Next.js App Router co-location:** Based on Next.js App Router documentation - non-special filenames in route directories are ignored by the router

### Tertiary (LOW confidence)

- **Wave grouping risk assessment:** Based on import count analysis as proxy for coupling; actual coupling may differ

## Metadata

**Confidence breakdown:**

- File inventory: HIGH - direct codebase scan
- Import analysis: HIGH - grep-based, verified for key files
- Splitting strategy: HIGH - follows decided CONTEXT.md conventions
- Wave grouping: MEDIUM - based on import counts, actual risk may vary
- ESLint configuration: HIGH - read existing config, built-in rule
- Leave-as-is candidates: MEDIUM - requires implementation-time evaluation

**Research date:** 2026-02-06
**Valid until:** 2026-03-06 (stable - file sizes change slowly)
