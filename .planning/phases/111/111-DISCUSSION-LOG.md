# Phase 111: Checkout Conversion - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the analysis path.

**Date:** 2026-04-07
**Phase:** 111-checkout-conversion
**Mode:** auto (--auto)
**Source of decisions:** 12-agent precontext research (`111-PRECONTEXT-RESEARCH.md`) + enhancement recommendations (`111-ENHANCEMENT-RECOMMENDATIONS.md`)

**Areas analyzed:** Form Persistence, Inline Validation, Menu Polling, Price Change Surface, Step Prefetch, Cutoff Reschedule, Toast Hook Discipline, Implementation Order

---

## Form Persistence (CFIX-07)

| Option | Description | Selected |
|--------|-------------|----------|
| (A) Keep sessionStorage (Phase 110 default) | Already in place; covers same-tab Stripe redirect; auto-purges on tab close; ~1.3KB | ✓ |
| (B) IndexedDB | More capacity but no benefit at 1.3KB; cross-tab persistence is a leak risk | |
| (C) localStorage | Survives tab close — leaks across users on shared devices | |
| (D) URL params | Not viable for 13 fields including PII | |

**Choice:** (A) — verify with test, no code change.
**Open risk:** `CheckoutClient.tsx:159-161` `useEffect(() => () => reset())` may clear sessionStorage on Stripe redirect. Investigate FIRST in plan.

---

## Inline Validation (CHKP-01)

| Option | Description | Selected |
|--------|-------------|----------|
| `onSubmit` (current default) | Only validates on submit — IS the bug | |
| `onBlur` | Validates only on blur; user can't tell mid-typing if fix is working | |
| `onChange` | Validates on every keystroke — flashes "Required" on first character | |
| `onTouched` | Silent until first blur, then reactive on every keystroke after | ✓ |
| `all` | Equivalent to onTouched but more re-renders | |

**Choice:** `onTouched` — RHF docs canonical pattern for "as user types after first interaction".
**Scope:** All 3 checkout forms (Address, Time contact, Payment contact). Verify PaymentStepV8 RHF usage during planning.

---

## Menu Polling Cadence (CFIX-09)

| Option | Description | Selected |
|--------|-------------|----------|
| 2 min | Aggressive end of range; minor bandwidth bump | |
| 3 min | Middle of 2-5 range; ~6.6KB/s peak; catches admin edits within minutes | ✓ |
| 5 min | Conservative end; risks customer committing to stale price | |
| Variable (backoff) | Over-engineered for 1-5 concurrent customers | |

**Choice:** 3 min — `MENU_POLL_INTERVAL_MS = 3 * 60 * 1000`.

## Menu Polling Gate

| Option | Description | Selected |
|--------|-------------|----------|
| (A) Always on | Wastes bandwidth on `/menu` browsing (already viewing fresh data) | |
| (B) Cart non-empty | Customer committed; price changes actionable; catches pre-checkout review | ✓ |
| (C) Checkout step only | Misses pre-cart-review changes; narrower than requirement | |

**Choice:** (B) — cart non-empty selector via `useCartStore((s) => s.items.length > 0)`.
**Mechanism:** TanStack Query `refetchInterval` (NOT manual `refetch()`) — required to satisfy "periodically refetches" wording.

---

## Price Change Surface (CHKP-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Banner only (CheckoutErrorBanner case) | Persistent; forces acknowledgment; reuses direction-mismatch render pattern | ✓ |
| Toast only | Auto-dismisses after 5s — customer can miss critical info | |
| Both | Redundant noise | |

**Choice:** Banner only via `CheckoutErrorBanner` `PRICE_CHANGED` case.

## Price Change Data Source

| Option | Description | Selected |
|--------|-------------|----------|
| Add `priceSnapshot` field to CartItem | Schema change; new persistence | |
| Use existing live comparison | `useCartValidation.ts:106` already compares stored vs live; cart item IS the snapshot | ✓ |

**Choice:** Existing live comparison — zero new schema, zero data plumbing.
**Error code home:** `ClientErrorCodes` enum (Phase 110 D-33 precedent).

---

## Step Prefetch (CHKP-03)

| Option | Description | Selected |
|--------|-------------|----------|
| (A) On step change `useEffect` | User committed to advancing; effect fires after render; natural prefetch window | ✓ |
| (B) On step focus | More speculative; fires before commit | |
| (C) On render of next button | Speculative when user is mid-typing | |

**Choice:** (A) — `useEffect(() => { if (step === "address") prefetch menu; if (step === "time") prefetch addresses }, [step])`.

