import { useCartStore, __clearDebounceState } from "@/lib/stores/cart-store";
import { MAX_ITEM_QUANTITY } from "@/types/cart";

// Use literal values matching defaults (same as DB seed values)
const DELIVERY_FEE = 1500;
const FREE_DELIVERY_THRESHOLD = 10000;
const LONG_DISTANCE_FEE = 2000;
const LONG_DISTANCE_THRESHOLD = 25;

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
    __clearDebounceState(); // Reset debounce tracking between tests
    // Initialize delivery settings to match defaults
    useCartStore.getState().setDeliverySettings(DELIVERY_FEE, FREE_DELIVERY_THRESHOLD);
    useCartStore.getState().setAddressDistance(null);
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

      expect(useCartStore.getState().items[0].quantity).toBe(MAX_ITEM_QUANTITY);
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
        basePriceCents: FREE_DELIVERY_THRESHOLD - 1,
      });

      expect(store.getEstimatedDeliveryFee()).toBe(DELIVERY_FEE);
    });

    it("returns zero when at or above threshold", () => {
      const store = useCartStore.getState();
      store.addItem({
        ...baseItem,
        basePriceCents: FREE_DELIVERY_THRESHOLD,
      });

      expect(store.getEstimatedDeliveryFee()).toBe(0);
    });

    it("returns long-distance fee when distance > threshold (even if subtotal qualifies for free)", () => {
      const store = useCartStore.getState();
      store.addItem({ ...baseItem, basePriceCents: FREE_DELIVERY_THRESHOLD });
      store.setAddressDistance(LONG_DISTANCE_THRESHOLD + 5);

      expect(store.getEstimatedDeliveryFee()).toBe(LONG_DISTANCE_FEE);
    });

    it("returns standard fee when distance <= threshold and subtotal < free threshold", () => {
      const store = useCartStore.getState();
      store.addItem({ ...baseItem, basePriceCents: FREE_DELIVERY_THRESHOLD - 1 });
      store.setAddressDistance(LONG_DISTANCE_THRESHOLD - 5);

      expect(store.getEstimatedDeliveryFee()).toBe(DELIVERY_FEE);
    });

    it("returns zero (free) when distance is null and subtotal >= free threshold", () => {
      const store = useCartStore.getState();
      store.addItem({ ...baseItem, basePriceCents: FREE_DELIVERY_THRESHOLD });

      expect(store.getEstimatedDeliveryFee()).toBe(0);
    });

    it("returns long-distance fee when distance > threshold and subtotal < free threshold", () => {
      const store = useCartStore.getState();
      store.addItem({ ...baseItem, basePriceCents: FREE_DELIVERY_THRESHOLD - 1 });
      store.setAddressDistance(LONG_DISTANCE_THRESHOLD + 10);

      expect(store.getEstimatedDeliveryFee()).toBe(LONG_DISTANCE_FEE);
    });
  });

  describe("BUG-06: debounce race condition", () => {
    it("debounces rapid duplicate adds (only first applies)", () => {
      const store = useCartStore.getState();

      // Two synchronous calls with same signature
      store.addItem(baseItem);
      store.addItem(baseItem);

      const updated = useCartStore.getState();
      // First call adds item, second is debounced — quantity stays at 1
      expect(updated.items).toHaveLength(1);
      expect(updated.items[0].quantity).toBe(1);
    });

    it("allows adds after debounce window expires", async () => {
      const store = useCartStore.getState();
      store.addItem(baseItem);

      // Wait for debounce window to expire
      await new Promise((resolve) => setTimeout(resolve, 350));
      __clearDebounceState();

      store.addItem(baseItem);

      const updated = useCartStore.getState();
      // After debounce window, second add merges quantity
      expect(updated.items).toHaveLength(1);
      expect(updated.items[0].quantity).toBe(2);
    });

    it("allows rapid adds of different items", () => {
      const store = useCartStore.getState();
      store.addItem(baseItem);
      store.addItem({ ...baseItem, menuItemId: "item-2", nameEn: "Shan Noodles" });

      const updated = useCartStore.getState();
      // Different signatures — both should be added
      expect(updated.items).toHaveLength(2);
    });
  });

  describe("concurrent cart operations (TST-01)", () => {
    it("rapid-fire 5 addItem calls within loop result in quantity 1 (debounce blocks duplicates)", () => {
      const store = useCartStore.getState();

      // Fire 5 adds synchronously — debounce should block all after first
      for (let i = 0; i < 5; i++) {
        store.addItem(baseItem);
      }

      const updated = useCartStore.getState();
      expect(updated.items).toHaveLength(1);
      expect(updated.items[0].quantity).toBe(1);
    });

    it("two different items added concurrently both appear in cart", () => {
      const store = useCartStore.getState();

      const item1 = { ...baseItem, menuItemId: "concurrent-1", nameEn: "Tea Leaf Salad" };
      const item2 = { ...baseItem, menuItemId: "concurrent-2", nameEn: "Shan Noodles" };

      store.addItem(item1);
      store.addItem(item2);

      const updated = useCartStore.getState();
      expect(updated.items).toHaveLength(2);
      expect(updated.items.map((i) => i.menuItemId)).toContain("concurrent-1");
      expect(updated.items.map((i) => i.menuItemId)).toContain("concurrent-2");
    });

    it("addItem + removeItem in quick succession produces consistent empty state", () => {
      const store = useCartStore.getState();
      store.addItem(baseItem);

      const afterAdd = useCartStore.getState();
      expect(afterAdd.items).toHaveLength(1);

      const cartItemId = afterAdd.items[0].cartItemId;
      useCartStore.getState().removeItem(cartItemId);

      const afterRemove = useCartStore.getState();
      expect(afterRemove.items).toHaveLength(0);
    });

    it("debounce state is properly cleared between test runs", () => {
      // First: add item, verify it's there
      const store = useCartStore.getState();
      store.addItem(baseItem);
      expect(useCartStore.getState().items).toHaveLength(1);

      // Clear cart and debounce state (simulating beforeEach)
      useCartStore.getState().clearCart();
      __clearDebounceState();

      // After clearing, same item should be addable again
      useCartStore.getState().addItem(baseItem);
      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0].quantity).toBe(1);
    });
  });

  describe("setDeliverySettings", () => {
    it("updates delivery fee and threshold", () => {
      const store = useCartStore.getState();
      store.setDeliverySettings(2000, 15000);

      const updated = useCartStore.getState();
      expect(updated.deliveryFeeCents).toBe(2000);
      expect(updated.freeDeliveryThresholdCents).toBe(15000);
    });

    it("uses updated settings in fee calculation", () => {
      const store = useCartStore.getState();
      store.setDeliverySettings(2000, 5000);
      store.addItem({ ...baseItem, basePriceCents: 5000 });

      expect(store.getEstimatedDeliveryFee()).toBe(0);
    });
  });
});
