# Phase 113: Accessibility & Design System - Context

**Gathered:** 2026-04-09 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

All interactive elements are usable on mobile, visible in both themes, and navigable via keyboard. Fix WCAG violations across shared component library — touch targets, contrast ratios, focus indicators, dark mode token completeness. Propagates to customer, admin, and driver surfaces.

**In scope (4 requirements):**
- A11Y-01: 44px minimum touch targets on mobile (Button/Input sm sized up)
- A11Y-02: Text-muted WCAG AA contrast verification (4.5:1 on all surfaces)
- A11Y-03: Consistent focus-visible ring+offset across all interactive components
- A11Y-04: Dark mode token completeness — audit and fix hardcoded colors

**Explicitly NOT in scope:**
- Screen reader / full ARIA audit (covered in v1.9/v2.0)
- Keyboard navigation tab order (separate initiative)
- `prefers-reduced-motion` OS detection (project uses `data-reduce-motion`)
- New component creation
- Color-blindness / high-contrast mode (existing `[data-contrast="high"]` adequate)
- Spring physics harmonization (out of scope per REQUIREMENTS.md)
- Modal/Dialog/Drawer API consolidation (design system refactor — too broad)

</domain>

<decisions>
## Implementation Decisions

### Touch Target Sizing (A11Y-01)
- **D-01:** Button `sm` variant: change `h-9` (36px) to `h-11` (44px) globally — no responsive breakpoint approach, always 44px
- **D-02:** Input `sm` variant: change `h-9` (36px) to `h-11` (44px) globally — same as Button
- **D-03:** Introduce `xs` variant at `h-9` (36px) for non-mobile icon-only buttons where 44px is excessive (toolbar actions, close icons in tight containers)
- **D-04:** Audit all 68 files using `size="sm"` Button and ~15 files using `size="sm"` Input during planning for layout impact — flag any that need xs downgrade
- **D-05:** Fix flex container collapse: add `min-h-11` or `w-full` to interactive children in flex containers that could shrink below 44px (gotcha G-07)

### Focus Ring Harmonization (A11Y-03)
- **D-06:** Standard interactive (Button, Input, Select, Textarea, RadioGroup, Toggle, Tabs): `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`
- **D-07:** Small interactive (Checkbox 20px): `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-1` — ring-2 visually overwhelming at this size (gotcha G-06)
- **D-08:** Animated interactive (Card with translateY lift): `focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]` — boxShadow moves with transform, ring-offset does not (gotcha G-05)
- **D-09:** Input focus: layer CSS ring on TOP of existing Framer Motion animated glow — they complement, don't conflict (gotcha G-04)
- **D-10:** Replace all `focus:ring` with `focus-visible:ring` in 7+ files — mouse click should NOT show ring (gotcha G-09)
- **D-11:** Migrate legacy `ring-ring` token to `ring-primary` in Textarea, RadioGroup, and 2 other components (4 total)
- **D-12:** Disable 3D tilt transforms during keyboard focus via `isKeyboardFocused` state on Card — tilt creates stacking context that conflicts with ring (gotcha G-18)
- **D-13:** NEVER modify Drawer.tsx exit animation — must stay `duration: 0.15s easeIn` (Phase 112 contract, commit 4087d3bf)

### Dark Mode Token Audit (A11Y-04)
- **D-14:** Dark mode tokens in `tokens.css` are 100% complete (verified: 200+ tokens with full dark mirror). No new tokens needed.
- **D-15:** Fix all ~30 files with hardcoded hex colors in className — migrate to semantic tokens
- **D-16:** Fix 6 files with `ring-red-500` / `ring-zinc-400` — migrate to `ring-status-error` / `ring-border-default` or equivalent tokens
- **D-17:** Add ESLint `no-restricted-syntax` rules blocking hardcoded ring colors (`ring-red-*`, `ring-zinc-*`, `ring-gray-*`, etc.) — regression guard
- **D-18:** Portal-rendered components (tooltips, popovers): verify dark mode context propagation — use CSS custom properties, not className inheritance

