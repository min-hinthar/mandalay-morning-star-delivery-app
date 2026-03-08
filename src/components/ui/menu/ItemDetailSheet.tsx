"use client";

/**
 * ItemDetailSheet Component
 *
 * Responsive item detail overlay that displays full item information
 * with modifiers and add-to-cart functionality.
 *
 * Features:
 * - Drawer (bottom sheet) on mobile (<640px), Modal on desktop (>=640px)
 * - Modifier group selection
 * - Quantity selection
 * - Special instructions
 * - Allergen warning display
 * - AddToCartButton with fly animation
 * - Price calculation with real-time updates
 */

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Drawer } from "@/components/ui/Drawer";
import { AddToCartButton, QuantitySelector } from "@/components/ui/cart";
import { ModifierGroup } from "./ModifierGroup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { formatPrice } from "@/lib/utils/currency";
import {
  calculateItemPrice,
  validateModifierSelection,
  type SelectedModifier,
} from "@/lib/utils/price";
import { toast } from "@/lib/hooks/useToastV8";
import { cn } from "@/lib/utils/cn";
import type { CartItem } from "@/types/cart";
import type { MenuItem, ModifierOption } from "@/types/menu";
import { AllergenWarning, DiscardChangesDialog, getCategoryEmoji } from "./ItemDetailSheet/helpers";

// ============================================
// TYPES
// ============================================

