"use client";

import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils/cn";

import type { DraggableAttributes } from "@dnd-kit/core";

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type SortableListeners = Record<string, Function> | undefined;
export type SortableAttributes = DraggableAttributes;

interface SortableItemProps {
  id: string;
  disabled?: boolean;
  children:
    | ReactNode
    | ((ctx: {
        listeners: SortableListeners;
        attributes: SortableAttributes;
        isDragging: boolean;
      }) => ReactNode);
}

export function SortableItem({ id, disabled = false, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const content =
    typeof children === "function" ? children({ listeners, attributes, isDragging }) : children;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "border-2 border-dashed border-border-v5 rounded-xl")}
      {...attributes}
    >
      {content}
    </div>
  );
}
