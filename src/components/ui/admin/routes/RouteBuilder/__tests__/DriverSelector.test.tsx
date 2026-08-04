/**
 * DriverSelector — the card must say what it actually knows.
 *
 * `isDriverAvailable` returns TRUE for an empty `available_days` ("no
 * restrictions = available all days"), and empty IS the DB default:
 * availability_json starts as {"blocked_dates": [], "available_days": []} and
 * only the driver's own /driver/schedule screen ever fills it in. So a
 * two-state available/unavailable card confidently marked every
 * freshly-onboarded driver as AVAILABLE, and a reason gated on `!isAvailable`
 * could never render for exactly the case that needs explaining.
 *
 * Three states now: available (green), unknown (amber, "Schedule not set"),
 * unavailable (grey, dimmed). Selectability is unchanged — only a DEACTIVATED
 * driver is a hard block, because disabling every non-green card would make
 * assignment impossible on a fleet that has never filled schedules in.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DriverSelector, type DriverApiResponse } from "../DriverSelector";

function driver(over: Partial<DriverApiResponse> = {}): DriverApiResponse {
  return {
    id: "d-1",
    fullName: "Dee Driver",
    vehicleType: "car",
    profileImageUrl: null,
    isActive: true,
    ratingAvg: 5,
    deliveriesCount: 0,
    availability: { available_days: [], blocked_dates: [] },
    ...over,
  };
}

describe("an unrated driver", () => {
  /**
   * `drivers.rating_avg` is `numeric(3,2) DEFAULT 0` with NO `NOT NULL`, so it
   * is genuinely nullable — but seven hand-written interfaces declared it
   * `number`, and `.returns<T>()` cast that lie straight past tsc. This card
   * called `driver.ratingAvg.toFixed(1)` unguarded, so a null rating threw
   * inside render and took the whole route builder down.
   *
   * An em dash, not "0.0": a driver with no ratings must not be shown at the
   * bottom of the scale in the picker an admin uses to choose one.
   */
  it("renders an em dash instead of throwing", () => {
    expect(() => renderSelector([driver({ ratingAvg: null })])).not.toThrow();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("0.0")).not.toBeInTheDocument();
  });

  it("still shows a real rating when there is one", () => {
    renderSelector([driver({ ratingAvg: 4.25 })]);
    expect(screen.getByText("4.3")).toBeInTheDocument();
  });
});

// 2026-08-08 is a Saturday.
const SATURDAY = "2026-08-08";

function renderSelector(drivers: DriverApiResponse[]) {
  return render(
    <DriverSelector
      drivers={drivers}
      selectedDriverId={null}
      onSelect={vi.fn()}
      deliveryDate={SATURDAY}
    />
  );
}

describe("DriverSelector", () => {
  it("says 'Schedule not set' for an active driver with the default empty schedule", () => {
    renderSelector([driver()]);

    expect(screen.getByText("Schedule not set")).toBeInTheDocument();
  });

  it("keeps that driver SELECTABLE — an unset schedule is missing info, not a refusal", () => {
    renderSelector([driver()]);

    expect(screen.getByRole("button", { name: /Schedule not set/i })).toBeEnabled();
  });

  it("shows no reason at all for a driver who is down for this date", () => {
    renderSelector([driver({ availability: { available_days: ["saturday"], blocked_dates: [] } })]);

    expect(screen.queryByText("Schedule not set")).not.toBeInTheDocument();
    expect(screen.queryByText("Unavailable on this date")).not.toBeInTheDocument();
  });

  it("distinguishes a real decline from an unset schedule", () => {
    renderSelector([driver({ availability: { available_days: ["monday"], blocked_dates: [] } })]);

    expect(screen.getByText("Unavailable on this date")).toBeInTheDocument();
  });

  // An explicit block on THIS date beats the empty-schedule short-circuit —
  // it's the most specific thing the driver has told us. With the checks in the
  // other order, a driver who had declined this exact date read as "Schedule
  // not set": the same dishonesty this component fixes, inverted.
  it("reports a blocked date even when no weekly schedule was ever set", () => {
    renderSelector([driver({ availability: { available_days: [], blocked_dates: [SATURDAY] } })]);

    expect(screen.getByText("Blocked this date")).toBeInTheDocument();
    expect(screen.queryByText("Schedule not set")).not.toBeInTheDocument();
  });

  it("still says 'Schedule not set' when the block is for some OTHER date", () => {
    renderSelector([
      driver({ availability: { available_days: [], blocked_dates: ["2026-08-15"] } }),
    ]);

    expect(screen.getByText("Schedule not set")).toBeInTheDocument();
  });

  it("disables an inactive driver — the one hard block", () => {
    renderSelector([driver({ isActive: false })]);

    const card = screen.getByRole("button", { name: /Inactive/i });
    expect(card).toBeDisabled();
  });

  it("ranks confirmed-available above unknown above unavailable", () => {
    renderSelector([
      driver({ id: "d-unknown", fullName: "Unknown Uma" }),
      driver({
        id: "d-off",
        fullName: "Offday Otto",
        availability: { available_days: ["monday"], blocked_dates: [] },
      }),
      driver({
        id: "d-ok",
        fullName: "Available Ava",
        availability: { available_days: ["saturday"], blocked_dates: [] },
      }),
    ]);

    const names = screen
      .getAllByRole("button")
      .map((b) => b.getAttribute("aria-label") ?? "")
      .filter((label) => label.length > 0);

    expect(names[0]).toMatch(/Available Ava/);
    expect(names[1]).toMatch(/Unknown Uma/);
    expect(names[2]).toMatch(/Offday Otto/);
  });
});
