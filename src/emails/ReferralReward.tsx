import { Section, Text } from "@react-email/components";

import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";
import { BODY_FONT, C, DISPLAY_FONT, bodyStyle, headingStyle } from "./components/theme";
import { formatPrice } from "./helpers";

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
      emailType="reward"
      showReferral={false}
      previewText={`Your friend ordered — here's ${amount} off 🎉`}
    >
      {/* Hero */}
      <Section style={{ padding: "30px 28px 0 28px", textAlign: "center" as const }}>
        <Text style={{ fontSize: "30px", margin: "0 0 8px 0" }}>{"🎉"}</Text>
        <Text style={headingStyle(22)}>Thank you for spreading the word, {referrerName}!</Text>
        <Text style={bodyStyle(15)}>
          A friend you referred just placed their first order — so here&apos;s{" "}
          <strong>{amount} off</strong> your next Burmese feast, on us.
        </Text>
      </Section>

      {/* Code ticket */}
      <Section style={{ padding: "20px 28px 0 28px" }}>
        <Text
          style={{
            fontSize: "13px",
            fontFamily: BODY_FONT,
            color: C.inkMuted,
            margin: "0 0 8px 0",
            textAlign: "center" as const,
          }}
        >
          Enter this code at checkout:
        </Text>
        <Section
          style={{
            backgroundColor: C.vellum,
            border: `1px solid ${C.goldLeaf}`,
            borderRadius: "12px",
            padding: "5px",
          }}
        >
          <Section
            style={{
              border: `1px dashed ${C.goldLeaf}`,
              borderRadius: "8px",
              padding: "14px 12px",
              textAlign: "center" as const,
            }}
          >
            <Text
              style={{
                fontSize: "22px",
                fontFamily: DISPLAY_FONT,
                fontWeight: 600,
                letterSpacing: "3px",
                color: C.accentStrong,
                margin: "0",
              }}
            >
              {promoCode}
            </Text>
          </Section>
        </Section>
      </Section>

      {/* CTA */}
      <Section style={{ padding: "22px 28px 0 28px", textAlign: "center" as const }}>
        <EmailButton href={menuUrl}>Order with my reward</EmailButton>
      </Section>

      <Section style={{ padding: "20px 28px 32px 28px" }}>
        <Text
          style={{
            fontSize: "12px",
            fontFamily: BODY_FONT,
            color: C.inkFaint,
            margin: "0",
            textAlign: "center" as const,
            lineHeight: 1.6,
          }}
        >
          Keep sharing your referral link — every friend who orders earns you another reward.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default ReferralReward;
