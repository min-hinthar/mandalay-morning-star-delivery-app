"use client";

/**
 * SaveConfirmDialog Component
 * Shows a diff table of changed delivery settings before saving.
 * Renders old -> new values for each changed field with warnings for unusual values.
 */

import { ArrowRight, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import type { SettingsChange } from "./delivery-helpers";

interface SaveConfirmDialogProps {
  open: boolean;
  changes: SettingsChange[];
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SaveConfirmDialog({
  open,
  changes,
  onConfirm,
  onCancel,
  isLoading = false,
}: SaveConfirmDialogProps) {
  const hasZeroDeliveryFee = changes.some(
    (c) => c.field === "Base Delivery Fee" && c.newValue === "$0.00"
  );
  const hasChanges = changes.length > 0;

  return (
    <Modal
      isOpen={open}
      onClose={onCancel}
      title="Confirm Settings Changes"
      size="md"
      showCloseButton={false}
      closeOnSwipeDown={false}
    >
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Confirm Settings Changes</h3>
          <p className="mt-1 text-sm text-text-secondary">
            {hasChanges
              ? "Review the following changes before saving."
              : "No changes to save."}
          </p>
        </div>

        {hasChanges && (
          <div className="rounded-card-sm border border-border-subtle overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-secondary text-text-secondary text-left">
                  <th className="px-3 py-2 font-medium">Setting</th>
                  <th className="px-3 py-2 font-medium">Old</th>
                  <th className="px-3 py-2 font-medium sr-only">Arrow</th>
                  <th className="px-3 py-2 font-medium">New</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((change) => (
                  <tr
                    key={change.field}
                    className="border-t border-border-subtle bg-surface-secondary/30"
                  >
                    <td className="px-3 py-2 font-medium text-text-primary">{change.field}</td>
                    <td className="px-3 py-2 text-text-muted line-through">{change.oldValue}</td>
                    <td className="px-2 py-2 text-text-muted">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </td>
                    <td className="px-3 py-2 font-medium text-primary">{change.newValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {hasZeroDeliveryFee && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-card-sm bg-yellow-50 border border-yellow-200 text-sm">
            <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
            <span className="text-yellow-700">
              Warning: $0 delivery fee means all deliveries are free
            </span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={!hasChanges}
            className="flex-1"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
