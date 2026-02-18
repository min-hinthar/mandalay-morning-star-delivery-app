"use client";

import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { ALLERGEN_MAP } from "@/lib/constants/allergens";
import { cn } from "@/lib/utils/cn";

// ============================================
// ALLERGEN WARNING
// ============================================

export function AllergenWarning({ allergens }: { allergens: string[] }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg p-3",
        "border border-status-warning/30 bg-status-warning/10"
      )}
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-status-warning" />
      <div>
        <p className="font-medium text-text-primary">Allergen Information</p>
        <p className="text-sm text-text-secondary">
          Contains: {allergens.map((a) => ALLERGEN_MAP[a]?.label || a).join(", ")}
        </p>
      </div>
    </div>
  );
}

// ============================================
// DISCARD CHANGES DIALOG
// ============================================

export interface DiscardChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
}

export function DiscardChangesDialog({ open, onOpenChange, onDiscard }: DiscardChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard changes?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes to this item. Are you sure you want to discard them?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Editing</AlertDialogCancel>
          <AlertDialogAction onClick={onDiscard}>Discard</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ============================================
// EMOJI HELPER
// ============================================

/**
 * Get emoji placeholder for menu item based on category/tags
 */
export function getCategoryEmoji(category?: string): string {
  const emojiMap: Record<string, string> = {
    appetizers: "\uD83E\uDD5F",
    soups: "\uD83C\uDF72",
    salads: "\uD83E\uDD57",
    curries: "\uD83C\uDF5B",
    noodles: "\uD83C\uDF5C",
    rice: "\uD83C\uDF5A",
    seafood: "\uD83E\uDD90",
    meat: "\uD83E\uDD69",
    vegetarian: "\uD83E\uDD6C",
    desserts: "\uD83C\uDF70",
    drinks: "\uD83E\uDD64",
    specials: "\u2B50",
  };
  return emojiMap[category?.toLowerCase() ?? ""] ?? "\uD83C\uDF7D\uFE0F";
}
