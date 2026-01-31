import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";
import { z } from "zod";
import type { MenuItemsRow } from "@/types/database";

const assignPhotoSchema = z.object({
  menuItemId: z.string().uuid("Invalid menu item ID"),
  imageUrl: z.string().url("Invalid image URL").optional(),
});

/**
 * PATCH /api/admin/photos/[id]
 * Assign photo to a menu item or update its image URL
 * [id] is the menu item ID
 * Body: { menuItemId, imageUrl? }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = assignPhotoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Get current item to check old image URL
    const { data: currentItem, error: fetchError } = await auth.supabase
      .from("menu_items")
      .select("id, image_url")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Menu item not found" },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Get the target menu item's current image to use
    const { data: sourceItem, error: sourceError } = await auth.supabase
      .from("menu_items")
      .select("image_url")
      .eq("id", parsed.data.menuItemId)
      .single();

    if (sourceError && sourceError.code !== "PGRST116") {
      throw sourceError;
    }

    const imageUrl = parsed.data.imageUrl || sourceItem?.image_url || currentItem?.image_url;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "No image URL provided or found" },
        { status: 400 }
      );
    }

    // Update menu item with new image URL
    const { data: item, error } = await auth.supabase
      .from("menu_items")
      .update({
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.menuItemId)
      .select("id, name_en, image_url")
      .returns<Pick<MenuItemsRow, "id" | "name_en" | "image_url">[]>()
      .single();

    if (error) {
      logger.exception(error, { api: "admin/photos/[id]", flowId: "assign" });
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Target menu item not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Failed to assign photo" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      menuItemId: item.id,
      name: item.name_en,
      publicUrl: item.image_url,
    });
  } catch (error) {
    logger.exception(error, { api: "admin/photos/[id]", flowId: "assign" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/photos/[id]
 * Remove photo from a menu item
 * [id] is the menu item ID
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Get current item to check if it has an image
    const { data: currentItem, error: fetchError } = await auth.supabase
      .from("menu_items")
      .select("id, image_url")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Menu item not found" },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    if (!currentItem.image_url) {
      return NextResponse.json(
        { error: "Menu item has no photo to delete" },
        { status: 400 }
      );
    }

    // Clear the image_url (actual storage deletion handled by trigger if it's a Supabase URL)
    const { error } = await auth.supabase
      .from("menu_items")
      .update({
        image_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      logger.exception(error, { api: "admin/photos/[id]", flowId: "delete" });
      return NextResponse.json(
        { error: "Failed to remove photo" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.exception(error, { api: "admin/photos/[id]", flowId: "delete" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
