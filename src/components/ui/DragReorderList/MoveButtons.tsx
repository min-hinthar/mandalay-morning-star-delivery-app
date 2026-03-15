"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MoveButtonsProps {
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function MoveButtons({ onMoveUp, onMoveDown, isFirst, isLast }: MoveButtonsProps) {
  return (
    <div className="flex md:hidden flex-col gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onMoveUp}
        disabled={isFirst}
        aria-label="Move up"
        className="h-11 w-11"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onMoveDown}
        disabled={isLast}
        aria-label="Move down"
        className="h-11 w-11"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
