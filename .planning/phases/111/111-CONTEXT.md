# Phase 111: Checkout Conversion - Context

**Gathered:** 2026-04-07 (auto mode — assumptions resolved via 12-agent precontext research)
**Status:** Ready for planning

<domain>
## Phase Boundary

Eliminate checkout drop-off caused by payment errors and price/availability changes. Customers must complete checkout on first attempt without re-entering form data, with transparent in-flight feedback when prices or cutoffs shift. Surgical client-side fixes — no new tables, no new API routes, no new schemas.

**In scope (6 fixes):**
- CFIX-07: Checkout form state persists across payment errors
- CFIX-09: Menu periodically refetches (2-5 min) while cart non-empty
- CHKP-01: Address + payment forms show inline validation as user types
- CHKP-02: Price change alerts explain old vs new (not just "Dismiss")
- CHKP-03: Checkout prefetches next step's data while user fills current step
- CHKP-04: Cutoff modal one-click reschedule to next available delivery date

**Explicitly NOT in scope (other phases own):**
- Offline cart sync (CFIX-08) → Phase 114
- Tracking page audio mute (CFIX-10) → Phase 112
- Optimistic cart updates (DATA-01) → Phase 115
- Skeletons + offline menu cache → Phase 114
- Animation system guidelines → deferred to v2.4
- New design tokens — zero needed; all UI composes from Phase 110 primitives

</domain>

<decisions>
## Implementation Decisions

### Form Persistence (CFIX-07)
- **D-01:** Rely on existing `useCheckoutStore` `persist()` middleware (sessionStorage from Phase 110). All 13 form fields already covered by `partialize`. No store changes.
- **D-02:** Lock the contract with a Vitest integration test in `src/__tests__/checkout/form-persistence.test.tsx` that fills all 13 fields, mocks `STRIPE_ERROR`, asserts store still contains every field, simulates Retry, asserts `handleCheckout` re-fires with identical data.
- **D-03:** **MANDATORY pre-flight investigation** — read `CheckoutClient.tsx:159-161` `useEffect(() => () => reset(), [reset])`. Determine empirically whether unmount cleanup fires during same-tab `window.location.href = sessionUrl` Stripe redirect. If yes, gate the cleanup: `if (!window.location.href.includes("checkout.stripe.com")) reset()`. This is Phase 111's only open architectural risk.
- **D-04:** `step` stays unpersisted (intentional Phase 110 decision) — Stripe Retry path doesn't reload, so persistence is not needed for step.

### Inline Validation (CHKP-01)
- **D-05:** Add `mode: "onTouched"` to `useForm` in `AddressFormV8.tsx` (line 51) — single config change
- **D-06:** Apply `mode: "onTouched"` to `PaymentStepV8.tsx` phone/name forms IF they use RHF. If plain controlled inputs, wire them to RHF for consistency. Read the file during planning to confirm; do NOT half-migrate.
- **D-07:** Use `onTouched` (NOT `onChange` or `all`) — validates on first blur, then reactive on every keystroke. Matches "as user types" without flashing "Required" on first character.
- **D-08:** Existing `<ValidatedInput>` + `getFieldState` helper already render correct visual states. No new validation UI components.
- **D-09:** Form-level errors (server 422) still need `triggerShake()` on `handleSubmit` error callback — `onTouched` only covers field-level.

### Menu Polling (CFIX-09)
- **D-10:** Extend `useMenu()` with `pollWhileNonEmpty?: boolean` option. Subscribe to `useCartStore((s) => s.items.length > 0)` selector inside the hook.
- **D-11:** Polling cadence: **3 minutes** (`MENU_POLL_INTERVAL_MS = 3 * 60 * 1000`) — middle of 2-5 range; ~6.6KB/s peak load is negligible.
- **D-12:** Polling gate: **cart non-empty only**. Browsing `/menu` does NOT poll (already viewing fresh data). Pre-cart-review caught.
- **D-13:** Use TanStack Query `refetchInterval`, NOT manual `refetch()`. Required to satisfy "periodically refetches" wording. Deduplicates with manual `refetch()` automatically.
- **D-14:** Update `useCartValidation.ts` call site → `useMenu({ pollWhileNonEmpty: true })`. Leave `MenuClient.tsx` browsing call as default (no polling).

