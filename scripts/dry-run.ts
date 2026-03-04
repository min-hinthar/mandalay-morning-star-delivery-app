/**
 * Saturday Dry Run Script
 *
 * Creates 20 test orders and walks each through the full lifecycle:
 * placed -> confirmed -> preparing -> out_for_delivery -> delivered
 *
 * Prerequisites:
 *   - `pnpm dev` must be running
 *   - Environment variables set (or .env.local loaded by tsx):
 *     STRIPE_SECRET_KEY (must start with sk_test_)
 *     NEXT_PUBLIC_SUPABASE_URL
 *     SUPABASE_SERVICE_ROLE_KEY
 *     NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Usage:
 *   pnpm dry-run
 *   pnpm dry-run --cleanup   # remove test orders after run
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";

// ---------------------------------------------------------------------------
// Safety guard (CRITICAL)
// ---------------------------------------------------------------------------
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey?.startsWith("sk_test_")) {
  console.error("ABORT: STRIPE_SECRET_KEY must be a test key (sk_test_*)");
  console.error("Current key starts with:", stripeKey?.substring(0, 10));
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
  console.error(
    "ABORT: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and NEXT_PUBLIC_SUPABASE_ANON_KEY are required"
  );
  process.exit(1);
}

const ORDER_COUNT = 20;
const TEST_EMAIL = "dry-run-test@example.com";
const TEST_PASSWORD = "DryRunTest123!";
const CLEANUP = process.argv.includes("--cleanup");

const serviceClient = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getNextSaturday(): string {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSat = (6 - day + 7) % 7 || 7; // next Saturday (never today)
  const sat = new Date(now);
  sat.setDate(now.getDate() + daysUntilSat);
  return sat.toISOString().split("T")[0];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function log(msg: string): void {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

function logError(msg: string): void {
  const ts = new Date().toISOString().slice(11, 19);
  console.error(`[${ts}] ERROR: ${msg}`);
}

// ---------------------------------------------------------------------------
// Test user & address setup
// ---------------------------------------------------------------------------

interface TestContext {
  userId: string;
  accessToken: string;
  addressId: string;
  adminToken: string;
  adminUserId: string;
  driverId: string | null;
}

async function getOrCreateTestUser(): Promise<{ userId: string; accessToken: string }> {
  // Try to sign in first
  const signIn = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY! },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });

  if (signIn.ok) {
    const data = (await signIn.json()) as { access_token: string; user: { id: string } };
    return { userId: data.user.id, accessToken: data.access_token };
  }

  // Create user via admin API
  const { data: newUser, error } = await serviceClient.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });

  if (error || !newUser.user) {
    throw new Error(`Failed to create test user: ${error?.message ?? "unknown"}`);
  }

  // Ensure profile exists
  await serviceClient.from("profiles").upsert({
    id: newUser.user.id,
    email: TEST_EMAIL,
    full_name: "Dry Run Test User",
  });

  // Sign in to get token
  const signIn2 = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY! },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });

  if (!signIn2.ok) {
    throw new Error("Failed to sign in after creating test user");
  }

  const data2 = (await signIn2.json()) as { access_token: string; user: { id: string } };
  return { userId: data2.user.id, accessToken: data2.access_token };
}

async function getOrCreateTestAddress(userId: string): Promise<string> {
  // Check for existing address
  const { data: existing } = await serviceClient
    .from("addresses")
    .select("id")
    .eq("user_id", userId)
    .eq("is_verified", true)
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id;

  // Create a verified test address
  const { data: addr, error } = await serviceClient
    .from("addresses")
    .insert({
      user_id: userId,
      line_1: "123 Test Street",
      city: "Covina",
      state: "CA",
      postal_code: "91722",
      lat: 34.0901,
      lng: -117.8903,
      is_verified: true,
      is_within_coverage: true,
    })
    .select("id")
    .single();

  if (error || !addr) {
    throw new Error(`Failed to create test address: ${error?.message ?? "unknown"}`);
  }

  return addr.id;
}

async function getAdminAuth(): Promise<{ adminToken: string; adminUserId: string }> {
  // Find an admin user
  const { data: adminProfile } = await serviceClient
    .from("profiles")
    .select("id, email")
    .eq("is_admin", true)
    .limit(1)
    .maybeSingle();

  if (!adminProfile?.id || !adminProfile.email) {
    throw new Error("No admin user found. Create an admin user before running dry-run.");
  }

  // Use service role key for admin operations (bypasses RLS)
  return { adminToken: SERVICE_ROLE_KEY!, adminUserId: adminProfile.id as string };
}

async function getTestDriver(): Promise<string | null> {
  const { data: driver } = await serviceClient
    .from("drivers")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!driver || typeof driver.id !== "string") return null;
  return driver.id;
}

// ---------------------------------------------------------------------------
// Menu data
// ---------------------------------------------------------------------------

interface MenuItemRef {
  id: string;
  name: string;
}

async function fetchMenuItems(): Promise<MenuItemRef[]> {
  const res = await fetch(`${BASE_URL}/api/menu`);
  if (!res.ok) {
    throw new Error(`Failed to fetch menu: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as {
    data?: {
      categories?: Array<{
        items?: Array<{ id: string; nameEn: string; isSoldOut: boolean }>;
      }>;
    };
  };

  const items: MenuItemRef[] = [];
  for (const cat of json.data?.categories ?? []) {
    for (const item of cat.items ?? []) {
      if (!item.isSoldOut) {
        items.push({ id: item.id, name: item.nameEn });
      }
    }
  }

  if (items.length === 0) {
    throw new Error("No active menu items found. Seed menu before running dry-run.");
  }

  return items;
}

// ---------------------------------------------------------------------------
// Order lifecycle
// ---------------------------------------------------------------------------

interface OrderResult {
  index: number;
  orderId: string | null;
  success: boolean;
  error?: string;
  finalStatus?: string;
}

async function createAndProcessOrder(
  ctx: TestContext,
  menuItems: MenuItemRef[],
  index: number,
  scheduledDate: string
): Promise<OrderResult> {
  const result: OrderResult = { index, orderId: null, success: false };

  try {
    // 1. Build checkout payload with random items
    const itemCount = randomInt(1, Math.min(3, menuItems.length));
    const shuffled = [...menuItems].sort(() => Math.random() - 0.5);
    const selectedItems = shuffled.slice(0, itemCount);

    const payload = {
      addressId: ctx.addressId,
      scheduledDate,
      timeWindowStart: "10:00",
      timeWindowEnd: "11:00",
      items: selectedItems.map((item) => ({
        menuItemId: item.id,
        quantity: randomInt(1, 3),
        modifiers: [],
      })),
    };

    // 2. POST /api/checkout/session (creates order + Stripe session)
    const checkoutRes = await fetch(`${BASE_URL}/api/checkout/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ctx.accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const checkoutBody = (await checkoutRes.json()) as {
      data?: { orderId: string };
      error?: { code: string; message: string };
    };

    if (!checkoutRes.ok) {
      // DUPLICATE_ORDER is expected after first order (one per Saturday).
      // For the dry-run to create 20 orders, we bypass via direct DB insert.
      if (checkoutBody.error?.code === "DUPLICATE_ORDER") {
        // Create order directly via service client
        return await createOrderDirect(ctx, menuItems, index, scheduledDate);
      }
      result.error = `Checkout failed: ${checkoutBody.error?.message ?? checkoutRes.statusText}`;
      return result;
    }

    const orderId = checkoutBody.data?.orderId;
    if (!orderId) {
      result.error = "No orderId in checkout response";
      return result;
    }

    result.orderId = orderId;

    // 3. Simulate payment completion: set status to "confirmed" via service client
    //    (In production, Stripe webhook does this)
    await transitionOrderDirect(orderId, "pending", "confirmed");
    log(`  Order ${index + 1}: ${orderId} -> confirmed`);

    // 4. Transition: confirmed -> preparing
    await transitionOrderDirect(orderId, "confirmed", "preparing");
    log(`  Order ${index + 1}: ${orderId} -> preparing`);

    // 5. Assign driver (if available)
    if (ctx.driverId) {
      await serviceClient
        .from("orders")
        .update({ assigned_driver_id: ctx.driverId })
        .eq("id", orderId);
      log(`  Order ${index + 1}: ${orderId} -> driver assigned`);
    }

    // 6. Transition: preparing -> out_for_delivery
    await transitionOrderDirect(orderId, "preparing", "out_for_delivery");
    log(`  Order ${index + 1}: ${orderId} -> out_for_delivery`);

    // 7. Transition: out_for_delivery -> delivered
    await transitionOrderDirect(orderId, "out_for_delivery", "delivered");
    log(`  Order ${index + 1}: ${orderId} -> delivered`);

    result.success = true;
    result.finalStatus = "delivered";
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
  }

  return result;
}

/**
 * Creates an order directly via service client to bypass duplicate-per-Saturday check.
 * Used for orders 2-20 since the API only allows one per user per Saturday.
 */
