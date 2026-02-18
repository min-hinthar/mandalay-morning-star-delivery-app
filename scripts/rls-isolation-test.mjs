#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

// ── Environment Variables ──────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const USER_A_EMAIL = process.env.USER_A_EMAIL;
const USER_A_PASSWORD = process.env.USER_A_PASSWORD;
const USER_B_EMAIL = process.env.USER_B_EMAIL;
const USER_B_PASSWORD = process.env.USER_B_PASSWORD;
const DRIVER_A_EMAIL = process.env.DRIVER_A_EMAIL;
const DRIVER_A_PASSWORD = process.env.DRIVER_A_PASSWORD;
const DRIVER_B_EMAIL = process.env.DRIVER_B_EMAIL;
const DRIVER_B_PASSWORD = process.env.DRIVER_B_PASSWORD;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function requireEnv(value, name) {
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
}

requireEnv(SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL");
requireEnv(SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY");
requireEnv(USER_A_EMAIL, "USER_A_EMAIL");
requireEnv(USER_A_PASSWORD, "USER_A_PASSWORD");
requireEnv(USER_B_EMAIL, "USER_B_EMAIL");
requireEnv(USER_B_PASSWORD, "USER_B_PASSWORD");
requireEnv(DRIVER_A_EMAIL, "DRIVER_A_EMAIL");
requireEnv(DRIVER_A_PASSWORD, "DRIVER_A_PASSWORD");
requireEnv(DRIVER_B_EMAIL, "DRIVER_B_EMAIL");
requireEnv(DRIVER_B_PASSWORD, "DRIVER_B_PASSWORD");
requireEnv(ADMIN_EMAIL, "ADMIN_EMAIL");
requireEnv(ADMIN_PASSWORD, "ADMIN_PASSWORD");

// ── Assertion Helper ───────────────────────────────────────────────────
let failures = 0;
function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    failures++;
  } else {
    console.log(`PASS: ${message}`);
  }
}

// ── Anon Client ────────────────────────────────────────────────────────
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Auth Helpers ───────────────────────────────────────────────────────
async function signIn(client, email, password) {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`Sign-in failed for ${email}: ${error.message}`);
  }
  return data.user;
}

async function signOut(client) {
  const { error } = await client.auth.signOut();
  if (error) {
    throw new Error(`Sign-out failed: ${error.message}`);
  }
}

// ── Customer Data Helpers ──────────────────────────────────────────────
async function createAddress(client) {
  const { data, error } = await client
    .from("addresses")
    .insert({
      label: "RLS Test",
      street_address: "123 Test St",
      city: "San Francisco",
      state: "CA",
      zip_code: "94105",
      is_default: true,
      is_verified: false,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Create address failed: ${error.message}`);
  }

  return data.id;
}

async function createOrder(client, addressId) {
  const { data, error } = await client
    .from("orders")
    .insert({
      address_id: addressId,
      subtotal_cents: 0,
      delivery_fee_cents: 0,
      tax_cents: 0,
      total_cents: 0,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Create order failed: ${error.message}`);
  }

  return data.id;
}

async function selectAddresses(client) {
  const { data, error } = await client.from("addresses").select("id, user_id, label");
  if (error) {
    throw new Error(`Select addresses failed: ${error.message}`);
  }
  return data;
}

async function selectOrders(client) {
  const { data, error } = await client.from("orders").select("id, user_id, status");
  if (error) {
    throw new Error(`Select orders failed: ${error.message}`);
  }
  return data;
}

async function selectProfileById(client, id) {
  const { data, error } = await client.from("profiles").select("id, role, email").eq("id", id);
  if (error) {
    throw new Error(`Select profile failed: ${error.message}`);
  }
  return data;
}

async function selectMenuPublic(client) {
  const tables = [
    "menu_categories",
    "menu_items",
    "modifier_groups",
    "modifier_options",
    "item_modifier_groups",
  ];

  const results = {};
  for (const table of tables) {
    const { data, error } = await client.from(table).select("*").limit(1);
    if (error) {
      results[table] = { error: error.message };
    } else {
      results[table] = { count: data.length };
    }
  }

  return results;
}

