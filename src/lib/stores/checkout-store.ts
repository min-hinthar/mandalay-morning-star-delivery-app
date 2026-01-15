import { create } from "zustand";
import type { CheckoutState, CheckoutStep } from "@/types/checkout";
import type { Address } from "@/types/address";
import type { DeliverySelection } from "@/types/delivery";

interface CheckoutStore extends CheckoutState {
  setStep: (step: CheckoutStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  canProceed: () => boolean;
  setAddress: (address: Address) => void;
  setDelivery: (delivery: DeliverySelection) => void;
  setCustomerNotes: (notes: string) => void;
  reset: () => void;
}

const initialState: CheckoutState = {
  step: "address",
  addressId: null,
  address: null,
  delivery: null,
  customerNotes: "",
};

const STEP_ORDER: CheckoutStep[] = ["address", "time", "payment"];

export const useCheckoutStore = create<CheckoutStore>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  nextStep: () => {
    const { step } = get();
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex < STEP_ORDER.length - 1) {
      set({ step: STEP_ORDER[currentIndex + 1] });
    }
  },

  prevStep: () => {
    const { step } = get();
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex > 0) {
      set({ step: STEP_ORDER[currentIndex - 1] });
    }
  },

  canProceed: () => {
    const { step, address, delivery } = get();
    switch (step) {
      case "address":
        return address !== null;
      case "time":
        return delivery !== null;
      case "payment":
        return true;
      default:
        return false;
    }
  },

  setAddress: (address) => set({ address, addressId: address.id }),
  setDelivery: (delivery) => set({ delivery }),
  setCustomerNotes: (notes) => set({ customerNotes: notes }),

  reset: () => set(initialState),
}));
