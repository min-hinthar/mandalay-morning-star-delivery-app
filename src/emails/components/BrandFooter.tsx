import { Hr, Link, Section, Text } from "@react-email/components";

interface BrandFooterProps {
  unsubscribeUrl: string;
}

export function BrandFooter({ unsubscribeUrl }: BrandFooterProps) {
  return (
    <Section style={{ padding: "0 24px 24px 24px" }}>
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
