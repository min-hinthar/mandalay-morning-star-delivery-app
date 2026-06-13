import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";

import { AdminDailyDigest } from "../AdminDailyDigest";
import { DeliveryReminder } from "../DeliveryReminder";

// React inserts empty "<!-- -->" comment separators between adjacent JSX
// expressions; strip them so assertions match the visible text.
function visibleText(html: string): string {
  return html.replace(/<!-- -->/g, "");
}

// Shared sample line items used across both email templates.
const SAMPLE_ITEMS = [
  {
    name: "Mohinga",
    nameMy: "မုန့်ဟင်းခါး",
    quantity: 2,
    lineTotalCents: 2800,
    category: "Soups",
    modifiers: [{ name: "Extra Fish Cake", priceDelta: 200 }],
  },
  {
    name: "Shan Noodles",
    quantity: 1,
    lineTotalCents: 1500,
    category: "Noodles",
    notes: "Sauce on the side, please.",
  },
];

describe("DeliveryReminder — full order details", () => {
  it("renders every ordered item, modifiers, notes and totals", async () => {
    const html = visibleText(
      await render(
        <DeliveryReminder
          customerName="Aung Myo"
          orderId="abc12345-6789-0def-ghij"
          itemCount={3}
          itemNames={["Mohinga", "Shan Noodles"]}
          deliveryWindowStart="2026-05-30T18:00:00Z"
          deliveryWindowEnd="2026-05-30T20:00:00Z"
          address={{ line1: "456 Elm St", city: "Covina", state: "CA", postalCode: "91723" }}
          items={SAMPLE_ITEMS}
          subtotalCents={4300}
          deliveryFeeCents={0}
          taxCents={365}
          tipCents={500}
          totalCents={5165}
          paymentMethod="cod"
        />
      )
    );

    // Every item is fully listed (not just a preview)
    expect(html).toContain("Mohinga");
    expect(html).toContain("Shan Noodles");
    // Quantities, modifiers and per-item notes
    expect(html).toContain("×2");
    expect(html).toContain("Extra Fish Cake");
    expect(html).toContain("Sauce on the side, please.");
    // Full financial breakdown
    expect(html).toContain("Subtotal");
    expect(html).toContain("$51.65"); // total
    expect(html).toContain("Cash on Delivery");
  });

  it("falls back to preview-only when no item details are supplied", async () => {
    const html = visibleText(
      await render(
        <DeliveryReminder
          customerName="Aung Myo"
          orderId="abc12345-6789-0def-ghij"
          itemCount={2}
          itemNames={["Mohinga", "Shan Noodles"]}
          deliveryWindowStart="2026-05-30T18:00:00Z"
          deliveryWindowEnd="2026-05-30T20:00:00Z"
          address={{ line1: "456 Elm St", city: "Covina", state: "CA", postalCode: "91723" }}
        />
      )
    );
    expect(html).not.toContain("Subtotal");
    expect(html).toContain("Mohinga");
  });
});

describe("AdminDailyDigest — full details + revenue excludes cancelled", () => {
  const baseOrder = {
    subtotalCents: 4300,
    deliveryFeeCents: 0,
    taxCents: 365,
    deliveryWindowStart: "2026-05-29T18:00:00Z",
    deliveryWindowEnd: "2026-05-29T20:00:00Z",
    address: { line1: "456 Elm St", city: "Covina", state: "CA", postalCode: "91723" },
    items: SAMPLE_ITEMS,
  };

  it("renders per-order item details for admin/kitchen/driver", async () => {
    const html = visibleText(
      await render(
        <AdminDailyDigest
          period="morning"
          dateLabel="Thursday, May 29, 2026"
          totalOrders={2}
          totalRevenueCents={5165}
          cancelledOrders={1}
          cancelledRevenueCents={4200}
          statusBreakdown={{
            pending_approval: 0,
            confirmed: 1,
            preparing: 0,
            out_for_delivery: 0,
            delivered: 0,
            cancelled: 1,
          }}
          orders={[
            {
              ...baseOrder,
              id: "abc12345-1111-2222",
              customerName: "Aung Myo",
              totalCents: 5165,
              status: "confirmed",
              paymentMethod: "cod",
              itemCount: 3,
              specialInstructions: "Gate code #1234",
            },
            {
              id: "def45678-3333-4444",
              customerName: "Ko Min",
              totalCents: 4200,
              status: "cancelled",
              paymentMethod: "stripe",
              itemCount: 1,
              items: [{ name: "Samosa (4 pcs)", quantity: 1, lineTotalCents: 800 }],
            },
          ]}
        />
      )
    );

    // Full item detail in the digest
    expect(html).toContain("Mohinga");
    expect(html).toContain("Extra Fish Cake");
    expect(html).toContain("Sauce on the side, please.");
    expect(html).toContain("Gate code #1234");
    // Cancelled order details are still visible
    expect(html).toContain("Samosa (4 pcs)");
    expect(html).toContain("Cancelled");
    // Revenue label reflects confirmed-only, with cancelled exclusion note
    expect(html).toContain("Confirmed Revenue");
    expect(html).toContain("excl. 1 cancelled");
    expect(html).toContain("$42.00"); // excluded cancelled amount
  });
});
