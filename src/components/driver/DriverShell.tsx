"use client";

import { useEffect } from "react";
import { OfflineBanner } from "./OfflineBanner";
import { useServiceWorker } from "@/lib/hooks/useServiceWorker";
import { useOfflineSync } from "@/lib/hooks/useOfflineSync";

interface DriverShellProps {
  children: React.ReactNode;
}

export function DriverShell({ children }: DriverShellProps) {
  // Register service worker
  useServiceWorker();

  // Listen for sync requests from service worker
  const { syncNow } = useOfflineSync();

  useEffect(() => {
    const handleSyncRequest = () => {
      syncNow();
    };

    window.addEventListener("sw-sync-request", handleSyncRequest);

    return () => {
      window.removeEventListener("sw-sync-request", handleSyncRequest);
    };
  }, [syncNow]);

  return (
    <>
      <OfflineBanner />
      {children}
    </>
  );
}
