import { Link, Section, Text } from "@react-email/components";
import { BODY_FONT, C, cls } from "./theme";

interface NextDeliveryTeaserProps {
  /** e.g. "Order by Tuesday 3 PM for Wednesday delivery" — from live delivery_days config. */
  cutoffText?: string | null;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://mandalaymorningstar.com";

/** Quiet reorder nudge: the real next delivery window and its cutoff. */
export function NextDeliveryTeaser({ cutoffText }: NextDeliveryTeaserProps) {
  if (!cutoffText) return null;

  return (
    <Section style={{ padding: "20px 28px 0 28px" }}>
      <Section
        className={`${cls.blueTint} ${cls.blueBorder}`}
        style={{
          backgroundColor: C.blueTint,
          border: `1px solid ${C.blueTintBorder}`,
          borderRadius: "12px",
          padding: "13px 18px",
          textAlign: "center" as const,
        }}
      >
        <Text
          className={cls.ink}
          style={{
            fontSize: "13px",
            fontFamily: BODY_FONT,
            color: C.ink,
            margin: "0 0 2px 0",
            lineHeight: 1.5,
          }}
        >
          {"🗓"} <strong>{cutoffText}</strong>
        </Text>
        <Link
          href={`${APP_URL}/menu?src=email_next_delivery`}
          className={cls.blueDeep}
          style={{
            fontSize: "12px",
            fontFamily: BODY_FONT,
            fontWeight: 700,
            color: C.blueDeep,
            textDecoration: "underline",
          }}
        >
          Plan your next feast {"→"}
        </Link>
      </Section>
    </Section>
  );
}
