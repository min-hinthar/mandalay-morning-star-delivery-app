import { render } from "@react-email/render";
import { Text } from "@react-email/components";
import { describe, expect, it } from "vitest";

import { EmailLayout } from "../components/EmailLayout";

function visibleText(html: string): string {
  return html.replace(/<!-- -->/g, "").replace(/&amp;/g, "&");
}

describe("email footer referral nudge", () => {
  it("appears on customer emails by default (bilingual, warm)", async () => {
    const html = visibleText(
      await render(
        <EmailLayout previewText="x">
          <Text>body</Text>
        </EmailLayout>
      )
    );
    expect(html).toContain("Tell a friend");
    expect(html).toContain("ချစ်ရင် ပြောပြလိုက်ပါနော်");
  });

  it("is hidden when showReferral is false (admin / negative / auth mail)", async () => {
    const html = visibleText(
      await render(
        <EmailLayout previewText="x" showReferral={false}>
          <Text>body</Text>
        </EmailLayout>
      )
    );
    expect(html).not.toContain("Tell a friend");
  });
});
