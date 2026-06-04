import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import { TierBadge, type TierBadgeTier } from "../TierBadge";

const jade: TierBadgeTier = { id: "jade", name: "Kyauk Sein", english: "Jade", emoji: "💚" };
const newFriend: TierBadgeTier = {
  id: "new",
  name: "New Friend",
  english: "New Friend",
  emoji: "⭐",
};

afterEach(() => cleanup());

describe("TierBadge", () => {
  it("pill variant shows emoji, Burmese name, and English gloss with an AT label", () => {
    render(<TierBadge tier={jade} variant="pill" />);
    const badge = screen.getByLabelText("Tier: Kyauk Sein (Jade)");
    expect(badge.textContent).toContain("Kyauk Sein");
    expect(badge.textContent).toContain("Jade");
  });

  it("omits the gloss when English equals the name", () => {
    render(<TierBadge tier={newFriend} variant="pill" />);
    // label has no parenthetical when name === english
    expect(screen.getByLabelText("Tier: New Friend")).toBeTruthy();
  });

  it("mini variant carries the AT label and is name-only", () => {
    render(<TierBadge tier={jade} variant="mini" />);
    const badge = screen.getByLabelText("Tier: Kyauk Sein (Jade)");
    expect(badge.textContent).toContain("Kyauk Sein");
  });

  it("inline variant applies the tier accent text class", () => {
    render(<TierBadge tier={jade} variant="inline" />);
    const badge = screen.getByLabelText("Tier: Kyauk Sein (Jade)");
    expect(badge.className).toContain("text-accent-green");
  });

  it("decorative emoji is hidden from assistive tech", () => {
    const { container } = render(<TierBadge tier={jade} variant="pill" />);
    const hidden = container.querySelector('[aria-hidden="true"]');
    expect(hidden?.textContent).toContain("💚");
  });
});
