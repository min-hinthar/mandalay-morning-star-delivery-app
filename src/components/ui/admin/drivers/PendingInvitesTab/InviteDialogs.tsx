"use client";

import {
  AlertCircle,
  Link,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
            <span className="font-medium text-text-primary">
              {invite?.email}
            </span>
            ? This action cannot be undone.
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

interface MagicLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  magicLink: string | null;
  email: string | null;
  copied: boolean;
  onCopyLink: () => void;
}

export function MagicLinkDialog({
  open,
  onOpenChange,
  magicLink,
  email,
  copied,
  onCopyLink,
}: MagicLinkDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-surface-primary border-border max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 font-display text-text-primary">
            <Link className="h-5 w-5 text-primary" />
            Invite Link Generated
          </AlertDialogTitle>
          <AlertDialogDescription className="font-body text-text-secondary">
            Share this link with{" "}
            <span className="font-medium text-text-primary">
              {email}
            </span>{" "}
            to let them complete driver registration.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={magicLink || ""}
              className="flex-1 px-3 py-2 text-sm bg-surface-secondary border border-border rounded-input font-mono truncate"
            />
            <Button
              onClick={onCopyLink}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="mt-2 text-xs text-text-muted">
            This link expires in 24 hours. The recipient should open it in a browser where they are not already logged in.
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-border hover:bg-surface-tertiary">
            Close
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onCopyLink}
            className="bg-primary hover:bg-primary/90 text-text-inverse"
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Link
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
