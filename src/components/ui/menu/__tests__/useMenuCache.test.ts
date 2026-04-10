import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { MenuCategory } from "@/types/menu";

// ============================================
// MOCKS — vi.mock is hoisted, use vi.hoisted for shared refs
// ============================================

const { mockMenuCache } = vi.hoisted(() => ({
  mockMenuCache: {
    save: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    isStale: vi.fn().mockReturnValue(false),
    getAgeMs: vi.fn().mockReturnValue(0),
    clear: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/lib/services/customer-offline-store", () => ({
  menuCache: mockMenuCache,
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Import AFTER mocks
import { useMenuCache } from "../useMenuCache";

// ============================================
// TEST DATA
// ============================================

const testCategory: MenuCategory = {
  id: "cat-1",
  slug: "appetizers",
  name: "Appetizers",
  sortOrder: 1,
  items: [
    {
      id: "item-1",
      slug: "spring-roll",
      nameEn: "Spring Roll",
      nameMy: null,
      descriptionEn: "Crispy spring roll",
      imageUrl: null,
      basePriceCents: 500,
      isActive: true,
      isSoldOut: false,
      tags: [],
      allergens: [],
      modifierGroups: [],
    },
  ],
};

const cachedMenuResponse = {
  data: { categories: [testCategory] },
  meta: { timestamp: "2026-04-09T10:00:00Z" },
};

const freshTimestamp = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
const staleTimestamp = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(); // 25 hours ago

// ============================================
// TESTS
// ============================================

describe("useMenuCache (IDB-first)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMenuCache.get.mockResolvedValue(null);
    mockMenuCache.isStale.mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Test 1: returns cached categories immediately on mount when IDB has data and network is pending", async () => {
    mockMenuCache.get.mockResolvedValue({
      data: cachedMenuResponse,
      cachedAt: freshTimestamp,
      version: "v1",
    });

    const { result } = renderHook(() =>
      useMenuCache({
        data: undefined,
        categories: [],
        error: null,
        isLoading: true,
      })
    );

    // Initially empty before IDB resolves
    expect(result.current.displayCategories).toEqual([]);

    // After IDB resolves, should show cached data
    await waitFor(() => {
      expect(result.current.usingCachedData).toBe(true);
    });

    expect(result.current.displayCategories).toEqual([testCategory]);
    expect(result.current.cachedAt).toBe(freshTimestamp);
  });

  it("Test 2: transitions from cached to fresh data when network succeeds", async () => {
    mockMenuCache.get.mockResolvedValue({
      data: cachedMenuResponse,
      cachedAt: freshTimestamp,
      version: "v1",
    });

    const freshCategories: MenuCategory[] = [
      { ...testCategory, name: "Fresh Appetizers" },
    ];

    const { result, rerender } = renderHook(
      (props) => useMenuCache(props),
      {
        initialProps: {
          data: undefined as
            | { data?: { categories?: MenuCategory[] } }
            | undefined,
          categories: [] as MenuCategory[],
          error: null as unknown,
          isLoading: true,
        },
      }
    );

    // Wait for IDB cache to load
    await waitFor(() => {
      expect(result.current.usingCachedData).toBe(true);
    });

    // Network success arrives
    rerender({
      data: { data: { categories: freshCategories } },
      categories: freshCategories,
      error: null,
      isLoading: false,
    });

    await waitFor(() => {
      expect(result.current.usingCachedData).toBe(false);
    });

    expect(result.current.cachedAt).toBeNull();
    expect(result.current.displayCategories).toEqual(freshCategories);
    expect(mockMenuCache.save).toHaveBeenCalled();
  });

  it("Test 3: ignores IDB cache older than 24h (stale)", async () => {
    mockMenuCache.get.mockResolvedValue({
      data: cachedMenuResponse,
      cachedAt: staleTimestamp,
      version: "v1",
    });
    mockMenuCache.isStale.mockReturnValue(true);

    const { result } = renderHook(() =>
      useMenuCache({
        data: undefined,
        categories: [],
        error: null,
        isLoading: true,
      })
    );

    // Wait for effect to run
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.usingCachedData).toBe(false);
    expect(result.current.displayCategories).toEqual([]);
    expect(result.current.cachedAt).toBeNull();
  });

  it("Test 4: returns empty categories when no IDB cache and network fails", async () => {
    mockMenuCache.get.mockResolvedValue(null);

    const { result } = renderHook(() =>
      useMenuCache({
        data: undefined,
        categories: [],
        error: new Error("Network error"),
        isLoading: false,
      })
    );

    // Wait for effects
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.usingCachedData).toBe(false);
    expect(result.current.displayCategories).toEqual([]);
  });

  it("Test 5: keeps showing cached data when IDB has cache but network fails", async () => {
    mockMenuCache.get.mockResolvedValue({
      data: cachedMenuResponse,
      cachedAt: freshTimestamp,
      version: "v1",
    });

    const { result } = renderHook(() =>
      useMenuCache({
        data: undefined,
        categories: [],
        error: new Error("Network error"),
        isLoading: false,
      })
    );

    await waitFor(() => {
      expect(result.current.usingCachedData).toBe(true);
    });

    expect(result.current.displayCategories).toEqual([testCategory]);
    expect(result.current.cachedAt).toBe(freshTimestamp);
  });
});
