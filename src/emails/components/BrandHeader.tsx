import { Heading, Img, Section, Text } from "@react-email/components";
import { BODY_FONT, BURMESE_FONT, C, DISPLAY_FONT, LOGO_URL, MASTHEAD_URL, cls } from "./theme";

/** One mood per email family — sets the chip under the wordmark. */
export type EmailMood =
  | "confirmation"
  | "cancellation"
  | "refund"
  | "reminder"
  | "delivery"
  | "delivered"
  | "welcome"
  | "reward"
  | "winback"
  | "cart"
  | "auth"
  | "feedback";

interface BrandHeaderProps {
  emailType: EmailMood;
  variant?: "default" | "admin";
}

/** EN + bilingual MY mood line per email family. */
const TYPE_MOOD: Record<EmailMood, { emoji: string; greeting: string; my: string }> = {
  confirmation: {
    emoji: "🍜",
    greeting: "Your feast is on the way",
    my: "အော်ဒါ အတည်ပြုပြီးပါပြီ",
  },
  cancellation: {
    emoji: "🤲",
    greeting: "We're sorry to see this order go",
    my: "အော်ဒါ ပယ်ဖျက်ပြီးပါပြီ",
  },
  refund: {
    emoji: "🤝",
    greeting: "Your refund is being processed",
    my: "ပြန်အမ်းငွေ ဆောင်ရွက်နေပါသည်",
  },
  reminder: {
    emoji: "🔔",
    greeting: "Your delivery is coming soon",
    my: "ပို့ဆောင်ချိန် နီးကပ်လာပါပြီ",
  },
  delivery: { emoji: "🚗", greeting: "Out for delivery", my: "လမ်းမှာ ပို့ဆောင်နေပါပြီ" },
  delivered: {
    emoji: "✨",
    greeting: "Delivered — enjoy every bite",
    my: "ပို့ဆောင်ပြီး — အရသာခံစားပါ",
  },
  welcome: { emoji: "🌟", greeting: "Welcome to the family", my: "မိသားစုထဲ ကြိုဆိုပါတယ်" },
  reward: { emoji: "🎁", greeting: "A little thank-you, from us", my: "ကျေးဇူးတင်စကား လေးပါ" },
  winback: { emoji: "💛", greeting: "We've missed you", my: "သင့်ကို လွမ်းနေပါတယ်" },
  cart: {
    emoji: "🍲",
    greeting: "Your feast is still waiting",
    my: "သင့်ခြင်း စောင့်နေဆဲ ဖြစ်ပါတယ်",
  },
  auth: { emoji: "🔑", greeting: "Your sign-in link", my: "အကောင့်ဝင်ရန် လင့်ခ်" },
  feedback: {
    emoji: "🙏",
    greeting: "Thank you for writing to us",
    my: "စာရေးပေးတဲ့အတွက် ကျေးဇူးတင်ပါတယ်",
  },
};

/** The full Morning Star badge — rendered at its natural 3:2 ratio, never cropped. */
function BrandLogo({ width = 168 }: { width?: number }) {
  const height = Math.round(width * 0.64);
  return (
    <Img
      src={LOGO_URL}
      alt="Mandalay Morning Star"
      width={width}
      height={height}
      style={{
        display: "block",
        margin: "0 auto",
        width: `${width}px`,
        height: "auto",
        maxWidth: `${width}px`,
        objectFit: "contain" as const,
      }}
    />
  );
}

