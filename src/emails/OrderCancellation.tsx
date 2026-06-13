import { Link, Section, Text } from "@react-email/components";
import { Callout } from "./components/Callout";
import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";
import { SupportSection } from "./components/SupportSection";
import {
  BODY_FONT,
  C,
  DISPLAY_FONT,
  bodyStyle,
  cls,
  headingStyle,
  labelStyle,
} from "./components/theme";
import { APP_URL } from "./helpers";

// ─── Helpers ──────────────────────────────────────────────
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Types ────────────────────────────────────────────────
interface CancellationItem {
  name: string;
  quantity: number;
  lineTotalCents: number;
}

export interface OrderCancellationProps {
  customerName: string;
  orderId: string;
  items: CancellationItem[];
  totalCents: number;
  cancellationReason?: string;
  cancelledAt: string;
  refundIssued: boolean;
  refundAmountCents?: number;
  refundMethod?: string;
  refundTimeline?: string;
}

// ─── Component ────────────────────────────────────────────
export function OrderCancellation({
  customerName,
  orderId,
  items,
  totalCents,
  cancellationReason,
  cancelledAt,
  refundIssued,
  refundAmountCents,
  refundMethod,
  refundTimeline,
}: OrderCancellationProps) {
  const shortId = orderId.slice(0, 8).toUpperCase();
  const orderUrl = `${APP_URL}/orders/${orderId}`;

  return (
    <EmailLayout
      emailType="cancellation"
      showReferral={false}
      previewText={`Your order #${shortId} has been cancelled`}
    >
      {/* ── Greeting ─────────────────────────────────── */}
      <Section style={{ padding: "30px 28px 0 28px" }}>
        <Text className={cls.ink} style={headingStyle(22)}>
          Dear {customerName},
        </Text>
        <Text className={cls.muted} style={{ ...bodyStyle(15), margin: "0 0 24px 0" }}>
          We&apos;re sorry to see this order go. Your order has been cancelled.
        </Text>
      </Section>

      {/* ── Cancellation Details Box ─────────────────── */}
      <Section
        className={`${cls.clayTint} ${cls.clayBorder}`}
        style={{
          margin: "0 28px 20px 28px",
          padding: "16px 20px",
          backgroundColor: C.clayTint,
          borderRadius: "12px",
          border: `1px solid ${C.clayTintBorder}`,
        }}
      >
        <Text className={cls.faint} style={labelStyle()}>
          Order Number
        </Text>
        <Text
          className={cls.ink}
          style={{
            fontSize: "16px",
            fontFamily: BODY_FONT,
            fontWeight: 700,
            color: C.ink,
            margin: "0 0 12px 0",
          }}
        >
          <Link
            className={cls.accent}
            href={orderUrl}
            style={{ color: C.accent, textDecoration: "underline", fontWeight: 700 }}
          >
            #{shortId}
          </Link>
        </Text>

        <Text className={cls.faint} style={labelStyle()}>
          Cancelled
        </Text>
        <Text
          className={cls.ink}
          style={{ fontSize: "14px", fontFamily: BODY_FONT, color: C.ink, margin: "0 0 12px 0" }}
        >
          {formatDate(cancelledAt)}
        </Text>

        {cancellationReason && (
          <>
            <Text className={cls.faint} style={labelStyle()}>
              Reason
            </Text>
            <Text
              className={cls.ink}
              style={{ fontSize: "14px", fontFamily: BODY_FONT, color: C.ink, margin: "0" }}
            >
              {cancellationReason}
            </Text>
          </>
        )}
      </Section>

      {/* ── Order Summary ────────────────────────────── */}
      <Section style={{ padding: "0 28px 16px 28px" }}>
        <Text className={cls.ink} style={{ ...headingStyle(17), margin: "0 0 12px 0" }}>
          Order Summary
        </Text>
        <table
          cellPadding="0"
          cellSpacing="0"
          style={{ width: "100%", borderCollapse: "collapse" as const }}
        >
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td
                  className={cls.line}
                  style={{ padding: "6px 0", borderBottom: `1px solid ${C.line}` }}
                >
                  <Text
                    className={cls.ink}
                    style={{ fontSize: "14px", fontFamily: BODY_FONT, color: C.ink, margin: "0" }}
                  >
                    {item.quantity}x {item.name}
                  </Text>
                </td>
              </tr>
            ))}

            {/* Total — gold-leaf rule, editorial serif figures */}
            <tr>
              <td style={{ padding: "12px 0 0 0" }}>
                <table cellPadding="0" cellSpacing="0" style={{ width: "100%" }}>
                  <tbody>
                    <tr>
                      <td>
                        <Text
                          className={cls.ink}
                          style={{
                            fontSize: "16px",
                            fontFamily: DISPLAY_FONT,
                            fontWeight: 600,
                            color: C.ink,
                            margin: "0",
                          }}
                        >
                          Total
                        </Text>
                      </td>
                      <td style={{ textAlign: "right" as const }}>
                        <Text
                          className={cls.accentStrong}
                          style={{
                            fontSize: "18px",
                            fontFamily: DISPLAY_FONT,
                            fontWeight: 700,
                            color: C.accentStrong,
                            margin: "0",
                          }}
                        >
                          {formatPrice(totalCents)}
                        </Text>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* ── Refund Status Section ────────────────────── */}
      {refundIssued ? (
        <Callout tone="success" style={{ margin: "0 28px 24px 28px" }}>
          {"✅"} A refund of{" "}
          <strong
            className={cls.accentStrong}
            style={{ fontFamily: DISPLAY_FONT, color: C.accentStrong }}
          >
            {refundAmountCents != null ? formatPrice(refundAmountCents) : formatPrice(totalCents)}
          </strong>{" "}
          will be returned to your {refundMethod || "original payment method"} within{" "}
          {refundTimeline || "3-5 business days"}.
        </Callout>
      ) : (
        <Section
          className={`${cls.vellum} ${cls.line}`}
          style={{
            margin: "0 28px 24px 28px",
            padding: "16px 20px",
            backgroundColor: C.vellum,
            borderRadius: "10px",
            border: `1px solid ${C.line}`,
          }}
        >
          <Text
            className={cls.ink}
            style={{
              fontSize: "14px",
              fontFamily: BODY_FONT,
              color: C.ink,
              margin: "0",
              lineHeight: "1.6",
            }}
          >
            No refund has been issued for this order. If you believe this is an error, please
            contact us.
          </Text>
        </Section>
      )}

      {/* ── Primary CTA ──────────────────────────────── */}
      <Section style={{ padding: "0 28px 12px 28px", textAlign: "center" as const }}>
        <EmailButton href={`${APP_URL}/menu`}>Place a New Order</EmailButton>
      </Section>

      {/* ── Need Help ────────────────────────────────── */}
      <SupportSection />

      {/* close the card with breathing room */}
      <Section style={{ height: "8px" }} />
    </EmailLayout>
  );
}

export default OrderCancellation;
