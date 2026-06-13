import { Section, Text } from "@react-email/components";

import { EmailButton } from "./components/EmailButton";
import { EmailLayout } from "./components/EmailLayout";
import { BODY_FONT, C, bodyStyle, cls, headingStyle, labelStyle } from "./components/theme";
import { APP_URL } from "./helpers";
import type { FeedbackCategory } from "@/types/feedback";

// ─── Types ────────────────────────────────────────────────
export interface FeedbackConfirmationProps {
  feedbackId: string;
  category: FeedbackCategory;
  subject: string;
  isAuthenticated: boolean;
}

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug_report: "Bug Report",
  order_issue: "Order Issue",
  suggestion: "Suggestion",
  general: "General Feedback",
};

// ─── Component ────────────────────────────────────────────
export function FeedbackConfirmation({
  feedbackId,
  category,
  subject,
  isAuthenticated,
}: FeedbackConfirmationProps) {
  const shortId = feedbackId.slice(0, 8).toUpperCase();

  return (
    <EmailLayout emailType="feedback" previewText={`We received your feedback — #${shortId}`}>
      {/* Header */}
      <Section style={{ padding: "30px 28px 0 28px" }}>
        <Text className={cls.ink} style={headingStyle(22)}>
          Thank You for Your Feedback
        </Text>
        <Text className={cls.muted} style={{ ...bodyStyle(15), margin: "0 0 24px 0" }}>
          We&apos;ve received your feedback and our team will review it shortly.
        </Text>
      </Section>

      {/* Details */}
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
          Reference
        </Text>
        <Text
          className={cls.ink}
          style={{
            fontSize: "16px",
            fontFamily: BODY_FONT,
            fontWeight: 700,
            color: C.ink,
            margin: "0 0 12px 0",
          }}
        >
          #{shortId}
        </Text>

        <Text className={cls.faint} style={labelStyle()}>
          Category
        </Text>
        <Text
          className={cls.ink}
          style={{
            fontSize: "14px",
            fontFamily: BODY_FONT,
            color: C.ink,
            margin: "0 0 12px 0",
          }}
        >
          {CATEGORY_LABELS[category]}
        </Text>

        <Text className={cls.faint} style={labelStyle()}>
          Subject
        </Text>
        <Text
          className={cls.ink}
          style={{ fontSize: "14px", fontFamily: BODY_FONT, color: C.ink, margin: "0" }}
        >
          {subject}
        </Text>
      </Section>

      {/* Next steps */}
      <Section style={{ padding: "0 28px 16px 28px" }}>
        <Text className={cls.muted} style={bodyStyle(14)}>
          We&apos;ll review your feedback and get back to you if needed. You can track the status of
          your feedback from your account page.
        </Text>
      </Section>

      {/* CTA — only for authenticated users */}
      {isAuthenticated && (
        <Section style={{ padding: "8px 28px 24px 28px", textAlign: "center" as const }}>
          <EmailButton href={`${APP_URL}/account?tab=feedback`}>View My Feedback</EmailButton>
        </Section>
      )}

      {/* close the card with breathing room */}
      <Section style={{ height: "8px" }} />
    </EmailLayout>
  );
}

export default FeedbackConfirmation;
