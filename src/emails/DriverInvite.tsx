import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

const SERIF = "Georgia, 'Palatino Linotype', serif";
const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export interface DriverInviteProps {
  driverEmail: string;
  magicLink: string;
  expiresIn: string;
}

export function DriverInvite({ driverEmail, magicLink, expiresIn }: DriverInviteProps) {
  return (
    <EmailLayout
      emailType="confirmation"
      previewText="You're invited to drive for Mandalay Morning Star"
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
          Mingalabar!
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
          You&apos;ve been invited to join the Mandalay Morning Star delivery team as a driver. Tap
          the button below to get started.
        </Text>
      </Section>

      {/* Invite Details */}
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
          Invitation for
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
          {driverEmail}
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
          Accept Invitation
        </Button>
      </Section>

      {/* Expiry Note */}
      <Section style={{ padding: "16px 24px 32px 24px" }}>
        <Text
          style={{
            fontSize: "13px",
            fontFamily: SANS,
            color: "#9CA3AF",
            margin: "0",
            textAlign: "center" as const,
          }}
        >
          This link expires in {expiresIn}. If you didn&apos;t expect this invitation, you can
          safely ignore this email.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default DriverInvite;
