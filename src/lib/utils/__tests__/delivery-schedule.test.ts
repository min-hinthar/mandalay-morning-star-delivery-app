import { describe, expect, it } from "vitest";
import { type DeliveryDayConfig } from "@/types/delivery";
import {
  formatDeliveryDaysList,
  formatHour,
  getNextCutoffText,
  getDeliveryScheduleSummary,
  DAY_NAMES_SHORT,
  DAY_NAMES_FULL,
} from "../delivery-schedule";

// Shared mock delivery days fixture
const MOCK_DELIVERY_DAYS: DeliveryDayConfig[] = [
  {
    id: "mon",
    dayOfWeek: 1,
    isActive: true,
    cutoffDay: 0,
    cutoffHour: 15,
    deliveryFeeCents: 500,
    displayOrder: 0,
  },
  {
    id: "wed",
    dayOfWeek: 3,
    isActive: true,
    cutoffDay: 2,
    cutoffHour: 15,
    deliveryFeeCents: 500,
    displayOrder: 1,
  },
  {
    id: "thu",
    dayOfWeek: 4,
    isActive: true,
    cutoffDay: 3,
    cutoffHour: 15,
    deliveryFeeCents: 500,
    displayOrder: 2,
  },
  {
    id: "sat",
    dayOfWeek: 6,
    isActive: true,
    cutoffDay: 5,
    cutoffHour: 15,
    deliveryFeeCents: 500,
    displayOrder: 3,
  },
];

