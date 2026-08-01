/**
 * RailCutoffChip — mobile visibility is urgency-gated.
 *
 * Below sm the chip used to be unconditionally hidden, so on phones (where
 * the masthead banner scrolls away) NO deadline was visible while browsing —
 * including in the last minutes before a cutoff. It now surfaces on mobile at
 * warning/critical urgency and stays hidden (mobile-only) at normal urgency
 * to protect the tab row's width.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import type { Urgency } from "@/lib/hooks/useDeliveryGate";

let mockGate = {
  isOpen: true,
  deliveryDate: { displayDate: "Saturday" },
  cutoffDate: new Date(Date.now() + 60 * 60 * 1000),
  urgency: "normal" as Urgency,
};
vi.mock("@/lib/hooks/useDeliveryGate", () => ({
  useDeliveryGate: () => mockGate,
  useDeliveryGateMultiDay: () => mockGate,
}));

import { RailCutoffChip } from "../RailCutoffChip";
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

function chipClasses(urgency: Urgency, isOpen = true): string {
  mockGate = { ...mockGate, urgency, isOpen };
  const { container } = render(<RailCutoffChip deliveryDays={DAYS} />);
  return (container.firstChild as HTMLElement).className;
}

describe("RailCutoffChip — urgency-gated mobile visibility", () => {
  it("stays hidden on mobile at normal urgency (tabs keep their width)", () => {
    const cls = chipClasses("normal");
    expect(cls).toContain("hidden");
    expect(cls).toContain("sm:flex");
  });

  it("surfaces on mobile at warning urgency", () => {
    const cls = chipClasses("warning");
    expect(cls).not.toContain("hidden");
    expect(cls).toContain("flex");
    expect(cls).toContain("menu-rail-chip-warn");
  });

  it("surfaces on mobile at critical urgency", () => {
    const cls = chipClasses("critical");
    expect(cls).not.toContain("hidden");
    expect(cls).toContain("menu-rail-chip-crit");
  });

  it("stays mobile-hidden when ordering is closed (no urgency to act on)", () => {
    const cls = chipClasses("critical", false);
    expect(cls).toContain("hidden");
  });
});
