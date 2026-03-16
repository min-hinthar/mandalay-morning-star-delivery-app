import { Button, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import { APP_URL, FONT_STACK, SERIF_STACK, formatDate } from "./helpers";

// ---- Types --------------------------------------------------

export interface RouteDeclineAlertProps {
  driverName: string;
  routeDate: string;
  stopCount: number;
  reason?: string | null;
  routeId: string;
}

// ---- Component ----------------------------------------------

export function RouteDeclineAlert({
  driverName,
  routeDate,
  stopCount,
  reason,
  routeId,
}: RouteDeclineAlertProps) {
  const adminRouteUrl = `${APP_URL}/admin/routes/${routeId}`;

  return (
    <EmailLayout
      emailType="confirmation"
      previewText={`Route declined by ${driverName}`}
    >
      {/* ---- Header ---------------------------------------- */}
      <Section style={{ padding: "32px 24px 0 24px" }}>
        <Text
          style={{
            fontSize: "22px",
            fontFamily: SERIF_STACK,
            color: "#8B4513",
            fontWeight: 700,
            margin: "0 0 8px 0",
            lineHeight: "1.3",
          }}
        >
          {"\u26A0\uFE0F"} Route Declined
        </Text>
        <Text
          style={{
            fontSize: "15px",
            fontFamily: FONT_STACK,
            color: "#374151",
            margin: "0 0 24px 0",
            lineHeight: "1.6",
          }}
        >
          A driver has declined their assigned route. This route needs to be reassigned.
        </Text>
      </Section>

      {/* ---- Details --------------------------------------- */}
      <Section
        style={{
          margin: "0 24px",
          padding: "16px 20px",
          backgroundColor: "#F9FAFB",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <Text
          style={{
            fontSize: "13px",
            fontFamily: FONT_STACK,
            color: "#6B7280",
            margin: "0 0 4px 0",
          }}
        >
          Driver
        </Text>
        <Text
          style={{
            fontSize: "14px",
            fontFamily: FONT_STACK,
            fontWeight: 700,
            color: "#111111",
            margin: "0 0 12px 0",
          }}
        >
          {driverName}
        </Text>

        <Text
          style={{
            fontSize: "13px",
            fontFamily: FONT_STACK,
            color: "#6B7280",
            margin: "0 0 4px 0",
          }}
        >
          Delivery Date
        </Text>
        <Text
          style={{
            fontSize: "14px",
            fontFamily: FONT_STACK,
            color: "#111111",
            margin: "0 0 12px 0",
          }}
        >
          {formatDate(routeDate)}
        </Text>

        <Text
          style={{
            fontSize: "13px",
            fontFamily: FONT_STACK,
            color: "#6B7280",
            margin: "0 0 4px 0",
          }}
        >
          Stops
        </Text>
        <Text
          style={{
            fontSize: "14px",
            fontFamily: FONT_STACK,
            color: "#111111",
            margin: reason ? "0 0 12px 0" : "0",
          }}
        >
          {stopCount} {stopCount === 1 ? "stop" : "stops"}
        </Text>

        {reason && (
          <>
            <Text
              style={{
                fontSize: "13px",
                fontFamily: FONT_STACK,
                color: "#6B7280",
                margin: "0 0 4px 0",
              }}
            >
              Reason
            </Text>
            <Text
              style={{
                fontSize: "14px",
                fontFamily: FONT_STACK,
                color: "#111111",
                margin: "0",
                fontStyle: "italic",
              }}
            >
              {reason}
            </Text>
          </>
        )}
      </Section>

      {/* ---- CTA ------------------------------------------- */}
      <Section style={{ padding: "24px 24px 0 24px", textAlign: "center" as const }}>
        <Button
          href={adminRouteUrl}
          style={{
            backgroundColor: "#D4A017",
            color: "#FFFFFF",
            fontFamily: FONT_STACK,
            fontSize: "16px",
            fontWeight: 700,
            borderRadius: "8px",
            padding: "14px 32px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Reassign Route
        </Button>
      </Section>

      {/* ---- Dashboard Link -------------------------------- */}
      <Section style={{ padding: "12px 24px 24px 24px", textAlign: "center" as const }}>
        <Link
          href={`${APP_URL}/admin/routes`}
          style={{
            fontSize: "14px",
            fontFamily: FONT_STACK,
            color: "#D4A017",
            textDecoration: "underline",
          }}
        >
          Go to Routes Dashboard
        </Link>
      </Section>
    </EmailLayout>
  );
}

export default RouteDeclineAlert;
