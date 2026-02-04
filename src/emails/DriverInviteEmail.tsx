import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

interface DriverInviteEmailProps {
  inviteUrl: string;
  expiresAt: string;
}

export function DriverInviteEmail({ inviteUrl, expiresAt }: DriverInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You&apos;re invited to join Morning Star Delivery</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Join Morning Star Delivery</Heading>

          <Text style={text}>
            You&apos;ve been invited to join our driver team. Click below to complete
            your registration and start delivering.
          </Text>

          <Button style={button} href={inviteUrl}>
            Accept Invitation
          </Button>

          <Text style={footer}>
            This link expires on {expiresAt}. If you didn&apos;t expect this email,
            you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: "40px auto",
  padding: "40px",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  maxWidth: "480px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600" as const,
  margin: "0 0 20px",
};

const text = {
  color: "#4a4a4a",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 24px",
};

const button = {
  backgroundColor: "#C8102E",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: "500" as const,
  display: "inline-block" as const,
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  marginTop: "32px",
};
