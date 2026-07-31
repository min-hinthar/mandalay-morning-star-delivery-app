import { describe, expect, it } from "vitest";
import { toSnakeCaseKeys, updateSettingsSchema } from "../settings";

/**
 * The admin settings PATCH used to validate NOTHING.
 *
 * `updateSettingsSchema` typed `settings` as a pass-through record and checked
 * the category with `deliverySettingsBaseSchema.partial().safeParse(...)`. The
 * client sends camelCase; the schema is keyed snake_case; `z.object` is
 * non-strict, so every key was STRIPPED rather than rejected and the parse
 * returned `success: true` with `data: {}`. The refine always passed. Meanwhile
 * the route snake-cased keys in its STORAGE loop and wrote them — so storage
 * and validation used different conventions and only storage was real.
 *
 * These pin the fix (one shared normalizer, applied before the category check)
 * and, just as importantly, that every payload the app actually sends still
 * parses — this is a behavior change on a live admin path.
 */

function parse(category: string, settings: Record<string, unknown>) {
  return updateSettingsSchema.safeParse({ category, settings });
}

describe("toSnakeCaseKeys", () => {
  it("converts top-level camelCase keys", () => {
    expect(toSnakeCaseKeys({ extendedMinOrderCents: 10_000 })).toEqual({
      extended_min_order_cents: 10_000,
    });
  });

  it("is idempotent — callers already mix conventions", () => {
    // DeliveryDaysManager PATCHes { cod_enabled } in snake_case while
    // SettingsClient sends camelCase, so this runs over both.
    const once = toSnakeCaseKeys({ cod_enabled: true, codEnabled: false });
    expect(toSnakeCaseKeys(once)).toEqual(once);
  });

  it("does NOT touch nested keys", () => {
    // Band items are camelCase in the stored value (verified against
    // app_settings.delivery_fee_bands). A deep conversion would rewrite them to
    // max_miles/fee_cents and reject every bands save.
    const out = toSnakeCaseKeys({
      deliveryFeeBands: [{ maxMiles: 30, feeCents: 2000 }],
      deliveryZones: [{ name: "East", feeCents: 0, description: "" }],
    });
    expect(out.delivery_fee_bands).toEqual([{ maxMiles: 30, feeCents: 2000 }]);
    expect(out.delivery_zones).toEqual([{ name: "East", feeCents: 0, description: "" }]);
  });
});

