import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";

import { ReferralReward } from "../ReferralReward";

function visibleText(html: string): string {
  return html.replace(/<!-- -->/g, "").replace(/&amp;/g, "&");
}

describe("ReferralReward email", () => {
  it("shows the reward amount, the promo code, and a CTA", async () => {
    const html = visibleText(
      await render(
        <ReferralReward
          referrerName="Aung"
          rewardCents={1000}
          promoCode="THANKS-AB2C3D4"
          menuUrl="https://delivery.mandalaymorningstar.com/menu"
        />
      )
    );
    expect(html).toContain("Aung");
    expect(html).toContain("$10.00");
    expect(html).toContain("THANKS-AB2C3D4");
    expect(html.toLowerCase()).toContain("order with my reward");
    expect(html).toContain("https://delivery.mandalaymorningstar.com/menu");
  });
});
