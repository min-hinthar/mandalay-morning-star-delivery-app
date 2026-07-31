import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

/**
 * Per-attempt request ceiling.
 *
 * sendEmail retries 3× with backoff, but the Resend call itself used to be
 * awaited with NO timeout — so one call's worst case was "30s of sleeps + 3 ×
 * unbounded latency". That can outlive a Vercel invocation and get the whole
 * thing killed mid-loop, which for the bulk cron means no summary line: no way
 * to tell a truncated run from a complete one. It could NOT be fixed by
 * lowering the cron's budget, because without a ceiling the duration has no
 * upper bound and no reserve is sufficient.
 *
 * The ceiling must behave as a RETRYABLE failure. A timed-out attempt may still
 * have been accepted by Resend, so the retry reuses the same idempotency key
 * and the `invalid_idempotent_request` handler covers the "the first one
 * actually landed" case.
 */

const sendMock = vi.fn();
const loggerMock = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), exception: vi.fn() };

vi.mock("../client", () => ({
  getResendClient: () => ({ emails: { send: sendMock } }),
}));

vi.mock("@react-email/render", () => ({
  render: vi.fn().mockResolvedValue("<p>rendered</p>"),
}));

vi.mock("@/lib/utils/logger", () => ({ logger: loggerMock }));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
          single: async () => ({ data: null, error: null }),
        }),
      }),
      insert: async () => ({ data: null, error: null }),
      update: () => ({ eq: async () => ({ data: null, error: null }) }),
    }),
  }),
}));

const { sendEmail } = await import("../send");
const { SEND_ATTEMPT_TIMEOUT_MS, MAX_RETRY_ATTEMPTS } = await import("../constants");

function options(extra: Record<string, unknown> = {}) {
  return {
    to: "customer@example.com",
    subject: "Subject",
    react: React.createElement("div"),
    type: "order_confirmation",
    orderId: "11111111-2222-3333-4444-555555555555",
    userId: "user-1",
    ...extra,
  } as Parameters<typeof sendEmail>[0];
}

/**
 * Stands in for Resend: hangs until the caller's AbortSignal fires, then
 * resolves the way the real SDK does. `fetchRequest` catches EVERYTHING and
 * returns a generic application_error, so an abort is indistinguishable from a
 * network failure at this boundary — which is exactly why sendEmail tracks its
 * own timedOut flag rather than reading the error.
 */
function hangUntilAborted() {
  return vi.fn((_payload: unknown, opts?: { signal?: AbortSignal }) => {
    return new Promise((resolve) => {
      opts?.signal?.addEventListener("abort", () =>
        resolve({
          data: null,
          error: {
            name: "application_error",
            message: "Unable to fetch data. The request could not be resolved.",
          },
        })
      );
    });
  });
}

