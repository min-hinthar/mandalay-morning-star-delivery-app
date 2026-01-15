"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
}

export function ItemDetailModal({
  item,
  open,
  onClose,
  onAddToCart,
}: ItemDetailModalProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!item) return;
    setSelectedModifiers([]);
    setQuantity(1);
    setNotes("");
  }, [item]);

  const priceCalc = useMemo(() => {
    if (!item) return null;
    return calculateItemPrice(item, selectedModifiers, quantity);
  }, [item, selectedModifiers, quantity]);

  const validation = useMemo(() => {
    if (!item) return { isValid: false, errors: [] };
    return validateModifierSelection(item, selectedModifiers);
  }, [item, selectedModifiers]);

  const handleModifierSelect = (
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
  };

  const handleModifierDeselect = (optionId: string) => {
    setSelectedModifiers((prev) => prev.filter((mod) => mod.optionId !== optionId));
  };

  const handleAddToCart = () => {
    if (!item || !validation.isValid || !onAddToCart) return;
    onAddToCart(item, selectedModifiers, quantity, notes.trim());
    onClose();
  };

  if (!item) return null;

  const hasAllergens = item.allergens.length > 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <div className="relative h-48 bg-muted sm:h-56">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.nameEn}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gold/20 to-brand-red/10">
              <span className="text-sm text-muted">No image</span>
            </div>
          )}

          {item.isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <Badge className="bg-white px-4 py-2 text-base text-foreground">
                Sold Out
              </Badge>
            </div>
          )}
        </div>

        <ScrollArea className="max-h-[calc(90vh-12rem-72px)]">
          <div className="space-y-6 p-6">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="font-display text-2xl">
                {item.nameEn}
              </DialogTitle>
              {item.nameMy && (
                <p className="font-burmese text-muted-foreground">{item.nameMy}</p>
              )}
              <p className="text-2xl font-bold text-brand-red">
                {formatPrice(item.basePriceCents)}
              </p>
            </DialogHeader>

            {item.descriptionEn && (
              <p className="text-muted-foreground">{item.descriptionEn}</p>
            )}

            {hasAllergens && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">Allergen Information</p>
                  <p className="text-sm text-amber-700">
                    Contains:{" "}
                    {item.allergens
                      .map((allergen) => ALLERGEN_MAP[allergen]?.label || allergen)
                      .join(", ")}
                  </p>
                </div>
              </div>
            )}

            {item.modifierGroups.length > 0 && (
              <div className="divide-y divide-border">
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

            <div className="space-y-2">
              <Label htmlFor="item-notes">Special Instructions (Optional)</Label>
              <Textarea
                id="item-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value.slice(0, 500))}
                placeholder="Any special requests? Let us know..."
                className="resize-none"
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">
                {notes.length}/500
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label>Quantity</Label>
              <QuantitySelector
                value={quantity}
                onChange={setQuantity}
                disabled={item.isSoldOut}
              />
            </div>
          </div>
        </ScrollArea>

        <div className="border-t border-border bg-background p-4">
          {!validation.isValid && validation.errors.length > 0 && (
            <p className="mb-3 text-sm text-destructive">{validation.errors[0]}</p>
          )}
          <Button
            onClick={handleAddToCart}
            disabled={item.isSoldOut || !validation.isValid}
            className="h-12 w-full text-lg"
          >
            {item.isSoldOut
              ? "Sold Out"
              : `Add to Cart - ${formatPrice(priceCalc?.totalCents ?? 0)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
