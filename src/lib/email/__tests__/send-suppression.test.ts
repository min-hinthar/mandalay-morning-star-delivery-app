import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

/**
 * Suppressed vs delivered.
 *
 * The admin kill switch and a recipient opt-out both short-circuit BEFORE
 * Resend and return `success: true` — nothing went wrong, so that's correct.
 * The consequence is that `success` alone cannot answer "did mail actually go
 * out?", which matters for bulk callers whose run summary is the only operator
 * signal (route_day_invite writes no notification_logs row). `suppressed` is
 * what lets them tell the difference; these pin it.
 */

const sendMock = vi.fn();

/** Mutable so each test can flip the kill switch / prefs the mock reports. */
let killSwitchValue: unknown = null;
let notificationPrefs: Record<string, boolean> | null = null;

vi.mock("../client", () => ({
  getResendClient: () => ({ emails: { send: sendMock } }),
}));

vi.mock("@react-email/render", () => ({
  render: vi.fn().mockResolvedValue("<p>rendered</p>"),
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), exception: vi.fn() },
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => {
            if (table === "app_settings") return { data: { value: killSwitchValue }, error: null };
            if (table === "customer_settings") {
              return {
                data: notificationPrefs ? { notification_prefs: notificationPrefs } : null,
                error: null,
              };
            }
            return { data: null, error: null };
          },
        }),
      }),
      insert: async () => ({ data: null, error: null }),
      update: () => ({ eq: async () => ({ data: null, error: null }) }),
    }),
  }),
}));

const { sendEmail } = await import("../send");

function options(type: string) {
  return {
    to: "customer@example.com",
    subject: "Subject",
    react: React.createElement("div"),
    type,
    orderId: "11111111-2222-3333-4444-555555555555",
    userId: "user-1",
  } as Parameters<typeof sendEmail>[0];
}

describe("sendEmail suppression signal", () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ data: { id: "resend-1" }, error: null });
    killSwitchValue = null;
    notificationPrefs = null;
  });

  it("a real delivery is not marked suppressed", async () => {
    const result = await sendEmail(options("order_confirmation"));

    expect(result.success).toBe(true);
    expect(result.suppressed).toBeFalsy();
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("the admin kill switch reports suppressed, and never reaches Resend", async () => {
    killSwitchValue = false;

    const result = await sendEmail(options("route_day_invite"));

    // Still a success — nothing failed — which is exactly why a bulk caller
    // counting `success` would report a full run while mailing nobody.
    expect(result.success).toBe(true);
    expect(result.suppressed).toBe(true);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("a marketing opt-out reports suppressed, and never reaches Resend", async () => {
    notificationPrefs = { marketing: false };

    const result = await sendEmail(options("route_day_invite"));

    expect(result.success).toBe(true);
    expect(result.suppressed).toBe(true);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("an opt-out on a DIFFERENT channel does not suppress marketing", async () => {
    notificationPrefs = { marketing: true, order_updates: false };

    const result = await sendEmail(options("route_day_invite"));

    expect(result.suppressed).toBeFalsy();
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("treats an idempotency conflict as already-delivered, not a failure", async () => {
    // Resend returns this when the key was used with a different payload. The
    // first email DID go out, so retrying is pointless and failing the send
    // would flag a good order needs_contact.
    sendMock.mockResolvedValue({
      data: null,
      error: { name: "invalid_idempotent_request", message: "Idempotency key already used" },
    });

    const result = await sendEmail({
      ...options("order_confirmation"),
      idempotencyKey: "confirmed-abc",
    });

    expect(result.success).toBe(true);
    expect(result.suppressed).toBe(true);
    // Crucially: no retry storm on a key that can never succeed.
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("a mandatory type ignores the opt-out but still obeys the kill switch", async () => {
    notificationPrefs = { order_updates: false };
    const delivered = await sendEmail(options("order_confirmation"));
    expect(delivered.suppressed).toBeFalsy();

    killSwitchValue = false;
    const killed = await sendEmail(options("order_confirmation"));
    expect(killed.suppressed).toBe(true);
  });
});
