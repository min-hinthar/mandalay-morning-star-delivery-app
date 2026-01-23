import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import { logger } from "@/lib/utils/logger";

const updateCategorySchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase letters, numbers, and hyphens"
    )
    .optional(),
  name: z.string().min(1).max(200).optional(),
  sort_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
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
    const parsed = updateCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data: category, error } = await auth.supabase
      .from("menu_categories")
      .update(parsed.data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.exception(error, { api: "admin/categories/[id]" });
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A category with this slug already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Failed to update category" },
        { status: 500 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    logger.exception(error, { api: "admin/categories/[id]" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    // Check if category has associated menu items
    const { count } = await auth.supabase
      .from("menu_items")
      .select("*", { count: "exact", head: true })
      .eq("category_id", id);

    if (count && count > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete category with existing menu items. Remove or reassign items first.",
          itemCount: count,
        },
        { status: 409 }
      );
    }

    const { error } = await auth.supabase
      .from("menu_categories")
      .delete()
      .eq("id", id);

    if (error) {
      logger.exception(error, { api: "admin/categories/[id]", flowId: "delete" });
      return NextResponse.json(
        { error: "Failed to delete category" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.exception(error, { api: "admin/categories/[id]" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
