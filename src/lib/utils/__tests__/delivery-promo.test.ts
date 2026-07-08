import { describe, expect, it } from "vitest";

import {
  extendedFeeNote,
  freeDeliveryHeadline,
  freeDeliveryPromoLine,
  freeDeliveryQualifier,
  localRangeLabel,
} from "../delivery-promo";

describe("delivery-promo copy", () => {
  it("uses business-rule defaults when no options are passed", () => {
    expect(freeDeliveryHeadline()).toBe("Free delivery on $100+ orders");
    expect(localRangeLabel()).toBe("within 25 mi of Covina");
    expect(extendedFeeNote()).toBe("distance-based fees beyond");
    expect(freeDeliveryQualifier()).toBe("within 25 mi of Covina · distance-based fees beyond");
    expect(freeDeliveryPromoLine()).toBe(
      "Free delivery on $100+ orders within 25 mi of Covina · distance-based fees beyond"
    );
  });

  it("reflects configured thresholds", () => {
    const opts = {
      freeDeliveryThresholdCents: 12000,
      longDistanceThresholdMiles: 30,
      longDistanceFeeCents: 2500,
    };
    expect(freeDeliveryHeadline(opts)).toBe("Free delivery on $120+ orders");
    expect(localRangeLabel(opts)).toBe("within 30 mi of Covina");
    expect(extendedFeeNote(opts)).toBe("distance-based fees beyond");
  });

  it("formats non-round dollar amounts with cents", () => {
    expect(freeDeliveryHeadline({ freeDeliveryThresholdCents: 9950 })).toBe(
      "Free delivery on $99.50+ orders"
    );
    expect(extendedFeeNote()).toBe("distance-based fees beyond");
  });
});
