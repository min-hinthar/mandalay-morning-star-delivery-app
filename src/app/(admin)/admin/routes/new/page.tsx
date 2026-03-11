import type { Metadata } from "next";
import { getBusinessRules } from "@/lib/settings";
import { RouteBuilderClient } from "@/components/ui/admin/routes/RouteBuilder";

export const metadata: Metadata = {
  title: "New Route | Admin",
};

export default async function NewRoutePage() {
  const rules = await getBusinessRules();
  const activeDays = rules.deliveryDays.filter((d) => d.isActive).map((d) => d.dayOfWeek);

  return <RouteBuilderClient activeDays={activeDays} />;
}
