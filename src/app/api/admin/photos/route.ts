import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";
import type { MenuItemsRow } from "@/types/database";

interface MenuItemWithPhoto extends Pick<
  MenuItemsRow,
  "id" | "name_en" | "image_url" | "category_id"
> {
  menu_categories: {
    name: string;
  };
}

interface AssignedPhotoInfo {
  id: string;
  name: string;
  imageUrl: string;
  categoryName: string;
  categoryId: string;
  isAssigned: true;
}

interface UnassignedPhotoInfo {
  id: string;
  name: string;
  imageUrl: string;
  storagePath: string;
  isAssigned: false;
}

type PhotoInfo = AssignedPhotoInfo | UnassignedPhotoInfo;

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
 * List all photos with metadata (from menu items with images + unassigned in storage)
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

    // Get all menu items with images (assigned photos)
    let query = auth.supabase
      .from("menu_items")
      .select(
        `
        id,
        name_en,
        image_url,
        category_id,
        menu_categories (
          name
        )
      `
      )
      .not("image_url", "is", null);

    // Apply search filter for assigned photos
    if (search) {
      query = query.ilike("name_en", `%${search}%`);
    }

    const { data: items, error } = await query
      .order("name_en", { ascending: true })
      .returns<MenuItemWithPhoto[]>();

    if (error) {
      logger.exception(error, { api: "admin/photos", flowId: "fetch" });
      return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 });
    }

    // Transform to assigned photo info
    const assignedPhotos: AssignedPhotoInfo[] = (items || [])
      .filter((item) => item.image_url)
      .map((item) => ({
        id: item.id,
        name: item.name_en,
        imageUrl: item.image_url!,
        categoryName: item.menu_categories?.name || "Unknown",
        categoryId: item.category_id,
        isAssigned: true as const,
      }));

    // Get unassigned photos from storage bucket
    let unassignedPhotos: UnassignedPhotoInfo[] = [];

    if (filter !== "assigned") {
      const { data: files, error: storageError } = await auth.supabase.storage
        .from("menu-photos")
        .list("unassigned", { limit: 1000 });

      if (storageError) {
        logger.exception(storageError, { api: "admin/photos", flowId: "list-unassigned" });
      } else if (files) {
        // Filter to actual files (have metadata with size) - folders have metadata: null
        const actualFiles = files.filter((f) => f.name && f.metadata);

        // Get public URLs for unassigned photos
        unassignedPhotos = actualFiles.map((file) => {
          const storagePath = `unassigned/${file.name}`;
          const {
            data: { publicUrl },
          } = auth.supabase.storage.from("menu-photos").getPublicUrl(storagePath);

          return {
            id: `unassigned-${file.name}`,
            name: file.name,
            imageUrl: publicUrl,
            storagePath,
            isAssigned: false as const,
          };
        });

        // Apply search filter to unassigned photos (match filename)
        if (search) {
          unassignedPhotos = unassignedPhotos.filter((p) => p.name.toLowerCase().includes(search));
        }
      }
    }

    // Combine and filter
    let allPhotos: PhotoInfo[] = [];

    if (filter === "assigned") {
      allPhotos = assignedPhotos;
    } else if (filter === "unassigned") {
      allPhotos = unassignedPhotos;
    } else {
      allPhotos = [...assignedPhotos, ...unassignedPhotos];
    }

    const response: PhotosResponse = {
      photos: allPhotos,
      stats: {
        total: assignedPhotos.length + unassignedPhotos.length,
        assigned: assignedPhotos.length,
        unassigned: unassignedPhotos.length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.exception(error, { api: "admin/photos", flowId: "fetch" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
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
          return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Failed to assign photo" }, { status: 500 });
      }

      return NextResponse.json(
        {
          success: true,
          menuItemId: item.id,
          name: item.name_en,
          imageUrl: item.image_url,
        },
        { status: 201 }
      );
    }

    // If no menuItemId, just acknowledge the upload (photo is in storage but unassigned)
    return NextResponse.json(
      {
        success: true,
        imageUrl,
        message: "Photo uploaded but not assigned to any menu item",
      },
      { status: 201 }
    );
  } catch (error) {
    logger.exception(error, { api: "admin/photos", flowId: "upload" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
