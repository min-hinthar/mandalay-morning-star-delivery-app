import { Heading, Img, Section, Text } from "@react-email/components";
import { BODY_FONT, BURMESE_FONT, C, DISPLAY_FONT } from "./theme";

/** One mood per email family — sets the chip under the wordmark. */
export type EmailMood =
  | "confirmation"
  | "cancellation"
  | "refund"
  | "reminder"
  | "delivery"
  | "delivered"
  | "welcome"
  | "reward"
  | "winback"
  | "cart"
  | "auth"
  | "feedback";

interface BrandHeaderProps {
  emailType: EmailMood;
  variant?: "default" | "admin";
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://mandalaymorningstar.com";

const TYPE_MOOD: Record<EmailMood, { emoji: string; greeting: string }> = {
  confirmation: { emoji: "🍜", greeting: "Your feast is on the way" },
  cancellation: { emoji: "🤲", greeting: "We're sorry to see this order go" },
  refund: { emoji: "🤝", greeting: "Your refund is being processed" },
  reminder: { emoji: "🔔", greeting: "Your delivery is coming soon" },
  delivery: { emoji: "🚗", greeting: "Out for delivery" },
  delivered: { emoji: "✨", greeting: "Delivered — enjoy every bite" },
  welcome: { emoji: "🌟", greeting: "Welcome to the family" },
  reward: { emoji: "🎁", greeting: "A little thank-you, from us" },
  winback: { emoji: "💛", greeting: "We've missed you" },
  cart: { emoji: "🍲", greeting: "Your feast is still waiting" },
  auth: { emoji: "🔑", greeting: "Your sign-in link" },
  feedback: { emoji: "🙏", greeting: "Thank you for writing to us" },
};

/**
 * The Morning Star seal: real logo when images load; a clay disc with a cream
 * star (background-color + styled alt) when they're blocked.
 */
function BrandSeal({ size = 88 }: { size?: number }) {
  const height = Math.round(size * (2 / 3)); // logo badge is 3:2
  return (
    <Img
      src={`${APP_URL}/logo.png`}
      alt="★"
      width={size}
      height={height}
      style={{
        display: "block",
        margin: "0 auto",
        width: `${size}px`,
        height: `${height}px`,
        borderRadius: `${height / 2}px`,
        backgroundColor: C.clay,
        color: C.paper,
        fontSize: `${Math.round(height * 0.5)}px`,
        lineHeight: `${height}px`,
        textAlign: "center" as const,
        fontFamily: BODY_FONT,
      }}
    />
  );
}

/** Compact single-row header for admin/ops mail. */
function AdminHeader() {
  return (
    <Section style={{ padding: "18px 28px 16px 28px", borderBottom: `1px solid ${C.line}` }}>
      <table cellPadding="0" cellSpacing="0" role="presentation" style={{ width: "100%" }}>
        <tbody>
          <tr>
            <td style={{ width: "44px", verticalAlign: "middle" }}>
              <BrandSeal size={42} />
            </td>
            <td style={{ verticalAlign: "middle", paddingLeft: "12px" }}>
              <Text
                style={{
                  fontSize: "16px",
                  fontFamily: DISPLAY_FONT,
                  fontWeight: 600,
                  color: C.ink,
                  margin: "0",
                  lineHeight: 1.2,
                }}
              >
                Mandalay Morning Star
              </Text>
              <Text
                style={{
                  fontSize: "10px",
                  fontFamily: BODY_FONT,
                  fontWeight: 700,
                  color: C.blueDeep,
                  textTransform: "uppercase" as const,
                  letterSpacing: "2px",
                  margin: "2px 0 0 0",
                }}
              >
                Operations
              </Text>
            </td>
            <td style={{ verticalAlign: "middle", textAlign: "right" as const }}>
              <Text
                style={{
                  fontSize: "12px",
                  color: C.gold,
                  letterSpacing: "3px",
                  margin: "0",
                }}
              >
                {"★ ★ ★"}
              </Text>
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

export function BrandHeader({ emailType, variant = "default" }: BrandHeaderProps) {
  if (variant === "admin") return <AdminHeader />;

  const mood = TYPE_MOOD[emailType];

  return (
    <Section
      style={{
        textAlign: "center" as const,
        padding: "36px 28px 0 28px",
      }}
    >
      <BrandSeal />

      {/* Bilingual greeting kicker */}
      <Text
        style={{
          fontSize: "11px",
          fontFamily: BURMESE_FONT,
          fontWeight: 700,
          color: C.accent,
          textTransform: "uppercase" as const,
          letterSpacing: "2.5px",
          margin: "18px 0 6px 0",
        }}
      >
        Mingalabar {"·"} မင်္ဂလာပါ
      </Text>

      {/* Wordmark */}
      <Heading
        as="h1"
        style={{
          color: C.ink,
          fontSize: "27px",
          fontFamily: DISPLAY_FONT,
          fontWeight: 600,
          margin: "0 0 6px 0",
          lineHeight: 1.2,
        }}
      >
        Mandalay Morning Star
      </Heading>

      {/* Tagline */}
      <Text
        style={{
          color: C.inkMuted,
          fontSize: "13px",
          fontFamily: BODY_FONT,
          margin: "0 0 20px 0",
          letterSpacing: "0.3px",
        }}
      >
        Authentic Burmese cuisine {"—"} Los Angeles
      </Text>

      {/* Type-specific mood chip */}
      <table cellPadding="0" cellSpacing="0" role="presentation" style={{ margin: "0 auto" }}>
        <tbody>
          <tr>
            <td
              style={{
                backgroundColor: C.vellum,
                border: `1px solid ${C.line}`,
                borderRadius: "999px",
                padding: "8px 20px",
              }}
            >
              <Text
                style={{
                  color: C.ink,
                  fontSize: "14px",
                  fontFamily: BODY_FONT,
                  fontWeight: 600,
                  margin: "0",
                  lineHeight: 1.3,
                }}
              >
                {mood.emoji} {mood.greeting}
              </Text>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Gold-leaf hairline into the content */}
      <table
        cellPadding="0"
        cellSpacing="0"
        role="presentation"
        style={{ width: "100%", marginTop: "26px" }}
      >
        <tbody>
          <tr>
            <td style={{ height: "1px", backgroundColor: C.goldLeaf, fontSize: 0 }} />
          </tr>
        </tbody>
      </table>
    </Section>
  );
}
