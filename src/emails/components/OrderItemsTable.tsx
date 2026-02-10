import { Section, Text } from '@react-email/components';

interface OrderItemModifier {
  name: string;
  priceDelta?: number;
}

interface OrderItem {
  name: string;
  quantity: number;
  lineTotalCents: number;
  category?: string;
  modifiers?: OrderItemModifier[];
}

interface OrderItemsTableProps {
  items: OrderItem[];
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function groupByCategory(
  items: OrderItem[]
): Map<string, OrderItem[]> {
  const groups = new Map<string, OrderItem[]>();
  for (const item of items) {
    const cat = item.category || 'Items';
    const existing = groups.get(cat) || [];
    existing.push(item);
    groups.set(cat, existing);
  }
  return groups;
}

export function OrderItemsTable({ items }: OrderItemsTableProps) {
  const hasCategories = items.some((item) => item.category);
  const groups = hasCategories
    ? groupByCategory(items)
    : new Map([['Items', items]]);

  return (
    <Section style={{ padding: '0 24px' }}>
      <table
        cellPadding="0"
        cellSpacing="0"
        style={{ width: '100%', borderCollapse: 'collapse' as const }}
      >
        <tbody>
          {Array.from(groups.entries()).map(([category, categoryItems]) => (
            <>
              {/* Category heading (only if there are real categories) */}
              {hasCategories && (
                <tr key={`cat-${category}`}>
                  <td
                    colSpan={3}
                    style={{
                      paddingTop: '16px',
                      paddingBottom: '8px',
                      borderBottom: '1px solid #E5E7EB',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#8B4513',
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.5px',
                        margin: '0',
                        fontFamily:
                          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                      }}
                    >
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
                      padding: '12px 0',
                      borderBottom: '1px solid #F3F4F6',
                      width: '40px',
                      verticalAlign: 'top',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#FFF9E6',
                        color: '#8B4513',
                        borderRadius: '4px',
                        width: '28px',
                        height: '28px',
                        lineHeight: '28px',
                        textAlign: 'center' as const,
                        fontSize: '13px',
                        fontWeight: 700,
                        fontFamily:
                          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                      }}
                    >
                      {item.quantity}x
                    </div>
                  </td>

                  {/* Name + modifiers */}
                  <td
                    style={{
                      padding: '12px 8px',
                      borderBottom: '1px solid #F3F4F6',
                      verticalAlign: 'top',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#111111',
                        margin: '0',
                        fontFamily:
                          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                      }}
                    >
                      {item.name}
                    </Text>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <Text
                        style={{
                          fontSize: '12px',
                          color: '#6B7280',
                          margin: '2px 0 0 0',
                          fontFamily:
                            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        }}
                      >
                        (
                        {item.modifiers
                          .map((m) =>
                            m.priceDelta
                              ? `${m.name} +${formatPrice(m.priceDelta)}`
                              : m.name
                          )
                          .join(', ')}
                        )
                      </Text>
                    )}
                  </td>

                  {/* Line total */}
                  <td
                    style={{
                      padding: '12px 0',
                      borderBottom: '1px solid #F3F4F6',
                      textAlign: 'right' as const,
                      verticalAlign: 'top',
                      whiteSpace: 'nowrap' as const,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#111111',
                        margin: '0',
                        fontFamily:
                          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                      }}
                    >
                      {formatPrice(item.lineTotalCents)}
                    </Text>
                  </td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </Section>
  );
}
