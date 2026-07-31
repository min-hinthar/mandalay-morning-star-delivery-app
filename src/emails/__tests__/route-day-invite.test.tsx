import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";

import { RouteDayInvite } from "../RouteDayInvite";

function visibleText(html: string): string {
  return html.replace(/<!-- -->/g, "");
}

const DISHES = [
  { name: "Mohinga", imageUrl: "https://cdn.example.com/mohinga.jpg", slug: "mohinga" },
  { name: "Tea Leaf Salad", imageUrl: null, slug: "tea-leaf-salad" },
];

describe("RouteDayInvite — route-day awareness email", () => {
  it("leads with the run + deadline and shows real dish photos", async () => {
    const html = visibleText(
      await render(
        <RouteDayInvite
          customerName="Aung Myo"
          headline="We're driving the West Route this Wednesday"
          cutoffText="Order by Tuesday 3 PM for Wednesday delivery"
          dayName="Wednesday"
          featuredItems={DISHES}
        />
      )
    );

    expect(html).toContain("We&#x27;re driving the West Route this Wednesday");
    expect(html).toContain("Order by Tuesday 3 PM for Wednesday delivery");
    expect(html).toContain("Aung Myo");
    // Hostable photo renders; the photoless dish falls back to an initial tile.
    expect(html).toContain("https://cdn.example.com/mohinga.jpg");
    expect(html).toContain("Tea Leaf Salad");
    // Bilingual line present.
    expect(html).toContain("သင့်ဒေသသို့ ပို့ဆောင်မည်");
  });

  it("never implies other customers ordered, and offers no discount", async () => {
    const html = visibleText(
      await render(
        <RouteDayInvite
          customerName="Aung Myo"
          headline="We're delivering this Monday"
          cutoffText="Order by Sunday 3 PM for Monday delivery"
          dayName="Monday"
          featuredItems={DISHES}
        />
      )
    );
    // Guard the product decision: awareness only — no social proof, no coupon.
    expect(html).not.toMatch(/neighbou?rs? (have |already )?ordered/i);
    expect(html).not.toMatch(/\bothers? (are |have )?order/i);
    expect(html).not.toMatch(/\d+% off|promo code|discount code/i);
  });

  it("renders without dishes (menu photos unavailable) rather than breaking", async () => {
    const html = visibleText(
      await render(
        <RouteDayInvite
          customerName="Aung Myo"
          headline="We're delivering this Saturday"
          cutoffText="Order by Friday 3 PM for Saturday delivery"
          dayName="Saturday"
        />
      )
    );
    expect(html).toContain("We&#x27;re delivering this Saturday");
    expect(html).not.toContain("On the menu");
  });
});
