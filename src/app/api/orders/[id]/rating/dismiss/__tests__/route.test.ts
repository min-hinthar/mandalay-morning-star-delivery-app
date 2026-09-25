/**
 * POST /api/orders/[id]/rating/dismiss — the rating prompt's dismissal.
 *
 * The banner used to write orders.rating_dismissed through the browser client,
 * which no customer UPDATE policy admits for a delivered order: 0 rows, no
 * error, and the prompt came back on every load. The route writes it with the
 * service client, pinned to the caller's own delivered order.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const ORDER_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ limited: false }),
  apiWriteLimiter: {},
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { exception: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const { createClient, createServiceClient } = vi.hoisted(() => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient, createServiceClient }));

import { POST } from "../route";

type Call = [string, ...unknown[]];

function chain(result: unknown, calls: Call[]) {
  const proxy: unknown = new Proxy(
    {},
    {
      get(_t, prop: string) {
        if (prop === "then") return (resolve: (v: unknown) => void) => resolve(result);
        return (...args: unknown[]) => {
          calls.push([prop, ...args]);
          return proxy;
        };
      },
    }
  );
  return proxy;
}

function setup(user: { id: string } | null, writeResult: unknown) {
  const calls: Call[] = [];
  createClient.mockResolvedValue({
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user }, error: user ? null : { message: "no session" } }),
    },
  });
  createServiceClient.mockReturnValue({
    from: vi.fn((table: string) => {
      calls.push(["from", table]);
      return chain(writeResult, calls);
    }),
  });
  return calls;
}

const call = (id = ORDER_ID) =>
  POST(new Request("http://localhost/x", { method: "POST" }), { params: Promise.resolve({ id }) });

describe("POST /api/orders/[id]/rating/dismiss", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets rating_dismissed on the caller's own delivered order only", async () => {
    const calls = setup({ id: USER_ID }, { data: [{ id: ORDER_ID }], error: null });

    const res = await call();

    expect(res.status).toBe(200);
    expect(calls).toEqual([
      ["from", "orders"],
      ["update", { rating_dismissed: true }],
      ["eq", "id", ORDER_ID],
      ["eq", "user_id", USER_ID],
      ["eq", "status", "delivered"],
      ["select", "id"],
    ]);
  });

  it("returns 404 when nothing matched (not theirs, or not delivered)", async () => {
    setup({ id: USER_ID }, { data: [], error: null });
    expect((await call()).status).toBe(404);
  });

  it("returns 500 when the write errors", async () => {
    setup({ id: USER_ID }, { data: null, error: { message: "boom" } });
    expect((await call()).status).toBe(500);
  });

  it("returns 401 without a session and never writes", async () => {
    const calls = setup(null, { data: [], error: null });
    expect((await call()).status).toBe(401);
    expect(calls).toEqual([]);
  });

  it("returns 400 for a malformed order id", async () => {
    const calls = setup({ id: USER_ID }, { data: [], error: null });
    expect((await call("not-a-uuid")).status).toBe(400);
    expect(calls).toEqual([]);
  });
});