// ── Main Test Runner ───────────────────────────────────────────────────
async function run() {
  console.log("RLS Isolation Test\n");

  // ────────────────────────────────────────────────────────────────────
  // SECTION 1: Customer Isolation (User A vs User B)
  // ────────────────────────────────────────────────────────────────────
  console.log("== Customer Isolation ==\n");

  console.log("[1] Sign in as User A");
  const userAClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const userA = await signIn(userAClient, USER_A_EMAIL, USER_A_PASSWORD);
  console.log(`User A: ${userA.id}`);

  console.log("[2] Create address + order as User A");
  const addressId = await createAddress(userAClient);
  const orderId = await createOrder(userAClient, addressId);
  console.log(`Created address ${addressId} and order ${orderId}`);

  console.log("[3] Sign out User A");
  await signOut(userAClient);

  console.log("\n[4] Sign in as User B");
  const userBClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const userB = await signIn(userBClient, USER_B_EMAIL, USER_B_PASSWORD);
  console.log(`User B: ${userB.id}`);

  console.log("[5] Select profiles as User B");
  const ownProfileRows = await selectProfileById(userBClient, userB.id);
  assert(ownProfileRows.length === 1, "User B can read own profile");
  const userAProfileRows = await selectProfileById(userBClient, userA.id);
  console.log(`User B sees User A profile rows: ${userAProfileRows.length}`);

  console.log("[6] Select addresses as User B");
  const addresses = await selectAddresses(userBClient);
  console.log(`Addresses visible to User B: ${addresses.length}`);
  const hasUserAAddress = addresses.some((row) => row.user_id === userA.id);
  assert(!hasUserAAddress, "User B cannot see User A addresses");

  console.log("[7] Select orders as User B");
  const orders = await selectOrders(userBClient);
  console.log(`Orders visible to User B: ${orders.length}`);
  const hasUserAOrder = orders.some((row) => row.user_id === userA.id);
  assert(!hasUserAOrder, "User B cannot see User A orders");

  await signOut(userBClient);

  // ────────────────────────────────────────────────────────────────────
  // SECTION 2: Anon Public Reads + Negative Assertions
  // ────────────────────────────────────────────────────────────────────
  console.log("\n== Anon Assertions ==\n");

  console.log("[8] Public menu reads (anon)");
  const menuResults = await selectMenuPublic(anonClient);
  for (const table of Object.keys(menuResults)) {
    assert(!menuResults[table].error, `Anon can read ${table}`);
  }

  console.log("[9] Anon negative: order_audit_log");
  const { data: anonAuditData } = await anonClient.from("order_audit_log").select("id");
  assert(anonAuditData === null || anonAuditData.length === 0, "Anon cannot read order_audit_log");

  console.log("[10] Anon negative: orders");
  const { data: anonOrders } = await anonClient.from("orders").select("id");
  assert(anonOrders === null || anonOrders.length === 0, "Anon cannot read orders");

  console.log("[11] Anon negative: customer_settings");
  const { data: anonSettings } = await anonClient.from("customer_settings").select("id");
  assert(anonSettings === null || anonSettings.length === 0, "Anon cannot read customer_settings");

  // ────────────────────────────────────────────────────────────────────
  // SECTION 3: Driver Isolation (Driver A vs Driver B)
  // ────────────────────────────────────────────────────────────────────
  console.log("\n== Driver Isolation ==\n");

  console.log("[12] Sign in as Driver A");
  const driverAClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await signIn(driverAClient, DRIVER_A_EMAIL, DRIVER_A_PASSWORD);

  console.log("[13] Query drivers table as Driver A (own row)");
  const { data: driverARow } = await driverAClient.from("drivers").select("id").single();
  assert(driverARow !== null, "Driver A can read own driver row");
  const driverAId = driverARow?.id;
  console.log(`Driver A id: ${driverAId}`);

  console.log("[14] Query routes as Driver A");
  const { data: routesA } = await driverAClient.from("routes").select("id, driver_id");
  console.log(`Routes visible to Driver A: ${routesA?.length ?? 0}`);

  console.log("[15] Query driver_badges as Driver A");
  const { data: badgesA } = await driverAClient.from("driver_badges").select("id, driver_id");
  console.log(`Badges visible to Driver A: ${badgesA?.length ?? 0}`);

  await signOut(driverAClient);

  console.log("\n[16] Sign in as Driver B");
  const driverBClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await signIn(driverBClient, DRIVER_B_EMAIL, DRIVER_B_PASSWORD);

  console.log("[17] Query drivers table as Driver B (own row)");
  const { data: driverBRow } = await driverBClient.from("drivers").select("id").single();
  assert(driverBRow !== null, "Driver B can read own driver row");
  const driverBId = driverBRow?.id;
  console.log(`Driver B id: ${driverBId}`);

  console.log("[18] Query routes as Driver B");
  const { data: routesB } = await driverBClient.from("routes").select("id, driver_id");
  console.log(`Routes visible to Driver B: ${routesB?.length ?? 0}`);
  assert(!routesB?.some((r) => r.driver_id === driverAId), "Driver B cannot see Driver A routes");

  console.log("[19] Query driver_badges as Driver B");
  const { data: badgesB } = await driverBClient.from("driver_badges").select("id, driver_id");
  console.log(`Badges visible to Driver B: ${badgesB?.length ?? 0}`);
  assert(!badgesB?.some((b) => b.driver_id === driverAId), "Driver B cannot see Driver A badges");

  await signOut(driverBClient);

  // ────────────────────────────────────────────────────────────────────
  // SECTION 4: Admin Access
  // ────────────────────────────────────────────────────────────────────
  console.log("\n== Admin Access ==\n");

  console.log("[20] Sign in as Admin");
  const adminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await signIn(adminClient, ADMIN_EMAIL, ADMIN_PASSWORD);

  console.log("[21] Admin reads order_audit_log");
  const { data: auditLogs, error: auditError } = await adminClient
    .from("order_audit_log")
    .select("id")
    .limit(10);
  assert(auditLogs !== null && !auditError, "Admin can read order_audit_log");

  console.log("[22] Admin reads orders");
  const { data: adminOrders, error: ordersError } = await adminClient
    .from("orders")
    .select("id, user_id")
    .limit(50);
  assert(adminOrders !== null && !ordersError, "Admin can read orders");
  if (adminOrders) {
    console.log(`Orders visible to Admin: ${adminOrders.length}`);
  }

  console.log("[23] Admin reads customer_settings");
  const { data: adminSettings, error: settingsError } = await adminClient
    .from("customer_settings")
    .select("id")
    .limit(10);
  assert(adminSettings !== null && !settingsError, "Admin can read customer_settings");

  await signOut(adminClient);

  // ────────────────────────────────────────────────────────────────────
  // Results
  // ────────────────────────────────────────────────────────────────────
  console.log(`\nResults: ${failures} failure(s)`);
  if (failures > 0) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
