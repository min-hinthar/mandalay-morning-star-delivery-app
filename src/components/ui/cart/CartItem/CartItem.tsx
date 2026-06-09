"use client";

import { memo, useState, useCallback, useRef, useEffect, type CSSProperties } from "react";
import Image from "next/image";
import { m, AnimatePresence, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Trash2, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { useCart } from "@/lib/hooks/useCart";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { QuantitySelector } from "../QuantitySelector";
import type { CartItem as CartItemType, CartItemValidationStatus } from "@/types/cart";
import { triggerHaptic, getFallbackEmoji } from "./helpers";
import { TapBurst, useTapBurst } from "@/components/ui/TapBurst";
import { SwipeDeleteIndicator } from "./SwipeDeleteIndicator";
import { ValidationOverlay } from "./ValidationOverlay";
import { PriceChangeBadge } from "./PriceChangeBadge";

export interface CartItemProps {
  item: CartItemType;
  onEdit?: (item: CartItemType) => void;
  compact?: boolean;
  className?: string;
  /** When true, shows a one-time swipe hint bounce animation */
  isFirstItem?: boolean;
  /** Cycles the left ledger-spine accent (clay → blue → sage), tying the line to the receipt. */
  accentIndex?: number;
  // Validation props (optional -- only provided when validation is active)
  validationStatus?: CartItemValidationStatus;
  priceDirection?: "up" | "down";
  newPriceCents?: number;
  onDismissPriceChange?: () => void;
  onRemoveStale?: () => void;
}

// Simplified animation variants to prevent mobile crashes
const cartItemVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50, transition: { duration: 0.15 } },
};

// Triad ledger-spine accents (mirror the receipt's bound-ledger spine).
const SPINE = ["var(--hero-clay)", "var(--hero-blue)", "var(--hero-sage)"] as const;

