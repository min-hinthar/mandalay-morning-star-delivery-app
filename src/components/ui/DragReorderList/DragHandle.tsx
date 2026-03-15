"use client";

import { GripVertical } from "lucide-react";

interface DragHandleProps {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  listeners?: Record<string, Function>;
  attributes?: Record<string, unknown>;
}

export function DragHandle({ listeners, attributes }: DragHandleProps) {
  return (
    <button
      type="button"
      className="hidden md:flex items-center justify-center w-8 h-8 rounded cursor-grab active:cursor-grabbing text-text-muted hover:text-text-secondary touch-none"
      {...listeners}
      {...attributes}
      aria-label="Drag to reorder"
    >
      <GripVertical className="h-5 w-5" />
    </button>
  );
}
