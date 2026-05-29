import {
  Button,
  Column,
  Heading,
  Hr,
  Img,
  Link,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { DeliveryBlock } from "./components/DeliveryBlock";
import { EmailLayout } from "./components/EmailLayout";
import { OrderItemsTable } from "./components/OrderItemsTable";
import { OrderTotalsTable } from "./components/OrderTotalsTable";
import { APP_URL, FONT_STACK, SERIF_STACK } from "./helpers";

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
  const previewText = `\uD83C\uDF5C Your ${itemNames[0] || "order"} & more are coming today!`;
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
        style={{
          padding: "32px 24px 16px 24px",
          backgroundColor: "#FFF9E6",
          textAlign: "center" as const,
        }}
      >
        <Text style={{ fontSize: "32px", margin: "0 0 8px 0" }}>
          {"\uD83C\uDF5C"} {"\uD83C\uDF72"} {"\uD83E\uDD62"}
        </Text>
        <Heading
          as="h2"
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#8B4513",
            fontFamily: SERIF_STACK,
            margin: "0 0 12px 0",
            lineHeight: "1.3",
          }}
        >
          Your Burmese feast is arriving today!
        </Heading>
        <Text
          style={{
            fontSize: "16px",
            color: "#374151",
            fontFamily: FONT_STACK,
            margin: "0 0 8px 0",
            lineHeight: "1.5",
          }}
        >
          Dear {customerName}, get ready for
        </Text>
        <Text
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "#A41034",
            fontFamily: FONT_STACK,
            margin: "0",
            lineHeight: "1.5",
          }}
        >
          {itemPreview}
          {itemCount > 2 && (
            <span style={{ fontSize: "14px", fontWeight: 400, color: "#6B7280" }}>
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
      <Section style={{ padding: "0 24px 16px 24px" }}>
        {staticMapUrl && (
          <Link href={mapsDirectionsUrl} style={{ textDecoration: "none" }}>
            <Img
              src={staticMapUrl}
              alt={`Delivery location map for ${address.line1}`}
              width={580}
              height={200}
              style={{ borderRadius: "8px", width: "100%", display: "block" }}
            />
          </Link>
        )}
        <Text
          style={{
            fontSize: "13px",
            color: "#6B7280",
            fontFamily: FONT_STACK,
            margin: "8px 0 0 0",
            textAlign: "center" as const,
          }}
        >
          <Link
            href={mapsDirectionsUrl}
            style={{ color: "#D4A017", textDecoration: "underline", fontSize: "13px" }}
          >
            {"\uD83D\uDCCD"} View on Google Maps
          </Link>
        </Text>
      </Section>

      {/* Full Order Details — so the customer knows exactly what's arriving */}
      {detailItems.length > 0 && (
        <>
          <Section style={{ padding: "8px 24px 0 24px" }}>
            <Hr style={{ borderColor: "#E5E7EB", margin: "0 0 12px 0" }} />
            <Text
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#8B4513",
                fontFamily: SERIF_STACK,
                margin: "0 0 4px 0",
              }}
            >
              Your Order ({itemCount} item{itemCount !== 1 ? "s" : ""})
            </Text>
            <Text
              style={{
                fontSize: "13px",
                color: "#6B7280",
                fontFamily: FONT_STACK,
                margin: "0",
              }}
            >
              Order #{orderId.slice(0, 8).toUpperCase()} — here&apos;s everything you ordered.
            </Text>
          </Section>

          <OrderItemsTable items={detailItems} />

          {/* Per-item preparation notes */}
          {prepNotes.length > 0 && (
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
                {"👨‍🍳"} Preparation Notes
              </Text>
              {prepNotes.map((i, idx) => (
                <Text
                  key={`prep-${idx}`}
                  style={{
                    fontSize: "13px",
                    fontFamily: FONT_STACK,
                    color: "#78350F",
                    margin: "0 0 2px 0",
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

          <Section style={{ padding: "16px 24px 0 24px" }}>
            <Hr style={{ borderColor: "#E5E7EB", margin: "0" }} />
          </Section>
        </>
      )}

      {/* Action Links */}
      <Section style={{ padding: "8px 24px 0 24px" }}>
        <Row style={{ width: "100%" }}>
          <Column style={{ width: "50%", paddingRight: "6px" }}>
            <Button
              href={`${APP_URL}/orders/${orderId}`}
              style={{
                backgroundColor: "#A41034",
                color: "#FFFFFF",
                fontFamily: FONT_STACK,
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
                textAlign: "center" as const,
                display: "block",
                padding: "12px 16px",
                borderRadius: "8px",
                width: "100%",
              }}
            >
              Track Your Order
            </Button>
          </Column>
          <Column style={{ width: "50%", paddingLeft: "6px" }}>
            <Button
              href={`${APP_URL}/orders/${orderId}`}
              style={{
                backgroundColor: "#FFFFFF",
                color: "#A41034",
                fontFamily: FONT_STACK,
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
                textAlign: "center" as const,
                display: "block",
                padding: "12px 16px",
                borderRadius: "8px",
                width: "100%",
                border: "2px solid #A41034",
              }}
            >
              Modify Order
            </Button>
          </Column>
        </Row>
      </Section>

      {/* Need help? section */}
      <Section style={{ padding: "24px" }}>
        <Hr style={{ borderColor: "#E5E7EB", borderWidth: "1px 0 0 0", margin: "0 0 16px 0" }} />
        <Text
          style={{
            fontSize: "13px",
            color: "#9CA3AF",
            fontFamily: FONT_STACK,
            margin: "0",
            textAlign: "center" as const,
            lineHeight: "1.6",
          }}
        >
          Need help?{" "}
          <Link
            href="mailto:admin@mandalaymorningstar.com"
            style={{ color: "#D4A017", textDecoration: "underline" }}
          >
            Contact our support team
          </Link>{" "}
          and we&apos;ll be happy to assist you.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default DeliveryReminder;
