import { Column, Heading, Hr, Img, Link, Row, Section, Text } from "@react-email/components";
import { DeliveryBlock } from "./components/DeliveryBlock";
import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";
import { OrderItemsTable } from "./components/OrderItemsTable";
import { OrderTotalsTable } from "./components/OrderTotalsTable";
import { BODY_FONT, C, DISPLAY_FONT, bodyStyle, cls, headingStyle } from "./components/theme";
import { APP_URL } from "./helpers";

// ============================================
// TYPES
// ============================================

interface DeliveryAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
}

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
}

export interface DeliveryReminderProps {
  customerName: string;
  orderId: string;
  itemCount: number;
  itemNames: string[];
  deliveryWindowStart: string;
  deliveryWindowEnd: string;
  address: DeliveryAddress;
  specialInstructions?: string;
  driverName?: string;
  /** Full line items — when present, a detailed order breakdown is rendered. */
  items?: OrderItem[];
  subtotalCents?: number;
  deliveryFeeCents?: number;
  taxCents?: number;
  tipCents?: number;
  totalCents?: number;
  paymentMethod?: string;
  isExtendedRange?: boolean;
}

// ============================================
// HELPERS
// ============================================

function buildItemPreview(itemNames: string[]): string {
  if (itemNames.length === 0) return "your order";
  if (itemNames.length === 1) return itemNames[0];
  if (itemNames.length === 2) return `${itemNames[0]} & ${itemNames[1]}`;
  const remaining = itemNames.length - 2;
  return `${itemNames[0]}, ${itemNames[1]} and ${remaining} more`;
}

