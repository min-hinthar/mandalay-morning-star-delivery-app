import { Section, Text } from "@react-email/components";
import { BODY_FONT, BURMESE_FONT, C, DISPLAY_FONT } from "./theme";

/** Computed server-side from real lifetime spend — display only. */
export interface TierPerkData {
  /** Tier display name, e.g. "Diamond". */
  tierEnglish: string;
  /** Romanized Burmese tier name, e.g. "Sein". */
  tierName: string;
  emoji: string;
  /** The headline perk for this tier. */
  perkEn: string;
  perkMy: string;
}

interface TierPerkCardProps {
  tier?: TierPerkData | null;
}

/** One-line tier badge + nearest perk, for retention emails. */
export function TierPerkCard({ tier }: TierPerkCardProps) {
  if (!tier) return null;

  return (
    <Section style={{ padding: "20px 28px 0 28px" }}>
      <Section
        style={{
          backgroundColor: C.clayTint,
          border: `1px solid ${C.clayTintBorder}`,
          borderRadius: "12px",
          padding: "14px 18px",
          textAlign: "center" as const,
        }}
      >
        <Text
          style={{
            fontSize: "14px",
            fontFamily: DISPLAY_FONT,
            fontWeight: 600,
            color: C.accentStrong,
            margin: "0 0 3px 0",
          }}
        >
          {tier.emoji} You&apos;re {tier.tierEnglish} tier
          {tier.tierName !== tier.tierEnglish ? ` — ${tier.tierName}` : ""}
        </Text>
        <Text
          style={{
            fontSize: "13px",
            fontFamily: BODY_FONT,
            color: C.ink,
            margin: "0 0 2px 0",
            lineHeight: 1.5,
          }}
        >
          {tier.perkEn}
        </Text>
        <Text
          style={{
            fontSize: "12px",
            fontFamily: BURMESE_FONT,
            color: C.inkMuted,
            margin: "0",
            lineHeight: 1.7,
          }}
        >
          {tier.perkMy}
        </Text>
      </Section>
    </Section>
  );
}
