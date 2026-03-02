"use client";

import { Badge } from "@/components/ui/badge";
import {
  type EmailLogEntry,
  formatEmailDate,
  getErrorGuidance,
  STATUS_BADGE_MAP,
} from "./email-log-types";

// ===========================================
// TYPES
// ===========================================

interface EmailDetailPanelProps {
  email: EmailLogEntry;
}

// ===========================================
// COMPONENT
// ===========================================

export function EmailDetailPanel({ email }: EmailDetailPanelProps) {
  const guidance = getErrorGuidance(email.status, email.error_message);
  const events = email.metadata?.resend_events ?? [];
  const isFailed = email.status === "failed" || email.status === "bounced";

  return (
    <div className="px-4 py-3 bg-surface-secondary/30 border-t border-border-subtle space-y-3">
      {/* Error message + guidance */}
      {isFailed && (
        <div className="space-y-2">
          {email.error_message && (
            <div className="rounded-md bg-status-error/5 border border-status-error/20 px-3 py-2">
              <p className="text-xs font-medium text-status-error">Error</p>
              <p className="text-xs text-text-secondary mt-0.5">{email.error_message}</p>
            </div>
          )}
          {guidance && (
            <div className="rounded-md bg-secondary-light border border-secondary/20 px-3 py-2">
              <p className="text-xs font-medium text-secondary-hover">Guidance</p>
              <p className="text-xs text-text-secondary mt-0.5">{guidance}</p>
            </div>
          )}
        </div>
      )}

      {/* Retry count */}
      {email.retry_count != null && email.retry_count > 0 && (
        <div className="text-xs text-text-muted">Attempt {email.retry_count} of 3</div>
      )}

      {/* Webhook event timeline */}
      {events.length > 0 && (
        <div>
          <p className="text-xs font-medium text-text-secondary mb-1.5">Event Timeline</p>
          <div className="space-y-1">
            {events.map((event, i) => {
              const eventStatus = event.type.replace("email.", "");
              const variant = STATUS_BADGE_MAP[eventStatus] || "default";
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" />
                  <Badge variant={variant} size="sm" className="text-2xs">
                    {eventStatus}
                  </Badge>
                  <span className="text-2xs text-text-muted">{formatEmailDate(event.at)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No events fallback */}
      {events.length === 0 && !isFailed && (
        <p className="text-xs text-text-muted">No webhook events received yet</p>
      )}
    </div>
  );
}
