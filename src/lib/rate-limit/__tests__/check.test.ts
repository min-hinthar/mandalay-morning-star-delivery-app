import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Ratelimit } from "@upstash/ratelimit";

// Mock logger
vi.mock("@/lib/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { logger } from "@/lib/utils/logger";
import { checkRateLimit, checkServerActionRateLimit } from "@/lib/rate-limit/check";

// ---- Helpers ----

function makeMockLimiter() {
  const mockLimit = vi.fn();
  return {
    limiter: { limit: mockLimit } as unknown as Ratelimit,
    mockLimit,
  };
}

function successResponse(overrides?: Partial<{ limit: number; remaining: number; reset: number }>) {
  return {
    success: true,
    limit: overrides?.limit ?? 10,
    remaining: overrides?.remaining ?? 9,
    reset: overrides?.reset ?? Date.now() + 60000,
    pending: Promise.resolve(),
  };
}

function failureResponse(overrides?: Partial<{ limit: number; remaining: number; reset: number }>) {
  return {
    success: false,
    limit: overrides?.limit ?? 10,
    remaining: overrides?.remaining ?? 0,
    reset: overrides?.reset ?? Date.now() + 30000,
    pending: Promise.resolve(),
  };
}

const baseOpts = { identifier: "test-user", role: "anon" as const, route: "test-route" };

// ---- checkRateLimit ----

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns limited: false with rate limit headers on success", async () => {
    const { limiter, mockLimit } = makeMockLimiter();
    mockLimit.mockResolvedValue(successResponse({ limit: 10, remaining: 9 }));

    const result = await checkRateLimit({ ...baseOpts, limiter });

    expect(result.limited).toBe(false);
    if (!result.limited) {
      expect(result.headers["X-RateLimit-Limit"]).toBe("10");
      expect(result.headers["X-RateLimit-Remaining"]).toBe("9");
      expect(result.headers["X-RateLimit-Reset"]).toBeDefined();
    }
  });

  it("returns limited: true with 429 status and RATE_LIMITED code when over limit", async () => {
    const { limiter, mockLimit } = makeMockLimiter();
    mockLimit.mockResolvedValue(failureResponse());

    const result = await checkRateLimit({ ...baseOpts, limiter });

    expect(result.limited).toBe(true);
    if (result.limited) {
      expect(result.response.status).toBe(429);
      const body = await result.response.json();
      expect(body.error.code).toBe("RATE_LIMITED");
      expect(result.response.headers.get("Retry-After")).toBeDefined();
    }
  });

  it("falls back to in-memory when limiter is null -- allows first request", async () => {
    const result = await checkRateLimit({ ...baseOpts, limiter: null });

    expect(result.limited).toBe(false);
    if (!result.limited) {
      expect(result.headers).toEqual({});
    }
  });

  it("falls back to in-memory when limiter is null -- blocks after 16th request", async () => {
    // Use a unique identifier to avoid cross-test pollution
    const uniqueOpts = { ...baseOpts, limiter: null, identifier: "burst-test-user" };

    // First 15 should pass
    for (let i = 0; i < 15; i++) {
      const r = await checkRateLimit(uniqueOpts);
      expect(r.limited).toBe(false);
    }

    // 16th should be blocked
    const result = await checkRateLimit(uniqueOpts);
    expect(result.limited).toBe(true);
  });

  it("falls back to in-memory when Redis throws -- allows first request", async () => {
    const { limiter, mockLimit } = makeMockLimiter();
    mockLimit.mockRejectedValue(new Error("Redis connection failed"));

    const result = await checkRateLimit({
      ...baseOpts,
      limiter,
      identifier: "error-fallback-user",
    });

    expect(result.limited).toBe(false);
  });

  it("logs with flowId rate-limit-fallback on null limiter path", async () => {
    await checkRateLimit({
      ...baseOpts,
      limiter: null,
      identifier: "log-null-limiter-user",
    });

    // First request under limit -- no warn log emitted
    // Now exhaust the limit to trigger warn
    for (let i = 0; i < 16; i++) {
      await checkRateLimit({
        ...baseOpts,
        limiter: null,
        identifier: "log-null-limiter-user",
      });
    }

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("In-memory rate limit exceeded"),
      expect.objectContaining({ flowId: "rate-limit-fallback" })
    );
  });

  it("logs with flowId rate-limit on normal rate limit exceeded", async () => {
    const { limiter, mockLimit } = makeMockLimiter();
    mockLimit.mockResolvedValue(failureResponse());

    await checkRateLimit({ ...baseOpts, limiter });

    expect(logger.warn).toHaveBeenCalledWith(
      "Rate limit exceeded",
      expect.objectContaining({ flowId: "rate-limit" })
    );
  });
});

// ---- checkServerActionRateLimit ----

