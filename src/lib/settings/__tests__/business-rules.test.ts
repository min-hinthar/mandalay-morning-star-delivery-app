import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/cache unstable_cache as passthrough
vi.mock("next/cache", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unstable_cache: (fn: (...args: any[]) => any) => fn,
}));

// Mock supabase client — now fetches from app_settings, delivery_days, AND delivery_zones
const mockSettingsReturns = vi.fn();
const mockDeliveryDaysReturns = vi.fn();
const mockDeliveryZonesReturns = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createPublicClient: () => ({ from: mockFrom }),
}));

// Import after mocks
import {
  getBusinessRules,
  getDeliveryPricingConfig,
  BUSINESS_RULES_DEFAULTS,
} from "../business-rules";

/** Helper to wire up mockFrom for both tables */
function setupMocks(
  settingsData: { key: string; value: unknown }[] | null,
  settingsError: { message: string } | null,
  deliveryDaysData:
    | {
        id: string;
        day_of_week: number;
        is_active: boolean;
        cutoff_day: number;
        cutoff_hour: number;
        delivery_fee_cents: number;
        display_order: number;
      }[]
    | null = [],
  deliveryDaysError: { message: string } | null = null
) {
  mockFrom.mockImplementation((table: string) => {
    if (table === "app_settings") {
      return {
        select: () => ({
          eq: () => ({ returns: mockSettingsReturns }),
        }),
      };
    }
    if (table === "delivery_days") {
      return {
        select: () => ({
          order: () => ({ returns: mockDeliveryDaysReturns }),
        }),
      };
    }
    if (table === "delivery_zones") {
      return {
        select: () => ({ returns: mockDeliveryZonesReturns }),
      };
    }
    return { select: () => ({ eq: () => ({ returns: vi.fn() }) }) };
  });

  mockSettingsReturns.mockResolvedValue({ data: settingsData, error: settingsError });
  mockDeliveryDaysReturns.mockResolvedValue({
    data: deliveryDaysData,
    error: deliveryDaysError,
  });
  mockDeliveryZonesReturns.mockResolvedValue({ data: [], error: null });
}

describe("getBusinessRules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all fields with correct types when DB has data", async () => {
    setupMocks(
      [
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
        { key: "cod_enabled", value: true },
      ],
      null,
      [
        {
          id: "d1",
          day_of_week: 6,
          is_active: true,
          cutoff_day: 5,
          cutoff_hour: 15,
          delivery_fee_cents: 1500,
          display_order: 0,
        },
      ]
    );

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
      codEnabled: true,
      deliveryDays: [
        {
          id: "d1",
          dayOfWeek: 6,
          isActive: true,
          cutoffDay: 5,
          cutoffHour: 15,
          deliveryFeeCents: 1500,
          displayOrder: 0,
          direction: "all",
        },
      ],
      longDistanceFeeCents: 2000,
      longDistanceThresholdMiles: 25,
      deliveryZones: [],
      // New keys absent from DB → fall back to defaults
      deliveryFeeBands: BUSINESS_RULES_DEFAULTS.deliveryFeeBands,
      extendedDeliveryEnabled: true,
      extendedDeliveryPerMileCents: 150,
      maxDeliveryRadiusMiles: 100,
    });
  });

  it("returns BUSINESS_RULES_DEFAULTS when DB query returns error", async () => {
    setupMocks(null, { message: "connection error" }, null, { message: "connection error" });

    const rules = await getBusinessRules();
    expect(rules).toEqual(BUSINESS_RULES_DEFAULTS);
  });

  it("returns BUSINESS_RULES_DEFAULTS when DB returns null data", async () => {
    setupMocks(null, null, null);

    const rules = await getBusinessRules();
    expect(rules).toEqual(BUSINESS_RULES_DEFAULTS);
  });

  it("maps DB snake_case keys to camelCase correctly", async () => {
    setupMocks(
      [
        { key: "base_delivery_fee_cents", value: 2000 },
        { key: "free_delivery_threshold_cents", value: 15000 },
        { key: "max_delivery_duration_minutes", value: 90 },
      ],
      null
    );

    const rules = await getBusinessRules();
    expect(rules.deliveryFeeCents).toBe(2000);
    expect(rules.freeDeliveryThresholdCents).toBe(15000);
    expect(rules.maxDeliveryDurationMinutes).toBe(90);
  });

  it("uses fallback defaults for missing individual keys (partial data)", async () => {
    setupMocks(
      [
        { key: "cutoff_day", value: 3 },
        { key: "delivery_start_hour", value: 9 },
      ],
      null
    );

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
    setupMocks(
      [
        { key: "cutoff_day", value: 5 },
        { key: "some_unknown_key", value: 999 },
      ],
      null
    );

    const rules = await getBusinessRules();
    expect(rules.cutoffDay).toBe(5);
    // 15 original fields + 4 graduated-pricing fields (deliveryFeeBands,
    // extendedDeliveryEnabled, extendedDeliveryPerMileCents, maxDeliveryRadiusMiles)
    expect(Object.keys(rules)).toHaveLength(19);
  });

  it("parses graduated bands + long-distance config from DB", async () => {
    setupMocks(
      [
        { key: "delivery_fee_bands", value: [{ maxMiles: 35, feeCents: 1800 }] },
        { key: "extended_delivery_enabled", value: false },
        { key: "extended_delivery_per_mile_cents", value: 200 },
        { key: "max_delivery_radius_miles", value: 80 },
      ],
      null
    );

    const rules = await getBusinessRules();
    expect(rules.deliveryFeeBands).toEqual([{ maxMiles: 35, feeCents: 1800 }]);
    expect(rules.extendedDeliveryEnabled).toBe(false);
    expect(rules.extendedDeliveryPerMileCents).toBe(200);
    expect(rules.maxDeliveryRadiusMiles).toBe(80);
  });
});

describe("getDeliveryPricingConfig", () => {
  it("clamps maxRadius up to the standard ceiling so no band is priced-but-rejected", () => {
    // A band reaches 80mi but maxRadius is only 60 — the config must lift maxRadius to 80.
    const cfg = getDeliveryPricingConfig({
      ...BUSINESS_RULES_DEFAULTS,
      deliveryFeeBands: [{ maxMiles: 80, feeCents: 4000 }],
      deliveryRadiusMiles: 50,
      maxDeliveryRadiusMiles: 60,
    });
    expect(cfg.maxRadiusMiles).toBe(80);
  });

  it("clamps maxRadius to the 100mi hard cap regardless of stored value", () => {
    const cfg = getDeliveryPricingConfig({
      ...BUSINESS_RULES_DEFAULTS,
      maxDeliveryRadiusMiles: 250,
    });
    expect(cfg.maxRadiusMiles).toBe(100);
  });

  it("applies the per-day local fee override to localFeeCents only", () => {
    const cfg = getDeliveryPricingConfig(BUSINESS_RULES_DEFAULTS, { localFeeCents: 999 });
    expect(cfg.localFeeCents).toBe(999);
    expect(cfg.standardRadiusMiles).toBe(BUSINESS_RULES_DEFAULTS.deliveryRadiusMiles);
  });
});
