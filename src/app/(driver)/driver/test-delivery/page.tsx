import TestDeliveryClient from "./TestDeliveryClient";

// Practice flow — available to all drivers (Simple and Standard mode). Auth is
// enforced by the (driver) layout; no mode guard so new/occasional drivers can
// rehearse the delivery flow before a real route.
export default function TestDeliveryPage() {
  return <TestDeliveryClient />;
}
