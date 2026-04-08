---
phase: 111
slug: checkout-conversion
status: draft
shadcn_initialized: true
preset: new-york (neutral base, lucide icons)
created: 2026-04-07
---

# Phase 111 — UI Design Contract

> Visual and interaction contract for Phase 111 Checkout Conversion. Phase 111 is a **zero-new-tokens** phase — all six fixes compose from Phase 110 primitives. This contract **locks** which existing tokens are allowed and prescribes the exact copy, states, and motion for each touched surface.

---

## Scope Recap

Six surgical frontend fixes. Executor-relevant surfaces:

| Surface | Fix | Visual Change? |
|---------|-----|----------------|
| `CutoffModal.tsx` | CHKP-04 — reschedule button | YES — adds third primary action |
| `CheckoutErrorBanner.tsx` | CHKP-02 — PRICE_CHANGED case | YES — new banner variant |
| `CheckoutClient.tsx` | CHKP-03 — step prefetch | NO (silent) |
| `CheckoutClient.tsx` | CHKP-02 — wire banner | Composition only |
| 3 × RHF form components | CHKP-01 — onTouched mode | NO — state machine change |
| `useMenu.ts` | CFIX-09 — polling | NO — background |
| Vitest test files | CFIX-07 — persistence contract | NO — no UI |

---

## Design System

| Property | Value | Source |
|----------|-------|--------|
| Tool | **shadcn/ui (new-york style)** | `components.json` detected |
| Preset | base color `neutral`, CSS variables enabled, `rsc: true`, `tsx: true` | `components.json` |
| Component library | **shadcn/ui + Radix UI primitives** + custom V8 layer (`src/components/ui/**`, 70+ components) | Project convention |
| Icon library | **lucide-react** | `components.json` `iconLibrary: "lucide"` |
| Font (Latin) | **Nunito** (rounded, playful) — weights 400/500/600/700/800/900 available | `globals.css:1-2` |
| Font (Burmese) | **Padauk** — weights 400/700 — applied via `.font-burmese` utility | `globals.css:272-274` |
| CSS architecture | Tailwind v4 with `@theme inline` source of truth, tokens declared in `src/styles/tokens.css` | `globals.css:22-190` |
| Tokens enforced by | ESLint (62+ design tokens: z-index, colors, spacing, shadows, blur) — **hardcoded hex/rgb is an error** | `CLAUDE.md` project conventions |
| Motion library | Framer Motion 12 (LazyMotion `domMax` at root) — use `<m.div>` not `<motion.div>` | V8 convention |
| Spring tokens | `spring.default` (300/22/0.8), `spring.snappy` (600/35/1), `spring.gentle` (200/25/1) — all in `src/lib/motion-tokens` | Research §12 |
| Animation gate | **All motion wrapped through `useAnimationPreference().getSpring(spring.X)`** — honors `prefers-reduced-motion` | CONTEXT D-39 |
| Dark mode | Light + dark both mandatory (warm dark, no cold grays) — **no dark-mode-only features in this phase** | `globals.css:227-260`, PROJECT.md |

**Phase 111 registry impact:** No shadcn block additions. Safety gate not applicable.

---

## Spacing Scale

Declared values (multiples of 4, Tailwind v4 default spacing). Phase 111 uses a subset.

| Token | Value | Class | Phase 111 Usage |
|-------|-------|-------|-----------------|
| xs | 4px | `gap-1`, `p-1` | Icon wrapper padding, chip inner padding |
| sm | 8px | `gap-2`, `p-2`, `py-2` | Compact row gap, button inline padding |
| md | 12px | `gap-3`, `p-3` | Modal action row gap, button stack gap (existing CutoffModal pattern) |
| md+ | 16px | `gap-4`, `p-4` | Banner outer padding (`CheckoutErrorBanner` existing), form row gap |
| lg | 24px | `gap-6`, `p-6`, `pb-6` | Modal content padding, content-stack vertical rhythm |
| xl | 32px | `gap-8`, `p-8` | Section breaks (not used in Phase 111 surfaces) |

