import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * POST /api/unsubscribe is UNAUTHENTICATED by design — a mail provider calls it
 * with no cookies, no CSRF token, and no session. The signed token is the only
 * authorization, so these pin what it does and does not permit.
 */

const SECRET = "test-unsubscribe-secret-value";
process.env.UNSUBSCRIBE_TOKEN_SECRET = SECRET;

/** In-memory customer_settings, keyed by user_id. */
let rows: Record<string, { notification_prefs: Record<string, boolean> }> = {};
let readError: { message: string; code: string } | null = null;
let writeError: { message: string; code: string } | null = null;
const upsertSpy = vi.fn();

vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), exception: vi.fn() },
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({
        eq: (_col: string, userId: string) => ({
          maybeSingle: async () =>
            readError
              ? { data: null, error: readError }
              : { data: rows[userId] ?? null, error: null },
        }),
      }),
      upsert: async (row: { user_id: string; notification_prefs: Record<string, boolean> }) => {
        upsertSpy(row);
        if (writeError) return { error: writeError };
        rows[row.user_id] = { notification_prefs: row.notification_prefs };
        return { error: null };
      },
    }),
  }),
}));

const { POST, GET } = await import("../route");
const { createUnsubscribeToken } = await import("@/lib/email/unsubscribe");

function postRequest(token?: string, { inBody = false } = {}) {
  const url = inBody
    ? "https://example.com/api/unsubscribe"
    : `https://example.com/api/unsubscribe?token=${encodeURIComponent(token ?? "")}`;

  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    // What Gmail/Apple Mail actually send.
    body: inBody
      ? `List-Unsubscribe=One-Click&token=${encodeURIComponent(token ?? "")}`
      : "List-Unsubscribe=One-Click",
  });
}

