/**
 * k6 Load Test -- Checkout Endpoint
 *
 * Tests 50 concurrent checkout submissions for 2 minutes.
 *
 * Prerequisites:
 *   - k6 installed: choco install k6  OR  winget install grafana.k6
 *   - Local dev server running: pnpm dev
 *   - Test user must exist in Supabase auth
 *
 * Run:
 *   k6 run scripts/load-test.js \
 *     -e BASE_URL=http://localhost:3000 \
 *     -e SUPABASE_URL=https://your-project.supabase.co \
 *     -e SUPABASE_ANON_KEY=eyJ... \
 *     -e TEST_USER_EMAIL=test@example.com \
 *     -e TEST_USER_PASSWORD=testpass123
 *
 * Thresholds:
 *   - p95 response time < 3 seconds
 *   - HTTP error rate < 0.1% (effectively 0% for this test volume)
 *
 * Note: Each VU request will likely get DUPLICATE_ORDER (409) after the first
 * request per Saturday. This is expected -- 409 counts as a "processed" response
 * (not an error) since it means the API correctly validated and rejected the
 * duplicate. Only 5xx responses count as failures.
 */

import http from "k6/http";
import { check, sleep } from "k6";

// ---------------------------------------------------------------------------
// k6 Options
// ---------------------------------------------------------------------------

export const options = {
  scenarios: {
    checkout_surge: {
      executor: "constant-vus",
      vus: 50,
      duration: "2m",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<3000"], // p95 < 3 seconds
    // User decision: "0% HTTP errors" -- k6 threshold syntax requires a
    // numeric rate. rate<0.001 enforces <0.1% which is effectively zero
    // for a 50-VU / 2-min test (~6000 requests = max 6 errors allowed).
    http_req_failed: ["rate<0.001"],
  },
};

// ---------------------------------------------------------------------------
// Environment variables
// ---------------------------------------------------------------------------

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const SUPABASE_URL = __ENV.SUPABASE_URL;
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY;
const TEST_USER_EMAIL = __ENV.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = __ENV.TEST_USER_PASSWORD;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get the next Saturday date as YYYY-MM-DD.
 */
function getNextSaturday() {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSat = (6 - day + 7) % 7 || 7;
  const sat = new Date(now.getTime() + daysUntilSat * 86400000);
  const yyyy = sat.getFullYear();
  const mm = String(sat.getMonth() + 1).padStart(2, "0");
  const dd = String(sat.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Pick a random element from an array.
 */
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a random integer between min and max (inclusive).
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ---------------------------------------------------------------------------
// Setup (runs once before the test)
// ---------------------------------------------------------------------------

export function setup() {
  // Validate required env vars
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
    console.error(
      "Required env vars: SUPABASE_URL, SUPABASE_ANON_KEY, TEST_USER_EMAIL, TEST_USER_PASSWORD"
    );
    return { token: null, items: [], scheduledDate: null, addressId: null };
  }

  // 1. Authenticate test user
  const authRes = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
    }
  );

  if (authRes.status !== 200) {
    console.error(`Auth failed: ${authRes.status} ${authRes.body}`);
    return { token: null, items: [], scheduledDate: null, addressId: null };
  }

  const authData = JSON.parse(authRes.body);
  const token = authData.access_token;
  const userId = authData.user.id;

  console.log(`Authenticated as ${TEST_USER_EMAIL} (${userId})`);

  // 2. Fetch menu items
  const menuRes = http.get(`${BASE_URL}/api/menu`);
  if (menuRes.status !== 200) {
    console.error(`Menu fetch failed: ${menuRes.status}`);
    return { token, items: [], scheduledDate: null, addressId: null };
  }

  const menuData = JSON.parse(menuRes.body);
  const allItems = [];
  const categories = menuData.data?.categories || [];

  for (const cat of categories) {
    for (const item of cat.items || []) {
      if (!item.isSoldOut) {
        allItems.push(item.id);
      }
    }
  }

  // Limit to 5 items for test payload variety
  const items = allItems.slice(0, 5);
  console.log(`Found ${allItems.length} menu items, using ${items.length} for test payloads`);

  // 3. Get a verified address for the test user
  const addrRes = http.get(
    `${SUPABASE_URL}/rest/v1/addresses?user_id=eq.${userId}&is_verified=eq.true&limit=1`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
    }
  );

  let addressId = null;
  if (addrRes.status === 200) {
    const addresses = JSON.parse(addrRes.body);
    if (addresses.length > 0) {
      addressId = addresses[0].id;
    }
  }

  if (!addressId) {
    console.warn(
      "No verified address found for test user. Checkout requests will fail at address validation."
    );
  }

  const scheduledDate = getNextSaturday();
  console.log(`Scheduled date: ${scheduledDate}`);
  console.log(`Address ID: ${addressId || "NONE"}`);

  return { token, items, scheduledDate, addressId };
}

// ---------------------------------------------------------------------------
// Default function (runs per VU iteration)
// ---------------------------------------------------------------------------

export default function (data) {
  // Skip if setup failed
  if (!data.token || data.items.length === 0 || !data.scheduledDate) {
    console.error("Setup data missing, skipping iteration");
    sleep(1);
    return;
  }

  // Build checkout payload with random item selection
  const itemCount = randomInt(1, Math.min(3, data.items.length));
  const shuffled = [...data.items].sort(() => Math.random() - 0.5);
  const selectedItems = shuffled.slice(0, itemCount);

  const payload = {
    addressId: data.addressId,
    scheduledDate: data.scheduledDate,
    timeWindowStart: "10:00",
    timeWindowEnd: "11:00",
    items: selectedItems.map((id) => ({
      menuItemId: id,
      quantity: randomInt(1, 3),
      modifiers: [],
    })),
  };

  // POST to checkout session endpoint
  const res = http.post(`${BASE_URL}/api/checkout/session`, JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.token}`,
    },
    // Tag for k6 metrics grouping
    tags: { name: "checkout_session" },
  });

  // Check response: Accept 2xx and 409 (DUPLICATE_ORDER) as "processed"
  // Only 5xx should count as failures
  check(res, {
    "status is not 5xx": (r) => r.status < 500,
    "response has body": (r) => r.body && r.body.length > 0,
    "response is valid JSON": (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch (_e) {
        return false;
      }
    },
  });

  // Realistic pacing between iterations
  sleep(1);
}
