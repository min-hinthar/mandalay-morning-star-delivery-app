import { Section, Text } from "@react-email/components";
import { EmailButton } from "./EmailButton";
import { BURMESE_FONT, C, DISPLAY_FONT, cls } from "./theme";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://mandalaymorningstar.com";

interface ReferralCalloutProps {
  /** Tag the source so referral signups can be attributed. */
  source?: string;
}

/**
 * Warm, bilingual "refer a friend" block for the highest-intent moment — right
 * after an order is placed or delivered. Both sides get $10.
 */
export function ReferralCallout({ source = "email" }: ReferralCalloutProps) {
  const href = `${APP_URL}/account?tab=settings&src=${encodeURIComponent(source)}`;
  return (
    <Section style={{ padding: "20px 28px 0 28px" }}>
      <Section
        className={`${cls.vellum} ${cls.goldLeaf}`}
        style={{
          backgroundColor: C.vellum,
          border: `1px solid ${C.goldLeaf}`,
          borderRadius: "14px",
          padding: "24px 22px",
          textAlign: "center" as const,
        }}
      >
        <Text style={{ fontSize: "26px", margin: "0 0 8px 0" }}>{"💛"}</Text>
        <Text
          className={cls.ink}
          style={{
            fontSize: "18px",
            fontFamily: DISPLAY_FONT,
            fontWeight: 600,
            color: C.ink,
            margin: "0 0 4px 0",
            lineHeight: 1.3,
          }}
        >
          Loved it? Share the love {"—"} you both get $10
        </Text>
        <Text
          className={cls.muted}
          style={{
            fontSize: "14px",
            fontFamily: BURMESE_FONT,
            color: C.inkMuted,
            margin: "0 0 16px 0",
            lineHeight: "1.7",
          }}
        >
          ချစ်ရင် ပြောပြလိုက်ပါနော် 😘 — သူငယ်ချင်းရော သင်ရော $၁၀ စီ ရမယ်နော်
        </Text>
        <EmailButton href={href}>Share your link {"·"} မျှဝေမယ်</EmailButton>
      </Section>
    </Section>
  );
}

export default ReferralCallout;
