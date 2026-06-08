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
import { Modal } from "@/components/ui/Modal";
import { Drawer } from "@/components/ui/Drawer";
import { AddToCartButton, QuantitySelector } from "@/components/ui/cart";
import { ModifierGroup } from "./ModifierGroup";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useReducedMotion } from "framer-motion";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { RollingNumber } from "@/components/ui/homepage/Hero/RollingDigits";
import {
  calculateItemPrice,
  validateModifierSelection,
  type SelectedModifier,
} from "@/lib/utils/price";
import { toast } from "@/lib/hooks/useToastV8";
import { cn } from "@/lib/utils/cn";
import type { CartItem } from "@/types/cart";
import type { MenuItem, ModifierOption } from "@/types/menu";
import { AllergenWarning, DiscardChangesDialog } from "./ItemDetailSheet/helpers";
import { DishHero } from "./ItemDetailSheet/DishHero";
import { VeganToggle } from "./ItemDetailSheet/VeganToggle";
import {
  isVeganizable,
  composeNotes,
  splitVeganNote,
  userNotesBudget,
} from "@/lib/menu/vegan-request";

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
// LIVE PRICE — rolls the total as modifiers / quantity change
// ============================================

function LivePrice({ cents, animate }: { cents: number; animate: boolean }) {
  return (
    <span className="tabular-nums">
      {/* Real price for the accessible name (rolling digits are aria-hidden) */}
      <span className="sr-only">${(cents / 100).toFixed(2)}</span>
      <span aria-hidden="true">
        {"$"}
        <RollingNumber value={cents / 100} decimals={2} animate={animate} />
      </span>
    </span>
  );
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
  const [makeVegan, setMakeVegan] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const veganizable = isVeganizable(item?.tags);

  // Track initial edit values to detect dirty state
  const initialEditState = useRef<{
    modifiers: SelectedModifier[];
    quantity: number;
    notes: string;
    makeVegan: boolean;
  } | null>(null);

  const isEditMode = !!editingCartItem;

  // Responsive overlay selection
  const isMobile = useMediaQuery("(max-width: 639px)");
  const prefersReducedMotion = useReducedMotion();
  const animatePrice = !prefersReducedMotion;

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
      // Recover the "make it vegan" toggle from the stored notes
      const { makeVegan: editVegan, userNotes: editNotes } = splitVeganNote(editingCartItem.notes);
      setSelectedModifiers(editModifiers);
      setQuantity(editingCartItem.quantity);
      setNotes(editNotes);
      setMakeVegan(editVegan);
      initialEditState.current = {
        modifiers: editModifiers,
        quantity: editingCartItem.quantity,
        notes: editNotes,
        makeVegan: editVegan,
      };
    } else {
      // Add mode: reset to empty
      setSelectedModifiers([]);
      setQuantity(1);
      setNotes("");
      setMakeVegan(false);
      initialEditState.current = null;
    }
  }, [item, isOpen, editingCartItem]);

  // Compute dirty state for edit mode
  const isDirty = useMemo(() => {
    if (!isEditMode || !initialEditState.current) return false;
    const initial = initialEditState.current;
    if (quantity !== initial.quantity) return true;
    if (notes !== initial.notes) return true;
    if (makeVegan !== initial.makeVegan) return true;
    if (selectedModifiers.length !== initial.modifiers.length) return true;
    const initialIds = new Set(initial.modifiers.map((m) => m.optionId));
    return selectedModifiers.some((m) => !initialIds.has(m.optionId));
  }, [isEditMode, selectedModifiers, quantity, notes, makeVegan]);

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

  // Final notes = the kitchen "make vegan" instruction (when toggled) + user text
  const finalNotes = composeNotes(veganizable && makeVegan, notes);
  // Keep the user's free text within budget so the composed note never trips
  // the 500-char checkout cap.
  const notesLimit = userNotesBudget(veganizable && makeVegan);

  // Re-clamp existing notes when the budget shrinks (e.g. "Make it vegan"
  // toggled on after a long note) so the counter stays truthful and we don't
  // silently drop the user's trailing text inside composeNotes.
  useEffect(() => {
    setNotes((n) => (n.length > notesLimit ? n.slice(0, notesLimit) : n));
  }, [notesLimit]);

  const handleAddToCart = useCallback(() => {
    if (!item || !onAddToCart) return;
    onAddToCart(item, selectedModifiers, quantity, finalNotes);
    onClose();
  }, [item, onAddToCart, selectedModifiers, quantity, finalNotes, onClose]);

  const handleUpdateCart = useCallback(() => {
    if (!item || !editingCartItem || !onUpdateCart) return;
    const totalCents = priceCalc?.totalCents ?? 0;
    const unitPriceCents = quantity > 0 ? Math.round(totalCents / quantity) : item.basePriceCents;
    onUpdateCart(
      editingCartItem.cartItemId,
      selectedModifiers,
      quantity,
      finalNotes,
      unitPriceCents
    );
    toast({ message: "Cart updated", type: "success" });
    onClose();
  }, [
    item,
    editingCartItem,
    onUpdateCart,
    selectedModifiers,
    quantity,
    finalNotes,
    priceCalc,
    onClose,
  ]);

  // ============================================
  // RENDER CONTENT
  // ============================================

  const renderContent = () => {
    if (!item) return null;

    return (
      <div
        className={cn("menu-paper relative flex flex-col bg-surface-primary", isMobile && "h-full")}
      >
        {/* Photo-first hero: clean food photo + un-clipped close + title below */}
        <DishHero item={item} onClose={handleRequestClose} />

        {/* Scrollable Content - touchAction inherited from Drawer content wrapper */}
        <div
          className={cn(
            "space-y-4 px-4 pb-4 pt-3",
            isMobile ? "flex-1 overflow-y-auto overscroll-contain" : ""
          )}
        >
          {/* Description */}
          {item.descriptionEn && <p className="text-text-secondary">{item.descriptionEn}</p>}

          {/* Allergen Warning */}
          {item.allergens && item.allergens.length > 0 && (
            <AllergenWarning allergens={item.allergens} />
          )}

          {/* Modifier Groups — flow in the single sheet scroll (no nested box) */}
          {item.modifierGroups && item.modifierGroups.length > 0 && (
            <div className="space-y-3">
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
          )}

          {/* Make it vegan — one tap attaches a bilingual kitchen instruction */}
          {veganizable && (
            <VeganToggle makeVegan={makeVegan} onToggle={() => setMakeVegan((v) => !v)} />
          )}

          {/* Special Instructions */}
          <div className="space-y-2">
            <Label htmlFor="item-notes">Special Instructions (Optional)</Label>
            <Textarea
              id="item-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, notesLimit))}
              placeholder="Any special requests? Let us know..."
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-text-muted text-right">
              {notes.length}/{notesLimit}
            </p>
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

        {/* Footer with Add to Cart / Update Cart — warm-paper card surface */}
        <div className="menu-sheet-footer safe-area-inset-bottom shrink-0 border-t border-border bg-surface-secondary p-4">
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
                <span className="inline-flex items-center gap-1">
                  Update Cart -
                  <LivePrice cents={priceCalc?.totalCents ?? 0} animate={animatePrice} />
                </span>
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
              notes={finalNotes}
              disabled={item.isSoldOut || !validation.isValid}
              onAdd={handleAddToCart}
              className="w-full"
              size="lg"
            >
              {item.isSoldOut ? (
                "Sold Out"
              ) : (
                <span className="inline-flex items-center gap-1">
                  Add to Cart -
                  <LivePrice cents={priceCalc?.totalCents ?? 0} animate={animatePrice} />
                </span>
              )}
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
