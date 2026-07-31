import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

/**
 * What happens when the notification_logs write itself fails.
 *
 * Both inserts used to discard their result, so a rejected row was completely
 * silent: the Resend status webhook matches on `resend_id`, so a missing
 * success row quietly ends delivery/bounce/complaint tracking for that message,
 * and a missing failure row means nothing in the DB shows the customer was
 * never emailed. Neither may fail the send — the mail has already shipped (or
 * already definitively failed) by the time we get here.
 */

const sendMock = vi.fn();
const loggerMock = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), exception: vi.fn() };

/** Mutable so each test can decide what the log write / dup-check reports. */
let insertResult: { data: null; error: { message: string; code: string } | null } = {
  data: null,
  error: null,
};
let dupCheckResult: {
  data: { id: string } | null;
  error: { message: string; code: string } | null;
} = { data: null, error: null };

const insertMock = vi.fn();

vi.mock("../client", () => ({
  getResendClient: () => ({ emails: { send: sendMock } }),
}));

vi.mock("@react-email/render", () => ({
  render: vi.fn().mockResolvedValue("<p>rendered</p>"),
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: loggerMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => dupCheckResult,
          single: async () => ({ data: null, error: null }),
        }),
      }),
      insert: async (row: unknown) => {
        insertMock(table, row);
        return insertResult;
      },
      update: () => ({ eq: async () => ({ data: null, error: null }) }),
    }),
  }),
}));

const { sendEmail } = await import("../send");

function options(type = "order_confirmation", orderId = "11111111-2222-3333-4444-555555555555") {
  return {
    to: "customer@example.com",
    subject: "Subject",
    react: React.createElement("div"),
    type,
    orderId,
    userId: "user-1",
  } as Parameters<typeof sendEmail>[0];
}

/** Drives sendEmail past the real 10s+20s retry backoff without waiting. */
async function sendThroughRetries(opts: Parameters<typeof sendEmail>[0]) {
  vi.useFakeTimers();
  const pending = sendEmail(opts);
  await vi.runAllTimersAsync();
  return pending;
}

describe("sendEmail notification_logs failures", () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ data: { id: "resend-1" }, error: null });
    insertMock.mockReset();
    loggerMock.warn.mockReset();
    loggerMock.error.mockReset();
    insertResult = { data: null, error: null };
    dupCheckResult = { data: null, error: null };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("still reports the send as successful when the success-path log insert fails", async () => {
    insertResult = { data: null, error: { message: "permission denied", code: "42501" } };

    const result = await sendEmail(options());

    // The email is already out — failing here would flag a delivered order
    // needs_contact and could trigger a duplicate send from the caller.
    expect(result.success).toBe(true);
    expect(result.resendId).toBe("resend-1");
  });

  it("surfaces the dropped success row instead of swallowing it", async () => {
    insertResult = { data: null, error: { message: "permission denied", code: "42501" } };

    await sendEmail(options());

    expect(loggerMock.error).toHaveBeenCalledWith(
      expect.stringContaining("notification_logs"),
      expect.objectContaining({
        dbError: "permission denied",
        dbErrorCode: "42501",
        // The id the Resend status webhook matches on — without it the operator
        // can't find the message this dropped row was supposed to track.
        resendId: "resend-1",
        orderId: "11111111-2222-3333-4444-555555555555",
      })
    );
  });

  it("logs nothing extra when the log row writes cleanly", async () => {
    await sendEmail(options());

    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(loggerMock.error).not.toHaveBeenCalled();
    expect(loggerMock.warn).not.toHaveBeenCalled();
  });

  it("warns and inserts anyway when the duplicate check genuinely fails", async () => {
    dupCheckResult = { data: null, error: { message: "timeout", code: "57014" } };

    const result = await sendEmail(options());

    expect(result.success).toBe(true);
    // A possible duplicate row beats dropping the log entirely, but the
    // operator has to know: duplicates are what break the webhook's .single().
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(loggerMock.warn).toHaveBeenCalledWith(
      expect.stringContaining("duplicate check failed"),
      expect.objectContaining({ dbErrorCode: "57014", resendId: "resend-1" })
    );
  });

  it("does NOT insert a third row when PGRST116 says duplicates already exist", async () => {
    // On a GET, maybeSingle() asks for application/json and postgrest-js
    // synthesizes PGRST116 client-side when >1 row comes back. So this code is
    // "rows already exist", not "the lookup broke" — inserting would deepen the
    // exact duplication the guard exists to prevent.
    dupCheckResult = {
      data: null,
      error: {
        message: "JSON object requested, multiple (or no) rows returned",
        code: "PGRST116",
      },
    };

    const result = await sendEmail(options());

    expect(result.success).toBe(true);
    expect(insertMock).not.toHaveBeenCalled();
    expect(loggerMock.warn).toHaveBeenCalledWith(
      expect.stringContaining("skipping insert"),
      expect.objectContaining({ dbErrorCode: "PGRST116", resendId: "resend-1" })
    );
  });

  it("skips the insert when a row for this resend_id already exists", async () => {
    dupCheckResult = { data: { id: "log-1" }, error: null };

    await sendEmail(options());

    expect(insertMock).not.toHaveBeenCalled();
    expect(loggerMock.warn).not.toHaveBeenCalled();
  });

  it("nulls a synthetic order handle rather than sending it to a uuid column", async () => {
    // route_day_invite is a logged type now, but it has no order — the cron
    // passes `route-<date>` purely for tagging. notification_logs.order_id is
    // a uuid column, so passing that string straight through would make
    // Postgres reject every marketing row with 22P02.
    await sendEmail(options("route_day_invite", "route-2026-08-05"));

    expect(insertMock).toHaveBeenCalledTimes(1);
    const row = insertMock.mock.calls[0][1] as Record<string, unknown>;
    expect(row.order_id).toBeNull();
    // The fields an opt-out / spam-complaint audit actually needs survive.
    expect(row.user_id).toBe("user-1");
    expect(row.notification_type).toBe("route_day_invite");
    expect(row.recipient).toBe("customer@example.com");
  });

  it("keeps a real order id intact", async () => {
    await sendEmail(options());

    const row = insertMock.mock.calls[0][1] as Record<string, unknown>;
    expect(row.order_id).toBe("11111111-2222-3333-4444-555555555555");
  });

  it("surfaces a dropped FAILURE row after every retry is exhausted", async () => {
    sendMock.mockResolvedValue({ data: null, error: { name: "rate_limit_exceeded" } });
    insertResult = { data: null, error: { message: "permission denied", code: "42501" } };

    const result = await sendThroughRetries(options());

    expect(result.success).toBe(false);
    // Two distinct errors: the send failed, and its audit row is missing too.
    const messages = loggerMock.error.mock.calls.map((call) => call[0] as string);
    expect(messages).toContain(
      "Email failed and the notification_logs failure row could not be written"
    );
    expect(messages).toContain("Email send failed after all retries");
  });
});
