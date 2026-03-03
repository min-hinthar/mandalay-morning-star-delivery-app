import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/cache unstable_cache as passthrough
vi.mock("next/cache", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unstable_cache: (fn: (...args: any[]) => any) => fn,
}));

// Mock supabase client
const mockReturns = vi.fn();
const mockEq = vi.fn(() => ({ returns: mockReturns }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock("@/lib/supabase/server", () => ({
  createPublicClient: () => ({ from: mockFrom }),
}));

// Import after mocks
import { getBusinessRules, BUSINESS_RULES_DEFAULTS } from "../business-rules";

describe("getBusinessRules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ returns: mockReturns });
  });

  it("returns all 10 fields with correct types when DB has data", async () => {
    mockReturns.mockResolvedValue({
      data: [
        { key: "cutoff_day", value: 5 },
        { key: "cutoff_hour", value: 15 },
        { key: "base_delivery_fee_cents", value: 1500 },
        { key: "free_delivery_threshold_cents", value: 10000 },
        { key: "delivery_start_hour", value: 11 },
        { key: "delivery_end_hour", value: 19 },
        { key: "delivery_radius_miles", value: 40 },
        { key: "max_delivery_duration_minutes", value: 60 },
        { key: "minimum_order_cents", value: 2500 },
        { key: "prep_time_buffer_minutes", value: 30 },
      ],
      error: null,
    });

    const rules = await getBusinessRules();

    expect(rules).toEqual({
      cutoffDay: 5,
      cutoffHour: 15,
      deliveryFeeCents: 1500,
      freeDeliveryThresholdCents: 10000,
      deliveryStartHour: 11,
      deliveryEndHour: 19,
      deliveryRadiusMiles: 40,
      maxDeliveryDurationMinutes: 60,
      minimumOrderCents: 2500,
      prepTimeBufferMinutes: 30,
    });
  });

  it("returns BUSINESS_RULES_DEFAULTS when DB query returns error", async () => {
    mockReturns.mockResolvedValue({
      data: null,
      error: { message: "connection error" },
    });

    const rules = await getBusinessRules();
    expect(rules).toEqual(BUSINESS_RULES_DEFAULTS);
  });

  it("returns BUSINESS_RULES_DEFAULTS when DB returns null data", async () => {
    mockReturns.mockResolvedValue({
      data: null,
      error: null,
    });

    const rules = await getBusinessRules();
    expect(rules).toEqual(BUSINESS_RULES_DEFAULTS);
  });

  it("maps DB snake_case keys to camelCase correctly", async () => {
    mockReturns.mockResolvedValue({
      data: [
        { key: "base_delivery_fee_cents", value: 2000 },
        { key: "free_delivery_threshold_cents", value: 15000 },
        { key: "max_delivery_duration_minutes", value: 90 },
      ],
      error: null,
    });

    const rules = await getBusinessRules();
    expect(rules.deliveryFeeCents).toBe(2000);
    expect(rules.freeDeliveryThresholdCents).toBe(15000);
    expect(rules.maxDeliveryDurationMinutes).toBe(90);
  });

  it("uses fallback defaults for missing individual keys (partial data)", async () => {
    mockReturns.mockResolvedValue({
      data: [
        { key: "cutoff_day", value: 3 },
        { key: "delivery_start_hour", value: 9 },
      ],
      error: null,
    });

    const rules = await getBusinessRules();
    // Provided values used
    expect(rules.cutoffDay).toBe(3);
    expect(rules.deliveryStartHour).toBe(9);
    // Missing values fall back to defaults
    expect(rules.cutoffHour).toBe(BUSINESS_RULES_DEFAULTS.cutoffHour);
    expect(rules.deliveryFeeCents).toBe(BUSINESS_RULES_DEFAULTS.deliveryFeeCents);
    expect(rules.deliveryEndHour).toBe(BUSINESS_RULES_DEFAULTS.deliveryEndHour);
    expect(rules.deliveryRadiusMiles).toBe(BUSINESS_RULES_DEFAULTS.deliveryRadiusMiles);
    expect(rules.maxDeliveryDurationMinutes).toBe(
      BUSINESS_RULES_DEFAULTS.maxDeliveryDurationMinutes
    );
    expect(rules.minimumOrderCents).toBe(BUSINESS_RULES_DEFAULTS.minimumOrderCents);
    expect(rules.freeDeliveryThresholdCents).toBe(
      BUSINESS_RULES_DEFAULTS.freeDeliveryThresholdCents
    );
  });

  it("ignores unrecognized DB keys", async () => {
    mockReturns.mockResolvedValue({
      data: [
        { key: "cutoff_day", value: 5 },
        { key: "some_unknown_key", value: 999 },
      ],
      error: null,
    });

    const rules = await getBusinessRules();
    expect(rules.cutoffDay).toBe(5);
    // Should not have any unexpected fields
    expect(Object.keys(rules)).toHaveLength(10);
  });
});