describe("POST /api/unsubscribe", () => {
  beforeEach(() => {
    rows = {};
    readError = null;
    writeError = null;
    upsertSpy.mockReset();
    process.env.UNSUBSCRIBE_TOKEN_SECRET = SECRET;
  });

  afterEach(() => {
    process.env.UNSUBSCRIBE_TOKEN_SECRET = SECRET;
  });

  it("flips the targeted pref off for a valid token", async () => {
    const res = await POST(postRequest(createUnsubscribeToken("user-a", "marketing")));

    expect(res.status).toBe(200);
    expect(rows["user-a"].notification_prefs.marketing).toBe(false);
  });

  it("leaves the OTHER prefs alone", async () => {
    // Unsubscribing from marketing must not silence order updates — the whole
    // reason the token is scoped to one key.
    await POST(postRequest(createUnsubscribeToken("user-a", "marketing")));

    expect(rows["user-a"].notification_prefs.order_updates).toBe(true);
    expect(rows["user-a"].notification_prefs.reminders).toBe(true);
  });

  it("preserves an existing opt-out rather than resetting it to the default", async () => {
    rows["user-a"] = {
      notification_prefs: { order_updates: false, marketing: true, reminders: true },
    };

    await POST(postRequest(createUnsubscribeToken("user-a", "marketing")));

    expect(rows["user-a"].notification_prefs.marketing).toBe(false);
    // Would silently RE-SUBSCRIBE them to order updates if the write clobbered
    // the row with defaults instead of merging.
    expect(rows["user-a"].notification_prefs.order_updates).toBe(false);
  });

  it("is idempotent — a repeat POST still succeeds", async () => {
    const token = createUnsubscribeToken("user-a", "marketing");

    const first = await POST(postRequest(token));
    const second = await POST(postRequest(token));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(rows["user-a"].notification_prefs.marketing).toBe(false);
  });

  it("accepts the token in the form body as well as the query string", async () => {
    const res = await POST(
      postRequest(createUnsubscribeToken("user-a", "marketing"), { inBody: true })
    );

    expect(res.status).toBe(200);
    expect(rows["user-a"].notification_prefs.marketing).toBe(false);
  });

  it("rejects a missing token", async () => {
    const res = await POST(
      new Request("https://example.com/api/unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "List-Unsubscribe=One-Click",
      })
    );

    expect(res.status).toBe(400);
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it("rejects a tampered token and writes nothing", async () => {
    const token = createUnsubscribeToken("user-a", "marketing");
    const [u, k, sig] = token.split(".");
    const forged = `${u}.${k}.${(sig[0] === "A" ? "B" : "A") + sig.slice(1)}`;

    const res = await POST(postRequest(forged));

    expect(res.status).toBe(400);
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it("a token for user A cannot unsubscribe user B", async () => {
    const sig = createUnsubscribeToken("user-a", "marketing").split(".")[2];

    const res = await POST(postRequest(`user-b.marketing.${sig}`));

    expect(res.status).toBe(400);
    expect(rows["user-b"]).toBeUndefined();
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it("succeeds idempotently for a DELETED account instead of retry-looping", async () => {
    // customer_settings.user_id cascades from profiles, but the token has no
    // expiry — so a link in an old email outlives account deletion. The upsert
    // then hits a FK violation (23503). A 500 would put the provider's
    // One-Click POST into a retry-forever loop; there is nobody left to
    // unsubscribe, so it's a success.
    writeError = { message: "violates foreign key constraint", code: "23503" };

    const res = await POST(postRequest(createUnsubscribeToken("user-gone", "marketing")));

    expect(res.status).toBe(200);
  });

  it("500s on a failed write so the provider retries", async () => {
    // A silent 200 here would leave the customer subscribed while their mail
    // client reports they're not.
    writeError = { message: "permission denied", code: "42501" };

    const res = await POST(postRequest(createUnsubscribeToken("user-a", "marketing")));

    expect(res.status).toBe(500);
  });

  it("500s on a failed read rather than clobbering unknown prefs", async () => {
    readError = { message: "timeout", code: "57014" };

    const res = await POST(postRequest(createUnsubscribeToken("user-a", "marketing")));

    expect(res.status).toBe(500);
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it("503s when no secret is configured", async () => {
    delete process.env.UNSUBSCRIBE_TOKEN_SECRET;

    const res = await POST(postRequest("user-a.marketing.anything"));

    expect(res.status).toBe(503);
    expect(upsertSpy).not.toHaveBeenCalled();
  });
});

describe("GET /api/unsubscribe", () => {
  beforeEach(() => {
    rows = {};
    readError = null;
    writeError = null;
    upsertSpy.mockReset();
    process.env.UNSUBSCRIBE_TOKEN_SECRET = SECRET;
  });

  it("NEVER mutates — a scanner prefetch must not unsubscribe anyone", async () => {
    // Corporate mail security (Safe Links, Proofpoint, Mimecast) GETs every
    // URL in an email before the reader sees it, carrying the real token. A
    // GET that unsubscribed on load would opt customers out sight unseen —
    // which is exactly why RFC 8058 makes one-click POST-only.
    const token = createUnsubscribeToken("user-a", "marketing");
    const res = await GET(new Request(`https://example.com/api/unsubscribe?token=${token}`));

    expect(res.status).toBe(200);
    expect(upsertSpy).not.toHaveBeenCalled();
    expect(rows["user-a"]).toBeUndefined();
  });

  it("renders a confirm form that POSTs the same token back", async () => {
    const token = createUnsubscribeToken("user-a", "marketing");
    const res = await GET(new Request(`https://example.com/api/unsubscribe?token=${token}`));

    const html = await res.text();
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(html).toContain('method="post"');
    expect(html).toContain(`value="${token}"`);
    expect(html).toContain('name="confirm"');
  });

  it("the human flow completes: GET confirm page, then form POST unsubscribes", async () => {
    const token = createUnsubscribeToken("user-a", "marketing");

    await GET(new Request(`https://example.com/api/unsubscribe?token=${token}`));
    expect(rows["user-a"]).toBeUndefined();

    // What the rendered form submits.
    const res = await POST(
      new Request("https://example.com/api/unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: `token=${encodeURIComponent(token)}&confirm=1`,
      })
    );

    expect(res.status).toBe(200);
    // Human form submit gets the readable outcome, not JSON.
    expect(res.headers.get("content-type")).toContain("text/html");
    await expect(res.text()).resolves.toContain("unsubscribed");
    expect(rows["user-a"].notification_prefs.marketing).toBe(false);
  });

  it("renders an error page for a bad token without writing", async () => {
    const res = await GET(new Request("https://example.com/api/unsubscribe?token=nonsense"));

    expect(res.status).toBe(400);
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it("does not reflect an INVALID token back into the page", async () => {
    // The page is built by string concatenation, so a token echoed unescaped
    // would be a reflected-XSS vector on an unauthenticated endpoint. A VALID
    // token is echoed into the confirm form, but only attribute-escaped and
    // only after verification constrains it to uuid.allowlisted-key.base64url.
    const payload = "<script>alert(1)</script>";
    const res = await GET(
      new Request(`https://example.com/api/unsubscribe?token=${encodeURIComponent(payload)}`)
    );

    const html = await res.text();
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  it("does not claim delivery updates are unaffected for an order_updates unsubscribe", async () => {
    // Reachable: out_for_delivery / delivered / arriving_soon / cancellation
    // are non-mandatory and advertise one-click keyed to order_updates. The
    // reassurance must not describe the exact emails being stopped.
    const token = createUnsubscribeToken("user-a", "order_updates");
    const res = await GET(new Request(`https://example.com/api/unsubscribe?token=${token}`));

    const html = await res.text();
    expect(html).not.toContain("delivery updates for orders you place are unaffected");
    expect(html).toContain("order confirmations and refund receipts");
  });
});