export interface ItemDetailSheetProps {
  /** Menu item to display */
  item: MenuItem | null;
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Callback when sheet should close */
  onClose: () => void;
  /** Callback after item is added to cart */
  onAddToCart?: (
    item: MenuItem,
    modifiers: SelectedModifier[],
    quantity: number,
    notes: string
  ) => void;
  /** Cart item being edited (enables edit mode when provided) */
  editingCartItem?: CartItem;
  /** Callback when cart item is updated in edit mode */
  onUpdateCart?: (
    cartItemId: string,
    modifiers: SelectedModifier[],
    quantity: number,
    notes: string,
    basePriceCents: number
  ) => void;
  /** Extra className for the Drawer/Modal wrapper (e.g. z-index override) */
  className?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ItemDetailSheet({
  item,
  isOpen,
  onClose,
  onAddToCart,
  editingCartItem,
  onUpdateCart,
  className: wrapperClassName,
}: ItemDetailSheetProps) {
  // State
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Modifier scroll overflow detection
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const modifierContainerRef = useRef<HTMLDivElement>(null);

  // Track initial edit values to detect dirty state
  const initialEditState = useRef<{
    modifiers: SelectedModifier[];
    quantity: number;
    notes: string;
  } | null>(null);

  const isEditMode = !!editingCartItem;

  // Responsive overlay selection
  const isMobile = useMediaQuery("(max-width: 639px)");

  // Reset state when item changes OR when modal opens
  // In edit mode, pre-populate from editingCartItem
  useEffect(() => {
    if (!item || !isOpen) return;

    if (editingCartItem) {
      // Edit mode: pre-populate from cart item
      const editModifiers = editingCartItem.modifiers.map((m) => ({
        groupId: m.groupId,
        groupName: m.groupName,
        optionId: m.optionId,
        optionName: m.optionName,
        priceDeltaCents: m.priceDeltaCents,
      }));
      setSelectedModifiers(editModifiers);
      setQuantity(editingCartItem.quantity);
      setNotes(editingCartItem.notes);
      initialEditState.current = {
        modifiers: editModifiers,
        quantity: editingCartItem.quantity,
        notes: editingCartItem.notes,
      };
    } else {
      // Add mode: reset to empty
      setSelectedModifiers([]);
      setQuantity(1);
      setNotes("");
      initialEditState.current = null;
    }
  }, [item, isOpen, editingCartItem]);

  // Detect modifier container overflow and track scroll position
  useEffect(() => {
    const el = modifierContainerRef.current;
    if (!el) {
      setHasOverflow(false);
      return;
    }
    setHasOverflow(el.scrollHeight > el.clientHeight);
    setIsAtBottom(false);

    const onScroll = () => {
      // 4px threshold for "at bottom" to handle sub-pixel rounding
      setIsAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 4);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [item?.modifierGroups]);

  // Compute dirty state for edit mode
  const isDirty = useMemo(() => {
    if (!isEditMode || !initialEditState.current) return false;
    const initial = initialEditState.current;
    if (quantity !== initial.quantity) return true;
    if (notes !== initial.notes) return true;
    if (selectedModifiers.length !== initial.modifiers.length) return true;
    const initialIds = new Set(initial.modifiers.map((m) => m.optionId));
    return selectedModifiers.some((m) => !initialIds.has(m.optionId));
  }, [isEditMode, selectedModifiers, quantity, notes]);

  // Handle close with dirty-state check
  const handleRequestClose = useCallback(() => {
    if (isEditMode && isDirty) {
      setShowDiscardDialog(true);
    } else {
      onClose();
    }
  }, [isEditMode, isDirty, onClose]);

  // ============================================
  // PRICE AND VALIDATION
  // ============================================

  const priceCalc = useMemo(() => {
    if (!item) return null;
    return calculateItemPrice(item, selectedModifiers, quantity);
  }, [item, selectedModifiers, quantity]);

  const validation = useMemo(() => {
    if (!item) return { isValid: false, errors: [] as string[] };
    return validateModifierSelection(item, selectedModifiers);
  }, [item, selectedModifiers]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleModifierSelect = useCallback(
    (optionId: string, option: ModifierOption) => {
      if (!item) return;

      // Find which group this option belongs to
      const group = item.modifierGroups.find((g) => g.options.some((o) => o.id === optionId));
      if (!group) return;

      if (group.selectionType === "single") {
        // For single selection, replace any existing selection in this group
        setSelectedModifiers((prev) => [
          ...prev.filter((mod) => mod.groupId !== group.id),
          {
            groupId: group.id,
            groupName: group.name,
            optionId,
            optionName: option.name,
            priceDeltaCents: option.priceDeltaCents,
          },
        ]);
        return;
      }

      // For multiple selection, add if not already selected
      setSelectedModifiers((prev) => {
        if (prev.some((mod) => mod.optionId === optionId)) {
          return prev;
        }
        return [
          ...prev,
          {
            groupId: group.id,
            groupName: group.name,
            optionId,
            optionName: option.name,
            priceDeltaCents: option.priceDeltaCents,
          },
        ];
      });
    },
    [item]
  );

  const handleModifierDeselect = useCallback((optionId: string) => {
    setSelectedModifiers((prev) => prev.filter((mod) => mod.optionId !== optionId));
  }, []);

  const handleAddToCart = useCallback(() => {
    if (!item || !onAddToCart) return;
    onAddToCart(item, selectedModifiers, quantity, notes.trim());
    onClose();
  }, [item, onAddToCart, selectedModifiers, quantity, notes, onClose]);

  const handleUpdateCart = useCallback(() => {
    if (!item || !editingCartItem || !onUpdateCart) return;
    const totalCents = priceCalc?.totalCents ?? 0;
    const unitPriceCents = quantity > 0 ? Math.round(totalCents / quantity) : item.basePriceCents;
    onUpdateCart(
      editingCartItem.cartItemId,
      selectedModifiers,
      quantity,
      notes.trim(),
      unitPriceCents
    );
    toast({ message: "Cart updated", type: "success" });
    onClose();
  }, [item, editingCartItem, onUpdateCart, selectedModifiers, quantity, notes, priceCalc, onClose]);

  // ============================================
  // RENDER CONTENT
  // ============================================

  const renderContent = () => {
    if (!item) return null;

    return (
      <div className={cn("flex flex-col", isMobile && "h-full")}>
        {/* Hero Image */}
        <div className="relative aspect-video shrink-0 bg-zinc-100 dark:bg-zinc-800">
          {/* Close Button - uses semi-transparent overlay on image */}
          <button
            onClick={handleRequestClose}
            className={cn(
              "absolute top-3 right-3 z-10",
              "w-8 h-8 rounded-full",
              "bg-surface-inverse/50 hover:bg-surface-inverse/70",
              "flex items-center justify-center",
              "text-text-inverse",
              "transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-surface-primary/50"
            )}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.nameEn}
              fill
              sizes="(max-width: 640px) 100vw, 512px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl">{getCategoryEmoji(item.tags?.[0])}</span>
            </div>
          )}
          {item.isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-overlay-heavy">
              <Badge variant="default" size="lg">
                Sold Out
              </Badge>
            </div>
          )}
        </div>

        {/* Scrollable Content - touchAction inherited from Drawer content wrapper */}
        <div
          className={cn(
            "p-4 space-y-4",
            isMobile ? "flex-1 overflow-y-auto overscroll-contain" : ""
          )}
        >
          {/* Header */}
          <div>
            <h2 className="font-display text-2xl font-bold text-text-primary">{item.nameEn}</h2>
            {item.nameMy && <p className="font-burmese text-text-muted">{item.nameMy}</p>}
            <p className="font-display text-2xl font-bold text-primary mt-1">
              {formatPrice(item.basePriceCents)}
            </p>
          </div>

          {/* Description */}
          {item.descriptionEn && <p className="text-text-secondary">{item.descriptionEn}</p>}

          {/* Allergen Warning */}
          {item.allergens && item.allergens.length > 0 && (
            <AllergenWarning allergens={item.allergens} />
          )}

          {/* Modifier Groups with overflow fade indicator */}
          {item.modifierGroups && item.modifierGroups.length > 0 && (
            <div className="relative">
              <div
                ref={modifierContainerRef}
                className={cn(
                  "divide-y divide-border",
                  isMobile && "max-h-[50vh] overflow-y-auto overscroll-contain"
                )}
              >
                {item.modifierGroups.map((group) => (
                  <ModifierGroup
                    key={group.id}
                    group={group}
                    selectedOptions={selectedModifiers
                      .filter((m) => m.groupId === group.id)
                      .map((m) => m.optionId)}
                    onSelect={handleModifierSelect}
                    onDeselect={handleModifierDeselect}
                  />
                ))}
              </div>
              {hasOverflow && !isAtBottom && (
                <div
                  className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-surface-primary to-transparent"
                  aria-hidden="true"
                />
              )}
            </div>
          )}

          {/* Special Instructions */}
          <div className="space-y-2">
            <Label htmlFor="item-notes">Special Instructions (Optional)</Label>
            <Textarea
              id="item-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              placeholder="Any special requests? Let us know..."
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-text-muted text-right">{notes.length}/500</p>
          </div>

          {/* Quantity */}
          <div className="flex items-center justify-between">
            <Label>Quantity</Label>
            <QuantitySelector
              quantity={quantity}
              onIncrement={() => !item.isSoldOut && setQuantity((q) => Math.min(q + 1, 99))}
              onDecrement={() => !item.isSoldOut && setQuantity((q) => Math.max(q - 1, 1))}
              min={1}
              max={99}
            />
          </div>
        </div>

        {/* Footer with Add to Cart / Update Cart */}
        {/* eslint-disable-next-line no-restricted-syntax -- explicit colors needed for mobile CSS var resolution */}
        <div className="shrink-0 border-t border-border p-4 bg-white dark:bg-black safe-area-inset-bottom">
          {/* Validation Error */}
          {!validation.isValid && validation.errors[0] && (
            <p className="mb-2 text-sm text-status-error">{validation.errors[0]}</p>
          )}

          {isEditMode ? (
            item.isSoldOut ? (
              <Button variant="danger" size="lg" onClick={handleRequestClose} className="w-full">
                Item Unavailable - Remove from Cart
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={handleUpdateCart}
                disabled={!validation.isValid}
                className="w-full"
              >
                {`Update Cart - ${formatPrice(priceCalc?.totalCents ?? 0)}`}
              </Button>
            )
          ) : (
            <AddToCartButton
              item={{
                menuItemId: item.id,
                menuItemSlug: item.slug,
                nameEn: item.nameEn,
                nameMy: item.nameMy,
                imageUrl: item.imageUrl,
                basePriceCents: priceCalc?.totalCents ?? item.basePriceCents,
              }}
              quantity={quantity}
              modifiers={selectedModifiers}
              notes={notes.trim()}
              disabled={item.isSoldOut || !validation.isValid}
              onAdd={handleAddToCart}
              className="w-full"
              size="lg"
            >
              {item.isSoldOut
                ? "Sold Out"
                : `Add to Cart - ${formatPrice(priceCalc?.totalCents ?? 0)}`}
            </AddToCartButton>
          )}
        </div>

        {/* Discard changes confirmation dialog */}
        <DiscardChangesDialog
          open={showDiscardDialog}
          onOpenChange={setShowDiscardDialog}
          onDiscard={() => {
            setShowDiscardDialog(false);
            onClose();
          }}
        />
      </div>
    );
  };

  // ============================================
  // RENDER OVERLAY
  // ============================================

  if (isMobile) {
    return (
      <Drawer
        isOpen={isOpen && item !== null}
        onClose={handleRequestClose}
        position="bottom"
        height="full"
        showDragHandle={true}
        title={item?.nameEn ? `Item details for ${item.nameEn}` : "Item details"}
        className={cn("flex flex-col", wrapperClassName)}
      >
        {renderContent()}
      </Drawer>
    );
  }

  return (
    <Modal
      isOpen={isOpen && item !== null}
      onClose={handleRequestClose}
      title={item?.nameEn ?? "Item Detail"}
      size="lg"
      showCloseButton={false}
      className={cn("overflow-hidden p-0", wrapperClassName)}
      contentClassName="!p-0 !pt-0"
    >
      {renderContent()}
    </Modal>
  );
}

export default ItemDetailSheet;
