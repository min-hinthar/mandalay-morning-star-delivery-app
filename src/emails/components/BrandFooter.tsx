import { Hr, Link, Section, Text } from "@react-email/components";

interface BrandFooterProps {
  unsubscribeUrl: string;
  /** When set, shows a warm bilingual "refer a friend" nudge. */
  referralUrl?: string;
}

export function BrandFooter({ unsubscribeUrl, referralUrl }: BrandFooterProps) {
  return (
    <Section style={{ padding: "0 24px 24px 24px" }}>
      {/* Referral nudge — every customer email quietly invites a share */}
      {referralUrl && (
        <Section
          style={{
            backgroundColor: "#FFF9E6",
            border: "1px solid #F3E2B3",
            borderRadius: "12px",
            padding: "16px 20px",
            margin: "0 0 24px 0",
            textAlign: "center" as const,
          }}
        >
          <Text
            style={{
              fontSize: "14px",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              color: "#8B4513",
              fontWeight: 700,
              margin: "0 0 2px 0",
            }}
          >
            {"💛"} Love it? Tell a friend — you both get $10
          </Text>
          <Text
            style={{
              fontSize: "13px",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              color: "#92400E",
              margin: "0 0 10px 0",
            }}
          >
            ချစ်ရင် ပြောပြလိုက်ပါနော် — နှစ်ယောက်စလုံး $၁၀ စီရမယ် {"😘"}
          </Text>
          <Link
            href={referralUrl}
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#A41034",
              textDecoration: "underline",
            }}
          >
            Share your link · မိတ်ဆွေကို မျှဝေမယ်
          </Link>
        </Section>
      )}

      <Hr
        style={{
          borderColor: "#E5E7EB",
          borderWidth: "1px 0 0 0",
          margin: "0 0 24px 0",
        }}
      />

      {/* Morning Star brand mark */}
      <Text
        style={{
          textAlign: "center" as const,
          color: "#9CA3AF",
          fontSize: "13px",
          fontFamily: "Georgia, 'Palatino Linotype', serif",
          margin: "0 0 16px 0",
          letterSpacing: "1px",
        }}
      >
        {"\u2605"} Morning Star Delivery {"\u2605"}
      </Text>

      {/* Business Address */}
      <Text
        style={{
          textAlign: "center" as const,
          color: "#9CA3AF",
          fontSize: "12px",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
        style={{
          textAlign: "center" as const,
          color: "#9CA3AF",
          fontSize: "12px",
          margin: "0 0 12px 0",
        }}
      >
        Questions?{" "}
        <Link
          href="mailto:admin@mandalaymorningstar.com"
          style={{ color: "#D4A017", textDecoration: "underline" }}
        >
          admin@mandalaymorningstar.com
        </Link>
      </Text>

      {/* Social Links */}
      <Text
        style={{
          textAlign: "center" as const,
          color: "#9CA3AF",
          fontSize: "12px",
          margin: "0 0 16px 0",
        }}
      >
        <Link
          href="https://www.instagram.com/mandalays.morningstar/"
          style={{ color: "#9CA3AF", textDecoration: "underline", marginRight: "12px" }}
        >
          Instagram
        </Link>
        {" \u00B7 "}
        <Link
          href="https://www.facebook.com/MandalayMorningStarLA/"
          style={{ color: "#9CA3AF", textDecoration: "underline" }}
        >
          Facebook
        </Link>
      </Text>

      {/* Unsubscribe + Privacy */}
      <Text
        style={{
          textAlign: "center" as const,
          color: "#D1D5DB",
          fontSize: "11px",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          margin: "0 0 8px 0",
          lineHeight: "1.6",
        }}
      >
        You&apos;re receiving this because you placed an order with Mandalay Morning Star.
        <br />
        <Link href={unsubscribeUrl} style={{ color: "#9CA3AF", textDecoration: "underline" }}>
          Manage notification preferences
        </Link>
      </Text>
    </Section>
  );
}
