import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import { resolveMinimumOrder, type DeliveryTier } from "@/lib/utils/order";
import type { BusinessRules } from "@/lib/settings/business-rules";
import type { createClient } from "@/lib/supabase/server";
import type { CheckoutError, CheckoutErrorCode } from "@/types/checkout";
import type { MenuItemsRow, ModifierOptionsRow } from "@/types/database";
import type { ValidatedCartItem } from "@/lib/utils/order";
import { validateCartItems } from "@/lib/utils/order";
import { buildModifierGroupsMap } from "./helpers";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export function errorResponse(
  code: CheckoutErrorCode,
  message: string,
  status: number,
  details?: unknown
) {
  const error: CheckoutError = { code, message, details };
  return NextResponse.json({ error }, { status });
}

/**
 * Map a create_order_with_items RPC failure to a response. The unique index
 * on open auto-discounted pendings (the D6 DB belt,
 * idx_orders_unique_open_auto_discount) makes the LOSING tab of a parallel
 * double-submit fail with 23505 — expected contention, not an error: warn +
 * friendly 409, no Sentry. Everything else is a real 500.
 */
export function orderCreateErrorResponse(
  rpcError: { code?: string } | null,
  userId: string
): NextResponse {
  if (rpcError?.code === "23505") {
    logger.warn("Concurrent discounted checkout blocked by unique index", {
      userId,
      api: "checkout-session",
      flowId: "checkout",
    });
    return errorResponse(
      "CONFLICT",
      "You have another checkout in progress. Please complete or cancel it, then try again.",
      409
    );
  }
  logger.exception(rpcError, { userId, api: "checkout-session", flowId: "checkout" });
  return errorResponse("INTERNAL_ERROR", "Failed to create order", 500);
}

interface CartItemInput {
  menuItemId: string;
  quantity: number;
  modifiers: Array<{ optionId: string }>;
  notes?: string;
}

/**
 * Fetch menu items, modifier options, and modifier groups from DB,
 * then validate cart items against them (including BUG-02 constraint checks).
 */
export async function fetchAndValidateCart(supabase: SupabaseClient, items: CartItemInput[]) {
  const menuItemIds = items.map((item) => item.menuItemId);
  const modifierOptionIds = items.flatMap((item) => item.modifiers.map((m) => m.optionId));

  const { data: menuItemsData, error: menuError } = await supabase
    .from("menu_items")
    .select("*")
    .in("id", menuItemIds)
    .returns<MenuItemsRow[]>();

  if (menuError) {
    return {
      ok: false as const,
      response: errorResponse("INTERNAL_ERROR", "Failed to fetch menu items", 500),
    };
  }

  const { data: modifierOptionsData, error: modifierError } = await supabase
    .from("modifier_options")
    .select("*")
    .in(
      "id",
      modifierOptionIds.length > 0 ? modifierOptionIds : ["00000000-0000-0000-0000-000000000000"]
    )
    .returns<ModifierOptionsRow[]>();

  if (modifierError) {
    return {
      ok: false as const,
      response: errorResponse("INTERNAL_ERROR", "Failed to fetch modifier options", 500),
    };
  }

  const menuItems = new Map<string, MenuItemsRow>(
    (menuItemsData ?? []).map((item) => [item.id, item])
  );
  const modifierOptions = new Map<string, ModifierOptionsRow>(
    (modifierOptionsData ?? []).map((option) => [option.id, option])
  );

  // BUG-02: Fetch modifier groups for constraint validation
  const { data: itemModifierGroupsData } = await supabase
    .from("item_modifier_groups")
    .select(
      "item_id, group_id, modifier_groups(id, slug, name, selection_type, min_select, max_select)"
    )
    .in("item_id", menuItemIds);

  const modifierGroupsMap = buildModifierGroupsMap(itemModifierGroupsData);

  const validation = await validateCartItems(
    items,
    menuItems,
    modifierOptions,
    modifierGroupsMap.size > 0 ? modifierGroupsMap : undefined
  );

  if (!validation.valid) {
    const firstError = validation.errors[0];
    return {
      ok: false as const,
      response: errorResponse(
        firstError.code as CheckoutErrorCode,
        firstError.message,
        400,
        validation.errors
      ),
    };
  }

  return { ok: true as const, items: validation.items };
}

