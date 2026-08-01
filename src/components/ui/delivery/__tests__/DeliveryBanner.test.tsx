/**
 * DeliveryBanner — personalized route-day headline.
 *
 * When the caller resolves the customer's own route (menu page →
 * useCustomerDeliveryDays), the banner's lead swaps from the generic
 * "Delivering {date}" to the route-day headline with a Burmese suffix, so the
 * route-day-invite email's promise survives landing. Without a headline the
 * banner is unchanged.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

let mockGate = {
  isOpen: true,
  deliveryDate: { displayDate: "Saturday, August 8" },
  cutoffDate: new Date(Date.now() + 3 * 60 * 60 * 1000),
  urgency: "normal" as const,
};
vi.mock("@/lib/hooks/useDeliveryGate", () => ({
  useDeliveryGate: () => mockGate,
  useDeliveryGateMultiDay: () => mockGate,
}));

import { DeliveryBanner } from "../DeliveryBanner";
import type { DeliveryDayConfig } from "@/types/delivery";

const DAYS: DeliveryDayConfig[] = [
  {
    id: "sat",
    dayOfWeek: 6,
    isActive: true,
    cutoffDay: 5,
    cutoffHour: 15,
    deliveryFeeCents: 1500,
    displayOrder: 0,
    direction: "all",
  },
];

describe("DeliveryBanner — route headline", () => {
  it("renders the personalized headline + Burmese suffix when provided", () => {
    render(
      <DeliveryBanner
        deliveryDays={DAYS}
        routeHeadline="We're driving the West Route this Wednesday"
      />
    );

    expect(screen.getByText(/we're driving the west route this wednesday/i)).toBeInTheDocument();
    expect(screen.getByText(/သင့်ဒေသသို့/)).toBeInTheDocument();
    // Countdown copy still present
    expect(screen.getByText(/order cutoff in/i)).toBeInTheDocument();
    // Accessible label carries the headline
    expect(screen.getByRole("status").getAttribute("aria-label")).toMatch(/west route/i);
  });

  it("keeps the generic lead when no headline is provided", () => {
    render(<DeliveryBanner deliveryDays={DAYS} />);

    expect(screen.getByText(/delivering saturday, august 8/i)).toBeInTheDocument();
    expect(screen.queryByText(/သင့်ဒေသသို့/)).toBeNull();
  });

  it("ignores the headline when ordering is closed", () => {
    mockGate = { ...mockGate, isOpen: false };
    render(<DeliveryBanner deliveryDays={DAYS} routeHeadline="We're driving the West Route" />);

    expect(screen.getByText(/next delivery: saturday, august 8/i)).toBeInTheDocument();
    expect(screen.queryByText(/west route/i)).toBeNull();
    mockGate = { ...mockGate, isOpen: true };
  });
});
