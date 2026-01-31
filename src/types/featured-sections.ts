import type { MenuItem } from "./menu";

export interface FeaturedSection {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  icon: string | null;
  accentColor: string | null;
  sortOrder: number;
  itemCount: number;
  isVisible: boolean;
  isPredefined: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface FeaturedSectionItem {
  sectionId: string;
  itemId: string;
  sortOrder: number;
}

// For API responses with items included
export interface FeaturedSectionWithItems extends FeaturedSection {
  items: MenuItem[];
}

// For admin draft/publish workflow
export interface FeaturedSectionDraft extends FeaturedSection {
  isDraft: boolean;
  publishedVersion: FeaturedSection | null;
}

// API response types
export interface FeaturedSectionsResponse {
  data: {
    sections: FeaturedSectionWithItems[];
  };
  meta: {
    timestamp: string;
  };
}

// Admin API types
export interface FeaturedSectionCreateInput {
  slug: string;
  name: string;
  subtitle?: string | null;
  icon?: string | null;
  accentColor?: string | null;
  sortOrder?: number;
  itemCount?: number;
  isVisible?: boolean;
}

export interface FeaturedSectionUpdateInput {
  name?: string;
  subtitle?: string | null;
  icon?: string | null;
  accentColor?: string | null;
  sortOrder?: number;
  itemCount?: number;
  isVisible?: boolean;
}
