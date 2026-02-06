import { logger } from "@/lib/utils/logger";

const RETRY_DELAYS = [1000, 2000, 4000];

/**
 * Wraps a dynamic import with retry logic and exponential backoff.
 * NOT a React hook -- use inside `next/dynamic` factory functions.
 *
 * On each failure: logs to Sentry via logger.exception.
 * After final failure: throws so the calling error boundary can handle it.
 *
 * @example
 * const LazyChart = dynamic(
 *   () => importWithRetry(() => import("recharts"), "Recharts"),
 *   { ssr: false }
 * );
 */
export async function importWithRetry<T>(
  importFn: () => Promise<T>,
  componentName: string,
  maxRetries: number = 3
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await importFn();
    } catch (error) {
      lastError = error;

      logger.exception(error, {
        flowId: "dynamic-import",
        api: componentName,
        attempt: attempt + 1,
        maxRetries,
      });

      // If we have retries left, wait with exponential backoff
      if (attempt < maxRetries) {
        const delay = RETRY_DELAYS[attempt] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1];
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries exhausted -- throw for error boundary
  throw lastError;
}
