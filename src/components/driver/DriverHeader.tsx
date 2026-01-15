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
        "sticky top-0 z-40 flex min-h-[56px] items-center justify-between border-b bg-white/95 px-4 py-3 backdrop-blur-sm",
        className
      )}
    >
      {/* Left side - back button or spacer */}
      <div className="flex items-center gap-2">
        {showBack && (
          <button
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-charcoal/5 active:bg-charcoal/10"
            aria-label="Go back"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-charcoal">{title}</h1>
          {subtitle && (
            <p className="text-sm text-charcoal/60">{subtitle}</p>
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
