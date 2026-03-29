import { Button, Heading, Section, Text } from "@react-email/components";
import { DeliveryBlock } from "./components/DeliveryBlock";
import { EmailLayout } from "./components/EmailLayout";
import { OrderStatusTracker } from "./components/OrderStatusTracker";
import { SupportSection } from "./components/SupportSection";
import { APP_URL, FONT_STACK, SERIF_STACK, shortOrderId } from "./helpers";

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

export interface OutForDeliveryProps {
  customerName: string;
  orderId: string;
  itemCount: number;
  itemNames: string[];
  deliveryWindowStart?: string | null;
  deliveryWindowEnd?: string | null;
  address?: DeliveryAddress | null;
  specialInstructions?: string | null;
  driverName?: string;
}

// ============================================
// COMPONENT
// ============================================

export function OutForDelivery({
  customerName,
  orderId,
  itemCount,
  itemNames,
  deliveryWindowStart,
  deliveryWindowEnd,
  address,
  specialInstructions,
  driverName,
}: OutForDeliveryProps) {
  const shortId = shortOrderId(orderId);
  const previewText = `Your order #${shortId} is on its way!`;

  return (
    <EmailLayout emailType="confirmation" previewText={previewText}>
      {/* Hero */}
      <Section
        style={{
          padding: "32px 24px 16px 24px",
          backgroundColor: "#FFF9E6",
          textAlign: "center" as const,
        }}
      >
        <Text style={{ fontSize: "40px", margin: "0 0 8px 0" }}>{"\uD83D\uDE9A"}</Text>
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
          Your order is on its way!
        </Heading>
        <Text
          style={{
            fontSize: "16px",
            color: "#374151",
            fontFamily: FONT_STACK,
            margin: "0",
            lineHeight: "1.5",
          }}
        >
          Hi {customerName}, your order #{shortId} with {itemCount}{" "}
          {itemCount === 1 ? "item" : "items"} is out for delivery.
        </Text>
      </Section>

      {/* Status Tracker */}
      <OrderStatusTracker currentStep="out_for_delivery" />

      {/* Delivery Details */}
      {address && (
        <Section style={{ padding: "16px 0" }}>
          <DeliveryBlock
            address={address}
            windowStart={deliveryWindowStart ?? undefined}
            windowEnd={deliveryWindowEnd ?? undefined}
            instructions={specialInstructions ?? undefined}
            driverName={driverName}
          />
        </Section>
      )}

      {/* Item Preview */}
      {itemNames.length > 0 && (
        <Section style={{ padding: "0 24px 16px 24px" }}>
          <Text
            style={{
              fontSize: "14px",
              color: "#6B7280",
              fontFamily: FONT_STACK,
              margin: "0 0 8px 0",
            }}
          >
            Items on the way:
          </Text>
          <Text
            style={{
              fontSize: "15px",
              color: "#374151",
              fontFamily: FONT_STACK,
              margin: "0",
              lineHeight: "1.6",
            }}
          >
            {itemNames.join(", ")}
          </Text>
        </Section>
      )}

      {/* CTA */}
      <Section style={{ padding: "8px 24px 24px 24px", textAlign: "center" as const }}>
        <Button
          href={`${APP_URL}/orders/${orderId}`}
          style={{
            backgroundColor: "#A41034",
            color: "#FFFFFF",
            fontFamily: FONT_STACK,
            fontSize: "15px",
            fontWeight: 700,
            textDecoration: "none",
            textAlign: "center" as const,
            display: "inline-block",
            padding: "14px 32px",
            borderRadius: "8px",
          }}
        >
          Track Your Order
        </Button>
      </Section>

      <SupportSection />
    </EmailLayout>
  );
}

export default OutForDelivery;
