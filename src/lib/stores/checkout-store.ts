import { create } from "zustand";
import type { CheckoutState, CheckoutStep } from "@/types/checkout";
import type { Address } from "@/types/address";
import type { DeliverySelection } from "@/types/delivery";
import type { PaymentMethod } from "@/types/database";

interface CheckoutStore extends CheckoutState {
  setStep: (step: CheckoutStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setAddress: (address: Address) => void;
  setDelivery: (delivery: DeliverySelection) => void;
  setCustomerNotes: (notes: string) => void;
  setTipPercent: (percent: number | null) => void;
  setCustomTipCents: (cents: number) => void;
  setPromoCode: (code: string) => void;
  applyPromo: (discountCents: number, label: string) => void;
  clearPromo: () => void;
  setDeliveryInstructions: (instructions: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setCustomerPhone: (phone: string) => void;
  setCustomerName: (name: string) => void;
  reset: () => void;
}

const initialState: CheckoutState = {
  step: "address",
  addressId: null,
  address: null,
  delivery: null,
  customerNotes: "",
  tipPercent: 15,
  customTipCents: 0,
  promoCode: "",
  promoApplied: false,
  discountCents: 0,
  discountLabel: "",
  deliveryInstructions: "",
  paymentMethod: "stripe",
  customerPhone: "",
  customerName: "",
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

  setAddress: (address) => set({ address, addressId: address.id }),
  setDelivery: (delivery) => set({ delivery }),
  setCustomerNotes: (notes) => set({ customerNotes: notes }),

  setTipPercent: (percent) => set({ tipPercent: percent }),

  setCustomTipCents: (cents) =>
    set({ customTipCents: Math.max(0, Math.min(cents, 100_000)), tipPercent: null }),

  setPromoCode: (code) => set({ promoCode: code }),

  applyPromo: (discountCents, label) =>
    set({ promoApplied: true, discountCents, discountLabel: label }),

  clearPromo: () =>
    set({ promoCode: "", promoApplied: false, discountCents: 0, discountLabel: "" }),

  setDeliveryInstructions: (instructions) => set({ deliveryInstructions: instructions }),

  setPaymentMethod: (method) => set({ paymentMethod: method }),

  setCustomerPhone: (phone) => set({ customerPhone: phone }),

  setCustomerName: (name) => set({ customerName: name }),

  reset: () => set(initialState),
}));

/**
 * Derive whether the current step can proceed based on reactive state.
 * Use this instead of a store method to ensure React re-renders on changes.
 */
export function useCanProceed(): boolean {
  const { step, address, delivery, customerPhone, customerName } = useCheckoutStore();
  switch (step) {
    case "address":
      return address !== null;
    case "time":
      return delivery !== null;
    case "payment": {
      const digitsOnly = customerPhone.replace(/\D/g, "");
      return digitsOnly.length >= 10 && customerName.trim().length >= 2;
    }
    default:
      return false;
  }
}
