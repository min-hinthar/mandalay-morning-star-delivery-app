import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";

import { LoyaltyReward } from "../LoyaltyReward";

function visibleText(html: string): string {
  return html.replace(/<!-- -->/g, "").replace(/&amp;/g, "&");
}

describe("LoyaltyReward email", () => {
  it("celebrates a milestone with the code and amount", async () => {
    const html = visibleText(
      await render(
        <LoyaltyReward
          customerName="Aung"
          rewardCents={500}
          promoCode="KYAYZU-ABC2345"
          menuUrl="https://mandalaymorningstar.com/menu"
          variant="milestone"
          milestone={5}
        />
      )
    );
    expect(html).toContain("Aung");
    expect(html).toContain("KYAYZU-ABC2345");
    expect(html).toContain("Kyay-Zu-Par!");
    expect(html).toContain("5 times");
    // Warm, casual Burmese line
    expect(html).toContain("ကျေးဇူး");
  });

  it("renders the thank-you variant", async () => {
    const html = visibleText(
      await render(
        <LoyaltyReward
          customerName="Mya"
          rewardCents={500}
          promoCode="KYAYZU-XYZ7890"
          menuUrl="https://mandalaymorningstar.com/menu"
          variant="thankyou"
        />
      )
    );
    expect(html).toContain("Mya");
    expect(html).toContain("KYAYZU-XYZ7890");
    expect(html).toContain("family");
  });
});
