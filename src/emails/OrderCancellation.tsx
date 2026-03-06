import { Button, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import { APP_URL } from "./helpers";
import { SupportSection } from "./components/SupportSection";

const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const SERIF = "Georgia, 'Palatino Linotype', serif";

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
    <EmailLayout emailType="cancellation" previewText={`Your order #${shortId} has been cancelled`}>
      {/* ── Greeting ─────────────────────────────────── */}
      <Section style={{ padding: "32px 24px 0 24px" }}>
        <Text
          style={{
            fontSize: "22px",
            fontFamily: SERIF,
            color: "#8B4513",
            fontWeight: 700,
            margin: "0 0 8px 0",
            lineHeight: "1.3",
          }}
        >
          Dear {customerName},
        </Text>
        <Text
          style={{
            fontSize: "15px",
            fontFamily: SANS,
            color: "#374151",
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          We&apos;re sorry to see this order go. Your order has been cancelled.
        </Text>
      </Section>

      {/* ── Cancellation Details Box ─────────────────── */}
      <Section
        style={{
          margin: "0 24px 20px 24px",
          padding: "16px 20px",
          backgroundColor: "#FEF2F2",
          borderRadius: "8px",
          border: "1px solid #FECACA",
        }}
      >
        <Text style={{ fontSize: "13px", fontFamily: SANS, color: "#6B7280", margin: "0 0 4px 0" }}>
          Order Number
        </Text>
        <Text
          style={{
            fontSize: "16px",
            fontFamily: SANS,
            fontWeight: 700,
            color: "#111111",
            margin: "0 0 12px 0",
          }}
        >
          <Link
            href={orderUrl}
            style={{ color: "#D4A017", textDecoration: "underline", fontWeight: 700 }}
          >
            #{shortId}
          </Link>
        </Text>

        <Text style={{ fontSize: "13px", fontFamily: SANS, color: "#6B7280", margin: "0 0 4px 0" }}>
          Cancelled
        </Text>
        <Text
          style={{ fontSize: "14px", fontFamily: SANS, color: "#111111", margin: "0 0 12px 0" }}
        >
          {formatDate(cancelledAt)}
        </Text>

        {cancellationReason && (
          <>
            <Text
              style={{ fontSize: "13px", fontFamily: SANS, color: "#6B7280", margin: "0 0 4px 0" }}
            >
              Reason
            </Text>
            <Text style={{ fontSize: "14px", fontFamily: SANS, color: "#111111", margin: "0" }}>
              {cancellationReason}
            </Text>
          </>
        )}
      </Section>

      {/* ── Order Summary ────────────────────────────── */}
      <Section style={{ padding: "0 24px 16px 24px" }}>
        <Text
          style={{
            fontSize: "14px",
            fontFamily: SANS,
            fontWeight: 700,
            color: "#374151",
            margin: "0 0 12px 0",
          }}
        >
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
                <td style={{ padding: "6px 0", borderBottom: "1px solid #F3F4F6" }}>
                  <Text
                    style={{ fontSize: "14px", fontFamily: SANS, color: "#374151", margin: "0" }}
                  >
                    {item.quantity}x {item.name}
                  </Text>
                </td>
              </tr>
            ))}

            {/* Total */}
            <tr>
              <td style={{ padding: "12px 0 0 0" }}>
                <table cellPadding="0" cellSpacing="0" style={{ width: "100%" }}>
                  <tbody>
                    <tr>
                      <td>
                        <Text
                          style={{
                            fontSize: "15px",
                            fontFamily: SANS,
                            fontWeight: 700,
                            color: "#8B4513",
                            margin: "0",
                          }}
                        >
                          Total
                        </Text>
                      </td>
                      <td style={{ textAlign: "right" as const }}>
                        <Text
                          style={{
                            fontSize: "15px",
                            fontFamily: SANS,
                            fontWeight: 700,
                            color: "#8B4513",
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
      <Section style={{ padding: "0 24px 24px 24px" }}>
        {refundIssued ? (
          <div
            style={{
              padding: "16px 20px",
              backgroundColor: "#F0FDF4",
              borderRadius: "8px",
              border: "1px solid #BBF7D0",
            }}
          >
            <Text
              style={{
                fontSize: "14px",
                fontFamily: SANS,
                color: "#166534",
                margin: "0",
                lineHeight: "1.6",
              }}
            >
              {"\u2705"} A refund of{" "}
              <strong>
                {refundAmountCents != null
                  ? formatPrice(refundAmountCents)
                  : formatPrice(totalCents)}
              </strong>{" "}
              will be returned to your {refundMethod || "original payment method"} within{" "}
              {refundTimeline || "3-5 business days"}.
            </Text>
          </div>
        ) : (
          <div
            style={{
              padding: "16px 20px",
              backgroundColor: "#F9FAFB",
              borderRadius: "8px",
              border: "1px solid #E5E7EB",
            }}
          >
            <Text
              style={{
                fontSize: "14px",
                fontFamily: SANS,
                color: "#374151",
                margin: "0",
                lineHeight: "1.6",
              }}
            >
              No refund has been issued for this order. If you believe this is an error, please
              contact us.
            </Text>
          </div>
        )}
      </Section>

      {/* ── Primary CTA ──────────────────────────────── */}
      <Section style={{ padding: "0 24px 12px 24px", textAlign: "center" as const }}>
        <Button
          href={`${APP_URL}/menu`}
          style={{
            backgroundColor: "#D4A017",
            color: "#FFFFFF",
            fontFamily: SANS,
            fontSize: "16px",
            fontWeight: 700,
            borderRadius: "8px",
            padding: "14px 32px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Place a New Order
        </Button>
      </Section>

      {/* ── Need Help ────────────────────────────────── */}
      <SupportSection />
    </EmailLayout>
  );
}

export default OrderCancellation;
