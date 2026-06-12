import { Section, Text } from "@react-email/components";
import { BODY_FONT, C } from "./theme";

export type CalloutTone = "info" | "warn" | "success" | "accent";

interface CalloutProps {
  tone?: CalloutTone;
  /** Bold first line, e.g. "⏳ Awaiting Confirmation". */
  title?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

const TONES: Record<CalloutTone, { bg: string; border: string; title: string; body: string }> = {
  info: { bg: C.blueTint, border: C.blueTintBorder, title: C.blueDeep, body: C.ink },
  warn: { bg: C.goldTint, border: C.goldTintBorder, title: C.goldDeep, body: C.ink },
  success: { bg: C.sageTint, border: C.sageTintBorder, title: C.sageDeep, body: C.ink },
  accent: { bg: C.clayTint, border: C.clayTintBorder, title: C.accent, body: C.ink },
};

/** Tinted paper panel — the one way emails set copy apart from the page. */
export function Callout({ tone = "warn", title, children, style }: CalloutProps) {
  const t = TONES[tone];
  return (
    <Section
      style={{
        padding: "13px 16px",
        backgroundColor: t.bg,
        borderRadius: "10px",
        border: `1px solid ${t.border}`,
        ...style,
      }}
    >
      {title != null && (
        <Text
          style={{
            fontSize: "13px",
            fontFamily: BODY_FONT,
            fontWeight: 700,
            color: t.title,
            margin: children != null ? "0 0 4px 0" : "0",
            lineHeight: 1.4,
          }}
        >
          {title}
        </Text>
      )}
      {children != null && (
        <Text
          style={{
            fontSize: "13px",
            fontFamily: BODY_FONT,
            color: t.body,
            margin: "0",
            lineHeight: 1.55,
          }}
        >
          {children}
        </Text>
      )}
    </Section>
  );
}
