/**
 * V6 Driver Header Component - Pepper Aesthetic
 *
 * Sticky header for driver app with V6 colors and high-contrast support.
 * Features back navigation, title, and custom right content.
 */

"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface DriverHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  rightContent?: React.ReactNode;
  className?: string;
}

export function DriverHeader({
  title,
  subtitle,
  showBack = false,
  backHref,
  rightContent,
  className,
}: DriverHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex min-h-[56px] items-center justify-between border-b border-v6-border bg-v6-surface-primary/95 px-4 py-3 backdrop-blur-sm",
        className
      )}
    >
      {/* Left side - back button or spacer */}
      <div className="flex items-center gap-2">
        {showBack && (
          <button
            onClick={handleBack}
            className="flex h-12 w-12 items-center justify-center rounded-full transition-all duration-v6-fast hover:bg-v6-surface-tertiary active:bg-v6-surface-secondary"
            aria-label="Go back"
          >
            <ChevronLeft className="h-6 w-6 text-v6-text-primary" />
          </button>
        )}
        <div className="flex flex-col">
          <h1 className="font-v6-display text-lg font-semibold text-v6-text-primary">{title}</h1>
          {subtitle && (
            <p className="font-v6-body text-sm text-v6-text-secondary">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right side - custom content */}
      {rightContent && (
        <div className="flex items-center gap-2">{rightContent}</div>
      )}
    </header>
  );
}
