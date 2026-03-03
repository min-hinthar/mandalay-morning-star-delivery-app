"use client";

import { RotateCcw, Loader2 } from "lucide-react";
import { m } from "framer-motion";
import { Button } from "@/components/ui/button";
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
import { useReorder } from "@/lib/hooks/useReorder";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";

interface ReorderButtonProps {
  orderId: string;
}

export function ReorderButton({ orderId }: ReorderButtonProps) {
  const {
    reorder,
    confirmReorder,
    cancelReorder,
    isLoading,
    showConfirmation,
    cartItemCount,
  } = useReorder();
  const { shouldAnimate } = useAnimationPreference();

  const shortId = orderId.slice(0, 8).toUpperCase();

  return (
    <>
      <m.div whileTap={shouldAnimate ? { scale: 0.95 } : undefined}>
        <Button
          variant="outline"
          onClick={() => reorder(orderId)}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RotateCcw className="h-4 w-4 mr-2" />
          )}
          Reorder
        </Button>
      </m.div>

      <AlertDialog open={showConfirmation} onOpenChange={(open) => !open && cancelReorder()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace cart?</AlertDialogTitle>
            <AlertDialogDescription>
              Replace {cartItemCount} item{cartItemCount !== 1 ? "s" : ""} in cart with order #
              {shortId}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelReorder}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmReorder()} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
