import { Button, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import { OrderItemsTable } from "./components/OrderItemsTable";
import { OrderTotalsTable } from "./components/OrderTotalsTable";
import { DeliveryBlock } from "./components/DeliveryBlock";
import { APP_URL, FONT_STACK, SERIF_STACK, shortOrderId, formatDate } from "./helpers";

// ─── Types ────────────────────────────────────────────────
interface OrderItemModifier {
  name: string;
  priceDelta?: number;
}

interface OrderItem {
  name: string;
  quantity: number;
  lineTotalCents: number;
  modifiers?: OrderItemModifier[];
}

interface DeliveryAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface AdminNewOrderAlertProps {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotalCents: number;
  deliveryFeeCents: number;
  taxCents: number;
  tipCents?: number;
  totalCents: number;
  deliveryWindowStart?: string;
  deliveryWindowEnd?: string;
  address: DeliveryAddress;
  specialInstructions?: string;
  paymentMethod?: string;
  isPendingApproval?: boolean;
  placedAt: string;
}

// ─── Component ────────────────────────────────────────────
export function AdminNewOrderAlert({
  orderId,
  customerName,
  customerEmail,
  items,
  subtotalCents,
  deliveryFeeCents,
  taxCents,
  tipCents,
  totalCents,
  deliveryWindowStart,
  deliveryWindowEnd,
  address,
  specialInstructions,
  paymentMethod,
  isPendingApproval,
  placedAt,
}: AdminNewOrderAlertProps) {
  const shortId = shortOrderId(orderId);
  const adminOrderUrl = `${APP_URL}/admin/orders/${orderId}`;
  const isCOD = paymentMethod === "cod";

  return (
    <EmailLayout
      emailType="confirmation"
      previewText={`New order #${shortId} from ${customerName}`}
    >
      {/* ── Header ─────────────────────────────────── */}
      <Section style={{ padding: "32px 24px 0 24px" }}>
        <Text
          style={{
            fontSize: "22px",
            fontFamily: SERIF_STACK,
            color: "#8B4513",
            fontWeight: 700,
            margin: "0 0 8px 0",
            lineHeight: "1.3",
          }}
        >
          New Order Received
        </Text>
        <Text
          style={{
            fontSize: "15px",
            fontFamily: FONT_STACK,
            color: "#374151",
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          A new order has been placed and needs your attention.
        </Text>
      </Section>

      {/* ── COD Pending Approval Badge ─────────────── */}
      {isCOD && isPendingApproval && (
        <Section
          style={{
            margin: "0 24px 16px 24px",
            padding: "12px 16px",
            backgroundColor: "#FEF2F2",
            borderRadius: "8px",
            border: "1px solid #FECACA",
          }}
        >
          <Text
            style={{
              fontSize: "14px",
              fontFamily: FONT_STACK,
              fontWeight: 700,
              color: "#991B1B",
              margin: "0 0 4px 0",
            }}
          >
            {"\u26A0\uFE0F"} Pending Approval — Cash on Delivery
          </Text>
          <Text style={{ fontSize: "13px", fontFamily: FONT_STACK, color: "#7F1D1D", margin: "0" }}>
            This COD order requires admin approval before it can be processed.
          </Text>
        </Section>
      )}

      {/* ── Order + Customer Details ───────────────── */}
      <Section
        style={{
          margin: "0 24px",
          padding: "16px 20px",
          backgroundColor: "#F9FAFB",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <Text
          style={{
            fontSize: "13px",
            fontFamily: FONT_STACK,
            color: "#6B7280",
            margin: "0 0 4px 0",
          }}
        >
          Order Number
        </Text>
        <Text
          style={{
            fontSize: "16px",
            fontFamily: FONT_STACK,
            fontWeight: 700,
            color: "#111111",
            margin: "0 0 12px 0",
          }}
        >
          <Link
            href={adminOrderUrl}
            style={{ color: "#D4A017", textDecoration: "underline", fontWeight: 700 }}
          >
            #{shortId}
          </Link>
        </Text>

        <Text
          style={{
            fontSize: "13px",
            fontFamily: FONT_STACK,
            color: "#6B7280",
            margin: "0 0 4px 0",
          }}
        >
          Customer
        </Text>
        <Text
          style={{
            fontSize: "14px",
            fontFamily: FONT_STACK,
            color: "#111111",
            margin: "0 0 2px 0",
          }}
        >
          {customerName}
        </Text>
        <Text
          style={{
            fontSize: "13px",
            fontFamily: FONT_STACK,
            color: "#6B7280",
            margin: "0 0 12px 0",
          }}
        >
          {customerEmail}
        </Text>

        <Text
          style={{
            fontSize: "13px",
            fontFamily: FONT_STACK,
            color: "#6B7280",
            margin: "0 0 4px 0",
          }}
        >
          Placed
        </Text>
        <Text
          style={{
            fontSize: "14px",
            fontFamily: FONT_STACK,
            color: "#111111",
            margin: "0 0 12px 0",
          }}
        >
          {formatDate(placedAt)}
        </Text>

        <Text
          style={{
            fontSize: "13px",
            fontFamily: FONT_STACK,
            color: "#6B7280",
            margin: "0 0 4px 0",
          }}
        >
          Payment Method
        </Text>
        <Text style={{ fontSize: "14px", fontFamily: FONT_STACK, color: "#111111", margin: "0" }}>
          {isCOD ? "Cash on Delivery" : "Stripe (Online)"}
        </Text>
      </Section>

      {/* ── Delivery Info ────────────────────────────── */}
      <Section style={{ marginBottom: "20px" }}>
        <DeliveryBlock
          address={address}
          windowStart={deliveryWindowStart}
          windowEnd={deliveryWindowEnd}
        />
      </Section>

      {/* ── Items Table ──────────────────────────────── */}
      <OrderItemsTable items={items} />

      {/* ── Special Instructions ──────────────────────── */}
      {specialInstructions && (
        <Section
          style={{
            margin: "16px 24px 0 24px",
            padding: "12px 16px",
            backgroundColor: "#FFFBEB",
            borderRadius: "8px",
            border: "1px solid #FDE68A",
          }}
        >
          <Text
            style={{
              fontSize: "13px",
              fontFamily: FONT_STACK,
              fontWeight: 700,
              color: "#92400E",
              margin: "0 0 4px 0",
            }}
          >
            {"\uD83D\uDCDD"} Special Instructions
          </Text>
          <Text style={{ fontSize: "13px", fontFamily: FONT_STACK, color: "#78350F", margin: "0" }}>
            {specialInstructions}
          </Text>
        </Section>
      )}

      {/* ── Totals ───────────────────────────────────── */}
      <OrderTotalsTable
        subtotalCents={subtotalCents}
        deliveryFeeCents={deliveryFeeCents}
        taxCents={taxCents}
        tipCents={tipCents}
        totalCents={totalCents}
        paymentMethod={paymentMethod}
      />

      {/* ── Primary CTA ──────────────────────────────── */}
      <Section style={{ padding: "24px 24px 0 24px", textAlign: "center" as const }}>
        <Button
          href={adminOrderUrl}
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
          {isCOD && isPendingApproval ? "Review & Approve Order" : "View Order Details"}
        </Button>
      </Section>

      {/* ── Dashboard Link ───────────────────────────── */}
      <Section style={{ padding: "12px 24px 24px 24px", textAlign: "center" as const }}>
        <Link
          href={`${APP_URL}/admin/orders`}
          style={{
            fontSize: "14px",
            fontFamily: FONT_STACK,
            color: "#D4A017",
            textDecoration: "underline",
          }}
        >
          Go to Admin Dashboard
        </Link>
      </Section>
    </EmailLayout>
  );
}

export default AdminNewOrderAlert;
