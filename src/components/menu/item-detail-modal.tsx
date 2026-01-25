"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useDragControls, useReducedMotion, type PanInfo } from "framer-motion";
import { AlertTriangle, X, Truck, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ModifierGroup } from "./modifier-group";
import { QuantitySelector } from "./quantity-selector";
import { formatPrice } from "@/lib/utils/currency";
import {
  calculateItemPrice,
  type SelectedModifier,
  validateModifierSelection,
} from "@/lib/utils/price";
import { ALLERGEN_MAP } from "@/lib/constants/allergens";
import { cn } from "@/lib/utils/cn";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import type { MenuItem, ModifierOption } from "@/types/menu";

interface ItemDetailModalProps {
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
  onAddToCart?: (
    item: MenuItem,
    modifiers: SelectedModifier[],
    quantity: number,
    notes: string
  ) => void;
  /** Amount needed for free delivery (in cents) */
  freeDeliveryThreshold?: number;
  /** Current cart subtotal (in cents) */
  cartSubtotal?: number;
}

// Free delivery threshold (default: $25)
const DEFAULT_FREE_DELIVERY_THRESHOLD = 2500;

/**
 * V3 Item Detail Modal
 * Mobile: Full-screen slide up with swipe to close
 * Desktop: Centered modal with scale animation
 */
