/**
 * Tests for RouteStopCard timestamp display
 *
 * Verifies arrived_at and delivered_at timestamps render conditionally.
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { format, parseISO } from "date-fns";
import { RouteStopCard } from "../RouteStopCard";
import type { StopDetail, RouteStopStatus } from "@/types/driver";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => {
  function createMotionComponent(tag: string) {
    // eslint-disable-next-line react/display-name
    return ({ children, ...props }: Record<string, unknown>) => {
      const { initial: _i, animate: _a, transition: _t, whileHover: _wh, whileTap: _wt, layout: _l, ...rest } = props;
      const domProps: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rest)) {
        if (typeof value !== "object" || key === "className" || key === "style" || key === "onClick" || key.startsWith("data-") || key.startsWith("aria-") || key === "disabled" || key === "type" || key === "href" || key === "ref" || key === "id" || key === "role") {
          domProps[key] = value;
        }
      }
      const Tag = tag as unknown as React.ElementType;
      return <Tag {...domProps}>{children as React.ReactNode}</Tag>;
    };
  }

  const handler = { get: (_: unknown, prop: string) => createMotionComponent(prop) };
  return {
    m: new Proxy({}, handler),
    motion: new Proxy({}, handler),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    type: {} as Record<string, unknown>,
  };
});

// Mock useAnimationPreference hook
vi.mock("@/lib/hooks/useAnimationPreference", () => ({
  useAnimationPreference: () => ({ shouldAnimate: false }),
}));

// Mock motion tokens
vi.mock("@/lib/motion-tokens", () => ({
  spring: {},
  hover: {},
}));

// Mock BrandedSpinner
vi.mock("@/components/ui/branded-spinner", () => ({
  BrandedSpinner: () => <span data-testid="spinner" />,
}));

// Mock ConfirmDialog to avoid deep dependency chain (Modal -> useReducedMotion)
vi.mock("@/components/ui/admin/settings/ConfirmDialog", () => ({
  ConfirmDialog: () => null,
}));

// Mock next/image
vi.mock("next/image", () => ({
  // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

function createMockStop(overrides: Partial<StopDetail> = {}): StopDetail {
  return {
    id: "stop-1",
    stopIndex: 0,
    eta: null,
    status: "pending" as RouteStopStatus,
    arrivedAt: null,
    deliveredAt: null,
    deliveryPhotoUrl: null,
    deliveryNotes: null,
    order: {
      id: "order-1",
      totalCents: 2500,
      deliveryWindowStart: null,
      deliveryWindowEnd: null,
      specialInstructions: null,
      itemCount: 3,
      customer: {
        id: "cust-1",
        fullName: "John Doe",
        phone: "555-1234",
      },
      address: {
        line1: "123 Main St",
        line2: null,
        city: "Covina",
        state: "CA",
        postalCode: "91723",
        lat: 34.09,
        lng: -117.89,
      },
    },
    exception: null,
    ...overrides,
  };
}

const defaultProps = {
  index: 0,
  routeStatus: "planned" as const,
  onStatusChange: vi.fn(),
  onRemoveStop: vi.fn(),
};

describe("RouteStopCard Timestamps", () => {
  it("renders arrived_at timestamp when stop.arrivedAt is populated", () => {
    const arrivedIso = "2026-03-15T10:30:00.000Z";
    const expectedTime = format(parseISO(arrivedIso), "h:mm a");
    const stop = createMockStop({ arrivedAt: arrivedIso });
    render(<RouteStopCard stop={stop} {...defaultProps} />);

    const timestamps = screen.getByTestId("tracking-timestamps");
    expect(timestamps).toBeInTheDocument();
    expect(timestamps.textContent).toContain("Arrived:");
    expect(timestamps.textContent).toContain(expectedTime);
  });

  it("renders delivered_at timestamp when stop.deliveredAt is populated", () => {
    const deliveredIso = "2026-03-15T14:45:00.000Z";
    const expectedTime = format(parseISO(deliveredIso), "h:mm a");
    const stop = createMockStop({ deliveredAt: deliveredIso });
    render(<RouteStopCard stop={stop} {...defaultProps} />);

    const timestamps = screen.getByTestId("tracking-timestamps");
    expect(timestamps).toBeInTheDocument();
    expect(timestamps.textContent).toContain("Delivered:");
    expect(timestamps.textContent).toContain(expectedTime);
  });

  it("hides timestamp section when both arrivedAt and deliveredAt are null", () => {
    const stop = createMockStop({ arrivedAt: null, deliveredAt: null });
    render(<RouteStopCard stop={stop} {...defaultProps} />);

    expect(screen.queryByTestId("tracking-timestamps")).not.toBeInTheDocument();
  });

  it("shows both timestamps when both are populated", () => {
    const stop = createMockStop({
      arrivedAt: "2026-03-15T10:30:00.000Z",
      deliveredAt: "2026-03-15T10:45:00.000Z",
    });
    render(<RouteStopCard stop={stop} {...defaultProps} />);

    const timestamps = screen.getByTestId("tracking-timestamps");
    expect(timestamps.textContent).toContain("Arrived:");
    expect(timestamps.textContent).toContain("Delivered:");
  });
});
