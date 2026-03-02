/**
 * DeliveryConfirmDialog - Confirmation for marking a stop as delivered
 *
 * "Mark as delivered at [address]?" with Cancel / Yes, Delivered buttons.
 * Used by SimpleStopView for DRV-02 requirement.
 */

"use client";

import { m, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useBodyScrollLock } from "@/lib/hooks/useBodyScrollLock";

interface DeliveryConfirmDialogProps {
  isOpen: boolean;
  address: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeliveryConfirmDialog({
  isOpen,
  address,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeliveryConfirmDialogProps) {
  const { restoreScrollPosition } = useBodyScrollLock(isOpen, { deferRestore: true });

  return (
    <AnimatePresence onExitComplete={restoreScrollPosition}>
      {isOpen && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
          onClick={isLoading ? undefined : onCancel}
        >
          <m.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-sm rounded-card bg-surface-primary p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center font-body text-lg font-medium text-text-primary">
              Mark as delivered at{" "}
              <span className="font-semibold">{address}</span>?
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={onCancel}
                disabled={isLoading}
                className={cn(
                  "flex min-h-[56px] flex-1 items-center justify-center rounded-card-sm",
                  "border-2 border-border font-body font-medium text-text-primary",
                  "transition-all duration-fast",
                  "hover:bg-surface-secondary",
                  "active:scale-[0.98]",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={cn(
                  "flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-card-sm",
                  "bg-green font-body font-semibold text-text-inverse shadow-md",
                  "transition-all duration-fast",
                  "hover:bg-green/90 hover:shadow-lg",
                  "active:scale-[0.98]",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Yes, Delivered"
                )}
              </button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
