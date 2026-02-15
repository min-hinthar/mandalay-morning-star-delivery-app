import type { Metadata } from "next";
import { OfflinePage } from "@/components/ui/offline";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Offline - Mandalay Morning Star",
  description: "You appear to be offline. Try these cached pages while we reconnect.",
};

export default function OfflineRoute() {
  return <OfflinePage />;
}
