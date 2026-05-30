import { Button, Hr, Section, Text } from "@react-email/components";

import { EmailLayout } from "./components/EmailLayout";
import { OrderItemsTable } from "./components/OrderItemsTable";
import { FONT_STACK, SERIF_STACK, formatPrice } from "./helpers";
import { freeDeliveryPromoLine } from "@/lib/utils/delivery-promo";

interface AbandonedCartItem {
  name: string;
  nameMy?: string | null;
  quantity: number;
  lineTotalCents: number;
  modifiers?: { name: string; priceDelta?: number }[];
  notes?: string | null;
}

export interface AbandonedCartProps {
  customerName: string;
  items: AbandonedCartItem[];
  itemCount: number;
  subtotalCents: number;
  /** Deep link back into the app where the cart restores. */
  cartUrl: string;
  /** Cents remaining until free delivery (omit/0 to hide the nudge). */
  amountToFreeDeliveryCents?: number;
}

export function AbandonedCart({
  customerName,
  items,
  itemCount,
  subtotalCents,
  cartUrl,
  amountToFreeDeliveryCents,
}: AbandonedCartProps) {
  const freeDeliveryGap =
    amountToFreeDeliveryCents != null && amountToFreeDeliveryCents > 0
      ? amountToFreeDeliveryCents
      : null;

  return (
    <EmailLayout
      emailType="reminder"
      previewText={`Your ${items[0]?.name ?? "cart"} is still waiting 🍜`}
    >
      {/* Hero */}
      <Section style={{ padding: "32px 24px 8px 24px", textAlign: "center" as const }}>
        <Text style={{ fontSize: "30px", margin: "0 0 8px 0" }}>{"🍜"}</Text>
        <Text
          style={{
            fontSize: "22px",
            fontFamily: SERIF_STACK,
            color: "#8B4513",
            fontWeight: 700,
            margin: "0 0 8px 0",
            lineHeight: "1.3",
          }}
        >
          You left something delicious behind
        </Text>
        <Text
          style={{
            fontSize: "15px",
            fontFamily: FONT_STACK,
            color: "#374151",
            margin: "0",
            lineHeight: "1.6",
          }}
        >
          Hi {customerName}, your {itemCount} item{itemCount !== 1 ? "s" : ""} are still in your
          cart — ready whenever you are.
        </Text>
      </Section>

      {/* Items */}
      <OrderItemsTable items={items} />

      {/* Subtotal */}
      <Section style={{ padding: "16px 24px 0 24px" }}>
        <Hr style={{ borderColor: "#E5E7EB", margin: "0 0 12px 0" }} />
        <table
          cellPadding="0"
          cellSpacing="0"
          style={{ width: "100%", borderCollapse: "collapse" as const }}
        >
          <tbody>
            <tr>
              <td>
                <Text
                  style={{
                    fontSize: "15px",
                    fontFamily: FONT_STACK,
                    color: "#374151",
                    margin: "0",
                  }}
                >
                  Subtotal
                </Text>
              </td>
              <td style={{ textAlign: "right" as const }}>
                <Text
                  style={{
                    fontSize: "16px",
                    fontFamily: FONT_STACK,
                    color: "#111111",
                    fontWeight: 700,
                    margin: "0",
                  }}
                >
                  {formatPrice(subtotalCents)}
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
        {freeDeliveryGap != null && (
          <Text
            style={{
              fontSize: "13px",
              fontFamily: FONT_STACK,
              color: "#3D8B22",
              fontWeight: 600,
              margin: "8px 0 0 0",
            }}
          >
            {"🚚 "}You&apos;re only {formatPrice(freeDeliveryGap)} away from free local delivery!
          </Text>
        )}
      </Section>

      {/* CTA */}
      <Section style={{ padding: "20px 24px 0 24px", textAlign: "center" as const }}>
        <Button
          href={cartUrl}
          style={{
            backgroundColor: "#A41034",
            color: "#FFFFFF",
            fontFamily: FONT_STACK,
            fontSize: "16px",
            fontWeight: 700,
            borderRadius: "8px",
            padding: "14px 36px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Complete your order
        </Button>
        <Text
          style={{
            fontSize: "12px",
            fontFamily: FONT_STACK,
            color: "#9CA3AF",
            margin: "10px 0 0 0",
          }}
        >
          Signed in on your device, your cart will be right where you left it.
        </Text>
      </Section>

      {/* Promo reassurance */}
      <Section style={{ padding: "20px 24px 32px 24px" }}>
        <Text
          style={{
            fontSize: "12px",
            fontFamily: FONT_STACK,
            color: "#9CA3AF",
            margin: "0",
            textAlign: "center" as const,
            lineHeight: "1.6",
          }}
        >
          {freeDeliveryPromoLine()}. Prices may change if items sell out — we&apos;ll always show
          the latest at checkout.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default AbandonedCart;
