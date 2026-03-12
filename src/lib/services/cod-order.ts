import type { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import { logger } from "@/lib/utils/logger";
import { toISOWithTimezone } from "@/lib/utils/delivery-timezone";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export interface CODOrderInput {
  userId: string;
  addressId: string;
  scheduledDate: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  subtotalCents: number;
  deliveryFeeCents: number;
  taxCents: number;
  totalCents: number;
  tipCents: number;
  promoCode: string | null;
  discountCents: number;
  customerNotes: string | null;
  deliveryInstructions: string | null;
  customerPhone: string;
  customerName: string;
  rpcItems: unknown[];
  rpcModifiers: unknown[];
  distanceMiles?: number | null;
}

export interface CODOrderResult {
  success: true;
  orderId: string;
}

export interface CODOrderError {
  success: false;
  code: string;
  message: string;
}

/**
 * Create a Cash on Delivery order.
 * - Inserts via create_order_with_items RPC with payment_method='cod'
 * - Status set to 'pending_approval' by RPC logic
 * - No Stripe session created
 */
export async function createCODOrder(
  supabase: SupabaseClient,
  input: CODOrderInput
): Promise<CODOrderResult | CODOrderError> {
  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc("create_order_with_items", {
      p_order: {
        user_id: input.userId,
        address_id: input.addressId,
        payment_method: "cod",
        subtotal_cents: input.subtotalCents,
        delivery_fee_cents: input.deliveryFeeCents,
        tax_cents: input.taxCents,
        tip_cents: input.tipCents,
        promo_code: input.promoCode,
        discount_cents: input.discountCents,
        total_cents: input.totalCents,
        delivery_window_start: toISOWithTimezone(input.scheduledDate, input.timeWindowStart),
        delivery_window_end: toISOWithTimezone(input.scheduledDate, input.timeWindowEnd),
        special_instructions: input.customerNotes,
        delivery_instructions: input.deliveryInstructions,
        customer_phone: input.customerPhone,
        customer_name: input.customerName,
        distance_miles: input.distanceMiles ?? null,
      },
      p_items: input.rpcItems as Json,
      p_modifiers: (input.rpcModifiers.length > 0 ? input.rpcModifiers : []) as Json,
    });

    if (rpcError || !rpcResult) {
      logger.exception(rpcError, {
        api: "cod-order",
        flowId: "checkout",
        userId: input.userId,
      });
      return { success: false, code: "INTERNAL_ERROR", message: "Failed to create COD order" };
    }

    const rpcData = rpcResult as Record<string, unknown> | null;
    const orderId = typeof rpcData?.order_id === "string" ? rpcData.order_id : null;

    if (!orderId) {
      logger.exception(new Error("COD RPC returned unexpected shape"), {
        api: "cod-order",
        flowId: "checkout",
        userId: input.userId,
        rpcResult: JSON.stringify(rpcResult),
      });
      return { success: false, code: "INTERNAL_ERROR", message: "Failed to create COD order" };
    }

    logger.info("COD order created", {
      orderId,
      userId: input.userId,
      totalCents: input.totalCents,
      paymentMethod: "cod",
    });

    return { success: true, orderId };
  } catch (error) {
    logger.exception(error, {
      api: "cod-order",
      flowId: "checkout",
      userId: input.userId,
    });
    return { success: false, code: "INTERNAL_ERROR", message: "Failed to create COD order" };
  }
}
