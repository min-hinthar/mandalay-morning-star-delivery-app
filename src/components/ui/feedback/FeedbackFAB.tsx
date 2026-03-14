"use client";

import { m } from "framer-motion";
import { MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { spring } from "@/lib/motion-tokens";
import { useFeedbackStore } from "./feedback-store";

/**
 * Floating action button for opening the feedback sheet.
 * Always visible, fixed bottom-right, hides when sheet is open.
 */
export function FeedbackFAB() {
  const { isOpen, open } = useFeedbackStore();

  if (isOpen) return null;

  return (
    <m.button
      type="button"
      onClick={() => open()}
      whileTap={{ scale: 0.9 }}
      transition={spring.snappyButton}
      className={cn(
        "fixed bottom-6 right-6 z-30",
        "flex h-14 w-14 items-center justify-center",
        "rounded-full bg-primary text-text-inverse shadow-lg",
        "hover:bg-primary/90 transition-colors duration-fast",
        "pb-[env(safe-area-inset-bottom,0px)]"
      )}
      aria-label="Send feedback"
    >
      <MessageSquarePlus className="h-6 w-6" />
    </m.button>
  );
}
