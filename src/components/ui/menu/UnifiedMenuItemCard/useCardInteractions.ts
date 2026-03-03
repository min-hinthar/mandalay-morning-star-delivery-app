"use client";

import { useRef, useCallback, useMemo, useEffect } from "react";
import { useCart } from "@/lib/hooks/useCart";
import type { MenuItem } from "@/types/menu";

// Long-press duration for opening detail sheet (iOS standard per CONTEXT.md)
const LONG_PRESS_DURATION = 500;

// ============================================
// TYPES
// ============================================

export interface UseCardInteractionsOptions {
  item: MenuItem;
  onSelect?: (item: MenuItem) => void;
  onQuickAdd?: (item: MenuItem) => void;
  isFavorite: boolean;
  controlledFavoriteToggle?: (item: MenuItem, isFavorite: boolean) => void;
  favoritesToggle: (id: string) => void;
  /** Whether tilt is enabled (affects touch end reset) */
  shouldEnableTilt: boolean;
  /** Reset tilt callback from useTiltEffect */
  resetTilt: () => void;
}

export interface UseCardInteractionsReturn {
  /** Total quantity of this item in cart (all modifier variants) */
  totalQuantityInCart: number;
  /** Whether item has required modifiers */
  hasRequiredModifiers: boolean;
  /** Card click handler (opens detail view) */
  handleCardClick: () => void;
  /** Favorite toggle handler */
  handleFavoriteToggle: (newState: boolean) => void;
  /** Add button handler */
  handleAdd: () => void;
  /** Increment quantity handler */
  handleIncrement: () => void;
  /** Decrement quantity handler */
  handleDecrement: () => void;
  /** Touch start handler (long-press detection) */
  handleTouchStart: (e: React.TouchEvent) => void;
  /** Touch end handler (cancel long-press + reset tilt) */
  handleTouchEnd: () => void;
  /** Touch move handler (cancel long-press on scroll) */
  handleTouchMoveCancel: (e: React.TouchEvent) => void;
}

// ============================================
// HOOK
// ============================================

/**
 * Manages card interaction handlers: click, add, increment, decrement,
 * favorite toggle, and long-press logic.
 * Extracted from UnifiedMenuItemCard for file size reduction.
 */
export function useCardInteractions({
  item,
  onSelect,
  onQuickAdd,
  isFavorite: _isFavorite,
  controlledFavoriteToggle,
  favoritesToggle,
  shouldEnableTilt,
  resetTilt,
}: UseCardInteractionsOptions): UseCardInteractionsReturn {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  // Cart integration
  const cart = useCart();

  // Cleanup longPressTimer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };
  }, []);

  /**
   * Get total quantity of this item in cart (all modifier variants combined).
   */
  const totalQuantityInCart = useMemo(() => {
    return cart.items
      .filter((ci) => ci.menuItemId === item.id)
      .reduce((sum, ci) => sum + ci.quantity, 0);
  }, [cart.items, item.id]);

  // Check if item has required modifiers (must go through detail modal)
  const hasRequiredModifiers = useMemo(() => {
    return item.modifierGroups && item.modifierGroups.some((group) => group.minSelect > 0);
  }, [item.modifierGroups]);

  const handleCardClick = useCallback(() => {
    // Haptic feedback
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }

    onSelect?.(item);
  }, [item, onSelect]);

  const handleFavoriteToggle = useCallback(
    (newState: boolean) => {
      if (controlledFavoriteToggle) {
        controlledFavoriteToggle(item, newState);
      } else {
        favoritesToggle(item.id);
      }
    },
    [item, controlledFavoriteToggle, favoritesToggle]
  );

  /**
   * Handle Add button click.
   *
   * SINGLE ADD PATH:
   * 1. Items with required modifiers -> open detail modal (user must select modifiers)
   * 2. Items without required modifiers -> quick-add to cart
   */
  const handleAdd = useCallback(() => {
    if (hasRequiredModifiers) {
      onSelect?.(item);
      return;
    }

    if (onQuickAdd) {
      onQuickAdd(item);
    } else {
      cart.addItem({
        menuItemId: item.id,
        menuItemSlug: item.slug,
        nameEn: item.nameEn,
        nameMy: item.nameMy,
        imageUrl: item.imageUrl,
        basePriceCents: item.basePriceCents,
        quantity: 1,
        modifiers: [],
        notes: "",
      });
    }
  }, [item, onQuickAdd, cart, hasRequiredModifiers, onSelect]);

  const handleIncrement = useCallback(() => {
    const cartItem = cart.items.find((ci) => ci.menuItemId === item.id);
    if (cartItem) {
      cart.updateQuantity(cartItem.cartItemId, cartItem.quantity + 1);
    } else {
      handleAdd();
    }
  }, [cart, item.id, handleAdd]);

  const handleDecrement = useCallback(() => {
    const cartItem = cart.items.find((ci) => ci.menuItemId === item.id);
    if (cartItem) {
      if (cartItem.quantity <= 1) {
        cart.removeItem(cartItem.cartItemId);
      } else {
        cart.updateQuantity(cartItem.cartItemId, cartItem.quantity - 1);
      }
    }
  }, [cart, item.id]);

  // Mobile long-press to open detail sheet (500ms iOS standard)
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        touchStartPos.current = { x: touch.clientX, y: touch.clientY };
      }

      longPressTimer.current = setTimeout(() => {
        // Haptic feedback
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(20);
        }
        onSelect?.(item);
      }, LONG_PRESS_DURATION);
    },
    [item, onSelect]
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    touchStartPos.current = null;

    // Reset tilt on hybrid devices (if tilt was enabled)
    if (shouldEnableTilt) {
      resetTilt();
    }
  }, [shouldEnableTilt, resetTilt]);

  const handleTouchMoveCancel = useCallback((e: React.TouchEvent) => {
    // Cancel long-press if user scrolls (10px threshold)
    if (touchStartPos.current && longPressTimer.current) {
      const touch = e.touches[0];
      if (touch) {
        const dx = Math.abs(touch.clientX - touchStartPos.current.x);
        const dy = Math.abs(touch.clientY - touchStartPos.current.y);

        if (dx > 10 || dy > 10) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
          touchStartPos.current = null;
        }
      }
    }
  }, []);

  return {
    totalQuantityInCart,
    hasRequiredModifiers,
    handleCardClick,
    handleFavoriteToggle,
    handleAdd,
    handleIncrement,
    handleDecrement,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMoveCancel,
  };
}
