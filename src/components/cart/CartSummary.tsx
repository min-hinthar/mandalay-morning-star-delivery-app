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
    <div className={cn("space-y-4", className)}>
      {!hasFreeDelivery && (
        <FreeDeliveryProgress
          amountRemaining={amountToFreeDelivery}
          progressPercent={progressPercent}
        />
      )}

      <div className="space-y-2.5 text-sm">
        <SummaryLine label="Subtotal" value={formattedSubtotal} />
        <SummaryLine
          label="Delivery"
          value={hasFreeDelivery ? "FREE" : formattedDeliveryFee}
          valueClassName={hasFreeDelivery ? "text-emerald-600 font-semibold" : ""}
          icon={
            hasFreeDelivery ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Truck className="h-4 w-4 text-muted-foreground" />
            )
          }
        />
      </div>

      <div className="border-t border-border" />

      <div className="flex items-center justify-between">
        <span className="font-bold text-foreground">
          {showEstimate ? "Estimated Total" : "Total"}
        </span>
        <span className="text-xl font-bold text-primary">{formattedTotal}</span>
      </div>

      {showEstimate && (
        <p className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
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
    <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
      <div className="flex items-center gap-2">
        <Truck className="h-5 w-5 text-amber-600" />
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
          Add <span className="text-amber-700">{formatPrice(amountRemaining)}</span> more for{" "}
          <span className="font-bold text-primary">FREE delivery!</span>
        </p>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-amber-200/60 dark:bg-amber-900/50">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 dark:bg-amber-400"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
        Free delivery on orders $100+
      </p>
    </div>
  );
}
