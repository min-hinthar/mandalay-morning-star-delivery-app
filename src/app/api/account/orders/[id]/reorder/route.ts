import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, apiWriteLimiter } from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface OrderItemRow {
  id: string;
  menu_item_id: string | null;
  name_snapshot: string;
  base_price_snapshot: number;
  quantity: number;
  line_total_cents: number;
  special_instructions: string | null;
}

interface ModifierRow {
  id: string;
  order_item_id: string;
  modifier_option_id: string | null;
  name_snapshot: string;
  price_delta_snapshot: number;
}

interface MenuItemRow {
  id: string;
  slug: string;
  name_en: string;
  base_price_cents: number;
  is_active: boolean;
  is_sold_out: boolean;
}

interface CartItem {
  menuItemId: string;
  slug: string;
  name: string;
  quantity: number;
  priceCents: number;
  modifiers: Array<{
    optionId: string | null;
    name: string;
    priceDeltaCents: number;
  }>;
  specialInstructions: string | null;
}

interface Warning {
  menuItemId: string | null;
  itemName: string;
  type: "unavailable" | "sold_out" | "price_changed";
  message: string;
  oldPrice?: number;
  newPrice?: number;
}

// POST /api/account/orders/[id]/reorder - Get cart items from previous order
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id: orderId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Rate limit
    const rl = await checkRateLimit({
      limiter: apiWriteLimiter,
      identifier: user.id,
      role: "customer",
      route: "orders/reorder",
    });
    if (rl.limited) return rl.response;

    // Verify order exists and belongs to user
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Order not found" } },
        { status: 404 }
      );
    }

    if (order.user_id !== user.id) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "This order does not belong to you" } },
        { status: 403 }
      );
    }

    // Fetch order items
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select(
        "id, menu_item_id, name_snapshot, base_price_snapshot, quantity, line_total_cents, special_instructions"
      )
      .eq("order_id", orderId)
      .returns<OrderItemRow[]>();

    if (itemsError) throw itemsError;

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json(
        { error: { code: "EMPTY_ORDER", message: "Order has no items" } },
        { status: 400 }
      );
    }

    // Fetch modifiers for all items
    const orderItemIds = orderItems.map((item) => item.id);
    const { data: modifiers, error: modifiersError } = await supabase
      .from("order_item_modifiers")
      .select("id, order_item_id, modifier_option_id, name_snapshot, price_delta_snapshot")
      .in("order_item_id", orderItemIds)
      .returns<ModifierRow[]>();

    if (modifiersError) throw modifiersError;

    // Get current menu items for availability/price check
    const menuItemIds = orderItems
      .map((item) => item.menu_item_id)
      .filter((id): id is string => id !== null);

    const { data: menuItems, error: menuError } = await supabase
      .from("menu_items")
      .select("id, slug, name_en, base_price_cents, is_active, is_sold_out")
      .in("id", menuItemIds)
      .returns<MenuItemRow[]>();

    if (menuError) throw menuError;

    // Build menu items lookup
    const menuItemsMap = new Map((menuItems || []).map((item) => [item.id, item]));

    // Build modifiers lookup by order_item_id
    const modifiersByItem = new Map<string, ModifierRow[]>();
    for (const mod of modifiers || []) {
      const existing = modifiersByItem.get(mod.order_item_id) || [];
      existing.push(mod);
      modifiersByItem.set(mod.order_item_id, existing);
    }

    // Process order items
    const cartItems: CartItem[] = [];
    const warnings: Warning[] = [];

    for (const orderItem of orderItems) {
      const menuItem = orderItem.menu_item_id ? menuItemsMap.get(orderItem.menu_item_id) : null;

      // Check availability
      if (!menuItem || !menuItem.is_active) {
        warnings.push({
          menuItemId: orderItem.menu_item_id,
          itemName: orderItem.name_snapshot,
          type: "unavailable",
          message: `"${orderItem.name_snapshot}" is no longer available`,
        });
        continue;
      }

      if (menuItem.is_sold_out) {
        warnings.push({
          menuItemId: orderItem.menu_item_id,
          itemName: orderItem.name_snapshot,
          type: "sold_out",
          message: `"${orderItem.name_snapshot}" is currently sold out`,
        });
        continue;
      }

      // Check price change
      if (menuItem.base_price_cents !== orderItem.base_price_snapshot) {
        warnings.push({
          menuItemId: orderItem.menu_item_id,
          itemName: orderItem.name_snapshot,
          type: "price_changed",
          message: `Price of "${orderItem.name_snapshot}" has changed`,
          oldPrice: orderItem.base_price_snapshot,
          newPrice: menuItem.base_price_cents,
        });
      }

      // Get modifiers for this item
      const itemModifiers = modifiersByItem.get(orderItem.id) || [];

      cartItems.push({
        menuItemId: menuItem.id,
        slug: menuItem.slug,
        name: menuItem.name_en,
        quantity: orderItem.quantity,
        priceCents: menuItem.base_price_cents,
        modifiers: itemModifiers.map((mod) => ({
          optionId: mod.modifier_option_id,
          name: mod.name_snapshot,
          priceDeltaCents: mod.price_delta_snapshot,
        })),
        specialInstructions: orderItem.special_instructions,
      });
    }

    return NextResponse.json({
      data: {
        cartItems,
        warnings,
        originalOrderId: orderId,
      },
    });
  } catch (error) {
    logger.exception(error, { api: "account/orders/[id]/reorder" });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to process reorder" } },
      { status: 500 }
    );
  }
}
