import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { reclaimPendingCheckouts } from "../reclaim-pending-checkouts";

interface PendingRow {
  id: string;
  stripe_checkout_session_id: string | null;
  payment_method: string;
}

/**
 * Service-client stub for the reclaim's three query shapes:
 *  - list pendings:   .select().eq(user_id).eq(status) → rows
 *  - cancel:          .update().eq(id).eq(status).select() → cancelledIds rows
 *  - verify fallback: .select(status).eq(id).single() → currentStatus
 */
function serviceWith(opts: {
  pendings: PendingRow[] | null;
  listError?: boolean;
  cancelledIds?: string[];
  cancelError?: boolean;
  currentStatus?: string;
}) {
  const listResult = opts.listError
    ? { data: null, error: { message: "boom" } }
    : { data: opts.pendings, error: null };
  const listEq2 = vi.fn().mockResolvedValue(listResult);
  const listEq1 = vi.fn(() => ({ eq: listEq2 }));

  const cancelResult = opts.cancelError
    ? { data: null, error: { message: "boom" } }
    : { data: (opts.cancelledIds ?? []).map((id) => ({ id })), error: null };
  const cancelSelect = vi.fn().mockResolvedValue(cancelResult);
  const cancelEq2 = vi.fn(() => ({ select: cancelSelect }));
  const cancelEq1 = vi.fn(() => ({ eq: cancelEq2 }));
  const update = vi.fn(() => ({ eq: cancelEq1 }));

  const single = vi.fn().mockResolvedValue({ data: { status: opts.currentStatus ?? "pending" } });
  const verifyEq = vi.fn(() => ({ single }));

  const from = vi.fn(() => ({
    select: vi.fn((cols: string) => (cols === "status" ? { eq: verifyEq } : { eq: listEq1 })),
    update,
  }));
  return { client: { from } as unknown as SupabaseClient<Database>, update };
}

function stripeWith(opts: {
  expireError?: boolean;
  retrievedStatus?: "open" | "complete" | "expired" | null;
}) {
  const expire = opts.expireError
    ? vi.fn().mockRejectedValue(new Error("cannot expire"))
    : vi.fn().mockResolvedValue({ status: "expired" });
  const retrieve =
    opts.retrievedStatus === null
      ? vi.fn().mockRejectedValue(new Error("no such session"))
      : vi.fn().mockResolvedValue({ status: opts.retrievedStatus ?? "expired" });
  return {
    stripe: { checkout: { sessions: { expire, retrieve } } } as unknown as Stripe,
    expire,
    retrieve,
  };
}

const PENDING: PendingRow = {
  id: "order-1",
  stripe_checkout_session_id: "cs_123",
  payment_method: "stripe",
};

describe("reclaimPendingCheckouts", () => {
  it("succeeds trivially with no pending orders", async () => {
    const { stripe } = stripeWith({});
    const { client } = serviceWith({ pendings: [] });
    expect(await reclaimPendingCheckouts(stripe, client, "u1")).toBe(true);
  });

  it("expires the session then cancels the order", async () => {
    const { stripe, expire } = stripeWith({});
    const { client, update } = serviceWith({ pendings: [PENDING], cancelledIds: ["order-1"] });

    expect(await reclaimPendingCheckouts(stripe, client, "u1")).toBe(true);
    expect(expire).toHaveBeenCalledWith("cs_123");
    expect(update).toHaveBeenCalledWith({ status: "cancelled" });
  });

  it("aborts on a failed pendings read", async () => {
    const { stripe } = stripeWith({});
    const { client } = serviceWith({ pendings: null, listError: true });
    expect(await reclaimPendingCheckouts(stripe, client, "u1")).toBe(false);
  });

  it("aborts on a pending order with no recorded session id (it may still complete)", async () => {
    const { stripe, expire } = stripeWith({});
    const { client } = serviceWith({
      pendings: [{ ...PENDING, stripe_checkout_session_id: null }],
    });
    expect(await reclaimPendingCheckouts(stripe, client, "u1")).toBe(false);
    expect(expire).not.toHaveBeenCalled();
  });

  it("aborts on a non-Stripe pending order", async () => {
    const { stripe } = stripeWith({});
    const { client } = serviceWith({ pendings: [{ ...PENDING, payment_method: "cod" }] });
    expect(await reclaimPendingCheckouts(stripe, client, "u1")).toBe(false);
  });

  it("tolerates expire() rejecting when the session is ALREADY expired", async () => {
    const { stripe } = stripeWith({ expireError: true, retrievedStatus: "expired" });
    const { client } = serviceWith({ pendings: [PENDING], cancelledIds: ["order-1"] });
    expect(await reclaimPendingCheckouts(stripe, client, "u1")).toBe(true);
  });

  it("aborts when expire() rejects because the session COMPLETED (the order is paid)", async () => {
    const { stripe } = stripeWith({ expireError: true, retrievedStatus: "complete" });
    const { client, update } = serviceWith({ pendings: [PENDING] });
    expect(await reclaimPendingCheckouts(stripe, client, "u1")).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("aborts when the session cannot be retrieved after a failed expire", async () => {
    const { stripe } = stripeWith({ expireError: true, retrievedStatus: null });
    const { client } = serviceWith({ pendings: [PENDING] });
    expect(await reclaimPendingCheckouts(stripe, client, "u1")).toBe(false);
  });

  it("aborts on a failed cancel write", async () => {
    const { stripe } = stripeWith({});
    const { client } = serviceWith({ pendings: [PENDING], cancelError: true });
    expect(await reclaimPendingCheckouts(stripe, client, "u1")).toBe(false);
  });

  it("accepts a zero-row cancel when the expiry webhook already cancelled it", async () => {
    const { stripe } = stripeWith({});
    const { client } = serviceWith({
      pendings: [PENDING],
      cancelledIds: [],
      currentStatus: "cancelled",
    });
    expect(await reclaimPendingCheckouts(stripe, client, "u1")).toBe(true);
  });

  it("aborts a zero-row cancel when the order moved to any OTHER status", async () => {
    const { stripe } = stripeWith({});
    const { client } = serviceWith({
      pendings: [PENDING],
      cancelledIds: [],
      currentStatus: "confirmed",
    });
    expect(await reclaimPendingCheckouts(stripe, client, "u1")).toBe(false);
  });
});
