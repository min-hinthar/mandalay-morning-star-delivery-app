"use client";

/**
 * DiscardChangesModal Component
 * Reusable modal for unsaved changes warning
 *
 * Offers three options:
 * 1. Cancel - stay on page, dismiss modal
 * 2. Discard - navigate away without saving
 * 3. Save Changes - save first, then navigate
 */

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { AlertTriangle } from "lucide-react";

// ===========================================
// TYPES
// ===========================================

export interface DiscardChangesModalProps {
  /** Whether modal is open */
  open: boolean;
  /** Called when user chooses to discard changes */
  onDiscard: () => void;
  /** Called when user chooses to save changes */
  onSave: () => void;
  /** Called when user cancels (stay on page) */
  onCancel: () => void;
  /** Whether save is in progress */
  isSaving?: boolean;
}

// ===========================================
// COMPONENT
// ===========================================

export function DiscardChangesModal({
  open,
  onDiscard,
  onSave,
  onCancel,
  isSaving = false,
}: DiscardChangesModalProps) {
  return (
    <Modal
      isOpen={open}
      onClose={onCancel}
      title="Discard changes?"
      size="sm"
      showCloseButton={false}
      closeOnSwipeDown={false}
    >
      <div className="space-y-4">
        {/* Header with icon */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-text-primary">
              Discard changes?
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              You have unsaved changes. Would you like to save them before leaving?
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
          {/* Cancel - stay on page */}
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>

          {/* Discard - navigate without saving */}
          <Button
            variant="ghost"
            onClick={onDiscard}
            disabled={isSaving}
            className="flex-1 sm:flex-none text-status-error hover:text-status-error hover:bg-status-error-bg"
          >
            Discard
          </Button>

          {/* Save - save then navigate */}
          <Button
            variant="primary"
            onClick={onSave}
            isLoading={isSaving}
            loadingText="Saving..."
            className="flex-1 sm:flex-none"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
