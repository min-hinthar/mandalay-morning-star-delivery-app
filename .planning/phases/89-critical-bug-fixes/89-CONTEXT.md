# Phase 89: Critical Bug Fixes - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix 7 known bugs in payment, checkout, cart, and cutoff logic. All bugs must be eliminated before building new features (Phases 90-95) on top. Requirements: BUG-01 through BUG-07.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

All 7 bug fixes are well-specified in REQUIREMENTS.md with clear success criteria. User delegated all implementation decisions to Claude. Key areas of discretion:

- **BUG-01 (Payment idempotency):** Idempotency key format and retry behavior. Requirement specifies `retry_${order.id}` — follow that pattern.
- **BUG-02 (Modifier validation):** Validation logic and error UX. Use inline error on the modifier group with clear message indicating min/max constraint. Disable checkout button when constraints violated.
- **BUG-03 (Cleanup rollback):** Error handling approach. Independent try/catch per resource with Sentry logging for partial failures. Silent to user — admin sees it in Sentry.
- **BUG-04 (RPC null handling):** Type safety approach. Handle null/error result gracefully with proper type guards instead of assertion.
- **BUG-05 (Refund ceiling):** Validation placement and error response. Server-side validation returning 400 with clear message.
- **BUG-06 (Cart race condition):** Approach choice between Zustand `set()` tracking and `useDebounce`. Claude picks best approach based on existing cart-store patterns.
- **BUG-07 (Cutoff safety buffer):** 10-second buffer implementation and rejection message. Show "Ordering has closed for this Saturday" — same as normal cutoff message. Buffer is invisible to customer.

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. All bugs have clear technical fixes documented in REQUIREMENTS.md success criteria.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/stores/cart-store.ts`: Cart store with `createItemSignature`, `shouldDebounce` helpers — BUG-06 fix goes here
- `src/app/api/checkout/session/route.ts`: Checkout session route — BUG-01, BUG-02, BUG-03, BUG-04 fixes here
- `src/app/api/admin/orders/[id]/refund/route.ts`: Refund endpoint — BUG-05 fix here
- `src/lib/utils/delivery-dates.ts` or `src/lib/hooks/useDeliveryGate.ts`: Cutoff logic — BUG-07 fix here
- `src/lib/validations/order.ts`: Existing order validation schemas — modifier validation may extend this

### Established Patterns
- Zod schemas with `.safeParse()` for validation (CONVENTIONS.md)
- API routes return `NextResponse.json()` with status codes
- Sentry for error tracking in production
- `console.warn` for dev-only warnings
- Test files co-located in `__tests__/` directories

### Integration Points
- Cart store (Zustand) — BUG-06 modifies core addItem logic
- Checkout session API route — BUG-01/02/03/04 modify checkout flow
- Refund API route — BUG-05 adds validation guard
- Delivery gate / cutoff utilities — BUG-07 adds safety margin
- Existing test files: `cart-store.test.ts`, `route.test.ts` for webhook — extend with new test cases

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 89-critical-bug-fixes*
*Context gathered: 2026-03-03*
