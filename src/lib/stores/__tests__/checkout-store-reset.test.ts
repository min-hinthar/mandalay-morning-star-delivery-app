/**
 * checkout-store.reset() — cross-store distance cleanup.
 *
 * setAddress writes the address's drive distance into the CART store (fee
 * engine input). reset() clears the checkout address but used to leave that
 * distance behind — so after leaving checkout, a customer with no selected
 * address at all kept far-address pricing AND the drawer's $100 long-distance
 * minimum gate, with no address picker outside checkout to fix it.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useCheckoutStore } from "../checkout-store";
import { useCartStore } from "../cart-store";
import type { Address } from "@/types/address";

const FAR_ADDRESS: Address = {
  id: "addr-far",
  userId: "user-1",
  label: "Cabin",
  line1: "1 Far Rd",
  line2: null,
  city: "Wrightwood",
  state: "CA",
  postalCode: "92397",
  formattedAddress: "1 Far Rd, Wrightwood, CA 92397",
  lat: 34.36,
  lng: -117.63,
  isDefault: false,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  distanceMiles: 42,
};

beforeEach(() => {
  useCartStore.setState({ addressDistanceMiles: null });
  useCheckoutStore.getState().reset();
});

describe("checkout-store reset — address distance cleanup", () => {
  it("setAddress syncs the distance into the cart store", () => {
    useCheckoutStore.getState().setAddress(FAR_ADDRESS);
    expect(useCartStore.getState().addressDistanceMiles).toBe(42);
  });

  it("reset() clears the cart store's distance along with the address", () => {
    useCheckoutStore.getState().setAddress(FAR_ADDRESS);
    expect(useCartStore.getState().addressDistanceMiles).toBe(42);

    useCheckoutStore.getState().reset();

    expect(useCheckoutStore.getState().address).toBeNull();
    expect(useCartStore.getState().addressDistanceMiles).toBeNull();
  });
});
