import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useHeroFx } from "../useHeroFx";

// Sentry beacons are gated to production builds, but mock anyway so a stray
// call can never hit the network during tests.
vi.mock("@sentry/nextjs", () => ({
  captureMessage: vi.fn(),
}));

const realMatchMedia = window.matchMedia;

/** Force matchMedia so a given query reports `matches: true`. */
function mockMatchMedia(trueFor: (query: string) => boolean) {
  window.matchMedia = ((query: string) => ({
    matches: trueFor(query),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  })) as typeof window.matchMedia;
}

describe("useHeroFx", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    window.matchMedia = realMatchMedia;
  });

  it("defaults to the crash-safe baseline on a non-desktop device (the OOM floor)", () => {
    // jsdom's default matchMedia mock returns matches:false for everything →
    // not a desktop (no hover+fine pointer) → baseline.
    const { result } = renderHook(() => useHeroFx());
    expect(result.current.profile).toBe("baseline");
    // The invariant that prevents the iOS WebKit OOM: no blurred/full-screen
    // GPU layers in the budget.
    expect(result.current.orbs).toBe(false);
    expect(result.current.orbBlur).toBe(false);
    expect(result.current.auroras).toBe(false);
    expect(result.current.spotlight).toBe(false);
    expect(result.current.emojiCount).toBe(7);
  });

  it("uses the rich profile on a hover + fine-pointer (desktop) device", () => {
    mockMatchMedia((q) => q.includes("hover: hover") && q.includes("pointer: fine"));
    const { result } = renderHook(() => useHeroFx());
    expect(result.current.profile).toBe("rich");
    expect(result.current.orbs).toBe(true);
    expect(result.current.orbBlur).toBe(true);
    expect(result.current.auroras).toBe(true);
    expect(result.current.spotlight).toBe(true);
    expect(result.current.interactiveEmojis).toBe(true);
    expect(result.current.emojiCount).toBe(17);
  });

  it("honors the ?fx= override and never blurs orbs in the lite profile", () => {
    window.history.replaceState({}, "", "/?fx=lite");
    const { result } = renderHook(() => useHeroFx());
    expect(result.current.profile).toBe("lite");
    expect(result.current.orbs).toBe(true);
    // lite seats orbs via gradient falloff — no blur() backing store on mobile.
    expect(result.current.orbBlur).toBe(false);
    expect(result.current.auroras).toBe(false);
    expect(result.current.spotlight).toBe(false);
  });

  it("?fx=baseline forces the floor even on a desktop device", () => {
    mockMatchMedia((q) => q.includes("hover: hover") && q.includes("pointer: fine"));
    window.history.replaceState({}, "", "/?fx=baseline");
    const { result } = renderHook(() => useHeroFx());
    expect(result.current.profile).toBe("baseline");
    expect(result.current.orbs).toBe(false);
  });
});
