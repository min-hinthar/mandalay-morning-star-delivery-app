import { Section, Text } from "@react-email/components";

import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";
import { TierPerkCard, type TierPerkData } from "./components/TierPerkCard";
import {
  BODY_FONT,
  BURMESE_FONT,
  C,
  DISPLAY_FONT,
  bodyStyle,
  burmeseStyle,
  cls,
  headingStyle,
} from "./components/theme";
import { formatPrice } from "./helpers";
import { expiringDayLabel } from "@/lib/loyalty/copy";

export interface LoyaltyRewardProps {
  customerName: string;
  rewardCents: number;
  /** One-time promo code to enter at checkout. */
  promoCode: string;
  menuUrl: string;
  /** "milestone" celebrates an order count; "thankyou" is the loyalty blast;
   * "anniversary" marks a year with the kitchen; "expiring" nudges before TTL. */
  variant?: "milestone" | "thankyou" | "anniversary" | "expiring";
  /** Completed-order count for the milestone variant (e.g. 5, 10). */
  milestone?: number;
  /** Years with the kitchen, for the anniversary variant. */
  years?: number;
  /** Whole days until the reward expires, for the expiring variant. */
  daysLeft?: number;
  /** Tier reached on this milestone (Burmese name + English gloss + emoji). */
  tierName?: string;
  tierEnglish?: string;
  tierEmoji?: string;
  /** Tier + headline perk (real data) — renders nothing when absent. */
  tier?: TierPerkData | null;
}

export function LoyaltyReward({
  customerName,
  rewardCents,
  promoCode,
  menuUrl,
  variant = "thankyou",
  milestone,
  years,
  daysLeft,
  tierName,
  tierEnglish,
  tierEmoji,
  tier,
}: LoyaltyRewardProps) {
  const amount = formatPrice(rewardCents);
  const isMilestone = variant === "milestone" && typeof milestone === "number";
  const isAnniversary = variant === "anniversary" && typeof years === "number";
  const isExpiring = variant === "expiring";
  // Show the tier chip on any celebratory variant (milestone/anniversary/
  // thank-you) when tier props are supplied — skip the "hurry up" expiring nudge.
  const showTier = !isExpiring && Boolean(tierName && tierEmoji);
  const dayLabel = expiringDayLabel(daysLeft);

  const heading = isExpiring
    ? `Don't let your ${amount} slip away! ⏳`
    : isAnniversary
      ? `Happy ${years}-year anniversary! 🎉`
      : isMilestone
        ? `${milestone} orders in — Kyay-Zu-Par! 🙏`
        : "Kyay-Zu-Par! Thank you for being with us 🙏";

  const intro = isExpiring ? (
    <>
      Your <strong>{amount} off</strong> Kyay-Zu-Par! reward expires <strong>{dayLabel}</strong>.
      Treat yourself to a Burmese feast before it&apos;s gone — we saved you a seat at the table.
    </>
  ) : isAnniversary ? (
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

  const heroEmoji = isExpiring ? "⏳" : isAnniversary ? "🎉" : "🙏";
  const previewText = isExpiring
    ? `Your ${amount} Kyay-Zu-Par! reward expires ${dayLabel} ⏳`
    : `Kyay-Zu-Par! Here's ${amount} off, with love 💛`;

  return (
    <EmailLayout emailType="reward" showReferral={false} previewText={previewText}>
      {/* Hero */}
      <Section style={{ padding: "30px 28px 0 28px", textAlign: "center" as const }}>
        <Text style={{ fontSize: "30px", margin: "0 0 8px 0" }}>{heroEmoji}</Text>
        <Text className={cls.ink} style={headingStyle(22)}>
          {heading}
        </Text>
        {showTier && (
          <Text
            className={`${cls.goldTint} ${cls.goldBorder} ${cls.goldDeep}`}
            style={{
              fontSize: "13px",
              fontFamily: BODY_FONT,
              fontWeight: 700,
              color: C.goldDeep,
              backgroundColor: C.goldTint,
              border: `1px solid ${C.goldTintBorder}`,
              borderRadius: "999px",
              padding: "5px 14px",
              margin: "0 0 10px 0",
              display: "inline-block",
            }}
          >
            {tierEmoji} {tierName} · {tierEnglish} tier
          </Text>
        )}
        <Text className={cls.muted} style={bodyStyle(15)}>
          {customerName}, {intro}
        </Text>
        <Text
          className={cls.goldDeep}
          style={{ ...burmeseStyle(14), color: C.goldDeep, margin: "10px 0 0 0" }}
        >
          ကျေးဇူးအများကြီးတင်ပါတယ်နော် — နောက်ထပ်အော်ဒါအတွက် {amount} လျှော့ပေးလိုက်တယ် 💛
        </Text>
      </Section>

      {/* Code ticket */}
      <Section style={{ padding: "20px 28px 0 28px" }}>
        <Text
          className={cls.muted}
          style={{
            fontSize: "13px",
            fontFamily: BURMESE_FONT,
            color: C.inkMuted,
            margin: "0 0 8px 0",
            textAlign: "center" as const,
          }}
        >
          Use this code at checkout ($50+) · ချက်အောက်မှာသုံးပါ
        </Text>
        <Section
          className={`${cls.vellum} ${cls.goldLeaf}`}
          style={{
            backgroundColor: C.vellum,
            border: `1px solid ${C.goldLeaf}`,
            borderRadius: "12px",
            padding: "5px",
          }}
        >
          <Section
            className={cls.goldLeaf}
            style={{
              border: `1px dashed ${C.goldLeaf}`,
              borderRadius: "8px",
              padding: "14px 12px",
              textAlign: "center" as const,
            }}
          >
            <Text
              className={cls.accentStrong}
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

      {/* Tier perk (real data) — adds the headline perk under the reward */}
      <TierPerkCard tier={tier} />

      {/* CTA */}
      <Section style={{ padding: "22px 28px 0 28px", textAlign: "center" as const }}>
        <EmailButton href={menuUrl}>Order with my reward · မီနူးကြည့်မယ်</EmailButton>
      </Section>

      <Section style={{ padding: "20px 28px 32px 28px" }}>
        <Text
          className={cls.faint}
          style={{
            fontSize: "12px",
            fontFamily: BODY_FONT,
            color: C.inkFaint,
            margin: "0",
            textAlign: "center" as const,
            lineHeight: 1.6,
          }}
        >
          Every order earns a Star ⭐ — keep collecting toward your next thank-you.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default LoyaltyReward;
