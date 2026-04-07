import { describe, it, expect } from "vitest";
import { ClientErrorCodes } from "../errors";
import type { ClientErrorCode } from "../errors";

describe("ClientErrorCodes (Phase 110 D-33)", () => {
  it("CHECKOUT_NETWORK_TIMEOUT is the literal string", () => {
    expect(ClientErrorCodes.CHECKOUT_NETWORK_TIMEOUT).toBe("CHECKOUT_NETWORK_TIMEOUT");
  });

  it("CART_VALIDATION_TIMEOUT is the literal string", () => {
    expect(ClientErrorCodes.CART_VALIDATION_TIMEOUT).toBe("CART_VALIDATION_TIMEOUT");
  });

  it("ClientErrorCode type accepts both literals", () => {
    const a: ClientErrorCode = ClientErrorCodes.CHECKOUT_NETWORK_TIMEOUT;
    const b: ClientErrorCode = ClientErrorCodes.CART_VALIDATION_TIMEOUT;
    expect(a).toBeDefined();
    expect(b).toBeDefined();
  });

  it("object exposes exactly the two expected keys (no extras)", () => {
    expect(Object.keys(ClientErrorCodes).sort()).toEqual([
      "CART_VALIDATION_TIMEOUT",
      "CHECKOUT_NETWORK_TIMEOUT",
    ]);
  });

  it("values equal their keys (mirror convention)", () => {
    for (const [key, value] of Object.entries(ClientErrorCodes)) {
      expect(value).toBe(key);
    }
  });
});
