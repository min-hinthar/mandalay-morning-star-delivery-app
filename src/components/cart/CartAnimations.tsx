/**
 * V5 Sprint 5: Cart Animations
 *
 * Animation components and utilities for cart interactions.
 * Includes add-to-cart, remove, quantity flip, and drawer animations.
 */

/* eslint-disable @next/next/no-img-element */
// Using native img for dynamic cart images and fly-to-cart animations
// Next Image optimization not suitable for these dynamic/portal use cases

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useSpring,
  type PanInfo,
} from "framer-motion";
import { Check, Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { triggerHaptic, useSwipeToDelete } from "@/lib/swipe-gestures";
import { zIndex } from "@/design-system/tokens/z-index";

// ============================================
// TYPES
// ============================================

export type AddToCartState = "idle" | "loading" | "success" | "error";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

// ============================================
// ANIMATION VARIANTS
// ============================================

/**
 * Add to cart button animation variants
 * Scale up + color transition from saffron to jade
 */
export const addToCartVariants = {
  idle: {
    scale: 1,
    backgroundColor: "var(--color-accent-primary)",
  },
  loading: {
    scale: 1,
    backgroundColor: "var(--color-accent-primary)",
  },
  success: {
    scale: [1, 1.1, 1],
    backgroundColor: [
      "var(--color-accent-primary)",
      "var(--color-accent-secondary)",
      "var(--color-accent-primary)",
    ],
    transition: {
      duration: 0.4,
      scale: { type: "spring", stiffness: 400, damping: 20 },
    },
  },
  error: {
    scale: 1,
    backgroundColor: "var(--color-status-error)",
    x: [0, -6, 6, -4, 4, -2, 2, 0],
    transition: { duration: 0.4 },
  },
};

/**
 * Cart item remove animation variants
 * Slide left, fade, then collapse height
 */
export const cartItemRemoveVariants = {
  initial: { opacity: 1, x: 0, height: "auto" },
  exit: {
    opacity: 0,
    x: -300,
    height: 0,
    marginBottom: 0,
    paddingTop: 0,
    paddingBottom: 0,
    transition: {
      opacity: { duration: 0.15 },
      x: { duration: 0.2, ease: "easeIn" },
      height: { duration: 0.15, delay: 0.1 },
      marginBottom: { duration: 0.15, delay: 0.1 },
    },
  },
};

/**
 * Cart drawer animation variants
 * Slide up from bottom with spring physics
 */
export const cartDrawerVariants = {
  hidden: {
    y: "100%",
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    y: "100%",
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: "easeIn" as const,
    },
  },
};

/**
 * Quantity flip animation variants
 * 3D flip effect when quantity changes
 */
export const quantityFlipVariants = {
  initial: (direction: number) => ({
    rotateX: direction > 0 ? -90 : 90,
    opacity: 0,
  }),
  animate: {
    rotateX: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
  exit: (direction: number) => ({
    rotateX: direction > 0 ? 90 : -90,
    opacity: 0,
    transition: { duration: 0.15 },
  }),
};

/**
 * Badge bounce animation for cart count
 */
export const badgeBounceVariants = {
  initial: { scale: 0 },
  animate: {
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 500,
      damping: 15,
    },
  },
  bump: {
    scale: [1, 1.3, 1],
    transition: { duration: 0.2 },
  },
};

/**
 * Fly to cart animation for item thumbnail
 */
