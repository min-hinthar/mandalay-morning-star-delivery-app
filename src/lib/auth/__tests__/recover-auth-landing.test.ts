import { describe, expect, it } from "vitest";

import { detectStrandedAuthRedirect } from "../recover-auth-landing";

const LONG_CODE = "abc123def456ghi789jkl012"; // 24 chars, URL-safe

describe("detectStrandedAuthRedirect", () => {
  it("forwards a stranded PKCE code on the site root to /auth/callback", () => {
    const result = detectStrandedAuthRedirect("/", `?code=${LONG_CODE}`);
    expect(result).toEqual({
      callbackUrl: `/auth/callback?code=${LONG_CODE}`,
      reason: "code",
    });
  });

  it("preserves a safe next param", () => {
    const result = detectStrandedAuthRedirect("/", `?code=${LONG_CODE}&next=%2Fmenu`);
    expect(result?.callbackUrl).toBe(`/auth/callback?code=${LONG_CODE}&next=%2Fmenu`);
  });

  it("drops an unsafe (open-redirect) next param", () => {
    const result = detectStrandedAuthRedirect(
      "/",
      `?code=${LONG_CODE}&next=https%3A%2F%2Fevil.com`
    );
    expect(result?.callbackUrl).toBe(`/auth/callback?code=${LONG_CODE}`);
  });

  it("forwards auth errors stranded on the root", () => {
    const result = detectStrandedAuthRedirect(
      "/",
      "?error=access_denied&error_description=expired"
    );
    expect(result).toEqual({
      callbackUrl: "/auth/callback?error=access_denied&error_description=expired",
      reason: "error",
    });
  });

  it("ignores the dedicated /auth/* routes (they handle their own params)", () => {
    expect(detectStrandedAuthRedirect("/auth/callback", `?code=${LONG_CODE}`)).toBeNull();
    expect(detectStrandedAuthRedirect("/auth/confirm", "?token_hash=x&type=magiclink")).toBeNull();
  });

  it("ignores auth params on non-root pages (unrelated app flows)", () => {
    expect(detectStrandedAuthRedirect("/menu", `?code=${LONG_CODE}`)).toBeNull();
    expect(detectStrandedAuthRedirect("/checkout", "?error=payment_failed")).toBeNull();
  });

  it("ignores short / non-auth-looking codes (e.g. promo codes)", () => {
    expect(detectStrandedAuthRedirect("/", "?code=SUMMER25")).toBeNull();
    expect(detectStrandedAuthRedirect("/", "?code=with spaces and !!")).toBeNull();
  });

  it("returns null when there are no auth params", () => {
    expect(detectStrandedAuthRedirect("/", "")).toBeNull();
    expect(detectStrandedAuthRedirect("/", "?utm_source=email")).toBeNull();
  });
});
