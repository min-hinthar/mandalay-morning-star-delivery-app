/* eslint-disable max-lines */
import { Button, Hr, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import { APP_URL, FONT_STACK, SERIF_STACK, formatPrice, shortOrderId } from "./helpers";

// ─── Types ────────────────────────────────────────────────
interface OrderSummary {
  id: string;
  customerName: string;
  totalCents: number;
  status: string;
  paymentMethod: string;
  itemCount: number;
}

interface StatusBreakdown {
  confirmed: number;
  preparing: number;
  out_for_delivery: number;
  delivered: number;
  cancelled: number;
  pending_approval: number;
  [key: string]: number;
}

export interface AdminDailyDigestProps {
  period: "morning" | "evening";
  dateLabel: string;
  totalOrders: number;
  totalRevenueCents: number;
  statusBreakdown: StatusBreakdown;
  orders: OrderSummary[];
}

// ─── Helpers ──────────────────────────────────────────────
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_approval: { label: "Pending Approval", color: "#F59E0B" },
  confirmed: { label: "Confirmed", color: "#3B82F6" },
  preparing: { label: "Preparing", color: "#8B5CF6" },
  out_for_delivery: { label: "Out for Delivery", color: "#F97316" },
  delivered: { label: "Delivered", color: "#22C55E" },
  cancelled: { label: "Cancelled", color: "#EF4444" },
};

function statusLabel(status: string): string {
  return STATUS_LABELS[status]?.label ?? status;
}

function statusColor(status: string): string {
  return STATUS_LABELS[status]?.color ?? "#6B7280";
}

