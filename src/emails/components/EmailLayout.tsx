import { Body, Container, Head, Html, Link, Preview, Text } from "@react-email/components";
import { BrandFooter } from "./BrandFooter";
import { BrandHeader, type EmailMood } from "./BrandHeader";
import { BODY_FONT, C, FONTS_IMPORT_CSS } from "./theme";

interface EmailLayoutProps {
  children: React.ReactNode;
  previewText: string;
  emailType?: EmailMood;
  /** Show the "refer a friend" nudge in the footer. Off for admin/driver mail. */
  showReferral?: boolean;
  /** Admin mail: compact utilitarian header, no mood line, no marketing footer. */
  variant?: "default" | "admin";
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://mandalaymorningstar.com";

/** Clay / blue / sage ribbon along the top edge of the paper card. */
function TriadBar() {
  return (
    <table
      cellPadding="0"
      cellSpacing="0"
      role="presentation"
      style={{ width: "100%", borderCollapse: "collapse" }}
    >
      <tbody>
        <tr>
          <td style={{ height: "5px", width: "50%", backgroundColor: C.clay, fontSize: 0 }} />
          <td style={{ height: "5px", width: "28%", backgroundColor: C.blue, fontSize: 0 }} />
          <td style={{ height: "5px", width: "22%", backgroundColor: C.sage, fontSize: 0 }} />
        </tr>
      </tbody>
    </table>
  );
}

export function EmailLayout({
  children,
  previewText,
  emailType = "confirmation",
  showReferral = true,
  variant = "default",
}: EmailLayoutProps) {
  const isAdmin = variant === "admin";

  return (
    <Html lang="en" dir="ltr">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <style>{FONTS_IMPORT_CSS}</style>
      </Head>
      <Preview>{previewText}</Preview>
      <Body
        style={{
          backgroundColor: C.canvas,
          fontFamily: BODY_FONT,
          margin: "0",
          padding: "0 12px",
        }}
      >
        {/* View in browser link */}
        <Container style={{ maxWidth: "600px" }}>
          <Text
            style={{
              textAlign: "center" as const,
              fontSize: "11px",
              color: C.inkFaint,
              margin: "10px 0",
            }}
          >
            <Link
              href={`${APP_URL}/emails/view`}
              style={{ color: C.inkFaint, textDecoration: "underline" }}
            >
              View in browser
            </Link>
          </Text>
        </Container>

        {/* The paper card */}
        <Container
          style={{
            maxWidth: "600px",
            backgroundColor: C.paper,
            border: `1px solid ${C.line}`,
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          <TriadBar />
          <BrandHeader emailType={emailType} variant={variant} />

          {/* Main Content */}
          {children}

          <BrandFooter
            unsubscribeUrl={`${APP_URL}/account?tab=settings`}
            referralUrl={
              showReferral && !isAdmin
                ? `${APP_URL}/account?tab=settings&src=email_footer`
                : undefined
            }
            variant={variant}
          />
        </Container>

        {/* Sign-off below the card */}
        <Container style={{ maxWidth: "600px" }}>
          <Text
            style={{
              textAlign: "center" as const,
              fontSize: "11px",
              fontFamily: BODY_FONT,
              color: C.inkFaint,
              margin: "14px 0 20px 0",
              letterSpacing: "0.3px",
            }}
          >
            Cooked &amp; sent with {"♥"} from Covina, California
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
