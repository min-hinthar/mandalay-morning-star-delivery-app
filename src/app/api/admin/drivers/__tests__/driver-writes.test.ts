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
vi.mock("@/lib/auth", () => ({ requireAdmin: vi.fn() }));

import { PATCH, DELETE } from "../[id]/route";
import { POST as CREATE_DRIVER } from "../route";

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

/**
 * Service client whose UPDATE resolves to `rows` (mimics a zero-match RLS
 * result). `laterRows`, when given, answers every call AFTER the first — PATCH
 * writes `drivers` then `profiles`, so it can model one landing and one not.
 */
function mockServiceClient(
  rows: Array<Record<string, unknown>> | null,
  laterRows?: Array<Record<string, unknown>> | null
) {
  let call = 0;
  // `.update().eq().select("id")` is awaited directly in some handlers and
  // `.maybeSingle()`d in others — return a thenable that supports both.
  const select = vi.fn().mockImplementation(() => {
    const answer = call++ === 0 || laterRows === undefined ? rows : laterRows;
    const p = Promise.resolve({ data: answer, error: null }) as Promise<unknown> & {
      maybeSingle?: () => Promise<unknown>;
    };
    p.maybeSingle = () => Promise.resolve({ data: answer?.[0] ?? null, error: null });
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

  // The driver write commits first, so a failed profile write must NOT 500 —
  // but "Driver updated successfully" would then be a partial truth about a
  // name the admin watched not save.
  it("does not report unqualified success when the profile half saved nothing", async () => {
    mockAuthClient();
    mockServiceClient([{ id: DRIVER_ID }], []);

    const res = await PATCH(makeReq({ vehicleType: "van", fullName: "New Name" }), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.profileSaved).toBe(false);
    expect(body.message).not.toMatch(/^Driver updated successfully$/);
  });

  it("reports plain success when both halves landed", async () => {
    mockAuthClient();
    mockServiceClient([{ id: DRIVER_ID }]);

    const body = await (
      await PATCH(makeReq({ vehicleType: "van", fullName: "New Name" }), params)
    ).json();

    expect(body.profileSaved).toBe(true);
    expect(body.message).toMatch(/updated successfully/i);
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

// ---------------------------------------------------------------------------
// POST /admin/drivers — profile promotion (the write whose silent failure left
// drivers unable to sign in).
// ---------------------------------------------------------------------------

import { requireAdmin } from "@/lib/auth";

/**
 * Auth-client mock for the create path: an existing profile, and whether that
 * user already has a drivers row.
 */
function mockCreateContext(opts: {
  profile: { id: string; role: string } | null;
  existingDriver: { id: string; is_active?: boolean } | null;
  insertedDriverId?: string;
}) {
  const from = vi.fn((table: string) => {
    if (table === "profiles") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: opts.profile, error: null }),
          }),
        }),
      };
    }
    if (table === "drivers") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: opts.existingDriver, error: null }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: opts.insertedDriverId ?? "new-driver" },
              error: null,
            }),
          }),
        }),
      };
    }
    return { select: vi.fn(), insert: vi.fn() };
  });
  vi.mocked(requireAdmin).mockResolvedValue({
    success: true,
    userId: "admin-1",
    supabase: { from },
  } as never);
}

/** Service client for the create path: promotion result + a delete spy. */
function mockPromoteClient(promotedRows: Array<{ id: string }> | null) {
  const del = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  // `.update().eq()` is awaited bare for the heal path's vehicle-detail write
  // and `.select("id")`d for the role promotion — return a thenable carrying
  // `select` so both shapes resolve.
  const eq = vi.fn().mockImplementation(() => {
    const p = Promise.resolve({ data: promotedRows, error: null }) as Promise<unknown> & {
      select?: () => Promise<unknown>;
    };
    p.select = () => Promise.resolve({ data: promotedRows, error: null });
    return p;
  });
  const update = vi.fn().mockReturnValue({ eq });
  const from = vi.fn(() => ({ update, delete: del }));
  createServiceClient.mockReturnValue({ from });
  return { from, update, del };
}

function createReq(body: unknown) {
  return new Request("http://localhost/api/admin/drivers", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  }) as unknown as NextRequest;
}

const NEW_DRIVER_BODY = {
  email: "d@example.com",
  fullName: "Dee Driver",
  phone: "6265551234",
  vehicleType: "car",
};

