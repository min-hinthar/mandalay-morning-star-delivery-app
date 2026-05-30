import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";

import { MagicLinkLogin } from "../MagicLinkLogin";

// HTML-escapes `&` in hrefs and inserts empty comment separators between
// adjacent JSX expressions; normalize so assertions match the visible text.
function visibleText(html: string): string {
  return html.replace(/<!-- -->/g, "").replace(/&amp;/g, "&");
}

describe("MagicLinkLogin email", () => {
  it("renders the sign-in CTA, the recipient, and a copy-paste fallback link", async () => {
    const magicLink =
      "https://delivery.mandalaymorningstar.com/auth/confirm?token_hash=abc123&type=magiclink&next=%2Fmenu";
    const html = visibleText(
      await render(
        <MagicLinkLogin email="aung.myo@example.com" magicLink={magicLink} expiresIn="1 hour" />
      )
    );

    // CTA points at the magic link
    expect(html).toContain(magicLink);
    // Recipient is shown
    expect(html).toContain("aung.myo@example.com");
    // Security/expiry copy is present
    expect(html).toContain("1 hour");
    expect(html.toLowerCase()).toContain("sign in");
  });
});
