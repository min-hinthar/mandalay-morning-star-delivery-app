import type { CheckoutItemInput } from "@/lib/validations/checkout";
import type { MenuItemsRow, ModifierGroupsRow, ModifierOptionsRow } from "@/types/database";

/** BUG-02: Modifier group data for constraint validation */
export interface ModifierGroupWithItems {
  group: ModifierGroupsRow;
  itemIds: string[];
}

/** Covina CA sales tax rate (10.5%) */
export const COVINA_TAX_RATE = 0.105;

/** Default fee values — match DB seeds and BUSINESS_RULES_DEFAULTS */
const DEFAULT_DELIVERY_FEE_CENTS = 1500;
const DEFAULT_FREE_DELIVERY_THRESHOLD_CENTS = 10000;

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
  tipCents: number;
  discountCents: number;
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
  const modifierTotal = modifiers.reduce((sum, mod) => sum + mod.price_delta_cents, 0);
  return (basePriceCents + modifierTotal) * quantity;
}

/** Default long-distance fee values */
const DEFAULT_LONG_DISTANCE_FEE_CENTS = 2000;
const DEFAULT_LONG_DISTANCE_THRESHOLD_MILES = 25;

export interface DeliveryFeeOptions {
  deliveryFeeCents?: number;
  freeDeliveryThresholdCents?: number;
  longDistanceFeeCents?: number;
  longDistanceThresholdMiles?: number;
}

/**
 * Calculate delivery fee based on subtotal and distance.
 * - If distanceMiles > threshold: flat long-distance fee (no free delivery)
 * - Otherwise: free if subtotal >= threshold, standard fee otherwise
 */
export function calculateDeliveryFee(
  subtotalCents: number,
  deliveryFeeCentsOrOpts: number | DeliveryFeeOptions = DEFAULT_DELIVERY_FEE_CENTS,
  freeDeliveryThresholdCents: number = DEFAULT_FREE_DELIVERY_THRESHOLD_CENTS,
  distanceMiles?: number | null
): number {
  // Support both old signature and new options object
  let feeCents = DEFAULT_DELIVERY_FEE_CENTS;
  let freeThreshold = freeDeliveryThresholdCents;
  let longDistanceFee = DEFAULT_LONG_DISTANCE_FEE_CENTS;
  let longDistanceThreshold = DEFAULT_LONG_DISTANCE_THRESHOLD_MILES;
  const distance = distanceMiles;

  if (typeof deliveryFeeCentsOrOpts === "object") {
    feeCents = deliveryFeeCentsOrOpts.deliveryFeeCents ?? DEFAULT_DELIVERY_FEE_CENTS;
    freeThreshold =
      deliveryFeeCentsOrOpts.freeDeliveryThresholdCents ?? DEFAULT_FREE_DELIVERY_THRESHOLD_CENTS;
    longDistanceFee =
      deliveryFeeCentsOrOpts.longDistanceFeeCents ?? DEFAULT_LONG_DISTANCE_FEE_CENTS;
    longDistanceThreshold =
      deliveryFeeCentsOrOpts.longDistanceThresholdMiles ?? DEFAULT_LONG_DISTANCE_THRESHOLD_MILES;
  } else {
    feeCents = deliveryFeeCentsOrOpts;
  }

  // Long-distance: flat fee, no free delivery
  if (distance != null && distance > longDistanceThreshold) {
    return longDistanceFee;
  }

  // Standard: free if subtotal >= threshold
  return subtotalCents >= freeThreshold ? 0 : feeCents;
}

/**
 * Calculate sales tax for Covina CA (10.5%)
 */
export function calculateTax(subtotalCents: number): number {
  return Math.round(subtotalCents * COVINA_TAX_RATE);
}

export interface OrderTotalsOptions {
  deliveryFeeCents?: number;
  freeDeliveryThresholdCents?: number;
  tipCents?: number;
  discountCents?: number;
  distanceMiles?: number | null;
  longDistanceFeeCents?: number;
  longDistanceThresholdMiles?: number;
}

/**
 * Calculate full order totals
 * totalCents = subtotal + delivery + tax + tip - discount (min 0)
 */