### Price Change Surface (CHKP-02)
- **D-15:** Add new `case "PRICE_CHANGED"` to `CheckoutErrorBanner.tsx` switch (line 91). Mirror direction-mismatch render pattern (lines 195-256).
- **D-16:** Surface = **persistent banner only** (NOT toast). Toasts auto-dismiss; price changes need acknowledgment.
- **D-17:** Data source: existing `useCartValidation` live comparison — `priceChangedIds`, `newPriceCents`, `priceDirection` already exposed. No new schema, no `priceSnapshot` field.
- **D-18:** Banner colors by direction: `bg-status-warning-bg` for `up`, `bg-status-success-bg` for `down`. Existing tokens — zero new tokens.
- **D-19:** Wire from `CheckoutClient.tsx`: render `<CheckoutErrorBanner>` with `PRICE_CHANGED` code when `useCartValidation.priceChangedIds.length > 0`.
- **D-20:** "Update cart" CTA dismisses banner + navigates to `/cart`. Banner re-shows on next price change detection.
- **D-21:** Add `PRICE_CHANGED: "PRICE_CHANGED"` to `ClientErrorCodes` const in `src/types/errors.ts` (Phase 110 D-33 precedent). Type-safe + grep-discoverable.

### Step Prefetch (CHKP-03)
- **D-22:** Add `useEffect` in `CheckoutClient.tsx` watching `step`. On `step === "address"` → prefetch `queryKeys.menu.list()`. On `step === "time"` → prefetch `queryKeys.addresses.list()`. No prefetch on `payment` (terminal step).
- **D-23:** Use `useQueryClient()` hook — NEVER import `queryClient` ref from `query-provider.tsx` (not exported; local `useState`).
- **D-24:** Prefetch must NOT use `void` pattern (Vercel kills fire-and-forget). Implicit promise return from useEffect callback is fine; `prefetchQuery` failure is benign.
- **D-25:** Prefetch is silent background work — no animation, no loading indicator. Failures swallow gracefully.
- **D-26:** Use Phase 110 query key factory keys exclusively — no inline arrays.

### Cutoff Reschedule (CHKP-04)
- **D-27:** Extend `CutoffModal.tsx` with optional `rescheduleOption?: { dateString: string; displayDate: string }` and `onReschedule?: () => void` props. Backward compatible — existing call sites unchanged.
- **D-28:** Render primary `"Reschedule to {displayDate}"` button BETWEEN existing "Got it" and "Browse Menu" actions. Three actions, increasing commitment left → right.
- **D-29:** Button hidden when `rescheduleOption` is undefined (e.g., no active delivery days configured) — modal degrades gracefully.
- **D-30:** Compute next delivery in `CheckoutClient.tsx` via `getNextDeliveryDate(now, deliveryDays)` from `src/lib/utils/delivery-dates.ts:231` — Phase 106 timezone-correct helper. NEVER use `getUTCDay()`.
- **D-31:** `onReschedule` handler MUST compose: `setDelivery({ date, windowStart, windowEnd })` → `setStep("time")` → `setShowCutoffModal(false)`. Missing any step breaks UX.
- **D-32:** Auto-select first active time window of new day's `dayConfig`. Customer can change in time step.
- **D-33:** Reschedule navigates to `step: "time"` (not `payment`) — customer reviews window before re-committing to payment.