async function createOrderDirect(
  ctx: TestContext,
  menuItems: MenuItemRef[],
  index: number,
  scheduledDate: string
): Promise<OrderResult> {
  const result: OrderResult = { index, orderId: null, success: false };

  try {
    const itemCount = randomInt(1, Math.min(3, menuItems.length));
    const shuffled = [...menuItems].sort(() => Math.random() - 0.5);
    const selectedItems = shuffled.slice(0, itemCount);

    // Create order
    const { data: order, error: orderError } = await serviceClient
      .from("orders")
      .insert({
        user_id: ctx.userId,
        address_id: ctx.addressId,
        status: "pending",
        subtotal_cents: 1500,
        delivery_fee_cents: 500,
        tax_cents: 150,
        tip_cents: 0,
        total_cents: 2150,
        delivery_window_start: `${scheduledDate}T10:00:00`,
        delivery_window_end: `${scheduledDate}T11:00:00`,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      result.error = `Direct order creation failed: ${orderError?.message ?? "unknown"}`;
      return result;
    }

    result.orderId = order.id;

    // Insert order items
    for (const item of selectedItems) {
      await serviceClient.from("order_items").insert({
        order_id: order.id,
        menu_item_id: item.id,
        name_snapshot: item.name,
        base_price_snapshot: 500,
        quantity: randomInt(1, 3),
        line_total_cents: 500,
      });
    }

    // Walk through lifecycle
    await transitionOrderDirect(order.id, "pending", "confirmed");
    log(`  Order ${index + 1}: ${order.id} -> confirmed`);

    await transitionOrderDirect(order.id, "confirmed", "preparing");
    log(`  Order ${index + 1}: ${order.id} -> preparing`);

    if (ctx.driverId) {
      await serviceClient
        .from("orders")
        .update({ assigned_driver_id: ctx.driverId })
        .eq("id", order.id);
      log(`  Order ${index + 1}: ${order.id} -> driver assigned`);
    }

    await transitionOrderDirect(order.id, "preparing", "out_for_delivery");
    log(`  Order ${index + 1}: ${order.id} -> out_for_delivery`);

    await transitionOrderDirect(order.id, "out_for_delivery", "delivered");
    log(`  Order ${index + 1}: ${order.id} -> delivered`);

    result.success = true;
    result.finalStatus = "delivered";
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
  }

  return result;
}

async function transitionOrderDirect(
  orderId: string,
  _fromStatus: string,
  toStatus: string
): Promise<void> {
  const updateData: Record<string, string> = { status: toStatus };

  if (toStatus === "confirmed") {
    updateData.confirmed_at = new Date().toISOString();
  }
  if (toStatus === "delivered") {
    updateData.delivered_at = new Date().toISOString();
  }

  const { error } = await serviceClient.from("orders").update(updateData).eq("id", orderId);

  if (error) {
    throw new Error(`Failed to transition order ${orderId} to ${toStatus}: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

async function cleanupTestOrders(orderIds: string[]): Promise<void> {
  log(`Cleaning up ${orderIds.length} test orders...`);

  for (const id of orderIds) {
    // Delete order items first (FK constraint)
    await serviceClient.from("order_items").delete().eq("order_id", id);
    // Delete audit log entries
    await serviceClient.from("order_audit_log").delete().eq("order_id", id);
    // Delete order
    await serviceClient.from("orders").delete().eq("id", id);
  }

  log(`Cleanup complete: ${orderIds.length} orders removed`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("  SATURDAY DRY RUN -- Order Lifecycle Test");
  console.log("=".repeat(60));
  console.log();

  // Safety confirmation
  log(`Target: ${BASE_URL}`);
  log(`Stripe key: ${stripeKey?.substring(0, 12)}...`);
  log(`Orders to create: ${ORDER_COUNT}`);
  if (CLEANUP) log("Cleanup mode: ON (orders will be removed after run)");
  console.log();

  // Setup
  log("Setting up test user...");
  const { userId, accessToken } = await getOrCreateTestUser();
  log(`Test user: ${userId}`);

  log("Setting up test address...");
  const addressId = await getOrCreateTestAddress(userId);
  log(`Test address: ${addressId}`);

  log("Getting admin credentials...");
  const { adminToken, adminUserId } = await getAdminAuth();
  log(`Admin user: ${adminUserId}`);

  log("Checking for active driver...");
  const driverId = await getTestDriver();
  log(driverId ? `Driver: ${driverId}` : "No active driver found (skipping assignment)");

  log("Fetching menu items...");
  const menuItems = await fetchMenuItems();
  log(`Menu items available: ${menuItems.length}`);

  const scheduledDate = getNextSaturday();
  log(`Scheduled date: ${scheduledDate} (next Saturday)`);
  console.log();

  const ctx: TestContext = {
    userId,
    accessToken,
    addressId,
    adminToken,
    adminUserId,
    driverId,
  };

  // Execute orders
  console.log("-".repeat(60));
  log(`Creating ${ORDER_COUNT} orders...`);
  console.log();

  const results: OrderResult[] = [];

  for (let i = 0; i < ORDER_COUNT; i++) {
    log(`Order ${i + 1}/${ORDER_COUNT}:`);
    const result = await createAndProcessOrder(ctx, menuItems, i, scheduledDate);
    results.push(result);

    if (result.success) {
      log(`  PASS: ${result.orderId} -> ${result.finalStatus}`);
    } else {
      logError(`  FAIL: ${result.error}`);
    }
    console.log();
  }

  // Summary
  console.log("=".repeat(60));
  console.log("  SUMMARY");
  console.log("=".repeat(60));

  const successes = results.filter((r) => r.success);
  const failures = results.filter((r) => !r.success);

  console.log(`\n  ${successes.length}/${ORDER_COUNT} orders completed lifecycle\n`);

  if (failures.length > 0) {
    console.log("  FAILURES:");
    for (const f of failures) {
      console.log(`    Order ${f.index + 1}: ${f.error}`);
    }
    console.log();
  }

  // Cleanup
  if (CLEANUP) {
    const orderIds = results.filter((r) => r.orderId).map((r) => r.orderId!);
    if (orderIds.length > 0) {
      await cleanupTestOrders(orderIds);
    }
  }

  // Exit code
  if (failures.length > 0) {
    process.exit(1);
  }

  log("Dry run complete!");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
