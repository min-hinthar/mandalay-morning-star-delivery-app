import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";
import type { MenuItemsRow } from "@/types/database";
import { checkRateLimit, adminLimiter } from "@/lib/rate-limit";

interface OrderItemWithMenuItem {
  menu_item_id: string | null;
  quantity: number;
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
  > | null;
}

interface PopularItem {
  id: string;
  nameEn: string;
  nameMy: string | null;
  descriptionEn: string | null;
  imageUrl: string | null;
  basePriceCents: number;
  isActive: boolean;
  isSoldOut: boolean;
  totalOrdered: number;
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const rl = await checkRateLimit({ limiter: adminLimiter, identifier: auth.userId, role: "admin", route: "admin/sections/most-popular/suggest" });
    if (rl.limited) return rl.response;

    // Get order items with their menu items, excluding null menu_item_id
    const { data: orderItems, error } = await auth.supabase
      .from("order_items")
      .select(
        `
        menu_item_id,
        quantity,
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
      .not("menu_item_id", "is", null)
      .returns<OrderItemWithMenuItem[]>();

    if (error) {
      logger.exception(error, { api: "admin/sections/most-popular/suggest", flowId: "fetch" });
      return NextResponse.json({ error: "Failed to fetch order data" }, { status: 500 });
    }

    // Aggregate by item_id
    const itemCounts = new Map<
      string,
      { count: number; item: OrderItemWithMenuItem["menu_items"] }
    >();

    for (const orderItem of orderItems) {
      if (!orderItem.menu_item_id || !orderItem.menu_items) continue;

      const existing = itemCounts.get(orderItem.menu_item_id);
      if (existing) {
        existing.count += orderItem.quantity;
      } else {
        itemCounts.set(orderItem.menu_item_id, {
          count: orderItem.quantity,
          item: orderItem.menu_items,
        });
      }
    }

    // Sort by count and take top 20
    const sortedItems = Array.from(itemCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20);

    const popularItems: PopularItem[] = sortedItems
      .filter(([, data]) => data.item !== null)
      .map(([, data]) => ({
        id: data.item!.id,
        nameEn: data.item!.name_en,
        nameMy: data.item!.name_my,
        descriptionEn: data.item!.description_en,
        imageUrl: data.item!.image_url,
        basePriceCents: data.item!.base_price_cents,
        isActive: data.item!.is_active,
        isSoldOut: data.item!.is_sold_out,
        totalOrdered: data.count,
      }));

    return NextResponse.json({
      items: popularItems,
      suggestedAt: new Date().toISOString(),
      totalOrderItems: orderItems.length,
    });
  } catch (error) {
    logger.exception(error, { api: "admin/sections/most-popular/suggest", flowId: "fetch" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