export const CartItem = memo(function CartItem({
  item,
  onEdit,
  compact = false,
  className,
  isFirstItem,
  accentIndex = 0,
  validationStatus,
  priceDirection,
  onDismissPriceChange,
  onRemoveStale,
}: CartItemProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const { updateQuantity, removeItem, getItemTotal } = useCart();
  const containerRef = useRef<HTMLDivElement>(null);
  const { fireKey: burstKey, fire: fireBurst } = useTapBurst();

  const isStale = validationStatus === "sold-out" || validationStatus === "unavailable";
  const hasPriceChange = validationStatus === "price-changed";

  const dragX = useMotionValue(0);
  const swipeProgress = useTransform(dragX, [-150, 0], [1, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeValue, setSwipeValue] = useState(0);
  const [imgError, setImgError] = useState(false);

  // Swipe hint state (one-time bounce on first cart item)
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  useEffect(() => {
    if (!isFirstItem || !shouldAnimate) return;

    // One-time hint gated on localStorage flag
    try {
      if (localStorage.getItem("swipeHintSeen")) return;
    } catch {
      return; // SSR or storage blocked
    }

    // Delay 800ms after mount for discoverability
    const timer = setTimeout(() => {
      setShowSwipeHint(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [isFirstItem, shouldAnimate]);

  // Mark hint as seen after animation completes
  const handleSwipeHintComplete = useCallback(() => {
    setShowSwipeHint(false);
    try {
      localStorage.setItem("swipeHintSeen", "1");
    } catch {
      // Storage blocked
    }
  }, []);

  useEffect(() => {
    const unsubscribe = swipeProgress.on("change", setSwipeValue);
    return unsubscribe;
  }, [swipeProgress]);

  const itemTotal = getItemTotal(item.cartItemId);
  const springConfig = getSpring(spring.gentle);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);
      // Guard against interrupted gestures
      if (!info?.offset || !info?.velocity) return;
      if (info.offset.x < -100 || info.velocity.x < -500) {
        triggerHaptic("heavy");
        removeItem(item.cartItemId);
      }
    },
    [item.cartItemId, removeItem]
  );

  const handleIncrement = useCallback(() => {
    // Kit micro-celebration: light haptic + triad tap-burst on "one more"
    triggerHaptic("light");
    fireBurst();
    updateQuantity(item.cartItemId, item.quantity + 1);
  }, [item.cartItemId, item.quantity, updateQuantity, fireBurst]);

  const handleDecrement = useCallback(() => {
    if (item.quantity === 1) {
      triggerHaptic("medium");
      removeItem(item.cartItemId);
    } else {
      updateQuantity(item.cartItemId, item.quantity - 1);
    }
  }, [item.cartItemId, item.quantity, updateQuantity, removeItem]);

  const handleRemove = useCallback(() => {
    triggerHaptic("medium");
    removeItem(item.cartItemId);
  }, [item.cartItemId, removeItem]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        triggerHaptic("medium");
        removeItem(item.cartItemId);
        // Undo toast is now shown by removeItem in cart-store
      }
    },
    [item.cartItemId, removeItem]
  );

  return (
    <m.div
      ref={containerRef}
      variants={shouldAnimate ? cartItemVariants : undefined}
      initial={shouldAnimate ? "initial" : undefined}
      animate={shouldAnimate ? "animate" : undefined}
      exit={shouldAnimate ? "exit" : undefined}
      transition={springConfig}
      className={cn("relative", className)}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="group"
      aria-label={`${item.nameEn}, quantity ${item.quantity}`}
    >
      <AnimatePresence>
        {isDragging && <SwipeDeleteIndicator progress={swipeValue} />}
      </AnimatePresence>

      <m.div
        drag={shouldAnimate && !isStale ? "x" : false}
        dragConstraints={{ left: -150, right: 0 }}
        dragElastic={{ left: 0.1, right: 0 }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x: dragX }}
        className={cn(
          "cart-line relative overflow-hidden rounded-2xl",
          "border border-border bg-surface-elevated",
          "touch-pan-y",
          compact ? "p-3" : "p-4"
        )}
        whileHover={shouldAnimate && !isDragging && !isStale ? { y: -2 } : undefined}
        animate={showSwipeHint ? { x: [0, -30, 0] } : undefined}
        transition={showSwipeHint ? spring.ultraBouncy : springConfig}
        onAnimationComplete={() => {
          if (showSwipeHint) handleSwipeHintComplete();
        }}
      >
        {/* Triad ledger-spine — ties each line to the receipt's bound-ledger edge */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-2.5 left-0 w-1 rounded-full opacity-80"
          style={{ background: SPINE[accentIndex % SPINE.length] } as CSSProperties}
        />

        {/* Validation overlay for sold-out/unavailable items */}
        {isStale && onRemoveStale && (
          <ValidationOverlay
            status={validationStatus as "sold-out" | "unavailable"}
            onRemove={onRemoveStale}
          />
        )}

        <div className={cn("flex gap-3 pl-1.5", isStale && "opacity-50 pointer-events-none")}>
          {/* Image */}
          <m.div
            className={cn(
              "flex-shrink-0 overflow-hidden rounded-xl bg-surface-secondary ring-1 ring-border",
              compact ? "h-16 w-16" : "h-20 w-20"
            )}
            whileHover={shouldAnimate && !isStale ? { scale: 1.05 } : undefined}
            transition={getSpring(spring.snappy)}
          >
            {item.imageUrl && !imgError ? (
              <Image
                src={item.imageUrl}
                alt={item.nameEn}
                width={80}
                height={80}
                className="h-full w-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl">
                <span role="img" aria-label="Food">
                  {getFallbackEmoji(item.nameEn)}
                </span>
              </div>
            )}
          </m.div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3
                  className={cn(
                    "truncate font-semibold text-text-primary",
                    compact ? "text-sm" : "text-base"
                  )}
                >
                  {item.nameEn}
                </h3>
                {item.nameMy && (
                  <p className="truncate font-burmese text-xs text-text-muted" lang="my">
                    {item.nameMy}
                  </p>
                )}
                {item.modifiers.length > 0 && (
                  <m.p
                    initial={shouldAnimate ? { opacity: 0 } : undefined}
                    animate={shouldAnimate ? { opacity: 1 } : undefined}
                    className={cn("truncate text-text-secondary", compact ? "text-xs" : "text-sm")}
                  >
                    {item.modifiers.map((m) => m.optionName).join(", ")}
                  </m.p>
                )}
                {item.notes && (
                  <p className="mt-1 truncate text-xs italic text-text-muted">
                    &quot;{item.notes}&quot;
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {onEdit && !isStale && (
                  <m.button
                    type="button"
                    onClick={() => onEdit(item)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      "text-text-muted hover:bg-surface-secondary hover:text-text-primary",
                      "transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    )}
                    whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
                    whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
                    aria-label="Edit item"
                  >
                    <Edit3 className="h-4 w-4" />
                  </m.button>
                )}
                {!isStale && (
                  <m.button
                    type="button"
                    onClick={handleRemove}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      "text-text-muted hover:bg-status-error/10 hover:text-status-error",
                      "transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-error focus-visible:ring-offset-2"
                    )}
                    whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
                    whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </m.button>
                )}
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between">
              {!isStale && (
                <span className="relative inline-flex">
                  <QuantitySelector
                    quantity={item.quantity}
                    onIncrement={handleIncrement}
                    onDecrement={handleDecrement}
                    min={0}
                    size={compact ? "sm" : "md"}
                  />
                  <TapBurst fireKey={burstKey} />
                </span>
              )}
              <m.div className={cn("text-right", isStale && "ml-auto")}>
                <PriceTicker
                  value={itemTotal}
                  inCents={true}
                  className={cn(
                    "font-semibold text-text-primary",
                    compact ? "text-sm" : "text-base"
                  )}
                />
                {item.quantity > 1 && (
                  <p className="text-xs text-text-muted">
                    ${(item.basePriceCents / 100).toFixed(2)} each
                  </p>
                )}
              </m.div>
            </div>

            {/* Price change badge below the price section */}
            {hasPriceChange && priceDirection && onDismissPriceChange && (
              <div className="mt-2">
                <PriceChangeBadge direction={priceDirection} onDismiss={onDismissPriceChange} />
              </div>
            )}
          </div>
        </div>
      </m.div>
    </m.div>
  );
});

export default CartItem;
