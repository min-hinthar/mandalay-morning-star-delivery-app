import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";

const mockList = vi.fn();

vi.mock("@/lib/stripe/server", () => ({
  stripe: {
    promotionCodes: {
      list: (...args: unknown[]) => mockList(...args),
    },
  },
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: { exception: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { validatePromoCode } from "../promo";

describe("validatePromoCode", () => {
  beforeEach(() => {
    (mockList as Mock).mockReset();
  });

  it("returns the promotion code id + minimum for an amount-off coupon", async () => {
    mockList.mockResolvedValue({
      data: [
        {
          id: "promo_kyayzu123",
          restrictions: { minimum_amount: 5000 },
          promotion: { coupon: { id: "tUemWGp8", amount_off: 500, percent_off: null } },
        },
      ],
    });

    const result = await validatePromoCode("KYAYZU-ABC2345");
    expect(result).toEqual({
      valid: true,
      discountCents: 500,
      couponId: "tUemWGp8",
      promotionCodeId: "promo_kyayzu123",
      percentOff: null,
      minimumAmountCents: 5000,
      maxRedemptions: null,
      timesRedeemed: 0,
    });
  });

  it("carries percentOff and null minimum when unrestricted", async () => {
    mockList.mockResolvedValue({
      data: [
        {
          id: "promo_pct",
          restrictions: {},
          promotion: { coupon: { id: "cpn_pct", amount_off: null, percent_off: 15 } },
        },
      ],
    });

    const result = await validatePromoCode("SAVE15");
    expect(result).toMatchObject({
      valid: true,
      discountCents: 0,
      promotionCodeId: "promo_pct",
      percentOff: 15,
      minimumAmountCents: null,
    });
  });

  it("rejects an unknown code", async () => {
    mockList.mockResolvedValue({ data: [] });
    const result = await validatePromoCode("NOPE");
    expect(result.valid).toBe(false);
  });

  it("only queries active promotion codes (one-time codes drop off once redeemed/expired)", async () => {
    mockList.mockResolvedValue({ data: [] });
    await validatePromoCode("KYAYZU-XYZ");
    expect(mockList).toHaveBeenCalledWith(
      expect.objectContaining({ code: "KYAYZU-XYZ", active: true })
    );
  });
});
