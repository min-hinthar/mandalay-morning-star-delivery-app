import { Link, Section, Text } from "@react-email/components";
import { BODY_FONT, BURMESE_FONT, C, DISPLAY_FONT, cls } from "./theme";

interface BrandFooterProps {
  unsubscribeUrl: string;
  /** When set, shows a warm bilingual "refer a friend" nudge. */
  referralUrl?: string;
  variant?: "default" | "admin";
}

/** Three triad dots — the quiet divider between content and colophon. */
function TriadDots() {
  const dot = (color: string): React.CSSProperties => ({
    width: "7px",
    height: "7px",
    borderRadius: "999px",
    backgroundColor: color,
    fontSize: 0,
    lineHeight: 0,
  });
  return (
    <table cellPadding="0" cellSpacing="0" role="presentation" style={{ margin: "0 auto 22px" }}>
      <tbody>
        <tr>
          <td style={dot(C.clay)} />
          <td style={{ width: "8px", fontSize: 0 }} />
          <td style={dot(C.blue)} />
          <td style={{ width: "8px", fontSize: 0 }} />
          <td style={dot(C.sage)} />
        </tr>
      </tbody>
    </table>
  );
}

export function BrandFooter({
  unsubscribeUrl,
  referralUrl,
  variant = "default",
}: BrandFooterProps) {
  const isAdmin = variant === "admin";

  return (
    <Section style={{ padding: isAdmin ? "8px 28px 24px 28px" : "8px 28px 28px 28px" }}>
      {/* Referral nudge — every customer email quietly invites a share */}
      {referralUrl && (
        <Section
          className={`${cls.vellum} ${cls.goldLeaf}`}
          style={{
            backgroundColor: C.vellum,
            border: `1px solid ${C.goldLeaf}`,
            borderRadius: "14px",
            padding: "18px 22px",
            margin: "16px 0 26px 0",
            textAlign: "center" as const,
          }}
        >
          <Text
            className={cls.ink}
            style={{
              fontSize: "15px",
              fontFamily: DISPLAY_FONT,
              color: C.ink,
              fontWeight: 600,
              margin: "0 0 3px 0",
            }}
          >
            {"💛"} Love it? Tell a friend {"—"} you both get $10
          </Text>
          <Text
            className={cls.muted}
            style={{
              fontSize: "13px",
              fontFamily: BURMESE_FONT,
              color: C.inkMuted,
              margin: "0 0 12px 0",
              lineHeight: 1.7,
            }}
          >
            ချစ်ရင် ပြောပြလိုက်ပါနော် — နှစ်ယောက်စလုံး $၁၀ စီရမယ် {"😘"}
          </Text>
          <Link
            href={referralUrl}
            className={cls.accent}
            style={{
              fontSize: "13px",
              fontFamily: BODY_FONT,
              fontWeight: 700,
              color: C.accent,
              textDecoration: "underline",
            }}
          >
            Share your link {"·"} မိတ်ဆွေကို မျှဝေမယ်
          </Link>
        </Section>
      )}

      {!isAdmin && <TriadDots />}

      {/* Morning Star colophon */}
      <Text
        className={cls.accent}
        style={{
          textAlign: "center" as const,
          color: C.accent,
          fontSize: "13px",
          fontFamily: DISPLAY_FONT,
          fontWeight: 600,
          margin: isAdmin ? "16px 0" : "0 0 16px 0",
          letterSpacing: "1px",
        }}
      >
        {"★"} Morning Star Delivery {"★"}
      </Text>

      {/* Business Address */}
      <Text
        className={cls.faint}
        style={{
          textAlign: "center" as const,
          color: C.inkFaint,
          fontSize: "12px",
          fontFamily: BODY_FONT,
          margin: "0 0 8px 0",
          lineHeight: "1.5",
        }}
      >
        Mandalay Morning Star
        <br />
        750 Terrado Plaza, Suite 33, Covina, CA 91723
      </Text>

      {/* Support Email */}
      <Text
        className={cls.faint}
        style={{
          textAlign: "center" as const,
          color: C.inkFaint,
          fontSize: "12px",
          fontFamily: BODY_FONT,
          margin: "0 0 12px 0",
        }}
      >
        Questions?{" "}
        <Link
          href="mailto:admin@mandalaymorningstar.com"
          className={cls.accent}
          style={{ color: C.accent, textDecoration: "underline" }}
        >
          admin@mandalaymorningstar.com
        </Link>
      </Text>

      {/* Social Links */}
      <Text
        className={cls.faint}
        style={{
          textAlign: "center" as const,
          color: C.inkFaint,
          fontSize: "12px",
          fontFamily: BODY_FONT,
          margin: "0 0 16px 0",
        }}
      >
        <Link
          href="https://www.instagram.com/mandalays.morningstar/"
          className={cls.muted}
          style={{ color: C.inkMuted, textDecoration: "underline", marginRight: "12px" }}
        >
          Instagram
        </Link>
        {" · "}
        <Link
          href="https://www.facebook.com/MandalayMorningStarLA/"
          className={cls.muted}
          style={{ color: C.inkMuted, textDecoration: "underline" }}
        >
          Facebook
        </Link>
      </Text>

      {/* Unsubscribe + Privacy */}
      {!isAdmin && (
        <Text
          className={cls.faint}
          style={{
            textAlign: "center" as const,
            color: C.inkFaint,
            fontSize: "11px",
            fontFamily: BODY_FONT,
            margin: "0",
            lineHeight: "1.6",
          }}
        >
          You&apos;re receiving this because you placed an order with Mandalay Morning Star.
          <br />
          <Link
            href={unsubscribeUrl}
            className={cls.muted}
            style={{ color: C.inkMuted, textDecoration: "underline" }}
          >
            Manage notification preferences
          </Link>
        </Text>
      )}
    </Section>
  );
}
