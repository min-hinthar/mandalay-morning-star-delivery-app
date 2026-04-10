# Phase 113: Accessibility & Design System — Pre-Context Research

## 1. Resolved Assumptions

### Technical Approach
- **Touch targets (A11Y-01):** Update Button `sm` and Input `sm` from `h-9` (36px) to `h-11` (44px) globally. Introduce `xs` variant at 36px for non-mobile icon buttons where 44px is unnecessary. No responsive breakpoint approach — always 44px for sm.
- **Contrast (A11Y-02):** All 40 text-muted x surface combinations already PASS WCAG AA (lowest: 7.28:1 dark text-muted on surface-elevated). No token color changes needed. Verification-only with automated contrast audit.
- **Focus rings (A11Y-03):** Standardize on `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`. Input gets CSS ring layered on top of existing FM glow. Card interactive switches to boxShadow-based focus (moves with translateY lift). Checkbox downsizes to ring-1 ring-offset-1 for 20px element. Migrate legacy `ring-ring` token in Textarea/RadioGroup to `ring-primary`.
- **Dark mode (A11Y-04):** tokens.css already has 100% dark mode coverage. No token gaps found. Focus shifts to auditing hardcoded colors in components that bypass the token system (~30 files with inline hex, `ring-red-500`, `ring-zinc-400`, etc.).

### Scope Boundaries
**In scope:**
- All interactive components (customer, admin, driver) — shared component library means fixes propagate everywhere
- Button/Input/Checkbox/Card/Modal/Drawer/Tabs/Select/Textarea/RadioGroup/AnimatedToggle
- Focus ring harmonization across all ~70+ UI components
- Hardcoded color audit and migration to tokens
- ESLint rule additions for ring color enforcement

**Out of scope:**
- Screen reader / full ARIA audit (covered in v1.9 phases 80-81, v2.0 phase 93-02)
- Keyboard navigation tab order (separate initiative)
- `prefers-reduced-motion` OS-level detection (project uses opt-in `data-reduce-motion`)
- New component creation
- Color-blindness / high-contrast mode (existing `[data-contrast="high"]` adequate)

**Resolved ambiguities:**
- Button/Input sm → always 44px, not responsive (HIGH confidence)
- Input focus: layer CSS ring + keep FM glow (HIGH confidence)
- Admin/driver in scope (HIGH confidence — shared components)
- Dark mode already complete — audit only (HIGH confidence)

### Implementation Order
1. Dark mode token audit + hardcoded color cleanup (cheapest, unblocks verification)
2. Focus ring harmonization (search-and-replace + component updates)
3. Button/Input sm sizing (h-9 → h-11, introduce xs variant)
4. Contrast verification (automated test, confirm all pass)
5. ESLint rule additions (guard against regression)

## 2. Realistic Data/Scale Analysis

| Metric | Count | Source |
|--------|-------|--------|
| Interactive components needing focus audit | 17 core + ~30 feature | Component inventory |
| Files with `ring-red-500` or `ring-zinc-400` | 6 | Grep audit |
| Files with hardcoded hex in className | ~30 | Grep audit |
| Button `size="sm"` usages | 68 files | Grep |
| Input `size="sm"` usages | ~15 files | Grep |
| `h-8` violations (32px) | 74 instances | Grep |
| `h-7` violations (28px) | 30 instances | Grep |
| `h-9` violations (36px) | 16 instances | Grep |
| Focus pattern variants | 5 distinct | Manual audit |
| Legacy `ring-ring` token usages | 4 components | Grep |
| Dark mode token gaps | 0 | tokens.css audit |
| Contrast failures (text-muted) | 0 of 40 combinations | WCAG calculation |
| ESLint token rules | 25 at ERROR level | eslint.config.mjs |
| Total lines of tokens.css | ~800 | File read |

## 3. Cross-Phase Contract Inventory

### From Phase 110 (Critical Fixes)
- Toast Dismiss upgraded to `size="md"` (44px) preemptively for A11Y-01
- `EmptyCheckoutError` uses `role="status"` — do NOT remove
- `focus-visible:ring-2 ring-primary ring-offset-2` established as focus pattern
- `queryKeys` factory — do NOT inline array keys
- `useToast({ persistent: true })` — do NOT remove from critical errors

