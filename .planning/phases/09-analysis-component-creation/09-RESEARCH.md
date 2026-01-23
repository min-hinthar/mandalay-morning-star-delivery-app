# Phase 9: Analysis & Component Creation - Research

**Researched:** 2026-01-23
**Domain:** Dead code analysis, V8 component patterns, visual regression testing
**Confidence:** HIGH

## Summary

Phase 9 establishes the foundation for the v1.1 tech debt cleanup by:
1. Running dead code analysis across all 865 exports to identify unused code
2. Creating TimeStepV8 component to replace the legacy V6 TimeStep in checkout
3. Generating visual regression baseline snapshots for 11 pending pages

The codebase uses a well-established V8 component pattern with Framer Motion, centralized motion tokens, and animation preference hooks. Visual regression testing uses Playwright's built-in screenshot comparison. Dead code analysis requires external tooling (knip or ts-prune).

**Primary recommendation:** Use `knip` for dead code analysis (comprehensive, actively maintained), follow existing AddressStepV8/PaymentStepV8 patterns for TimeStepV8, and run `playwright test --update-snapshots` for baseline generation.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| knip | latest | Dead code analysis | Comprehensive TS/React support, detects unused exports/dependencies |
| Playwright | 1.57.0 | Visual regression | Already in project, built-in screenshot comparison |
| Framer Motion | 12.26.1 | Animation library | V8 components all use this |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ts-prune | latest | Alternative dead code tool | Lighter weight, export-focused only |
| Chromatic | N/A | Visual regression CI | Already configured, cloud-based baselines |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| knip | ts-prune | ts-prune is simpler but less comprehensive |
| knip | eslint-plugin-unused-imports | Only catches imports, not exports |
| Playwright snapshots | Chromatic | Chromatic is cloud-based, costs money |

**Installation:**
```bash
# For dead code analysis
pnpm add -D knip

# Playwright already installed
```

## Architecture Patterns

### V8 Component Structure
```
src/components/checkout/
├── TimeStepV8.tsx          # New V8 component
├── TimeStep.tsx            # Legacy V6 (will be deprecated)
├── TimeSlotPicker.tsx      # Enhanced time slot picker
├── TimeSlotPickerLegacy.tsx # Simple legacy picker
├── TimeSlotDisplay.tsx     # Display-only component
└── index.ts                # Barrel exports
```

### Pattern 1: V8 Step Component
**What:** Checkout step with animation preference support and motion tokens
**When to use:** All checkout step components
**Example:**
```typescript
// Source: src/components/checkout/PaymentStepV8.tsx (existing pattern)
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring, variants, staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCheckoutStore } from "@/lib/stores/checkout-store";
import { Button } from "@/components/ui/button";

export interface TimeStepV8Props {
  className?: string;
}

export function TimeStepV8({ className }: TimeStepV8Props) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const { nextStep, prevStep, canProceed, setDelivery } = useCheckoutStore();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with icon */}
      <motion.div
        variants={shouldAnimate ? variants.slideUp : undefined}
        initial={shouldAnimate ? "initial" : undefined}
        animate={shouldAnimate ? "animate" : undefined}
      >
        <div className="flex items-center gap-2 mb-1">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold text-foreground">
            Delivery Time
          </h2>
        </div>
        <p className="font-body text-sm text-muted-foreground">
          Choose your preferred delivery window
        </p>
      </motion.div>

      {/* Content with stagger animation */}
      <motion.div
        variants={shouldAnimate ? staggerContainer(0.08) : undefined}
        initial={shouldAnimate ? "hidden" : undefined}
        animate={shouldAnimate ? "visible" : undefined}
        className="space-y-3"
      >
        {/* Time slot cards */}
      </motion.div>

      {/* Navigation */}
      <motion.div
        variants={shouldAnimate ? variants.slideUp : undefined}
        initial={shouldAnimate ? "initial" : undefined}
        animate={shouldAnimate ? "animate" : undefined}
        className="flex justify-between pt-4 border-t border-border"
      >
        <Button variant="ghost" onClick={prevStep}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={nextStep} disabled={!canProceed()} size="lg">
          Continue to Payment
        </Button>
      </motion.div>
    </div>
  );
}
```

### Pattern 2: Motion Token Usage
**What:** Centralized animation configuration
**When to use:** All animated components
**Example:**
```typescript
// Source: src/lib/motion-tokens.ts
import { spring, variants, staggerContainer, staggerItem } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

function Component() {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  return (
    <motion.div
      variants={shouldAnimate ? variants.slideUp : undefined}
      initial={shouldAnimate ? "initial" : undefined}
      animate={shouldAnimate ? "animate" : undefined}
      transition={getSpring(spring.default)}
    />
  );
}
```