**Phase 111 spacing rules:**
- **CutoffModal extension:** MUST preserve existing `gap-6` vertical rhythm between icon/heading/message/reassurance/actions blocks.
- **Three-action row:** MUST preserve existing `flex w-full flex-col gap-3 sm:flex-row sm:justify-center` pattern (no overflow, stacks on mobile, inline on `sm:`).
- **Reschedule button min-width:** `sm:min-w-[160px]` (wider than existing `sm:min-w-[140px]` for "Browse Menu" because the label contains a date and varies in width).
- **Banner padding:** MUST reuse existing `p-4` outer padding from `CheckoutErrorBanner` (line 187).
- **Price row gap:** `gap-2` between price label, old price, arrow, new price.

**Exceptions:** None. Phase 111 introduces zero new spacing values.

---

## Typography

Phase 111 touches 3 surfaces. Declared sizes for this phase:

| Role | Size | Weight | Line Height | Class | Usage in Phase 111 |
|------|------|--------|-------------|-------|---------------------|
| Caption / helper | 12px | 500 | 1.4 | `text-xs font-medium` | Price-change meta ("Old price"), Burmese subtext in modal |
| Body | 14px | 400/500 | 1.5 | `text-sm` / `text-sm font-medium` | Banner headline label, modal body text, button label |
| Body large | 16px | 400 | 1.5 | `text-base` | Modal primary message (existing pattern) |
| Heading | 20px | 600 | 1.2 | `text-xl font-semibold` | Modal heading (existing) |

**Weights used in Phase 111:** exactly **2** — `font-medium` (500) + `font-semibold` (600). Body default (400) is inherited from root.

**Typography rules:**
- **Burmese subtext** below every new English string that appears in a user-facing modal or banner — matches existing `CutoffModal.tsx:45,54,61` pattern. Marked with `{/* BURMESE-REVIEW */}` comment per CONTEXT D-40.
- **Burmese strings** MUST wrap in `className="font-burmese"` or inherit via parent (current pattern relies on browser font-fallback to Padauk — executor should verify by reading `globals.css:272-274`).
- **Money formatting** in price-change banner: old price struck through (`line-through`), new price emphasized (`font-semibold text-text-primary`). Both rendered with `formatCents()` helper (project convention, search codebase for usage).
- **No decorative typography** — no `text-gradient-gold`, `text-gradient-saffron`, or hero-style treatments in Phase 111 surfaces.

---

## Color

Phase 111 is a **status communication** phase (warnings, errors, success states). The 60/30/10 split applies to the checkout page as a whole; Phase 111's role is to compose the accent + semantic layer cleanly without introducing new hues.

### 60/30/10 Split

| Role | % | Token | Used for |
|------|---|-------|----------|
| **Dominant (60%)** | 60 | `bg-background` (`#ffffff` light / `#1a1918` dark) | Page background, checkout surface |
| **Secondary (30%)** | 30 | `bg-card` / `bg-surface-primary` (`#ffffff` / `#252423`) | Step cards, modal backdrop, form field background |
| **Accent (10%)** | 10 | `text-primary` / `bg-primary` (`#8b1a1a` light / `#ff6b6b` dark — Morning Star red) | **CTAs only** — Reschedule button, "Update cart" link |

**Accent reserved for:** Primary CTA button (`<Button variant="primary">`), text-only links that represent a committed action (e.g., "Update cart" inside banner). **NEVER** used on banners, icons, text emphasis, borders unrelated to focus, hover backgrounds, or "pill" containers.

### Semantic Status Colors (Phase 111 Working Layer)

Phase 111 surfaces communicate three distinct meanings. Each maps 1:1 to a token group. **No new semantic colors.**

| Meaning | Token group | Classes | Used by |
|---------|-------------|---------|---------|
| **Warning** (price up, heads-up, action required) | `status-warning` | `bg-status-warning-bg`, `border-status-warning/20`, `text-status-warning` | Price-change banner when `priceDirection === "up"` |
| **Success** (price down, good news) | `status-success` | `bg-status-success-bg`, `border-status-success/20`, `text-status-success` | Price-change banner when `priceDirection === "down"` |
| **Error** (blocking failure) | `status-error` | `bg-status-error-bg`, `border-status-error/20`, `text-status-error` | Existing banner states (Stripe/network/timeout) — **NOT extended in Phase 111** |

