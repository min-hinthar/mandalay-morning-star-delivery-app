import { Section, Text } from "@react-email/components";

import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";
import { NextDeliveryTeaser } from "./components/NextDeliveryTeaser";
import { TierPerkCard, type TierPerkData } from "./components/TierPerkCard";
import { BODY_FONT, C, bodyStyle, cls, headingStyle } from "./components/theme";
import { freeDeliveryPromoLine } from "@/lib/utils/delivery-promo";

export interface WinBackProps {
  customerName: string;
  /** Link to the menu / current week's offerings. */
  menuUrl: string;
  /** Tier badge + headline perk (real data) — renders nothing when absent. */
  tier?: TierPerkData | null;
  /** Live "order by … for … delivery" line — renders nothing when absent. */
  nextDeliveryCutoffText?: string | null;
}

export function WinBack({ customerName, menuUrl, tier, nextDeliveryCutoffText }: WinBackProps) {
  return (
    <EmailLayout
      emailType="winback"
      previewText="We've missed you — your Burmese favorites are waiting 🍜"
    >
      {/* Hero */}
      <Section style={{ padding: "30px 28px 8px 28px", textAlign: "center" as const }}>
        <Text style={{ fontSize: "30px", margin: "0 0 8px 0" }}>{"🍜"}</Text>
        <Text className={cls.ink} style={headingStyle(22)}>
          We&apos;ve missed you, {customerName}!
        </Text>
        <Text className={cls.muted} style={bodyStyle(15)}>
          It&apos;s been a little while since your last feast. Our kitchen is still cooking up the
          Mandalay classics you love — fresh, every delivery day.
        </Text>
      </Section>

      {/* Reassurance row */}
      <Section style={{ padding: "16px 28px 0 28px" }}>
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
                    className={cls.muted}
                    style={{
                      fontSize: "12px",
                      fontFamily: BODY_FONT,
                      fontWeight: 600,
                      color: C.inkMuted,
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

      {/* Tier perk (real data) — remind them what their loyalty earned */}
      <TierPerkCard tier={tier} />

      {/* CTA */}
      <Section style={{ padding: "20px 28px 0 28px", textAlign: "center" as const }}>
        <EmailButton href={menuUrl}>See this week&apos;s menu</EmailButton>
      </Section>

      {/* Next delivery cutoff (live schedule) */}
      <NextDeliveryTeaser cutoffText={nextDeliveryCutoffText} />

      {/* Promo line */}
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
          {freeDeliveryPromoLine()}. We hope to see you back at the table soon.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default WinBack;
