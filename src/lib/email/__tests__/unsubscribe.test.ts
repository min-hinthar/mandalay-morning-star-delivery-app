import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * Signed one-click unsubscribe tokens.
 *
 * The token IS the authorization — the endpoint it guards is unauthenticated by
 * design (a mail provider POSTs it with no cookies), so everything here is
 * load-bearing: forgeability, scope, and the refusal to distinguish failure
 * modes in a way that would leak whether an account exists.
 */

const SECRET = "test-unsubscribe-secret-value";

/**
 * `null` means "no secret configured" — NOT `undefined`, which would trigger
 * the default parameter and silently set the secret instead of clearing it.
 */
async function loadModule(secret: string | null = SECRET) {
  if (secret === null) delete process.env.UNSUBSCRIBE_TOKEN_SECRET;
  else process.env.UNSUBSCRIBE_TOKEN_SECRET = secret;
  // The secret is read per call rather than captured at import, so a plain
  // import is enough — no module reset needed.
  return import("../unsubscribe");
}

const ORIGINAL_SECRET = process.env.UNSUBSCRIBE_TOKEN_SECRET;

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.UNSUBSCRIBE_TOKEN_SECRET;
  else process.env.UNSUBSCRIBE_TOKEN_SECRET = ORIGINAL_SECRET;
});

describe("unsubscribe tokens", () => {
  beforeEach(() => {
    process.env.UNSUBSCRIBE_TOKEN_SECRET = SECRET;
  });

  it("round-trips a valid token", async () => {
    const { createUnsubscribeToken, verifyUnsubscribeToken } = await loadModule();

    const token = createUnsubscribeToken("user-a", "marketing");
    expect(verifyUnsubscribeToken(token)).toEqual({ userId: "user-a", prefKey: "marketing" });
  });

  it("rejects a tampered signature", async () => {
    const { createUnsubscribeToken, verifyUnsubscribeToken } = await loadModule();

    const token = createUnsubscribeToken("user-a", "marketing");
    const [userId, prefKey, sig] = token.split(".");
    // Flip one character of the signature, keeping the length identical so the
    // length pre-check isn't what rejects it.
    const flipped = (sig[0] === "A" ? "B" : "A") + sig.slice(1);

    expect(verifyUnsubscribeToken(`${userId}.${prefKey}.${flipped}`)).toBeNull();
  });

  it("rejects a token whose USER was swapped — A cannot unsubscribe B", async () => {
    // The signature covers the userId, so lifting a valid signature onto
    // someone else's id must not verify. This is the whole reason the payload
    // is `userId:prefKey` and not just the key.
    const { createUnsubscribeToken, verifyUnsubscribeToken } = await loadModule();

    const tokenA = createUnsubscribeToken("user-a", "marketing");
    const sig = tokenA.split(".")[2];

    expect(verifyUnsubscribeToken(`user-b.marketing.${sig}`)).toBeNull();
  });

  it("rejects a token whose PREF KEY was swapped", async () => {
    // Otherwise a marketing unsubscribe link could be escalated into silencing
    // order updates.
    const { createUnsubscribeToken, verifyUnsubscribeToken } = await loadModule();

    const sig = createUnsubscribeToken("user-a", "marketing").split(".")[2];

    expect(verifyUnsubscribeToken(`user-a.order_updates.${sig}`)).toBeNull();
  });

  it("rejects an unknown pref key even if it were signed", async () => {
    // The key is written into a JSONB column, so it must come from the
    // allow-list — never straight from the token.
    const { verifyUnsubscribeToken, isUnsubscribablePrefKey } = await loadModule();

    expect(isUnsubscribablePrefKey("is_admin")).toBe(false);
    expect(verifyUnsubscribeToken("user-a.is_admin.whatever")).toBeNull();
  });

  it("rejects malformed and empty tokens", async () => {
    const { verifyUnsubscribeToken } = await loadModule();

    for (const bad of ["", ".", "..", "user-a", "user-a.marketing", "a.b.c.d", "user-a..sig"]) {
      expect(verifyUnsubscribeToken(bad)).toBeNull();
    }
  });

  it("produces a different signature per user and per key", async () => {
    const { createUnsubscribeToken } = await loadModule();

    const a = createUnsubscribeToken("user-a", "marketing").split(".")[2];
    const b = createUnsubscribeToken("user-b", "marketing").split(".")[2];
    const c = createUnsubscribeToken("user-a", "reminders").split(".")[2];

    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });

  it("does not verify a token signed with a DIFFERENT secret", async () => {
    // i.e. rotating the secret invalidates outstanding links rather than
    // continuing to honor them.
    const { createUnsubscribeToken } = await loadModule("secret-one");
    const token = createUnsubscribeToken("user-a", "marketing");

    const { verifyUnsubscribeToken } = await loadModule("secret-two");
    expect(verifyUnsubscribeToken(token)).toBeNull();
  });
});

describe("unsubscribe headers", () => {
  it("advertises one-click with a per-recipient URL when configured", async () => {
    const { buildUnsubscribeHeaders } = await loadModule();

    const headers = buildUnsubscribeHeaders("user-a", "marketing");

    expect(headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect(headers["List-Unsubscribe"]).toMatch(/^<.*\/api\/unsubscribe\?token=.+>$/);
  });

  it("gives two different recipients two different URLs", async () => {
    const { buildUnsubscribeHeaders } = await loadModule();

    const a = buildUnsubscribeHeaders("user-a", "marketing")["List-Unsubscribe"];
    const b = buildUnsubscribeHeaders("user-b", "marketing")["List-Unsubscribe"];

    expect(a).not.toBe(b);
  });

  it("does NOT claim one-click when the secret is missing", async () => {
    // The two headers must move together. Promising one-click against a URL
    // that cannot honor it is the original bug: the reader's mail client
    // reports success and nothing changes.
    const { buildUnsubscribeHeaders } = await loadModule(null);

    const headers = buildUnsubscribeHeaders("user-a", "marketing");

    expect(headers).not.toHaveProperty("List-Unsubscribe-Post");
    expect(headers["List-Unsubscribe"]).toContain("/account?tab=settings");
  });

  it("does NOT claim one-click without a recipient id", async () => {
    const { buildUnsubscribeHeaders } = await loadModule();

    for (const userId of [null, undefined, ""]) {
      const headers = buildUnsubscribeHeaders(userId, "marketing");
      expect(headers).not.toHaveProperty("List-Unsubscribe-Post");
    }
  });

  it("url-encodes the token so the header stays parseable", async () => {
    const { buildUnsubscribeUrl } = await loadModule();

    const url = buildUnsubscribeUrl("user-a", "marketing");
    expect(url).not.toBeNull();
    // A base64url signature has no characters needing escaping, but the
    // encoding must be present so a future token format can't break the URL.
    expect(() => new URL(url!)).not.toThrow();
    expect(new URL(url!).searchParams.get("token")).toMatch(/^user-a\.marketing\./);
  });
});
