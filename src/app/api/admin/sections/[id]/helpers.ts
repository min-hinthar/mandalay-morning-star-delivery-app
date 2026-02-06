import type { FeaturedSectionsRow } from "@/types/database";

export function transformSectionResponse(section: FeaturedSectionsRow) {
  return {
    id: section.id,
    slug: section.slug,
    name: section.name,
    subtitle: section.subtitle,
    icon: section.icon,
    accentColor: section.accent_color,
    sortOrder: section.sort_order,
    itemCount: section.item_count,
    isVisible: section.is_visible,
    isPredefined: section.is_predefined,
    deletedAt: section.deleted_at,
    createdAt: section.created_at,
    updatedAt: section.updated_at,
    updatedBy: section.updated_by,
  };
}
