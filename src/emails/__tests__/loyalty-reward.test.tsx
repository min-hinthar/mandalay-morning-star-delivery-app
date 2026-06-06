import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";

import { LoyaltyReward } from "../LoyaltyReward";

function visibleText(html: string): string {
  return html.replace(/<!-- -->/g, "").replace(/&amp;/g, "&");
}

describe("LoyaltyReward email", () => {
  it("celebrates a milestone with the code, amount, and tier badge", async () => {
    const html = visibleText(
      await render(
        <LoyaltyReward
          customerName="Aung"
          rewardCents={800}
          promoCode="KYAYZU-ABC2345"
          menuUrl="https://mandalaymorningstar.com/menu"
          variant="milestone"
          milestone={10}
          tierName="Sein"
          tierEnglish="Diamond"
          tierEmoji="💎"
        />
      )
    );
    expect(html).toContain("Aung");
    expect(html).toContain("KYAYZU-ABC2345");
    expect(html).toContain("Kyay-Zu-Par!");
    expect(html).toContain("10 times");
    // Tier badge
    expect(html).toContain("Sein");
    expect(html).toContain("Diamond tier");
    // Warm, casual Burmese line
    expect(html).toContain("ကျေးဇူး");
  });

  it("renders the anniversary variant", async () => {
    const html = visibleText(
      await render(
        <LoyaltyReward
          customerName="Thiri"
          rewardCents={1000}
          promoCode="KYAYZU-ANNI567"
          menuUrl="https://mandalaymorningstar.com/menu"
          variant="anniversary"
          years={2}
        />
      )
    );
    expect(html).toContain("Thiri");
    expect(html).toContain("KYAYZU-ANNI567");
    expect(html).toContain("anniversary");
    expect(html).toContain("2 year");
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

  it("renders the expiring nudge with the day count", async () => {
    const html = visibleText(
      await render(
        <LoyaltyReward
          customerName="Ko"
          rewardCents={800}
          promoCode="KYAYZU-EXP1234"
          menuUrl="https://mandalaymorningstar.com/menu"
          variant="expiring"
          daysLeft={3}
        />
      )
    );
    expect(html).toContain("Ko");
    expect(html).toContain("KYAYZU-EXP1234");
    expect(html).toContain("expires");
    expect(html).toContain("in 3 days");
  });

  it("expiring nudge says 'tomorrow' at 1 day", async () => {
    const html = visibleText(
      await render(
        <LoyaltyReward
          customerName="Ko"
          rewardCents={800}
          promoCode="KYAYZU-EXP1235"
          menuUrl="https://mandalaymorningstar.com/menu"
          variant="expiring"
          daysLeft={1}
        />
      )
    );
    expect(html).toContain("tomorrow");
  });
});
