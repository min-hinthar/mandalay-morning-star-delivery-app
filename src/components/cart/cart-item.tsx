"use client";

import { useState, useCallback } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/hooks/useCart";
import { formatPrice } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import type { CartItem as CartItemType } from "@/types/cart";
import { MAX_ITEM_QUANTITY } from "@/types/cart";
import { cn } from "@/lib/utils/cn";

interface CartItemProps {
  item: CartItemType;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

const DELETE_THRESHOLD = -80;
const DELETE_BUTTON_WIDTH = 80;

/**
 * V4 Cart Item Component
 *
 * Features:
 * - Full design token usage
 * - Swipe-to-delete (mobile)
 * - Quantity controls with validation
 * - Modifiers and notes display
 * - Compact variant for bar display
 */
export function CartItem({ item, compact = false }: CartItemProps) {
  const { updateQuantity, removeItem, getItemTotal } = useCart();
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-DELETE_BUTTON_WIDTH, 0], [1, 0]);
  const deleteScale = useTransform(x, [-DELETE_BUTTON_WIDTH, -40, 0], [1, 0.8, 0.5]);

  const itemTotal = getItemTotal(item.cartItemId);

  const handleDecrement = useCallback(() => {
    if (item.quantity <= 1) {
      setShowConfirmRemove(true);
      return;
    }
    updateQuantity(item.cartItemId, item.quantity - 1);
  }, [item.cartItemId, item.quantity, updateQuantity]);

  const handleIncrement = useCallback(() => {
    updateQuantity(item.cartItemId, item.quantity + 1);
  }, [item.cartItemId, item.quantity, updateQuantity]);

  const handleRemove = useCallback(() => {
    removeItem(item.cartItemId);
    setShowConfirmRemove(false);
  }, [item.cartItemId, removeItem]);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);
      if (info.offset.x < DELETE_THRESHOLD) {
        handleRemove();
      }
    },
    [handleRemove]
  );

  // Image size based on compact mode
  const imageSize = compact ? 60 : 80;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden rounded-[var(--radius-lg)]"
    >
      {/* Delete button background (swipe-to-delete) */}
      <motion.div
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-[var(--color-error)]"
        style={{
          width: DELETE_BUTTON_WIDTH,
          opacity: deleteOpacity,
        }}
      >
        <motion.div style={{ scale: deleteScale }} className="flex flex-col items-center gap-1">
          <Trash2 className="h-5 w-5 text-white" />
          <span className="text-xs font-medium text-white">Delete</span>
        </motion.div>
      </motion.div>

      {/* Draggable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -DELETE_BUTTON_WIDTH, right: 0 }}
        dragElastic={{ left: 0.1, right: 0 }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={cn(
          "relative bg-[var(--color-surface)] shadow-[var(--shadow-sm)]",
          "border border-[var(--color-border)]",
          "rounded-[var(--radius-lg)]",
          "transition-shadow duration-[var(--duration-fast)]",
          !isDragging && "hover:shadow-[var(--shadow-md)]",
          compact ? "p-[var(--space-2)]" : "p-[var(--space-3)]"
        )}
      >
        <div className="flex gap-[var(--space-3)]">
          {/* Image */}
          <div
            className={cn(
              "relative flex-shrink-0 overflow-hidden rounded-[var(--radius-md)]",
              "bg-[var(--color-cream-darker)]"
            )}
            style={{ width: imageSize, height: imageSize }}
          >
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.nameEn}
                fill
                className="object-cover"
                sizes={`${imageSize}px`}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-xs text-[var(--color-charcoal-muted)]">No image</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col min-w-0">
            <div className="flex items-start justify-between gap-[var(--space-2)]">
              <div className="min-w-0">
                <h4 className={cn(
                  "font-semibold text-[var(--color-charcoal)] truncate",
                  compact ? "text-sm" : "text-base"
                )}>
                  {item.nameEn}
                </h4>
                {item.nameMy && !compact && (
                  <p className="text-xs text-[var(--color-charcoal-muted)] font-burmese truncate">
                    {item.nameMy}
                  </p>
                )}
              </div>
              <p className={cn(
                "font-bold text-[var(--color-primary)] flex-shrink-0",
                compact ? "text-sm" : "text-base"
              )}>
                {formatPrice(itemTotal)}
              </p>
            </div>

            {/* Modifiers */}
            {!compact && item.modifiers.length > 0 && (
              <ul className="mt-[var(--space-1-5)] space-y-[var(--space-0-5)]">
                {item.modifiers.map((mod) => (
                  <li
                    key={`${mod.groupId}-${mod.optionId}`}
                    className="text-xs text-[var(--color-charcoal-muted)] flex items-center gap-[var(--space-1)]"
                  >
                    <span className="w-1 h-1 rounded-full bg-[var(--color-charcoal-muted)]/50" />
                    <span>{mod.optionName}</span>
                    {mod.priceDeltaCents > 0 && (
                      <span className="text-[var(--color-primary)]/70">
                        (+{formatPrice(mod.priceDeltaCents)})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Notes */}
            {!compact && item.notes && (
              <p className={cn(
                "mt-[var(--space-1-5)] text-xs italic",
                "text-[var(--color-charcoal-muted)]",
                "bg-[var(--color-surface-muted)] px-[var(--space-2)] py-[var(--space-1)]",
                "rounded-[var(--radius-sm)]"
              )}>
                {item.notes}
              </p>
            )}

            {/* Quantity Controls */}
            <div className={cn(
              "flex items-center justify-between",
              compact ? "mt-[var(--space-2)]" : "mt-[var(--space-3)]"
            )}>
              <div className="flex items-center gap-[var(--space-1)]">
                <button
                  type="button"
                  onClick={handleDecrement}
                  className={cn(
                    "flex items-center justify-center rounded-full",
                    "border border-[var(--color-border)]",
                    "bg-[var(--color-surface)] text-[var(--color-charcoal)]",
                    "hover:bg-[var(--color-primary-bg)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)]",
                    "transition-all duration-[var(--duration-fast)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
                    compact ? "h-7 w-7" : "h-8 w-8"
                  )}
                  aria-label="Decrease quantity"
                >
                  <Minus className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
                </button>
                <span className={cn(
                  "text-center font-semibold text-[var(--color-charcoal)]",
                  compact ? "w-8 text-sm" : "w-10"
                )}>
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={item.quantity >= MAX_ITEM_QUANTITY}
                  className={cn(
                    "flex items-center justify-center rounded-full",
                    "border border-[var(--color-border)]",
                    "bg-[var(--color-surface)] text-[var(--color-charcoal)]",
                    "hover:bg-[var(--color-primary-bg)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)]",
                    "transition-all duration-[var(--duration-fast)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--color-surface)]",
                    compact ? "h-7 w-7" : "h-8 w-8"
                  )}
                  aria-label="Increase quantity"
                >
                  <Plus className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowConfirmRemove(true)}
                className={cn(
                  "flex items-center justify-center rounded-full",
                  "text-[var(--color-charcoal-muted)]",
                  "hover:text-[var(--color-error)] hover:bg-[var(--color-error-light)]",
                  "transition-all duration-[var(--duration-fast)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-error)]",
                  compact ? "h-7 w-7" : "h-8 w-8"
                )}
                aria-label="Remove item"
              >
                <Trash2 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
              </button>
            </div>
          </div>
        </div>

        {/* Remove Confirmation */}
        <AnimatePresence>
          {showConfirmRemove && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                "mt-[var(--space-3)] pt-[var(--space-3)]",
                "border-t border-[var(--color-border)]"
              )}
            >
              <p className="text-sm text-[var(--color-charcoal)] font-medium">Remove this item?</p>
              <div className="mt-[var(--space-2)] flex gap-[var(--space-2)]">
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
        </AnimatePresence>
      </motion.div>
    </motion.li>
  );
}
