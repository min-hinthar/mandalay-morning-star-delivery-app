import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const mockMint = vi.fn();
vi.mock("../mint", () => ({
  mintLoyaltyPromoCode: (...args: unknown[]) => mockMint(...args),
}));

import { fillOrphanedMilestoneCodes } from "../fill-orphaned";

interface NeedsCodeRow {
  id: string;
  milestone: number;
  reward_cents: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function makeService(opts: {
  needsCode: NeedsCodeRow[];
  written?: (rowId: string) => { id: string }[];
}) {
  const written = opts.written ?? ((id: string) => [{ id }]);
  const updateIsCalls: [string, unknown][] = [];
  const loyaltyRewards = {
    select: vi.fn(() => {
      const q: any = {};
      q.eq = vi.fn(() => q);
      q.is = vi.fn(() => q);
      q.order = vi.fn(() => Promise.resolve({ data: opts.needsCode, error: null }));
      return q;
    }),
    update: vi.fn(() => {
      let rowId = "";
      const u: any = {};
      u.eq = vi.fn((col: string, val: string) => {
        if (col === "id") rowId = val;
        return u;
      });
      u.is = vi.fn((col: string, val: unknown) => {
        updateIsCalls.push([col, val]);
        return u;
      });
      u.select = vi.fn(() => Promise.resolve({ data: written(rowId), error: null }));
      return u;
    }),
  };
  const service = {
    from: vi.fn(() => loyaltyRewards),
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
  return { service: service as unknown as SupabaseClient<Database>, updateIsCalls };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockMint.mockResolvedValue({ code: "KYAYZU-TEST", expiresAt: "2026-08-01T00:00:00.000Z" });
});

describe("fillOrphanedMilestoneCodes", () => {
  it("returns [] when there are no null-code rows", async () => {
    const { service } = makeService({ needsCode: [] });
    expect(await fillOrphanedMilestoneCodes(service, "u1")).toEqual([]);
    expect(mockMint).not.toHaveBeenCalled();
  });

  it("mints each orphan at its OWN stored reward_cents and returns them ascending", async () => {
    const { service, updateIsCalls } = makeService({
      needsCode: [
        { id: "r5", milestone: 5, reward_cents: 500 },
        { id: "r10", milestone: 10, reward_cents: 1000 },
      ],
    });
    const filled = await fillOrphanedMilestoneCodes(service, "u1");

    expect(mockMint).toHaveBeenNthCalledWith(1, 500);
    expect(mockMint).toHaveBeenNthCalledWith(2, 1000);
    expect(filled.map((f) => f.milestone)).toEqual([5, 10]);
    expect(filled[1].rewardCents).toBe(1000);
    // The fill UPDATE carries the double-fill guard.
    expect(updateIsCalls).toContainEqual(["reward_code", null]);
  });

  it("excludes a row whose guarded fill lost the race (0 rows written)", async () => {
    const { service } = makeService({
      needsCode: [
        { id: "r5", milestone: 5, reward_cents: 500 },
        { id: "r10", milestone: 10, reward_cents: 500 },
      ],
      written: (rowId) => (rowId === "r10" ? [] : [{ id: rowId }]),
    });
    const filled = await fillOrphanedMilestoneCodes(service, "u1");

    expect(mockMint).toHaveBeenCalledTimes(2); // both minted (r10 wasted)
    expect(filled.map((f) => f.milestone)).toEqual([5]); // only the winner returned
  });
});
