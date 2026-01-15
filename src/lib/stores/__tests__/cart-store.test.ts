import { useCartStore } from "@/lib/stores/cart-store";
import {
  DELIVERY_FEE_CENTS,
  FREE_DELIVERY_THRESHOLD_CENTS,
  MAX_ITEM_QUANTITY,
} from "@/types/cart";

const baseItem = {
  menuItemId: "item-1",
  menuItemSlug: "mohinga",
  nameEn: "Mohinga",
  nameMy: null,
  imageUrl: null,
  basePriceCents: 1200,
  quantity: 1,
  modifiers: [],
  notes: "",
};

describe("CartStore", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useCartStore.persist.clearStorage?.();
  });

  describe("addItem", () => {
    it("adds item to cart", () => {
      const store = useCartStore.getState();
      store.addItem(baseItem);

      const updated = useCartStore.getState();
      expect(updated.items).toHaveLength(1);
      expect(updated.items[0].menuItemId).toBe("item-1");
      expect(updated.items[0].cartItemId).toBeTruthy();
      expect(updated.items[0].addedAt).toBeTruthy();
    });

    it("clamps quantity to MAX_ITEM_QUANTITY", () => {
      const store = useCartStore.getState();
      store.addItem({ ...baseItem, quantity: 100 });

      expect(useCartStore.getState().items[0].quantity).toBe(
        MAX_ITEM_QUANTITY
      );
    });
  });

  describe("getItemsSubtotal", () => {
    it("calculates subtotal with modifiers", () => {
      const store = useCartStore.getState();
      store.addItem({
        ...baseItem,
        quantity: 2,
        modifiers: [
          {
            groupId: "g1",
            groupName: "Spice",
            optionId: "o1",
            optionName: "Extra",
            priceDeltaCents: 100,
          },
        ],
      });

      expect(store.getItemsSubtotal()).toBe(2600);
    });
  });

  describe("getEstimatedDeliveryFee", () => {
    it("returns fee when under threshold", () => {
      const store = useCartStore.getState();
      store.addItem({
        ...baseItem,
        basePriceCents: FREE_DELIVERY_THRESHOLD_CENTS - 1,
      });

      expect(store.getEstimatedDeliveryFee()).toBe(DELIVERY_FEE_CENTS);
    });

    it("returns zero when at or above threshold", () => {
      const store = useCartStore.getState();
      store.addItem({
        ...baseItem,
        basePriceCents: FREE_DELIVERY_THRESHOLD_CENTS,
      });

      expect(store.getEstimatedDeliveryFee()).toBe(0);
    });
  });
});
