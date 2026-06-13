import { Section, Text } from "@react-email/components";

import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";
import { BODY_FONT, C, bodyStyle, cls, headingStyle, labelStyle } from "./components/theme";

export interface DriverInviteProps {
  driverEmail: string;
  magicLink: string;
  expiresIn: string;
}

export function DriverInvite({ driverEmail, magicLink, expiresIn }: DriverInviteProps) {
  return (
    <EmailLayout
      emailType="auth"
      showReferral={false}
      previewText="You're invited to drive for Mandalay Morning Star"
    >
      {/* Greeting */}
      <Section style={{ padding: "30px 28px 0 28px" }}>
        <Text className={cls.ink} style={headingStyle(22)}>
          Mingalabar!
        </Text>
        <Text className={cls.muted} style={{ ...bodyStyle(15), margin: "0 0 24px 0" }}>
          You&apos;ve been invited to join the Mandalay Morning Star delivery team as a driver. Tap
          the button below to get started.
        </Text>
      </Section>

      {/* Invite Details */}
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
          Invitation for
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
          {driverEmail}
        </Text>
      </Section>

      {/* CTA */}
      <Section style={{ padding: "8px 28px 0 28px", textAlign: "center" as const }}>
        <EmailButton href={magicLink}>Accept Invitation</EmailButton>
      </Section>

      {/* Expiry Note */}
      <Section style={{ padding: "16px 28px 32px 28px" }}>
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
          This link expires in {expiresIn}. If you didn&apos;t expect this invitation, you can
          safely ignore this email.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default DriverInvite;
