---
phase: 110
slug: critical-fixes-data-reliability
status: draft
shadcn_initialized: true
preset: new-york (neutral base, lucide icons, RSC, custom Pepper aesthetic tokens)
created: 2026-04-06
---

# Phase 110 — UI Design Contract

> **Scope:** Surgical bug-fix phase. 1 net-new component, 5 modified UI behaviors, 1 hook extension. All design tokens, color, spacing, typography, animation primitives already exist in the codebase. This contract defines ONLY the new surfaces and the behavioral contracts for the modified ones.
>
> **Source of truth:** `src/styles/tokens.css`, `src/components/ui/Button.tsx`, `src/lib/hooks/useToast.ts`, `src/components/ui/checkout/CheckoutErrorBanner.tsx`, `src/components/ui/EmptyState.tsx`. This document references — does not duplicate — those.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn (already initialized — `components.json` present) |
| Preset | new-york style, neutral base color, CSS variables enabled, lucide icons |
| Component library | Radix UI primitives + custom Pepper aesthetic layer |
| Icon library | lucide-react v0.562 (tree-shaken via `modularizeImports`) |
| Font | Nunito (display + body, weights 400/500/600/700/900); Padauk (Burmese subtitle) |
| Animation library | Framer Motion v12 + CSS keyframes (`animations.css`) |
| Token enforcement | 62+ ESLint `no-restricted-syntax` rules block hardcoded hex/px/duration |

**Phase 110 introduces:** Zero new tokens. Zero new icons. One hook option flag (`persistent: true`).

---

## Spacing Scale

Phase 110 uses the existing project spacing scale (`tokens.css` `--space-*`, all multiples of 4). No new spacing tokens.

| Token | Value | Phase 110 Usage |
|-------|-------|-----------------|
| `space-2` | 8px | Icon-to-text gap inside error banner/component |
| `space-3` | 12px | Inline button padding inside banner |
| `space-4` | 16px | Default error banner padding (matches `CheckoutErrorBanner.tsx` `p-4`) |
| `space-6` | 24px | EmptyCheckoutError vertical rhythm between icon → heading → body → CTA |
| `space-8` | 32px | EmptyCheckoutError outer container padding (`py-8`) |
| `space-12` | 48px | EmptyCheckoutError full-screen vertical centering offset |

**Touch targets:** All interactive elements (Try Again, Proceed Anyway, Browse Menu, Dismiss) use `Button size="md"` (44px h) or `Button size="lg"` (52px h). Meets `--touch-target-min: 44px`.

**Exceptions:** None.

---

## Typography

Phase 110 uses existing Nunito-based scale (`tokens.css` `--text-*`). No new typography tokens.

| Role | Class | Size | Weight | Line Height | Phase 110 Usage |
|------|-------|------|--------|-------------|-----------------|
| Body | `text-sm` | 14px (0.875rem) | 400 | 1.5 | Error banner descriptions, validation timeout body |
| Body emphasized | `text-sm font-medium` | 14px | 500 | 1.5 | Error banner titles, button labels |
| Heading | `text-xl font-bold font-display` | 20px | 700 | 1.3 | EmptyCheckoutError title ("Your cart is empty") |
| Caption | `text-xs` | 12px | 400 | 1.4 | Burmese subtitle (optional), "Try Again" hint text |

**Constraints:**
- All copy uses `font-display` (Nunito) — no font swap.
- Burmese subtitle (when present) uses `.font-burmese` (Padauk) at `text-2xs` per existing CheckoutErrorBanner pattern.
- No new font weights beyond the existing 400/500/600/700/900 set.

---

## Color

Phase 110 uses existing semantic status tokens. No new colors.

