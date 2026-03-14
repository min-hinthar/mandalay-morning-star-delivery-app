import { create } from "zustand";
import type { FeedbackCategory } from "@/types/feedback";

interface FeedbackStore {
  isOpen: boolean;
  prefillOrderId: string | null;
  prefillCategory: FeedbackCategory | null;
  open: (ctx?: { orderId?: string; category?: FeedbackCategory }) => void;
  close: () => void;
}

export const useFeedbackStore = create<FeedbackStore>((set) => ({
  isOpen: false,
  prefillOrderId: null,
  prefillCategory: null,
  open: (ctx) =>
    set({
      isOpen: true,
      prefillOrderId: ctx?.orderId ?? null,
      prefillCategory: ctx?.category ?? null,
    }),
  close: () =>
    set({
      isOpen: false,
      prefillOrderId: null,
      prefillCategory: null,
    }),
}));
