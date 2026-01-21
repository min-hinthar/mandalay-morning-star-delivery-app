"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface FavoritesStore {
  favorites: string[];
  toggleFavorite: (itemId: string) => void;
  isFavorite: (itemId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (itemId) => {
        const current = get().favorites;
        const isFav = current.includes(itemId);
        set({
          favorites: isFav
            ? current.filter((id) => id !== itemId)
            : [...current, itemId],
        });
      },
      isFavorite: (itemId) => get().favorites.includes(itemId),
    }),
    {
      name: "mms-favorites",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function useFavorites() {
  const favorites = useFavoritesStore((state) => state.favorites);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const isFavorite = useFavoritesStore((state) => state.isFavorite);
  return { favorites, toggleFavorite, isFavorite };
}
