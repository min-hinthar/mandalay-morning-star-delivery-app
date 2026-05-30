import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";

import { WinBack } from "../WinBack";

function visibleText(html: string): string {
  return html.replace(/<!-- -->/g, "").replace(/&amp;/g, "&");
}

describe("WinBack email", () => {
  it("greets the customer and links to the menu", async () => {
    const html = visibleText(
      await render(
        <WinBack customerName="Aung" menuUrl="https://delivery.mandalaymorningstar.com/menu" />
      )
    );
    expect(html).toContain("Aung");
    expect(html.toLowerCase()).toContain("missed you");
    expect(html.toLowerCase()).toContain("see this week");
    expect(html).toContain("https://delivery.mandalaymorningstar.com/menu");
  });
});
