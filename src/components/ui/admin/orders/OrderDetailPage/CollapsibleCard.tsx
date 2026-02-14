"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CollapsibleCardProps {
  title: string;
  icon: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function CollapsibleCard({
  title,
  icon,
  defaultOpen = true,
  children,
}: CollapsibleCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-border bg-surface-primary overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center justify-between px-4 py-3",
          "text-left hover:bg-surface-secondary/50 transition-colors"
        )}
      >
        <div className="flex items-center gap-2 text-text-muted">
          {icon}
          <span className="text-xs font-body font-semibold uppercase tracking-wider">
            {title}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-text-muted transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-1">{children}</div>
      )}
    </div>
  );
}
