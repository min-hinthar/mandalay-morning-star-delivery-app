import { Hr, Link, Section, Text } from "@react-email/components";
import { AdminCtas, AdminTitle, StatTile, StatusPill, type PillTone } from "./components/AdminBits";
import { EmailLayout } from "./components/EmailLayout";
import { BODY_FONT, BURMESE_FONT, C, hairline, headingStyle, labelStyle } from "./components/theme";
import { APP_URL, formatPrice, shortOrderId } from "./helpers";
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
const STATUS_META: Record<string, { label: string; tone: PillTone }> = {
  pending_approval: { label: "Pending Approval", tone: "warn" },
  confirmed: { label: "Confirmed", tone: "info" },
  preparing: { label: "Preparing", tone: "neutral" },
  out_for_delivery: { label: "Out for Delivery", tone: "warn" },
  delivered: { label: "Delivered", tone: "success" },
  cancelled: { label: "Cancelled", tone: "error" },
};

function statusLabel(status: string): string {
  return STATUS_META[status]?.label ?? status;
}

function statusTone(status: string): PillTone {
  return STATUS_META[status]?.tone ?? "neutral";
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

/** Dense ink-on-paper body text for card rows. */
function rowText(size: number, color: string, extra?: React.CSSProperties): React.CSSProperties {
  return { fontSize: `${size}px`, fontFamily: BODY_FONT, color, margin: "0", ...extra };
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
        borderCollapse: "separate" as const,
        borderSpacing: 0,
        border: `1px solid ${isCancelled ? C.clayTintBorder : C.line}`,
        borderRadius: "10px",
        marginBottom: "12px",
        backgroundColor: isCancelled ? C.clayTint : C.vellum,
      }}
    >
      <tbody>
        {/* Header: order # + status + total */}
        <tr>
          <td style={{ padding: "10px 14px 6px 14px" }}>
            <Link
              href={`${APP_URL}/admin/orders/${order.id}`}
              style={{
                fontSize: "14px",
                fontFamily: BODY_FONT,
                color: C.accent,
                textDecoration: "underline",
                fontWeight: 700,
              }}
            >
              #{shortOrderId(order.id)}
            </Link>
            <span style={{ display: "inline-block", marginLeft: "8px" }}>
              <StatusPill tone={statusTone(order.status)}>{statusLabel(order.status)}</StatusPill>
            </span>
          </td>
          <td style={{ padding: "10px 14px 6px 14px", textAlign: "right" as const }}>
            <span
              style={{
                fontSize: "15px",
                fontFamily: BODY_FONT,
                color: isCancelled ? C.inkFaint : C.ink,
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
            <Text style={rowText(13, C.ink, { fontWeight: 600 })}>
              {order.customerName}
              <span style={{ color: C.inkFaint, fontWeight: 400 }}>
                {"  ·  "}
                {order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
                {"  ·  "}
                {order.paymentMethod === "cod" ? "Cash on Delivery" : "Paid (Stripe)"}
              </span>
            </Text>
            {windowLabel && (
              <Text style={rowText(12, C.inkMuted, { margin: "2px 0 0 0" })}>
                {"🕒 "}
                {windowLabel}
                {order.customerPhone ? `  ·  📞 ${order.customerPhone}` : ""}
              </Text>
            )}
            {addressLabel && (
              <Text style={rowText(12, C.inkMuted, { margin: "2px 0 0 0" })}>
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
                    style={{ borderTop: `1px solid ${C.line}`, padding: "6px 0" }}
                  >
                    <table
                      cellPadding="0"
                      cellSpacing="0"
                      style={{ width: "100%", borderCollapse: "collapse" as const }}
                    >
                      <tbody>
                        <tr>
                          <td style={{ verticalAlign: "top" as const }}>
                            <Text style={rowText(13, C.ink, { fontWeight: 600 })}>
                              <span style={{ color: C.accent, fontWeight: 700 }}>
                                {item.quantity}×
                              </span>{" "}
                              {item.name}
                              {item.nameMy ? (
                                <span
                                  style={{
                                    color: C.inkMuted,
                                    fontWeight: 500,
                                    fontFamily: BURMESE_FONT,
                                  }}
                                >
                                  {"  "}
                                  {item.nameMy}
                                </span>
                              ) : null}
                            </Text>
                            {mods && (
                              <Text style={rowText(12, C.inkMuted, { margin: "1px 0 0 0" })}>
                                ({mods})
                              </Text>
                            )}
                            {item.notes && (
                              <Text
                                style={rowText(12, C.goldDeep, {
                                  margin: "1px 0 0 0",
                                  fontStyle: "italic" as const,
                                })}
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
                            <Text style={rowText(13, C.ink)}>
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
                style={rowText(12, C.ink, {
                  backgroundColor: C.goldTint,
                  border: `1px solid ${C.goldTintBorder}`,
                  borderRadius: "6px",
                  padding: "6px 8px",
                })}
              >
                {"📋 "}
                <strong style={{ color: C.goldDeep }}>Order note:</strong>{" "}
                {order.specialInstructions}
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
      variant="admin"
      showReferral={false}
      previewText={`${title}: ${totalOrders} orders, ${formatPrice(totalRevenueCents)} revenue`}
    >
      {/* ── Header ─────────────────────────────────── */}
      <AdminTitle title={title} subtitle={dateLabel} />

      {/* ── Key Metrics ────────────────────────────── */}
      <Section style={{ padding: "0 28px", marginBottom: "24px" }}>
        <table
          cellPadding="0"
          cellSpacing="0"
          style={{ width: "100%", borderCollapse: "separate" as const, borderSpacing: 0 }}
        >
          <tbody>
            <tr>
              <StatTile value={totalOrders} label="Total Orders" />
              <td style={{ width: "12px", fontSize: 0 }} />
              <StatTile
                value={formatPrice(totalRevenueCents)}
                label="Confirmed Revenue"
                note={
                  cancelledOrders > 0
                    ? `excl. ${cancelledOrders} cancelled (${formatPrice(cancelledRevenueCents)})`
                    : undefined
                }
              />
            </tr>
          </tbody>
        </table>
      </Section>

      {/* ── Status Breakdown ───────────────────────── */}
      <Section style={{ padding: "0 28px", marginBottom: "24px" }}>
        <Text style={{ ...headingStyle(16), margin: "0 0 10px 0" }}>Orders by Status</Text>
        <table
          cellPadding="0"
          cellSpacing="0"
          style={{ width: "100%", borderCollapse: "collapse" as const }}
        >
          <tbody>
            <tr>
              <td style={{ padding: "0 0 6px 0", borderBottom: `1px solid ${C.lineStrong}` }}>
                <Text style={{ ...labelStyle(), margin: "0" }}>Status</Text>
              </td>
              <td
                style={{
                  padding: "0 0 6px 0",
                  borderBottom: `1px solid ${C.lineStrong}`,
                  textAlign: "right" as const,
                }}
              >
                <Text style={{ ...labelStyle(), margin: "0" }}>Count</Text>
              </td>
            </tr>
            {Object.entries(statusBreakdown)
              .filter(([, count]) => count > 0)
              .map(([status, count]) => (
                <tr key={status}>
                  <td style={{ padding: "8px 0", borderBottom: `1px solid ${C.line}` }}>
                    <StatusPill tone={statusTone(status)}>{statusLabel(status)}</StatusPill>
                  </td>
                  <td
                    style={{
                      padding: "8px 0",
                      borderBottom: `1px solid ${C.line}`,
                      textAlign: "right" as const,
                    }}
                  >
                    <Text style={rowText(14, C.ink, { fontWeight: 700 })}>{count}</Text>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Section>

      <Hr style={{ ...hairline, margin: "0 28px 24px 28px" }} />

      {/* ── Individual Orders (full detail) ──────────── */}
      {orders.length > 0 && (
        <Section style={{ padding: "0 28px", marginBottom: "12px" }}>
          <Text style={{ ...headingStyle(16), margin: "0 0 10px 0" }}>Order Details</Text>
          {orders.map((order) => (
            <DigestOrderCard key={order.id} order={order} />
          ))}
        </Section>
      )}

      {/* ── CTA ──────────────────────────────────────── */}
      <AdminCtas primaryHref={`${APP_URL}/admin/orders`} primaryLabel="View All Orders" />
    </EmailLayout>
  );
}

export default AdminDailyDigest;