export function calculateOrderTotals(
  validatedItems: ValidatedCartItem[],
  deliveryFeeCentsOrOpts: number | OrderTotalsOptions = DEFAULT_DELIVERY_FEE_CENTS,
  freeDeliveryThresholdCents: number = DEFAULT_FREE_DELIVERY_THRESHOLD_CENTS,
  tipCents: number = 0,
  discountCents: number = 0
): Pick<
  OrderCalculation,
  "subtotalCents" | "deliveryFeeCents" | "taxCents" | "tipCents" | "discountCents" | "totalCents"
> {
  const subtotalCents = validatedItems.reduce((sum, item) => sum + item.lineTotalCents, 0);

  let deliveryFeeCents: number;
  let tip = tipCents;
  let discount = discountCents;

  if (typeof deliveryFeeCentsOrOpts === "object") {
    const opts = deliveryFeeCentsOrOpts;
    tip = opts.tipCents ?? 0;
    discount = opts.discountCents ?? 0;
    deliveryFeeCents = calculateDeliveryFee(
      subtotalCents,
      {
        deliveryFeeCents: opts.deliveryFeeCents,
        freeDeliveryThresholdCents: opts.freeDeliveryThresholdCents,
        longDistanceFeeCents: opts.longDistanceFeeCents,
        longDistanceThresholdMiles: opts.longDistanceThresholdMiles,
      },
      DEFAULT_FREE_DELIVERY_THRESHOLD_CENTS,
      opts.distanceMiles
    );
  } else {
    deliveryFeeCents = calculateDeliveryFee(
      subtotalCents,
      deliveryFeeCentsOrOpts,
      freeDeliveryThresholdCents
    );
  }

  const taxCents = calculateTax(subtotalCents);
  const totalCents = Math.max(0, subtotalCents + deliveryFeeCents + taxCents + tip - discount);

  return {
    subtotalCents,
    deliveryFeeCents,
    taxCents,
    tipCents: tip,
    discountCents: discount,
    totalCents,
  };
}

/**
 * Create Stripe line items from validated cart items.
 * Note: Discounts are applied via Stripe's `discounts` param on the session, not as line items.
 */
export function createStripeLineItems(
  validatedItems: ValidatedCartItem[],
  deliveryFeeCents: number,
  tipCents: number = 0,
  taxCents: number = 0,
  isExtendedRange: boolean = false
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
          name: isExtendedRange ? "Extended Delivery Fee" : "Delivery Fee",
          description: isExtendedRange
            ? "Extended range delivery (>25 mi)"
            : "Delivery to your address",
        },
      },
      quantity: 1,
    });
  }

  // Add tax as a line item
  if (taxCents > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        unit_amount: taxCents,
        product_data: {
          name: "Sales Tax",
          description: "CA sales tax (10.5%)",
        },
      },
      quantity: 1,
    });
  }

  // Add tip as a line item if present
  if (tipCents > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        unit_amount: tipCents,
        product_data: {
          name: "Tip",
          description: "Thank you for your generosity",
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
  modifierOptions: Map<string, ModifierOptionsRow>,
  modifierGroups?: Map<string, ModifierGroupWithItems>
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

    // BUG-02 FIX: Validate modifier group min_select/max_select constraints
    if (modifierGroups) {
      for (const [groupId, { group, itemIds }] of modifierGroups) {
        if (!itemIds.includes(input.menuItemId)) continue;

        // Count how many selected modifiers belong to this group
        const selectedInGroup = validModifiers.filter((mod) => mod.group_id === groupId);
        const count = selectedInGroup.length;

        if (count < group.min_select) {
          errors.push({
            code: "MODIFIER_GROUP_CONSTRAINT",
            message: `"${group.name}" requires at least ${group.min_select} selection(s), got ${count}`,
            itemIndex: i,
          });
        }

        if (group.max_select > 0 && count > group.max_select) {
          errors.push({
            code: "MODIFIER_GROUP_CONSTRAINT",
            message: `"${group.name}" allows at most ${group.max_select} selection(s), got ${count}`,
            itemIndex: i,
          });
        }
      }
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
