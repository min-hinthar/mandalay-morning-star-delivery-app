import { getBusinessRules } from "@/lib/settings/business-rules";
import {
  getAvailableDeliveryDatesMultiDay,
  getZonedDateString,
  parseDeliveryDateToUtc,
} from "@/lib/utils/delivery-dates";
import { TIMEZONE } from "@/types/delivery";
import { DeliveryDayHub } from "./DeliveryDayHub";
import type { DateOption } from "./DeliveryDateSelector";

export const metadata = {
  title: "Delivery Day | Morning Star",
};

const SHORT_LABEL = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: TIMEZONE,
});

export default async function DeliveryDayPage() {
  const rules = await getBusinessRules();
  const today = getZonedDateString();

  // Date options: today (live monitoring) + upcoming orderable delivery days.
  const upcoming = getAvailableDeliveryDatesMultiDay(new Date(), rules.deliveryDays, 5);
  const seen = new Set<string>();
  const options: DateOption[] = [];

  options.push({ dateString: today, label: "Today" });
  seen.add(today);

  for (const d of upcoming) {
    if (seen.has(d.dateString)) continue;
    seen.add(d.dateString);
    options.push({
      dateString: d.dateString,
      label: SHORT_LABEL.format(parseDeliveryDateToUtc(d.dateString)),
    });
  }

  return <DeliveryDayHub rules={rules} dateOptions={options} initialDate={today} />;
}
