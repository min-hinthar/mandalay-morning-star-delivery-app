/**
 * useCartDeliveryGate — minimum-order gating in the cart DRAWER.
 *
 * The /cart page's CheckoutGate has always blocked below-minimum checkouts;
 * the drawer's CTA only checked blocking issues + the delivery gate, so a
 * below-floor far-address cart could enter checkout and only learn at Place
 * Order (MINIMUM_ORDER_NOT_MET). The hook now folds the SAME engine + tier
 * the server uses (cart-store.getMinimumOrder) into isDisabled.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCartStore } from "@/lib/stores/cart-store";
import type { CartItem } from "@/types/cart";

// The delivery gates own timers + wall-clock math — irrelevant here. Pin them
// open so isDisabled reflects ONLY the minimum-order input under test.
vi.mock("@/lib/hooks/useDeliveryGate", () => ({
  useDeliveryGate: () => ({
    isOpen: true,
    deliveryDate: { displayDate: "Saturday" },
    deliveryDayOfWeek: 6,
  }),
  useDeliveryGateMultiDay: () => ({
    isOpen: true,
    deliveryDate: { displayDate: "Saturday" },
    deliveryDayOfWeek: 6,
  }),
}));

import { useCartDeliveryGate } from "../CartFooter";

function cartItem(basePriceCents: number, quantity = 1): CartItem {
  return {
    cartItemId: `ci-${basePriceCents}-${quantity}`,
    menuItemId: "mi-1",
    menuItemSlug: "mohinga",
    nameEn: "Mohinga",
    nameMy: null,
    imageUrl: null,
    basePriceCents,
    quantity,
    modifiers: [],
    notes: "",
    addedAt: "2026-01-01T00:00:00Z",
  };
}

beforeEach(() => {
  act(() => {
    useCartStore.setState({
      items: [],
      addressDistanceMiles: null,
      minimumOrderCents: 2500,
      extendedMinOrderCents: 10000,
      longDistanceThresholdMiles: 25,
    });
  });
});

describe("useCartDeliveryGate — minimum-order gate", () => {
  it("disables checkout when the cart is under the base minimum", () => {
    act(() => {
      useCartStore.setState({ items: [cartItem(1000)] }); // $10 < $25 floor
    });
    const { result } = renderHook(() => useCartDeliveryGate({ deliveryDays: [] }));

    expect(result.current.minimumOrder.shortfallCents).toBe(1500);
    expect(result.current.isDisabled).toBe(true);
  });

  it("disables checkout when a far address raises the floor above the subtotal", () => {
    act(() => {
      useCartStore.setState({
        items: [cartItem(4000, 2)], // $80 — above base, below extended $100
        addressDistanceMiles: 32, // beyond the 25mi threshold → extended tier
      });
    });
    const { result } = renderHook(() => useCartDeliveryGate({ deliveryDays: [] }));

    expect(result.current.minimumOrder.isExtendedMinimum).toBe(true);
    expect(result.current.minimumOrder.shortfallCents).toBe(2000);
    expect(result.current.isDisabled).toBe(true);
  });

  it("enables checkout once the subtotal clears the applicable floor", () => {
    act(() => {
      useCartStore.setState({
        items: [cartItem(5500, 2)], // $110 clears the $100 extended floor
        addressDistanceMiles: 32,
      });
    });
    const { result } = renderHook(() => useCartDeliveryGate({ deliveryDays: [] }));

    expect(result.current.minimumOrder.shortfallCents).toBe(0);
    expect(result.current.isDisabled).toBe(false);
  });

  it("still disables for blocking issues even when the minimum is met", () => {
    act(() => {
      useCartStore.setState({ items: [cartItem(5000)] });
    });
    const { result } = renderHook(() =>
      useCartDeliveryGate({ deliveryDays: [], hasBlockingIssues: true })
    );

    expect(result.current.minimumOrder.shortfallCents).toBe(0);
    expect(result.current.isDisabled).toBe(true);
  });
});
