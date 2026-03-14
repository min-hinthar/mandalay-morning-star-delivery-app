import { Button, Link, Section, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import { APP_URL, FONT_STACK, SERIF_STACK } from "./helpers";
import type { FeedbackCategory } from "@/types/feedback";

// ─── Types ────────────────────────────────────────────────
export interface AdminFeedbackAlertProps {
  feedbackId: string;
  category: FeedbackCategory;
  subject: string;
  message: string;
  customerEmail: string;
  hasScreenshot: boolean;
}

// ─── Category Labels ──────────────────────────────────────
const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug_report: "Bug Report",
  order_issue: "Order Issue",
  suggestion: "Suggestion",
  general: "General Feedback",
};

const CATEGORY_COLORS: Record<FeedbackCategory, string> = {
  bug_report: "#DC2626",
  order_issue: "#EA580C",
  suggestion: "#0D9488",
  general: "#6B7280",
};

// ─── Component ────────────────────────────────────────────
export function AdminFeedbackAlert({
  feedbackId,
  category,
  subject,
  message,
  customerEmail,
  hasScreenshot,
}: AdminFeedbackAlertProps) {
  const shortId = feedbackId.slice(0, 8).toUpperCase();
  const adminUrl = `${APP_URL}/admin/feedback`;

  return (
    <EmailLayout
      emailType="confirmation"
      previewText={`[Feedback] ${CATEGORY_LABELS[category]}: ${subject}`}
    >
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
          New Feedback Received
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
          A customer has submitted feedback that needs your attention.
        </Text>
      </Section>

      {/* Category Badge */}
      <Section
        style={{
          margin: "0 24px 16px 24px",
          padding: "8px 16px",
          backgroundColor: `${CATEGORY_COLORS[category]}10`,
          borderRadius: "8px",
          border: `1px solid ${CATEGORY_COLORS[category]}30`,
        }}
      >
        <Text
          style={{
            fontSize: "14px",
            fontFamily: FONT_STACK,
            fontWeight: 700,
            color: CATEGORY_COLORS[category],
            margin: "0",
          }}
        >
          {CATEGORY_LABELS[category]}
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
          Feedback ID
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
          From
        </Text>
        <Text
          style={{
            fontSize: "14px",
            fontFamily: FONT_STACK,
            color: "#111111",
            margin: "0 0 12px 0",
          }}
        >
          {customerEmail}
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
        <Text
          style={{
            fontSize: "14px",
            fontFamily: FONT_STACK,
            fontWeight: 700,
            color: "#111111",
            margin: "0 0 12px 0",
          }}
        >
          {subject}
        </Text>

        <Text
          style={{
            fontSize: "13px",
            fontFamily: FONT_STACK,
            color: "#6B7280",
            margin: "0 0 4px 0",
          }}
        >
          Message
        </Text>
        <Text
          style={{
            fontSize: "14px",
            fontFamily: FONT_STACK,
            color: "#111111",
            margin: "0",
            lineHeight: "1.5",
          }}
        >
          {message}
        </Text>

        {hasScreenshot && (
          <Text
            style={{
              fontSize: "13px",
              fontFamily: FONT_STACK,
              color: "#D4A017",
              margin: "12px 0 0 0",
              fontStyle: "italic",
            }}
          >
            Screenshot attached — view in admin panel
          </Text>
        )}
      </Section>

      {/* CTA */}
      <Section style={{ padding: "24px 24px 0 24px", textAlign: "center" as const }}>
        <Button
          href={adminUrl}
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
          View Feedback
        </Button>
      </Section>

      <Section style={{ padding: "12px 24px 24px 24px", textAlign: "center" as const }}>
        <Link
          href={`${APP_URL}/admin`}
          style={{
            fontSize: "14px",
            fontFamily: FONT_STACK,
            color: "#D4A017",
            textDecoration: "underline",
          }}
        >
          Go to Admin Dashboard
        </Link>
      </Section>
    </EmailLayout>
  );
}

export default AdminFeedbackAlert;
