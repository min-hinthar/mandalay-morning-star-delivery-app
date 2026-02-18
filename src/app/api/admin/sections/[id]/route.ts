import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";
import type { FeaturedSectionsRow } from "@/types/database";
import type { SectionWithItems, SectionWithItemIds } from "./types";
import { updateSectionSchema, actionSchema } from "./schemas";
import { transformSectionResponse } from "./helpers";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rl = await checkRateLimit({ limiter: adminLimiter, identifier: auth.userId, role: "admin", route: "admin/sections/:id" });
    if (rl.limited) return rl.response;

    const { data: section, error } = await auth.supabase
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
            name_my,
            description_en,
            image_url,
            base_price_cents,
            is_active,
            is_sold_out
          )
        )
      `
      )
      .eq("id", id)
      .returns<SectionWithItems[]>()
      .single();

    if (error) {
      logger.exception(error, { api: "admin/sections/[id]", flowId: "fetch" });
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Section not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to fetch section" }, { status: 500 });
    }

    return NextResponse.json({
      ...transformSectionResponse(section),
      items:
        section.featured_section_items
          ?.sort((a, b) => a.sort_order - b.sort_order)
          .map((item) => ({
            id: item.menu_items.id,
            nameEn: item.menu_items.name_en,
            nameMy: item.menu_items.name_my,
            descriptionEn: item.menu_items.description_en,
            imageUrl: item.menu_items.image_url,
            basePriceCents: item.menu_items.base_price_cents,
            isActive: item.menu_items.is_active,
            isSoldOut: item.menu_items.is_sold_out,
            sortOrder: item.sort_order,
          })) ?? [],
    });
  } catch (error) {
    logger.exception(error, { api: "admin/sections/[id]", flowId: "fetch" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rl = await checkRateLimit({ limiter: adminLimiter, identifier: auth.userId, role: "admin", route: "admin/sections/:id" });
    if (rl.limited) return rl.response;

    const body = await request.json();
    const parsed = updateSectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check if section exists
    const { data: existing, error: existingError } = await auth.supabase
      .from("featured_sections")
      .select("is_predefined")
      .eq("id", id)
      .single();

    if (existingError) {
      if (existingError.code === "PGRST116") {
        return NextResponse.json({ error: "Section not found" }, { status: 404 });
      }
      throw existingError;
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: auth.userId,
      has_unpublished_changes: true, // Mark as having unpublished changes
    };

    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.subtitle !== undefined) updateData.subtitle = parsed.data.subtitle;
    if (parsed.data.icon !== undefined) updateData.icon = parsed.data.icon;
    if (parsed.data.accentColor !== undefined) updateData.accent_color = parsed.data.accentColor;
    if (parsed.data.itemCount !== undefined) updateData.item_count = parsed.data.itemCount;
    if (parsed.data.isVisible !== undefined) updateData.is_visible = parsed.data.isVisible;

    // Cannot change is_predefined status
    if (existing.is_predefined && parsed.data.name) {
      // Predefined sections can change name but not slug
    }

    const { data: section, error } = await auth.supabase
      .from("featured_sections")
      .update(updateData)
      .eq("id", id)
      .select()
      .returns<FeaturedSectionsRow[]>()
      .single();

    if (error) {
      logger.exception(error, { api: "admin/sections/[id]", flowId: "update" });
      return NextResponse.json({ error: "Failed to update section" }, { status: 500 });
    }

    return NextResponse.json(transformSectionResponse(section));
  } catch (error) {
    logger.exception(error, { api: "admin/sections/[id]", flowId: "update" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rl = await checkRateLimit({ limiter: adminLimiter, identifier: auth.userId, role: "admin", route: "admin/sections/:id" });
    if (rl.limited) return rl.response;

    // Check if section is predefined
    const { data: section, error: checkError } = await auth.supabase
      .from("featured_sections")
      .select("is_predefined")
      .eq("id", id)
      .single();

    if (checkError) {
      if (checkError.code === "PGRST116") {
        return NextResponse.json({ error: "Section not found" }, { status: 404 });
      }
      throw checkError;
    }

    if (section.is_predefined) {
      // Predefined sections: set is_visible = false instead of soft delete
      const { error } = await auth.supabase
        .from("featured_sections")
        .update({
          is_visible: false,
          updated_at: new Date().toISOString(),
          updated_by: auth.userId,
        })
        .eq("id", id);

      if (error) {
        logger.exception(error, { api: "admin/sections/[id]", flowId: "hide-predefined" });
        return NextResponse.json({ error: "Failed to hide section" }, { status: 500 });
      }

      return NextResponse.json({ success: true, action: "hidden" });
    }

    // Custom sections: soft delete
    const { error } = await auth.supabase
      .from("featured_sections")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: auth.userId,
      })
      .eq("id", id);

    if (error) {
      logger.exception(error, { api: "admin/sections/[id]", flowId: "soft-delete" });
      return NextResponse.json({ error: "Failed to delete section" }, { status: 500 });
    }

    return NextResponse.json({ success: true, action: "deleted" });
  } catch (error) {
    logger.exception(error, { api: "admin/sections/[id]", flowId: "delete" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rl = await checkRateLimit({ limiter: adminLimiter, identifier: auth.userId, role: "admin", route: "admin/sections/:id" });
    if (rl.limited) return rl.response;

    const body = await request.json();
    const parsed = actionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid action", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { action } = parsed.data;

    if (action === "restore") {
      // Restore soft-deleted section
      const { data: section, error } = await auth.supabase
        .from("featured_sections")
        .update({
          deleted_at: null,
          updated_at: new Date().toISOString(),
          updated_by: auth.userId,
        })
        .eq("id", id)
        .not("deleted_at", "is", null)
        .select()
        .returns<FeaturedSectionsRow[]>()
        .single();

      if (error) {
        logger.exception(error, { api: "admin/sections/[id]", flowId: "restore" });
        if (error.code === "PGRST116") {
          return NextResponse.json({ error: "Section not found or not deleted" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to restore section" }, { status: 500 });
      }

      return NextResponse.json(transformSectionResponse(section));
    }

    if (action === "duplicate") {
      // Get original section with items
      const { data: original, error: fetchError } = await auth.supabase
        .from("featured_sections")
        .select(
          `
          *,
          featured_section_items (
            item_id,
            sort_order
          )
        `
        )
        .eq("id", id)
        .returns<SectionWithItemIds[]>()
        .single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          return NextResponse.json({ error: "Section not found" }, { status: 404 });
        }
        throw fetchError;
      }

      // Generate new slug
      const baseSlug = `${original.slug}-copy`;
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

      // Create new section
      const { data: newSection, error: createError } = await auth.supabase
        .from("featured_sections")
        .insert({
          slug,
          name: `${original.name} (Copy)`,
          subtitle: original.subtitle,
          icon: original.icon,
          accent_color: original.accent_color,
          item_count: original.item_count,
          is_visible: false, // Start as hidden
          sort_order: sortOrder,
          is_predefined: false, // Copies are never predefined
          updated_by: auth.userId,
        })
        .select()
        .returns<FeaturedSectionsRow[]>()
        .single();

      if (createError) {
        logger.exception(createError, { api: "admin/sections/[id]", flowId: "duplicate" });
        return NextResponse.json({ error: "Failed to duplicate section" }, { status: 500 });
      }

      // Copy items to new section
      if (original.featured_section_items && original.featured_section_items.length > 0) {
        const itemInserts = original.featured_section_items.map(
          (item: { item_id: string; sort_order: number }) => ({
            section_id: newSection.id,
            item_id: item.item_id,
            sort_order: item.sort_order,
          })
        );

        const { error: itemsError } = await auth.supabase
          .from("featured_section_items")
          .insert(itemInserts);

        if (itemsError) {
          logger.exception(itemsError, { api: "admin/sections/[id]", flowId: "duplicate-items" });
          // Don't fail - section was created, just items weren't copied
        }
      }

      return NextResponse.json(transformSectionResponse(newSection), { status: 201 });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    logger.exception(error, { api: "admin/sections/[id]", flowId: "action" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
