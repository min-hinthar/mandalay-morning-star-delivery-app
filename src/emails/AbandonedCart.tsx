import { Hr, Section, Text } from "@react-email/components";

import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";
import { NextDeliveryTeaser } from "./components/NextDeliveryTeaser";
import { OrderItemsTable } from "./components/OrderItemsTable";
import { BODY_FONT, C, bodyStyle, headingStyle } from "./components/theme";
import { formatPrice } from "./helpers";
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
  /** Live "order by … for … delivery" line — renders nothing when absent. */
  nextDeliveryCutoffText?: string | null;
}

export function AbandonedCart({
  customerName,
  items,
  itemCount,
  subtotalCents,
  cartUrl,
  amountToFreeDeliveryCents,
  nextDeliveryCutoffText,
}: AbandonedCartProps) {
  const freeDeliveryGap =
    amountToFreeDeliveryCents != null && amountToFreeDeliveryCents > 0
      ? amountToFreeDeliveryCents
      : null;

  return (
    <EmailLayout
      emailType="cart"
      previewText={`Your ${items[0]?.name ?? "cart"} is still waiting 🍜`}
    >
      {/* Hero */}
      <Section style={{ padding: "30px 28px 8px 28px", textAlign: "center" as const }}>
        <Text style={{ fontSize: "30px", margin: "0 0 8px 0" }}>{"🍜"}</Text>
        <Text style={headingStyle(22)}>You left something delicious behind</Text>
        <Text style={bodyStyle(15)}>
          Hi {customerName}, your {itemCount} item{itemCount !== 1 ? "s" : ""} are still in your
          cart — ready whenever you are.
        </Text>
      </Section>

      {/* Items */}
      <OrderItemsTable items={items} />

      {/* Subtotal */}
      <Section style={{ padding: "16px 28px 0 28px" }}>
        <Hr style={{ borderColor: C.line, margin: "0 0 12px 0" }} />
        <table
          cellPadding="0"
          cellSpacing="0"
          style={{ width: "100%", borderCollapse: "collapse" as const }}
        >
          <tbody>
            <tr>
              <td>
                <Text style={bodyStyle(15)}>Subtotal</Text>
              </td>
              <td style={{ textAlign: "right" as const }}>
                <Text
                  style={{
                    fontSize: "16px",
                    fontFamily: BODY_FONT,
                    color: C.ink,
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
              fontFamily: BODY_FONT,
              color: C.sageDeep,
              fontWeight: 600,
              margin: "8px 0 0 0",
            }}
          >
            {"🚚 "}You&apos;re only {formatPrice(freeDeliveryGap)} away from free local delivery!
          </Text>
        )}
      </Section>

      {/* CTA */}
      <Section style={{ padding: "20px 28px 0 28px", textAlign: "center" as const }}>
        <EmailButton href={cartUrl}>Complete your order</EmailButton>
        <Text
          style={{
            fontSize: "12px",
            fontFamily: BODY_FONT,
            color: C.inkFaint,
            margin: "10px 0 0 0",
          }}
        >
          Signed in on your device, your cart will be right where you left it.
        </Text>
      </Section>

      {/* Next delivery cutoff (live schedule) — the real urgency */}
      <NextDeliveryTeaser cutoffText={nextDeliveryCutoffText} />

      {/* Promo reassurance */}
      <Section style={{ padding: "20px 28px 32px 28px" }}>
        <Text
          style={{
            fontSize: "12px",
            fontFamily: BODY_FONT,
            color: C.inkFaint,
            margin: "0",
            textAlign: "center" as const,
            lineHeight: 1.6,
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
