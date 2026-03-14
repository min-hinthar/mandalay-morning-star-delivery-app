import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import { APP_URL, FONT_STACK, SERIF_STACK } from "./helpers";
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
    <EmailLayout emailType="confirmation" previewText={`We received your feedback — #${shortId}`}>
      {/* Header */}
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
          Thank You for Your Feedback
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
          We&apos;ve received your feedback and our team will review it shortly.
        </Text>
      </Section>

      {/* Details */}
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
          Reference
        </Text>
        <Text
          style={{
            fontSize: "16px",
            fontFamily: FONT_STACK,
            fontWeight: 700,
            color: "#111111",
            margin: "0 0 12px 0",
          }}
        >
          #{shortId}
        </Text>

        <Text
          style={{
            fontSize: "13px",
            fontFamily: FONT_STACK,
            color: "#6B7280",
            margin: "0 0 4px 0",
          }}
        >
          Category
        </Text>
        <Text
          style={{
            fontSize: "14px",
            fontFamily: FONT_STACK,
            color: "#111111",
            margin: "0 0 12px 0",
          }}
        >
          {CATEGORY_LABELS[category]}
        </Text>

        <Text
          style={{
            fontSize: "13px",
            fontFamily: FONT_STACK,
            color: "#6B7280",
            margin: "0 0 4px 0",
          }}
        >
          Subject
        </Text>
        <Text style={{ fontSize: "14px", fontFamily: FONT_STACK, color: "#111111", margin: "0" }}>
          {subject}
        </Text>
      </Section>

      {/* Next steps */}
      <Section style={{ padding: "0 24px 16px 24px" }}>
        <Text
          style={{
            fontSize: "14px",
            fontFamily: FONT_STACK,
            color: "#374151",
            margin: "0",
            lineHeight: "1.6",
          }}
        >
          We&apos;ll review your feedback and get back to you if needed. You can track the status of
          your feedback from your account page.
        </Text>
      </Section>

      {/* CTA — only for authenticated users */}
      {isAuthenticated && (
        <Section style={{ padding: "8px 24px 24px 24px", textAlign: "center" as const }}>
          <Button
            href={`${APP_URL}/account?tab=feedback`}
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
            View My Feedback
          </Button>
        </Section>
      )}
    </EmailLayout>
  );
}

export default FeedbackConfirmation;
