"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useCartStore } from "@/lib/stores/cart-store";
import { useMenu } from "@/lib/hooks/useMenu";
import type { MenuItem, MenuCategory } from "@/types/menu";
import type {
  CartItem,
  CartItemValidation,
  CartValidationResult,
} from "@/types/cart";

// ============================================
// useCartHydrated
// ============================================

/**
 * Returns true once Zustand persist has rehydrated the cart store.
 * Gates validation to prevent comparing against empty cart state.
 */
export function useCartHydrated(): boolean {
  const [hydrated, setHydrated] = useState(
    useCartStore.persist.hasHydrated()
  );

  useEffect(() => {
    if (hydrated) return;

    const unsub = useCartStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // Re-check in case hydration finished between render and effect
    if (useCartStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return unsub;
  }, [hydrated]);

  return hydrated;
}

// ============================================
// VALIDATION HELPERS
// ============================================

interface MenuItemLookup {
  item: MenuItem;
  categoryId: string;
}

function buildMenuLookup(
  categories: MenuCategory[]
): Map<string, MenuItemLookup> {
  const lookup = new Map<string, MenuItemLookup>();
  for (const category of categories) {
    for (const item of category.items) {
      lookup.set(item.id, { item, categoryId: category.id });
    }
  }
  return lookup;
}

function getSuggestions(
  categoryId: string | undefined,
  menuItemId: string,
  categories: MenuCategory[]
): MenuItem[] {
  if (!categoryId) return [];

  const category = categories.find((c) => c.id === categoryId);
  if (!category) return [];

  return category.items
    .filter((item) => item.id !== menuItemId && item.isActive && !item.isSoldOut)
    .slice(0, 3);
}

function validateCartItem(
  cartItem: CartItem,
  menuLookup: Map<string, MenuItemLookup>
): CartItemValidation {
  const found = menuLookup.get(cartItem.menuItemId);

  if (!found) {
    return {
      cartItemId: cartItem.cartItemId,
      status: "unavailable",
    };
  }

  if (found.item.isSoldOut) {
    return {
      cartItemId: cartItem.cartItemId,
      status: "sold-out",
    };
  }

  if (found.item.basePriceCents !== cartItem.basePriceCents) {
    return {
      cartItemId: cartItem.cartItemId,
      status: "price-changed",
      newPriceCents: found.item.basePriceCents,
      priceDirection:
        found.item.basePriceCents > cartItem.basePriceCents ? "up" : "down",
    };
  }

  return {
    cartItemId: cartItem.cartItemId,
    status: "valid",
  };
}

// ============================================
// EMPTY RESULT
// ============================================

const EMPTY_RESULT: CartValidationResult = {
  status: "idle",
  validations: new Map(),
  soldOutIds: [],
  unavailableIds: [],
  priceChangedIds: [],
  suggestions: new Map(),
  hasBlockingIssues: false,
};

const ERROR_RESULT: CartValidationResult = {
  ...EMPTY_RESULT,
  status: "error",
};

// ============================================
// useCartValidation
// ============================================

/**
 * Validates cart items against live menu data.
 *
 * - Gates on Zustand persist hydration (returns idle until hydrated)
 * - Force-refetches menu on mount for freshness
 * - Categorizes items: valid, sold-out, unavailable, price-changed
 * - Computes up to 3 replacement suggestions per invalid item
 * - Silent fail on API error (hasBlockingIssues: false)
 */
export function useCartValidation(): CartValidationResult {
  const hydrated = useCartHydrated();
  const items = useCartStore((state) => state.items);
  const { data: menuData, isError, refetch, dataUpdatedAt } = useMenu();

  // Force-refetch menu on mount for freshness
  const [hasRefetched, setHasRefetched] = useState(false);
  const triggerRefetch = useCallback(() => {
    refetch().finally(() => setHasRefetched(true));
  }, [refetch]);

  useEffect(() => {
    if (hydrated && !hasRefetched) {
      triggerRefetch();
    }
  }, [hydrated, hasRefetched, triggerRefetch]);

  return useMemo(() => {
    // Not hydrated yet -- return idle
    if (!hydrated) return EMPTY_RESULT;

    // Menu fetch error -- silent fail
    if (isError) return ERROR_RESULT;

    // No menu data yet -- validating
    if (!menuData?.data?.categories) {
      return { ...EMPTY_RESULT, status: "validating" };
    }

    // No items in cart -- nothing to validate
    if (items.length === 0) {
      return { ...EMPTY_RESULT, status: "done" };
    }

    const categories = menuData.data.categories;
    const menuLookup = buildMenuLookup(categories);

    const validations = new Map<string, CartItemValidation>();
    const soldOutIds: string[] = [];
    const unavailableIds: string[] = [];
    const priceChangedIds: string[] = [];
    const suggestions = new Map<string, MenuItem[]>();

    for (const cartItem of items) {
      const validation = validateCartItem(cartItem, menuLookup);
      validations.set(cartItem.cartItemId, validation);

      switch (validation.status) {
        case "sold-out":
          soldOutIds.push(cartItem.cartItemId);
          break;
        case "unavailable":
          unavailableIds.push(cartItem.cartItemId);
          break;
        case "price-changed":
          priceChangedIds.push(cartItem.cartItemId);
          break;
      }

      // Compute suggestions for sold-out and unavailable items
      if (
        validation.status === "sold-out" ||
        validation.status === "unavailable"
      ) {
        const categoryId =
          cartItem.categoryId ??
          menuLookup.get(cartItem.menuItemId)?.categoryId;
        const itemSuggestions = getSuggestions(
          categoryId,
          cartItem.menuItemId,
          categories
        );
        if (itemSuggestions.length > 0) {
          suggestions.set(cartItem.cartItemId, itemSuggestions);
        }
      }
    }

    return {
      status: "done" as const,
      validations,
      soldOutIds,
      unavailableIds,
      priceChangedIds,
      suggestions,
      hasBlockingIssues: soldOutIds.length > 0 || unavailableIds.length > 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, items, menuData, isError, dataUpdatedAt]);
}
