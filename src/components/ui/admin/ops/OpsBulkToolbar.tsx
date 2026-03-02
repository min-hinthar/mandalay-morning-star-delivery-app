"use client";

import { useState, useMemo, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/admin/settings/ConfirmDialog";
import { toast } from "@/lib/hooks/useToastV8";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { BULK_TRANSITIONS, type OpsOrder } from "./helpers";

// ============================================
// TYPES
// ============================================

export interface OpsBulkToolbarProps {
  selectedIds: Set<string>;
  orders: OpsOrder[];
  onComplete: () => void;
  onBulkStart: () => void;
  onBulkEnd: () => void;
  onClearSelection: () => void;
}

// ============================================
// HELPERS
// ============================================

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// COMPONENT
// ============================================

export function OpsBulkToolbar({
  selectedIds,
  orders,
  onComplete,
  onBulkStart,
  onBulkEnd,
  onClearSelection,
}: OpsBulkToolbarProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Determine common status of selected orders
  const { commonStatus, nextStatus, isMixed } = useMemo(() => {
    const selectedOrders = orders.filter((o) => selectedIds.has(o.id));
    if (selectedOrders.length === 0) {
      return { commonStatus: null, nextStatus: null, isMixed: false };
    }

    const statuses = new Set(selectedOrders.map((o) => o.status));
    if (statuses.size > 1) {
      return { commonStatus: null, nextStatus: null, isMixed: true };
    }

    const current = selectedOrders[0].status;
    const next = BULK_TRANSITIONS[current];
    return { commonStatus: current, nextStatus: next, isMixed: false };
  }, [selectedIds, orders]);

  const count = selectedIds.size;

  const handleBulkAction = useCallback(async () => {
    if (!nextStatus) return;

    setIsProcessing(true);
    onBulkStart();

    let succeeded = 0;
    let failed = 0;

    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/admin/orders/${id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus, notifyCustomer: true }),
        });
        if (res.ok) {
          succeeded++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }

      // 100ms delay between calls to avoid rate limiting
      await delay(100);
    }

    onBulkEnd();
    setIsProcessing(false);
    setShowConfirm(false);

    if (succeeded > 0) {
      toast({
        message: `${succeeded} order${succeeded !== 1 ? "s" : ""} moved to ${formatStatusLabel(nextStatus)}`,
        type: "success",
      });
    }
    if (failed > 0) {
      toast({
        message: `${failed} order${failed !== 1 ? "s" : ""} failed to update`,
        type: "error",
      });
    }

    onComplete();
  }, [selectedIds, nextStatus, onBulkStart, onBulkEnd, onComplete]);

  return (
    <AnimatePresence>
      {count > 0 && (
        <m.div
          initial={shouldAnimate ? { y: 80, opacity: 0 } : undefined}
          animate={shouldAnimate ? { y: 0, opacity: 1 } : undefined}
          exit={shouldAnimate ? { y: 80, opacity: 0 } : undefined}
          transition={getSpring(spring.default)}
          className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-border bg-surface-primary px-4 py-3 shadow-elevated"
        >
          {/* Selection count */}
          <span className="text-sm font-medium text-text-secondary">{count} selected</span>

          {/* Action button or mixed status message */}
          {isMixed ? (
            <span className="text-sm text-text-muted">
              Mixed statuses &mdash; select same status
            </span>
          ) : nextStatus ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowConfirm(true)}
              disabled={isProcessing}
            >
              Move {count} to {formatStatusLabel(nextStatus)}
            </Button>
          ) : commonStatus ? (
            <span className="text-sm text-text-muted">No further transition available</span>
          ) : null}

          {/* Clear selection button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            aria-label="Clear selection"
            className="ml-1"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Confirmation dialog */}
          {commonStatus && nextStatus && (
            <ConfirmDialog
              open={showConfirm}
              title="Confirm Bulk Status Change"
              description={`Move ${count} order${count !== 1 ? "s" : ""} from ${formatStatusLabel(commonStatus)} to ${formatStatusLabel(nextStatus)}?`}
              confirmLabel={`Move ${count} order${count !== 1 ? "s" : ""}`}
              confirmVariant="primary"
              onConfirm={() => void handleBulkAction()}
              onCancel={() => setShowConfirm(false)}
              isLoading={isProcessing}
            />
          )}
        </m.div>
      )}
    </AnimatePresence>
  );
}