/** Compact single-row header for admin/ops mail. */
function AdminHeader() {
  return (
    <Section
      className={cls.line}
      style={{ padding: "16px 28px 14px 28px", borderBottom: `1px solid ${C.line}` }}
    >
      <table cellPadding="0" cellSpacing="0" role="presentation" style={{ width: "100%" }}>
        <tbody>
          <tr>
            <td style={{ width: "120px", verticalAlign: "middle" }}>
              <Img
                src={LOGO_URL}
                alt="Mandalay Morning Star"
                width={108}
                height={69}
                style={{ display: "block", width: "108px", height: "auto", objectFit: "contain" }}
              />
            </td>
            <td style={{ verticalAlign: "middle", textAlign: "right" as const }}>
              <Text
                className={cls.blueDeep}
                style={{
                  fontSize: "10px",
                  fontFamily: BODY_FONT,
                  fontWeight: 700,
                  color: C.blueDeep,
                  textTransform: "uppercase" as const,
                  letterSpacing: "2px",
                  margin: "0",
                }}
              >
                Operations {"·"} လုပ်ငန်းသုံး
              </Text>
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

export function BrandHeader({ emailType, variant = "default" }: BrandHeaderProps) {
  if (variant === "admin") return <AdminHeader />;

  const mood = TYPE_MOOD[emailType];

  return (
    <>
      {/* Thematic masthead — the warm menu photo as an editorial banner (the
          "appetite" cue + depth). Decorative; degrades to nothing if blocked. */}
      <Img
        src={MASTHEAD_URL}
        alt=""
        width={600}
        height={150}
        style={{
          display: "block",
          width: "100%",
          height: "150px",
          objectFit: "cover" as const,
          objectPosition: "center",
        }}
      />

      <Section
        className={`${cls.card} eml-dot`}
        style={{
          textAlign: "center" as const,
          padding: "28px 28px 0 28px",
          backgroundColor: C.paper,
        }}
      >
        <BrandLogo />

        {/* Bilingual greeting kicker */}
        <Text
          className={cls.accent}
          style={{
            fontSize: "11px",
            fontFamily: BURMESE_FONT,
            fontWeight: 700,
            color: C.accent,
            textTransform: "uppercase" as const,
            letterSpacing: "2.5px",
            margin: "14px 0 6px 0",
          }}
        >
          Mingalabar {"·"} မင်္ဂလာပါ
        </Text>

        {/* Wordmark */}
        <Heading
          as="h1"
          className={cls.ink}
          style={{
            color: C.ink,
            fontSize: "27px",
            fontFamily: DISPLAY_FONT,
            fontWeight: 600,
            margin: "0 0 6px 0",
            lineHeight: 1.2,
          }}
        >
          Mandalay Morning Star
        </Heading>

        {/* Tagline EN + MY */}
        <Text
          className={cls.muted}
          style={{
            color: C.inkMuted,
            fontSize: "13px",
            fontFamily: BODY_FONT,
            margin: "0 0 3px 0",
            letterSpacing: "0.3px",
          }}
        >
          Authentic Burmese cuisine {"—"} Los Angeles
        </Text>
        <Text
          className={cls.muted}
          lang="my"
          style={{
            color: C.inkMuted,
            fontSize: "12px",
            fontFamily: BURMESE_FONT,
            margin: "0 0 18px 0",
            lineHeight: 1.7,
          }}
        >
          စစ်မှန်သော မြန်မာ အရသာ {"·"} လော့စ်အိန်ဂျယ်လိစ်
        </Text>

        {/* Type-specific mood chip — bilingual */}
        <table cellPadding="0" cellSpacing="0" role="presentation" style={{ margin: "0 auto" }}>
          <tbody>
            <tr>
              <td
                className={cls.vellum}
                style={{
                  backgroundColor: C.vellum,
                  border: `1px solid ${C.line}`,
                  borderRadius: "999px",
                  padding: "8px 20px",
                }}
              >
                <Text
                  className={cls.ink}
                  style={{
                    color: C.ink,
                    fontSize: "14px",
                    fontFamily: BODY_FONT,
                    fontWeight: 600,
                    margin: "0",
                    lineHeight: 1.3,
                  }}
                >
                  {mood.emoji} {mood.greeting}
                </Text>
                <Text
                  className={cls.muted}
                  lang="my"
                  style={{
                    color: C.inkMuted,
                    fontSize: "11px",
                    fontFamily: BURMESE_FONT,
                    margin: "1px 0 0 0",
                    lineHeight: 1.5,
                  }}
                >
                  {mood.my}
                </Text>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Gold-leaf hairline into the content */}
        <table
          cellPadding="0"
          cellSpacing="0"
          role="presentation"
          style={{ width: "100%", marginTop: "24px" }}
        >
          <tbody>
            <tr>
              <td style={{ height: "1px", backgroundColor: C.goldLeaf, fontSize: 0 }} />
            </tr>
          </tbody>
        </table>
      </Section>
    </>
  );
}
