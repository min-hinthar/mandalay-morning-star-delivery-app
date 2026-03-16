/**
 * DeclineConfirmDialog - Confirmation dialog for declining a route
 *
 * "Decline Route?" with optional reason textarea, Cancel / Decline buttons.
 * Follows DeliveryConfirmDialog pattern (wraps AnimatePresence + m.div directly).
 */

"use client";

import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";

interface DeclineConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason?: string) => void;
  isLoading: boolean;
}

export function DeclineConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: DeclineConfirmDialogProps) {
  const [reason, setReason] = useState("");
  const { restoreScrollPosition } = useBodyScrollLock(open, { deferRestore: true });

  // Reset reason when dialog closes
  useEffect(() => {
    if (!open) {
      setReason("");
    }
  }, [open]);

  return (
    <AnimatePresence onExitComplete={restoreScrollPosition}>
      {open && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
          onClick={isLoading ? undefined : () => onOpenChange(false)}
        >
          <m.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-sm rounded-card bg-surface-primary p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-center font-display text-xl font-semibold text-text-primary">
              Decline Route?
            </h2>
            <p className="mt-2 text-center font-body text-sm text-text-muted">
              This route will be unassigned and the admin will be notified.
            </p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional)"
              maxLength={500}
              rows={3}
              className={cn(
                "mt-4 w-full resize-none rounded-card-sm border border-border bg-surface-secondary p-3",
                "font-body text-sm text-text-primary placeholder:text-text-muted",
                "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              )}
            />

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className={cn(
                  "flex min-h-[48px] flex-1 items-center justify-center rounded-card-sm",
                  "border-2 border-border font-body font-medium text-text-primary",
                  "transition-all duration-fast",
                  "hover:bg-surface-secondary",
                  "active:scale-[0.98]",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                Keep Route
              </button>
              <button
                onClick={() => onConfirm(reason.trim() || undefined)}
                disabled={isLoading}
                className={cn(
                  "flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-card-sm",
                  "bg-status-error font-body font-semibold text-text-inverse shadow-md",
                  "transition-all duration-fast",
                  "hover:brightness-110 hover:shadow-lg",
                  "active:scale-[0.98]",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Decline Route"}
              </button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
