"use client";

import { useState } from "react";
import { Loader2, Mail, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/lib/hooks/useToastV8";
import { extractErrorMessage } from "@/lib/utils/api-error";
import { STATUS_LABELS } from "@/components/ui/admin/orders/OrderDetailExpanded/config";
import type { OrderStatus } from "@/types/database";

// Email subject previews per transition
const EMAIL_SUBJECTS: Record<string, string> = {
  "pending->confirmed": "Your order has been confirmed",
  "confirmed->preparing": "Your order is being prepared",
  "preparing->out_for_delivery": "Your order is on its way",
  "out_for_delivery->delivered": "Your order has been delivered",
  cancelled: "Your order has been cancelled",
  "cancelled->pending": "Your order has been reopened",
  "delivered->out_for_delivery": "Order status update",
  "out_for_delivery->preparing": "Order status update",
  "preparing->confirmed": "Order status update",
  "confirmed->pending": "Order status update",
};

function getEmailSubject(currentStatus: OrderStatus, newStatus: OrderStatus): string {
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
  /** Amount that will be refunded if this cancellation is confirmed (0 = COD/unpaid). */
  refundOnCancelCents?: number;
  /** Optimistic (fires before the request). */
  onStatusChanged: (newStatus: OrderStatus) => void;
  /** Fires AFTER the mutation commits — safe to refetch without racing it. */
  onStatusSettled?: () => void;
  onStatusFailed: (previousStatus: OrderStatus) => void;
}

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function StatusChangeDialog({
  open,
  onClose,
  orderId,
  currentStatus,
  newStatus,
  customerEmail,
  refundOnCancelCents = 0,
  onStatusChanged,
  onStatusSettled,
  onStatusFailed,
}: StatusChangeDialogProps) {
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isCancellation = newStatus === "cancelled";
  const willRefund = isCancellation && refundOnCancelCents > 0;
  const emailSubject = getEmailSubject(currentStatus, newStatus);

  // The /cancel route requires a reason of at least 5 chars — enforce it here so
  // a too-short reason can't pass Confirm and then 400 with a cryptic error.
  const reasonTooShort = isCancellation && reason.trim().length > 0 && reason.trim().length < 5;
  const canSubmit = isCancellation ? reason.trim().length >= 5 : true;

  const handleConfirm = async () => {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      // Optimistic: notify parent immediately
      onStatusChanged(newStatus);

      // Route to dedicated endpoints: COD approval, and cancellation (the cancel
      // route refunds a paid order + sends the cancellation email; the generic
      // status route does neither).
      const isCodApproval = currentStatus === "pending_approval" && newStatus === "confirmed";
      let url = `/api/admin/orders/${orderId}/status`;
      let method = "PATCH";
      let body: Record<string, unknown> = {
        status: newStatus,
        notifyCustomer,
        reason: reason.trim() || undefined,
      };
      if (isCodApproval) {
        url = `/api/admin/orders/${orderId}/approve-cod`;
        method = "POST";
        body = {};
      } else if (isCancellation) {
        url = `/api/admin/orders/${orderId}/cancel`;
        method = "POST";
        body = { notifyCustomer, reason: reason.trim() };
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(extractErrorMessage(data, "Failed to update status"));
      }

      toast({
        message:
          isCancellation && data.refundIssued
            ? `Order cancelled — ${formatUsd(data.refundedCents ?? refundOnCancelCents)} refunded to the customer.`
            : isCancellation
              ? "Order cancelled."
              : `Order is now ${STATUS_LABELS[newStatus]}`,
        type: "success",
      });
      // Refetch now that the server has committed (audit rows, refund, timestamps).
      onStatusSettled?.();
      onClose();
    } catch (err) {
      // Revert optimistic update
      onStatusFailed(currentStatus);
      toast({
        message: err instanceof Error ? err.message : "Failed to update status",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Change Order Status" size="md">
      <div className="space-y-5">
        {/* Title */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Change Order Status</h3>
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
          <p className="text-sm font-medium text-text-primary">Subject: {emailSubject}</p>
          <p className="text-xs text-text-muted">To: {customerEmail}</p>
        </div>

        {/* Refund notice — so support knows exactly what the customer gets back */}
        {willRefund && (
          <div className="flex items-start gap-2 rounded-lg border border-status-warning/30 bg-status-warning-bg p-3">
            <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
            <p className="text-sm text-text-primary">
              This paid order will be refunded{" "}
              <strong>up to {formatUsd(refundOnCancelCents)}</strong> to the customer&apos;s
              original payment method (3–5 business days). This can&apos;t be undone.
            </p>
          </div>
        )}

        {/* Notify customer checkbox */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={notifyCustomer}
            onChange={(e) => setNotifyCustomer(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus-visible:ring-primary/30"
          />
          <span className="text-sm text-text-primary">Notify customer ({customerEmail})</span>
        </label>
        {willRefund && !notifyCustomer && (
          <p className="-mt-2 ml-7 text-xs text-text-muted">
            A refund notification is always emailed when money is returned, even if this is
            unchecked.
          </p>
        )}

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
              "w-full rounded-lg border bg-surface-primary px-3 py-2 text-sm",
              reasonTooShort ? "border-status-error" : "border-border",
              "text-text-primary placeholder:text-text-muted",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              "resize-none"
            )}
          />
          {isCancellation && (
            <p
              className={cn(
                "mt-1 text-xs",
                reasonTooShort ? "text-status-error" : "text-text-muted"
              )}
            >
              Please give a brief reason (at least 5 characters).
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={submitting} className="flex-1">
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
