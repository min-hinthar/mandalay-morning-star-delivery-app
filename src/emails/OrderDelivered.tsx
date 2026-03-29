import { Button, Column, Heading, Row, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import { OrderStatusTracker } from "./components/OrderStatusTracker";
import { SupportSection } from "./components/SupportSection";
import { APP_URL, FONT_STACK, SERIF_STACK, shortOrderId } from "./helpers";

// ============================================
// TYPES
// ============================================

export interface OrderDeliveredProps {
  customerName: string;
  orderId: string;
  itemCount: number;
  itemNames: string[];
  totalCents: number;
  deliveredAt?: string | null;
}

// ============================================
// COMPONENT
// ============================================

export function OrderDelivered({
  customerName,
  orderId,
  itemCount,
  itemNames,
  totalCents,
}: OrderDeliveredProps) {
  const shortId = shortOrderId(orderId);
  const previewText = `Your order #${shortId} has been delivered!`;
  const formattedTotal = `$${(totalCents / 100).toFixed(2)}`;

  return (
    <EmailLayout emailType="confirmation" previewText={previewText}>
      {/* Hero */}
      <Section
        style={{
          padding: "32px 24px 16px 24px",
          backgroundColor: "#F0FFF4",
          textAlign: "center" as const,
        }}
      >
        <Text style={{ fontSize: "40px", margin: "0 0 8px 0" }}>{"\u2705"}</Text>
        <Heading
          as="h2"
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#3D8B22",
            fontFamily: SERIF_STACK,
            margin: "0 0 12px 0",
            lineHeight: "1.3",
          }}
        >
          Your order has been delivered!
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
          {itemCount === 1 ? "item" : "items"} ({formattedTotal}) has arrived.
        </Text>
      </Section>

      {/* Status Tracker */}
      <OrderStatusTracker currentStep="delivered" />

      {/* Item Summary */}
      {itemNames.length > 0 && (
        <Section style={{ padding: "16px 24px" }}>
          <Text
            style={{
              fontSize: "14px",
              color: "#6B7280",
              fontFamily: FONT_STACK,
              margin: "0 0 8px 0",
            }}
          >
            Items delivered:
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

      {/* CTAs */}
      <Section style={{ padding: "8px 24px 24px 24px" }}>
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
              View Order
            </Button>
          </Column>
          <Column style={{ width: "50%", paddingLeft: "6px" }}>
            <Button
              href={`${APP_URL}/menu`}
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
              Order Again
            </Button>
          </Column>
        </Row>
      </Section>

      <SupportSection />
    </EmailLayout>
  );
}

export default OrderDelivered;
