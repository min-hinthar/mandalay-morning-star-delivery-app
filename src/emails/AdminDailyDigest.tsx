import { Hr, Section, Text } from "@react-email/components";
import { AdminCtas, AdminTitle, StatTile, StatusPill } from "./components/AdminBits";
import {
  DigestOrderCard,
  rowText,
  statusLabel,
  statusTone,
  type OrderSummary,
} from "./components/DigestOrderCard";
import { EmailLayout } from "./components/EmailLayout";
import { C, cls, hairline, headingStyle, labelStyle } from "./components/theme";
import { APP_URL, formatPrice } from "./helpers";

// ─── Types ────────────────────────────────────────────────
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
        <Text className={cls.ink} style={{ ...headingStyle(16), margin: "0 0 10px 0" }}>
          Orders by Status
        </Text>
        <table
          cellPadding="0"
          cellSpacing="0"
          style={{ width: "100%", borderCollapse: "collapse" as const }}
        >
          <tbody>
            <tr>
              <td
                className={cls.lineStrong}
                style={{ padding: "0 0 6px 0", borderBottom: `1px solid ${C.lineStrong}` }}
              >
                <Text className={cls.faint} style={{ ...labelStyle(), margin: "0" }}>
                  Status
                </Text>
              </td>
              <td
                className={cls.lineStrong}
                style={{
                  padding: "0 0 6px 0",
                  borderBottom: `1px solid ${C.lineStrong}`,
                  textAlign: "right" as const,
                }}
              >
                <Text className={cls.faint} style={{ ...labelStyle(), margin: "0" }}>
                  Count
                </Text>
              </td>
            </tr>
            {Object.entries(statusBreakdown)
              .filter(([, count]) => count > 0)
              .map(([status, count]) => (
                <tr key={status}>
                  <td
                    className={cls.line}
                    style={{ padding: "8px 0", borderBottom: `1px solid ${C.line}` }}
                  >
                    <StatusPill tone={statusTone(status)}>{statusLabel(status)}</StatusPill>
                  </td>
                  <td
                    className={cls.line}
                    style={{
                      padding: "8px 0",
                      borderBottom: `1px solid ${C.line}`,
                      textAlign: "right" as const,
                    }}
                  >
                    <Text className={cls.ink} style={rowText(14, C.ink, { fontWeight: 700 })}>
                      {count}
                    </Text>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Section>

      <Hr className={cls.line} style={{ ...hairline, margin: "0 28px 24px 28px" }} />

      {/* ── Individual Orders (full detail) ──────────── */}
      {orders.length > 0 && (
        <Section style={{ padding: "0 28px", marginBottom: "12px" }}>
          <Text className={cls.ink} style={{ ...headingStyle(16), margin: "0 0 10px 0" }}>
            Order Details
          </Text>
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
