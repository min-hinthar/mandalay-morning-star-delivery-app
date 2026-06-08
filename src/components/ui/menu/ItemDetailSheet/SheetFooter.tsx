"use client";

import type { CSSProperties } from "react";
import { AddToCartButton } from "@/components/ui/cart";
import { Button } from "@/components/ui/button";
import { RollingNumber } from "@/components/ui/homepage/Hero/RollingDigits";
import type { MenuItem } from "@/types/menu";
import type { SelectedModifier } from "@/lib/utils/price";

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
// SHEET FOOTER — sticky Add to Cart / Update Cart (After Dark)
// ============================================

export interface SheetFooterProps {
  isEditMode: boolean;
  item: MenuItem;
  validation: { isValid: boolean; errors: string[] };
  totalCents: number;
  animatePrice: boolean;
  quantity: number;
  selectedModifiers: SelectedModifier[];
  finalNotes: string;
  onUpdate: () => void;
  onAdd: () => void;
  onRequestClose: () => void;
}

export function SheetFooter({
  isEditMode,
  item,
  validation,
  totalCents,
  animatePrice,
  quantity,
  selectedModifiers,
  finalNotes,
  onUpdate,
  onAdd,
  onRequestClose,
}: SheetFooterProps) {
  // Warm clay glow behind an actionable CTA — radial-gradient (no blur — iOS GPU budget)
  const actionable = !item.isSoldOut && validation.isValid;
  const glow = actionable ? (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -inset-1.5 rounded-2xl opacity-50"
      style={
        {
          background: "radial-gradient(60% 120% at 50% 50%, var(--hero-clay), transparent 72%)",
        } as CSSProperties
      }
    />
  ) : null;

  return (
    <div className="menu-sheet-footer safe-area-inset-bottom shrink-0 border-t border-border bg-surface-secondary p-4">
      {/* Validation Error */}
      {!validation.isValid && validation.errors[0] && (
        <p className="mb-2 text-sm text-status-error">{validation.errors[0]}</p>
      )}

      <div className="relative">
        {glow}
        {isEditMode ? (
          item.isSoldOut ? (
            <Button variant="danger" size="lg" onClick={onRequestClose} className="relative w-full">
              Item Unavailable - Remove from Cart
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={onUpdate}
              disabled={!validation.isValid}
              className="relative w-full"
            >
              <span className="inline-flex items-center gap-1">
                Update Cart -
                <LivePrice cents={totalCents} animate={animatePrice} />
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
              basePriceCents: totalCents || item.basePriceCents,
            }}
            quantity={quantity}
            modifiers={selectedModifiers}
            notes={finalNotes}
            disabled={item.isSoldOut || !validation.isValid}
            onAdd={onAdd}
            className="relative w-full"
            size="lg"
          >
            {item.isSoldOut ? (
              "Sold Out"
            ) : (
              <span className="inline-flex items-center gap-1">
                Add to Cart -
                <LivePrice cents={totalCents} animate={animatePrice} />
              </span>
            )}
          </AddToCartButton>
        )}
      </div>
    </div>
  );
}

export default SheetFooter;
