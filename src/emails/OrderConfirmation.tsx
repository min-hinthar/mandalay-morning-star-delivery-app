import { Link, Section, Text } from "@react-email/components";
import { Callout } from "./components/Callout";
import { DeliveryBlock } from "./components/DeliveryBlock";
import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";
import { LoyaltyProgress, type LoyaltyProgressData } from "./components/LoyaltyProgress";
import { OrderItemsTable } from "./components/OrderItemsTable";
import { OrderStatusTracker } from "./components/OrderStatusTracker";
import { OrderTotalsTable } from "./components/OrderTotalsTable";
import { ReferralCallout } from "./components/ReferralCallout";
import { SuggestedItems } from "./components/SuggestedItems";
import { SupportSection } from "./components/SupportSection";
import { BODY_FONT, C, bodyStyle, cls, headingStyle, labelStyle } from "./components/theme";
import { APP_URL } from "./helpers";
import { TIMEZONE } from "@/types/delivery";
import type { SuggestedItem } from "@/lib/email/suggestions";

// ─── Helpers ──────────────────────────────────────────────
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: TIMEZONE,
  });
}

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
  category?: string;
  modifiers?: OrderItemModifier[];
  notes?: string | null;
  imageUrl?: string | null;
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
  suggestedItems?: SuggestedItem[];
  isExtendedRange?: boolean;
  /** Real loyalty progress at send time — renders nothing when absent. */
  loyalty?: LoyaltyProgressData | null;
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
  suggestedItems,
  isExtendedRange,
  loyalty,
}: OrderConfirmationProps) {
  const shortId = orderId.slice(0, 8).toUpperCase();
  const orderUrl = `${APP_URL}/orders/${orderId}`;
  const isCODPending = isPendingApproval && paymentMethod === "cod";

  return (
    <EmailLayout
      emailType="confirmation"
      showReferral={false}
      previewText={
        isCODPending
          ? `🍜 Mingalabar! Your order #${shortId} has been received`
          : `🍜 Mingalabar! Your order #${shortId} is confirmed`
      }
    >
      {/* ── Greeting ─────────────────────────────────── */}
      <Section style={{ padding: "30px 28px 0 28px" }}>
        <Text className={cls.ink} style={headingStyle(23)}>
          Mingalabar, {customerName}!
        </Text>
        <Text className={cls.muted} style={{ ...bodyStyle(15), margin: "0 0 24px 0" }}>
          {isCODPending
            ? "Thank you for your order! We’ve received it and our team will confirm it shortly."
            : "Thank you for your order! We’re excited to prepare your delicious Burmese meal."}
        </Text>
      </Section>

      {/* ── COD Pending Notice ─────────────────────────── */}
      {isCODPending && (
        <Callout
          tone="warn"
          title={<>{"⏳"} Awaiting Confirmation</>}
          style={{ margin: "0 28px 16px 28px" }}
        >
          Your cash-on-delivery order is being reviewed. You&apos;ll receive a confirmation email
          once approved.
        </Callout>
      )}

      {/* ── Status Tracker ───────────────────────────── */}
      <OrderStatusTracker currentStep={isCODPending ? "received" : "confirmed"} />

      {/* ── Order Details Box ────────────────────────── */}
      <Section
        className={`${cls.vellum} ${cls.line}`}
        style={{
          margin: "20px 28px",
          padding: "16px 20px",
          backgroundColor: C.vellum,
          border: `1px solid ${C.line}`,
          borderRadius: "12px",
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
          Placed
        </Text>
        <Text
          className={cls.ink}
          style={{ fontSize: "14px", fontFamily: BODY_FONT, color: C.ink, margin: "0" }}
        >
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
        <Callout
          tone="warn"
          title={<>{"⚠️"} Dietary Restrictions</>}
          style={{ margin: "0 28px 20px 28px" }}
        >
          {dietaryRestrictions.join(", ")}
        </Callout>
      )}

      {/* ── Items Table ──────────────────────────────── */}
      <OrderItemsTable items={items} />

      {/* ── Preparation Notes Summary (per-item) ──────── */}
      {items.some((i) => i.notes && i.notes.trim().length > 0) && (
        <Section
          className={`${cls.goldTint} ${cls.goldBorder}`}
          style={{
            margin: "16px 28px 0 28px",
            padding: "13px 16px",
            backgroundColor: C.goldTint,
            borderRadius: "10px",
            border: `1px solid ${C.goldTintBorder}`,
          }}
        >
          <Text
            className={cls.goldDeep}
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
                className={cls.ink}
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

      {/* ── Special Instructions Callout ──────────────── */}
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

      {/* ── Primary CTA ──────────────────────────────── */}
      <Section style={{ padding: "26px 28px 0 28px", textAlign: "center" as const }}>
        <EmailButton href={orderUrl}>View Your Order</EmailButton>
      </Section>

      {/* ── Secondary CTA: Reorder ───────────────────── */}
      <Section style={{ padding: "12px 28px 0 28px", textAlign: "center" as const }}>
        <Link
          className={cls.accent}
          href={`${APP_URL}/menu`}
          style={{
            fontSize: "14px",
            fontFamily: BODY_FONT,
            color: C.accent,
            textDecoration: "underline",
          }}
        >
          Reorder from our menu
        </Link>
      </Section>

      {/* ── Morning Star Rewards progress (real data) ── */}
      <LoyaltyProgress loyalty={loyalty} />

      {/* ── You Might Also Like ──────────────────────── */}
      <SuggestedItems items={suggestedItems} />

      {/* ── Refer a friend ───────────────────────────── */}
      <ReferralCallout source="email_confirmation" />

      {/* ── Need Help ────────────────────────────────── */}
      <SupportSection />

      {/* close the card with breathing room */}
      <Section style={{ height: "8px" }} />
    </EmailLayout>
  );
}

export default OrderConfirmation;
