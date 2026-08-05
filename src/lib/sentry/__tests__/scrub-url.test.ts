import { describe, expect, it } from "vitest";

import {
  SENSITIVE_QUERY_PARAMS,
  scrubConsoleMessage,
  scrubSpanDescription,
  scrubUrl,
} from "../scrub-url";

describe("scrubUrl", () => {
  it("redacts the tracking share ?token= param", () => {
    expect(scrubUrl("/api/tracking/abc?token=s3cret")).toBe(
      "/api/tracking/abc?token=%5Bredacted%5D"
    );
  });

  it("redacts token_hash on auth confirm links (driver invites, magic links)", () => {
    expect(scrubUrl("/auth/confirm?token_hash=pkce_abc123&type=magiclink&next=%2Fmenu")).toBe(
      "/auth/confirm?token_hash=%5Bredacted%5D&type=magiclink&next=%2Fmenu"
    );
  });

  it("redacts OAuth/promo ?code= param on absolute URLs", () => {
    expect(scrubUrl("https://example.com/auth/callback?code=4%2F0AbCd&state=xyz")).toBe(
      "https://example.com/auth/callback?code=%5Bredacted%5D&state=xyz"
    );
  });

  it("redacts the share token carried in the /orders/<token>/share path", () => {
    expect(scrubUrl("/orders/f00ba4-share-secret/share")).toBe("/orders/[redacted]/share");
    expect(scrubUrl("https://example.com/orders/f00ba4/share?utm=x")).toBe(
      "https://example.com/orders/[redacted]/share?utm=x"
    );
  });

  it("does NOT redact ordinary order-detail paths (ids are not secrets)", () => {
    expect(scrubUrl("/orders/123e4567-e89b-12d3-a456-426614174000")).toBe(
      "/orders/123e4567-e89b-12d3-a456-426614174000"
    );
  });

  it("returns clean URLs unchanged (identity, no re-encoding)", () => {
    expect(scrubUrl("/menu?category=noodles&sort=asc")).toBe("/menu?category=noodles&sort=asc");
    expect(scrubUrl("https://example.com/checkout#tip")).toBe("https://example.com/checkout#tip");
  });

  it("preserves path, other params, and hash while scrubbing", () => {
    expect(scrubUrl("/account/settings?tab=profile&token=abc#top")).toBe(
      "/account/settings?tab=profile&token=%5Bredacted%5D#top"
    );
  });

  it("fails open on unparseable input", () => {
    expect(scrubUrl("http://[not-a-url")).toBe("http://[not-a-url");
  });

  it("redacts hash-borne secrets (implicit-flow tokens, hash-encoded params)", () => {
    expect(
      scrubUrl("/auth/callback#access_token=eyJhbGc&token_type=bearer&refresh_token=v1.M")
    ).toBe(
      "/auth/callback#access_token=%5Bredacted%5D&token_type=bearer&refresh_token=%5Bredacted%5D"
    );
    expect(scrubUrl("https://example.com/x#token=abc")).toBe(
      "https://example.com/x#token=%5Bredacted%5D"
    );
  });

  it("leaves plain anchor hashes untouched", () => {
    expect(scrubUrl("/checkout#tip")).toBe("/checkout#tip");
    expect(scrubUrl("https://example.com/menu#section-noodles")).toBe(
      "https://example.com/menu#section-noodles"
    );
  });

  it("scrubs the url token of 'METHOD url' span descriptions without mangling", () => {
    expect(scrubSpanDescription("GET /api/tracking/abc?token=s3cret")).toBe(
      "GET /api/tracking/abc?token=%5Bredacted%5D"
    );
    expect(scrubSpanDescription("POST https://example.com/auth/confirm?token_hash=x")).toBe(
      "POST https://example.com/auth/confirm?token_hash=%5Bredacted%5D"
    );
    // bare-URL descriptions (navigation spans) and prose pass through
    expect(scrubSpanDescription("/orders/tok123/share")).toBe("/orders/[redacted]/share");
    expect(scrubSpanDescription("GET /menu")).toBe("GET /menu");
    expect(scrubSpanDescription("Slow click on button")).toBe("Slow click on button");
  });

  it("scrubs URL-shaped tokens inside console messages without mangling prose", () => {
    expect(scrubConsoleMessage("fetch failed for /api/tracking/abc?token=s3cret retrying")).toBe(
      "fetch failed for /api/tracking/abc?token=%5Bredacted%5D retrying"
    );
    expect(scrubConsoleMessage("share link /orders/tok123/share copied")).toBe(
      "share link /orders/[redacted]/share copied"
    );
    expect(scrubConsoleMessage("plain words no urls at all")).toBe("plain words no urls at all");
    expect(scrubConsoleMessage("ratio 3/4 is fine")).toBe("ratio 3/4 is fine");
  });

  it("scrubs URLs with adjacent sentence punctuation (console path)", () => {
    expect(scrubConsoleMessage("share link /orders/tok123/share, copied")).toBe(
      "share link /orders/[redacted]/share, copied"
    );
    expect(scrubConsoleMessage("(see /api/tracking/abc?token=x).")).toBe(
      "(see /api/tracking/abc?token=%5Bredacted%5D)."
    );
  });

  it("keeps token_hash in the sensitive list (regression pin for driver invites)", () => {
    expect(SENSITIVE_QUERY_PARAMS).toContain("token_hash");
    expect(SENSITIVE_QUERY_PARAMS).toContain("token");
    expect(SENSITIVE_QUERY_PARAMS).toContain("code");
  });
});
