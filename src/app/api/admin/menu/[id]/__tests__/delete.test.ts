/**
 * DELETE /api/admin/menu/[id] — photo cleanup through the Storage API.
 *
 * The photo used to be removed by a BEFORE DELETE trigger doing DELETE FROM
 * storage.objects, which Supabase storage rejects outright, so an item with a
 * photo could never be deleted (500). The trigger is dropped
 * (20260925180000 §9); the route deletes the row, then removes the object
 * through the Storage API, best-effort.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const ITEM_ID = "44444444-4444-4444-8444-444444444444";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ limited: false }),
  adminLimiter: {},
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { exception: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const { requireAdmin } = vi.hoisted(() => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAdmin }));

import { DELETE } from "../route";
import { logger } from "@/lib/utils/logger";

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

function setup(deleteResult: unknown, removeResult: unknown = { data: [], error: null }) {
  const calls: Call[] = [];
  const remove = vi.fn().mockResolvedValue(removeResult);
  const storageFrom = vi.fn(() => ({ remove }));
  requireAdmin.mockResolvedValue({
    success: true,
    userId: "admin-1",
    supabase: {
      from: vi.fn((table: string) => {
        calls.push(["from", table]);
        // order_items count probe → no orders; menu_items delete → deleteResult
        return chain(table === "order_items" ? { count: 0, error: null } : deleteResult, calls);
      }),
      storage: { from: storageFrom },
    },
  });
  return { calls, remove, storageFrom };
}

const call = () =>
  DELETE(new Request("http://localhost/x"), { params: Promise.resolve({ id: ITEM_ID }) });

describe("DELETE /api/admin/menu/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes the row, then removes its photo through the Storage API", async () => {
    const { calls, remove, storageFrom } = setup({
      data: [
        {
          image_url:
            "https://proj.supabase.co/storage/v1/object/public/menu-photos/items/mohinga%20bowl.webp",
        },
      ],
      error: null,
    });

    const res = await call();

    expect(res.status).toBe(200);
    expect(calls).toContainEqual(["delete"]);
    expect(calls).toContainEqual(["eq", "id", ITEM_ID]);
    expect(calls).toContainEqual(["select", "image_url"]);
    expect(storageFrom).toHaveBeenCalledWith("menu-photos");
    expect(remove).toHaveBeenCalledWith(["items/mohinga bowl.webp"]);
  });

  it("skips storage when the item had no photo", async () => {
    const { remove } = setup({ data: [{ image_url: null }], error: null });
    expect((await call()).status).toBe(200);
    expect(remove).not.toHaveBeenCalled();
  });

  it("still succeeds (and logs) when the photo removal fails — the row is gone", async () => {
    setup(
      {
        data: [{ image_url: "https://x/storage/v1/object/public/menu-photos/a.jpg" }],
        error: null,
      },
      { data: null, error: { message: "storage down" } }
    );
    expect((await call()).status).toBe(200);
    expect(logger.warn).toHaveBeenCalled();
  });

  it("returns 404 when nothing was deleted", async () => {
    const { remove } = setup({ data: [], error: null });
    expect((await call()).status).toBe(404);
    expect(remove).not.toHaveBeenCalled();
  });

  it("returns 500 on a delete error and never touches storage", async () => {
    const { remove } = setup({ data: null, error: { message: "boom" } });
    expect((await call()).status).toBe(500);
    expect(remove).not.toHaveBeenCalled();
  });
});
