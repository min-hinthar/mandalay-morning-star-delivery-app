"use client";

/**
 * ConfirmDialog Component
 * Generic confirmation dialog for tab-switch and discard warnings.
 * Uses the existing Modal component.
 */

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "destructive";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "destructive",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  const buttonVariant = confirmVariant === "destructive" ? "danger" : "primary";

  return (
    <Modal
      isOpen={open}
      onClose={onCancel}
      title={title}
      size="sm"
      showCloseButton={false}
      closeOnSwipeDown={false}
    >
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          <p className="mt-2 text-sm text-text-secondary">{description}</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading} className="flex-1">
            {cancelLabel}
          </Button>
          <Button
            variant={buttonVariant}
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