describe("delivery schedule utilities", () => {
  describe("formatHour", () => {
    it("formats 0 as 12 AM", () => {
      expect(formatHour(0)).toBe("12 AM");
    });

    it("formats 1-11 as 1-11 AM", () => {
      expect(formatHour(1)).toBe("1 AM");
      expect(formatHour(6)).toBe("6 AM");
      expect(formatHour(11)).toBe("11 AM");
    });

    it("formats 12 as 12 PM", () => {
      expect(formatHour(12)).toBe("12 PM");
    });

    it("formats 13-23 as 1-11 PM", () => {
      expect(formatHour(13)).toBe("1 PM");
      expect(formatHour(15)).toBe("3 PM");
      expect(formatHour(18)).toBe("6 PM");
      expect(formatHour(23)).toBe("11 PM");
    });

    it("handles edge hours", () => {
      expect(formatHour(0)).toBe("12 AM");
      expect(formatHour(12)).toBe("12 PM");
      expect(formatHour(23)).toBe("11 PM");
    });
  });

  describe("formatDeliveryDaysList", () => {
    it("returns 'No delivery days' when empty", () => {
      const emptyDays: DeliveryDayConfig[] = [];
      expect(formatDeliveryDaysList(emptyDays)).toBe("No delivery days");
    });

    it("returns single day name", () => {
      const singleDay = MOCK_DELIVERY_DAYS.filter((d) => d.dayOfWeek === 6); // Sat only
      expect(formatDeliveryDaysList(singleDay)).toBe("Sat");
    });

    it("returns two days with ampersand", () => {
      const twoDays = MOCK_DELIVERY_DAYS.filter((d) => d.dayOfWeek === 1 || d.dayOfWeek === 6); // Mon & Sat
      expect(formatDeliveryDaysList(twoDays)).toBe("Mon & Sat");
    });

    it("returns three days with commas and ampersand", () => {
      const threeDays = MOCK_DELIVERY_DAYS.filter((d) => d.dayOfWeek !== 3); // Mon, Thu, Sat
      expect(formatDeliveryDaysList(threeDays)).toBe("Mon, Thu & Sat");
    });

    it("returns four days with commas and ampersand", () => {
      // All four days: Mon, Wed, Thu, Sat
      expect(formatDeliveryDaysList(MOCK_DELIVERY_DAYS)).toBe("Mon, Wed, Thu & Sat");
    });

    it("respects displayOrder when sorting", () => {
      // Create days with non-sequential displayOrder
      const unorderedDays: DeliveryDayConfig[] = [
        { ...MOCK_DELIVERY_DAYS[3], displayOrder: 3 }, // Sat, display order 3
        { ...MOCK_DELIVERY_DAYS[0], displayOrder: 0 }, // Mon, display order 0
        { ...MOCK_DELIVERY_DAYS[2], displayOrder: 2 }, // Thu, display order 2
        { ...MOCK_DELIVERY_DAYS[1], displayOrder: 1 }, // Wed, display order 1
      ];
      expect(formatDeliveryDaysList(unorderedDays)).toBe("Mon, Wed, Thu & Sat");
    });

    it("ignores inactive days", () => {
      const mixedDays = MOCK_DELIVERY_DAYS.map((d) =>
        d.dayOfWeek === 3 ? { ...d, isActive: false } : d
      ); // Disable Wed
      expect(formatDeliveryDaysList(mixedDays)).toBe("Mon, Thu & Sat");
    });

    it("filters only active days before formatting", () => {
      const allInactive = MOCK_DELIVERY_DAYS.map((d) => ({ ...d, isActive: false }));
      expect(formatDeliveryDaysList(allInactive)).toBe("No delivery days");
    });

    it("uses short day names (3 chars)", () => {
      const mondayOnly = MOCK_DELIVERY_DAYS.filter((d) => d.dayOfWeek === 1);
      const result = formatDeliveryDaysList(mondayOnly);
      expect(result).toBe("Mon");
      expect(result.length).toBe(3);
    });

    it("handles all 7 days of week", () => {
      const allDays: DeliveryDayConfig[] = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        id: `day-${dayOfWeek}`,
        dayOfWeek,
        isActive: true,
        cutoffDay: (dayOfWeek - 1 + 7) % 7,
        cutoffHour: 15,
        deliveryFeeCents: 500,
        displayOrder: dayOfWeek,
      }));
      const result = formatDeliveryDaysList(allDays);
      expect(result).toContain("Sun");
      expect(result).toContain("Mon");
      expect(result).toContain("Tue");
      expect(result).toContain("Wed");
      expect(result).toContain("Thu");
      expect(result).toContain("Fri");
      expect(result).toContain("Sat");
    });
  });

  describe("getNextCutoffText", () => {
    it("returns 'No upcoming delivery windows' for invalid dayOfWeek", () => {
      const result = getNextCutoffText(99, MOCK_DELIVERY_DAYS);
      expect(result).toBe("No upcoming delivery windows");
    });

    it("returns 'No upcoming delivery windows' when day not in config", () => {
      const limited = MOCK_DELIVERY_DAYS.filter((d) => d.dayOfWeek !== 2); // Remove Tue
      const result = getNextCutoffText(2, limited); // Ask for Tue
      expect(result).toBe("No upcoming delivery windows");
    });

    it("returns correct text for Monday delivery", () => {
      // Monday delivery: cutoff Sunday 3 PM
      const result = getNextCutoffText(1, MOCK_DELIVERY_DAYS);
      expect(result).toBe("Order by Sunday 3 PM for Monday delivery");
    });

    it("returns correct text for Wednesday delivery", () => {
      // Wednesday delivery: cutoff Tuesday 3 PM
      const result = getNextCutoffText(3, MOCK_DELIVERY_DAYS);
      expect(result).toBe("Order by Tuesday 3 PM for Wednesday delivery");
    });

    it("returns correct text for Thursday delivery", () => {
      // Thursday delivery: cutoff Wednesday 3 PM
      const result = getNextCutoffText(4, MOCK_DELIVERY_DAYS);
      expect(result).toBe("Order by Wednesday 3 PM for Thursday delivery");
    });

    it("returns correct text for Saturday delivery", () => {
      // Saturday delivery: cutoff Friday 3 PM
      const result = getNextCutoffText(6, MOCK_DELIVERY_DAYS);
      expect(result).toBe("Order by Friday 3 PM for Saturday delivery");
    });

    it("uses full day names for both cutoff and delivery days", () => {
      const result = getNextCutoffText(1, MOCK_DELIVERY_DAYS);
      // Should have full day names
      expect(result).toContain("Sunday"); // Full name
      expect(result).toContain("Monday"); // Full name
      // Verify no short-only names (3-char names always appear as prefix of full names)
      expect(result).toBe("Order by Sunday 3 PM for Monday delivery");
    });

    it("respects custom cutoff hour", () => {
      const customConfig: DeliveryDayConfig[] = [
        {
          id: "custom",
          dayOfWeek: 1,
          isActive: true,
          cutoffDay: 0,
          cutoffHour: 9, // 9 AM instead of 3 PM
          deliveryFeeCents: 500,
          displayOrder: 0,
        },
      ];
      const result = getNextCutoffText(1, customConfig);
      expect(result).toBe("Order by Sunday 9 AM for Monday delivery");
    });

    it("ignores inactive days when searching", () => {
      const mixedDays = MOCK_DELIVERY_DAYS.map((d) =>
        d.dayOfWeek === 1 ? { ...d, isActive: false } : d
      ); // Disable Monday
      const result = getNextCutoffText(1, mixedDays);
      expect(result).toBe("No upcoming delivery windows");
    });

    it("returns correct text for Sunday delivery (0)", () => {
      const sundayConfig: DeliveryDayConfig[] = [
        {
          id: "sun",
          dayOfWeek: 0,
          isActive: true,
          cutoffDay: 6,
          cutoffHour: 15,
          deliveryFeeCents: 500,
          displayOrder: 0,
        },
      ];
      const result = getNextCutoffText(0, sundayConfig);
      expect(result).toBe("Order by Saturday 3 PM for Sunday delivery");
    });

    it("returns correct text for Friday delivery", () => {
      const fridayConfig: DeliveryDayConfig[] = [
        {
          id: "fri",
          dayOfWeek: 5,
          isActive: true,
          cutoffDay: 4,
          cutoffHour: 15,
          deliveryFeeCents: 500,
          displayOrder: 0,
        },
      ];
      const result = getNextCutoffText(5, fridayConfig);
      expect(result).toBe("Order by Thursday 3 PM for Friday delivery");
    });

    it("formats cutoff hour correctly (midnight)", () => {
      const midnightConfig: DeliveryDayConfig[] = [
        {
          id: "mid",
          dayOfWeek: 1,
          isActive: true,
          cutoffDay: 0,
          cutoffHour: 0,
          deliveryFeeCents: 500,
          displayOrder: 0,
        },
      ];
      const result = getNextCutoffText(1, midnightConfig);
      expect(result).toContain("12 AM");
    });

    it("formats cutoff hour correctly (noon)", () => {
      const noonConfig: DeliveryDayConfig[] = [
        {
          id: "noon",
          dayOfWeek: 1,
          isActive: true,
          cutoffDay: 0,
          cutoffHour: 12,
          deliveryFeeCents: 500,
          displayOrder: 0,
        },
      ];
      const result = getNextCutoffText(1, noonConfig);
      expect(result).toContain("12 PM");
    });

    it("formats cutoff hour correctly (evening 6 PM)", () => {
      const eveningConfig: DeliveryDayConfig[] = [
        {
          id: "eve",
          dayOfWeek: 1,
          isActive: true,
          cutoffDay: 0,
          cutoffHour: 18,
          deliveryFeeCents: 500,
          displayOrder: 0,
        },
      ];
      const result = getNextCutoffText(1, eveningConfig);
      expect(result).toContain("6 PM");
    });

    it("handles dayOfWeek as negative number", () => {
      const result = getNextCutoffText(-1, MOCK_DELIVERY_DAYS);
      expect(result).toBe("No upcoming delivery windows");
    });
  });

  describe("getDeliveryScheduleSummary", () => {
    it("returns 'No delivery days' for empty", () => {
      const emptyDays: DeliveryDayConfig[] = [];
      expect(getDeliveryScheduleSummary(emptyDays)).toBe("No delivery days");
    });

    it("returns formatted summary with single day", () => {
      const mondayOnly = MOCK_DELIVERY_DAYS.filter((d) => d.dayOfWeek === 1);
      expect(getDeliveryScheduleSummary(mondayOnly)).toBe("Delivery on Mon");
    });

    it("returns formatted summary with multiple days", () => {
      expect(getDeliveryScheduleSummary(MOCK_DELIVERY_DAYS)).toBe(
        "Delivery on Mon, Wed, Thu & Sat"
      );
    });

    it("prefixes with 'Delivery on' for active days", () => {
      const result = getDeliveryScheduleSummary(MOCK_DELIVERY_DAYS);
      expect(result.startsWith("Delivery on")).toBe(true);
    });

    it("does not add 'Delivery on' prefix for no delivery days", () => {
      const emptyDays: DeliveryDayConfig[] = [];
      const result = getDeliveryScheduleSummary(emptyDays);
      expect(result).toBe("No delivery days");
      expect(result.startsWith("Delivery on")).toBe(false);
    });

    it("respects inactive days filtering", () => {
      const mixedDays = MOCK_DELIVERY_DAYS.map((d) =>
        d.dayOfWeek === 3 ? { ...d, isActive: false } : d
      );
      expect(getDeliveryScheduleSummary(mixedDays)).toBe("Delivery on Mon, Thu & Sat");
    });

    it("handles all inactive days", () => {
      const allInactive = MOCK_DELIVERY_DAYS.map((d) => ({ ...d, isActive: false }));
      expect(getDeliveryScheduleSummary(allInactive)).toBe("No delivery days");
    });

    it("combines formatDeliveryDaysList correctly", () => {
      const twoDays = MOCK_DELIVERY_DAYS.filter((d) => d.dayOfWeek === 1 || d.dayOfWeek === 6);
      const listResult = formatDeliveryDaysList(twoDays);
      const summaryResult = getDeliveryScheduleSummary(twoDays);
      expect(summaryResult).toBe(`Delivery on ${listResult}`);
    });
  });

  describe("constants - DAY_NAMES_SHORT", () => {
    it("has 7 entries", () => {
      expect(DAY_NAMES_SHORT).toHaveLength(7);
    });

    it("contains correct short names", () => {
      expect(DAY_NAMES_SHORT[0]).toBe("Sun");
      expect(DAY_NAMES_SHORT[1]).toBe("Mon");
      expect(DAY_NAMES_SHORT[2]).toBe("Tue");
      expect(DAY_NAMES_SHORT[3]).toBe("Wed");
      expect(DAY_NAMES_SHORT[4]).toBe("Thu");
      expect(DAY_NAMES_SHORT[5]).toBe("Fri");
      expect(DAY_NAMES_SHORT[6]).toBe("Sat");
    });

    it("each entry is 3 characters", () => {
      for (const name of DAY_NAMES_SHORT) {
        expect(name).toHaveLength(3);
      }
    });
  });

  describe("constants - DAY_NAMES_FULL", () => {
    it("has 7 entries", () => {
      expect(DAY_NAMES_FULL).toHaveLength(7);
    });

    it("contains correct full names", () => {
      expect(DAY_NAMES_FULL[0]).toBe("Sunday");
      expect(DAY_NAMES_FULL[1]).toBe("Monday");
      expect(DAY_NAMES_FULL[2]).toBe("Tuesday");
      expect(DAY_NAMES_FULL[3]).toBe("Wednesday");
      expect(DAY_NAMES_FULL[4]).toBe("Thursday");
      expect(DAY_NAMES_FULL[5]).toBe("Friday");
      expect(DAY_NAMES_FULL[6]).toBe("Saturday");
    });

    it("all entries are capitalized", () => {
      for (const name of DAY_NAMES_FULL) {
        expect(name[0]).toBe(name[0].toUpperCase());
      }
    });
  });

  describe("integration: formatDeliveryDaysList + formatHour", () => {
    it("day list and hour formatting work together", () => {
      const days = MOCK_DELIVERY_DAYS;
      const daysList = formatDeliveryDaysList(days);
      const hour = formatHour(15);
      const combined = `${daysList} at ${hour}`;
      expect(combined).toBe("Mon, Wed, Thu & Sat at 3 PM");
    });
  });

  describe("edge cases with special characters and formatting", () => {
    it("ampersand is used correctly (not 'and')", () => {
      const result = formatDeliveryDaysList(MOCK_DELIVERY_DAYS);
      expect(result).toContain(" & ");
      expect(result).not.toContain(" and ");
    });

    it("commas have spaces after them", () => {
      const result = formatDeliveryDaysList(MOCK_DELIVERY_DAYS);
      expect(result).toMatch(/, /); // comma followed by space
    });

    it("no trailing comma before ampersand", () => {
      const result = formatDeliveryDaysList(MOCK_DELIVERY_DAYS);
      expect(result).not.toMatch(/, &/); // should not have comma before &
    });

    it("spacing around ampersand is consistent", () => {
      const result = formatDeliveryDaysList(MOCK_DELIVERY_DAYS);
      const ampersandPattern = / & /;
      expect(result).toMatch(ampersandPattern);
    });
  });

  describe("consistency with multi-day delivery dates", () => {
    it("day names in formatDeliveryDaysList match day indices", () => {
      for (let i = 0; i < MOCK_DELIVERY_DAYS.length; i++) {
        const day = MOCK_DELIVERY_DAYS[i];
        const expectedName = DAY_NAMES_SHORT[day.dayOfWeek];
        const formatted = formatDeliveryDaysList([day]);
        expect(formatted).toBe(expectedName);
      }
    });

    it("cutoff day names in getNextCutoffText are correct", () => {
      for (const day of MOCK_DELIVERY_DAYS) {
        const result = getNextCutoffText(day.dayOfWeek, MOCK_DELIVERY_DAYS);
        const expectedCutoffDay = DAY_NAMES_FULL[day.cutoffDay];
        expect(result).toContain(`Order by ${expectedCutoffDay}`);
      }
    });

    it("delivery day names in getNextCutoffText are correct", () => {
      for (const day of MOCK_DELIVERY_DAYS) {
        const result = getNextCutoffText(day.dayOfWeek, MOCK_DELIVERY_DAYS);
        const expectedDeliveryDay = DAY_NAMES_FULL[day.dayOfWeek];
        expect(result).toContain(`for ${expectedDeliveryDay} delivery`);
      }
    });
  });

  describe("real-world usage scenarios", () => {
    it("displays schedule on homepage", () => {
      const summary = getDeliveryScheduleSummary(MOCK_DELIVERY_DAYS);
      expect(summary).toMatch(/^Delivery on (Mon|Tue|Wed|Thu|Fri|Sat|Sun)/);
    });

    it("formats next order deadline for UI", () => {
      const nextCutoff = getNextCutoffText(1, MOCK_DELIVERY_DAYS);
      expect(nextCutoff).toMatch(/^Order by \w+ \d+ (AM|PM) for \w+ delivery$/);
    });

    it("handles multiple scenarios without errors", () => {
      const scenarios = [
        [],
        MOCK_DELIVERY_DAYS,
        MOCK_DELIVERY_DAYS.filter((d) => d.dayOfWeek !== 3),
        MOCK_DELIVERY_DAYS.map((d) => ({ ...d, isActive: false })),
      ];
      for (const days of scenarios) {
        expect(() => {
          formatDeliveryDaysList(days);
          getDeliveryScheduleSummary(days);
        }).not.toThrow();
      }
    });
  });
});