describe("sendEmail per-attempt timeout", () => {
  beforeEach(() => {
    sendMock.mockReset();
    loggerMock.warn.mockReset();
    loggerMock.error.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("passes an AbortSignal so the request is genuinely cancellable", async () => {
    sendMock.mockResolvedValue({ data: { id: "resend-1" }, error: null });

    await sendEmail(options());

    const requestOptions = sendMock.mock.calls[0][1];
    expect(requestOptions.signal).toBeInstanceOf(AbortSignal);
    // Not aborted on a normal fast send.
    expect(requestOptions.signal.aborted).toBe(false);
  });

  it("keeps the idempotency key alongside the signal", async () => {
    // If the signal replaced the options object rather than joining it, every
    // send would silently stop deduping — the exact bug that made these keys
    // inert before.
    sendMock.mockResolvedValue({ data: { id: "resend-1" }, error: null });

    await sendEmail(options({ idempotencyKey: "confirmed-abc" }));

    const requestOptions = sendMock.mock.calls[0][1];
    expect(requestOptions.idempotencyKey).toBe("confirmed-abc");
    expect(requestOptions.signal).toBeInstanceOf(AbortSignal);
  });

  it("a hanging request resolves as a failure instead of hanging the caller", async () => {
    const hanging = hangUntilAborted();
    sendMock.mockImplementation(hanging);

    vi.useFakeTimers();
    const pending = sendEmail(options());
    await vi.runAllTimersAsync();
    const result = await pending;

    expect(result.success).toBe(false);
    // Retryable, not permanent: every attempt was made.
    expect(hanging).toHaveBeenCalledTimes(MAX_RETRY_ATTEMPTS);
  });

  it("aborts the signal it handed to the request", async () => {
    const hanging = hangUntilAborted();
    sendMock.mockImplementation(hanging);

    vi.useFakeTimers();
    const pending = sendEmail(options());
    await vi.runAllTimersAsync();
    await pending;

    expect(hanging.mock.calls[0][1]!.signal!.aborted).toBe(true);
  });

  it("reports a timeout distinctly from a network failure", async () => {
    // Resend collapses both into the same generic application_error, so without
    // the explicit flag an operator could not tell "we gave up on a stuck
    // request" from "the network died".
    sendMock.mockImplementation(hangUntilAborted());

    vi.useFakeTimers();
    const pending = sendEmail(options());
    await vi.runAllTimersAsync();
    const result = await pending;

    expect(result.error).toContain("timed out");
    const warned = loggerMock.warn.mock.calls.map((c) => c[0] as string);
    expect(warned.some((m) => m.includes("timed out"))).toBe(true);
  });

  it("treats a timeout as delivered when the retry hits the idempotency conflict", async () => {
    // The dangerous case: attempt 1 is aborted but Resend HAD accepted it.
    // Reusing the key makes attempt 2 answer invalid_idempotent_request, which
    // means the mail went out — so this must report success rather than
    // flagging a delivered order needs_contact.
    let call = 0;
    sendMock.mockImplementation((_p: unknown, opts?: { signal?: AbortSignal }) => {
      call++;
      if (call === 1) {
        return new Promise((resolve) => {
          opts?.signal?.addEventListener("abort", () =>
            resolve({ data: null, error: { name: "application_error", message: "aborted" } })
          );
        });
      }
      return Promise.resolve({
        data: null,
        error: { name: "invalid_idempotent_request", message: "Idempotency key already used" },
      });
    });

    vi.useFakeTimers();
    const pending = sendEmail(options({ idempotencyKey: "route-day-2026-08-05-user-1" }));
    await vi.runAllTimersAsync();
    const result = await pending;

    expect(result.success).toBe(true);
    expect(result.suppressed).toBe(true);
    expect(call).toBe(2);
  });

  it("honors a caller-supplied ceiling tighter than the default", async () => {
    const hanging = hangUntilAborted();
    sendMock.mockImplementation(hanging);

    vi.useFakeTimers();
    const pending = sendEmail(options({ attemptTimeoutMs: 3_000, idempotencyKey: "k" }));

    // Advance past the override but well short of the 15s default. If the
    // override were ignored, nothing would have aborted yet.
    await vi.advanceTimersByTimeAsync(3_100);
    expect(hanging.mock.calls[0][1]!.signal!.aborted).toBe(true);
    expect(3_000).toBeLessThan(SEND_ATTEMPT_TIMEOUT_MS);

    await vi.runAllTimersAsync();
    await pending;
  });

  it("does not abort a send that resolves before the ceiling", async () => {
    sendMock.mockImplementation(
      (_p: unknown, opts?: { signal?: AbortSignal }) =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ data: { id: "resend-1" }, error: null }), 1_000);
          void opts;
        })
    );

    vi.useFakeTimers();
    const pending = sendEmail(options());
    await vi.advanceTimersByTimeAsync(1_100);
    const result = await pending;

    expect(result.success).toBe(true);
    expect(sendMock.mock.calls[0][1].signal.aborted).toBe(false);
  });
});
