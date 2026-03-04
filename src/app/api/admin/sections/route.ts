import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { apiError } from "@/lib/utils/api-error";
import { logger } from "@/lib/utils/logger";
import { z } from "zod";
import type { FeaturedSectionsRow, MenuItemsRow } from "@/types/database";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

interface SectionWithItems extends FeaturedSectionsRow {
  featured_section_items: {
    item_id: string;
    sort_order: number;
    menu_items: Pick<MenuItemsRow, "id" | "name_en" | "image_url" | "base_price_cents">;
  }[];
}

const createSectionSchema = z.object({
  name: z.string().min(1).max(200),
  subtitle: z.string().max(500).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a hex color")
    .optional()
    .nullable(),
  itemCount: z.number().int().min(1).max(20).optional().default(6),
  isVisible: z.boolean().optional().default(true),
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return apiError(auth.status === 403 ? "FORBIDDEN" : "UNAUTHORIZED", auth.error, auth.status);
    }

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: auth.userId,
      role: "admin",
      route: "admin/sections",
    });
    if (rl.limited) return rl.response;

    // Get all sections (including soft-deleted for admin)
    const { data: sections, error } = await auth.supabase
      .from("featured_sections")
      .select(
        `
        *,
        featured_section_items (
          item_id,
          sort_order,
          menu_items (
            id,
            name_en,
            image_url,
            base_price_cents
          )
        )
      `
      )
      .order("sort_order", { ascending: true })
      .returns<SectionWithItems[]>();

    if (error) {
      logger.exception(error, { api: "admin/sections", flowId: "fetch" });
      return apiError("INTERNAL_ERROR", "Failed to fetch sections", 500);
    }

    // Transform to include actual item count
    const transformed = sections.map((section) => ({
      id: section.id,
      slug: section.slug,
      name: section.name,
      subtitle: section.subtitle,
      icon: section.icon,
      accentColor: section.accent_color,
      sortOrder: section.sort_order,
      itemCount: section.item_count,
      actualItemCount: section.featured_section_items?.length ?? 0,
      isVisible: section.is_visible,
      isPredefined: section.is_predefined,
      hasUnpublishedChanges: section.has_unpublished_changes,
      deletedAt: section.deleted_at,
      createdAt: section.created_at,
      updatedAt: section.updated_at,
      updatedBy: section.updated_by,
      items:
        section.featured_section_items
          ?.sort((a, b) => a.sort_order - b.sort_order)
          .map((item) => ({
            id: item.menu_items.id,
            nameEn: item.menu_items.name_en,
            imageUrl: item.menu_items.image_url,
            basePriceCents: item.menu_items.base_price_cents,
            sortOrder: item.sort_order,
          })) ?? [],
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    logger.exception(error, { api: "admin/sections", flowId: "fetch" });
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return apiError(auth.status === 403 ? "FORBIDDEN" : "UNAUTHORIZED", auth.error, auth.status);
    }

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: auth.userId,
      role: "admin",
      route: "admin/sections",
    });
    if (rl.limited) return rl.response;

    const body = await request.json();
    const parsed = createSectionSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid data", 400, parsed.error.flatten());
    }

    // Generate slug from name
    const baseSlug = generateSlug(parsed.data.name);

    // Check for existing slug and append number if needed
    const { data: existingSlugs } = await auth.supabase
      .from("featured_sections")
      .select("slug")
      .like("slug", `${baseSlug}%`);

    let slug = baseSlug;
    if (existingSlugs && existingSlugs.length > 0) {
      const slugSet = new Set(existingSlugs.map((s) => s.slug));
      let counter = 1;
      while (slugSet.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Get max sort_order
    const { data: maxOrder } = await auth.supabase
      .from("featured_sections")
      .select("sort_order")
      .is("deleted_at", null)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const sortOrder = (maxOrder?.sort_order ?? -1) + 1;

    const { data: section, error } = await auth.supabase
      .from("featured_sections")
      .insert({
        slug,
        name: parsed.data.name,
        subtitle: parsed.data.subtitle ?? null,
        icon: parsed.data.icon ?? null,
        accent_color: parsed.data.accentColor ?? null,
        item_count: parsed.data.itemCount,
        is_visible: parsed.data.isVisible,
        sort_order: sortOrder,
        is_predefined: false,
        has_unpublished_changes: true, // New sections need to be published
        updated_by: auth.userId,
      })
      .select()
      .returns<FeaturedSectionsRow[]>()
      .single();

    if (error) {
      logger.exception(error, { api: "admin/sections", flowId: "create" });
      if (error.code === "23505") {
        return apiError("CONFLICT", "A section with this slug already exists", 409);
      }
      return apiError("INTERNAL_ERROR", "Failed to create section", 500);
    }

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error) {
    logger.exception(error, { api: "admin/sections", flowId: "create" });
    return apiError("INTERNAL_ERROR", "Internal server error", 500);
  }
}
