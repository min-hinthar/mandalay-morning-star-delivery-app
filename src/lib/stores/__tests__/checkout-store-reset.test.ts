/**
 * checkout-store.reset() — cross-store distance handling.
 *
 * setAddress writes the address's drive distance into the CART store (fee
 * engine input). reset() deliberately LEAVES it in place: CheckoutClient calls
 * reset() on every non-Stripe unmount — simply navigating /checkout → /menu —
 * so clearing it made a far-address customer's cart fall back to LOCAL pricing
 * for the rest of the session (free-delivery meter promising FREE while the
 * server still charges the extended fee, and the drawer's minimum gate
 * re-enabling the very cart checkout had just blocked). Keeping the last known
 * distance over-quotes rather than baits, is rewritten by the next setAddress,
 * and is not persisted (cart partialize keeps only `items`).
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

const NEAR_ADDRESS: Address = {
  ...FAR_ADDRESS,
  id: "addr-near",
  label: "Home",
  city: "Covina",
  distanceMiles: 6,
};

beforeEach(() => {
  useCartStore.setState({ addressDistanceMiles: null });
  useCheckoutStore.getState().reset();
});

describe("checkout-store reset — address distance handling", () => {
  it("setAddress syncs the distance into the cart store", () => {
    useCheckoutStore.getState().setAddress(FAR_ADDRESS);
    expect(useCartStore.getState().addressDistanceMiles).toBe(42);
  });

  it("reset() clears the address but KEEPS the distance (no free-delivery bait)", () => {
    useCheckoutStore.getState().setAddress(FAR_ADDRESS);
    expect(useCartStore.getState().addressDistanceMiles).toBe(42);

    // Navigating away from /checkout unmounts CheckoutClient → reset().
    useCheckoutStore.getState().reset();

    expect(useCheckoutStore.getState().address).toBeNull();
    // Still far: the cart keeps quoting the extended fee the server will
    // actually charge, instead of reverting to a FREE-delivery promise.
    expect(useCartStore.getState().addressDistanceMiles).toBe(42);
  });

  it("a later setAddress overwrites the retained distance (self-correcting)", () => {
    useCheckoutStore.getState().setAddress(FAR_ADDRESS);
    useCheckoutStore.getState().reset();
    expect(useCartStore.getState().addressDistanceMiles).toBe(42);

    useCheckoutStore.getState().setAddress(NEAR_ADDRESS);
    expect(useCartStore.getState().addressDistanceMiles).toBe(6);
  });
});
