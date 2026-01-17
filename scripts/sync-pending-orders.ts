/**
 * Script to sync pending orders with Stripe
 * Finds completed checkout sessions and updates corresponding orders
 *
 * Usage: npx tsx scripts/sync-pending-orders.ts
 */

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing required environment variables:");
  console.error("- STRIPE_SECRET_KEY");
  console.error("- NEXT_PUBLIC_SUPABASE_URL");
  console.error("- SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function syncPendingOrders() {
  console.log("Fetching pending orders...");

  // Get all pending orders
  const { data: pendingOrders, error: ordersError } = await supabase
    .from("orders")
    .select("id, placed_at")
    .eq("status", "pending");

  if (ordersError) {
    console.error("Failed to fetch orders:", ordersError);
    process.exit(1);
  }

  console.log(`Found ${pendingOrders?.length ?? 0} pending orders`);

  if (!pendingOrders?.length) {
    console.log("No pending orders to sync");
    return;
  }

  // Fetch recent completed checkout sessions from Stripe
  console.log("\nFetching completed checkout sessions from Stripe...");

  const sessions = await stripe.checkout.sessions.list({
    limit: 100,
    status: "complete",
    created: {
      // Last 7 days
      gte: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60,
    },
    expand: ["data.payment_intent"],
  });

  console.log(`Found ${sessions.data.length} completed sessions`);

  let updated = 0;
  let skipped = 0;

  for (const session of sessions.data) {
    const orderId = session.metadata?.order_id;

    if (!orderId) {
      continue;
    }

    // Check if this order is in our pending list
    const pendingOrder = pendingOrders.find((o) => o.id === orderId);

    if (!pendingOrder) {
      continue;
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (!paymentIntentId) {
      console.log(`  Skipping ${orderId}: no payment_intent`);
      skipped++;
      continue;
    }

    console.log(`\nUpdating order ${orderId}:`);
    console.log(`  Session: ${session.id}`);
    console.log(`  Payment Intent: ${paymentIntentId}`);

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "confirmed",
        stripe_payment_intent_id: paymentIntentId,
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("status", "pending");

    if (updateError) {
      console.error(`  Failed: ${updateError.message}`);
    } else {
      console.log(`  ✓ Updated to confirmed`);
      updated++;
    }
  }

  console.log("\n--- Summary ---");
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Remaining pending: ${pendingOrders.length - updated}`);
}

syncPendingOrders().catch(console.error);