### Pattern 3: Visual Regression Test Structure
**What:** Playwright screenshot tests
**When to use:** Page and component visual regression
**Example:**
```typescript
// Source: e2e/visual-regression.spec.ts
test("page visual - desktop", async ({ page }) => {
  await page.goto("/route");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500); // Wait for animations

  await expect(page).toHaveScreenshot("page-name-desktop.png", {
    fullPage: true,
    maxDiffPixels: 100,
  });
});

test("page visual - mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/route");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  await expect(page).toHaveScreenshot("page-name-mobile.png", {
    fullPage: true,
    maxDiffPixels: 100,
  });
});
```

### Anti-Patterns to Avoid
- **Hardcoded animation values:** Use motion-tokens, not inline durations/springs
- **Missing shouldAnimate check:** Always wrap animations in `shouldAnimate ? ... : undefined`
- **V6 color classes:** Use `text-foreground`, `text-muted-foreground`, not `text-text-primary`
- **Missing type exports:** Always export Props interface from component file

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dead code detection | Grep for unused | knip | Handles re-exports, type-only exports, dynamic imports |
| Export reference counting | Manual grep | knip's JSON output | Accurate AST-based analysis |
| Animation timing | Custom durations | motion-tokens | Consistent feel, reduced motion support |
| Screenshot diff | Manual comparison | Playwright toHaveScreenshot | Handles anti-aliasing, threshold config |
| Stagger animations | Manual delays | staggerContainer/staggerItem | Consistent timing, exit animations |

**Key insight:** Dead code analysis is not simply "grep for unused" - barrel re-exports, type exports, and dynamic imports make this complex. Use proper AST-based tooling.

## Common Pitfalls

### Pitfall 1: False Positives in Dead Code Analysis
**What goes wrong:** Tool reports exports as unused when they're used through re-exports
**Why it happens:** Barrel files (index.ts) re-export components, tool may not trace full chain
**How to avoid:** Use knip which handles re-exports properly; verify before deleting
**Warning signs:** High unused count in index.ts files

### Pitfall 2: Animation Preference Not Respected
**What goes wrong:** Animations play even when user prefers reduced motion
**Why it happens:** Forgetting to wrap variants in shouldAnimate conditional
**How to avoid:** Always use pattern: `variants={shouldAnimate ? variants.X : undefined}`
**Warning signs:** No useAnimationPreference import in component

### Pitfall 3: Visual Regression Flakiness
**What goes wrong:** Tests fail intermittently due to animation timing
**Why it happens:** Screenshots taken before animations complete
**How to avoid:** Add `waitForTimeout(500)` after page load; increase maxDiffPixels
**Warning signs:** Same test passes/fails randomly

### Pitfall 4: Legacy TimeSlotPicker Confusion
**What goes wrong:** Using TimeSlotPickerLegacy instead of TimeSlotPicker
**Why it happens:** Two components with similar names exist
**How to avoid:** TimeStepV8 should use TimeSlotPicker (enhanced), not TimeSlotPickerLegacy
**Warning signs:** Import from TimeSlotPickerLegacy.tsx

### Pitfall 5: Missing Barrel Export
**What goes wrong:** Component created but not exported from index.ts
**Why it happens:** Forgetting to update barrel file after creating component
**How to avoid:** Always update checkout/index.ts with new V8 component exports
**Warning signs:** Import path uses direct file path instead of @/components/checkout

## Code Examples

Verified patterns from existing V8 components:

### Step Component Header
```typescript
// Source: src/components/checkout/AddressStepV8.tsx
<div>
  <div className="flex items-center gap-2 mb-1">
    <MapPin className="h-5 w-5 text-primary" />
    <h2 className="font-display text-lg font-semibold text-foreground">
      Delivery Address
    </h2>
  </div>
  <p className="font-body text-sm text-muted-foreground">
    Select or add a delivery address
  </p>
</div>
```

### Staggered Card Animation
```typescript
// Source: src/components/checkout/AddressStepV8.tsx
<motion.div
  variants={shouldAnimate ? staggerContainer(0.08) : undefined}
  initial={shouldAnimate ? "hidden" : undefined}
  animate={shouldAnimate ? "visible" : undefined}
  className="space-y-3"
>
  {items.map((item) => (
    <motion.div
      key={item.id}
      variants={shouldAnimate ? staggerItem : undefined}
    >
      <ItemCard item={item} />
    </motion.div>
  ))}
</motion.div>
```

