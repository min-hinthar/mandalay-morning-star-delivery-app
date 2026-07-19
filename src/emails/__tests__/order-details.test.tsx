import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";

import { AdminDailyDigest } from "../AdminDailyDigest";
import { DeliveryReminder } from "../DeliveryReminder";
import { OutForDelivery } from "../OutForDelivery";
import { OrderDelivered } from "../OrderDelivered";
import { OrderCancellation } from "../OrderCancellation";
import { AdminNewOrderAlert } from "../AdminNewOrderAlert";

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
    // No coupon → no discount row
    expect(html).not.toContain("Discount");
  });

  it("shows a discount row so a coupon order's rows reconcile to the total", async () => {
    // subtotal 43.00 − discount 8.00 + delivery 0 + tax 3.50 + tip 0 = total 38.50
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
          taxCents={350}
          tipCents={0}
          discountCents={800}
          totalCents={3850}
        />
      )
    );
    expect(html).toContain("Discount");
    expect(html).toContain("$8.00"); // the coupon savings line
    expect(html).toContain("$38.50"); // total now reconciles with the rows
  });

  it("clamps the shown discount so an over-discount still reconciles to a $0 total", async () => {
    // Unreachable today, but defensive: discount 50.00 > subtotal 10.00 → total
    // clamps to $0.00; the row must show the clamped 10.00, not 50.00.
    const html = visibleText(
      await render(
        <DeliveryReminder
          customerName="Aung Myo"
          orderId="abc12345-6789-0def-ghij"
          itemCount={1}
          itemNames={["Mohinga"]}
          deliveryWindowStart="2026-05-30T18:00:00Z"
          deliveryWindowEnd="2026-05-30T20:00:00Z"
          address={{ line1: "456 Elm St", city: "Covina", state: "CA", postalCode: "91723" }}
          items={[SAMPLE_ITEMS[0]]}
          subtotalCents={1000}
          deliveryFeeCents={0}
          taxCents={0}
          tipCents={0}
          discountCents={5000}
          totalCents={0}
        />
      )
    );
    expect(html).toContain("Discount");
    expect(html).not.toContain("$50.00"); // not the raw over-discount
    expect(html).toContain("$0.00"); // clamped total reconciles
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

// Every order lifecycle email must show the full order: dish photos, chosen
// options (modifiers), per-item notes, and delivery notes — for customers AND staff.
describe("Order lifecycle emails — full item detail (photos, options, notes, delivery notes)", () => {
  const ADDRESS = { line1: "456 Elm St", city: "Covina", state: "CA", postalCode: "91723" };
  const RICH_ITEMS = [
    {
      name: "Mohinga",
      nameMy: "မုန့်ဟင်းခါး",
      quantity: 2,
      lineTotalCents: 2800,
      category: "Soups",
      imageUrl: "https://cdn.example.com/mohinga.jpg", // hostable raster → real <img>
      modifiers: [{ name: "Extra Fish Cake", priceDelta: 200 }],
      notes: "Sauce on the side, please.",
    },
  ];

  it("OutForDelivery: items, modifiers, per-item notes, dish photo, and both delivery notes", async () => {
    const html = visibleText(
      await render(
        <OutForDelivery
          customerName="Aung Myo"
          orderId="abc12345-6789-0def-ghij"
          itemCount={2}
          items={RICH_ITEMS}
          deliveryWindowStart="2026-05-30T18:00:00Z"
          deliveryWindowEnd="2026-05-30T20:00:00Z"
          address={ADDRESS}
          specialInstructions="No cilantro"
          deliveryInstructions="Leave at the door"
        />
      )
    );
    expect(html).toContain("Mohinga");
    expect(html).toContain("Extra Fish Cake"); // chosen option
    expect(html).toContain("Sauce on the side, please."); // per-item note
    expect(html).toContain("https://cdn.example.com/mohinga.jpg"); // dish photo
    expect(html).toContain("Leave at the door"); // dropoff/delivery note
    expect(html).toContain("No cilantro"); // kitchen note (both notes shown)
  });

  it("OrderDelivered: items with modifiers, notes and photo (the receipt)", async () => {
    const html = visibleText(
      await render(
        <OrderDelivered
          customerName="Aung Myo"
          orderId="abc12345-6789-0def-ghij"
          itemCount={2}
          items={RICH_ITEMS}
          totalCents={3165}
        />
      )
    );
    expect(html).toContain("Mohinga");
    expect(html).toContain("Extra Fish Cake");
    expect(html).toContain("Sauce on the side, please.");
    expect(html).toContain("https://cdn.example.com/mohinga.jpg");
  });

  it("OrderCancellation: items with modifiers, notes and photo", async () => {
    const html = visibleText(
      await render(
        <OrderCancellation
          customerName="Aung Myo"
          orderId="abc12345-6789-0def-ghij"
          items={RICH_ITEMS}
          totalCents={3165}
          cancellationReason="Changed my mind"
          cancelledAt="2026-05-30T18:00:00Z"
          refundIssued={false}
        />
      )
    );
    expect(html).toContain("Mohinga");
    expect(html).toContain("Extra Fish Cake");
    expect(html).toContain("Sauce on the side, please.");
    expect(html).toContain("https://cdn.example.com/mohinga.jpg");
  });

  it("AdminNewOrderAlert (staff): dish photo, options, notes and delivery notes", async () => {
    const html = visibleText(
      await render(
        <AdminNewOrderAlert
          orderId="abc12345-6789-0def-ghij"
          customerName="Aung Myo"
          customerEmail="aung@example.com"
          items={RICH_ITEMS}
          subtotalCents={2800}
          deliveryFeeCents={0}
          taxCents={200}
          totalCents={3000}
          address={ADDRESS}
          specialInstructions="No cilantro"
          deliveryInstructions="Leave at the door"
          placedAt="2026-05-30T17:00:00Z"
        />
      )
    );
    expect(html).toContain("Extra Fish Cake"); // options for the kitchen
    expect(html).toContain("Sauce on the side, please."); // per-item note
    expect(html).toContain("https://cdn.example.com/mohinga.jpg"); // photo for staff
    expect(html).toContain("Leave at the door"); // delivery note
  });
});
