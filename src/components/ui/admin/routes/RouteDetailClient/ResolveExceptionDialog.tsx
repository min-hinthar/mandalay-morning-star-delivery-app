"use client";

/**
 * ResolveExceptionDialog
 * Collects required resolution notes (min 10 chars) before resolving a
 * delivery exception via PATCH /api/admin/routes/[id]/exceptions/[exceptionId].
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/textarea";

const MIN_NOTES = 10;

export interface ResolveExceptionDialogProps {
  open: boolean;
  onConfirm: (resolutionNotes: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ResolveExceptionDialog({
  open,
  onConfirm,
  onCancel,
  isLoading = false,
}: ResolveExceptionDialogProps) {
  const [notes, setNotes] = useState("");

  // Reset notes whenever the dialog reopens.
  useEffect(() => {
    if (open) setNotes("");
  }, [open]);

  const trimmed = notes.trim();
  const isValid = trimmed.length >= MIN_NOTES;

  return (
    <Modal
      isOpen={open}
      onClose={onCancel}
      title="Resolve Exception"
      size="sm"
      showCloseButton={false}
      closeOnSwipeDown={false}
    >
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Resolve Exception</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Record how this delivery exception was resolved. These notes are kept on the order’s
            audit trail.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="resolution-notes" className="text-sm font-medium text-text-primary">
            Resolution notes
          </label>
          <Textarea
            id="resolution-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Reached customer, redelivered same day."
            rows={4}
            disabled={isLoading}
            autoFocus
          />
          <p className="text-xs text-text-muted">
            {trimmed.length < MIN_NOTES ? `At least ${MIN_NOTES} characters required.` : " "}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(trimmed)}
            isLoading={isLoading}
            disabled={!isValid}
            className="flex-1"
          >
            Resolve
          </Button>
        </div>
      </div>
    </Modal>
  );
}
