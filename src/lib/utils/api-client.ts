/**
 * Lightweight fetch wrapper with automatic 429 rate limit detection.
 *
 * Usage is opt-in: existing fetch calls are NOT refactored to use this.
 * Primary integration point is checkout flow (see PaymentStepV8).
 *
 * @example
 * const response = await apiFetch("/api/checkout/session", {
 *   method: "POST",
 *   body: JSON.stringify(data),
 *   isOrderPlacement: true, // shows reassuring 429 message
 * });
 */
import { handleRateLimitResponse } from "@/lib/hooks/useRateLimitToast";

interface ApiFetchOptions extends RequestInit {
  /** When true, 429 shows "Your order is being processed" instead of generic message */
  isOrderPlacement?: boolean;
}

/**
 * Fetch wrapper that detects 429 responses and shows toast notification.
 * Throws `Error("Rate limited")` when rate limited so callers can stop processing.
 */
export async function apiFetch(url: string, options?: ApiFetchOptions): Promise<Response> {
  const { isOrderPlacement, ...fetchOptions } = options ?? {};

  const response = await fetch(url, fetchOptions);

  if (handleRateLimitResponse(response, { isOrderPlacement })) {
    throw new Error("Rate limited");
  }

  return response;
}