### Toast Hook Discipline
- **D-34:** Any Phase 111 toast MUST import from `@/lib/hooks/useToast` (has `persistent` flag from Phase 110 D-32). NEVER `useToastV8` (no `persistent` flag → toast-then-vanish anti-pattern).
- **D-35:** PRICE_CHANGED uses banner not toast (D-16) — toast only as adjunct on `/menu` page (out of scope).

### Implementation Order (Goal-Backward)
- **D-36:** Sequence:
  1. **Pre-flight:** D-03 reset() on unmount investigation (highest risk; resolve before everything else)
  2. **CHKP-04** — reschedule button (most isolated, highest UX leverage)
  3. **CFIX-07** — form persistence test (verify what already works)
  4. **CHKP-01** — RHF onTouched flip (one-line × 3 forms)
  5. **CFIX-09** + **CHKP-02** — polling + banner (tightly coupled: refetch detects → banner displays)
  6. **CHKP-03** — step prefetch (sugar; do last)

### Cross-Cutting Rules
- **D-37:** All Phase 111 work is **client-side only** — zero new API routes, zero migrations, zero RPCs, zero schemas.
- **D-38:** All `useEffect` cleanups paired in return — `setTimeout`, `AbortController`, listeners, subscriptions. Phase 110 D-30 precedent.
- **D-39:** Use `useAnimationPreference().getSpring(spring.X)` for all motion — never raw `spring.X` (honor `prefers-reduced-motion`). Phase 111 reuses existing tokens; zero new keyframes.
- **D-40:** Burmese copy for new strings (reschedule button, PRICE_CHANGED header) marked with `// BURMESE-REVIEW` comment for native-speaker review before ship. Defaults provided in research §8 but require verification.

### Claude's Discretion
- Test split between Vitest unit and Playwright E2E for CFIX-07 — planner decides
- Storybook stories for new banner case + extended modal — include if time
- Plan split — research suggests 3 plans (Foundation+Reschedule / Polling+Price / Prefetch+E2E); planner can adjust

### Folded Todos
None — `gsd-tools todo match-phase 111` returned 0 results.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 111 Research Artifacts
- `.planning/phases/111/111-PRECONTEXT-RESEARCH.md` — 12-agent deep research: resolved gray areas, gotcha inventory (17 entries), file map, error code mappings, architectural decisions, cross-phase contracts
- `.planning/phases/111/111-ENHANCEMENT-RECOMMENDATIONS.md` — Priority matrix (MUST/SHOULD/NICE), implementation hints with code snippets, suggested 3-plan split

### Project Roadmap & Requirements
- `.planning/ROADMAP.md` §"Phase 111: Checkout Conversion" — phase goal, depends-on, success criteria
- `.planning/REQUIREMENTS.md` §"Critical Fixes" + §"Checkout Polish" — CFIX-07, CFIX-09, CHKP-01..04 acceptance criteria
- `.planning/PROJECT.md` §"Current Milestone: v2.3 Customer UX Quality" — milestone goal, target features

### Phase 110 Foundation (Inherited Contracts — MUST NOT BREAK)
- `.planning/phases/110/110-CONTEXT.md` — D-21..28 query key factory + retry config; D-31 no-void rule; D-32 useToast persistent flag; D-33 ClientErrorCodes
- `src/lib/queryKeys.ts` — Query key factory: `menu.list()`, `addresses.list()`, `orders.history()`. Phase 111 CHKP-03 + CFIX-09 MUST use these keys.
- `src/lib/providers/query-provider.tsx` — `shouldRetryQuery` predicate, `mutations: { retry: false }`. Phase 111 must NOT add `retry: true` to any mutation.
- `src/lib/stores/checkout-store.ts:113-128` — `partialize` covers 13 form fields. CFIX-07 verifies this contract.
- `src/components/ui/checkout/EmptyCheckoutError.tsx` — Phase 110 component; CHKP-03 prefetch must not run when cart empty.
- `src/lib/hooks/useToast.ts` — Persistent-capable toast. Phase 111 critical errors MUST import here, NOT `useToastV8.ts`.
- `src/types/errors.ts` — `ClientErrorCodes` enum home; CHKP-02 adds `PRICE_CHANGED`.

