"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  MotionValue,
} from "framer-motion";
import { Minus, Plus, ShoppingCart, Heart, Share2, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useAnimationPreference } from "@/lib/hooks/useAnimationPreference";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { ModifierToggle } from "./ModifierToggle";
import { VisualPreview } from "./VisualPreview";
import { MenuItemCard } from "./MenuItemCard";
import type { MenuItem, ModifierOption } from "@/types/menu";

// ============================================
// TYPES
// ============================================

export interface ItemDetailProps {
  /** Menu item to display */
  item: MenuItem;
  /** Callback to close detail view */
  onClose: () => void;
  /** Callback to add to cart */
  onAddToCart: (item: MenuItem, quantity: number, selectedModifiers: Record<string, string[]>) => void;
  /** Layout ID for FLIP animation (matches card) */
  layoutId?: string;
  /** Related items for carousel */
  relatedItems?: MenuItem[];
  /** Additional className */
  className?: string;
  /** Whether item is favorited */
  isFavorite?: boolean;
  /** Callback for favorite toggle */
  onFavoriteToggle?: (item: MenuItem, isFavorite: boolean) => void;
}

// ============================================
// QUANTITY SELECTOR
// ============================================

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
}: QuantitySelectorProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  const decrement = useCallback(() => {
    if (value > min) {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(10);
      }
      onChange(value - 1);
    }
  }, [value, min, onChange]);

  const increment = useCallback(() => {
    if (value < max) {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(10);
      }
      onChange(value + 1);
    }
  }, [value, max, onChange]);

  return (
    <div className="flex items-center gap-3">
      <motion.button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center",
          "bg-surface-secondary text-text-primary",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        )}
        whileHover={shouldAnimate && value > min ? { scale: 1.1 } : undefined}
        whileTap={shouldAnimate && value > min ? { scale: 0.9 } : undefined}
        transition={getSpring(spring.snappy)}
        aria-label="Decrease quantity"
      >
        <Minus className="w-5 h-5" />
      </motion.button>

      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          className="w-12 text-center font-display text-2xl font-bold text-text-primary"
          initial={shouldAnimate ? { opacity: 0, y: -20 } : undefined}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
          exit={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
          transition={getSpring(spring.snappy)}
        >
          {value}
        </motion.span>
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={increment}
        disabled={value >= max}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center",
          "bg-surface-secondary text-text-primary",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        )}
        whileHover={shouldAnimate && value < max ? { scale: 1.1 } : undefined}
        whileTap={shouldAnimate && value < max ? { scale: 0.9 } : undefined}
        transition={getSpring(spring.snappy)}
        aria-label="Increase quantity"
      >
        <Plus className="w-5 h-5" />
      </motion.button>
    </div>
  );
}

// ============================================
// HERO IMAGE WITH KEN BURNS
// ============================================

interface HeroImageProps {
  src?: string | null;
  alt: string;
  scrollProgress: MotionValue<number>;
}

function HeroImage({ src, alt, scrollProgress }: HeroImageProps) {
  const { shouldAnimate } = useAnimationPreference();

  // Ken Burns parallax effect
  const scale = useTransform(scrollProgress, [0, 1], [1.1, 1]);
  const y = useTransform(scrollProgress, [0, 1], ["0%", "10%"]);

  return (
    <div className="relative h-72 md:h-96 overflow-hidden bg-surface-secondary">
      <motion.div
        className="absolute inset-0"
        style={shouldAnimate ? { scale, y } : undefined}
      >
        {src ? (
          /* eslint-disable-next-line @next/next/no-img-element -- Hero image with scale animation */
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl">
            🍜
          </div>
        )}
      </motion.div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-surface-primary via-transparent to-transparent" />
    </div>
  );
}

// ============================================
// RELATED ITEMS CAROUSEL
// ============================================

interface RelatedItemsProps {
  items: MenuItem[];
  onSelect: (item: MenuItem) => void;
}

