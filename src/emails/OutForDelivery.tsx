import { Heading, Section, Text } from "@react-email/components";
import { DeliveryBlock } from "./components/DeliveryBlock";
import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";
import { OrderStatusTracker } from "./components/OrderStatusTracker";
import { SupportSection } from "./components/SupportSection";
import { C, DISPLAY_FONT, bodyStyle, headingStyle } from "./components/theme";
import { APP_URL, shortOrderId } from "./helpers";

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
    <EmailLayout emailType="delivery" previewText={previewText}>
      {/* Hero */}
      <Section
        style={{
          padding: "32px 28px 16px 28px",
          backgroundColor: C.blueTint,
          textAlign: "center" as const,
        }}
      >
        <Text style={{ fontSize: "40px", margin: "0 0 8px 0" }}>{"🚚"}</Text>
        <Heading as="h2" style={{ ...headingStyle(24), margin: "0 0 12px 0" }}>
          Your order is on its way!
        </Heading>
        <Text style={{ ...bodyStyle(16), lineHeight: "1.5" }}>
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
        <Section style={{ padding: "0 28px 16px 28px" }}>
          <Text style={{ ...bodyStyle(14), margin: "0 0 8px 0" }}>Items on the way:</Text>
          <Text
            style={{
              fontSize: "15px",
              color: C.ink,
              fontFamily: DISPLAY_FONT,
              margin: "0",
              lineHeight: "1.6",
            }}
          >
            {itemNames.join(", ")}
          </Text>
        </Section>
      )}

      {/* CTA */}
      <Section style={{ padding: "8px 28px 0 28px", textAlign: "center" as const }}>
        <EmailButton href={`${APP_URL}/orders/${orderId}`}>Track Your Order</EmailButton>
      </Section>

      <SupportSection />

      {/* close the card with breathing room */}
      <Section style={{ height: "8px" }} />
    </EmailLayout>
  );
}

export default OutForDelivery;
