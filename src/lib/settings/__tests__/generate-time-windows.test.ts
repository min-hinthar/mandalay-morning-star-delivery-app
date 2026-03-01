import { describe, it, expect } from "vitest";
import { generateTimeWindows } from "../generate-time-windows";

describe("generateTimeWindows", () => {
  it("returns 8 windows for hours 11-19", () => {
    const windows = generateTimeWindows(11, 19);
    expect(windows).toHaveLength(8);
  });

  it("first window matches expected format", () => {
    const windows = generateTimeWindows(11, 19);
    expect(windows[0]).toEqual({
      start: "11:00",
      end: "12:00",
      label: "11:00 AM - 12:00 PM",
    });
  });

  it("last window matches expected format", () => {
    const windows = generateTimeWindows(11, 19);
    expect(windows[7]).toEqual({
      start: "18:00",
      end: "19:00",
      label: "6:00 PM - 7:00 PM",
    });
  });

  it("returns 3 windows for hours 9-12 (boundary check)", () => {
    const windows = generateTimeWindows(9, 12);
    expect(windows).toHaveLength(3);
    expect(windows[0]).toEqual({
      start: "09:00",
      end: "10:00",
      label: "9:00 AM - 10:00 AM",
    });
    expect(windows[2]).toEqual({
      start: "11:00",
      end: "12:00",
      label: "11:00 AM - 12:00 PM",
    });
  });

  it("returns 1 window for hours 12-13 with correct PM formatting", () => {
    const windows = generateTimeWindows(12, 13);
    expect(windows).toHaveLength(1);
    expect(windows[0]).toEqual({
      start: "12:00",
      end: "13:00",
      label: "12:00 PM - 1:00 PM",
    });
  });

  it("returns 2 windows for hours 0-2 with AM formatting (edge case)", () => {
    const windows = generateTimeWindows(0, 2);
    expect(windows).toHaveLength(2);
    expect(windows[0]).toEqual({
      start: "00:00",
      end: "01:00",
      label: "12:00 AM - 1:00 AM",
    });
    expect(windows[1]).toEqual({
      start: "01:00",
      end: "02:00",
      label: "1:00 AM - 2:00 AM",
    });
  });

  it("returns empty array when startHour equals endHour", () => {
    const windows = generateTimeWindows(11, 11);
    expect(windows).toHaveLength(0);
  });
});
