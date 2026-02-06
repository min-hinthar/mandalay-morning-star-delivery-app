"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Address } from "./types";

interface DeleteAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: Address | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteAddressDialog({
  open,
  onOpenChange,
  address,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteAddressDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Address</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this address? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {address && (
          <div className="py-4">
            <div className="bg-surface-secondary rounded-card-sm p-4">
              <p className="font-medium text-text-primary">
                {address.label || "Address"}
              </p>
              <p className="text-sm text-text-secondary">{address.line1}</p>
              <p className="text-sm text-text-secondary">
                {address.city}, {address.state} {address.postalCode}
              </p>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={isDeleting}
            isLoading={isDeleting}
          >
            Delete Address
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
