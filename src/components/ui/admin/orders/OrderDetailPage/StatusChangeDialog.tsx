"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/lib/hooks/useToast";
import { STATUS_LABELS } from "@/components/ui/admin/orders/OrderDetailExpanded/config";
import type { OrderStatus } from "@/types/database";

// Email subject previews per transition
const EMAIL_SUBJECTS: Record<string, string> = {
  "pending->confirmed": "Your order has been confirmed",
  "confirmed->preparing": "Your order is being prepared",
  "preparing->out_for_delivery": "Your order is on its way",
  "out_for_delivery->delivered": "Your order has been delivered",
  cancelled: "Your order has been cancelled",
};

function getEmailSubject(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): string {
  if (newStatus === "cancelled") return EMAIL_SUBJECTS["cancelled"];
  const key = `${currentStatus}->${newStatus}`;
  return EMAIL_SUBJECTS[key] || `Order status updated to ${STATUS_LABELS[newStatus]}`;
}

interface StatusChangeDialogProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  currentStatus: OrderStatus;
  newStatus: OrderStatus;
  customerEmail: string;
  onStatusChanged: (newStatus: OrderStatus) => void;
  onStatusFailed: (previousStatus: OrderStatus) => void;
}

export function StatusChangeDialog({
  open,
  onClose,
  orderId,
  currentStatus,
  newStatus,
  customerEmail,
  onStatusChanged,
  onStatusFailed,
}: StatusChangeDialogProps) {
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isCancellation = newStatus === "cancelled";
  const emailSubject = getEmailSubject(currentStatus, newStatus);

  const canSubmit = isCancellation ? reason.trim().length > 0 : true;

  const handleConfirm = async () => {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      // Optimistic: notify parent immediately
      onStatusChanged(newStatus);

      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          notifyCustomer,
          reason: reason.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }

      toast({
        title: "Status updated",
        description: `Order is now ${STATUS_LABELS[newStatus]}`,
      });
      onClose();
    } catch (err) {
      // Revert optimistic update
      onStatusFailed(currentStatus);
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Change Order Status"
      size="md"
    >
      <div className="space-y-5">
        {/* Title */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            Change Order Status
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            {STATUS_LABELS[currentStatus]} &rarr;{" "}
            <span className="font-medium">{STATUS_LABELS[newStatus]}</span>
          </p>
        </div>

        {/* Email preview */}
        <div className="rounded-lg border border-border bg-surface-secondary/50 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
            <Mail className="h-3.5 w-3.5" />
            Email Preview
          </div>
          <p className="text-sm font-medium text-text-primary">
            Subject: {emailSubject}
          </p>
          <p className="text-xs text-text-muted">
            To: {customerEmail}
          </p>
        </div>

        {/* Notify customer checkbox */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={notifyCustomer}
            onChange={(e) => setNotifyCustomer(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
          />
          <span className="text-sm text-text-primary">
            Notify customer ({customerEmail})
          </span>
        </label>

        {/* Reason text area */}
        <div>
          <label
            htmlFor="status-reason"
            className="block text-sm font-medium text-text-secondary mb-1"
          >
            Reason{isCancellation ? " (required)" : " (optional)"}
          </label>
          <textarea
            id="status-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              isCancellation
                ? "Reason for cancellation (required)"
                : "Reason for status change (optional)"
            }
            rows={3}
            className={cn(
              "w-full rounded-lg border border-border bg-surface-primary px-3 py-2 text-sm",
              "text-text-primary placeholder:text-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-primary/30",
              "resize-none"
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant={isCancellation ? "danger" : "primary"}
            onClick={handleConfirm}
            disabled={submitting || !canSubmit}
            className="flex-1"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {isCancellation ? "Cancel Order" : "Confirm"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
