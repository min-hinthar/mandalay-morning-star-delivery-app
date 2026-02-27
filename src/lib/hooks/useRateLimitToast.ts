/**
 * Client-side 429 rate limit response handler with toast notifications.
 *
 * NOT a React hook (no useState/useEffect). Named with `use` prefix to match
 * project convention for toast-related utilities in lib/hooks/.
 *
 * @example
 * const response = await fetch("/api/endpoint");
 * if (handleRateLimitResponse(response)) return; // shows toast, stops processing
 */
import { toast } from "@/lib/hooks/useToastV8";

interface RateLimitContext {
  /** Show reassuring "order is being processed" message instead of generic 429 */
  isOrderPlacement?: boolean;
}

/**
 * Check if response is a 429 rate limit and show appropriate toast.
 *
 * @returns `true` if rate limited (caller should stop processing), `false` otherwise
 */
export function handleRateLimitResponse(response: Response, context?: RateLimitContext): boolean {
  if (response.status !== 429) return false;

  if (context?.isOrderPlacement) {
    toast({
      message: "Your order is being processed. Please don't submit again.",
      type: "warning",
    });
  } else {
    toast({
      message: "Please wait a moment and try again.",
      type: "error",
    });
  }

  return true;
}
