/**
 * The overlay's reason must never outlive the cancellation it describes.
 *
 * This started as a `??` and that was a P1: it resurrected a superseded reason
 * whenever an authoritative live null came back, which is exactly the bug the
 * server-side reader had just been fixed for.
 */

import { describe, it, expect } from "vitest";
import { resolveCancellationReason } from "../resolveCancellationReason";

describe("resolveCancellationReason", () => {
  it("uses the SSR snapshot before anything has been fetched", () => {
    // Ordinary case: opening the tracking page for an already-cancelled order.
    expect(
      resolveCancellationReason({ synced: false, live: null, snapshot: "Kitchen closed" })
    ).toBe("Kitchen closed");
  });

  it("uses the live reason for a cancellation that happened after page load", () => {
    // The snapshot predates the cancellation, so it has nothing to offer.
    expect(
      resolveCancellationReason({ synced: true, live: "Ingredient shortage", snapshot: null })
    ).toBe("Ingredient shortage");
  });

  it("does NOT fall back to a superseded snapshot reason", () => {
    // The bug this replaced. Page loaded while cancelled with reason A; the
    // order was then un-cancelled and cancelled again by a path with no
    // readable reason. `??` would show A for a cancellation it never described.
    expect(
      resolveCancellationReason({ synced: true, live: null, snapshot: "suspected card fraud" })
    ).toBeNull();
  });

  it("prefers the live reason over a stale snapshot when both exist", () => {
    expect(
      resolveCancellationReason({ synced: true, live: "Second reason", snapshot: "First reason" })
    ).toBe("Second reason");
  });
});
