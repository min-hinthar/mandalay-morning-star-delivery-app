import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Tailwind,
  Text,
} from "@react-email/components";
import { BrandFooter } from "./BrandFooter";
import { BrandHeader } from "./BrandHeader";

type EmailType = "confirmation" | "cancellation" | "refund" | "reminder";

interface EmailLayoutProps {
  children: React.ReactNode;
  previewText: string;
  emailType?: EmailType;
}

const TAILWIND_CONFIG = {
  theme: {
    extend: {
      colors: {
        "brand-red": "#A41034",
        "brand-gold": "#EBCD00",
        "brand-green": "#3D8B22",
        "warm-bg": "#FFF9E6",
        "dark-brown": "#8B4513",
        gold: "#D4A017",
      },
    },
  },
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://mandalaymorningstar.com";

export function EmailLayout({
  children,
  previewText,
  emailType = "confirmation",
}: EmailLayoutProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
      </Head>
      <Preview>{previewText}</Preview>
      <Tailwind config={TAILWIND_CONFIG}>
        <Body
          style={{
            backgroundColor: "#FFFFFF",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            margin: "0",
            padding: "0",
          }}
        >
          {/* View in browser link */}
          <Container className="mx-auto max-w-[600px]">
            <Text
              style={{
                textAlign: "center" as const,
                fontSize: "11px",
                color: "#9CA3AF",
                margin: "8px 0",
              }}
            >
              <Link
                href={`${APP_URL}/emails/view`}
                style={{ color: "#9CA3AF", textDecoration: "underline" }}
              >
                View in browser
              </Link>
            </Text>
          </Container>

          <Container
            className="mx-auto max-w-[600px]"
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <BrandHeader emailType={emailType} />

            {/* Main Content */}
            {children}

            <BrandFooter unsubscribeUrl={`${APP_URL}/account?tab=settings`} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