### Timezone Helpers (Phase 106 v2.2 Contracts)
- `src/lib/utils/delivery-dates.ts:231` — `getNextDeliveryDate(now, deliveryDays)` for CHKP-04 reschedule date computation
- `src/lib/utils/timezone.ts` — `getZonedDayOfWeek(TIMEZONE)`, `TIMEZONE` constant. NEVER use `getUTCDay()`.

### Hook Contracts (Existing — No Changes Needed)
- `src/lib/hooks/useCartValidation.ts` — Already exposes `priceChangedIds`, `newPriceCents`, `priceDirection`. CHKP-02 wires these to banner.
- `src/lib/hooks/useMenu.ts` — CFIX-09 extends with optional `pollWhileNonEmpty` arg.
- `src/components/ui/checkout/usePaymentSubmit.ts` — Stripe submit flow. CFIX-07 form-state survival exercised here.

### Project Conventions
- `CLAUDE.md` §"Gotchas" — `void asyncFn()` Vercel kill, `getUTCDay()` LA timezone bug, `loading="lazy"` opacity 0
- `.planning/codebase/CONVENTIONS.md` — File structure rules (400-line limit, barrel exports), `'use client'` requirements

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`useCheckoutStore` persist middleware** (`src/lib/stores/checkout-store.ts:105-128`) — sessionStorage with `partialize` covering 13 fields. CFIX-07 leverages as-is.
- **`<ValidatedInput>`** — Renders green checkmark / red shake / error message via `validationState` prop. CHKP-01 reuses entirely.
- **`getFieldState` helper** in `AddressFormV8.tsx` — Returns `'invalid' | 'valid' | 'idle'` from `errors + touchedFields + dirtyFields`. Wired to `<ValidatedInput>` already.
- **`CheckoutErrorBanner`** (`src/components/ui/checkout/CheckoutErrorBanner.tsx`) — Direction-mismatch renderer (lines 195-256) is the model for `renderPriceChange()`. Reuses `ErrorShake` + `spring.default` (300/22/0.8).
- **`CutoffModal`** (`src/components/ui/delivery/CutoffModal.tsx`) — Three-action layout pattern (`flex w-full flex-col gap-3 sm:flex-row sm:justify-center`). Bilingual copy precedent (English + Burmese). CHKP-04 extends additively.
- **`useCartValidation`** (`src/lib/hooks/useCartValidation.ts:106, 303-312`) — Live menu comparison already exposes `priceChangedIds`, `newPriceCents`, `priceDirection`. CHKP-02 needs zero new data plumbing.
- **`getNextDeliveryDate(now, deliveryDays)`** (`src/lib/utils/delivery-dates.ts:231`) — Returns next valid delivery respecting day-of-week + cutoff + direction. CHKP-04 calls directly.
- **Query key factory** (`src/lib/queryKeys.ts`) — Phase 110 D-25..28. CHKP-03 prefetch uses factory keys.
- **`useAnimationPreference().getSpring()`** — All Phase 111 motion wrapped through this for `prefers-reduced-motion` honor.

### Established Patterns
- **`mode: "onTouched"`** for RHF — canonical "validate after first interaction" pattern. RHF docs recommend this for inline validation.
- **`refetchInterval` gating via store selector** — `useCartStore((s) => s.items.length > 0)` flips polling on/off without re-renders. CFIX-09 uses this pattern.
- **Defense-in-depth disabled state** — Phase 110 D-07 pattern (HTML `disabled` + handler early return). CHKP-04 reschedule button follows same model.
- **`useQueryClient()` hook** for component-level prefetch/invalidation — never import `queryClient` ref.
- **Error code centralization** — `ClientErrorCodes` const enum in `src/types/errors.ts` (Phase 110 D-33). All client-side codes live here.
- **`AbortController` + cleanup in `useEffect` return** — Phase 110 D-15, D-30. CHKP-03 prefetch may need cleanup for slow networks.
- **Persistent toast for critical errors** — `useToast({ persistent: true })` from Phase 110 D-32. NEVER `useToastV8`.
- **Bilingual UI copy** — `CutoffModal.tsx:44-62` shows English + Burmese pattern. New strings follow same.

