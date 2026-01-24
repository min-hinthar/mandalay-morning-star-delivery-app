import type { CheckoutItemInput } from "@/lib/validations/checkout";
import type { MenuItemsRow, ModifierOptionsRow } from "@/types/database";

export const DELIVERY_FEE_CENTS = 1500;
export const FREE_DELIVERY_THRESHOLD_CENTS = 10000;

export interface ValidatedCartItem {
  menuItem: MenuItemsRow;
  modifiers: ModifierOptionsRow[];
  quantity: number;
  notes: string;
  lineTotalCents: number;
}

export interface OrderCalculation {
  items: ValidatedCartItem[];
  subtotalCents: number;
  deliveryFeeCents: number;
  taxCents: number;
  totalCents: number;
}

/**
 * Calculate the line total for a single cart item (server-side)
 */
export function calculateLineTotal(
  basePriceCents: number,
  modifiers: ModifierOptionsRow[],
  quantity: number
): number {
  const modifierTotal = modifiers.reduce(
    (sum, mod) => sum + mod.price_delta_cents,
    0
  );
  return (basePriceCents + modifierTotal) * quantity;
}

/**
 * Calculate delivery fee based on subtotal
 */
export function calculateDeliveryFee(subtotalCents: number): number {
  return subtotalCents >= FREE_DELIVERY_THRESHOLD_CENTS ? 0 : DELIVERY_FEE_CENTS;
}

/**
 * Calculate tax (placeholder for V1 - can be enhanced with Stripe Tax later)
 * @param subtotalCents - Subtotal in cents (will be used when tax calculation is implemented)
 */
export function calculateTax(_subtotalCents: number): number {
  // V1: No tax calculation, defer to V1.1
  // When implementing, use California sales tax rate or Stripe Tax
  return 0;
}

/**
 * Calculate full order totals
 */
export function calculateOrderTotals(
  validatedItems: ValidatedCartItem[]
): Pick<OrderCalculation, "subtotalCents" | "deliveryFeeCents" | "taxCents" | "totalCents"> {
  const subtotalCents = validatedItems.reduce(
    (sum, item) => sum + item.lineTotalCents,
    0
  );

  const deliveryFeeCents = calculateDeliveryFee(subtotalCents);
  const taxCents = calculateTax(subtotalCents);
  const totalCents = subtotalCents + deliveryFeeCents + taxCents;

  return {
    subtotalCents,
    deliveryFeeCents,
    taxCents,
    totalCents,
  };
}

/**
 * Create Stripe line items from validated cart items
 */
export function createStripeLineItems(
  validatedItems: ValidatedCartItem[],
  deliveryFeeCents: number
): Array<{
  price_data: {
    currency: string;
    unit_amount: number;
    product_data: {
      name: string;
      description?: string;
    };
  };
  quantity: number;
}> {
  const lineItems = validatedItems.map((item) => {
    const modifierNames = item.modifiers.map((m) => m.name).join(", ");
    const modifierTotal = item.modifiers.reduce((sum, m) => sum + m.price_delta_cents, 0);
    const unitAmount = item.menuItem.base_price_cents + modifierTotal;

    return {
      price_data: {
        currency: "usd",
        unit_amount: unitAmount,
        product_data: {
          name: item.menuItem.name_en,
          description: modifierNames || undefined,
        },
      },
      quantity: item.quantity,
    };
  });

  // Add delivery fee if applicable
  if (deliveryFeeCents > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        unit_amount: deliveryFeeCents,
        product_data: {
          name: "Delivery Fee",
          description: "Saturday delivery to your address",
        },
      },
      quantity: 1,
    });
  }

  return lineItems;
}

/**
 * Validate cart items against database and return validated items with prices
 */
export async function validateCartItems(
  inputItems: CheckoutItemInput[],
  menuItems: Map<string, MenuItemsRow>,
  modifierOptions: Map<string, ModifierOptionsRow>
): Promise<{
  valid: boolean;
  items: ValidatedCartItem[];
  errors: Array<{ code: string; message: string; itemIndex?: number }>;
}> {
  const validatedItems: ValidatedCartItem[] = [];
  const errors: Array<{ code: string; message: string; itemIndex?: number }> = [];

  for (let i = 0; i < inputItems.length; i++) {
    const input = inputItems[i];
    const menuItem = menuItems.get(input.menuItemId);

    if (!menuItem) {
      errors.push({
        code: "ITEM_UNAVAILABLE",
        message: `Menu item not found`,
        itemIndex: i,
      });
      continue;
    }

    if (!menuItem.is_active) {
      errors.push({
        code: "ITEM_UNAVAILABLE",
        message: `${menuItem.name_en} is no longer available`,
        itemIndex: i,
      });
      continue;
    }

    if (menuItem.is_sold_out) {
      errors.push({
        code: "ITEM_SOLD_OUT",
        message: `${menuItem.name_en} is sold out`,
        itemIndex: i,
      });
      continue;
    }

    // Validate modifiers
    const validModifiers: ModifierOptionsRow[] = [];
    for (const mod of input.modifiers) {
      const option = modifierOptions.get(mod.optionId);
      if (!option) {
        errors.push({
          code: "MODIFIER_UNAVAILABLE",
          message: `Modifier option not found`,
          itemIndex: i,
        });
        continue;
      }
      if (!option.is_active) {
        errors.push({
          code: "MODIFIER_UNAVAILABLE",
          message: `Modifier "${option.name}" is no longer available`,
          itemIndex: i,
        });
        continue;
      }
      validModifiers.push(option);
    }

    const lineTotalCents = calculateLineTotal(
      menuItem.base_price_cents,
      validModifiers,
      input.quantity
    );

    validatedItems.push({
      menuItem,
      modifiers: validModifiers,
      quantity: input.quantity,
      notes: input.notes ?? "",
      lineTotalCents,
    });
  }

  return {
    valid: errors.length === 0,
    items: validatedItems,
    errors,
  };
}
