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
import { AuthRetryableFetchError } from "@supabase/supabase-js";
import type { DeliveryDayConfig, DeliveryZoneConfig } from "@/types/delivery";

// ---------------------------------------------------------------------------
// Supabase client mock — controllable auth user + address row + failures
// ---------------------------------------------------------------------------

let mockUser: { id: string } | null = null;
let mockUserError: Error | null = null;
let authGetUserCalls = 0;
let mockAddressRow: {
  lat: number | null;
  lng: number | null;
  distance_miles?: number | null;
  is_verified?: boolean;
} | null = null;
// PostgREST failures resolve {data: null, error} WITHOUT throwing — the mock
// mirrors that shape so the hook's error inspection is what's under test.
let mockAddressError: { message: string } | null = null;

const { captureException } = vi.hoisted(() => ({ captureException: vi.fn() }));
vi.mock("@sentry/nextjs", () => ({ captureException }));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => {
        authGetUserCalls += 1;
        return { data: { user: mockUser }, error: mockUserError };
      },
      // Local session read used by the SWR-cache seed's user check.
      getSession: async () => ({ data: { session: mockUser ? { user: mockUser } : null } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: async () => ({
                  data: mockAddressError ? null : mockAddressRow,
                  error: mockAddressError,
                }),
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

import {
  useCustomerDeliveryDays,
  __resetCustomerDeliveryDaysCache,
} from "../useCustomerDeliveryDays";

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
  mockUserError = null;
  mockAddressRow = null;
  mockAddressError = null;
  mockDirections = [];
  authGetUserCalls = 0;
  captureException.mockClear();
  __resetCustomerDeliveryDaysCache();
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

  it("an override address outranks the DB default and skips the fetch entirely", async () => {
    // DB default would personalize WEST — but the checkout-selected override
    // must win, and no auth/addresses round-trip may fire while it's present.
    mockUser = { id: "user-1" };
    mockAddressRow = VERIFIED_ROW;
    mockDirections = ["west"];

    const { result } = renderHook(() =>
      useCustomerDeliveryDays(DAYS, ZONES, 100, { lat: 34.2, lng: -117.5, distanceMiles: 12 })
    );

    // Directions mock applies to the override coords too (["west"]), so days
    // filter — the point under test is the fetch never ran.
    await waitFor(() => {
      expect(result.current.personalized).toBe(true);
    });
    expect(authGetUserCalls).toBe(0);
  });

  it("an out-of-coverage override falls back to the generic list", async () => {
    mockDirections = ["west"];
    const { result } = renderHook(() =>
      useCustomerDeliveryDays(DAYS, ZONES, 50, { lat: 34.2, lng: -117.5, distanceMiles: 80 })
    );

    await waitFor(() => {
      expect(ids(result.current.days)).toEqual(["mon", "wed", "sat"]);
    });
    expect(result.current.personalized).toBe(false);
  });

  it("never seeds one user's cached route for a DIFFERENT user (account switch)", async () => {
    // User A (west, verified) resolves and populates the module cache.
    mockUser = { id: "user-a" };
    mockAddressRow = VERIFIED_ROW;
    mockDirections = ["west"];
    const first = renderHook(() => useCustomerDeliveryDays(DAYS, ZONES, 100));
    await waitFor(() => {
      expect(first.result.current.personalized).toBe(true);
    });
    first.unmount();

    // User B signs in (no saved address) — A's cached west route must not
    // paint, and the final state must be the generic list.
    mockUser = { id: "user-b" };
    mockAddressRow = null;
    const second = renderHook(() => useCustomerDeliveryDays(DAYS, ZONES, 100));
    await waitFor(() => {
      expect(second.result.current.personalized).toBe(false);
    });
    expect(ids(second.result.current.days)).toEqual(["mon", "wed", "sat"]);
  });

  it("propagates admin edits to a day's schedule fields (same ids, new cutoff)", async () => {
    mockUser = { id: "user-1" };
    mockAddressRow = VERIFIED_ROW;
    mockDirections = ["west"];

    const { result, rerender } = renderHook(
      ({ days }: { days: DeliveryDayConfig[] }) => useCustomerDeliveryDays(days, ZONES, 100),
      { initialProps: { days: DAYS } }
    );
    await waitFor(() => {
      expect(result.current.personalized).toBe(true);
    });
    expect(result.current.days.find((d) => d.id === "wed")!.cutoffHour).toBe(23);

    // Same ids, edited cutoff hour — the id-only comparison used to keep the
    // stale objects until remount.
    const edited = DAYS.map((d) => (d.id === "wed" ? { ...d, cutoffHour: 12 } : d));
    rerender({ days: edited });

    await waitFor(() => {
      expect(result.current.days.find((d) => d.id === "wed")!.cutoffHour).toBe(12);
    });
  });

  it("falls back to the generic list when the only serving day is INACTIVE", async () => {
    // Admin disabled the West run but left the row: personalization must not
    // "succeed" with a list the delivery gate then empties.
    mockUser = { id: "user-1" };
    mockAddressRow = VERIFIED_ROW;
    mockDirections = ["west"];
    const days = [day("mon", 1, "east"), { ...day("wed", 3, "west"), isActive: false }];

    const { result } = renderHook(() => useCustomerDeliveryDays(days, ZONES, 100));

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

  it("a failed address refresh keeps the personalized route (no downgrade)", async () => {
    // maybeSingle resolves {data: null, error} without throwing on RLS /
    // PostgREST failures — an uninspected error used to publish "no address"
    // over a good resolution on every visibility refresh.
    mockUser = { id: "user-1" };
    mockAddressRow = VERIFIED_ROW;
    mockDirections = ["west"];
    const { result } = renderHook(() => useCustomerDeliveryDays(DAYS, ZONES, 100));
    await waitFor(() => {
      expect(result.current.personalized).toBe(true);
    });

    mockAddressError = { message: "permission denied for table addresses" };
    document.dispatchEvent(new Event("visibilitychange"));

    await waitFor(() => {
      expect(captureException).toHaveBeenCalled();
    });
    expect(result.current.personalized).toBe(true);
    expect(ids(result.current.days)).toEqual(["wed", "sat"]);
  });

  it("keeps the cached route across remounts while the read keeps failing", async () => {
    mockUser = { id: "user-1" };
    mockAddressRow = VERIFIED_ROW;
    mockDirections = ["west"];
    const first = renderHook(() => useCustomerDeliveryDays(DAYS, ZONES, 100));
    await waitFor(() => {
      expect(first.result.current.personalized).toBe(true);
    });
    first.unmount();

    // Same user remounts (e.g. drawer re-open) mid-outage: the seed paints
    // the cached route and the failing resolve must not overwrite it.
    mockAddressError = { message: "permission denied for table addresses" };
    const second = renderHook(() => useCustomerDeliveryDays(DAYS, ZONES, 100));
    await waitFor(() => {
      expect(second.result.current.personalized).toBe(true);
    });
    expect(ids(second.result.current.days)).toEqual(["wed", "sat"]);
    await waitFor(() => {
      expect(captureException).toHaveBeenCalled();
    });
    expect(second.result.current.personalized).toBe(true);
  });

  it("initial mount with a failing read stays fail-open generic", async () => {
    mockUser = { id: "user-1" };
    mockAddressError = { message: "permission denied for table addresses" };
    mockDirections = ["west"];

    const { result } = renderHook(() => useCustomerDeliveryDays(DAYS, ZONES, 100));

    await waitFor(() => {
      expect(captureException).toHaveBeenCalled();
    });
    expect(result.current.personalized).toBe(false);
    expect(ids(result.current.days)).toEqual(["mon", "wed", "sat"]);
  });

  it("never replays the PREVIOUS user's coords when the new user's read fails", async () => {
    // User A personalizes west; an account switch in another tab makes the
    // next refresh resolve user B, whose address read then FAILS. The refs
    // still hold A's coords — replaying them would paint A's route for B.
    mockUser = { id: "user-a" };
    mockAddressRow = VERIFIED_ROW;
    mockDirections = ["west"];
    const { result } = renderHook(() => useCustomerDeliveryDays(DAYS, ZONES, 100));
    await waitFor(() => {
      expect(result.current.personalized).toBe(true);
    });

    mockUser = { id: "user-b" };
    mockAddressError = { message: "permission denied for table addresses" };
    document.dispatchEvent(new Event("visibilitychange"));

    await waitFor(() => {
      expect(result.current.personalized).toBe(false);
    });
    expect(ids(result.current.days)).toEqual(["mon", "wed", "sat"]);
  });

  it("a network-failed auth check retains the route; a real sign-out downgrades", async () => {
    mockUser = { id: "user-1" };
    mockAddressRow = VERIFIED_ROW;
    mockDirections = ["west"];
    const { result } = renderHook(() => useCustomerDeliveryDays(DAYS, ZONES, 100));
    await waitFor(() => {
      expect(result.current.personalized).toBe(true);
    });

    // getUser resolves {user: null, error} on a network blip — "we don't
    // know" must not repaint the generic gate over a known route.
    mockUser = null;
    mockUserError = new AuthRetryableFetchError("fetch failed", 0);
    document.dispatchEvent(new Event("visibilitychange"));
    await waitFor(() => {
      expect(captureException).toHaveBeenCalled();
    });
    expect(result.current.personalized).toBe(true);
    expect(ids(result.current.days)).toEqual(["wed", "sat"]);

    // A definitive signed-out answer (no error) IS a downgrade.
    mockUserError = null;
    document.dispatchEvent(new Event("visibilitychange"));
    await waitFor(() => {
      expect(result.current.personalized).toBe(false);
    });
    expect(ids(result.current.days)).toEqual(["mon", "wed", "sat"]);
  });
});
