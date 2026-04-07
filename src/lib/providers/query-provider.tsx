"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Phase 110 CFIX-06 retry constants.
 *
 * Queries: 3 retries, exponential backoff capped at 30s.
 * Mutations: NEVER retry — risk of double-add cart, double-charge payment.
 * Filter: 5xx + 429 + network errors only. Never 401/403/4xx-other (those are user-actionable).
 *
 * Honors checkoutLimiter (3/1m) — backoff respects 429.
 */
const RETRY_BACKOFF_BASE_MS = 1000;
const RETRY_BACKOFF_MAX_MS = 30000;
const QUERY_RETRY_ATTEMPTS = 3;

interface RetryableError {
  status?: number;
}

/**
 * Exported for unit testing. NOT intended for direct consumer use.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= QUERY_RETRY_ATTEMPTS) return false;
  const status = (error as RetryableError | null)?.status ?? 0;
  // 5xx server errors, 429 rate limit, or network error (status 0)
  return status >= 500 || status === 429 || status === 0;
}

/**
 * Exported for unit testing.
 */
export function queryRetryDelay(attemptIndex: number): number {
  return Math.min(RETRY_BACKOFF_BASE_MS * 2 ** attemptIndex, RETRY_BACKOFF_MAX_MS);
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: shouldRetryQuery,
            retryDelay: queryRetryDelay,
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
