"use client";

import { useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

interface DragReorderListProps<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, isDragging: boolean) => ReactNode;
  renderOverlay: (item: T) => ReactNode;
  getItemId: (item: T) => string;
  disabled?: boolean;
}

export function DragReorderList<T>({
  items,
  onReorder,
  renderItem,
  renderOverlay,
  getItemId,
  disabled = false,
}: DragReorderListProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeItem = activeId ? items.find((item) => getItemId(item) === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => getItemId(item) === String(active.id));
      const newIndex = items.findIndex((item) => getItemId(item) === String(over.id));
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  }

  if (disabled) {
    return (
      <div className="space-y-4">
        {items.map((item) => (
          <div key={getItemId(item)}>{renderItem(item, false)}</div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(getItemId)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={getItemId(item)}>{renderItem(item, getItemId(item) === activeId)}</div>
          ))}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
        {activeItem ? renderOverlay(activeItem) : null}
      </DragOverlay>
    </DndContext>
  );
}
