"use client";

import { useRef, useState, useCallback } from "react";
import { m } from "framer-motion";
import { MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import { useCartStore } from "@/lib/stores/cart-store";
import { useFeedbackStore } from "./feedback-store";

/** Pixels moved before treating gesture as drag instead of tap */
const DRAG_THRESHOLD = 6;
/** Padding from viewport edges (px) */
const EDGE_PAD = 12;
/** FAB size (px) */
const FAB_SIZE = 56;

/**
 * Floating action button for opening the feedback sheet.
 * - Hides when feedback sheet or cart drawer is open
 * - Repositions above CartBar when cart has items
 * - Draggable anywhere on screen via pointer events
 */
export function FeedbackFAB() {
  const { isOpen, open } = useFeedbackStore();
  const isCartDrawerOpen = useCartDrawer((s) => s.isOpen);
  const hasCartItems = useCartStore((s) => s.items.length > 0);

  // Position state — absolute px from viewport edges
  const [pos, setPos] = useState<{ right: number; bottom: number } | null>(null);
  const dragState = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startRight: number;
    startBottom: number;
    moved: boolean;
  } | null>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  // Default bottom depends on cart state
  const defaultBottom = hasCartItems ? 120 : 24;
  const currentRight = pos?.right ?? 24;
  const currentBottom = pos?.bottom ?? defaultBottom;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragState.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        startRight: currentRight,
        startBottom: currentBottom,
        moved: false,
      };
    },
    [currentRight, currentBottom]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const ds = dragState.current;
    if (!ds?.active) return;

    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;

    if (!ds.moved && Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return;
    ds.moved = true;

    // right decreases as mouse moves right (inverted)
    const newRight = Math.max(
      EDGE_PAD,
      Math.min(window.innerWidth - FAB_SIZE - EDGE_PAD, ds.startRight - dx)
    );
    const newBottom = Math.max(
      EDGE_PAD,
      Math.min(window.innerHeight - FAB_SIZE - EDGE_PAD, ds.startBottom - dy)
    );

    setPos({ right: newRight, bottom: newBottom });
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.currentTarget.releasePointerCapture(e.pointerId);
      const ds = dragState.current;
      dragState.current = null;
      if (!ds?.moved) {
        // Defer open so the trailing click event fires (and dissipates)
        // before the sheet backdrop renders — prevents instant close
        requestAnimationFrame(() => open());
      }
    },
    [open]
  );

  if (isOpen || isCartDrawerOpen) return null;

  return (
    <m.button
      ref={fabRef}
      type="button"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.08 }}
      transition={spring.snappyButton}
      style={{
        right: currentRight,
        bottom: `calc(${currentBottom}px + env(safe-area-inset-bottom, 0px))`,
      }}
      className={cn(
        "fixed z-30 shadow-lg",
        "flex h-14 w-14 items-center justify-center",
        "rounded-full bg-primary text-text-inverse",
        "hover:bg-primary/90 transition-colors duration-fast",
        "touch-none select-none cursor-grab active:cursor-grabbing"
      )}
      aria-label="Send feedback"
    >
      <MessageSquarePlus className="h-6 w-6 pointer-events-none" />
    </m.button>
  );
}
