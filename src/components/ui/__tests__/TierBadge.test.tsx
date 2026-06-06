import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { TierBadge, type TierBadgeTier } from "../TierBadge";

// `jade` is the internal tier id; it is displayed as Diamond (Sein / 💎).
const diamond: TierBadgeTier = { id: "jade", name: "Sein", english: "Diamond", emoji: "💎" };
const newFriend: TierBadgeTier = {
  id: "new",
  name: "New Friend",
  english: "New Friend",
  emoji: "⭐",
};

afterEach(() => cleanup());

describe("TierBadge", () => {
  it("pill variant shows emoji, Burmese name, and English gloss with an AT label", () => {
    render(<TierBadge tier={diamond} variant="pill" />);
    const badge = screen.getByLabelText("Tier: Sein (Diamond)");
    expect(badge.textContent).toContain("Sein");
    expect(badge.textContent).toContain("Diamond");
  });

  it("omits the gloss when English equals the name", () => {
    render(<TierBadge tier={newFriend} variant="pill" />);
    // label has no parenthetical when name === english
    expect(screen.getByLabelText("Tier: New Friend")).toBeTruthy();
  });

  it("mini variant carries the AT label and is name-only", () => {
    render(<TierBadge tier={diamond} variant="mini" />);
    const badge = screen.getByLabelText("Tier: Sein (Diamond)");
    expect(badge.textContent).toContain("Sein");
  });

  it("inline variant applies the tier accent text class", () => {
    render(<TierBadge tier={diamond} variant="inline" />);
    const badge = screen.getByLabelText("Tier: Sein (Diamond)");
    expect(badge.className).toContain("text-accent-teal");
  });

  it("decorative emoji is hidden from assistive tech", () => {
    const { container } = render(<TierBadge tier={diamond} variant="pill" />);
    const hidden = container.querySelector('[aria-hidden="true"]');
    expect(hidden?.textContent).toContain("💎");
  });
});
