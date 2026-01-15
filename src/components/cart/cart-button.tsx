"use client";

import { ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/hooks/useCart";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import { cn } from "@/lib/utils/cn";

interface CartButtonProps {
  className?: string;
}

export function CartButton({ className }: CartButtonProps) {
  const { itemCount } = useCart();
  const { open } = useCartDrawer();

  return (
    <motion.button
      onClick={open}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative flex h-11 w-11 items-center justify-center rounded-full",
        "bg-secondary/50 text-foreground",
        "transition-colors duration-200",
        "hover:bg-primary hover:text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className
      )}
      aria-label={`Open cart with ${itemCount} items`}
    >
      <ShoppingCart className="h-5 w-5" />
      <AnimatePresence mode="wait">
        {itemCount > 0 && (
          <motion.span
            key={itemCount}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className={cn(
              "absolute -right-1 -top-1 flex items-center justify-center",
              "min-w-[22px] h-[22px] px-1.5 rounded-full",
              "bg-primary text-[11px] font-bold text-white",
              "shadow-lg ring-2 ring-background"
            )}
          >
            {itemCount > 99 ? "99+" : itemCount}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
