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
        eq: () => ({ single: async () => ({ data: null, error: null }) }),
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
    expect(requestOptions).toEqual({ idempotencyKey: "confirmed-abc" });
    expect(payload.headers).not.toHaveProperty("Idempotency-Key");
  });

  it("omits the request options entirely when no key is given", async () => {
    await sendEmail(options("order_confirmation"));

    expect(sendMock.mock.calls[0][1]).toBeUndefined();
  });

  it("keeps the List-Unsubscribe link and does not claim one-click", async () => {
    await sendEmail({ ...options("route_day_invite", "route-2026-08-05"), idempotencyKey: "k" });

    const headers = sendMock.mock.calls[0][0].headers;
    expect(headers["List-Unsubscribe"]).toContain("/account?tab=settings");
    // No POST endpoint honors one-click yet — see issue #209.
    expect(headers).not.toHaveProperty("List-Unsubscribe-Post");
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
