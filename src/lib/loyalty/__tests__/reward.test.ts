import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// ── Mocks ────────────────────────────────────────────────────────────
// loyaltyStatsForUser drives milestone math; mock it to control order count/spend.
const mockStats = vi.fn();
vi.mock("../tier", () => ({
  loyaltyStatsForUser: (...args: unknown[]) => mockStats(...args),
}));

// mintLoyaltyPromoCode hits Stripe — mock it and assert the amount it's asked for.
const mockMint = vi.fn();
vi.mock("../mint", () => ({
  mintLoyaltyPromoCode: (...args: unknown[]) => mockMint(...args),
}));

const mockPush = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/push/send", () => ({ sendPushToUser: (...a: unknown[]) => mockPush(...a) }));

const mockSend = vi.fn().mockResolvedValue({ data: { id: "email-1" }, error: null });
vi.mock("@/lib/email/client", () => ({
  getResendClient: () => ({ emails: { send: mockSend } }),
}));

// Don't render the real email tree — capture the element's props so we can assert
// what the milestone email is built with (tier badge, amount, milestone).
/* eslint-disable @typescript-eslint/no-explicit-any */
let lastEmailProps: Record<string, any> | null = null;
vi.mock("@react-email/render", () => ({
  render: vi.fn((el: any) => {
    if (el?.props) lastEmailProps = el.props;
    return Promise.resolve("<html>");
  }),
}));
/* eslint-enable @typescript-eslint/no-explicit-any */

vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), exception: vi.fn() },
}));

import { maybeIssueMilestoneReward } from "../reward";
import { LOYALTY_TIERS } from "..";

// ── Fake Supabase service client ─────────────────────────────────────
// Routes the three loyalty_rewards operations the function performs (claim
// insert, "needs a code" select, guarded code-fill update) plus the profile read.

interface NeedsCodeRow {
  id: string;
  milestone: number;
  reward_cents: number;
}

