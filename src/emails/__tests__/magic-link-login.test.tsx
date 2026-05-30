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

  it("shows the one-time code when provided, and omits it when not", async () => {
    const withCode = visibleText(
      await render(
        <MagicLinkLogin
          email="aung.myo@example.com"
          magicLink="https://delivery.mandalaymorningstar.com/auth/confirm?token_hash=x&type=magiclink"
          code="481572"
          expiresIn="1 hour"
        />
      )
    );
    expect(withCode).toContain("481572");
    expect(withCode.toLowerCase()).toContain("enter this code");

    const withoutCode = visibleText(
      await render(
        <MagicLinkLogin
          email="aung.myo@example.com"
          magicLink="https://delivery.mandalaymorningstar.com/auth/confirm?token_hash=x&type=magiclink"
          expiresIn="1 hour"
        />
      )
    );
    expect(withoutCode.toLowerCase()).not.toContain("enter this code");
  });
});