### Integration Points
- `src/app/(customer)/checkout/CheckoutClient.tsx` — Primary integration target: wires CutoffModal reschedule, step prefetch, PRICE_CHANGED banner, CFIX-07 reset() audit
- `src/components/ui/checkout/AddressFormV8.tsx:51` — `useForm` config, single-line CHKP-01 fix
- `src/components/ui/checkout/PaymentStepV8.tsx` — Phone/name input wiring; verify RHF usage
- `src/components/ui/checkout/CheckoutErrorBanner.tsx:91` — Switch case for new `PRICE_CHANGED`
- `src/components/ui/delivery/CutoffModal.tsx` — Add `rescheduleOption` + `onReschedule` props
- `src/lib/hooks/useMenu.ts` — Add `pollWhileNonEmpty` option + `useCartStore` subscription
- `src/lib/hooks/useCartValidation.ts` — Update `useMenu()` call site to opt into polling
- `src/types/errors.ts` — Add `PRICE_CHANGED` to `ClientErrorCodes`
- Tests at `src/__tests__/checkout/form-persistence.test.tsx` (new) + `src/components/ui/checkout/__tests__/PaymentStepV8.test.tsx` (extend) + `src/components/ui/checkout/__tests__/usePaymentSubmit.test.ts` (extend) + `src/app/(customer)/checkout/__tests__/CheckoutClient.test.tsx` (extend)

</code_context>

<specifics>
## Specific Ideas

- **Banner > toast for price changes** — toast vanishes; price changes need acknowledgment
- **Three actions in cutoff modal, increasing commitment left → right**: "Got it" (bail) → "Reschedule" (helpful) → "Browse Menu" (browse more)
- **Reschedule lands on time step, not payment** — give customer the chance to review the new window before re-committing
- **`onTouched`, not `onChange`** — silent on first character, reactive after first blur. Helpful, not nagging.
- **Polling gated on cart non-empty** — bandwidth-respectful, scope-correct
- **3 minutes is the polling sweet spot** — middle of the 2-5 range; admin price edits caught within ~3 min, ~6.6KB/s peak load is trivial
- **Prefetch is silent** — no spinner, no animation. Free background work during the address-step typing window (30-120s)
- **Burmese copy gets a `// BURMESE-REVIEW` comment** — consistent with project bilingual brand pattern
- **Highest open risk: `CheckoutClient.tsx:159-161` `reset()` on unmount** — investigate FIRST in plan, gate cleanup if needed

</specifics>

<deferred>
## Deferred Ideas

- **Push notifications for price changes** — service worker scope, not client polling. → Phase v2.4 NOTF-01
- **`/menu` page price-change toast** — Phase 111 scope is checkout flow only. → Phase 116 (UXPL polish)
- **Optimistic cart update on price change "Update cart" click** — Phase 115 (DATA-01) owns optimistic patterns
- **Skeleton loader during prefetch** — Phase 114 (LOAD) owns skeletons
- **Burmese native-speaker review** — coordinate with project owner, not in code scope
- **Storybook visual regression baselines** — deferred from v1.9; project-wide initiative
- **`useToast` / `useToastV8` consolidation** — design system refactor too broad for Phase 111 (REQUIREMENTS.md "Out of Scope")
- **Stripe idempotency code documentation comment** — captured as risk note in Phase 110

### Reviewed Todos (not folded)
None — todo match returned 0 results.

</deferred>

---

*Phase: 111-checkout-conversion*
*Context gathered: 2026-04-07*
