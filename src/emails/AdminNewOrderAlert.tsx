import { Link, Section, Text } from "@react-email/components";
import { AdminCtas, AdminTitle, DataField, DataPanel } from "./components/AdminBits";
import { Callout } from "./components/Callout";
import { DeliveryBlock } from "./components/DeliveryBlock";
import { EmailLayout } from "./components/EmailLayout";
import { OrderItemsTable } from "./components/OrderItemsTable";
import { OrderTotalsTable } from "./components/OrderTotalsTable";
import { BODY_FONT, C } from "./components/theme";
import { APP_URL, formatDate, shortOrderId } from "./helpers";

// ─── Types ────────────────────────────────────────────────
interface OrderItemModifier {
  name: string;
  priceDelta?: number;
}

interface OrderItem {
  name: string;
  nameMy?: string | null;
  quantity: number;
  lineTotalCents: number;
  modifiers?: OrderItemModifier[];
  notes?: string | null;
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
  deliveryInstructions?: string;
  dietaryRestrictions?: string[];
  paymentMethod?: string;
  isPendingApproval?: boolean;
  placedAt: string;
  isExtendedRange?: boolean;
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
  deliveryInstructions,
  dietaryRestrictions,
  paymentMethod,
  isPendingApproval,
  placedAt,
  isExtendedRange,
}: AdminNewOrderAlertProps) {
  const shortId = shortOrderId(orderId);
  const adminOrderUrl = `${APP_URL}/admin/orders/${orderId}`;
  const isCOD = paymentMethod === "cod";

  return (
    <EmailLayout
      emailType="confirmation"
      variant="admin"
      showReferral={false}
      previewText={`New order #${shortId} from ${customerName}`}
    >
      {/* ── Header ─────────────────────────────────── */}
      <AdminTitle
        title="New Order Received"
        subtitle="A new order has been placed and needs your attention."
      />

      {/* ── COD Pending Approval Badge ─────────────── */}
      {isCOD && isPendingApproval && (
        <Callout
          tone="accent"
          title={<>{"⚠️"} Pending Approval — Cash on Delivery</>}
          style={{ margin: "0 28px 16px 28px" }}
        >
          This COD order requires admin approval before it can be processed.
        </Callout>
      )}

      {/* ── Order + Customer Details ───────────────── */}
      <DataPanel>
        <DataField label="Order Number" bold>
          <Link
            href={adminOrderUrl}
            style={{ color: C.accent, textDecoration: "underline", fontWeight: 700 }}
          >
            #{shortId}
          </Link>
        </DataField>
        <DataField label="Customer">
          {customerName}
          <br />
          <span style={{ fontSize: "13px", fontFamily: BODY_FONT, color: C.inkMuted }}>
            {customerEmail}
          </span>
        </DataField>
        <DataField label="Placed">{formatDate(placedAt)}</DataField>
        <DataField label="Payment Method" last>
          {isCOD ? "Cash on Delivery" : "Stripe (Online)"}
        </DataField>
      </DataPanel>

      {/* ── Delivery Info ────────────────────────────── */}
      <Section style={{ marginBottom: "20px" }}>
        <DeliveryBlock
          address={address}
          windowStart={deliveryWindowStart}
          windowEnd={deliveryWindowEnd}
          instructions={deliveryInstructions}
        />
      </Section>

      {/* ── Dietary Restrictions Callout ──────────────── */}
      {dietaryRestrictions && dietaryRestrictions.length > 0 && (
        <Callout
          tone="warn"
          title={<>{"⚠️"} Dietary Restrictions</>}
          style={{ margin: "0 28px 16px 28px" }}
        >
          {dietaryRestrictions.join(", ")}
        </Callout>
      )}

      {/* ── Items Table ──────────────────────────────── */}
      <OrderItemsTable items={items} />

      {/* ── Preparation Notes Summary (per-item) ──────── */}
      {items.some((i) => i.notes && i.notes.trim().length > 0) && (
        <Section
          style={{
            margin: "16px 28px 0 28px",
            padding: "13px 16px",
            backgroundColor: C.goldTint,
            borderRadius: "10px",
            border: `1px solid ${C.goldTintBorder}`,
          }}
        >
          <Text
            style={{
              fontSize: "13px",
              fontFamily: BODY_FONT,
              fontWeight: 700,
              color: C.goldDeep,
              margin: "0 0 4px 0",
            }}
          >
            {"👨‍🍳"} Preparation Notes
          </Text>
          {items
            .filter((i) => i.notes && i.notes.trim().length > 0)
            .map((i, idx) => (
              <Text
                key={`prep-${idx}`}
                style={{
                  fontSize: "13px",
                  fontFamily: BODY_FONT,
                  color: C.ink,
                  margin: "0 0 2px 0",
                  lineHeight: 1.5,
                }}
              >
                <strong>{i.name}:</strong> {i.notes}
              </Text>
            ))}
        </Section>
      )}

      {/* ── Special Instructions ──────────────────────── */}
      {specialInstructions && (
        <Callout
          tone="warn"
          title={<>{"📝"} Special Instructions</>}
          style={{ margin: "16px 28px 0 28px" }}
        >
          {specialInstructions}
        </Callout>
      )}

      {/* ── Totals ───────────────────────────────────── */}
      <OrderTotalsTable
        subtotalCents={subtotalCents}
        deliveryFeeCents={deliveryFeeCents}
        taxCents={taxCents}
        tipCents={tipCents}
        totalCents={totalCents}
        paymentMethod={paymentMethod}
        isExtendedRange={isExtendedRange}
      />

      {/* ── Primary CTA + Dashboard Link ─────────────── */}
      <AdminCtas
        primaryHref={adminOrderUrl}
        primaryLabel={isCOD && isPendingApproval ? "Review & Approve Order" : "View Order Details"}
        secondaryHref={`${APP_URL}/admin/orders`}
        secondaryLabel="Go to Admin Dashboard"
      />
    </EmailLayout>
  );
}

export default AdminNewOrderAlert;
