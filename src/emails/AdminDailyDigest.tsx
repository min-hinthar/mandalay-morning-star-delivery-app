/* eslint-disable max-lines */
import { Button, Hr, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import { APP_URL, FONT_STACK, SERIF_STACK, formatPrice, shortOrderId } from "./helpers";
import { TIMEZONE } from "@/types/delivery";

// ─── Types ────────────────────────────────────────────────
interface OrderItemModifier {
  name: string;
  priceDelta?: number;
}

interface DigestOrderItem {
  name: string;
  nameMy?: string | null;
  quantity: number;
  lineTotalCents: number;
  modifiers?: OrderItemModifier[];
  notes?: string | null;
}

interface DigestAddress {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
}

interface OrderSummary {
  id: string;
  customerName: string;
  totalCents: number;
  status: string;
  paymentMethod: string;
  itemCount: number;
  /** Full line items — when present, a per-order breakdown is rendered. */
  items?: DigestOrderItem[];
  subtotalCents?: number;
  deliveryFeeCents?: number;
  taxCents?: number;
  tipCents?: number;
  deliveryWindowStart?: string | null;
  deliveryWindowEnd?: string | null;
  address?: DigestAddress | null;
  specialInstructions?: string | null;
  customerPhone?: string | null;
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
  /** Confirmed revenue — excludes cancelled orders. */
  totalRevenueCents: number;
  /** Number of cancelled orders excluded from revenue (for transparency). */
  cancelledOrders?: number;
  /** Total value of cancelled orders, excluded from revenue. */
  cancelledRevenueCents?: number;
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

function formatTimeRange(start?: string | null, end?: string | null): string | null {
  if (!start) return null;
  const opts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    timeZone: TIMEZONE,
  };
  const startStr = new Date(start).toLocaleTimeString("en-US", opts);
  if (!end) return startStr;
  return `${startStr} – ${new Date(end).toLocaleTimeString("en-US", opts)}`;
}

function formatAddress(addr?: DigestAddress | null): string | null {
  if (!addr) return null;
  return [addr.line1, addr.line2, `${addr.city}, ${addr.state} ${addr.postalCode}`.trim()]
    .filter((p) => p && p.trim().length > 0)
    .join(", ");
}

function modifiersLabel(modifiers?: OrderItemModifier[]): string | null {
  if (!modifiers || modifiers.length === 0) return null;
  return modifiers
    .map((m) => (m.priceDelta ? `${m.name} +${formatPrice(m.priceDelta)}` : m.name))
    .join(", ");
}

// ─── Per-order detail card (kitchen/driver-ready) ─────────
function DigestOrderCard({ order }: { order: OrderSummary }) {
  const isCancelled = order.status === "cancelled";
  const windowLabel = formatTimeRange(order.deliveryWindowStart, order.deliveryWindowEnd);
  const addressLabel = formatAddress(order.address);
  const items = order.items ?? [];

  return (
    <table
      cellPadding="0"
      cellSpacing="0"
      style={{
        width: "100%",
        borderCollapse: "collapse" as const,
        border: `1px solid ${isCancelled ? "#FECACA" : "#E5E7EB"}`,
        borderRadius: "8px",
        marginBottom: "12px",
        backgroundColor: isCancelled ? "#FEF2F2" : "#FFFFFF",
      }}
    >
      <tbody>
        {/* Header: order # + status + total */}
        <tr>
          <td style={{ padding: "12px 14px 6px 14px" }}>
            <Link
              href={`${APP_URL}/admin/orders/${order.id}`}
              style={{
                fontSize: "14px",
                fontFamily: FONT_STACK,
                color: "#D4A017",
                textDecoration: "underline",
                fontWeight: 700,
              }}
            >
              #{shortOrderId(order.id)}
            </Link>
            <span
              style={{
                fontSize: "12px",
                fontFamily: FONT_STACK,
                color: statusColor(order.status),
                fontWeight: 700,
                marginLeft: "8px",
              }}
            >
              {statusLabel(order.status)}
            </span>
          </td>
          <td style={{ padding: "12px 14px 6px 14px", textAlign: "right" as const }}>
            <span
              style={{
                fontSize: "15px",
                fontFamily: FONT_STACK,
                color: isCancelled ? "#9CA3AF" : "#111111",
                fontWeight: 700,
                textDecoration: isCancelled ? "line-through" : "none",
              }}
            >
              {formatPrice(order.totalCents)}
            </span>
          </td>
        </tr>

        {/* Customer + payment + window */}
        <tr>
          <td colSpan={2} style={{ padding: "0 14px 8px 14px" }}>
            <Text
              style={{
                fontSize: "13px",
                fontFamily: FONT_STACK,
                color: "#374151",
                margin: "0",
                fontWeight: 600,
              }}
            >
              {order.customerName}
              <span style={{ color: "#9CA3AF", fontWeight: 400 }}>
                {"  ·  "}
                {order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
                {"  ·  "}
                {order.paymentMethod === "cod" ? "Cash on Delivery" : "Paid (Stripe)"}
              </span>
            </Text>
            {windowLabel && (
              <Text
                style={{
                  fontSize: "12px",
                  fontFamily: FONT_STACK,
                  color: "#6B7280",
                  margin: "2px 0 0 0",
                }}
              >
                {"🕒 "}
                {windowLabel}
                {order.customerPhone ? `  ·  📞 ${order.customerPhone}` : ""}
              </Text>
            )}
            {addressLabel && (
              <Text
                style={{
                  fontSize: "12px",
                  fontFamily: FONT_STACK,
                  color: "#6B7280",
                  margin: "2px 0 0 0",
                }}
              >
                {"📍 "}
                {addressLabel}
              </Text>
            )}
          </td>
        </tr>

        {/* Line items */}
        {items.length > 0 && (
          <tr>
            <td colSpan={2} style={{ padding: "4px 14px 8px 14px" }}>
              {items.map((item, idx) => {
                const mods = modifiersLabel(item.modifiers);
                return (
                  <div
                    key={`${order.id}-item-${idx}`}
                    style={{ borderTop: "1px solid #F3F4F6", padding: "6px 0" }}
                  >
                    <table
                      cellPadding="0"
                      cellSpacing="0"
                      style={{ width: "100%", borderCollapse: "collapse" as const }}
                    >
                      <tbody>
                        <tr>
                          <td style={{ verticalAlign: "top" as const }}>
                            <Text
                              style={{
                                fontSize: "13px",
                                fontFamily: FONT_STACK,
                                color: "#111111",
                                margin: "0",
                                fontWeight: 600,
                              }}
                            >
                              <span style={{ color: "#8B4513", fontWeight: 700 }}>
                                {item.quantity}×
                              </span>{" "}
                              {item.name}
                              {item.nameMy ? (
                                <span
                                  style={{
                                    color: "#8B4513",
                                    fontWeight: 500,
                                    fontFamily: "Georgia, 'Palatino Linotype', serif",
                                  }}
                                >
                                  {"  "}
                                  {item.nameMy}
                                </span>
                              ) : null}
                            </Text>
                            {mods && (
                              <Text
                                style={{
                                  fontSize: "12px",
                                  fontFamily: FONT_STACK,
                                  color: "#6B7280",
                                  margin: "1px 0 0 0",
                                }}
                              >
                                ({mods})
                              </Text>
                            )}
                            {item.notes && (
                              <Text
                                style={{
                                  fontSize: "12px",
                                  fontStyle: "italic" as const,
                                  fontFamily: FONT_STACK,
                                  color: "#92400E",
                                  margin: "1px 0 0 0",
                                }}
                              >
                                {"📝 "}
                                {item.notes}
                              </Text>
                            )}
                          </td>
                          <td
                            style={{
                              textAlign: "right" as const,
                              verticalAlign: "top" as const,
                              whiteSpace: "nowrap" as const,
                              paddingLeft: "8px",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: "13px",
                                fontFamily: FONT_STACK,
                                color: "#374151",
                                margin: "0",
                              }}
                            >
                              {formatPrice(item.lineTotalCents)}
                            </Text>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </td>
          </tr>
        )}

        {/* Special instructions */}
        {order.specialInstructions && (
          <tr>
            <td colSpan={2} style={{ padding: "0 14px 10px 14px" }}>
              <Text
                style={{
                  fontSize: "12px",
                  fontFamily: FONT_STACK,
                  color: "#92400E",
                  margin: "0",
                  backgroundColor: "#FFFBEB",
                  border: "1px solid #FDE68A",
                  borderRadius: "6px",
                  padding: "6px 8px",
                }}
              >
                {"📋 "}
                <strong>Order note:</strong> {order.specialInstructions}
              </Text>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

// ─── Component ────────────────────────────────────────────
export function AdminDailyDigest({
  period,
  dateLabel,
  totalOrders,
  totalRevenueCents,
  cancelledOrders = 0,
  cancelledRevenueCents = 0,
  statusBreakdown,
  orders,
}: AdminDailyDigestProps) {
  const title = period === "morning" ? "Yesterday's Order Summary" : "Today's Orders So Far";

  return (
    <EmailLayout
      emailType="confirmation"
      showReferral={false}
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
                  Confirmed Revenue
                </Text>
                {cancelledOrders > 0 && (
                  <Text
                    style={{
                      fontSize: "11px",
                      fontFamily: FONT_STACK,
                      color: "#9CA3AF",
                      margin: "2px 0 0 0",
                    }}
                  >
                    excl. {cancelledOrders} cancelled ({formatPrice(cancelledRevenueCents)})
                  </Text>
                )}
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

      {/* ── Individual Orders (full detail) ──────────── */}
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
          {orders.map((order) => (
            <DigestOrderCard key={order.id} order={order} />
          ))}
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
