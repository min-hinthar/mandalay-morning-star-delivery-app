/**
 * V2 Sprint 3: Support Actions Component
 *
 * Contact buttons for driver and support.
 * Shows appropriate actions based on order status.
 */

"use client";

import { motion } from "framer-motion";
import { Phone, MessageCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { OrderStatus } from "@/types/database";
import { Button } from "@/components/ui/button";

interface SupportActionsProps {
  driverPhone: string | null;
  orderStatus: OrderStatus;
  onContactSupport?: () => void;
  className?: string;
}

export function SupportActions({
  driverPhone,
  orderStatus,
  onContactSupport,
  className,
}: SupportActionsProps) {
  const canContactDriver =
    orderStatus === "out_for_delivery" && driverPhone !== null;

  const handleContactDriver = () => {
    if (driverPhone) {
      window.location.href = `tel:${driverPhone}`;
    }
  };

  const handleContactSupport = () => {
    if (onContactSupport) {
      onContactSupport();
    } else {
      // Default: open email
      window.location.href = "mailto:support@mandalaymorningstar.com?subject=Order Support";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={cn(
        "rounded-xl bg-white p-4 shadow-warm-sm",
        className
      )}
    >
      <p className="text-sm font-medium text-charcoal-600 mb-3">
        Need Help?
      </p>

      <div className="flex gap-3">
        {/* Contact Driver Button */}
        {canContactDriver && (
          <Button
            variant="outline"
            onClick={handleContactDriver}
            className="flex-1 h-12 border-jade-200 hover:bg-jade-50 hover:border-jade-300"
          >
            <Phone className="h-4 w-4 mr-2 text-jade-600" />
            <span className="text-jade-700">Call Driver</span>
          </Button>
        )}

        {/* Contact Support Button */}
        <Button
          variant="outline"
          onClick={handleContactSupport}
          className={cn(
            "h-12 border-charcoal-200 hover:bg-charcoal-50 hover:border-charcoal-300",
            canContactDriver ? "flex-1" : "w-full"
          )}
        >
          <HelpCircle className="h-4 w-4 mr-2 text-charcoal-500" />
          <span className="text-charcoal-600">Contact Support</span>
        </Button>
      </div>

      {/* Helper text */}
      <p className="mt-3 text-xs text-charcoal-400 text-center">
        {canContactDriver
          ? "Contact your driver directly for delivery questions"
          : orderStatus === "delivered"
          ? "Order delivered. Contact support if you have any issues"
          : "Our team is here to help with any questions"}
      </p>
    </motion.div>
  );
}

/**
 * Floating action button variant for mobile
 */
export function SupportFAB({
  onClick,
  className,
}: {
  onClick?: () => void;
  className?: string;
}) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.location.href = "mailto:support@mandalaymorningstar.com?subject=Order Support";
    }
  };

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className={cn(
        "fixed bottom-20 right-4 z-fixed",
        "flex h-14 w-14 items-center justify-center",
        "rounded-full bg-saffron shadow-lg",
        "text-white hover:bg-saffron-600",
        "transition-colors",
        className
      )}
      aria-label="Get help"
    >
      <MessageCircle className="h-6 w-6" />
    </motion.button>
  );
}
