"use client";

import { useState, useCallback } from "react";
import { useCartStore } from "@/lib/stores/cart-store";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import { toast } from "@/lib/hooks/useToastV8";
import { triggerHaptic } from "@/lib/micro-interactions";

interface ReorderCartItem {
  menuItemId: string;
  slug: string;
  name: string;
  quantity: number;
  priceCents: number;
  modifiers: Array<{
    optionId: string | null;
    name: string;
    priceDeltaCents: number;
  }>;
  specialInstructions: string | null;
}

interface ReorderWarning {
  menuItemId: string | null;
  itemName: string;
  type: "unavailable" | "sold_out" | "price_changed";
  message: string;
}

interface UseReorderReturn {
  reorder: (orderId: string) => Promise<void>;
  confirmReorder: () => Promise<void>;
  cancelReorder: () => void;
  isLoading: boolean;
  showConfirmation: boolean;
  pendingOrderId: string | null;
  cartItemCount: number;
}

export function useReorder(): UseReorderReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const cartItemCount = useCartStore((s) => s.items.length);

  const executeReorder = useCallback(async (orderId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/account/orders/${orderId}/reorder`, {
        method: "POST",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to reorder");
      }

      const { cartItems, warnings } = result.data as {
        cartItems: ReorderCartItem[];
        warnings: ReorderWarning[];
      };

      // Clear cart and add reorder items
      const { clearCart, addItem } = useCartStore.getState();
      clearCart();

      for (const item of cartItems) {
        addItem({
          menuItemId: item.menuItemId,
          menuItemSlug: item.slug,
          nameEn: item.name,
          nameMy: null,
          imageUrl: null,
          basePriceCents: item.priceCents,
          quantity: item.quantity,
          modifiers: item.modifiers.map((mod) => ({
            groupId: mod.optionId || "",
            groupName: mod.name,
            optionId: mod.optionId || "",
            optionName: mod.name,
            priceDeltaCents: mod.priceDeltaCents,
          })),
          notes: item.specialInstructions || "",
        });
      }

      // Show toast with warning info
      const addedCount = cartItems.length;
      const unavailableCount = warnings.filter(
        (w) => w.type === "unavailable" || w.type === "sold_out"
      ).length;

      if (unavailableCount > 0) {
        toast({
          message: `${unavailableCount} of ${addedCount + unavailableCount} items unavailable — added ${addedCount} to cart`,
          type: "warning",
        });
      } else {
        toast({ message: "Items added to cart", type: "success" });
      }

      triggerHaptic("medium");

      // Open cart drawer
      useCartDrawer.getState().open();
    } catch (error) {
      toast({
        message: error instanceof Error ? error.message : "Failed to reorder",
        type: "error",
      });
    } finally {
      setIsLoading(false);
      setPendingOrderId(null);
      setShowConfirmation(false);
    }
  }, []);

  const reorder = useCallback(
    async (orderId: string) => {
      const currentItems = useCartStore.getState().items;
      if (currentItems.length > 0) {
        setPendingOrderId(orderId);
        setShowConfirmation(true);
        return;
      }
      await executeReorder(orderId);
    },
    [executeReorder]
  );

  const confirmReorder = useCallback(async () => {
    if (!pendingOrderId) return;
    await executeReorder(pendingOrderId);
  }, [pendingOrderId, executeReorder]);

  const cancelReorder = useCallback(() => {
    setPendingOrderId(null);
    setShowConfirmation(false);
  }, []);

  return {
    reorder,
    confirmReorder,
    cancelReorder,
    isLoading,
    showConfirmation,
    pendingOrderId,
    cartItemCount,
  };
}
