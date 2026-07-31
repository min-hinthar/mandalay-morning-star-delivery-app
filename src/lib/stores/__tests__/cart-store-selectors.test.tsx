import { render } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, beforeEach } from "vitest";
import { useShallow } from "zustand/react/shallow";

import { useCartStore, __clearDebounceState } from "@/lib/stores/cart-store";

/**
 * Guards an object-returning zustand selector against an infinite render loop.
 *
 * zustand v5's `useStore` calls React's `useSyncExternalStore` directly with
 * `() => selector(getState())` and NO internal memoization (the v4
 * `useSyncExternalStoreWithSelector` shim is gone). React re-invokes
 * `getSnapshot` after commit and force-re-renders whenever the returned
 * reference changed — so a selector that builds a fresh object every call
 * ("Maximum update depth exceeded") takes down every surface that mounts it.
 *
 * The store-method unit tests can't catch this: they call the methods directly
 * and never go through useSyncExternalStore. This mounts a real component.
 */

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

function MinimumOrderProbe({ onRender }: { onRender: (n: number) => void }) {
  const renders = useRef(0);
  renders.current += 1;
  onRender(renders.current);
  const minimum = useCartStore(useShallow((s) => s.getMinimumOrder()));
  return <output data-testid="min">{minimum.minimumCents}</output>;
}

describe("cart store — object-returning selectors are render-stable", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    __clearDebounceState();
    useCartStore.getState().setAddressDistance(null);
    useCartStore.getState().setMinimumOrderSettings(2500, 10000);
  });

  it("getMinimumOrder does not loop when mounted through useSyncExternalStore", () => {
    useCartStore.getState().addItem(baseItem);

    let renderCount = 0;
    const { getByTestId } = render(<MinimumOrderProbe onRender={(n) => (renderCount = n)} />);

    expect(getByTestId("min").textContent).toBe("2500");
    // Without useShallow this climbs until React throws "Maximum update depth
    // exceeded"; a settled mount is a small, bounded number.
    expect(renderCount).toBeLessThan(5);
  });

  it("reflects the extended floor for a far address, still without looping", () => {
    useCartStore.getState().addItem(baseItem);
    useCartStore.getState().setAddressDistance(38.8);

    let renderCount = 0;
    const { getByTestId } = render(<MinimumOrderProbe onRender={(n) => (renderCount = n)} />);

    expect(getByTestId("min").textContent).toBe("10000");
    expect(renderCount).toBeLessThan(5);
  });
});