### Price-Change Banner Color Matrix (CHKP-02)

| Element | Direction=up (warning) | Direction=down (success) |
|---------|------------------------|--------------------------|
| Outer bg | `bg-status-warning-bg` | `bg-status-success-bg` |
| Outer border | `border-status-warning/20` | `border-status-success/20` |
| Icon container bg | `bg-status-warning/10` | `bg-status-success/10` |
| Icon color | `text-status-warning` | `text-status-success` |
| Headline text | `text-status-warning` | `text-status-success` |
| Body text | `text-text-muted` (both) | `text-text-muted` (both) |
| Old price | `text-text-muted line-through` | `text-text-muted line-through` |
| Arrow (→) | `text-text-muted` | `text-text-muted` |
| New price | `text-text-primary font-semibold` | `text-text-primary font-semibold` |
| "Update cart" CTA | `text-primary hover:underline` (link style, not button) | `text-primary hover:underline` |

**Icon choice:** `TrendingUp` from lucide for price up, `TrendingDown` for price down. Size: `w-4 h-4`, wrapped in `p-1.5 rounded-lg` container (mirrors existing `renderDirectionMismatch` at line 206).

### Reschedule Button Color (CHKP-04)

**Default:** `<Button variant="primary" size="md">` — inherits app primary red. No custom palette.

**Rationale:** Three actions, increasing commitment, **only ONE primary visible at any time** — the reschedule button replaces "Browse Menu" as the visual primary because it's the most helpful recovery path. "Browse Menu" downgrades to `<Button variant="outline" size="md">` when reschedule is available, so two outline buttons flank one primary. When `rescheduleOption` is undefined, the original "Got it" outline + "Browse Menu" primary configuration is preserved (backward compat per CONTEXT D-29).

| rescheduleOption | "Got it" | "Reschedule to …" | "Browse Menu" |
|------------------|----------|-------------------|---------------|
| present | outline | **primary** | outline |
| absent (existing) | outline | *(not rendered)* | **primary** |

### Destructive

Phase 111 has **no destructive actions**. No "Delete", no "Clear cart", no "Cancel order". Destructive palette (`text-destructive`) is not used.

### Focus Indicators

All interactive elements in Phase 111 MUST inherit the existing focus ring style (`--shadow-focus` / `ring-2 ring-ring ring-offset-2` via shadcn Button primitive). **Do not override.**

---

## Copywriting Contract

Phase 111 introduces 6 user-visible strings. **Every English string gets a Burmese companion** (existing CutoffModal precedent, CONTEXT D-40). Burmese strings are marked with `// BURMESE-REVIEW` for native-speaker sign-off before ship.

### CHKP-04 — Cutoff Modal Reschedule Button

| Element | Copy | Locale | Notes |
|---------|------|--------|-------|
| Primary CTA | `Reschedule to {displayDate}` | en | `{displayDate}` interpolates from `getNextDeliveryDate()` — format: `"Saturday, April 11"` |
| Primary CTA subtext | `{displayDate} သို့ ပြောင်းမည်` | my | BURMESE-REVIEW — optional second line or tooltip; do not clutter button. Default: omit from button face, add as `aria-label` suffix instead |
| Post-click toast | *(none)* | — | Reschedule is visually obvious (modal closes, step advances to time). No confirmation toast. |

**Button accessibility:**
- `aria-label="Reschedule your delivery to {displayDate}"` — explicit verbose label for screen readers
- `disabled` when `rescheduleOption` is null OR when click handler is mid-flight (defense-in-depth per Phase 110 D-07)

**Degradation:** When `rescheduleOption` is `undefined` (no active delivery days), button is NOT rendered — modal falls back to the existing two-action layout. No empty button, no disabled ghost.

### CHKP-02 — Price Change Banner

