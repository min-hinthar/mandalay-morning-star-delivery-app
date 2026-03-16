import { describe, it, expect } from "vitest";
import { getPageTitle } from "../AdminMobileHeader";

/**
 * Unit Tests: AdminMobileHeader
 *
 * Tests getPageTitle pure function for MOBL-01 page title derivation.
 */

describe("AdminMobileHeader", () => {
  describe("getPageTitle", () => {
    it("returns 'Dashboard' for /admin", () => {
      expect(getPageTitle("/admin")).toBe("Dashboard");
    });

    it("returns 'Orders' for /admin/orders", () => {
      expect(getPageTitle("/admin/orders")).toBe("Orders");
    });

    it("returns 'Order Details' for /admin/orders/[id]", () => {
      expect(getPageTitle("/admin/orders/abc-123")).toBe("Order Details");
    });

    it("returns 'Route Builder' for /admin/routes/builder", () => {
      expect(getPageTitle("/admin/routes/builder")).toBe("Route Builder");
    });

    it("returns 'Route Details' for /admin/routes/[id]", () => {
      expect(getPageTitle("/admin/routes/some-uuid")).toBe("Route Details");
    });

    it("returns 'Edit Item' for /admin/menu/[id]", () => {
      expect(getPageTitle("/admin/menu/item-id")).toBe("Edit Item");
    });

    it("returns 'Admin' for unknown routes", () => {
      expect(getPageTitle("/admin/unknown-page")).toBe("Admin");
    });
  });
});
