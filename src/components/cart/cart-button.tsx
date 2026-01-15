"use client";

import { ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/hooks/useCart";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface CartButtonProps {
  className?: string;
}

export function CartButton({ className }: CartButtonProps) {
  const { itemCount } = useCart();
  const { open } = useCartDrawer();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("relative", className)}
      onClick={open}
      aria-label={`Open cart with ${itemCount} items`}
    >
      <ShoppingCart className="h-5 w-5" />
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.span
            key={itemCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white"
          >
            {itemCount > 99 ? "99+" : itemCount}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
