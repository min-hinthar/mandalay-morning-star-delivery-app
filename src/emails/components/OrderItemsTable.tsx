import { Fragment } from "react";
import { Section, Text } from "@react-email/components";
import { BODY_FONT, BURMESE_FONT, C, DISPLAY_FONT } from "./theme";

interface OrderItemModifier {
  name: string;
  priceDelta?: number;
}

interface OrderItem {
  name: string;
  nameMy?: string | null;
  quantity: number;
  lineTotalCents: number;
  category?: string;
  modifiers?: OrderItemModifier[];
  notes?: string | null;
}

interface OrderItemsTableProps {
  items: OrderItem[];
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function groupByCategory(items: OrderItem[]): Map<string, OrderItem[]> {
  const groups = new Map<string, OrderItem[]>();
  for (const item of items) {
    const cat = item.category || "Items";
    const existing = groups.get(cat) || [];
    existing.push(item);
    groups.set(cat, existing);
  }
  return groups;
}

export function OrderItemsTable({ items }: OrderItemsTableProps) {
  const hasCategories = items.some((item) => item.category);
  const groups = hasCategories ? groupByCategory(items) : new Map([["Items", items]]);

  return (
    <Section style={{ padding: "0 28px" }}>
      <table
        cellPadding="0"
        cellSpacing="0"
        style={{ width: "100%", borderCollapse: "collapse" as const }}
      >
        <tbody>
          {Array.from(groups.entries()).map(([category, categoryItems]) => (
            <Fragment key={category}>
              {/* Category heading (only if there are real categories) */}
              {hasCategories && (
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      paddingTop: "18px",
                      paddingBottom: "8px",
                      borderBottom: `1px solid ${C.lineStrong}`,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: C.accent,
                        textTransform: "uppercase" as const,
                        letterSpacing: "1.5px",
                        margin: "0",
                        fontFamily: BODY_FONT,
                      }}
                    >
                      {"★ "}
                      {category}
                    </Text>
                  </td>
                </tr>
              )}

              {/* Item rows */}
              {categoryItems.map((item, idx) => (
                <tr key={`${category}-${idx}`}>
                  {/* Quantity badge */}
                  <td
                    style={{
                      padding: "12px 0",
                      borderBottom: `1px solid ${C.line}`,
                      width: "40px",
                      verticalAlign: "top",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: C.clayTint,
                        border: `1px solid ${C.clayTintBorder}`,
                        color: C.accent,
                        borderRadius: "8px",
                        width: "28px",
                        height: "28px",
                        lineHeight: "28px",
                        textAlign: "center" as const,
                        fontSize: "13px",
                        fontWeight: 700,
                        fontFamily: BODY_FONT,
                      }}
                    >
                      {item.quantity}x
                    </div>
                  </td>

                  {/* Name + modifiers */}
                  <td
                    style={{
                      padding: "12px 8px",
                      borderBottom: `1px solid ${C.line}`,
                      verticalAlign: "top",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: C.ink,
                        margin: "0",
                        fontFamily: DISPLAY_FONT,
                        lineHeight: 1.35,
                      }}
                    >
                      {item.name}
                    </Text>
                    {item.nameMy && (
                      <Text
                        style={{
                          fontSize: "12px",
                          fontWeight: 500,
                          color: C.inkMuted,
                          margin: "2px 0 0 0",
                          fontFamily: BURMESE_FONT,
                          lineHeight: 1.6,
                        }}
                      >
                        {item.nameMy}
                      </Text>
                    )}
                    {item.modifiers && item.modifiers.length > 0 && (
                      <Text
                        style={{
                          fontSize: "12px",
                          color: C.inkMuted,
                          margin: "2px 0 0 0",
                          fontFamily: BODY_FONT,
                        }}
                      >
                        (
                        {item.modifiers
                          .map((m) =>
                            m.priceDelta ? `${m.name} +${formatPrice(m.priceDelta)}` : m.name
                          )
                          .join(", ")}
                        )
                      </Text>
                    )}
                    {item.notes && (
                      <Text
                        style={{
                          fontSize: "12px",
                          fontStyle: "italic" as const,
                          color: C.goldDeep,
                          margin: "4px 0 0 0",
                          fontFamily: BODY_FONT,
                        }}
                      >
                        {"📝 "}
                        {item.notes}
                      </Text>
                    )}
                  </td>

                  {/* Line total */}
                  <td
                    style={{
                      padding: "12px 0",
                      borderBottom: `1px solid ${C.line}`,
                      textAlign: "right" as const,
                      verticalAlign: "top",
                      whiteSpace: "nowrap" as const,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: C.ink,
                        margin: "0",
                        fontFamily: BODY_FONT,
                      }}
                    >
                      {formatPrice(item.lineTotalCents)}
                    </Text>
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </Section>
  );
}