### Navigation Footer
```typescript
// Source: src/components/checkout/PaymentStepV8.tsx
<motion.div
  variants={shouldAnimate ? variants.slideUp : undefined}
  initial={shouldAnimate ? "initial" : undefined}
  animate={shouldAnimate ? "animate" : undefined}
  className="flex justify-between pt-4 border-t border-border"
>
  <Button variant="ghost" onClick={prevStep}>
    <ArrowLeft className="mr-2 h-4 w-4" />
    Back
  </Button>
  <Button onClick={nextStep} disabled={!canProceed()} size="lg">
    Continue to Payment
  </Button>
</motion.div>
```

### Time Slot Selection Pattern
```typescript
// Source: src/components/checkout/TimeSlotPicker.tsx (enhanced version)
// Uses TimeWindow type with date + time selection
// Shows date pills with horizontal scroll
// Shows time slots with icons (Sunrise, Sun, Moon)
// Handles cutoff times
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| V6 color classes (text-text-primary) | V8 classes (text-foreground) | v1.0 | Consistent with shadcn/ui |
| Manual animation durations | motion-tokens system | v1.0 | Centralized, reduced motion support |
| Direct component imports | Barrel imports (@/components/checkout) | v1.0 | Cleaner imports, tree-shaking |
| TimeSlotPickerLegacy (2-hour windows) | TimeSlotPicker (1-hour windows) | v1.0 | Better UX, date selection |

**Deprecated/outdated:**
- TimeSlotPickerLegacy: Use TimeSlotPicker instead
- TimeStep (V6): Will be replaced by TimeStepV8
- text-text-primary/text-text-secondary: Use text-foreground/text-muted-foreground

## Analysis Details

### 865 Exports Investigation
Based on barrel file analysis, exports are distributed across:

| File Category | Estimated Exports |
|---------------|-------------------|
| components/ui/index.ts | ~130 exports |
| components/checkout/index.ts | ~40 exports |
| components/ui-v8/index.ts | ~52 exports |
| components/menu/index.ts | ~25 exports |
| components/admin/index.ts | ~30 exports |
| Other barrels | ~87 exports |
| **Subtotal (barrels)** | **~364 exports** |
| Individual files | ~500+ exports |
| **Total** | **~865 exports** |

The 865 number likely includes all exports (not just barrels) across the entire src directory.

### 11 Pending Visual Regression Pages
Based on visual-regression.spec.ts and app structure, pending pages:

| Page | Route | Notes |
|------|-------|-------|
| 1. Admin Dashboard | /admin | Requires auth mock |
| 2. Admin Analytics | /admin/analytics | Charts, may need data mock |
| 3. Admin Orders | /admin/orders | Table component |
| 4. Driver Dashboard | /driver | Requires auth mock |
| 5. Driver Route | /driver/route | Map component |
| 6. Order Tracking | /orders/[id]/tracking | Real-time updates |
| 7. Order History | /orders | List view |
| 8. Order Confirmation | /orders/[id]/confirmation | Post-payment |
| 9. Checkout Steps | /checkout | Multi-step form |
| 10. Forgot Password | /forgot-password | Form state |
| 11. Cart Page | /cart | Can use empty state |

**Note:** Current visual-regression.spec.ts exists but has no baseline snapshots generated yet.

## Open Questions

Things that couldn't be fully resolved:

1. **Exact 865 export count methodology**
   - What we know: Number comes from phase requirements
   - What's unclear: Whether it includes type-only exports, re-exports
   - Recommendation: Run knip to get accurate count with categorization

2. **Authentication mocking for admin/driver pages**
   - What we know: These pages require auth
   - What's unclear: Best approach for visual regression (mock user or skip auth check)
   - Recommendation: Use Playwright's storage state or mock the auth context

3. **Chromatic vs Playwright for baselines**
   - What we know: Both are available (Chromatic configured, Playwright built-in)
   - What's unclear: Which should be authoritative baseline
   - Recommendation: Use Playwright for local development, Chromatic for CI

## Sources

### Primary (HIGH confidence)
- `src/components/checkout/PaymentStepV8.tsx` - V8 pattern reference
- `src/components/checkout/AddressStepV8.tsx` - V8 pattern reference
- `src/lib/motion-tokens.ts` - Animation token system
- `src/components/checkout/TimeSlotPicker.tsx` - Enhanced time slot picker
- `e2e/visual-regression.spec.ts` - Visual regression test patterns
- `playwright.config.ts` - Snapshot configuration
- `.planning/REQUIREMENTS.md` - Phase requirements

### Secondary (MEDIUM confidence)
- `src/components/checkout/index.ts` - Barrel export patterns
- `src/components/ui-v8/index.ts` - V8 component exports

### Tertiary (LOW confidence)
- 865 export count - stated in requirements, not independently verified

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - tools are well-known, project already uses Playwright
- Architecture patterns: HIGH - extracted from existing codebase
- Pitfalls: HIGH - common issues with these specific tools
- Dead code tooling: MEDIUM - knip is standard but not yet installed

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stable domain)
