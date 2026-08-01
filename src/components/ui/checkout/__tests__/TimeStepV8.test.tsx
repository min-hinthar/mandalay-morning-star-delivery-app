/**
 * TimeStepV8 — day-selection integrity.
 *
 * Behavioral contracts under test:
 * 1. A placed address only sees direction-filtered dates — and when the filter
 *    leaves NOTHING, the step renders an honest empty state instead of falling
 *    back to the unfiltered list (the old fallback offered days the server
 *    rejects at Place Order with a direction mismatch).
 * 2. An already-selected date is REVALIDATED when the address changes: a date
 *    the new address's route doesn't serve is reseated to the first valid date
 *    with a visible notice (never silently, never left stale).
 * 3. A nearby address (empty directions array) keeps every day.
 * 4. No-serve clears any stored selection so Continue can't carry a stale date.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";
import { useCheckoutStore } from "@/lib/stores/checkout-store";
import type { Address } from "@/types/address";
import type { DeliveryDayConfig, DeliveryZoneConfig } from "@/types/delivery";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("framer-motion", () => {
  function motionComp(tag: string) {
    const Comp = ({ children, ...props }: Record<string, unknown>) => {
      const filtered: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(props)) {
        if (
          k === "className" ||
          k === "style" ||
          k === "onClick" ||
          k === "role" ||
          k === "disabled" ||
          k.startsWith("data-") ||
          k.startsWith("aria-")
        ) {
          filtered[k] = v;
        }
      }
      const Tag = tag as unknown as React.ElementType;
      return <Tag {...filtered}>{children as React.ReactNode}</Tag>;
    };
    Comp.displayName = `motion.${tag}`;
    return Comp;
  }
  const proxy = new Proxy({}, { get: (_t, p) => motionComp(String(p)) });
  return {
    m: proxy,
    motion: proxy,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock("@/lib/hooks/useAnimationPreference", () => ({
  useAnimationPreference: () => ({ shouldAnimate: false, getSpring: (v: unknown) => v }),
}));

// Direction resolution is controlled per-test; everything else in the module
// (filterDaysByDirection, addressServesDay) stays REAL so the filtering under
// test is the production logic.
let mockDirections: Array<"east" | "west" | "south"> | undefined = undefined;
vi.mock("@/lib/utils/delivery-zones", async () => {
  const actual = await vi.importActual<typeof import("@/lib/utils/delivery-zones")>(
    "@/lib/utils/delivery-zones"
  );
  return {
    ...actual,
    getDirectionsForCoords: () => mockDirections ?? [],
  };
});

// CtaMagnet pulls the hero magnetic-motion stack (useSpring et al.) — pass-through.
vi.mock("../CtaMagnet", () => ({
  CtaMagnet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Light TimeSlotPicker stub that exposes the offered dates for assertions.
vi.mock("../TimeSlotPicker", () => ({
  TimeSlotPicker: ({
    availableDates,
  }: {
    availableDates: Array<{ dateString: string; cutoffPassed: boolean }>;
  }) => (
    <div data-testid="time-slot-picker">
      {availableDates.map((d) => (
        <span key={d.dateString} data-testid={`date-${d.dateString}`} />
      ))}
    </div>
  ),
}));

import { TimeStepV8 } from "../TimeStepV8";
import { getZonedDayOfWeek } from "@/lib/utils/delivery-dates";

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
  // Same-day 23:00 cutoff keeps every upcoming date orderable regardless of
  // what wall-clock time the test runs at.
  cutoffDay: dayOfWeek,
  cutoffHour: 23,
  deliveryFeeCents: 1500,
  displayOrder: 0,
  direction,
});

// Mon=east, Wed=west, Thu=south, Sat=all — mirrors the production config.
const DELIVERY_DAYS: DeliveryDayConfig[] = [
  day("mon", 1, "east"),
  day("wed", 3, "west"),
  day("thu", 4, "south"),
  day("sat", 6, "all"),
];

// Zones only need to be non-empty for the component to attempt placement;
// direction resolution itself is mocked above.
const ZONES: DeliveryZoneConfig[] = [
  { id: "z-east", direction: "east", bearingStart: 45, bearingEnd: 135, referenceCities: [] },
];

const TIME_WINDOWS = [
  { start: "10:00", end: "12:00", label: "Morning" },
  { start: "12:00", end: "14:00", label: "Midday" },
];

const ADDRESS: Address = {
  id: "addr-1",
  userId: "user-1",
  label: "Home",
  line1: "1 Main St",
  line2: null,
  city: "Covina",
  state: "CA",
  postalCode: "91723",
  formattedAddress: "1 Main St, Covina, CA 91723",
  lat: 34.09,
  lng: -117.89,
  isDefault: true,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  distanceMiles: 5,
};

function renderStep() {
  return render(
    <TimeStepV8 timeWindows={TIME_WINDOWS} deliveryDays={DELIVERY_DAYS} deliveryZones={ZONES} />
  );
}

function offeredDays(): number[] {
  return screen
    .getAllByTestId(/^date-/)
    .map((el) => el.getAttribute("data-testid")!.replace("date-", ""))
    .map((ds) => getZonedDayOfWeek(new Date(`${ds}T12:00:00-07:00`)));
}

beforeEach(() => {
  mockDirections = undefined;
  act(() => {
    useCheckoutStore.setState({
      step: "time",
      address: ADDRESS,
      addressId: ADDRESS.id,
      delivery: null,
    });
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TimeStepV8 — direction-filtered day offering", () => {
  it("offers only the days that serve a routed address (west → Wed + Sat/all)", () => {
    mockDirections = ["west"];
    renderStep();

    const days = offeredDays();
    expect(days.length).toBeGreaterThan(0);
    expect(days.every((d) => d === 3 || d === 6)).toBe(true);
    expect(days).toContain(3);
    expect(days).toContain(6);
  });

  it("keeps EVERY day for a nearby address (empty directions array)", () => {
    mockDirections = [];
    renderStep();

    const days = [...new Set(offeredDays())].sort();
    expect(days).toEqual([1, 3, 4, 6]);
  });

  it("auto-selects the first available date when none is chosen", () => {
    mockDirections = ["west"];
    renderStep();

    const delivery = useCheckoutStore.getState().delivery;
    expect(delivery).not.toBeNull();
    expect([3, 6]).toContain(getZonedDayOfWeek(new Date(`${delivery!.date}T12:00:00-07:00`)));
    expect(delivery!.windowStart).toBe("10:00");
  });
});

describe("TimeStepV8 — no-serve empty state (fallback removed)", () => {
  // Days deliberately without an "all" run so a south-only... rather, an
  // address whose direction matches nothing gets a genuinely empty filter.
  const DIRECTIONAL_ONLY = [day("mon", 1, "east"), day("wed", 3, "west")];

  function renderDirectionalOnly() {
    return render(
      <TimeStepV8
        timeWindows={TIME_WINDOWS}
        deliveryDays={DIRECTIONAL_ONLY}
        deliveryZones={ZONES}
      />
    );
  }

  it("renders the empty state instead of falling back to the unfiltered day list", () => {
    mockDirections = ["south"];
    renderDirectionalOnly();

    expect(screen.getByText(/no upcoming runs serve your address/i)).toBeInTheDocument();
    expect(screen.queryByTestId("time-slot-picker")).toBeNull();
    expect(screen.queryAllByTestId(/^date-/)).toHaveLength(0);
  });

  it("clears a previously selected date so Continue cannot carry it forward", () => {
    mockDirections = ["south"];
    act(() => {
      useCheckoutStore.setState({
        delivery: { date: "2027-01-04", windowStart: "10:00", windowEnd: "12:00" },
      });
    });
    renderDirectionalOnly();

    expect(useCheckoutStore.getState().delivery).toBeNull();
    // Continue is disabled via useCanProceed (delivery === null)
    expect(screen.getByRole("button", { name: /continue to payment/i })).toBeDisabled();
  });

  it("offers an address-change escape hatch", () => {
    mockDirections = ["south"];
    renderDirectionalOnly();

    expect(screen.getByRole("button", { name: /use a different address/i })).toBeInTheDocument();
  });
});

describe("TimeStepV8 — address-change revalidation of the selected date", () => {
  it("reseats a date the new address's route does not serve, with a visible notice", () => {
    // Step 1: west address, select the Wednesday (west) run.
    mockDirections = ["west"];
    const { unmount } = renderStep();
    const westDelivery = useCheckoutStore.getState().delivery;
    expect(westDelivery).not.toBeNull();
    unmount();

    // Force a Wednesday-only selection (auto-select may have chosen Sat).
    const wedDate = (() => {
      // find next Wednesday in LA time
      const now = new Date();
      for (let i = 0; i < 14; i++) {
        const d = new Date(now.getTime() + i * 86_400_000);
        if (getZonedDayOfWeek(d) === 3) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${dd}`;
        }
      }
      throw new Error("no wednesday found");
    })();
    act(() => {
      useCheckoutStore.setState({
        delivery: { date: wedDate, windowStart: "10:00", windowEnd: "12:00" },
      });
    });

    // Step 2: the customer swaps to an EAST address (Mon + Sat serve it).
    mockDirections = ["east"];
    act(() => {
      useCheckoutStore.setState({
        address: { ...ADDRESS, id: "addr-2", lat: 34.2, lng: -117.5 },
        addressId: "addr-2",
      });
    });
    renderStep();

    const reseated = useCheckoutStore.getState().delivery;
    expect(reseated).not.toBeNull();
    expect(reseated!.date).not.toBe(wedDate);
    expect([1, 6]).toContain(getZonedDayOfWeek(new Date(`${reseated!.date}T12:00:00-07:00`)));
    // The chosen window survives the move
    expect(reseated!.windowStart).toBe("10:00");
    // The move is announced, not silent
    expect(screen.getByRole("status")).toHaveTextContent(/we moved your delivery/i);
    expect(screen.getByText(/route runs on different days/i)).toBeInTheDocument();
  });

  it("clears the move notice when a LATER address change still serves the moved date", () => {
    // Move 1: west → east forces a reseat and shows the notice.
    mockDirections = ["west"];
    const first = renderStep();
    first.unmount();
    const wedDate = (() => {
      const now = new Date();
      for (let i = 0; i < 14; i++) {
        const d = new Date(now.getTime() + i * 86_400_000);
        if (getZonedDayOfWeek(d) === 3) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${dd}`;
        }
      }
      throw new Error("no wednesday found");
    })();
    act(() => {
      useCheckoutStore.setState({
        delivery: { date: wedDate, windowStart: "10:00", windowEnd: "12:00" },
      });
    });
    mockDirections = ["east"];
    act(() => {
      useCheckoutStore.setState({
        address: { ...ADDRESS, id: "addr-east", lat: 34.2, lng: -117.5 },
        addressId: "addr-east",
      });
    });
    renderStep();
    expect(screen.getByText(/we moved your delivery/i)).toBeInTheDocument();
    const moved = useCheckoutStore.getState().delivery;

    // Move 2: a nearby address serves the ALREADY-moved date — no new move, so
    // the old "we moved your delivery" notice is stale and must clear.
    mockDirections = [];
    act(() => {
      useCheckoutStore.setState({
        address: { ...ADDRESS, id: "addr-nearby", lat: 34.1, lng: -117.9 },
        addressId: "addr-nearby",
      });
    });

    expect(useCheckoutStore.getState().delivery).toEqual(moved);
    expect(screen.queryByText(/we moved your delivery/i)).toBeNull();
  });

  it("keeps a still-valid selection untouched when the address change also serves it", () => {
    mockDirections = ["west"];
    renderStep();
    const first = useCheckoutStore.getState().delivery;
    expect(first).not.toBeNull();

    // Nearby address serves every day — the selection must NOT move.
    mockDirections = [];
    act(() => {
      useCheckoutStore.setState({
        address: { ...ADDRESS, id: "addr-3", lat: 34.1, lng: -117.9 },
        addressId: "addr-3",
      });
    });

    expect(useCheckoutStore.getState().delivery).toEqual(first);
    expect(screen.queryByText(/we moved your delivery/i)).toBeNull();
  });
});

describe("TimeStepV8 — no-serve must not fire without active multi-day config", () => {
  it("preserves the LEGACY Saturday schedule when deliveryDays is empty (zones + address present)", () => {
    // Legacy config: no multi-day rows at all. The no-serve branch must not
    // win here — the documented legacy fallback owns this case.
    mockDirections = ["west"];
    render(<TimeStepV8 timeWindows={TIME_WINDOWS} deliveryDays={[]} deliveryZones={ZONES} />);

    expect(screen.queryByText(/no upcoming runs serve your address/i)).toBeNull();
    const days = [...new Set(offeredDays())];
    expect(days.length).toBeGreaterThan(0);
    expect(days).toEqual([6]); // legacy = Saturdays only
  });

  it("shows the empty state when the only days serving the address are INACTIVE", () => {
    // Admin turned off the West run but left the row: direction-wise the
    // address is "served", active-wise it is not — the picker would render
    // zero pills with no explanation.
    const days = [
      { ...day("mon", 1, "east"), isActive: true },
      { ...day("wed", 3, "west"), isActive: false },
    ];
    mockDirections = ["west"];
    render(<TimeStepV8 timeWindows={TIME_WINDOWS} deliveryDays={days} deliveryZones={ZONES} />);

    expect(screen.getByText(/no upcoming runs serve your address/i)).toBeInTheDocument();
    expect(screen.queryAllByTestId(/^date-/)).toHaveLength(0);
  });

  it("does NOT claim 'no runs serve your address' when EVERY day is inactive (global closure)", () => {
    const days = [
      { ...day("mon", 1, "east"), isActive: false },
      { ...day("wed", 3, "west"), isActive: false },
    ];
    mockDirections = ["west"];
    render(<TimeStepV8 timeWindows={TIME_WINDOWS} deliveryDays={days} deliveryZones={ZONES} />);

    // A global shutdown is the ordering-closed gate's story, not a
    // personalized "your address isn't served".
    expect(screen.queryByText(/no upcoming runs serve your address/i)).toBeNull();
  });
});

describe("TimeStepV8 — selected-date cutoff chip", () => {
  it("shows a live order-by deadline for the selected date", () => {
    mockDirections = ["west"];
    renderStep();

    expect(useCheckoutStore.getState().delivery).not.toBeNull();
    expect(screen.getByText(/order by/i)).toBeInTheDocument();
    expect(screen.getByText(/left/i)).toBeInTheDocument();
  });
});
