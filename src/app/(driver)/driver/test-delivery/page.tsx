import { checkSimpleMode } from "@/lib/driver/simple-mode-guard";
import TestDeliveryClient from "./TestDeliveryClient";

export default async function TestDeliveryPage() {
  await checkSimpleMode();
  return <TestDeliveryClient />;
}
