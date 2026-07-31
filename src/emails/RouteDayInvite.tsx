import { Heading, Img, Link, Section, Text } from "@react-email/components";

import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";
import { SupportSection } from "./components/SupportSection";
import { isHostableEmailImage } from "./components/DishThumb";
import { BODY_FONT, C, DISPLAY_FONT, bodyStyle, cls, headingStyle } from "./components/theme";
import { APP_URL } from "./helpers";
import type { SuggestedItem } from "@/lib/email/suggestions";

// ============================================
// TYPES
// ============================================

export interface RouteDayInviteProps {
  customerName: string;
  /** e.g. "We're driving the West Route this Wednesday" */
  headline: string;
  /** e.g. "Order by Tuesday 3 PM for Wednesday delivery" */
  cutoffText: string;
  /** e.g. "Wednesday" */
  dayName: string;
  /** Real dishes with hostable photos. Renders nothing when empty. */
  featuredItems?: SuggestedItem[];
}

const SRC = "email_route_day";

// ============================================
// COMPONENT
// ============================================

/**
 * "We're driving your way" invite — awareness, not a discount.
 *
 * Every claim is schedule-derived and true regardless of order volume: it never
 * references other customers, order counts, or scarcity it can't substantiate.
 */
export function RouteDayInvite({
  customerName,
  headline,
  cutoffText,
  dayName,
  featuredItems = [],
}: RouteDayInviteProps) {
  const dishes = featuredItems.filter((d) => d.name);

  return (
    <EmailLayout emailType="reminder" previewText={`${headline} — ${cutoffText}`}>
      {/* Hero */}
      <Section
        className={cls.clayTint}
        style={{
          padding: "32px 28px 20px 28px",
          backgroundColor: C.clayTint,
          textAlign: "center" as const,
        }}
      >
        <Text style={{ fontSize: "38px", margin: "0 0 8px 0" }}>{"🚚"}</Text>
        <Heading as="h2" className={cls.ink} style={{ ...headingStyle(23), margin: "0 0 10px 0" }}>
          {headline}
        </Heading>
        <Text
          className={cls.muted}
          style={{ ...bodyStyle(15), lineHeight: "1.55", margin: "0 0 4px 0" }}
        >
          Hi {customerName}, we&rsquo;re already headed to your neighborhood on {dayName} — add your
          order to the run.
        </Text>
        <Text
          className={cls.muted}
          style={{
            fontSize: "13px",
            fontFamily: BODY_FONT,
            color: C.inkMuted,
            margin: "0",
          }}
          lang="my"
        >
          သင့်ဒေသသို့ ပို့ဆောင်မည်
        </Text>
      </Section>

      {/* Cutoff — the one piece of real urgency */}
      <Section style={{ padding: "18px 28px 0 28px" }}>
        <table
          cellPadding="0"
          cellSpacing="0"
          role="presentation"
          className={`${cls.vellum} ${cls.clayBorder}`}
          style={{
            width: "100%",
            borderCollapse: "collapse" as const,
            backgroundColor: C.vellum,
            border: `1px solid ${C.clayTintBorder}`,
            borderRadius: "12px",
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: "12px 16px", textAlign: "center" as const }}>
                <Text
                  className={cls.accent}
                  style={{
                    fontSize: "10px",
                    fontFamily: BODY_FONT,
                    fontWeight: 700,
                    color: C.accent,
                    textTransform: "uppercase" as const,
                    letterSpacing: "1.6px",
                    margin: "0 0 3px 0",
                  }}
                >
                  {"⏳"} Ordering deadline
                </Text>
                <Text
                  className={cls.ink}
                  style={{
                    fontSize: "15px",
                    fontFamily: DISPLAY_FONT,
                    fontWeight: 600,
                    color: C.ink,
                    margin: "0",
                  }}
                >
                  {cutoffText}
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* Dish photos — the appetite appeal */}
      {dishes.length > 0 && (
        <Section style={{ padding: "22px 28px 0 28px" }}>
          <Text
            className={cls.accent}
            style={{
              fontSize: "10px",
              fontFamily: BODY_FONT,
              fontWeight: 700,
              color: C.accent,
              textTransform: "uppercase" as const,
              letterSpacing: "2px",
              margin: "0 0 10px 0",
              textAlign: "center" as const,
            }}
          >
            On the menu
          </Text>
          <table
            cellPadding="0"
            cellSpacing="0"
            role="presentation"
            style={{ width: "100%", borderCollapse: "collapse" as const }}
          >
            <tbody>
              <tr>
                {dishes.map((dish) => (
                  <td
                    key={dish.slug || dish.name}
                    style={{
                      width: `${Math.floor(100 / dishes.length)}%`,
                      textAlign: "center" as const,
                      padding: "6px",
                      verticalAlign: "top" as const,
                    }}
                  >
                    <Link href={`${APP_URL}/menu?src=${SRC}`} style={{ textDecoration: "none" }}>
                      {isHostableEmailImage(dish.imageUrl) ? (
                        <Img
                          src={dish.imageUrl}
                          alt={dish.name}
                          width="150"
                          height="112"
                          style={{
                            width: "100%",
                            maxWidth: "150px",
                            height: "112px",
                            borderRadius: "12px",
                            objectFit: "cover" as const,
                            margin: "0 auto 8px auto",
                            display: "block",
                            border: `1px solid ${C.line}`,
                          }}
                        />
                      ) : (
                        <div
                          className={`${cls.vellum} ${cls.clayBorder} ${cls.accent}`}
                          style={{
                            maxWidth: "150px",
                            height: "112px",
                            borderRadius: "12px",
                            backgroundColor: C.vellum,
                            border: `1px solid ${C.clayTintBorder}`,
                            margin: "0 auto 8px auto",
                            lineHeight: "112px",
                            textAlign: "center" as const,
                            fontFamily: DISPLAY_FONT,
                            fontSize: "34px",
                            fontWeight: 600,
                            color: C.accent,
                          }}
                        >
                          {(dish.name.trim()[0] || "★").toUpperCase()}
                        </div>
                      )}
                      <Text
                        className={cls.ink}
                        style={{
                          fontSize: "13px",
                          fontFamily: BODY_FONT,
                          fontWeight: 600,
                          color: C.ink,
                          margin: "0",
                        }}
                      >
                        {dish.name}
                      </Text>
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </Section>
      )}

      {/* CTA */}
      <Section style={{ padding: "22px 28px 0 28px", textAlign: "center" as const }}>
        <EmailButton href={`${APP_URL}/menu?src=${SRC}`}>Browse the menu</EmailButton>
      </Section>

      <SupportSection />
      <Section style={{ height: "8px" }} />
    </EmailLayout>
  );
}

export default RouteDayInvite;
