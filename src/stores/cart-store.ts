import { create } from "zustand";

type CartState = {
  items: Array<{ id: string; quantity: number }>;
};

export const useCartStore = create<CartState>(() => ({
  items: [],
}));
