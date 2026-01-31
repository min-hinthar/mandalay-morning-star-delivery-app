import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";
import type { MenuItemsRow } from "@/types/database";

interface MenuItemWithPhoto extends Pick<MenuItemsRow, "id" | "name_en" | "image_url" | "category_id"> {
  menu_categories: {
    name: string;
  };
}

interface PhotoInfo {
  id: string;
  name: string;
  imageUrl: string;
  categoryName: string;
  categoryId: string;
  isAssigned: true;
}

interface PhotosResponse {
  photos: PhotoInfo[];
  stats: {
    total: number;
    assigned: number;
    unassigned: number;
  };
}

/**
 * GET /api/admin/photos
 * List all photos with metadata (from menu items with images)
 * Query params: search, filter (assigned|unassigned|all)
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const filter = searchParams.get("filter") || "all";

    // Get all menu items with images
    let query = auth.supabase
      .from("menu_items")
      .select(`
        id,
        name_en,
        image_url,
        category_id,
        menu_categories (
          name
        )
      `)
      .not("image_url", "is", null);

    // Apply search filter
    if (search) {
      query = query.ilike("name_en", `%${search}%`);
    }

    const { data: items, error } = await query
      .order("name_en", { ascending: true })
      .returns<MenuItemWithPhoto[]>();

    if (error) {
      logger.exception(error, { api: "admin/photos", flowId: "fetch" });
      return NextResponse.json(
        { error: "Failed to fetch photos" },
        { status: 500 }
      );
    }

    // Transform to photo info
    const photos: PhotoInfo[] = (items || [])
      .filter((item) => item.image_url)
      .map((item) => ({
        id: item.id,
        name: item.name_en,
        imageUrl: item.image_url!,
        categoryName: item.menu_categories?.name || "Unknown",
        categoryId: item.category_id,
        isAssigned: true as const,
      }));

    // Apply filter
    let filteredPhotos = photos;
    if (filter === "assigned") {
      filteredPhotos = photos; // All photos from menu_items are assigned
    } else if (filter === "unassigned") {
      filteredPhotos = []; // No unassigned photos in this implementation
    }

    const response: PhotosResponse = {
      photos: filteredPhotos,
      stats: {
        total: photos.length,
        assigned: photos.length,
        unassigned: 0,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.exception(error, { api: "admin/photos", flowId: "fetch" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/photos
 * Upload a single photo (receives URL after client-side Supabase Storage upload)
 * Body: { imageUrl, menuItemId? }
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { imageUrl, menuItemId } = body;

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 }
      );
    }

    // If menuItemId provided, update the menu item's image_url
    if (menuItemId) {
      const { data: item, error } = await auth.supabase
        .from("menu_items")
        .update({
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", menuItemId)
        .select("id, name_en, image_url")
        .returns<Pick<MenuItemsRow, "id" | "name_en" | "image_url">[]>()
        .single();

      if (error) {
        logger.exception(error, { api: "admin/photos", flowId: "assign" });
        if (error.code === "PGRST116") {
          return NextResponse.json(
            { error: "Menu item not found" },
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
        imageUrl: item.image_url,
      }, { status: 201 });
    }

    // If no menuItemId, just acknowledge the upload (photo is in storage but unassigned)
    return NextResponse.json({
      success: true,
      imageUrl,
      message: "Photo uploaded but not assigned to any menu item",
    }, { status: 201 });
  } catch (error) {
    logger.exception(error, { api: "admin/photos", flowId: "upload" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
