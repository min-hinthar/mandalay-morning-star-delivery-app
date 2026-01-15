/**
 * Test data factories for creating mock objects
 */

import type {
  MenuItemsRow,
  ModifierOptionsRow,
  AddressesRow,
  OrdersRow,
} from "@/types/database";

/**
 * Create a mock menu item
 */
export function createMockMenuItem(
  overrides?: Partial<MenuItemsRow>
): MenuItemsRow {
  return {
    id: "menu-item-uuid",
    category_id: "category-uuid",
    slug: "test-item",
    name_en: "Test Menu Item",
    name_my: null,
    description_en: "A delicious test item",
    base_price_cents: 1500,
    image_url: null,
    is_active: true,
    is_sold_out: false,
    allergens: [],
    tags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock modifier option
 */
export function createMockModifierOption(
  overrides?: Partial<ModifierOptionsRow>
): ModifierOptionsRow {
  return {
    id: "modifier-option-uuid",
    group_id: "modifier-group-uuid",
    slug: "extra-spicy",
    name: "Extra Spicy",
    price_delta_cents: 100,
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock address
 */
export function createMockAddress(
  overrides?: Partial<AddressesRow>
): AddressesRow {
  return {
    id: "address-uuid",
    user_id: "user-uuid",
    label: "Home",
    line_1: "123 Main Street",
    line_2: null,
    city: "Los Angeles",
    state: "CA",
    postal_code: "90001",
    formatted_address: "123 Main Street, Los Angeles, CA 90001",
    lat: 34.0522,
    lng: -118.2437,
    is_default: true,
    is_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock order
 */
export function createMockOrder(overrides?: Partial<OrdersRow>): OrdersRow {
  return {
    id: "order-uuid",
    user_id: "user-uuid",
    address_id: "address-uuid",
    status: "pending",
    subtotal_cents: 3000,
    delivery_fee_cents: 1500,
    tax_cents: 0,
    total_cents: 4500,
    delivery_window_start: "2026-01-18T11:00:00-08:00",
    delivery_window_end: "2026-01-18T12:00:00-08:00",
    special_instructions: null,
    stripe_payment_intent_id: null,
    placed_at: new Date().toISOString(),
    confirmed_at: null,
    delivered_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a validated cart item (for order.ts tests)
 */
export function createValidatedCartItem(
  menuItem?: Partial<MenuItemsRow>,
  modifiers: Partial<ModifierOptionsRow>[] = [],
  quantity = 1
) {
  const item = createMockMenuItem(menuItem);
  const mods = modifiers.map((m, i) =>
    createMockModifierOption({ id: `mod-${i}`, ...m })
  );

  const modifierTotal = mods.reduce((sum, m) => sum + m.price_delta_cents, 0);
  const lineTotalCents = (item.base_price_cents + modifierTotal) * quantity;

  return {
    menuItem: item,
    modifiers: mods,
    quantity,
    notes: "",
    lineTotalCents,
  };
}

/**
 * Create checkout item input (for validateCartItems tests)
 */
export function createCheckoutItemInput(
  menuItemId: string,
  quantity = 1,
  modifiers: Array<{ optionId: string }> = []
) {
  return {
    menuItemId,
    quantity,
    modifiers,
    notes: "",
  };
}
