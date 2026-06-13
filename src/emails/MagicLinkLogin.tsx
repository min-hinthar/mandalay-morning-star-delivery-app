import { Section, Text } from "@react-email/components";

import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";
import {
  BODY_FONT,
  C,
  DISPLAY_FONT,
  bodyStyle,
  cls,
  headingStyle,
  labelStyle,
} from "./components/theme";

export interface MagicLinkLoginProps {
  email: string;
  magicLink: string;
  /** Optional 6-digit code — lets the customer finish login in their tab. */
  code?: string;
  /** Human-readable expiry, e.g. "1 hour". */
  expiresIn: string;
}

export function MagicLinkLogin({ email, magicLink, code, expiresIn }: MagicLinkLoginProps) {
  return (
    <EmailLayout
      emailType="auth"
      showReferral={false}
      previewText="Your secure sign-in link for Mandalay Morning Star"
    >
      {/* Greeting */}
      <Section style={{ padding: "30px 28px 0 28px" }}>
        <Text className={cls.ink} style={headingStyle(22)}>
          Mingalabar! Welcome back
        </Text>
        <Text className={cls.muted} style={{ ...bodyStyle(15), margin: "0 0 24px 0" }}>
          Tap the button below to sign in to Mandalay Morning Star. No password needed — this link
          signs you in securely.
        </Text>
      </Section>

      {/* Account */}
      <Section
        className={`${cls.vellum} ${cls.line}`}
        style={{
          margin: "0 28px 20px 28px",
          padding: "16px 20px",
          backgroundColor: C.vellum,
          border: `1px solid ${C.line}`,
          borderRadius: "12px",
        }}
      >
        <Text className={cls.faint} style={labelStyle()}>
          Signing in as
        </Text>
        <Text
          className={cls.ink}
          style={{
            fontSize: "16px",
            fontFamily: BODY_FONT,
            fontWeight: 700,
            color: C.ink,
            margin: "0",
          }}
        >
          {email}
        </Text>
      </Section>

      {/* CTA */}
      <Section style={{ padding: "8px 28px 0 28px", textAlign: "center" as const }}>
        <EmailButton href={magicLink}>Sign in to Mandalay Morning Star</EmailButton>
      </Section>

      {/* One-time code ticket (lets you finish in the same tab) */}
      {code && (
        <Section style={{ padding: "20px 28px 0 28px" }}>
          <Text
            className={cls.muted}
            style={{
              fontSize: "13px",
              fontFamily: BODY_FONT,
              color: C.inkMuted,
              margin: "0 0 8px 0",
              textAlign: "center" as const,
            }}
          >
            Or enter this code on the sign-in screen:
          </Text>
          <Section
            className={`${cls.vellum} ${cls.goldLeaf}`}
            style={{
              backgroundColor: C.vellum,
              border: `1px solid ${C.goldLeaf}`,
              borderRadius: "12px",
              padding: "5px",
            }}
          >
            <Section
              className={cls.goldLeaf}
              style={{
                border: `1px dashed ${C.goldLeaf}`,
                borderRadius: "8px",
                padding: "14px 12px",
                textAlign: "center" as const,
              }}
            >
              <Text
                className={cls.accentStrong}
                style={{
                  fontSize: "22px",
                  fontFamily: DISPLAY_FONT,
                  fontWeight: 600,
                  letterSpacing: "6px",
                  color: C.accentStrong,
                  margin: "0",
                }}
              >
                {code}
              </Text>
            </Section>
          </Section>
        </Section>
      )}

      {/* Fallback link */}
      <Section style={{ padding: "16px 28px 0 28px" }}>
        <Text
          className={cls.faint}
          style={{
            fontSize: "12px",
            fontFamily: BODY_FONT,
            color: C.inkFaint,
            margin: "0 0 4px 0",
            textAlign: "center" as const,
          }}
        >
          Button not working? Copy and paste this link into your browser:
        </Text>
        <Text
          className={cls.accent}
          style={{
            fontSize: "12px",
            fontFamily: BODY_FONT,
            color: C.accent,
            margin: "0",
            textAlign: "center" as const,
            wordBreak: "break-all" as const,
          }}
        >
          {magicLink}
        </Text>
      </Section>

      {/* Expiry + security note */}
      <Section style={{ padding: "20px 28px 32px 28px" }}>
        <Text
          className={cls.faint}
          style={{
            fontSize: "13px",
            fontFamily: BODY_FONT,
            color: C.inkFaint,
            margin: "0",
            textAlign: "center" as const,
            lineHeight: 1.6,
          }}
        >
          This link expires in {expiresIn} and can only be used once. If you didn&apos;t request it,
          you can safely ignore this email — your account stays secure.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default MagicLinkLogin;
