import { Section, Text } from "@react-email/components";
import { BODY_FONT, C, DISPLAY_FONT } from "./theme";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

interface OrderTotalsTableProps {
  subtotalCents: number;
  deliveryFeeCents: number;
  taxCents: number;
  tipCents?: number;
  totalCents: number;
  paymentMethod?: string;
  isExtendedRange?: boolean;
}

function RowLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontSize: "14px", fontFamily: BODY_FONT, color: C.inkMuted, margin: "0" }}>
      {children}
    </Text>
  );
}

function RowValue({
  children,
  color = C.ink,
  bold = false,
}: {
  children: React.ReactNode;
  color?: string;
  bold?: boolean;
}) {
  return (
    <Text
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
  totalCents,
  paymentMethod,
  isExtendedRange,
}: OrderTotalsTableProps) {
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

          <tr>
            <td style={{ padding: "4px 0" }}>
              <RowLabel>{isExtendedRange ? "Extended Delivery Fee" : "Delivery Fee"}</RowLabel>
            </td>
            <td style={{ padding: "4px 0", textAlign: "right" as const }}>
              <RowValue
                color={deliveryFeeCents === 0 ? C.sageDeep : C.ink}
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
            <td style={{ padding: "12px 0 4px 0", borderTop: `1px solid ${C.goldLeaf}` }}>
              <Text
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
              style={{
                padding: "12px 0 4px 0",
                borderTop: `1px solid ${C.goldLeaf}`,
                textAlign: "right" as const,
              }}
            >
              <Text
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
