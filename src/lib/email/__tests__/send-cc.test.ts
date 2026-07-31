import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

/**
 * Who gets copied on an outbound email.
 *
 * sendEmail CCs the admin inbox on everything, which is right for transactional
 * mail. It is NOT right for a bulk marketing run: the admin inbox takes one CC
 * per recipient, and each customer sees an internal address in the CC header of
 * a promotional email. This pins the split so a future email type can't quietly
 * inherit the wrong side of it.
 */

const sendMock = vi.fn();

vi.mock("../client", () => ({
  getResendClient: () => ({ emails: { send: sendMock } }),
}));

vi.mock("@react-email/render", () => ({
  render: vi.fn().mockResolvedValue("<p>rendered</p>"),
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), exception: vi.fn() },
}));

// No kill switch, no prefs row -> opted in. Every query resolves empty.
vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          // The notification_logs duplicate-resend_id check uses maybeSingle.
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
      insert: async () => ({ data: null, error: null }),
      update: () => ({ eq: async () => ({ data: null, error: null }) }),
    }),
  }),
}));

const { sendEmail } = await import("../send");
const { EMAIL_CC } = await import("../constants");

function options(type: string, orderId = "11111111-2222-3333-4444-555555555555") {
  return {
    to: "customer@example.com",
    subject: "Subject",
    react: React.createElement("div"),
    type,
    orderId,
    userId: "user-1",
  } as Parameters<typeof sendEmail>[0];
}

describe("sendEmail idempotency key", () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ data: { id: "resend-1" }, error: null });
  });

  it("passes the key as the REQUEST option, not an email header", async () => {
    await sendEmail({ ...options("order_confirmation"), idempotencyKey: "confirmed-abc" });

    const [payload, requestOptions] = sendMock.mock.calls[0];
    // Resend only turns the SECOND argument into the HTTP Idempotency-Key
    // header; a key inside the payload's `headers` is just a header on the
    // outgoing message and dedupes nothing.
    expect(requestOptions.idempotencyKey).toBe("confirmed-abc");
    expect(payload.headers).not.toHaveProperty("Idempotency-Key");
  });

  it("omits the idempotency key when none is given", async () => {
    await sendEmail(options("order_confirmation"));

    // The options object itself is always present now — it carries the
    // per-attempt AbortSignal — so assert on the key, not the object.
    expect(sendMock.mock.calls[0][1]).not.toHaveProperty("idempotencyKey");
  });

  it("falls back to the settings link when no unsubscribe secret is configured", async () => {
    // The endpoint exists now, but it can't verify a token without a secret —
    // so the sender must NOT promise one-click. Claiming it against a URL that
    // can't honor it is the original bug: the reader's mail client reports
    // success and nothing changes.
    delete process.env.UNSUBSCRIBE_TOKEN_SECRET;

    await sendEmail({ ...options("route_day_invite", "route-2026-08-05"), idempotencyKey: "k" });

    const headers = sendMock.mock.calls[0][0].headers;
    expect(headers["List-Unsubscribe"]).toContain("/account?tab=settings");
    expect(headers).not.toHaveProperty("List-Unsubscribe-Post");
  });

  it("advertises one-click with a per-recipient token once a secret IS configured", async () => {
    process.env.UNSUBSCRIBE_TOKEN_SECRET = "test-secret";

    await sendEmail(options("route_day_invite", "route-2026-08-05"));

    const headers = sendMock.mock.calls[0][0].headers;
    expect(headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect(headers["List-Unsubscribe"]).toContain("/api/unsubscribe?token=");
    // Keyed to the pref this message is gated on, and to THIS recipient.
    expect(headers["List-Unsubscribe"]).toContain("user-1.marketing.");

    delete process.env.UNSUBSCRIBE_TOKEN_SECRET;
  });

  it("never claims one-click on MANDATORY mail the recipient cannot stop", async () => {
    // order_confirmation bypasses the preference check entirely, so a one-click
    // unsubscribe on it would report success and keep sending — the same broken
    // promise, relocated.
    process.env.UNSUBSCRIBE_TOKEN_SECRET = "test-secret";

    await sendEmail(options("order_confirmation"));

    const headers = sendMock.mock.calls[0][0].headers;
    expect(headers).not.toHaveProperty("List-Unsubscribe-Post");
    expect(headers["List-Unsubscribe"]).toContain("/account?tab=settings");

    delete process.env.UNSUBSCRIBE_TOKEN_SECRET;
  });
});

describe("sendEmail CC policy", () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ data: { id: "resend-1" }, error: null });
  });

  it("omits the admin CC on the marketing route-day invite", async () => {
    await sendEmail(options("route_day_invite", "route-2026-08-05"));

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][0].cc).toBeUndefined();
  });

  it("still copies admin on transactional order mail", async () => {
    await sendEmail(options("order_confirmation"));

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][0].cc).toEqual(EMAIL_CC);
  });

  it("still copies admin on driver-flow status mail", async () => {
    await sendEmail(options("out_for_delivery"));

    expect(sendMock.mock.calls[0][0].cc).toEqual(EMAIL_CC);
  });

  it("keeps the admin address out of the recipient-visible headers entirely", async () => {
    await sendEmail(options("route_day_invite", "route-2026-08-05"));

    const payload = sendMock.mock.calls[0][0];
    // Not smuggled into `to` as a workaround, and not present anywhere a
    // recipient's mail client would render it.
    expect(payload.to).toBe("customer@example.com");
    expect(JSON.stringify(payload.to)).not.toContain("admin@");
    expect(JSON.stringify(payload.cc ?? "")).not.toContain("admin@");
  });
});
