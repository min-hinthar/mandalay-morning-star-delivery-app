"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PendingOrderActionsProps {
  orderId: string;
  isPastCutoff: boolean;
}

export function PendingOrderActions({ orderId, isPastCutoff }: PendingOrderActionsProps) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRetryPayment() {
    setIsRetrying(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}/retry-payment`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || "Failed to create payment session");
        return;
      }

      if (data.data?.sessionUrl) {
        window.location.href = data.data.sessionUrl;
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsRetrying(false);
    }
  }

  async function handleCancelOrder() {
    setIsCancelling(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || "Failed to cancel order");
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="space-y-4">
      {isPastCutoff && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Delivery cutoff has passed. You can cancel this order and place a new one for next week.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3 justify-center">
        {!isPastCutoff && (
          <Button
            onClick={handleRetryPayment}
            disabled={isRetrying || isCancelling}
            className="bg-jade hover:bg-jade/90"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {isRetrying ? "Loading..." : "Complete Payment"}
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              disabled={isRetrying || isCancelling}
              className="border-brand-red text-brand-red hover:bg-brand-red/10"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel Order
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The order will be permanently cancelled.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Order</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelOrder}
                className="bg-brand-red hover:bg-brand-red/90"
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel Order"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
