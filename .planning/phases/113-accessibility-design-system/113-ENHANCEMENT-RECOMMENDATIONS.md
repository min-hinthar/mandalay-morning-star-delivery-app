# Phase 113: Enhancement Recommendations

## Priority Matrix

| # | Enhancement | Priority | Effort | Impact |
|---|-------------|----------|--------|--------|
| 1 | Focus ring ESLint enforcement | MUST-HAVE | Low | High |
| 2 | `focus:` → `focus-visible:` migration | MUST-HAVE | Low | High |
| 3 | Input focus ring addition | MUST-HAVE | Medium | High |
| 4 | Button/Input xs variant introduction | MUST-HAVE | Medium | Medium |
| 5 | Card interactive shadow-focus migration | MUST-HAVE | Low | Medium |
| 6 | Checkbox ring downsize | MUST-HAVE | Low | Medium |
| 7 | Legacy ring-ring token migration | MUST-HAVE | Low | Medium |
| 8 | Hardcoded ring color cleanup | SHOULD-HAVE | Medium | Medium |
| 9 | Automated contrast audit test | SHOULD-HAVE | Medium | High |
| 10 | StatusStepper reduced-motion gate | SHOULD-HAVE | Low | Medium |
| 11 | TrackingPageClient file extraction | NICE-TO-HAVE | Medium | Low |
| 12 | Hardcoded Tailwind color audit (non-ring) | NICE-TO-HAVE | High | Medium |

---

## Detailed Recommendations

### 1. Focus Ring ESLint Enforcement
**Priority:** MUST-HAVE
**What:** Add two `no-restricted-syntax` rules to `eslint.config.mjs`:
- Block `ring-(red|zinc|blue|green|gray)` — force semantic tokens
- Block `focus:ring` without `visible` — force `focus-visible:ring`

**Why:** Currently 6 files use hardcoded ring colors (`ring-red-500`, `ring-zinc-400`) and 7+ use `focus:` instead of `focus-visible:`. Without enforcement, future phases will reintroduce these anti-patterns.

**Design compliance:** Enforces WCAG 2.4.7 (Focus Visible) and design system token-first architecture.

**Implementation hint:** Add alongside existing 25 `no-restricted-syntax` rules at `eslint.config.mjs:210+`. ERROR level, no exemptions.

---

### 2. `focus:` to `focus-visible:` Migration
**Priority:** MUST-HAVE
**What:** Replace all `focus:ring-*` and `focus:outline-*` with `focus-visible:ring-*` across:
- `MagicLinkForm.tsx` (focus:border, focus:ring, focus:shadow)
- `PreferencesSection.tsx` (focus:outline, focus:ring)
- `CustomAllergyInput.tsx` (focus:outline, focus:ring)
- `PhotoGrid.tsx` (focus:outline, focus:ring)
- `AddressFormDialog.tsx` (focus:ring-status-error)
- `ProfileTab.tsx` (focus:ring-status-error)

**Why:** `focus:` shows ring on mouse click (jarring for mouse users). `focus-visible:` only shows on keyboard navigation (WCAG 2.4.7).

**Design compliance:** WCAG 2.4.7 Focus Visible — focus indicator only when needed.

**Implementation hint:** Search-and-replace `focus:ring` → `focus-visible:ring`, `focus:outline` → `focus-visible:outline`, `focus:border` → `focus-visible:border`.

---

### 3. Input Focus Ring Addition
**Priority:** MUST-HAVE
**What:** Add `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` to Input CVA base classes. Keep existing Framer Motion glow animation as complementary visual feedback.

**Why:** Input is the only core interactive component without a CSS focus ring. It relies solely on border color change + animated boxShadow glow, which is insufficient for WCAG focus visibility. Layering ring + glow provides both accessibility and visual delight.

**Design compliance:** WCAG 2.4.7 — consistent with Button, Card, Checkbox, Select ring pattern.

**Implementation hint:** Add to `inputVariants` base array in `input.tsx:21-41`. The FM `animate={getGlowStyle()}` stays — boxShadow and ring use different CSS properties, no conflict.

---

### 4. Button/Input xs Variant Introduction
**Priority:** MUST-HAVE
**What:** Rename current `sm` behavior to `xs` (h-9, 36px) and make `sm` = h-11 (44px) on both Button and Input. Update icon-sm similarly.

**Why:** A11Y-01 requires 44px minimum. Current `sm` = 36px violates WCAG. The `xs` escape hatch preserves backwards compatibility for admin toolbars where 36px is intentional.

**Design compliance:** WCAG 2.5.5 Target Size (44px minimum).

**Implementation hint:**
```typescript
// button.tsx CVA sizes
xs: "h-9 px-3 py-2 text-sm ...",      // NEW: 36px for tight admin UI
sm: "h-11 px-4 py-2 text-sm ...",     // CHANGED: 44px (was h-9)
// icon variants
"icon-xs": "h-9 w-9 ...",             // NEW
"icon-sm": "h-11 w-11 ...",           // CHANGED (was h-9)
```
Then audit 68 Button `size="sm"` usages — most stay as `sm` (now 44px). Downgrade to `xs` only where intentionally compact.

---

### 5. Card Interactive Shadow-Focus Migration
**Priority:** MUST-HAVE
**What:** Replace Card interactive focus from `focus-visible:ring-2 ring-primary ring-offset-2` to `focus-visible:shadow-[var(--shadow-focus)]`.

