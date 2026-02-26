// Integration: Import and render <EmailHistory orderId={order.id} /> in the admin order detail page when it is created.
"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, ChevronDown, ChevronUp, RefreshCw, Send, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/hooks/useToastV8";
import { cn } from "@/lib/utils/cn";

// ===========================================
// TYPES
// ===========================================

interface EmailEntry {
  id: string;
  notification_type: string;
  subject: string;
  recipient: string;
  status: string;
  resend_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  metadata?: {
    resend_events?: Array<{ status: string; timestamp: string }>;
  };
}

interface EmailHistoryProps {
  orderId: string;
}

// ===========================================
// CONSTANTS
// ===========================================

const EMAIL_TYPE_OPTIONS = [
  { value: "order_confirmation", label: "Order Confirmation" },
  { value: "cancellation", label: "Cancellation" },
  { value: "refund", label: "Refund" },
  { value: "delivery_reminder", label: "Delivery Reminder" },
];

type StatusVariant =
  | "default"
  | "status-info"
  | "status-success"
  | "status-warning"
  | "status-error"
  | "secondary";

const STATUS_BADGE_MAP: Record<string, StatusVariant> = {
  pending: "default",
  sent: "status-info",
  delivered: "status-success",
  opened: "secondary",
  clicked: "status-info",
  failed: "status-error",
  bounced: "status-warning",
};

// ===========================================
// TYPE ICON MAPPING
// ===========================================

const TYPE_LABELS: Record<string, string> = {
  order_confirmation: "Confirmation",
  cancellation: "Cancellation",
  refund: "Refund",
  delivery_reminder: "Reminder",
  manual: "Manual",
};

// ===========================================
// COMPONENT
// ===========================================

export function EmailHistory({ orderId }: EmailHistoryProps) {
  const [emails, setEmails] = useState<EmailEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [showSendMenu, setShowSendMenu] = useState(false);
  const [sendingType, setSendingType] = useState<string | null>(null);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/emails?orderId=${encodeURIComponent(orderId)}`);
      if (!response.ok) throw new Error("Failed to fetch email history");
      const result = await response.json();
      setEmails(result.data || []);
    } catch {
      toast({
        message: "Failed to load email history",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleResend = useCallback(
    async (emailId: string) => {
      setResendingId(emailId);
      try {
        const response = await fetch(`/api/admin/emails/${emailId}/resend`, {
          method: "POST",
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to resend email");
        }
        toast({ message: "Email resent", type: "success" });
        fetchEmails();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to resend";
        toast({ message, type: "error" });
      } finally {
        setResendingId(null);
      }
    },
    [fetchEmails]
  );

  const handleManualSend = useCallback(
    async (emailType: string) => {
      setSendingType(emailType);
      setShowSendMenu(false);
      try {
        const response = await fetch("/api/admin/emails/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, emailType }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to send email");
        }
        toast({ message: "Email sent", type: "success" });
        fetchEmails();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to send";
        toast({ message, type: "error" });
      } finally {
        setSendingType(null);
      }
    },
    [orderId, fetchEmails]
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email History
        </h3>
        <Button variant="ghost" size="sm" onClick={fetchEmails} disabled={loading}>
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>

      {/* Email List */}
      {emails.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-text-muted">
          <Mail className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">No emails sent for this order</p>
        </div>
      ) : (
        <div className="space-y-2">
          {emails.map((email) => {
            const isExpanded = expandedId === email.id;
            return (
              <div
                key={email.id}
                className="rounded-card-sm border border-border-subtle overflow-hidden"
              >
                {/* Row */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : email.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-secondary/50 transition-colors"
                >
                  <Mail className="h-4 w-4 shrink-0 text-text-muted" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {email.subject}
                    </p>
                    <p className="text-xs text-text-muted">
                      {TYPE_LABELS[email.notification_type] || email.notification_type} &middot;{" "}
                      {formatDate(email.sent_at || email.created_at)}
                    </p>
                  </div>
                  <Badge variant={STATUS_BADGE_MAP[email.status] || "default"} size="sm">
                    {email.status}
                  </Badge>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-text-muted shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-text-muted shrink-0" />
                  )}
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-border-subtle bg-surface-secondary/30 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-text-muted">Recipient:</span>{" "}
                        <span className="text-text-primary">{email.recipient}</span>
                      </div>
                      {email.resend_id && (
                        <div>
                          <span className="text-text-muted">Resend ID:</span>{" "}
                          <span className="text-text-primary font-mono">{email.resend_id}</span>
                        </div>
                      )}
                    </div>

                    {/* Error message */}
                    {email.error_message && (
                      <div className="flex items-start gap-2 text-xs text-status-error bg-status-error-bg rounded px-2 py-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        {email.error_message}
                      </div>
                    )}

                    {/* Status Timeline */}
                    {email.metadata?.resend_events && email.metadata.resend_events.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-text-secondary">Status Timeline</p>
                        <div className="space-y-0.5">
                          {email.metadata.resend_events.map((event, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-xs text-text-muted"
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-text-muted shrink-0" />
                              <span className="capitalize">{event.status}</span>
                              <span>&middot;</span>
                              <span>{formatDate(event.timestamp)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resend button for failed emails */}
                    {email.status === "failed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={resendingId === email.id}
                        onClick={() => handleResend(email.id)}
                        className="text-xs"
                      >
                        {resendingId === email.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <RefreshCw className="h-3 w-3 mr-1" />
                        )}
                        Resend
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Send Button */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSendMenu(!showSendMenu)}
          disabled={sendingType !== null}
          className="w-full justify-center gap-2"
        >
          {sendingType ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Send Email
        </Button>

        {showSendMenu && (
          <div
            className={cn(
              "absolute bottom-full left-0 right-0 mb-1 z-10",
              "rounded-card-sm border border-border-subtle bg-surface-primary shadow-lg"
            )}
          >
            {EMAIL_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleManualSend(option.value)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-surface-secondary transition-colors first:rounded-t-card-sm last:rounded-b-card-sm"
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
