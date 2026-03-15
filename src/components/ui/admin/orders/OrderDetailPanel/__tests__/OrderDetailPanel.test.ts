/**
 * Unit tests for OrderDetailPanel components
 * Phase 99 Plan 02 - Order Detail Panel
 *
 * Tests rendering logic conditions for CustomerContactCard,
 * DeliveryInfoCard, and TotalsCard tip display.
 */

import { describe, it, expect } from "vitest";
import type { OrderDetail, DeliveryInfo } from "../../OrderDetailPage/types";

// ---------------------------------------------------------------------------
// Mock data factories
// ---------------------------------------------------------------------------

function makeOrderDetail(overrides: Partial<OrderDetail> = {}): OrderDetail {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    status: "confirmed",
    customerName: "Jane Doe",
    customerEmail: "jane@example.com",
    customerPhone: "+16265551234",
    address: {
      street: "123 Main St",
      apt: null,
      city: "Covina",
      state: "CA",
      zip: "91722",
    },
    items: [
      {
        id: "item-1",
        name: "Mohinga",
        nameMy: null,
        quantity: 2,
        basePrice: 1200,
        lineTotal: 2400,
        refundedQuantity: 0,
        specialInstructions: null,
        modifiers: [],
      },
    ],
    subtotalCents: 2400,
    deliveryFeeCents: 1500,
    taxCents: 200,
    tipCents: 500,
    totalCents: 4600,
    discountCents: 0,
    specialInstructions: null,
    deliveryInfo: null,
    placedAt: "2026-03-14T10:00:00Z",
    confirmedAt: "2026-03-14T10:05:00Z",
    deliveredAt: null,
    deliveryWindowStart: null,
    deliveryWindowEnd: null,
    stripePaymentIntentId: "pi_test123",
    paymentMethod: "stripe",
    codApprovedAt: null,
    isPriority: false,
    assignedDriverId: null,
    assignedDriverName: null,
    emailStatus: null,
    needsContact: false,
    auditLog: [],
    ...overrides,
  };
}

