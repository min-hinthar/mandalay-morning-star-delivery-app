"use client";

/**
 * RestoreDefaultsDialog Component
 * Confirmation dialog for restoring settings to defaults.
 * Wraps ConfirmDialog with preset copy.
 */

import { ConfirmDialog } from "./ConfirmDialog";

export interface RestoreDefaultsDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isRestoring: boolean;
}

export function RestoreDefaultsDialog({
  open,
  onConfirm,
  onCancel,
  isRestoring,
}: RestoreDefaultsDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title="Restore Default Settings"
      description="Restore all settings to defaults? This can't be undone."
      confirmLabel="Restore Defaults"
      cancelLabel="Cancel"
      confirmVariant="destructive"
      onConfirm={onConfirm}
      onCancel={onCancel}
      isLoading={isRestoring}
    />
  );
}
