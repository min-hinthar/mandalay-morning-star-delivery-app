import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Resend } from "resend";

/**
 * Contract test against the REAL installed Resend SDK — no mock of the client.
 *
 * The per-attempt timeout in sendEmail is load-bearing on an UNDECLARED SDK
 * behavior: `post()` spreads its options object straight into fetch
 * (`{ method, body, ...options, headers }` in resend@6.9.1), which is what
 * carries our `signal` (and turns `idempotencyKey` into the HTTP
 * `Idempotency-Key` header). Neither is promised by the SDK's types.
 *
 * The send-timeout suite mocks the client, so it can only prove the signal
 * reaches the MOCK. This file closes that gap: it runs the actual SDK code
 * path with a stubbed `fetch`, so a version bump that stops spreading —
 * which would silently turn the timeout into a no-op and sends unbounded
 * again — fails HERE instead of in production. (`resend` is pinned `~6.9.x`;
 * this is the check that makes the next bump verifiable.)
 */

const originalFetch = global.fetch;

/** Captures what the SDK actually hands to fetch. */
let capturedInit: RequestInit | undefined;

beforeEach(() => {
  capturedInit = undefined;
  global.fetch = vi.fn(async (_url: unknown, init?: RequestInit) => {
    capturedInit = init;
    return new Response(JSON.stringify({ id: "resend-contract-1" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
});

function payload() {
  return {
    from: "test@example.com",
    to: "customer@example.com",
    subject: "contract",
    html: "<p>contract</p>",
  };
}

describe("resend SDK options passthrough (the contract the timeout depends on)", () => {
  it("spreads an AbortSignal from the request options into fetch", async () => {
    const resend = new Resend("re_test_contract_key");
    const controller = new AbortController();

    const { error } = await resend.emails.send(payload(), {
      signal: controller.signal,
    } as never);

    expect(error).toBeNull();
    // THE assertion: the signal object the caller supplied is the one fetch
    // received. If a future resend version stops spreading options, this is
    // undefined and the per-attempt timeout has silently died — bump blocked.
    expect(capturedInit?.signal).toBe(controller.signal);
  });

  it("turns idempotencyKey into the HTTP Idempotency-Key header", async () => {
    const resend = new Resend("re_test_contract_key");

    await resend.emails.send(payload(), { idempotencyKey: "contract-key-1" });

    const headers = new Headers(capturedInit?.headers);
    // The other undeclared-adjacent behavior sendEmail depends on: the key
    // must ride the HTTP request header, not the message payload — this is
    // what makes every retry/multi-surface send dedupe.
    expect(headers.get("Idempotency-Key")).toBe("contract-key-1");
  });

  it("an aborted signal actually cancels the SDK's fetch", async () => {
    // End-to-end through the real fetchRequest: abort must surface as the
    // SDK's catch-all application_error (what sendEmail's timedOut flag
    // disambiguates), not hang.
    global.fetch = vi.fn(
      (_url: unknown, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("The operation was aborted.", "AbortError"))
          );
        })
    ) as unknown as typeof fetch;

    const resend = new Resend("re_test_contract_key");
    const controller = new AbortController();

    const pending = resend.emails.send(payload(), { signal: controller.signal } as never);
    controller.abort();

    const { data, error } = await pending;
    expect(data).toBeNull();
    expect(error?.name).toBe("application_error");
  });
});
