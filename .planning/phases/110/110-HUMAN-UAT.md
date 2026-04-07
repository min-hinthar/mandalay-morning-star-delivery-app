---
status: partial
phase: 110-critical-fixes-data-reliability
source: [110-VERIFICATION.md]
started: 2026-04-07T22:30:00Z
updated: 2026-04-07T22:30:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Mobile cart — no white flash on real device
expected: Navigating to /cart on an iPhone 12 viewport (390x844) shows CartPageContent immediately without any blank white frame between SSR paint and hydration. No React hydration mismatch warnings in the console.
result: [pending]
why_human: White flash is a visual timing artifact. The code contract (md:hidden / hidden md:block, no useEffect) is verified, but the subjective "no flash" experience requires a browser with throttled CPU to confirm.

### 2. Empty cart /checkout direct-link shows error UI instantly
expected: Navigate to /checkout with an empty cart (clear IDB first). EmptyCheckoutError renders immediately — no spinner, no redirect loop, no toast flash.
result: [pending]
why_human: The render-time guard is code-verified (if (isEmpty) return <EmptyCheckoutError />), but the visual experience (zero spinner frame visible) needs manual confirmation in a browser.

### 3. Cutoff modal disables submit + handler refuses keyboard Enter submission
expected: With the cutoff modal open, the Place Order button appears greyed-out and clicking it has no effect. Pressing Enter on a focused form input also does not trigger checkout. Zero /api/checkout/session network requests are fired.
result: [pending]
why_human: Defense-in-depth requires browser-level keyboard testing. HTML disabled + handler guard are code-verified, but keyboard bypass (Enter on focused input) must be confirmed by a human in a browser.

### 4. Stripe 10s timeout shows persistent error + Try Again
expected: Throttle the /api/checkout/session endpoint to >10s (via devtools network throttling or a test flag). The checkout UI shows a destructive error toast that does NOT auto-dismiss, plus an inline CheckoutErrorBanner with a Try Again button. Clicking Try Again resubmits with the same order.id (verify no duplicate in the DB).
result: [pending]
why_human: Requires network throttling or a test endpoint shim. The AbortController code and CHECKOUT_NETWORK_TIMEOUT branch are code-verified, but the actual timeout + toast + retry UX needs live testing.

### 5. Cart validation >30s shows CartValidationTimeoutBanner with Proceed Anyway
expected: Stall the cart validation refetch (throttle /api/menu to >30s). Both the cart page and cart drawer show the CartValidationTimeoutBanner with the warning icon and Proceed Anyway button. Clicking Proceed Anyway removes the banner and unblocks the checkout button.
result: [pending]
why_human: Requires a network throttling shim for the menu refetch. Banner wiring is code-verified in both CartPageContent and CartDrawer, but the 30s timeout + banner appearance + proceedAnyway dismissal needs a browser test.

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
