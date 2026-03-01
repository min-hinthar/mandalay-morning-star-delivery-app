import { getBusinessRules } from "@/lib/settings/business-rules";
import { OpsCenter } from "./OpsCenter";

export const metadata = {
  title: "Ops Center | Morning Star",
};

export default async function OpsPage() {
  const rules = await getBusinessRules();
  return <OpsCenter rules={rules} />;
}