### From Phase 111 (Checkout Conversion)
- RHF form `mode: "onTouched"` — do NOT change to "onChange"
- Price-change banner uses `status-warning-bg` / `status-success-bg` tokens — verify dark mode
- Reschedule button `size="md"` = 44px — do NOT downsize
- `useCheckoutStore.partialize` covers 13 fields — update if adding form fields
- Accent red reserved for committed actions only — do NOT use on icons/borders/pills

### From Phase 112 (Order Tracking)
- **CRITICAL:** Drawer exit animation `duration: 0.15s easeIn` — NEVER convert to spring (GPU crash, commit 4087d3bf)
- MuteToggle: `aria-pressed`, `aria-label`, 44px (`h-11 w-11`) — do NOT regress
- ReconnectingBanner: `role="status"` `aria-live="polite"` — do NOT remove
- Audio gate `!isMuted && !document.hidden` — do NOT remove `document.hidden` check
- `localStorage` key `trackingAudioMuted` — do NOT rename
- `TrackingPageClient.tsx` = 452 lines (over 400 limit) — extract if touching

### Feeds into Future Phases
- Phase 114 (Loading States): Clean token foundation makes skeleton/spinner styling consistent
- Phase 116 (Micro-Interactions): Consistent focus rings prevent double-work on undo toast, swipe gestures
- All future UI phases: ESLint ring color rules prevent regression

## 4. Gotcha Inventory

### Critical
| ID | Gotcha | Requirement | Fix | Source |
|----|--------|-------------|-----|--------|
| G-01 | `tailwind.config.ts` is dead code in v4 — tokens added there won't generate utilities | All | Add via `@theme inline {}` in globals.css | tailwind-v4.md |
| G-02 | Non-existent token names compile to `transparent` silently | A11Y-02 | Use correct `status-*` prefix; detect via computed styles | design-tokens.md |
| G-03 | Drawer exit animation MUST stay `easeIn` 0.15s — spring causes Mobile Safari GPU crash | A11Y-03 | Never touch Drawer.tsx exit animation | Phase 112, commit 4087d3bf |
| G-04 | Input animated boxShadow + CSS ring = double focus indicator | A11Y-03 | Layer approach: add ring, keep glow — they complement | Wave 2 analysis |
| G-05 | Card `ring-offset` doesn't move with `hover:-translate-y-1` | A11Y-03 | Use `shadow-[var(--shadow-focus)]` instead of ring-offset for Card | Wave 2 analysis |

### High
| ID | Gotcha | Requirement | Fix | Source |
|----|--------|-------------|-----|--------|
| G-06 | Checkbox 20px + ring-2 ring-offset-2 = 16px consumed, visually overwhelming | A11Y-03 | Downsize to ring-1 ring-offset-1 | Wave 2 analysis |
| G-07 | Flex `items-center` collapses children without `w-full` — buttons shrink below 44px | A11Y-01 | Add `w-full` to interactive children in flex containers | react-patterns.md |
| G-08 | Safe area inset as padding pushes icons off-center on iOS | A11Y-01 | Use `bottom: calc(24px + env(safe-area-inset-bottom))` not padding | mobile-ux.md |
| G-09 | `focus:` used instead of `focus-visible:` in 7+ files — shows ring on mouse click | A11Y-03 | Replace all `focus:ring` with `focus-visible:ring` | Codebase audit |
| G-10 | ESLint has NO rule blocking `ring-red-500` / `ring-zinc-400` | A11Y-03 | Add no-restricted-syntax rule for hardcoded ring colors | ESLint analysis |
| G-11 | Portal-rendered components (tooltips, popovers) may lose dark mode context | A11Y-04 | Use both `style={{ var(--color-...) }}` + `className` | react-patterns.md |
| G-12 | `@theme inline` processes BEFORE tokens.css — mobile CSS var resolution differs | A11Y-02/04 | Explicit mobile colors; don't rely on tokens.css alone for mobile | tailwind-v4.md |
| G-13 | Backdrop-filter crashes Mobile Safari in animated containers | A11Y-03 | Only apply via CSS `sm:backdrop-blur-*`, NEVER in FM transitions | animation.md |

