import { getBusinessRules, generateTimeWindows } from "@/lib/settings";
import CheckoutClient from "./CheckoutClient";

export default async function CheckoutPage() {
  const rules = await getBusinessRules();
  const timeWindows = generateTimeWindows(rules.deliveryStartHour, rules.deliveryEndHour);

  return (
    <CheckoutClient
      timeWindows={timeWindows}
      cutoffDay={rules.cutoffDay}
      cutoffHour={rules.cutoffHour}
    />
  );
}
