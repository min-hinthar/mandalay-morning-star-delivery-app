/**
 * formatFloorDollars — order-floor display.
 *
 * The minimum-order notices printed the floor with `.toFixed(0)` while the
 * shortfall beside it used `.toFixed(2)`. Admins can set a non-round minimum
 * (the settings input is `step={0.01}`; the Zod bound only caps the range), and
 * the server's MINIMUM_ORDER_NOT_MET copy uses `.toFixed(2)` — so a 2750 floor
 * rendered as "$3.50 below the $28 minimum" (24.00 + 3.50 = 27.50, not 28)
 * while the server said "$27.50 minimum".
 */

import { describe, it, expect } from "vitest";
import { formatFloorDollars } from "../format";

describe("formatFloorDollars", () => {
  it("keeps round floors whole — no gratuitous cents", () => {
    expect(formatFloorDollars(2500)).toBe("25");
    expect(formatFloorDollars(10000)).toBe("100");
    expect(formatFloorDollars(0)).toBe("0");
  });

  it("shows cents for a non-round admin-set floor (the bug)", () => {
    expect(formatFloorDollars(2750)).toBe("27.50");
    expect(formatFloorDollars(2501)).toBe("25.01");
  });

  it("agrees with the server's floor wording", () => {
    // src/app/api/checkout/session/validation.ts formats the floor as
    // `$${(minimumCents / 100).toFixed(2)}` — the client must name the same
    // number, whether or not it chooses to print trailing zeros.
    for (const cents of [2500, 2750, 10000, 9999]) {
      expect(Number(formatFloorDollars(cents))).toBe(Number((cents / 100).toFixed(2)));
    }
  });
});
