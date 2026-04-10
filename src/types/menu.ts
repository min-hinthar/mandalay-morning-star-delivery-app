export interface ModifierOption {
  id: string;
  slug: string;
  name: string;
  priceDeltaCents: number;
  isActive: boolean;
  sortOrder: number;
}

export interface ModifierGroup {
  id: string;
  slug: string;
  name: string;
  selectionType: "single" | "multiple";
  minSelect: number;
  maxSelect: number;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  slug: string;
  nameEn: string;
  nameMy: string | null;
  descriptionEn: string | null;
  imageUrl: string | null;
  basePriceCents: number;
  isActive: boolean;
  isSoldOut: boolean;
  tags: string[];
  allergens: string[];
  modifierGroups: ModifierGroup[];
}

export interface MenuCategory {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  items: MenuItem[];
}

export interface MenuResponse {
  data: {
    categories: MenuCategory[];
  };
  meta: {
    timestamp: string;
  };
}

/** Phase 115 / DATA-04: Pagination metadata for paginated menu search */
export interface MenuSearchPagination {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export interface MenuSearchResponse {
  data: {
    items: MenuItem[];
    query: string;
    count: number;
    /** Phase 115: Optional for backward compat — present when limit/offset params are used */
    pagination?: MenuSearchPagination;
  };
  meta: {
    timestamp: string;
  };
}
