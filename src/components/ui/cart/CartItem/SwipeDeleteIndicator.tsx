"use client";

import { m } from "framer-motion";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SwipeDeleteIndicatorProps {
  progress: number; // 0-1
}

export function SwipeDeleteIndicator({ progress }: SwipeDeleteIndicatorProps) {
  const scale = Math.min(1, progress * 1.5);
  const opacity = Math.min(1, progress * 2);

  return (
    <m.div
      className={cn(
        "absolute right-0 inset-y-0 flex items-center justify-end pr-4",
        "bg-gradient-delete",
        "rounded-r-xl pointer-events-none"
      )}
      style={{ width: `${Math.min(100, progress * 150)}%` }}
    >
      <m.div
        className={cn(
          "w-10 h-10 rounded-full bg-red-500 text-text-inverse",
          "flex items-center justify-center"
        )}
        style={{
          scale,
          opacity,
        }}
      >
        <Trash2 className="w-5 h-5" />
      </m.div>
    </m.div>
  );
}
