import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";

// CRON_SECRET is read at module load — set before the route is (dynamically) imported.
process.env.CRON_SECRET = "test-secret";

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ limited: false }),
  webhookLimiter: {},
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), exception: vi.fn() },
}));

let mockCreateServiceClient: Mock;
vi.mock("@/lib/supabase/server", () => {
  mockCreateServiceClient = vi.fn();
  return { createServiceClient: mockCreateServiceClient };
});

function req(auth?: string) {
  return new Request("http://localhost/api/cron/refresh-analytics", {
    headers: auth ? { authorization: auth } : {},
  });
}

function serviceClientWithRpc(rpcResult: { error: unknown }) {
  const rpc = vi.fn().mockResolvedValue(rpcResult);
  mockCreateServiceClient.mockReturnValue({ rpc });
  return rpc;
}

describe("refresh-analytics cron", () => {
  let GET: (request: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";
    GET = (await import("../route")).GET;
  });

  it("rejects a wrong bearer token", async () => {
    serviceClientWithRpc({ error: null });
    const res = await GET(req("Bearer wrong"));
    expect(res.status).toBe(401);
    expect(mockCreateServiceClient).not.toHaveBeenCalled();
  });

  it("rejects a request with no authorization header", async () => {
    serviceClientWithRpc({ error: null });
    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it("fails CLOSED when CRON_SECRET is not configured", async () => {
    // Module-level read: reset the registry and re-import without the secret.
    vi.resetModules();
    delete process.env.CRON_SECRET;
    const { GET: GetNoSecret } = await import("../route");
    serviceClientWithRpc({ error: null });
    const res = await GetNoSecret(req("Bearer test-secret"));
    expect(res.status).toBe(401);
    process.env.CRON_SECRET = "test-secret";
    vi.resetModules();
  });

  it("returns the rate-limit response when limited", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    (checkRateLimit as Mock).mockResolvedValueOnce({
      limited: true,
      response: new Response(null, { status: 429 }),
    });
    serviceClientWithRpc({ error: null });
    const res = await GET(req("Bearer test-secret"));
    expect(res.status).toBe(429);
  });

  it("returns 500 when the refresh RPC fails (never swallow into 200)", async () => {
    serviceClientWithRpc({ error: { message: "deadlock detected" } });
    const res = await GET(req("Bearer test-secret"));
    expect(res.status).toBe(500);
    const { logger } = await import("@/lib/utils/logger");
    expect(logger.exception).toHaveBeenCalled();
  });

  it("returns 200 with refreshed:true on success", async () => {
    const rpc = serviceClientWithRpc({ error: null });
    const res = await GET(req("Bearer test-secret"));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("refresh_analytics_views");
    expect(json.refreshed).toBe(true);
    expect(typeof json.durationMs).toBe("number");
  });
});
