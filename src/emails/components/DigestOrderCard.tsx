import { Link, Text } from "@react-email/components";
import { StatusPill, type PillTone } from "./AdminBits";
import { BODY_FONT, BURMESE_FONT, C, cls } from "./theme";
import { APP_URL, formatPrice, shortOrderId } from "../helpers";
import { TIMEZONE } from "@/types/delivery";

// ─── Types ────────────────────────────────────────────────
interface OrderItemModifier {
  name: string;
  priceDelta?: number;
}

export interface DigestOrderItem {
  name: string;
  nameMy?: string | null;
  quantity: number;
  lineTotalCents: number;
  modifiers?: OrderItemModifier[];
  notes?: string | null;
}

export interface DigestAddress {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
}

export interface OrderSummary {
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

// ─── Status meta (shared with the digest's breakdown table) ──
const STATUS_META: Record<string, { label: string; tone: PillTone }> = {
  pending_approval: { label: "Pending Approval", tone: "warn" },
  confirmed: { label: "Confirmed", tone: "info" },
  preparing: { label: "Preparing", tone: "neutral" },
  out_for_delivery: { label: "Out for Delivery", tone: "warn" },
  delivered: { label: "Delivered", tone: "success" },
  cancelled: { label: "Cancelled", tone: "error" },
};

export function statusLabel(status: string): string {
  return STATUS_META[status]?.label ?? status;
}

export function statusTone(status: string): PillTone {
  return STATUS_META[status]?.tone ?? "neutral";
}

/** Dense ink-on-paper body text for card rows. */
export function rowText(
  size: number,
  color: string,
  extra?: React.CSSProperties
): React.CSSProperties {
  return { fontSize: `${size}px`, fontFamily: BODY_FONT, color, margin: "0", ...extra };
}

// ─── Helpers ──────────────────────────────────────────────
function formatDeliveryWhen(start?: string | null, end?: string | null): string | null {
  if (!start) return null;
  const day = new Date(start).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: TIMEZONE,
  });
  const opts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    timeZone: TIMEZONE,
  };
  const startStr = new Date(start).toLocaleTimeString("en-US", opts);
  const timeRange = end
    ? `${startStr} – ${new Date(end).toLocaleTimeString("en-US", opts)}`
    : startStr;
  return `${day} · ${timeRange}`;
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
export function DigestOrderCard({ order }: { order: OrderSummary }) {
  const isCancelled = order.status === "cancelled";
  const windowLabel = formatDeliveryWhen(order.deliveryWindowStart, order.deliveryWindowEnd);
  const addressLabel = formatAddress(order.address);
  const items = order.items ?? [];

  return (
    <table
      cellPadding="0"
      cellSpacing="0"
      className={isCancelled ? `${cls.clayTint} ${cls.clayBorder}` : `${cls.vellum} ${cls.line}`}
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
              className={cls.accent}
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
              className={isCancelled ? cls.faint : cls.ink}
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
            <Text className={cls.ink} style={rowText(13, C.ink, { fontWeight: 600 })}>
              {order.customerName}
              <span className={cls.faint} style={{ color: C.inkFaint, fontWeight: 400 }}>
                {"  ·  "}
                {order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
                {"  ·  "}
                {order.paymentMethod === "cod" ? "Cash on Delivery" : "Paid (Stripe)"}
              </span>
            </Text>
            {windowLabel && (
              <Text className={cls.muted} style={rowText(12, C.inkMuted, { margin: "2px 0 0 0" })}>
                {"📅 "}
                {windowLabel}
                {order.customerPhone ? `  ·  📞 ${order.customerPhone}` : ""}
              </Text>
            )}
            {addressLabel && (
              <Text className={cls.muted} style={rowText(12, C.inkMuted, { margin: "2px 0 0 0" })}>
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
                    className={cls.line}
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
                            <Text
                              className={cls.ink}
                              style={rowText(13, C.ink, { fontWeight: 600 })}
                            >
                              <span
                                className={cls.accent}
                                style={{ color: C.accent, fontWeight: 700 }}
                              >
                                {"×"}
                                {item.quantity}
                              </span>{" "}
                              {item.name}
                              {item.nameMy ? (
                                <span
                                  className={cls.muted}
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
                              <Text
                                className={cls.muted}
                                style={rowText(12, C.inkMuted, { margin: "1px 0 0 0" })}
                              >
                                ({mods})
                              </Text>
                            )}
                            {item.notes && (
                              <Text
                                className={cls.goldDeep}
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
                            <Text className={cls.ink} style={rowText(13, C.ink)}>
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
                className={`${cls.goldTint} ${cls.goldBorder} ${cls.ink}`}
                style={rowText(12, C.ink, {
                  backgroundColor: C.goldTint,
                  border: `1px solid ${C.goldTintBorder}`,
                  borderRadius: "6px",
                  padding: "6px 8px",
                })}
              >
                {"📋 "}
                <strong className={cls.goldDeep} style={{ color: C.goldDeep }}>
                  Order note:
                </strong>{" "}
                {order.specialInstructions}
              </Text>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
