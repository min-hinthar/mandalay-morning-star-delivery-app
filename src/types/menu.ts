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

export interface MenuSearchResponse {
  data: {
    items: MenuItem[];
    query: string;
    count: number;
  };
  meta: {
    timestamp: string;
  };
}