| Element | Copy | Locale | Notes |
|---------|------|--------|-------|
| Headline (direction up) | `Heads up — prices changed` | en | Conversational, not alarming |
| Headline (direction down) | `Good news — prices dropped` | en | Positive framing for price decreases |
| Headline (Burmese, up) | `သတိပြုပါ — စျေးနှုန်း ပြောင်းလဲသွားပါသည်` | my | BURMESE-REVIEW |
| Headline (Burmese, down) | `သတင်းကောင်း — စျေးနှုန်း လျှော့ချသွားပါသည်` | my | BURMESE-REVIEW |
| Body intro | `Since you added items to your cart:` | en | Single line, then price rows |
| Per-item line | `{itemName}: {oldPrice} → {newPrice}` | en | Old price `line-through`, new price `font-semibold`. Example: `Tea Leaf Salad: $12.00 → $13.50` |
| Multi-item summary (≥ 3 items) | `{N} items changed price. Review and update your cart.` | en | When list gets long, collapse detail to summary + expand affordance is **out of scope** — always render all items (typical case: 1-3 items, per research §2) |
| Update CTA | `Update cart` | en | **Link style** (`text-primary hover:underline`), NOT a button. Matches existing banner CTA pattern. Click dismisses banner and navigates to `/cart`. |
| Update CTA (Burmese) | `ဈေးခြင်း ပြင်ဆင်ရန်` | my | BURMESE-REVIEW |
| Dismissibility | Banner is **not dismissable** until "Update cart" is clicked OR customer resolves the price mismatch in cart | — | Per CONTEXT D-16: persistent, not toast |

**Tone rules:**
- Never use "Error", "Warning", "Alert", "Invalid", "Rejected", "Violation"
- Never use ALL CAPS for emphasis
- Use dash-led casual openings ("Heads up — …", "Good news — …") to feel like a helpful shopkeeper, not a system notification
- Never announce the price-change with sound, vibration, or modal takeover — it's a calm, persistent notice

### CHKP-01 — Inline Validation Error Messages

| Field | Existing error copy (no change) | Notes |
|-------|--------------------------------|-------|
| Address line 1 | `Street address is required` | Inherited from `addressFormSchema` |
| City | `City is required` | Inherited |
| State | `Use a 2-letter state code` | Inherited |
| ZIP | `Enter a valid 5-digit ZIP code` | Inherited |
| Phone | `Enter a valid phone number` | Inherited |
| Name | `Name is required` | Inherited |

**Phase 111 rule:** Do **NOT** rewrite existing Zod error messages. CHKP-01 is a state-machine change only (`mode: "onTouched"`). The messages, visuals, shake animation, and success checkmark are all inherited from Phase 110 / v1.9 `<ValidatedInput>` wiring.

**Timing behavior** (the actual CHKP-01 change):
- **First keystroke:** no error shown (field untouched)
- **First blur:** validate once → show error if invalid
- **After first blur:** re-validate on every keystroke → error updates in real time as user types

### CFIX-07 / CFIX-09 / CHKP-03 — Silent Fixes

No user-visible strings. No toast, no banner, no modal.

- **CFIX-07:** Form persistence is invisible — customer just sees their data still there after Stripe retry.
- **CFIX-09:** Polling is silent background work; only surface is the banner defined in CHKP-02.
- **CHKP-03:** Prefetch is silent. No loading indicator, no spinner, no "Loading…" text (per CONTEXT D-25).

### Forbidden Copy (Phase 111 must NOT ship)

| Forbidden | Why | Use instead |
|-----------|-----|-------------|
| `Error: Price has changed` | Alarming, system-speak | `Heads up — prices changed` |
| `Click to retry` | Redundant imperative | Existing banner `Try Again` |
| `Loading…` during prefetch | Prefetch is invisible | *(nothing)* |
| `Price mismatch detected` | Technical | `Since you added items to your cart…` |
| `Reschedule?` (question mark) | Soft, unclear | `Reschedule to {date}` (imperative + specificity) |
| `Next available: {date}` inside button | Implicit action | `Reschedule to {date}` (verb first) |

### Destructive Confirmations

**None.** Phase 111 has no destructive flows.

---

## State Matrix

Phase 111 surfaces by state. Executor MUST render all of these.

### Price-Change Banner (`CheckoutErrorBanner` — PRICE_CHANGED case)