function RelatedItems({ items, onSelect }: RelatedItemsProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();

  if (items.length === 0) return null;

  return (
    <motion.section
      className="mt-8 pt-8 border-t border-border"
      initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      transition={{ ...getSpring(spring.default), delay: 0.3 }}
    >
      <h3 className="font-display font-semibold text-lg text-text-primary mb-4">
        You Might Also Like
      </h3>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            className="flex-shrink-0 w-48"
            initial={shouldAnimate ? { opacity: 0, x: 20 } : undefined}
            animate={shouldAnimate ? { opacity: 1, x: 0 } : undefined}
            transition={{ ...getSpring(spring.snappy), delay: index * 0.1 }}
          >
            <MenuItemCard
              item={item}
              onSelect={onSelect}
              disableTilt
              className="h-full"
            />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ItemDetail({
  item,
  onClose,
  onAddToCart,
  layoutId,
  relatedItems = [],
  className,
  isFavorite = false,
  onFavoriteToggle,
}: ItemDetailProps) {
  const { shouldAnimate, getSpring } = useAnimationPreference();
  const scrollRef = useRef<HTMLDivElement>(null);

  // State
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});

  // Scroll progress for Ken Burns
  const { scrollYProgress } = useScroll({
    container: scrollRef,
    offset: ["start start", "200px start"],
  });

  // Calculate selected modifier options
  const selectedModifierOptions = useMemo(() => {
    const options: ModifierOption[] = [];
    if (item.modifierGroups) {
      item.modifierGroups.forEach((group) => {
        const selectedIds = selectedModifiers[group.id] || [];
        group.options.forEach((opt) => {
          if (selectedIds.includes(opt.id)) {
            options.push(opt);
          }
        });
      });
    }
    return options;
  }, [item.modifierGroups, selectedModifiers]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    const basePrice = item.basePriceCents;
    const modifierPrice = selectedModifierOptions.reduce(
      (sum, opt) => sum + (opt.priceDeltaCents || 0),
      0
    );
    return (basePrice + modifierPrice) * quantity;
  }, [item.basePriceCents, selectedModifierOptions, quantity]);

  // Check if all required modifiers are selected (required = minSelect > 0)
  const canAddToCart = useMemo(() => {
    if (!item.modifierGroups) return true;
    return item.modifierGroups
      .filter((g) => g.minSelect > 0)
      .every((g) => {
        const selected = selectedModifiers[g.id] || [];
        return selected.length >= g.minSelect;
      });
  }, [item.modifierGroups, selectedModifiers]);

  // Handle modifier change
  const handleModifierChange = useCallback((groupId: string, selectedIds: string[]) => {
    setSelectedModifiers((prev) => ({
      ...prev,
      [groupId]: selectedIds,
    }));
  }, []);

  // Handle add to cart
  const handleAddToCart = useCallback(() => {
    if (!canAddToCart) return;

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([15, 50, 15]);
    }

    onAddToCart(item, quantity, selectedModifiers);
  }, [item, quantity, selectedModifiers, canAddToCart, onAddToCart]);

  // Handle close with escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[var(--z-modal)]"
      initial={shouldAnimate ? { opacity: 0 } : undefined}
      animate={shouldAnimate ? { opacity: 1 } : undefined}
      exit={shouldAnimate ? { opacity: 0 } : undefined}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={shouldAnimate ? { opacity: 0 } : undefined}
        animate={shouldAnimate ? { opacity: 1 } : undefined}
        exit={shouldAnimate ? { opacity: 0 } : undefined}
        onClick={onClose}
      />

      {/* Content panel */}
      <motion.div
        layoutId={layoutId}
        className={cn(
          "absolute inset-x-0 bottom-0 md:inset-y-4 md:right-4 md:left-auto md:w-[480px]",
          "bg-surface-primary rounded-t-3xl md:rounded-3xl",
          "shadow-2xl overflow-hidden",
          "max-h-[90vh] md:max-h-none",
          className
        )}
        initial={shouldAnimate ? { y: "100%", opacity: 0 } : undefined}
        animate={shouldAnimate ? { y: 0, opacity: 1 } : undefined}
        exit={shouldAnimate ? { y: "100%", opacity: 0 } : undefined}
        transition={getSpring(spring.snappy)}
      >
        {/* Header actions */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
          <motion.button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md"
            whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
            aria-label="Close"
          >
            <ChevronLeft className="w-5 h-5 text-text-primary" />
          </motion.button>

          <div className="flex items-center gap-2">
            {onFavoriteToggle && (
              <motion.button
                type="button"
                onClick={() => onFavoriteToggle(item, !isFavorite)}
                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md"
                whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
                whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart
                  className={cn(
                    "w-5 h-5",
                    isFavorite ? "fill-primary text-primary" : "text-text-primary"
                  )}
                />
              </motion.button>
            )}
            <motion.button
              type="button"
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md"
              whileHover={shouldAnimate ? { scale: 1.1 } : undefined}
              whileTap={shouldAnimate ? { scale: 0.9 } : undefined}
              aria-label="Share"
            >
              <Share2 className="w-5 h-5 text-text-primary" />
            </motion.button>
          </div>
        </div>

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto overscroll-contain"
        >
          {/* Hero image */}
          <HeroImage
            src={item.imageUrl}
            alt={item.nameEn}
            scrollProgress={scrollYProgress}
          />

          {/* Content */}
          <div className="px-6 py-6 pb-32">
            {/* Title and price */}
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
              transition={{ ...getSpring(spring.default), delay: 0.1 }}
            >
              <h2 className="font-display text-2xl font-bold text-text-primary mb-2">
                {item.nameEn}
              </h2>
              <p className="font-body text-text-secondary mb-4">
                {item.descriptionEn}
              </p>
            </motion.div>

            {/* Visual preview with modifiers */}
            {selectedModifierOptions.length > 0 && (
              <motion.div
                className="my-6"
                initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
                animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
                transition={getSpring(spring.rubbery)}
              >
                <VisualPreview
                  item={item}
                  selectedModifiers={selectedModifierOptions}
                  size="md"
                />
              </motion.div>
            )}

            {/* Modifier groups */}
            {item.modifierGroups && item.modifierGroups.length > 0 && (
              <div className="space-y-4 mb-6">
                {item.modifierGroups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
                    animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
                    transition={{
                      ...getSpring(spring.default),
                      delay: 0.1 + index * 0.1,
                    }}
                  >
                    <ModifierToggle
                      group={group}
                      selectedIds={selectedModifiers[group.id] || []}
                      onSelectionChange={(ids) => handleModifierChange(group.id, ids)}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Quantity selector */}
            <motion.div
              className="flex items-center justify-between py-4 border-t border-border"
              initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
              transition={{ ...getSpring(spring.default), delay: 0.2 }}
            >
              <span className="font-body font-medium text-text-primary">
                Quantity
              </span>
              <QuantitySelector value={quantity} onChange={setQuantity} />
            </motion.div>

            {/* Related items */}
            <RelatedItems
              items={relatedItems}
              onSelect={(newItem) => {
                // Would typically update the current item
                console.log("Selected related item:", newItem.nameEn);
              }}
            />
          </div>
        </div>

        {/* Fixed bottom bar */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 p-4 bg-surface-primary border-t border-border"
          initial={shouldAnimate ? { y: 100 } : undefined}
          animate={shouldAnimate ? { y: 0 } : undefined}
          transition={{ ...getSpring(spring.snappy), delay: 0.3 }}
        >
          <div className="flex items-center gap-4">
            {/* Total price */}
            <div className="flex-1">
              <span className="text-sm text-text-muted font-body">Total</span>
              <div className="font-display text-2xl font-bold text-primary">
                <PriceTicker value={totalPrice} />
              </div>
            </div>

            {/* Add to cart button */}
            <motion.button
              type="button"
              onClick={handleAddToCart}
              disabled={!canAddToCart || item.isSoldOut}
              className={cn(
                "flex-1 flex items-center justify-center gap-3",
                "py-4 px-6 rounded-full",
                "font-body font-semibold text-white",
                canAddToCart && !item.isSoldOut
                  ? "bg-primary shadow-lg shadow-primary/30"
                  : "bg-text-muted cursor-not-allowed"
              )}
              whileHover={
                shouldAnimate && canAddToCart && !item.isSoldOut
                  ? { scale: 1.02 }
                  : undefined
              }
              whileTap={
                shouldAnimate && canAddToCart && !item.isSoldOut
                  ? { scale: 0.98 }
                  : undefined
              }
              transition={getSpring(spring.snappy)}
            >
              <ShoppingCart className="w-5 h-5" />
              <span>
                {item.isSoldOut
                  ? "Out of Stock"
                  : !canAddToCart
                  ? "Select Required Options"
                  : `Add ${quantity} to Cart`}
              </span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default ItemDetail;
