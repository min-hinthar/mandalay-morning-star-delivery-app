import { Hr, Link, Section, Text } from "@react-email/components";
import { BODY_FONT, C, DISPLAY_FONT, cls } from "./theme";

export function SupportSection() {
  return (
    <Section style={{ padding: "26px 28px 0 28px" }}>
      <Hr
        className={cls.line}
        style={{ borderColor: C.line, borderWidth: "1px 0 0 0", margin: "0 0 18px 0" }}
      />
      <Text
        className={cls.ink}
        style={{
          fontSize: "15px",
          fontFamily: DISPLAY_FONT,
          color: C.ink,
          margin: "0 0 6px 0",
          textAlign: "center" as const,
          fontWeight: 600,
        }}
      >
        Need help?
      </Text>
      <Text
        className={cls.muted}
        style={{
          fontSize: "13px",
          fontFamily: BODY_FONT,
          color: C.inkMuted,
          margin: "0",
          textAlign: "center" as const,
          lineHeight: "1.6",
        }}
      >
        Simply reply to this email or contact us at{" "}
        <Link
          href="mailto:admin@mandalaymorningstar.com"
          className={cls.accent}
          style={{ color: C.accent, textDecoration: "underline" }}
        >
          admin@mandalaymorningstar.com
        </Link>
      </Text>
    </Section>
  );
}
