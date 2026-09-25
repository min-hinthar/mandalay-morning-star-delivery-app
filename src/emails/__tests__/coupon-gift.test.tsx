import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";

import { CouponGift } from "../CouponGift";

function visibleText(html: string): string {
  return html.replace(/<!-- -->/g, "").replace(/&amp;/g, "&");
}

describe("CouponGift email", () => {
  it("shows the offer, the code, the terms, and the menu link", async () => {
    const html = visibleText(
      await render(
        <CouponGift
          customerName="Aung"
          offerLabel="Free delivery"
          promoCode="FREEDEL-AB2C3D"
          expiresOn="Oct 31, 2026"
          minimumLabel="$40.00"
          menuUrl="https://delivery.mandalaymorningstar.com/menu?src=coupon_gift"
        />
      )
    );
    expect(html).toContain("Aung");
    expect(html.toLowerCase()).toContain("free delivery");
    expect(html).toContain("FREEDEL-AB2C3D");
    expect(html).toContain("One-time use");
    expect(html).toContain("$40.00");
    expect(html).toContain("Oct 31, 2026");
    expect(html).toContain("/menu?src=coupon_gift");
  });
});
