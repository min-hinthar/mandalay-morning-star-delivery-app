import {
  Button,
  Column,
  Hr,
  Link,
  Row,
  Section,
  Text,
} from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import {
  APP_URL,
  FONT_STACK,
  SERIF_STACK,
  formatDate,
  formatPrice,
  shortOrderId,
} from './helpers';

// ============================================
// TYPES
// ============================================

interface RefundedItem {
  name: string;
  quantity: number;
  refundAmountCents: number;
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
  const accentColor = isPartialRefund ? '#D97706' : '#3D8B22';
  const accentBg = isPartialRefund ? '#FFFBEB' : '#F0FFF4';

  return (
    <EmailLayout emailType="refund" previewText={previewText}>
      {/* Greeting */}
      <Section style={{ padding: '32px 24px 0 24px' }}>
        <Text style={{ fontSize: '16px', color: '#111111', fontFamily: FONT_STACK, margin: '0 0 12px 0' }}>
          Dear {customerName},
        </Text>
        <Text style={{ fontSize: '15px', color: '#374151', fontFamily: FONT_STACK, margin: '0 0 24px 0', lineHeight: '1.6' }}>
          {isPartialRefund
            ? `We've processed a partial refund for your order #${shortOrderId(orderId)}.`
            : `We've processed a full refund for your order #${shortOrderId(orderId)}.`}{' '}
          We want to make sure you have all the details below.
        </Text>
      </Section>

      {/* Refund Breakdown Table */}
      <Section style={{ margin: '0 24px', padding: '20px', backgroundColor: '#FFF9E6', borderRadius: '8px' }}>
        <Text style={{ fontSize: '14px', fontWeight: 700, color: '#8B4513', fontFamily: SERIF_STACK, margin: '0 0 12px 0', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
          Refund Breakdown
        </Text>

        {/* Original order total */}
        <Row style={{ width: '100%' }}>
          <Column style={{ width: '70%' }}>
            <Text style={{ fontSize: '14px', color: '#374151', fontFamily: FONT_STACK, margin: '0 0 8px 0' }}>
              Original Order Total
            </Text>
          </Column>
          <Column style={{ width: '30%' }}>
            <Text style={{ fontSize: '14px', color: '#374151', fontFamily: FONT_STACK, margin: '0 0 8px 0', textAlign: 'right' as const }}>
              {formatPrice(originalTotalCents)}
            </Text>
          </Column>
        </Row>

        <Hr style={{ borderColor: '#E5D5A0', borderWidth: '1px 0 0 0', margin: '8px 0' }} />

        {/* Refunded items */}
        {refundedItems.map((item, idx) => (
          <Row key={`refund-item-${idx}`} style={{ width: '100%' }}>
            <Column style={{ width: '70%' }}>
              <Text style={{ fontSize: '13px', color: '#6B7280', fontFamily: FONT_STACK, margin: '4px 0' }}>
                {item.name} x{item.quantity}
              </Text>
            </Column>
            <Column style={{ width: '30%' }}>
              <Text style={{ fontSize: '13px', color: '#6B7280', fontFamily: FONT_STACK, margin: '4px 0', textAlign: 'right' as const }}>
                {formatPrice(item.refundAmountCents)}
              </Text>
            </Column>
          </Row>
        ))}

        {/* Shipping refund if applicable */}
        {shippingRefundCents != null && shippingRefundCents > 0 && (
          <Row style={{ width: '100%' }}>
            <Column style={{ width: '70%' }}>
              <Text style={{ fontSize: '13px', color: '#6B7280', fontFamily: FONT_STACK, margin: '4px 0' }}>
                Shipping Refund
              </Text>
            </Column>
            <Column style={{ width: '30%' }}>
              <Text style={{ fontSize: '13px', color: '#6B7280', fontFamily: FONT_STACK, margin: '4px 0', textAlign: 'right' as const }}>
                {formatPrice(shippingRefundCents)}
              </Text>
            </Column>
          </Row>
        )}

        <Hr style={{ borderColor: '#E5D5A0', borderWidth: '1px 0 0 0', margin: '8px 0' }} />

        {/* Total refund */}
        <Row style={{ width: '100%' }}>
          <Column style={{ width: '70%' }}>
            <Text style={{ fontSize: '16px', fontWeight: 700, color: '#111111', fontFamily: FONT_STACK, margin: '4px 0' }}>
              Total Refund
            </Text>
          </Column>
          <Column style={{ width: '30%' }}>
            <Text style={{ fontSize: '16px', fontWeight: 700, color: '#3D8B22', fontFamily: FONT_STACK, margin: '4px 0', textAlign: 'right' as const }}>
              {formatPrice(refundAmountCents)}
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Refund Details Box */}
      <Section style={{ margin: '16px 24px 0 24px', padding: '16px 20px', backgroundColor: accentBg, borderRadius: '8px', borderLeft: `4px solid ${accentColor}` }}>
        <Text style={{ fontSize: '14px', fontWeight: 700, color: '#111111', fontFamily: FONT_STACK, margin: '0 0 8px 0' }}>
          Refund Details
        </Text>
        <Text style={{ fontSize: '13px', color: '#374151', fontFamily: FONT_STACK, margin: '0 0 4px 0', lineHeight: '1.6' }}>
          <strong>Method:</strong> {refundMethod}
        </Text>
        <Text style={{ fontSize: '13px', color: '#374151', fontFamily: FONT_STACK, margin: '0 0 4px 0', lineHeight: '1.6' }}>
          <strong>Timeline:</strong> Funds will appear within {refundTimeline}
        </Text>
        <Text style={{ fontSize: '13px', color: '#374151', fontFamily: FONT_STACK, margin: '0', lineHeight: '1.6' }}>
          <strong>Processed:</strong> {formatDate(processedAt)}
        </Text>
      </Section>

      {/* Partial Refund Notice */}
      {isPartialRefund && (
        <Section style={{ margin: '16px 24px 0 24px', padding: '14px 16px', backgroundColor: '#FFFBEB', borderRadius: '8px', border: '1px solid #FDE68A' }}>
          <Text style={{ fontSize: '13px', color: '#92400E', fontFamily: FONT_STACK, margin: '0', lineHeight: '1.5' }}>
            {'\u26A0\uFE0F'} <strong>Partial Refund:</strong> This is a partial refund. Your remaining
            order items are unaffected and will be delivered as scheduled.
          </Text>
        </Section>
      )}

      {/* Primary CTA */}
      <Section style={{ padding: '24px 24px 0 24px', textAlign: 'center' as const }}>
        <Button
          href={`${APP_URL}/orders/${orderId}`}
          style={{ backgroundColor: '#A41034', color: '#FFFFFF', fontFamily: FONT_STACK, fontSize: '16px', fontWeight: 700, textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '14px 32px', borderRadius: '8px' }}
        >
          View Order Details
        </Button>
      </Section>

      {/* Secondary CTA */}
      <Section style={{ padding: '12px 24px 0 24px', textAlign: 'center' as const }}>
        <Link href={`${APP_URL}/menu`} style={{ color: '#D4A017', fontSize: '14px', fontFamily: FONT_STACK, textDecoration: 'underline' }}>
          Browse Menu
        </Link>
      </Section>

      {/* Need help? section */}
      <Section style={{ padding: '24px' }}>
        <Hr style={{ borderColor: '#E5E7EB', borderWidth: '1px 0 0 0', margin: '0 0 16px 0' }} />
        <Text style={{ fontSize: '13px', color: '#9CA3AF', fontFamily: FONT_STACK, margin: '0', textAlign: 'center' as const, lineHeight: '1.6' }}>
          Need help?{' '}
          <Link href="mailto:support@mandalaymorningstar.com" style={{ color: '#D4A017', textDecoration: 'underline' }}>
            Contact our support team
          </Link>{' '}
          and we&apos;ll be happy to assist you.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default RefundNotification;
