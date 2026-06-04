import { describe, it, expect } from "vitest";
import { getCountdownState, formatTimeLeft, DEFAULT_URGENT_THRESHOLD_MS } from "../countdown";

const NOW = new Date("2026-06-04T12:00:00.000Z");

function at(offsetMs: number) {
  return new Date(NOW.getTime() + offsetMs);
}

describe("getCountdownState", () => {
  it("returns calm well before the cutoff", () => {
    const state = getCountdownState(at(5 * 60 * 60 * 1000), { now: NOW }); // +5h
    expect(state.phase).toBe("calm");
    expect(state.hours).toBe(5);
    expect(state.minutes).toBe(0);
  });

  it("returns urgent inside the threshold window", () => {
    const state = getCountdownState(at(90 * 60 * 1000), { now: NOW }); // +90m
    expect(state.phase).toBe("urgent");
    expect(state.hours).toBe(1);
    expect(state.minutes).toBe(30);
  });

  it("treats exactly-at-threshold as urgent (inclusive boundary)", () => {
    const state = getCountdownState(at(DEFAULT_URGENT_THRESHOLD_MS), { now: NOW });
    expect(state.phase).toBe("urgent");
  });

  it("locks once the cutoff has passed", () => {
    const state = getCountdownState(at(-1000), { now: NOW });
    expect(state.phase).toBe("locked");
    expect(state.totalMs).toBe(0);
  });

  it("locks exactly at the cutoff instant", () => {
    const state = getCountdownState(NOW, { now: NOW });
    expect(state.phase).toBe("locked");
  });

  it("locks (not throws) on an unparseable cutoff", () => {
    const state = getCountdownState("not-a-date", { now: NOW });
    expect(state.phase).toBe("locked");
  });

  it("accepts ISO strings and numeric timestamps", () => {
    const iso = getCountdownState(at(3 * 60 * 60 * 1000).toISOString(), { now: NOW });
    const num = getCountdownState(at(3 * 60 * 60 * 1000).getTime(), { now: NOW });
    expect(iso.hours).toBe(3);
    expect(num.hours).toBe(3);
  });

  it("computes multi-day windows", () => {
    const state = getCountdownState(at(50 * 60 * 60 * 1000), { now: NOW }); // +50h
    expect(state.days).toBe(2);
    expect(state.hours).toBe(50);
  });

  it("respects a custom urgent threshold", () => {
    const state = getCountdownState(at(30 * 60 * 1000), {
      now: NOW,
      urgentThresholdMs: 10 * 60 * 1000, // 10m window
    });
    expect(state.phase).toBe("calm"); // 30m left, only urgent under 10m
  });
});

describe("formatTimeLeft", () => {
  it("shows days+hours when multiple days out", () => {
    expect(formatTimeLeft(getCountdownState(at(50 * 60 * 60 * 1000), { now: NOW }))).toBe("2d 2h");
  });

  it("shows bare days when on a day boundary", () => {
    expect(formatTimeLeft(getCountdownState(at(48 * 60 * 60 * 1000), { now: NOW }))).toBe("2d");
  });

  it("shows hours+minutes under a day", () => {
    expect(formatTimeLeft(getCountdownState(at(83 * 60 * 1000), { now: NOW }))).toBe("1h 23m");
  });

  it("shows seconds (zero-padded) in the final minute", () => {
    expect(formatTimeLeft(getCountdownState(at(8 * 60 * 1000 + 4000), { now: NOW }))).toBe(
      "8m 04s"
    );
  });

  it("shows bare seconds in the final minute", () => {
    expect(formatTimeLeft(getCountdownState(at(9000), { now: NOW }))).toBe("9s");
  });

  it("shows Closed once locked", () => {
    expect(formatTimeLeft(getCountdownState(at(-1), { now: NOW }))).toBe("Closed");
  });
});
