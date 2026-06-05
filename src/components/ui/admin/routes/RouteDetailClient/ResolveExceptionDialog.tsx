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
import { cn } from "@/lib/utils/cn";

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
  // Only surface the validation error once the field is dirty — don't shout at a
  // pristine textarea. Drives the error color, the textarea ring, and aria-invalid.
  const showError = notes.length > 0 && !isValid;

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
          {/* Modal's `title` prop already renders an sr-only <h2> "Resolve Exception"
              that names the dialog; hide this visual duplicate from SR to avoid a
              double read-out. */}
          <h3 aria-hidden="true" className="text-lg font-semibold text-text-primary">
            Resolve Exception
          </h3>
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
            aria-invalid={showError}
            aria-describedby="resolution-notes-help"
            className={cn(showError && "border-destructive focus-visible:ring-destructive")}
          />
          <div className="flex items-center justify-between gap-2">
            {/* aria-live announces the requirement/valid transition to SR users —
                the disabled Resolve button alone gives no reason. Message text only
                flips at the validity boundary, so announcements stay quiet. */}
            <p
              id="resolution-notes-help"
              aria-live="polite"
              className={cn("text-xs", showError ? "text-destructive" : "text-text-muted")}
            >
              {isValid ? "Looks good." : `At least ${MIN_NOTES} characters required.`}
            </p>
            {/* Visual counter only — aria-hidden so it doesn't announce every keystroke. */}
            <span
              aria-hidden="true"
              className={cn(
                "text-xs tabular-nums",
                showError ? "text-destructive" : "text-text-muted"
              )}
            >
              {trimmed.length}/{MIN_NOTES}
            </span>
          </div>
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
