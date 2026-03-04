import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock createServiceClient before importing module under test
const mockCreateSignedUrl = vi.fn();
const mockFrom = vi.fn(() => ({
  createSignedUrl: mockCreateSignedUrl,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({
    storage: {
      from: mockFrom,
    },
  }),
}));

import { getDeliveryPhotoSignedUrl, extractDeliveryPhotoPath } from "../delivery-photos";

describe("delivery-photos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("extractDeliveryPhotoPath", () => {
    it("returns path as-is when input is already a path", () => {
      expect(extractDeliveryPhotoPath("routeId/orderId.jpg")).toBe("routeId/orderId.jpg");
    });

    it("extracts path from full Supabase public URL", () => {
      const url = "https://xyz.supabase.co/storage/v1/object/public/delivery-photos/abc/def.jpg";
      expect(extractDeliveryPhotoPath(url)).toBe("abc/def.jpg");
    });

    it("returns null when URL has no delivery-photos segment", () => {
      const url = "https://example.com/some/other/path.jpg";
      expect(extractDeliveryPhotoPath(url)).toBeNull();
    });
  });

  describe("getDeliveryPhotoSignedUrl", () => {
    it("returns null for null input", async () => {
      const result = await getDeliveryPhotoSignedUrl(null);
      expect(result).toBeNull();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("returns null for empty string input", async () => {
      const result = await getDeliveryPhotoSignedUrl("");
      expect(result).toBeNull();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("calls createSignedUrl with correct bucket and 3600s expiry", async () => {
      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: "https://signed-url.example.com/photo.jpg" },
        error: null,
      });

      const result = await getDeliveryPhotoSignedUrl("routeId/orderId.jpg");

      expect(mockFrom).toHaveBeenCalledWith("delivery-photos");
      expect(mockCreateSignedUrl).toHaveBeenCalledWith("routeId/orderId.jpg", 3600);
      expect(result).toBe("https://signed-url.example.com/photo.jpg");
    });

    it("returns null on SDK error without throwing", async () => {
      mockCreateSignedUrl.mockResolvedValue({
        data: null,
        error: { message: "Storage error" },
      });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await getDeliveryPhotoSignedUrl("routeId/orderId.jpg");

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