export const flyToCartVariants = {
  initial: { scale: 1, opacity: 1 },
  animate: (target: { x: number; y: number }) => ({
    x: target.x,
    y: target.y,
    scale: 0.3,
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

// ============================================
// ADD TO CART BUTTON
// ============================================

export interface AddToCartButtonProps {
  /** Click handler */
  onClick: () => Promise<void> | void;
  /** Current state */
  state?: AddToCartState;
  /** Disabled state */
  disabled?: boolean;
  /** Button text */
  children?: React.ReactNode;
  /** Additional class names */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

export function AddToCartButton({
  onClick,
  state = "idle",
  disabled = false,
  children = "Add to Cart",
  className,
  size = "md",
}: AddToCartButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const [localState, setLocalState] = useState<AddToCartState>(state);

  // Sync with external state
  useEffect(() => {
    setLocalState(state);
  }, [state]);

  const handleClick = useCallback(async () => {
    if (localState === "loading" || disabled) return;

    triggerHaptic("medium");
    setLocalState("loading");

    try {
      await onClick();
      setLocalState("success");
      triggerHaptic("light");

      // Reset after success animation
      setTimeout(() => setLocalState("idle"), 1500);
    } catch {
      setLocalState("error");
      triggerHaptic("heavy");

      // Reset after error animation
      setTimeout(() => setLocalState("idle"), 1500);
    }
  }, [onClick, localState, disabled]);

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <motion.button
      variants={prefersReducedMotion ? undefined : addToCartVariants}
      animate={localState}
      onClick={handleClick}
      disabled={disabled || localState === "loading"}
      className={cn(
        "relative flex items-center justify-center gap-2",
        "rounded-[var(--radius-md)]",
        "font-medium text-white",
        "transition-colors duration-[var(--duration-fast)]",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-[var(--color-accent-tertiary)] focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: "var(--color-accent-primary)" }}
    >
      <AnimatePresence mode="wait">
        {localState === "loading" && (
          <motion.span
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="h-5 w-5 animate-spin" />
          </motion.span>
        )}
        {localState === "success" && (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <Check className="h-5 w-5" />
          </motion.span>
        )}
        {(localState === "idle" || localState === "error") && (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <ShoppingBag className="h-5 w-5" />
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ============================================
// QUANTITY SELECTOR WITH FLIP ANIMATION
// ============================================

export interface QuantitySelectorProps {
  /** Current quantity */
  value: number;
  /** Change handler */
  onChange: (value: number) => void;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Size variant */
  size?: "sm" | "md";
  /** Additional class names */
  className?: string;
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  size = "md",
  className,
}: QuantitySelectorProps) {
  const prefersReducedMotion = useReducedMotion();
  const [direction, setDirection] = useState(0);
  const prevValue = useRef(value);

  // Track direction of change
  useEffect(() => {
    if (value !== prevValue.current) {
      setDirection(value > prevValue.current ? 1 : -1);
      prevValue.current = value;
    }
  }, [value]);

  const handleDecrement = useCallback(() => {
    if (value > min && !disabled) {
      triggerHaptic("light");
      onChange(value - 1);
    }
  }, [value, min, disabled, onChange]);

  const handleIncrement = useCallback(() => {
    if (value < max && !disabled) {
      triggerHaptic("light");
      onChange(value + 1);
    }
  }, [value, max, disabled, onChange]);

  const sizeClasses = {
    sm: {
      container: "h-8",
      button: "w-8 h-8",
      icon: "h-3.5 w-3.5",
      value: "w-8 text-sm",
    },
    md: {
      container: "h-10",
      button: "w-10 h-10",
      icon: "h-4 w-4",
      value: "w-10 text-base",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        "inline-flex items-center",
        "rounded-[var(--radius-md)]",
        "border border-[var(--color-border)]",
        "bg-[var(--color-surface)]",
        disabled && "opacity-50",
        sizes.container,
        className
      )}
    >
      {/* Decrement button */}
      <button
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className={cn(
          "flex items-center justify-center",
          "text-[var(--color-text-secondary)]",
          "hover:text-[var(--color-text-primary)]",
          "hover:bg-[var(--color-surface-muted)]",
          "disabled:opacity-30 disabled:cursor-not-allowed",
          "transition-colors rounded-l-[var(--radius-md)]",
          sizes.button
        )}
        aria-label="Decrease quantity"
      >
        <Minus className={sizes.icon} />
      </button>

      {/* Quantity display with flip animation */}
      <div
        className={cn(
          "flex items-center justify-center",
          "font-semibold text-[var(--color-text-primary)]",
          "border-x border-[var(--color-border)]",
          "overflow-hidden perspective-[100px]",
          sizes.value
        )}
        style={{ perspective: "100px" }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.span
            key={value}
            custom={direction}
            variants={prefersReducedMotion ? undefined : quantityFlipVariants}
            initial={prefersReducedMotion ? undefined : "initial"}
            animate="animate"
            exit="exit"
            style={{ transformStyle: "preserve-3d" }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Increment button */}
      <button
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className={cn(
          "flex items-center justify-center",
          "text-[var(--color-text-secondary)]",
          "hover:text-[var(--color-text-primary)]",
          "hover:bg-[var(--color-surface-muted)]",
          "disabled:opacity-30 disabled:cursor-not-allowed",
          "transition-colors rounded-r-[var(--radius-md)]",
          sizes.button
        )}
        aria-label="Increase quantity"
      >
        <Plus className={sizes.icon} />
      </button>
    </div>
  );
}

// ============================================
// SWIPEABLE CART ITEM
// ============================================

export interface SwipeableCartItemProps {
  /** Cart item data */
  item: CartItem;
  /** Remove handler */
  onRemove: (id: string) => void;
  /** Quantity change handler */
  onQuantityChange: (id: string, quantity: number) => void;
  /** Additional class names */
  className?: string;
}

export function SwipeableCartItem({
  item,
  onRemove,
  onQuantityChange,
  className,
}: SwipeableCartItemProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isRemoving, setIsRemoving] = useState(false);

  const { motionProps, isDragging, dragOffset, isRevealed, deleteButtonProps } =
    useSwipeToDelete({
      onDelete: () => {
        setIsRemoving(true);
        // Delay actual removal to allow exit animation
        setTimeout(() => onRemove(item.id), 200);
      },
    });

  const handleRemoveClick = useCallback(() => {
    triggerHaptic("medium");
    setIsRemoving(true);
    setTimeout(() => onRemove(item.id), 200);
  }, [item.id, onRemove]);

  if (isRemoving) {
    return (
      <motion.div
        initial={{ opacity: 1, x: 0, height: "auto" }}
        animate={{
          opacity: 0,
          x: -300,
          height: 0,
          marginBottom: 0,
        }}
        transition={{ duration: 0.2 }}
        className={cn("overflow-hidden", className)}
      />
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Delete button revealed on swipe */}
      <motion.div
        animate={{
          opacity: prefersReducedMotion
            ? isRevealed
              ? 1
              : 0
            : deleteButtonProps.opacity,
          scale: prefersReducedMotion ? 1 : deleteButtonProps.scale,
        }}
        className={cn(
          "absolute right-0 top-0 bottom-0",
          "flex items-center justify-center",
          "w-20 bg-[var(--color-status-error)]",
          "text-white"
        )}
      >
        <button
          onClick={handleRemoveClick}
          className="p-3 hover:bg-[var(--color-status-error-hover)]"
          aria-label="Remove item"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </motion.div>

      {/* Item content */}
      <motion.div
        {...motionProps}
        animate={{ x: dragOffset }}
        className={cn(
          "relative flex items-center gap-4 p-4",
          "bg-[var(--color-surface)]",
          "border-b border-[var(--color-border)]",
          isDragging && "cursor-grabbing"
        )}
      >
        {/* Item image */}
        {item.image && (
          <div className="h-16 w-16 flex-shrink-0 rounded-[var(--radius-sm)] overflow-hidden bg-[var(--color-surface-muted)]">
            <img
              src={item.image}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Item details */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-[var(--color-text-primary)] truncate">
            {item.name}
          </h4>
          <p className="text-sm text-[var(--color-text-secondary)]">
            ${item.price.toFixed(2)}
          </p>
        </div>

        {/* Quantity selector */}
        <QuantitySelector
          value={item.quantity}
          onChange={(q) => onQuantityChange(item.id, q)}
          size="sm"
        />

        {/* Remove button (tap alternative to swipe) */}
        <button
          onClick={handleRemoveClick}
          className={cn(
            "p-2 -mr-2",
            "text-[var(--color-text-secondary)]",
            "hover:text-[var(--color-status-error)]",
            "transition-colors"
          )}
          aria-label="Remove item"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </motion.div>
    </div>
  );
}

// ============================================
// CART BADGE WITH BOUNCE
// ============================================

export interface CartBadgeProps {
  /** Item count */
  count: number;
  /** Additional class names */
  className?: string;
}

export function CartBadge({ count, className }: CartBadgeProps) {
  const prefersReducedMotion = useReducedMotion();
  const [prevCount, setPrevCount] = useState(count);
  const [shouldBump, setShouldBump] = useState(false);

  useEffect(() => {
    if (count !== prevCount && count > prevCount) {
      setShouldBump(true);
      const timer = setTimeout(() => setShouldBump(false), 200);
      setPrevCount(count);
      return () => clearTimeout(timer);
    }
    setPrevCount(count);
  }, [count, prevCount]);

  if (count === 0) return null;

  return (
    <motion.span
      variants={prefersReducedMotion ? undefined : badgeBounceVariants}
      initial="initial"
      animate={shouldBump && !prefersReducedMotion ? "bump" : "animate"}
      className={cn(
        "absolute -top-1 -right-1",
        "min-w-[20px] h-5 px-1.5",
        "flex items-center justify-center",
        "rounded-full",
        "bg-[var(--color-accent-primary)]",
        "text-white text-xs font-bold",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </motion.span>
  );
}

// ============================================
// CART DRAWER WRAPPER
// ============================================

export interface CartDrawerProps {
  /** Open state */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Drawer content */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
}

export function CartDrawer({
  isOpen,
  onClose,
  children,
  className,
}: CartDrawerProps) {
  const prefersReducedMotion = useReducedMotion();
  const dragY = useSpring(0, { stiffness: 300, damping: 30 });
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);

      // Close if dragged down enough or with velocity
      if (info.offset.y > 100 || info.velocity.y > 500) {
        triggerHaptic("light");
        onClose();
      } else {
        dragY.set(0);
      }
    },
    [onClose, dragY]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60"
          />

          {/* Drawer */}
          <motion.div
            variants={prefersReducedMotion ? undefined : cartDrawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            style={{ y: isDragging ? dragY : 0 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-modal",
              "max-h-[85vh]",
              "rounded-t-[var(--radius-xl)]",
              "bg-[var(--color-surface)]",
              "shadow-[var(--shadow-xl)]",
              "overflow-hidden",
              className
            )}
          >
            {/* Drag handle */}
            <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(85vh-48px)]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// FLY TO CART ANIMATION HOOK
// ============================================

interface FlyToCartOptions {
  /** Duration of the animation in ms */
  duration?: number;
  /** Target element selector (cart icon) */
  targetSelector?: string;
}

interface FlyToCartReturn {
  /** Trigger the fly animation */
  trigger: (sourceElement: HTMLElement) => void;
  /** The flying element (render this) */
  flyingElement: React.ReactNode;
}

export function useFlyToCart(options: FlyToCartOptions = {}): FlyToCartReturn {
  const { duration = 300, targetSelector = "[data-cart-icon]" } = options;
  const [flyState, setFlyState] = useState<{
    active: boolean;
    start: { x: number; y: number };
    end: { x: number; y: number };
    image?: string;
  } | null>(null);

  const trigger = useCallback(
    (sourceElement: HTMLElement) => {
      const sourceRect = sourceElement.getBoundingClientRect();
      const targetElement = document.querySelector(targetSelector);

      if (!targetElement) {
        console.warn("Cart target element not found");
        return;
      }

      const targetRect = targetElement.getBoundingClientRect();

      // Get image from source if available
      const img = sourceElement.querySelector("img");
      const imageSrc = img?.src;

      setFlyState({
        active: true,
        start: {
          x: sourceRect.left + sourceRect.width / 2,
          y: sourceRect.top + sourceRect.height / 2,
        },
        end: {
          x: targetRect.left + targetRect.width / 2,
          y: targetRect.top + targetRect.height / 2,
        },
        image: imageSrc,
      });

      // Clear after animation
      setTimeout(() => setFlyState(null), duration);
    },
    [targetSelector, duration]
  );

  const flyingElement = flyState?.active ? (
    <motion.div
      initial={{
        position: "fixed",
        left: flyState.start.x,
        top: flyState.start.y,
        x: "-50%",
        y: "-50%",
        scale: 1,
        opacity: 1,
        zIndex: zIndex.max,
      }}
      animate={{
        left: flyState.end.x,
        top: flyState.end.y,
        scale: 0.2,
        opacity: 0,
      }}
      transition={{
        duration: duration / 1000,
        ease: [0.4, 0, 0.2, 1],
      }}
      className="pointer-events-none"
    >
      {flyState.image ? (
        <img
          src={flyState.image}
          alt=""
          className="w-16 h-16 rounded-lg object-cover shadow-lg"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-[var(--color-accent-primary)] shadow-lg flex items-center justify-center">
          <ShoppingBag className="w-8 h-8 text-white" />
        </div>
      )}
    </motion.div>
  ) : null;

  return { trigger, flyingElement };
}

// ============================================
// CART ITEM LIST WITH ANIMATIONS
// ============================================

export interface CartItemListProps {
  /** Cart items */
  items: CartItem[];
  /** Remove handler */
  onRemove: (id: string) => void;
  /** Quantity change handler */
  onQuantityChange: (id: string, quantity: number) => void;
  /** Empty state content */
  emptyState?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

export function CartItemList({
  items,
  onRemove,
  onQuantityChange,
  emptyState,
  className,
}: CartItemListProps) {
  const prefersReducedMotion = useReducedMotion();

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-12",
          className
        )}
      >
        {emptyState || (
          <>
            <ShoppingBag className="h-12 w-12 text-[var(--color-text-secondary)] mb-4" />
            <p className="text-[var(--color-text-secondary)]">
              Your cart is empty
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : { opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout={!prefersReducedMotion}
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={
              prefersReducedMotion
                ? undefined
                : {
                    opacity: 0,
                    x: -300,
                    transition: { duration: 0.2 },
                  }
            }
          >
            <SwipeableCartItem
              item={item}
              onRemove={onRemove}
              onQuantityChange={onQuantityChange}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
