/**
 * Client-only error codes surfaced by Phase 110/111 fixes (D-33, D-21).
 *
 * Server emits ~10 codes (VALIDATION_ERROR, CUTOFF_PASSED, STRIPE_ERROR, etc.)
 * via /api/checkout/session/route.ts. The codes below are NOT emitted by the
 * server — they are surfaced client-side.
 *
 * Phase 110 additions:
 * - CHECKOUT_NETWORK_TIMEOUT (CFIX-04) — Stripe session fetch AbortController fires
 * - CART_VALIDATION_TIMEOUT (CFIX-05) — cart validation menu refetch AbortController fires
 *
 * Phase 111 additions:
 * - PRICE_CHANGED (CHKP-02 / D-21) — emitted client-side when
 *   `useCartValidation.priceChangedIds` is non-empty. Routed to
 *   CheckoutErrorBanner case "PRICE_CHANGED" for old-vs-new transparency.
 *
 * Centralizing here prevents typos and makes them grep-discoverable across
 * the codebase.
 */
export const ClientErrorCodes = {
  CHECKOUT_NETWORK_TIMEOUT: "CHECKOUT_NETWORK_TIMEOUT",
  CART_VALIDATION_TIMEOUT: "CART_VALIDATION_TIMEOUT",
  /** Phase 111 CHKP-02 — Emitted client-side when useCartValidation.priceChangedIds is non-empty. Routed to CheckoutErrorBanner case "PRICE_CHANGED" for old-vs-new transparency (not auto-dismiss). */
  PRICE_CHANGED: "PRICE_CHANGED",
} as const;

export type ClientErrorCode = (typeof ClientErrorCodes)[keyof typeof ClientErrorCodes];
