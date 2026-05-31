import { Button, Section, Text } from "@react-email/components";

import { EmailLayout } from "./components/EmailLayout";
import { FONT_STACK, SERIF_STACK, formatPrice } from "./helpers";

export interface LoyaltyRewardProps {
  customerName: string;
  rewardCents: number;
  /** One-time promo code to enter at checkout. */
  promoCode: string;
  menuUrl: string;
  /** "milestone" celebrates an order count; "thankyou" is the loyalty blast;
   * "anniversary" marks a year with the kitchen. */
  variant?: "milestone" | "thankyou" | "anniversary";
  /** Completed-order count for the milestone variant (e.g. 5, 10). */
  milestone?: number;
  /** Years with the kitchen, for the anniversary variant. */
  years?: number;
  /** Tier reached on this milestone (Burmese name + English gloss + emoji). */
  tierName?: string;
  tierEnglish?: string;
  tierEmoji?: string;
}

export function LoyaltyReward({
  customerName,
  rewardCents,
  promoCode,
  menuUrl,
  variant = "thankyou",
  milestone,
  years,
  tierName,
  tierEnglish,
  tierEmoji,
}: LoyaltyRewardProps) {
  const amount = formatPrice(rewardCents);
  const isMilestone = variant === "milestone" && typeof milestone === "number";
  const isAnniversary = variant === "anniversary" && typeof years === "number";
  const showTier = isMilestone && tierName && tierEmoji;

  const heading = isAnniversary
    ? `Happy ${years}-year anniversary! 🎉`
    : isMilestone
      ? `${milestone} orders in — Kyay-Zu-Par! 🙏`
      : "Kyay-Zu-Par! Thank you for being with us 🙏";

  const intro = isAnniversary ? (
    <>
      It&apos;s been <strong>{years} year(s)</strong> since your first order with us — what a
      journey to share. Here&apos;s <strong>{amount} off</strong> to celebrate, with our whole
      heart.
    </>
  ) : isMilestone ? (
    <>
      You&apos;ve ordered with us <strong>{milestone} times</strong> — that means the world to a
      small kitchen. Here&apos;s <strong>{amount} off</strong> your next feast as a thank-you.
    </>
  ) : (
    <>
      Thank you for being part of the Mandalay Morning Star family. As a small thank-you for your
      loyalty, here&apos;s <strong>{amount} off</strong> your next order.
    </>
  );

  const heroEmoji = isAnniversary ? "🎉" : "🙏";

  return (
    <EmailLayout
      emailType="confirmation"
      showReferral={false}
      previewText={`Kyay-Zu-Par! Here's ${amount} off, with love 💛`}
    >
      {/* Hero */}
      <Section style={{ padding: "32px 24px 8px 24px", textAlign: "center" as const }}>
        <Text style={{ fontSize: "30px", margin: "0 0 8px 0" }}>{heroEmoji}</Text>
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
          {heading}
        </Text>
        {showTier && (
          <Text
            style={{
              fontSize: "13px",
              fontFamily: FONT_STACK,
              fontWeight: 700,
              color: "#8B4513",
              backgroundColor: "#FFF9E6",
              border: "1px solid #F3E2B3",
              borderRadius: "999px",
              padding: "5px 14px",
              margin: "0 0 10px 0",
              display: "inline-block",
            }}
          >
            {tierEmoji} {tierName} · {tierEnglish} tier
          </Text>
        )}
        <Text
          style={{
            fontSize: "15px",
            fontFamily: FONT_STACK,
            color: "#374151",
            margin: "0",
            lineHeight: "1.6",
          }}
        >
          {customerName}, {intro}
        </Text>
        <Text
          style={{
            fontSize: "14px",
            fontFamily: FONT_STACK,
            color: "#92400E",
            margin: "10px 0 0 0",
            lineHeight: "1.6",
          }}
        >
          ကျေးဇူးအများကြီးတင်ပါတယ်နော် — နောက်ထပ်အော်ဒါအတွက် {amount} လျှော့ပေးလိုက်တယ် 💛
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
          Use this code at checkout ($50+) · ချက်အောက်မှာသုံးပါ
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
          Order with my reward · မီနူးကြည့်မယ်
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
          Every order earns a Star ⭐ — keep collecting toward your next thank-you.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default LoyaltyReward;
