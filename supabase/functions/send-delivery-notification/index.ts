// supabase/functions/send-delivery-notification/index.ts
// Supabase Edge Function for sending delivery notification emails
// Handles: out_for_delivery, arriving_soon, delivered

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const FROM_EMAIL =
  Deno.env.get("FROM_EMAIL") || "orders@mandalaymorningstar.com";
const APP_URL = Deno.env.get("APP_URL") || "https://mandalaymorningstar.com";

type NotificationType =
  | "out_for_delivery"
  | "arriving_soon"
  | "delivered"
  | "feedback_request";

interface NotificationPayload {
  type: NotificationType;
  orderId: string;
  metadata?: {
    driverName?: string;
    driverPhone?: string;
    vehicleType?: string;
    etaMinutes?: number;
    estimatedArrival?: string;
    deliveryPhotoUrl?: string;
    feedbackToken?: string;
    trackingUrl?: string;
  };
}

interface OrderData {
  id: string;
  user_id: string;
  total_cents: number;
  delivery_window_start: string | null;
  delivery_window_end: string | null;
  profiles: {
    full_name: string | null;
    email: string;
  };
  addresses: {
    line_1: string;
    city: string;
    state: string;
  } | null;
}

function getOrderNumber(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}

// ===========================================
// EMAIL TEMPLATES
// ===========================================

