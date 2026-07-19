import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../send", () => ({ sendPushToUser: vi.fn().mockResolvedValue({ sent: 1 }) }));
vi.mock("@/lib/utils/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), exception: vi.fn(), error: vi.fn() },
}));
vi.mock("@/lib/supabase/server", () => ({ createServiceClient: vi.fn() }));

import { sendOrderStatusPush } from "../order-status-push";
import { sendPushToUser } from "../send";
import { createServiceClient } from "@/lib/supabase/server";

function mockClient(order: { user_id: string } | null = { user_id: "user-1" }) {
  const from = vi.fn((table: string) => {
    if (table === "orders") {
      return {
        select: () => ({
          eq: () => ({ single: () => Promise.resolve({ data: order, error: null }) }),
        }),
      };
    }
    return {};
  });
  vi.mocked(createServiceClient).mockReturnValue({ from } as never);
  return from;
}

describe("sendOrderStatusPush — shared status push", () => {
  beforeEach(() => vi.clearAllMocks());

  it("out_for_delivery: resolves the order's user and pushes with a coalescing tag", async () => {
    mockClient({ user_id: "user-1" });
    await sendOrderStatusPush("order-abc", "out_for_delivery");
    const [, userId, payload] = vi.mocked(sendPushToUser).mock.calls[0];
    expect(userId).toBe("user-1");
    expect(payload.title).toMatch(/on its way/i);
    expect(payload.url).toBe("/orders/order-abc/tracking");
    expect(payload.tag).toBe("order-order-abc");
  });

  it("delivered: uses a provided userId and skips the order lookup", async () => {
    const from = mockClient();
    await sendOrderStatusPush("order-abc", "delivered", { userId: "user-9" });
    const [, userId, payload] = vi.mocked(sendPushToUser).mock.calls[0];
    expect(userId).toBe("user-9");
    expect(payload.title).toMatch(/delivered/i);
    // With userId supplied, we never query the orders table.
    expect(from).not.toHaveBeenCalled();
  });

  it("no-ops for a status without a push template", async () => {
    mockClient();
    await sendOrderStatusPush("order-abc", "preparing");
    expect(sendPushToUser).not.toHaveBeenCalled();
    // Never even resolves the service client for a no-op status.
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it("no-ops when the order/user can't be resolved", async () => {
    mockClient(null);
    await sendOrderStatusPush("order-abc", "delivered");
    expect(sendPushToUser).not.toHaveBeenCalled();
  });
});