| State | Trigger | Visual |
|-------|---------|--------|
| **Hidden** | `priceChangedIds.length === 0` | Not rendered |
| **Single item, price up** | 1 item in `priceChangedIds`, `priceDirection: "up"` | Warning banner, 1 price row, "Update cart" CTA |
| **Single item, price down** | 1 item in `priceChangedIds`, `priceDirection: "down"` | Success banner, 1 price row, "Update cart" CTA |
| **Multi item, mixed directions** | Multiple items, mixed directions | Warning banner (safer default), N price rows each with its own color arrow, single "Update cart" CTA |
| **Banner dismissed** | Customer clicked "Update cart" | Banner unmounts → `AnimatePresence` exit → navigate to `/cart` |
| **Banner re-shown** | New price change detected after dismissal | Banner re-enters via `AnimatePresence` with `spring.default` |

### Cutoff Modal (`CutoffModal` — extended)

| State | Trigger | Visual |
|-------|---------|--------|
| **Legacy** (`rescheduleOption` undefined) | Phase 81 call sites, or no active delivery days | 2 actions: "Got it" (outline) + "Browse Menu" (primary) |
| **Reschedule available** | Phase 111 call site passes `rescheduleOption` | 3 actions: "Got it" (outline) + "Reschedule to {date}" (primary) + "Browse Menu" (outline) |
| **Reschedule clicked (mid-flight)** | User clicks reschedule, handler is executing | Reschedule button `disabled`, cursor wait, no spinner (action is synchronous store mutation — no async UI needed) |
| **After reschedule** | Handler completes | Modal closes, step advances to `"time"` — no toast, no confirmation |

### Inline Validation (3 RHF forms)

| State | Trigger | Visual |
|-------|---------|--------|
| **Untouched** | Fresh field, never blurred | Default `<ValidatedInput>` idle state — gray border, no icon |
| **Touched + valid** | Blurred once, currently valid | Green checkmark animation via `spring.snappy`, green border |
| **Touched + invalid** | Blurred once, currently invalid | Red shake (`ErrorShake`), red border, error message slides in below field |
| **Focused while invalid** | User is actively fixing error | Error message remains visible, border stays red, updates on each keystroke |
| **Fixed while focused** | Error resolved without blurring | Error message slides out, border transitions to green, checkmark appears |

---

## Animation / Motion Contract

Phase 111 introduces **zero new keyframes, zero new springs, zero new durations.** All motion composes from Phase 110 tokens.

| Surface | Motion | Token | Source |
|---------|--------|-------|--------|
| PRICE_CHANGED banner enter | Opacity 0→1, scale 0.95→1, y -10→0 | `spring.default` (300/22/0.8) via `useAnimationPreference().getSpring()` | Mirrors existing banner pattern (CheckoutErrorBanner.tsx:182-186) |
| PRICE_CHANGED banner exit | Reverse of enter, wrapped in `<AnimatePresence>` | `spring.default` | Same |
| Banner shake on error | Wrapped in existing `<ErrorShake shake={!!error}>` | `spring.snappy` (600/35/1) | Existing line 181 |
| Reschedule button hover | Inherited from `<Button variant="primary">` primitive | `duration-200 ease-out` | shadcn Button variants |
| Reschedule button active/press | Inherited | `duration-100 ease-out` | shadcn Button variants |
| Modal entrance | Existing `<Modal>` primitive — no change | Existing modal spring | `src/components/ui/Modal` |
| Modal exit on reschedule click | Default modal exit — no custom timing | Existing | Same |
| Inline validation shake | Existing `<ErrorShake>` | `spring.snappy` | `AddressFormV8.tsx:129` precedent |
| Inline validation success checkmark | Existing `<ValidatedInput showSuccess>` | `spring.snappy` | V8 component |
| Step prefetch | **Zero motion** | — | Prefetch is invisible (CONTEXT D-25) |

**Reduced motion:** Every `m.div` transition MUST pass through `getSpring(spring.X)` — when `prefers-reduced-motion: reduce` is set, `getSpring()` returns an instant `{ duration: 0 }` transition. Executor MUST verify this is already the wrapper in `CheckoutErrorBanner.tsx:186` and mirror the pattern for the new case.

