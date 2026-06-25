import { Column, Hr, Link, Row, Section, Text } from "@react-email/components";
import { Callout } from "./components/Callout";
import { DishThumb } from "./components/DishThumb";
import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";
import {
  BODY_FONT,
  C,
  DISPLAY_FONT,
  bodyStyle,
  cls,
  headingStyle,
  kickerStyle,
} from "./components/theme";
import { APP_URL, formatDate, formatPrice, shortOrderId } from "./helpers";

// ============================================
// TYPES
// ============================================

interface RefundedItem {
  name: string;
  quantity: number;
  refundAmountCents: number;
  /** Dish photo (hostable raster only renders; else an initial tile). */
  imageUrl?: string | null;
}

export interface RefundNotificationProps {
  customerName: string;
  orderId: string;
  isPartialRefund: boolean;
  refundedItems: RefundedItem[];
  originalTotalCents: number;
  refundAmountCents: number;
  refundMethod: string;
  refundTimeline: string;
  shippingRefundCents?: number;
  processedAt: string;
}

// ============================================
// COMPONENT
// ============================================

export function RefundNotification({
  customerName,
  orderId,
  isPartialRefund,
  refundedItems,
  originalTotalCents,
  refundAmountCents,
  refundMethod,
  refundTimeline,
  shippingRefundCents,
  processedAt,
}: RefundNotificationProps) {
  const previewText = `Your refund of ${formatPrice(refundAmountCents)} has been processed`;
  const accentBorder = isPartialRefund ? C.gold : C.sage;
  const accentBg = isPartialRefund ? C.goldTint : C.sageTint;

  return (
    <EmailLayout emailType="refund" previewText={previewText} showReferral={false}>
      {/* Greeting */}
      <Section style={{ padding: "30px 28px 0 28px" }}>
        <Text className={cls.ink} style={headingStyle(20)}>
          Dear {customerName},
        </Text>
        <Text className={cls.muted} style={{ ...bodyStyle(15), margin: "0 0 24px 0" }}>
          {isPartialRefund
            ? `We've processed a partial refund for your order #${shortOrderId(orderId)}.`
            : `We've processed a full refund for your order #${shortOrderId(orderId)}.`}{" "}
          We want to make sure you have all the details below.
        </Text>
      </Section>

      {/* Refund Breakdown Table */}
      <Section
        className={`${cls.vellum} ${cls.line}`}
        style={{
          margin: "0 28px",
          padding: "20px",
          backgroundColor: C.vellum,
          borderRadius: "12px",
          border: `1px solid ${C.line}`,
        }}
      >
        <Text className={cls.accent} style={{ ...kickerStyle(), margin: "0 0 12px 0" }}>
          Refund Breakdown
        </Text>

        {/* Original order total */}
        <Row style={{ width: "100%" }}>
          <Column style={{ width: "70%" }}>
            <Text
              className={cls.ink}
              style={{
                fontSize: "14px",
                color: C.ink,
                fontFamily: BODY_FONT,
                margin: "0 0 8px 0",
              }}
            >
              Original Order Total
            </Text>
          </Column>
          <Column style={{ width: "30%" }}>
            <Text
              className={cls.ink}
              style={{
                fontSize: "14px",
                color: C.ink,
                fontFamily: BODY_FONT,
                margin: "0 0 8px 0",
                textAlign: "right" as const,
              }}
            >
              {formatPrice(originalTotalCents)}
            </Text>
          </Column>
        </Row>

        <Hr
          className={cls.goldLeaf}
          style={{ borderColor: C.goldLeaf, borderWidth: "1px 0 0 0", margin: "8px 0" }}
        />

        {/* Refunded items — with dish photos */}
        {refundedItems.map((item, idx) => (
          <Row key={`refund-item-${idx}`} style={{ width: "100%" }}>
            <Column
              style={{ width: "44px", verticalAlign: "middle" as const, paddingRight: "10px" }}
            >
              <DishThumb imageUrl={item.imageUrl} name={item.name} size={36} radius={8} />
            </Column>
            <Column style={{ verticalAlign: "middle" as const }}>
              <Text
                className={cls.muted}
                style={{
                  fontSize: "13px",
                  color: C.inkMuted,
                  fontFamily: BODY_FONT,
                  margin: "4px 0",
                }}
              >
                {item.name} x{item.quantity}
              </Text>
            </Column>
            <Column style={{ width: "30%", verticalAlign: "middle" as const }}>
              <Text
                className={cls.muted}
                style={{
                  fontSize: "13px",
                  color: C.inkMuted,
                  fontFamily: BODY_FONT,
                  margin: "4px 0",
                  textAlign: "right" as const,
                }}
              >
                {formatPrice(item.refundAmountCents)}
              </Text>
            </Column>
          </Row>
        ))}

        {/* Shipping refund if applicable */}
        {shippingRefundCents != null && shippingRefundCents > 0 && (
          <Row style={{ width: "100%" }}>
            <Column style={{ width: "70%" }}>
              <Text
                className={cls.muted}
                style={{
                  fontSize: "13px",
                  color: C.inkMuted,
                  fontFamily: BODY_FONT,
                  margin: "4px 0",
                }}
              >
                Shipping Refund
              </Text>
            </Column>
            <Column style={{ width: "30%" }}>
              <Text
                className={cls.muted}
                style={{
                  fontSize: "13px",
                  color: C.inkMuted,
                  fontFamily: BODY_FONT,
                  margin: "4px 0",
                  textAlign: "right" as const,
                }}
              >
                {formatPrice(shippingRefundCents)}
              </Text>
            </Column>
          </Row>
        )}

        <Hr
          className={cls.goldLeaf}
          style={{ borderColor: C.goldLeaf, borderWidth: "1px 0 0 0", margin: "8px 0" }}
        />

        {/* Total refund — editorial serif figure */}
        <Row style={{ width: "100%" }}>
          <Column style={{ width: "70%" }}>
            <Text
              className={cls.ink}
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: C.ink,
                fontFamily: DISPLAY_FONT,
                margin: "4px 0",
              }}
            >
              Total Refund
            </Text>
          </Column>
          <Column style={{ width: "30%" }}>
            <Text
              className={cls.accentStrong}
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: C.accentStrong,
                fontFamily: DISPLAY_FONT,
                margin: "4px 0",
                textAlign: "right" as const,
              }}
            >
              {formatPrice(refundAmountCents)}
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Refund Details Box */}
      <Section
        className={isPartialRefund ? cls.goldTint : cls.sageTint}
        style={{
          margin: "16px 28px 0 28px",
          padding: "16px 20px",
          backgroundColor: accentBg,
          borderRadius: "10px",
          borderLeft: `4px solid ${accentBorder}`,
        }}
      >
        <Text
          className={cls.ink}
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: C.ink,
            fontFamily: BODY_FONT,
            margin: "0 0 8px 0",
          }}
        >
          Refund Details
        </Text>
        <Text
          className={cls.ink}
          style={{
            fontSize: "13px",
            color: C.ink,
            fontFamily: BODY_FONT,
            margin: "0 0 4px 0",
            lineHeight: "1.6",
          }}
        >
          <strong>Method:</strong> {refundMethod}
        </Text>
        <Text
          className={cls.ink}
          style={{
            fontSize: "13px",
            color: C.ink,
            fontFamily: BODY_FONT,
            margin: "0 0 4px 0",
            lineHeight: "1.6",
          }}
        >
          <strong>Timeline:</strong> Funds will appear within {refundTimeline}
        </Text>
        <Text
          className={cls.ink}
          style={{
            fontSize: "13px",
            color: C.ink,
            fontFamily: BODY_FONT,
            margin: "0",
            lineHeight: "1.6",
          }}
        >
          <strong>Processed:</strong> {formatDate(processedAt)}
        </Text>
      </Section>

      {/* Partial Refund Notice */}
      {isPartialRefund && (
        <Callout tone="warn" style={{ margin: "16px 28px 0 28px" }}>
          {"⚠️"} <strong>Partial Refund:</strong> This is a partial refund. Your remaining order
          items are unaffected and will be delivered as scheduled.
        </Callout>
      )}

      {/* Primary CTA */}
      <Section style={{ padding: "24px 28px 0 28px", textAlign: "center" as const }}>
        <EmailButton href={`${APP_URL}/orders/${orderId}`}>View Order Details</EmailButton>
      </Section>

      {/* Secondary CTA */}
      <Section style={{ padding: "12px 28px 0 28px", textAlign: "center" as const }}>
        <Link
          className={cls.accent}
          href={`${APP_URL}/menu`}
          style={{
            color: C.accent,
            fontSize: "14px",
            fontFamily: BODY_FONT,
            textDecoration: "underline",
          }}
        >
          Browse Menu
        </Link>
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

export default RefundNotification;
