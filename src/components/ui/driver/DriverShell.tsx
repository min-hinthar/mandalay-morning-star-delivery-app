"use client";

import { useEffect } from "react";
import { OfflineBanner } from "./OfflineBanner";
import { SimpleOfflineOverlay } from "./SimpleOfflineOverlay";
import { useSimpleMode } from "./SimpleModeProvider";
import { useServiceWorker } from "@/lib/hooks/useServiceWorker";
import { useOfflineSync } from "@/lib/hooks/useOfflineSync";
import { DriverContrastProvider } from "@/app/contexts/DriverContrastContext";

interface DriverShellProps {
  children: React.ReactNode;
}

export function DriverShell({ children }: DriverShellProps) {
  const { isSimpleMode } = useSimpleMode();

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
    <DriverContrastProvider>
      {isSimpleMode ? <SimpleOfflineOverlay /> : <OfflineBanner />}
      {children}
    </DriverContrastProvider>
  );
}
