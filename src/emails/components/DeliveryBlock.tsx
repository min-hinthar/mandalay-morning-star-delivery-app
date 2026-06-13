import { Section, Text } from "@react-email/components";
import { TIMEZONE } from "@/types/delivery";
import { BODY_FONT, C, cls } from "./theme";

interface DeliveryAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
}

interface DeliveryBlockProps {
  address: DeliveryAddress;
  windowStart?: string;
  windowEnd?: string;
  instructions?: string;
  driverName?: string;
}

function formatDeliveryDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: TIMEZONE,
  });
}

function formatDeliveryTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TIMEZONE,
  });
}

function getTimezoneAbbr(isoString: string): string {
  const date = new Date(isoString);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    timeZoneName: "short",
  }).formatToParts(date);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "PT";
}

export function DeliveryBlock({
  address,
  windowStart,
  windowEnd,
  instructions,
  driverName,
}: DeliveryBlockProps) {
  const deliveryDate = windowStart ? formatDeliveryDate(windowStart) : null;
  const tzAbbr = windowStart ? getTimezoneAbbr(windowStart) : null;
  const deliveryTimeRange =
    windowStart && windowEnd
      ? `${formatDeliveryTime(windowStart)} - ${formatDeliveryTime(windowEnd)} ${tzAbbr}`
      : null;

  return (
    <Section
      className={`${cls.sageTint} ${cls.sageBorder}`}
      style={{
        margin: "0 28px",
        padding: "18px 20px",
        backgroundColor: C.sageTint,
        border: `1px solid ${C.sageTintBorder}`,
        borderLeft: `4px solid ${C.sage}`,
        borderRadius: "0 12px 12px 0",
      }}
    >
      {/* Delivery Date + Time */}
      {deliveryDate && (
        <Text
          className={cls.ink}
          style={{
            fontSize: "14px",
            color: C.ink,
            margin: "0 0 4px 0",
            fontWeight: 700,
            fontFamily: BODY_FONT,
          }}
        >
          {"📅"} {deliveryDate}
        </Text>
      )}
      {deliveryTimeRange && (
        <Text
          className={cls.muted}
          style={{
            fontSize: "13px",
            color: C.inkMuted,
            margin: "0 0 2px 0",
            fontFamily: BODY_FONT,
          }}
        >
          {deliveryTimeRange}
        </Text>
      )}
      {deliveryTimeRange && (
        <Text
          className={cls.faint}
          style={{
            fontSize: "11px",
            color: C.inkFaint,
            margin: "0 0 12px 0",
            fontStyle: "italic",
            fontFamily: BODY_FONT,
          }}
        >
          This is your preferred delivery window, not a guaranteed arrival time.
        </Text>
      )}

      {/* Address */}
      <Text
        className={cls.ink}
        style={{
          fontSize: "14px",
          color: C.ink,
          margin: "0 0 2px 0",
          fontWeight: 700,
          fontFamily: BODY_FONT,
        }}
      >
        {"📍"} Delivery Address
      </Text>
      <Text
        className={cls.muted}
        style={{
          fontSize: "13px",
          color: C.inkMuted,
          margin: "0 0 4px 0",
          lineHeight: "1.5",
          fontFamily: BODY_FONT,
        }}
      >
        {address.line1}
        {address.line2 && (
          <>
            <br />
            <strong>{address.line2}</strong>
          </>
        )}
        <br />
        {address.city}, {address.state} {address.postalCode}
      </Text>

      {/* Driver name */}
      {driverName && (
        <Text
          className={cls.muted}
          style={{
            fontSize: "13px",
            color: C.inkMuted,
            margin: "8px 0 0 0",
            fontFamily: BODY_FONT,
          }}
        >
          {"🚗"} Driver:{" "}
          <strong className={cls.ink} style={{ color: C.ink }}>
            {driverName}
          </strong>
        </Text>
      )}

      {/* Special instructions */}
      {instructions && (
        <div
          className={`${cls.card} ${cls.sageBorder}`}
          style={{
            marginTop: "12px",
            padding: "10px 12px",
            backgroundColor: C.paper,
            borderRadius: "8px",
            border: `1px solid ${C.sageTintBorder}`,
          }}
        >
          <Text
            className={cls.sageDeep}
            style={{
              fontSize: "12px",
              color: C.sageDeep,
              margin: "0",
              fontWeight: 700,
              fontFamily: BODY_FONT,
            }}
          >
            {"📝"} Special Instructions
          </Text>
          <Text
            className={cls.ink}
            style={{
              fontSize: "13px",
              color: C.ink,
              margin: "4px 0 0 0",
              fontFamily: BODY_FONT,
            }}
          >
            {instructions}
          </Text>
        </div>
      )}
    </Section>
  );
}
