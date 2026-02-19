import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";
import { z } from "zod";
import type { MenuItemsRow } from "@/types/database";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

const uploadPhotoSchema = z.object({
  imageUrl: z.string().url("Invalid image URL"),
});

/**
 * POST /api/admin/menu/[id]/photo
 * Upload/set photo for a specific menu item
 * Body: { imageUrl: string }
 *
 * Replaces existing photo if present
 */
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
      route: "admin/menu/:id/photo",
    });
    if (rl.limited) return rl.response;

    const body = await request.json();
    const parsed = uploadPhotoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check if menu item exists and get old image URL
    const { data: currentItem, error: fetchError } = await auth.supabase
      .from("menu_items")
      .select("id, name_en, image_url")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
      }
      throw fetchError;
    }

    const oldImageUrl = currentItem.image_url;

    // Update menu item with new image URL
    const { data: item, error } = await auth.supabase
      .from("menu_items")
      .update({
        image_url: parsed.data.imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, name_en, image_url")
      .returns<Pick<MenuItemsRow, "id" | "name_en" | "image_url">[]>()
      .single();

    if (error) {
      logger.exception(error, { api: "admin/menu/[id]/photo", flowId: "upload" });
      return NextResponse.json({ error: "Failed to update menu item photo" }, { status: 500 });
    }

    // Note: If old image was in Supabase Storage, the deletion should be handled
    // by the database trigger or a separate cleanup process

    return NextResponse.json({
      success: true,
      menuItemId: item.id,
      name: item.name_en,
      publicUrl: item.image_url,
      replacedUrl: oldImageUrl,
    });
  } catch (error) {
    logger.exception(error, { api: "admin/menu/[id]/photo", flowId: "upload" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/menu/[id]/photo
 * Remove photo from menu item
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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
      route: "admin/menu/:id/photo",
    });
    if (rl.limited) return rl.response;

    // Check if menu item exists and has a photo
    const { data: currentItem, error: fetchError } = await auth.supabase
      .from("menu_items")
      .select("id, image_url")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
      }
      throw fetchError;
    }

    if (!currentItem.image_url) {
      return NextResponse.json({ error: "Menu item has no photo" }, { status: 400 });
    }

    // Clear the image_url
    const { error } = await auth.supabase
      .from("menu_items")
      .update({
        image_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      logger.exception(error, { api: "admin/menu/[id]/photo", flowId: "delete" });
      return NextResponse.json({ error: "Failed to remove photo" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.exception(error, { api: "admin/menu/[id]/photo", flowId: "delete" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
