import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";
import { z } from "zod";

interface MenuItemRow {
  id: string;
  category_id: string;
  slug: string;
  name_en: string;
  name_my: string | null;
  description_en: string | null;
  base_price_cents: number;
  image_url: string | null;
  is_active: boolean;
  is_sold_out: boolean;
  allergens: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
  menu_categories: {
    id: string;
    name: string;
    slug: string;
  };
}

const createMenuItemSchema = z.object({
  category_id: z.string().uuid("Invalid category ID"),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  name_en: z.string().min(1).max(200),
  name_my: z.string().max(200).optional().nullable(),
  description_en: z.string().max(1000).optional().nullable(),
  base_price_cents: z.number().int().min(0),
  image_url: z.string().url().optional().nullable(),
  is_active: z.boolean().optional().default(true),
  is_sold_out: z.boolean().optional().default(false),
  allergens: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
});

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { data: items, error } = await auth.supabase
      .from("menu_items")
      .select(`
        *,
        menu_categories (
          id,
          name,
          slug
        )
      `)
      .order("created_at", { ascending: false })
      .returns<MenuItemRow[]>();

    if (error) {
      logger.exception(error, { api: "admin/menu", flowId: "fetch" });
      return NextResponse.json(
        { error: "Failed to fetch menu items" },
        { status: 500 }
      );
    }

    return NextResponse.json(items);
  } catch (error) {
    logger.exception(error, { api: "admin/menu", flowId: "fetch" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = createMenuItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data: item, error } = await auth.supabase
      .from("menu_items")
      .insert(parsed.data)
      .select()
      .single();

    if (error) {
      logger.exception(error, { api: "admin/menu", flowId: "create" });
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A menu item with this slug already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Failed to create menu item" },
        { status: 500 }
      );
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    logger.exception(error, { api: "admin/menu", flowId: "create" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
