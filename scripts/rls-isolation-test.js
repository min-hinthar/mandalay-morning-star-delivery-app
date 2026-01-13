#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const USER_A_EMAIL = process.env.USER_A_EMAIL;
const USER_A_PASSWORD = process.env.USER_A_PASSWORD;
const USER_B_EMAIL = process.env.USER_B_EMAIL;
const USER_B_PASSWORD = process.env.USER_B_PASSWORD;

function requireEnv(value, name) {
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
}

requireEnv(SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL');
requireEnv(SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY');
requireEnv(USER_A_EMAIL, 'USER_A_EMAIL');
requireEnv(USER_A_PASSWORD, 'USER_A_PASSWORD');
requireEnv(USER_B_EMAIL, 'USER_B_EMAIL');
requireEnv(USER_B_PASSWORD, 'USER_B_PASSWORD');

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

async function createAddress(client) {
  const { data, error } = await client
    .from('addresses')
    .insert({
      label: 'RLS Test',
      street_address: '123 Test St',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94105',
      is_default: true,
      is_verified: false,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Create address failed: ${error.message}`);
  }

  return data.id;
}

async function createOrder(client, addressId) {
  const { data, error } = await client
    .from('orders')
    .insert({
      address_id: addressId,
      subtotal_cents: 0,
      delivery_fee_cents: 0,
      tax_cents: 0,
      total_cents: 0,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Create order failed: ${error.message}`);
  }

  return data.id;
}

async function selectAddresses(client) {
  const { data, error } = await client.from('addresses').select('id, user_id, label');
  if (error) {
    throw new Error(`Select addresses failed: ${error.message}`);
  }
  return data;
}

async function selectOrders(client) {
  const { data, error } = await client.from('orders').select('id, user_id, status');
  if (error) {
    throw new Error(`Select orders failed: ${error.message}`);
  }
  return data;
}

async function selectProfileById(client, id) {
  const { data, error } = await client.from('profiles').select('id, role, email').eq('id', id);
  if (error) {
    throw new Error(`Select profile failed: ${error.message}`);
  }
  return data;
}

async function selectMenuPublic(client) {
  const tables = [
    'menu_categories',
    'menu_items',
    'modifier_groups',
    'modifier_options',
    'item_modifier_groups',
  ];

  const results = {};
  for (const table of tables) {
    const { data, error } = await client.from(table).select('*').limit(1);
    if (error) {
      results[table] = { error: error.message };
    } else {
      results[table] = { count: data.length };
    }
  }

  return results;
}

async function run() {
  console.log('RLS Isolation Test');

  console.log('\n[1] Sign in as User A');
  const userAClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const userA = await signIn(userAClient, USER_A_EMAIL, USER_A_PASSWORD);
  console.log(`User A: ${userA.id}`);

  console.log('[2] Create address + order as User A');
  const addressId = await createAddress(userAClient);
  const orderId = await createOrder(userAClient, addressId);
  console.log(`Created address ${addressId} and order ${orderId}`);

  console.log('[3] Sign out User A');
  await signOut(userAClient);

  console.log('\n[4] Sign in as User B');
  const userBClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const userB = await signIn(userBClient, USER_B_EMAIL, USER_B_PASSWORD);
  console.log(`User B: ${userB.id}`);

  console.log('[5] Select profiles as User B');
  const ownProfileRows = await selectProfileById(userBClient, userB.id);
  console.log(`User B can read own profile: ${ownProfileRows.length === 1}`);
  const userAProfileRows = await selectProfileById(userBClient, userA.id);
  console.log(`User B can read User A profile: ${userAProfileRows.length > 0}`);

  console.log('[6] Select addresses as User B');
  const addresses = await selectAddresses(userBClient);
  console.log(`Addresses visible to User B: ${addresses.length}`);
  const hasUserAAddress = addresses.some((row) => row.user_id === userA.id);
  console.log(`User B can see User A address: ${hasUserAAddress}`);

  console.log('[7] Select orders as User B');
  const orders = await selectOrders(userBClient);
  console.log(`Orders visible to User B: ${orders.length}`);
  const hasUserAOrder = orders.some((row) => row.user_id === userA.id);
  console.log(`User B can see User A order: ${hasUserAOrder}`);

  console.log('[8] Public menu reads (anon)');
  const menuResults = await selectMenuPublic(anonClient);
  console.log(menuResults);

  console.log('\nDone. Expect User B cannot see User A data.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
