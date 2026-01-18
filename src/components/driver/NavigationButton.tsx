"use client";

import { Navigation } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface NavigationButtonProps {
  latitude: number;
  longitude: number;
  address?: string;
  className?: string;
  variant?: "primary" | "secondary";
}

export function NavigationButton({
  latitude,
  longitude,
  address,
  className,
  variant = "primary",
}: NavigationButtonProps) {
  const handleNavigate = () => {
    // Build Google Maps URL with destination coordinates
    const destination = address
      ? encodeURIComponent(address)
      : `${latitude},${longitude}`;

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;

    // Open in new tab/app
    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleNavigate}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl font-semibold transition-all",
        "active:scale-[0.98]",
        variant === "primary" && [
          "h-14 bg-interactive px-6 text-text-primary",
          "hover:bg-interactive-hover",
          "shadow-md hover:shadow-lg",
        ],
        variant === "secondary" && [
          "h-12 bg-surface-tertiary px-4 text-text-primary",
          "hover:bg-surface-secondary",
        ],
        className
      )}
      data-testid="navigation-button"
    >
      <Navigation className={cn("h-5 w-5", variant === "primary" && "h-6 w-6")} />
      <span>Navigate</span>
    </button>
  );
}
