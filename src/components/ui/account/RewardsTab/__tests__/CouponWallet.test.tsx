import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CouponWallet, type WalletItem } from "../CouponWallet";

// next/link → plain anchor for jsdom
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function item(overrides: Partial<WalletItem> = {}): WalletItem {
  return {
    id: "r1",
    code: "KYAYZU-ABC2345",
    kind: "loyalty",
    amountCents: 800,
    label: "10-order thank-you",
    createdAt: "2026-05-01T00:00:00.000Z",
    expiresAt: "2026-06-30T00:00:00.000Z",
    ...overrides,
  };
}

afterEach(() => cleanup());

describe("CouponWallet", () => {
  it("renders the empty state (bilingual) with no cards", () => {
    render(<CouponWallet items={[]} />);
    expect(screen.getByText(/No coupons yet/i)).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Use .* at checkout/i })).toBeNull();
  });

  it("renders a coupon with an accessible copy button and Use link", () => {
    render(<CouponWallet items={[item()]} />);
    expect(screen.getByText(/10-order thank-you/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Copy code KYAYZU-ABC2345/i })).toBeTruthy();
    const use = screen.getByRole("link", { name: /Use \$8\.00 reward at checkout/i });
    expect(use.getAttribute("href")).toBe("/checkout?promo=KYAYZU-ABC2345");
  });

  describe("copy interaction", () => {
    function stubClipboard(writeText: ReturnType<typeof vi.fn>) {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText },
        configurable: true,
      });
    }

    it("copies the code and announces success via aria-live", async () => {
      // setup() installs its own clipboard stub — override it afterwards so ours wins.
      const user = userEvent.setup();
      const writeText = vi.fn().mockResolvedValue(undefined);
      stubClipboard(writeText);
      render(<CouponWallet items={[item()]} />);
      await user.click(screen.getByRole("button", { name: /Copy code/i }));
      expect(writeText).toHaveBeenCalledWith("KYAYZU-ABC2345");
      await waitFor(() => expect(screen.getByText(/Code copied to clipboard/i)).toBeTruthy());
    });

    it("shows the manual-copy fallback when the clipboard is blocked", async () => {
      const user = userEvent.setup();
      stubClipboard(vi.fn().mockRejectedValue(new Error("denied")));
      // jsdom lacks Selection/Range APIs used in the fallback — stub them.
      const realGetSelection = window.getSelection;
      window.getSelection = vi.fn(() => ({
        removeAllRanges: vi.fn(),
        addRange: vi.fn(),
      })) as unknown as typeof window.getSelection;
      document.createRange = vi.fn(() => ({
        selectNodeContents: vi.fn(),
      })) as unknown as typeof document.createRange;

      render(<CouponWallet items={[item()]} />);
      await user.click(screen.getByRole("button", { name: /Copy code/i }));
      await waitFor(() => expect(screen.getByText(/Press and hold to copy/i)).toBeTruthy());

      window.getSelection = realGetSelection;
    });
  });

  it("flags an expiring-soon coupon in Burmese with the clock", () => {
    const soon = new Date(Date.now() + 2 * 86_400_000).toISOString();
    render(<CouponWallet items={[item({ expiresAt: soon })]} />);
    // The expiry line is the lang="my" run that carries day/today/tomorrow text.
    const myRuns = Array.from(document.querySelectorAll('[lang="my"]')).map((n) => n.textContent);
    expect(myRuns.some((t) => /ရက်|မနက်ဖြန်|ဒီနေ့/.test(t ?? ""))).toBe(true);
  });
});