describe("POST /admin/drivers — profile promotion", () => {
  beforeEach(() => vi.clearAllMocks());

  it("promotes the profile through the SERVICE client (RLS blocks the caller's)", async () => {
    mockCreateContext({ profile: { id: "u-1", role: "customer" }, existingDriver: null });
    const { from, update } = mockPromoteClient([{ id: "u-1" }]);

    const res = await CREATE_DRIVER(createReq(NEW_DRIVER_BODY));

    expect(res.status).toBe(201);
    expect(createServiceClient).toHaveBeenCalled();
    expect(from).toHaveBeenCalledWith("profiles");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ role: "driver", full_name: "Dee Driver" })
    );
  });

  it("500s AND rolls back the orphan driver row when the promotion matches no rows", async () => {
    mockCreateContext({
      profile: { id: "u-1", role: "customer" },
      existingDriver: null,
      insertedDriverId: "orphan-1",
    });
    const { from, del } = mockPromoteClient([]);

    const res = await CREATE_DRIVER(createReq(NEW_DRIVER_BODY));

    expect(res.status).toBe(500);
    // Without the rollback the drivers row survives and every retry 409s.
    expect(from).toHaveBeenCalledWith("drivers");
    expect(del).toHaveBeenCalled();
  });

  it("repairs an account left stuck by the RLS bug instead of 409ing", async () => {
    // driver row exists, profile role never got promoted — the exact wreckage
    // the old code produced, which re-adding used to reject outright.
    mockCreateContext({
      profile: { id: "u-1", role: "customer" },
      existingDriver: { id: "existing-driver" },
    });
    const { update } = mockPromoteClient([{ id: "u-1" }]);

    const res = await CREATE_DRIVER(createReq(NEW_DRIVER_BODY));

    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ role: "driver" }));
    expect((await res.json()).message).toMatch(/repaired/i);
    // "Repaired" must honour the form: the pre-existing drivers row keeps its
    // stale vehicle_type/license_plate otherwise, and correcting those is a
    // plausible reason the admin re-submitted at all.
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ vehicle_type: "car" }));
  });

  it("still 409s a genuine duplicate (driver row AND driver role)", async () => {
    mockCreateContext({
      profile: { id: "u-1", role: "driver" },
      existingDriver: { id: "existing-driver" },
    });
    mockPromoteClient([{ id: "u-1" }]);

    const res = await CREATE_DRIVER(createReq(NEW_DRIVER_BODY));

    expect(res.status).toBe(409);
  });

  // `profiles.role` is a single enum, so "promote to driver" is also "strip
  // admin". Under the old RLS-scoped write that was a silent no-op; with the
  // service client it would really demote them, from a form that gives no
  // warning. Refuse in BOTH create paths.
  it("refuses to demote an admin when no drivers row exists yet", async () => {
    mockCreateContext({ profile: { id: "u-1", role: "admin" }, existingDriver: null });
    const { update } = mockPromoteClient([{ id: "u-1" }]);

    const res = await CREATE_DRIVER(createReq(NEW_DRIVER_BODY));

    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/admin/i);
    expect(update).not.toHaveBeenCalled();
  });

  it("refuses to demote an admin on the heal path too", async () => {
    mockCreateContext({
      profile: { id: "u-1", role: "admin" },
      existingDriver: { id: "existing-driver" },
    });
    const { update } = mockPromoteClient([{ id: "u-1" }]);

    const res = await CREATE_DRIVER(createReq(NEW_DRIVER_BODY));

    expect(res.status).toBe(409);
    expect(update).not.toHaveBeenCalled();
  });

  // `phone` is OPTIONAL in createDriverSchema, so `phone ?? null` would WIPE a
  // stored number on any re-submit that omits it — silent data loss on a
  // request that reports success. Absent means "leave it alone".
  it("does not null a stored phone when the form omits one", async () => {
    mockCreateContext({ profile: { id: "u-1", role: "customer" }, existingDriver: null });
    const { update } = mockPromoteClient([{ id: "u-1" }]);
    const { phone: _omitted, ...noPhone } = NEW_DRIVER_BODY;

    await CREATE_DRIVER(createReq(noPhone));

    for (const call of update.mock.calls) {
      expect(call[0]).not.toHaveProperty("phone");
    }
  });

  it("still writes the phone when one IS submitted", async () => {
    mockCreateContext({ profile: { id: "u-1", role: "customer" }, existingDriver: null });
    const { update } = mockPromoteClient([{ id: "u-1" }]);

    await CREATE_DRIVER(createReq(NEW_DRIVER_BODY));

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ phone: "6265551234" }));
  });

  // Re-adding through the add-driver form IS a request to have them driving, so
  // reactivating is right — but it must be said, not done silently to a
  // deliberate archive.
  it("says so when the heal path reactivates an archived driver", async () => {
    mockCreateContext({
      profile: { id: "u-1", role: "customer" },
      existingDriver: { id: "existing-driver", is_active: false },
    });
    mockPromoteClient([{ id: "u-1" }]);

    const body = await (await CREATE_DRIVER(createReq(NEW_DRIVER_BODY))).json();

    expect(body.reactivated).toBe(true);
    expect(body.message).toMatch(/reactivated/i);
  });

  it("does not claim a reactivation when the driver was already active", async () => {
    mockCreateContext({
      profile: { id: "u-1", role: "customer" },
      existingDriver: { id: "existing-driver", is_active: true },
    });
    mockPromoteClient([{ id: "u-1" }]);

    const body = await (await CREATE_DRIVER(createReq(NEW_DRIVER_BODY))).json();

    expect(body.reactivated).toBe(false);
    expect(body.message).not.toMatch(/reactivated/i);
  });
});
