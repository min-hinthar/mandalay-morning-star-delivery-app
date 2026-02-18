"use client";

import { AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { PendingInvite } from "./types";

interface RevokeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invite: PendingInvite | null;
  onConfirm: () => void;
}

export function RevokeDialog({ open, onOpenChange, invite, onConfirm }: RevokeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-surface-primary border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 font-display text-text-primary">
            <AlertCircle className="h-5 w-5 text-status-error" />
            Revoke Invite
          </AlertDialogTitle>
          <AlertDialogDescription className="font-body text-text-secondary">
            Are you sure you want to revoke the invite for{" "}
            <span className="font-medium text-text-primary">{invite?.email}</span>? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-border hover:bg-surface-tertiary">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-status-error hover:bg-status-error/90 text-text-inverse"
          >
            Revoke Invite
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