### Contrast Verification (A11Y-02)
- **D-19:** All 40 text-muted x surface combinations already PASS WCAG AA — lowest ratio is 7.28:1 (dark text-muted on surface-elevated). Zero color token changes needed.
- **D-20:** Create automated Vitest contrast audit testing all combinations as regression guard — if future token changes break contrast, CI catches it
- **D-21:** Contrast check covers both light mode (text-muted #5c5c5c) and dark mode (text-muted #9a9794) against all surface tokens

### Implementation Order
- **D-22:** Dark mode hardcoded color audit first (cheapest, unblocks verification) → focus ring harmonization → touch target sizing → contrast verification → ESLint rules last (regression guard)

### Claude's Discretion
- Exact ESLint rule patterns for ring color enforcement
- Which `h-8`/`h-7` instances (74 + 30 = 104 total) need attention beyond Button/Input sm
- StatusStepper animation gating approach for focus ring compatibility
- Theme transition flicker handling during dark mode toggle

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Accessibility Requirements
- `.planning/REQUIREMENTS.md` §Accessibility — A11Y-01 through A11Y-04 definitions
- `.planning/ROADMAP.md` §Phase 113 — Success criteria (4 items)

### Pre-Context Research (CRITICAL)
- `.planning/phases/113-accessibility-design-system/113-PRECONTEXT-RESEARCH.md` — Full component inventory, gotcha matrix (18 items), contrast matrix, data contracts, cross-phase contracts, implementation order. MUST READ before planning.

### Design Token System
- `src/styles/tokens.css` — Source of truth for all design tokens (200+ light, 200+ dark)
- `src/styles/globals.css` — `@theme inline {}` Tailwind v4 config (NOT tailwind.config.ts)

### Component Size Contracts
- `src/components/ui/button.tsx` — Button CVA variants (sm/md/lg/xl sizes)
- `src/components/ui/input.tsx` — Input CVA variants (sm/default/lg/xl sizes)

### Cross-Phase Contracts
- `.planning/phases/110/110-CONTEXT.md` §D-33 — ClientErrorCodes pattern
- `.planning/phases/112/112-CONTEXT.md` §D-01,D-04 — Drawer.tsx constraints, exit animation contract

### ESLint Configuration
- `eslint.config.mjs` — 25+ design token rules at ERROR level; ring color rules to be added

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/button.tsx`: CVA with size variants — direct edit target for sm→44px, xs addition
- `src/components/ui/input.tsx`: CVA with size variants — direct edit target for sm→44px
- `src/components/ui/checkbox.tsx`: Radix Checkbox with existing focus styles — needs ring downsize
- `src/components/ui/card.tsx`: Interactive variant with hover translateY — needs boxShadow focus
- `src/styles/tokens.css`: Complete token system with `--shadow-focus` already available
- `eslint.config.mjs`: Existing `no-restricted-syntax` pattern for 25+ token rules — extend for ring colors

### Established Patterns
- Focus pattern from Phase 110: `focus-visible:ring-2 ring-primary ring-offset-2` — adopted as standard
- Design token enforcement via ESLint at error level — 62+ tokens enforced
- Tailwind v4 `@theme inline` as source of truth (NOT tailwind.config.ts — dead code)
- CVA (class-variance-authority) for component variant management

### Integration Points
- All 70+ UI components share these base components — changes propagate everywhere
- Admin, driver, and customer surfaces all import from `src/components/ui/`
- MuteToggle (Phase 112) already at 44px — do NOT regress
- Phase 110 `EmptyCheckoutError` uses `role="status"` — do NOT remove
- Phase 112 `ReconnectingBanner` uses `role="status"` `aria-live="polite"` — do NOT remove

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Pre-context research provides comprehensive implementation guidance.

</specifics>

<deferred>
## Deferred Ideas

- Full WCAG 2.1 AA compliance audit — separate initiative per REQUIREMENTS.md out-of-scope
- Spring physics harmonization across all components — v2.4 polish work
- `prefers-reduced-motion` OS-level detection — project uses `data-reduce-motion` opt-in
- Keyboard navigation tab order audit — separate initiative
- Modal/Dialog/Drawer API consolidation — design system refactor too broad for this phase

</deferred>

---

*Phase: 113-accessibility-design-system*
*Context gathered: 2026-04-09*
