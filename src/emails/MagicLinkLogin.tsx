import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

const SERIF = "Georgia, 'Palatino Linotype', serif";
const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

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
      emailType="confirmation"
      showReferral={false}
      previewText="Your secure sign-in link for Mandalay Morning Star"
    >
      {/* Greeting */}
      <Section style={{ padding: "32px 24px 0 24px" }}>
        <Text
          style={{
            fontSize: "22px",
            fontFamily: SERIF,
            color: "#8B4513",
            fontWeight: 700,
            margin: "0 0 8px 0",
            lineHeight: "1.3",
          }}
        >
          Mingalabar! Welcome back
        </Text>
        <Text
          style={{
            fontSize: "15px",
            fontFamily: SANS,
            color: "#374151",
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          Tap the button below to sign in to Mandalay Morning Star. No password needed — this link
          signs you in securely.
        </Text>
      </Section>

      {/* Account */}
      <Section
        style={{
          margin: "0 24px",
          padding: "16px 20px",
          backgroundColor: "#F9FAFB",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <Text style={{ fontSize: "13px", fontFamily: SANS, color: "#6B7280", margin: "0 0 4px 0" }}>
          Signing in as
        </Text>
        <Text
          style={{
            fontSize: "16px",
            fontFamily: SANS,
            fontWeight: 700,
            color: "#111111",
            margin: "0",
          }}
        >
          {email}
        </Text>
      </Section>

      {/* CTA */}
      <Section style={{ padding: "8px 24px 0 24px", textAlign: "center" as const }}>
        <Button
          href={magicLink}
          style={{
            backgroundColor: "#D4A017",
            color: "#FFFFFF",
            fontFamily: SANS,
            fontSize: "16px",
            fontWeight: 700,
            borderRadius: "8px",
            padding: "14px 32px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Sign in to Mandalay Morning Star
        </Button>
      </Section>

      {/* One-time code (lets you finish in the same tab) */}
      {code && (
        <Section style={{ padding: "20px 24px 0 24px", textAlign: "center" as const }}>
          <Text
            style={{
              fontSize: "13px",
              fontFamily: SANS,
              color: "#6B7280",
              margin: "0 0 8px 0",
            }}
          >
            Or enter this code on the sign-in screen:
          </Text>
          <Text
            style={{
              fontSize: "30px",
              fontFamily: SANS,
              fontWeight: 700,
              letterSpacing: "8px",
              color: "#8B4513",
              backgroundColor: "#FFF9E6",
              border: "1px solid #F3E2B3",
              borderRadius: "10px",
              padding: "14px 0",
              margin: "0",
              display: "block",
            }}
          >
            {code}
          </Text>
        </Section>
      )}

      {/* Fallback link */}
      <Section style={{ padding: "16px 24px 0 24px" }}>
        <Text
          style={{
            fontSize: "12px",
            fontFamily: SANS,
            color: "#9CA3AF",
            margin: "0 0 4px 0",
            textAlign: "center" as const,
          }}
        >
          Button not working? Copy and paste this link into your browser:
        </Text>
        <Text
          style={{
            fontSize: "12px",
            fontFamily: SANS,
            color: "#D4A017",
            margin: "0",
            textAlign: "center" as const,
            wordBreak: "break-all" as const,
          }}
        >
          {magicLink}
        </Text>
      </Section>

      {/* Expiry + security note */}
      <Section style={{ padding: "20px 24px 32px 24px" }}>
        <Text
          style={{
            fontSize: "13px",
            fontFamily: SANS,
            color: "#9CA3AF",
            margin: "0",
            textAlign: "center" as const,
            lineHeight: "1.6",
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
