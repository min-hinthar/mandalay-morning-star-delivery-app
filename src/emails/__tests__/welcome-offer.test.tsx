import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";

import { WelcomeOffer } from "../WelcomeOffer";

function visibleText(html: string): string {
  return html.replace(/<!-- -->/g, "").replace(/&amp;/g, "&");
}

describe("WelcomeOffer email", () => {
  it("greets the new customer with the offer and a menu link", async () => {
    const html = visibleText(
      await render(
        <WelcomeOffer
          customerName="Aung"
          discountCents={500}
          menuUrl="https://mandalaymorningstar.com/menu?src=welcome_email"
        />
      )
    );
    expect(html).toContain("Aung");
    expect(html).toContain("Welcome to the family");
    expect(html).toContain("$5.00 off your first order");
    // Bilingual offer line (warm, casual Burmese)
    expect(html).toContain("ပထမဆုံးအော်ဒါ");
    expect(html).toContain("https://mandalaymorningstar.com/menu?src=welcome_email");
  });

  it("reflects a different discount amount", async () => {
    const html = visibleText(
      await render(
        <WelcomeOffer customerName="Mya" discountCents={1000} menuUrl="https://example.com/menu" />
      )
    );
    expect(html).toContain("$10.00 off your first order");
  });
});
