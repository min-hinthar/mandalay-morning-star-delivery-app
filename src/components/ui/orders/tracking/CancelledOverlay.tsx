/**
 * CancelledOverlay - Overlay for cancelled orders on tracking page
 *
 * Semi-transparent overlay on top of map showing cancellation reason
 * and next steps. Map stays visible behind the overlay.
 */

"use client";

import { m } from "framer-motion";
import { XCircle, Headphones, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface CancelledOverlayProps {
  cancellationReason: string | null;
  orderId: string;
  className?: string;
}

export function CancelledOverlay({
  cancellationReason,
  orderId,
  className,
}: CancelledOverlayProps) {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "absolute inset-0 z-10 flex items-center justify-center bg-charcoal/50 backdrop-blur-sm",
        className
      )}
    >
      <m.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
        className="mx-4 max-w-sm rounded-xl bg-surface-primary p-6 shadow-warm-md text-center space-y-4"
      >
        {/* Red cancelled badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-ruby-50 px-3 py-1.5">
          <XCircle className="h-4 w-4 text-ruby-500" />
          <span className="text-sm font-semibold text-ruby-600">
            Order Cancelled
          </span>
        </div>

        {/* Cancellation reason */}
        {cancellationReason && (
          <p className="text-sm text-charcoal-600">
            {cancellationReason}
          </p>
        )}

        {/* Next steps */}
        <p className="text-xs text-charcoal-400">
          Contact support for a refund or to place a new order.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <Link href={`/orders/${orderId}`}>
            <Button variant="primary" size="sm" className="w-full">
              <Headphones className="h-4 w-4" />
              Contact Support
            </Button>
          </Link>
          <Link href="/menu">
            <Button variant="ghost" size="sm" className="w-full">
              <UtensilsCrossed className="h-4 w-4" />
              Back to Menu
            </Button>
          </Link>
        </div>
      </m.div>
    </m.div>
  );
}
