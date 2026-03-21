import { describe, it, expect, vi } from "vitest";
import { getClientIp, getIdentifier } from "@/lib/rate-limit/identifiers";

// Mock next/headers for getServerActionIp (not directly tested but prevents import errors)
vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

// ---- Helpers ----

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request("https://example.com", {
    headers: new Headers(headers),
  });
}

// ---- getClientIp ----

describe("getClientIp", () => {
  it("returns first IP from x-forwarded-for header", () => {
    const req = makeRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("returns x-real-ip when x-forwarded-for is absent", () => {
    const req = makeRequest({ "x-real-ip": "10.0.0.1" });
    expect(getClientIp(req)).toBe("10.0.0.1");
  });

  it('returns "unknown" when both headers are absent', () => {
    const req = makeRequest();
    expect(getClientIp(req)).toBe("unknown");
  });

  it("trims whitespace from extracted IP", () => {
    const req = makeRequest({ "x-forwarded-for": " 1.2.3.4 " });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });
});

// ---- getIdentifier ----

describe("getIdentifier", () => {
  it("returns userId when provided", () => {
    const req = makeRequest({ "x-forwarded-for": "1.2.3.4" });
    expect(getIdentifier(req, "user-123")).toBe("user-123");
  });

  it("returns IP (via getClientIp) when userId is undefined", () => {
    const req = makeRequest({ "x-forwarded-for": "1.2.3.4" });
    expect(getIdentifier(req)).toBe("1.2.3.4");
  });
});