function generateOutForDeliveryEmail(
  order: OrderData,
  metadata: NotificationPayload["metadata"]
): { html: string; text: string; subject: string } {
  const customerName = order.profiles?.full_name || "Valued Customer";
  const orderNumber = getOrderNumber(order.id);
  const driverName = metadata?.driverName || "your driver";
  const trackingUrl = `${APP_URL}/orders/${order.id}/tracking`;

  const subject = `Your Order #${orderNumber} is On Its Way!`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #D4A017 0%, #8B4513 100%); border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-family: 'Playfair Display', Georgia, serif;">
      Mandalay Morning Star
    </h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">
      Your order is on the way!
    </p>
  </div>

  <!-- Content -->
  <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none;">

    <!-- Status Badge -->
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="background: #2E8B57; color: white; display: inline-block; padding: 12px 24px; border-radius: 30px; font-weight: 600; font-size: 16px;">
        🚗 Out for Delivery
      </div>
    </div>

    <p style="font-size: 18px; margin-top: 0;">
      Hi ${customerName},
    </p>

    <p>
      Great news! <strong>${driverName}</strong> is on their way with your delicious Burmese food.
      You can track your delivery in real-time using the button below.
    </p>

    <!-- Driver Info -->
    ${
      metadata?.driverName
        ? `
    <div style="background: #FFF9E6; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D4A017;">
      <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #8B4513;">
        Your Driver
      </h3>
      <p style="margin: 0; font-weight: 600;">${metadata.driverName}</p>
      ${metadata.vehicleType ? `<p style="margin: 4px 0 0 0; color: #666; text-transform: capitalize;">${metadata.vehicleType}</p>` : ""}
    </div>
    `
        : ""
    }

    <!-- Order Info -->
    <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;">
        <strong>Order #:</strong> ${orderNumber}<br/>
        <strong>Delivery Address:</strong> ${order.addresses ? `${order.addresses.line_1}, ${order.addresses.city}` : "On file"}
      </p>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${trackingUrl}"
         style="display: inline-block; background: #D4A017; color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 18px;">
        Track Your Order
      </a>
    </div>

    <p style="text-align: center; color: #666; font-size: 14px;">
      Keep your phone nearby - we'll notify you when your order is almost there!
    </p>

  </div>

  <!-- Footer -->
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p style="margin: 0;">
      Mandalay Morning Star · 750 Terrado Plaza, Suite 33, Covina, CA 91723
    </p>
  </div>

</body>
</html>
  `;

  const text = `
MANDALAY MORNING STAR - YOUR ORDER IS ON THE WAY!

Hi ${customerName},

Great news! ${driverName} is on their way with your delicious Burmese food.

Order #: ${orderNumber}
Delivery Address: ${order.addresses ? `${order.addresses.line_1}, ${order.addresses.city}` : "On file"}

Track your order: ${trackingUrl}

Keep your phone nearby - we'll notify you when your order is almost there!

---
Mandalay Morning Star
750 Terrado Plaza, Suite 33, Covina, CA 91723
  `.trim();

  return { html, text, subject };
}

function generateArrivingSoonEmail(
  order: OrderData,
  metadata: NotificationPayload["metadata"]
): { html: string; text: string; subject: string } {
  const customerName = order.profiles?.full_name || "Valued Customer";
  const orderNumber = getOrderNumber(order.id);
  const driverName = metadata?.driverName || "Your driver";
  const etaMinutes = metadata?.etaMinutes || 10;
  const trackingUrl = `${APP_URL}/orders/${order.id}/tracking`;

  const subject = `Your Order #${orderNumber} Arrives in ~${etaMinutes} Minutes!`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #2E8B57 0%, #1a5c3a 100%); border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-family: 'Playfair Display', Georgia, serif;">
      Almost There!
    </h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 20px; font-weight: 600;">
      ~${etaMinutes} minutes away
    </p>
  </div>

  <!-- Content -->
  <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none;">

    <p style="font-size: 18px; margin-top: 0;">
      Hi ${customerName},
    </p>

    <p>
      <strong>${driverName}</strong> is almost at your door! Get ready to receive your order.
    </p>

    <!-- Tips -->
    <div style="background: #f0f8f0; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2E8B57;">
      <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #2E8B57;">
        📝 Quick Tips
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: #555;">
        <li>Keep your phone nearby for driver contact</li>
        <li>Clear your doorstep for easy delivery</li>
        <li>Have any gate/building codes ready</li>
      </ul>
    </div>

    <!-- Order Info -->
    <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;">
        <strong>Order #:</strong> ${orderNumber}
      </p>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${trackingUrl}"
         style="display: inline-block; background: #2E8B57; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Live Tracking
      </a>
    </div>

  </div>

  <!-- Footer -->
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p style="margin: 0;">
      Mandalay Morning Star · 750 Terrado Plaza, Suite 33, Covina, CA 91723
    </p>
  </div>

</body>
</html>
  `;

  const text = `
MANDALAY MORNING STAR - ALMOST THERE!

Hi ${customerName},

${driverName} is almost at your door! Your order will arrive in approximately ${etaMinutes} minutes.

Order #: ${orderNumber}

Quick Tips:
- Keep your phone nearby for driver contact
- Clear your doorstep for easy delivery
- Have any gate/building codes ready

View live tracking: ${trackingUrl}

---
Mandalay Morning Star
750 Terrado Plaza, Suite 33, Covina, CA 91723
  `.trim();

  return { html, text, subject };
}

function generateDeliveredEmail(
  order: OrderData,
  metadata: NotificationPayload["metadata"]
): { html: string; text: string; subject: string } {
  const customerName = order.profiles?.full_name || "Valued Customer";
  const orderNumber = getOrderNumber(order.id);
  const feedbackUrl = `${APP_URL}/orders/${order.id}/feedback`;

  const subject = `Order #${orderNumber} Delivered - Enjoy Your Meal!`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #D4A017 0%, #8B4513 100%); border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-family: 'Playfair Display', Georgia, serif;">
      Order Delivered!
    </h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">
      ✓ Successfully delivered
    </p>
  </div>

  <!-- Content -->
  <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none;">

    <p style="font-size: 18px; margin-top: 0;">
      Hi ${customerName},
    </p>

    <p>
      Your order has been delivered! We hope you enjoy your authentic Burmese meal.
      Thank you for choosing Mandalay Morning Star.
    </p>

    ${
      metadata?.deliveryPhotoUrl
        ? `
    <!-- Delivery Photo -->
    <div style="text-align: center; margin: 20px 0;">
      <img src="${metadata.deliveryPhotoUrl}" alt="Delivery confirmation"
           style="max-width: 100%; border-radius: 8px; border: 1px solid #eee;">
      <p style="color: #666; font-size: 12px; margin-top: 8px;">Delivery confirmation photo</p>
    </div>
    `
        : ""
    }

    <!-- Order Summary -->
    <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;">
        <strong>Order #:</strong> ${orderNumber}
      </p>
    </div>

    <!-- Feedback Request -->
    <div style="background: #FFF9E6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <h3 style="margin: 0 0 8px 0; color: #8B4513;">
        How was your experience?
      </h3>
      <p style="margin: 0 0 16px 0; color: #666;">
        Your feedback helps us improve!
      </p>
      <a href="${feedbackUrl}"
         style="display: inline-block; background: #D4A017; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600;">
        ⭐ Rate Your Delivery
      </a>
    </div>

    <!-- Reorder -->
    <div style="text-align: center; margin: 20px 0;">
      <a href="${APP_URL}/menu"
         style="display: inline-block; background: transparent; color: #D4A017; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; border: 2px solid #D4A017;">
        Order Again
      </a>
    </div>

    <p style="color: #666; font-size: 14px; text-align: center;">
      Questions about your order? Reply to this email.
    </p>

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

  const text = `
MANDALAY MORNING STAR - ORDER DELIVERED!

Hi ${customerName},

Your order has been delivered! We hope you enjoy your authentic Burmese meal.
Thank you for choosing Mandalay Morning Star.

Order #: ${orderNumber}

HOW WAS YOUR EXPERIENCE?
Your feedback helps us improve!
Rate your delivery: ${feedbackUrl}

---
Order again: ${APP_URL}/menu
Questions? Reply to this email.

Mandalay Morning Star
750 Terrado Plaza, Suite 33, Covina, CA 91723
Saturday Delivery Only · Orders placed before Friday 3pm PT
  `.trim();

  return { html, text, subject };
}