**Why:** Card uses `hover:-translate-y-1` lift animation. CSS `ring-offset` stays in document flow and doesn't follow the translateY, causing visual disconnect between card and its focus indicator during hover. BoxShadow is part of the paint layer and moves with the element.

**Design compliance:** Maintains 3:1 focus indicator contrast per WCAG 2.4.11.

**Implementation hint:** In `card.tsx` interactive variant, replace ring classes with shadow class. The `--shadow-focus` token already exists in tokens.css (light: 3px primary rgba, dark: 3px bright red rgba).

---

### 6. Checkbox Ring Downsize
**Priority:** MUST-HAVE
**What:** Change Checkbox focus from `ring-2 ring-offset-2` (8px + 8px = 16px) to `ring-1 ring-offset-1` (4px + 4px = 8px).

**Why:** Checkbox is 20px (`h-5 w-5`). Standard ring-2 + offset-2 consumes 16px of visual space, overwhelming the 20px element and obscuring the checkmark content.

**Design compliance:** Still meets WCAG 2.4.7 — ring-1 (2px thickness) exceeds minimum 2px requirement.

**Implementation hint:** Single line change in `checkbox.tsx:38`.

---

### 7. Legacy ring-ring Token Migration
**Priority:** MUST-HAVE
**What:** Replace `ring-ring` with `ring-primary` in Textarea, RadioGroup, Dialog, AlertDialog.

**Why:** `ring-ring` is a shadcn/ui default token that maps to `--ring` CSS variable. The project uses `--color-primary` as the focus color (established in Button, Card, Checkbox). Having two different ring color tokens creates inconsistency.

**Design compliance:** A11Y-03 success criteria: "consistent ring+offset style across all interactive components."

**Implementation hint:** 4 files, 4 string replacements. Also add `ring-offset-2` where missing.

---

### 8. Hardcoded Ring Color Cleanup
**Priority:** SHOULD-HAVE
**What:** Replace all hardcoded Tailwind ring colors with semantic tokens:
- `ring-red-500` → `ring-status-error` (5 files)
- `ring-zinc-400` → `ring-primary` (1 file)
- `ring-primary/30` → `ring-primary` (3 files)
- `ring-amber-500` → already migrated

**Why:** Hardcoded colors bypass the design token system. They don't change in dark mode and create visual inconsistency. The ESLint rule (Enhancement #1) will prevent regression.

**Design compliance:** Token-first architecture. Dark mode parity.

**Implementation hint:** Grep `ring-(red|zinc|amber|blue|green)-` across `src/components/ui/`. 9 files total. For destructive actions, `ring-status-error` provides semantic meaning.

---

### 9. Automated Contrast Audit Test
**Priority:** SHOULD-HAVE
**What:** Create a Vitest unit test that validates all text×surface contrast ratios from tokens.css. Import token values, calculate WCAG ratios, assert ≥4.5:1 for normal text and ≥3:1 for large text.

**Why:** All 40 combinations currently pass (lowest 7.28:1), but future token changes could introduce failures. An automated test prevents regression without manual WCAG checking.

**Design compliance:** A11Y-02 success criteria: "4.5:1 contrast ratio on all surface colors in both themes."

**Implementation hint:** Parse CSS custom properties from tokens.css (regex or postcss). Build matrix of text-muted × all surfaces. Use WCAG relative luminance formula. Run in `pnpm test`.

---

### 10. StatusStepper Reduced-Motion Gate
**Priority:** SHOULD-HAVE
**What:** Wrap ungated `m.div` animations in `TrackingPageClient:227-330` with `useAnimationPreference().shouldAnimate` guard.

**Why:** Explicitly flagged in Phase 112-02 SUMMARY as "pre-existing issue, Phase 113 scope." These animations play even when user has reduced-motion preference.

**Design compliance:** WCAG 2.3.3 Animation from Interactions + project pattern (all motion through `getSpring()`).

**Implementation hint:** Import `useAnimationPreference`, wrap `initial`/`animate` in conditional. If `!shouldAnimate`, render without animation.

---

### 11. TrackingPageClient File Extraction
**Priority:** NICE-TO-HAVE
**What:** Extract `TrackingPageClient.tsx` (452 lines, over 400 limit) into subfolder with `InfoPane.tsx`, `MobileLayout.tsx`, `DesktopLayout.tsx`.

**Why:** Phase 112 explicitly flagged this for extraction. ESLint max-lines warning fires at 400.

**Design compliance:** Project file organization rules (CLAUDE.md).

**Implementation hint:** Only do this if Phase 113 already touches `TrackingPageClient.tsx` for other reasons (e.g., StatusStepper reduced-motion). Don't extract just for extraction's sake.

---

### 12. Hardcoded Tailwind Color Audit (Non-Ring)
**Priority:** NICE-TO-HAVE
**What:** Audit and migrate remaining hardcoded Tailwind colors (`bg-green-*`, `text-red-*`, `border-gray-*`) to semantic tokens.

**Why:** ~30 files have non-semantic Tailwind colors. These bypass dark mode token switching. Top offenders: FreeDeliveryProgress (12), StatusBadge (8), ProfileCompletenessCard (6).

**Design compliance:** Token-first architecture, dark mode parity.

**Implementation hint:** Large scope (30+ files). Defer bulk of this to Phase 116 (Polish) unless specific files are already being touched for other Phase 113 work.
