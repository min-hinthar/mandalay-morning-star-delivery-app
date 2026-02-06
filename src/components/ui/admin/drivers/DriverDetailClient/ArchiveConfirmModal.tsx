"use client";

import { m } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { Button } from "@/components/ui/button";

interface ArchiveConfirmModalProps {
  open: boolean;
  onClose: () => void;
  archiveReason: string;
  onReasonChange: (reason: string) => void;
  onArchive: () => void;
  archiving: boolean;
}

export function ArchiveConfirmModal({
  open,
  onClose,
  archiveReason,
  onReasonChange,
  onArchive,
  archiving,
}: ArchiveConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-surface-inverse/60"
        onClick={onClose}
      />
      <m.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={spring.default}
        className="relative bg-surface-primary rounded-card-sm border border-border p-6 w-full max-w-md shadow-xl"
      >
        <h2 className="text-xl font-display font-semibold text-text-primary mb-2">Archive Driver</h2>
        <p className="text-sm font-body text-text-secondary mb-6">
          This will deactivate the driver and hide them from active lists. This action can be reversed by
          reactivating the driver.
        </p>

        <div className="mb-6">
          <label className="text-sm font-body font-medium text-text-secondary block mb-1.5">
            Reason for archiving *
          </label>
          <textarea
            value={archiveReason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={3}
            className={cn(
              "w-full px-3 py-2 rounded-input",
              "bg-surface-secondary border border-border",
              "font-body text-text-primary",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            )}
            placeholder="Enter reason for archiving this driver"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onArchive}
            disabled={archiving || !archiveReason.trim()}
            className="bg-status-error hover:bg-status-error/90 text-text-inverse"
          >
            {archiving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Archiving...
              </>
            ) : (
              "Archive Driver"
            )}
          </Button>
        </div>
      </m.div>
    </div>
  );
}