// ===========================================
// MAIN HANDLER
// ===========================================

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
    const payload: NotificationPayload = await req.json();

    if (!payload.orderId || !payload.type) {
      return new Response(
        JSON.stringify({ error: "orderId and type are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate notification type
    const validTypes: NotificationType[] = [
      "out_for_delivery",
      "arriving_soon",
      "delivered",
      "feedback_request",
    ];
    if (!validTypes.includes(payload.type)) {
      return new Response(
        JSON.stringify({ error: "Invalid notification type" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch order with customer info
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        id,
        user_id,
        total_cents,
        delivery_window_start,
        delivery_window_end,
        profiles!orders_user_id_fkey (
          full_name,
          email
        ),
        addresses (
          line_1,
          city,
          state
        )
      `
      )
      .eq("id", payload.orderId)
      .single();

    if (orderError || !order) {
      console.error("Failed to fetch order:", orderError);
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const typedOrder = order as unknown as OrderData;
    const customerEmail = typedOrder.profiles?.email;

    if (!customerEmail) {
      console.error("No customer email found for order:", payload.orderId);
      return new Response(
        JSON.stringify({ error: "Customer email not found" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generate email based on notification type
    let emailContent: { html: string; text: string; subject: string };

    switch (payload.type) {
      case "out_for_delivery":
        emailContent = generateOutForDeliveryEmail(typedOrder, payload.metadata);
        break;
      case "arriving_soon":
        emailContent = generateArrivingSoonEmail(typedOrder, payload.metadata);
        break;
      case "delivered":
      case "feedback_request":
        emailContent = generateDeliveredEmail(typedOrder, payload.metadata);
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid notification type" }),
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
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        tags: [
          { name: "type", value: payload.type },
          { name: "order_id", value: order.id },
        ],
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailResult);

      // Log failed notification
      await supabase.from("notification_logs").insert({
        order_id: payload.orderId,
        user_id: typedOrder.user_id,
        notification_type: payload.type,
        channel: "email",
        recipient: customerEmail,
        subject: emailContent.subject,
        status: "failed",
        error_message: emailResult.message || "Unknown error",
        metadata: payload.metadata as Record<string, unknown>,
      });

      throw new Error(`Failed to send email: ${emailResult.message}`);
    }

    // Log successful notification
    await supabase.from("notification_logs").insert({
      order_id: payload.orderId,
      user_id: typedOrder.user_id,
      notification_type: payload.type,
      channel: "email",
      recipient: customerEmail,
      subject: emailContent.subject,
      resend_id: emailResult.id,
      status: "sent",
      sent_at: new Date().toISOString(),
      metadata: payload.metadata as Record<string, unknown>,
    });

    console.log(
      `${payload.type} email sent to ${customerEmail} for order ${payload.orderId}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailResult.id,
        recipient: customerEmail,
        type: payload.type,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending delivery notification:", message);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