export function ItemDetailModal({
  item,
  open,
  onClose,
  onAddToCart,
  freeDeliveryThreshold = DEFAULT_FREE_DELIVERY_THRESHOLD,
  cartSubtotal = 0,
}: ItemDetailModalProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const prefersReducedMotion = useReducedMotion();
  const isMobile = useMediaQuery("(max-width: 639px)");
  const dragControls = useDragControls();
  const contentRef = useRef<HTMLDivElement>(null);

  // Reset state when item changes
  useEffect(() => {
    if (!item) return;
    setSelectedModifiers([]);
    setQuantity(1);
    setNotes("");
    setIsAddingToCart(false);
  }, [item]);

  // Lock body scroll when open on mobile
  useEffect(() => {
    if (open && isMobile) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open, isMobile]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const priceCalc = useMemo(() => {
    if (!item) return null;
    return calculateItemPrice(item, selectedModifiers, quantity);
  }, [item, selectedModifiers, quantity]);

  const validation = useMemo(() => {
    if (!item) return { isValid: false, errors: [] };
    return validateModifierSelection(item, selectedModifiers);
  }, [item, selectedModifiers]);

  // Calculate remaining for free delivery
  const amountForFreeDelivery = useMemo(() => {
    const totalWithItem = cartSubtotal + (priceCalc?.totalCents ?? 0);
    const remaining = freeDeliveryThreshold - totalWithItem;
    return remaining > 0 ? remaining : 0;
  }, [cartSubtotal, priceCalc, freeDeliveryThreshold]);

  const handleModifierSelect = useCallback((
    groupId: string,
    groupName: string,
    optionId: string,
    option: ModifierOption
  ) => {
    if (!item) return;
    const group = item.modifierGroups.find((g) => g.id === groupId);
    if (!group) return;

    if (group.selectionType === "single") {
      setSelectedModifiers((prev) => [
        ...prev.filter((mod) => mod.groupId !== groupId),
        {
          groupId,
          groupName,
          optionId,
          optionName: option.name,
          priceDeltaCents: option.priceDeltaCents,
        },
      ]);
      return;
    }

    setSelectedModifiers((prev) => {
      if (prev.some((mod) => mod.optionId === optionId)) {
        return prev;
      }
      return [
        ...prev,
        {
          groupId,
          groupName,
          optionId,
          optionName: option.name,
          priceDeltaCents: option.priceDeltaCents,
        },
      ];
    });
  }, [item]);

  const handleModifierDeselect = useCallback((optionId: string) => {
    setSelectedModifiers((prev) => prev.filter((mod) => mod.optionId !== optionId));
  }, []);

  const handleAddToCart = useCallback(() => {
    if (!item || !validation.isValid || !onAddToCart || isAddingToCart) return;

    // Show success state briefly before closing
    setIsAddingToCart(true);
    onAddToCart(item, selectedModifiers, quantity, notes.trim());

    // Close after brief success animation
    setTimeout(() => {
      setIsAddingToCart(false);
      onClose();
    }, 400);
  }, [item, validation.isValid, onAddToCart, selectedModifiers, quantity, notes, onClose, isAddingToCart]);

  // Handle swipe to close (mobile)
  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (info.velocity.y > 500 || info.offset.y > 150) {
      onClose();
    }
  }, [onClose]);

  if (!item) return null;

  const hasAllergens = item.allergens.length > 0;

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const mobileModalVariants = {
    hidden: { y: "100%" },
    visible: { y: 0 },
    exit: { y: "100%" },
  };

  const desktopModalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  return (
    <AnimatePresence>
      {/* Backdrop - rendered separately to avoid Fragment inside AnimatePresence */}
      {open && (
        <motion.div
          key="item-detail-backdrop"
          className="fixed inset-0 z-modal bg-black/60 backdrop-blur-sm"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Modal Container - rendered separately to avoid Fragment inside AnimatePresence */}
      {open && (
        <motion.div
          key="item-detail-container"
          className="fixed inset-0 z-modal flex items-end sm:items-center sm:justify-center sm:p-4 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.1 }}
        >
          <motion.div
            ref={contentRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            variants={isMobile ? mobileModalVariants : desktopModalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { type: "spring", damping: 25, stiffness: 300 }
            }
            drag={isMobile ? "y" : false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className={cn(
              "relative flex flex-col overflow-hidden pointer-events-auto",
              "bg-[var(--color-surface)]",
              // Mobile: full width, rounded top, max height
              "w-full max-h-[95vh] rounded-t-[var(--radius-xl)]",
              // Desktop: centered, max width, rounded all
              "sm:max-w-xl sm:max-h-[90vh] sm:rounded-[var(--radius-lg)]",
              "shadow-[var(--shadow-xl)]"
            )}
          >
            {/* Drag Handle (mobile) */}
              {isMobile && (
                <div
                  className="sticky top-0 z-10 flex justify-center py-2 bg-[var(--color-surface)] cursor-grab active:cursor-grabbing"
                  onPointerDown={(e) => dragControls.start(e)}
                >
                  <div className="h-1.5 w-12 rounded-full bg-[var(--color-border)]" />
                </div>
              )}

              {/* Close Button (always visible) */}
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "absolute right-3 z-20",
                  isMobile ? "top-5" : "top-3",
                  "flex h-9 w-9 items-center justify-center",
                  "rounded-full bg-white/90 backdrop-blur-sm",
                  "shadow-[var(--shadow-md)]",
                  "transition-all duration-[var(--duration-fast)]",
                  "hover:scale-110 active:scale-95",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-interactive-primary)]"
                )}
                aria-label="Close"
              >
                <X className="h-5 w-5 text-[var(--color-charcoal)]" />
              </button>

              {/* Hero Image */}
              <div
                className={cn(
                  "relative shrink-0 bg-[var(--color-cream-darker)]",
                  "h-48 sm:h-56 max-h-[40vh]"
                )}
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.nameEn}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--color-interactive-primary)]/20 to-[var(--color-accent-tertiary)]/10">
                    <span className="text-sm text-[var(--color-charcoal-muted)]">No image</span>
                  </div>
                )}

                {item.isSoldOut && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <Badge className="bg-white px-4 py-2 text-base text-[var(--color-charcoal)] shadow-[var(--shadow-lg)]">
                      Sold Out
                    </Badge>
                  </div>
                )}
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="space-y-[var(--space-4)] p-[var(--space-4)]">
                  {/* Header */}
                  <div className="space-y-1">
                    <h2
                      id="modal-title"
                      className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-charcoal)]"
                    >
                      {item.nameEn}
                    </h2>
                    {item.nameMy && (
                      <p className="font-burmese text-[var(--color-charcoal-muted)]">
                        {item.nameMy}
                      </p>
                    )}
                    <p className="font-[var(--font-display)] text-2xl font-bold text-[var(--color-interactive-primary)]">
                      {formatPrice(item.basePriceCents)}
                    </p>
                  </div>

                  {/* Description */}
                  {item.descriptionEn && (
                    <p className="text-[var(--color-charcoal-muted)]">
                      {item.descriptionEn}
                    </p>
                  )}

                  {/* Allergen Warning */}
                  {hasAllergens && (
                    <div className={cn(
                      "flex items-start gap-3 rounded-[var(--radius-md)]",
                      "border border-[var(--color-status-warning)]/30 bg-[var(--color-status-warning-bg)] p-[var(--space-3)]"
                    )}>
                      <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-status-warning)]" />
                      <div>
                        <p className="font-medium text-[var(--color-text-primary)]">Allergen Information</p>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          Contains:{" "}
                          {item.allergens
                            .map((allergen) => ALLERGEN_MAP[allergen]?.label || allergen)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Modifier Groups */}
                  {item.modifierGroups.length > 0 && (
                    <div className="divide-y divide-[var(--color-border)]">
                      {item.modifierGroups.map((group) => (
                        <ModifierGroup
                          key={group.id}
                          group={group}
                          selectedOptions={selectedModifiers
                            .filter((mod) => mod.groupId === group.id)
                            .map((mod) => mod.optionId)}
                          onSelect={(optionId, option) =>
                            handleModifierSelect(group.id, group.name, optionId, option)
                          }
                          onDeselect={handleModifierDeselect}
                        />
                      ))}
                    </div>
                  )}

                  {/* Special Instructions */}
                  <div className="space-y-2">
                    <Label htmlFor="item-notes" className="text-[var(--color-charcoal)]">
                      Special Instructions (Optional)
                    </Label>
                    <Textarea
                      id="item-notes"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value.slice(0, 500))}
                      placeholder="Any special requests? Let us know..."
                      className="resize-none border-[var(--color-border)] focus:border-[var(--color-interactive-primary)]"
                      rows={3}
                    />
                    <p className="text-xs text-[var(--color-charcoal-muted)] text-right">
                      {notes.length}/500
                    </p>
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center justify-between">
                    <Label className="text-[var(--color-charcoal)]">Quantity</Label>
                    <QuantitySelector
                      value={quantity}
                      onChange={setQuantity}
                      disabled={item.isSoldOut}
                    />
                  </div>
                </div>
              </div>

              {/* Footer - Fixed at bottom */}
              <div className={cn(
                "shrink-0 border-t border-[var(--color-border)]",
                "bg-[var(--color-surface)] p-[var(--space-4)]",
                "safe-area-inset-bottom"
              )}>
                {/* Free Delivery Incentive */}
                {amountForFreeDelivery > 0 && !item.isSoldOut && (
                  <div className={cn(
                    "mb-3 flex items-center gap-2 rounded-[var(--radius-sm)]",
                    "bg-[var(--color-accent-secondary)]/10 px-3 py-2"
                  )}>
                    <Truck className="h-4 w-4 text-[var(--color-accent-secondary)]" />
                    <p className="text-sm text-[var(--color-accent-secondary)]">
                      Add {formatPrice(amountForFreeDelivery)} more for free delivery!
                    </p>
                  </div>
                )}

                {/* Validation Error */}
                {!validation.isValid && validation.errors.length > 0 && (
                  <p className="mb-3 text-sm text-[var(--color-error)]">
                    {validation.errors[0]}
                  </p>
                )}

                {/* Add to Cart Button */}
                <motion.div
                  animate={isAddingToCart ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={item.isSoldOut || !validation.isValid || isAddingToCart}
                    className={cn(
                      "w-full text-lg transition-all duration-200",
                      isAddingToCart && "bg-[var(--color-accent-secondary)] hover:bg-[var(--color-accent-secondary)]"
                    )}
                  >
                    <AnimatePresence mode="wait">
                      {isAddingToCart ? (
                        <motion.span
                          key="success"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-2"
                        >
                          <Check className="w-5 h-5" />
                          Added!
                        </motion.span>
                      ) : item.isSoldOut ? (
                        <motion.span key="soldout">Sold Out</motion.span>
                      ) : (
                        <motion.span
                          key="add"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          Add to Cart - {formatPrice(priceCalc?.totalCents ?? 0)}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
              </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
