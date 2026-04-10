import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ============================================
// MOCKS — vi.hoisted for shared refs
// ============================================

const { mockToast } = vi.hoisted(() => ({
  mockToast: vi.fn(),
}));

vi.mock("@/lib/hooks/useToastV8", () => ({
  toast: mockToast,
}));

// Mock cartIDBStorage to avoid IDB in tests
vi.mock("@/lib/services/cart-idb-storage", () => ({
  cartIDBStorage: {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

// Mock uuid
vi.mock("uuid", () => ({
  v4: vi.fn().mockReturnValue("test-uuid"),
}));

import { useCartStore } from "../cart-store";
import type { CartItem } from "@/types/cart";

// ============================================
// TEST DATA
// ============================================

function makePendingItem(overrides?: Partial<CartItem>): CartItem {
  return {
    cartItemId: "cart-1",
    menuItemId: "item-1",
    menuItemSlug: "mohinga",
    nameEn: "Mohinga",
    nameMy: null,
    imageUrl: null,
    basePriceCents: 1200,
    quantity: 1,
    modifiers: [],
    notes: "",
    addedAt: new Date().toISOString(),
    pendingSync: true,
    ...overrides,
  };
}

const menuApiResponse = {
  data: {
    categories: [
      {
        id: "cat-1",
        slug: "mains",
        name: "Mains",
        sortOrder: 1,
        items: [
          {
            id: "item-1",
            slug: "mohinga",
            nameEn: "Mohinga",
            nameMy: null,
            descriptionEn: null,
            imageUrl: null,
            basePriceCents: 1200,
            isActive: true,
            isSoldOut: false,
            tags: [],
            allergens: [],
            modifierGroups: [
              {
                id: "grp-1",
                slug: "spice",
                name: "Spice Level",
                selectionType: "single",
                minSelect: 0,
                maxSelect: 1,
                options: [
                  {
                    id: "opt-1",
                    slug: "mild",
                    name: "Mild",
                    priceDeltaCents: 0,
                    isActive: true,
                    sortOrder: 1,
                  },
                  {
                    id: "opt-2",
                    slug: "extra-spicy",
                    name: "Extra Spicy",
                    priceDeltaCents: 100,
                    isActive: true,
                    sortOrder: 2,
                  },
                ],
              },
            ],
          },
          {
            id: "item-2",
            slug: "shan-noodle",
            nameEn: "Shan Noodle",
            nameMy: null,
            descriptionEn: null,
            imageUrl: null,
            basePriceCents: 1500,
            isActive: true,
            isSoldOut: false,
            tags: [],
            allergens: [],
            modifierGroups: [],
          },
        ],
      },
    ],
  },
  meta: { timestamp: new Date().toISOString() },
};

// ============================================
// TESTS
// ============================================

describe("Cart Sync (setupOnlineListener)", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    useCartStore.setState({ items: [] });
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("Test 1: online event with pendingSync items fetches /api/menu", async () => {
    const pendingItem = makePendingItem();
    useCartStore.setState({ items: [pendingItem] });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(menuApiResponse),
    });

    // Fire online event
    window.dispatchEvent(new Event("online"));

    // Wait for async sync
    await vi.waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith("/api/menu");
    });
  });

  it("Test 2: price match on all items clears pendingSync and shows success toast", async () => {
    const pendingItem = makePendingItem();
    useCartStore.setState({ items: [pendingItem] });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(menuApiResponse),
    });

    window.dispatchEvent(new Event("online"));

    await vi.waitFor(() => {
      const { items } = useCartStore.getState();
      expect(items[0].pendingSync).toBe(false);
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Cart synced successfully",
        type: "success",
      })
    );
  });

  it("Test 3: price changed on item updates cart basePriceCents and shows info toast", async () => {
    const pendingItem = makePendingItem({ basePriceCents: 1000 }); // was 1000, menu says 1200
    useCartStore.setState({ items: [pendingItem] });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(menuApiResponse),
    });

    window.dispatchEvent(new Event("online"));

    await vi.waitFor(() => {
      const { items } = useCartStore.getState();
      expect(items[0].basePriceCents).toBe(1200);
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("updated since you were offline"),
        type: "info",
      })
    );
  });

  it("Test 4: unavailable item removed from cart with persistent warning toast", async () => {
    // item-3 does not exist in menu response -> unavailable
    const unavailableItem = makePendingItem({
      menuItemId: "item-3",
      nameEn: "Discontinued Dish",
    });
    useCartStore.setState({ items: [unavailableItem] });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(menuApiResponse),
    });

    window.dispatchEvent(new Event("online"));

    await vi.waitFor(() => {
      const { items } = useCartStore.getState();
      expect(items).toHaveLength(0);
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Discontinued Dish"),
        type: "warning",
        duration: 30_000,
      })
    );
  });

  it("Test 5: listener guard prevents duplicate registration", () => {
    // The module-level setupOnlineListener() already ran once on import.
    // We verify by checking that only one online listener fires a single fetch.
    const pendingItem = makePendingItem();
    useCartStore.setState({ items: [pendingItem] });

    let fetchCallCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      fetchCallCount++;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(menuApiResponse),
      });
    });

    window.dispatchEvent(new Event("online"));

    // If duplicate listeners existed, fetch would be called > 1 time
    // Give it a tick to settle
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(fetchCallCount).toBe(1);
        resolve();
      }, 100);
    });
  });

  it("Test 6: purgeStalePendingSync clears all pendingSync flags", async () => {
    const pendingItem = makePendingItem();
    useCartStore.setState({ items: [pendingItem] });

    // Dynamic import to access the exported function
    const { purgeStalePendingSync } = await import("../cart-store");
    purgeStalePendingSync();

    const { items } = useCartStore.getState();
    expect(items[0].pendingSync).toBe(false);
  });
});
