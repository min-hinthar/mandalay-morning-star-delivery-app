import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { ProfileRole, MenuCategoriesRow } from "@/types/database";

interface ProfileRow {
  role: ProfileRole;
}

interface CategoryWithCount extends MenuCategoriesRow {
  item_count: number;
}

const createCategorySchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase letters, numbers, and hyphens"
    ),
  name: z.string().min(1).max(200),
  sort_order: z.number().int().min(0).optional(),
  is_active: z.boolean().optional().default(true),
});

async function checkAdminAuth() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized", status: 401, supabase: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .returns<ProfileRow[]>()
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    return { error: "Forbidden", status: 403, supabase: null };
  }

  return { error: null, status: 200, supabase };
}

export async function GET() {
  try {
    const auth = await checkAdminAuth();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Get categories with item count
    const { data: categories, error } = await auth.supabase!
      .from("menu_categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .returns<MenuCategoriesRow[]>();

    if (error) {
      console.error("Failed to fetch categories:", error);
      return NextResponse.json(
        { error: "Failed to fetch categories" },
        { status: 500 }
      );
    }

    // Get item counts per category
    const { data: itemCounts, error: countError } = await auth.supabase!
      .from("menu_items")
      .select("category_id");

    if (countError) {
      console.error("Failed to fetch item counts:", countError);
      return NextResponse.json(
        { error: "Failed to fetch item counts" },
        { status: 500 }
      );
    }

    // Count items per category
    const countMap = itemCounts.reduce(
      (acc: Record<string, number>, item: { category_id: string }) => {
        acc[item.category_id] = (acc[item.category_id] || 0) + 1;
        return acc;
      },
      {}
    );

    // Merge counts with categories
    const categoriesWithCounts: CategoryWithCount[] = categories.map((cat) => ({
      ...cat,
      item_count: countMap[cat.id] || 0,
    }));

    return NextResponse.json(categoriesWithCounts);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await checkAdminAuth();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Get max sort_order if not provided
    let sortOrder = parsed.data.sort_order;
    if (sortOrder === undefined) {
      const { data: maxOrder } = await auth.supabase!
        .from("menu_categories")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .single();

      sortOrder = (maxOrder?.sort_order ?? -1) + 1;
    }

    const { data: category, error } = await auth.supabase!
      .from("menu_categories")
      .insert({
        ...parsed.data,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create category:", error);
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A category with this slug already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Failed to create category" },
        { status: 500 }
      );
    }

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