function buildFullAddress(address: DeliveryAddress): string {
  return [address.line1, address.line2, address.city, address.state, address.postalCode]
    .filter(Boolean)
    .join(", ");
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// ============================================
// COMPONENT
// ============================================

export function DeliveryReminder({
  customerName,
  orderId,
  itemCount,
  itemNames,
  deliveryWindowStart,
  deliveryWindowEnd,
  address,
  specialInstructions,
  driverName,
  items,
  subtotalCents,
  deliveryFeeCents,
  taxCents,
  tipCents,
  totalCents,
  paymentMethod,
  isExtendedRange,
}: DeliveryReminderProps) {
  const detailItems = items ?? [];
  const prepNotes = detailItems.filter((i) => i.notes && i.notes.trim().length > 0);
  const itemPreview = buildItemPreview(itemNames);
  const previewText = `🍜 Your ${itemNames[0] || "order"} & more are coming today!`;
  const fullAddress = buildFullAddress(address);
  const encodedAddress = encodeURIComponent(fullAddress);
  const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;

  const hasMapKey = GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY.length > 0;
  const staticMapUrl = hasMapKey
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=15&size=580x200&markers=color:red%7C${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`
    : null;

  return (
    <EmailLayout emailType="reminder" previewText={previewText}>
      {/* Excitement Section */}
      <Section
        className={cls.goldTint}
        style={{
          padding: "32px 28px 16px 28px",
          backgroundColor: C.goldTint,
          textAlign: "center" as const,
        }}
      >
        <Text style={{ fontSize: "32px", margin: "0 0 8px 0" }}>
          {"🍜"} {"🍲"} {"🥢"}
        </Text>
        <Heading as="h2" className={cls.ink} style={{ ...headingStyle(24), margin: "0 0 12px 0" }}>
          Your Burmese feast is arriving today!
        </Heading>
        <Text
          className={cls.muted}
          style={{ ...bodyStyle(16), margin: "0 0 8px 0", lineHeight: "1.5" }}
        >
          Dear {customerName}, get ready for
        </Text>
        <Text
          className={cls.accent}
          style={{
            fontSize: "18px",
            fontWeight: 600,
            color: C.accent,
            fontFamily: DISPLAY_FONT,
            margin: "0",
            lineHeight: "1.5",
          }}
        >
          {itemPreview}
          {itemCount > 2 && (
            <span
              className={cls.muted}
              style={{
                fontSize: "14px",
                fontWeight: 400,
                color: C.inkMuted,
                fontFamily: BODY_FONT,
              }}
            >
              {" "}
              ({itemCount} items total)
            </span>
          )}
        </Text>
      </Section>

      {/* Delivery Details via DeliveryBlock */}
      <Section style={{ padding: "16px 0" }}>
        <DeliveryBlock
          address={address}
          windowStart={deliveryWindowStart}
          windowEnd={deliveryWindowEnd}
          instructions={specialInstructions}
          driverName={driverName}
        />
      </Section>

      {/* Static Map Section */}
      <Section style={{ padding: "0 28px 16px 28px" }}>
        {staticMapUrl && (
          <Link href={mapsDirectionsUrl} style={{ textDecoration: "none" }}>
            <Img
              src={staticMapUrl}
              alt={`Delivery location map for ${address.line1}`}
              width={580}
              height={200}
              style={{
                borderRadius: "12px",
                border: `1px solid ${C.line}`,
                width: "100%",
                display: "block",
              }}
            />
          </Link>
        )}
        <Text
          className={cls.muted}
          style={{ ...bodyStyle(13), margin: "8px 0 0 0", textAlign: "center" as const }}
        >
          <Link
            className={cls.accent}
            href={mapsDirectionsUrl}
            style={{ color: C.accent, textDecoration: "underline", fontSize: "13px" }}
          >
            {"📍"} View on Google Maps
          </Link>
        </Text>
      </Section>

      {/* Full Order Details — so the customer knows exactly what's arriving */}
      {detailItems.length > 0 && (
        <>
          <Section style={{ padding: "8px 28px 0 28px" }}>
            <Hr className={cls.line} style={{ borderColor: C.line, margin: "0 0 12px 0" }} />
            <Text className={cls.ink} style={{ ...headingStyle(17), margin: "0 0 4px 0" }}>
              Your Order ({itemCount} item{itemCount !== 1 ? "s" : ""})
            </Text>
            <Text className={cls.muted} style={bodyStyle(13)}>
              Order #{orderId.slice(0, 8).toUpperCase()} — here&apos;s everything you ordered.
            </Text>
          </Section>

          <OrderItemsTable items={detailItems} />

          {/* Per-item preparation notes */}
          {prepNotes.length > 0 && (
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
              {prepNotes.map((i, idx) => (
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

          {totalCents != null && (
            <OrderTotalsTable
              subtotalCents={subtotalCents ?? 0}
              deliveryFeeCents={deliveryFeeCents ?? 0}
              taxCents={taxCents ?? 0}
              tipCents={tipCents}
              totalCents={totalCents}
              paymentMethod={paymentMethod}
              isExtendedRange={isExtendedRange}
            />
          )}

          <Section style={{ padding: "16px 28px 0 28px" }}>
            <Hr className={cls.line} style={{ borderColor: C.line, margin: "0" }} />
          </Section>
        </>
      )}

      {/* Action Links */}
      <Section style={{ padding: "8px 28px 0 28px" }}>
        <Row style={{ width: "100%" }}>
          <Column style={{ width: "50%", paddingRight: "6px" }}>
            <EmailButton href={`${APP_URL}/orders/${orderId}`} fullWidth size="sm">
              Track Your Order
            </EmailButton>
          </Column>
          <Column style={{ width: "50%", paddingLeft: "6px" }}>
            <EmailButton
              href={`${APP_URL}/orders/${orderId}`}
              variant="secondary"
              fullWidth
              size="sm"
            >
              Modify Order
            </EmailButton>
          </Column>
        </Row>
      </Section>

      {/* Need help? section */}
      <Section style={{ padding: "26px 28px 0 28px" }}>
        <Hr
          className={cls.line}
          style={{ borderColor: C.line, borderWidth: "1px 0 0 0", margin: "0 0 18px 0" }}
        />
        <Text
          className={cls.faint}
          style={{
            fontSize: "13px",
            color: C.inkFaint,
            fontFamily: BODY_FONT,
            margin: "0",
            textAlign: "center" as const,
            lineHeight: "1.6",
          }}
        >
          Need help?{" "}
          <Link
            className={cls.accent}
            href="mailto:admin@mandalaymorningstar.com"
            style={{ color: C.accent, textDecoration: "underline" }}
          >
            Contact our support team
          </Link>{" "}
          and we&apos;ll be happy to assist you.
        </Text>
      </Section>

      {/* close the card with breathing room */}
      <Section style={{ height: "8px" }} />
    </EmailLayout>
  );
}

export default DeliveryReminder;
