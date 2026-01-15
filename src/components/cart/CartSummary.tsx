"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Check, Info, Truck } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { FREE_DELIVERY_THRESHOLD_CENTS } from "@/types/cart";

interface CartSummaryProps {
  className?: string;
  showEstimate?: boolean;
}

export function CartSummary({ className, showEstimate = true }: CartSummaryProps) {
  const {
    itemsSubtotal,
    estimatedDeliveryFee,
    formattedSubtotal,
    formattedDeliveryFee,
    formattedTotal,
    amountToFreeDelivery,
  } = useCart();

  const hasFreeDelivery = estimatedDeliveryFee === 0;
  const progressPercent = Math.min(
    (itemsSubtotal / FREE_DELIVERY_THRESHOLD_CENTS) * 100,
    100
  );

  return (
    <div className={cn("space-y-3", className)}>
      {!hasFreeDelivery && (
        <FreeDeliveryProgress
          amountRemaining={amountToFreeDelivery}
          progressPercent={progressPercent}
        />
      )}

      <div className="space-y-2 text-sm">
        <SummaryLine label="Subtotal" value={formattedSubtotal} />
        <SummaryLine
          label="Delivery"
          value={hasFreeDelivery ? "FREE" : formattedDeliveryFee}
          valueClassName={hasFreeDelivery ? "text-green-600 font-medium" : ""}
          icon={
            hasFreeDelivery ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Truck className="h-4 w-4 text-muted-foreground" />
            )
          }
        />
      </div>

      <div className="border-t border-border" />

      <div className="flex items-center justify-between">
        <span className="font-semibold">
          {showEstimate ? "Estimated Total" : "Total"}
        </span>
        <span className="text-lg font-bold">{formattedTotal}</span>
      </div>

      {showEstimate && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span>Final total calculated at checkout. Tax not included.</span>
        </p>
      )}
    </div>
  );
}

interface SummaryLineProps {
  label: string;
  value: string;
  valueClassName?: string;
  icon?: ReactNode;
}

function SummaryLine({ label, value, valueClassName, icon }: SummaryLineProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className={valueClassName}>{value}</span>
    </div>
  );
}

interface FreeDeliveryProgressProps {
  amountRemaining: number;
  progressPercent: number;
}

function FreeDeliveryProgress({
  amountRemaining,
  progressPercent,
}: FreeDeliveryProgressProps) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
        Add {formatPrice(amountRemaining)} more for{" "}
        <span className="font-bold">FREE delivery!</span>
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-amber-200/60 dark:bg-amber-900/50">
        <motion.div
          className="h-full bg-amber-500 dark:bg-amber-400"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
        Free delivery on orders $100+
      </p>
    </div>
  );
}
