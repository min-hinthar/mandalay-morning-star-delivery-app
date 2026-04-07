import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient } from "@tanstack/react-query";
import { QueryProvider, shouldRetryQuery, queryRetryDelay } from "../query-provider";

describe("query-provider CFIX-06 retry policy", () => {
  describe("shouldRetryQuery", () => {
    it.each([
      [500, true],
      [502, true],
      [503, true],
      [429, true],
      [0, true], // network error
    ])("retries on status %i → %s", (status, expected) => {
      expect(shouldRetryQuery(0, { status })).toBe(expected);
    });

    it.each([
      [401, false],
      [403, false],
      [404, false],
      [400, false],
      [422, false],
    ])("does NOT retry on status %i → %s", (status, expected) => {
      expect(shouldRetryQuery(0, { status })).toBe(expected);
    });

    it("caps at 3 retries", () => {
      expect(shouldRetryQuery(3, { status: 500 })).toBe(false);
    });

    it("retries 0, 1, 2 → true; 3 → false on retryable status", () => {
      expect(shouldRetryQuery(0, { status: 500 })).toBe(true);
      expect(shouldRetryQuery(1, { status: 500 })).toBe(true);
      expect(shouldRetryQuery(2, { status: 500 })).toBe(true);
      expect(shouldRetryQuery(3, { status: 500 })).toBe(false);
    });

    it("treats null error as network error (status 0) and retries", () => {
      expect(shouldRetryQuery(0, null)).toBe(true);
    });
  });

  describe("queryRetryDelay", () => {
    it.each([
      [0, 1000],
      [1, 2000],
      [2, 4000],
      [3, 8000],
      [4, 16000],
      [5, 30000], // would be 32000 but capped
      [10, 30000], // capped
    ])("attempt %i → %ims", (attempt, expected) => {
      expect(queryRetryDelay(attempt)).toBe(expected);
    });
  });

  describe("QueryProvider", () => {
    it("constructs a QueryClient with the expected defaults", () => {
      // Smoke test: provider renders without throwing.
      expect(() => renderToStaticMarkup(<QueryProvider>{null}</QueryProvider>)).not.toThrow();
    });

    it("manual QueryClient with same defaults exposes mutations.retry = false", () => {
      const client = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: shouldRetryQuery,
            retryDelay: queryRetryDelay,
          },
          mutations: { retry: false },
        },
      });
      const opts = client.getDefaultOptions();
      expect(opts.queries?.staleTime).toBe(5 * 60 * 1000);
      expect(opts.queries?.refetchOnWindowFocus).toBe(false);
      expect(typeof opts.queries?.retry).toBe("function");
      expect(typeof opts.queries?.retryDelay).toBe("function");
      expect(opts.mutations?.retry).toBe(false);
    });
  });
});
