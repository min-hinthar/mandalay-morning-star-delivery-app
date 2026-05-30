import { describe, expect, it, vi } from "vitest";

import { isPushConfigured, sendPushToUser } from "../send";

// No VAPID env vars are set in the test environment, so push must be inert —
// this guards the "safe to merge before configuring keys" property.
describe("web push without VAPID keys", () => {
  it("reports not configured", () => {
    expect(isPushConfigured()).toBe(false);
  });

  it("sendPushToUser is a no-op and never touches the database", async () => {
    const from = vi.fn();
    const result = await sendPushToUser({ from } as never, "user-1", {
      title: "Out for delivery",
      body: "On its way",
    });
    expect(result).toEqual({ sent: 0 });
    expect(from).not.toHaveBeenCalled();
  });
});
