import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";
import { z } from "zod";
import type { MenuItemsRow } from "@/types/database";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

interface SectionItem {
  item_id: string;
  sort_order: number;
  menu_items: Pick<
    MenuItemsRow,
    | "id"
    | "name_en"
    | "name_my"
    | "description_en"
    | "image_url"
    | "base_price_cents"
    | "is_active"
    | "is_sold_out"
  >;
}

const addItemsSchema = z.object({
  itemIds: z.array(z.string().uuid()).min(1),
});

const reorderItemsSchema = z.object({
  itemIds: z.array(z.string().uuid()),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: auth.userId,
      role: "admin",
      route: "admin/sections/:id/items",
    });
    if (rl.limited) return rl.response;

    // Check section exists
    const { error: sectionError } = await auth.supabase
      .from("featured_sections")
      .select("id")
      .eq("id", id)
      .single();

    if (sectionError) {
      if (sectionError.code === "PGRST116") {
        return NextResponse.json({ error: "Section not found" }, { status: 404 });
      }
      throw sectionError;
    }

    const { data: items, error } = await auth.supabase
      .from("featured_section_items")
      .select(
        `
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
      `
      )
      .eq("section_id", id)
      .order("sort_order", { ascending: true })
      .returns<SectionItem[]>();

    if (error) {
      logger.exception(error, { api: "admin/sections/[id]/items", flowId: "fetch" });
      return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
    }

    const transformed = items.map((item) => ({
      id: item.menu_items.id,
      nameEn: item.menu_items.name_en,
      nameMy: item.menu_items.name_my,
      descriptionEn: item.menu_items.description_en,
      imageUrl: item.menu_items.image_url,
      basePriceCents: item.menu_items.base_price_cents,
      isActive: item.menu_items.is_active,
      isSoldOut: item.menu_items.is_sold_out,
      sortOrder: item.sort_order,
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    logger.exception(error, { api: "admin/sections/[id]/items", flowId: "fetch" });
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

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: auth.userId,
      role: "admin",
      route: "admin/sections/:id/items",
    });
    if (rl.limited) return rl.response;

    const body = await request.json();
    const parsed = addItemsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check section exists
    const { error: sectionError } = await auth.supabase
      .from("featured_sections")
      .select("id")
      .eq("id", id)
      .single();

    if (sectionError) {
      if (sectionError.code === "PGRST116") {
        return NextResponse.json({ error: "Section not found" }, { status: 404 });
      }
      throw sectionError;
    }

    // Get current max sort_order
    const { data: maxOrder } = await auth.supabase
      .from("featured_section_items")
      .select("sort_order")
      .eq("section_id", id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    let nextOrder = (maxOrder?.sort_order ?? -1) + 1;

    // Get existing item IDs to avoid duplicates
    const { data: existingItems } = await auth.supabase
      .from("featured_section_items")
      .select("item_id")
      .eq("section_id", id);

    const existingIds = new Set(existingItems?.map((i) => i.item_id) ?? []);
    const newItemIds = parsed.data.itemIds.filter((itemId) => !existingIds.has(itemId));

    if (newItemIds.length === 0) {
      return NextResponse.json({ message: "All items already in section" });
    }

    // Verify items exist
    const { data: validItems } = await auth.supabase
      .from("menu_items")
      .select("id")
      .in("id", newItemIds);

    const validIds = new Set(validItems?.map((i) => i.id) ?? []);
    const itemsToInsert = newItemIds
      .filter((itemId) => validIds.has(itemId))
      .map((itemId) => ({
        section_id: id,
        item_id: itemId,
        sort_order: nextOrder++,
      }));

    if (itemsToInsert.length === 0) {
      return NextResponse.json({ error: "No valid items to add" }, { status: 400 });
    }

    const { error: insertError } = await auth.supabase
      .from("featured_section_items")
      .insert(itemsToInsert);

    if (insertError) {
      logger.exception(insertError, { api: "admin/sections/[id]/items", flowId: "add" });
      return NextResponse.json({ error: "Failed to add items" }, { status: 500 });
    }

    // Update section updated_at
    await auth.supabase
      .from("featured_sections")
      .update({
        updated_at: new Date().toISOString(),
        updated_by: auth.userId,
      })
      .eq("id", id);

    // Return updated items list
    const { data: items } = await auth.supabase
      .from("featured_section_items")
      .select(
        `
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
      `
      )
      .eq("section_id", id)
      .order("sort_order", { ascending: true })
      .returns<SectionItem[]>();

    const transformed =
      items?.map((item) => ({
        id: item.menu_items.id,
        nameEn: item.menu_items.name_en,
        nameMy: item.menu_items.name_my,
        descriptionEn: item.menu_items.description_en,
        imageUrl: item.menu_items.image_url,
        basePriceCents: item.menu_items.base_price_cents,
        isActive: item.menu_items.is_active,
        isSoldOut: item.menu_items.is_sold_out,
        sortOrder: item.sort_order,
      })) ?? [];

    return NextResponse.json(transformed, { status: 201 });
  } catch (error) {
    logger.exception(error, { api: "admin/sections/[id]/items", flowId: "add" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: auth.userId,
      role: "admin",
      route: "admin/sections/:id/items",
    });
    if (rl.limited) return rl.response;

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ error: "itemId query parameter required" }, { status: 400 });
    }

    const { error } = await auth.supabase
      .from("featured_section_items")
      .delete()
      .eq("section_id", id)
      .eq("item_id", itemId);

    if (error) {
      logger.exception(error, { api: "admin/sections/[id]/items", flowId: "remove" });
      return NextResponse.json({ error: "Failed to remove item" }, { status: 500 });
    }

    // Update section updated_at
    await auth.supabase
      .from("featured_sections")
      .update({
        updated_at: new Date().toISOString(),
        updated_by: auth.userId,
      })
      .eq("id", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.exception(error, { api: "admin/sections/[id]/items", flowId: "remove" });
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

    const rl = await checkRateLimit({
      limiter: adminLimiter,
      identifier: auth.userId,
      role: "admin",
      route: "admin/sections/:id/items",
    });
    if (rl.limited) return rl.response;

    const body = await request.json();
    const parsed = reorderItemsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Update sort_order for each item
    const updates = parsed.data.itemIds.map((itemId, index) =>
      auth.supabase
        .from("featured_section_items")
        .update({ sort_order: index })
        .eq("section_id", id)
        .eq("item_id", itemId)
    );

    await Promise.all(updates);

    // Update section updated_at
    await auth.supabase
      .from("featured_sections")
      .update({
        updated_at: new Date().toISOString(),
        updated_by: auth.userId,
      })
      .eq("id", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.exception(error, { api: "admin/sections/[id]/items", flowId: "reorder" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
