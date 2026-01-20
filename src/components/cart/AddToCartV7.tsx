"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { ShoppingBag, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { v7Spring } from "@/lib/motion-tokens-v7";
import { useAnimationPreferenceV7 } from "@/lib/hooks/useAnimationPreferenceV7";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import { useCart } from "@/lib/hooks/useCart";
import { PriceTicker } from "@/components/ui/PriceTicker";
import type { MenuItem } from "@/types/menu";
import type { SelectedModifier, CartItem } from "@/types/cart";

// ============================================
// TYPES
// ============================================

export interface AddToCartV7Props {
  /** Menu item to add */
  item: MenuItem;
  /** Selected modifiers */
  modifiers?: SelectedModifier[];
  /** Quantity to add */
  quantity?: number;
  /** Special instructions */
  notes?: string;
  /** Total price in cents (base + modifiers * quantity) */
  totalPriceCents: number;
  /** Source element ref for flying animation */
  sourceRef?: React.RefObject<HTMLElement | null>;
  /** Callback after successful add */
  onSuccess?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Full width button */
  fullWidth?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================
// CONFETTI V7 (Localized burst)
// ============================================

interface ConfettiParticleV7Props {
  index: number;
  color: string;
  origin: { x: number; y: number };
}

const CONFETTI_COLORS = [
  "#A41034", // Deep Red
  "#EBCD00", // Golden Yellow
  "#52A52E", // Green
  "#FF6B6B", // Coral
  "#4ECDC4", // Teal
  "#FFE66D", // Bright Yellow
];

function ConfettiParticleV7({ index, color, origin }: ConfettiParticleV7Props) {
  const angle = (index / 12) * Math.PI * 2 + Math.random() * 0.5;
  const velocity = 80 + Math.random() * 60;
  const endX = Math.cos(angle) * velocity;
  const endY = Math.sin(angle) * velocity - 100; // Upward bias

  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full pointer-events-none"
      style={{
        backgroundColor: color,
        left: origin.x,
        top: origin.y,
      }}
      initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
      animate={{
        scale: [0, 1.5, 1, 0.5],
        x: endX,
        y: endY,
        opacity: [1, 1, 1, 0],
        rotate: Math.random() * 720 - 360,
      }}
      transition={{
        duration: 0.8 + Math.random() * 0.3,
        ease: [0.25, 0.1, 0.25, 1],
        delay: index * 0.02,
      }}
    />
  );
}

// ============================================
// FLYING ITEM COMPONENT
// ============================================

interface FlyingItemProps {
  imageUrl: string | null;
  startPos: { x: number; y: number };
  endPos: { x: number; y: number };
  onComplete: () => void;
}

