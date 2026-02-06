"use client";

import { m, AnimatePresence } from "framer-motion";
import { spring } from "@/lib/motion-tokens";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CancelModalProps {
  show: boolean;
  onClose: () => void;
  cancelReason: string;
  onCancelReasonChange: (reason: string) => void;
  onConfirm: () => void;
}

export function CancelModal({
  show,
  onClose,
  cancelReason,
  onCancelReasonChange,
  onConfirm,
}: CancelModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface-inverse/50"
          onClick={onClose}
        >
          <m.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={spring.default}
            className="bg-surface-primary rounded-card-md p-6 w-full max-w-md mx-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display font-bold text-lg text-text-primary mb-4">
              Cancel Order
            </h3>
            <Textarea
              placeholder="Reason for cancellation (required)..."
              value={cancelReason}
              onChange={(e) => onCancelReasonChange(e.target.value)}
              className="resize-none mb-4"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={onClose}>
                Back
              </Button>
              <Button
                variant="danger"
                onClick={onConfirm}
                disabled={cancelReason.length < 5}
              >
                Cancel Order
              </Button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
