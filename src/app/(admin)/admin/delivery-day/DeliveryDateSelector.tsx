"use client";

import { m } from "framer-motion";
import { cn } from "@/lib/utils/cn";

export interface DateOption {
  dateString: string;
  label: string;
}

interface DeliveryDateSelectorProps {
  options: DateOption[];
  value: string;
  onChange: (dateString: string) => void;
}

export function DeliveryDateSelector({ options, value, onChange }: DeliveryDateSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Delivery date"
      className="flex items-center gap-2 overflow-x-auto pb-1"
    >
      {options.map((opt) => {
        const isActive = opt.dateString === value;
        return (
          <button
            key={opt.dateString}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(opt.dateString)}
            className={cn(
              "relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-fast",
              "min-h-[40px] whitespace-nowrap",
              isActive
                ? "text-text-inverse"
                : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
            )}
          >
            {isActive && (
              <m.span
                layoutId="delivery-date-pill"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-full bg-accent-teal"
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