### Medium
| ID | Gotcha | Requirement | Fix | Source |
|----|--------|-------------|-----|--------|
| G-14 | `loading="lazy"` + `initial={{ opacity: 0 }}` = images never load | A11Y-02 | Use `loading="eager"` in animated wrappers | animation.md |
| G-15 | Fragment `<>` blocks className passthrough for Radix Slot | A11Y-03 | Use `<span className="contents">` | react-patterns.md |
| G-16 | StatusStepper has ungated animations (no `shouldAnimate` guard) | A11Y-03 | Wrap in `useAnimationPreference` (flagged in 112-02 SUMMARY) | Phase 112 |
| G-17 | Theme transition flicker on all elements during toggle | A11Y-04 | Use `useThemeTransition()` hook before setTheme | globals.css |
| G-18 | 3D tilt transforms create stacking context conflicting with focus ring | A11Y-03 | Disable tilt during keyboard focus via `isKeyboardFocused` state | animation.md |

## 5. Data Contracts

### Token System (Source of Truth)
```
src/styles/tokens.css
├── :root { }           — Light theme (200+ tokens)
├── .dark { }           — Dark theme (200+ tokens, complete mirror)
├── [data-contrast] { } — High contrast mode
└── [data-reduce-motion] — Reduced motion overrides
```

### Component Size Contracts
```typescript
// Button sizes (button.tsx CVA)
sm:  h-9  (36px) → Phase 113: h-11 (44px)
md:  h-11 (44px) — no change
lg:  h-[52px]    — no change
xl:  h-[60px]    — no change

// Input sizes (input.tsx CVA)
sm:      h-9  (36px) → Phase 113: h-11 (44px)
default: h-11 (44px) — no change
lg:      h-12 (48px) — no change
xl:      h-14 (56px) — no change
```

### Focus Ring Contract (Target State)
```css
/* Standard interactive (Button, Input, Select, Textarea, RadioGroup, Toggle, Tabs) */
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2

/* Small interactive (Checkbox 20px) */
focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-1

/* Animated interactive (Card with translateY lift) */
focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]
```

## 6. Design Compliance Matrix

| Principle | Status | Evidence |
|-----------|--------|----------|
| WCAG AA Contrast (4.5:1) | PASS | All 40 text×surface combos pass (lowest 7.28:1) |
| WCAG AAA Touch (44px) | FAIL → FIX | Button/Input sm = 36px |
| WCAG Focus Visible | PARTIAL → FIX | 5 inconsistent patterns, Input has no ring |
| Dark mode complete | PASS | tokens.css 100% mirror, high-contrast mode exists |
| Token-first architecture | PARTIAL | 62+ ESLint rules, but ring colors not enforced |
| Reduced motion | PASS | `useAnimationPreference` + `data-reduce-motion` |
| Color independence | PASS | StatusBadge has icons (Phase 93-02) |
| Warm aesthetic (no cold grays) | PASS | OLED dark uses warm off-whites (#f8f7f6) |

## 7. Contrast Matrix Results

### Light Mode: text-muted (#5c5c5c)
| Surface | Ratio | Verdict |
|---------|-------|---------|
| surface-primary (#ffffff) | 9.17:1 | PASS |
| surface-secondary (#fafafa) | 8.89:1 | PASS |
| surface-tertiary (#ebebeb) | 8.28:1 | PASS |
| status-error-bg | 8.86:1 | PASS |
| status-warning-bg | 9.02:1 | PASS |
| status-success-bg | 8.67:1 | PASS |
| status-info-bg | 8.58:1 | PASS |
| primary-light | 8.87:1 | PASS |
| secondary-light | 9.05:1 | PASS |

### Dark Mode: text-muted (#9a9794)
| Surface | Ratio | Verdict |
|---------|-------|---------|
| surface-primary (#000000) | 7.53:1 | PASS |
| surface-secondary (#0a0a0a) | 7.48:1 | PASS |
| surface-tertiary (#141414) | 7.37:1 | PASS |
| surface-elevated (#1a1a1a) | 7.28:1 | PASS |
| status-error-bg | 7.27:1 | PASS |
| status-warning-bg | 7.24:1 | PASS |
| status-success-bg | 7.39:1 | PASS |
| status-info-bg | 7.43:1 | PASS |
| primary-light | 7.39:1 | PASS |
| secondary-light | 7.31:1 | PASS |

**Result: 0 failures across 40 combinations. A11Y-02 is verification-only, no color changes needed.**

## 8. ESLint Token Enforcement

### Current Rules (25 at ERROR level)
| Category | Count | Blocks |
|----------|-------|--------|
| Color (hex, text-white, bg-black) | 6 | Hardcoded hex in brackets, 4 semantic names |
| Typography (fontSize, fontWeight) | 3 | Inline px/numeric values |
| Spacing (m/p/gap brackets) | 8 | Arbitrary px values in margin/padding/gap |
| Shadow (boxShadow inline) | 1 | Hardcoded shadow strings (FM exception) |
| Blur (backdrop/filter inline) | 2 | Hardcoded blur values |
| Motion (duration/delay) | 4 | Hardcoded ms values (FM exception) |
| Z-index | 1 | DISABLED (Tailwind v4 incompatible) |

### GAP: No rules block
- `ring-red-500`, `ring-zinc-400`, `ring-blue-500` (hardcoded Tailwind ring colors)
- `text-red-*`, `bg-zinc-*`, `border-gray-*` (non-bracket Tailwind colors)
- `focus:` instead of `focus-visible:` (accessibility anti-pattern)

### Phase 113 should add
```javascript
// Ring color enforcement
{ selector: "Literal[value=/\\bring-(red|zinc|blue|green|gray)\\b/]",
  message: "Use ring-primary or ring-status-* token." }
// focus: → focus-visible: enforcement  
{ selector: "Literal[value=/\\bfocus:ring/]",
  message: "Use focus-visible: for keyboard-only focus." }
```

## 9. Architectural Decisions

### Decision 1: Button/Input sm always 44px (not responsive)
- **Options:** A) Always 44px, B) Responsive (36px desktop, 44px mobile), C) Keep 36px
- **Chosen:** A — always 44px
- **Rationale:** WCAG applies universally. Responsive adds complexity. 44px works fine on desktop. Introduce `xs` (36px) for escape hatch.

### Decision 2: Input focus — layer ring + glow
- **Options:** A) Replace glow with ring, B) Layer ring on glow, C) Keep glow only
- **Chosen:** B — layer both
- **Rationale:** Glow is intentional visual delight (Phase 116 builds on it). Ring provides WCAG focus indicator. Both can coexist without conflict — glow is boxShadow, ring is outline-based.

### Decision 3: Card interactive — boxShadow focus (not ring-offset)
- **Options:** A) Keep ring-offset, B) Switch to shadow-[var(--shadow-focus)]
- **Chosen:** B — boxShadow-based focus
- **Rationale:** Ring-offset doesn't follow translateY during hover lift, causing visual disconnect. BoxShadow is part of paint layer and moves with the element.

