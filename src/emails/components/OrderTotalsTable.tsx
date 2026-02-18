import { Hr, Section, Text } from "@react-email/components";

const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

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
}

export function OrderTotalsTable({
  subtotalCents,
  deliveryFeeCents,
  taxCents,
  tipCents,
  totalCents,
  paymentMethod,
}: OrderTotalsTableProps) {
  return (
    <Section style={{ padding: "24px 24px 0 24px" }}>
      <Hr style={{ borderColor: "#E5E7EB", margin: "0 0 16px 0" }} />

      <table
        cellPadding="0"
        cellSpacing="0"
        style={{ width: "100%", borderCollapse: "collapse" as const }}
      >
        <tbody>
          {/* Subtotal */}
          <tr>
            <td style={{ padding: "4px 0" }}>
              <Text
                style={{
                  fontSize: "14px",
                  fontFamily: SANS,
                  color: "#6B7280",
                  margin: "0",
                }}
              >
                Subtotal
              </Text>
            </td>
            <td style={{ padding: "4px 0", textAlign: "right" as const }}>
              <Text
                style={{
                  fontSize: "14px",
                  fontFamily: SANS,
                  color: "#111111",
                  margin: "0",
                }}
              >
                {formatPrice(subtotalCents)}
              </Text>
            </td>
          </tr>

          {/* Delivery Fee */}
          <tr>
            <td style={{ padding: "4px 0" }}>
              <Text
                style={{
                  fontSize: "14px",
                  fontFamily: SANS,
                  color: "#6B7280",
                  margin: "0",
                }}
              >
                Delivery Fee
              </Text>
            </td>
            <td style={{ padding: "4px 0", textAlign: "right" as const }}>
              <Text
                style={{
                  fontSize: "14px",
                  fontFamily: SANS,
                  color: deliveryFeeCents === 0 ? "#3D8B22" : "#111111",
                  fontWeight: deliveryFeeCents === 0 ? 700 : 400,
                  margin: "0",
                }}
              >
                {deliveryFeeCents === 0 ? "FREE" : formatPrice(deliveryFeeCents)}
              </Text>
            </td>
          </tr>

          {/* Tax */}
          <tr>
            <td style={{ padding: "4px 0" }}>
              <Text
                style={{
                  fontSize: "14px",
                  fontFamily: SANS,
                  color: "#6B7280",
                  margin: "0",
                }}
              >
                Tax
              </Text>
            </td>
            <td style={{ padding: "4px 0", textAlign: "right" as const }}>
              <Text
                style={{
                  fontSize: "14px",
                  fontFamily: SANS,
                  color: "#111111",
                  margin: "0",
                }}
              >
                {formatPrice(taxCents)}
              </Text>
            </td>
          </tr>

          {/* Tip (conditional) */}
          {tipCents != null && tipCents > 0 && (
            <tr>
              <td style={{ padding: "4px 0" }}>
                <Text
                  style={{
                    fontSize: "14px",
                    fontFamily: SANS,
                    color: "#6B7280",
                    margin: "0",
                  }}
                >
                  Tip
                </Text>
              </td>
              <td style={{ padding: "4px 0", textAlign: "right" as const }}>
                <Text
                  style={{
                    fontSize: "14px",
                    fontFamily: SANS,
                    color: "#111111",
                    margin: "0",
                  }}
                >
                  {formatPrice(tipCents)}
                </Text>
              </td>
            </tr>
          )}

          {/* Total */}
          <tr>
            <td
              style={{
                padding: "12px 0 4px 0",
                borderTop: "2px solid #E5E7EB",
              }}
            >
              <Text
                style={{
                  fontSize: "16px",
                  fontFamily: SANS,
                  fontWeight: 700,
                  color: "#8B4513",
                  margin: "0",
                }}
              >
                Total
              </Text>
            </td>
            <td
              style={{
                padding: "12px 0 4px 0",
                borderTop: "2px solid #E5E7EB",
                textAlign: "right" as const,
              }}
            >
              <Text
                style={{
                  fontSize: "18px",
                  fontFamily: SANS,
                  fontWeight: 700,
                  color: "#8B4513",
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
            fontFamily: SANS,
            color: "#6B7280",
            margin: "8px 0 0 0",
          }}
        >
          Paid with {paymentMethod}
        </Text>
      )}
    </Section>
  );
}
