import { Section, Text } from "@react-email/components";

import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";
import {
  BODY_FONT,
  BURMESE_FONT,
  C,
  DISPLAY_FONT,
  bodyStyle,
  cls,
  headingStyle,
} from "./components/theme";
import { formatPrice } from "./helpers";

export interface WelcomeOfferProps {
  customerName: string;
  /** Welcome discount in cents (auto-applies to the first $50+ order). */
  discountCents: number;
  menuUrl: string;
}

export function WelcomeOffer({ customerName, discountCents, menuUrl }: WelcomeOfferProps) {
  const amount = formatPrice(discountCents);

  return (
    <EmailLayout
      emailType="welcome"
      previewText={`Welcome! Here's ${amount} off your first order 🎁`}
    >
      {/* Hero */}
      <Section style={{ padding: "30px 28px 0 28px", textAlign: "center" as const }}>
        <Text style={{ fontSize: "30px", margin: "0 0 8px 0" }}>{"🙏"}</Text>
        <Text className={cls.ink} style={{ ...headingStyle(22), margin: "0 0 6px 0" }}>
          Mingalabar, {customerName}! Welcome to the family
        </Text>
        <Text className={cls.muted} style={bodyStyle(15)}>
          We cook real Burmese food, fresh for every delivery across LA. So glad you&apos;re here —
          here&apos;s a little welcome gift.
        </Text>
      </Section>

      {/* Offer ticket */}
      <Section style={{ padding: "20px 28px 0 28px" }}>
        <Section
          className={`${cls.vellum} ${cls.goldLeaf}`}
          style={{
            backgroundColor: C.vellum,
            border: `1px solid ${C.goldLeaf}`,
            borderRadius: "14px",
            padding: "5px",
          }}
        >
          <Section
            className={cls.goldLeaf}
            style={{
              border: `1px dashed ${C.goldLeaf}`,
              borderRadius: "10px",
              padding: "18px 16px",
              textAlign: "center" as const,
            }}
          >
            <Text
              className={cls.accentStrong}
              style={{
                fontSize: "26px",
                fontFamily: DISPLAY_FONT,
                fontWeight: 600,
                color: C.accentStrong,
                margin: "0 0 4px 0",
                lineHeight: 1.25,
              }}
            >
              {amount} off your first order
            </Text>
            <Text
              className={cls.goldDeep}
              style={{
                fontSize: "13px",
                fontFamily: BURMESE_FONT,
                color: C.goldDeep,
                margin: "0",
                lineHeight: 1.7,
              }}
            >
              Applied automatically on orders $50+ · ပထမဆုံးအော်ဒါ {amount} လျှော့ပေးထားတယ်နော် 😊
            </Text>
          </Section>
        </Section>
      </Section>

      {/* CTA */}
      <Section style={{ padding: "22px 28px 0 28px", textAlign: "center" as const }}>
        <EmailButton href={menuUrl}>Explore the menu · မီနူးကြည့်မယ်</EmailButton>
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
          Delivered Mon · Wed · Thu · Sat across Los Angeles. We can&apos;t wait to feed you.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default WelcomeOffer;
