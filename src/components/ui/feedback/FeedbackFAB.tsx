"use client";

import { useRef } from "react";
import { m, useMotionValue, useTransform, animate } from "framer-motion";
import { MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useCartDrawer } from "@/lib/hooks/useCartDrawer";
import { useCartStore } from "@/lib/stores/cart-store";
import { useFeedbackStore } from "./feedback-store";

/** Drag distance (px) before treating gesture as drag instead of click */
const DRAG_THRESHOLD = 8;

/**
 * Floating action button for opening the feedback sheet.
 * - Hides when feedback sheet or cart drawer is open
 * - Shifts up when CartBar is visible (cart has items)
 * - Draggable to reposition anywhere on screen
 */
export function FeedbackFAB() {
  const { isOpen, open } = useFeedbackStore();
  const isCartDrawerOpen = useCartDrawer((s) => s.isOpen);
  // Subscribe directly to store — avoids useCart() useMemo indirection
  // which doesn't re-render reliably after async IDB hydration
  const hasCartItems = useCartStore((s) => s.items.length > 0);

  const constraintsRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Drag position — persists across renders
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Subtle shadow increase while dragging
  const boxShadow = useTransform([x, y], ([lx, ly]) =>
    Math.abs(lx as number) + Math.abs(ly as number) > DRAG_THRESHOLD
      ? "0 8px 30px rgba(0,0,0,0.25)"
      : "0 4px 14px rgba(0,0,0,0.15)"
  );

  if (isOpen || isCartDrawerOpen) return null;

  return (
    <>
      {/* Invisible full-viewport constraint box for drag bounds */}
      <div ref={constraintsRef} className="fixed inset-0 z-[-1] pointer-events-none" />

      <m.button
        type="button"
        onClick={() => {
          if (!isDragging.current) open();
        }}
        drag
        dragConstraints={constraintsRef}
        dragMomentum={false}
        dragElastic={0.05}
        style={{ x, y, boxShadow }}
        onDragStart={() => {
          isDragging.current = false;
        }}
        onDrag={() => {
          if (Math.abs(x.get()) > DRAG_THRESHOLD || Math.abs(y.get()) > DRAG_THRESHOLD) {
            isDragging.current = true;
          }
        }}
        onDragEnd={() => {
          // If barely moved, snap back to origin
          if (!isDragging.current) {
            animate(x, 0, { type: "spring", stiffness: 300, damping: 25 });
            animate(y, 0, { type: "spring", stiffness: 300, damping: 25 });
          }
          // Reset for next gesture
          setTimeout(() => {
            isDragging.current = false;
          }, 0);
        }}
        whileTap={{ scale: 0.92 }}
        transition={spring.snappyButton}
        className={cn(
          "fixed right-6 z-30",
          "flex h-14 w-14 items-center justify-center",
          "rounded-full bg-primary text-text-inverse",
          "hover:bg-primary/90 transition-colors duration-fast",
          "touch-none cursor-grab active:cursor-grabbing",
          // Clear CartBar when cart has items (~110px up from bottom)
          hasCartItems ? "bottom-[7.5rem]" : "bottom-6",
          "pb-[env(safe-area-inset-bottom,0px)]"
        )}
        aria-label="Send feedback"
      >
        <MessageSquarePlus className="h-6 w-6 pointer-events-none" />
      </m.button>
    </>
  );
}
