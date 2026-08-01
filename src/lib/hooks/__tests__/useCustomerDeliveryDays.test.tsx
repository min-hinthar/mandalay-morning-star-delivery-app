/**
 * useCustomerDeliveryDays — personalized pre-checkout day list.
 *
 * Contracts:
 * - Anonymous / unverified / out-of-coverage / no-serve all FAIL OPEN to the
 *   unfiltered day list with personalized:false (generic-but-true countdown
 *   beats a wrong or missing one while browsing).
 * - A verified, in-coverage address filters days with the same
 *   addressServesDay rule checkout enforces, and resolves awareness for the
 *   route-day headline.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { DeliveryDayConfig, DeliveryZoneConfig } from "@/types/delivery";

// ---------------------------------------------------------------------------
// Supabase client mock — controllable auth user + address row
// ---------------------------------------------------------------------------

let mockUser: { id: string } | null = null;
let mockAddressRow: {
  lat: number | null;
  lng: number | null;
  distance_miles?: number | null;
  is_verified?: boolean;
} | null = null;

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: mockUser } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: async () => ({ data: mockAddressRow }),
              }),
            }),
          }),
        }),
      }),
    }),
  }),
}));

// Direction resolution controlled per-test; the filtering itself stays real.
let mockDirections: Array<"east" | "west" | "south"> = [];
vi.mock("@/lib/utils/delivery-zones", async () => {
  const actual = await vi.importActual<typeof import("@/lib/utils/delivery-zones")>(
    "@/lib/utils/delivery-zones"
  );
  return {
    ...actual,
    getDirectionsForCoords: () => mockDirections,
  };
});

import { useCustomerDeliveryDays } from "../useCustomerDeliveryDays";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const day = (
  id: string,
  dayOfWeek: number,
  direction: DeliveryDayConfig["direction"]
): DeliveryDayConfig => ({
  id,
  dayOfWeek,
  isActive: true,
  cutoffDay: dayOfWeek,
  cutoffHour: 23,
  deliveryFeeCents: 1500,
  displayOrder: 0,
  direction,
});

const DAYS: DeliveryDayConfig[] = [
  day("mon", 1, "east"),
  day("wed", 3, "west"),
  day("sat", 6, "all"),
];

const ZONES: DeliveryZoneConfig[] = [
  { id: "z-east", direction: "east", bearingStart: 45, bearingEnd: 135, referenceCities: [] },
];

const VERIFIED_ROW = { lat: 34.1, lng: -117.9, distance_miles: 10, is_verified: true };

beforeEach(() => {
  mockUser = null;
  mockAddressRow = null;
  mockDirections = [];
});

function ids(days: DeliveryDayConfig[]): string[] {
  return days.map((d) => d.id);
}

describe("useCustomerDeliveryDays", () => {
  it("anonymous visitor keeps the unfiltered day list", async () => {
    const { result } = renderHook(() => useCustomerDeliveryDays(DAYS, ZONES, 100));

    await waitFor(() => {
      expect(result.current.personalized).toBe(false);
    });
    expect(ids(result.current.days)).toEqual(["mon", "wed", "sat"]);
  });

  it("verified west address filters to the days that serve it (Wed + Sat/all)", async () => {
    mockUser = { id: "user-1" };
    mockAddressRow = VERIFIED_ROW;
    mockDirections = ["west"];

    const { result } = renderHook(() => useCustomerDeliveryDays(DAYS, ZONES, 100));

    await waitFor(() => {
      expect(result.current.personalized).toBe(true);
    });
    expect(ids(result.current.days)).toEqual(["wed", "sat"]);
    expect(result.current.awareness).not.toBeNull();
  });

  it("UNVERIFIED address never personalizes (checkout would reject it)", async () => {
    mockUser = { id: "user-1" };
    mockAddressRow = { ...VERIFIED_ROW, is_verified: false };
    mockDirections = ["west"];

    const { result } = renderHook(() => useCustomerDeliveryDays(DAYS, ZONES, 100));

    await waitFor(() => {
      expect(ids(result.current.days)).toEqual(["mon", "wed", "sat"]);
    });
    expect(result.current.personalized).toBe(false);
  });

  it("out-of-coverage distance falls back to the generic list", async () => {
    mockUser = { id: "user-1" };
    mockAddressRow = { ...VERIFIED_ROW, distance_miles: 80 };
    mockDirections = ["west"];

    const { result } = renderHook(() => useCustomerDeliveryDays(DAYS, ZONES, 50));

    await waitFor(() => {
      expect(ids(result.current.days)).toEqual(["mon", "wed", "sat"]);
    });
    expect(result.current.personalized).toBe(false);
  });

  it("a filter that leaves nothing falls back rather than showing a dead countdown", async () => {
    mockUser = { id: "user-1" };
    mockAddressRow = VERIFIED_ROW;
    mockDirections = ["south"]; // no south day and Sat is the only 'all'
    const directionalOnly = [day("mon", 1, "east"), day("wed", 3, "west")];

    const { result } = renderHook(() => useCustomerDeliveryDays(directionalOnly, ZONES, 100));

    await waitFor(() => {
      expect(ids(result.current.days)).toEqual(["mon", "wed"]);
    });
    expect(result.current.personalized).toBe(false);
  });

  it("nearby address (empty directions) keeps every day, personalized", async () => {
    mockUser = { id: "user-1" };
    mockAddressRow = VERIFIED_ROW;
    mockDirections = [];

    const { result } = renderHook(() => useCustomerDeliveryDays(DAYS, ZONES, 100));

    await waitFor(() => {
      expect(result.current.personalized).toBe(true);
    });
    expect(ids(result.current.days)).toEqual(["mon", "wed", "sat"]);
  });
});
