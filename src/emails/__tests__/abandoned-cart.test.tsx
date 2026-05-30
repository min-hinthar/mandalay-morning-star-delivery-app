import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";

import { AbandonedCart } from "../AbandonedCart";

function visibleText(html: string): string {
  return html.replace(/<!-- -->/g, "").replace(/&amp;/g, "&");
}

describe("AbandonedCart email", () => {
  it("renders the items, subtotal, free-delivery nudge, and CTA", async () => {
    const html = visibleText(
      await render(
        <AbandonedCart
          customerName="Aung"
          items={[
            { name: "Mohinga", nameMy: "မုန့်ဟင်းခါး", quantity: 2, lineTotalCents: 2700 },
            { name: "Tea Leaf Salad", quantity: 1, lineTotalCents: 1200 },
          ]}
          itemCount={3}
          subtotalCents={3900}
          cartUrl="https://delivery.mandalaymorningstar.com/menu"
          amountToFreeDeliveryCents={6100}
        />
      )
    );

    expect(html).toContain("Mohinga");
    expect(html).toContain("Tea Leaf Salad");
    expect(html).toContain("$39.00"); // subtotal
    expect(html).toContain("$61.00"); // away from free delivery
    expect(html.toLowerCase()).toContain("complete your order");
    expect(html).toContain("https://delivery.mandalaymorningstar.com/menu");
  });

  it("hides the free-delivery nudge when the threshold is met", async () => {
    const html = visibleText(
      await render(
        <AbandonedCart
          customerName="Aung"
          items={[{ name: "Family Feast", quantity: 1, lineTotalCents: 12000 }]}
          itemCount={1}
          subtotalCents={12000}
          cartUrl="https://delivery.mandalaymorningstar.com/menu"
          amountToFreeDeliveryCents={0}
        />
      )
    );
    expect(html.toLowerCase()).not.toContain("away from free");
  });
});
