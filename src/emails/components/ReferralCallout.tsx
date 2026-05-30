import { Button, Section, Text } from "@react-email/components";

const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
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
    <Section style={{ padding: "8px 24px 0 24px" }}>
      <Section
        style={{
          background: "linear-gradient(135deg, #FFF9E6 0%, #FBEFC8 100%)",
          border: "1px solid #F3E2B3",
          borderRadius: "14px",
          padding: "24px 20px",
          textAlign: "center" as const,
        }}
      >
        <Text style={{ fontSize: "26px", margin: "0 0 8px 0" }}>{"💛"}</Text>
        <Text
          style={{
            fontSize: "17px",
            fontFamily: SANS,
            fontWeight: 700,
            color: "#8B4513",
            margin: "0 0 4px 0",
          }}
        >
          Loved it? Share the love — you both get $10
        </Text>
        <Text
          style={{
            fontSize: "14px",
            fontFamily: SANS,
            color: "#92400E",
            margin: "0 0 16px 0",
            lineHeight: "1.5",
          }}
        >
          ချစ်ရင် ပြောပြလိုက်ပါနော် 😘 — သူငယ်ချင်းရော သင်ရော $၁၀ စီ ရမယ်နော်
        </Text>
        <Button
          href={href}
          style={{
            backgroundColor: "#A41034",
            color: "#FFFFFF",
            fontFamily: SANS,
            fontSize: "15px",
            fontWeight: 700,
            borderRadius: "8px",
            padding: "12px 28px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Share your link · မျှဝေမယ်
        </Button>
      </Section>
    </Section>
  );
}

export default ReferralCallout;
