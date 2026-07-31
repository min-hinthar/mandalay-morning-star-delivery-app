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

  it("unsubscribes and renders a confirmation for a human click", async () => {
    const token = createUnsubscribeToken("user-a", "marketing");
    const res = await GET(new Request(`https://example.com/api/unsubscribe?token=${token}`));

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    await expect(res.text()).resolves.toContain("unsubscribed");
    expect(rows["user-a"].notification_prefs.marketing).toBe(false);
  });

  it("renders an error page for a bad token without writing", async () => {
    const res = await GET(new Request("https://example.com/api/unsubscribe?token=nonsense"));

    expect(res.status).toBe(400);
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it("does not reflect the token back into the page", async () => {
    // The page is built by string concatenation, so a token echoed unescaped
    // would be a reflected-XSS vector on an unauthenticated endpoint.
    const payload = "<script>alert(1)</script>";
    const res = await GET(
      new Request(`https://example.com/api/unsubscribe?token=${encodeURIComponent(payload)}`)
    );

    const html = await res.text();
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