describe("checkServerActionRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns limited: false when under limit (Redis path)", async () => {
    const { limiter, mockLimit } = makeMockLimiter();
    mockLimit.mockResolvedValue(successResponse());

    const result = await checkServerActionRateLimit({ ...baseOpts, limiter });

    expect(result.limited).toBe(false);
    expect(result.retryAfterSeconds).toBeUndefined();
  });

  it("returns limited: true with retryAfterSeconds when over limit (Redis path)", async () => {
    const { limiter, mockLimit } = makeMockLimiter();
    mockLimit.mockResolvedValue(failureResponse({ reset: Date.now() + 30000 }));

    const result = await checkServerActionRateLimit({ ...baseOpts, limiter });

    expect(result.limited).toBe(true);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("falls back to in-memory when limiter is null -- allows first request", async () => {
    const result = await checkServerActionRateLimit({
      ...baseOpts,
      limiter: null,
      identifier: "sa-null-first",
    });

    expect(result.limited).toBe(false);
  });

  it("falls back to in-memory when limiter is null -- blocks with retryAfterSeconds: 60 after exceeding limit", async () => {
    const uniqueOpts = {
      ...baseOpts,
      limiter: null,
      identifier: "sa-null-burst",
    };

    for (let i = 0; i < 16; i++) {
      await checkServerActionRateLimit(uniqueOpts);
    }

    const result = await checkServerActionRateLimit(uniqueOpts);
    expect(result.limited).toBe(true);
    expect(result.retryAfterSeconds).toBe(60);
  });

  it("falls back to in-memory when Redis throws -- allows first request", async () => {
    const { limiter, mockLimit } = makeMockLimiter();
    mockLimit.mockRejectedValue(new Error("Redis connection failed"));

    const result = await checkServerActionRateLimit({
      ...baseOpts,
      limiter,
      identifier: "sa-error-fallback",
    });

    expect(result.limited).toBe(false);
  });

  it("logs with flowId rate-limit-fallback on null limiter and error paths", async () => {
    // Null limiter path -- exhaust to trigger warn
    for (let i = 0; i < 16; i++) {
      await checkServerActionRateLimit({
        ...baseOpts,
        limiter: null,
        identifier: "sa-log-null",
      });
    }
    await checkServerActionRateLimit({
      ...baseOpts,
      limiter: null,
      identifier: "sa-log-null",
    });

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("In-memory rate limit exceeded"),
      expect.objectContaining({ flowId: "rate-limit-fallback" })
    );

    vi.clearAllMocks();

    // Error path
    const { limiter, mockLimit } = makeMockLimiter();
    mockLimit.mockRejectedValue(new Error("Redis down"));

    await checkServerActionRateLimit({
      ...baseOpts,
      limiter,
      identifier: "sa-log-error",
    });

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("Redis rate limiter error"),
      expect.objectContaining({ flowId: "rate-limit-fallback" })
    );
  });
});

// ---- inMemoryRateLimit bucket expiry (via public API) ----

describe("inMemoryRateLimit (via public API)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("bucket expires after 60s -- request allowed again after window", async () => {
    const uniqueOpts = {
      ...baseOpts,
      limiter: null,
      identifier: "expiry-test-user",
    };

    // Exhaust the limit
    for (let i = 0; i < 16; i++) {
      await checkRateLimit(uniqueOpts);
    }

    // Should be blocked
    const blocked = await checkRateLimit(uniqueOpts);
    expect(blocked.limited).toBe(true);

    // Advance past the 60s window
    vi.advanceTimersByTime(61000);

    // Should be allowed again
    const allowed = await checkRateLimit(uniqueOpts);
    expect(allowed.limited).toBe(false);
  });
});

// ---- Limiter exports ----

describe("limiter exports", () => {
  const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  afterEach(() => {
    // Restore original env
    if (originalUrl) {
      process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    } else {
      delete process.env.UPSTASH_REDIS_REST_URL;
    }
    if (originalToken) {
      process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
    } else {
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    }
    vi.restoreAllMocks();
  });

  it("all 13 exports are non-null when UPSTASH env vars are set", async () => {
    // Mock with class-based constructors so `new Redis(...)` and `new Ratelimit(...)` work
    vi.doMock("@upstash/redis", () => {
      return {
        Redis: class MockRedis {
          ping() {
            return Promise.resolve("PONG");
          }
        },
      };
    });

    vi.doMock("@upstash/ratelimit", () => {
      class MockRatelimit {
        static slidingWindow() {
          return {};
        }
        limit() {
          return Promise.resolve({ success: true });
        }
      }
      return { Ratelimit: MockRatelimit };
    });

    // Set env vars before dynamic import
    process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";

    // Dynamic import to get fresh module evaluation with env vars set
    const client = await import("@/lib/rate-limit/client");

    const exportNames = [
      "authSignInLimiter",
      "authSignUpLimiter",
      "apiWriteLimiter",
      "publicReadLimiter",
      "driverLocationLimiter",
      "driverActionLimiter",
      "customerLimiter",
      "adminLimiter",
      "globalLimiter",
      "checkoutLimiter",
      "refundLimiter",
      "adminBulkLimiter",
      "webhookLimiter",
    ] as const;

    for (const name of exportNames) {
      expect(client[name], `${name} should not be null`).not.toBeNull();
    }
  });
});
