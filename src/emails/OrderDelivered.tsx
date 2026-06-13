import { Column, Heading, Row, Section, Text } from "@react-email/components";
import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";
import { LoyaltyProgress, type LoyaltyProgressData } from "./components/LoyaltyProgress";
import { NextDeliveryTeaser } from "./components/NextDeliveryTeaser";
import { OrderStatusTracker } from "./components/OrderStatusTracker";
import { ReferralCallout } from "./components/ReferralCallout";
import { SupportSection } from "./components/SupportSection";
import { BODY_FONT, C, DISPLAY_FONT, cls } from "./components/theme";
import { APP_URL, shortOrderId } from "./helpers";

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
  /** Real loyalty progress at send time — renders nothing when absent. */
  loyalty?: LoyaltyProgressData | null;
  /** Live "order by … for … delivery" line — renders nothing when absent. */
  nextDeliveryCutoffText?: string | null;
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
  loyalty,
  nextDeliveryCutoffText,
}: OrderDeliveredProps) {
  const shortId = shortOrderId(orderId);
  const previewText = `Your order #${shortId} has been delivered!`;
  const formattedTotal = `$${(totalCents / 100).toFixed(2)}`;

  return (
    <EmailLayout emailType="delivered" previewText={previewText} showReferral={false}>
      {/* Hero */}
      <Section
        className={cls.sageTint}
        style={{
          padding: "30px 28px 22px 28px",
          backgroundColor: C.sageTint,
          textAlign: "center" as const,
        }}
      >
        <Text style={{ fontSize: "38px", margin: "0 0 8px 0" }}>{"✨"}</Text>
        <Heading
          as="h2"
          className={cls.ink}
          style={{
            fontSize: "25px",
            fontWeight: 600,
            color: C.ink,
            fontFamily: DISPLAY_FONT,
            margin: "0 0 10px 0",
            lineHeight: "1.25",
          }}
        >
          Your order has been delivered!
        </Heading>
        <Text
          className={cls.muted}
          style={{
            fontSize: "15px",
            color: C.inkMuted,
            fontFamily: BODY_FONT,
            margin: "0",
            lineHeight: "1.55",
          }}
        >
          Hi {customerName}, your order #{shortId} with {itemCount}{" "}
          {itemCount === 1 ? "item" : "items"} ({formattedTotal}) has arrived. Ta-meh-sa-pa {"—"}{" "}
          enjoy your meal! {"🍽"}
        </Text>
      </Section>

      {/* Status Tracker */}
      <OrderStatusTracker currentStep="delivered" />

      {/* Item Summary */}
      {itemNames.length > 0 && (
        <Section style={{ padding: "18px 28px 0 28px" }}>
          <Text
            className={cls.faint}
            style={{
              fontSize: "11px",
              fontFamily: BODY_FONT,
              fontWeight: 700,
              color: C.inkFaint,
              textTransform: "uppercase" as const,
              letterSpacing: "1.2px",
              margin: "0 0 6px 0",
            }}
          >
            Items delivered
          </Text>
          <Text
            className={cls.ink}
            style={{
              fontSize: "15px",
              color: C.ink,
              fontFamily: DISPLAY_FONT,
              margin: "0",
              lineHeight: "1.6",
            }}
          >
            {itemNames.join(" · ")}
          </Text>
        </Section>
      )}

      {/* CTAs — reorder is the hero action at peak satisfaction */}
      <Section style={{ padding: "22px 28px 0 28px" }}>
        <Row style={{ width: "100%" }}>
          <Column style={{ width: "50%", paddingRight: "6px" }}>
            <EmailButton href={`${APP_URL}/menu?src=email_delivered_reorder`} fullWidth size="sm">
              {"🍜"} Order Again
            </EmailButton>
          </Column>
          <Column style={{ width: "50%", paddingLeft: "6px" }}>
            <EmailButton
              href={`${APP_URL}/orders/${orderId}`}
              variant="secondary"
              fullWidth
              size="sm"
            >
              View Order
            </EmailButton>
          </Column>
        </Row>
      </Section>

      {/* Morning Star Rewards progress (real data) */}
      <LoyaltyProgress loyalty={loyalty} />

      {/* Next delivery window teaser (live schedule) */}
      <NextDeliveryTeaser cutoffText={nextDeliveryCutoffText} />

      {/* Peak goodwill — invite a referral */}
      <ReferralCallout source="email_delivered" />

      <SupportSection />

      <Section style={{ height: "8px" }} />
    </EmailLayout>
  );
}

export default OrderDelivered;
