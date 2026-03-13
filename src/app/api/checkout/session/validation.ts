import { NextResponse } from "next/server";
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