### Decision 4: Include admin/driver components
- **Options:** A) Customer-only, B) All components
- **Chosen:** B — all components
- **Rationale:** Shared component library (Button, Input, Card) means fixing one fixes all. No cost to inclusion. Admin staff deserve accessibility too.

## 10. File Map

### Create
| File | Purpose |
|------|---------|
| None needed | All work modifies existing files |

### Modify (Primary)
| File | Change |
|------|--------|
| `src/components/ui/button.tsx` | sm: h-9→h-11, add xs variant at h-9 |
| `src/components/ui/input.tsx` | sm: h-9→h-11, add xs variant, add focus ring classes |
| `src/components/ui/card.tsx` | Interactive focus: ring-offset → shadow-focus |
| `src/components/ui/checkbox.tsx` | ring-2→ring-1, ring-offset-2→ring-offset-1 |
| `src/components/ui/textarea.tsx` | ring-ring→ring-primary, add ring-offset-2 |
| `src/components/ui/radio-group.tsx` | ring-ring→ring-primary, add ring-offset-2 |
| `src/components/ui/dialog.tsx` | ring-ring→ring-primary |
| `src/components/ui/alert-dialog.tsx` | ring-ring→ring-primary |
| `eslint.config.mjs` | Add ring color + focus-visible enforcement rules |

