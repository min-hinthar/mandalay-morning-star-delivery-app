"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useCartStore } from "@/lib/stores/cart-store";
import { useMenu } from "@/lib/hooks/useMenu";
import type { MenuItem, MenuCategory } from "@/types/menu";
import type { CartItem, CartItemValidation, CartValidationResult } from "@/types/cart";

// ============================================
// PHASE 110 CFIX-05 CONSTANTS
// ============================================

/**
 * Phase 110 CFIX-05 D-16 — Cart validation timeout.
 *
 * 30s catches true hangs only (p99 ~3s), avoids false positives on slow
 * networks. When this fires, the hook exposes `timedOut: true` + a
 * `proceedAnyway` action so the consumer can render a customer-agency banner.
 * No auto-retry — silent recovery is a forbidden anti-pattern.
 */
const CART_VALIDATION_TIMEOUT_MS = 30000;

// ============================================
// useCartHydrated
// ============================================

/**
 * Returns true once Zustand persist has rehydrated the cart store.
 * Gates validation to prevent comparing against empty cart state.
 */
export function useCartHydrated(): boolean {
  const [hydrated, setHydrated] = useState(useCartStore.persist.hasHydrated());

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

function buildMenuLookup(categories: MenuCategory[]): Map<string, MenuItemLookup> {
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
      priceDirection: found.item.basePriceCents > cartItem.basePriceCents ? "up" : "down",
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

/**
 * Partial template — timedOut / proceedAnyway are assembled inside the hook
 * because proceedAnyway needs access to component-scoped state setters.
 */
type PartialResult = Omit<CartValidationResult, "timedOut" | "proceedAnyway">;

const EMPTY_RESULT: PartialResult = {
  status: "idle",
  validations: new Map(),
  soldOutIds: [],
  unavailableIds: [],
  priceChangedIds: [],
  suggestions: new Map(),
  hasBlockingIssues: false,
};

const ERROR_RESULT: PartialResult = {
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
  // Phase 110 CFIX-05 D-17 — explicit timeout state surfaced to consumers
  const [timedOut, setTimedOut] = useState(false);

  // Phase 110 CFIX-05 D-15 / D-30 — cleanup refs.
  // Every setTimeout + AbortController pair MUST be cleaned up in a useEffect
  // return block (gotcha #9). We keep refs so the unmount-cleanup effect can
  // reach into whichever controller/timeout was active at unmount time.
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Phase 110 CFIX-05 D-19 — customer-agency bypass. Clicking "Proceed
   * Anyway" resets the timedOut state but does NOT trigger another refetch.
   * The server-side /api/checkout/session still runs fetchAndValidateCart,
   * so a sold-out item will still be blocked at checkout — this is the
   * authoritative enforcement surface.
   */
  const proceedAnyway = useCallback(() => {
    setTimedOut(false);
  }, []);

  const triggerRefetch = useCallback(() => {
    // Cancel any prior in-flight controller + timeout before starting a new one
    abortControllerRef.current?.abort();
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 30s timeout — D-16. React Query's refetch() does not accept a signal
    // directly, so we use the AbortController purely as a timeout state
    // machine: when the timer fires, we set timedOut: true. The refetch()
    // promise itself is allowed to resolve naturally in the background; we
    // ignore its outcome once the timeout has fired.
    timeoutIdRef.current = setTimeout(() => {
      controller.abort();
      setTimedOut(true);
    }, CART_VALIDATION_TIMEOUT_MS);

    refetch().finally(() => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      setHasRefetched(true);
    });
  }, [refetch]);

  useEffect(() => {
    if (hydrated && !hasRefetched) {
      triggerRefetch();
    }
  }, [hydrated, hasRefetched, triggerRefetch]);

  // Phase 110 D-15 / D-30 — unmount cleanup MUST live in useEffect return.
  // Without this, an AbortController + setTimeout pair outlives the component
  // and fires setTimedOut on an unmounted consumer (React strict-mode warning
  // + memory leak). Empty deps = run on mount, cleanup on unmount only.
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, []);

  return useMemo<CartValidationResult>(() => {
    // Not hydrated yet -- return idle
    if (!hydrated) return { ...EMPTY_RESULT, timedOut, proceedAnyway };

    // Menu fetch error -- silent fail (legacy behavior preserved)
    if (isError) return { ...ERROR_RESULT, timedOut, proceedAnyway };

    // Phase 110 CFIX-05 — explicit timeout state: surface "error" status so
    // existing consumers that gate on status !== "done" will still block,
    // while the new timedOut flag lets new consumers render the banner.
    if (timedOut) {
      return {
        ...EMPTY_RESULT,
        status: "error" as const,
        timedOut: true,
        proceedAnyway,
      };
    }

    // No menu data yet -- validating
    if (!menuData?.data?.categories) {
      return { ...EMPTY_RESULT, status: "validating", timedOut, proceedAnyway };
    }

    // No items in cart -- nothing to validate
    if (items.length === 0) {
      return { ...EMPTY_RESULT, status: "done", timedOut, proceedAnyway };
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
      if (validation.status === "sold-out" || validation.status === "unavailable") {
        const categoryId = cartItem.categoryId ?? menuLookup.get(cartItem.menuItemId)?.categoryId;
        const itemSuggestions = getSuggestions(categoryId, cartItem.menuItemId, categories);
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
      timedOut,
      proceedAnyway,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, items, menuData, isError, dataUpdatedAt, timedOut, proceedAnyway]);
}