**Forbidden:**
- New `@keyframes` declarations
- Raw `spring.default` / `spring.snappy` (must go through `getSpring()`)
- GSAP timelines in Phase 111 (scope is minimal — stick to Framer Motion `<m.div>`)
- Delay chains > 200ms (banner must appear immediately on detection)
- Bouncy overshoot (`spring.bouncy`) — not appropriate for error surfaces

---

## Component Inventory

### Components to EXTEND

| Component | Path | Change | Props diff |
|-----------|------|--------|------------|
| `CutoffModal` | `src/components/ui/delivery/CutoffModal.tsx` | Add reschedule button between existing actions | `+rescheduleOption?: { dateString: string; displayDate: string }`, `+onReschedule?: () => void` |
| `CheckoutErrorBanner` | `src/components/ui/checkout/CheckoutErrorBanner.tsx` | Add `case "PRICE_CHANGED"` + `renderPriceChange()` function | No prop change — consumes `error.details` |

### Components to CONSUME (no change)

| Component | Path | Usage |
|-----------|------|-------|
| `Button` | `src/components/ui/button.tsx` | Reschedule button (`variant="primary" size="md"`) |
| `Modal` | `src/components/ui/Modal` | `CutoffModal` wrapper — untouched |
| `ValidatedInput` | `src/components/ui/ValidatedInput` | Inline validation rendering — untouched |
| `ErrorShake` | `src/components/ui/error-shake` | Banner shake wrapper — untouched |
| `m` from `framer-motion` | `framer-motion` | Banner enter/exit via `<m.div>` — untouched |

### Components NOT TOUCHED

- `src/components/ui/Toast*` — PRICE_CHANGED is banner-only (CONTEXT D-16)
- `src/components/ui/AddressFormV8.tsx` visual layer — only `useForm` config changes
- `src/components/ui/PaymentStepV8.tsx` visual layer — only `useForm` config changes
- `src/components/ui/TimeStepV8.tsx` visual layer — only `useForm` config changes
- All driver, admin, and public route components — Phase 111 is customer checkout only

### Components to CREATE

**None.** Every UI piece in Phase 111 extends an existing component.

---

## Accessibility Contract

Phase 111 MUST NOT regress any a11y surface. Explicit checks:

### Keyboard
- **Reschedule button** reachable via tab order between "Got it" and "Browse Menu" in modal
- **"Update cart" CTA** in banner reachable via tab order; Enter key triggers navigation
- **Inline validation** — error messages are read aloud by screen readers on field blur (existing `<ValidatedInput>` handles via `aria-describedby` + `role="alert"`)

