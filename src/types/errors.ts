/**
 * Client-only error codes surfaced by Phase 110 fixes (D-33).
 *
 * Server emits ~10 codes (VALIDATION_ERROR, CUTOFF_PASSED, STRIPE_ERROR, etc.)
 * via /api/checkout/session/route.ts. These two codes are NOT emitted by the
 * server — they are surfaced client-side when AbortController-based timeouts
 * fire for the Stripe session fetch (CFIX-04) or the cart validation menu
 * refetch (CFIX-05).
 *
 * Phase 111 will map these to specific recovery UI; centralizing here prevents
 * typos and makes them grep-discoverable across the codebase.
 */
export const ClientErrorCodes = {
  CHECKOUT_NETWORK_TIMEOUT: "CHECKOUT_NETWORK_TIMEOUT",
  CART_VALIDATION_TIMEOUT: "CART_VALIDATION_TIMEOUT",
} as const;

export type ClientErrorCode = (typeof ClientErrorCodes)[keyof typeof ClientErrorCodes];
