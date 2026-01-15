// supabase/functions/send-order-confirmation/index.ts
// Supabase Edge Function for sending order confirmation emails
// Uses Resend for email delivery

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "orders@mandalaymorningstar.com";
const APP_URL = Deno.env.get("APP_URL") || "https://mandalaymorningstar.com";

interface OrderItem {
  name_snapshot: string;
  quantity: number;
  line_total_cents: number;
  order_item_modifiers: Array<{
    name_snapshot: string;
    price_delta_snapshot: number;
  }>;
}

interface Order {
  id: string;
  status: string;
  subtotal_cents: number;
  delivery_fee_cents: number;
  tax_cents: number;
  total_cents: number;
  delivery_window_start: string | null;
  delivery_window_end: string | null;
  special_instructions: string | null;
  placed_at: string;
  confirmed_at: string | null;
  profiles: {
    full_name: string | null;
    email: string;
  };
  addresses: {
    line_1: string;
    line_2: string | null;
    city: string;
    state: string;
    postal_code: string;
  } | null;
  order_items: OrderItem[];
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function generateOrderItemsHtml(items: OrderItem[]): string {
  return items
    .map((item) => {
      const modifiers =
        item.order_item_modifiers.length > 0
          ? `<span style="color: #666; font-size: 14px;"> (${item.order_item_modifiers
              .map((m) => m.name_snapshot)
              .join(", ")})</span>`
          : "";

      return `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
            <strong>${item.quantity}x</strong> ${item.name_snapshot}${modifiers}
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">
            ${formatPrice(item.line_total_cents)}
          </td>
        </tr>
      `;
    })
    .join("");
}

function generateEmailHtml(order: Order): string {
  const customerName = order.profiles?.full_name || "Valued Customer";
  const deliveryDate = order.delivery_window_start
    ? formatDate(order.delivery_window_start)
    : "Saturday";
  const deliveryTime =
    order.delivery_window_start && order.delivery_window_end
      ? `${formatTime(order.delivery_window_start)} - ${formatTime(order.delivery_window_end)}`
      : "Scheduled window";

  const addressHtml = order.addresses
    ? `
      <p style="margin: 0; color: #333;">
        ${order.addresses.line_1}<br/>
        ${order.addresses.line_2 ? `${order.addresses.line_2}<br/>` : ""}
        ${order.addresses.city}, ${order.addresses.state} ${order.addresses.postal_code}
      </p>
    `
    : "<p style='color: #666;'>Address on file</p>";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #D4A017 0%, #8B4513 100%); border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-family: 'Playfair Display', Georgia, serif;">
      Mandalay Morning Star
    </h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">
      Authentic Burmese Cuisine
    </p>
  </div>

  <!-- Content -->
  <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none;">

    <!-- Greeting -->
    <p style="font-size: 18px; margin-top: 0;">
      Hello ${customerName},
    </p>

    <p>
      Thank you for your order! We're excited to prepare your delicious Burmese meal.
    </p>

    <!-- Order Status Badge -->
    <div style="background: #2E8B57; color: white; display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; margin: 16px 0;">
      ✓ Order Confirmed
    </div>

    <!-- Order Details -->
    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #666; text-transform: uppercase; letter-spacing: 1px;">
        Order Details
      </h2>
      <p style="margin: 0 0 8px 0;">
        <strong>Order #:</strong> ${order.id.slice(0, 8).toUpperCase()}
      </p>
      <p style="margin: 0 0 8px 0;">
        <strong>Placed:</strong> ${formatDate(order.placed_at)}
      </p>
    </div>

    <!-- Delivery Info -->
    <div style="display: flex; gap: 20px; margin: 20px 0;">
      <div style="flex: 1; background: #FFF9E6; padding: 16px; border-radius: 8px; border-left: 4px solid #D4A017;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #8B4513;">
          📅 Delivery Date
        </h3>
        <p style="margin: 0; font-weight: 600;">${deliveryDate}</p>
        <p style="margin: 4px 0 0 0; color: #666;">${deliveryTime}</p>
      </div>
    </div>

    <!-- Delivery Address -->
    <div style="background: #f0f8f0; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2E8B57;">
      <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #2E8B57;">
        📍 Delivery Address
      </h3>
      ${addressHtml}
    </div>

    <!-- Order Items -->
    <h2 style="margin: 30px 0 16px 0; font-size: 16px; color: #666; text-transform: uppercase; letter-spacing: 1px;">
      Your Items
    </h2>
    <table style="width: 100%; border-collapse: collapse;">
      ${generateOrderItemsHtml(order.order_items)}
    </table>

    <!-- Special Instructions -->
    ${
      order.special_instructions
        ? `
      <div style="background: #fff3cd; padding: 12px; border-radius: 8px; margin: 20px 0;">
        <strong>Special Instructions:</strong> ${order.special_instructions}
      </div>
    `
        : ""
    }

    <!-- Totals -->
    <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #eee;">
      <table style="width: 100%;">
        <tr>
          <td style="padding: 4px 0; color: #666;">Subtotal</td>
          <td style="text-align: right;">${formatPrice(order.subtotal_cents)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #666;">Delivery Fee</td>
          <td style="text-align: right; ${order.delivery_fee_cents === 0 ? 'color: #2E8B57; font-weight: 600;' : ''}">
            ${order.delivery_fee_cents === 0 ? "FREE" : formatPrice(order.delivery_fee_cents)}
          </td>
        </tr>
        ${
          order.tax_cents > 0
            ? `
          <tr>
            <td style="padding: 4px 0; color: #666;">Tax</td>
            <td style="text-align: right;">${formatPrice(order.tax_cents)}</td>
          </tr>
        `
            : ""
        }
        <tr>
          <td style="padding: 12px 0 0 0; font-size: 18px; font-weight: 700;">Total</td>
          <td style="text-align: right; padding: 12px 0 0 0; font-size: 18px; font-weight: 700; color: #8B4513;">
            ${formatPrice(order.total_cents)}
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/orders/${order.id}"
         style="display: inline-block; background: #D4A017; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Order Status
      </a>
    </div>

    <!-- Footer Note -->
    <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin-top: 20px;">
      <p style="margin: 0; font-size: 14px; color: #666;">
        <strong>Need help?</strong> Reply to this email or contact us at
        <a href="mailto:support@mandalaymorningstar.com" style="color: #D4A017;">support@mandalaymorningstar.com</a>
      </p>
    </div>

  </div>

  <!-- Footer -->
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p style="margin: 0 0 8px 0;">
      Mandalay Morning Star · 750 Terrado Plaza, Suite 33, Covina, CA 91723
    </p>
    <p style="margin: 0;">
      Saturday Delivery Only · Orders placed before Friday 3pm PT
    </p>
  </div>

</body>
</html>
  `;
}

function generatePlainTextEmail(order: Order): string {
  const customerName = order.profiles?.full_name || "Valued Customer";
  const deliveryDate = order.delivery_window_start
    ? formatDate(order.delivery_window_start)
    : "Saturday";
  const deliveryTime =
    order.delivery_window_start && order.delivery_window_end
      ? `${formatTime(order.delivery_window_start)} - ${formatTime(order.delivery_window_end)}`
      : "Scheduled window";

  const addressText = order.addresses
    ? `${order.addresses.line_1}${order.addresses.line_2 ? `, ${order.addresses.line_2}` : ""}, ${order.addresses.city}, ${order.addresses.state} ${order.addresses.postal_code}`
    : "Address on file";

  const itemsText = order.order_items
    .map((item) => {
      const modifiers =
        item.order_item_modifiers.length > 0
          ? ` (${item.order_item_modifiers.map((m) => m.name_snapshot).join(", ")})`
          : "";
      return `  ${item.quantity}x ${item.name_snapshot}${modifiers} - ${formatPrice(item.line_total_cents)}`;
    })
    .join("\n");

  return `
MANDALAY MORNING STAR - ORDER CONFIRMATION
============================================

Hello ${customerName},

Thank you for your order! We're excited to prepare your delicious Burmese meal.

ORDER STATUS: ✓ Confirmed

ORDER DETAILS
-------------
Order #: ${order.id.slice(0, 8).toUpperCase()}
Placed: ${formatDate(order.placed_at)}

DELIVERY
--------
Date: ${deliveryDate}
Time: ${deliveryTime}
Address: ${addressText}

YOUR ITEMS
----------
${itemsText}

${order.special_instructions ? `Special Instructions: ${order.special_instructions}\n` : ""}
TOTALS
------
Subtotal: ${formatPrice(order.subtotal_cents)}
Delivery Fee: ${order.delivery_fee_cents === 0 ? "FREE" : formatPrice(order.delivery_fee_cents)}
${order.tax_cents > 0 ? `Tax: ${formatPrice(order.tax_cents)}\n` : ""}Total: ${formatPrice(order.total_cents)}

View your order status: ${APP_URL}/orders/${order.id}

Need help? Reply to this email or contact us at support@mandalaymorningstar.com

---
Mandalay Morning Star
750 Terrado Plaza, Suite 33, Covina, CA 91723
Saturday Delivery Only · Orders placed before Friday 3pm PT
  `.trim();
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Validate required environment variables
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    // Parse request body
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch order with all related data
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        id,
        status,
        subtotal_cents,
        delivery_fee_cents,
        tax_cents,
        total_cents,
        delivery_window_start,
        delivery_window_end,
        special_instructions,
        placed_at,
        confirmed_at,
        profiles!orders_user_id_fkey (
          full_name,
          email
        ),
        addresses (
          line_1,
          line_2,
          city,
          state,
          postal_code
        ),
        order_items (
          name_snapshot,
          quantity,
          line_total_cents,
          order_item_modifiers (
            name_snapshot,
            price_delta_snapshot
          )
        )
      `
      )
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Failed to fetch order:", orderError);
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify order is confirmed
    if (order.status !== "confirmed") {
      return new Response(
        JSON.stringify({ error: "Order is not confirmed yet" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const typedOrder = order as unknown as Order;
    const customerEmail = typedOrder.profiles?.email;

    if (!customerEmail) {
      console.error("No customer email found for order:", orderId);
      return new Response(
        JSON.stringify({ error: "Customer email not found" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Mandalay Morning Star <${FROM_EMAIL}>`,
        to: customerEmail,
        subject: `Order Confirmed #${order.id.slice(0, 8).toUpperCase()} - Mandalay Morning Star`,
        html: generateEmailHtml(typedOrder),
        text: generatePlainTextEmail(typedOrder),
        tags: [
          { name: "type", value: "order-confirmation" },
          { name: "order_id", value: order.id },
        ],
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailResult);
      throw new Error(`Failed to send email: ${emailResult.message}`);
    }

    console.log(
      `Order confirmation email sent to ${customerEmail} for order ${orderId}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailResult.id,
        recipient: customerEmail,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending order confirmation email:", message);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
