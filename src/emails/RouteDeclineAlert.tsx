import { AdminCtas, AdminTitle, DataField, DataPanel } from "./components/AdminBits";
import { Callout } from "./components/Callout";
import { EmailLayout } from "./components/EmailLayout";
import { APP_URL, formatDate } from "./helpers";

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
      variant="admin"
      showReferral={false}
      previewText={`Route declined by ${driverName}`}
    >
      {/* ---- Header ---------------------------------------- */}
      <AdminTitle title={<>{"⚠️"} Route Declined</>} />

      {/* ---- Urgency callout -------------------------------- */}
      <Callout tone="accent" style={{ margin: "0 28px 20px 28px" }}>
        A driver has declined their assigned route. This route needs to be reassigned.
      </Callout>

      {/* ---- Details --------------------------------------- */}
      <DataPanel>
        <DataField label="Driver" bold>
          {driverName}
        </DataField>
        <DataField label="Delivery Date">{formatDate(routeDate)}</DataField>
        <DataField label="Stops" last={!reason}>
          {stopCount} {stopCount === 1 ? "stop" : "stops"}
        </DataField>
        {reason && (
          <DataField label="Reason" italic last>
            {reason}
          </DataField>
        )}
      </DataPanel>

      {/* ---- CTA + Dashboard Link --------------------------- */}
      <AdminCtas
        primaryHref={adminRouteUrl}
        primaryLabel="Reassign Route"
        secondaryHref={`${APP_URL}/admin/routes`}
        secondaryLabel="Go to Routes Dashboard"
      />
    </EmailLayout>
  );
}

export default RouteDeclineAlert;
