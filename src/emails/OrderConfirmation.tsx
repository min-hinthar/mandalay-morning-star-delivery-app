import { Button, Link, Section, Text } from "@react-email/components";
import { DeliveryBlock } from "./components/DeliveryBlock";
import { EmailLayout } from "./components/EmailLayout";
import { APP_URL } from "./helpers";
import { OrderItemsTable } from "./components/OrderItemsTable";
import { OrderStatusTracker } from "./components/OrderStatusTracker";
import { OrderTotalsTable } from "./components/OrderTotalsTable";
import { SuggestedItems } from "./components/SuggestedItems";
import { SupportSection } from "./components/SupportSection";

const SERIF = "Georgia, 'Palatino Linotype', serif";
const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

// ─── Helpers ──────────────────────────────────────────────
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
interface OrderItemModifier {
  name: string;
  priceDelta?: number;
}

interface OrderItem {
  name: string;
  quantity: number;
  lineTotalCents: number;
  category?: string;
  modifiers?: OrderItemModifier[];
}

interface DeliveryAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface OrderConfirmationProps {
  customerName: string;
  orderId: string;
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
  deliveryInstructions?: string;
  driverName?: string;
  paymentMethod?: string;
  isPendingApproval?: boolean;
  dietaryRestrictions?: string[];
  placedAt: string;
}

// ─── Component ────────────────────────────────────────────
export function OrderConfirmation({
  customerName,
  orderId,
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
  deliveryInstructions,
  driverName,
  paymentMethod,
  isPendingApproval,
  dietaryRestrictions,
  placedAt,
}: OrderConfirmationProps) {
  const shortId = orderId.slice(0, 8).toUpperCase();
  const orderUrl = `${APP_URL}/orders/${orderId}`;
  const isCODPending = isPendingApproval && paymentMethod === "cod";

  return (
    <EmailLayout
      emailType="confirmation"
      previewText={
        isCODPending
          ? `\uD83C\uDF5C Mingalabar! Your order #${shortId} has been received`
          : `\uD83C\uDF5C Mingalabar! Your order #${shortId} is confirmed`
      }
    >
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
          Mingalabar! {customerName},
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
          {isCODPending
            ? "Thank you for your order! We\u2019ve received it and our team will confirm it shortly."
            : "Thank you for your order! We\u2019re excited to prepare your delicious Burmese meal."}
        </Text>
      </Section>

      {/* ── COD Pending Notice ─────────────────────────── */}
      {isCODPending && (
        <Section
          style={{
            margin: "0 24px 16px 24px",
            padding: "12px 16px",
            backgroundColor: "#FFFBEB",
            borderRadius: "8px",
            border: "1px solid #FDE68A",
          }}
        >
          <Text
            style={{
              fontSize: "13px",
              fontFamily: SANS,
              fontWeight: 700,
              color: "#92400E",
              margin: "0 0 4px 0",
            }}
          >
            {"\u23F3"} Awaiting Confirmation
          </Text>
          <Text style={{ fontSize: "13px", fontFamily: SANS, color: "#78350F", margin: "0" }}>
            Your cash-on-delivery order is being reviewed. You&apos;ll receive a confirmation email
            once approved.
          </Text>
        </Section>
      )}

      {/* ── Status Tracker ───────────────────────────── */}
      <OrderStatusTracker currentStep={isCODPending ? "received" : "confirmed"} />

      {/* ── Order Details Box ────────────────────────── */}
      <Section
        style={{
          margin: "0 24px",
          padding: "16px 20px",
          backgroundColor: "#F9FAFB",
          borderRadius: "8px",
          marginBottom: "20px",
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
          Placed
        </Text>
        <Text style={{ fontSize: "14px", fontFamily: SANS, color: "#111111", margin: "0" }}>
          {formatDate(placedAt)}
        </Text>
      </Section>

      {/* ── Delivery Info ────────────────────────────── */}
      <Section style={{ marginBottom: "20px" }}>
        <DeliveryBlock
          address={address}
          windowStart={deliveryWindowStart}
          windowEnd={deliveryWindowEnd}
          instructions={deliveryInstructions}
          driverName={driverName}
        />
      </Section>

      {/* ── Dietary Restrictions Callout ──────────────── */}
      {dietaryRestrictions && dietaryRestrictions.length > 0 && (
        <Section
          style={{
            margin: "0 24px 20px 24px",
            padding: "12px 16px",
            backgroundColor: "#FFFBEB",
            borderRadius: "8px",
            border: "1px solid #FDE68A",
          }}
        >
          <Text
            style={{
              fontSize: "13px",
              fontFamily: SANS,
              fontWeight: 700,
              color: "#92400E",
              margin: "0 0 4px 0",
            }}
          >
            {"\u26A0\uFE0F"} Dietary Restrictions
          </Text>
          <Text style={{ fontSize: "13px", fontFamily: SANS, color: "#78350F", margin: "0" }}>
            {dietaryRestrictions.join(", ")}
          </Text>
        </Section>
      )}

      {/* ── Items Table ──────────────────────────────── */}
      <OrderItemsTable items={items} />

      {/* ── Special Instructions Callout ──────────────── */}
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
              fontFamily: SANS,
              fontWeight: 700,
              color: "#92400E",
              margin: "0 0 4px 0",
            }}
          >
            {"\uD83D\uDCDD"} Special Instructions
          </Text>
          <Text style={{ fontSize: "13px", fontFamily: SANS, color: "#78350F", margin: "0" }}>
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
          href={orderUrl}
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
          View Your Order
        </Button>
      </Section>

      {/* ── Secondary CTA: Reorder ───────────────────── */}
      <Section style={{ padding: "12px 24px 0 24px", textAlign: "center" as const }}>
        <Link
          href={`${APP_URL}/menu`}
          style={{
            fontSize: "14px",
            fontFamily: SANS,
            color: "#D4A017",
            textDecoration: "underline",
          }}
        >
          Reorder from our menu
        </Link>
      </Section>

      {/* ── You Might Also Like ──────────────────────── */}
      <SuggestedItems />

      {/* ── Need Help ────────────────────────────────── */}
      <SupportSection />
    </EmailLayout>
  );
}

export default OrderConfirmation;