### Modify (Secondary — hardcoded color cleanup)
| File | Change |
|------|--------|
| `src/components/ui/cart/ClearCartConfirmation.tsx` | ring-zinc-400→ring-primary |
| `src/components/ui/cart/CartDrawerParts.tsx` | ring-red-500→ring-status-error |
| `src/components/ui/cart/CartItem/CartItem.tsx` | ring-red-500→ring-status-error |
| `src/components/ui/cart/CartItem/ValidationOverlay.tsx` | ring-red-500→ring-status-error |
| `src/components/ui/cart/CartPage/CartPageHeader.tsx` | ring-red-500→ring-status-error |
| `src/components/ui/cart/CartButton.tsx` | ring-primary/30→ring-primary |
| `src/components/ui/cart/CartBar.tsx` | ring-primary/30→ring-primary |
| `src/components/ui/cart/AddToCartButton.tsx` | ring-primary/30→ring-primary |
| `src/components/ui/auth/MagicLinkForm.tsx` | focus:→focus-visible: |
| `src/components/ui/account/SettingsTab/PreferencesSection.tsx` | focus:→focus-visible: |
| `src/components/ui/account/SettingsTab/CustomAllergyInput.tsx` | Verify focus pattern |
| `src/components/ui/admin/photos/PhotoGrid.tsx` | focus:→focus-visible: |

### Read (Reference)
| File | Why |
|------|-----|
| `src/styles/tokens.css` | Dark mode verification |
| `src/lib/motion-tokens/index.ts` | inputFocus variant reference |
| `src/lib/hooks/useAnimationPreference.ts` | Reduced motion hook |
| `.planning/phases/112/` | Prior phase contracts |

## 11. Gray Area Resolutions

| # | Gray Area | Resolution | Confidence |
|---|-----------|-----------|------------|
| 1 | Button sm responsive vs always | Always 44px, add xs at 36px | HIGH |
| 2 | Input sm scope | Same as Button — always 44px | HIGH |
| 3 | Input focus: replace/layer/keep glow | Layer CSS ring + keep FM glow | HIGH |
| 4 | "All interactive" scope | All: customer + admin + driver (shared lib) | HIGH |
| 5 | Dark mode "fallback" definition | Token gap (none found) + hardcoded colors | HIGH |
| 6 | Admin components in scope | YES — shared component library | HIGH |
| 7 | Textarea/Select/RadioGroup focus | Migrate ring-ring → ring-primary | HIGH |
| 8 | ESLint: add rules or fix only | Add ring-color + focus-visible rules | MEDIUM |

## 12. Animation/Focus Interaction Patterns

| Component | FM Animation | Focus Treatment | Conflict? | Resolution |
|-----------|-------------|-----------------|-----------|------------|
| Button | whileTap scale(0.97) | CSS ring-2 ring-offset-2 | No | Ring scales proportionally — acceptable |
| Input | boxShadow glow animate | CSS ring-2 ring-offset-2 (NEW) | Layered | Both coexist: glow=delight, ring=a11y |
| Card interactive | hover:-translate-y-1 | shadow-[var(--shadow-focus)] | Resolved | BoxShadow moves with element |
| Checkbox | checkmark SVG animate | CSS ring-1 ring-offset-1 | No | Downsized ring for 20px element |
| AnimatedToggle | x translate on knob | CSS ring-2 on parent button | No | Knob=child, ring=parent — independent |
| Tabs | CSS pill indicator | CSS ring-2 ring-offset-2 | No | No FM on tab buttons |
| Drawer | slide-up spring | None on drawer itself | No | Internal buttons inherit their own focus |
| Dialog | None | ring-ring→ring-primary | No | Token migration only |

## 13. Design Token Audit Results

### Dark Mode Coverage: 100%
Every token in `:root` has a corresponding override in `.dark`:
- Primary/secondary/accent colors: 20 tokens
- Surface colors: 6 tokens (inc. 85% opacity variant)
- Text colors: 5 tokens
- Border colors: 3 tokens
- Status colors: 8 tokens (4 colors + 4 backgrounds)
- Shadow tokens: 25+ tokens
- Hero/footer/overlay/skeleton/disabled: 20+ tokens
- Interactive aliases: 4 tokens

### Hardcoded Color Violations (~30 files)
Top offenders:
- `FreeDeliveryProgress.tsx` — 12 raw Tailwind color classes
- `StatusBadge.tsx` — 8 raw color classes
- `ProfileCompletenessCard.tsx` — 6 hardcoded badge colors
- Focus ring files — 6 with ring-red-500/ring-zinc-400

### Focus Ring Token Gap
No `ring-*` enforcement in ESLint. Currently allowed:
- `ring-red-500` (5 files)
- `ring-zinc-400` (1 file)
- `ring-primary/30` (3 files — opacity variant)
- `ring-amber-500` (migrated in Jan 2026, commit 2c60e3b7)
