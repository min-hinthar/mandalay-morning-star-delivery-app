import { useMemo, useState } from "react";
import type { DeliverySelection, TimeWindow } from "@/types/delivery";
import { getDeliveryDate } from "@/lib/utils/delivery-dates";

export function useTimeSlot(timeWindows: TimeWindow[]) {
  const [selectedWindow, setSelectedWindow] = useState<TimeWindow | null>(null);
  const deliveryDate = useMemo(() => getDeliveryDate(), []);

  const selection: DeliverySelection | null = selectedWindow
    ? {
        date: deliveryDate.dateString,
        windowStart: selectedWindow.start,
        windowEnd: selectedWindow.end,
      }
    : null;

  return {
    selectedWindow,
    setSelectedWindow,
    selection,
    deliveryDate,
    isValid: selectedWindow !== null,
    windows: timeWindows,
  };
}
