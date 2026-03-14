"use client";

import { useRef } from "react";
import { m, useMotionValue, useTransform, animate } from "framer-motion";
import { MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import { useCart } from "@/lib/hooks/useCart";
import { useFeedbackStore } from "./feedback-store";

// Snap-back threshold: if dragged less than this, treat as click
const DRAG_THRESHOLD = 5;

/**
 * Floating action button for opening the feedback sheet.
 * - Hides when feedback sheet or cart drawer is open
 * - Shifts up when CartBar is visible (cart has items)
 * - Draggable to reposition, snaps back if barely moved
 */
export function FeedbackFAB() {
  const { isOpen, open } = useFeedbackStore();
  const isCartDrawerOpen = useCartDrawer((s) => s.isOpen);
  const { itemCount } = useCart();
  const hasCartItems = itemCount > 0;

  // Drag tracking
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const dragOffset = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  // Subtle shadow increase while dragging
  const boxShadow = useTransform([x, y], ([latestX, latestY]) =>
    Math.abs(latestX as number) + Math.abs(latestY as number) > DRAG_THRESHOLD
      ? "0 8px 30px rgba(0,0,0,0.25)"
      : "0 4px 14px rgba(0,0,0,0.15)"
  );

  if (isOpen || isCartDrawerOpen) return null;

  return (
    <m.button
      type="button"
      onClick={() => {
        // Only open if we didn't drag
        if (!isDragging.current) open();
      }}
      drag
      dragMomentum={false}
      dragElastic={0.1}
      style={{ x, y, boxShadow }}
      onDragStart={() => {
        isDragging.current = false;
      }}
      onDrag={() => {
        const dx = Math.abs(x.get());
        const dy = Math.abs(y.get());
        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
          isDragging.current = true;
        }
      }}
      onDragEnd={() => {
        // Keep position where user dropped it
        dragOffset.current = { x: x.get(), y: y.get() };

        // If barely moved, snap back and treat as click
        if (!isDragging.current) {
          animate(x, 0, { type: "spring", stiffness: 300, damping: 25 });
          animate(y, 0, { type: "spring", stiffness: 300, damping: 25 });
        }
      }}
      whileTap={{ scale: 0.9 }}
      transition={spring.snappyButton}
      className={cn(
        "fixed right-6 z-30 cursor-grab active:cursor-grabbing",
        "flex h-14 w-14 items-center justify-center",
        "rounded-full bg-primary text-text-inverse",
        "hover:bg-primary/90 transition-colors duration-fast",
        // Shift up when CartBar is visible (cart has items)
        hasCartItems ? "bottom-24" : "bottom-6",
        "pb-[env(safe-area-inset-bottom,0px)]"
      )}
      aria-label="Send feedback"
    >
      <MessageSquarePlus className="h-6 w-6 pointer-events-none" />
    </m.button>
  );
}