## Prefetch Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Menu (during address) + Profile (during time) | Heaviest payloads; commonly stale; aligns with step needs | ✓ |
| All steps prefetch all data | Wasteful; payment is terminal | |
| No prefetch on payment step | Terminal step; no downstream data | (implicit ✓) |

**Choice:** Menu during address, profile/addresses during time. No prefetch on payment.
**Hook usage:** `useQueryClient()` ONLY — never import `queryClient` ref from provider.

---

## Cutoff Reschedule (CHKP-04)

## Reschedule Auto-Advance Target

| Option | Description | Selected |
|--------|-------------|----------|
| (a) Just set delivery + close modal | Doesn't move customer forward | |
| (b) Set delivery + advance to time step | Customer reviews new window before re-committing to payment | ✓ |
| (c) Set delivery + advance to payment | Skips time review; risky if window auto-pick is wrong | |

**Choice:** (b) — `setDelivery() → setStep("time") → close modal`.

## Reschedule Button Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Primary, between "Got it" and "Browse Menu" | Three actions, increasing commitment left→right; "Got it" stays for bail | ✓ |
| Above other actions | Pushes existing actions down; visual disruption | |
| Replace "Browse Menu" | Loses browse path | |

**Choice:** Primary, middle position.
**Backward compatibility:** `rescheduleOption` is optional prop — modal degrades when undefined (no active delivery days).
**Date computation:** `getNextDeliveryDate(now, deliveryDays)` from `delivery-dates.ts:231` (Phase 106 timezone-correct).
**Time window auto-pick:** First active window of new day's `dayConfig`.

---

## Toast Hook Discipline

| Option | Description | Selected |
|--------|-------------|----------|
| `useToast` (Phase 110 D-32) | Has `persistent` flag; correct for critical errors | ✓ |
| `useToastV8` | No `persistent` flag; toast-then-vanish anti-pattern | |

**Choice:** `useToast` for any Phase 111 toast usage. PRICE_CHANGED uses banner not toast (covered above).

---

## Implementation Order

| Order | Reasoning |
|-------|-----------|
| Pre-flight: D-03 reset() audit | Highest open risk; resolve before all else |
| 1. CHKP-04 reschedule | Most isolated; highest UX leverage; modal extension only |
| 2. CFIX-07 form persistence test | Verify what already works; lock contract |
| 3. CHKP-01 RHF onTouched | One-line × 3 forms |
| 4. CFIX-09 + CHKP-02 (paired) | Refetch detects → banner displays; tightly coupled |
| 5. CHKP-03 prefetch | Sugar; do last |

**Reasoning:** Goal-backward dependency analysis from `111-PRECONTEXT-RESEARCH.md §1.2`.

---

## Auto-Resolved (--auto mode)

All 14 gray areas auto-resolved with HIGH confidence — research artifacts already encoded the decisions. No corrections needed; no Unclear items.

| Area | Auto-resolution source |
|------|------------------------|
| CFIX-07 storage strategy | Research §9 architectural decisions table |
| CFIX-07 reset() audit | Research §16 open question #1 (highest priority) |
| CHKP-01 RHF mode | Research §4 + §11 gray area resolutions |
| CFIX-09 polling cadence | Research §9 — middle of 2-5 range |
| CFIX-09 polling gate | Research §9 + §11 — cart non-empty only |
| CFIX-09 refetch mechanism | Research §11 — refetchInterval not manual |
| CHKP-02 banner vs toast | Research §9 — banner only |
| CHKP-02 data source | Research §9 — existing live comparison |
| CHKP-03 prefetch trigger | Research §9 — on step change useEffect |
| CHKP-03 prefetch scope | Research §9 — menu + profile, no payment |
| CHKP-04 reschedule navigation | Research §9 — setDelivery + setStep("time") + close |
| CHKP-04 button placement | Research §9 — primary middle of three |
| PRICE_CHANGED error code home | Research §11 — ClientErrorCodes enum |
| Toast hook choice | Research §11 — useToast (not V8) |

---

## External Research

None required — 12-agent precontext research was exhaustive. All gray areas resolved to HIGH confidence in Wave 2.

---

## Corrections Made

None — auto mode, no Unclear items.

---

## Deferred Ideas Captured

- Push notifications for price changes → Phase v2.4 NOTF-01
- `/menu` page price-change toast → Phase 116 (UXPL polish)
- Optimistic cart "Update cart" click → Phase 115 (DATA-01)
- Skeleton during prefetch → Phase 114 (LOAD)
- Burmese native-speaker review → owner coordination, not code
- Storybook visual regression baselines → project-wide deferred from v1.9
- `useToast` / `useToastV8` consolidation → design system refactor (out of scope per REQUIREMENTS.md)
