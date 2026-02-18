"use client";

/**
 * MenuContentClient Component
 * Client-side wrapper providing interactive functionality for menu content
 *
 * This component encapsulates all client-side logic needed for menu interactivity:
 * - URL param handling for item modal opening (command palette integration)
 * - Favorites state management
 * - Cart operations
 * - Offline sync and caching
 * - Item detail sheet state
 *
 * Architecture note: This wrapper was created as part of server component conversion
 * exploration. The MenuContent component remains client-side due to deep React Query
 * and offline support integration. This wrapper can be used for future progressive
 * enhancement when server-side menu rendering becomes practical.
 *
 * @example
 * <MenuContentClient className="min-h-screen">
 *   {serverRenderedContent}
 * </MenuContentClient>
 */

import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { useCart } from "@/lib/hooks/useCart";
import { useCustomerOfflineSync } from "@/lib/hooks/useCustomerOfflineSync";
import type { MenuItem, MenuCategory } from "@/types/menu";
import type { SelectedModifier } from "@/lib/utils/price";
import { ItemDetailSheet } from "./ItemDetailSheet";

// ============================================
// TYPES
// ============================================

export interface MenuContentClientProps {
  /** Child content to render */
  children: ReactNode;
  /** Categories for URL param item lookup */
  categories?: MenuCategory[];
  /** Additional className */
  className?: string;
}

export interface MenuInteractivityContext {
  /** Set of favorite item IDs for quick lookup */
  favoritesSet: Set<string>;
  /** Handle item selection (opens detail sheet) */
  onSelectItem: (item: MenuItem) => void;
  /** Toggle favorite status for an item */
  onFavoriteToggle: (itemId: string) => void;
  /** Add item to cart with modifiers */
  onAddToCart: (
    item: MenuItem,
    modifiers: SelectedModifier[],
    quantity: number,
    notes: string
  ) => void;
  /** Whether device is currently online */
  isOnline: boolean;
}

// ============================================
// CONTEXT
// ============================================

const MenuInteractivityCtx = createContext<MenuInteractivityContext | null>(null);

/**
 * Hook to access menu interactivity context
 * Must be used within MenuContentClient
 */
export function useMenuInteractivity(): MenuInteractivityContext {
  const ctx = useContext(MenuInteractivityCtx);
  if (!ctx) {
    throw new Error("useMenuInteractivity must be used within MenuContentClient");
  }
  return ctx;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function MenuContentClient({
  children,
  categories = [],
  className,
}: MenuContentClientProps) {
  // ============================================
  // ROUTING
  // ============================================
  const searchParams = useSearchParams();
  const router = useRouter();

  // ============================================
  // OFFLINE STATE
  // ============================================
  const { isOnline } = useCustomerOfflineSync();

  // ============================================
  // FAVORITES & CART
  // ============================================
  const { favorites, toggleFavorite } = useFavorites();
  const { addItem } = useCart();

  // Create favorites Set for quick lookup
  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  // ============================================
  // ITEM DETAIL STATE
  // ============================================
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Timeout ref for cleanup
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSelectItem = useCallback((item: MenuItem) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    // Clear any pending timeout
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    // Delay clearing item to allow close animation to complete
    closeTimeoutRef.current = setTimeout(() => setSelectedItem(null), 300);
  }, []);

  // Handle URL param to open item modal (from command palette search)
  useEffect(() => {
    if (categories.length === 0) return;

    const itemSlug = searchParams.get("item");

    if (itemSlug) {
      // Find the item across all categories
      const item = categories
        .flatMap((c: MenuCategory) => c.items ?? [])
        .find((i: MenuItem) => i.slug === itemSlug);

      if (item) {
        setSelectedItem(item);
        setIsDetailOpen(true);
        // Clear the URL param to avoid reopening on refresh
        router.replace("/menu", { scroll: false });
      }
    }
  }, [categories, searchParams, router]);

  const handleFavoriteToggle = useCallback(
    (itemId: string) => {
      toggleFavorite(itemId);
    },
    [toggleFavorite]
  );

  const handleAddToCart = useCallback(
    (item: MenuItem, modifiers: SelectedModifier[], quantity: number, notes: string) => {
      addItem({
        menuItemId: item.id,
        menuItemSlug: item.slug,
        nameEn: item.nameEn,
        nameMy: item.nameMy,
        basePriceCents: item.basePriceCents,
        imageUrl: item.imageUrl,
        quantity,
        modifiers: modifiers.map((m) => ({
          groupId: m.groupId,
          groupName: m.groupName,
          optionId: m.optionId,
          optionName: m.optionName,
          priceDeltaCents: m.priceDeltaCents,
        })),
        notes,
      });
    },
    [addItem]
  );

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const contextValue = useMemo<MenuInteractivityContext>(
    () => ({
      favoritesSet,
      onSelectItem: handleSelectItem,
      onFavoriteToggle: handleFavoriteToggle,
      onAddToCart: handleAddToCart,
      isOnline,
    }),
    [favoritesSet, handleSelectItem, handleFavoriteToggle, handleAddToCart, isOnline]
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <MenuInteractivityCtx.Provider value={contextValue}>
      <div className={className}>
        {children}

        {/* Item Detail Sheet */}
        <ItemDetailSheet
          item={selectedItem}
          isOpen={isDetailOpen}
          onClose={handleCloseDetail}
          onAddToCart={handleAddToCart}
        />
      </div>
    </MenuInteractivityCtx.Provider>
  );
}

export default MenuContentClient;
