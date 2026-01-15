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
      className="rounded-lg border border-border bg-card p-3"
    >
      <div className="flex gap-3">
        {item.imageUrl && (
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
            <Image
              src={item.imageUrl}
              alt={item.nameEn}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
        )}

        <div className="flex flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium text-foreground">{item.nameEn}</h4>
              {item.nameMy && (
                <p className="text-xs text-muted-foreground font-burmese">
                  {item.nameMy}
                </p>
              )}
            </div>
            <p className="font-medium">{formatPrice(itemTotal)}</p>
          </div>

          {item.modifiers.length > 0 && (
            <ul className="mt-1 text-xs text-muted-foreground">
              {item.modifiers.map((mod) => (
                <li key={`${mod.groupId}-${mod.optionId}`}>
                  {mod.optionName}
                  {mod.priceDeltaCents > 0 && (
                    <span className="ml-1">
                      (+{formatPrice(mod.priceDeltaCents)})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {item.notes && (
            <p className="mt-1 text-xs italic text-muted-foreground">
              Note: {item.notes}
            </p>
          )}

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleDecrement}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium">
                {item.quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleIncrement}
                disabled={item.quantity >= MAX_ITEM_QUANTITY}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => setShowConfirmRemove(true)}
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {showConfirmRemove && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 border-t border-border pt-3"
        >
          <p className="text-sm text-muted-foreground">Remove this item?</p>
          <div className="mt-2 flex gap-2">
            <Button variant="destructive" size="sm" onClick={handleRemove}>
              Remove
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmRemove(false)}
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}
    </motion.li>
  );
}
