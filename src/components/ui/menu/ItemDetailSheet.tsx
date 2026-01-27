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

import { useEffect, useMemo, useState, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { AnimatedImage } from "@/components/ui/animated-image";
import { Modal } from "@/components/ui/Modal";
import { Drawer } from "@/components/ui/Drawer";
import { AddToCartButton } from "@/components/ui/cart";
import { ModifierGroup } from "./ModifierGroup";
import { QuantitySelector } from "./QuantitySelector";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { formatPrice } from "@/lib/utils/currency";
import {
  calculateItemPrice,
  validateModifierSelection,
  type SelectedModifier,
} from "@/lib/utils/price";
import { ALLERGEN_MAP } from "@/lib/constants/allergens";
import { cn } from "@/lib/utils/cn";
import type { MenuItem, ModifierOption } from "@/types/menu";

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
}

// ============================================
// ALLERGEN WARNING COMPONENT
// ============================================

function AllergenWarning({ allergens }: { allergens: string[] }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg p-3",
        "border border-status-warning/30 bg-status-warning/10"
      )}
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-status-warning" />
      <div>
        <p className="font-medium text-text-primary">Allergen Information</p>
        <p className="text-sm text-text-secondary">
          Contains:{" "}
          {allergens.map((a) => ALLERGEN_MAP[a]?.label || a).join(", ")}
        </p>
      </div>
    </div>
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
}: ItemDetailSheetProps) {
  // State
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  // Responsive overlay selection
  const isMobile = useMediaQuery("(max-width: 639px)");

  // Reset state when item changes
  useEffect(() => {
    if (!item) return;
    setSelectedModifiers([]);
    setQuantity(1);
    setNotes("");
  }, [item]);

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
      const group = item.modifierGroups.find((g) =>
        g.options.some((o) => o.id === optionId)
      );
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

  // ============================================
  // RENDER CONTENT
  // ============================================

  const renderContent = () => {
    if (!item) return null;

    return (
      <div className="flex flex-col h-full">
        {/* Hero Image */}
        <div className="relative aspect-video shrink-0 bg-zinc-100 dark:bg-zinc-800">
          {item.imageUrl ? (
            <AnimatedImage
              src={item.imageUrl}
              alt={item.nameEn}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 640px) 100vw, 480px"
              variant="blur-scale"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl">
                {getCategoryEmoji(item.tags?.[0])}
              </span>
            </div>
          )}
          {item.isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <Badge variant="default" size="lg">
                Sold Out
              </Badge>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
          {/* Header */}
          <div>
            <h2 className="font-display text-2xl font-bold text-text-primary">
              {item.nameEn}
            </h2>
            {item.nameMy && (
              <p className="font-burmese text-text-muted">{item.nameMy}</p>
            )}
            <p className="font-display text-2xl font-bold text-primary mt-1">
              {formatPrice(item.basePriceCents)}
            </p>
          </div>

          {/* Description */}
          {item.descriptionEn && (
            <p className="text-text-secondary">{item.descriptionEn}</p>
          )}

          {/* Allergen Warning */}
          {item.allergens && item.allergens.length > 0 && (
            <AllergenWarning allergens={item.allergens} />
          )}

          {/* Modifier Groups */}
          {item.modifierGroups && item.modifierGroups.length > 0 && (
            <div className="divide-y divide-border">
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
            <p className="text-xs text-text-muted text-right">
              {notes.length}/500
            </p>
          </div>

          {/* Quantity */}
          <div className="flex items-center justify-between">
            <Label>Quantity</Label>
            <QuantitySelector
              value={quantity}
              onChange={setQuantity}
              disabled={item.isSoldOut}
            />
          </div>
        </div>

        {/* Footer with Add to Cart */}
        <div className="shrink-0 border-t border-border p-4 bg-white dark:bg-zinc-900 safe-area-inset-bottom">
          {/* Validation Error */}
          {!validation.isValid && validation.errors[0] && (
            <p className="mb-2 text-sm text-status-error">{validation.errors[0]}</p>
          )}

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
        </div>
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
        onClose={onClose}
        position="bottom"
        height="full"
        showDragHandle={true}
        className="flex flex-col"
      >
        {renderContent()}
      </Drawer>
    );
  }

  return (
    <Modal
      isOpen={isOpen && item !== null}
      onClose={onClose}
      title={item?.nameEn ?? "Item Detail"}
      size="lg"
      showCloseButton={true}
      className="overflow-hidden p-0"
    >
      {renderContent()}
    </Modal>
  );
}

// ============================================
// HELPERS
// ============================================

/**
 * Get emoji placeholder for menu item based on category/tags
 */
function getCategoryEmoji(category?: string): string {
  const emojiMap: Record<string, string> = {
    appetizers: "🥟",
    soups: "🍲",
    salads: "🥗",
    curries: "🍛",
    noodles: "🍜",
    rice: "🍚",
    seafood: "🦐",
    meat: "🥩",
    vegetarian: "🥬",
    desserts: "🍰",
    drinks: "🥤",
    specials: "⭐",
  };
  return emojiMap[category?.toLowerCase() ?? ""] ?? "🍽️";
}

export default ItemDetailSheet;