### Screen Reader
- Reschedule button `aria-label="Reschedule your delivery to {displayDate}"` (verbose, explicit)
- Price-change banner wrapped in `role="status"` `aria-live="polite"` (NOT `aria-live="assertive"` — don't interrupt screen reader flow for a price nudge)
- Banner icon is `aria-hidden="true"` (decorative)

### Touch targets
- Reschedule button inherits `size="md"` → 44px minimum height on mobile (Phase 113 contract — do not break)
- "Update cart" link padding MUST ensure 44px touch target even though it's text-only (`py-2` minimum)

### Color contrast
- All banner text/background combinations use existing `status-warning` and `status-success` tokens which already pass WCAG AA (Phase 110 verified)
- **Do not introduce new hex values** that could fail contrast

### Motion
- All animations gated by `useAnimationPreference().shouldAnimate` — reduced-motion users see banner appear instantly without slide/scale

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official (new-york) | None added in Phase 111 (`Button`, `Modal`, `Input` already in codebase since v1.0) | not required |
| Third-party registries | **none** | not applicable |

**Phase 111 adds zero new registry components.** All work extends existing V8 components under `src/components/ui/**`.

---

## Open Questions & Assumptions

### Already resolved in CONTEXT.md (no action for executor)

- Polling cadence (3 min) — D-11
- Polling gate (cart non-empty) — D-12
- Banner vs toast (banner) — D-16
- Reschedule button placement (between "Got it" and "Browse Menu") — D-28
- Reschedule post-click navigation (step="time") — D-33
- RHF mode (`onTouched`) — D-07

### Deferred to executor judgment

| Question | Guidance |
|----------|----------|
| PaymentStepV8 phone/name inputs: RHF or plain? | **Read file first** per CONTEXT D-06. If plain, wire to RHF for consistency; do NOT half-migrate. |
| Single vs multi-item banner layout threshold | Always render all items inline. Multi-item summary collapse is **NOT in scope**. |
| Burmese copy for new strings | Use defaults in this spec but **mark with `// BURMESE-REVIEW` comment** per D-40. Ship default; native review before next prod deploy. |
| Reschedule button loading state during handler execution | None — handler is synchronous (Zustand store mutation). Do not add spinner. |

### Hard no — do NOT ship

- Dark-mode-only treatments (project supports both; no Phase 111 surface is dark-mode exclusive)
- New design tokens (research §15 confirms zero gaps)
- New `@keyframes`
- `aria-live="assertive"` on banner (rude interruption)
- Toast fallback for price changes (banner only — CONTEXT D-16)
- Spinner during prefetch (silent — CONTEXT D-25)
- `useToastV8` import for any critical message — use `useToast` only (CONTEXT D-34)

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS — all 6 user-visible strings specified, bilingual pattern preserved, forbidden copy listed, tone rules explicit
- [ ] Dimension 2 Visuals: PASS — no new components, extends 2 existing surfaces, inherits all motion from Phase 110 tokens
- [ ] Dimension 3 Color: PASS — zero new hex values, status-warning / status-success / primary tokens only, 60/30/10 split honored, accent reserved list explicit
- [ ] Dimension 4 Typography: PASS — exactly 4 sizes (12/14/16/20), 2 weights (500/600), bilingual Burmese companion rule locked
- [ ] Dimension 5 Spacing: PASS — Tailwind v4 default spacing scale, existing modal/banner rhythms preserved, zero new spacing values
- [ ] Dimension 6 Registry Safety: PASS — no new registry blocks, no third-party registries, shadcn official already installed

**Approval:** pending (awaiting gsd-ui-checker verification)

---

## Executor Quick Reference

**If an executor is implementing a Phase 111 task, these are the exact token strings to use:**

```tsx
// Price-change banner (warning/up)
className="rounded-xl border border-status-warning/20 bg-status-warning-bg p-4"

// Price-change banner (success/down)
className="rounded-xl border border-status-success/20 bg-status-success-bg p-4"

// Icon container (warning)
<div className="p-1.5 rounded-lg bg-status-warning/10">
  <TrendingUp className="w-4 h-4 text-status-warning" />
</div>

// Icon container (success)
<div className="p-1.5 rounded-lg bg-status-success/10">
  <TrendingDown className="w-4 h-4 text-status-success" />
</div>

// Price row
<div className="flex items-center gap-2 text-sm">
  <span className="text-text-muted line-through">{formatCents(oldPriceCents)}</span>
  <span className="text-text-muted">→</span>
  <span className="font-semibold text-text-primary">{formatCents(newPriceCents)}</span>
</div>

// Update cart CTA (link-style)
<button
  type="button"
  onClick={onUpdateCart}
  className="text-sm font-medium text-primary hover:underline"
>
  Update cart
</button>

// Reschedule button (modal)
<Button variant="primary" size="md" onClick={onReschedule} className="sm:min-w-[160px]">
  Reschedule to {rescheduleOption.displayDate}
</Button>

// "Browse Menu" downgrade when reschedule present
<Button variant="outline" size="md" asChild className="sm:min-w-[140px]">
  <Link href="/menu" onClick={onClose}>Browse Menu</Link>
</Button>

// Banner motion wrapper (mirrors existing line 182-186)
<m.div
  initial={shouldAnimate ? { opacity: 0, scale: 0.95, y: -10 } : undefined}
  animate={shouldAnimate ? { opacity: 1, scale: 1, y: 0 } : undefined}
  exit={shouldAnimate ? { opacity: 0, scale: 0.95, y: -10 } : undefined}
  transition={getSpring(spring.default)}
>
```

**Phase 111 UI-SPEC complete.**
