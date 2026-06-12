import { Img, Link, Section, Text } from "@react-email/components";
import type { SuggestedItem } from "@/lib/email/suggestions";
import { BODY_FONT, C, DISPLAY_FONT } from "./theme";

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
    <Section style={{ padding: "26px 28px 0 28px" }}>
      <Text
        style={{
          fontSize: "10px",
          fontFamily: BODY_FONT,
          fontWeight: 700,
          color: C.accent,
          textTransform: "uppercase" as const,
          letterSpacing: "2px",
          margin: "0 0 4px 0",
          textAlign: "center" as const,
        }}
      >
        From our kitchen
      </Text>
      <Text
        style={{
          fontSize: "17px",
          fontFamily: DISPLAY_FONT,
          fontWeight: 600,
          color: C.ink,
          margin: "0 0 14px 0",
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
                      width="72"
                      height="54"
                      style={{
                        width: "72px",
                        height: "54px",
                        borderRadius: "10px",
                        objectFit: "cover" as const,
                        margin: "0 auto 8px auto",
                        display: "block",
                        border: `1px solid ${C.line}`,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "72px",
                        height: "54px",
                        borderRadius: "10px",
                        backgroundColor: C.vellum,
                        border: `1px solid ${C.line}`,
                        margin: "0 auto 8px auto",
                        lineHeight: "54px",
                        textAlign: "center" as const,
                        fontSize: "20px",
                      }}
                    >
                      {"🍜"}
                    </div>
                  )}
                  <Text
                    style={{
                      fontSize: "12px",
                      fontFamily: BODY_FONT,
                      fontWeight: 600,
                      color: C.inkMuted,
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
