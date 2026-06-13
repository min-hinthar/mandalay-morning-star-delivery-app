import { Link, Section, Text } from "@react-email/components";
import { LOYALTY_MILESTONE_STEP } from "@/lib/loyalty";
import { BODY_FONT, BURMESE_FONT, C, DISPLAY_FONT, cls } from "./theme";

/** Computed server-side at send time from real loyalty data — never fabricated. */
export interface LoyaltyProgressData {
  /** Qualifying order count (Stars). */
  stars: number;
  /** Stars into the current 5-order cycle (0–4). */
  progressInCycle: number;
  /** Orders remaining to the next milestone (1–5, never ≤ 0). */
  ordersToNext: number;
  /** Tier-sized coupon (cents) earned at the next milestone. */
  nextRewardCents: number;
  /** Current tier display name, e.g. "Diamond". */
  tierEnglish: string;
  tierEmoji: string;
}

interface LoyaltyProgressProps {
  loyalty?: LoyaltyProgressData | null;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://mandalaymorningstar.com";
const CYCLE = LOYALTY_MILESTONE_STEP;

/**
 * Compact Morning Star Rewards strip for order emails: five star slots, the
 * real cycle progress, and how close the next reward is. When the order that
 * triggered this email just crossed a milestone (progress resets to 0), it
 * celebrates the earned reward instead.
 */
export function LoyaltyProgress({ loyalty }: LoyaltyProgressProps) {
  if (!loyalty || loyalty.stars <= 0) return null;

  const justEarned = loyalty.progressInCycle === 0;
  const reward = `$${(loyalty.nextRewardCents / 100).toFixed(0)}`;
  const filled = justEarned ? CYCLE : loyalty.progressInCycle;

  return (
    <Section style={{ padding: "20px 28px 0 28px" }}>
      <Section
        className={`${cls.vellum} ${cls.goldLeaf}`}
        style={{
          backgroundColor: C.vellum,
          border: `1px solid ${C.goldLeaf}`,
          borderRadius: "14px",
          padding: "18px 22px",
          textAlign: "center" as const,
        }}
      >
        <Text
          className={cls.goldDeep}
          style={{
            fontSize: "10px",
            fontFamily: BODY_FONT,
            fontWeight: 700,
            color: C.goldDeep,
            textTransform: "uppercase" as const,
            letterSpacing: "2px",
            margin: "0 0 10px 0",
          }}
        >
          {loyalty.tierEmoji} Morning Star Rewards {"·"} {loyalty.tierEnglish}
        </Text>

        {/* Five star slots — real cycle progress */}
        <Text
          style={{
            fontSize: "22px",
            letterSpacing: "8px",
            margin: "0 0 10px 0",
            lineHeight: 1,
          }}
        >
          {Array.from({ length: CYCLE }).map((_, i) => (
            <span key={i} style={{ color: i < filled ? C.gold : C.lineStrong }}>
              {"★"}
            </span>
          ))}
        </Text>

        {justEarned ? (
          <>
            <Text
              className={cls.ink}
              style={{
                fontSize: "15px",
                fontFamily: DISPLAY_FONT,
                fontWeight: 600,
                color: C.ink,
                margin: "0 0 2px 0",
              }}
            >
              {"✨"} You just earned a {reward} reward!
            </Text>
            {/* "on its way", not "waiting": issuance can lag the email on some
                payment paths — never promise a wallet row that may not exist yet */}
            <Text
              className={cls.muted}
              style={{
                fontSize: "13px",
                fontFamily: BODY_FONT,
                color: C.inkMuted,
                margin: "0 0 8px 0",
              }}
            >
              It&apos;s on its way to your rewards wallet {"—"} use it on your next order.
            </Text>
          </>
        ) : (
          <>
            <Text
              className={cls.ink}
              style={{
                fontSize: "14px",
                fontFamily: BODY_FONT,
                color: C.ink,
                margin: "0 0 2px 0",
              }}
            >
              <strong>
                {loyalty.ordersToNext} {loyalty.ordersToNext === 1 ? "order" : "orders"}
              </strong>{" "}
              to your next <strong>{reward} reward</strong>
            </Text>
            <Text
              className={cls.muted}
              style={{
                fontSize: "12px",
                fontFamily: BURMESE_FONT,
                color: C.inkMuted,
                margin: "0 0 8px 0",
                lineHeight: 1.7,
              }}
            >
              နောက် {loyalty.ordersToNext} ကြိမ်ဆို {reward} ဆုလက်ဆောင် ရပါမယ်
            </Text>
          </>
        )}

        <Link
          href={`${APP_URL}/account?tab=rewards&src=email_loyalty`}
          className={cls.accent}
          style={{
            fontSize: "12px",
            fontFamily: BODY_FONT,
            fontWeight: 700,
            color: C.accent,
            textDecoration: "underline",
          }}
        >
          View your rewards {"→"}
        </Link>
      </Section>
    </Section>
  );
}
