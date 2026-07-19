import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock every dependency of the shared sender so the test asserts pure mapping
// (DB row → email props) + the send contract (type, stable idempotency key),
// with no rendering or network.
vi.mock("../send", () => ({ sendEmail: vi.fn().mockResolvedValue({ success: true }) }));
vi.mock("../build", () => ({ buildEmailElement: vi.fn(() => ({ type: "el" })) }));
vi.mock("../nudges", () => ({
  getLoyaltyNudge: vi.fn().mockResolvedValue(null),
  getNextDeliveryCutoffText: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), exception: vi.fn(), error: vi.fn() },
}));
vi.mock("@/lib/supabase/server", () => ({ createServiceClient: vi.fn() }));

import { sendOrderStatusEmail } from "../order-status-email";
import { sendEmail } from "../send";
import { buildEmailElement } from "../build";
import { createServiceClient } from "@/lib/supabase/server";

const ORDER = {
  user_id: "user-1",
  total_cents: 3165,
  subtotal_cents: 2800,
  delivery_fee_cents: 0,
  tax_cents: 200,
  tip_cents: 165,
  discount_cents: 0,
  special_instructions: "No cilantro",
  delivery_instructions: "Leave at the door",
  delivery_window_start: "2026-05-30T18:00:00Z",
  delivery_window_end: "2026-05-30T20:00:00Z",
  addresses: {
    line_1: "456 Elm St",
    line_2: "Apt 2",
    city: "Covina",
    state: "CA",
    postal_code: "91723",
  },
};

const ITEMS = [
  {
    name_snapshot: "Mohinga",
    name_my_snapshot: "မုန့်ဟင်းခါး",
    special_instructions: "Sauce on the side, please.",
    quantity: 2,
    line_total_cents: 2800,
    menu_items: { image_url: "https://cdn.example.com/mohinga.jpg" },
    order_item_modifiers: [{ name_snapshot: "Extra Fish Cake", price_delta_snapshot: 200 }],
  },
];

function mockClient({
  order = ORDER,
  profile = { email: "aung@example.com", full_name: "Aung Myo" } as {
    email: string | null;
    full_name: string | null;
  } | null,
  items = ITEMS,
}: {
  order?: typeof ORDER | null;
  profile?: { email: string | null; full_name: string | null } | null;
  items?: typeof ITEMS;
} = {}) {
  const from = vi.fn((table: string) => {
    if (table === "orders") {
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: order, error: order ? null : new Error("x") }),
          }),
        }),
      };
    }
    if (table === "profiles") {
      return {
        select: () => ({
          eq: () => ({ single: () => Promise.resolve({ data: profile, error: null }) }),
        }),
      };
    }
    if (table === "order_items") {
      return { select: () => ({ eq: () => Promise.resolve({ data: items, error: null }) }) };
    }
    return {};
  });
  vi.mocked(createServiceClient).mockReturnValue({ from } as never);
}

describe("sendOrderStatusEmail — shared status sender", () => {
  beforeEach(() => vi.clearAllMocks());

  it("out_for_delivery: full item detail (photo, modifier, note) + both delivery notes + driver name", async () => {
    mockClient();
    const ok = await sendOrderStatusEmail("order-abc", "out_for_delivery", {
      driverName: "Ko Zaw",
    });
    expect(ok).toBe(true);

    const [type, props] = vi.mocked(buildEmailElement).mock.calls[0];
    expect(type).toBe("out_for_delivery");
    expect(props.driverName).toBe("Ko Zaw");
    expect(props.deliveryInstructions).toBe("Leave at the door");
    expect(props.specialInstructions).toBe("No cilantro");
    expect(props.items[0]).toMatchObject({
      name: "Mohinga",
      imageUrl: "https://cdn.example.com/mohinga.jpg",
      notes: "Sauce on the side, please.",
      modifiers: [{ name: "Extra Fish Cake", priceDelta: 200 }],
    });

    const sendArgs = vi.mocked(sendEmail).mock.calls[0][0];
    expect(sendArgs.type).toBe("out_for_delivery");
    // Stable key so a retryable driver start + the admin route dedupe to one send.
    expect(sendArgs.idempotencyKey).toBe("out_for_delivery-order-abc");
    expect(sendArgs.to).toBe("aung@example.com");
  });

  it("delivered: stable delivered key + delivered type, deliveredAt forwarded", async () => {
    mockClient();
    const ok = await sendOrderStatusEmail("order-abc", "delivered", {
      deliveredAt: "2026-05-30T19:00:00Z",
    });
    expect(ok).toBe(true);
    const [type, props] = vi.mocked(buildEmailElement).mock.calls[0];
    expect(type).toBe("delivered");
    expect(props.deliveredAt).toBe("2026-05-30T19:00:00Z");
    expect(vi.mocked(sendEmail).mock.calls[0][0].idempotencyKey).toBe("delivered-order-abc");
  });

  it("returns false without sending for a status that has no template", async () => {
    mockClient();
    const ok = await sendOrderStatusEmail("order-abc", "preparing");
    expect(ok).toBe(false);
    expect(sendEmail).not.toHaveBeenCalled();
    // Never even resolves the service client for a no-op status.
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it("returns false when the customer has no email", async () => {
    mockClient({ profile: { email: null, full_name: "Aung Myo" } });
    const ok = await sendOrderStatusEmail("order-abc", "delivered");
    expect(ok).toBe(false);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("returns false when the order cannot be resolved", async () => {
    mockClient({ order: null });
    const ok = await sendOrderStatusEmail("order-abc", "out_for_delivery");
    expect(ok).toBe(false);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
