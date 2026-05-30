import { Button, Section, Text } from "@react-email/components";

import { EmailLayout } from "./components/EmailLayout";
import { FONT_STACK, SERIF_STACK } from "./helpers";
import { freeDeliveryPromoLine } from "@/lib/utils/delivery-promo";

export interface WinBackProps {
  customerName: string;
  /** Link to the menu / current week's offerings. */
  menuUrl: string;
}

export function WinBack({ customerName, menuUrl }: WinBackProps) {
  return (
    <EmailLayout
      emailType="reminder"
      previewText="We've missed you — your Burmese favorites are waiting 🍜"
    >
      {/* Hero */}
      <Section style={{ padding: "32px 24px 8px 24px", textAlign: "center" as const }}>
        <Text style={{ fontSize: "30px", margin: "0 0 8px 0" }}>{"🍜"}</Text>
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
          We&apos;ve missed you, {customerName}!
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
          It&apos;s been a little while since your last feast. Our kitchen is still cooking up the
          Mandalay classics you love — fresh, every delivery day.
        </Text>
      </Section>

      {/* Reassurance row */}
      <Section style={{ padding: "16px 24px 0 24px" }}>
        <table
          cellPadding="0"
          cellSpacing="0"
          style={{ width: "100%", borderCollapse: "collapse" as const }}
        >
          <tbody>
            <tr>
              {[
                { icon: "🥢", label: "Handmade fresh" },
                { icon: "🚚", label: "Weekly delivery" },
                { icon: "⭐", label: "Local favorite" },
              ].map((cell) => (
                <td
                  key={cell.label}
                  style={{ width: "33%", textAlign: "center" as const, padding: "8px" }}
                >
                  <Text style={{ fontSize: "22px", margin: "0 0 4px 0" }}>{cell.icon}</Text>
                  <Text
                    style={{
                      fontSize: "12px",
                      fontFamily: FONT_STACK,
                      color: "#6B7280",
                      margin: "0",
                    }}
                  >
                    {cell.label}
                  </Text>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
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
          See this week&apos;s menu
        </Button>
      </Section>

      {/* Promo line */}
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
          {freeDeliveryPromoLine()}. We hope to see you back at the table soon.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default WinBack;
