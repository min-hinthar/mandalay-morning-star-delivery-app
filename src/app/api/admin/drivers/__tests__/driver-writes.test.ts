/**
 * Admin driver mutations — RLS bypass + affected-row verification.
 *
 * RLS grants UPDATE on `drivers` and `profiles` only to the row's OWNER:
 *
 *   drivers_update  USING (user_id = auth.uid())
 *   profiles_update USING (id       = auth.uid())
 *
 * — neither carries an is_admin() clause, unlike the matching insert/delete/
 * select policies. So every admin write through the caller-scoped client
 * matched ZERO rows. The activate toggle 500'd (it used .single()); everything
 * else had no .select(), so a zero-row update carried no error and the
 * endpoints reported success while changing nothing:
 *
 *   - PATCH  /admin/drivers/[id]  (field edit)   → 200, nothing saved
 *   - DELETE /admin/drivers/[id]                 → 200 "deleted", still active
 *   - POST   /admin/drivers/[id]/archive         → 200 "archived", still active
 *   - POST   /admin/drivers      (existing user) → driver row created, but the
 *                                                  profile never became a
 *                                                  driver, so the person could
 *                                                  not sign in to the driver app
 *
 * These tests pin both halves of the fix: writes go through the SERVICE client,
 * and every write verifies its affected rows instead of assuming success.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const DRIVER_ID = "44444444-4444-4444-8444-444444444444";

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ limited: false }),
  adminLimiter: {},
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { exception: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const { createClient, createServiceClient } = vi.hoisted(() => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient, createServiceClient }));

import { PATCH, DELETE } from "../[id]/route";

/** Auth client: an authenticated admin, plus the pre-write driver lookup. */
function mockAuthClient(driverRow: Record<string, unknown> | null = { user_id: "u-1" }) {
  const from = vi.fn((table: string) => {
    if (table === "profiles") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            returns: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null }),
            }),
          }),
        }),
      };
    }
    if (table === "drivers") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            returns: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: driverRow, error: null }),
            }),
            single: vi.fn().mockResolvedValue({ data: driverRow, error: null }),
          }),
        }),
      };
    }
    if (table === "routes") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      };
    }
    return { select: vi.fn(), update: vi.fn() };
  });
  createClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null }),
    },
    from,
  });
  return from;
}

/** Service client whose UPDATE resolves to `rows` (mimics a zero-match RLS result). */
function mockServiceClient(rows: Array<Record<string, unknown>> | null) {
  // `.update().eq().select("id")` is awaited directly in some handlers and
  // `.maybeSingle()`d in others — return a thenable that supports both.
  const select = vi.fn().mockImplementation(() => {
    const p = Promise.resolve({ data: rows, error: null }) as Promise<unknown> & {
      maybeSingle?: () => Promise<unknown>;
    };
    p.maybeSingle = () => Promise.resolve({ data: rows?.[0] ?? null, error: null });
    return p;
  });
  const update = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select }) });
  const from = vi.fn(() => ({ update }));
  createServiceClient.mockReturnValue({ from });
  return { from, update };
}

function makeReq(body: unknown): NextRequest {
  return new Request("http://localhost/api/admin/drivers/x", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  }) as unknown as NextRequest;
}

const params = { params: Promise.resolve({ id: DRIVER_ID }) };

describe("admin driver writes — service client + row verification", () => {
  beforeEach(() => vi.clearAllMocks());

  it("activate toggle writes through the SERVICE client, not the RLS-scoped one", async () => {
    mockAuthClient();
    const { from } = mockServiceClient([{ id: DRIVER_ID, is_active: true }]);

    const res = await PATCH(makeReq({ isActive: true }), params);

    expect(res.status).toBe(200);
    // The write must have gone to the service client — under RLS the caller's
    // own client matches zero rows.
    expect(createServiceClient).toHaveBeenCalled();
    expect(from).toHaveBeenCalledWith("drivers");
    expect(await res.json()).toMatchObject({ isActive: true });
  });

  it("toggle reports 404 when no row matched — never a silent success", async () => {
    mockAuthClient();
    mockServiceClient([]);

    const res = await PATCH(makeReq({ isActive: false }), params);

    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/not found/i);
  });

  it("DELETE reports 404 when the soft-delete matched no rows", async () => {
    mockAuthClient();
    mockServiceClient([]);

    const res = await DELETE(
      new Request("http://localhost/api/admin/drivers/x", {
        method: "DELETE",
      }) as unknown as NextRequest,
      params
    );

    expect(res.status).toBe(404);
  });

  it("DELETE succeeds through the service client when a row matched", async () => {
    mockAuthClient();
    mockServiceClient([{ id: DRIVER_ID }]);

    const res = await DELETE(
      new Request("http://localhost/api/admin/drivers/x", {
        method: "DELETE",
      }) as unknown as NextRequest,
      params
    );

    expect(res.status).toBe(200);
    expect(createServiceClient).toHaveBeenCalled();
  });
});
