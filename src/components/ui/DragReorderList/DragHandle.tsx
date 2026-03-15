"use client";

import { GripVertical } from "lucide-react";
import type { SortableListeners, SortableAttributes } from "./SortableItem";

interface DragHandleProps {
  listeners?: SortableListeners;
  attributes?: SortableAttributes;
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
