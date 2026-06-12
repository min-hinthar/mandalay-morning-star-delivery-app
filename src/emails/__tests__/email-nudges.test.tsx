import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";

import { LoyaltyProgress } from "../components/LoyaltyProgress";
import { NextDeliveryTeaser } from "../components/NextDeliveryTeaser";
import { TierPerkCard } from "../components/TierPerkCard";
import { OrderDelivered } from "../OrderDelivered";

describe("LoyaltyProgress nudge", () => {
  it("shows real cycle progress and the next reward", async () => {
    const html = await render(
      <LoyaltyProgress
        loyalty={{
          stars: 7,
          progressInCycle: 2,
          ordersToNext: 3,
          nextRewardCents: 800,
          tierEnglish: "Diamond",
          tierEmoji: "💎",
        }}
      />
    );

    expect(html).toContain("3");
    expect(html).toContain("orders");
    expect(html).toContain("$8");
    expect(html).toContain("Diamond");
    expect(html).toContain("Morning Star Rewards");
  });

  it("celebrates a just-earned reward when the cycle resets", async () => {
    const html = await render(
      <LoyaltyProgress
        loyalty={{
          stars: 5,
          progressInCycle: 0,
          ordersToNext: 5,
          nextRewardCents: 500,
          tierEnglish: "New Friend",
          tierEmoji: "⭐",
        }}
      />
    );

    expect(html).toContain("You just earned a");
    expect(html).toContain("$5");
    expect(html).toContain("rewards wallet");
  });

  it("renders nothing without data or with zero stars", async () => {
    expect(await render(<LoyaltyProgress loyalty={null} />)).not.toContain("Morning Star Rewards");
    expect(
      await render(
        <LoyaltyProgress
          loyalty={{
            stars: 0,
            progressInCycle: 0,
            ordersToNext: 5,
            nextRewardCents: 500,
            tierEnglish: "New Friend",
            tierEmoji: "⭐",
          }}
        />
      )
    ).not.toContain("Morning Star Rewards");
  });
});

describe("NextDeliveryTeaser nudge", () => {
  it("shows the live cutoff line", async () => {
    const html = await render(
      <NextDeliveryTeaser cutoffText="Order by Tuesday 3 PM for Wednesday delivery" />
    );
    expect(html).toContain("Order by Tuesday 3 PM for Wednesday delivery");
    expect(html).toContain("Plan your next feast");
  });

  it("renders nothing without a cutoff", async () => {
    expect(await render(<NextDeliveryTeaser cutoffText={null} />)).not.toContain(
      "Plan your next feast"
    );
  });
});

describe("TierPerkCard nudge", () => {
  it("shows the tier and its headline perk, bilingual", async () => {
    const html = await render(
      <TierPerkCard
        tier={{
          tierEnglish: "Ruby",
          tierName: "Padamya",
          emoji: "♦️",
          perkEn: "Early access to new specials",
          perkMy: "အထူးမီနူးအသစ်များ စောစီးစွာ ဝင်ကြည့်ခွင့်",
        }}
      />
    );
    expect(html).toContain("Ruby");
    expect(html).toContain("Padamya");
    expect(html).toContain("Early access to new specials");
    expect(html).toContain("ဝင်ကြည့်ခွင့်");
  });
});

describe("OrderDelivered with nudges", () => {
  it("includes loyalty progress, the delivery teaser, and the reorder CTA", async () => {
    const html = await render(
      <OrderDelivered
        customerName="Aung"
        orderId="abc12345-6789"
        itemCount={2}
        itemNames={["Mohinga", "Tea Leaf Salad"]}
        totalCents={4300}
        loyalty={{
          stars: 4,
          progressInCycle: 4,
          ordersToNext: 1,
          nextRewardCents: 500,
          tierEnglish: "New Friend",
          tierEmoji: "⭐",
        }}
        nextDeliveryCutoffText="Order by Friday 3 PM for Saturday delivery"
      />
    );

    expect(html).toContain("Order Again");
    expect(html).toContain("1");
    expect(html).toContain("$5");
    expect(html).toContain("Order by Friday 3 PM for Saturday delivery");
  });

  it("omits the nudges cleanly when no data is passed", async () => {
    const html = await render(
      <OrderDelivered
        customerName="Aung"
        orderId="abc12345-6789"
        itemCount={1}
        itemNames={["Mohinga"]}
        totalCents={1400}
      />
    );

    expect(html).not.toContain("Morning Star Rewards");
    expect(html).not.toContain("Plan your next feast");
    expect(html).toContain("Order Again");
  });
});
