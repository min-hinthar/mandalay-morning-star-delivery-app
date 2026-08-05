/**
 * Recipient-routing regression tests for POST /api/feedback (audit D8).
 *
 * The invariant under guard: the confirmation email may ONLY ever go to an
 * authenticated user's own account email. Sending it to the caller-supplied
 * contactEmail let anonymous submitters make the brand's verified domain
 * email arbitrary addresses with attacker-controlled subject text — this
 * class of fix (recipient routing) regresses invisibly, so it is pinned.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { NextRequest } from "next/server";

const mockCheckRateLimit = vi.fn().mockResolvedValue({ limited: false });
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  apiWriteLimiter: { tier: "api-write" },
  feedbackAnonLimiter: { tier: "feedback-anon" },
  getClientIp: vi.fn().mockReturnValue("203.0.113.9"),
}));

// Execute after() callbacks inline so email sends happen within the test.
vi.mock("next/server", async (importOriginal) => {
  const mod = await importOriginal<typeof import("next/server")>();
  return {
    ...mod,
    after: (cb: () => Promise<void>) => {
      void cb();
    },
  };
});

vi.mock("@/lib/utils/logger", () => ({
  logger: { error: vi.fn(), exception: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

const mockSendEmail = vi.fn().mockResolvedValue({ ok: true });
vi.mock("@/lib/email/send", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

vi.mock("@/emails/AdminFeedbackAlert", () => ({ AdminFeedbackAlert: () => null }));
vi.mock("@/emails/FeedbackConfirmation", () => ({ FeedbackConfirmation: () => null }));

/** The authenticated user for a test run; null = anonymous. */
let currentUser: { id: string; email: string } | null = null;

vi.mock("@/lib/supabase/server", () => {
  const insertChain = {
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "fb-12345678-0000-0000-0000-000000000000" },
          error: null,
        }),
      })),
    })),
    select: vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({
        data: [{ email: "admin@mandalay.example" }],
        error: null,
      }),
    })),
  };
  return {
    createClient: vi.fn(async () => ({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: currentUser } }) },
    })),
    createServiceClient: vi.fn(() => ({ from: vi.fn(() => insertChain) })),
  };
});

import { POST } from "../route";

function feedbackRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("https://example.com/api/feedback", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const flushAfter = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  (mockSendEmail as Mock).mockClear();
  (mockCheckRateLimit as Mock).mockClear();
  currentUser = null;
});

describe("POST /api/feedback — confirmation recipient routing (D8)", () => {
  it("anonymous submission NEVER emails the caller-supplied address", async () => {
    currentUser = null;

    const res = await POST(
      feedbackRequest({
        category: "bug_report",
        subject: "Claim your prize now",
        message: "spam payload body text",
        contactEmail: "victim@example.com",
      })
    );
    await flushAfter();

    expect(res.status).toBe(201);
    const recipients = (mockSendEmail as Mock).mock.calls.map(
      (c) => (c[0] as { to: string; type: string }).to
    );
    // Admin alert only — the victim address must not appear anywhere.
    expect(recipients).toContain("admin@mandalay.example");
    expect(recipients).not.toContain("victim@example.com");
    const types = (mockSendEmail as Mock).mock.calls.map((c) => (c[0] as { type: string }).type);
    expect(types).not.toContain("feedback_confirmation");
  });

  it("authenticated submission confirms to the ACCOUNT email, never a mismatched contactEmail", async () => {
    currentUser = { id: "user-1", email: "customer@example.com" };

    const res = await POST(
      feedbackRequest({
        category: "bug_report",
        subject: "Broken cart page",
        message: "cart breaks on submit",
        contactEmail: "someone-else@example.com",
      })
    );
    await flushAfter();

    expect(res.status).toBe(201);
    const confirmation = (mockSendEmail as Mock).mock.calls
      .map((c) => c[0] as { to: string; type: string })
      .find((c) => c.type === "feedback_confirmation");
    expect(confirmation?.to).toBe("customer@example.com");
    const recipients = (mockSendEmail as Mock).mock.calls.map((c) => (c[0] as { to: string }).to);
    expect(recipients).not.toContain("someone-else@example.com");
  });

  it("anonymous callers are limited on the strict feedback-anon tier", async () => {
    currentUser = null;
    await POST(
      feedbackRequest({
        category: "bug_report",
        subject: "subject line",
        message: "message body text",
        contactEmail: "a@example.com",
      })
    );
    const limiterArg = (mockCheckRateLimit as Mock).mock.calls[0][0] as {
      limiter: { tier: string };
      role: string;
    };
    expect(limiterArg.limiter.tier).toBe("feedback-anon");
    expect(limiterArg.role).toBe("anon");
  });

  it("authenticated callers keep the api-write tier", async () => {
    currentUser = { id: "user-1", email: "customer@example.com" };
    await POST(
      feedbackRequest({
        category: "bug_report",
        subject: "subject line",
        message: "message body text",
      })
    );
    const limiterArg = (mockCheckRateLimit as Mock).mock.calls[0][0] as {
      limiter: { tier: string };
    };
    expect(limiterArg.limiter.tier).toBe("api-write");
  });
});
