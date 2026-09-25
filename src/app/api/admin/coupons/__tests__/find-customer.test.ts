import { describe, expect, it, vi } from "vitest";

import { findCustomerByEmail } from "../find-customer";

function service(
  profiles: { id: string; full_name: string | null }[],
  authEmails: Record<string, string>
) {
  return {
    from: () => ({
      select: () => ({
        ilike: () => ({ limit: async () => ({ data: profiles, error: null }) }),
      }),
    }),
    auth: {
      admin: {
        getUserById: vi.fn(async (id: string) => ({
          data: { user: { id, email: authEmails[id] } },
          error: null,
        })),
      },
    },
  } as unknown as Parameters<typeof findCustomerByEmail>[0];
}

describe("findCustomerByEmail", () => {
  it("ignores a profile that merely copied the email (squatter) and picks the verified owner", async () => {
    const s = service(
      [
        { id: "squatter", full_name: "Mallory" },
        { id: "owner", full_name: "Aung Aung" },
      ],
      { squatter: "mallory@x.com", owner: "Aung@Example.com" }
    );
    expect(await findCustomerByEmail(s, "aung@example.com")).toEqual({
      id: "owner",
      email: "Aung@Example.com",
      full_name: "Aung Aung",
    });
  });

  it("returns null when no account signs in with that email", async () => {
    const s = service([{ id: "squatter", full_name: null }], { squatter: "mallory@x.com" });
    expect(await findCustomerByEmail(s, "aung@example.com")).toBeNull();
  });
});
