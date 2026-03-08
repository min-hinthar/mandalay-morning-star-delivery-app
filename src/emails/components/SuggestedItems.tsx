import { Img, Link, Section, Text } from "@react-email/components";
import type { SuggestedItem } from "@/lib/email/suggestions";

const SERIF = "Georgia, 'Palatino Linotype', serif";
const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://mandalaymorningstar.com";

/** Fallback items for email previews only */
const DEFAULT_SUGGESTIONS: SuggestedItem[] = [
  { name: "Mohinga", imageUrl: null, slug: "mohinga" },
  { name: "Tea Leaf Salad", imageUrl: null, slug: "tea-leaf-salad" },
  { name: "Samosa", imageUrl: null, slug: "samosa" },
];

export interface SuggestedItemsProps {
  items?: SuggestedItem[];
}

export function SuggestedItems({ items }: SuggestedItemsProps = {}) {
  const suggestions = items && items.length > 0 ? items : DEFAULT_SUGGESTIONS;
  return (
    <Section style={{ padding: "24px 24px 0 24px" }}>
      <Text
        style={{
          fontSize: "14px",
          fontFamily: SERIF,
          fontWeight: 700,
          color: "#8B4513",
          margin: "0 0 12px 0",
          textAlign: "center" as const,
        }}
      >
        You might also like
      </Text>
      <table
        cellPadding="0"
        cellSpacing="0"
        style={{ width: "100%", borderCollapse: "collapse" as const }}
      >
        <tbody>
          <tr>
            {suggestions.map((item) => (
              <td
                key={item.slug}
                style={{
                  width: "33.33%",
                  textAlign: "center" as const,
                  padding: "8px",
                }}
              >
                <Link href={`${APP_URL}/menu`} style={{ textDecoration: "none" }}>
                  {item.imageUrl ? (
                    <Img
                      src={item.imageUrl}
                      alt={item.name}
                      width="64"
                      height="48"
                      style={{
                        width: "64px",
                        height: "48px",
                        borderRadius: "8px",
                        objectFit: "cover" as const,
                        margin: "0 auto 8px auto",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "64px",
                        height: "48px",
                        borderRadius: "8px",
                        backgroundColor: "#FFF9E6",
                        margin: "0 auto 8px auto",
                        lineHeight: "48px",
                        textAlign: "center" as const,
                        fontSize: "20px",
                      }}
                    >
                      {"\uD83C\uDF5C"}
                    </div>
                  )}
                  <Text
                    style={{
                      fontSize: "12px",
                      fontFamily: SANS,
                      color: "#374151",
                      margin: "0",
                    }}
                  >
                    {item.name}
                  </Text>
                </Link>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </Section>
  );
}
