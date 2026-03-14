"use client";

import { useState, type ReactNode } from "react";
import { Loader2, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/hooks/useToastV8";
import type { FeedbackStatus, FeedbackWithProfile } from "@/types/feedback";

// ============================================
// CONSTANTS
// ============================================

const STATUS_OPTIONS: { value: FeedbackStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "in_review", label: "In Review" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

// ============================================
// COMPONENT
// ============================================

interface FeedbackDetailPanelProps {
  feedback: FeedbackWithProfile;
  children: ReactNode;
}

export function FeedbackDetailPanel({ feedback, children }: FeedbackDetailPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [status, setStatus] = useState<FeedbackStatus>(feedback.status);
  const [adminNotes, setAdminNotes] = useState(feedback.admin_notes ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/admin/feedback/${feedback.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, admin_notes: adminNotes }),
      });

      if (!res.ok) {
        throw new Error("Failed to update");
      }

      toast({ message: "Feedback updated", type: "success" });
    } catch {
      toast({ message: "Failed to update feedback", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <tbody onClick={() => setIsExpanded(!isExpanded)}>{children}</tbody>

      {isExpanded && (
        <tbody>
          <tr>
            <td
              colSpan={5}
              className="border-b border-border-subtle bg-surface-secondary/30 px-6 py-4"
            >
              <div className="space-y-4 max-w-2xl">
                {/* Full message */}
                <div>
                  <Label className="text-xs font-medium text-text-muted mb-1 block">Message</Label>
                  <p className="text-sm text-text-primary whitespace-pre-wrap">
                    {feedback.message}
                  </p>
                </div>

                {/* Screenshot */}
                {feedback.screenshot_url && (
                  <div>
                    <Label className="text-xs font-medium text-text-muted mb-1 block">
                      Screenshot
                    </Label>
                    <Image
                      src={feedback.screenshot_url}
                      alt="Feedback screenshot"
                      width={400}
                      height={300}
                      className="rounded-card-sm border border-border-subtle object-contain max-h-64 w-auto"
                    />
                  </div>
                )}

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 text-xs text-text-muted">
                  {feedback.contact_email && <span>Email: {feedback.contact_email}</span>}
                  {feedback.page_url && <span>Page: {feedback.page_url}</span>}
                  {feedback.order_id && (
                    <Link
                      href={`/admin/orders/${feedback.order_id}`}
                      className="flex items-center gap-1 text-accent-teal hover:underline"
                    >
                      View Order <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                  {feedback.sentry_event_id && <span>Sentry: {feedback.sentry_event_id}</span>}
                </div>

                {/* Admin actions */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <Label
                      htmlFor={`status-${feedback.id}`}
                      className="text-xs font-medium text-text-muted mb-1 block"
                    >
                      Status
                    </Label>
                    <select
                      id={`status-${feedback.id}`}
                      value={status}
                      onChange={(e) => setStatus(e.target.value as FeedbackStatus)}
                      className={cn(
                        "w-full rounded-input border border-border-subtle px-3 py-2 text-sm",
                        "bg-surface-primary text-text-primary",
                        "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      )}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor={`notes-${feedback.id}`}
                    className="text-xs font-medium text-text-muted mb-1 block"
                  >
                    Admin Notes
                  </Label>
                  <Textarea
                    id={`notes-${feedback.id}`}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Internal notes or response to customer..."
                    rows={3}
                    className="w-full resize-none"
                  />
                </div>

                <Button onClick={handleSave} disabled={isSaving} size="sm">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </td>
          </tr>
        </tbody>
      )}
    </>
  );
}
