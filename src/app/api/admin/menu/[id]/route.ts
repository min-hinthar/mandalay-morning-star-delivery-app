import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

const updateMenuItemSchema = z.object({
  category_id: z.string().uuid("Invalid category ID").optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens").optional(),
  name_en: z.string().min(1).max(200).optional(),
  name_my: z.string().max(200).optional().nullable(),
  description_en: z.string().max(1000).optional().nullable(),
  base_price_cents: z.number().int().min(0).optional(),
  image_url: z.string().url().optional().nullable(),
  is_active: z.boolean().optional(),
  is_sold_out: z.boolean().optional(),
  allergens: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

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
    const parsed = updateMenuItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data: item, error } = await auth.supabase
      .from("menu_items")
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update menu item:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Menu item not found" },
          { status: 404 }
        );
      }
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A menu item with this slug already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Failed to update menu item" },
        { status: 500 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error updating menu item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Check if item has associated orders
    const { count } = await auth.supabase
      .from("order_items")
      .select("*", { count: "exact", head: true })
      .eq("menu_item_id", id);

    if (count && count > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete menu item with existing orders. Consider marking it as inactive instead.",
          orderCount: count,
        },
        { status: 409 }
      );
    }

    const { error } = await auth.supabase
      .from("menu_items")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete menu item:", error);
      return NextResponse.json(
        { error: "Failed to delete menu item" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
