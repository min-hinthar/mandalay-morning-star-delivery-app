"use client";

import { useEffect, useRef } from "react";

import { useAuth } from "@/lib/hooks/useAuth";
import { useCartStore } from "@/lib/stores/cart-store";
import type { CartItem } from "@/types/cart";

const DEBOUNCE_MS = 1500;

async function fetchServerCart(): Promise<CartItem[] | null> {
  try {
    const res = await fetch("/api/cart", { credentials: "include" });
    if (!res.ok) return null;
    const json = await res.json();
    return Array.isArray(json?.data?.items) ? (json.data.items as CartItem[]) : [];
  } catch {
    return null;
  }
}

async function pushServerCart(items: CartItem[]): Promise<void> {
  try {
    await fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ items }),
    });
  } catch {
    // Best-effort: the IndexedDB cart remains the source of truth.
  }
}

/**
 * Keeps a signed-in customer's cart mirrored to the server so it survives across
 * devices/browsers and can power abandoned-cart recovery.
 *
 * - On sign-in: if the local cart is empty, restore from the server (cross-device
 *   handoff). If the local cart has items, those win and are captured to the server.
 * - While signed in: debounced push on every cart change.
 *
 * Purely additive — it never mutates the local cart except the one-time restore
 * into an empty cart, so it can't disrupt an active shopping session.
 */
export function CartServerSync() {
  const { isAuthenticated, isLoading } = useAuth();
  const hasHydrated = useCartStore((s) => s._hasHydrated);
  const didReconcile = useRef(false);

  // One-time reconcile when a hydrated, authenticated session is ready.
  useEffect(() => {
    if (isLoading || !isAuthenticated || !hasHydrated || didReconcile.current) return;
    didReconcile.current = true;

    void (async () => {
      const localItems = useCartStore.getState().items;
      if (localItems.length === 0) {
        const serverItems = await fetchServerCart();
        // Re-check local is still empty (user may have added while we fetched).
        if (serverItems && serverItems.length > 0 && useCartStore.getState().items.length === 0) {
          useCartStore.setState({ items: serverItems });
        }
      } else {
        await pushServerCart(localItems);
      }
    })();
  }, [isAuthenticated, isLoading, hasHydrated]);

  // Allow a fresh reconcile after sign-out/sign-in.
  useEffect(() => {
    if (!isAuthenticated) didReconcile.current = false;
  }, [isAuthenticated]);

  // Debounced continuous push while signed in.
  useEffect(() => {
    if (!isAuthenticated) return;

    let timeout: ReturnType<typeof setTimeout> | undefined;
    let lastSerialized = JSON.stringify(useCartStore.getState().items);

    const unsubscribe = useCartStore.subscribe((state) => {
      const serialized = JSON.stringify(state.items);
      if (serialized === lastSerialized) return; // ignore non-item state changes
      lastSerialized = serialized;
      if (timeout) clearTimeout(timeout);
      const snapshot = state.items;
      timeout = setTimeout(() => void pushServerCart(snapshot), DEBOUNCE_MS);
    });

    return () => {
      if (timeout) clearTimeout(timeout);
      unsubscribe();
    };
  }, [isAuthenticated]);

  return null;
}

export default CartServerSync;
