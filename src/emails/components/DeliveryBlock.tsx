import { Section, Text } from '@react-email/components';

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
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDeliveryTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function DeliveryBlock({
  address,
  windowStart,
  windowEnd,
  instructions,
  driverName,
}: DeliveryBlockProps) {
  const deliveryDate = windowStart
    ? formatDeliveryDate(windowStart)
    : null;
  const deliveryTimeRange =
    windowStart && windowEnd
      ? `${formatDeliveryTime(windowStart)} - ${formatDeliveryTime(windowEnd)}`
      : null;

  return (
    <Section
      style={{
        margin: '0 24px',
        padding: '20px',
        backgroundColor: '#FFF9E6',
        borderLeft: '4px solid #3D8B22',
        borderRadius: '0 8px 8px 0',
      }}
    >
      {/* Delivery Date + Time */}
      {deliveryDate && (
        <Text
          style={{
            fontSize: '14px',
            color: '#111111',
            margin: '0 0 4px 0',
            fontWeight: 600,
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {'\uD83D\uDCC5'} {deliveryDate}
        </Text>
      )}
      {deliveryTimeRange && (
        <Text
          style={{
            fontSize: '13px',
            color: '#6B7280',
            margin: '0 0 12px 0',
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {deliveryTimeRange}
        </Text>
      )}

      {/* Address */}
      <Text
        style={{
          fontSize: '14px',
          color: '#111111',
          margin: '0 0 2px 0',
          fontWeight: 600,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {'\uD83D\uDCCD'} Delivery Address
      </Text>
      <Text
        style={{
          fontSize: '13px',
          color: '#374151',
          margin: '0 0 4px 0',
          lineHeight: '1.5',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
          style={{
            fontSize: '13px',
            color: '#374151',
            margin: '8px 0 0 0',
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {'\uD83D\uDE97'} Driver: <strong>{driverName}</strong>
        </Text>
      )}

      {/* Special instructions */}
      {instructions && (
        <div
          style={{
            marginTop: '12px',
            padding: '10px 12px',
            backgroundColor: '#FFFBEB',
            borderRadius: '6px',
            border: '1px solid #FDE68A',
          }}
        >
          <Text
            style={{
              fontSize: '12px',
              color: '#92400E',
              margin: '0',
              fontWeight: 600,
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            {'\uD83D\uDCDD'} Special Instructions
          </Text>
          <Text
            style={{
              fontSize: '13px',
              color: '#78350F',
              margin: '4px 0 0 0',
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            {instructions}
          </Text>
        </div>
      )}
    </Section>
  );
}
