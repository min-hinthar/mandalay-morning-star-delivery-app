import { Section, Text } from "@react-email/components";
import { BODY_FONT, C, DISPLAY_FONT, cls } from "./theme";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

interface OrderTotalsTableProps {
  subtotalCents: number;
  deliveryFeeCents: number;
  taxCents: number;
  tipCents?: number;
  /** Coupon/promo amount already subtracted from `totalCents`. Shown as a savings
   *  line so the itemized rows reconcile to the stored total on a coupon order. */
  discountCents?: number;
  totalCents: number;
  paymentMethod?: string;
  isExtendedRange?: boolean;
}

function RowLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      className={cls.muted}
      style={{ fontSize: "14px", fontFamily: BODY_FONT, color: C.inkMuted, margin: "0" }}
    >
      {children}
    </Text>
  );
}

function RowValue({
  children,
  color = C.ink,
  className = cls.ink,
  bold = false,
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
  bold?: boolean;
}) {
  return (
    <Text
      className={className}
      style={{
        fontSize: "14px",
        fontFamily: BODY_FONT,
        color,
        fontWeight: bold ? 700 : 400,
        margin: "0",
      }}
    >
      {children}
    </Text>
  );
}

export function OrderTotalsTable({
  subtotalCents,
  deliveryFeeCents,
  taxCents,
  tipCents,
  discountCents,
  totalCents,
  paymentMethod,
  isExtendedRange,
}: OrderTotalsTableProps) {
  // Clamp the shown discount to the pre-discount sum so the rows always reconcile
  // to `totalCents` — `calculateOrderTotals` floors the stored total at 0, so a
  // discount larger than subtotal+delivery+tax+tip (not reachable with today's
  // discount sources, but future-proofed) would otherwise sum below a $0.00 total.
  const displayDiscountCents =
    discountCents == null
      ? 0
      : Math.min(discountCents, subtotalCents + deliveryFeeCents + taxCents + (tipCents ?? 0));
  return (
    <Section style={{ padding: "20px 28px 0 28px" }}>
      <table
        cellPadding="0"
        cellSpacing="0"
        style={{ width: "100%", borderCollapse: "collapse" as const }}
      >
        <tbody>
          <tr>
            <td style={{ padding: "4px 0" }}>
              <RowLabel>Subtotal</RowLabel>
            </td>
            <td style={{ padding: "4px 0", textAlign: "right" as const }}>
              <RowValue>{formatPrice(subtotalCents)}</RowValue>
            </td>
          </tr>

          {displayDiscountCents > 0 && (
            <tr>
              <td style={{ padding: "4px 0" }}>
                <RowLabel>Discount</RowLabel>
              </td>
              <td style={{ padding: "4px 0", textAlign: "right" as const }}>
                <RowValue color={C.sageDeep} className={cls.sageDeep} bold>
                  −{formatPrice(displayDiscountCents)}
                </RowValue>
              </td>
            </tr>
          )}

          <tr>
            <td style={{ padding: "4px 0" }}>
              <RowLabel>{isExtendedRange ? "Extended Delivery Fee" : "Delivery Fee"}</RowLabel>
            </td>
            <td style={{ padding: "4px 0", textAlign: "right" as const }}>
              <RowValue
                color={deliveryFeeCents === 0 ? C.sageDeep : C.ink}
                className={deliveryFeeCents === 0 ? cls.sageDeep : cls.ink}
                bold={deliveryFeeCents === 0}
              >
                {deliveryFeeCents === 0 ? "FREE" : formatPrice(deliveryFeeCents)}
              </RowValue>
            </td>
          </tr>

          <tr>
            <td style={{ padding: "4px 0" }}>
              <RowLabel>Tax</RowLabel>
            </td>
            <td style={{ padding: "4px 0", textAlign: "right" as const }}>
              <RowValue>{formatPrice(taxCents)}</RowValue>
            </td>
          </tr>

          {tipCents != null && tipCents > 0 && (
            <tr>
              <td style={{ padding: "4px 0" }}>
                <RowLabel>Tip</RowLabel>
              </td>
              <td style={{ padding: "4px 0", textAlign: "right" as const }}>
                <RowValue>{formatPrice(tipCents)}</RowValue>
              </td>
            </tr>
          )}

          {/* Total — gold-leaf rule above, editorial serif figures */}
          <tr>
            <td
              className={cls.goldLeaf}
              style={{ padding: "12px 0 4px 0", borderTop: `1px solid ${C.goldLeaf}` }}
            >
              <Text
                className={cls.ink}
                style={{
                  fontSize: "16px",
                  fontFamily: DISPLAY_FONT,
                  fontWeight: 600,
                  color: C.ink,
                  margin: "0",
                }}
              >
                Total
              </Text>
            </td>
            <td
              className={cls.goldLeaf}
              style={{
                padding: "12px 0 4px 0",
                borderTop: `1px solid ${C.goldLeaf}`,
                textAlign: "right" as const,
              }}
            >
              <Text
                className={cls.accentStrong}
                style={{
                  fontSize: "20px",
                  fontFamily: DISPLAY_FONT,
                  fontWeight: 700,
                  color: C.accentStrong,
                  margin: "0",
                }}
              >
                {formatPrice(totalCents)}
              </Text>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Payment Method */}
      {paymentMethod && (
        <Text
          className={cls.muted}
          style={{
            fontSize: "13px",
            fontFamily: BODY_FONT,
            color: C.inkMuted,
            margin: "8px 0 0 0",
          }}
        >
          {paymentMethod === "cod" ? "Payment: Cash on Delivery" : `Paid with ${paymentMethod}`}
        </Text>
      )}
    </Section>
  );
}