function makeService(opts: {
  needsCode: NeedsCodeRow[];
  /** Rows returned by the guarded update — default fills (1 row); [] simulates a lost race. */
  written?: (rowId: string) => { id: string }[];
  profile?: { email: string | null; full_name: string | null };
}) {
  const written = opts.written ?? ((id: string) => [{ id }]);
  const profile = opts.profile ?? { email: "c@example.com", full_name: "Ko Ko" };
  const insert = vi.fn().mockResolvedValue({ data: null, error: null });
  // Record the (col, val) pairs the guarded UPDATE filters on, so a test can prove
  // the `.is("reward_code", null)` double-fill guard is actually present.
  const updateIsCalls: [string, unknown][] = [];

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const loyaltyRewards = {
    insert,
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

  const profiles = {
    select: vi.fn(() => {
      const p: any = {};
      p.eq = vi.fn(() => p);
      p.maybeSingle = vi.fn(() => Promise.resolve({ data: profile, error: null }));
      return p;
    }),
  };

  const service = {
    from: vi.fn((table: string) => {
      if (table === "loyalty_rewards") return loyaltyRewards;
      if (table === "profiles") return profiles;
      throw new Error(`unexpected table: ${table}`);
    }),
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
  return { service: service as unknown as SupabaseClient<Database>, insert, updateIsCalls };
}

beforeEach(() => {
  vi.clearAllMocks();
  lastEmailProps = null;
  mockMint.mockResolvedValue({ code: "KYAYZU-TEST", expiresAt: "2026-08-01T00:00:00.000Z" });
});

describe("maybeIssueMilestoneReward", () => {
  it("mints a code and notifies for a freshly reached milestone", async () => {
    mockStats.mockResolvedValue({ orderCount: 5, spendCents: 0 }); // milestone [5], tier reward 500
    const { service, insert, updateIsCalls } = makeService({
      needsCode: [{ id: "r5", milestone: 5, reward_cents: 500 }],
    });

    await maybeIssueMilestoneReward(service, "u1");

    expect(insert).toHaveBeenCalledTimes(1); // claimed milestone 5
    expect(mockMint).toHaveBeenCalledTimes(1);
    expect(mockMint).toHaveBeenCalledWith(500);
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledTimes(1);
    // The fill UPDATE must carry the double-fill guard.
    expect(updateIsCalls).toContainEqual(["reward_code", null]);
  });

  it("emails the tier matching the reward's OWN amount, not the current higher tier", async () => {
    // Customer is now a high spender, but the orphan is a $5 (New Friend) reward.
    mockStats.mockResolvedValue({ orderCount: 5, spendCents: 200_000 });
    const { service } = makeService({
      needsCode: [{ id: "r5", milestone: 5, reward_cents: 500 }],
    });

    await maybeIssueMilestoneReward(service, "u1");

    const expectedTier = LOYALTY_TIERS.find((t) => t.rewardCents === 500);
    expect(expectedTier).toBeDefined();
    expect(lastEmailProps?.rewardCents).toBe(500);
    expect(lastEmailProps?.tierName).toBe(expectedTier?.name);
  });

  it("self-heals: fills a prior orphan (claimed, null code) even with no NEW milestone", async () => {
    // orderCount 6 → milestonesReached = [5], already claimed (insert is a dup no-op),
    // but the row was orphaned with no code by a prior failed mint.
    mockStats.mockResolvedValue({ orderCount: 6, spendCents: 0 });
    const { service } = makeService({
      needsCode: [{ id: "r5", milestone: 5, reward_cents: 500 }],
    });

    await maybeIssueMilestoneReward(service, "u1");

    expect(mockMint).toHaveBeenCalledTimes(1); // the orphan finally gets a code
    expect(mockSend).toHaveBeenCalledTimes(1); // and the customer is finally told
  });

  it("is a no-op when every claimed milestone already has a code", async () => {
    mockStats.mockResolvedValue({ orderCount: 7, spendCents: 0 });
    const { service } = makeService({ needsCode: [] });

    await maybeIssueMilestoneReward(service, "u1");

    expect(mockMint).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("does not notify when a concurrent runner won the guarded fill", async () => {
    mockStats.mockResolvedValue({ orderCount: 5, spendCents: 0 });
    const { service } = makeService({
      needsCode: [{ id: "r5", milestone: 5, reward_cents: 500 }],
      written: () => [], // the .is('reward_code', null) guard matched 0 rows
    });

    await maybeIssueMilestoneReward(service, "u1");

    expect(mockMint).toHaveBeenCalledTimes(1); // we minted (wasted, harmless)
    expect(mockSend).not.toHaveBeenCalled(); // but didn't claim the row, so no email
  });

  it("notifies for the highest FILLED milestone when a higher one loses its fill race", async () => {
    // Two rows need codes [5, 10]; the higher (r10) loses the guarded fill, r5 wins.
    mockStats.mockResolvedValue({ orderCount: 10, spendCents: 0 });
    const { service } = makeService({
      needsCode: [
        { id: "r5", milestone: 5, reward_cents: 500 },
        { id: "r10", milestone: 10, reward_cents: 500 },
      ],
      written: (rowId) => (rowId === "r10" ? [] : [{ id: rowId }]),
    });

    await maybeIssueMilestoneReward(service, "u1");

    expect(mockMint).toHaveBeenCalledTimes(2); // both minted (r10's code wasted)
    expect(mockSend).toHaveBeenCalledTimes(1); // one email
    // Features milestone 5 (highest FILLED), not 10 (needed but lost the race).
    expect(mockSend.mock.calls[0][0].subject).toContain("5 orders in");
  });

  it("recovers an orphan at its OWN stored reward_cents, not the current tier amount", async () => {
    // Customer is now a high spender (tier reward 1200), but the orphan was earned
    // back when it was a 500 reward — it must mint 500, not 1200.
    mockStats.mockResolvedValue({ orderCount: 5, spendCents: 200_000 });
    const { service } = makeService({
      needsCode: [{ id: "r5", milestone: 5, reward_cents: 500 }],
    });

    await maybeIssueMilestoneReward(service, "u1");

    expect(mockMint).toHaveBeenCalledWith(500);
  });
});