| Role | Token | Light | Dark | Phase 110 Usage |
|------|-------|-------|------|-----------------|
| Dominant (60%) | `--color-surface-primary` | `#ffffff` | `#1a1918` | EmptyCheckoutError card background, page surfaces |
| Secondary (30%) | `--color-surface-secondary` / `--color-surface-tertiary` | `#fafafa` / `#ebebeb` | `#252423` / `#302f2d` | Banner internal accents (icon chip backgrounds) |
| Accent (10%) | `--color-primary` (#a41034 / dark #ff6b6b) | red | red | Browse Menu CTA only |
| Error semantic | `--color-status-error` (#c45c4a / dark #ff6b6b) | rose | rose | Banner border, icon, title text — CFIX-04 / CFIX-05 |
| Error background | `--color-status-error-bg` (rgba(196,92,74,0.1)) | tinted | tinted | Banner fill — CFIX-04 / CFIX-05 |
| Disabled | `disabled:opacity-50` (Button line 34) | inherit | inherit | CFIX-03 cutoff submit gate |

**Accent reserved for:**
1. EmptyCheckoutError "Browse Menu" primary CTA (`Button variant="primary"`)
2. CFIX-04 toast "Try Again" button (`Button variant="primary"`)
3. CFIX-05 banner "Proceed Anyway" button (`Button variant="outline"` — escalates to primary on hover via existing tokens)

**Forbidden in this phase:** Hardcoded hex, `text-white`, `bg-black`, arbitrary `bg-[#xxx]` — ESLint already enforces.

---

## Animation Tokens

Phase 110 introduces ZERO new animations. All entrances use existing utilities from `src/styles/animations.css`.

| Element | Animation | Source | Reduced-motion fallback |
|---------|-----------|--------|-------------------------|
| `EmptyCheckoutError` mount | `animate-fade-in` (300ms ease-out) | `animations.css:102` | `useAnimationPreference()` → no opacity transition |
| `CFIX-05` validation timeout banner | `animate-slide-in-up` (300ms ease-out) | `animations.css:97` | `useAnimationPreference()` → instant render |
| `CFIX-04` Stripe timeout error banner | Inherits `CheckoutErrorBanner` Framer spring entrance (`spring.default` from `motion-tokens.ts`) | `CheckoutErrorBanner.tsx:165-176` | `useAnimationPreference()` → omits initial/animate |
| `CFIX-03` disabled submit button | `disabled:opacity-50` instant state change (Button.tsx:34) | tokens | n/a (no animation) |
| `CFIX-04` persistent toast mount | Existing toast slide-in (no change) | `useToast.ts` reducer | n/a (no change) |

**Anti-pattern check (PRECONTEXT §7):** No spinner-then-redirect, no toast-then-vanish for criticals, no hidden auto-retries.

---

## Component Inventory

### Net-New (1)

#### `EmptyCheckoutError`
- **Path:** `src/components/ui/checkout/EmptyCheckoutError.tsx`
- **Lines:** ~40 (under 400-line limit; no subfolder needed)
- **Trigger:** Render-time when `useCart((s) => s.items.length === 0)` is true on `/checkout` (CFIX-02, D-04, D-05, D-06)
- **Layout:**
  ```
  ┌─────────────────────────────────────┐
  │                                     │
  │             [icon: cart]            │  ← lucide ShoppingCart, 64px, text-text-muted
  │                                     │
  │       Your cart is empty            │  ← text-xl font-bold font-display
  │                                     │
  │   Start by browsing our menu —      │  ← text-sm text-text-secondary, max-w-sm
  │   we'll get a fresh meal to your    │
  │   door on the next delivery day.    │
  │                                     │
  │           [Browse Menu]             │  ← Button variant="primary" size="lg"
  │                                     │     leftIcon={<ChevronLeft />}
  └─────────────────────────────────────┘
  ```
- **Spec:**
  - Container: `flex flex-col items-center justify-center px-4 py-12 text-center min-h-[60vh]`
  - Icon wrapper: `mb-6` — `ShoppingCart` lucide icon, `h-16 w-16`, `text-text-muted`, optional gradient halo following existing `EmptyState.tsx:74-89` pattern
  - Heading: `mb-2 font-display text-xl font-bold text-text-primary`
  - Body: `mb-8 max-w-sm font-body text-sm text-text-secondary`
  - CTA: `<Button asChild variant="primary" size="lg" className="shadow-elevated"><Link href="/menu">Browse Menu</Link></Button>`
  - Entrance: wrap in `<m.div>` from framer-motion or use `animate-fade-in` utility class — match `EmptyState.tsx:139-145` pattern with `useAnimationPreference()` guard
- **Dark mode:** Inherits all tokens automatically (`text-text-primary` / `text-text-secondary` / `text-text-muted` are themed in `tokens.css`).
- **Accessibility:** Icon `aria-hidden="true"`. Page wrapper has `role="status"` so the heading is announced to screen readers on mount. Browse Menu button focusable via Tab; uses default `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary` from Button.tsx:32.
- **Reusability:** Specific to checkout-page direct-link case. NOT a general-purpose empty state — that's `EmptyState.tsx variant="cart"`. This component has no Burmese subtitle (deferred to Phase 111+ if needed).

### Modified Behaviors (5)

#### CFIX-01: Mobile Cart Page (CSS-only responsive)
- **File:** `src/app/(customer)/cart/page.tsx`
- **Visual surface:** No new visual elements. Removes existing white flash.
- **Implementation:** Replace `useEffect(() => { if (isMobile) router.push('/menu') }, [...])` with Tailwind classes:
  ```tsx
  <div className="md:hidden">{/* mobile cart subview */}</div>
  <div className="hidden md:block">{/* desktop cart layout */}</div>
  ```
- **Breakpoint:** `md` (768px — `--breakpoint-md` from `tokens.css:382`). NO custom breakpoints.
- **Hydration contract:** Zero JS branching means zero hydration mismatch. Server and client render identical markup.
- **Verification:** Hard-refresh on iPhone 12 viewport (390px) — no white flash, no console hydration warnings.

#### CFIX-03: Cutoff Submit Gate (defense-in-depth disable)
- **Files:** `src/app/(customer)/checkout/CheckoutClient.tsx`, `src/components/ui/checkout/PaymentStepV8.tsx`
- **Visual contract:**
  - Submit button uses existing `disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed` (Button.tsx:34) — NO new visual style
  - The CutoffModal IS the explanation (visible above the disabled button) — satisfies "Disabled buttons must show WHY" principle
- **Implementation:** `disabled={isCreatingSession || cutoffModalOpen}` AND handler early-return `if (cutoffModalOpen) return`
- **No tooltip needed** — modal carries the message.

#### CFIX-04: Stripe Payment Timeout (toast + retry)
- **File:** `src/components/ui/checkout/PaymentStepV8.tsx`
- **Visual contract:** Reuses existing `<CheckoutErrorBanner>` with new error code `CHECKOUT_NETWORK_TIMEOUT`. Add new branch to the banner's `switch(error.code)` (lines 90-161) OR surface via `useToast({ variant: "destructive", persistent: true })` toast — **planner decides per code review of where the surface fits best**.
- **Recommended surface:** Toast for low-friction visibility; banner is also acceptable if PaymentStepV8 already shows the bottom-of-form error region.
- **Copy contract:** see Copywriting below.
- **Action:** "Try Again" button → resubmits form (NOT recreates session) — preserves Stripe idempotency `checkout_${order.id}`
- **Persistence:** MUST use `persistent: true` (no auto-dismiss). Includes explicit "Dismiss" button.
- **Entrance:** Inherits existing CheckoutErrorBanner Framer Motion spring entrance (lines 165-176)

#### CFIX-05: Cart Validation Timeout (banner + Proceed Anyway)
- **File:** `src/lib/hooks/useCartValidation.ts` (state) + render site (TBD by planner — likely `CheckoutClient.tsx` or `useCartValidation` consumer)
- **Visual contract:** Render a new error banner above the validation gate when `timedOut === true`. Shape mirrors `CheckoutErrorBanner` (rounded-xl, status-error tokens, AlertTriangle icon) but is rendered inline at the validation gate site — NOT inside CheckoutErrorBanner's switch.
- **Layout:**
  ```
  ┌────────────────────────────────────────────────┐
  │ [⚠] Validation taking longer than usual        │
  │     We can't confirm item availability right   │
  │     now. You can wait, or proceed at your own  │
  │     risk.                                       │
  │                                                 │
  │                          [Proceed Anyway]       │
  └────────────────────────────────────────────────┘
  ```
- **Spec:**
  - Wrapper: `rounded-xl border border-status-error/20 bg-status-error-bg p-4 animate-slide-in-up`
  - Icon chip: `p-1.5 rounded-lg bg-status-error/10 text-status-error` containing `<AlertTriangle className="w-4 h-4" />`
  - Title: `text-sm font-medium text-status-error`
  - Body: `text-xs text-text-muted mt-0.5`
  - Action: `<Button variant="outline" size="sm" onClick={proceedAnyway}>Proceed Anyway</Button>` aligned right
- **Accessibility:** Banner wrapper has `role="alert"` so screen readers announce on mount. Icon `aria-hidden="true"`.
- **Behavior:** Click "Proceed Anyway" → sets `timedOut: false`, bypasses blocking gate WITHOUT revalidating (D-19). NO auto-retry.

#### CFIX-06 / DATA-02: Pure infrastructure
- **No UI surface.** React Query retry config + query key factory live in `query-provider.tsx` and `src/lib/queryKeys.ts`. Skip in this contract.

### Hook Extension (1)

#### `useToast` — `persistent: true` flag
- **File:** `src/lib/hooks/useToast.ts`
- **Change:** Extend `ToastOptions` with `persistent?: boolean`. When `true`, skip the `addToRemoveQueue(id, dispatch)` call inside the `toast()` function — toast stays until explicitly dismissed.
- **Visual contract for persistent toasts:**
  - MUST include explicit "Dismiss" button (text-only, `Button variant="ghost" size="sm"`)
  - MUST NOT auto-disappear under any condition
  - MUST be visually distinct from auto-dismiss toasts via the destructive variant only — NO new styling
  - Reduced motion: still respects `useAnimationPreference()` for any future motion
- **Reserved for:** `CHECKOUT_NETWORK_TIMEOUT`, `CART_VALIDATION_TIMEOUT`. Future critical errors may opt in.
- **Forbidden:** Persistent toasts for non-critical messages (would erode trust in the dismiss action).

---

## Copywriting Contract

### EmptyCheckoutError (CFIX-02)

| Element | Copy |
|---------|------|
| Heading | `Your cart is empty` |
| Body | `Start by browsing our menu — we'll get a fresh meal to your door on the next delivery day.` |
| CTA label | `Browse Menu` |
| CTA `aria-label` | `Browse the menu` |
| Icon | lucide `ShoppingCart` |

**Tone:** Warm, family business — Mandalay Morning Star. NOT technical ("404", "/menu", "redirect"). Speaks of "fresh meal" + "delivery day" because those are what the customer cares about.

### CFIX-04: Stripe Payment Timeout

| Element | Copy |
|---------|------|
| Banner/toast title | `Payment service is slow to respond` |
| Banner/toast body | `We couldn't reach our payment provider. Your cart and address are still saved.` |
| Primary action | `Try Again` |
| Dismiss action | `Dismiss` |
| Error code | `CHECKOUT_NETWORK_TIMEOUT` |
| Icon | lucide `CreditCard` |

**Tone:** Reassures the customer that nothing was lost. "Your cart and address are still saved" is critical — directly addresses the unspoken fear "did I lose my order?". Forbidden phrases: "Internal error", "Network error", "Stripe error", "503", "Timeout exceeded".

### CFIX-05: Cart Validation Timeout

| Element | Copy |
|---------|------|
| Banner title | `Validation taking longer than usual` |
| Banner body | `We can't confirm item availability right now. You can wait, or proceed at your own risk.` |
| Primary action | `Proceed Anyway` |
| Error code | `CART_VALIDATION_TIMEOUT` |
| Icon | lucide `AlertTriangle` |

**Tone:** Customer agency — explicitly names the trade-off ("at your own risk") rather than hiding it. Forbidden phrases: "Validation failed", "Refresh the page", "Try again later".

### CFIX-03: Cutoff Submit Gate

| Element | Copy |
|---------|------|
| Disabled button copy | (unchanged — uses existing `Place Order` / `Continue to Payment` label) |
| Modal copy | (unchanged — CutoffModal is the explanation; Phase 81 contract preserved) |

**Disabled state has NO additional tooltip** — the modal IS the explanation, visible above the button.

### Destructive actions in this phase

**None.** Phase 110 is bug fixes — there are no destructive actions added or modified. The `Proceed Anyway` button (CFIX-05) is risk-acknowledged but not destructive (no data is deleted or charged at that step).

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none added in Phase 110 | not applicable — no registry pulls |
| third-party | none | not applicable |

`components.json` registries object is empty (`"registries": {}`). Phase 110 adds no new shadcn block via `npx shadcn add`. The single net-new component (`EmptyCheckoutError`) is hand-authored against existing project patterns (`EmptyState.tsx`, `CheckoutErrorBanner.tsx`).

**Verdict:** Registry vetting gate not required.

---

## Cross-Cutting Constraints

### Reduced motion
All new motion (EmptyCheckoutError fade-in, CFIX-05 slide-in-up) MUST respect `useAnimationPreference()` from `src/lib/hooks/useAnimationPreference.ts`. Pattern:

```tsx
const { shouldAnimate } = useAnimationPreference();
// Use motion props conditionally:
<m.div initial={shouldAnimate ? { opacity: 0 } : undefined} ...>
// OR omit animate-* class when !shouldAnimate
```

### Dark mode
Zero hardcoded colors. All tokens already have light/dark variants in `tokens.css`. New component (`EmptyCheckoutError`) MUST be tested in dark mode by toggling `<html class="dark">` — visual verification only, no extra code.

### Hydration safety
- `EmptyCheckoutError` is render-time only (CFIX-02 D-04 D-05) — NO useEffect, NO redirect.
- `CFIX-01` mobile cart uses CSS-only — server and client render identical markup, NO `useIsMobile()` on the page.
- Both ELIMINATE the white flash that motivated the phase.

### Touch targets
All interactive elements ≥44px height:
- `Button size="md"` = 44px (h-11)
- `Button size="lg"` = 52px (h-[52px])
- Toast Dismiss button = `Button size="sm" variant="ghost"` = 36px → use `size="md"` instead to satisfy A11Y-01 even though A11Y-01 is Phase 113 scope (defense-in-depth — don't introduce a regression that Phase 113 then has to fix)

### File organization
- `EmptyCheckoutError.tsx` lives at `src/components/ui/checkout/EmptyCheckoutError.tsx` (sibling to existing `CheckoutErrorBanner.tsx`)
- Add export to `src/components/ui/checkout/index.ts` barrel
- Stays under 400 lines (estimate ~40)
- Optional: Storybook story `EmptyCheckoutError.stories.tsx` (NICE-TO-HAVE per ENHANCEMENT-RECOMMENDATIONS rec #12)

### Forbidden patterns (PRECONTEXT §7) — checker enforces
- Silent fallbacks (catch + ignore)
- `useEffect`-based redirects
- Spinner-redirect loops
- Disabled buttons without explanation (CutoffModal IS the explanation here)
- Toast-then-vanish for critical errors

---

## Implementation Quick Reference

| Fix | Surface | New Component | New Token | New Animation | New Copy |
|-----|---------|---------------|-----------|---------------|----------|
| CFIX-01 | mobile cart page | no | no | no | no |
| CFIX-02 | /checkout direct-link | **EmptyCheckoutError** | no | `fade-in` (existing) | yes (heading + body + CTA) |
| CFIX-03 | submit button | no | no | no | no |
| CFIX-04 | banner OR toast | no | `useToast` `persistent: true` flag | no | yes (title + body + 2 buttons) |
| CFIX-05 | inline banner | no | no | `slide-in-up` (existing) | yes (title + body + button) |
| CFIX-06 | n/a infrastructure | no | no | no | no |
| DATA-02 | n/a infrastructure | no | no | no | no |

**Total net-new UI surface:** 1 component, 1 hook flag, 0 tokens, 0 icons, 0 colors, 0 fonts.

---

## Sections N/A — Existing Tokens Sufficient

The following standard UI-SPEC sections are intentionally minimal because Phase 110 introduces no new surface in those dimensions:

- **Layout patterns:** No new layouts. CFIX-01 uses 2 Tailwind responsive divs. EmptyCheckoutError uses standard centered flex column.
- **Icon system:** Lucide already in use; new icons (`ShoppingCart`, `CreditCard`, `AlertTriangle`, `ChevronLeft`) are stock lucide imports.
- **Form fields:** No new form fields. CFIX-04/CFIX-05 attach to existing PaymentStepV8 / cart validation surfaces.
- **Modals/dialogs:** No new modals. CFIX-03 reuses existing CutoffModal contract (Phase 81, do not modify).
- **Navigation:** No nav changes. EmptyCheckoutError uses standard `<Link href="/menu">` to homepage menu route.
- **Brand colors:** No new brand colors. All status/surface/text/border tokens preexist in `tokens.css`.
- **Typography hierarchy:** No new sizes/weights. All copy uses existing `text-sm` / `text-xl` / `font-display`.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending

---

*Phase 110 UI Spec — generated 2026-04-06 by gsd-ui-researcher.*
*Pre-populated from CONTEXT.md (33 decisions D-01 through D-33), PRECONTEXT-RESEARCH.md (§11 animation, §14 token audit, §7 trust principles), ENHANCEMENT-RECOMMENDATIONS.md (rec #4 EmptyCheckoutError, rec #8 persistent toast).*
