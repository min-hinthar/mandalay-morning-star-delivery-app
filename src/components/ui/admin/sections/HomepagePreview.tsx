"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { RefreshCw, Monitor, Smartphone, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

type DeviceMode = "desktop" | "mobile";

interface HomepagePreviewProps {
  className?: string;
}

export function HomepagePreview({ className }: HomepagePreviewProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("mobile");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    // Reset refreshing state after a short delay
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const iframeWidth = deviceMode === "mobile" ? "375px" : "100%";

  return (
    <div className={cn("flex flex-col h-full bg-surface-secondary", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-surface-primary">
        <h3 className="font-display font-semibold text-text-primary text-sm">
          Homepage Preview
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
            title="Refresh preview"
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
          </Button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-surface-tertiary transition-colors"
            title="Open homepage in new tab"
          >
            <ExternalLink className="h-4 w-4 text-text-secondary" />
          </a>
        </div>
      </div>

      {/* Preview iframe */}
      <div className="flex-1 overflow-hidden flex items-start justify-center bg-surface-tertiary/50 p-4">
        <m.div
          layout
          className={cn(
            "bg-surface-primary rounded-lg overflow-hidden shadow-md border border-border",
            "transition-all duration-300"
          )}
          style={{
            width: iframeWidth,
            maxWidth: "100%",
            height: deviceMode === "mobile" ? "667px" : "100%",
          }}
        >
          <iframe
            key={refreshKey}
            src="/?preview=true"
            className="w-full h-full border-0"
            title="Homepage Preview"
          />
        </m.div>
      </div>

      {/* Device switcher */}
      <div className="flex items-center justify-center gap-2 p-2 border-t border-border bg-surface-primary">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeviceMode("desktop")}
          className={cn(
            "h-8 px-3",
            deviceMode === "desktop" && "bg-primary/10 text-primary"
          )}
          title="Desktop view"
        >
          <Monitor className="h-4 w-4 mr-1.5" />
          <span className="text-xs">Desktop</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeviceMode("mobile")}
          className={cn(
            "h-8 px-3",
            deviceMode === "mobile" && "bg-primary/10 text-primary"
          )}
          title="Mobile view"
        >
          <Smartphone className="h-4 w-4 mr-1.5" />
          <span className="text-xs">Mobile</span>
        </Button>
      </div>
    </div>
  );
}
