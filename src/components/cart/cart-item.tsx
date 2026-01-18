"use client";

import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useCart } from "@/lib/hooks/useCart";
import { formatPrice } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import type { CartItem as CartItemType } from "@/types/cart";
import { MAX_ITEM_QUANTITY } from "@/types/cart";
import { cn } from "@/lib/utils/cn";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem, getItemTotal } = useCart();
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  const itemTotal = getItemTotal(item.cartItemId);

  const handleDecrement = () => {
    if (item.quantity <= 1) {
      setShowConfirmRemove(true);
      return;
    }
    updateQuantity(item.cartItemId, item.quantity - 1);
  };

  const handleIncrement = () => {
    updateQuantity(item.cartItemId, item.quantity + 1);
  };

  const handleRemove = () => {
    removeItem(item.cartItemId);
    setShowConfirmRemove(false);
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="group rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex gap-4">
        {/* Image */}
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-secondary/30">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.nameEn}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-xs text-muted-foreground">No image</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-semibold text-foreground truncate">
                {item.nameEn}
              </h4>
              {item.nameMy && (
                <p className="text-xs text-muted-foreground font-burmese truncate">
                  {item.nameMy}
                </p>
              )}
            </div>
            <p className="font-bold text-primary flex-shrink-0">
              {formatPrice(itemTotal)}
            </p>
          </div>

          {/* Modifiers */}
          {item.modifiers.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {item.modifiers.map((mod) => (
                <li
                  key={`${mod.groupId}-${mod.optionId}`}
                  className="text-xs text-muted-foreground flex items-center gap-1"
                >
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                  <span>{mod.optionName}</span>
                  {mod.priceDeltaCents > 0 && (
                    <span className="text-primary/70">
                      (+{formatPrice(mod.priceDeltaCents)})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Notes */}
          {item.notes && (
            <p className="mt-1.5 text-xs italic text-muted-foreground bg-muted/50 px-2 py-1 rounded">
              {item.notes}
            </p>
          )}

          {/* Quantity Controls */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full",
                  "hover:bg-primary/10 hover:border-primary/50 hover:text-primary",
                  "transition-all duration-200"
                )}
                onClick={handleDecrement}
                aria-label="Decrease quantity"
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="w-10 text-center font-semibold text-foreground">
                {item.quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full",
                  "hover:bg-primary/10 hover:border-primary/50 hover:text-primary",
                  "transition-all duration-200"
                )}
                onClick={handleIncrement}
                disabled={item.quantity >= MAX_ITEM_QUANTITY}
                aria-label="Increase quantity"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
              onClick={() => setShowConfirmRemove(true)}
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Remove Confirmation */}
      {showConfirmRemove && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 border-t border-border pt-4"
        >
          <p className="text-sm text-foreground font-medium">Remove this item?</p>
          <div className="mt-3 flex gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={handleRemove}
              className="flex-1"
            >
              Remove
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmRemove(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}
    </motion.li>
  );
}
