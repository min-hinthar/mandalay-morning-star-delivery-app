import { Heading, Section, Text } from "@react-email/components";

type EmailType = "confirmation" | "cancellation" | "refund" | "reminder";

interface BrandHeaderProps {
  emailType: EmailType;
}

const TYPE_MOOD: Record<EmailType, { emoji: string; greeting: string }> = {
  confirmation: {
    emoji: "\uD83C\uDF89",
    greeting: "Your feast is on the way!",
  },
  cancellation: {
    emoji: "\uD83D\uDE1E",
    greeting: "We're sorry to see this order go",
  },
  refund: {
    emoji: "\uD83E\uDD1D",
    greeting: "Your refund is being processed",
  },
  reminder: {
    emoji: "\uD83D\uDD14",
    greeting: "Your delivery is coming soon!",
  },
};

export function BrandHeader({ emailType }: BrandHeaderProps) {
  const mood = TYPE_MOOD[emailType];

  return (
    <Section
      style={{
        textAlign: "center" as const,
        padding: "32px 24px",
        background: "linear-gradient(135deg, #D4A017 0%, #8B4513 100%)",
        borderRadius: "12px 12px 0 0",
      }}
    >
      {/* Burmese Greeting */}
      <Text
        style={{
          color: "#EBCD00",
          fontSize: "14px",
          fontFamily: "Georgia, 'Palatino Linotype', serif",
          margin: "0 0 4px 0",
          letterSpacing: "0.5px",
        }}
      >
        Mingalabar!
      </Text>

      {/* Brand Name */}
      <Heading
        as="h1"
        style={{
          color: "#FFFFFF",
          fontSize: "28px",
          fontFamily: "Georgia, 'Palatino Linotype', serif",
          fontWeight: 700,
          margin: "0 0 4px 0",
          lineHeight: "1.2",
        }}
      >
        Mandalay Morning Star
      </Heading>

      {/* Tagline */}
      <Text
        style={{
          color: "rgba(255, 255, 255, 0.9)",
          fontSize: "14px",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          margin: "0 0 16px 0",
        }}
      >
        Authentic Burmese Cuisine
      </Text>

      {/* Morning Star brand mark */}
      <Text
        style={{
          color: "rgba(255, 255, 255, 0.6)",
          fontSize: "10px",
          margin: "0 0 12px 0",
          letterSpacing: "2px",
        }}
      >
        {"\u2605"} {"\u2605"} {"\u2605"}
      </Text>

      {/* Type-specific mood */}
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: "18px",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          margin: "0",
          fontWeight: 600,
        }}
      >
        {mood.emoji} {mood.greeting}
      </Text>
    </Section>
  );
}
