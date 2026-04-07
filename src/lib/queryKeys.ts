/**
 * Centralized query key factory for TanStack React Query.
 *
 * Phase 110 / DATA-02: Replaces inline arrays scattered across hooks so cache
 * invalidation in Phase 111 (form recovery, price polling) and Phase 115
 * (optimistic cart updates) hits the right keys consistently.
 *
 * Convention: queryKeys.{namespace}.{operation}(args). Returns `as const`
 * tuples so TanStack's structural equality stays referentially correct.
 */

export const queryKeys = {
  menu: {
    all: ["menu"] as const,
    list: () => [...queryKeys.menu.all, "list"] as const,
    search: (query: string) => [...queryKeys.menu.all, "search", query] as const,
  },
  addresses: {
    all: ["addresses"] as const,
    list: () => [...queryKeys.addresses.all, "list"] as const,
    detail: (id: string) => [...queryKeys.addresses.all, "detail", id] as const,
  },
  orders: {
    all: ["orders"] as const,
    history: () => [...queryKeys.orders.all, "history"] as const,
    itemsForSearch: (userId: string) =>
      [...queryKeys.orders.all, "items-for-search", userId] as const,
  },
} as const;

export type QueryKey = ReturnType<
  | typeof queryKeys.menu.list
  | typeof queryKeys.menu.search
  | typeof queryKeys.addresses.list
  | typeof queryKeys.addresses.detail
  | typeof queryKeys.orders.history
  | typeof queryKeys.orders.itemsForSearch
>;