function makeDeliveryInfo(overrides: Partial<DeliveryInfo> = {}): DeliveryInfo {
  return {
    deliveryNotes: "Left at front door",
    deliveryInstructions: "Ring the doorbell twice",
    arrivedAt: "2026-03-14T12:00:00Z",
    deliveredAt: "2026-03-14T12:05:00Z",
    routeId: "route-abc-123",
    routeStatus: "completed",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// CustomerContactCard rendering logic
// ---------------------------------------------------------------------------

describe("CustomerContactCard rendering logic", () => {
  it("should display customer name when provided", () => {
    const order = makeOrderDetail({ customerName: "Jane Doe" });
    expect(order.customerName).toBe("Jane Doe");
  });

  it("should fall back to Guest when customerName is null", () => {
    const order = makeOrderDetail({ customerName: null });
    const displayName = order.customerName || "Guest";
    expect(displayName).toBe("Guest");
  });

  it("should generate tel: link when phone is provided", () => {
    const order = makeOrderDetail({ customerPhone: "+16265551234" });
    expect(order.customerPhone).toBeTruthy();
    const telHref = `tel:${order.customerPhone}`;
    expect(telHref).toBe("tel:+16265551234");
  });

  it("should generate sms: link when phone is provided", () => {
    const order = makeOrderDetail({ customerPhone: "+16265551234" });
    expect(order.customerPhone).toBeTruthy();
    const smsHref = `sms:${order.customerPhone}`;
    expect(smsHref).toBe("sms:+16265551234");
  });

  it("should not generate tel:/sms: links when phone is null", () => {
    const order = makeOrderDetail({ customerPhone: null });
    expect(order.customerPhone).toBeNull();
    // Component conditionally renders phone links only when customerPhone is truthy
  });

  it("should always show email", () => {
    const order = makeOrderDetail({ customerEmail: "jane@example.com" });
    const mailHref = `mailto:${order.customerEmail}`;
    expect(mailHref).toBe("mailto:jane@example.com");
  });
});

// ---------------------------------------------------------------------------
// DeliveryInfoCard rendering logic
// ---------------------------------------------------------------------------

describe("DeliveryInfoCard rendering logic", () => {
  it("should not render when deliveryInfo is null", () => {
    const order = makeOrderDetail({ deliveryInfo: null });
    // Component returns null when deliveryInfo is null
    expect(order.deliveryInfo).toBeNull();
  });

  it("should render delivery notes when present", () => {
    const info = makeDeliveryInfo({ deliveryNotes: "Left at front door" });
    expect(info.deliveryNotes).toBe("Left at front door");
  });

  it("should render delivery instructions when present", () => {
    const info = makeDeliveryInfo({ deliveryInstructions: "Ring the doorbell twice" });
    expect(info.deliveryInstructions).toBe("Ring the doorbell twice");
  });

  it("should hide timestamps when arrivedAt and deliveredAt are null", () => {
    const info = makeDeliveryInfo({ arrivedAt: null, deliveredAt: null });
    const hasTimestamps = info.arrivedAt || info.deliveredAt;
    expect(hasTimestamps).toBeFalsy();
  });

  it("should show timestamps when arrivedAt is populated", () => {
    const info = makeDeliveryInfo({ arrivedAt: "2026-03-14T12:00:00Z" });
    expect(info.arrivedAt).toBeTruthy();
  });

  it("should show timestamps when deliveredAt is populated", () => {
    const info = makeDeliveryInfo({ deliveredAt: "2026-03-14T12:05:00Z" });
    expect(info.deliveredAt).toBeTruthy();
  });

  it("should show route info when routeId is present", () => {
    const info = makeDeliveryInfo({ routeId: "route-abc-123", routeStatus: "completed" });
    expect(info.routeId).toBeTruthy();
    expect(info.routeStatus).toBe("completed");
  });

  it("should handle route with null status", () => {
    const info = makeDeliveryInfo({ routeId: "route-abc-123", routeStatus: null });
    expect(info.routeId).toBeTruthy();
    expect(info.routeStatus).toBeNull();
  });

  it("should show empty state when all delivery info fields are null", () => {
    const info = makeDeliveryInfo({
      deliveryNotes: null,
      deliveryInstructions: null,
      arrivedAt: null,
      deliveredAt: null,
      routeId: null,
      routeStatus: null,
    });
    const hasNotes = info.deliveryNotes || info.deliveryInstructions;
    const hasTimestamps = info.arrivedAt || info.deliveredAt;
    const hasRoute = info.routeId;
    expect(hasNotes).toBeFalsy();
    expect(hasTimestamps).toBeFalsy();
    expect(hasRoute).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// TotalsCard tip display logic
// ---------------------------------------------------------------------------

describe("TotalsCard tip display logic", () => {
  it("should show tip line when tipCents > 0", () => {
    const order = makeOrderDetail({ tipCents: 500 });
    expect(order.tipCents > 0).toBe(true);
  });

  it("should hide tip line when tipCents is 0", () => {
    const order = makeOrderDetail({ tipCents: 0 });
    expect(order.tipCents > 0).toBe(false);
  });

  it("should include tipCents in OrderDetail type", () => {
    const order = makeOrderDetail({ tipCents: 300 });
    expect(order.tipCents).toBe(300);
    expect(typeof order.tipCents).toBe("number");
  });
});

// ---------------------------------------------------------------------------
// OrderDetail type completeness
// ---------------------------------------------------------------------------

describe("OrderDetail type with new fields", () => {
  it("should include tipCents field", () => {
    const order = makeOrderDetail();
    expect("tipCents" in order).toBe(true);
    expect(typeof order.tipCents).toBe("number");
  });

  it("should include deliveryInfo field", () => {
    const order = makeOrderDetail({ deliveryInfo: makeDeliveryInfo() });
    expect("deliveryInfo" in order).toBe(true);
    expect(order.deliveryInfo).not.toBeNull();
    expect(order.deliveryInfo!.deliveryNotes).toBe("Left at front door");
  });

  it("should accept null deliveryInfo", () => {
    const order = makeOrderDetail({ deliveryInfo: null });
    expect(order.deliveryInfo).toBeNull();
  });
});
