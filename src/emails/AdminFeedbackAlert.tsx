import { Section, Text } from "@react-email/components";
import {
  AdminCtas,
  AdminTitle,
  DataField,
  DataPanel,
  StatusPill,
  type PillTone,
} from "./components/AdminBits";
import { EmailLayout } from "./components/EmailLayout";
import { BODY_FONT, C, cls } from "./components/theme";
import { APP_URL } from "./helpers";
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

const CATEGORY_TONES: Record<FeedbackCategory, PillTone> = {
  bug_report: "error",
  order_issue: "warn",
  suggestion: "info",
  general: "neutral",
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
      variant="admin"
      showReferral={false}
      previewText={`[Feedback] ${CATEGORY_LABELS[category]}: ${subject}`}
    >
      {/* Header */}
      <AdminTitle
        title="New Feedback Received"
        subtitle="A customer has submitted feedback that needs your attention."
      />

      {/* Category Badge */}
      <Section style={{ padding: "0 28px 16px 28px" }}>
        <StatusPill tone={CATEGORY_TONES[category]}>{CATEGORY_LABELS[category]}</StatusPill>
      </Section>

      {/* Details */}
      <DataPanel>
        <DataField label="Feedback ID" bold>
          #{shortId}
        </DataField>
        <DataField label="From">{customerEmail}</DataField>
        <DataField label="Subject" bold>
          {subject}
        </DataField>
        <DataField label="Message" last>
          {message}
        </DataField>

        {hasScreenshot && (
          <Text
            className={cls.goldDeep}
            style={{
              fontSize: "13px",
              fontFamily: BODY_FONT,
              color: C.goldDeep,
              margin: "12px 0 0 0",
              fontStyle: "italic",
            }}
          >
            Screenshot attached — view in admin panel
          </Text>
        )}
      </DataPanel>

      {/* CTA + Dashboard Link */}
      <AdminCtas
        primaryHref={adminUrl}
        primaryLabel="View Feedback"
        secondaryHref={`${APP_URL}/admin`}
        secondaryLabel="Go to Admin Dashboard"
      />
    </EmailLayout>
  );
}

export default AdminFeedbackAlert;