// ─── Component ────────────────────────────────────────────
export function AdminDailyDigest({
  period,
  dateLabel,
  totalOrders,
  totalRevenueCents,
  statusBreakdown,
  orders,
}: AdminDailyDigestProps) {
  const title = period === "morning" ? "Yesterday's Order Summary" : "Today's Orders So Far";

  return (
    <EmailLayout
      emailType="confirmation"
      previewText={`${title}: ${totalOrders} orders, ${formatPrice(totalRevenueCents)} revenue`}
    >
      {/* ── Header ─────────────────────────────────── */}
      <Section style={{ padding: "32px 24px 0 24px" }}>
        <Text
          style={{
            fontSize: "22px",
            fontFamily: SERIF_STACK,
            color: "#8B4513",
            fontWeight: 700,
            margin: "0 0 4px 0",
            lineHeight: "1.3",
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: "14px",
            fontFamily: FONT_STACK,
            color: "#6B7280",
            margin: "0 0 24px 0",
          }}
        >
          {dateLabel}
        </Text>
      </Section>

      {/* ── Key Metrics ────────────────────────────── */}
      <Section style={{ padding: "0 24px", marginBottom: "24px" }}>
        <table
          cellPadding="0"
          cellSpacing="0"
          style={{ width: "100%", borderCollapse: "collapse" as const }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  width: "50%",
                  padding: "16px",
                  backgroundColor: "#F0FDF4",
                  borderRadius: "8px 0 0 8px",
                  textAlign: "center" as const,
                }}
              >
                <Text
                  style={{
                    fontSize: "28px",
                    fontFamily: FONT_STACK,
                    fontWeight: 700,
                    color: "#166534",
                    margin: "0",
                  }}
                >
                  {totalOrders}
                </Text>
                <Text
                  style={{
                    fontSize: "13px",
                    fontFamily: FONT_STACK,
                    color: "#6B7280",
                    margin: "4px 0 0 0",
                  }}
                >
                  Total Orders
                </Text>
              </td>
              <td
                style={{
                  width: "50%",
                  padding: "16px",
                  backgroundColor: "#FFF9E6",
                  borderRadius: "0 8px 8px 0",
                  textAlign: "center" as const,
                }}
              >
                <Text
                  style={{
                    fontSize: "28px",
                    fontFamily: FONT_STACK,
                    fontWeight: 700,
                    color: "#8B4513",
                    margin: "0",
                  }}
                >
                  {formatPrice(totalRevenueCents)}
                </Text>
                <Text
                  style={{
                    fontSize: "13px",
                    fontFamily: FONT_STACK,
                    color: "#6B7280",
                    margin: "4px 0 0 0",
                  }}
                >
                  Total Revenue
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* ── Status Breakdown ───────────────────────── */}
      <Section style={{ padding: "0 24px", marginBottom: "24px" }}>
        <Text
          style={{
            fontSize: "14px",
            fontFamily: FONT_STACK,
            fontWeight: 700,
            color: "#374151",
            margin: "0 0 12px 0",
          }}
        >
          Orders by Status
        </Text>
        <table
          cellPadding="0"
          cellSpacing="0"
          style={{ width: "100%", borderCollapse: "collapse" as const }}
        >
          <tbody>
            {Object.entries(statusBreakdown)
              .filter(([, count]) => count > 0)
              .map(([status, count]) => (
                <tr key={status}>
                  <td style={{ padding: "6px 0", borderBottom: "1px solid #F3F4F6" }}>
                    <Text
                      style={{
                        fontSize: "14px",
                        fontFamily: FONT_STACK,
                        color: statusColor(status),
                        margin: "0",
                        fontWeight: 600,
                      }}
                    >
                      {statusLabel(status)}
                    </Text>
                  </td>
                  <td
                    style={{
                      padding: "6px 0",
                      borderBottom: "1px solid #F3F4F6",
                      textAlign: "right" as const,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: "14px",
                        fontFamily: FONT_STACK,
                        color: "#111111",
                        margin: "0",
                        fontWeight: 700,
                      }}
                    >
                      {count}
                    </Text>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Section>

      <Hr style={{ borderColor: "#E5E7EB", margin: "0 24px 24px 24px" }} />

      {/* ── Individual Orders ──────────────────────── */}
      {orders.length > 0 && (
        <Section style={{ padding: "0 24px", marginBottom: "24px" }}>
          <Text
            style={{
              fontSize: "14px",
              fontFamily: FONT_STACK,
              fontWeight: 700,
              color: "#374151",
              margin: "0 0 12px 0",
            }}
          >
            Order Details
          </Text>
          <table
            cellPadding="0"
            cellSpacing="0"
            style={{ width: "100%", borderCollapse: "collapse" as const }}
          >
            <thead>
              <tr>
                <td style={{ padding: "8px 4px", borderBottom: "2px solid #E5E7EB" }}>
                  <Text
                    style={{
                      fontSize: "11px",
                      fontFamily: FONT_STACK,
                      color: "#6B7280",
                      margin: "0",
                      fontWeight: 700,
                      textTransform: "uppercase" as const,
                    }}
                  >
                    Order
                  </Text>
                </td>
                <td style={{ padding: "8px 4px", borderBottom: "2px solid #E5E7EB" }}>
                  <Text
                    style={{
                      fontSize: "11px",
                      fontFamily: FONT_STACK,
                      color: "#6B7280",
                      margin: "0",
                      fontWeight: 700,
                      textTransform: "uppercase" as const,
                    }}
                  >
                    Customer
                  </Text>
                </td>
                <td
                  style={{
                    padding: "8px 4px",
                    borderBottom: "2px solid #E5E7EB",
                    textAlign: "right" as const,
                  }}
                >
                  <Text
                    style={{
                      fontSize: "11px",
                      fontFamily: FONT_STACK,
                      color: "#6B7280",
                      margin: "0",
                      fontWeight: 700,
                      textTransform: "uppercase" as const,
                    }}
                  >
                    Total
                  </Text>
                </td>
                <td
                  style={{
                    padding: "8px 4px",
                    borderBottom: "2px solid #E5E7EB",
                    textAlign: "right" as const,
                  }}
                >
                  <Text
                    style={{
                      fontSize: "11px",
                      fontFamily: FONT_STACK,
                      color: "#6B7280",
                      margin: "0",
                      fontWeight: 700,
                      textTransform: "uppercase" as const,
                    }}
                  >
                    Status
                  </Text>
                </td>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ padding: "8px 4px", borderBottom: "1px solid #F3F4F6" }}>
                    <Link
                      href={`${APP_URL}/admin/orders/${order.id}`}
                      style={{
                        fontSize: "13px",
                        fontFamily: FONT_STACK,
                        color: "#D4A017",
                        textDecoration: "underline",
                        fontWeight: 600,
                      }}
                    >
                      #{shortOrderId(order.id)}
                    </Link>
                  </td>
                  <td style={{ padding: "8px 4px", borderBottom: "1px solid #F3F4F6" }}>
                    <Text
                      style={{
                        fontSize: "13px",
                        fontFamily: FONT_STACK,
                        color: "#374151",
                        margin: "0",
                      }}
                    >
                      {order.customerName}
                    </Text>
                    <Text
                      style={{
                        fontSize: "11px",
                        fontFamily: FONT_STACK,
                        color: "#9CA3AF",
                        margin: "0",
                      }}
                    >
                      {order.itemCount} item{order.itemCount !== 1 ? "s" : ""} &middot;{" "}
                      {order.paymentMethod === "cod" ? "COD" : "Stripe"}
                    </Text>
                  </td>
                  <td
                    style={{
                      padding: "8px 4px",
                      borderBottom: "1px solid #F3F4F6",
                      textAlign: "right" as const,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: "13px",
                        fontFamily: FONT_STACK,
                        color: "#111111",
                        margin: "0",
                        fontWeight: 600,
                      }}
                    >
                      {formatPrice(order.totalCents)}
                    </Text>
                  </td>
                  <td
                    style={{
                      padding: "8px 4px",
                      borderBottom: "1px solid #F3F4F6",
                      textAlign: "right" as const,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: "12px",
                        fontFamily: FONT_STACK,
                        color: statusColor(order.status),
                        margin: "0",
                        fontWeight: 600,
                      }}
                    >
                      {statusLabel(order.status)}
                    </Text>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* ── CTA ──────────────────────────────────────── */}
      <Section style={{ padding: "0 24px 24px 24px", textAlign: "center" as const }}>
        <Button
          href={`${APP_URL}/admin/orders`}
          style={{
            backgroundColor: "#D4A017",
            color: "#FFFFFF",
            fontFamily: FONT_STACK,
            fontSize: "16px",
            fontWeight: 700,
            borderRadius: "8px",
            padding: "14px 32px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          View All Orders
        </Button>
      </Section>
    </EmailLayout>
  );
}

export default AdminDailyDigest;
