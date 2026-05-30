import { Button, Section, Text } from "@react-email/components";

import { EmailLayout } from "./components/EmailLayout";
import { FONT_STACK, SERIF_STACK, formatPrice } from "./helpers";

export interface ReferralRewardProps {
  referrerName: string;
  rewardCents: number;
  /** One-time promo code to enter at checkout. */
  promoCode: string;
  menuUrl: string;
}

export function ReferralReward({
  referrerName,
  rewardCents,
  promoCode,
  menuUrl,
}: ReferralRewardProps) {
  const amount = formatPrice(rewardCents);

  return (
    <EmailLayout
      emailType="confirmation"
      previewText={`Your friend ordered — here's ${amount} off 🎉`}
    >
      {/* Hero */}
      <Section style={{ padding: "32px 24px 8px 24px", textAlign: "center" as const }}>
        <Text style={{ fontSize: "30px", margin: "0 0 8px 0" }}>{"🎉"}</Text>
        <Text
          style={{
            fontSize: "22px",
            fontFamily: SERIF_STACK,
            color: "#8B4513",
            fontWeight: 700,
            margin: "0 0 8px 0",
            lineHeight: "1.3",
          }}
        >
          Thank you for spreading the word, {referrerName}!
        </Text>
        <Text
          style={{
            fontSize: "15px",
            fontFamily: FONT_STACK,
            color: "#374151",
            margin: "0",
            lineHeight: "1.6",
          }}
        >
          A friend you referred just placed their first order — so here&apos;s{" "}
          <strong>{amount} off</strong> your next Burmese feast, on us.
        </Text>
      </Section>

      {/* Code */}
      <Section style={{ padding: "20px 24px 0 24px", textAlign: "center" as const }}>
        <Text
          style={{
            fontSize: "13px",
            fontFamily: FONT_STACK,
            color: "#6B7280",
            margin: "0 0 8px 0",
          }}
        >
          Enter this code at checkout:
        </Text>
        <Text
          style={{
            fontSize: "26px",
            fontFamily: FONT_STACK,
            fontWeight: 700,
            letterSpacing: "3px",
            color: "#8B4513",
            backgroundColor: "#FFF9E6",
            border: "1px solid #F3E2B3",
            borderRadius: "10px",
            padding: "14px 0",
            margin: "0",
            display: "block",
          }}
        >
          {promoCode}
        </Text>
      </Section>

      {/* CTA */}
      <Section style={{ padding: "20px 24px 0 24px", textAlign: "center" as const }}>
        <Button
          href={menuUrl}
          style={{
            backgroundColor: "#A41034",
            color: "#FFFFFF",
            fontFamily: FONT_STACK,
            fontSize: "16px",
            fontWeight: 700,
            borderRadius: "8px",
            padding: "14px 36px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Order with my reward
        </Button>
      </Section>

      <Section style={{ padding: "20px 24px 32px 24px" }}>
        <Text
          style={{
            fontSize: "12px",
            fontFamily: FONT_STACK,
            color: "#9CA3AF",
            margin: "0",
            textAlign: "center" as const,
            lineHeight: "1.6",
          }}
        >
          Keep sharing your referral link — every friend who orders earns you another reward.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default ReferralReward;
