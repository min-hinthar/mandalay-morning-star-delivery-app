import { Button, Section, Text } from "@react-email/components";

import { EmailLayout } from "./components/EmailLayout";
import { FONT_STACK, SERIF_STACK, formatPrice } from "./helpers";

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
      emailType="confirmation"
      previewText={`Welcome! Here's ${amount} off your first order 🎁`}
    >
      {/* Hero */}
      <Section style={{ padding: "32px 24px 8px 24px", textAlign: "center" as const }}>
        <Text style={{ fontSize: "30px", margin: "0 0 8px 0" }}>{"🙏"}</Text>
        <Text
          style={{
            fontSize: "22px",
            fontFamily: SERIF_STACK,
            color: "#8B4513",
            fontWeight: 700,
            margin: "0 0 6px 0",
            lineHeight: "1.3",
          }}
        >
          Mingalabar, {customerName}! Welcome to the family
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
          We cook real Burmese food, fresh for every delivery across LA. So glad you&apos;re here —
          here&apos;s a little welcome gift.
        </Text>
      </Section>

      {/* Offer */}
      <Section style={{ padding: "20px 24px 0 24px", textAlign: "center" as const }}>
        <Section
          style={{
            background: "linear-gradient(135deg, #FFF9E6 0%, #FBEFC8 100%)",
            border: "1px solid #F3E2B3",
            borderRadius: "14px",
            padding: "22px 20px",
          }}
        >
          <Text
            style={{
              fontSize: "30px",
              fontFamily: SERIF_STACK,
              fontWeight: 700,
              color: "#A41034",
              margin: "0 0 2px 0",
            }}
          >
            {amount} off your first order
          </Text>
          <Text style={{ fontSize: "13px", fontFamily: FONT_STACK, color: "#92400E", margin: "0" }}>
            Applied automatically on orders $50+ · ပထမဆုံးအော်ဒါ {amount} လျှော့ပေးထားတယ်နော် 😊
          </Text>
        </Section>
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
          Explore the menu · မီနူးကြည့်မယ်
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
          Delivered Mon · Wed · Thu · Sat across Los Angeles. We can&apos;t wait to feed you.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default WelcomeOffer;
