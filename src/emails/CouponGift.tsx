import { Section, Text } from "@react-email/components";

import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";
import { BODY_FONT, C, DISPLAY_FONT, bodyStyle, cls, headingStyle } from "./components/theme";

export interface CouponGiftProps {
  customerName: string;
  /** Human label, e.g. "Free delivery" or "$10.00 off". */
  offerLabel: string;
  /** One-time code to enter at checkout. */
  promoCode: string;
  /** Pre-formatted expiry date, or null for no expiry. */
  expiresOn: string | null;
  /** Pre-formatted minimum subtotal, or null for none. */
  minimumLabel: string | null;
  /** Menu link (the code is entered at checkout). */
  menuUrl: string;
}

/** Admin-issued one-time coupon (free delivery / $ off / % off). */
export function CouponGift({
  customerName,
  offerLabel,
  promoCode,
  expiresOn,
  minimumLabel,
  menuUrl,
}: CouponGiftProps) {
  const terms = [
    "One-time use",
    minimumLabel ? `on orders of ${minimumLabel}+` : null,
    expiresOn ? `valid through ${expiresOn}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <EmailLayout
      emailType="reward"
      showReferral={false}
      previewText={`A gift for you: ${offerLabel} 🎁`}
    >
      {/* Hero */}
      <Section style={{ padding: "30px 28px 0 28px", textAlign: "center" as const }}>
        <Text style={{ fontSize: "30px", margin: "0 0 8px 0" }}>{"🎁"}</Text>
        <Text className={cls.ink} style={headingStyle(22)}>
          A little gift for you, {customerName}
        </Text>
        <Text className={cls.muted} style={bodyStyle(15)}>
          Enjoy <strong>{offerLabel.toLowerCase()}</strong> on your next Burmese feast — with love
          from Mandalay Morning Star.
        </Text>
      </Section>

      {/* Code ticket */}
      <Section style={{ padding: "20px 28px 0 28px" }}>
        <Text
          className={cls.muted}
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

      {/* CTA */}
      <Section style={{ padding: "22px 28px 0 28px", textAlign: "center" as const }}>
        <EmailButton href={menuUrl}>Use my gift</EmailButton>
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
          {terms}
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default CouponGift;
