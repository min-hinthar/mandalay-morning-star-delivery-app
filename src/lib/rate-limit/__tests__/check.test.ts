import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Ratelimit } from "@upstash/ratelimit";

// Mock logger
vi.mock("@/lib/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { logger } from "@/lib/utils/logger";
import { checkRateLimit, checkServerActionRateLimit } from "@/lib/rate-limit/check";
import type { AppRateLimiter } from "@/lib/rate-limit/client";
import type { RateLimitTier } from "@/lib/rate-limit/config";
import { parseDurationMs } from "@/lib/rate-limit/config";

// ---- Helpers ----

function makeMockLimiter(tier: RateLimitTier = "api-write", max = 10, windowMs = 60_000) {
  const mockLimit = vi.fn();
  return {
    limiter: {
      redis: { limit: mockLimit } as unknown as Ratelimit,
      tier,
      max,
      windowMs,
    } satisfies AppRateLimiter,
    mockLimit,
  };
}

/** A tier-tagged limiter with no Redis — the per-tier fallback path. */
function fallbackLimiter(tier: RateLimitTier, max: number, windowMs: number): AppRateLimiter {
  return { redis: null, tier, max, windowMs };
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

// ---- Per-tier fallback (tier-tagged limiter without Redis) ----

describe("per-tier in-memory fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("strict tier keeps its own max: checkout (3/m) blocks on the 4th request", async () => {
    const opts = {
      ...baseOpts,
      limiter: fallbackLimiter("checkout", 3, 60_000),
      identifier: "tier-checkout-user",
    };

    for (let i = 0; i < 3; i++) {
      const r = await checkRateLimit(opts);
      expect(r.limited).toBe(false);
    }
    const blocked = await checkRateLimit(opts);
    expect(blocked.limited).toBe(true);
  });

  it("strict tier keeps its own WINDOW: feedback-anon (3/10m) Retry-After reflects the 10-minute window", async () => {
    const opts = {
      ...baseOpts,
      limiter: fallbackLimiter("feedback-anon", 3, 600_000),
      identifier: "tier-feedback-user",
    };

    for (let i = 0; i < 3; i++) {
      await checkServerActionRateLimit(opts);
    }
    const blocked = await checkServerActionRateLimit(opts);
    expect(blocked.limited).toBe(true);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(500);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(600);
  });

  it("loose tier is clamped at the ceiling: admin (120/m) still blocks on the 16th request", async () => {
    const opts = {
      ...baseOpts,
      limiter: fallbackLimiter("admin", 120, 60_000),
      identifier: "tier-admin-user",
    };

    for (let i = 0; i < 15; i++) {
      const r = await checkRateLimit(opts);
      expect(r.limited).toBe(false);
    }
    const blocked = await checkRateLimit(opts);
    expect(blocked.limited).toBe(true);
  });

  it("fallback buckets are keyed by TIER, not route — two routes on one tier share a bucket", async () => {
    const limiter = fallbackLimiter("checkout", 3, 60_000);
    const identifier = "tier-shared-bucket-user";

    for (let i = 0; i < 3; i++) {
      await checkRateLimit({ ...baseOpts, limiter, identifier, route: "route-a" });
    }
    const blocked = await checkRateLimit({ ...baseOpts, limiter, identifier, route: "route-b" });
    expect(blocked.limited).toBe(true);
  });

  it("Redis-throw fallback uses the tier params too", async () => {
    const { limiter, mockLimit } = makeMockLimiter("checkout", 3, 60_000);
    mockLimit.mockRejectedValue(new Error("Redis down"));
    const opts = { ...baseOpts, limiter, identifier: "tier-throw-user" };

    for (let i = 0; i < 3; i++) {
      const r = await checkRateLimit(opts);
      expect(r.limited).toBe(false);
    }
    const blocked = await checkRateLimit(opts);
    expect(blocked.limited).toBe(true);
  });

  it("per-tier window expiry: feedback-anon frees after 10 minutes, not 1", async () => {
    vi.useFakeTimers();
    try {
      const opts = {
        ...baseOpts,
        limiter: fallbackLimiter("feedback-anon", 3, 600_000),
        identifier: "tier-window-user",
      };

      for (let i = 0; i < 4; i++) {
        await checkRateLimit(opts);
      }
      expect((await checkRateLimit(opts)).limited).toBe(true);

      // one minute later: still blocked (10m window, unlike the generic 1m)
      vi.advanceTimersByTime(61_000);
      expect((await checkRateLimit(opts)).limited).toBe(true);

      // past the 10-minute window: allowed again
      vi.advanceTimersByTime(600_000);
      expect((await checkRateLimit(opts)).limited).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});

// ---- parseDurationMs ----

describe("parseDurationMs", () => {
  it("parses the window shapes the tier table uses", () => {
    expect(parseDurationMs("1 m")).toBe(60_000);
    expect(parseDurationMs("10 m")).toBe(600_000);
    expect(parseDurationMs("1 h")).toBe(3_600_000);
    expect(parseDurationMs("30 s")).toBe(30_000);
    expect(parseDurationMs("500 ms")).toBe(500);
    expect(parseDurationMs("1 d")).toBe(86_400_000);
    expect(parseDurationMs("2m")).toBe(120_000);
  });

  it("fails safe to one minute on junk", () => {
    expect(parseDurationMs("")).toBe(60_000);
    expect(parseDurationMs("soon")).toBe(60_000);
    expect(parseDurationMs("m 1")).toBe(60_000);
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

  it("all 14 exports are tier-tagged with live Redis when UPSTASH env vars are set", async () => {
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
      "feedbackAnonLimiter",
    ] as const;

    for (const name of exportNames) {
      const limiter = client[name];
      expect(limiter, `${name} should be exported`).toBeTruthy();
      expect(limiter.redis, `${name}.redis should not be null`).not.toBeNull();
      expect(limiter.tier, `${name}.tier should be set`).toBeTruthy();
      expect(limiter.max, `${name}.max should be positive`).toBeGreaterThan(0);
      expect(limiter.windowMs, `${name}.windowMs should be positive`).toBeGreaterThan(0);
    }
  });
});