describe("updateSettingsSchema — real payloads still parse", () => {
  it("the full delivery form object", () => {
    const result = parse("delivery", {
      deliveryRadiusMiles: 50,
      minimumOrderCents: 2500,
      freeDeliveryThresholdCents: 10_000,
      baseDeliveryFeeCents: 1500,
      cutoffDay: 5,
      cutoffHour: 15,
      deliveryStartHour: 11,
      deliveryEndHour: 19,
      maxDeliveryDurationMinutes: 60,
      extendedMinOrderCents: 10_000,
      extendedDeliveryEnabled: true,
      extendedDeliveryPerMileCents: 150,
      maxDeliveryRadiusMiles: 100,
      deliveryFeeBands: [
        { maxMiles: 30, feeCents: 2000 },
        { maxMiles: 40, feeCents: 2500 },
        { maxMiles: 50, feeCents: 3000 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("DeliveryDaysManager's already-snake_case { cod_enabled }", () => {
    const result = parse("delivery", { cod_enabled: true });
    expect(result.success).toBe(true);
    expect(result.success && result.data.settings).toEqual({ cod_enabled: true });
  });

  it("the notifications kill switch, which is now described rather than tolerated", () => {
    const result = parse("notifications", { emailSendingEnabled: false });
    expect(result.success).toBe(true);
    expect(result.success && result.data.settings).toEqual({ email_sending_enabled: false });
  });

  it("the full operations object including weekly store hours", () => {
    const day = { open: "09:00", close: "17:00", closed: false };
    const result = parse("operations", {
      maxStopsPerRoute: 20,
      autoAssignEnabled: true,
      storeHours: {
        monday: day,
        tuesday: day,
        wednesday: day,
        thursday: day,
        friday: day,
        saturday: day,
        sunday: { ...day, closed: true },
      },
    });
    expect(result.success).toBe(true);
  });
});

describe("updateSettingsSchema — bounds now actually reject", () => {
  it("rejects an extended minimum above the $500 cap", () => {
    // Previously accepted: the camelCase key never matched the snake_case
    // schema, so the value was stripped and the refine passed.
    expect(parse("delivery", { extendedMinOrderCents: 100_000 }).success).toBe(false);
  });

  it("rejects a base minimum above the admin form's own $100 cap", () => {
    expect(parse("delivery", { minimumOrderCents: 50_000 }).success).toBe(false);
    expect(parse("delivery", { minimumOrderCents: 10_000 }).success).toBe(true);
  });

  it("rejects a negative delivery fee", () => {
    expect(parse("delivery", { baseDeliveryFeeCents: -100 }).success).toBe(false);
  });

  it("rejects an out-of-range cutoff hour", () => {
    expect(parse("delivery", { cutoffHour: 99 }).success).toBe(false);
  });

  it("rejects a malformed fee band", () => {
    expect(parse("delivery", { deliveryFeeBands: [{ maxMiles: 0, feeCents: 10 }] }).success).toBe(
      false
    );
  });

  it("rejects a wrong-typed value", () => {
    expect(parse("delivery", { extendedDeliveryEnabled: "yes" }).success).toBe(false);
  });

  it("accepts a delivery zone under EITHER fee-key convention", () => {
    // The schema was written `fee_cents` but the admin client's DeliveryZone
    // type is `feeCents`, and nothing in the app emits `fee_cents`. Now that
    // this schema is live, requiring one convention would 400 the other.
    const zone = { name: "East", description: "East side" };
    expect(parse("delivery", { deliveryZones: [{ ...zone, feeCents: 0 }] }).success).toBe(true);
    expect(parse("delivery", { deliveryZones: [{ ...zone, fee_cents: 0 }] }).success).toBe(true);
    // But a zone with no fee at all is still wrong.
    expect(parse("delivery", { deliveryZones: [zone] }).success).toBe(false);
  });

  it("still accepts an empty zones array, which is what the client sends today", () => {
    expect(parse("delivery", { deliveryZones: [] }).success).toBe(true);
  });
});

describe("updateSettingsSchema — errors name the offending field", () => {
  it("reports the snake_case path, not a blanket category message", () => {
    const result = parse("delivery", { extendedMinOrderCents: 100_000 });
    expect(result.success).toBe(false);
    if (result.success) return;

    const paths = result.error.issues.map((i) => i.path.join("."));
    expect(paths).toContain("settings.extended_min_order_cents");
    // The old refine produced exactly one issue with this message and no path.
    expect(
      result.error.issues.every((i) => i.message !== "Invalid settings for the specified category")
    ).toBe(true);
  });

  it("reports every bad field, not just the first", () => {
    const result = parse("delivery", { cutoffHour: 99, baseDeliveryFeeCents: -1 });
    expect(result.success).toBe(false);
    if (result.success) return;

    const paths = result.error.issues.map((i) => i.path.join("."));
    expect(paths).toContain("settings.cutoff_hour");
    expect(paths).toContain("settings.base_delivery_fee_cents");
  });

  it("survives error.flatten(), which the route still returns as details", () => {
    // flatten() keys only off path[0], so every one of these lands in a single
    // `fieldErrors.settings` bucket — which is why the route ALSO builds a
    // readable per-field string for the admin toast rather than relying on it.
    const result = parse("delivery", { cutoffHour: 99, baseDeliveryFeeCents: -1 });
    if (result.success) return;

    const flat = result.error.flatten();
    expect(Object.keys(flat.fieldErrors)).toEqual(["settings"]);
    expect(flat.fieldErrors.settings!.length).toBeGreaterThanOrEqual(2);
  });
});

describe("updateSettingsSchema — an unknown category fails cleanly", () => {
  it("returns a validation failure rather than throwing", () => {
    // If this ever THREW instead, safeParse would not trap it (a TypeError is
    // not a ZodError) and the route's outer catch would answer 500 to what is
    // plainly a malformed request.
    expect(() => parse("bogus", { minimumOrderCents: 2500 })).not.toThrow();
    expect(parse("bogus", { minimumOrderCents: 2500 }).success).toBe(false);
  });

  it("survives a non-string category", () => {
    expect(() => updateSettingsSchema.safeParse({ category: 123, settings: {} })).not.toThrow();
  });
});

describe("updateSettingsSchema — validated keys are the STORED keys", () => {
  it("returns snake_case settings so the route stores what was checked", () => {
    // The route's storage loop no longer converts keys itself; it writes
    // `result.data.settings` directly. If this ever returned camelCase again,
    // storage and validation would silently diverge for a second time.
    const result = parse("delivery", { extendedMinOrderCents: 7500, cutoffDay: 5 });
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(Object.keys(result.data.settings).every((k) => !/[A-Z]/.test(k))).toBe(true);
    expect(result.data.settings).toEqual({ extended_min_order_cents: 7500, cutoff_day: 5 });
  });
});