function FlyingItem({ imageUrl, startPos, endPos, onComplete }: FlyingItemProps) {

  // Calculate arc path
  const midX = (startPos.x + endPos.x) / 2;
  const midY = Math.min(startPos.y, endPos.y) - 100;

  return (
    <motion.div
      className="fixed z-max pointer-events-none"
      initial={{
        x: startPos.x,
        y: startPos.y,
        scale: 1,
        opacity: 1,
      }}
      animate={{
        x: [startPos.x, midX, endPos.x],
        y: [startPos.y, midY, endPos.y],
        scale: [1, 1.2, 0.5],
        opacity: [1, 1, 0],
        rotate: [0, 15, -10],
      }}
      transition={{
        duration: 0.6,
        ease: [0.34, 1.56, 0.64, 1],
      }}
      onAnimationComplete={onComplete}
    >
      <div className="w-16 h-16 rounded-full overflow-hidden shadow-xl bg-v6-surface-secondary">
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element -- Dynamic external URL in animation */
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            🍜
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// BADGE BOUNCE COMPONENT
// ============================================

interface CartBadgeV7Props {
  count: number;
  shouldBounce: boolean;
}

export function CartBadgeV7({ count, shouldBounce }: CartBadgeV7Props) {
  const { shouldAnimate } = useAnimationPreferenceV7();
  const controls = useAnimation();

  useEffect(() => {
    if (shouldBounce && shouldAnimate) {
      controls.start({
        scale: [1, 1.5, 0.9, 1.2, 1],
        rotate: [0, 10, -10, 5, 0],
        transition: {
          duration: 0.5,
          ease: [0.34, 1.56, 0.64, 1],
        },
      });
    }
  }, [shouldBounce, shouldAnimate, controls, count]);

  if (count === 0) return null;

  return (
    <motion.span
      animate={controls}
      className={cn(
        "absolute -top-2 -right-2 min-w-[20px] h-5",
        "flex items-center justify-center",
        "bg-v6-primary text-white text-xs font-bold",
        "rounded-full px-1.5",
        "shadow-lg shadow-v6-primary/30"
      )}
    >
      {count > 99 ? "99+" : count}
    </motion.span>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function AddToCartV7({
  item,
  modifiers = [],
  quantity = 1,
  notes = "",
  totalPriceCents,
  sourceRef,
  onSuccess,
  disabled = false,
  size = "lg",
  fullWidth = true,
  className,
}: AddToCartV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();
  const { open: openDrawer } = useCartDrawer();
  const { addItem } = useCart();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [flyingItem, setFlyingItem] = useState<{ start: DOMRect; end: DOMRect } | null>(null);
  const [confettiOrigin, setConfettiOrigin] = useState<{ x: number; y: number } | null>(null);
  const [_badgeBounce, setBadgeBounce] = useState(false);

  // Find cart icon position (header cart button)
  const getCartIconPosition = useCallback(() => {
    const cartButton = document.querySelector('[data-cart-button]');
    if (cartButton) {
      return cartButton.getBoundingClientRect();
    }
    // Fallback: top-right corner
    return new DOMRect(window.innerWidth - 60, 20, 40, 40);
  }, []);

  const handleAddToCart = useCallback(async () => {
    if (disabled || isAdding) return;

    // Haptic feedback
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(15);
    }

    setIsAdding(true);

    // Get positions for flying animation
    const sourceRect = sourceRef?.current?.getBoundingClientRect() ||
      buttonRef.current?.getBoundingClientRect();
    const cartRect = getCartIconPosition();

    if (shouldAnimate && sourceRect) {
      setFlyingItem({ start: sourceRect, end: cartRect });
      setConfettiOrigin({
        x: sourceRect.left + sourceRect.width / 2,
        y: sourceRect.top + sourceRect.height / 2,
      });
    }

    // Add to cart
    const cartItem: Omit<CartItem, "cartItemId" | "addedAt"> = {
      menuItemId: item.id,
      menuItemSlug: item.slug,
      nameEn: item.nameEn,
      nameMy: item.nameMy ?? null,
      imageUrl: item.imageUrl ?? null,
      basePriceCents: item.basePriceCents,
      quantity,
      modifiers,
      notes,
    };

    addItem(cartItem);

    // Wait for animation
    await new Promise((resolve) => setTimeout(resolve, shouldAnimate ? 600 : 100));

    setShowSuccess(true);
    setBadgeBounce(true);

    // Auto-open drawer after short delay
    setTimeout(() => {
      openDrawer();
    }, shouldAnimate ? 300 : 100);

    // Reset states
    setTimeout(() => {
      setIsAdding(false);
      setShowSuccess(false);
      setFlyingItem(null);
      setConfettiOrigin(null);
      setBadgeBounce(false);
      onSuccess?.();
    }, 1200);
  }, [
    disabled,
    isAdding,
    shouldAnimate,
    sourceRef,
    getCartIconPosition,
    item,
    quantity,
    modifiers,
    notes,
    addItem,
    openDrawer,
    onSuccess,
  ]);

  // Size configurations
  const sizeConfig = {
    sm: { padding: "px-4 py-2", text: "text-sm", icon: "w-4 h-4" },
    md: { padding: "px-6 py-3", text: "text-base", icon: "w-5 h-5" },
    lg: { padding: "px-8 py-4", text: "text-lg", icon: "w-6 h-6" },
  };

  const config = sizeConfig[size];

  return (
    <>
      {/* Flying item animation */}
      <AnimatePresence>
        {flyingItem && shouldAnimate && (
          <FlyingItem
            imageUrl={item.imageUrl ?? null}
            startPos={{
              x: flyingItem.start.left + flyingItem.start.width / 2 - 32,
              y: flyingItem.start.top + flyingItem.start.height / 2 - 32,
            }}
            endPos={{
              x: flyingItem.end.left + flyingItem.end.width / 2 - 32,
              y: flyingItem.end.top + flyingItem.end.height / 2 - 32,
            }}
            onComplete={() => setBadgeBounce(true)}
          />
        )}
      </AnimatePresence>

      {/* Confetti burst */}
      <AnimatePresence>
        {confettiOrigin && shouldAnimate && (
          <div className="fixed inset-0 pointer-events-none z-toast">
            {Array.from({ length: 20 }).map((_, i) => (
              <ConfettiParticleV7
                key={i}
                index={i}
                color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
                origin={confettiOrigin}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main button */}
      <motion.button
        ref={buttonRef}
        type="button"
        onClick={handleAddToCart}
        disabled={disabled || isAdding || item.isSoldOut}
        className={cn(
          "relative flex items-center justify-center gap-3",
          config.padding,
          "rounded-full font-semibold",
          "bg-v6-primary text-white",
          "shadow-lg shadow-v6-primary/30",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v6-primary focus-visible:ring-offset-2",
          "transition-shadow duration-200",
          "hover:shadow-xl hover:shadow-v6-primary/40",
          fullWidth && "w-full",
          className
        )}
        whileHover={shouldAnimate && !disabled ? { scale: 1.02 } : undefined}
        whileTap={shouldAnimate && !disabled ? { scale: 0.98 } : undefined}
        transition={getSpring(v7Spring.snappy)}
      >
        {/* Button content */}
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={getSpring(v7Spring.ultraBouncy)}
              className="flex items-center gap-2"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Check className={config.icon} />
              </motion.div>
              <span>Added!</span>
            </motion.div>
          ) : isAdding ? (
            <motion.div
              key="adding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
              >
                <ShoppingBag className={config.icon} />
              </motion.div>
              <span>Adding...</span>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div className="flex items-center gap-2">
                <Plus className={config.icon} />
                <ShoppingBag className={config.icon} />
              </div>
              <span className={config.text}>Add to Cart</span>
              <span className="mx-2 text-white/50">•</span>
              <PriceTicker
                value={totalPriceCents}
                className={cn(config.text, "font-bold")}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ripple effect */}
        {isAdding && shouldAnimate && (
          <motion.div
            className="absolute inset-0 rounded-full bg-white/20"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </motion.button>
    </>
  );
}

// ============================================
// MINI ADD BUTTON (For quick add from cards)
// ============================================

export interface MiniAddToCartV7Props {
  item: MenuItem;
  onAdd?: () => void;
  className?: string;
}

export function MiniAddToCartV7({ item, onAdd, className }: MiniAddToCartV7Props) {
  const { shouldAnimate, getSpring } = useAnimationPreferenceV7();
  const { addItem } = useCart();
  const { open: openDrawer } = useCartDrawer();
  const [isAdded, setIsAdded] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleAdd = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    if (item.isSoldOut) return;

    // Haptic
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }

    addItem({
      menuItemId: item.id,
      menuItemSlug: item.slug,
      nameEn: item.nameEn,
      nameMy: item.nameMy ?? null,
      imageUrl: item.imageUrl ?? null,
      basePriceCents: item.basePriceCents,
      quantity: 1,
      modifiers: [],
      notes: "",
    });

    setIsAdded(true);

    setTimeout(() => {
      openDrawer();
      setIsAdded(false);
      onAdd?.();
    }, 400);
  }, [item, addItem, openDrawer, onAdd]);

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      onClick={handleAdd}
      disabled={item.isSoldOut}
      className={cn(
        "w-10 h-10 rounded-full",
        "bg-v6-primary text-white",
        "flex items-center justify-center",
        "shadow-lg shadow-v6-primary/30",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v6-primary focus-visible:ring-offset-2",
        className
      )}
      whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.85 } : undefined}
      transition={getSpring(v7Spring.snappy)}
      aria-label={`Add ${item.nameEn} to cart`}
    >
      <AnimatePresence mode="wait">
        {isAdded ? (
          <motion.div
            key="check"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={getSpring(v7Spring.ultraBouncy)}
          >
            <Check className="w-5 h-5" />
          </motion.div>
        ) : (
          <motion.div
            key="plus"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Plus className="w-5 h-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default AddToCartV7;
