/**
 * Phase 111 CHKP-03 D-22..D-26 — addressesQueryFn export contract.
 *
 * Locks the shared queryFn export so Plan 04's step-prefetch in
 * CheckoutClient can safely reference the SAME fetch function that
 * useAddresses() uses. Any future drift (shape, error handling) would
 * break these tests before the divergence reaches prod.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { addressesQueryFn } from "@/lib/hooks/useAddresses";

describe("addressesQueryFn", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("is exported as a callable async function", () => {
    expect(typeof addressesQueryFn).toBe("function");
    expect(addressesQueryFn.constructor.name).toBe("AsyncFunction");
  });

  it("fetches /api/addresses and returns the parsed response", async () => {
    const payload = {
      data: [
        {
          id: "a1",
          userId: "u1",
          label: "Home",
          line1: "123 Main St",
          line2: null,
          city: "Covina",
          state: "CA",
          postalCode: "91723",
          formattedAddress: "123 Main St, Covina, CA 91723",
          lat: 34.09,
          lng: -117.89,
          isDefault: true,
          createdAt: "2026-04-01T00:00:00Z",
          updatedAt: "2026-04-01T00:00:00Z",
        },
      ],
    };

    const fetchSpy = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(payload),
      })
    ) as unknown as typeof fetch;
    global.fetch = fetchSpy;

    const result = await addressesQueryFn();

    expect(fetchSpy).toHaveBeenCalledWith("/api/addresses");
    expect(result).toEqual(payload);
  });

  it("throws with the API error message on non-ok response", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: { message: "Unauthorized" } }),
      })
    ) as unknown as typeof fetch;

    await expect(addressesQueryFn()).rejects.toThrow("Unauthorized");
  });
});