/**
 * Re-check item availability right before Stripe session creation.
 * Returns unavailable item IDs/names if any are deactivated.
 */
export async function revalidateItemAvailability(
  supabase: SupabaseClient,
  menuItemIds: string[],
  validatedItems: ValidatedCartItem[]
) {
  const { data: freshMenuItems, error } = await supabase
    .from("menu_items")
    .select("id, is_active")
    .in("id", menuItemIds);

  if (error) {
    return { ok: false as const, error: "Failed to re-validate menu items" };
  }

  const unavailable = (freshMenuItems ?? []).filter((item) => !item.is_active);
  if (unavailable.length > 0) {
    const unavailableIds = unavailable.map((i) => i.id);
    const unavailableNames = validatedItems
      .filter((vi) => unavailableIds.includes(vi.menuItem.id))
      .map((vi) => vi.menuItem.name_en);
    return { ok: false as const, unavailableIds, unavailableNames };
  }

  return { ok: true as const };
}

export function buildRpcPayload(items: ValidatedCartItem[]) {
  const rpcItems = items.map((item) => ({
    menu_item_id: item.menuItem.id,
    name_snapshot: item.menuItem.name_en,
    name_my_snapshot: item.menuItem.name_my || null,
    base_price_snapshot: item.menuItem.base_price_cents,
    quantity: item.quantity,
    line_total_cents: item.lineTotalCents,
    special_instructions: item.notes || null,
  }));

  const rpcModifiers: Array<{
    item_index: number;
    modifier_option_id: string;
    name_snapshot: string;
    price_delta_snapshot: number;
  }> = [];

  for (let i = 0; i < items.length; i++) {
    for (const modifier of items[i].modifiers) {
      rpcModifiers.push({
        item_index: i,
        modifier_option_id: modifier.id,
        name_snapshot: modifier.name,
        price_delta_snapshot: modifier.price_delta_cents,
      });
    }
  }

  return { rpcItems, rpcModifiers };
}

/**
 * Distance-based minimum-order gate. Returns an error response to return
 * immediately, or null when the order clears the floor.
 *
 * A long-haul run costs the same to drive whatever the basket is worth, so
 * beyond the local radius the order must clear a higher floor (incident: a
 * 38.8mi delivery for a $27 subtotal — ~78mi round trip). Keyed off the resolved
 * fee TIER so this boundary can never drift from the pricing boundary, and
 * measured on the PRE-discount subtotal — the same number that selected the tier.
 *
 * This is also the FIRST server-side minimum-order check in the app: the
 * existing $25 minimum was enforced only in the cart UI, so it could be bypassed
 * by posting directly to the checkout endpoint.
 */
export function enforceMinimumOrder(
  subtotalCents: number,
  tier: DeliveryTier,
  rules: Pick<
    BusinessRules,
    "minimumOrderCents" | "extendedMinOrderCents" | "longDistanceThresholdMiles"
  >
) {
  const minimum = resolveMinimumOrder(subtotalCents, tier, {
    baseMinimumCents: rules.minimumOrderCents,
    extendedMinimumCents: rules.extendedMinOrderCents,
  });
  if (minimum.meetsMinimum) return null;

  const need = `$${(minimum.minimumCents / 100).toFixed(2)}`;
  const add = `$${(minimum.shortfallCents / 100).toFixed(2)}`;
  return errorResponse(
    "MINIMUM_ORDER_NOT_MET",
    minimum.isExtendedMinimum
      ? `Deliveries beyond ${rules.longDistanceThresholdMiles} miles require a ${need} minimum. Please add ${add} more to your order.`
      : `Orders require a ${need} minimum. Please add ${add} more to your order.`,
    400,
    {
      minimumCents: minimum.minimumCents,
      shortfallCents: minimum.shortfallCents,
      subtotalCents,
      isExtendedMinimum: minimum.isExtendedMinimum,
    }
  );
}
